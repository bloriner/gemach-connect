"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Users, Building2, ShieldCheck } from "lucide-react";

interface BillingSplit {
  id: string;
  partyName: string;
  partyType: string;
  splitPercent: number;
  splitAmount: number | null;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  billingAddress: string | null;
  notes: string | null;
}

interface BillingData {
  id: string;
  orderNumber: string;
  billingType: string;
  billingNotes: string | null;
  price: number | null;
  customer: { companyName: string };
  billingSplits: BillingSplit[];
}

interface NewSplit {
  partyName: string;
  partyType: string;
  splitPercent: number;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  billingAddress: string;
  notes: string;
}

const PARTY_TYPES = [
  { value: "TENANT", label: "Tenant" },
  { value: "OWNER", label: "Building Owner" },
  { value: "PROPERTY_MANAGER", label: "Property Manager" },
  { value: "INSURANCE", label: "Insurance" },
  { value: "OTHER", label: "Other" },
];

const partyTypeIcon = (type: string) => {
  switch (type) {
    case "TENANT":
      return <Users className="h-4 w-4 text-blue-500" />;
    case "OWNER":
      return <Building2 className="h-4 w-4 text-purple-500" />;
    case "INSURANCE":
      return <ShieldCheck className="h-4 w-4 text-green-500" />;
    case "PROPERTY_MANAGER":
      return <Building2 className="h-4 w-4 text-amber-500" />;
    default:
      return <Users className="h-4 w-4 text-slate-400" />;
  }
};

export default function BillingSplitEditor({
  orderId,
  orderPrice,
  onSaved,
}: {
  orderId: string;
  orderPrice: number | null;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<BillingData | null>(null);
  const [billingType, setBillingType] = useState<string>("SINGLE");
  const [billingNotes, setBillingNotes] = useState("");
  const [newSplits, setNewSplits] = useState<NewSplit[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${orderId}/billing`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setBillingType(d.billingType ?? "SINGLE");
        setBillingNotes(d.billingNotes ?? "");
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load billing data");
        setLoading(false);
      });
  }, [orderId]);

  const totalSplitPercent =
    (data?.billingSplits ?? []).reduce((sum, s) => sum + s.splitPercent, 0) +
    newSplits.reduce((sum, s) => sum + s.splitPercent, 0);

  const remainingPercent = 100 - totalSplitPercent;

  function addSplit() {
    setNewSplits((prev) => [
      ...prev,
      {
        partyName: "",
        partyType: "TENANT",
        splitPercent: 0,
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        billingAddress: "",
        notes: "",
      },
    ]);
  }

  function removeNewSplit(idx: number) {
    setNewSplits((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateNewSplit(idx: number, field: keyof NewSplit, value: string | number) {
    setNewSplits((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const allSplits = [
        ...(data?.billingSplits ?? []).map((s) => ({
          partyName: s.partyName,
          partyType: s.partyType,
          splitPercent: s.splitPercent,
          splitAmount: s.splitAmount,
          contactName: s.contactName,
          contactEmail: s.contactEmail,
          contactPhone: s.contactPhone,
          billingAddress: s.billingAddress,
          notes: s.notes,
        })),
        ...newSplits.filter((s) => s.partyName.trim()),
      ];

      if (billingType === "SPLIT" && allSplits.length === 0) {
        setError("Add at least one billing party for split billing.");
        setSaving(false);
        return;
      }

      if (billingType === "SPLIT" && totalSplitPercent !== 100) {
        setError(`Split percentages must total 100%. Currently: ${totalSplitPercent}%`);
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/orders/${orderId}/billing`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingType,
          billingNotes: billingNotes || null,
          splits: billingType === "SPLIT" ? allSplits : [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? "Failed to save");
        return;
      }

      const updated = await res.json();
      setData(updated);
      setBillingType(updated.billingType);
      setBillingNotes(updated.billingNotes ?? "");
      setNewSplits([]);
      onSaved();
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function removeExistingSplit(splitId: string) {
    if (!data) return;
    const remaining = data.billingSplits.filter((s) => s.id !== splitId);
    const res = await fetch(`/api/orders/${orderId}/billing`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        billingType,
        billingNotes: billingNotes || null,
        splits: remaining.map((s) => ({
          partyName: s.partyName,
          partyType: s.partyType,
          splitPercent: s.splitPercent,
          splitAmount: s.splitAmount,
          contactName: s.contactName,
          contactEmail: s.contactEmail,
          contactPhone: s.contactPhone,
          billingAddress: s.billingAddress,
          notes: s.notes,
        })),
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setData(updated);
    }
  }

  const price = orderPrice ?? 0;

  if (loading) {
    return (
      <div className="flex justify-center py-8 text-sm text-slate-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading billing...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Billing Type Toggle */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Billing Type
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setBillingType("SINGLE")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              billingType === "SINGLE"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Single Party
          </button>
          <button
            type="button"
            onClick={() => setBillingType("SPLIT")}
            className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              billingType === "SPLIT"
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            Split Billing
          </button>
        </div>
      </div>

      {/* Billing Notes */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Billing Notes
        </label>
        <textarea
          value={billingNotes}
          onChange={(e) => setBillingNotes(e.target.value)}
          placeholder="Internal notes about billing arrangement..."
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none"
        />
      </div>

      {/* Split Billing Section */}
      {billingType === "SPLIT" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">
              Billing Parties
            </span>
            <span className="text-xs text-slate-500">
              Order total: ${price.toFixed(2)}
            </span>
          </div>

          {/* Existing splits */}
          {(data?.billingSplits ?? []).map((split) => (
            <Card key={split.id} className="border-slate-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {partyTypeIcon(split.partyType)}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {split.partyName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {PARTY_TYPES.find((t) => t.value === split.partyType)?.label ??
                          split.partyType}{" "}
                        &middot; {split.splitPercent}% &middot; $
                        {(price * (split.splitPercent / 100)).toFixed(2)}
                      </p>
                      {split.contactName && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {split.contactName}
                          {split.contactEmail ? ` · ${split.contactEmail}` : ""}
                          {split.contactPhone ? ` · ${split.contactPhone}` : ""}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeExistingSplit(split.id)}
                    className="shrink-0 rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Remove party"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* New splits being added */}
          {newSplits.map((split, idx) => (
            <Card key={`new-${idx}`} className="border-dashed border-brand-300 bg-brand-50/30">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-brand-700">
                      New Party
                    </span>
                    <button
                      onClick={() => removeNewSplit(idx)}
                      className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Party Name *</label>
                      <input
                        value={split.partyName}
                        onChange={(e) => updateNewSplit(idx, "partyName", e.target.value)}
                        placeholder="e.g., Acme Tenant Co."
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Type</label>
                      <select
                        value={split.partyType}
                        onChange={(e) => updateNewSplit(idx, "partyType", e.target.value)}
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                      >
                        {PARTY_TYPES.map((t) => (
                          <option key={t.value} value={t.value}>
                            {t.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Split % *</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={split.splitPercent || ""}
                        onChange={(e) =>
                          updateNewSplit(idx, "splitPercent", parseFloat(e.target.value) || 0)
                        }
                        placeholder="0"
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">
                        Amount ($)
                      </label>
                      <input
                        type="text"
                        value={
                          split.splitPercent > 0
                            ? (price * (split.splitPercent / 100)).toFixed(2)
                            : ""
                        }
                        readOnly
                        className="w-full rounded border border-slate-100 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Contact Name</label>
                      <input
                        value={split.contactName}
                        onChange={(e) => updateNewSplit(idx, "contactName", e.target.value)}
                        placeholder="Jane Doe"
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Contact Email</label>
                      <input
                        type="email"
                        value={split.contactEmail}
                        onChange={(e) => updateNewSplit(idx, "contactEmail", e.target.value)}
                        placeholder="jane@example.com"
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Phone</label>
                      <input
                        type="tel"
                        value={split.contactPhone}
                        onChange={(e) => updateNewSplit(idx, "contactPhone", e.target.value)}
                        placeholder="(555) 123-4567"
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500 mb-0.5">Billing Address</label>
                      <input
                        value={split.billingAddress}
                        onChange={(e) => updateNewSplit(idx, "billingAddress", e.target.value)}
                        placeholder="123 Main St, City, ST"
                        className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-0.5">Notes</label>
                    <input
                      value={split.notes}
                      onChange={(e) => updateNewSplit(idx, "notes", e.target.value)}
                      placeholder="Optional notes"
                      className="w-full rounded border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add party button */}
          <button
            type="button"
            onClick={addSplit}
            className="w-full rounded-lg border-2 border-dashed border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50 transition"
          >
            <Plus className="mr-1.5 inline h-4 w-4" />
            Add Billing Party
          </button>

          {/* Split summary */}
          {totalSplitPercent > 0 && (
            <div
              className={`rounded-lg px-3 py-2 text-xs font-medium ${
                totalSplitPercent === 100
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Total: {totalSplitPercent}% allocated
              {totalSplitPercent !== 100 && (
                <span className="ml-1">
                  ({remainingPercent}% remaining)
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      {/* Save */}
      <Button onClick={handleSave} disabled={saving} className="w-full" size="sm">
        {saving ? (
          <>
            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Billing"
        )}
      </Button>
    </div>
  );
}
