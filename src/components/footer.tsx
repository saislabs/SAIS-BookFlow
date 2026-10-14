import React from "react";
import Link from "next/link";
import { BUSINESS_CONFIG } from "@/config/business";
import { Calendar, Shield, MapPin, Mail, Phone, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand info */}
          <div className="space-y-4 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/30">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-lg font-black tracking-tight text-slate-900">
                  SAIS <span className="text-teal-600">BookFlow</span>
                </span>
                <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
                  Engineered by SAIS Labs
                </span>
              </div>
            </Link>
            <p className="max-w-md text-sm text-slate-600 leading-relaxed">
              {BUSINESS_CONFIG.description}
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Shield className="h-4 w-4 text-teal-600" />
              <span>
                Atomic PostgreSQL concurrency engine • 100% Zero double-bookings guarantee
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Navigation
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link href="/" className="hover:text-teal-700 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/services"
                  className="hover:text-teal-700 transition-colors"
                >
                  Services & Pricing
                </Link>
              </li>
              <li>
                <Link href="/book" className="hover:text-teal-700 transition-colors">
                  Book an Appointment
                </Link>
              </li>
              <li>
                <Link
                  href="/booking-status"
                  className="hover:text-teal-700 transition-colors"
                >
                  Lookup Booking Status
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-teal-700 transition-colors"
                >
                  Contact & Location
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Studio & Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                <span>{BUSINESS_CONFIG.address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-teal-600 shrink-0" />
                <a
                  href={`mailto:${BUSINESS_CONFIG.email}`}
                  className="hover:text-teal-700 transition-colors"
                >
                  {BUSINESS_CONFIG.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-teal-600 shrink-0" />
                <span>{BUSINESS_CONFIG.phone}</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-teal-600 shrink-0" />
                <span>Timezone: {BUSINESS_CONFIG.timezone}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-slate-200/80 pt-6 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>
            © {new Date().getFullYear()} {BUSINESS_CONFIG.name} — A portfolio demo
            by SAIS Labs. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/admin/login"
              className="text-slate-500 hover:text-slate-900 font-medium transition-colors"
            >
              Admin Sign In
            </Link>
            <span className="text-slate-300">•</span>
            <span>Currency: {BUSINESS_CONFIG.currency} ({BUSINESS_CONFIG.currencySymbol})</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
