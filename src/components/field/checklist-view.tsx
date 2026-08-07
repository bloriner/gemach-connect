"use client";

import { useState } from "react";
import { CheckCircle2, Circle, Clock, User } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  order: number;
  completed: boolean;
  completedAt?: string | null;
  completedBy?: { name: string } | null;
  notes?: string | null;
}

interface ChecklistViewProps {
  items: ChecklistItem[];
  onToggle: (id: string, completed: boolean) => void;
  onAddNote?: (id: string, notes: string) => void;
  loading?: boolean;
}

export function ChecklistView({ items, onToggle, onAddNote, loading }: ChecklistViewProps) {
  const [noteItemId, setNoteItemId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const completedCount = items.filter((i) => i.completed).length;
  const progress = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  const handleSaveNote = () => {
    if (noteItemId && onAddNote) {
      onAddNote(noteItemId, noteText);
      setNoteItemId(null);
      setNoteText("");
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-slate-400">
        <CheckCircle2 className="h-10 w-10 mb-2" />
        <p className="text-sm">No checklist items</p>
        <p className="text-xs mt-1">Checklist will load from the service template</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 font-medium">
            {completedCount} of {items.length} completed
          </span>
          <span className="text-slate-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => onToggle(item.id, !item.completed)}
              disabled={loading}
              className={`w-full flex items-start gap-3 rounded-lg px-3 py-2.5 text-left transition active:scale-[0.98] ${
                item.completed
                  ? "bg-green-50 border border-green-100"
                  : "bg-white border border-slate-200 hover:border-slate-300"
              }`}
            >
              {item.completed ? (
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Circle className="h-5 w-5 text-slate-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <span className={`text-sm ${item.completed ? "text-slate-500 line-through" : "text-slate-800"}`}>
                  {item.label}
                </span>
                {item.completed && item.completedBy && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <User className="h-3 w-3 text-slate-400" />
                    <span className="text-xs text-slate-400">{item.completedBy.name}</span>
                    {item.completedAt && (
                      <>
                        <Clock className="h-3 w-3 text-slate-400 ml-1" />
                        <span className="text-xs text-slate-400">
                          {new Date(item.completedAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                )}
                {item.notes && (
                  <p className="text-xs text-slate-400 mt-1 italic">{item.notes}</p>
                )}
              </div>
            </button>
            {/* Note adder */}
            {noteItemId === item.id ? (
              <div className="ml-10 mt-1 flex gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 text-xs border border-slate-200 rounded-md px-2 py-1 focus:outline-none focus:border-brand-400"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveNote();
                    if (e.key === "Escape") {
                      setNoteItemId(null);
                      setNoteText("");
                    }
                  }}
                />
                <button
                  onClick={handleSaveNote}
                  className="text-xs text-brand-600 font-medium hover:underline"
                >
                  Save
                </button>
              </div>
            ) : (
              !item.completed && onAddNote && (
                <button
                  onClick={() => {
                    setNoteItemId(item.id);
                    setNoteText(item.notes || "");
                  }}
                  className="ml-10 mt-0.5 text-xs text-slate-400 hover:text-brand-600"
                >
                  + Add note
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
