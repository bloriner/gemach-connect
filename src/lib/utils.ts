import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export const ORDER_STATUSES = [
  "PENDING",
  "DISPATCHED",
  "EN_ROUTE",
  "ON_SITE",
  "COMPLETED",
  "INVOICED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  DISPATCHED: "bg-blue-100 text-blue-800",
  EN_ROUTE: "bg-indigo-100 text-indigo-800",
  ON_SITE: "bg-purple-100 text-purple-800",
  COMPLETED: "bg-green-100 text-green-800",
  INVOICED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export const USER_ROLES = [
  "ADMIN",
  "OFFICE_STAFF",
  "CREW_LEAD",
  "CREW_MEMBER",
] as const;

export type UserRole = (typeof USER_ROLES)[number];
