import { useState } from "react";
import "./styles.css";
import { searchMappings } from "./api";
import SearchBar from "./components/SearchBar";
import ResultCard from "./components/ResultCard";

function App() {
  const [results, setResults] = useState(null); // null = no search yet
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastQuery, setLastQuery] = useState("");

  async function handleSearch(query) {
    setIsLoading(true);
    setError(null);
    setLastQuery(query);
    try {
      const data = await searchMappings(query);
      setResults(data);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }

  function renderResults() {
    if (isLoading) {
      return (
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Searching…</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-state">
          <p>⚠️ {error}</p>
        </div>
      );
    }

    if (results === null) return null;

    if (results.length === 0) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <p>No results found for &ldquo;{lastQuery}&rdquo;.</p>
          <p>Try a different section number or keyword.</p>
        </div>
      );
    }

    return (
      <div className="results-section">
        <h2>
          {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{lastQuery}&rdquo;
        </h2>
        <div className="results-grid">
          {results.map((r, i) => (
            <ResultCard key={`${r.old_section}-${r.new_section}-${i}`} result={r} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <header className="app-header">
        <h1>⚖️ Legal Mapper</h1>
        <p>Map Indian Penal Code (IPC) sections to Bharatiya Nyaya Sanhita (BNS) — and back.</p>
      </header>

      <main className="app-main">
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        {renderResults()}
      </main>

      <footer className="app-footer">
        This tool is for informational purposes only and not legal advice. Always consult a qualified legal professional.
      </footer>
    </div>
  );
}

export default App;
