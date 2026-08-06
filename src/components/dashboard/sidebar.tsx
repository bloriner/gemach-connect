"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  Settings,
  MapPin,
  Calculator,
  Calendar,
  TrendingUp,
  DollarSign,
  LogOut,
  QrCode,
  UserCheck,
  X,
} from "lucide-react";

const navigation = [
  {
    section: "Operations",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Orders", href: "/orders", icon: ClipboardList },
      { name: "Calendar", href: "/calendar", icon: Calendar },
      { name: "Technicians", href: "/crews", icon: Users },
      { name: "Field Tracking", href: "/field", icon: MapPin },
    ],
  },
  {
    section: "Finance",
    items: [
      { name: "Accounting", href: "/accounting", icon: Calculator },
      { name: "Invoicing", href: "/invoicing", icon: FileText },
      { name: "Expenses", href: "/expenses", icon: DollarSign },
      { name: "Reports", href: "/reports", icon: TrendingUp },
    ],
  },
  {
    section: "Tools",
    items: [
      { name: "Equipment QR", href: "/equipment", icon: QrCode },
      { name: "HR", href: "/hr", icon: UserCheck },
    ],
  },
  {
    section: "System",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <Logo />
        {/* Close button (mobile only) */}
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-4 space-y-6 px-3 pb-8 overflow-y-auto">
        {navigation.map((section) => (
          <div key={section.section}>
            <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {section.section}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-brand-50 text-brand-700"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User */}
      {session?.user && (
        <div className="border-t border-slate-200 px-4 py-4 space-y-3">
          <div className="text-sm">
            <p className="font-medium text-slate-900 truncate">{session.user.name}</p>
            <p className="text-slate-500 truncate text-xs">{session.user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-40 lg:flex lg:w-64 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={onClose}
          />
          {/* Slide-in panel */}
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
