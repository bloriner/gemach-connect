"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileText,
  ArrowLeft,
} from "lucide-react";

const SignaturePad = dynamic(() => import("@/components/signature/signature-pad"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[180px] items-center justify-center rounded-lg border-2 border-dashed border-slate-200 bg-slate-50">
      <Loader2 className="h-6 w-6 animate-spin text-slate-300" />
    </div>
  ),
});

interface DocData {
  id: string;
  title: string;
  description?: string;
  content?: string;
  documentUrl?: string;
  documentType: string;
  recipientName: string;
  senderName: string;
  status: string;
  metadata?: string;
  alreadySigned?: boolean;
  alreadyDeclined?: boolean;
  message?: string;
}

export default function SigningPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [doc, setDoc] = useState<DocData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [signatureSvg, setSignatureSvg] = useState("");
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [signerName, setSignerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [declining, setDeclining] = useState(false);

  useEffect(() => {
    async function loadDoc() {
      try {
        const res = await fetch(`/api/sign-public/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load document");
        setDoc(data);

        // Pre-fill signer name
        if (data.recipientName) setSignerName(data.recipientName);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (token) loadDoc();
  }, [token]);

  const handleSign = async () => {
    if (!doc || !signerName.trim() || signatureEmpty) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/signature-documents/${doc.id}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signatureSvg, signerName: signerName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Signing failed");

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDecline = async () => {
    if (!doc) return;
    setDeclining(true);
    try {
      const res = await fetch(`/api/signature-documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DECLINED" }),
      });
      if (res.ok) setSuccess(true);
    } catch {
      setError("Failed to decline. Please try again.");
    } finally {
      setDeclining(false);
    }
  };

  // ── States ──────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error && !doc) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-10">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Unable to Load</h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-10">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              {signatureEmpty ? "Response Recorded" : "Document Signed!"}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {signatureEmpty
                ? "Your response has been recorded. Thank you."
                : "Your signature has been captured. A confirmation email will be sent shortly."}
            </p>
            <p className="mt-4 text-xs text-slate-400">
              You may close this window.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!doc) return null;

  if (doc.alreadySigned) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-10">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-400" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Already Signed</h2>
            <p className="mt-2 text-sm text-slate-500">This document has already been signed.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (doc.alreadyDeclined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-10">
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Already Declined</h2>
            <p className="mt-2 text-sm text-slate-500">This document has been declined.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse metadata for offer letter specific display
  let metadata: any = null;
  try {
    if (doc.metadata) metadata = JSON.parse(doc.metadata);
  } catch { /* ignore */ }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-600" />
            <span className="text-sm font-semibold text-slate-900">Premier Pro Services</span>
          </div>
          <span className="text-xs text-slate-400">Secure E-Signature</span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{doc.title}</h1>
          <p className="mt-1 text-sm text-slate-500">
            From: {doc.senderName} &bull; Document Type: {doc.documentType.replace(/_/g, " ")}
          </p>
          {doc.description && (
            <p className="mt-2 text-sm text-slate-600">{doc.description}</p>
          )}
        </div>

        {/* Document Preview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-600" />
              <h2 className="font-semibold text-slate-900">Document Preview</h2>
            </div>
          </CardHeader>
          <CardContent>
            {doc.documentUrl ? (
              <iframe
                src={doc.documentUrl}
                className="h-[500px] w-full rounded-lg border border-slate-200"
              />
            ) : doc.content ? (
              <iframe
                srcDoc={doc.content}
                className="h-[500px] w-full rounded-lg border border-slate-200"
              />
            ) : (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <FileText className="mr-2 h-5 w-5" />
                No preview available
              </div>
            )}

            {/* Offer letter metadata display */}
            {doc.documentType === "OFFER_LETTER" && metadata && (
              <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {metadata.position && (
                    <>
                      <span className="text-slate-500">Position:</span>
                      <span className="font-medium text-slate-900">{metadata.position}</span>
                    </>
                  )}
                  {metadata.salary && (
                    <>
                      <span className="text-slate-500">Compensation:</span>
                      <span className="font-medium text-slate-900">{metadata.salary}</span>
                    </>
                  )}
                  {metadata.startDate && (
                    <>
                      <span className="text-slate-500">Start Date:</span>
                      <span className="font-medium text-slate-900">{metadata.startDate}</span>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Signature */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-slate-900">Your Signature</h2>
            <p className="text-sm text-slate-500">
              Please draw your signature below and type your name to confirm.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <SignaturePad
              onSignatureChange={(svg, isEmpty) => {
                setSignatureSvg(svg);
                setSignatureEmpty(isEmpty);
              }}
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Printed Name *
              </label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Type your full name"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSign}
                disabled={submitting || signatureEmpty || !signerName.trim()}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  "Sign Document"
                )}
              </Button>
              <Button
                onClick={handleDecline}
                disabled={declining}
                variant="outline"
              >
                {declining ? "..." : "Decline"}
              </Button>
            </div>

            <div className="flex items-center gap-4 text-xs text-slate-400 pt-2">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Timestamp recorded upon signing
              </span>
              <span className="inline-flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                IP address logged for audit
              </span>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
