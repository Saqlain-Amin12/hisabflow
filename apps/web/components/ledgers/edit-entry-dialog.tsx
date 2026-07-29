"use client";

import { useState, useRef } from "react";
import { useLedgerStore } from "@/store/ledger-store";
import type { Ledger, LedgerEntry } from "@/types/ledger";

interface Props {
  open: boolean;
  onClose: () => void;
  ledger: Ledger;
  entry: LedgerEntry;
  currentUsername: string;
}

export function EditEntryDialog({ open, onClose, ledger, entry, currentUsername }: Props) {
  const { updateEntry, deleteEntry } = useLedgerStore();
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Build initial shareMap from existing entry shares
  const initShares = () => {
    const s: Record<string, number> = {};
    ledger.members.forEach((m) => { s[m.username] = 0; });
    const positiveAmounts = Object.values(entry.shares).filter((v) => v > 0);
    if (positiveAmounts.length > 0 && entry.totalAmount > 0) {
      // Reverse-engineer relative share counts from stored amounts
      const minShare = Math.min(...positiveAmounts);
      entry.participants.forEach((u) => {
        const raw = entry.shares[u] ?? 0;
        s[u] = raw > 0 ? Math.round(raw / minShare) : 0;
      });
    } else {
      // Amount was 0 — just restore each participant with share count 1
      entry.participants.forEach((u) => { s[u] = 1; });
    }
    return s;
  };

  const [description, setDescription] = useState(entry.description);
  const [total, setTotal] = useState(String(entry.totalAmount));
  const totalRef = useRef<HTMLInputElement>(null);
  const [paidBy, setPaidBy] = useState(entry.paidBy);
  const [shareMap, setShareMap] = useState<Record<string, number>>(initShares);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const totalShares = Object.values(shareMap).reduce((a, b) => a + b, 0);
  const amt = parseFloat(total) || 0;
  const participating = ledger.members.filter((m) => shareMap[m.username] > 0);

  // Compute exact per-member amounts (remainder goes to rightmost members)
  const exactAmtMap = (() => {
    const tInt = Math.round(amt);
    if (tInt <= 0 || totalShares <= 0) return {} as Record<string, number>;
    const active = ledger.members.filter((m) => shareMap[m.username] > 0);
    const bases = active.map((m) => Math.floor((shareMap[m.username] / totalShares) * tInt));
    const rem = tInt - bases.reduce((a, b) => a + b, 0);
    for (let i = 0; i < rem; i++) bases[active.length - 1 - i] += 1;
    const map: Record<string, number> = {};
    active.forEach((m, i) => { map[m.username] = bases[i]; });
    return map;
  })();

  function setShare(username: string, val: number) {
    setShareMap((prev) => ({ ...prev, [username]: Math.max(0, val) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!description.trim()) return setError("Description is required.");
    if (!amt || amt <= 0) return setError("Enter a valid amount.");
    if (totalShares === 0) return setError("At least one participant required.");

    const liveAmt = parseFloat(totalRef.current?.value ?? total) || 0;
    const totalInt = Math.round(liveAmt);
    const participants: string[] = [];
    const weights: number[] = [];
    ledger.members.forEach((m) => {
      if (shareMap[m.username] > 0) { participants.push(m.username); weights.push(shareMap[m.username]); }
    });
    const baseAmts = weights.map((w) => totalInt > 0 ? Math.floor((w / totalShares) * totalInt) : 0);
    const remainder = totalInt - baseAmts.reduce((a, b) => a + b, 0);
    for (let i = 0; i < remainder; i++) baseAmts[participants.length - 1 - i] += 1;
    const shares: Record<string, number> = {};
    participants.forEach((u, i) => { shares[u] = baseAmts[i]; });

    setSubmitting(true);
    const err = await updateEntry(ledger.id, entry.id, {
      description: description.trim(),
      totalAmount: totalInt,
      paidBy,
      participants,
      shares,
    }, currentUsername);
    setSubmitting(false);
    if (err) return setError(err);
    onClose();
  }

  return (
    <div style={overlay}>
      <div style={card}>
        <h2 style={{ margin:"0 0 6px", fontSize:"1.2rem", fontWeight:700, color:"#0c0f1a" }}>Edit Entry</h2>
        <p style={{ margin:"0 0 20px", fontSize:"0.8rem", color:"#6b7280" }}>{entry.date}</p>

        <form onSubmit={handleSubmit}>
          <label style={lbl}>Description</label>
          <input style={inp} placeholder="e.g. Qeema, Biryani" value={description}
            onChange={(e) => setDescription(e.target.value)} autoFocus maxLength={200} />

          <label style={{ ...lbl, marginTop:14 }}>Total Amount (Rs.)</label>
          <input ref={totalRef} style={inp} type="text" inputMode="numeric" pattern="[0-9]*"
            placeholder="e.g. 2700" value={total}
            onChange={(e) => setTotal(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => { const ok=["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Enter"]; if(!ok.includes(e.key)&&!/^[0-9]$/.test(e.key)&&!e.metaKey&&!e.ctrlKey) e.preventDefault(); }} />

          <label style={{ ...lbl, marginTop:14 }}>Paid By</label>
          <select style={{ ...inp, padding:"11px 16px" }} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
            {ledger.members.map((m) => (
              <option key={m.username} value={m.username}>{m.displayName || m.username}</option>
            ))}
          </select>

          <label style={{ ...lbl, marginTop:14 }}>Shares per person</label>
          <p style={{ fontSize:"0.75rem", color:"#9ca3af", margin:"0 0 10px" }}>
            0 = did not eat &nbsp;·&nbsp; 1 = 1 person &nbsp;·&nbsp; 2 = 2 people (e.g. with brother)
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ledger.members.map((m) => {
              const shares = shareMap[m.username] ?? 0;
              const active = shares > 0;
              const tInt = Math.round(amt);
              const baseAmt = totalShares > 0 && tInt > 0 ? Math.floor((shares / totalShares) * tInt) : 0;
              const exactAmt = exactAmtMap[m.username] ?? 0;
              const getsRemainder = active && exactAmt > baseAmt;
              return (
                <div key={m.username} style={{
                  display:"flex", alignItems:"center", gap:10, padding:"8px 12px",
                  borderRadius:12, border:`1.5px solid ${active ? "#4a7af5" : "#e0e7ff"}`,
                  background: active ? "#f0f4ff" : "#f9faff",
                }}>
                  <span style={{ flex:1, fontSize:"0.85rem", fontWeight:600, color: active ? "#1e3a8a" : "#9ca3af" }}>
                    {m.displayName || m.username}
                  </span>
                  {amt > 0 && active && (
                    <span style={{ fontSize:"0.75rem", color:"#4a7af5", fontWeight:600, display:"flex", alignItems:"center", gap:4 }}>
                      Rs. {exactAmt}
                      {getsRemainder && (
                        <span style={{ fontSize:"0.65rem", background:"#dbeafe", color:"#1d4ed8", borderRadius:4, padding:"1px 4px", fontWeight:700 }}>+1</span>
                      )}
                    </span>
                  )}
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <button type="button" onClick={() => setShare(m.username, shares - 1)}
                      style={{ width:28, height:28, borderRadius:999, border:"1.5px solid #e0e7ff", background:"#fff", fontWeight:700, fontSize:"1rem", cursor:"pointer", color:"#374151", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      −
                    </button>
                    <span style={{ minWidth:20, textAlign:"center", fontWeight:700, fontSize:"0.95rem", color: active ? "#4a7af5" : "#c4c9d8" }}>
                      {shares}
                    </span>
                    <button type="button" onClick={() => setShare(m.username, shares + 1)}
                      style={{ width:28, height:28, borderRadius:999, border:"1.5px solid #e0e7ff", background:"#fff", fontWeight:700, fontSize:"1rem", cursor:"pointer", color:"#374151", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {totalShares > 0 && amt > 0 && (() => {
            const tInt = Math.round(amt);
            const base = Math.floor(tInt / totalShares);
            const rem = tInt - base * totalShares;
            const perStr = rem > 0 ? `Rs. ${base}–${base + 1}` : `Rs. ${base}`;
            return (
              <div style={{ marginTop:8, padding:"8px 12px", borderRadius:10, background:"#f0f4ff", border:"1.5px solid #e0e7ff" }}>
                <p style={{ fontSize:"0.78rem", color:"#374151", margin:0, fontWeight:600 }}>
                  Total saved: <span style={{ color:"#1d4ed8" }}>Rs. {tInt.toLocaleString("en-PK")}</span>
                  &nbsp;·&nbsp; {perStr} per share &nbsp;·&nbsp; {participating.length} participant{participating.length !== 1 ? "s" : ""}
                </p>
              </div>
            );
          })()}

          {error && <div style={errBox}>{error}</div>}

          <div style={{ display:"flex", gap:10, marginTop:24, justifyContent:"space-between", alignItems:"center" }}>
            <div>
              {!confirmDelete ? (
                <button type="button" onClick={() => setConfirmDelete(true)}
                  style={{ ...btnOutline, color:"#dc2626", borderColor:"#fecaca" }}>
                  Delete
                </button>
              ) : (
                <div style={{ display:"flex", gap:6, alignItems:"center" }}>
                  <span style={{ fontSize:"0.78rem", color:"#dc2626", fontWeight:600 }}>Delete entry?</span>
                  <button type="button"
                    onClick={async () => { const err = await deleteEntry(ledger.id, entry.id, currentUsername); if (err) setError(err); else onClose(); }}
                    style={{ ...btnOutline, color:"#dc2626", borderColor:"#fecaca", padding:"6px 14px" }}>
                    Yes, Delete
                  </button>
                  <button type="button" onClick={() => setConfirmDelete(false)}
                    style={{ ...btnOutline, padding:"6px 14px" }}>
                    No
                  </button>
                </div>
              )}
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button type="button" onClick={onClose} style={btnOutline}>Cancel</button>
              <button type="submit" style={btnPrimary} disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = { position:"fixed",inset:0,background:"rgba(0,0,0,0.35)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 };
const card: React.CSSProperties = { background:"#fff",borderRadius:20,padding:"28px 24px",width:"100%",maxWidth:460,boxShadow:"0 8px 40px rgba(44,96,230,0.15)",maxHeight:"90vh",overflowY:"auto" };
const lbl: React.CSSProperties = { display:"block",fontSize:"0.8rem",fontWeight:600,color:"#374151",marginBottom:6 };
const inp: React.CSSProperties = { width:"100%",padding:"11px 16px",borderRadius:12,border:"1.5px solid #e0e7ff",background:"#f5f7ff",fontSize:"0.875rem",color:"#0c0f1a",outline:"none",boxSizing:"border-box" };
const btnPrimary: React.CSSProperties = { padding:"10px 28px",borderRadius:999,border:"none",background:"#4a7af5",color:"#fff",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" };
const btnOutline: React.CSSProperties = { padding:"10px 28px",borderRadius:999,border:"1.5px solid #e0e7ff",background:"#fff",color:"#374151",fontWeight:600,fontSize:"0.875rem",cursor:"pointer" };
const errBox: React.CSSProperties = { background:"#fef2f2",border:"1px solid #fecaca",color:"#dc2626",borderRadius:10,padding:"8px 12px",fontSize:"0.82rem",marginTop:10 };
