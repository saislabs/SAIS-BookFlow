-- ==============================================================================
-- SAIS BookFlow - Supabase Seed Data
-- Premium industry sample services, business opening hours, and initial blocked periods
-- ==============================================================================

-- 1. Seed Business Hours (Mon - Fri: 09:00 - 18:00, Sat: 10:00 - 16:00, Sun: Closed)
INSERT INTO public.business_hours (day_of_week, open_time, close_time, is_closed)
VALUES
    (0, '00:00:00', '00:00:00', true),   -- Sunday: Closed
    (1, '09:00:00', '18:00:00', false),  -- Monday
    (2, '09:00:00', '18:00:00', false),  -- Tuesday
    (3, '09:00:00', '18:00:00', false),  -- Wednesday
    (4, '09:00:00', '18:00:00', false),  -- Thursday
    (5, '09:00:00', '18:00:00', false),  -- Friday
    (6, '10:00:00', '16:00:00', false)   -- Saturday
ON CONFLICT (day_of_week) DO UPDATE
SET open_time = EXCLUDED.open_time,
    close_time = EXCLUDED.close_time,
    is_closed = EXCLUDED.is_closed;

-- 2. Seed Sample Services Across Supported Verticals
INSERT INTO public.services (id, name, slug, category, description, duration_minutes, price, currency, image_url, is_active)
VALUES
    (
        '11111111-1111-4111-8111-111111111111',
        'Executive Strategic Advisory',
        'executive-advisory',
        'consulting',
        'Private 1-on-1 strategy session focusing on operational scaling, digital transformation, and executive roadmapping.',
        60,
        250.00,
        'USD',
        'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80',
        true
    ),
    (
        '22222222-2222-4222-8222-222222222222',
        'Editorial & Portrait Photography',
        'editorial-portrait',
        'creative',
        'Studio or on-location bespoke portrait session including creative direction, lighting setup, and 10 retouched high-res master deliverables.',
        90,
        350.00,
        'USD',
        'https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80',
        true
    ),
    (
        '33333333-3333-4333-8333-333333333333',
        'Signature Balayage & Styling',
        'signature-balayage',
        'salon',
        'Hand-painted dimensional color treatment, custom gloss toner, moisture mask infusion, and tailored blowout finish.',
        120,
        220.00,
        'USD',
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80',
        true
    ),
    (
        '44444444-4444-4444-8444-444444444444',
        'Advanced STEM & SAT Mathematics Coaching',
        'stem-sat-coaching',
        'tutoring',
        'Targeted diagnostic assessment, problem-solving mastery, and personalized curriculum acceleration with master instructors.',
        60,
        110.00,
        'USD',
        'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80',
        true
    ),
    (
        '55555555-5555-4555-8555-555555555555',
        'Luxury Wedding & Gala Consultation',
        'luxury-wedding-consultation',
        'events',
        'Comprehensive timeline architecture, venue aesthetic planning, vendor curation, and spatial design alignment.',
        90,
        300.00,
        'USD',
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80',
        true
    ),
    (
        '66666666-6666-4666-8666-666666666666',
        'Rapid Brand Identity Review',
        'brand-identity-review',
        'consulting',
        'Focused 45-minute audit of visual identity, brand positioning, and digital conversion funnels with actionable critique.',
        45,
        150.00,
        'USD',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        true
    )
ON CONFLICT (id) DO NOTHING;
