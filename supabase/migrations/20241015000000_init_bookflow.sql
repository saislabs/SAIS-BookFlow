-- ==============================================================================
-- SAIS BookFlow - Supabase PostgreSQL Schema & Migrations
-- Production-ready appointment scheduling schema with concurrency exclusion
-- constraints, Row Level Security (RLS), audit event triggers, and atomic functions.
-- ==============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- 2. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    category TEXT NOT NULL DEFAULT 'consulting',
    description TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    image_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);

-- 3. Business Hours Table (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_of_week SMALLINT NOT NULL UNIQUE CHECK (day_of_week BETWEEN 0 AND 6),
    open_time TIME NOT NULL DEFAULT '09:00:00',
    close_time TIME NOT NULL DEFAULT '18:00:00',
    is_closed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Blocked Periods Table (Blackouts, holidays, maintenance)
CREATE TABLE IF NOT EXISTS public.blocked_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_blocked_period_order CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_blocked_periods_time ON public.blocked_periods USING gist (tstzrange(start_time, end_time));

-- 5. Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_reference VARCHAR(32) UNIQUE NOT NULL,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_notes TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Rejected', 'Cancelled', 'Completed')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT check_booking_time_order CHECK (end_time > start_time),
    -- PostgreSQL Exclusion Constraint: Guarantees zero overlapping active bookings at the database engine level
    CONSTRAINT no_overlapping_active_bookings EXCLUDE USING gist (
        tstzrange(start_time, end_time) WITH &&
    ) WHERE (status IN ('Pending', 'Confirmed'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_service ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_timerange ON public.bookings(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_bookings_email ON public.bookings(customer_email);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(booking_reference);

-- 6. Booking Events Table (Audit log for compliance and timeline)
CREATE TABLE IF NOT EXISTS public.booking_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('created', 'status_changed', 'rescheduled', 'cancelled')),
    previous_status TEXT,
    new_status TEXT,
    note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_events_booking_id ON public.booking_events(booking_id);

-- 7. Automated Timestamps Trigger Function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_services_updated_at ON public.services;
CREATE TRIGGER trigger_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_business_hours_updated_at ON public.business_hours;
CREATE TRIGGER trigger_business_hours_updated_at
BEFORE UPDATE ON public.business_hours
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trigger_bookings_updated_at ON public.bookings;
CREATE TRIGGER trigger_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 8. Automated Booking Event Audit Logger
CREATE OR REPLACE FUNCTION public.log_booking_event()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO public.booking_events (booking_id, event_type, previous_status, new_status, note)
        VALUES (NEW.id, 'created', NULL, NEW.status, 'Booking initial request created.');
    ELSIF (TG_OP = 'UPDATE') THEN
        IF (OLD.start_time <> NEW.start_time OR OLD.end_time <> NEW.end_time) THEN
            INSERT INTO public.booking_events (booking_id, event_type, previous_status, new_status, note)
            VALUES (NEW.id, 'rescheduled', OLD.status, NEW.status, format('Rescheduled from %s to %s', OLD.start_time, NEW.start_time));
        ELSIF (OLD.status <> NEW.status) THEN
            INSERT INTO public.booking_events (booking_id, event_type, previous_status, new_status, note)
            VALUES (NEW.id, 'status_changed', OLD.status, NEW.status, format('Status updated from %s to %s', OLD.status, NEW.status));
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_log_booking_event ON public.bookings;
CREATE TRIGGER trigger_log_booking_event
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW EXECUTE FUNCTION public.log_booking_event();

-- 9. Row Level Security (RLS) Configuration
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

-- Services RLS: Public can view active services, authenticated admins can manage
CREATE POLICY "Public read active services"
    ON public.services FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admin manage services"
    ON public.services FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Business Hours RLS: Public read, admin manage
CREATE POLICY "Public read business hours"
    ON public.business_hours FOR SELECT
    USING (true);

CREATE POLICY "Admin manage business hours"
    ON public.business_hours FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Blocked Periods RLS: Public read (for schedule availability), admin manage
CREATE POLICY "Public read blocked periods"
    ON public.blocked_periods FOR SELECT
    USING (true);

CREATE POLICY "Admin manage blocked periods"
    ON public.blocked_periods FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Bookings RLS:
-- Public can insert new pending requests
CREATE POLICY "Public insert booking"
    ON public.bookings FOR INSERT
    WITH CHECK (status = 'Pending');

-- Public can ONLY view their own booking if they know the exact reference
CREATE POLICY "Public view own booking by reference"
    ON public.bookings FOR SELECT
    USING (booking_reference = current_setting('request.headers', true)::json->>'x-booking-ref');

-- Authenticated admins can view and manage all bookings
CREATE POLICY "Admin full access bookings"
    ON public.bookings FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Booking Events RLS: Authenticated admin only
CREATE POLICY "Admin view booking events"
    ON public.booking_events FOR SELECT
    TO authenticated
    USING (true);
