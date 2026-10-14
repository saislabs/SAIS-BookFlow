"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Calendar, Shield, Lock, Mail, ArrowRight, AlertCircle, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      router.push("/admin");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log in.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoFill = () => {
    setEmail("admin@saisbookflow.com");
    setPassword("AdminSecurePass2025!");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAFAFA] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-600/30">
              <Calendar className="h-6 w-6" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">
              SAIS <span className="text-teal-600">BookFlow</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Admin Portal Sign In
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to manage appointments, confirm bookings, and configure business hours.
          </p>
        </div>

        {/* Demo Fast-Access Card */}
        <div className="rounded-xl border border-teal-200 bg-teal-50/70 p-4 text-xs text-teal-900 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Key className="h-4 w-4 text-teal-600 shrink-0" />
            <div>
              <span className="font-bold">Portfolio Reviewer Mode:</span>
              <p className="text-[11px] text-teal-700">Pre-fill standard demo admin credentials</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoFill}
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal-700 transition-colors shrink-0 shadow-sm"
          >
            Fill Demo Credentials
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Login Failed:</span>
              <p className="mt-0.5">{errorMsg}</p>
            </div>
          </div>
        )}

        {/* Login Form */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleLogin} className="space-y-4">
            <Input
              label="Admin Email"
              type="email"
              placeholder="admin@saisbookflow.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                isLoading={isLoading}
                className="w-full text-sm font-semibold shadow"
              >
                Sign In to Dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </div>
          </form>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/"
              className="text-xs text-slate-500 hover:text-teal-700 font-medium transition-colors"
            >
              ← Return to Public Website
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
