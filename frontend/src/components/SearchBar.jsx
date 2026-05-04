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
    <div className="search-section">
      <form className="search-form" onSubmit={handleSubmit}>
        <input
          className="search-input"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Try "420", "IPC 302", "cheating", "BNS 64"…'
          aria-label="Search IPC or BNS sections"
          disabled={isLoading}
        />
        <button className="search-btn" type="submit" disabled={isLoading || !value.trim()}>
          {isLoading ? "Searching…" : "Search"}
        </button>
      </form>
      <p className="search-hint">
        Search by section number, keyword, or prefix with IPC / BNS for reverse lookup.
      </p>
    </div>
  );
}
