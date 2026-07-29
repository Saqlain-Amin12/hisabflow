"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredUsername } from "@/lib/profile";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCp, setShowCp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (getStoredUsername()) router.replace("/individual");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const u = username.trim().toLowerCase();
    const em = email.trim().toLowerCase();
    if (!u) return setError("Username is required.");
    if (!em) return setError("Email is required.");
    if (!password || password.length < 6) return setError("Password must be at least 6 characters.");
    if (password !== confirm) return setError("Passwords do not match.");
    setLoading(true);
    try {
      await api.register({ username: u, email: em, password, display_name: u });
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed.");
      setLoading(false);
    }
  }

  const eyeHide = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
  const eyeShow = <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;

  return (
    <>
      <style>{`
        .lp { min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:'Inter',system-ui,sans-serif; background:linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 45%,#3b6ef5 100%); padding:24px; position:relative; overflow:hidden; }
        .lp::before { content:''; position:absolute; width:700px; height:700px; border-radius:50%; background:radial-gradient(circle,rgba(255,255,255,0.07) 0%,transparent 65%); top:-200px; right:-200px; pointer-events:none; }
        .lp::after { content:''; position:absolute; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle,rgba(255,255,255,0.05) 0%,transparent 65%); bottom:-150px; left:-150px; pointer-events:none; }
        .lp-card { background:#fff; border-radius:24px; padding:44px 40px; width:100%; max-width:420px; box-shadow:0 32px 80px rgba(0,0,0,0.22),0 0 0 1px rgba(255,255,255,0.12); position:relative; z-index:1; }
        .lp-brand { text-align:center; margin-bottom:28px; }
        .lp-brand-name { font-size:1.5rem; font-weight:800; color:#1d4ed8; letter-spacing:-0.03em; }
        .lp-title { font-size:1.25rem; font-weight:800; color:#0f172a; margin-bottom:24px; letter-spacing:-0.02em; }
        .lp-msg-err { background:#fef2f2; border:1px solid #fecaca; color:#dc2626; border-radius:10px; padding:10px 14px; font-size:0.82rem; margin-bottom:16px; }
        .lp-field { margin-bottom:14px; }
        .lp-label { display:block; font-size:0.75rem; font-weight:600; color:#374151; margin-bottom:5px; }
        .lp-input-wrap { display:flex; align-items:center; gap:10px; background:#f8faff; border:1.5px solid #e2e8f0; border-radius:12px; padding:12px 14px; transition:border-color .2s,box-shadow .2s; }
        .lp-input-wrap:focus-within { border-color:#1d4ed8; box-shadow:0 0 0 3px rgba(29,78,216,0.1); background:#fff; }
        .lp-input-wrap svg { color:#94a3b8; flex-shrink:0; }
        .lp-input-wrap input { flex:1; border:none; outline:none; background:transparent; font-size:0.9rem; color:#0f172a; font-family:inherit; min-width:0; }
        .lp-input-wrap input::placeholder { color:#b0b8cc; }
        .lp-eye { background:none; border:none; cursor:pointer; color:#94a3b8; padding:0; display:flex; transition:color .15s; }
        .lp-eye:hover { color:#1d4ed8; }
        .lp-btn { width:100%; padding:14px; border-radius:12px; border:none; background:linear-gradient(135deg,#1d4ed8,#3b6ef5); color:#fff; font-size:0.95rem; font-weight:700; font-family:inherit; cursor:pointer; margin-top:4px; letter-spacing:.01em; box-shadow:0 4px 24px rgba(29,78,216,0.38); transition:opacity .15s,transform .1s,box-shadow .15s; }
        .lp-btn:hover { opacity:.92; transform:translateY(-1px); box-shadow:0 8px 32px rgba(29,78,216,0.48); }
        .lp-btn:active { transform:translateY(0); }
        .lp-btn:disabled { opacity:.6; cursor:not-allowed; transform:none; }
        .lp-links { display:flex; justify-content:center; margin-top:20px; padding-top:16px; border-top:1px solid #f1f5fb; }
        .lp-links a { font-size:0.8rem; color:#94a3b8; text-decoration:none; transition:color .15s; }
        .lp-links a:hover { color:#1d4ed8; }
        @media (max-width:480px) { .lp { padding:16px; } .lp-card { padding:28px 20px; border-radius:18px; } .lp-brand-name { font-size:1.25rem; } }
      `}</style>

      <div className="lp">
        <div className="lp-card">
          <div className="lp-brand">
            <div className="lp-brand-name">HisabFlow</div>
          </div>

          {done ? (
            <div style={{textAlign:"center",padding:"8px 0 16px"}}>
              <div style={{width:52,height:52,background:"#f0fdf4",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 18px"}}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{fontSize:"1.1rem",fontWeight:800,color:"#0f172a",marginBottom:8}}>Check your email</div>
              <div style={{fontSize:"0.85rem",color:"#64748b",marginBottom:24,lineHeight:1.6}}>
                We sent a verification link to <strong style={{color:"#0f172a"}}>{email}</strong>.<br/>
                Click the link to activate your account.
              </div>
              <a href="/login" style={{display:"inline-block",padding:"11px 28px",background:"linear-gradient(135deg,#1d4ed8,#3b6ef5)",color:"#fff",borderRadius:12,fontWeight:700,fontSize:"0.9rem",textDecoration:"none"}}>
                Go to Sign In
              </a>
            </div>
          ) : (
            <>
              <div className="lp-title">Create account</div>
              {error && <div className="lp-msg-err">{error}</div>}
              <form onSubmit={handleSubmit} autoComplete="off">
                <div className="lp-field">
                  <label className="lp-label" htmlFor="reg-username">Username</label>
                  <div className="lp-input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    <input id="reg-username" type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} autoFocus autoComplete="username" />
                  </div>
                </div>
                <div className="lp-field">
                  <label className="lp-label" htmlFor="reg-email">Email address</label>
                  <div className="lp-input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                    <input id="reg-email" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
                  </div>
                </div>
                <div className="lp-field">
                  <label className="lp-label" htmlFor="reg-password">Password <span style={{color:"#b0b8cc",fontWeight:400}}>(min 6 chars)</span></label>
                  <div className="lp-input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input id="reg-password" type={showPw ? "text" : "password"} placeholder="Choose a strong password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
                    <button type="button" className="lp-eye" aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                      {showPw ? eyeHide : eyeShow}
                    </button>
                  </div>
                </div>
                <div className="lp-field">
                  <label className="lp-label" htmlFor="reg-confirm">Confirm password</label>
                  <div className="lp-input-wrap">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <input id="reg-confirm" type={showCp ? "text" : "password"} placeholder="Repeat your password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" />
                    <button type="button" className="lp-eye" aria-label={showCp ? "Hide password" : "Show password"} onClick={() => setShowCp(!showCp)} tabIndex={-1}>
                      {showCp ? eyeHide : eyeShow}
                    </button>
                  </div>
                </div>
                <button type="submit" className="lp-btn" disabled={loading}>
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>
              <div className="lp-links">
                <Link href="/login">Already have an account? Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
