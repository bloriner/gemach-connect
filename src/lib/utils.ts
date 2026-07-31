import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const CATEGORIES = [
  { id: "baby", label: "Baby & Kids", icon: "🍼", gradient: "from-pink-400 to-rose-500", chip: "bg-pink-50 text-pink-700" },
  { id: "medical", label: "Medical Equipment", icon: "🩺", gradient: "from-red-400 to-red-600", chip: "bg-red-50 text-red-700" },
  { id: "simcha", label: "Simcha & Gowns", icon: "👰", gradient: "from-purple-400 to-violet-500", chip: "bg-purple-50 text-purple-700" },
  { id: "clothing", label: "Clothing", icon: "👕", gradient: "from-indigo-400 to-blue-500", chip: "bg-indigo-50 text-indigo-700" },
  { id: "food", label: "Food & Meals", icon: "🍲", gradient: "from-amber-400 to-orange-500", chip: "bg-amber-50 text-amber-700" },
  { id: "furniture", label: "Furniture", icon: "🛋️", gradient: "from-emerald-400 to-green-600", chip: "bg-emerald-50 text-emerald-700" },
  { id: "seforim", label: "Seforim & Books", icon: "📚", gradient: "from-sky-400 to-cyan-600", chip: "bg-sky-50 text-sky-700" },
  { id: "party", label: "Party & Events", icon: "🎉", gradient: "from-yellow-400 to-yellow-600", chip: "bg-yellow-50 text-yellow-700" },
  { id: "household", label: "Household", icon: "🏠", gradient: "from-teal-400 to-teal-600", chip: "bg-teal-50 text-teal-700" },
  { id: "loan", label: "Free Loan Fund", icon: "💵", gradient: "from-green-400 to-emerald-600", chip: "bg-green-50 text-green-700" },
  { id: "tools", label: "Tools & Equipment", icon: "🔧", gradient: "from-gray-400 to-gray-600", chip: "bg-gray-50 text-gray-700" },
  { id: "bikur", label: "Bikur Cholim", icon: "💙", gradient: "from-blue-400 to-blue-600", chip: "bg-blue-50 text-blue-700" },
] as const;

export const STATES = ["NY", "NJ", "CA", "FL", "IL", "MD", "PA", "OH", "MI", "MA", "TX", "ON", "QC"] as const;

export function catOf(id: string) {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES[CATEGORIES.length - 1];
}

export function isOpenNow(hoursJson: string): boolean {
  try {
    const hours: { day: number; open: string; close: string; closed: boolean }[] = JSON.parse(hoursJson);
    const now = new Date();
    const day = now.getDay();
    const time = now.getHours() * 60 + now.getMinutes();

    const today = hours.find((h) => h.day === day);
    if (!today || today.closed) return false;

    const [oh, om] = today.open.split(":").map(Number);
    const [ch, cm] = today.close.split(":").map(Number);
    const openMin = oh * 60 + om;
    const closeMin = ch * 60 + cm;

    return time >= openMin && time < closeMin;
  } catch {
    return false;
  }
}
