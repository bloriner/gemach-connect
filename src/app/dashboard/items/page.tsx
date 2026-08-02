"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  ArrowUpRight,
  Check,
  Clock,
  RotateCcw,
  User,
  Phone,
  Mail,
  ExternalLink,
  QrCode,
  Filter,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";

type Item = {
  id: string;
  name: string;
  description?: string | null;
  qrCode: string;
  status: string;
  borrowerName?: string | null;
  borrowerPhone?: string | null;
  borrowerEmail?: string | null;
  lentAt?: string | null;
  returnedAt?: string | null;
  createdAt: string;
  gemach: { id: string; name: string };
};

type Stats = { available: number; lent: number; returned: number; total: number };

export default function ItemsDashboard() {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats>({ available: 0, lent: 0, returned: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/items")
      .then((r) => r.json())
      .then((d) => {
        setItems(d.items || []);
        setStats(d.stats || { available: 0, lent: 0, returned: 0, total: 0 });
        setLoading(false);
      });
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  const statCards = [
    {
      label: "Available",
      count: stats.available,
      icon: Package,
      color: "bg-green-100 text-green-600",
      border: "border-l-green-500",
      filter: "available",
    },
    {
      label: "Borrowed",
      count: stats.lent,
      icon: Clock,
      color: "bg-amber-100 text-amber-600",
      border: "border-l-amber-500",
      filter: "lent",
    },
    {
      label: "Returned",
      count: stats.returned,
      icon: RotateCcw,
      color: "bg-blue-100 text-blue-600",
      border: "border-l-blue-500",
      filter: "returned",
    },
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card p-5"><CardSkeleton /></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-500 mt-1">Track all your gemach items and their status.</p>
        </div>
      </div>

      {/* Stats — Dockly-style */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(filter === s.filter ? "all" : s.filter)}
            className={`card p-5 flex items-center gap-4 border-l-4 ${s.border} text-left hover:shadow-md transition ${
              filter === s.filter ? "ring-2 ring-offset-1 ring-gray-200" : ""
            }`}
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter bar */}
      {stats.total > 0 && (
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          {["all", "available", "lent", "returned"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                filter === f
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Items list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={stats.total === 0 ? "No items yet" : "No matching items"}
          description={
            stats.total === 0
              ? "Add items to your gemachs to start tracking them with QR codes."
              : "Try a different filter."
          }
          action={
            stats.total === 0
              ? { label: "Go to My Gemachs", href: "/dashboard/my-gemachs" }
              : undefined
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div key={item.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                    item.status === "available"
                      ? "bg-green-100 text-green-600"
                      : item.status === "lent"
                      ? "bg-amber-100 text-amber-600"
                      : "bg-blue-100 text-blue-600"
                  }`}
                >
                  {item.status === "available" ? (
                    <Package className="h-4 w-4" />
                  ) : item.status === "lent" ? (
                    <Clock className="h-4 w-4" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{item.name}</p>
                    <span
                      className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                        item.status === "available"
                          ? "bg-green-50 text-green-700"
                          : item.status === "lent"
                          ? "bg-amber-50 text-amber-700"
                          : "bg-blue-50 text-blue-700"
                      }`}
                    >
                      {item.status === "available"
                        ? "Available"
                        : item.status === "lent"
                        ? "Borrowed"
                        : "Returned"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {item.gemach.name}
                    {item.status === "lent" && item.borrowerName && (
                      <> · Borrowed by {item.borrowerName}</>
                    )}
                    {item.status === "lent" && item.lentAt && (
                      <> · {new Date(item.lentAt).toLocaleDateString()}</>
                    )}
                    {item.status === "returned" && item.returnedAt && (
                      <> · Returned {new Date(item.returnedAt).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/scan/${item.qrCode}`}
                  target="_blank"
                  className="btn btn-ghost p-1.5"
                  title="Open scan page"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
                <Link
                  href={`/dashboard/my-gemachs/${item.gemach.id}/items`}
                  className="btn btn-ghost p-1.5"
                  title="Manage items for this gemach"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Borrowed items detail */}
      {filtered.some((i) => i.status === "lent") && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Currently Borrowed</h2>
          <div className="space-y-2">
            {filtered
              .filter((i) => i.status === "lent")
              .map((item) => (
                <div key={item.id} className="card p-4 bg-amber-50/30 border-amber-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.gemach.name}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1.5 text-sm text-gray-700">
                          <User className="h-3.5 w-3.5 text-gray-400" />
                          {item.borrowerName}
                        </div>
                        {item.borrowerPhone && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Phone className="h-3.5 w-3.5 text-gray-400" />
                            {item.borrowerPhone}
                          </div>
                        )}
                        {item.borrowerEmail && (
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <Mail className="h-3.5 w-3.5 text-gray-400" />
                            {item.borrowerEmail}
                          </div>
                        )}
                        {item.lentAt && (
                          <p className="text-xs text-gray-500">
                            Borrowed {new Date(item.lentAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <a
                        href={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(
                          `https://gemach-connect.vercel.app/scan/${item.qrCode}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
                      >
                        <QrCode className="h-3 w-3" /> QR
                      </a>
                      <Link
                        href={`/scan/${item.qrCode}`}
                        target="_blank"
                        className="btn btn-ghost text-xs"
                      >
                        <ExternalLink className="h-3 w-3" /> Scan Page
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
