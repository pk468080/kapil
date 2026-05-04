import { useState } from "react";

/**
 * ResultCard — displays a single IPC ↔ BNS mapping.
 * Props: result (object with old_code, old_section, new_code, new_section, title, notes)
 */
export default function ResultCard({ result }) {
  const { old_code, old_section, new_code, new_section, title, notes } = result;
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    const text = `${old_code} §${old_section} → ${new_code} §${new_section}: ${title}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="result-card">
      <div className="card-header">
        <div className="section-badge">
          <span className="badge badge-ipc">{old_code} §{old_section}</span>
          <span className="arrow">→</span>
          <span className="badge badge-bns">{new_code} §{new_section}</span>
        </div>
        <button
          className={`copy-btn${copied ? " copied" : ""}`}
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? "✓ Copied" : "Copy"}
        </button>
      </div>
      <p className="card-title">{title}</p>
      {notes && <p className="card-notes">{notes}</p>}
    </div>
  );
}
