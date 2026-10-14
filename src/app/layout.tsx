import type { Metadata } from "next";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { BUSINESS_CONFIG } from "@/config/business";
import "./globals.css";

export const metadata: Metadata = {
  title: `${BUSINESS_CONFIG.name} — Appointment Booking Intelligence`,
  description: BUSINESS_CONFIG.description,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased scroll-smooth">
      <body className="flex min-h-full flex-col bg-[#FAFAFA] text-slate-900 font-sans selection:bg-teal-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
