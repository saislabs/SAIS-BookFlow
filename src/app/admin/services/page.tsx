"use client";

import React, { useState, useEffect } from "react";
import { Service } from "@/lib/types";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { SERVICE_CATEGORIES } from "@/config/business";
import {
  Layers,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea } from "@/components/ui/input";

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("consulting");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [price, setPrice] = useState(150);
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/services?all=true");
      const data = await res.json();
      if (res.ok) {
        setServices(data.services || []);
      }
    } catch (err) {
      console.error("Failed to fetch services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreate = () => {
    setEditingService(null);
    setName("");
    setSlug("");
    setCategory("consulting");
    setDescription("");
    setDurationMinutes(60);
    setPrice(150);
    setIsActive(true);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (s: Service) => {
    setEditingService(s);
    setName(s.name);
    setSlug(s.slug);
    setCategory(s.category);
    setDescription(s.description);
    setDurationMinutes(s.duration_minutes);
    setPrice(s.price);
    setIsActive(s.is_active);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!editingService) {
      // Auto-generate slug from name
      const generatedSlug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
      setSlug(generatedSlug);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    const payload = {
      name,
      slug,
      category,
      description,
      duration_minutes: Number(durationMinutes),
      price: Number(price),
      currency: "USD",
      is_active: isActive,
    };

    try {
      if (editingService) {
        // Update
        const res = await fetch(`/api/services/${editingService.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update service");
      } else {
        // Create
        const res = await fetch("/api/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create service");
      }

      setIsModalOpen(false);
      await fetchServices();
    } catch (err: any) {
      setFormError(err.message || "Operation failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchServices();
      }
    } catch (err) {
      console.error("Failed to delete service:", err);
    }
  };

  const handleToggleActive = async (s: Service) => {
    try {
      const res = await fetch(`/api/services/${s.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !s.is_active }),
      });
      if (res.ok) {
        await fetchServices();
      }
    } catch (err) {
      console.error("Toggle active state failed:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700">
            Offerings Catalog
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 mt-0.5">
            Services & Pricing Management
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchServices} isLoading={loading}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
          </Button>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1.5" /> Add New Service
          </Button>
        </div>
      </div>

      {/* Services Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent mx-auto" />
            <p className="mt-3 text-xs text-slate-500">Loading service catalog...</p>
          </div>
        ) : services.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Service Name</th>
                  <th className="py-3.5 px-4 font-semibold">Category</th>
                  <th className="py-3.5 px-4 font-semibold">Duration</th>
                  <th className="py-3.5 px-4 font-semibold">Price</th>
                  <th className="py-3.5 px-4 font-semibold">Status</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-slate-900 block">
                        {s.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        /{s.slug}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="teal">{s.category}</Badge>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-teal-600" />
                        <span>{formatDuration(s.duration_minutes)}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatCurrency(s.price)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(s)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border transition-colors ${
                          s.is_active
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-500 border-slate-200"
                        }`}
                      >
                        {s.is_active ? (
                          <>
                            <CheckCircle2 className="h-3 w-3" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3" /> Inactive
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEdit(s)}
                        >
                          <Edit2 className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-16 text-center text-xs text-slate-500">
            No services configured. Click &ldquo;Add New Service&rdquo; above.
          </div>
        )}
      </div>

      {/* CREATE / EDIT SERVICE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingService ? "Edit Service" : "Add New Service"}
        description="Configure pricing, duration, and service details for public scheduling."
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-800 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Service Name"
              placeholder="e.g. Masterclass Hair Styling"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
            <Input
              label="URL Slug"
              placeholder="e.g. masterclass-hair-styling"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1 uppercase text-[11px]">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs bg-white"
              >
                {SERVICE_CATEGORIES.filter((c) => c.id !== "all").map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Duration (Minutes)"
              type="number"
              min={10}
              max={480}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              required
            />

            <Input
              label="Price (USD $)"
              type="number"
              min={0}
              step={5}
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              required
            />
          </div>

          <Textarea
            label="Service Description"
            placeholder="Detailed description of deliverables, methodology, or preparation..."
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            />
            <label htmlFor="isActiveCheck" className="text-slate-800 font-medium">
              Service is Active and visible for public booking
            </label>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
            >
              {editingService ? "Save Changes" : "Create Service"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
