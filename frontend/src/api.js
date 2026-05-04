/**
 * api.js — All API calls are centralised here.
 * Set VITE_API_BASE_URL in your .env file (e.g. http://localhost:8000).
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/**
 * Search IPC ↔ BNS mappings.
 * @param {string} query - User search term
 * @returns {Promise<Array>} - Array of mapping objects
 */
export async function searchMappings(query) {
  const url = `${BASE_URL}/search?query=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error ${response.status}: ${text}`);
  }
  return response.json();
}
