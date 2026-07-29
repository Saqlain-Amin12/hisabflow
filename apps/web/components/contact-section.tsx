"use client";

import { useState } from "react";

export function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setStatus("sending");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { ok?: boolean; error?: string };
      if (!res.ok) { setError(data.error ?? "Failed to send."); setStatus("error"); return; }
      setStatus("sent");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  const inp: React.CSSProperties = {
    width: "100%", padding: "11px 14px", borderRadius: 8, border: "1.5px solid #e0e7ff",
    fontSize: "0.92rem", outline: "none", background: "#f5f7ff", color: "#0c0f1a",
    fontFamily: "inherit", boxSizing: "border-box",
  };

  return (
    <section id="contact" style={{ background: "#f5f7ff", padding: "80px 0" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 24px" }}>

        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg,#4a7af5,#3b6ce0)", marginBottom: 16 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
          </div>
          <h2 style={{ fontSize: "1.9rem", fontWeight: 800, color: "#0c0f1a", margin: "0 0 8px" }}>Get in Touch</h2>
          <p style={{ color: "#6b7280", fontSize: "0.95rem", margin: 0 }}>Have a question or feedback? We&apos;re here to help!</p>
        </div>

        <div style={{ background: "#fff", borderRadius: 16, boxShadow: "0 4px 24px rgba(37,99,235,.10)", border: "1.5px solid #e0e7ff", padding: "36px 36px 32px" }}>
          {status === "sent" ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h3 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#059669", margin: "0 0 8px" }}>Message Sent!</h3>
              <p style={{ color: "#6b7280", margin: "0 0 24px", fontSize: "0.9rem" }}>
                Your message has been delivered. We&apos;ll get back to you soon.
              </p>
              <button onClick={() => setStatus("idle")} style={{ padding: "10px 28px", background: "#4a7af5", color: "#fff", border: "none", borderRadius: 999, fontWeight: 700, fontSize: "0.9rem", cursor: "pointer" }}>
                Send Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "0.82rem", color: "#374151", marginBottom: 6 }}>Your Name *</label>
                  <input style={inp} placeholder="e.g. Ahmad Ali" value={form.name} onChange={(e) => set("name", e.target.value)} required maxLength={100} />
                </div>
                <div>
                  <label style={{ display: "block", fontWeight: 600, fontSize: "0.82rem", color: "#374151", marginBottom: 6 }}>Email *</label>
                  <input style={inp} type="email" placeholder="you@example.com" value={form.email} onChange={(e) => set("email", e.target.value)} required maxLength={200} />
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.82rem", color: "#374151", marginBottom: 6 }}>Subject</label>
                <input style={inp} placeholder="e.g. Bug report, Feature request..." value={form.subject} onChange={(e) => set("subject", e.target.value)} maxLength={200} />
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontWeight: 600, fontSize: "0.82rem", color: "#374151", marginBottom: 6 }}>Message *</label>
                <textarea style={{ ...inp, resize: "vertical", minHeight: 140 }} placeholder="Write your message here..." value={form.message} onChange={(e) => set("message", e.target.value)} required maxLength={2000} />
              </div>
              {error && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px", color: "#dc2626", fontSize: "0.85rem", marginBottom: 16 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={status === "sending"} style={{ width: "100%", padding: "13px", background: status === "sending" ? "#93b4fb" : "#4a7af5", color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.95rem", cursor: status === "sending" ? "not-allowed" : "pointer" }}>
                {status === "sending" ? "Sending..." : "Send Message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
