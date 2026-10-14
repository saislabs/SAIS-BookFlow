"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Booking, BookingStatus } from "@/lib/types";
import { formatCurrency, formatDateTime, formatDuration, getStatusBadgeClass } from "@/lib/utils";
import { BUSINESS_CONFIG } from "@/config/business";
import {
  CalendarCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminDashboardPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
    rejected: 0,
  });
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/bookings");
      const data = await res.json();
      if (res.ok) {
        setBookings(data.bookings || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: BookingStatus) => {
    setActionLoadingId(id);
    try {
      const res = await fetch(`/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          note: `Status updated to ${newStatus} from dashboard quick action`,
        }),
      });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "Pending");
  const upcomingConfirmed = bookings.filter((b) => b.status === "Confirmed");

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Administrative Operations
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
            Overview & Scheduling Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            isLoading={loading}
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Link href="/book" target="_blank">
            <Button variant="primary" size="sm">
              New Booking (Client View)
            </Button>
          </Link>
        </div>
      </div>

      {/* System Status Banner */}
      <div className="rounded-xl border border-teal-200 bg-white p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-teal-600 shrink-0" />
          <span>
            <strong className="text-slate-900">PostgreSQL Concurrency Active:</strong>{" "}
            Zero double-booking exclusion constraint enforced. Operating Timezone:{" "}
            <strong className="text-slate-900">{BUSINESS_CONFIG.timezone}</strong>.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-emerald-700">Scheduling Engine Online</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Pending Review
            </span>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-black text-amber-600">
            {stats.pending}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Requires admin confirmation
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Confirmed
            </span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            {stats.confirmed}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Locked on master calendar
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Completed
            </span>
            <CalendarCheck className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-2 text-3xl font-black text-blue-600">
            {stats.completed}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Past successful sessions</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">
              Total Volume
            </span>
            <TrendingUp className="h-4 w-4 text-teal-600" />
          </div>
          <p className="mt-2 text-3xl font-black text-slate-900">
            {stats.total}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            All lifetime booking records
          </p>
        </div>
      </div>

      {/* PENDING REQUESTS URGENT TABLE */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Pending Appointment Requests ({pendingBookings.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review and either confirm or reject incoming client booking requests.
            </p>
          </div>
          <Link href="/admin/appointments?status=Pending">
            <Button variant="outline" size="sm">
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        {pendingBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ref & Service</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Requested Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Duration / Price</th>
                  <th className="py-3 px-4 font-semibold text-right">Quick Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {b.booking_reference}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {b.service?.name || "Service"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
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
                        {BUSINESS_CONFIG.timezone}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <span>{b.service ? formatDuration(b.service.duration_minutes) : "60 mins"}</span>
                      <span className="block font-bold text-slate-900">
                        {b.service ? formatCurrency(b.service.price) : ""}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          isLoading={actionLoadingId === b.id}
                          onClick={() => handleUpdateStatus(b.id, "Confirmed")}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={actionLoadingId === b.id}
                          onClick={() => handleUpdateStatus(b.id, "Rejected")}
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2 opacity-70" />
            <span>All caught up! There are no pending booking requests awaiting review.</span>
          </div>
        )}
      </div>

      {/* UPCOMING CONFIRMED APPOINTMENTS */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 p-5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Confirmed Appointments ({upcomingConfirmed.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Active appointments currently locking calendar slots.
            </p>
          </div>
          <Link href="/admin/appointments?status=Confirmed">
            <Button variant="outline" size="sm">
              Manage All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        {upcomingConfirmed.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4 font-semibold">Ref & Service</th>
                  <th className="py-3 px-4 font-semibold">Client</th>
                  <th className="py-3 px-4 font-semibold">Scheduled Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {upcomingConfirmed.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">
                        {b.booking_reference}
                      </span>
                      <span className="text-slate-500 font-medium">
                        {b.service?.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
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
                          isLoading={actionLoadingId === b.id}
                          onClick={() => handleUpdateStatus(b.id, "Completed")}
                        >
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          isLoading={actionLoadingId === b.id}
                          onClick={() => handleUpdateStatus(b.id, "Cancelled")}
                        >
                          Cancel
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            No confirmed appointments currently scheduled.
          </div>
        )}
      </div>
    </div>
  );
}
