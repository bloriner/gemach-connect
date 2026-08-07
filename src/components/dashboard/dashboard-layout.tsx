"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";
import { Logo } from "@/components/ui/logo";
import { Menu } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/orders": "Orders",
  "/quotes": "Quotes",
  "/calendar": "Calendar",
  "/crews": "Technicians",
  "/field": "Field Tracking",
  "/tracking": "Live Tracking",
  "/accounting": "Accounting",
  "/invoicing": "Invoicing",
  "/expenses": "Expenses",
  "/reports": "Reports",
  "/equipment": "Equipment QR",
  "/hr": "HR",
  "/settings": "Settings",
};

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/");
    return null;
  }

  // Get page title (handles /invoicing/123 style paths)
  const basePath = "/" + (pathname?.split("/").filter(Boolean)[0] ?? "");
  const title = pageTitles[basePath] ?? pageTitles[pathname ?? ""] ?? "Premier Pro";

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <Sidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          onClick={() => setSidebarOpen(true)}
          className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Logo iconOnly className="scale-75" />
        <span className="text-sm font-semibold text-slate-700 truncate">{title}</span>
      </div>

      {/* Main content */}
      <main className="flex-1 p-4 sm:p-6 lg:ml-64 lg:p-8">
        {children}
      </main>
    </div>
  );
}
