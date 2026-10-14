export interface BusinessConfig {
  name: string;
  tagline: string;
  description: string;
  email: string;
  phone: string;
  address: string;
  timezone: string;
  currency: string;
  currencySymbol: string;
  slotIntervalMinutes: number;
  bufferMinutes: number;
  leadTimeHours: number; // minimum hours in advance to book
  maxAdvanceDays: number; // maximum days in advance to book
  websiteUrl: string;
  socials: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export const BUSINESS_CONFIG: BusinessConfig = {
  name: process.env.NEXT_PUBLIC_BUSINESS_NAME || "SAIS BookFlow",
  tagline: "High-Performance Appointment Intelligence & Scheduling for Modern Enterprises",
  description:
    "A premier appointment booking platform crafted by SAIS Labs for top-tier salons, photographers, tutors, consultants, and event planners.",
  email: "hello@saislabs.com",
  phone: "+1 (800) 555-SAIS",
  address: "One World Trade Center, Suite 8500, New York, NY 10007",
  timezone: process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || "America/New_York",
  currency: process.env.NEXT_PUBLIC_BUSINESS_CURRENCY || "USD",
  currencySymbol: process.env.NEXT_PUBLIC_BUSINESS_CURRENCY_SYMBOL || "$",
  slotIntervalMinutes: 30,
  bufferMinutes: 15,
  leadTimeHours: 2,
  maxAdvanceDays: 60,
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  socials: {
    twitter: "https://twitter.com/saislabs",
    linkedin: "https://linkedin.com/company/saislabs",
    instagram: "https://instagram.com/saislabs",
  },
};

export const SERVICE_CATEGORIES = [
  { id: "all", label: "All Services" },
  { id: "consulting", label: "Consulting & Strategy" },
  { id: "creative", label: "Creative & Photography" },
  { id: "salon", label: "Salons & Aesthetics" },
  { id: "tutoring", label: "Tutoring & Coaching" },
  { id: "events", label: "Event Planning" },
] as const;
