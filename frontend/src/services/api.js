/**
 * services/api.js — Centralised API client for Legal Mapper.
 * Reads VITE_API_BASE_URL from .env (defaults to http://localhost:8000).
 */

import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signup(email, password) {
  const res = await api.post("/auth/signup", { email, password });
  return res.data;
}

export async function login(email, password) {
  const res = await api.post("/auth/login", { email, password });
  return res.data;
}

export async function getMe() {
  const res = await api.get("/me");
  return res.data;
}

// ─── Search ──────────────────────────────────────────────────────────────────

export async function searchMappings(query) {
  const res = await api.get("/search", { params: { query } });
  return res.data;
}

// ─── Saved Items ─────────────────────────────────────────────────────────────

export async function getSaved() {
  const res = await api.get("/saved");
  return res.data;
}

export async function saveMapping(mapping_id) {
  const res = await api.post("/save", { mapping_id });
  return res.data;
}

export async function unsaveMapping(mapping_id) {
  const res = await api.delete(`/save/${mapping_id}`);
  return res.data;
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getHistory() {
  const res = await api.get("/history");
  return res.data;
}

// ─── AI Explain ──────────────────────────────────────────────────────────────

export async function explainMapping(mapping_id) {
  const res = await api.get(`/mappings/${mapping_id}/explain`);
  return res.data;
}

// ─── Payments ────────────────────────────────────────────────────────────────

export async function createOrder() {
  const res = await api.post("/payments/create-order");
  return res.data;
}

export async function verifyPayment(payload) {
  const res = await api.post("/payments/verify", payload);
  return res.data;
}

export async function getPlans() {
  const res = await api.get("/payments/plans");
  return res.data;
}

export default api;
