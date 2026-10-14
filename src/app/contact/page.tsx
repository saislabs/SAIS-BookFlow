import React from "react";
import { BUSINESS_CONFIG } from "@/config/business";
import { db } from "@/lib/db";
import { MapPin, Mail, Phone, Clock, Send, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";

export const metadata = {
  title: `Contact Us — ${BUSINESS_CONFIG.name}`,
  description: "Get in touch with our scheduling concierge or find our studio locations.",
};

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export default async function ContactPage() {
  const hours = await db.getBusinessHours();

  return (
    <div className="py-12 md:py-16 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mb-12">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Get In Touch
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-1">
            Studio Location & Support
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Have questions about a bespoke arrangement, group reservations, or custom event timelines? Reach our team directly.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details & Business Hours */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Studio Headquarters
              </h2>

              <ul className="space-y-3.5 text-xs text-slate-600">
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                  <span>{BUSINESS_CONFIG.address}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Mail className="h-4 w-4 text-teal-600 shrink-0" />
                  <a
                    href={`mailto:${BUSINESS_CONFIG.email}`}
                    className="hover:text-teal-700 transition-colors"
                  >
                    {BUSINESS_CONFIG.email}
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <Phone className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>{BUSINESS_CONFIG.phone}</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Clock className="h-4 w-4 text-teal-600 shrink-0" />
                  <span>Operating Timezone: {BUSINESS_CONFIG.timezone}</span>
                </li>
              </ul>
            </div>

            {/* Business Hours Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-3">
                Opening Hours
              </h2>

              <div className="mt-3 divide-y divide-slate-100 text-xs">
                {hours.map((h) => (
                  <div
                    key={h.day_of_week}
                    className="flex justify-between py-2 items-center"
                  >
                    <span className="font-semibold text-slate-700">
                      {DAY_NAMES[h.day_of_week]}
                    </span>
                    <span
                      className={
                        h.is_closed ? "text-rose-600 font-semibold" : "text-slate-600"
                      }
                    >
                      {h.is_closed
                        ? "Closed"
                        : `${h.open_time.slice(0, 5)} - ${h.close_time.slice(0, 5)}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-teal-600" />
                <h2 className="text-xl font-bold tracking-tight text-slate-900">
                  Send an Inquiry
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-6">
                Our team responds to all inquiries within 24 business hours.
              </p>

              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Name"
                    placeholder="e.g. Marcus Vance"
                    required
                  />
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="e.g. marcus@example.com"
                    required
                  />
                </div>

                <Input
                  label="Subject"
                  placeholder="e.g. Custom Multi-Day Photography Consultation"
                  required
                />

                <Textarea
                  label="Message"
                  placeholder="Describe your project, timeline, or requirements..."
                  rows={5}
                  required
                />

                <div className="pt-2">
                  <Button type="button" variant="primary" size="md">
                    <Send className="h-4 w-4 mr-2" /> Send Message
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
