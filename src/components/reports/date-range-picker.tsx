"use client";

import { useState, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { format, subDays, subMonths, startOfMonth, startOfQuarter, startOfYear } from "date-fns";

export type DateRange = {
  from: Date;
  to: Date;
  preset: string; // "MTD" | "QTD" | "YTD" | "30D" | "CUSTOM"
};

interface Props {
  onChange: (range: DateRange) => void;
}

const PRESETS: { label: string; key: DateRange["preset"]; getRange: () => { from: Date; to: Date } }[] = [
  { label: "MTD", key: "MTD", getRange: () => ({ from: startOfMonth(new Date()), to: new Date() }) },
  { label: "Last 30 Days", key: "30D", getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
  { label: "QTD", key: "QTD", getRange: () => ({ from: startOfQuarter(new Date()), to: new Date() }) },
  { label: "YTD", key: "YTD", getRange: () => ({ from: startOfYear(new Date()), to: new Date() }) },
  { label: "Custom", key: "CUSTOM", getRange: () => ({ from: subDays(new Date(), 29), to: new Date() }) },
];

export function DateRangePicker({ onChange }: Props) {
  const [activePreset, setActivePreset] = useState<DateRange["preset"]>("MTD");
  const [fromStr, setFromStr] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [toStr, setToStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const preset = PRESETS.find((p) => p.key === activePreset)!;
    const { from, to } = preset.getRange();
    setFromStr(format(from, "yyyy-MM-dd"));
    setToStr(format(to, "yyyy-MM-dd"));
  }, [activePreset]);

  useEffect(() => {
    if (activePreset !== "CUSTOM") return;
    const from = new Date(fromStr + "T00:00:00");
    const to = new Date(toStr + "T23:59:59");
    if (!isNaN(from.getTime()) && !isNaN(to.getTime())) {
      onChange({ from, to, preset: "CUSTOM" });
    }
  }, [fromStr, toStr]);

  function selectPreset(key: DateRange["preset"]) {
    setActivePreset(key);
    setMenuOpen(false);
    const preset = PRESETS.find((p) => p.key === key)!;
    const { from, to } = preset.getRange();
    onChange({ from, to, preset: key });
  }

  return (
    <div className="relative flex items-center gap-2">
      <Calendar className="h-4 w-4 text-slate-400" />
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
      >
        {PRESETS.find((p) => p.key === activePreset)?.label ?? "Custom"}
        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
      </button>

      {activePreset === "CUSTOM" && (
        <div className="flex items-center gap-1.5 text-sm">
          <input
            type="date"
            value={fromStr}
            onChange={(e) => { setFromStr(e.target.value); setActivePreset("CUSTOM"); }}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
          <span className="text-slate-400">–</span>
          <input
            type="date"
            value={toStr}
            onChange={(e) => { setToStr(e.target.value); setActivePreset("CUSTOM"); }}
            className="rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
          />
        </div>
      )}

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-40 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => selectPreset(p.key)}
                className={`w-full px-3 py-2 text-left text-sm transition ${
                  activePreset === p.key
                    ? "bg-brand-50 text-brand-700 font-medium"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
