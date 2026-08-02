"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  ArrowLeft,
  QrCode,
  Download,
  Printer,
  Copy,
  ExternalLink,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  Check,
  RotateCcw,
  Loader2,
  Share2,
  History,
} from "lucide-react";
import { toast } from "sonner";
type ItemDetail = {
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
  gemach: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    city: string;
    state: string;
  };
};

export default function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/items/${id}`)
      .then((r) => r.json())
      .then((d) => { setItem(d.item); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const scanUrl = item ? `https://gemach-connect.vercel.app/scan/${item.qrCode}` : "";
  const qrImageUrl = item
    ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&bgcolor=ffffff&color=0f172a&data=${encodeURIComponent(scanUrl)}`
    : "";

  async function handleCopyLink() {
    await navigator.clipboard.writeText(scanUrl);
    toast.success("Scan link copied to clipboard");
  }

  async function handleMarkReturned() {
    if (!item) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/items/qr/${item.qrCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItem(data.item);
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="text-center py-20">
        <Package className="mx-auto h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Item not found</h2>
        <Link href="/dashboard/items" className="btn btn-primary mt-4">Back to Items</Link>
      </div>
    );
  }

  const timeline = [
    { icon: Package, label: "Created", date: item.createdAt, color: "text-gray-400" },
    ...(item.lentAt ? [{ icon: User, label: `Borrowed by ${item.borrowerName}`, date: item.lentAt, color: "text-amber-500" }] : []),
    ...(item.returnedAt ? [{ icon: Check, label: "Returned", date: item.returnedAt, color: "text-green-500" }] : []),
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back + Title */}
      <div>
        <Link href="/dashboard/items" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Items
        </Link>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl font-bold text-gray-900">{item.name}</h1>
          <span
            className={`px-2.5 py-1 rounded-full text-sm font-medium ${
              item.status === "available"
                ? "bg-green-50 text-green-700 border border-green-200"
                : item.status === "lent"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-blue-50 text-blue-700 border border-blue-200"
            }`}
          >
            {item.status === "available" ? "Available" : item.status === "lent" ? "Borrowed" : "Returned"}
          </span>
        </div>
        {item.description && <p className="text-gray-500 mt-1">{item.description}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left — QR Code */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 text-center">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-center gap-2">
              <QrCode className="h-4 w-4" /> QR Code
            </h3>
            <div className="bg-white rounded-lg border border-gray-200 p-3 inline-block">
              <img
                src={qrImageUrl}
                alt={`QR code for ${item.name}`}
                className="w-56 h-56"
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              <a
                href={qrImageUrl}
                download={`${item.name.replace(/\s+/g, "-")}-qr.png`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary text-sm"
              >
                <Download className="h-4 w-4" /> Download PNG
              </a>
              <button onClick={() => window.print()} className="btn btn-secondary text-sm">
                <Printer className="h-4 w-4" /> Print
              </button>
              <button onClick={handleCopyLink} className="btn btn-secondary text-sm">
                <Copy className="h-4 w-4" /> Copy Link
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400 break-all">{scanUrl}</p>
          </div>

          {/* Quick Actions */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Actions</h3>
            <div className="space-y-2">
              <Link
                href={`/scan/${item.qrCode}`}
                target="_blank"
                className="btn btn-secondary w-full justify-between"
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> Open Scan Page
                </span>
                <span className="text-xs text-gray-400">Borrower view</span>
              </Link>
              {item.status === "lent" && (
                <button
                  onClick={handleMarkReturned}
                  disabled={actionLoading}
                  className="btn btn-primary w-full"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Mark as Returned
                </button>
              )}
              {item.status === "available" && (
                <Link
                  href={`/scan/${item.qrCode}`}
                  target="_blank"
                  className="btn btn-primary w-full"
                >
                  <Share2 className="h-4 w-4" /> Share for Borrowing
                </Link>
              )}
            </div>
          </div>

          {/* Gemach Info */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Gemach</h3>
            <Link href={`/gemachs/${item.gemach.id}`} className="block hover:underline">
              <p className="font-medium text-gray-900">{item.gemach.name}</p>
            </Link>
            <div className="mt-2 space-y-1.5 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5" />
                {item.gemach.city}, {item.gemach.state}
              </div>
              {item.gemach.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5" />
                  {item.gemach.phone}
                </div>
              )}
              {item.gemach.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-3.5 w-3.5" />
                  {item.gemach.email}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right — Details */}
        <div className="lg:col-span-3 space-y-6">
          {/* Status Card */}
          <div
            className={`card p-5 border-l-4 ${
              item.status === "available"
                ? "border-l-green-500 bg-green-50/30"
                : item.status === "lent"
                ? "border-l-amber-500 bg-amber-50/30"
                : "border-l-blue-500 bg-blue-50/30"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  item.status === "available"
                    ? "bg-green-100 text-green-600"
                    : item.status === "lent"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-blue-100 text-blue-600"
                }`}
              >
                {item.status === "available" ? (
                  <Package className="h-5 w-5" />
                ) : item.status === "lent" ? (
                  <Clock className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {item.status === "available" && "Ready to Borrow"}
                  {item.status === "lent" && `Currently Borrowed`}
                  {item.status === "returned" && "Returned"}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {item.status === "available" &&
                    "Share the QR code or scan link with someone who needs this item."}
                  {item.status === "lent" &&
                    `Borrowed ${item.lentAt ? new Date(item.lentAt).toLocaleDateString() : ""}. The borrower can scan the QR code to return it.`}
                  {item.status === "returned" &&
                    `Returned ${item.returnedAt ? new Date(item.returnedAt).toLocaleDateString() : ""}. You can lend it out again — the QR code still works.`}
                </p>
              </div>
            </div>
          </div>

          {/* Borrower Info */}
          {item.status === "lent" && (
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <User className="h-4 w-4" /> Borrower Details
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-0.5">Name</p>
                  <p className="font-medium text-gray-900">{item.borrowerName}</p>
                </div>
                {item.borrowerPhone && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Phone</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <a href={`tel:${item.borrowerPhone}`} className="hover:text-primary-600">
                        {item.borrowerPhone}
                      </a>
                    </p>
                  </div>
                )}
                {item.borrowerEmail && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Email</p>
                    <p className="font-medium text-gray-900 flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-gray-400" />
                      <a href={`mailto:${item.borrowerEmail}`} className="hover:text-primary-600">
                        {item.borrowerEmail}
                      </a>
                    </p>
                  </div>
                )}
                {item.lentAt && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Borrowed On</p>
                    <p className="font-medium text-gray-900">
                      {new Date(item.lentAt).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
              <History className="h-4 w-4" /> Timeline
            </h3>
            <div className="space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${i === timeline.length - 1 ? "border-primary-500 bg-primary-50" : "border-gray-200 bg-gray-50"}`}>
                      <event.icon className={`h-4 w-4 ${i === timeline.length - 1 ? "text-primary-600" : "text-gray-400"}`} />
                    </div>
                    {i < timeline.length - 1 && <div className="w-0.5 flex-1 bg-gray-200" />}
                  </div>
                  <div className="pb-6">
                    <p className="font-medium text-sm text-gray-900">{event.label}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div className="card p-5 bg-gray-50">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">How It Works</h3>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li><strong>Print the QR code</strong> — tape it to the item or keep it at your gemach.</li>
              <li><strong>Borrower scans</strong> — they enter their name and phone, then take the item.</li>
              <li><strong>You get notified</strong> — an email is sent when someone borrows or returns.</li>
              <li><strong>Return scan</strong> — the borrower scans again to mark it returned.</li>
              <li><strong>Lend again</strong> — the same QR code works forever. No need to reprint.</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
