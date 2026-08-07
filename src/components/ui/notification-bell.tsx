"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Loader2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, string> = {
  ORDER_CREATED: "📋",
  ORDER_DISPATCHED: "🚛",
  ORDER_COMPLETED: "✅",
  INVOICE_GENERATED: "📄",
  PAYMENT_RECEIVED: "💰",
  DOCUMENT_SENT: "✉️",
  DOCUMENT_SIGNED: "🖊️",
  QUOTE_APPROVED: "👍",
  TECH_ARRIVED: "📍",
};

function timeAgo(d: string): string {
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications?markAll=true", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id: string) => {
    await fetch(`/api/notifications?id=${id}`, { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 max-h-[480px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-center">
                <Bell className="h-8 w-8 text-slate-200 mb-2" />
                <p className="text-sm text-slate-400">No notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => {
                    markRead(n.id);
                    setOpen(false);
                  }}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition ${
                    !n.read ? "bg-brand-50/30" : ""
                  }`}
                >
                  <span className="text-lg mt-0.5">{typeIcons[n.type] || "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm truncate ${!n.read ? "font-semibold text-slate-900" : "text-slate-600"}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-brand-500 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{n.body}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
