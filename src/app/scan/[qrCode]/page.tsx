"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Package, ArrowLeft, Check, User, Phone, Mail, MapPin, Loader2, QrCode } from "lucide-react";
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
      if (data.item.status === "lent") setStep("view");
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

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800 px-4 py-4">
        <div className="mx-auto flex max-w-md items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
              <QrCode className="h-4 w-4 text-white" />
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

      <main className="mx-auto max-w-md px-4 py-8">
        {/* Status Banner */}
        {step !== "done" && (
          <div
            className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
              isAvailable
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
            }`}
          >
            {isAvailable && (
              <span className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                Available — ready to borrow
              </span>
            )}
            {isLent && (
              <span className="flex items-center gap-2">
                <span className="flex h-1.5 w-1.5 rounded-full bg-amber-400" />
                Currently borrowed by {item.borrowerName}
              </span>
            )}
          </div>
        )}

        {/* Success State */}
        {step === "done" && (
          <div className="mb-6 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20">
              <Check className="h-7 w-7 text-green-400" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-green-400">
              {item.status === "lent" ? "Borrowed!" : "Returned!"}
            </h2>
            <p className="mt-1 text-sm text-slate-300">{successMessage}</p>
          </div>
        )}

        {/* Item Card */}
        <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
              <Package className="h-5 w-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">{item.name}</h1>
              {item.description && (
                <p className="mt-1 text-sm text-slate-400">{item.description}</p>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <MapPin className="h-4 w-4 text-slate-500" />
              {item.gemach.name} — {item.gemach.city}, {item.gemach.state}
            </div>
            {item.gemach.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Phone className="h-4 w-4 text-slate-500" />
                {item.gemach.phone}
              </div>
            )}
            {item.gemach.email && (
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Mail className="h-4 w-4 text-slate-500" />
                {item.gemach.email}
              </div>
            )}
          </div>

          {/* Borrower info if lent */}
          {isLent && step !== "done" && (
            <div className="mt-4 border-t border-slate-800 pt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Borrower</p>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-slate-500" />
                <span className="text-slate-300">{item.borrowerName}</span>
              </div>
              {item.borrowerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-slate-500" />
                  <span className="text-slate-300">{item.borrowerPhone}</span>
                </div>
              )}
              {item.lentAt && (
                <p className="text-xs text-slate-500">
                  Borrowed {new Date(item.lentAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Done state details */}
          {step === "done" && item.status === "lent" && (
            <div className="mt-4 border-t border-slate-800 pt-4">
              <p className="text-xs text-slate-500">
                Borrowed on {new Date(item.lentAt!).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        {step === "view" && isAvailable && (
          <button
            onClick={() => setStep("borrow")}
            className="mt-4 w-full rounded-xl bg-orange-500 px-4 py-3 font-semibold text-white hover:bg-orange-600 transition active:scale-[0.98]"
          >
            Borrow This Item
          </button>
        )}

        {step === "view" && isLent && (
          <button
            onClick={handleReturn}
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
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
          <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <h3 className="font-semibold text-lg">Your Information</h3>
            <p className="text-sm text-slate-400 mt-1">The gemach owner will be notified.</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Your Name *</label>
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
                  placeholder="(Optional)"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 block mb-1">Email</label>
                <input
                  type="email"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-white text-sm placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500"
                  placeholder="(Optional)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("view")}
                  className="flex-1 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBorrow}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

        {/* Done state CTA */}
        {step === "done" && (
          <div className="mt-4 space-y-3">
            {item.status === "lent" && (
              <p className="text-center text-sm text-slate-500">
                Scan this code again when you're ready to return the item.
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
        <p className="mt-8 text-center text-xs text-slate-600">
          Powered by{" "}
          <a
            href="https://trydockly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-400 hover:text-orange-300 underline underline-offset-2"
          >
            Dockly
          </a>
          {" "}— QR tracking for gemachs
        </p>
      </main>
    </div>
  );
}
