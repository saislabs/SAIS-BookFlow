import { z } from "zod";

export const bookingFormSchema = z.object({
  service_id: z.string().min(1, "Please select a service"),
  start_time: z.string().min(1, "Please select an appointment time slot"),
  customer_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name is too long"),
  customer_email: z.string().email("Please enter a valid email address"),
  customer_phone: z
    .string()
    .min(7, "Please enter a valid phone number")
    .max(25, "Phone number is too long"),
  customer_notes: z
    .string()
    .max(500, "Notes cannot exceed 500 characters")
    .optional()
    .or(z.literal("")),
});

export type BookingFormValues = z.infer<typeof bookingFormSchema>;

export const availabilityQuerySchema = z.object({
  service_id: z.string().min(1, "Service ID is required"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be formatted as YYYY-MM-DD"),
});

export const serviceFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug must only contain lowercase letters, numbers, and hyphens"),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  duration_minutes: z.coerce
    .number()
    .int()
    .min(10, "Duration must be at least 10 minutes")
    .max(480, "Duration cannot exceed 8 hours"),
  price: z.coerce.number().min(0, "Price must be greater than or equal to 0"),
  currency: z.string().default("USD"),
  image_url: z.string().url("Must be a valid image URL").optional().or(z.literal("")),
  is_active: z.boolean().default(true),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export const rescheduleSchema = z.object({
  start_time: z.string().min(1, "New start time is required"),
  reason: z.string().max(300).optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum(["Pending", "Confirmed", "Rejected", "Cancelled", "Completed"]),
  note: z.string().max(300).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const businessHoursItemSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  open_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  close_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  is_closed: z.boolean(),
});

export const blockedPeriodSchema = z.object({
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  reason: z.string().min(2, "Reason is required").max(200),
});
