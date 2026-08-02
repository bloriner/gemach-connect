"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Package,
  Plus,
  Trash2,
  QrCode,
  ArrowLeft,
  Loader2,
  User,
  Phone,
  Mail,
  Clock,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
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
};

export default function ItemsPage() {
  const { id } = useParams<{ id: string }>();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [gemachName, setGemachName] = useState("");

  // Add form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [id]);

  async function fetchItems() {
    const res = await fetch(`/api/gemachs/${id}/items`);
    const data = await res.json();
    setItems(data.items || []);

    // Get gemach name
    const gRes = await fetch(`/api/gemachs/${id}`);
    const gData = await gRes.json();
    if (gData.gemach) setGemachName(gData.gemach.name);

    setLoading(false);
  }

  async function handleAdd() {
    if (!newName.trim()) {
      toast.error("Item name is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/gemachs/${id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDescription.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => [data.item, ...prev]);
      setNewName("");
      setNewDescription("");
      setShowForm(false);
      toast.success("Item added with QR code");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(itemId: string) {
    const prev = [...items];
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    toast.success("Item deleted");

    const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(prev);
      toast.error("Failed to delete");
    }
  }

  function qrUrl(qrCode: string) {
    const data = `${window.location.origin}/scan/${qrCode}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
  }

  const statusBadge = (s: string) => {
    switch (s) {
      case "available":
        return <span className="badge bg-green-50 text-green-700 border border-green-200">Available</span>;
      case "lent":
        return <span className="badge bg-amber-50 text-amber-700 border border-amber-200">Lent</span>;
      case "returned":
        return <span className="badge bg-blue-50 text-blue-700 border border-blue-200">Returned</span>;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard/my-gemachs"
            className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to My Gemachs
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Items — {gemachName}</h1>
          <p className="text-gray-500 mt-1">Track items with QR codes. Scan to lend or return.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-primary">
          <Plus className="h-4 w-4" /> Add Item
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="card p-5 space-y-3">
          <h3 className="font-semibold text-gray-900">New Item</h3>
          <div>
            <label className="label">Item Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="input"
              placeholder="e.g., Crib, Stroller, Medical Walker"
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="input"
              rows={2}
              placeholder="Brief description (optional)"
            />
          </div>
          <div className="flex gap-3 pt-1">
            <button
              onClick={() => {
                setShowForm(false);
                setNewName("");
                setNewDescription("");
              }}
              className="btn btn-secondary flex-1"
            >
              Cancel
            </button>
            <button onClick={handleAdd} disabled={submitting} className="btn btn-primary flex-1">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Creating...
                </>
              ) : (
                "Create Item + QR"
              )}
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900">No items yet</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-500">
            Add items to this gemach and generate QR codes to track lending and returns.
          </p>
          <button onClick={() => setShowForm(true)} className="btn btn-primary mt-6">
            Add First Item
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-5">
              <div className="flex items-start gap-4">
                {/* QR Code */}
                <div className="flex-shrink-0">
                  <img
                    src={qrUrl(item.qrCode)}
                    alt="QR Code"
                    className="h-24 w-24 rounded-lg border border-gray-200"
                  />
                </div>

                {/* Item Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{item.name}</h3>
                    {statusBadge(item.status)}
                  </div>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                  )}

                  {/* Borrower info if lent */}
                  {item.status === "lent" && (
                    <div className="mt-2 space-y-1 text-sm text-gray-500 border-t border-gray-100 pt-2">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5" /> {item.borrowerName}
                      </div>
                      {item.borrowerPhone && (
                        <div className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {item.borrowerPhone}
                        </div>
                      )}
                      {item.borrowerEmail && (
                        <div className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5" /> {item.borrowerEmail}
                        </div>
                      )}
                      {item.lentAt && (
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Lent{" "}
                          {new Date(item.lentAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  )}

                  {item.status === "returned" && item.returnedAt && (
                    <div className="mt-2 flex items-center gap-1.5 text-sm text-green-600">
                      <Check className="h-3.5 w-3.5" /> Returned{" "}
                      {new Date(item.returnedAt).toLocaleDateString()}
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-2">
                    Created {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <a
                    href={qrUrl(item.qrCode)}
                    download={`${item.name.replace(/\s+/g, "-")}-qr.png`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost text-sm"
                    title="Download QR Code"
                  >
                    <QrCode className="h-4 w-4" />
                  </a>
                  <Link
                    href={`/scan/${item.qrCode}`}
                    target="_blank"
                    className="btn btn-ghost text-sm"
                    title="Open scan page"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="btn btn-ghost text-red-600 hover:bg-red-50"
                    title="Delete item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
