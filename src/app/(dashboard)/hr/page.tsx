"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AuditTrail from "@/components/signature/audit-trail";
import {
  FileText, Plus, X, Send, Download, Eye,
  CheckCircle2, Clock, XCircle, Bell, Mail,
  Upload, RefreshCw, Loader2, History, Ban,
  ChevronDown, ChevronUp,
} from "lucide-react";

interface SignatureDoc {
  id: string;
  title: string;
  description: string | null;
  documentType: string;
  documentUrl: string | null;
  content: string | null;
  signedDocumentUrl: string | null;
  status: string;
  recipientName: string;
  recipientEmail: string;
  signToken: string | null;
  metadata: string | null;
  notes: string | null;
  sentAt: string | null;
  viewedAt: string | null;
  signedAt: string | null;
  declinedAt: string | null;
  expiresAt: string | null;
  reminderSentAt: string | null;
  reminderCount: number;
  createdAt: string;
  sender: { name: string; email: string };
  signature: {
    signatureSvg: string;
    signerName: string;
    signerIp: string | null;
    timestamp: string;
  } | null;
  _count: { auditEvents: number };
}

interface AuditEvent {
  id: string;
  event: string;
  ipAddress: string | null;
  userAgent: string | null;
  details: string | null;
  timestamp: string;
}

const statusVariant = (s: string): "default" | "success" | "warning" | "danger" | "info" => {
  const m: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
    DRAFT: "default",
    SENT: "info",
    VIEWED: "warning",
    SIGNED: "success",
    DECLINED: "danger",
    EXPIRED: "danger",
    CANCELLED: "danger",
  };
  return m[s] ?? "default";
};

const statusIcon = (s: string) => {
  const icons: Record<string, React.ReactNode> = {
    DRAFT: <FileText className="h-3.5 w-3.5" />,
    SENT: <Clock className="h-3.5 w-3.5" />,
    VIEWED: <Eye className="h-3.5 w-3.5" />,
    SIGNED: <CheckCircle2 className="h-3.5 w-3.5" />,
    DECLINED: <XCircle className="h-3.5 w-3.5" />,
    EXPIRED: <Ban className="h-3.5 w-3.5" />,
    CANCELLED: <Ban className="h-3.5 w-3.5" />,
  };
  return icons[s] ?? <FileText className="h-3.5 w-3.5" />;
};

export default function HRPage() {
  const [docs, setDocs] = useState<SignatureDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showAudit, setShowAudit] = useState<string | null>(null);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sendingIds, setSendingIds] = useState<Set<string>>(new Set());
  const [remindingIds, setRemindingIds] = useState<Set<string>>(new Set());
  const [formToast, setFormToast] = useState("");

  // Form state
  const [formMode, setFormMode] = useState<"offer" | "upload">("offer");
  const [formTitle, setFormTitle] = useState("");
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPosition, setFormPosition] = useState("");
  const [formSalary, setFormSalary] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDocType, setFormDocType] = useState("OFFER_LETTER");
  const [formFile, setFormFile] = useState<File | null>(null);

  useEffect(() => { fetchDocs(); }, []);

  async function fetchDocs() {
    try {
      const res = await fetch("/api/signature-documents");
      if (res.ok) setDocs(await res.json());
    } catch (e) {
      console.error("Failed to fetch docs", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadAudit(docId: string) {
    setAuditLoading(true);
    setShowAudit(docId);
    try {
      const res = await fetch(`/api/signature-documents/${docId}/audit`);
      if (res.ok) setAuditEvents(await res.json());
    } catch { /* ignore */ }
    setAuditLoading(false);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim() || !formName.trim() || !formEmail.trim()) return;

    setSubmitting(true);
    setFormToast("");

    try {
      if (formMode === "upload" && formFile) {
        const fd = new FormData();
        fd.append("file", formFile);
        fd.append("title", formTitle);
        fd.append("recipientName", formName);
        fd.append("recipientEmail", formEmail);
        fd.append("description", formDescription);
        fd.append("documentType", formDocType);
        const metadata = JSON.stringify({
          position: formPosition || "",
          salary: formSalary || "",
          startDate: formStartDate || "",
        });
        fd.append("metadata", metadata);

        const res = await fetch("/api/signature-documents", {
          method: "POST",
          body: fd,
        });
        if (res.ok) {
          resetForm();
          await fetchDocs();
          setFormToast("Document uploaded successfully");
        }
      } else {
        // Generate offer letter HTML
        const metadata = {
          position: formPosition || "",
          salary: formSalary || "",
          startDate: formStartDate || "",
        };

        const content = generateOfferLetterHtml({
          candidateName: formName,
          position: formPosition,
          salary: formSalary,
          startDate: formStartDate || "TBD",
          companyName: "Premier Pro Services",
        });

        const res = await fetch("/api/signature-documents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: formTitle,
            recipientName: formName,
            recipientEmail: formEmail,
            description: formDescription || null,
            documentType: formDocType,
            content: content || null,
            metadata,
          }),
        });
        if (res.ok) {
          resetForm();
          await fetchDocs();
          setFormToast("Document created successfully");
        }
      }
    } catch (e) {
      console.error("Create failed", e);
    } finally {
      setSubmitting(false);
    }
  }

  function resetForm() {
    setShowForm(false);
    setFormTitle(""); setFormName(""); setFormEmail("");
    setFormPosition(""); setFormSalary(""); setFormStartDate("");
    setFormDescription(""); setFormDocType("OFFER_LETTER"); setFormFile(null);
    setFormMode("offer");
  }

  async function sendDoc(id: string) {
    setSendingIds((p) => new Set(p).add(id));
    try {
      await fetch(`/api/signature-documents/${id}/send`, { method: "POST" });
      await fetchDocs();
    } catch { /* ignore */ }
    setSendingIds((p) => { const n = new Set(p); n.delete(id); return n; });
  }

  async function remindDoc(id: string) {
    setRemindingIds((p) => new Set(p).add(id));
    try {
      await fetch(`/api/signature-documents/${id}/remind`, { method: "POST" });
      await fetchDocs();
    } catch { /* ignore */ }
    setRemindingIds((p) => { const n = new Set(p); n.delete(id); return n; });
  }

  async function updateStatus(id: string, status: string) {
    try {
      await fetch(`/api/signature-documents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      await fetchDocs();
    } catch { /* ignore */ }
  }

  function downloadPdf(id: string) {
    window.open(`/api/signature-documents/${id}/signed-pdf`, "_blank");
  }

  const stats = {
    total: docs.length,
    draft: docs.filter((d) => d.status === "DRAFT").length,
    sent: docs.filter((d) => d.status === "SENT" || d.status === "VIEWED").length,
    signed: docs.filter((d) => d.status === "SIGNED").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">HR &amp; E-Signature</h1>
          <p className="mt-1 text-sm text-slate-500">
            Create, send, and track documents with built-in electronic signatures
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setFormMode("offer"); setShowForm(true); }}>
            <FileText className="mr-1.5 h-4 w-4" />
            Offer Letter
          </Button>
          <Button variant="outline" onClick={() => { setFormMode("upload"); setShowForm(true); }}>
            <Upload className="mr-1.5 h-4 w-4" />
            Upload Document
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "bg-slate-100 text-slate-600" },
          { label: "Drafts", value: stats.draft, icon: FileText, color: "bg-slate-100 text-slate-500" },
          { label: "Pending", value: stats.sent, icon: Clock, color: "bg-blue-100 text-blue-600" },
          { label: "Signed", value: stats.signed, icon: CheckCircle2, color: "bg-green-100 text-green-600" },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
            <div className={`rounded-lg p-2 ${s.color}`}>
              <s.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="text-lg font-bold text-slate-900">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Upload Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50" onClick={() => setShowForm(false)} />
          <Card className="relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  {formMode === "offer" ? "New Offer Letter" : "Upload Document"}
                </h2>
                <button onClick={() => setShowForm(false)} className="rounded-lg p-1 text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                {formToast && (
                  <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-700">
                    {formToast}
                  </div>
                )}

                {/* Mode toggle */}
                <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                  <button type="button"
                    onClick={() => setFormMode("offer")}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${formMode === "offer" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
                    Offer Letter
                  </button>
                  <button type="button"
                    onClick={() => setFormMode("upload")}
                    className={`flex-1 rounded-md py-1.5 text-xs font-medium transition ${formMode === "upload" ? "bg-white shadow-sm text-slate-900" : "text-slate-500"}`}>
                    Upload PDF
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Document Title *</label>
                  <Input value={formTitle} onChange={(e) => setFormTitle(e.target.value)}
                    placeholder={formMode === "offer" ? "e.g., Employment Offer — John Smith" : "e.g., Contractor Agreement"}
                    required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Name *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                    placeholder="Full name" required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Recipient Email *</label>
                  <Input value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                    type="email" placeholder="recipient@email.com" required />
                </div>

                {formMode === "offer" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Position</label>
                        <Input value={formPosition} onChange={(e) => setFormPosition(e.target.value)}
                          placeholder="e.g., Technician" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Salary</label>
                        <Input value={formSalary} onChange={(e) => setFormSalary(e.target.value)}
                          placeholder="e.g., $55,000/year" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                      <Input type="date" value={formStartDate} onChange={(e) => setFormStartDate(e.target.value)} />
                    </div>
                  </>
                )}

                {formMode === "upload" && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Document File</label>
                    <input type="file" accept=".pdf"
                      onChange={(e) => setFormFile(e.target.files?.[0] || null)}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <Input value={formDescription} onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Optional notes about this document" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
                  <select value={formDocType} onChange={(e) => setFormDocType(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500">
                    <option value="OFFER_LETTER">Offer Letter</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="AGREEMENT">Agreement</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating..." : `Create ${formMode === "offer" ? "Offer Letter" : "Document"}`}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : docs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <FileText className="mb-3 h-10 w-10 text-slate-300" />
            <p className="text-slate-500">No documents yet. Create your first offer letter or upload a document.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-slate-900 truncate">{doc.title}</h3>
                      <Badge variant={statusVariant(doc.status)}>
                        <span className="flex items-center gap-1">
                          {statusIcon(doc.status)}
                          {doc.status}
                        </span>
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" /> {doc.recipientName} ({doc.recipientEmail})
                      </span>
                      <span>{doc.documentType.replace(/_/g, " ")}</span>
                      {doc.sentAt && <span>Sent: {new Date(doc.sentAt).toLocaleDateString()}</span>}
                      {doc.viewedAt && <span className="text-purple-600">Viewed: {new Date(doc.viewedAt).toLocaleDateString()}</span>}
                      {doc.signedAt && <span className="text-green-600">Signed: {new Date(doc.signedAt).toLocaleDateString()}</span>}
                      {doc.reminderCount > 0 && (
                        <span className="text-amber-600">{doc.reminderCount} reminder{doc.reminderCount > 1 ? "s" : ""}</span>
                      )}
                    </div>

                    {/* Expanded details */}
                    {expandedDoc === doc.id && doc.signature && (
                      <div className="mt-3 rounded-lg bg-green-50 border border-green-200 p-3 space-y-1">
                        <p className="text-xs font-medium text-green-800">Signature Details</p>
                        <p className="text-xs text-green-700">Name: {doc.signature.signerName}</p>
                        {doc.signature.signerIp && (
                          <p className="text-xs text-green-700">IP: {doc.signature.signerIp}</p>
                        )}
                        <p className="text-xs text-green-700">Signed: {new Date(doc.signature.timestamp).toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setExpandedDoc(expandedDoc === doc.id ? null : doc.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100" title="Details">
                      {expandedDoc === doc.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>

                    {doc.status === "DRAFT" && (
                      <button onClick={() => sendDoc(doc.id)}
                        disabled={sendingIds.has(doc.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 disabled:opacity-50"
                        title="Send for signature">
                        {sendingIds.has(doc.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Send className="h-3 w-3" />
                        )}
                        Send
                      </button>
                    )}

                    {(doc.status === "SENT" || doc.status === "VIEWED") && (
                      <>
                        <button onClick={() => remindDoc(doc.id)}
                          disabled={remindingIds.has(doc.id)}
                          className="rounded-md p-1.5 text-amber-500 hover:bg-amber-50 disabled:opacity-50"
                          title="Send reminder">
                          {remindingIds.has(doc.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Bell className="h-4 w-4" />
                          )}
                        </button>
                        <button onClick={() => updateStatus(doc.id, "CANCELLED")}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"
                          title="Cancel">
                          <Ban className="h-4 w-4" />
                        </button>
                      </>
                    )}

                    {doc.status === "SIGNED" && (
                      <button onClick={() => downloadPdf(doc.id)}
                        className="inline-flex items-center gap-1 rounded-md bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                        title="Download signed PDF">
                        <Download className="h-3 w-3" />
                        PDF
                      </button>
                    )}

                    <button onClick={() => loadAudit(doc.id)}
                      className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                      title="Audit trail">
                      <History className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Inline audit trail */}
                {showAudit === doc.id && (
                  <div className="mt-4 border-t border-slate-100 pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-slate-700">Audit Trail</h4>
                      <button onClick={() => setShowAudit(null)}
                        className="rounded p-1 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    {auditLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-slate-300" />
                    ) : (
                      <AuditTrail events={auditEvents} />
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="rounded-lg bg-blue-100 p-2.5">
            <CheckCircle2 className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-blue-800">Internal E-Signature System</p>
            <p className="text-blue-600">
              Every signature includes timestamp, IP address logging, and full audit trail.
              Signed PDFs are generated automatically and stored. Emails sent at each step:
              sent → viewed → signed → confirmation. Configure SMTP in environment variables.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Offer Letter HTML Generator ─────────────────────────

function generateOfferLetterHtml(data: {
  candidateName: string;
  position: string;
  salary: string;
  startDate: string;
  companyName: string;
}): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Georgia', serif; color: #1e293b; line-height: 1.6; max-width: 650px; margin: 0 auto; padding: 40px 32px; }
    .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #2563eb; padding-bottom: 24px; }
    .header h1 { font-size: 22px; color: #0f172a; margin: 0 0 4px; }
    .header .company { font-size: 14px; color: #2563eb; font-weight: 600; }
    .date { text-align: right; font-size: 12px; color: #64748b; margin-bottom: 32px; }
    .salutation { font-size: 14px; margin-bottom: 20px; }
    .content { font-size: 13px; }
    .content p { margin-bottom: 14px; }
    .offer-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .offer-box table { width: 100%; font-size: 13px; }
    .offer-box td { padding: 6px 0; }
    .offer-box td:first-child { color: #64748b; width: 140px; }
    .offer-box td:last-child { font-weight: 600; }
    .signature-block { margin-top: 48px; }
    .signature-line { display: inline-block; border-top: 1px solid #94a3b8; width: 220px; margin-top: 40px; }
    .footer { margin-top: 60px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Offer of Employment</h1>
    <div class="company">${data.companyName}</div>
  </div>
  <div class="date">${today}</div>
  <div class="salutation"><p>Dear <strong>${data.candidateName}</strong>,</p></div>
  <div class="content">
    <p>We are pleased to offer you the position of <strong>${data.position}</strong> at ${data.companyName}. We were impressed with your qualifications and believe your skills will be a valuable addition to our team.</p>
    <div class="offer-box">
      <table>
        <tr><td>Position:</td><td>${data.position}</td></tr>
        <tr><td>Compensation:</td><td>${data.salary}</td></tr>
        <tr><td>Start Date:</td><td>${data.startDate}</td></tr>
        <tr><td>Company:</td><td>${data.companyName}</td></tr>
      </table>
    </div>
    <p>This offer is contingent upon the successful completion of background checks and verification of your eligibility to work.</p>
    <p>To accept this offer, please sign below. We look forward to welcoming you to the team.</p>
    <p>Sincerely,<br/><strong>${data.companyName}</strong><br/>Human Resources</p>
  </div>
  <div class="signature-block">
    <p style="font-size:13px; font-weight:600; margin-bottom:8px;">Acceptance of Offer</p>
    <p style="font-size:12px; color:#64748b;">I, <strong>${data.candidateName}</strong>, accept the offer of employment as described above.</p>
  </div>
  <div class="footer">
    <p>${data.companyName} &bull; This document contains confidential information.</p>
  </div>
</body>
</html>`;
}
