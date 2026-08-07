"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Truck, ArrowRight, UserPlus } from "lucide-react";

export default function PortalLandingPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "token">("login");

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Token login state
  const [token, setToken] = useState("");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    try {
      const res = await fetch("/api/portal/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      document.cookie = `portal-token=${data.portalToken}; path=/; max-age=86400; SameSite=Lax`;
      router.push("/portal/dashboard");
    } catch (err: any) {
      setLoginError(err.message);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleTokenLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;
    document.cookie = `portal-token=${token.trim()}; path=/; max-age=86400; SameSite=Lax`;
    router.push("/portal/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100">
          <Truck className="h-8 w-8 text-brand-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900">Customer Portal</h1>
        <p className="mt-2 text-slate-500">
          Track your orders, view invoices, and stay up to date
        </p>
      </div>

      <Card className="w-full max-w-md">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              tab === "login"
                ? "border-b-2 border-brand-600 text-brand-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Email &amp; Password
          </button>
          <button
            onClick={() => setTab("token")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              tab === "token"
                ? "border-b-2 border-brand-600 text-brand-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Access Token
          </button>
        </div>

        <CardContent className="pt-6">
          {tab === "login" ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              {loginError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-700">
                  {loginError}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? "Signing in..." : "Sign In"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-center text-sm text-slate-500">
                Don&apos;t have an account?{" "}
                <Link href="/portal/signup" className="font-medium text-brand-600 hover:text-brand-700">
                  Create one
                </Link>
              </p>
            </form>
          ) : (
            <form onSubmit={handleTokenLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Portal Access Token
                </label>
                <Input
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter your access token..."
                  required
                  className="font-mono"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Your token can be found on any invoice or provided by our office.
                </p>
              </div>
              <Button type="submit" className="w-full">
                Access Portal
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          )}

          {/* Sign up CTA */}
          <div className="mt-6 rounded-lg bg-brand-50 border border-brand-100 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-brand-900">New customer?</p>
              <p className="text-xs text-brand-600">Create an account to get started</p>
            </div>
            <Link href="/portal/signup">
              <Button variant="secondary" size="sm">
                <UserPlus className="mr-1.5 h-4 w-4" />
                Sign Up
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3 max-w-2xl">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
            <Truck className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Track Orders</h3>
          <p className="mt-1 text-xs text-slate-500">See real-time status of all your jobs</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">View Invoices</h3>
          <p className="mt-1 text-xs text-slate-500">Download and review all your invoices</p>
        </div>
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Stay Informed</h3>
          <p className="mt-1 text-xs text-slate-500">Get updates on job progress automatically</p>
        </div>
      </div>
    </div>
  );
}
