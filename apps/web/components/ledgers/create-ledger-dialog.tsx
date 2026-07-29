"use client";

import { useState } from "react";
import { useLedgerStore } from "@/store/ledger-store";
import { getStoredUsername, getStoredDisplayName } from "@/lib/profile";

interface Props { open: boolean; onClose: () => void; }

export function CreateLedgerDialog({ open, onClose }: Props) {
  const { create } = useLedgerStore();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const username = getStoredUsername();
  const displayName = getStoredDisplayName() ?? username ?? "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = name.trim();
    if (!n) return setError("Ledger name is required.");
    if (!username) return setError("Log in first.");
    setSubmitting(true);
    try {
      await create(n, username, displayName);
      setName("");
      setError("");
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create ledger.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={overlay}>
      <div style={card}>
        {/* Blue top accent bar */}
        <div style={{ height: 4, background: "#4a7af5", borderRadius: "16px 16px 0 0", margin: "-32px -28px 24px" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#e8f0fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4a7af5" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </div>
          <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
            Create Ledger
          </h2>
        </div>

        <form onSubmit={handleSubmit}>
          <label style={lbl}>Ledger Name</label>
          <input
            style={inp}
            placeholder="e.g. Flat Expenses July"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => { e.target.style.borderColor = "#4a7af5"; e.target.style.boxShadow = "0 0 0 3px rgba(31,88,234,0.12)"; e.target.style.background = "#fff"; }}
            onBlur={(e) => { e.target.style.borderColor = "#e0e7ff"; e.target.style.boxShadow = "none"; e.target.style.background = "#f5f7ff"; }}
            autoFocus
            maxLength={100}
          />
          {username && (
            <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "6px 0 0" }}>
              Owner: <strong style={{ color: "#4a7af5" }}>{displayName || username}</strong>
            </p>
          )}
          {!username && (
            <p style={{ fontSize: "0.82rem", color: "#dc2626", margin: "6px 0 0" }}>
              Please log in first.
            </p>
          )}
          {error && <p style={{ fontSize: "0.82rem", color: "#dc2626", marginTop: 8 }}>{error}</p>}
          <div style={{ display: "flex", gap: 10, marginTop: 24, justifyContent: "flex-end" }}>
            <button type="button" onClick={onClose} style={btnOutline}>Cancel</button>
            <button type="submit" style={btnPrimary} disabled={submitting}>
              {submitting ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, background: "rgba(15,23,42,0.45)",
  display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  backdropFilter: "blur(2px)",
};
const card: React.CSSProperties = {
  background: "#fff", borderRadius: 16, padding: "32px 28px",
  width: "100%", maxWidth: 420,
  boxShadow: "0 20px 60px rgba(31,88,234,0.18), 0 4px 16px rgba(0,0,0,0.08)",
};
const lbl: React.CSSProperties = { display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: 6 };
const inp: React.CSSProperties = {
  width: "100%", padding: "11px 16px", borderRadius: 999,
  border: "1.5px solid #e0e7ff", background: "#f5f7ff",
  fontSize: "0.9rem", color: "#0c0f1a", outline: "none", boxSizing: "border-box",
  transition: "border-color 0.15s, box-shadow 0.15s, background 0.15s",
};
const btnPrimary: React.CSSProperties = {
  padding: "10px 28px", borderRadius: 999, border: "none",
  background: "linear-gradient(135deg, #4a7af5, #3b82f6)",
  color: "#fff", fontWeight: 700, fontSize: "0.875rem", cursor: "pointer",
  boxShadow: "0 4px 14px rgba(31,88,234,0.35)",
};
const btnOutline: React.CSSProperties = {
  padding: "10px 28px", borderRadius: 999,
  border: "1.5px solid #e0e7ff", background: "#f5f7ff",
  color: "#374151", fontWeight: 600, fontSize: "0.875rem", cursor: "pointer",
};
