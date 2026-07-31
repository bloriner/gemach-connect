"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Clock, PackageCheck, FileText, Settings } from "lucide-react";
import { toast } from "sonner";
import { CATEGORIES, STATES } from "@/lib/utils";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function defaultHours() {
  return [
    { day: 0, open: "09:00", close: "21:00", closed: false },
    { day: 1, open: "09:00", close: "21:00", closed: false },
    { day: 2, open: "09:00", close: "21:00", closed: false },
    { day: 3, open: "09:00", close: "21:00", closed: false },
    { day: 4, open: "09:00", close: "14:00", closed: false },
    { day: 5, open: "00:00", close: "00:00", closed: true },
    { day: 6, open: "09:00", close: "12:00", closed: false },
  ];
}

interface GemachFormProps {
  initial?: any;
  id?: string;
}

export function GemachForm({ initial, id }: GemachFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Basic fields
  const [name, setName] = useState(initial?.name || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [address, setAddress] = useState(initial?.address || "");
  const [city, setCity] = useState(initial?.city || "");
  const [state, setState] = useState(initial?.state || "");
  const [zip, setZip] = useState(initial?.zip || "");
  const [phone, setPhone] = useState(initial?.phone || "");
  const [email, setEmail] = useState(initial?.email || "");
  const [website, setWebsite] = useState(initial?.website || "");

  // Hours: parse from initial or use defaults
  const [hours, setHours] = useState(() => {
    if (initial?.hours) {
      try {
        const parsed = JSON.parse(initial.hours);
        if (Array.isArray(parsed) && parsed.length === 7) return parsed;
      } catch {}
    }
    return defaultHours();
  });

  // Needs: parse JSON string to comma-separated display string
  const [needs, setNeeds] = useState(() => {
    if (initial?.needs) {
      try {
        const parsed = JSON.parse(initial.needs);
        if (Array.isArray(parsed)) return parsed.join(", ");
      } catch {}
    }
    return "";
  });

  // Pickup notes
  const [pickupNotes, setPickupNotes] = useState(initial?.pickupNotes || "");

  // Boolean options
  const [dropoff, setDropoff] = useState(initial?.dropoff ?? false);
  const [delivery, setDelivery] = useState(initial?.delivery ?? false);
  const [apptOnly, setApptOnly] = useState(initial?.apptOnly ?? false);

  function updateHour(index: number, field: string, value: string | boolean) {
    setHours((prev) => {
      const next = prev.map((h, i) => (i === index ? { ...h, [field]: value } : h));
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const needsArray = needs
      .split(",")
      .map((n) => n.trim())
      .filter(Boolean);

    const body = {
      name,
      category,
      description,
      address,
      city,
      state,
      zip,
      phone,
      email: email || null,
      website: website || null,
      hours: JSON.stringify(hours),
      needs: JSON.stringify(needsArray),
      pickupNotes: pickupNotes || null,
      dropoff,
      delivery,
      apptOnly,
    };

    const url = id ? `/api/gemachs/${id}` : "/api/gemachs";
    const method = id ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setLoading(false);

    if (res.ok) {
      toast.success(id ? "Gemach updated!" : "Gemach created!");
      router.push("/dashboard/my-gemachs");
    } else {
      const data = await res.json();
      toast.error(data.error || "Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{id ? "Edit Gemach" : "Add a Gemach"}</h1>
        <p className="text-gray-500 mt-1">Fill out the details below to list your gemach.</p>
      </div>

      {/* Basic Info */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Basic Information</h2>

        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div>
          <label className="label">Category</label>
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)} required>
            <option value="">Select category...</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Description</label>
          <textarea className="input min-h-[100px]" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe your gemach — what you lend, who it serves, any requirements..." />
        </div>
      </div>

      {/* Location */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Location</h2>

        <div>
          <label className="label">Address</label>
          <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">City</label>
            <input className="input" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div>
            <label className="label">State</label>
            <select className="input" value={state} onChange={(e) => setState(e.target.value)} required>
              <option value="">Select...</option>
              {STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label">ZIP Code</label>
          <input className="input" value={zip} onChange={(e) => setZip(e.target.value)} required />
        </div>
      </div>

      {/* Contact */}
      <div className="card p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Contact</h2>

        <div>
          <label className="label">Phone</label>
          <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>

        <div>
          <label className="label">Email (optional)</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        <div>
          <label className="label">Website (optional)</label>
          <input className="input" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://" />
        </div>
      </div>

      {/* Hours */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">Weekly Hours</h2>
        </div>

        <div className="space-y-2">
          {hours.map((h, i) => (
            <div key={h.day} className="flex items-center gap-3 py-1">
              <span className="w-10 text-sm font-medium text-gray-700">{DAYS[h.day]}</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className="input w-[120px] text-sm"
                  value={h.open}
                  onChange={(e) => updateHour(i, "open", e.target.value)}
                  disabled={h.closed}
                />
                <span className="text-gray-400">–</span>
                <input
                  type="time"
                  className="input w-[120px] text-sm"
                  value={h.close}
                  onChange={(e) => updateHour(i, "close", e.target.value)}
                  disabled={h.closed}
                />
              </div>
              <label className="flex items-center gap-1.5 text-sm text-gray-600 cursor-pointer ml-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={h.closed}
                  onChange={(e) => updateHour(i, "closed", e.target.checked)}
                />
                Closed
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Needs */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <PackageCheck className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">Currently Needed Items</h2>
        </div>
        <p className="text-sm text-gray-500 -mt-2">Comma-separated list of items your gemach currently needs (e.g. baby bottles, strollers, formula).</p>
        <textarea
          className="input min-h-[80px]"
          value={needs}
          onChange={(e) => setNeeds(e.target.value)}
          placeholder="Baby bottles, strollers, formula..."
        />
      </div>

      {/* Pickup Notes */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">Pickup / Special Instructions</h2>
        </div>
        <p className="text-sm text-gray-500 -mt-2">Any special instructions for donors — where to drop off, what entrance to use, hours to avoid, etc.</p>
        <textarea
          className="input min-h-[100px]"
          value={pickupNotes}
          onChange={(e) => setPickupNotes(e.target.value)}
          placeholder="Drop off at the side entrance on Elm Street. Call ahead for large items..."
        />
      </div>

      {/* Options */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-800">Options</h2>
        </div>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            checked={dropoff}
            onChange={(e) => setDropoff(e.target.checked)}
          />
          <div>
            <p className="font-medium text-gray-800">Accepts Dropoffs</p>
            <p className="text-sm text-gray-500">Donors can bring items directly to this location</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            checked={delivery}
            onChange={(e) => setDelivery(e.target.checked)}
          />
          <div>
            <p className="font-medium text-gray-800">Offers Delivery</p>
            <p className="text-sm text-gray-500">Can deliver borrowed items to those in need</p>
          </div>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            checked={apptOnly}
            onChange={(e) => setApptOnly(e.target.checked)}
          />
          <div>
            <p className="font-medium text-gray-800">Appointment Only</p>
            <p className="text-sm text-gray-500">Visits require a scheduled appointment in advance</p>
          </div>
        </label>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary w-full">
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "Saving..." : id ? "Update Gemach" : "Create Gemach"}
      </button>
    </form>
  );
}
