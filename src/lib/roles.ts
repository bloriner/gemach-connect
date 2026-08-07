import { type UserRole } from "@/lib/utils";
export type { UserRole };

// ── Role → Allowed Navigation Hrefs ─────────────────────
export const ROLE_NAV: Record<UserRole, string[]> = {
  ADMIN: [
    "/dashboard", "/orders", "/quotes", "/agreements", "/price-book", "/calendar",
    "/dispatch", "/customers", "/crews", "/field", "/tracking",
    "/accounting", "/invoicing", "/expenses", "/reports",
    "/equipment", "/hr",
    "/settings",
  ],
  OFFICE_STAFF: [
    "/dashboard", "/orders", "/quotes", "/agreements", "/price-book", "/calendar",
    "/dispatch", "/customers",
    "/invoicing", "/expenses", "/reports",
    "/equipment", "/hr",
    "/settings",
  ],
  CREW_LEAD: [
    "/dashboard", "/field", "/tracking", "/equipment", "/dispatch",
  ],
  CREW_MEMBER: [
    "/dashboard", "/field",
  ],
};

// ── Role → Allowed API Route Prefixes ───────────────────
export const ROLE_API_ACCESS: Record<UserRole, string[]> = {
  ADMIN: ["/api/"],
  OFFICE_STAFF: [
    "/api/orders", "/api/quotes", "/api/agreements", "/api/invoice",
    "/api/customers", "/api/expenses", "/api/reports", "/api/price-book",
    "/api/equipment", "/api/signature-documents", "/api/upload",
    "/api/portal/", "/api/dispatch/board",
  ],
  CREW_LEAD: [
    "/api/field/", "/api/crew/", "/api/fleet/", "/api/equipment/",
    "/api/dispatch/board", "/api/time-entries", "/api/upload",
    "/api/orders/active",
  ],
  CREW_MEMBER: [
    "/api/field/", "/api/crew/location", "/api/time-entries", "/api/upload",
  ],
};

// ── Helpers ─────────────────────────────────────────────
export function isNavAllowed(role: string | undefined, href: string): boolean {
  if (!role) return false;
  const allowed = ROLE_NAV[role as UserRole];
  if (!allowed) return false;
  return allowed.some((path) => href === path || href.startsWith(path + "/"));
}

export function isApiAllowed(role: string | undefined, pathname: string): boolean {
  if (!role) return false;
  const allowed = ROLE_API_ACCESS[role as UserRole];
  if (!allowed) return false;
  return allowed.some((prefix) => pathname.startsWith(prefix));
}

export function getDefaultRoute(role: string | undefined): string {
  if (!role) return "/";
  const allowed = ROLE_NAV[role as UserRole];
  return allowed?.[0] ?? "/dashboard";
}

// ── Role labels & colors for badges ─────────────────────
export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: "Admin",
  OFFICE_STAFF: "Office",
  CREW_LEAD: "Lead Tech",
  CREW_MEMBER: "Technician",
};

export const ROLE_COLOR: Record<UserRole, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  OFFICE_STAFF: "bg-blue-100 text-blue-700",
  CREW_LEAD: "bg-amber-100 text-amber-700",
  CREW_MEMBER: "bg-green-100 text-green-700",
};
