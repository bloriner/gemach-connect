"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Database,
  Users,
  Heart,
  Package,
  MessageSquare,
  Bookmark,
  Activity,
} from "lucide-react";

interface TestResult {
  name: string;
  status: "pass" | "fail" | "warn";
  detail: string;
  ms?: number;
}

interface Diagnostics {
  results: TestResult[];
  summary: { pass: number; fail: number; warn: number; total: number };
  timestamp: string;
}

export default function AdminPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (sessionStatus === "authenticated") {
      runDiagnostics();
    }
  }, [sessionStatus]);

  async function runDiagnostics() {
    setRunning(true);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/diagnostics");
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }
      const data = await res.json();
      setDiag(data);
    } catch {
      setDiag(null);
    }
    setLoading(false);
    setRunning(false);
  }

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const statusIcon = (s: string) => {
    switch (s) {
      case "pass": return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "fail": return <XCircle className="h-5 w-5 text-red-500" />;
      case "warn": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    }
  };

  const statCards = [
    { label: "Total Tests", value: diag?.summary.total ?? "-", icon: Activity, color: "bg-blue-50 text-blue-600" },
    { label: "Passed", value: diag?.summary.pass ?? "-", icon: CheckCircle, color: "bg-green-50 text-green-600" },
    { label: "Warnings", value: diag?.summary.warn ?? "-", icon: AlertTriangle, color: "bg-amber-50 text-amber-600" },
    { label: "Failed", value: diag?.summary.fail ?? "-", icon: XCircle, color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary-600" />
            <span className="text-lg font-bold text-gray-900">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <span>{session?.user?.email}</span>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn btn-ghost text-sm"
            >
              Back to App
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Diagnostics</h1>
            <p className="text-gray-500 mt-1">
              {diag ? `Last run: ${new Date(diag.timestamp).toLocaleString()}` : "Run tests to verify system health"}
            </p>
          </div>
          <button onClick={runDiagnostics} disabled={running} className="btn btn-primary">
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {running ? "Running..." : "Run Tests"}
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          {statCards.map((s) => (
            <div key={s.label} className="card p-5 flex items-center gap-4">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Test Results */}
        {diag && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50">
              <h2 className="font-semibold text-gray-900">Test Results</h2>
            </div>
            <div className="divide-y">
              {diag.results.map((r, i) => (
                <div key={i} className="px-6 py-4 flex items-start gap-4">
                  <div className="mt-0.5">{statusIcon(r.status)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <span className={`badge ${
                        r.status === "pass" ? "bg-green-50 text-green-700" :
                        r.status === "fail" ? "bg-red-50 text-red-700" :
                        "bg-amber-50 text-amber-700"
                      }`}>{r.status.toUpperCase()}</span>
                      {r.ms != null && <span className="text-xs text-gray-400">{r.ms}ms</span>}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{r.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Links</h2>
          <div className="grid gap-3 md:grid-cols-4">
            {[
              { href: "/dashboard", label: "Dashboard", icon: Activity },
              { href: "/gemachs", label: "Browse Gemachs", icon: Heart },
              { href: "/dashboard/requests", label: "Requests", icon: Package },
              { href: "/dashboard/messages", label: "Messages", icon: MessageSquare },
            ].map((l) => (
              <a key={l.href} href={l.href} className="btn btn-secondary justify-start">
                <l.icon className="h-4 w-4" /> {l.label}
              </a>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
