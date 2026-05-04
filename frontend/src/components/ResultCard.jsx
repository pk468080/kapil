import { useState } from "react";
import { explainMapping, saveMapping, unsaveMapping } from "../services/api";

/**
 * ResultCard — displays a single IPC ↔ BNS mapping with copy, save, and explain actions.
 * Props:
 *   result    — mapping object
 *   isSaved   — boolean
 *   isPro     — boolean (Pro plan)
 *   savedIds  — current Set of saved mapping IDs
 *   onSaveChange — callback(newSavedSet)
 */
export default function ResultCard({ result, isSaved = false, isPro = false, savedIds = new Set(), onSaveChange }) {
  const { id, old_code, old_section, new_code, new_section, title, notes } = result;
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(isSaved);
  const [saveLoading, setSaveLoading] = useState(false);
  const [explain, setExplain] = useState(null);
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainError, setExplainError] = useState(null);
  const [showExplain, setShowExplain] = useState(false);

  function handleCopy() {
    const text = `${old_code} §${old_section} → ${new_code} §${new_section}: ${title}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleSaveToggle() {
    setSaveLoading(true);
    try {
      if (saved) {
        await unsaveMapping(id);
        setSaved(false);
        if (onSaveChange) {
          const next = new Set(savedIds);
          next.delete(id);
          onSaveChange(next);
        }
      } else {
        await saveMapping(id);
        setSaved(true);
        if (onSaveChange) {
          const next = new Set(savedIds);
          next.add(id);
          onSaveChange(next);
        }
      }
    } catch (err) {
      // Already saved or other error — sync state
      const detail = err.response?.data?.detail || "";
      if (detail.includes("already saved")) setSaved(true);
    } finally {
      setSaveLoading(false);
    }
  }

  async function handleExplain() {
    if (explain) {
      setShowExplain((v) => !v);
      return;
    }
    setExplainLoading(true);
    setExplainError(null);
    setShowExplain(true);
    try {
      const data = await explainMapping(id);
      setExplain(data);
    } catch (err) {
      setExplainError(err.response?.data?.detail || "Failed to get explanation.");
    } finally {
      setExplainLoading(false);
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 font-bold text-sm">
          <span className="bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-lg">
            {old_code} §{old_section}
          </span>
          <span className="text-slate-400">→</span>
          <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-lg">
            {new_code} §{new_section}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy button */}
          <button
            onClick={handleCopy}
            className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
              copied
                ? "bg-emerald-500 text-white border-emerald-500"
                : "border-slate-300 text-slate-500 hover:bg-slate-50"
            }`}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>

          {/* Save button */}
          {onSaveChange && (
            <button
              onClick={handleSaveToggle}
              disabled={saveLoading}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                saved
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-300 text-slate-500 hover:bg-slate-50"
              } disabled:opacity-50`}
            >
              {saveLoading ? "…" : saved ? "✓ Saved" : "Save"}
            </button>
          )}
        </div>
      </div>

      {/* Title & notes */}
      <p className="mt-3 text-sm font-semibold text-slate-800">{title}</p>
      {notes && <p className="mt-1 text-xs text-slate-500 leading-relaxed">{notes}</p>}

      {/* AI Explain button (Pro only) */}
      {isPro && (
        <div className="mt-3">
          <button
            onClick={handleExplain}
            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium transition"
          >
            {showExplain ? "▲ Hide explanation" : "✨ AI Explain"}
          </button>

          {showExplain && (
            <div className="mt-2 bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-xs text-slate-700 space-y-2">
              {explainLoading && (
                <div className="flex items-center gap-2 text-indigo-400">
                  <div className="w-4 h-4 border-2 border-indigo-200 border-t-indigo-500 rounded-full animate-spin" />
                  <span>Generating explanation…</span>
                </div>
              )}
              {explainError && <p className="text-red-500">{explainError}</p>}
              {explain && (
                <>
                  <p>{explain.explanation}</p>
                  {explain.key_changes && (
                    <p className="text-slate-500">
                      <strong>Key changes:</strong> {explain.key_changes}
                    </p>
                  )}
                  <p className="text-amber-600 italic">{explain.disclaimer}</p>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
