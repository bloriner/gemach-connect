"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/utils";
import {
  Search, Users, Mail, Phone, ChevronRight, Loader2,
  Building2, Globe, Clock
} from "lucide-react";
import Link from "next/link";

interface Customer {
  id: string;
  companyName: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  portalToken: boolean;
  lastOrder: { id: string; status: string; createdAt: string } | null;
  orderCount: number;
  invoiceCount: number;
  totalSpend: number;
}

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await fetch("/api/customers");
      if (res.ok) setCustomers(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const filtered = search.trim()
    ? customers.filter((c) =>
        c.companyName.toLowerCase().includes(search.toLowerCase()) ||
        c.contactName?.toLowerCase().includes(search.toLowerCase()) ||
        c.email?.toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  const statusVariant = (status: string): "default" | "success" | "warning" | "danger" => {
    const map: Record<string, "default" | "success" | "warning" | "danger"> = {
      COMPLETED: "success", INVOICED: "default", PENDING: "warning",
      DISPATCHED: "info" as any, EN_ROUTE: "info" as any, ON_SITE: "info" as any,
      CANCELLED: "danger",
    };
    return map[status] ?? "default";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Customers</h1>
          <p className="mt-1 text-sm text-slate-500">{customers.length} total customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by company name, contact, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{customers.length}</p>
            <p className="text-xs text-slate-500">Total Customers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-brand-600">
              {customers.filter((c) => c.portalToken).length}
            </p>
            <p className="text-xs text-slate-500">Portal Enabled</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">
              {customers.reduce((s, c) => s + c.orderCount, 0)}
            </p>
            <p className="text-xs text-slate-500">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(customers.reduce((s, c) => s + c.totalSpend, 0))}
            </p>
            <p className="text-xs text-slate-500">Total Revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-brand-600" />
            <h2 className="text-lg font-semibold text-slate-900">
              {filtered.length} Customer{filtered.length !== 1 ? "s" : ""}
            </h2>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="mx-auto h-10 w-10 text-slate-300" />
              <p className="mt-2 text-sm text-slate-500">
                {search ? "No customers match your search" : "No customers yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filtered.map((c) => (
                <Link
                  key={c.id}
                  href={`/customers/${c.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 truncate group-hover:text-brand-700">
                        {c.companyName}
                      </p>
                      {c.portalToken && (
                        <Globe className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
                      {c.contactName && <span>{c.contactName}</span>}
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" /> {c.email}
                        </span>
                      )}
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" /> {c.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="hidden sm:flex items-center gap-4 text-right">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {formatCurrency(c.totalSpend)}
                      </p>
                      <p className="text-xs text-slate-400">{c.orderCount} order{c.orderCount !== 1 ? "s" : ""}</p>
                    </div>
                    {c.lastOrder && (
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-xs text-slate-500">
                            <Clock className="inline h-3 w-3 mr-0.5" />
                            {new Date(c.lastOrder.createdAt).toLocaleDateString("en-US", {
                              month: "short", day: "numeric",
                            })}
                          </p>
                          <Badge variant={statusVariant(c.lastOrder.status)} className="text-[10px]">
                            {c.lastOrder.status.replace("_", " ")}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-brand-500" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
