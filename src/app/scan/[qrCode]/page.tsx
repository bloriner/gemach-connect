"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Package, ArrowLeft, Check, User, Phone, Mail, MapPin, Loader2 } from "lucide-react";
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

  // Lend form
  const [showLendForm, setShowLendForm] = useState(false);
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLend() {
    if (!borrowerName.trim()) {
      toast.error("Please enter the borrower's name");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/items/qr/${qrCode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "lend",
          borrowerName: borrowerName.trim(),
          borrowerPhone: borrowerPhone.trim() || undefined,
          borrowerEmail: borrowerEmail.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItem(data.item);
      setShowLendForm(false);
      setBorrowerName("");
      setBorrowerPhone("");
      setBorrowerEmail("");
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
      toast.success(data.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
            <Package className="h-8 w-8 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Item Not Found</h2>
          <p className="mt-2 text-sm text-gray-400 max-w-sm">{error}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
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

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-4 py-4">
        <div className="mx-auto flex max-w-md items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Package className="h-4 w-4 text-white" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Gemach Connect</p>
            <p className="text-sm font-semibold">Item Tracker</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8">
        {/* Status Banner */}
        <div
          className={`mb-6 rounded-xl px-4 py-3 text-sm font-medium ${
            isAvailable
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : isLent
              ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
          }`}
        >
          {isAvailable && "This item is available for lending."}
          {isLent && `Currently lent to ${item.borrowerName}`}
          {isReturned && `Returned${item.returnedAt ? ` on ${new Date(item.returnedAt).toLocaleDateString()}` : ""}`}
        </div>

        {/* Item Card */}
        <div className="rounded-xl border border-gray-800 bg-gray-900 p-5">
          <h1 className="text-xl font-bold">{item.name}</h1>
          {item.description && (
            <p className="mt-2 text-sm text-gray-400">{item.description}</p>
          )}

          <div className="mt-4 space-y-2 border-t border-gray-800 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4 text-gray-500" />
              {item.gemach.name} — {item.gemach.city}, {item.gemach.state}
            </div>
            {item.gemach.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone className="h-4 w-4 text-gray-500" />
                {item.gemach.phone}
              </div>
            )}
            {item.gemach.email && (
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail className="h-4 w-4 text-gray-500" />
                {item.gemach.email}
              </div>
            )}
          </div>

          {/* Lend/Return info if lent */}
          {isLent && (
            <div className="mt-4 border-t border-gray-800 pt-4 space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Borrower</p>
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-300">{item.borrowerName}</span>
              </div>
              {item.borrowerPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-300">{item.borrowerPhone}</span>
                </div>
              )}
              {item.borrowerEmail && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-300">{item.borrowerEmail}</span>
                </div>
              )}
              {item.lentAt && (
                <p className="text-xs text-gray-500">
                  Lent on {new Date(item.lentAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {isReturned && (
            <div className="mt-4 border-t border-gray-800 pt-4">
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Check className="h-4 w-4" />
                Successfully returned
                {item.returnedAt && ` on ${new Date(item.returnedAt).toLocaleDateString()}`}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        {isAvailable && !showLendForm && (
          <button
            onClick={() => setShowLendForm(true)}
            className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 transition"
          >
            Lend This Item
          </button>
        )}

        {isLent && (
          <button
            onClick={handleReturn}
            disabled={submitting}
            className="mt-4 w-full rounded-xl bg-green-600 px-4 py-3 font-semibold text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                <Check className="h-5 w-5" /> Mark as Returned
              </>
            )}
          </button>
        )}

        {/* Lend Form */}
        {isAvailable && showLendForm && (
          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="font-semibold text-lg">Lend This Item</h3>
            <p className="text-sm text-gray-400 mt-1">Enter the borrower's details</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="label text-gray-300">Name *</label>
                <input
                  type="text"
                  value={borrowerName}
                  onChange={(e) => setBorrowerName(e.target.value)}
                  className="input bg-gray-800 border-gray-700 text-white"
                  placeholder="Borrower's full name"
                />
              </div>
              <div>
                <label className="label text-gray-300">Phone</label>
                <input
                  type="tel"
                  value={borrowerPhone}
                  onChange={(e) => setBorrowerPhone(e.target.value)}
                  className="input bg-gray-800 border-gray-700 text-white"
                  placeholder="(Optional)"
                />
              </div>
              <div>
                <label className="label text-gray-300">Email</label>
                <input
                  type="email"
                  value={borrowerEmail}
                  onChange={(e) => setBorrowerEmail(e.target.value)}
                  className="input bg-gray-800 border-gray-700 text-white"
                  placeholder="(Optional)"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowLendForm(false);
                    setBorrowerName("");
                    setBorrowerPhone("");
                    setBorrowerEmail("");
                  }}
                  className="flex-1 rounded-xl border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLend}
                  disabled={submitting}
                  className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Confirm Lend"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {isReturned && (
          <Link
            href="/"
            className="mt-4 w-full rounded-xl border border-gray-700 px-4 py-3 text-center block text-sm font-medium text-gray-300 hover:bg-gray-800 transition"
          >
            <ArrowLeft className="h-4 w-4 inline mr-1" /> Back to Home
          </Link>
        )}

        {/* Footer branding */}
        <p className="mt-8 text-center text-xs text-gray-600">
          Built by the creators of{" "}
          <a
            href="https://trydockly.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Dockly
          </a>
        </p>
      </main>
    </div>
  );
}
