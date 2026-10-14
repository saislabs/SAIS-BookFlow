"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BUSINESS_CONFIG } from "@/config/business";
import { Calendar, Menu, X, Shield, Clock, Compass } from "lucide-react";
import { Button } from "./ui/button";

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    // Admin header handled separately in admin layout
    return null;
  }

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/services", label: "Services & Pricing" },
    { href: "/book", label: "Book Appointment" },
    { href: "/booking-status", label: "Check Status" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      {/* Top Banner Notice */}
      <div className="bg-slate-900 py-1.5 px-4 text-center text-xs text-slate-200 flex items-center justify-center gap-2">
        <span className="inline-block h-2 w-2 rounded-full bg-teal-400 animate-pulse"></span>
        <span>
          <strong>SAIS BookFlow Demo</strong> • Production-Ready Concurrency
          Architecture • Timezone: <strong>{BUSINESS_CONFIG.timezone}</strong>
        </span>
        <Link
          href="/admin/login"
          className="ml-3 underline hover:text-white inline-flex items-center gap-1 font-semibold text-teal-300"
        >
          <Shield className="w-3 h-3" /> Admin Portal
        </Link>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/30">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-slate-900">
              SAIS <span className="text-teal-600">BookFlow</span>
            </span>
            <span className="block text-[10px] uppercase font-bold tracking-widest text-slate-400 -mt-1">
              by SAIS Labs
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-slate-600">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-3.5 py-1.5 rounded-lg transition-colors hover:text-slate-900 hover:bg-slate-50",
                  isActive &&
                    "text-teal-700 bg-teal-50/70 font-semibold hover:text-teal-800"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Action Button & Admin Link */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/book">
            <Button size="sm" variant="primary" className="shadow-sm">
              Schedule Now
            </Button>
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 bg-white px-4 py-4 md:hidden animate-fade-in shadow-lg">
          <div className="flex flex-col space-y-2">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-700 font-semibold"
                      : "text-slate-700 hover:bg-slate-50"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <Link
                href="/book"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button size="md" variant="primary" className="w-full">
                  Book Appointment
                </Button>
              </Link>
              <Link
                href="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" /> Admin Secure Sign In
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
