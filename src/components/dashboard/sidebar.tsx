"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Truck,
  FileText,
  Settings,
  MapPin,
  Calculator,
  Calendar,
  TrendingUp,
  DollarSign,
} from "lucide-react";

const navigation = [
  { section: "Operations", items: [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Orders", href: "/orders", icon: ClipboardList },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Crews", href: "/crews", icon: Users },
    { name: "Field Tracking", href: "/field", icon: MapPin },
  ]},
  { section: "Finance", items: [
    { name: "Accounting", href: "/accounting", icon: Calculator },
    { name: "Invoicing", href: "/invoicing", icon: FileText },
    { name: "Expenses", href: "/expenses", icon: DollarSign },
    { name: "Reports", href: "/reports", icon: TrendingUp },
  ]},
  { section: "System", items: [
    { name: "Settings", href: "/settings", icon: Settings },
  ]},
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white overflow-y-auto">
      <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-6">
        <Truck className="h-7 w-7 text-brand-600" />
        <span className="text-lg font-bold text-slate-900">FieldService Pro</span>
      </div>
      <nav className="mt-4 space-y-6 px-3 pb-8">
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
    </aside>
  );
}
