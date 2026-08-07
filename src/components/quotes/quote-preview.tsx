"use client";

import { format } from "date-fns";
import QuoteLineItems, { QuoteLineItem } from "./quote-line-items";
import { X } from "lucide-react";

interface QuoteData {
  quoteNumber: string;
  customer: { companyName: string; email?: string | null; phone?: string | null; billingAddress?: string | null };
  property?: { address: string; city?: string | null; state?: string | null; zipCode?: string | null } | null;
  items: QuoteLineItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  notes?: string | null;
  validUntil?: string | null;
  createdBy?: { name: string } | null;
  createdAt?: string;
}

interface Props {
  quote: QuoteData;
  onClose: () => void;
}

export default function QuotePreview({ quote, onClose }: Props) {
  const propertyAddress = quote.property
    ? [quote.property.address, quote.property.city, quote.property.state, quote.property.zipCode]
        .filter(Boolean)
        .join(", ")
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-8 py-5 rounded-t-xl">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Quote Preview</h2>
            <p className="text-xs text-slate-500 mt-0.5">{quote.quoteNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-6">
          {/* Company branding */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-brand-700">Premier Pro Services</h3>
            <p className="text-xs text-slate-500">Commercial Floor Care Specialists</p>
          </div>

          <div className="border-t border-slate-200" />

          {/* Quote info */}
          <div className="grid grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Prepared For</p>
              <p className="font-semibold text-slate-900">{quote.customer.companyName}</p>
              {quote.customer.email && <p className="text-slate-500">{quote.customer.email}</p>}
              {quote.customer.phone && <p className="text-slate-500">{quote.customer.phone}</p>}
              {quote.customer.billingAddress && (
                <p className="text-slate-500 mt-1">{quote.customer.billingAddress}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Quote Details</p>
              <p className="text-slate-900">
                <span className="text-slate-500">#:</span> {quote.quoteNumber}
              </p>
              {quote.createdAt && (
                <p className="text-slate-500">
                  Date: {format(new Date(quote.createdAt), "MMM d, yyyy")}
                </p>
              )}
              {quote.validUntil && (
                <p className="text-slate-500">
                  Valid until: {format(new Date(quote.validUntil), "MMM d, yyyy")}
                </p>
              )}
              {quote.createdBy && (
                <p className="text-slate-500">Prepared by: {quote.createdBy.name}</p>
              )}
            </div>
          </div>

          {propertyAddress && (
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                Property / Service Location
              </p>
              <p className="text-sm text-slate-900">{propertyAddress}</p>
            </div>
          )}

          <div className="border-t border-slate-200" />

          {/* Line Items */}
          <QuoteLineItems
            items={quote.items.map((item) => ({
              ...item,
              category: item.category ?? "OTHER",
            }))}
            onChange={() => {}}
            readOnly
          />

          {quote.notes && (
            <>
              <div className="border-t border-slate-200" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{quote.notes}</p>
              </div>
            </>
          )}

          <div className="border-t border-slate-200 pt-4 text-center text-xs text-slate-400">
            <p>Thank you for choosing Premier Pro Services</p>
            <p className="mt-0.5">This quote is valid for 30 days unless otherwise noted</p>
          </div>
        </div>
      </div>
    </div>
  );
}
