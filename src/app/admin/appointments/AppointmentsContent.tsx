"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Booking, BookingEvent, BookingStatus, TimeSlot, AvailabilityResponse } from "@/lib/types";
import { formatCurrency, formatDateTime, formatDuration, formatDate } from "@/lib/utils";
import { BUSINESS_CONFIG } from "@/config/business";
import {
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  CalendarCheck,
  RefreshCw,
  History,
  AlertCircle,
  Eye,
  CalendarDays,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";

const STATUS_FILTERS: { id: string; label: string; countKey?: string }[] = [
  { id: "all", label: "All Bookings" },
  { id: "Pending", label: "Pending Review" },
  { id: "Confirmed", label: "Confirmed" },
  { id: "Completed", label: "Completed" },
  { id: "Cancelled", label: "Cancelled" },
  { id: "Rejected", label: "Rejected" },
];

export default function AppointmentsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "all";

  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected booking for Detail Modal
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Reschedule Modal State
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>("");
  const [rescheduleAvailability, setRescheduleAvailability] = useState<AvailabilityResponse | null>(null);
  const [rescheduleSlot, setRescheduleSlot] = useState<TimeSlot | null>(null);
  const [rescheduleReason, setRescheduleReason] = useState<string>("");
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/bookings?";
      if (statusFilter !== "all") url += `status=${statusFilter}&`;
      if (searchQuery.trim()) url += `search=${encodeURIComponent(searchQuery.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  const handleUpdateStatus = async (id: string, newStatus: BookingStatus, note?: string) => {
    try {
      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, note }),
      });
      if (res.ok) {
        await fetchBookings();
        if (selectedBooking && selectedBooking.id === id) {
          setIsDetailOpen(false);
        }
      }
    } catch (err) {
      console.error("Status update failed:", err);
    }
  };

  const openDetails = async (booking: Booking) => {
    setSelectedBooking(booking);
    setIsDetailOpen(true);
    try {
      const res = await fetch(`/api/bookings/${booking.booking_reference}`);
      const data = await res.json();
      if (res.ok) {
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error("Failed to load booking events:", err);
    }
  };

  const openReschedule = (booking: Booking) => {
    setRescheduleBooking(booking);
    setRescheduleReason("");
    setRescheduleError(null);
    setRescheduleSlot(null);

    // Default to tomorrow
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    const dateStr = tmr.toISOString().split("T")[0];
    setRescheduleDate(dateStr);
    setIsRescheduleOpen(true);
  };

  // Load availability for reschedule
  useEffect(() => {
    if (!rescheduleBooking || !rescheduleDate) return;

    async function loadRescheduleSlots() {
      setRescheduleSlot(null);
      setRescheduleError(null);
      try {
        const res = await fetch(
          `/api/availability?service_id=${rescheduleBooking!.service_id}&date=${rescheduleDate}`
        );
        const data = await res.json();
        if (res.ok) {
          setRescheduleAvailability(data);
        }
      } catch (err) {
        console.error("Failed to load reschedule slots:", err);
      }
    }

    loadRescheduleSlots();
  }, [rescheduleBooking, rescheduleDate]);

  const handleExecuteReschedule = async () => {
    if (!rescheduleBooking || !rescheduleSlot) return;

    setRescheduleLoading(true);
    setRescheduleError(null);

    try {
      const res = await fetch(
        `/api/admin/bookings/${rescheduleBooking.id}/reschedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start_time: rescheduleSlot.start_time,
            reason: rescheduleReason.trim() || undefined,
          }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Reschedule failed");
      }

      setIsRescheduleOpen(false);
      await fetchBookings();
    } catch (err: any) {
      setRescheduleError(err.message || "Failed to reschedule booking");
    } finally {
      setRescheduleLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Appointments
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
            Booking Records & Schedule Management
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchBookings}
          isLoading={loading}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh List
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === f.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-50 text-slate-600 hover:bg-slate-100"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search reference, client name, email, or service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mx-auto" />
            <p className="mt-3 text-xs text-slate-500">Loading appointments...</p>
          </div>
        ) : bookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Ref Code</th>
                  <th className="py-3.5 px-4 font-semibold">Service</th>
                  <th className="py-3.5 px-4 font-semibold">Client</th>
                  <th className="py-3.5 px-4 font-semibold">Scheduled Date & Time</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {b.booking_reference}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(b.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-800 block">
                        {b.service?.name || "Service"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {b.service ? formatCurrency(b.service.price) : ""}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 block">
                        {b.customer_name}
                      </span>
                      <span className="text-slate-400 block text-[11px]">
                        {b.customer_email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-slate-900 block">
                        {formatDateTime(b.start_time)}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {b.customer_phone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="status" status={b.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDetails(b)}
                          title="View Details & Audit Timeline"
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" /> View
                        </Button>

                        {b.status === "Pending" && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleUpdateStatus(b.id, "Confirmed")}
                          >
                            Confirm
                          </Button>
                        )}

                        {(b.status === "Pending" || b.status === "Confirmed") && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => openReschedule(b)}
                            title="Reschedule Appointment"
                          >
                            Reschedule
                          </Button>
                        )}

                        {b.status === "Confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(b.id, "Completed")}
                          >
                            Complete
                          </Button>
                        )}

                        {(b.status === "Pending" || b.status === "Confirmed") && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            onClick={() => handleUpdateStatus(b.id, "Cancelled")}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500">
            No bookings found matching the current filter.
          </div>
        )}
      </div>

      {/* DETAIL & AUDIT HISTORY MODAL */}
      {selectedBooking && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Booking ${selectedBooking.booking_reference}`}
          description="Detailed appointment parameters and complete event timeline."
          maxWidth="lg"
        >
          <div className="space-y-5 text-xs text-slate-700">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
              <div>
                <span className="text-[11px] text-slate-400 block uppercase font-bold">
                  Current Status
                </span>
                <Badge variant="status" status={selectedBooking.status} className="mt-1 font-bold">
                  {selectedBooking.status}
                </Badge>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-400 block uppercase font-bold">
                  Price
                </span>
                <span className="text-base font-bold text-slate-900">
                  {selectedBooking.service
                    ? formatCurrency(selectedBooking.service.price)
                    : ""}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 font-bold block mb-1">Service</span>
                <span className="font-semibold text-slate-900 block">
                  {selectedBooking.service?.name}
                </span>
                <span className="text-slate-500">
                  {selectedBooking.service?.duration_minutes} minutes
                </span>
              </div>
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 font-bold block mb-1">Client Details</span>
                <span className="font-semibold text-slate-900 block">
                  {selectedBooking.customer_name}
                </span>
                <span className="text-slate-500 block">{selectedBooking.customer_email}</span>
                <span className="text-slate-500 block">{selectedBooking.customer_phone}</span>
              </div>
            </div>

            <div className="p-3 border rounded-lg bg-white">
              <span className="text-slate-400 font-bold block mb-1">Time & Schedule</span>
              <p className="font-semibold text-slate-900">
                {formatDateTime(selectedBooking.start_time)}
              </p>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Timezone: {BUSINESS_CONFIG.timezone}
              </p>
            </div>

            {selectedBooking.customer_notes && (
              <div className="p-3 border rounded-lg bg-white">
                <span className="text-slate-400 font-bold block mb-1">Client Notes</span>
                <p className="text-slate-600">{selectedBooking.customer_notes}</p>
              </div>
            )}

            {/* Event Timeline */}
            <div className="border-t border-slate-100 pt-4">
              <div className="flex items-center gap-1.5 mb-3 font-bold text-slate-900">
                <History className="h-4 w-4 text-teal-600" />
                <span>Audit Trail & Event Log</span>
              </div>
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex justify-between items-start p-2 rounded bg-slate-50 border border-slate-100 text-[11px]"
                  >
                    <div>
                      <span className="font-semibold text-slate-800 capitalize block">
                        {ev.event_type.replace("_", " ")}
                      </span>
                      <span className="text-slate-500">{ev.note}</span>
                    </div>
                    <span className="text-slate-400 shrink-0 ml-2">
                      {new Date(ev.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Status Modifiers */}
            <div className="flex justify-between pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
              >
                Close
              </Button>
              <div className="flex gap-2">
                {selectedBooking.status === "Pending" && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedBooking.id, "Confirmed")}
                    >
                      Confirm Booking
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleUpdateStatus(selectedBooking.id, "Rejected")}
                    >
                      Reject
                    </Button>
                  </>
                )}
                {selectedBooking.status === "Confirmed" && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleUpdateStatus(selectedBooking.id, "Cancelled")}
                  >
                    Cancel Booking
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleBooking && (
        <Modal
          isOpen={isRescheduleOpen}
          onClose={() => setIsRescheduleOpen(false)}
          title={`Reschedule ${rescheduleBooking.booking_reference}`}
          description="Select a new date and time slot. Concurrency availability will be checked atomically."
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {rescheduleError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{rescheduleError}</span>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Target Date (YYYY-MM-DD)
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
              />
            </div>

            {/* Slots */}
            <div>
              <label className="block text-slate-700 font-bold mb-1">
                Available Time Slots
              </label>
              {rescheduleAvailability?.is_closed ? (
                <p className="text-rose-600 font-semibold py-2">
                  Business is closed on this day.
                </p>
              ) : rescheduleAvailability?.slots && rescheduleAvailability.slots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-48 overflow-y-auto p-1 border rounded-lg">
                  {rescheduleAvailability.slots.map((slot) => {
                    const isSelected = rescheduleSlot?.start_time === slot.start_time;
                    return (
                      <button
                        key={slot.start_time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => setRescheduleSlot(slot)}
                        className={`rounded p-2 text-center transition-all ${
                          !slot.available
                            ? "bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                            : isSelected
                            ? "bg-teal-600 text-white font-bold"
                            : "bg-white border text-slate-700 hover:border-teal-500"
                        }`}
                      >
                        {slot.display_time}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-slate-400 py-2">No slots available on this date.</p>
              )}
            </div>

            <div>
              <Textarea
                label="Reason for Rescheduling (Optional)"
                placeholder="e.g. Client requested postponement due to travel..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRescheduleOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!rescheduleSlot}
                isLoading={rescheduleLoading}
                onClick={handleExecuteReschedule}
              >
                Confirm Reschedule
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
