import { useState } from "react";

/**
 * SearchBar — controlled input with submit handler.
 * Props:
 *   onSearch(query: string) – called when the user submits a query
 *   isLoading: bool
 */
export default function SearchBar({ onSearch, isLoading }) {
  const [value, setValue] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    const q = value.trim();
    if (q) onSearch(q);
  }

  return (
    <div className="mb-6">
      <form onSubmit={handleSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Try "420", "IPC 302", "cheating", "BNS 64"…'
          aria-label="Search IPC or BNS sections"
          disabled={isLoading}
          className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60 transition"
        />
        <button
          type="submit"
          disabled={isLoading || !value.trim()}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? "Searching…" : "Search"}
        </button>
      </form>
      <p className="mt-2 text-xs text-slate-400">
        Search by section number, keyword, or prefix with IPC / BNS.
      </p>
    </div>
  );
}
