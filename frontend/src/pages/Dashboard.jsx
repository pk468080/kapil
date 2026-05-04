/**
 * pages/Dashboard.jsx — Main application dashboard with sidebar navigation.
 * Sections: Search, Saved, History
 */

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import ResultCard from "../components/ResultCard";
import SearchBar from "../components/SearchBar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";
import {
  getHistory,
  getSaved,
  searchMappings,
  unsaveMapping,
} from "../services/api";

export default function Dashboard() {
  const { user, authLogout } = useAuth();
  const navigate = useNavigate();

  const [activeSection, setActiveSection] = useState("search");

  // Search state
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [lastQuery, setLastQuery] = useState("");

  // Saved items state
  const [savedItems, setSavedItems] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // History state
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Saved mapping IDs for quick lookup
  const [savedIds, setSavedIds] = useState(new Set());

  // Load saved items when switching to saved tab
  const loadSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const data = await getSaved();
      setSavedItems(data);
      setSavedIds(new Set(data.map((s) => s.mapping_id)));
    } catch {
      // ignore
    } finally {
      setSavedLoading(false);
    }
  }, []);

  // Load history
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await getHistory();
      setHistoryItems(data);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "saved") loadSaved();
    if (activeSection === "history") loadHistory();
  }, [activeSection, loadSaved, loadHistory]);

  async function handleSearch(query) {
    setSearchLoading(true);
    setSearchError(null);
    setLastQuery(query);
    setActiveSection("search");
    try {
      const data = await searchMappings(query);
      setSearchResults(data);
      // Refresh saved IDs so save buttons reflect current state
      const saved = await getSaved();
      setSavedIds(new Set(saved.map((s) => s.mapping_id)));
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Search failed.";
      setSearchError(msg);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleUnsave(mappingId) {
    await unsaveMapping(mappingId);
    await loadSaved();
  }

  function handleLogout() {
    authLogout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top navbar */}
      <header className="bg-indigo-700 text-white px-6 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">⚖️ Legal Mapper</span>
          {user?.plan === "pro" && (
            <span className="ml-2 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
              PRO
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="hidden sm:block text-indigo-200">{user?.email}</span>
          {user?.plan === "free" && (
            <button
              onClick={() => navigate("/upgrade")}
              className="bg-amber-400 text-amber-900 font-semibold px-3 py-1 rounded-full hover:bg-amber-300 transition text-xs"
            >
              Upgrade to Pro
            </button>
          )}
          <button
            onClick={handleLogout}
            className="text-indigo-200 hover:text-white transition"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar active={activeSection} onSelect={setActiveSection} />

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* ── Search section ── */}
          {activeSection === "search" && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">
                Search IPC ↔ BNS Mappings
              </h2>
              <SearchBar onSearch={handleSearch} isLoading={searchLoading} />

              {user?.plan === "free" && (
                <p className="text-xs text-slate-400 mb-4">
                  Free plan: up to {import.meta.env.VITE_FREE_DAILY_LIMIT || "10"} searches/day.{" "}
                  <button
                    onClick={() => navigate("/upgrade")}
                    className="text-indigo-500 hover:underline"
                  >
                    Upgrade for unlimited →
                  </button>
                </p>
              )}

              {searchLoading && (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                  <p className="text-slate-400 mt-3">Searching…</p>
                </div>
              )}

              {searchError && (
                <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl p-4 text-sm">
                  ⚠️ {searchError}
                </div>
              )}

              {!searchLoading && searchResults !== null && (
                <div>
                  <p className="text-sm text-slate-500 mb-3">
                    {searchResults.length} result{searchResults.length !== 1 ? "s" : ""} for &ldquo;{lastQuery}&rdquo;
                  </p>
                  {searchResults.length === 0 ? (
                    <div className="text-center py-16 text-slate-400">
                      <div className="text-5xl mb-3">🔍</div>
                      <p>No results found for &ldquo;{lastQuery}&rdquo;</p>
                      <p className="text-sm mt-1">Try a section number or keyword like &ldquo;cheating&rdquo; or &ldquo;420&rdquo;</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {searchResults.map((r) => (
                        <ResultCard
                          key={r.id}
                          result={r}
                          isSaved={savedIds.has(r.id)}
                          isPro={user?.plan === "pro"}
                          onSaveChange={(newSavedIds) => setSavedIds(newSavedIds)}
                          savedIds={savedIds}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!searchLoading && searchResults === null && (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-5xl mb-3">⚖️</div>
                  <p className="text-lg font-medium text-slate-600">Search IPC or BNS sections</p>
                  <p className="text-sm mt-1">Try &ldquo;420&rdquo;, &ldquo;IPC 302&rdquo;, &ldquo;murder&rdquo;, or &ldquo;cheating&rdquo;</p>
                </div>
              )}
            </div>
          )}

          {/* ── Saved section ── */}
          {activeSection === "saved" && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Saved Mappings</h2>
              {savedLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : savedItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-5xl mb-3">🔖</div>
                  <p>No saved mappings yet.</p>
                  <p className="text-sm mt-1">Search and click Save on any result to bookmark it.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {savedItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-2 font-bold">
                          <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-sm">
                            {item.old_code} §{item.old_section}
                          </span>
                          <span className="text-slate-400">→</span>
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded text-sm">
                            {item.new_code} §{item.new_section}
                          </span>
                        </div>
                        <button
                          onClick={() => handleUnsave(item.mapping_id)}
                          className="text-red-400 hover:text-red-600 text-sm transition"
                        >
                          Remove
                        </button>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-800">{item.title}</p>
                      {item.notes && <p className="mt-1 text-xs text-slate-500">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── History section ── */}
          {activeSection === "history" && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-semibold text-slate-800 mb-4">Search History</h2>
              {historyLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                </div>
              ) : historyItems.length === 0 ? (
                <div className="text-center py-16 text-slate-400">
                  <div className="text-5xl mb-3">🕐</div>
                  <p>No search history yet.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historyItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex items-center justify-between shadow-sm cursor-pointer hover:border-indigo-300 transition"
                      onClick={() => handleSearch(item.query)}
                    >
                      <span className="text-sm font-medium text-slate-800">{item.query}</span>
                      <span className="text-xs text-slate-400">
                        {new Date(item.timestamp).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 text-center py-3 text-xs text-slate-400">
        This tool is for informational purposes only and not legal advice.
      </footer>
    </div>
  );
}
