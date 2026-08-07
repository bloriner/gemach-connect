"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/ui/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="flex min-h-screen">
      {/* Left: Brand Panel */}
      <div className="hidden w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 lg:flex flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-[0.04]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent opacity-60" />

        <div className="relative">
          <Logo className="scale-110 origin-left" dark />
          <p className="mt-6 max-w-md text-lg text-slate-400 leading-relaxed">
            Commercial real estate field service management. 
            Carpet, commercial flooring, restoration, and property services — streamlined.
          </p>

          {/* Services */}
          <div className="mt-10 grid grid-cols-2 gap-3 max-w-md">
            {[
              { icon: "▦", label: "Commercial Carpet" },
              { icon: "◫", label: "Flooring Installation" },
              { icon: "↻", label: "Restoration & Repair" },
              { icon: "⌂", label: "Property Maintenance" },
            ].map((svc) => (
              <div key={svc.label} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                <span className="text-brand-400 text-lg">{svc.icon}</span>
                <span className="text-sm text-slate-300">{svc.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative space-y-4">
          {/* Stats */}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-400">13</div>
              <div className="text-xs text-slate-500 mt-0.5">Technicians</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-400">500+</div>
              <div className="text-xs text-slate-500 mt-0.5">Properties</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold text-brand-400">24/7</div>
              <div className="text-xs text-slate-500 mt-0.5">Support</div>
            </div>
          </div>
          <p className="text-xs text-slate-600">Serving Michigan&apos;s premier commercial properties</p>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="flex flex-1 items-center justify-center bg-white px-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="mb-10 lg:hidden">
            <Logo />
          </div>

          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to Premier Pro Services
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
                placeholder="you@company.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-navy-900 focus:outline-none focus:ring-2 focus:ring-navy-900/20"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 focus:outline-none focus:ring-2 focus:ring-brand-400/50 disabled:opacity-50 transition"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3">
            <p className="text-xs font-medium text-slate-500 mb-1">Demo Credentials</p>
            <p className="text-xs text-slate-600 font-mono">admin@premierpro.com / admin123</p>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Are you a customer?{" "}
              <a href="/portal" className="font-medium text-navy-900 hover:text-navy-700">
                Access the Customer Portal
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
