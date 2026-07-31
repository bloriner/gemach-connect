"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { MapPin, Clock, Phone, Mail, User, ArrowLeft, Send, Loader2, Gift, Bookmark } from "lucide-react";
import { toast } from "sonner";
import { catOf, isOpenNow } from "@/lib/utils";
import { PageSkeleton } from "@/components/Skeleton";

export default function GemachDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [gemach, setGemach] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [msgType, setMsgType] = useState("inquiry");
  const [msgContent, setMsgContent] = useState("");
  const [sending, setSending] = useState(false);
  const [contactTab, setContactTab] = useState<"message" | "offer">("message");
  const [offerItems, setOfferItems] = useState("");
  const [offerQty, setOfferQty] = useState(1);
  const [offerMethod, setOfferMethod] = useState("dropoff");
  const [offerNote, setOfferNote] = useState("");
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    fetch(`/api/gemachs/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setGemach(d.gemach);
        setLoading(false);
      });
    // Check favorite status
    fetch("/api/favorites")
      .then((r) => r.json())
      .then((d) => {
        if (d.favoriteIds?.includes(id)) setIsFavorited(true);
      })
      .catch(() => {});
  }, [id]);

  if (loading) return <PageSkeleton />;
  if (!gemach) return <div className="text-center py-16 text-gray-500">Gemach not found.</div>;

  const cat = catOf(gemach.category);
  const open = isOpenNow(gemach.hours);
  const isOwner = session?.user?.id === gemach.ownerId;

  async function sendMessage() {
    if (!msgContent.trim()) return;
    setSending(true);
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gemachId: gemach.id, content: msgContent, type: msgType }),
    });
    setSending(false);
    if (res.ok) {
      toast.success("Message sent!");
      setShowMessage(false);
      setMsgContent("");
    } else {
      toast.error("Failed to send message.");
    }
  }

  async function submitOffer() {
    if (!offerItems.trim()) return;
    setSending(true);
    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        gemachId: gemach.id,
        items: offerItems,
        qty: offerQty,
        method: offerMethod,
        note: offerNote || null,
      }),
    });
    setSending(false);
    if (res.ok) {
      toast.success("Offer submitted!");
      setShowMessage(false);
      setOfferItems("");
      setOfferNote("");
      setContactTab("message");
    } else {
      toast.error("Failed to submit offer.");
    }
  }

  async function toggleFavorite() {
    const prev = isFavorited;
    setIsFavorited(!prev);
    try {
      const res = await fetch("/api/favorites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemachId: gemach.id }),
      });
      const data = await res.json();
      setIsFavorited(data.favorited);
    } catch {
      setIsFavorited(prev);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="btn btn-ghost">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header Card */}
      <div className={`card overflow-hidden`}>
        <div className={`h-3 bg-gradient-to-r ${cat.gradient}`} />
        <div className="p-6">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{gemach.name}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`badge ${cat.chip}`}>{cat.icon} {cat.label}</span>
                {open && <span className="badge bg-green-50 text-green-700">Open now</span>}
                {gemach.verified && <span className="badge bg-blue-50 text-blue-700">Verified</span>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={toggleFavorite} className={`btn btn-ghost ${isFavorited ? "text-amber-500" : ""}`}>
                <Bookmark className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                {isFavorited ? "Saved" : "Save"}
              </button>
              {isOwner ? (
                <Link href={`/dashboard/edit/${gemach.id}`} className="btn btn-secondary">Edit</Link>
              ) : (
                <button onClick={() => setShowMessage(!showMessage)} className="btn btn-primary">
                  <Send className="h-4 w-4" /> Contact this Gemach
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-gray-600">{gemach.description}</p>

          {/* Info rows */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{gemach.address}, {gemach.city}, {gemach.state} {gemach.zip}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>See hours below</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span>{gemach.phone}</span>
            </div>
            {gemach.email && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span>{gemach.email}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contact form */}
      {showMessage && !isOwner && (
        <div className="card p-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-2 border-b pb-2">
            {(["message", "offer"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setContactTab(t)}
                className={`px-3 py-1.5 text-sm font-medium rounded-t transition ${
                  contactTab === t ? "text-primary-700 border-b-2 border-primary-600 -mb-[2px]" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {t === "message" ? "Send Message" : "Make an Offer"}
              </button>
            ))}
          </div>

          {contactTab === "message" ? (
            <>
              <select className="input" value={msgType} onChange={(e) => setMsgType(e.target.value)}>
                <option value="inquiry">General Inquiry</option>
                <option value="donation">I want to Donate</option>
                <option value="pickup">Pickup Request</option>
              </select>
              <textarea
                className="input min-h-[100px]"
                placeholder="Write your message..."
                value={msgContent}
                onChange={(e) => setMsgContent(e.target.value)}
              />
              <button onClick={sendMessage} disabled={sending || !msgContent.trim()} className="btn btn-primary">
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? "Sending..." : "Send Message"}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="label">What are you offering?</label>
                <input className="input" placeholder="e.g. Baby clothes (0-3 months), stroller" value={offerItems} onChange={(e) => setOfferItems(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Quantity</label>
                  <input type="number" className="input" min={1} value={offerQty} onChange={(e) => setOfferQty(Number(e.target.value))} />
                </div>
                <div>
                  <label className="label">Method</label>
                  <select className="input" value={offerMethod} onChange={(e) => setOfferMethod(e.target.value)}>
                    <option value="dropoff">I'll drop off</option>
                    <option value="pickup">Please pick up</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Note (optional)</label>
                <textarea className="input min-h-[60px]" placeholder="Any additional details..." value={offerNote} onChange={(e) => setOfferNote(e.target.value)} />
              </div>
              <button onClick={submitOffer} disabled={sending || !offerItems.trim()} className="btn btn-primary">
                {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                {sending ? "Submitting..." : "Submit Offer"}
              </button>
            </>
          )}
        </div>
      )}

      {/* Hours */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Hours</h2>
        {(() => {
          try {
            const hours: any[] = JSON.parse(gemach.hours);
            const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            const today = new Date().getDay();
            return (
              <div className="space-y-1">
                {hours.map((h: any) => (
                  <div key={h.day} className={`flex justify-between text-sm py-1 px-2 rounded ${h.day === today ? "bg-primary-50 font-medium" : ""}`}>
                    <span>{days[h.day]}</span>
                    <span className="text-gray-600">{h.closed ? "Closed" : `${h.open} – ${h.close}`}</span>
                  </div>
                ))}
              </div>
            );
          } catch {
            return <p className="text-sm text-gray-500">Hours not available.</p>;
          }
        })()}
      </div>

      {/* Needs */}
      {(() => {
        try {
          const needs: string[] = JSON.parse(gemach.needs);
          if (!needs.length) return null;
          return (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-3">Currently Needed</h2>
              <ul className="space-y-1">
                {needs.map((n, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                    {n}
                  </li>
                ))}
              </ul>
            </div>
          );
        } catch {
          return null;
        }
      })()}

      {/* Pickup notes */}
      {gemach.pickupNotes && (
        <div className="card p-6">
          <h2 className="font-semibold text-gray-900 mb-2">Pickup Notes</h2>
          <p className="text-sm text-gray-600">{gemach.pickupNotes}</p>
        </div>
      )}

      {/* Options */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Options</h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          {gemach.dropoff && <span className="badge bg-emerald-50 text-emerald-700">Accepts Dropoffs</span>}
          {gemach.delivery && <span className="badge bg-blue-50 text-blue-700">Offers Delivery</span>}
          {gemach.apptOnly && <span className="badge bg-amber-50 text-amber-700">Appointment Only</span>}
        </div>
      </div>

      {/* Owner */}
      <div className="card p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Organizer</h2>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-700 font-bold">
            {gemach.owner.name.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900">{gemach.owner.name}</p>
            {gemach.owner.email && <p className="text-sm text-gray-500">{gemach.owner.email}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
