import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, ArrowRight } from "lucide-react";

export default function PortalLandingPage() {
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
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Sign In</h2>
        </CardHeader>
        <CardContent>
          <form action="/portal/dashboard" method="GET" className="space-y-4">
            <div>
              <label htmlFor="token" className="block text-sm font-medium text-slate-700 mb-1">
                Portal Access Token
              </label>
              <Input
                id="token"
                name="token"
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
