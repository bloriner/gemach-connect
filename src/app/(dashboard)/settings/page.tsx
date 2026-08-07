"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export default function SettingsPage() {
  const [toast, setToast] = useState<string | null>(null);

  function handleSave() {
    setToast("Settings saved successfully!");
    setTimeout(() => setToast(null), 3000);
  }

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

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your company profile and application preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Company Name" id="companyName" defaultValue="Premier Pro Services" />
          <Input label="Email" id="email" type="email" defaultValue="info@premierproservices.com" />
          <Input label="Phone" id="phone" type="tel" defaultValue="(555) 000-0000" />
          <Input label="Address" id="address" defaultValue="123 Business Park Dr, Detroit, MI 48201" />
          <Input label="Tax Rate (%)" id="taxRate" type="number" defaultValue="6.0" />
          <div className="pt-2">
            <Button onClick={handleSave}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-slate-900">Notification Preferences</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            <span className="text-sm text-slate-700">Email notifications for new orders</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            <span className="text-sm text-slate-700">SMS alerts for urgent orders</span>
          </label>
          <label className="flex items-center gap-3">
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-brand-600" />
            <span className="text-sm text-slate-700">Crew arrival/departure notifications</span>
          </label>
        </CardContent>
      </Card>
    </div>
  );
}
