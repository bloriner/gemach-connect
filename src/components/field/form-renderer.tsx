"use client";

import { useState } from "react";
import { FileText, Shield, AlertTriangle, ClipboardList, Plus } from "lucide-react";

interface FormField {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "checkbox" | "photo";
  required?: boolean;
  options?: string[];
}

interface FormRendererProps {
  formType: string;
  title: string;
  fields: FormField[];
  onSubmit: (formType: string, title: string, data: Record<string, any>) => void;
  onCancel?: () => void;
  loading?: boolean;
}

const formTypeIcons: Record<string, any> = {
  PRE_JOB: ClipboardList,
  POST_JOB: FileText,
  SAFETY: Shield,
  DAMAGE_REPORT: AlertTriangle,
  CUSTOM: FileText,
};

export function FormRenderer({ formType, title, fields, onSubmit, onCancel, loading }: FormRendererProps) {
  const Icon = formTypeIcons[formType] || FileText;
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Set<string>>(new Set());

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors.has(name)) {
      setErrors((prev) => {
        const next = new Set(prev);
        next.delete(name);
        return next;
      });
    }
  };

  const handleSubmit = () => {
    const missing = new Set<string>();
    fields.forEach((f) => {
      if (f.required && !formData[f.name]) {
        missing.add(f.name);
      }
    });
    if (missing.size > 0) {
      setErrors(missing);
      return;
    }
    onSubmit(formType, title, formData);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <Icon className="h-4 w-4 text-brand-600" />
        {title}
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.name}>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-0.5">*</span>}
            </label>

            {field.type === "text" && (
              <input
                type="text"
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 ${
                  errors.has(field.name) ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                rows={3}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 resize-none ${
                  errors.has(field.name) ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
              />
            )}

            {field.type === "select" && field.options && (
              <select
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white ${
                  errors.has(field.name) ? "border-red-300 bg-red-50" : "border-slate-200"
                }`}
              >
                <option value="">Select...</option>
                {field.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            )}

            {field.type === "checkbox" && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!formData[field.name]}
                  onChange={(e) => handleChange(field.name, e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-600">Yes</span>
              </label>
            )}

            {errors.has(field.name) && (
              <p className="text-xs text-red-500 mt-0.5">This field is required</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 transition disabled:opacity-50 active:scale-[0.98]"
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
      </div>
    </div>
  );
}

// Pre-built form templates
export const FORM_TEMPLATES: Record<string, { title: string; fields: FormField[] }> = {
  PRE_JOB: {
    title: "Pre-Job Inspection",
    fields: [
      { name: "areaCondition", label: "Area condition on arrival", type: "select", required: true, options: ["Clean", "Moderate", "Heavy Soil", "Severe"] },
      { name: "existingDamage", label: "Any existing damage observed?", type: "select", required: true, options: ["None", "Minor", "Moderate", "Major"] },
      { name: "damageNotes", label: "Damage details", type: "textarea" },
      { name: "equipmentCheck", label: "All equipment functioning?", type: "checkbox", required: true },
      { name: "safetyCheck", label: "Safety hazards present?", type: "select", required: true, options: ["None", "Slip hazard", "Electrical", "Chemical", "Other"] },
      { name: "safetyNotes", label: "Safety notes", type: "textarea" },
    ],
  },
  POST_JOB: {
    title: "Post-Job Completion",
    fields: [
      { name: "workCompleted", label: "Was all work completed as specified?", type: "checkbox", required: true },
      { name: "qualityCheck", label: "Quality inspection result", type: "select", required: true, options: ["Pass", "Minor touch-up needed", "Rework required"] },
      { name: "customerPresent", label: "Customer present for walkthrough?", type: "checkbox" },
      { name: "customerFeedback", label: "Customer feedback", type: "textarea" },
      { name: "areasCleaned", label: "Areas cleaned", type: "textarea" },
      { name: "equipmentStowed", label: "All equipment stowed?", type: "checkbox", required: true },
      { name: "wasteRemoved", label: "All waste removed from site?", type: "checkbox", required: true },
    ],
  },
  SAFETY: {
    title: "Safety Checklist",
    fields: [
      { name: "ppeUsed", label: "PPE worn (gloves, mask, goggles)?", type: "checkbox", required: true },
      { name: "chemicalsUsed", label: "Chemicals used", type: "textarea" },
      { name: "msdsReviewed", label: "MSDS reviewed for all chemicals?", type: "checkbox", required: true },
      { name: "ventilation", label: "Adequate ventilation?", type: "checkbox", required: true },
      { name: "wetFloorSigns", label: "Wet floor signs placed?", type: "checkbox" },
      { name: "incidents", label: "Any incidents or near-misses?", type: "select", required: true, options: ["None", "Minor (no injury)", "Required first aid", "Required medical attention"] },
      { name: "incidentDetails", label: "Incident details", type: "textarea" },
    ],
  },
  DAMAGE_REPORT: {
    title: "Damage Report",
    fields: [
      { name: "damageType", label: "Type of damage", type: "select", required: true, options: ["Carpet", "Wall", "Floor", "Furniture", "Equipment", "Other"] },
      { name: "severity", label: "Severity", type: "select", required: true, options: ["Cosmetic", "Minor repair needed", "Major repair needed", "Replacement needed"] },
      { name: "location", label: "Specific location", type: "text", required: true },
      { name: "description", label: "Description of damage", type: "textarea", required: true },
      { name: "cause", label: "Likely cause", type: "select", options: ["Pre-existing", "Work-related", "Unknown"] },
      { name: "notifiedManager", label: "Operations manager notified?", type: "checkbox", required: true },
    ],
  },
};
