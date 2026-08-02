"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Package,
  Check,
  Clock,
  RotateCcw,
  User,
  Phone,
  Mail,
  ExternalLink,
  QrCode,
  Filter,
  Copy,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { CardSkeleton } from "@/components/Skeleton";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

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

  async function handleCopyLink(qrCode: string) {
    await navigator.clipboard.writeText(
      `https://gemach-connect.vercel.app/scan/${qrCode}`
    );
    toast.success("Scan link copied!");
  }

  const filtered =
    filter === "all" ? items : items.filter((i) => i.status === filter);

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
            <div key={i} className="card p-5">
              <CardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // QR image URL helper
  const qrThumb = (qrCode: string) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=60x60&bgcolor=ffffff&color=0f172a&data=${encodeURIComponent(
      `https://gemach-connect.vercel.app/scan/${qrCode}`
    )}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Items</h1>
          <p className="text-gray-500 mt-1">
            Track all your gemach items with QR codes.{" "}
            {stats.total > 0 && (
              <span className="text-gray-400">
                {stats.total} total · {stats.lent} currently borrowed
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(filter === s.filter ? "all" : s.filter)}
            className={`card p-5 flex items-center gap-4 border-l-4 ${s.border} text-left hover:shadow-md transition ${
              filter === s.filter
                ? "ring-2 ring-offset-1 ring-gray-200"
                : ""
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}
            >
              <s.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.count}</p>
              <p className="text-sm text-gray-500">{s.label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter chips */}
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

      {/* Items grid */}
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
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="card p-4 hover:shadow-md transition group"
            >
              <div className="flex items-start gap-3">
                {/* QR thumbnail */}
                <img
                  src={qrThumb(item.qrCode)}
                  alt="QR"
                  className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/items/${item.id}`}
                    className="font-semibold text-gray-900 truncate block group-hover:text-primary-600 transition"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs text-gray-400">{item.gemach.name}</p>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  {/* Status + time */}
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
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
                    {item.status === "lent" && item.lentAt && (
                      <span className="text-xs text-amber-500">
                        {formatDistanceToNow(new Date(item.lentAt), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {/* Borrower info if lent */}
                  {item.status === "lent" && item.borrowerName && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-md px-2 py-1 w-fit">
                      <User className="h-3 w-3" />
                      {item.borrowerName}
                    </div>
                  )}
                </div>
              </div>
              {/* Action bar */}
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <Link
                  href={`/dashboard/items/${item.id}`}
                  className="btn btn-secondary flex-1 text-xs py-1.5 justify-center"
                >
                  Details
                </Link>
                <button
                  onClick={() => handleCopyLink(item.qrCode)}
                  className="btn btn-secondary text-xs py-1.5 px-2"
                  title="Copy scan link"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <Link
                  href={`/scan/${item.qrCode}`}
                  target="_blank"
                  className="btn btn-secondary text-xs py-1.5 px-2"
                  title="Open scan page"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Borrowed items detail section */}
      {filtered.some((i) => i.status === "lent") && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Currently Borrowed
          </h2>
          <div className="space-y-3">
            {filtered
              .filter((i) => i.status === "lent")
              .map((item) => (
                <div
                  key={item.id}
                  className="card p-4 bg-amber-50/30 border border-amber-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-3">
                      <img
                        src={qrThumb(item.qrCode)}
                        alt="QR"
                        className="w-10 h-10 rounded-lg border border-amber-200 flex-shrink-0"
                      />
                      <div>
                        <Link
                          href={`/dashboard/items/${item.id}`}
                          className="font-semibold text-gray-900 hover:text-primary-600"
                        >
                          {item.name}
                        </Link>
                        <p className="text-xs text-gray-500">{item.gemach.name}</p>
                        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {item.borrowerName}
                          </div>
                          {item.borrowerPhone && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Phone className="h-3.5 w-3.5 text-gray-400" />
                              <a
                                href={`tel:${item.borrowerPhone}`}
                                className="hover:text-primary-600"
                              >
                                {item.borrowerPhone}
                              </a>
                            </div>
                          )}
                          {item.borrowerEmail && (
                            <div className="flex items-center gap-1.5 text-sm text-gray-700">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              <a
                                href={`mailto:${item.borrowerEmail}`}
                                className="hover:text-primary-600"
                              >
                                {item.borrowerEmail}
                              </a>
                            </div>
                          )}
                          {item.lentAt && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 col-span-2">
                              Borrowed{" "}
                              {new Date(item.lentAt).toLocaleDateString("en-US", {
                                month: "long",
                                day: "numeric",
                              })}{" "}
                              · {formatDistanceToNow(new Date(item.lentAt), { addSuffix: true })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handleCopyLink(item.qrCode)}
                        className="btn btn-secondary text-xs py-1.5"
                      >
                        <Copy className="h-3 w-3" /> Copy Link
                      </button>
                      <Link
                        href={`/scan/${item.qrCode}`}
                        target="_blank"
                        className="btn btn-secondary text-xs py-1.5"
                      >
                        <ExternalLink className="h-3 w-3" /> Scan
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
