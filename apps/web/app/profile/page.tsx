"use client";

import { useState, useEffect } from "react";
import { getStoredUsername, getStoredDisplayName, setStoredDisplayName, setStoredUsername, clearStoredProfile, getStoredPassword, setStoredPassword } from "@/lib/profile";
import { api } from "@/lib/api";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  useAuthGuard();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [usernameChangedAt, setUsernameChangedAt] = useState<string | null>(null);

  // section states
  const [section, setSection] = useState<"" | "username" | "password">("");
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  // username change
  const [newUsername, setNewUsername] = useState("");
  const [savingUsername, setSavingUsername] = useState(false);

  // password change
  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showProfilePw, setShowProfilePw] = useState(false);
  const [storedPw, setStoredPwState] = useState("");
  const [enterPwMode, setEnterPwMode] = useState(false);
  const [enterPwVal, setEnterPwVal] = useState("");

  useEffect(() => {
    const u = getStoredUsername() ?? "";
    setUsername(u);
    setStoredPwState(getStoredPassword() ?? "");
    if (u) {
      api.getProfile(u).then((p) => {
        setEmail((p as { email?: string }).email ?? "");
        setUsernameChangedAt((p as { username_changed_at?: string }).username_changed_at ?? null);
      }).catch(() => {});
    }
  }, []);

  function daysUntilChange(): number | null {
    if (!usernameChangedAt) return null;
    const days = Math.floor((Date.now() - new Date(usernameChangedAt).getTime()) / 86400000);
    return Math.max(0, 30 - days);
  }
  const daysLeft = daysUntilChange();
  const canChangeUsername = daysLeft === null || daysLeft === 0;

  async function handleUsernameChange(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    const nu = newUsername.trim().toLowerCase();
    if (!nu || nu.length < 2) return setMsg({ type:"err", text:"Username must be at least 2 characters." });
    if (!/^[a-z0-9_-]+$/.test(nu)) return setMsg({ type:"err", text:"Letters, numbers, underscores only." });
    if (nu === username) return setMsg({ type:"err", text:"This is already your username." });
    setSavingUsername(true);
    try {
      const res = await api.changeUsername(username, nu);
      setStoredUsername(res.username);
      setUsername(res.username);
      setUsernameChangedAt(res.username_changed_at);
      setNewUsername("");
      setSection("");
      setMsg({ type:"ok", text:"Username changed successfully!" });
    } catch (err: unknown) {
      setMsg({ type:"err", text: err instanceof Error ? err.message : "Failed to change username." });
    } finally { setSavingUsername(false); }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (newPw.length < 6) return setMsg({ type:"err", text:"New password must be at least 6 characters." });
    if (newPw !== confirmPw) return setMsg({ type:"err", text:"Passwords do not match." });
    setSavingPw(true);
    try {
      await api.changePassword(username, curPw, newPw);
      setStoredPassword(newPw);
      setStoredPwState(newPw);
      setCurPw(""); setNewPw(""); setConfirmPw("");
      setSection("");
      setMsg({ type:"ok", text:"Password changed successfully!" });
    } catch (err: unknown) {
      setMsg({ type:"err", text: err instanceof Error ? err.message : "Failed to change password." });
    } finally { setSavingPw(false); }
  }

  return (
    <div style={{ minHeight:"80vh", background:"#f5f7ff", padding:"24px 10px" }}>
      <style>{`
        @media (max-width: 480px) {
          .prof-card { padding: 14px 12px !important; }
          .prof-row { flex-direction: column !important; align-items: flex-start !important; gap: 6px !important; }
          .prof-actions { flex-wrap: wrap; gap: 6px !important; }
        }
      `}</style>
      <div style={{ maxWidth:520, margin:"0 auto" }}>
        <h1 style={{ fontSize:"1.4rem", fontWeight:800, color:"#0c0f1a", marginBottom:4 }}>Profile</h1>
        <p style={{ fontSize:"0.85rem", color:"#6b7280", marginBottom:24 }}>Manage your account settings</p>

        {msg && (
          <div style={{ marginBottom:16, padding:"10px 14px", borderRadius:10, fontSize:"0.84rem", fontWeight:600,
            background: msg.type === "ok" ? "#dcfce7" : "#fef2f2",
            color: msg.type === "ok" ? "#166534" : "#dc2626",
            border: `1px solid ${msg.type === "ok" ? "#86efac" : "#fecaca"}` }}>
            {msg.text}
          </div>
        )}

        {/* Info card */}
        <div style={card}>
          <div style={row}>
            <span style={label}>Username</span>
            <span style={value}>{username}</span>
          </div>
          <div style={row}>
            <span style={label}>Email</span>
            <span style={value}>{email || "-"}</span>
          </div>
          <div style={{ ...row, borderBottom:"none", flexDirection: enterPwMode ? "column" : "row", alignItems: enterPwMode ? "flex-start" : "center", gap: enterPwMode ? 10 : 0 }}>
            <span style={label}>Password</span>
            {enterPwMode ? (
              <div style={{ display:"flex", gap:8, width:"100%" }}>
                <input
                  autoFocus
                  type="password"
                  value={enterPwVal}
                  onChange={(e) => setEnterPwVal(e.target.value)}
                  placeholder="Enter your current password"
                  style={{ ...inp, flex:1 }}
                />
                <button type="button" style={btnPrimary} onClick={() => {
                  if (enterPwVal) { setStoredPassword(enterPwVal); setStoredPwState(enterPwVal); setShowProfilePw(true); }
                  setEnterPwMode(false); setEnterPwVal("");
                }}>Save</button>
                <button type="button" style={btnOutline} onClick={() => { setEnterPwMode(false); setEnterPwVal(""); }}>Cancel</button>
              </div>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ ...value, fontFamily:"monospace", letterSpacing: showProfilePw ? "normal" : "0.15em" }}>
                  {storedPw ? (showProfilePw ? storedPw : "••••••••") : "••••••••"}
                </span>
                {storedPw ? (
                  <button type="button" onClick={() => setShowProfilePw((v) => !v)} style={{ background:"none", border:"none", cursor:"pointer", color:"#6b7280", display:"flex", alignItems:"center", padding:0 }}>
                    {showProfilePw ? <EyeOff /> : <Eye />}
                  </button>
                ) : (
                  <button type="button" onClick={() => setEnterPwMode(true)} style={{ background:"none", border:"none", cursor:"pointer", color:"#4a7af5", fontSize:"0.75rem", fontWeight:600, padding:0 }}>
                    Show
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Change Username */}
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: section === "username" ? 16 : 0 }}>
            <div>
              <p style={{ fontSize:"0.9rem", fontWeight:700, color:"#0c0f1a", margin:0 }}>Change Username</p>
              {daysLeft !== null && daysLeft > 0 && (
                <p style={{ fontSize:"0.75rem", color:"#d97706", margin:"2px 0 0", fontWeight:600 }}>
                  Available in {daysLeft} day{daysLeft !== 1 ? "s" : ""}
                </p>
              )}
              {canChangeUsername && (
                <p style={{ fontSize:"0.75rem", color:"#6b7280", margin:"2px 0 0" }}>
                  Can change once every 30 days. Updates everywhere.
                </p>
              )}
            </div>
            {canChangeUsername && section !== "username" && (
              <button onClick={() => { setSection("username"); setMsg(null); setNewUsername(""); }}
                style={btnOutline}>Change</button>
            )}
            {!canChangeUsername && (
              <span style={{ fontSize:"0.75rem", color:"#6b7280", fontWeight:600 }}>Locked</span>
            )}
          </div>

          {section === "username" && (
            <form onSubmit={(e) => { void handleUsernameChange(e); }}>
              <label style={lbl}>New Username</label>
              <input style={inp} value={newUsername} onChange={(e) => setNewUsername(e.target.value)}
                placeholder="e.g. newname123" autoFocus maxLength={50} />
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button type="submit" style={btnPrimary} disabled={savingUsername}>
                  {savingUsername ? "Saving..." : "Confirm Change"}
                </button>
                <button type="button" style={btnOutline} onClick={() => setSection("")}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Change Password */}
        <div style={card}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom: section === "password" ? 16 : 0 }}>
            <div>
              <p style={{ fontSize:"0.9rem", fontWeight:700, color:"#0c0f1a", margin:0 }}>Change Password</p>
              <p style={{ fontSize:"0.75rem", color:"#6b7280", margin:"2px 0 0" }}>
                Login with email + password
              </p>
            </div>
            {section !== "password" && (
              <button onClick={() => { setSection("password"); setMsg(null); setCurPw(""); setNewPw(""); setConfirmPw(""); }}
                style={btnOutline}>Change</button>
            )}
          </div>

          {section === "password" && (
            <form onSubmit={(e) => { void handlePasswordChange(e); }}>
              <label style={lbl}>Current Password</label>
              <div style={{ position:"relative", marginBottom:10 }}>
                <input style={{ ...inp, paddingRight:40 }} type={showCur ? "text" : "password"} value={curPw}
                  onChange={(e) => setCurPw(e.target.value)} autoFocus placeholder="Current password" />
                <button type="button" onClick={() => setShowCur((v) => !v)} style={eyeBtn} tabIndex={-1}>
                  {showCur ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <label style={lbl}>New Password</label>
              <div style={{ position:"relative", marginBottom:10 }}>
                <input style={{ ...inp, paddingRight:40 }} type={showNew ? "text" : "password"} value={newPw}
                  onChange={(e) => setNewPw(e.target.value)} placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowNew((v) => !v)} style={eyeBtn} tabIndex={-1}>
                  {showNew ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <label style={lbl}>Confirm New Password</label>
              <div style={{ position:"relative" }}>
                <input style={{ ...inp, paddingRight:40 }} type={showConfirm ? "text" : "password"} value={confirmPw}
                  onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} style={eyeBtn} tabIndex={-1}>
                  {showConfirm ? <EyeOff /> : <Eye />}
                </button>
              </div>
              <div style={{ display:"flex", gap:8, marginTop:12 }}>
                <button type="submit" style={btnPrimary} disabled={savingPw}>
                  {savingPw ? "Saving..." : "Update Password"}
                </button>
                <button type="button" style={btnOutline} onClick={() => setSection("")}>Cancel</button>
              </div>
            </form>
          )}
        </div>

        {/* Logout */}
        <button onClick={() => { clearStoredProfile(); router.push("/"); }}
          style={{ ...btnOutline, width:"100%", marginTop:4, color:"#dc2626", borderColor:"#fecaca" }}>
          Log Out
        </button>
      </div>
    </div>
  );
}

function Eye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  );
}
function EyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  );
}

const card: React.CSSProperties = { background:"#fff", borderRadius:14, border:"1.5px solid #e0e7ff", padding:"18px 20px", marginBottom:14 };
const row: React.CSSProperties = { display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:"1px solid #f1f5fb" };
const label: React.CSSProperties = { fontSize:"0.8rem", color:"#6b7280", fontWeight:600 };
const value: React.CSSProperties = { fontSize:"0.875rem", color:"#0c0f1a", fontWeight:600 };
const lbl: React.CSSProperties = { display:"block", fontSize:"0.8rem", fontWeight:600, color:"#374151", marginBottom:6 };
const inp: React.CSSProperties = { width:"100%", padding:"10px 14px", borderRadius:10, border:"1.5px solid #e0e7ff", background:"#f5f7ff", fontSize:"0.875rem", color:"#0c0f1a", outline:"none", boxSizing:"border-box" };
const btnPrimary: React.CSSProperties = { padding:"9px 20px", borderRadius:999, border:"none", background:"#2563eb", color:"#fff", fontWeight:600, fontSize:"0.82rem", cursor:"pointer" };
const btnOutline: React.CSSProperties = { padding:"9px 20px", borderRadius:999, border:"1.5px solid #2563eb", background:"#fff", color:"#2563eb", fontWeight:600, fontSize:"0.82rem", cursor:"pointer" };
const eyeBtn: React.CSSProperties = { position:"absolute", right:10, top:"50%", transform:"translateY(-50%)", background:"none", border:"none", cursor:"pointer", color:"#6b7280", display:"flex", alignItems:"center", padding:0 };
