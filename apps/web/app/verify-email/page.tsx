"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!token) { setState("error"); setErrorMsg("No verification token found."); return; }
    api.verifyEmail(token)
      .then(() => setState("success"))
      .catch(err => { setState("error"); setErrorMsg(err instanceof Error ? err.message : "Verification failed."); });
  }, [token]);

  return (
    <>
      <style>{`
        .lp { min-height:100vh; display:flex; align-items:center; justify-content:center; font-family:'Inter',system-ui,sans-serif; background:linear-gradient(145deg,#1e3a8a 0%,#1d4ed8 45%,#3b6ef5 100%); padding:24px; }
        .lp-card { background:#fff; border-radius:24px; padding:44px 40px; width:100%; max-width:420px; box-shadow:0 32px 80px rgba(0,0,0,0.22); text-align:center; }
        .lp-brand-name { font-size:1.5rem; font-weight:800; color:#1d4ed8; letter-spacing:-0.03em; margin-bottom:28px; }
        .lp-icon { width:56px; height:56px; border-radius:50%; display:flex; align-items:center; justify-content:center; margin:0 auto 18px; }
        .lp-title { font-size:1.1rem; font-weight:800; color:#0f172a; margin-bottom:8px; }
        .lp-sub { font-size:0.85rem; color:#64748b; margin-bottom:24px; line-height:1.6; }
        .lp-btn { display:inline-block; padding:11px 28px; background:linear-gradient(135deg,#1d4ed8,#3b6ef5); color:#fff; border-radius:12px; font-weight:700; font-size:0.9rem; text-decoration:none; }
        @media (max-width:480px) { .lp { padding:16px; } .lp-card { padding:28px 20px; } }
      `}</style>

      <div className="lp">
        <div className="lp-card">
          <div className="lp-brand-name">HisabFlow</div>

          {state === "loading" && (
            <>
              <div style={{display:"flex",justifyContent:"center",marginBottom:18}}>
                <div style={{width:36,height:36,border:"3px solid #e0e7ff",borderTop:"3px solid #4a7af5",borderRadius:"50%",animation:"spin 0.7s linear infinite"}}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
              <div className="lp-title">Verifying your email…</div>
            </>
          )}

          {state === "success" && (
            <>
              <div className="lp-icon" style={{background:"#f0fdf4"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div className="lp-title">Email Verified</div>
              <div className="lp-sub">Your email address has been verified. You can now sign in to your account.</div>
              <a href="/login?verified=1" className="lp-btn">Sign In</a>
            </>
          )}

          {state === "error" && (
            <>
              <div className="lp-icon" style={{background:"#fef2f2"}}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
              <div className="lp-title">Verification Failed</div>
              <div className="lp-sub">{errorMsg}</div>
              <a href="/login" className="lp-btn">Back to Sign In</a>
            </>
          )}
        </div>
      </div>
    </>
  );
}
