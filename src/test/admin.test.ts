import { describe, it, expect, beforeEach } from "vitest";
import { bookingStore } from "@/lib/store";
import { verifyAdminCredentials } from "@/lib/auth";

describe("Admin Authentication, Authorization & Operations Tests", () => {
  beforeEach(() => {
    bookingStore.reset();
  });

  const getFutureTuesdaySlot = (hour = 14) => {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = (9 - day) % 7 || 7;
    d.setUTCDate(d.getUTCDate() + diff);
    const dateStr = d.toISOString().split("T")[0];
    const hourStr = hour < 10 ? `0${hour}` : `${hour}`;
    return {
      dateStr,
      startTime: `${dateStr}T${hourStr}:00:00.000Z`,
    };
  };

  it("1. Admin authentication validates credentials accurately", () => {
    // Valid default demo credentials
    const valid = verifyAdminCredentials("admin@saisbookflow.com", "AdminSecurePass2025!");
    expect(valid).toBe(true);

    // Invalid credentials
    const invalidEmail = verifyAdminCredentials("hacker@malicious.com", "AdminSecurePass2025!");
    expect(invalidEmail).toBe(false);

    const invalidPass = verifyAdminCredentials("admin@saisbookflow.com", "WrongPassword123!");
    expect(invalidPass).toBe(false);
  });

  it("2. Admin can confirm a pending booking and audit event is recorded", async () => {
    const service = bookingStore.getActiveServices()[0];
    const { startTime } = getFutureTuesdaySlot(10);

    const { booking } = await bookingStore.createBooking({
      service_id: service.id,
      start_time: startTime,
      customer_name: "Alexander Hamilton",
      customer_email: "alexander@treasury.gov",
      customer_phone: "+1 202-555-0199",
    });

    expect(booking.status).toBe("Pending");

    // Admin confirms
    const confirmed = bookingStore.updateBookingStatus(
      booking.id,
      "Confirmed",
      "Confirmed after calendar review"
    );

    expect(confirmed.status).toBe("Confirmed");

    // Check audit events
    const events = bookingStore.getBookingEvents(booking.id);
    const statusEvent = events.find((e) => e.event_type === "status_changed");
    expect(statusEvent).toBeDefined();
    expect(statusEvent?.new_status).toBe("Confirmed");
  });

  it("3. Admin can cancel a booking, which releases the time slot for new bookings", async () => {
    const service = bookingStore.getActiveServices()[0];
    const { startTime } = getFutureTuesdaySlot(12);

    // Client A books slot
    const { booking } = await bookingStore.createBooking({
      service_id: service.id,
      start_time: startTime,
      customer_name: "Client A",
      customer_email: "clientA@example.com",
      customer_phone: "+1 202-555-0101",
    });

    // Admin cancels booking
    bookingStore.updateBookingStatus(booking.id, "Cancelled", "Client requested cancellation");
    const updated = bookingStore.getBookingById(booking.id);
    expect(updated?.status).toBe("Cancelled");

    // Client B can now successfully book the released slot!
    const clientBBooking = await bookingStore.createBooking({
      service_id: service.id,
      start_time: startTime,
      customer_name: "Client B",
      customer_email: "clientB@example.com",
      customer_phone: "+1 202-555-0102",
    });

    expect(clientBBooking.booking.id).toBeDefined();
    expect(clientBBooking.booking.status).toBe("Pending");
  });

  it("4. Rescheduling into an unavailable/occupied slot is rejected with conflict error", async () => {
    const service = bookingStore.getActiveServices()[0];
    const slot1 = getFutureTuesdaySlot(14);
    const slot2 = getFutureTuesdaySlot(15);

    // Booking 1 takes 14:00
    const b1 = await bookingStore.createBooking({
      service_id: service.id,
      start_time: slot1.startTime,
      customer_name: "Booking 1",
      customer_email: "b1@example.com",
      customer_phone: "+1 202-555-0101",
    });

    // Booking 2 takes 15:00
    const b2 = await bookingStore.createBooking({
      service_id: service.id,
      start_time: slot2.startTime,
      customer_name: "Booking 2",
      customer_email: "b2@example.com",
      customer_phone: "+1 202-555-0102",
    });

    // Booking 2 attempts to reschedule to 14:00 (which is occupied by Booking 1)
    await expect(
      bookingStore.rescheduleBooking(b2.booking.id, slot1.startTime, "Wants earlier slot")
    ).rejects.toThrow(/SLOT_CONFLICT|already occupied/i);
  });

  it("5. Rescheduling into an open slot succeeds and logs reschedule audit event", async () => {
    const service = bookingStore.getActiveServices()[0];
    const slot1 = getFutureTuesdaySlot(16);
    const openSlot = getFutureTuesdaySlot(17);

    const b = await bookingStore.createBooking({
      service_id: service.id,
      start_time: slot1.startTime,
      customer_name: "Reschedule Client",
      customer_email: "reschedule@example.com",
      customer_phone: "+1 202-555-0101",
    });

    const rescheduled = await bookingStore.rescheduleBooking(
      b.booking.id,
      openSlot.startTime,
      "Moved to 5 PM"
    );

    expect(rescheduled.start_time).toBe(new Date(openSlot.startTime).toISOString());

    const events = bookingStore.getBookingEvents(b.booking.id);
    const rescheduleEv = events.find((e) => e.event_type === "rescheduled");
    expect(rescheduleEv).toBeDefined();
    expect(rescheduleEv?.note).toContain("Moved to 5 PM");
  });
});
