"use client";

import { useState, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { Lightbulb, Send, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "general", label: "General" },
  { value: "feature", label: "Feature Request" },
  { value: "bug", label: "Bug Report" },
  { value: "design", label: "Design / UI" },
  { value: "other", label: "Other" },
];

export default function SuggestionsPage() {
  const { data: session } = useSession();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), category }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Failed to submit");
      }

      setSent(true);
      toast.success("Suggestion submitted! Thank you.");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-12 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-500 mb-6">
            Your suggestion has been submitted and will be reviewed soon.
          </p>
          <button
            onClick={() => { setSent(false); setTitle(""); setBody(""); setCategory("general"); }}
            className="btn btn-secondary"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
          <Lightbulb className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Suggestions</h1>
          <p className="text-sm text-gray-500">Share your ideas to improve Gemach Connect</p>
        </div>
      </div>

      <div className="card p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Category */}
          <div>
            <label className="label">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setCategory(c.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    category === c.value
                      ? "bg-primary-600 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="label">Title</label>
            <input
              id="title"
              type="text"
              className="input"
              placeholder="e.g. Add email notifications for new messages"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
            />
          </div>

          {/* Body */}
          <div>
            <label htmlFor="body" className="label">Your Suggestion</label>
            <textarea
              id="body"
              className="input min-h-[140px] resize-y"
              placeholder="Describe your idea in detail — what should it do, and why would it help?"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-gray-400">
              Submitted as {session?.user?.name || session?.user?.email}
            </p>
            <button
              type="submit"
              disabled={submitting || !title.trim() || !body.trim()}
              className="btn btn-primary"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Sending..." : "Submit Suggestion"}
            </button>
          </div>
        </form>
      </div>

      {/* Info box */}
      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          <strong>💡 Tip:</strong> Good suggestions include a clear description, the problem it solves, and why it would benefit gemach users.
        </p>
      </div>
    </div>
  );
}
