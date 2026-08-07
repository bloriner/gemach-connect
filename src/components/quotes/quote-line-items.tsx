"use client";

import { Plus, Trash2 } from "lucide-react";

export interface QuoteLineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  optional: boolean;
  category: string;
}

interface Props {
  items: QuoteLineItem[];
  onChange: (items: QuoteLineItem[]) => void;
  readOnly?: boolean;
}

const CATEGORIES = [
  { value: "LABOR", label: "Labor" },
  { value: "MATERIALS", label: "Materials" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "OTHER", label: "Other" },
];

export default function QuoteLineItems({ items, onChange, readOnly }: Props) {
  function addItem() {
    onChange([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
        optional: false,
        category: "LABOR",
      },
    ]);
  }

  function removeItem(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof QuoteLineItem, value: string | number | boolean) {
    const updated = items.map((item, i) => {
      if (i !== idx) return item;
      const newItem = { ...item, [field]: value };

      // Recalculate total when quantity or unitPrice changes
      if (field === "quantity" || field === "unitPrice") {
        newItem.total = newItem.quantity * newItem.unitPrice;
      }

      return newItem;
    });
    onChange(updated);
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 6.0;
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-700">Line Items</span>
        {!readOnly && (
          <button
            type="button"
            onClick={addItem}
            className="inline-flex items-center gap-1 rounded-lg border border-brand-200 px-3 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Item
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center border-2 border-dashed border-slate-200 rounded-lg">
          No line items yet. Add one to get started.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
                <th className="pb-2 pr-2 w-[35%]">Description</th>
                {!readOnly && <th className="pb-2 pr-2 w-[12%]">Category</th>}
                <th className="pb-2 px-2 w-[10%] text-right">Qty</th>
                <th className="pb-2 px-2 w-[15%] text-right">Unit Price</th>
                <th className="pb-2 pl-2 w-[15%] text-right">Total</th>
                {!readOnly && <th className="pb-2 pl-2 w-[8%]"></th>}
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx} className="border-b border-slate-100">
                  <td className="py-2 pr-2">
                    {readOnly ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900">{item.description}</span>
                        {item.optional && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                            Optional
                          </span>
                        )}
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => updateItem(idx, "description", e.target.value)}
                        placeholder="Item description"
                        className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    )}
                  </td>
                  {!readOnly && (
                    <td className="py-2 pr-2">
                      <select
                        value={item.category}
                        onChange={(e) => updateItem(idx, "category", e.target.value)}
                        className="w-full rounded border border-slate-200 px-1.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-brand-500"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  <td className="py-2 px-2 text-right">
                    {readOnly ? (
                      <span className="text-slate-900">{item.quantity}</span>
                    ) : (
                      <input
                        type="number"
                        min={0}
                        step={0.5}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(idx, "quantity", parseFloat(e.target.value) || 0)
                        }
                        className="w-16 rounded border border-slate-200 px-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-500"
                      />
                    )}
                  </td>
                  <td className="py-2 px-2 text-right">
                    {readOnly ? (
                      <span className="text-slate-900">${item.unitPrice.toFixed(2)}</span>
                    ) : (
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                          $
                        </span>
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)
                          }
                          className="w-full rounded border border-slate-200 pl-5 pr-2 py-1.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-brand-500"
                        />
                      </div>
                    )}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <span className="text-slate-900 font-medium">
                      ${item.total.toFixed(2)}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="py-2 pl-2 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Totals */}
      {items.length > 0 && (
        <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500">Subtotal</span>
            <span className="text-slate-900">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Tax (6.0%)</span>
            <span className="text-slate-900">${taxAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-slate-900 pt-1 border-t border-slate-100">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
