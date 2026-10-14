"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Service } from "@/lib/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/config/business";
import { Clock, Search, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    async function loadServices() {
      try {
        const res = await fetch("/api/services");
        const data = await res.json();
        if (data.services) {
          setServices(data.services);
        }
      } catch (err) {
        console.error("Failed to fetch services:", err);
      } finally {
        setLoading(false);
      }
    }
    loadServices();
  }, []);

  const filteredServices = services.filter((s) => {
    const matchesCategory =
      selectedCategory === "all" || s.category.toLowerCase() === selectedCategory;
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="py-12 md:py-16 bg-[#FAFAFA]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Service Catalog
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-1">
            Available Services & Consultations
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Transparent pricing, clear session durations, and instant atomic booking confirmation. Select a service to check available appointment dates.
          </p>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? "bg-teal-600 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-4 text-xs text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Services List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl border border-slate-200 bg-white p-6 animate-pulse"
              >
                <div className="h-4 w-20 bg-slate-200 rounded mb-4" />
                <div className="h-6 w-3/4 bg-slate-200 rounded mb-2" />
                <div className="h-16 w-full bg-slate-100 rounded mb-6" />
                <div className="h-10 w-full bg-slate-200 rounded mt-auto" />
              </div>
            ))}
          </div>
        ) : filteredServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
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
                      Book Service <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-700">
              No services match your criteria.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your category selection or clear your search term.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
