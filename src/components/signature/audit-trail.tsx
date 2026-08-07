"use client";

import {
  FileText,
  Send,
  Eye,
  CheckCircle2,
  XCircle,
  Bell,
  Clock,
  Ban,
  Globe,
  Monitor,
} from "lucide-react";

interface AuditEvent {
  id: string;
  event: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  timestamp: string;
}

const eventConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  CREATED: {
    icon: <FileText className="h-4 w-4" />,
    label: "Document Created",
    color: "bg-slate-100 text-slate-600",
  },
  SENT: {
    icon: <Send className="h-4 w-4" />,
    label: "Sent for Signature",
    color: "bg-blue-100 text-blue-600",
  },
  VIEWED: {
    icon: <Eye className="h-4 w-4" />,
    label: "Viewed by Recipient",
    color: "bg-purple-100 text-purple-600",
  },
  SIGNED: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    label: "Signed",
    color: "bg-green-100 text-green-600",
  },
  DECLINED: {
    icon: <XCircle className="h-4 w-4" />,
    label: "Declined",
    color: "bg-red-100 text-red-600",
  },
  REMINDER_SENT: {
    icon: <Bell className="h-4 w-4" />,
    label: "Reminder Sent",
    color: "bg-amber-100 text-amber-600",
  },
  EXPIRED: {
    icon: <Clock className="h-4 w-4" />,
    label: "Expired",
    color: "bg-orange-100 text-orange-600",
  },
  CANCELLED: {
    icon: <Ban className="h-4 w-4" />,
    label: "Cancelled",
    color: "bg-gray-100 text-gray-600",
  },
};

function formatTimestamp(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function AuditTrail({ events }: { events: AuditEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-slate-400">
        No audit events recorded yet.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-200" />

      <div className="space-y-1">
        {events.map((event, idx) => {
          const cfg = eventConfig[event.event] || eventConfig.CREATED;
          const isLatest = idx === 0;

          return (
            <div key={event.id} className="relative flex gap-4 pl-10 py-2">
              {/* Dot */}
              <div
                className={`absolute left-[12px] top-3 h-4 w-4 rounded-full border-2 border-white ${cfg.color.replace("100 ", "500 ").replace("text-", "bg-")} ${isLatest ? "ring-2 ring-offset-2 ring-slate-300" : ""}`}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cfg.color}`}>
                    {cfg.icon}
                    {cfg.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTimestamp(event.timestamp)}
                  </span>
                  {event.ipAddress && (
                    <span className="inline-flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {event.ipAddress}
                    </span>
                  )}
                  {event.userAgent && (
                    <span className="inline-flex items-center gap-1" title={event.userAgent}>
                      <Monitor className="h-3 w-3" />
                      {event.userAgent.substring(0, 60)}
                      {event.userAgent.length > 60 ? "..." : ""}
                    </span>
                  )}
                </p>
                {event.details && (
                  <p className="mt-0.5 text-xs text-slate-400">{event.details}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
