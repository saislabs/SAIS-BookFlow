export type BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Rejected"
  | "Cancelled"
  | "Completed";

export interface Service {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  duration_minutes: number;
  price: number;
  currency: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface BusinessHours {
  id: string;
  day_of_week: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  open_time: string; // "09:00"
  close_time: string; // "18:00"
  is_closed: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BlockedPeriod {
  id: string;
  start_time: string; // ISO 8601 UTC
  end_time: string; // ISO 8601 UTC
  reason: string;
  created_at?: string;
}

export interface Booking {
  id: string;
  booking_reference: string; // e.g. "BF-9X2L8M"
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_notes?: string | null;
  start_time: string; // ISO 8601 UTC
  end_time: string; // ISO 8601 UTC
  status: BookingStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
  service?: Service;
}

export interface BookingEvent {
  id: string;
  booking_id: string;
  event_type: "created" | "status_changed" | "rescheduled" | "cancelled";
  previous_status?: BookingStatus | null;
  new_status?: BookingStatus | null;
  note?: string | null;
  created_at: string;
}

export interface TimeSlot {
  start_time: string; // ISO 8601 UTC
  end_time: string; // ISO 8601 UTC
  display_time: string; // e.g. "09:00 AM" in business timezone
  available: boolean;
  conflict_reason?: string;
}

export interface AvailabilityResponse {
  date: string;
  timezone: string;
  service_id: string;
  is_closed: boolean;
  slots: TimeSlot[];
  day_of_week: number;
  open_time?: string;
  close_time?: string;
}
