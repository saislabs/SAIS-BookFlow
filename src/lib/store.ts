import {
  Booking,
  BookingEvent,
  BookingStatus,
  BusinessHours,
  BlockedPeriod,
  Service,
  TimeSlot,
  AvailabilityResponse,
} from "./types";
import { BUSINESS_CONFIG } from "@/config/business";
import { generateBookingReference } from "./utils";
import { parseISO, addMinutes, format, isBefore, isAfter, areIntervalsOverlapping } from "date-fns";

// Seed services
const INITIAL_SERVICES: Service[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Executive Strategic Advisory",
    slug: "executive-advisory",
    category: "consulting",
    description:
      "Private 1-on-1 strategy session focusing on operational scaling, digital transformation, and executive roadmapping.",
    duration_minutes: 60,
    price: 250,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Editorial & Portrait Photography",
    slug: "editorial-portrait",
    category: "creative",
    description:
      "Studio or on-location bespoke portrait session including creative direction, lighting setup, and 10 retouched high-res deliverables.",
    duration_minutes: 90,
    price: 350,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Signature Balayage & Styling",
    slug: "signature-balayage",
    category: "salon",
    description:
      "Hand-painted dimensional color treatment, custom gloss toner, moisture mask infusion, and tailored blowout finish.",
    duration_minutes: 120,
    price: 220,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Advanced STEM & SAT Mathematics Coaching",
    slug: "stem-sat-coaching",
    category: "tutoring",
    description:
      "Targeted diagnostic assessment, problem-solving mastery, and personalized curriculum acceleration with master instructors.",
    duration_minutes: 60,
    price: 110,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Luxury Wedding & Gala Consultation",
    slug: "luxury-wedding-consultation",
    category: "events",
    description:
      "Comprehensive timeline architecture, venue aesthetic planning, vendor curation, and spatial design alignment.",
    duration_minutes: 90,
    price: 300,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Rapid Brand Identity Review",
    slug: "brand-identity-review",
    category: "consulting",
    description:
      "Focused 45-minute audit of visual identity, brand positioning, and digital conversion funnels with actionable critique.",
    duration_minutes: 45,
    price: 150,
    currency: "USD",
    image_url:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    is_active: true,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_HOURS: BusinessHours[] = [
  { id: "h-0", day_of_week: 0, open_time: "00:00", close_time: "00:00", is_closed: true }, // Sunday closed
  { id: "h-1", day_of_week: 1, open_time: "09:00", close_time: "18:00", is_closed: false },
  { id: "h-2", day_of_week: 2, open_time: "09:00", close_time: "18:00", is_closed: false },
  { id: "h-3", day_of_week: 3, open_time: "09:00", close_time: "18:00", is_closed: false },
  { id: "h-4", day_of_week: 4, open_time: "09:00", close_time: "18:00", is_closed: false },
  { id: "h-5", day_of_week: 5, open_time: "09:00", close_time: "18:00", is_closed: false },
  { id: "h-6", day_of_week: 6, open_time: "10:00", close_time: "16:00", is_closed: false }, // Saturday
];

const INITIAL_BLOCKED: BlockedPeriod[] = [
  {
    id: "b-1",
    start_time: "2026-11-26T00:00:00.000Z",
    end_time: "2026-11-26T23:59:59.000Z",
    reason: "Thanksgiving Holiday Observed",
    created_at: new Date().toISOString(),
  },
];

/**
 * Concurrency Mutex Lock
 * Ensures atomic serialization of slot checking and reservation
 */
class AsyncMutex {
  private mutex = Promise.resolve();

  async runExclusive<T>(callback: () => Promise<T> | T): Promise<T> {
    let release: () => void = () => {};
    const nextPromise = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentMutex = this.mutex;
    this.mutex = this.mutex.then(() => nextPromise);

    await currentMutex;
    try {
      return await callback();
    } finally {
      release();
    }
  }
}

class InMemoryBookingStore {
  private services: Service[] = [...INITIAL_SERVICES];
  private businessHours: BusinessHours[] = [...INITIAL_HOURS];
  private blockedPeriods: BlockedPeriod[] = [...INITIAL_BLOCKED];
  private bookings: Booking[] = [];
  private bookingEvents: BookingEvent[] = [];
  private mutex = new AsyncMutex();

  constructor() {
    this.seedDemoBookings();
  }

  private seedDemoBookings() {
    // Add sample bookings for demonstration
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    const slot1Start = `${dateStr}T14:00:00.000Z`;
    const slot1End = `${dateStr}T15:00:00.000Z`;

    const demoBooking: Booking = {
      id: "demo-bk-1",
      booking_reference: "BF-7K9M2P",
      service_id: INITIAL_SERVICES[0].id,
      customer_name: "Elena Rostova",
      customer_email: "elena.rostova@example.com",
      customer_phone: "+1 212-555-0199",
      customer_notes: "Focusing on Series B operations and go-to-market plan.",
      start_time: slot1Start,
      end_time: slot1End,
      status: "Confirmed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      service: INITIAL_SERVICES[0],
    };

    this.bookings.push(demoBooking);
    this.bookingEvents.push({
      id: "demo-ev-1",
      booking_id: demoBooking.id,
      event_type: "created",
      previous_status: null,
      new_status: "Pending",
      note: "Booking request created via web portal.",
      created_at: demoBooking.created_at,
    });
    this.bookingEvents.push({
      id: "demo-ev-2",
      booking_id: demoBooking.id,
      event_type: "status_changed",
      previous_status: "Pending",
      new_status: "Confirmed",
      note: "Confirmed by administrator.",
      created_at: demoBooking.created_at,
    });
  }

  // --- Services ---
  getServices(): Service[] {
    return [...this.services];
  }

  getActiveServices(): Service[] {
    return this.services.filter((s) => s.is_active);
  }

  getServiceById(id: string): Service | undefined {
    return this.services.find((s) => s.id === id);
  }

  getServiceBySlug(slug: string): Service | undefined {
    return this.services.find((s) => s.slug === slug);
  }

  createService(data: Omit<Service, "id" | "created_at" | "updated_at">): Service {
    const newService: Service = {
      ...data,
      id: `svc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.services.push(newService);
    return newService;
  }

  updateService(id: string, data: Partial<Omit<Service, "id" | "created_at">>): Service | null {
    const index = this.services.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.services[index] = {
      ...this.services[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.services[index];
  }

  deleteService(id: string): boolean {
    const initialLen = this.services.length;
    this.services = this.services.filter((s) => s.id !== id);
    return this.services.length < initialLen;
  }

  // --- Business Hours & Blocked Periods ---
  getBusinessHours(): BusinessHours[] {
    return [...this.businessHours].sort((a, b) => a.day_of_week - b.day_of_week);
  }

  updateBusinessHours(hours: BusinessHours[]): BusinessHours[] {
    this.businessHours = [...hours];
    return this.getBusinessHours();
  }

  getBlockedPeriods(): BlockedPeriod[] {
    return [...this.blockedPeriods];
  }

  addBlockedPeriod(period: Omit<BlockedPeriod, "id" | "created_at">): BlockedPeriod {
    const newPeriod: BlockedPeriod = {
      ...period,
      id: `blk-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    this.blockedPeriods.push(newPeriod);
    return newPeriod;
  }

  deleteBlockedPeriod(id: string): boolean {
    const initial = this.blockedPeriods.length;
    this.blockedPeriods = this.blockedPeriods.filter((b) => b.id !== id);
    return this.blockedPeriods.length < initial;
  }

  // --- Availability Calculation ---
  calculateAvailability(serviceId: string, dateStr: string): AvailabilityResponse {
    const service = this.getServiceById(serviceId);
    if (!service) {
      throw new Error(`Service not found: ${serviceId}`);
    }

    // Parse date (YYYY-MM-DD)
    const [year, month, day] = dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(year, month - 1, day));
    const dayOfWeek = dateObj.getUTCDay();

    const hoursConfig = this.businessHours.find((h) => h.day_of_week === dayOfWeek);
    if (!hoursConfig || hoursConfig.is_closed) {
      return {
        date: dateStr,
        timezone: BUSINESS_CONFIG.timezone,
        service_id: serviceId,
        is_closed: true,
        day_of_week: dayOfWeek,
        slots: [],
      };
    }

    const [openH, openM] = hoursConfig.open_time.split(":").map(Number);
    const [closeH, closeM] = hoursConfig.close_time.split(":").map(Number);

    const openDateTime = new Date(Date.UTC(year, month - 1, day, openH, openM, 0));
    const closeDateTime = new Date(Date.UTC(year, month - 1, day, closeH, closeM, 0));

    const duration = service.duration_minutes;
    const interval = BUSINESS_CONFIG.slotIntervalMinutes;
    const now = new Date();

    const activeBookings = this.bookings.filter(
      (b) => b.status === "Pending" || b.status === "Confirmed"
    );

    const slots: TimeSlot[] = [];
    let currentSlotStart = new Date(openDateTime);

    while (true) {
      const currentSlotEnd = addMinutes(currentSlotStart, duration);

      // Slot must finish by closing time
      if (isAfter(currentSlotEnd, closeDateTime)) {
        break;
      }

      // Check if slot is in the past (with lead time)
      const minBookingTime = addMinutes(now, BUSINESS_CONFIG.leadTimeHours * 60);
      const isPast = isBefore(currentSlotStart, minBookingTime);

      let available = !isPast;
      let conflict_reason: string | undefined = isPast
        ? "Too close to start time or in the past"
        : undefined;

      // Check against blocked periods
      if (available) {
        for (const blocked of this.blockedPeriods) {
          const bStart = parseISO(blocked.start_time);
          const bEnd = parseISO(blocked.end_time);
          if (
            areIntervalsOverlapping(
              { start: currentSlotStart, end: currentSlotEnd },
              { start: bStart, end: bEnd }
            )
          ) {
            available = false;
            conflict_reason = `Blocked: ${blocked.reason}`;
            break;
          }
        }
      }

      // Check against existing active bookings
      if (available) {
        for (const booking of activeBookings) {
          const bStart = parseISO(booking.start_time);
          const bEnd = parseISO(booking.end_time);
          if (
            areIntervalsOverlapping(
              { start: currentSlotStart, end: currentSlotEnd },
              { start: bStart, end: bEnd }
            )
          ) {
            available = false;
            conflict_reason = "Already booked";
            break;
          }
        }
      }

      const hoursNum = currentSlotStart.getUTCHours();
      const minsNum = currentSlotStart.getUTCMinutes();
      const ampm = hoursNum >= 12 ? "PM" : "AM";
      const displayHours = hoursNum % 12 || 12;
      const displayMins = minsNum < 10 ? `0${minsNum}` : minsNum;
      const displayTime = `${displayHours}:${displayMins} ${ampm}`;

      slots.push({
        start_time: currentSlotStart.toISOString(),
        end_time: currentSlotEnd.toISOString(),
        display_time: displayTime,
        available,
        conflict_reason,
      });

      // Step to next interval
      currentSlotStart = addMinutes(currentSlotStart, interval);
    }

    return {
      date: dateStr,
      timezone: BUSINESS_CONFIG.timezone,
      service_id: serviceId,
      is_closed: false,
      day_of_week: dayOfWeek,
      open_time: hoursConfig.open_time,
      close_time: hoursConfig.close_time,
      slots,
    };
  }

  // --- Atomic Concurrency Booking Creation ---
  async createBooking(data: {
    service_id: string;
    start_time: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    customer_notes?: string;
  }): Promise<{ booking: Booking }> {
    return this.mutex.runExclusive(async () => {
      const service = this.getServiceById(data.service_id);
      if (!service) {
        throw new Error("Invalid service: Selected service does not exist.");
      }
      if (!service.is_active) {
        throw new Error("Service is currently inactive and cannot be booked.");
      }

      const reqStart = parseISO(data.start_time);
      if (isNaN(reqStart.getTime())) {
        throw new Error("Invalid start time format.");
      }

      const reqEnd = addMinutes(reqStart, service.duration_minutes);
      const now = new Date();

      if (isBefore(reqStart, now)) {
        throw new Error("Cannot book an appointment in the past.");
      }

      // Check business hours
      const dayOfWeek = reqStart.getUTCDay();
      const hours = this.businessHours.find((h) => h.day_of_week === dayOfWeek);
      if (!hours || hours.is_closed) {
        throw new Error("The business is closed on the selected day.");
      }

      const [openH, openM] = hours.open_time.split(":").map(Number);
      const [closeH, closeM] = hours.close_time.split(":").map(Number);

      const dayOpen = new Date(reqStart);
      dayOpen.setUTCHours(openH, openM, 0, 0);

      const dayClose = new Date(reqStart);
      dayClose.setUTCHours(closeH, closeM, 0, 0);

      if (isBefore(reqStart, dayOpen) || isAfter(reqEnd, dayClose)) {
        throw new Error("The requested appointment falls outside operating hours.");
      }

      // Check blocked periods
      for (const blocked of this.blockedPeriods) {
        const bStart = parseISO(blocked.start_time);
        const bEnd = parseISO(blocked.end_time);
        if (
          areIntervalsOverlapping(
            { start: reqStart, end: reqEnd },
            { start: bStart, end: bEnd }
          )
        ) {
          throw new Error(`This time slot is blocked: ${blocked.reason}`);
        }
      }

      // CONCURRENCY & EXCLUSION CHECK
      // Check for any active overlapping booking (Pending or Confirmed)
      const conflictingBooking = this.bookings.find((existing) => {
        if (existing.status !== "Pending" && existing.status !== "Confirmed") {
          return false;
        }
        const exStart = parseISO(existing.start_time);
        const exEnd = parseISO(existing.end_time);
        return areIntervalsOverlapping(
          { start: reqStart, end: reqEnd },
          { start: exStart, end: exEnd }
        );
      });

      if (conflictingBooking) {
        const err = new Error("CONCURRENCY_CONFLICT: The selected time slot is no longer available.");
        (err as any).code = "SLOT_CONFLICT";
        throw err;
      }

      // Create Booking with unique reference
      const bookingId = `bk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newBooking: Booking = {
        id: bookingId,
        booking_reference: generateBookingReference(),
        service_id: service.id,
        customer_name: data.customer_name.trim(),
        customer_email: data.customer_email.trim().toLowerCase(),
        customer_phone: data.customer_phone.trim(),
        customer_notes: data.customer_notes?.trim() || null,
        start_time: reqStart.toISOString(),
        end_time: reqEnd.toISOString(),
        status: "Pending", // Strict rule: must not be confirmed until actual status is confirmed
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        service,
      };

      this.bookings.unshift(newBooking);

      // Audit Event Log
      this.bookingEvents.push({
        id: `ev-${Date.now()}`,
        booking_id: newBooking.id,
        event_type: "created",
        previous_status: null,
        new_status: "Pending",
        note: "Booking request submitted by client.",
        created_at: newBooking.created_at,
      });

      return { booking: newBooking };
    });
  }

  // --- Reschedule with Atomic Concurrency Check ---
  async rescheduleBooking(id: string, newStartTimeStr: string, reason?: string): Promise<Booking> {
    return this.mutex.runExclusive(async () => {
      const booking = this.bookings.find((b) => b.id === id);
      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status === "Cancelled" || booking.status === "Rejected") {
        throw new Error(`Cannot reschedule a ${booking.status.toLowerCase()} booking.`);
      }

      const service = this.getServiceById(booking.service_id);
      if (!service) {
        throw new Error("Associated service not found");
      }

      const newStart = parseISO(newStartTimeStr);
      if (isNaN(newStart.getTime())) {
        throw new Error("Invalid new start time format.");
      }

      const newEnd = addMinutes(newStart, service.duration_minutes);

      // Check operating hours
      const dayOfWeek = newStart.getUTCDay();
      const hours = this.businessHours.find((h) => h.day_of_week === dayOfWeek);
      if (!hours || hours.is_closed) {
        throw new Error("Business is closed on the requested date.");
      }

      const [openH, openM] = hours.open_time.split(":").map(Number);
      const [closeH, closeM] = hours.close_time.split(":").map(Number);

      const dayOpen = new Date(newStart);
      dayOpen.setUTCHours(openH, openM, 0, 0);

      const dayClose = new Date(newStart);
      dayClose.setUTCHours(closeH, closeM, 0, 0);

      if (isBefore(newStart, dayOpen) || isAfter(newEnd, dayClose)) {
        throw new Error("The requested reschedule slot falls outside operating hours.");
      }

      // Check blocked periods
      for (const blocked of this.blockedPeriods) {
        const bStart = parseISO(blocked.start_time);
        const bEnd = parseISO(blocked.end_time);
        if (
          areIntervalsOverlapping(
            { start: newStart, end: newEnd },
            { start: bStart, end: bEnd }
          )
        ) {
          throw new Error(`The target slot is blocked: ${blocked.reason}`);
        }
      }

      // Check conflicting active bookings (excluding itself)
      const conflict = this.bookings.find((other) => {
        if (other.id === booking.id) return false;
        if (other.status !== "Pending" && other.status !== "Confirmed") return false;
        const oStart = parseISO(other.start_time);
        const oEnd = parseISO(other.end_time);
        return areIntervalsOverlapping(
          { start: newStart, end: newEnd },
          { start: oStart, end: oEnd }
        );
      });

      if (conflict) {
        const err = new Error("CONCURRENCY_CONFLICT: The target reschedule slot is already occupied.");
        (err as any).code = "SLOT_CONFLICT";
        throw err;
      }

      const oldStartTime = booking.start_time;
      booking.start_time = newStart.toISOString();
      booking.end_time = newEnd.toISOString();
      booking.updated_at = new Date().toISOString();

      // Log reschedule event
      this.bookingEvents.push({
        id: `ev-${Date.now()}`,
        booking_id: booking.id,
        event_type: "rescheduled",
        previous_status: booking.status,
        new_status: booking.status,
        note: `Rescheduled from ${oldStartTime} to ${booking.start_time}.${reason ? ` Reason: ${reason}` : ""}`,
        created_at: new Date().toISOString(),
      });

      return booking;
    });
  }

  // --- Update Status ---
  updateBookingStatus(id: string, newStatus: BookingStatus, note?: string): Booking {
    const booking = this.bookings.find((b) => b.id === id);
    if (!booking) {
      throw new Error("Booking not found");
    }

    const previousStatus = booking.status;
    booking.status = newStatus;
    booking.updated_at = new Date().toISOString();

    this.bookingEvents.push({
      id: `ev-${Date.now()}`,
      booking_id: booking.id,
      event_type: newStatus === "Cancelled" ? "cancelled" : "status_changed",
      previous_status: previousStatus,
      new_status: newStatus,
      note: note || `Status updated to ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    return booking;
  }

  // --- Query Bookings ---
  getBookings(filters?: { status?: BookingStatus; search?: string }): Booking[] {
    let list = [...this.bookings];

    if (filters?.status) {
      list = list.filter((b) => b.status === filters.status);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (b) =>
          b.booking_reference.toLowerCase().includes(q) ||
          b.customer_name.toLowerCase().includes(q) ||
          b.customer_email.toLowerCase().includes(q) ||
          (b.service?.name && b.service.name.toLowerCase().includes(q))
      );
    }

    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getBookingById(id: string): Booking | undefined {
    return this.bookings.find((b) => b.id === id);
  }

  getBookingByReference(reference: string): Booking | undefined {
    return this.bookings.find(
      (b) => b.booking_reference.trim().toUpperCase() === reference.trim().toUpperCase()
    );
  }

  getBookingEvents(bookingId: string): BookingEvent[] {
    return this.bookingEvents
      .filter((e) => e.booking_id === bookingId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  // Reset helper for tests
  reset() {
    this.services = [...INITIAL_SERVICES];
    this.businessHours = [...INITIAL_HOURS];
    this.blockedPeriods = [...INITIAL_BLOCKED];
    this.bookings = [];
    this.bookingEvents = [];
    this.seedDemoBookings();
  }
}

// Global Singleton Store for Node.js App runtime & test execution
declare global {
  // eslint-disable-next-line no-var
  var __bookflow_store__: InMemoryBookingStore | undefined;
}

export const bookingStore: InMemoryBookingStore =
  globalThis.__bookflow_store__ || (globalThis.__bookflow_store__ = new InMemoryBookingStore());
