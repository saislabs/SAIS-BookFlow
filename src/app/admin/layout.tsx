"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  CalendarCheck,
  Settings,
  Clock,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Calendar,
  Layers,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) {
      setCheckingAuth(false);
      return;
    }

    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/auth/me");
        if (!res.ok) {
          router.push("/admin/login");
        } else {
          setCheckingAuth(false);
        }
      } catch (err) {
        router.push("/admin/login");
      }
    }
    checkAuth();
  }, [isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (checkingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAFAFA]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      </div>
    );
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/appointments", label: "Appointments", icon: CalendarCheck },
    { href: "/admin/services", label: "Services & Rates", icon: Layers },
    { href: "/admin/availability", label: "Availability Settings", icon: Clock },
  ];

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
      router.push("/admin/login");
    } catch (err) {
      router.push("/admin/login");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-600 text-white">
            <Calendar className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-slate-900">
            BookFlow <span className="text-teal-600">Admin</span>
          </span>
        </Link>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="rounded p-1.5 text-slate-600 hover:bg-slate-100"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Sidebar for Desktop */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-5 flex flex-col justify-between transition-transform md:static md:translate-x-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-slate-900 block">
                  BookFlow <span className="text-teal-600">Admin</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block -mt-0.5">
                  SAIS Labs Console
                </span>
              </div>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="md:hidden text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3.5 py-2.5 text-xs font-semibold transition-colors",
                    isActive
                      ? "bg-teal-50 text-teal-800"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-4 w-4",
                      isActive ? "text-teal-600" : "text-slate-400"
                    )}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info & Logout */}
        <div className="space-y-3 pt-6 border-t border-slate-100">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ExternalLink className="h-3.5 w-3.5" /> Public Website
            </span>
          </Link>

          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600 border border-slate-100 flex items-center justify-between">
            <div className="truncate">
              <span className="block font-bold text-slate-900 truncate">
                Admin Session
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                admin@saisbookflow.com
              </span>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="text-slate-400 hover:text-rose-600 transition-colors p-1"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
