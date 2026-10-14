import React from "react";
import Link from "next/link";
import { BUSINESS_CONFIG } from "@/config/business";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { db } from "@/lib/db";
import {
  Calendar,
  ShieldCheck,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Users,
  Layers,
  Lock,
  ChevronRight,
  Scissors,
  Camera,
  GraduationCap,
  Briefcase,
  PartyPopper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function HomePage() {
  const services = await db.getActiveServices();

  const verticals = [
    {
      icon: Briefcase,
      title: "Consultants & Strategists",
      desc: "Executive 1-on-1 strategy sessions, roadmapping, and advisory meetings with zero double-booking risk.",
    },
    {
      icon: Scissors,
      title: "Salons & Aesthetics",
      desc: "Color treatments, precision cuts, and wellness appointments with dynamic buffer management.",
    },
    {
      icon: Camera,
      title: "Photographers & Creators",
      desc: "Editorial portraits, fashion shoots, and studio sessions with clear duration and location specs.",
    },
    {
      icon: GraduationCap,
      title: "Private Tutors & Coaches",
      desc: "Academic diagnostic coaching, SAT prep, and instrument lessons with automated scheduling.",
    },
    {
      icon: PartyPopper,
      title: "Event Planners & Venues",
      desc: "Comprehensive gala consultations, site walkthroughs, and vendor coordination meetings.",
    },
  ];

  return (
    <div className="flex flex-col">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-white border-b border-slate-200/80 pt-16 pb-20 md:pt-24 md:pb-28 bg-hero-pattern">
        <div className="absolute inset-0 bg-subtle-glow pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50/80 px-4 py-1.5 text-xs font-semibold text-teal-800 shadow-sm">
              <Sparkles className="h-3.5 w-3.5 text-teal-600" />
              <span>International-Grade Appointment Engine</span>
              <span className="text-teal-400">•</span>
              <span className="text-teal-600 font-bold">SAIS Labs</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl sm:leading-[1.1]">
              Flawless Scheduling. <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-800">
                Zero Double-Bookings.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
              A high-precision booking platform built for salons, photographers,
              consultants, tutors, and event planners. Powered by atomic
              PostgreSQL concurrency guarantees and real-time slot intelligence.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link href="/book" className="w-full sm:w-auto">
                <Button size="lg" variant="primary" className="w-full sm:w-auto text-base shadow-md">
                  Book an Appointment <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/services" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-base">
                  Explore Services & Rates
                </Button>
              </Link>
            </div>

            {/* Feature Bullets */}
            <div className="pt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-teal-600" />
                <span>PostgreSQL Exclusion Constraint</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-teal-600" />
                <span>Configurable Timezone & Currency</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-teal-600" />
                <span>Secure Admin Verification</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SUPPORTED VERTICALS */}
      <section className="py-16 bg-[#FAFAFA] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold uppercase tracking-widest text-teal-700">
              Versatile Multi-Vertical Platform
            </h2>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight sm:text-3xl mt-1">
              Engineered for Service Professionals
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Tailored appointment experiences whether you run a private boutique, an executive consultancy, or a creative studio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {verticals.map((vert, idx) => {
              const IconComp = vert.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-sm hover:border-teal-500/50 hover:shadow-md transition-all group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                    <IconComp className="h-5 w-5" />
                  </div>
                  <h4 className="mt-4 text-sm font-bold text-slate-900">
                    {vert.title}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                    {vert.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FEATURED SERVICES PREVIEW */}
      <section className="py-20 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
                Premium Catalog
              </span>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
                Featured Sample Offerings
              </h2>
              <p className="mt-1 text-sm text-slate-500 max-w-xl">
                Select any service to experience real-time availability calculations and atomic booking confirmation.
              </p>
            </div>
            <Link href="/services" className="mt-4 md:mt-0">
              <Button variant="outline" size="sm">
                View All Services <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {services.slice(0, 3).map((service) => (
              <div
                key={service.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-slate-300 transition-all hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Badge variant="teal">{service.category}</Badge>
                    <span className="text-xl font-black text-slate-900">
                      {formatCurrency(service.price)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">
                    {service.name}
                  </h3>
                  <p className="mt-2 text-xs text-slate-500 line-clamp-3 leading-relaxed">
                    {service.description}
                  </p>
                </div>

                <div className="mt-6 border-t border-slate-100 pt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Clock className="h-4 w-4 text-teal-600" />
                    <span>{formatDuration(service.duration_minutes)}</span>
                  </div>
                  <Link href={`/book?service=${service.id}`}>
                    <Button size="sm" variant="primary">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 bg-[#FAFAFA] border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-teal-700">
              Client Experience
            </h2>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight mt-1">
              How Booking Works
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              A streamlined 4-step scheduling flow crafted with zero friction and enterprise-grade reliability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                step: "01",
                title: "Select Service",
                desc: "Choose from customized consultations, creative sessions, or aesthetic procedures with transparent pricing.",
              },
              {
                step: "02",
                title: "Pick Date & Slot",
                desc: "Live calendar displays real-time available time slots filtered against business hours and blackout periods.",
              },
              {
                step: "03",
                title: "Enter Details",
                desc: "Provide your name, contact phone, email, and any special notes or preparatory requirements.",
              },
              {
                step: "04",
                title: "Track Status",
                desc: "Instantly receive a unique booking reference (e.g. BF-7K9M2P) and track pending or confirmed status in real time.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative space-y-3">
                <span className="text-4xl font-black text-teal-600/30 font-mono">
                  {item.step}
                </span>
                <h4 className="text-base font-bold text-slate-900">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ARCHITECTURE INTEGRITY CALLOUT */}
      <section className="py-16 bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            <div className="lg:col-span-2 space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-teal-900/60 border border-teal-500/30 px-3 py-1 text-xs text-teal-300 font-semibold">
                <ShieldCheck className="h-4 w-4" />
                <span>Enterprise Technical Guarantee</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Concurrency Protection via PostgreSQL Exclusion Constraints
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
                Unlike typical booking templates that merely check slots on client render, SAIS BookFlow enforces a database-level exclusion constraint (`tstzrange` with `btree_gist`). Even if two visitors click submit at the exact same millisecond, the database engine enforces atomicity and rejects the conflicting duplicate.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <Link href="/book">
                <Button size="lg" variant="primary" className="w-full">
                  Try Live Booking Flow
                </Button>
              </Link>
              <Link href="/admin/login">
                <Button size="lg" variant="outline" className="w-full text-slate-900 bg-white hover:bg-slate-100">
                  Access Admin Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
