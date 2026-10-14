"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Service, TimeSlot, AvailabilityResponse } from "@/lib/types";
import { bookingFormSchema, BookingFormValues } from "@/lib/validations";
import { formatCurrency, formatDuration, formatDateTime, formatDate, formatTime } from "@/lib/utils";
import { BUSINESS_CONFIG } from "@/config/business";
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  User,
  Mail,
  Phone,
  FileText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input, Textarea } from "../ui/input";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

export function BookingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialServiceId = searchParams.get("service") || "";

  // Step state: 1: Service, 2: Date & Slot, 3: Contact Info, 4: Review & Submit
  const [step, setStep] = useState<number>(initialServiceId ? 2 : 1);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Date and slot selection
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingAvailability, setLoadingAvailability] = useState<boolean>(false);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      service_id: initialServiceId,
      customer_name: "",
      customer_email: "",
      customer_phone: "",
      customer_notes: "",
    },
  });

  // Load services
  useEffect(() => {
    async function fetchServices() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        if (data.services) {
          setServices(data.services);
          if (initialServiceId) {
            const match = data.services.find((s: Service) => s.id === initialServiceId);
            if (match) {
              setSelectedService(match);
              setValue("service_id", match.id);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load services:", err);
      }
    }
    fetchServices();
  }, [initialServiceId, setValue]);

  // Set default date to tomorrow
  useEffect(() => {
    if (!selectedDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split("T")[0];
      setSelectedDate(dateStr);
    }
  }, [selectedDate]);

  // Fetch availability when service or date changes
  useEffect(() => {
    if (!selectedService || !selectedDate) return;

    let isMounted = true;
    async function loadSlots() {
      setLoadingAvailability(true);
      setSelectedSlot(null);
      setSubmitError(null);
      try {
        const res = await fetch(
          `/api/availability?service_id=${selectedService!.id}&date=${selectedDate}`
        );
        const data = await res.json();
        if (isMounted) {
          if (res.ok) {
            setAvailability(data);
          } else {
            setAvailability(null);
          }
        }
      } catch (err) {
        console.error("Error fetching availability:", err);
      } finally {
        if (isMounted) setLoadingAvailability(false);
      }
    }

    loadSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedService, selectedDate]);

  const handleSelectService = (service: Service) => {
    setSelectedService(service);
    setValue("service_id", service.id);
    setStep(2);
  };

  const handleSelectSlot = (slot: TimeSlot) => {
    if (!slot.available) return;
    setSelectedSlot(slot);
    setValue("start_time", slot.start_time);
  };

  const onSubmitBooking = async (formData: BookingFormValues) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 || data.code === "SLOT_CONFLICT") {
          setSubmitError(
            "This time slot was just booked by another client. Please select another slot."
          );
          // Refresh availability
          if (selectedService && selectedDate) {
            const refreshRes = await fetch(
              `/api/availability?service_id=${selectedService.id}&date=${selectedDate}`
            );
            const refreshData = await refreshRes.json();
            setAvailability(refreshData);
            setSelectedSlot(null);
            setStep(2); // Go back to slot selection
          }
          return;
        }
        throw new Error(data.message || data.error || "Failed to submit booking");
      }

      // Successful creation! Redirect to success page with booking reference
      const booking = data.booking;
      router.push(`/booking-success?ref=${booking.booking_reference}`);
    } catch (err: any) {
      setSubmitError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper date options (next 14 days)
  const getNextDays = () => {
    const days: { dateStr: string; label: string; dayName: string; dayNumber: string }[] = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
      const dayNumber = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
      days.push({
        dateStr,
        label: `${dayName}, ${dayNumber}`,
        dayName,
        dayNumber,
      });
    }
    return days;
  };

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress Stepper */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[
            { num: 1, label: "Select Service" },
            { num: 2, label: "Date & Time" },
            { num: 3, label: "Your Details" },
            { num: 4, label: "Review & Book" },
          ].map((s, idx) => (
            <div key={s.num} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                    step >= s.num
                      ? "bg-teal-600 text-white"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {step > s.num ? <CheckCircle2 className="h-5 w-5" /> : s.num}
                </div>
                <span
                  className={`mt-1.5 text-xs font-medium hidden sm:block ${
                    step >= s.num ? "text-slate-900" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {idx < 3 && (
                <div
                  className={`mx-2 h-0.5 flex-1 transition-colors ${
                    step > s.num ? "bg-teal-600" : "bg-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {submitError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-semibold">Booking Conflict or Error</h4>
            <p className="mt-0.5 text-rose-700">{submitError}</p>
          </div>
        </div>
      )}

      {/* STEP 1: SELECT SERVICE */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center md:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Step 1: Choose an Appointment Service
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Select the consultation, aesthetic treatment, or private session you wish to reserve.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => handleSelectService(service)}
                className={`group relative cursor-pointer rounded-xl border p-5 transition-all hover:shadow-md ${
                  selectedService?.id === service.id
                    ? "border-teal-600 bg-teal-50/30 ring-2 ring-teal-600/20"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-700">
                      {service.category}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors">
                      {service.name}
                    </h3>
                  </div>
                  <span className="text-lg font-black text-slate-900">
                    {formatCurrency(service.price)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {service.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-teal-600" />
                    {formatDuration(service.duration_minutes)}
                  </span>
                  <span className="font-semibold text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                    Select <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: SELECT DATE & TIME SLOT */}
      {step === 2 && selectedService && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Step 2 of 4
              </span>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Select Date & Available Slot
              </h2>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-700">
              <span className="font-semibold">{selectedService.name}</span>
              <span>•</span>
              <span>{formatDuration(selectedService.duration_minutes)}</span>
              <span>•</span>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-teal-700 hover:underline font-bold"
              >
                Change
              </button>
            </div>
          </div>

          {/* Quick Date Selector Horizontal Carousel */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Available Dates (Next 14 Days)
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {getNextDays().map((d) => (
                <button
                  key={d.dateStr}
                  type="button"
                  onClick={() => setSelectedDate(d.dateStr)}
                  className={`flex flex-col items-center justify-center min-w-[76px] rounded-xl border p-3 text-center transition-all ${
                    selectedDate === d.dateStr
                      ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-[11px] uppercase font-semibold">
                    {d.dayName}
                  </span>
                  <span className="text-sm font-bold mt-0.5">{d.dayNumber}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Time Slots Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedDate ? formatDate(selectedDate) : "Select a date"}
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Timezone: <strong>{BUSINESS_CONFIG.timezone}</strong>
              </span>
            </div>

            {loadingAvailability ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
                <p className="mt-3 text-xs font-medium text-slate-500">
                  Calculating available slots with real-time concurrency check...
                </p>
              </div>
            ) : availability?.is_closed ? (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                  <Clock className="h-6 w-6" />
                </div>
                <h4 className="mt-3 text-sm font-bold text-slate-800">
                  Closed on this day
                </h4>
                <p className="mt-1 text-xs text-slate-500">
                  The studio is closed on this day of the week. Please select another date.
                </p>
              </div>
            ) : availability?.slots && availability.slots.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {availability.slots.map((slot) => {
                    const isSelected = selectedSlot?.start_time === slot.start_time;
                    return (
                      <button
                        key={slot.start_time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => handleSelectSlot(slot)}
                        title={slot.conflict_reason || "Available"}
                        className={`flex flex-col items-center justify-center rounded-lg border py-3 px-2 text-xs font-medium transition-all ${
                          !slot.available
                            ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed line-through"
                            : isSelected
                            ? "border-teal-600 bg-teal-50 text-teal-900 font-bold ring-2 ring-teal-600 shadow-sm"
                            : "border-slate-200 bg-white text-slate-800 hover:border-teal-500 hover:bg-teal-50/40"
                        }`}
                      >
                        <span className="text-sm font-semibold">
                          {slot.display_time}
                        </span>
                        <span className="text-[10px] mt-0.5 opacity-75">
                          {slot.available ? "Available" : "Reserved"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 pt-2 text-[11px] text-slate-500 border-t border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    Available
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-slate-300"></span>
                    Reserved / Conflict
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-teal-600"></span>
                    Selected
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500">
                No appointment slots available on this date.
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Services
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!selectedSlot}
              onClick={() => setStep(3)}
            >
              Continue to Details <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: CUSTOMER CONTACT DETAILS */}
      {step === 3 && selectedService && selectedSlot && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Step 3 of 4
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Client & Contact Details
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Please enter your contact information so we can coordinate your appointment and confirm your request.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                placeholder="e.g. Alexandra Sterling"
                required
                {...register("customer_name")}
                error={errors.customer_name?.message}
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. alexandra@example.com"
                required
                {...register("customer_email")}
                error={errors.customer_email?.message}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. +1 (555) 234-5678"
                required
                {...register("customer_phone")}
                error={errors.customer_phone?.message}
              />
              <div className="text-xs text-slate-500 pt-7 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-teal-600 shrink-0" />
                <span>We respect your privacy. Zero spam or unauthorized contact.</span>
              </div>
            </div>

            <Textarea
              label="Special Notes or Requests (Optional)"
              placeholder="Provide any preliminary requirements, preferences, or specific goals for this session..."
              rows={3}
              {...register("customer_notes")}
              error={errors.customer_notes?.message}
            />
          </div>

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(2)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Date & Time
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={async () => {
                // Validate form fields for step 3
                const values = watch();
                const parseName = bookingFormSchema.shape.customer_name.safeParse(
                  values.customer_name
                );
                const parseEmail = bookingFormSchema.shape.customer_email.safeParse(
                  values.customer_email
                );
                const parsePhone = bookingFormSchema.shape.customer_phone.safeParse(
                  values.customer_phone
                );

                if (!parseName.success || !parseEmail.success || !parsePhone.success) {
                  // Trigger standard handleSubmit to display field errors
                  handleSubmit(() => {})().catch(() => {});
                  return;
                }
                setStep(4);
              }}
            >
              Review Booking Request <ArrowRight className="h-4 w-4 ml-1.5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SUBMIT */}
      {step === 4 && selectedService && selectedSlot && (
        <div className="space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Step 4 of 4
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Review & Submit Booking Request
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Confirm your booking parameters. Upon submission, an initial <strong>Pending</strong> reservation will be recorded atomically.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Service & Time Summary */}
            <div className="md:col-span-2 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                      {selectedService.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      {selectedService.name}
                    </h3>
                  </div>
                  <Badge variant="teal">Demo Portfolio Mode</Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-2.5">
                    <CalendarIcon className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">Date & Time</p>
                      <p className="text-xs text-slate-600">
                        {formatDateTime(selectedSlot.start_time)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Timezone: {BUSINESS_CONFIG.timezone}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-semibold text-slate-800">Duration</p>
                      <p className="text-xs text-slate-600">
                        {formatDuration(selectedService.duration_minutes)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Client info summary */}
                <div className="border-t border-slate-100 pt-4 space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Client Details
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700">
                    <div>
                      <span className="text-slate-400 block">Name</span>
                      <span className="font-semibold">{watch("customer_name")}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Email</span>
                      <span className="font-semibold">{watch("customer_email")}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Phone</span>
                      <span className="font-semibold">{watch("customer_phone")}</span>
                    </div>
                  </div>
                  {watch("customer_notes") && (
                    <div className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      <span className="font-semibold text-slate-700 block mb-0.5">
                        Notes:
                      </span>
                      {watch("customer_notes")}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Note Banner */}
              <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-800 flex items-start gap-2.5">
                <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Database Integrity Policy:</strong>
                  <p className="mt-0.5 leading-relaxed">
                    Per operational standards, all appointment requests are registered with an initial status of <strong>Pending</strong>. You will receive an immediate unique Booking Reference to monitor approval status.
                  </p>
                </div>
              </div>
            </div>

            {/* Price & Submission Card */}
            <div>
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3">
                  Summary & Pricing
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Service Fee</span>
                    <span>{formatCurrency(selectedService.price)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Platform Demo Booking</span>
                    <span className="text-teal-700 font-semibold">$0.00</span>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between font-bold text-slate-900 text-base">
                    <span>Total Due</span>
                    <span className="text-teal-700">
                      {formatCurrency(selectedService.price)}
                    </span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    onClick={handleSubmit(onSubmitBooking)}
                    className="w-full text-base shadow-md"
                  >
                    Confirm & Submit Booking
                  </Button>
                </div>

                <p className="text-[11px] text-center text-slate-400">
                  By submitting, you agree to our booking policies and cancellation terms.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-start pt-2">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setStep(3)}
            >
              <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to Details
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
