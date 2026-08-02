"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Package,
  ArrowLeft,
  Check,
  User,
  Phone,
  Mail,
  MapPin,
  Loader2,
  QrCode,
  Download,
  Copy,
  History,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

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
  gemach: {
    id: string;
    name: string;
    phone: string;
    email?: string | null;
    city: string;
    state: string;
  };
};

export default function ScanPage() {
  const { qrCode } = useParams<{ qrCode: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Borrow form
  const [step, setStep] = useState<"view" | "borrow" | "done">("view");
  const [borrowerName, setBorrowerName] = useState("");
  const [borrowerPhone, setBorrowerPhone] = useState("");
  const [borrowerEmail, setBorrowerEmail] = useState("");

  const scanUrl = item
    ? `https://gemach-connect.vercel.app/scan/${item.qrCode}`
    : "";
  const qrImageUrl = item
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&bgcolor=ffffff&color=0f172a&data=${encodeURIComponent(scanUrl)}`
    : "";

  useEffect(() => {
    fetchItem();
  }, [qrCode]);

  async function fetchItem() {
    try {
      setLoading(true);
      const res = await fetch(`/api/items/qr/${qrCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Not found");
      setItem(data.item);
      setError(null);
      if (data.item.status === "returned") setStep("done");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBorrow() {
    if (!borrowerName.trim()) {
      toast.error("Please enter your name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/qr/${qrCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "borrow",
          borrowerName: borrowerName.trim(),
          borrowerPhone: borrowerPhone.trim() || undefined,
          borrowerEmail: borrowerEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItem(data.item);
      setSuccessMessage(data.message);
      setStep("done");
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturn() {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/qr/${qrCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItem(data.item);
      setSuccessMessage(data.message);
      setStep("done");
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(scanUrl);
    toast.success("Link copied!");
  }

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-orange-400" />
          <p className="mt-4 text-sm text-slate-400">Loading item...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="text-center max-w-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <Package className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Item Not Found</h2>
          <p className="mt-2 text-sm text-slate-400">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600 transition"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
        </div>
      </div>
    );
  }

  if (!item) return null;

  const isAvailable = item.status === "available";
  const isLent = item.status === "lent";
  const isReturned = item.status === "returned";

  // Timeline events
  const timeline = [
    { icon: Package, label: "Item Created", date: item.createdAt, color: "text-slate-400", dot: "bg-slate-600" },
    ...(item.lentAt
      ? [{ icon: User, label: `Borrowed by ${item.borrowerName}`, date: item.lentAt, color: "text-orange-400", dot: "bg-orange-500" }]
      : []),
    ...(item.returnedAt
      ? [{ icon: Check, label: "Returned", date: item.returnedAt, color: "text-green-400", dot: "bg-green-500" }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500">
              <QrCode className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Gemach Connect</p>
              <p className="text-sm font-semibold">Item Tracker</p>
            </div>
          </div>
          <a
            href="https://trydockly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-orange-400 transition"
          >
            by Dockly
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 py-6 space-y-5">
        {/* Status Banner */}
        {step !== "done" && (
          <div
            className={`rounded-xl px-4 py-3 text-sm font-medium ${
              isAvailable
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {isAvailable && (
              <span className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                Available — ready to borrow
              </span>
            )}
            {isLent && (
              <span className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-amber-400" />
                Currently borrowed by {item.borrowerName}
              </span>
            )}
          </div>
        )}

        {/* Success State */}
        {step === "done" && (
          <div className="rounded-xl bg-green-500/10 border border-green-500/20 px-5 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-7 w-7 text-green-400" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-green-400">
              {isLent && !isReturned ? "Borrowed!" : "Returned!"}
            </h2>
            <p className="mt-1 text-sm text-slate-300">{successMessage}</p>
          </div>
        )}

        {/* Item Card + QR Code */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden">
          {/* Item header */}
          <div className="p-5 flex items-start gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/10">
              <Package className="h-6 w-6 text-orange-400" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight">{item.name}</h1>
              {item.description && (
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
              )}
              <p className="mt-1 text-xs text-slate-500">
                from {item.gemach.name} · {item.gemach.city}, {item.gemach.state}
              </p>
            </div>
          </div>

          {/* QR Code section */}
          <div className="border-t border-slate-800 bg-slate-800/50 px-5 py-4">
            <div className="flex items-start gap-4">
              <div className="rounded-lg border-2 border-slate-700 bg-white p-2 flex-shrink-0">
                <img
                  src={qrImageUrl}
                  alt={`QR code for ${item.name}`}
                  className="w-24 h-24"
                />
              </div>
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <QrCode className="h-3.5 w-3.5" /> QR Code
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Scan this code to borrow or return this item. The gemach owner gets notified automatically.
                </p>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleCopyLink}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-600 transition"
                  >
                    <Copy className="h-3 w-3" /> Copy Link
                  </button>
                  <a
                    href={qrImageUrl}
                    download={`${item.name.replace(/\s+/g, "-")}-qr.png`}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-600 transition"
                  >
                    <Download className="h-3 w-3" /> Download
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Gemach contact */}
          <div className="border-t border-slate-800 px-5 py-3 space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <MapPin className="h-3.5 w-3.5 text-slate-500" />
              {item.gemach.name} — {item.gemach.city}, {item.gemach.state}
            </div>
            {item.gemach.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Phone className="h-3.5 w-3.5 text-slate-500" />
                <a href={`tel:${item.gemach.phone}`} className="hover:text-orange-400 transition">
                  {item.gemach.phone}
                </a>
              </div>
            )}
            {item.gemach.email && (
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <Mail className="h-3.5 w-3.5 text-slate-500" />
                <a href={`mailto:${item.gemach.email}`} className="hover:text-orange-400 transition">
                  {item.gemach.email}
                </a>
              </div>
            )}
          </div>

          {/* Borrower info if lent */}
          {isLent && step !== "done" && (
            <div className="border-t border-slate-800 bg-amber-500/5 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-wide text-amber-400/80 mb-2">
                Currently Borrowed By
              </p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-800/50 rounded-lg p-2.5">
                  <p className="text-xs text-slate-500">Name</p>
                  <p className="text-sm font-medium text-slate-200 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5 text-amber-400" />
                    {item.borrowerName}
                  </p>
                </div>
                {item.borrowerPhone && (
                  <div className="bg-slate-800/50 rounded-lg p-2.5">
                    <p className="text-xs text-slate-500">Phone</p>
                    <p className="text-sm font-medium text-slate-200">
                      <a href={`tel:${item.borrowerPhone}`} className="hover:text-orange-400">
                        {item.borrowerPhone}
                      </a>
                    </p>
                  </div>
                )}
                {item.borrowerEmail && (
                  <div className="bg-slate-800/50 rounded-lg p-2.5 col-span-2">
                    <p className="text-xs text-slate-500">Email</p>
                    <p className="text-sm font-medium text-slate-200">
                      <a href={`mailto:${item.borrowerEmail}`} className="hover:text-orange-400">
                        {item.borrowerEmail}
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="border-t border-slate-800 px-5 py-4">
            <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5 mb-3">
              <History className="h-3.5 w-3.5" /> History
            </p>
            <div className="space-y-0">
              {timeline.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                        i === timeline.length - 1
                          ? "border-orange-500/50 bg-orange-500/20"
                          : "border-slate-700 bg-slate-800"
                      }`}
                    >
                      <event.icon className={`h-3 w-3 ${i === timeline.length - 1 ? "text-orange-400" : "text-slate-500"}`} />
                    </div>
                    {i < timeline.length - 1 && <div className="w-px flex-1 bg-slate-800" />}
                  </div>
                  <div className="pb-4">
                    <p className={`text-sm font-medium ${event.color}`}>{event.label}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
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
        </div>

        {/* Actions */}
        {step === "view" && isAvailable && (
          <button
            onClick={() => setStep("borrow")}
            className="w-full rounded-xl bg-orange-500 px-4 py-3.5 font-semibold text-white hover:bg-orange-600 transition active:scale-[0.98] shadow-lg shadow-orange-500/20"
          >
            Borrow This Item
          </button>
        )}

        {step === "view" && isLent && (
          <button
            onClick={handleReturn}
            disabled={submitting}
            className="w-full rounded-xl bg-green-600 px-4 py-3.5 font-semibold text-white hover:bg-green-700 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
          >
            {submitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" /> Return This Item
              </>
            )}
          </button>
        )}

        {/* Borrow Form */}
        {step === "borrow" && (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-semibold text-lg">Your Information</h3>
            <p className="text-sm text-slate-400 mt-1">
              The gemach owner will receive an email with your details.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">
                  Your Name <span className="text-orange-400">*</span>
                </label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  placeholder="Full name"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Phone</label>
                <input
                  type="tel"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  placeholder="(Optional) for SMS updates"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  placeholder="(Optional) for email updates"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("view")}
                  className="flex-1 rounded-xl border border-slate-700 px-4 py-3 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBorrow}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
                    </>
                  ) : (
                    "Confirm Borrow"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Done state */}
        {step === "done" && (
          <div className="space-y-3">
            {isLent && !isReturned && (
              <p className="text-center text-sm text-slate-500">
                Scan this QR code again when you&apos;re ready to return the item.
              </p>
            )}
            <Link
              href="/"
              className="w-full rounded-xl border border-slate-700 px-4 py-3 text-center block text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
            >
              <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to Home
            </Link>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-slate-600 pt-2">
          Powered by{" "}
          <a
            href="https://trydockly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 underline underline-offset-2 font-medium"
          >
            Dockly
          </a>
          {" "}— QR tracking for gemachs
        </p>
      </main>
    </div>
  );
}
