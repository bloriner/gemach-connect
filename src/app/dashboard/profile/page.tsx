"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { User, Mail, Phone, MapPin, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { STATES } from "@/lib/utils";

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(session?.user?.name || "");
  const [phone, setPhone] = useState(session?.user?.phone || "");
  const [city, setCity] = useState(session?.user?.city || "");
  const [state, setState] = useState(session?.user?.state || "");
  const [bio, setBio] = useState(session?.user?.bio || "");

  if (!session?.user) return null;

  async function handleSave() {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone: phone || null, city: city || null, state: state || null, bio: bio || null }),
    });
    setSaving(false);
    if (res.ok) {
      await update();
      toast.success("Profile updated");
      setEditing(false);
    } else {
      toast.error("Failed to update profile");
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn btn-secondary">Edit</button>
        ) : (
          <button onClick={handleSave} disabled={saving} className="btn btn-primary">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save"}
          </button>
        )}
      </div>

      {!editing ? (
        <div className="card p-6 space-y-4">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-100">
              <User className="h-10 w-10 text-primary-600" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-gray-900">{session.user.name}</h2>
            <p className="text-gray-500">{session.user.email}</p>
          </div>
          <div className="space-y-2 pt-4 border-t">
            {session.user.phone && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone className="h-4 w-4 text-gray-400" /> {session.user.phone}
              </div>
            )}
            {(session.user.city || session.user.state) && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 text-gray-400" />
                {[session.user.city, session.user.state].filter(Boolean).join(", ")}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4 text-gray-400" /> {session.user.email}
            </div>
          </div>
          {session.user.bio && (
            <div className="pt-4 border-t">
              <p className="text-sm text-gray-600">{session.user.bio}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input bg-gray-50" value={session.user.email || ""} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">City</label>
              <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Brooklyn" />
            </div>
            <div>
              <label className="label">State</label>
              <select className="input" value={state} onChange={(e) => setState(e.target.value)}>
                <option value="">Select...</option>
                {STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Bio</label>
            <textarea className="input min-h-[80px]" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell us a bit about yourself..." />
          </div>
          <button
            onClick={() => {
              setEditing(false);
              setName(session.user?.name || "");
              setPhone(session.user?.phone || "");
              setCity(session.user?.city || "");
              setState(session.user?.state || "");
              setBio(session.user?.bio || "");
            }}
            className="btn btn-ghost w-full text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
