"use client";

import { useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      if (!res.ok) {
        const d = await res.json() as { detail?: string };
        throw new Error(d.detail ?? "Something went wrong.");
      }
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .lp {
          min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          font-family: 'Inter', system-ui, sans-serif;
          background: linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #3b6ef5 100%);
          padding: 24px;
          position: relative; overflow: hidden;
        }
        .lp::before {
          content: ''; position: absolute;
          width: 700px; height: 700px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 65%);
          top: -200px; right: -200px; pointer-events: none;
        }
        .lp::after {
          content: ''; position: absolute;
          width: 500px; height: 500px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 65%);
          bottom: -150px; left: -150px; pointer-events: none;
        }
        .lp-card {
          background: #fff; border-radius: 24px; padding: 44px 40px;
          width: 100%; max-width: 420px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.12);
          position: relative; z-index: 1;
        }
        .lp-brand { text-align: center; margin-bottom: 28px; }
        .lp-brand-name { font-size: 1.5rem; font-weight: 800; color: #1d4ed8; letter-spacing: -0.03em; }
        .lp-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 6px; letter-spacing: -0.02em; }
        .lp-desc { font-size: 0.85rem; color: #64748b; margin-bottom: 24px; line-height: 1.6; }
        .lp-msg-ok  { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; border-radius: 10px; padding: 12px 14px; font-size: 0.85rem; margin-bottom: 16px; line-height: 1.6; }
        .lp-msg-err { background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; border-radius: 10px; padding: 10px 14px; font-size: 0.82rem; margin-bottom: 16px; }
        .lp-field { margin-bottom: 14px; }
        .lp-label { display: block; font-size: 0.75rem; font-weight: 600; color: #374151; margin-bottom: 5px; }
        .lp-input-wrap {
          display: flex; align-items: center; gap: 10px;
          background: #f8faff; border: 1.5px solid #e2e8f0; border-radius: 12px;
          padding: 12px 14px; transition: border-color .2s, box-shadow .2s;
        }
        .lp-input-wrap:focus-within { border-color: #1d4ed8; box-shadow: 0 0 0 3px rgba(29,78,216,0.1); background: #fff; }
        .lp-input-wrap svg { color: #94a3b8; flex-shrink: 0; }
        .lp-input-wrap input { flex: 1; border: none; outline: none; background: transparent; font-size: 0.9rem; color: #0f172a; font-family: inherit; }
        .lp-input-wrap input::placeholder { color: #b0b8cc; }
        .lp-btn {
          width: 100%; padding: 14px; border-radius: 12px; border: none;
          background: linear-gradient(135deg, #1d4ed8, #3b6ef5);
          color: #fff; font-size: 0.95rem; font-weight: 700; font-family: inherit;
          cursor: pointer; margin-top: 4px; letter-spacing: .01em;
          box-shadow: 0 4px 24px rgba(29,78,216,0.38);
          transition: opacity .15s, transform .1s, box-shadow .15s;
        }
        .lp-btn:hover { opacity: .92; transform: translateY(-1px); box-shadow: 0 8px 32px rgba(29,78,216,0.48); }
        .lp-btn:active { transform: translateY(0); }
        .lp-btn:disabled { opacity: .6; cursor: not-allowed; transform: none; }
        .lp-links { display: flex; justify-content: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5fb; }
        .lp-links a { font-size: 0.8rem; color: #94a3b8; text-decoration: none; transition: color .15s; }
        .lp-links a:hover { color: #1d4ed8; }
        @media (max-width: 480px) {
          .lp { padding: 16px; }
          .lp-card { padding: 28px 20px; border-radius: 18px; }
          .lp-brand-name { font-size: 1.25rem; }
        }
      `}</style>

      <div className="lp">
        <div className="lp-card">
          <div className="lp-brand">
            <div className="lp-brand-name">HisabFlow</div>
          </div>

          <div className="lp-title">Forgot password</div>
          <p className="lp-desc">Enter your email and we&apos;ll send you a reset link.</p>

          {sent ? (
            <>
              <div className="lp-msg-ok">
                Reset link sent to <strong>{email}</strong>.<br />
                Check your inbox — it expires in 30 minutes.
              </div>
              <div className="lp-links">
                <Link href="/login">Back to Sign in</Link>
              </div>
            </>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div className="lp-msg-err">{error}</div>}
              <div className="lp-field">
                <label className="lp-label" htmlFor="fp-email">Email address</label>
                <div className="lp-input-wrap">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                  <input id="fp-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus autoComplete="email" />
                </div>
              </div>
              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <div className="lp-links">
                <Link href="/login">Back to Sign in</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
