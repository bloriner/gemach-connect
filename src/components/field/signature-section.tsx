"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { PenLine, Check, AlertCircle } from "lucide-react";

// Dynamically import SignaturePad to avoid SSR canvas issues
const SignaturePad = dynamic(() => import("@/components/signature/signature-pad"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-[180px] bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
      <p className="text-sm text-slate-400">Loading signature pad...</p>
    </div>
  ),
});

interface SignatureSectionProps {
  onSave: (signatureSvg: string, signerName: string) => void;
  loading?: boolean;
  savedSignature?: { signatureSvg: string; signerName?: string; signedAt?: string } | null;
}

export function SignatureSection({ onSave, loading, savedSignature }: SignatureSectionProps) {
  const [sigSvg, setSigSvg] = useState("");
  const [isEmpty, setIsEmpty] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(!!savedSignature);

  const handleSignatureChange = (svg: string, empty: boolean) => {
    setSigSvg(svg);
    setIsEmpty(empty);
  };

  const handleSave = () => {
    if (isEmpty) {
      setError("Please draw a signature first");
      return;
    }
    if (!signerName.trim()) {
      setError("Please enter the signer's name");
      return;
    }
    setError(null);
    onSave(sigSvg, signerName.trim());
    setSaved(true);
  };

  if (saved && savedSignature) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2 text-green-700 font-medium text-sm">
            <Check className="h-4 w-4" />
            Signature captured
          </div>
          <p className="text-xs text-green-600 mt-1">
            Signed by {savedSignature.signerName || "Customer"}
            {savedSignature.signedAt &&
              ` on ${new Date(savedSignature.signedAt).toLocaleString()}`}
          </p>
          <div
            className="mt-3 bg-white rounded-md border border-green-100 p-2"
            dangerouslySetInnerHTML={{ __html: savedSignature.signatureSvg }}
          />
        </div>
      </div>
    );
  }

  if (saved) {
    return (
      <div className="flex flex-col items-center py-8 text-slate-400">
        <Check className="h-10 w-10 text-green-500 mb-2" />
        <p className="text-sm font-medium text-green-600">Signature saved successfully</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <PenLine className="h-4 w-4 text-brand-600" />
        Customer Signature
      </div>

      <SignaturePad onSignatureChange={handleSignatureChange} />

      <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
          Printed Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={signerName}
          onChange={(e) => setSignerName(e.target.value)}
          placeholder="Customer name"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
        />
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading || isEmpty}
        className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? "Saving..." : "Save Signature"}
      </button>
    </div>
  );
}
