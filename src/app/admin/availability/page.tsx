"use client";

import React, { useState, useEffect } from "react";
import { BusinessHours, BlockedPeriod } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import { BUSINESS_CONFIG } from "@/config/business";
import {
  Clock,
  Calendar,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default function AdminAvailabilityPage() {
  const [hours, setHours] = useState<BusinessHours[]>([]);
  const [blockedPeriods, setBlockedPeriods] = useState<BlockedPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingHours, setIsSavingHours] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // New Blocked Period Modal
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);
  const [blockedStart, setBlockedStart] = useState("");
  const [blockedEnd, setBlockedEnd] = useState("");
  const [blockedReason, setBlockedReason] = useState("");
  const [isSavingBlocked, setIsSavingBlocked] = useState(false);
  const [blockedError, setBlockedError] = useState<string | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (res.ok) {
        setHours(data.hours || []);
        setBlockedPeriods(data.blockedPeriods || []);
      }
    } catch (err) {
      console.error("Failed to load availability settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleHourChange = (
    dayOfWeek: number,
    field: "open_time" | "close_time" | "is_closed",
    value: any
  ) => {
    setHours((prev) =>
      prev.map((h) => (h.day_of_week === dayOfWeek ? { ...h, [field]: value } : h))
    );
  };

  const handleSaveHours = async () => {
    setIsSavingHours(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveSuccessMsg("Business opening hours updated successfully.");
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      }
    } catch (err) {
      console.error("Failed to save hours:", err);
    } finally {
      setIsSavingHours(false);
    }
  };

  const handleAddBlockedPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBlocked(true);
    setBlockedError(null);

    const startIso = new Date(blockedStart).toISOString();
    const endIso = new Date(blockedEnd).toISOString();

    if (new Date(endIso) <= new Date(startIso)) {
      setBlockedError("End time must be later than start time.");
      setIsSavingBlocked(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newBlockedPeriod: {
            start_time: startIso,
            end_time: endIso,
            reason: blockedReason.trim(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to block time period");

      setIsBlockedModalOpen(false);
      setBlockedStart("");
      setBlockedEnd("");
      setBlockedReason("");
      await fetchSettings();
    } catch (err: any) {
      setBlockedError(err.message || "Failed to save blackout period");
    } finally {
      setIsSavingBlocked(false);
    }
  };

  const handleDeleteBlocked = async (id: string) => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deleteBlockedPeriodId: id }),
      });
      if (res.ok) {
        await fetchSettings();
      }
    } catch (err) {
      console.error("Failed to delete blocked period:", err);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Scheduling Parameters
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
            Availability & Opening Hours
          </h1>
        </div>

        <Button variant="outline" size="sm" onClick={fetchSettings} isLoading={loading}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
        </Button>
      </div>

      {saveSuccessMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {/* SECTION 1: BUSINESS OPENING HOURS */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Weekly Operating Schedule
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Appointments can only be booked during configured open hours in timezone{" "}
              <strong>{BUSINESS_CONFIG.timezone}</strong>.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSavingHours}
            onClick={handleSaveHours}
          >
            <Save className="h-3.5 w-3.5 mr-1.5" /> Save Operating Hours
          </Button>
        </div>

        <div className="divide-y divide-slate-100">
          {hours.map((h) => (
            <div
              key={h.day_of_week}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="w-36 font-bold text-slate-900">
                {DAY_NAMES[h.day_of_week]}
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={h.is_closed}
                    onChange={(e) =>
                      handleHourChange(h.day_of_week, "is_closed", e.target.checked)
                    }
                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                  />
                  <span className={h.is_closed ? "font-bold text-rose-600" : "text-slate-600"}>
                    Closed Entire Day
                  </span>
                </label>

                {!h.is_closed && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Opens:</span>
                    <input
                      type="time"
                      value={h.open_time.slice(0, 5)}
                      onChange={(e) =>
                        handleHourChange(h.day_of_week, "open_time", e.target.value)
                      }
                      className="rounded border border-slate-300 p-1.5 text-xs text-slate-900 bg-white"
                    />
                    <span className="text-slate-400">Closes:</span>
                    <input
                      type="time"
                      value={h.close_time.slice(0, 5)}
                      onChange={(e) =>
                        handleHourChange(h.day_of_week, "close_time", e.target.value)
                      }
                      className="rounded border border-slate-300 p-1.5 text-xs text-slate-900 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: BLOCKED PERIODS & BLACKOUT DATES */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Blocked Periods & Studio Blackouts
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specific dates or timeframes that are unavailable for public booking (e.g., holidays, maintenance).
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsBlockedModalOpen(true)}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Block Time Period
          </Button>
        </div>

        {blockedPeriods.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {blockedPeriods.map((bp) => (
              <div
                key={bp.id}
                className="py-3 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <Ban className="h-3.5 w-3.5 text-rose-500" />
                    <span className="font-bold text-slate-900">{bp.reason}</span>
                  </div>
                  <p className="text-slate-500 text-[11px] pl-5.5">
                    From <strong>{formatDateTime(bp.start_time)}</strong> to{" "}
                    <strong>{formatDateTime(bp.end_time)}</strong>
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  onClick={() => handleDeleteBlocked(bp.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-500">
            No blackout dates or blocked periods configured.
          </div>
        )}
      </div>

      {/* ADD BLOCKED PERIOD MODAL */}
      <Modal
        isOpen={isBlockedModalOpen}
        onClose={() => setIsBlockedModalOpen(false)}
        title="Block Date or Time Window"
        description="Prevent customers from booking appointments during this timeframe."
        maxWidth="md"
      >
        <form onSubmit={handleAddBlockedPeriod} className="space-y-4 text-xs">
          {blockedError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{blockedError}</span>
            </div>
          )}

          <Input
            label="Reason for Blackout"
            placeholder="e.g. Studio Closed for Private Event"
            value={blockedReason}
            onChange={(e) => setBlockedReason(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px]">
                Start Date & Time
              </label>
              <input
                type="datetime-local"
                value={blockedStart}
                onChange={(e) => setBlockedStart(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                required
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px]">
                End Date & Time
              </label>
              <input
                type="datetime-local"
                value={blockedEnd}
                onChange={(e) => setBlockedEnd(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs"
                required
              />
            </div>
          </div>

          <div className="flex justify-between pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsBlockedModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSavingBlocked}
            >
              Save Blockout
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
