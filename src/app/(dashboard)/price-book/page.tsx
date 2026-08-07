"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import {
  Plus,
  X,
  Loader2,
  CheckCircle2,
  Search,
  Pencil,
  ToggleLeft,
  ToggleRight,
  Trash2,
} from "lucide-react";

interface PriceItem {
  id: string;
  name: string;
  description: string | null;
  category: string;
  unit: string;
  unitPrice: number;
  taxable: boolean;
  active: boolean;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "CARPET", label: "Carpet" },
  { value: "PAD", label: "Pad" },
  { value: "LABOR", label: "Labor" },
  { value: "REMOVAL", label: "Removal" },
  { value: "REPAIR", label: "Repair" },
  { value: "TREATMENT", label: "Treatment" },
  { value: "OTHER", label: "Other" },
];

const UNITS = [
  { value: "SQFT", label: "Sq Ft" },
  { value: "LNFT", label: "Linear Ft" },
  { value: "HOUR", label: "Hour" },
  { value: "EACH", label: "Each" },
  { value: "JOB", label: "Job" },
  { value: "GAL", label: "Gallon" },
];

const UNIT_LABELS: Record<string, string> = {
  SQFT: "per sq ft",
  LNFT: "per linear ft",
  HOUR: "per hour",
  EACH: "each",
  JOB: "per job",
  GAL: "per gallon",
};

const CATEGORY_COLORS: Record<string, string> = {
  CARPET: "bg-blue-50 text-blue-700",
  PAD: "bg-purple-50 text-purple-700",
  LABOR: "bg-amber-50 text-amber-700",
  REMOVAL: "bg-red-50 text-red-700",
  REPAIR: "bg-green-50 text-green-700",
  TREATMENT: "bg-teal-50 text-teal-700",
  OTHER: "bg-slate-100 text-slate-600",
};

export default function PriceBookPage() {
  const [items, setItems] = useState<PriceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<PriceItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Form
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("LABOR");
  const [formUnit, setFormUnit] = useState("SQFT");
  const [formUnitPrice, setFormUnitPrice] = useState("");
  const [formTaxable, setFormTaxable] = useState(true);
  const [formActive, setFormActive] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ includeInactive: "true" });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      const res = await fetch(`/api/price-book?${params}`);
      if (res.ok) setItems(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [category, search]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function resetForm() {
    setFormName("");
    setFormDescription("");
    setFormCategory("LABOR");
    setFormUnit("SQFT");
    setFormUnitPrice("");
    setFormTaxable(true);
    setFormActive(true);
    setEditingItem(null);
  }

  function openCreate() {
    resetForm();
    setShowModal(true);
  }

  function openEdit(item: PriceItem) {
    setEditingItem(item);
    setFormName(item.name);
    setFormDescription(item.description ?? "");
    setFormCategory(item.category);
    setFormUnit(item.unit);
    setFormUnitPrice(item.unitPrice.toString());
    setFormTaxable(item.taxable);
    setFormActive(item.active);
    setShowModal(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!formName || !formUnitPrice) return;

    setSubmitting(true);
    try {
      const body = {
        name: formName,
        description: formDescription || null,
        category: formCategory,
        unit: formUnit,
        unitPrice: parseFloat(formUnitPrice),
        taxable: formTaxable,
        active: formActive,
      };

      let res;
      if (editingItem) {
        res = await fetch(`/api/price-book/${editingItem.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch("/api/price-book", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        setShowModal(false);
        resetForm();
        showToast(editingItem ? "Item updated!" : "Item added!");
        fetchItems();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to save");
      }
    } catch {
      showToast("Network error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggleActive(item: PriceItem) {
    try {
      const res = await fetch(`/api/price-book/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !item.active }),
      });
      if (res.ok) {
        showToast(item.active ? "Item deactivated" : "Item activated");
        fetchItems();
      }
    } catch {
      showToast("Network error");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this price item?")) return;
    try {
      const res = await fetch(`/api/price-book/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast("Item deleted");
        fetchItems();
      } else {
        const err = await res.json();
        showToast(err.error ?? "Failed to delete");
      }
    } catch {
      showToast("Network error");
    }
  }

  const columns = [
    {
      header: "Item",
      accessor: (item: PriceItem) => (
        <div>
          <span className={`font-medium ${item.active ? "text-slate-900" : "text-slate-400"}`}>
            {item.name}
          </span>
          {item.description && (
            <p className="text-xs text-slate-400 truncate max-w-[200px]">
              {item.description}
            </p>
          )}
        </div>
      ),
    },
    {
      header: "Category",
      accessor: (item: PriceItem) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            CATEGORY_COLORS[item.category] ?? "bg-slate-100 text-slate-600"
          }`}
        >
          {item.category}
        </span>
      ),
    },
    {
      header: "Unit",
      accessor: (item: PriceItem) => (
        <span className="text-xs text-slate-600">{UNIT_LABELS[item.unit] ?? item.unit}</span>
      ),
      hideOnMobile: true,
    },
    {
      header: "Price",
      accessor: (item: PriceItem) => (
        <span className={`font-semibold ${item.active ? "text-slate-900" : "text-slate-400"}`}>
          ${item.unitPrice.toFixed(2)}
        </span>
      ),
    },
    {
      header: "Tax",
      accessor: (item: PriceItem) => (
        <Badge variant={item.taxable ? "info" : "default"} className="text-[10px]">
          {item.taxable ? "Taxable" : "Non-tax"}
        </Badge>
      ),
      hideOnMobile: true,
    },
    {
      header: "",
      accessor: (item: PriceItem) => (
        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleActive(item);
            }}
            className="rounded p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title={item.active ? "Deactivate" : "Activate"}
          >
            {item.active ? (
              <ToggleRight className="h-4 w-4 text-green-500" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-slate-300" />
            )}
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(item);
            }}
            className="rounded p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            className="rounded p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-400" />
            {toast}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">Price Book</h1>
          <p className="mt-1 text-sm text-slate-500">
            {items.length} item{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button className="w-full sm:w-auto" size="sm" onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search price book..."
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-medium transition ${
                category === c.value
                  ? "bg-brand-600 text-white shadow-sm"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => {
              setShowModal(false);
              resetForm();
            }}
          />
          <Card className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-6 py-4 rounded-t-xl">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingItem ? "Edit Item" : "Add Price Item"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <CardContent className="pt-5">
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                    placeholder="e.g., Nylon Carpet"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="e.g., 26oz commercial grade"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                    >
                      {CATEGORIES.filter((c) => c.value).map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Unit
                    </label>
                    <select
                      value={formUnit}
                      onChange={(e) => setFormUnit(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                    >
                      {UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Unit Price ($) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={0.01}
                    value={formUnitPrice}
                    onChange={(e) => setFormUnitPrice(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formTaxable}
                      onChange={(e) => setFormTaxable(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Taxable
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={formActive}
                      onChange={(e) => setFormActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                    />
                    Active
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formName || !formUnitPrice}
                    className="flex-[2] rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50"
                  >
                    {submitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </span>
                    ) : editingItem ? (
                      "Save Changes"
                    ) : (
                      "Add Item"
                    )}
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12 text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Loading...
            </div>
          ) : (
            <ResponsiveTable
              data={items}
              columns={columns}
              keyField={(item) => item.id}
              emptyMessage="No price items yet. Add your first item to build the catalog."
              mobileLabel={(item) => (
                <span className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${item.active ? "text-slate-900" : "text-slate-400"}`}>
                    {item.name}
                  </span>
                  <span
                    className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${
                      CATEGORY_COLORS[item.category] ?? ""
                    }`}
                  >
                    {item.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-700 ml-auto">
                    ${item.unitPrice.toFixed(2)}
                  </span>
                </span>
              )}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
