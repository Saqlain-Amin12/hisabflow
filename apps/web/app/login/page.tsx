"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { setStoredUsername, setStoredDisplayName, setStoredPassword, getStoredUsername } from "@/lib/profile";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendDone, setResendDone] = useState(false);
  const [successMsg] = useState<string | null>(
    searchParams.get("verified") ? "Email verified! You can now sign in." :
    searchParams.get("registered") ? "Account created! Please check your email to verify." : null
  );
  const [googleError] = useState<string | null>(
    searchParams.get("error") === "google_cancelled" ? "Google sign-in was cancelled." :
    searchParams.get("error") === "google_failed" ? "Google sign-in failed. Please try again." : null
  );

  useEffect(() => {
    if (getStoredUsername()) router.replace("/individual");
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const id = identifier.trim();
    if (!id) return setError("Email is required.");
    if (!password) return setError("Password is required.");
    setLoading(true);
    try {
      const user = await api.login({ username_or_email: id, password });
      setStoredUsername(user.username);
      setStoredDisplayName(user.display_name || user.username);
      setStoredPassword(password);
      router.push("/individual");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      if (msg === "EMAIL_NOT_VERIFIED") {
        setUnverifiedEmail(id);
        setError("Your email address has not been verified. Please check your inbox.");
      } else {
        setError(msg);
      }
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!unverifiedEmail) return;
    setResendLoading(true);
    try {
      await api.resendVerification(unverifiedEmail);
      setResendDone(true);
    } catch {
      // silent — always show success to prevent enumeration
      setResendDone(true);
    } finally {
      setResendLoading(false);
    }
  }

  function handleGoogle() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const origin = window.location.origin;
    const redirect = `${origin}/api/auth/google/callback`;
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=select_account`;
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
          background: #fff;
          border-radius: 24px;
          padding: 44px 40px;
          width: 100%; max-width: 420px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(255,255,255,0.12);
          position: relative; z-index: 1;
        }
        .lp-brand {
          text-align: center; margin-bottom: 28px;
        }
        .lp-brand-name {
          font-size: 1.5rem; font-weight: 800; color: #1d4ed8; letter-spacing: -0.03em;
        }
        .lp-title { font-size: 1.25rem; font-weight: 800; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }

        .lp-msg-ok  { background: #f0fdf4; border: 1px solid #bbf7d0; color: #15803d; border-radius: 10px; padding: 10px 14px; font-size: 0.82rem; margin-bottom: 16px; }
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
        .lp-eye { background: none; border: none; cursor: pointer; color: #94a3b8; padding: 0; display: flex; transition: color .15s; }
        .lp-eye:hover { color: #1d4ed8; }

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

        .lp-divider { display: flex; align-items: center; gap: 12px; margin: 18px 0; }
        .lp-divider::before, .lp-divider::after { content: ''; flex: 1; height: 1px; background: #e2e8f0; }
        .lp-divider span { font-size: 0.72rem; color: #94a3b8; white-space: nowrap; }

        .lp-google {
          display: flex; align-items: center; justify-content: center; gap: 10px;
          width: 100%; padding: 13px; border-radius: 12px;
          border: 1.5px solid #e2e8f0; background: #fff; color: #374151;
          font-size: 0.875rem; font-weight: 600; font-family: inherit; cursor: pointer;
          transition: border-color .15s, box-shadow .15s;
        }
        .lp-google:hover { border-color: #1d4ed8; box-shadow: 0 2px 12px rgba(29,78,216,0.1); }

        .lp-links { display: flex; justify-content: space-between; margin-top: 20px; padding-top: 16px; border-top: 1px solid #f1f5fb; }
        .lp-links a { font-size: 0.8rem; color: #94a3b8; text-decoration: none; transition: color .15s; }
        .lp-links a:hover { color: #1d4ed8; }
        @media (max-width: 480px) {
          .lp { padding: 16px; }
          .lp-card { padding: 28px 20px; border-radius: 18px; }
          .lp-brand-name { font-size: 1.25rem; }
          .lp-links { flex-direction: column; align-items: center; gap: 8px; }
        }
      `}</style>

      <div className="lp">
        <div className="lp-card">
          <div className="lp-brand">
            <div className="lp-brand-name">HisabFlow</div>
          </div>

          <div className="lp-title">Sign in</div>
          <div style={{marginBottom:"24px"}} />

          {successMsg && <div className="lp-msg-ok">{successMsg}</div>}
          {googleError && <div className="lp-msg-err">{googleError}</div>}
          {error && (
            <div className="lp-msg-err">
              {error}
              {unverifiedEmail && (
                <div style={{marginTop:8}}>
                  {resendDone
                    ? <span style={{color:"#15803d",fontWeight:600}}>Verification email sent.</span>
                    : <button onClick={handleResend} disabled={resendLoading} style={{background:"none",border:"none",color:"#dc2626",fontWeight:700,textDecoration:"underline",cursor:"pointer",padding:0,fontSize:"inherit"}}>
                        {resendLoading ? "Sending…" : "Resend verification email"}
                      </button>
                  }
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="on">
            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-identifier">Email or Username</label>
              <div className="lp-input-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>
                <input id="lp-identifier" type="text" placeholder="you@example.com or username" value={identifier} onChange={e => setIdentifier(e.target.value)} autoFocus autoComplete="username" />
              </div>
            </div>

            <div className="lp-field">
              <label className="lp-label" htmlFor="lp-password">Password</label>
              <div className="lp-input-wrap">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input id="lp-password" type={showPw ? "text" : "password"} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} autoComplete="current-password" />
                <button type="button" className="lp-eye" aria-label={showPw ? "Hide password" : "Show password"} onClick={() => setShowPw(!showPw)} tabIndex={-1}>
                  {showPw
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>

            <button type="submit" className="lp-btn" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="lp-divider"><span>or</span></div>

          <button className="lp-google" onClick={handleGoogle} type="button">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
            Continue with Google
          </button>

          <div className="lp-links">
            <Link href="/register">Create account</Link>
            <Link href="/forgot-password">Forgot password</Link>
          </div>
        </div>
      </div>
    </>
  );
}
