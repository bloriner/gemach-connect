import type { Metadata } from "next";
import { Truck } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Customer Portal — Premier Pro Services",
  description: "Place orders, check status, and view invoices",
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/portal" className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-brand-600" />
            <span className="text-lg font-bold text-slate-900">Premier Pro</span>
          </Link>
          <span className="text-xs text-slate-400">Customer Portal</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} Premier Pro Services. All rights reserved.
      </footer>
    </div>
  );
}
