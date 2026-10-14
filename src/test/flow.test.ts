import { describe, it, expect, beforeEach } from "vitest";
import { bookingStore } from "@/lib/store";

describe("Customer Booking Flow & Availability Calculation Tests", () => {
  beforeEach(() => {
    bookingStore.reset();
  });

  const getFutureWednesdayDateStr = () => {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = (10 - day) % 7 || 7;
    d.setUTCDate(d.getUTCDate() + diff);
    return d.toISOString().split("T")[0];
  };

  it("1. Complete customer booking flow from catalog to reference lookup", async () => {
    // 1. Browse services
    const services = bookingStore.getActiveServices();
    expect(services.length).toBeGreaterThan(0);
    const service = services[0];

    // 2. Query available slots for a future business day
    const dateStr = getFutureWednesdayDateStr();
    const availability = bookingStore.calculateAvailability(service.id, dateStr);

    expect(availability.is_closed).toBe(false);
    expect(availability.slots.length).toBeGreaterThan(0);

    // Pick an available slot
    const availableSlot = availability.slots.find((s) => s.available);
    expect(availableSlot).toBeDefined();

    // 3. Submit booking request
    const { booking } = await bookingStore.createBooking({
      service_id: service.id,
      start_time: availableSlot!.start_time,
      customer_name: "Sophia Loren",
      customer_email: "sophia@cinema.it",
      customer_phone: "+39 06 698 12345",
      customer_notes: "Special lighting setup requested.",
    });

    expect(booking.booking_reference).toMatch(/^BF-[A-Z0-9]{6}$/);
    expect(booking.status).toBe("Pending");

    // 4. Customer verifies reference in status lookup
    const lookup = bookingStore.getBookingByReference(booking.booking_reference);
    expect(lookup).toBeDefined();
    expect(lookup?.id).toBe(booking.id);
    expect(lookup?.customer_name).toBe("Sophia Loren");

    // 5. Check that the booked slot is now marked unavailable
    const recheckAvailability = bookingStore.calculateAvailability(service.id, dateStr);
    const updatedSlot = recheckAvailability.slots.find(
      (s) => s.start_time === availableSlot!.start_time
    );
    expect(updatedSlot?.available).toBe(false);
    expect(updatedSlot?.conflict_reason).toMatch(/Already booked/i);
  });

  it("2. Blackout dates / blocked periods properly disable all overlapping slots", () => {
    const service = bookingStore.getActiveServices()[0];
    const dateStr = getFutureWednesdayDateStr();

    // Add a blocked period for morning hours: 09:00 to 12:00
    bookingStore.addBlockedPeriod({
      start_time: `${dateStr}T09:00:00.000Z`,
      end_time: `${dateStr}T12:00:00.000Z`,
      reason: "Studio Maintenance & Equipment Calibration",
    });

    const availability = bookingStore.calculateAvailability(service.id, dateStr);
    const morningSlots = availability.slots.filter((s) => {
      const h = new Date(s.start_time).getUTCHours();
      return h >= 9 && h < 12;
    });

    // All morning slots must be marked unavailable with reason
    morningSlots.forEach((slot) => {
      expect(slot.available).toBe(false);
      expect(slot.conflict_reason).toContain("Studio Maintenance");
    });

    // Afternoon slots should still be available
    const afternoonSlots = availability.slots.filter((s) => {
      const h = new Date(s.start_time).getUTCHours();
      return h >= 14 && h < 17;
    });
    expect(afternoonSlots.some((s) => s.available)).toBe(true);
  });
});
