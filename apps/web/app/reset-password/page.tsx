"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export default function ResetPasswordPage() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    if (!token) return setError("Invalid reset link.");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/api/v1/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const d = await res.json() as { detail?: string };
        throw new Error(d.detail ?? "Reset failed.");
      }
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .ap { min-height:100vh; display:flex; align-items:center; justify-content:center; background:#ffffff; padding:24px; }
        .ap-wrap { width:100%; max-width:380px; }
        .ac { background:#ffffff; border-radius:24px; border:1.5px solid #e8eef8; box-shadow:0 4px 40px rgba(31,88,234,0.10),0 1px 4px rgba(31,88,234,0.06); padding:44px 36px 36px; }
        .ac h1 { font-size:2rem; font-weight:800; color:#4a7af5; margin:0 0 8px; letter-spacing:-0.03em; text-align:center; }
        .ac p { font-size:0.85rem; color:#6b7280; margin:0 0 28px; text-align:center; }
        .af { display:flex; align-items:center; gap:10px; background:#f5f7ff; border:1.5px solid #e0e7ff; border-radius:999px; padding:13px 18px; margin-bottom:14px; transition:border-color .2s,box-shadow .2s; }
        .af:focus-within { border-color:#4a7af5; box-shadow:0 0 0 3px rgba(31,88,234,0.12); background:#fff; }
        .af svg { width:17px; height:17px; flex-shrink:0; color:#a0aec0; }
        .af input { flex:1; border:none; outline:none; background:transparent; font-size:0.9rem; color:#1a1a2e; font-family:inherit; }
        .af input::placeholder { color:#b0b8cc; }
        .pw-wrap { position:relative; }
        .pw-wrap .af { padding-right:44px; }
        .pw-eye { position:absolute; right:16px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#a0aec0; padding:0; display:flex; }
        .pw-eye:hover { color:#4a7af5; }
        .ab { width:100%; padding:14px; border-radius:999px; border:none; background:linear-gradient(135deg,#4a7af5,#4e7df5); color:#fff; font-size:1rem; font-weight:700; font-family:inherit; cursor:pointer; box-shadow:0 4px 20px rgba(31,88,234,0.30); transition:opacity .15s,transform .1s; }
        .ab:hover { opacity:.92; transform:translateY(-1px); }
        .ab:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .ae { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; border-radius:12px; padding:10px 14px; font-size:0.82rem; margin-bottom:14px; text-align:center; }
        .as { background:#f0fdf4; border:1px solid #bbf7d0; color:#15803d; border-radius:14px; padding:20px; text-align:center; font-size:0.875rem; line-height:1.6; }
        .back { display:block; text-align:center; margin-top:18px; font-size:0.82rem; color:#9ca3af; text-decoration:none; }
        .back:hover { color:#4a7af5; }
      `}</style>

      <div className="ap">
        <div className="ap-wrap">
          <div className="ac">
            <h1>New Password</h1>
            <p>Enter your new password below.</p>

            {!token ? (
              <>
                <div className="ae">Invalid or missing reset link.</div>
                <Link href="/forgot-password" className="back">Request a new link</Link>
              </>
            ) : done ? (
              <>
                <div className="as">
                  ✓ Password changed successfully!
                </div>
                <Link href="/login" className="back">Sign in with new password</Link>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="pw-wrap">
                  <div className="af">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input type={showPw ? "text" : "password"} placeholder="New password (min. 6 chars)" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
                  </div>
                  <button type="button" className="pw-eye" onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                    {showPw
                      ? <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
                <div className="af">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input type={showPw ? "text" : "password"} placeholder="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                </div>
                {error && <div className="ae">{error}</div>}
                <button type="submit" className="ab" disabled={loading}>
                  {loading ? "Saving..." : "Set New Password"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
