"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Plus, CheckCircle2, Search } from "lucide-react";

interface Customer {
  id: string;
  companyName: string;
  contactName: string | null;
  phone: string | null;
  properties: { id: string; name: string; address: string }[];
}

interface ServiceType {
  id: string;
  name: string;
  basePrice: number | null;
}

interface Crew {
  id: string;
  name: string;
  lead: { name: string } | null;
}

export default function CreateOrderPage() {
  const router = useRouter();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [crews, setCrews] = useState<Crew[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");

  // Form
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [crewId, setCrewId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [notes, setNotes] = useState("");
  const [billingType, setBillingType] = useState("SINGLE");
  const [showNewProperty, setShowNewProperty] = useState(false);
  const [newPropName, setNewPropName] = useState("");
  const [newPropAddress, setNewPropAddress] = useState("");
  const [newPropCity, setNewPropCity] = useState("");

  // Quick create customer
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustContact, setNewCustContact] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/portal/service-types").then((r) => r.json()),
      fetch("/api/dispatch/board").then((r) => r.json()),
    ]).then(([custData, svcData, dispatchData]) => {
      setCustomers(custData);
      setFilteredCustomers(custData);
      setServices(svcData);
      setCrews(dispatchData.crews || []);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!customerSearch.trim()) {
      setFilteredCustomers(customers);
    } else {
      const q = customerSearch.toLowerCase();
      setFilteredCustomers(
        customers.filter(
          (c) =>
            c.companyName.toLowerCase().includes(q) ||
            (c.contactName && c.contactName.toLowerCase().includes(q)) ||
            (c.phone && c.phone.includes(q))
        )
      );
    }
  }, [customerSearch, customers]);

  const selectedService = services.find((s) => s.id === selectedServiceId);

  // Quick-create customer
  const createCustomer = async (): Promise<string | null> => {
    if (!newCustName.trim()) return null;
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: newCustName,
        contactName: newCustContact || null,
        phone: newCustPhone || null,
        email: newCustEmail || null,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.id;
  };

  // Create property for selected customer
  const createProperty = async (customerId: string): Promise<string | null> => {
    if (!newPropName.trim() || !newPropAddress.trim()) return null;
    const res = await fetch(`/api/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addProperty: {
          name: newPropName,
          address: newPropAddress,
          city: newPropCity || null,
        },
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    // Return the last property's ID
    const props = data.properties || [];
    return props[props.length - 1]?.id || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer && !newCustName) return;
    if (!selectedPropertyId && !newPropAddress) return;
    if (!selectedServiceId) return;

    setSubmitting(true);
    try {
      let custId: string | null | undefined = selectedCustomer?.id;
      let propId: string | null = selectedPropertyId || null;

      // Quick-create customer if needed
      if (!custId && newCustName) {
        custId = await createCustomer();
        if (!custId) throw new Error("Failed to create customer");
        // Create property for new customer
        if (newPropAddress) {
          propId = await createProperty(custId);
        }
      }

      // Create property for existing customer
      if (custId && !propId && newPropAddress) {
        propId = await createProperty(custId);
      }

      if (!custId || !propId) throw new Error("Missing customer or property");

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: custId,
          propertyId: propId,
          serviceTypeId: selectedServiceId,
          crewId: crewId || null,
          scheduledDate: scheduledDate || null,
          priority,
          notes: notes || null,
          billingType,
          price: selectedService?.basePrice || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create order");
      }

      const order = await res.json();
      router.push(`/orders/${order.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="rounded-lg p-2 hover:bg-slate-100 transition"
        >
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-slate-900">New Order</h1>
          <p className="text-sm text-slate-500">Create a new work order</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Customer Selection ────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-base font-semibold text-slate-800">Customer</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedCustomer && !showNewCustomer ? (
              <>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => setCustomerSearch(e.target.value)}
                    placeholder="Search customers..."
                    className="w-full rounded-lg border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 border border-slate-200 rounded-lg">
                  {filteredCustomers.length === 0 ? (
                    <p className="p-4 text-sm text-slate-400 text-center">No customers found.</p>
                  ) : (
                    filteredCustomers.slice(0, 10).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => { setSelectedCustomer(c); setSelectedPropertyId(""); }}
                        className="w-full text-left px-4 py-3 hover:bg-brand-50 transition border-b border-slate-100 last:border-0"
                      >
                        <p className="text-sm font-medium text-slate-800">{c.companyName}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                          {c.contactName && <span>{c.contactName}</span>}
                          {c.phone && <span>{c.phone}</span>}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 transition"
                >
                  <Plus className="h-4 w-4" />
                  Create New Customer
                </button>
              </>
            ) : showNewCustomer ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">Company Name *</label>
                  <Input value={newCustName} onChange={(e) => setNewCustName(e.target.value)} placeholder="e.g., Acme Corp" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Contact Name</label>
                    <Input value={newCustContact} onChange={(e) => setNewCustContact(e.target.value)} placeholder="John Smith" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Phone</label>
                    <Input value={newCustPhone} onChange={(e) => setNewCustPhone(e.target.value)} placeholder="(555) 123-4567" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Email</label>
                  <Input value={newCustEmail} onChange={(e) => setNewCustEmail(e.target.value)} placeholder="contact@acme.com" />
                </div>
                <button
                  type="button"
                  onClick={() => { setShowNewCustomer(false); setNewCustName(""); }}
                  className="text-xs text-brand-600 hover:underline"
                >
                  ← Back to customer search
                </button>
              </div>
            ) : selectedCustomer ? (
              <div className="flex items-center justify-between rounded-lg bg-brand-50 border border-brand-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-brand-800">{selectedCustomer.companyName}</p>
                  {selectedCustomer.contactName && (
                    <p className="text-xs text-brand-600">{selectedCustomer.contactName}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => { setSelectedCustomer(null); setShowNewCustomer(false); }}
                  className="text-xs text-brand-600 hover:underline"
                >
                  Change
                </button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        {/* ── Property ──────────────────────────── */}
        {(selectedCustomer || showNewCustomer) && (
          <Card>
            <CardHeader className="pb-2">
              <h2 className="text-base font-semibold text-slate-800">Property</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedCustomer && selectedCustomer.properties.length > 0 && !showNewProperty ? (
                <>
                  <div className="space-y-2">
                    {selectedCustomer.properties.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setSelectedPropertyId(p.id)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition ${
                          selectedPropertyId === p.id
                            ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                            : "border-slate-200 hover:border-brand-300"
                        }`}
                      >
                        <p className="text-sm font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">{p.address}</p>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNewProperty(true)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-4 py-2.5 text-sm text-slate-500 hover:border-brand-400 hover:text-brand-600 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Add New Property
                  </button>
                </>
              ) : showNewProperty || selectedCustomer?.properties.length === 0 || showNewCustomer ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-600">Property Name *</label>
                    <Input value={newPropName} onChange={(e) => setNewPropName(e.target.value)} placeholder="e.g., Main Office" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">Address *</label>
                    <Input value={newPropAddress} onChange={(e) => setNewPropAddress(e.target.value)} placeholder="123 Main St" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600">City</label>
                    <Input value={newPropCity} onChange={(e) => setNewPropCity(e.target.value)} placeholder="Detroit" />
                  </div>
                  {selectedCustomer && (
                    <button
                      type="button"
                      onClick={() => setShowNewProperty(false)}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      ← Choose existing property
                    </button>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* ── Service Type ──────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-base font-semibold text-slate-800">Service</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedServiceId(s.id)}
                  className={`rounded-lg border px-4 py-3 text-left transition ${
                    selectedServiceId === s.id
                      ? "border-brand-500 bg-brand-50 ring-1 ring-brand-500"
                      : "border-slate-200 hover:border-brand-300"
                  }`}
                >
                  <p className="text-sm font-medium text-slate-800">{s.name}</p>
                  {s.basePrice && (
                    <p className="text-xs text-brand-600 font-medium mt-0.5">
                      ${s.basePrice.toFixed(2)}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── Details ───────────────────────────── */}
        <Card>
          <CardHeader className="pb-2">
            <h2 className="text-base font-semibold text-slate-800">Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-slate-600">Schedule Date/Time</label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="NORMAL">Normal</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Assign Crew</label>
                <select
                  value={crewId}
                  onChange={(e) => setCrewId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="">Unassigned</option>
                  {crews.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.lead ? `(${c.lead.name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600">Billing Type</label>
                <select
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 bg-white"
                >
                  <option value="SINGLE">Single Invoice</option>
                  <option value="SPLIT">Split Billing</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Special instructions, access codes, etc."
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Submit ────────────────────────────── */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={submitting}
            className="flex-1"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Order
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
