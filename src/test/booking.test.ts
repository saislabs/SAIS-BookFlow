import { describe, it, expect, beforeEach } from "vitest";
import { bookingStore } from "@/lib/store";

describe("Booking System & Concurrency Protection Tests", () => {
  beforeEach(() => {
    bookingStore.reset();
  });

  // Helper to get a valid future Monday slot
  const getFutureMondaySlot = () => {
    const d = new Date();
    // Advance to next Monday
    const day = d.getUTCDay();
    const diff = (8 - day) % 7 || 7;
    d.setUTCDate(d.getUTCDate() + diff);
    const dateStr = d.toISOString().split("T")[0];
    return {
      dateStr,
      startTime: `${dateStr}T10:00:00.000Z`,
    };
  };

  // Helper to get a future Sunday slot (closed day)
  const getFutureSundaySlot = () => {
    const d = new Date();
    const day = d.getUTCDay();
    const diff = day === 0 ? 7 : 7 - day;
    d.setUTCDate(d.getUTCDate() + diff);
    const dateStr = d.toISOString().split("T")[0];
    return {
      dateStr,
      startTime: `${dateStr}T10:00:00.000Z`,
    };
  };

  it("1. Creates a booking successfully with unique reference and Pending status", async () => {
    const services = bookingStore.getActiveServices();
    const service = services[0];
    const { startTime } = getFutureMondaySlot();

    const { booking } = await bookingStore.createBooking({
      service_id: service.id,
      start_time: startTime,
      customer_name: "Marcus Aurelius",
      customer_email: "marcus@philosophy.org",
      customer_phone: "+1 202-555-0143",
      customer_notes: "Focus on stoic governance.",
    });

    expect(booking).toBeDefined();
    expect(booking.booking_reference).toMatch(/^BF-[A-Z0-9]{6}$/);
    expect(booking.status).toBe("Pending");
    expect(booking.customer_name).toBe("Marcus Aurelius");

    // Events audit trail
    const events = bookingStore.getBookingEvents(booking.id);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0].event_type).toBe("created");
  });

  it("2. Rejects booking with invalid service ID", async () => {
    const { startTime } = getFutureMondaySlot();

    await expect(
      bookingStore.createBooking({
        service_id: "non-existent-service-uuid",
        start_time: startTime,
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
        customer_phone: "+1 202-555-0144",
      })
    ).rejects.toThrow(/Invalid service/i);
  });

  it("3. Rejects booking on closed days (e.g. Sunday)", async () => {
    const services = bookingStore.getActiveServices();
    const service = services[0];
    const { startTime } = getFutureSundaySlot();

    await expect(
      bookingStore.createBooking({
        service_id: service.id,
        start_time: startTime,
        customer_name: "Jane Doe",
        customer_email: "jane@example.com",
        customer_phone: "+1 202-555-0144",
      })
    ).rejects.toThrow(/closed/i);
  });

  it("4. Prevents overlapping time slots sequentially", async () => {
    const services = bookingStore.getActiveServices();
    const service = services[0];
    const { startTime } = getFutureMondaySlot();

    // First booking takes the slot
    const first = await bookingStore.createBooking({
      service_id: service.id,
      start_time: startTime,
      customer_name: "Customer Alpha",
      customer_email: "alpha@example.com",
      customer_phone: "+1 202-555-0111",
    });
    expect(first.booking.id).toBeDefined();

    // Second booking attempts to take the exact same slot
    await expect(
      bookingStore.createBooking({
        service_id: service.id,
        start_time: startTime,
        customer_name: "Customer Beta",
        customer_email: "beta@example.com",
        customer_phone: "+1 202-555-0222",
      })
    ).rejects.toThrow(/SLOT_CONFLICT|no longer available/i);
  });

  it("5. CRITICAL CONCURRENCY: Two simultaneous requests for the exact same slot resolve atomically (1 success, 1 conflict)", async () => {
    const services = bookingStore.getActiveServices();
    const service = services[0];

    // Use a different time on future Monday (e.g. 11:00)
    const d = new Date();
    const day = d.getUTCDay();
    const diff = (8 - day) % 7 || 7;
    d.setUTCDate(d.getUTCDate() + diff);
    const dateStr = d.toISOString().split("T")[0];
    const targetSlotTime = `${dateStr}T11:00:00.000Z`;

    // Fire two simultaneous requests concurrently using Promise.allSettled
    const [result1, result2] = await Promise.allSettled([
      bookingStore.createBooking({
        service_id: service.id,
        start_time: targetSlotTime,
        customer_name: "Rival Client 1",
        customer_email: "client1@example.com",
        customer_phone: "+1 202-555-0101",
      }),
      bookingStore.createBooking({
        service_id: service.id,
        start_time: targetSlotTime,
        customer_name: "Rival Client 2",
        customer_email: "client2@example.com",
        customer_phone: "+1 202-555-0102",
      }),
    ]);

    const successes = [result1, result2].filter((r) => r.status === "fulfilled");
    const rejections = [result1, result2].filter((r) => r.status === "rejected");

    // Exactly ONE request must succeed, and exactly ONE must be rejected
    expect(successes.length).toBe(1);
    expect(rejections.length).toBe(1);

    const rejectedReason = (rejections[0] as PromiseRejectedResult).reason;
    expect(rejectedReason.message).toMatch(/SLOT_CONFLICT|no longer available/i);
  });
});
