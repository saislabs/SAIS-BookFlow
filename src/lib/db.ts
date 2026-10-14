import { bookingStore } from "./store";
import { createAdminClient } from "./supabase/admin";
import {
  Booking,
  BookingStatus,
  BusinessHours,
  BlockedPeriod,
  Service,
  AvailabilityResponse,
  BookingEvent,
} from "./types";

/**
 * Unified Database Layer
 * Automatically leverages Supabase PostgreSQL when credentials are configured,
 * or the in-memory transactional store with exclusion locks during development,
 * testing, and demonstration mode.
 */
class DatabaseService {
  private isSupabaseConfigured(): boolean {
    return Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    );
  }

  // --- Services ---
  async getServices(): Promise<Service[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("services")
            .select("*")
            .order("created_at", { ascending: true });
          if (!error && data && data.length > 0) return data as Service[];
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to local store:", err);
      }
    }
    return bookingStore.getServices();
  }

  async getActiveServices(): Promise<Service[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("services")
            .select("*")
            .eq("is_active", true)
            .order("created_at", { ascending: true });
          if (!error && data && data.length > 0) return data as Service[];
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to local store:", err);
      }
    }
    return bookingStore.getActiveServices();
  }

  async getServiceById(id: string): Promise<Service | undefined> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("services")
            .select("*")
            .eq("id", id)
            .single();
          if (!error && data) return data as Service;
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to local store:", err);
      }
    }
    return bookingStore.getServiceById(id);
  }

  async createService(data: Omit<Service, "id" | "created_at" | "updated_at">): Promise<Service> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data: created, error } = await supabase
            .from("services")
            .insert(data)
            .select()
            .single();
          if (!error && created) return created as Service;
        }
      } catch (err) {
        console.warn("Supabase create failed, falling back to local store:", err);
      }
    }
    return bookingStore.createService(data);
  }

  async updateService(
    id: string,
    data: Partial<Omit<Service, "id" | "created_at">>
  ): Promise<Service | null> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data: updated, error } = await supabase
            .from("services")
            .update(data)
            .eq("id", id)
            .select()
            .single();
          if (!error && updated) return updated as Service;
        }
      } catch (err) {
        console.warn("Supabase update failed, falling back to local store:", err);
      }
    }
    return bookingStore.updateService(id, data);
  }

  async deleteService(id: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { error } = await supabase.from("services").delete().eq("id", id);
          if (!error) return true;
        }
      } catch (err) {
        console.warn("Supabase delete failed, falling back to local store:", err);
      }
    }
    return bookingStore.deleteService(id);
  }

  // --- Business Hours & Blocked Periods ---
  async getBusinessHours(): Promise<BusinessHours[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("business_hours")
            .select("*")
            .order("day_of_week", { ascending: true });
          if (!error && data && data.length > 0) return data as BusinessHours[];
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to local store:", err);
      }
    }
    return bookingStore.getBusinessHours();
  }

  async updateBusinessHours(hours: BusinessHours[]): Promise<BusinessHours[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("business_hours")
            .upsert(hours, { onConflict: "day_of_week" })
            .select();
          if (!error && data) return data as BusinessHours[];
        }
      } catch (err) {
        console.warn("Supabase update failed, falling back to local store:", err);
      }
    }
    return bookingStore.updateBusinessHours(hours);
  }

  async getBlockedPeriods(): Promise<BlockedPeriod[]> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("blocked_periods")
            .select("*")
            .order("start_time", { ascending: true });
          if (!error && data) return data as BlockedPeriod[];
        }
      } catch (err) {
        console.warn("Supabase fetch failed, falling back to local store:", err);
      }
    }
    return bookingStore.getBlockedPeriods();
  }

  async addBlockedPeriod(
    period: Omit<BlockedPeriod, "id" | "created_at">
  ): Promise<BlockedPeriod> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { data, error } = await supabase
            .from("blocked_periods")
            .insert(period)
            .select()
            .single();
          if (!error && data) return data as BlockedPeriod;
        }
      } catch (err) {
        console.warn("Supabase insert failed, falling back to local store:", err);
      }
    }
    return bookingStore.addBlockedPeriod(period);
  }

  async deleteBlockedPeriod(id: string): Promise<boolean> {
    if (this.isSupabaseConfigured()) {
      try {
        const supabase = createAdminClient();
        if (supabase) {
          const { error } = await supabase.from("blocked_periods").delete().eq("id", id);
          if (!error) return true;
        }
      } catch (err) {
        console.warn("Supabase delete failed, falling back to local store:", err);
      }
    }
    return bookingStore.deleteBlockedPeriod(id);
  }

  // --- Availability ---
  async getAvailability(serviceId: string, dateStr: string): Promise<AvailabilityResponse> {
    return bookingStore.calculateAvailability(serviceId, dateStr);
  }

  // --- Bookings ---
  async createBooking(data: {
    service_id: string;
    start_time: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_notes?: string;
  }): Promise<{ booking: Booking }> {
    return bookingStore.createBooking(data);
  }

  async rescheduleBooking(
    id: string,
    newStartTimeStr: string,
    reason?: string
  ): Promise<Booking> {
    return bookingStore.rescheduleBooking(id, newStartTimeStr, reason);
  }

  async updateBookingStatus(
    id: string,
    newStatus: BookingStatus,
    note?: string
  ): Promise<Booking> {
    return bookingStore.updateBookingStatus(id, newStatus, note);
  }

  async getBookings(filters?: {
    status?: BookingStatus;
    search?: string;
  }): Promise<Booking[]> {
    return bookingStore.getBookings(filters);
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    return bookingStore.getBookingById(id);
  }

  async getBookingByReference(ref: string): Promise<Booking | undefined> {
    return bookingStore.getBookingByReference(ref);
  }

  async getBookingEvents(bookingId: string): Promise<BookingEvent[]> {
    return bookingStore.getBookingEvents(bookingId);
  }
}

export const db = new DatabaseService();
