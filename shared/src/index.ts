import { z } from "zod";

// Auth
export const LoginSchema = z.object({
  username: z.string().min(1, "Username required"),
  password: z.string().min(6, "Min 6 characters"),
});

// Farmer
export const FarmerSchema = z.object({
  name: z.string().min(1, "Naam zaroori hai"),
  mobile: z.string().regex(/^[6-9]\d{9}$/, "Valid mobile number daalen"),
  code: z.string().min(1, "Code zaroori hai"),
  village: z.string().min(1, "Gaon ka naam daalen"),
});

export const FarmerUpdateSchema = FarmerSchema.partial();

// Milk Entry
export const MilkEntrySchema = z.object({
  farmerId: z.string().uuid(),
  date: z.string().datetime(),
  liters: z.number().positive("Liters positive hona chahiye"),
  fatPercent: z.number().min(0).max(15, "Fat % 0-15 ke beech hona chahiye"),
  shift: z.enum(["MORNING", "EVENING"]).default("MORNING"),
});

export const MilkEntryUpdateSchema = MilkEntrySchema.partial();

// Payment
export const PaymentSchema = z.object({
  farmerId: z.string().uuid(),
  amount: z.number().positive(),
  note: z.string().optional(),
  paidAt: z.string().datetime().optional(),
});

// Types
export type LoginInput = z.infer<typeof LoginSchema>;
export type FarmerInput = z.infer<typeof FarmerSchema>;
export type FarmerUpdateInput = z.infer<typeof FarmerUpdateSchema>;
export type MilkEntryInput = z.infer<typeof MilkEntrySchema>;
export type MilkEntryUpdateInput = z.infer<typeof MilkEntryUpdateSchema>;
export type PaymentInput = z.infer<typeof PaymentSchema>;

// Fat Rate calculation (standard Indian dairy formula)
export function calculateRates(liters: number, fatPercent: number) {
  // Base rate: SNF-based formula commonly used in Rajasthan
  const fatRate = parseFloat((fatPercent * 0.5).toFixed(2)); // ₹ per kg fat
  const snfRate = 6.5; // baseline SNF rate
  const ratePerLiter = parseFloat((fatPercent * 0.33 + snfRate).toFixed(2));
  const totalAmount = parseFloat((liters * ratePerLiter).toFixed(2));
  return { fatRate, ratePerLiter, totalAmount };
}

export interface FarmerType {
  id: string;
  name: string;
  mobile: string;
  code: string;
  village: string;
  createdAt: string;
}

export interface MilkEntryType {
  id: string;
  farmerId: string;
  farmer?: FarmerType;
  date: string;
  liters: number;
  fatPercent: number;
  fatRate: number;
  ratePerLiter: number;
  totalAmount: number;
  shift: "MORNING" | "EVENING";
  createdAt: string;
}

export interface PaymentType {
  id: string;
  farmerId: string;
  farmer?: FarmerType;
  amount: number;
  note?: string;
  paidAt: string;
  createdAt: string;
}

export interface DashboardStats {
  totalFarmers: number;
  todayMilk: number;
  todayAmount: number;
  monthMilk: number;
  monthAmount: number;
  recentEntries: MilkEntryType[];
}
