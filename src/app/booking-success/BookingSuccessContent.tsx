"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Booking } from "@/lib/types";
import { formatCurrency, formatDateTime, formatDuration, getStatusBadgeClass } from "@/lib/utils";
import { BUSINESS_CONFIG } from "@/config/business";
import {
  CheckCircle,
  Copy,
  Clock,
  Calendar,
  User,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!ref) {
      setLoading(false);
      return;
    }

    async function fetchBooking() {
      try {
        const res = await fetch(`/api/bookings/${ref}`);
        const data = await res.json();
        if (res.ok && data.booking) {
          setBooking(data.booking);
        }
      } catch (err) {
        console.error("Failed to load booking details:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchBooking();
  }, [ref]);

  const handleCopyRef = () => {
    if (!ref) return;
    navigator.clipboard.writeText(ref);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
        <p className="mt-3 text-xs text-slate-500">Verifying booking reference...</p>
      </div>
    );
  }

  if (!ref || !booking) {
    return (
      <div className="py-20 text-center px-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 mb-4">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">
          Booking Reference Not Found
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          We could not locate a booking associated with reference{" "}
          <strong className="text-slate-700">{ref || "(none)"}</strong>. Please check your reference or make a new booking.
        </p>
        <Link href="/book" className="mt-6 inline-block">
          <Button variant="primary">Return to Booking</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-12 md:py-16 bg-[#FAFAFA] min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-2xl px-4 sm:px-6">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 mb-4 shadow-sm">
            <CheckCircle className="h-10 w-10" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Submission Received
          </span>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 mt-1">
            Appointment Request Logged
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Thank you, <strong>{booking.customer_name}</strong>. Your appointment has been secured in our schedule.
          </p>
        </div>

        {/* Reference & Actual Status Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-100 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Unique Booking Reference
              </span>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-black font-mono tracking-wider text-slate-900">
                  {booking.booking_reference}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRef}
                  className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 transition-colors"
                  title="Copy reference code"
                >
                  <Copy className="h-4 w-4" />
                </button>
                {copied && (
                  <span className="text-xs text-emerald-600 font-semibold animate-fade-in">
                    Copied!
                  </span>
                )}
              </div>
            </div>

            {/* Actual Database Status */}
            <div className="sm:text-right">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Actual Database Status
              </span>
              <Badge variant="status" status={booking.status} className="text-sm px-3 py-1 font-bold">
                {booking.status}
              </Badge>
            </div>
          </div>

          {/* Status Integrity Notice */}
          <div className="py-4 border-b border-slate-100 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800 font-semibold">
                Status Disclosure:
              </strong>{" "}
              {booking.status === "Pending" ? (
                <span>
                  Your request is currently marked <strong>Pending</strong>. Our administrative team reviews each appointment request before confirming. Your slot is locked so other visitors cannot claim it.
                </span>
              ) : (
                <span>
                  This booking has been verified and confirmed by our scheduling administrator.
                </span>
              )}
            </div>
          </div>

          {/* Appointment Details Grid */}
          <div className="pt-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Appointment Summary
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {booking.service?.name || "Scheduled Service"}
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
                  <p className="font-semibold text-slate-900">Date & Time</p>
                  <p className="text-xs text-slate-600">
                    {formatDateTime(booking.start_time)}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Timezone: {BUSINESS_CONFIG.timezone}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100 space-y-1">
              <p>
                <strong className="text-slate-700">Client:</strong> {booking.customer_name}
              </p>
              <p>
                <strong className="text-slate-700">Email:</strong> {booking.customer_email}
              </p>
              <p>
                <strong className="text-slate-700">Phone:</strong> {booking.customer_phone}
              </p>
              {booking.customer_notes && (
                <p>
                  <strong className="text-slate-700">Notes:</strong> {booking.customer_notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href={`/booking-status?ref=${booking.booking_reference}`}
            className="w-full sm:w-auto"
          >
            <Button variant="outline" size="md" className="w-full sm:w-auto">
              <ExternalLink className="h-4 w-4 mr-1.5" /> Track Status Live
            </Button>
          </Link>

          <Link href="/book" className="w-full sm:w-auto">
            <Button variant="primary" size="md" className="w-full sm:w-auto">
              Book Another Service <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
