"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Booking, BookingEvent } from "@/lib/types";
import { formatCurrency, formatDateTime, formatDuration } from "@/lib/utils";
import { BUSINESS_CONFIG } from "@/config/business";
import {
  Search,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  History,
  ArrowRight,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BookingStatusContent() {
  const searchParams = useSearchParams();
  const initialRef = searchParams.get("ref") || "";

  const [referenceInput, setReferenceInput] = useState(initialRef);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [events, setEvents] = useState<BookingEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchStatus = async (refCode: string) => {
    if (!refCode.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    setSearched(true);

    try {
      const res = await fetch(`/api/bookings/${refCode.trim()}`);
      const data = await res.json();

      if (!res.ok) {
        setBooking(null);
        setEvents([]);
        setErrorMsg(
          data.error || "No booking record found with that reference. Please check and retry."
        );
      } else {
        setBooking(data.booking);
        setEvents(data.events || []);
      }
    } catch (err: any) {
      setErrorMsg("Failed to communicate with booking engine.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      fetchStatus(initialRef);
    }
  }, [initialRef]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStatus(referenceInput);
  };

  return (
    <div className="py-12 md:py-16 bg-[#FAFAFA] min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Self-Service Status
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
            Check Appointment Status
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Enter your unique booking reference (e.g. <strong>BF-7K9M2P</strong>) to see real-time updates and approval timeline.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Enter booking reference (e.g. BF-7K9M2P)..."
                value={referenceInput}
                onChange={(e) => setReferenceInput(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-sm font-mono uppercase text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                required
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={loading}
              className="sm:w-36"
            >
              Lookup
            </Button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Demo sample reference:</span>
            <button
              type="button"
              onClick={() => {
                setReferenceInput("BF-7K9M2P");
                fetchStatus("BF-7K9M2P");
              }}
              className="text-teal-700 hover:underline font-mono font-semibold"
            >
              Use BF-7K9M2P
            </button>
          </div>
        </div>

        {/* Error State */}
        {errorMsg && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Lookup Error</p>
              <p className="mt-0.5 text-xs text-rose-700">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Booking Result Card */}
        {booking && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Reference Code
                </span>
                <p className="text-2xl font-black font-mono tracking-wider text-slate-900 mt-0.5">
                  {booking.booking_reference}
                </p>
              </div>

              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                  Current Status
                </span>
                <Badge variant="status" status={booking.status} className="text-sm px-3 py-1 font-bold">
                  {booking.status}
                </Badge>
              </div>
            </div>

            {/* Service & Time Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">
                    {booking.service?.name || "Selected Service"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {booking.service?.duration_minutes
                      ? formatDuration(booking.service.duration_minutes)
                      : "60 mins"}{" "}
                    •{" "}
                    {booking.service?.price
                      ? formatCurrency(booking.service.price)
                      : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-slate-900">Appointment Time</p>
                  <p className="text-xs text-slate-600">
                    {formatDateTime(booking.start_time)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Timezone: {BUSINESS_CONFIG.timezone}
                  </p>
                </div>
              </div>
            </div>

            {/* Masked Customer Info (Privacy Compliance) */}
            <div className="rounded-lg bg-slate-50 p-3.5 text-xs text-slate-600 border border-slate-100 space-y-1">
              <p>
                <strong className="text-slate-700">Client:</strong> {booking.customer_name}
              </p>
              <p>
                <strong className="text-slate-700">Masked Email:</strong> {booking.customer_email}
              </p>
              <p>
                <strong className="text-slate-700">Masked Phone:</strong> {booking.customer_phone}
              </p>
            </div>

            {/* Status Timeline / Audit History */}
            <div className="border-t border-slate-100 pt-6">
              <div className="flex items-center gap-2 mb-4">
                <History className="h-4 w-4 text-teal-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Appointment Audit History & Events
                </h3>
              </div>

              {events.length > 0 ? (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {events.map((ev) => (
                    <div key={ev.id} className="relative">
                      <div className="absolute -left-6 top-1 h-2.5 w-2.5 rounded-full bg-teal-600 ring-4 ring-white" />
                      <div className="text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800 capitalize">
                            {ev.event_type.replace("_", " ")}
                          </span>
                          <span className="text-slate-400">
                            {formatDateTime(ev.created_at)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-slate-500">{ev.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No events recorded yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
