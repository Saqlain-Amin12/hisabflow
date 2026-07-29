"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLedgerStore, calcDues } from "@/store/ledger-store";
import { AddEntryDialog } from "@/components/ledgers/add-entry-dialog";
import { EditEntryDialog } from "@/components/ledgers/edit-entry-dialog";
import type { LedgerEntry } from "@/types/ledger";
import { getStoredUsername, getStoredDisplayName } from "@/lib/profile";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { api, type ActivityLog } from "@/lib/api";

function fmt(n: number) {
  if (n === 0) return "-";
  return n.toLocaleString("en-PK");
}
function fmtDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { weekday:"short", day:"numeric", month:"short" });
}
function monthStr() { return new Date().toISOString().slice(0, 7); }

export default function LedgerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { current, loadOne, closeMonth, reopenMonth, rename, deleteLedger, leave, loading: storeLoading } = useLedgerStore();
  const [addOpen, setAddOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<LedgerEntry | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [newName, setNewName] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(monthStr());
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [amountsOpen, setAmountsOpen] = useState(false);
  const [memberColW, setMemberColW] = useState(80);
  const memberRoRef = useRef<ResizeObserver | null>(null);
  const memberSectionRef = useCallback((el: HTMLDivElement | null) => {
    if (memberRoRef.current) { memberRoRef.current.disconnect(); memberRoRef.current = null; }
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setMemberColW(Math.floor(entry.contentRect.width / 5)));
    ro.observe(el);
    memberRoRef.current = ro;
  }, []);

  useAuthGuard();
  const username = getStoredUsername() ?? "";
  const displayName = getStoredDisplayName() ?? username;

  const loadActivities = useCallback(async () => {
    if (!id) return;
    try { setActivities(await api.getActivities(id)); } catch { /* ignore */ }
  }, [id]);

  useEffect(() => { if (id) { void loadOne(id); void loadActivities(); } }, [id, loadOne, loadActivities]);

  const futureEnd = useMemo(() => { const d = new Date(); d.setMonth(d.getMonth() + 12); return d.toISOString().slice(0, 7); }, []);
  const availableMonths = useMemo(() => {
    const result: string[] = [];
    const [fy, fm] = ["2000", "01"].map(Number);
    const [ty, tm] = futureEnd.split("-").map(Number);
    let y = fy, m = fm;
    while (y < ty || (y === ty && m <= tm)) {
      result.push(`${y}-${String(m).padStart(2, "0")}`);
      m++; if (m > 12) { m = 1; y++; }
    }
    return result;
  }, [futureEnd]);

  if (!current) {
    if (storeLoading) {
      return (
        <div style={{ padding:40, textAlign:"center" }}>
          <p style={{ color:"#9ca3af" }}>Loading ledger…</p>
        </div>
      );
    }
    return (
      <div style={{ padding:40, textAlign:"center" }}>
        <p style={{ color:"#6b7280" }}>Ledger not found.</p>
        <button onClick={() => router.push("/team")} style={btnPrimary}>Back to Team</button>
      </div>
    );
  }

  const ledger = current;
  const members = ledger.members;
  const isOwner = ledger.ownerUsername === username;
  const currentMonth = monthStr();

  const effectiveMonth = availableMonths.includes(selectedMonth)
    ? selectedMonth
    : (availableMonths[availableMonths.indexOf(currentMonth)] ?? currentMonth);
  const selIdx = availableMonths.indexOf(effectiveMonth);
  const isFutureMonth = effectiveMonth > currentMonth;
  const isMonthOpen = ledger.months.find((m) => m.month === effectiveMonth)?.status !== "closed";
  const dues = calcDues(ledger, effectiveMonth);

  function fmtMonth(m: string) {
    const [y, mo] = m.split("-");
    return new Date(Number(y), Number(mo) - 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }

  // Filter entries and activities by selected month
  const monthEntries = ledger.entries.filter((e) => e.month === effectiveMonth);
  const monthActivities = activities.filter((a) => {
    if (a.entry_date) return a.entry_date.slice(0, 7) === effectiveMonth;
    return (a.created_at ?? "").slice(0, 7) === effectiveMonth;
  });
  const entriesByDate = monthEntries.reduce<Record<string, typeof ledger.entries>>((acc, e) => {
    if (!acc[e.date]) acc[e.date] = [];
    acc[e.date].push(e);
    return acc;
  }, {});
  const sortedDates = Object.keys(entriesByDate).sort();

  async function handleRename(e: React.FormEvent) {
    e.preventDefault();
    if (newName.trim()) await rename(ledger.id, newName.trim(), username);
    setRenaming(false);
    setNewName("");
  }

  async function handleLeave() {
    if (!confirm("Leave this ledger?")) return;
    await leave(ledger.id, username);
    router.push("/team");
  }

  async function handleDelete() {
    if (!confirm("Delete this ledger permanently? This cannot be undone.")) return;
    await deleteLedger(ledger.id, username);
    router.push("/team");
  }

  function buildReceiptHtml() {
    const now = new Date().toLocaleString("en-PK", { dateStyle:"long", timeStyle:"short" });
    const fmtRs = (n: number) => `Rs. ${Math.abs(n).toLocaleString("en-PK")}`;
    const rows = dues.map((d) => `
      <tr>
        <td style="font-weight:600;color:#1a1a2e">${d.displayName || d.username}</td>
        <td>${fmtRs(d.totalPaid)}</td>
        <td>${fmtRs(d.totalDue)}</td>
        <td style="color:${d.pending >= 0 ? "#059669" : "#dc2626"};font-weight:700">
          ${d.pending >= 0 ? "+" : ""}Rs. ${d.pending.toLocaleString("en-PK")}
        </td>
        <td>
          <span style="display:inline-block;padding:3px 14px;border-radius:999px;font-size:11px;font-weight:700;
            background:${d.status === "To Receive" ? "#dcfce7" : "#fef2f2"};
            color:${d.status === "To Receive" ? "#059669" : "#dc2626"}">
            ${d.status}
          </span>
        </td>
      </tr>`).join("");

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Dues Receipt — ${ledger.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 48px 56px; max-width: 860px; margin: 0 auto; }
  .title { color: #4a7af5; font-size: 26px; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 5px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 36px; }
  .section { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .09em; color: #4a7af5; border-bottom: 2px solid #e0e7ff; padding-bottom: 8px; margin-bottom: 0; }
  table { width: 100%; border-collapse: collapse; font-size: 13.5px; margin-top: 0; }
  th { color: #374151; padding: 11px 18px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; border-bottom: 1.5px solid #e0e7ff; }
  th:not(:first-child) { text-align: right; }
  td { padding: 13px 18px; border-bottom: 1px solid #f0f4ff; vertical-align: middle; color: #374151; }
  td:not(:first-child) { text-align: right; }
  tr:last-child td { border-bottom: none; }
  .footer { margin-top: 36px; padding-top: 16px; border-top: 1px solid #e0e7ff; display: flex; justify-content: space-between; align-items: flex-end; }
  .brand-title { color: #4a7af5; font-size: 13px; font-weight: 800; margin-bottom: 2px; }
  .brand-sub { color: #4a7af5; font-size: 12px; font-weight: 500; }
  .gen-date { font-size: 11px; color: #9ca3af; text-align: right; }
  @media print { body { padding: 24px 32px; } }
</style></head>
<body>
  <div class="title">HisabFlow Dues Receipt</div>
  <div class="meta">Ledger: <strong>${ledger.name}</strong> &nbsp;&nbsp;&nbsp; Month: <strong>${fmtMonth(effectiveMonth)}</strong></div>
  <div class="section">Dues Summary</div>
  <table>
    <thead><tr><th>Member</th><th>Total Paid</th><th>Total Due</th><th>Pending</th><th>Status</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">
    <div>
      <div class="brand-title">HisabFlow Dues Receipt</div>
      <div class="brand-sub">Ledger: ${ledger.name} &nbsp;&nbsp;&nbsp; Month: ${fmtMonth(effectiveMonth)}</div>
    </div>
    <div class="gen-date">Generated: ${now}</div>
  </div>
</body></html>`;
  }

  return (
    <div style={{ minHeight:"80vh", background:"#f5f7ff", padding:"24px 0" }}>
    <style>{`
      @media(max-width:768px){
        .ld-topbar{ flex-direction:column; gap:8px; }
        .ld-topbar-left{ display:flex; flex-direction:row !important; align-items:center; gap:12px; width:100%; }
        .ld-topbar-right{ flex-direction:row; flex-wrap:wrap; width:100%; align-items:center; gap:6px; }
        .ld-topbar-right .ld-btns{ flex-wrap:wrap; gap:6px; justify-content:flex-start; width:100%; }
        .ld-topbar-right .ld-btns button{ padding:7px 12px !important; font-size:0.75rem !important; }
        .ld-topbar-right .ld-copy{ width:100%; }
        .ld-table-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
        .ld-chart-scroll{ overflow-x:auto; -webkit-overflow-scrolling:touch; }
      }
      @media(max-width:480px){
        .ld-topbar-right .ld-btns button{ padding:6px 10px !important; font-size:0.72rem !important; }
        .ld-receipt-modal{ width:calc(100vw - 24px) !important; padding:18px 14px !important; }
        .ld-receipt-modal-hd{ padding:16px 16px 12px !important; }
        .ld-receipt-modal-body{ padding:14px 16px !important; }
        .ld-receipt-modal-footer{ padding:10px 16px !important; }
        .ld-activity-item{ padding:8px 10px !important; }
      }
    `}</style>
    <div style={{ padding:"0 5px" }}>

      {/* Top bar */}
      <div className="ld-topbar" style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12, marginBottom:12, flexWrap:"wrap" }}>
        {/* Ledger name + month navigator stacked */}
        <div className="ld-topbar-left" style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {renaming ? (
            <form onSubmit={(e) => { void handleRename(e); }} style={{ display:"flex", gap:8 }}>
              <input
                autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
                style={{ ...inpStyle, maxWidth:260 }}
                placeholder={ledger.name}
              />
              <button type="submit" style={btnPrimary}>Save</button>
              <button type="button" onClick={() => setRenaming(false)} style={btnOutline}>Cancel</button>
            </form>
          ) : (
            <span style={{
              padding:"9px 20px", borderRadius:999,
              border:"1.5px solid #4a7af5", color:"#4a7af5",
              fontWeight:700, fontSize:"1rem", background:"#fff",
              display:"flex", alignItems:"center", justifyContent:"center",
            }}>
              {ledger.name}
            </span>
          )}

          {/* Month navigator */}
          {availableMonths.length > 0 && (
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button
                onClick={() => selIdx > 0 && setSelectedMonth(availableMonths[selIdx - 1])}
                disabled={selIdx <= 0}
                style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:8, color: selIdx <= 0 ? "#c4c9d8" : "#1d4ed8", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor: selIdx <= 0 ? "default" : "pointer", fontSize:"0.95rem", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", flexShrink:0 }}
              >&#8249;</button>
              <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#1e3a8a" }}>
                {fmtMonth(effectiveMonth)}
              </span>
              <button
                onClick={() => selIdx < availableMonths.length - 1 && setSelectedMonth(availableMonths[selIdx + 1])}
                disabled={selIdx >= availableMonths.length - 1}
                style={{ background:"#fff", border:"1.5px solid #e2e8f0", borderRadius:8, color: selIdx >= availableMonths.length - 1 ? "#c4c9d8" : "#1d4ed8", width:28, height:28, display:"flex", alignItems:"center", justifyContent:"center", cursor: selIdx >= availableMonths.length - 1 ? "default" : "pointer", fontSize:"0.95rem", boxShadow:"0 1px 4px rgba(0,0,0,0.07)", flexShrink:0 }}
              >&#8250;</button>
            </div>
          )}
        </div>

        {/* Action buttons + ID card grouped together */}
        <div className="ld-topbar-right" style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8 }}>
          <div className="ld-btns" style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"flex-end" }}>
            {!renaming && (
              <button onClick={() => { setRenaming(true); setNewName(ledger.name); }} style={btnOutline}>Rename</button>
            )}
            {isOwner && (
              <button onClick={() => void handleDelete()} style={{...btnOutline, color:"#dc2626", borderColor:"#dc2626"}}>Delete</button>
            )}
            {!isOwner && (
              <button onClick={() => void handleLeave()} style={btnOutline}>Leave</button>
            )}
            {isMonthOpen ? (
              <button onClick={() => void closeMonth(ledger.id, effectiveMonth, username)} style={btnOutline}>Close Month</button>
            ) : (
              <button onClick={() => void reopenMonth(ledger.id, username, effectiveMonth)} style={btnOutline}>Reopen Month</button>
            )}
            <button onClick={() => setReceiptOpen(true)} style={btnOutline}>⬇ Receipt</button>
            <button onClick={() => setAddOpen(true)} disabled={isFutureMonth || !isMonthOpen} style={{...btnPrimary, ...((isFutureMonth || !isMonthOpen) ? {opacity:0.45, cursor:"not-allowed"} : {})}} title={isFutureMonth ? "Cannot add entries for future months" : !isMonthOpen ? "This month is closed" : undefined}>+ Add Entry</button>
          </div>
          <div className="ld-copy" style={{width:"100%"}}><CopyIdBar id={ledger.id} /></div>
        </div>
      </div>

      {/* ── SPREADSHEET TABLE ── */}
      {(() => {
        const ROW_H = 42;
        const HDR1_H = 35;
        const HDR2_H = 26;
        const COL_W = 72;
        const VISIBLE = 5;

        const allRows = monthEntries.length === 0 ? [] : sortedDates.flatMap((date) =>
          entriesByDate[date].map((entry, ei) => {
            const paidMember = members.find((m) => m.username === entry.paidBy);
            const positiveAmts = Object.values(entry.shares).filter((v) => v > 0);
            const minAmt = positiveAmts.length > 0 ? Math.min(...positiveAmts) : 0;
            return { entry, ei, date, paidMember, minAmt };
          })
        );

        const groupHdr = (label: string) => (
          <div style={{ background:"#3a6ae0", height:HDR1_H, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 10px" }}>
            <span style={{ fontSize:"0.67rem", fontWeight:700, color:"rgba(255,255,255,0.85)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
          </div>
        );

        const thBase = (colW: number): React.CSSProperties => ({ background:"#4a7af5", color:"#fff", fontSize:"0.68rem", fontWeight:700, whiteSpace:"nowrap", borderRight:"1px solid rgba(255,255,255,0.2)", textAlign:"center", width:colW, minWidth:colW, maxWidth:colW, height:HDR2_H, padding:"0 6px", overflow:"hidden", textOverflow:"ellipsis" });
        const tdBase = (colW: number): React.CSSProperties => ({ height:ROW_H, borderRight:"1px solid #e0e7ff", borderBottom:"1px solid #e0e7ff", fontSize:"0.82rem", padding:"0 6px", textAlign:"center", overflow:"hidden", width:colW, minWidth:colW, maxWidth:colW, boxSizing:"border-box" });

        const MemberSection = ({ members: mems, renderTd, label, outerRef, collapsed, onToggle }: { members: typeof members; renderTd: (m: typeof members[0], row: typeof allRows[0]) => React.ReactNode; label: string; outerRef?: React.RefCallback<HTMLDivElement>; collapsed?: boolean; onToggle?: () => void }) => {
          const MIN_COL = 72;
          const colW = Math.max(MIN_COL, mems.length <= 5 ? Math.floor(memberColW * 5 / Math.max(mems.length, 1)) : memberColW);
          if (collapsed) return (
            <div style={{ flexShrink:0, width:32, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"flex-start", background:"#3a6ae0", cursor:"pointer" }} onClick={onToggle} title={`Expand ${label}`}>
              <div style={{ width:"100%", height: HDR1_H + HDR2_H, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:"0.6rem", fontWeight:700, color:"rgba(255,255,255,0.85)", textTransform:"uppercase", letterSpacing:"0.07em", writingMode:"vertical-rl", transform:"rotate(180deg)" }}>{label}</span>
              </div>
              <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.7)", writingMode:"vertical-rl" }}>▶</span>
              </div>
            </div>
          );
          return (
          <div ref={outerRef} style={{ flex:"1 1 0", minWidth:0, display:"flex", flexDirection:"column", borderRight:"1px solid #e0e7ff" }}>
            <div style={{ background:"#3a6ae0", height:HDR1_H, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 8px", position:"relative" }}>
              <span style={{ fontSize:"0.67rem", fontWeight:700, color:"rgba(255,255,255,0.85)", textTransform:"uppercase", letterSpacing:"0.07em" }}>{label}</span>
              {onToggle && <button onClick={onToggle} title={`Collapse ${label}`} style={{ position:"absolute", right:6, background:"rgba(255,255,255,0.15)", border:"none", borderRadius:4, color:"#fff", cursor:"pointer", fontSize:"0.65rem", padding:"2px 5px", lineHeight:1 }}>◀</button>}
            </div>
            <div style={{ overflowX:"auto", flex:1 }}>
              <table style={{ borderCollapse:"collapse", tableLayout:"fixed", width: mems.length <= 5 ? "100%" : mems.length * colW }}>
                <thead>
                  <tr>{mems.map(m => <th key={m.username} style={thBase(colW)}>{m.displayName || m.username}</th>)}</tr>
                </thead>
                <tbody>
                  {allRows.length === 0
                    ? <tr><td colSpan={mems.length} style={{ height:ROW_H }}></td></tr>
                    : allRows.map(row => (
                      <tr key={row.entry.id} style={{ background:"#fff" }}>
                        {mems.map(m => <td key={m.username} style={tdBase(colW)}>{renderTd(m, row)}</td>)}
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        ); };

        return (
          <div className="ld-table-scroll" style={{ margin:"0 5px 28px", borderRadius:14, border:"1.5px solid #d0d8ee", overflow:"hidden", boxShadow:"0 2px 16px rgba(31,88,234,0.07)", overflowX:"auto", WebkitOverflowScrolling:"touch" as React.CSSProperties["WebkitOverflowScrolling"] }}>
          <div className="ld-table-inner" style={{ display:"flex", alignItems:"stretch", minWidth:720, background:"#fff" }}>
            {/* Fixed left: DATE, Food Bill, Paid By */}
            {/* DATE */}
            {[
              { key:"date", label:"DATE", width:115, cell: (row: typeof allRows[0], ri: number) => <span style={{ fontSize:"0.82rem", fontWeight:600, color:"#0c0f1a", whiteSpace:"nowrap" }}>{row.ei === 0 ? fmtDate(row.date) : ""}</span> },
              { key:"bill", label:"Food Bill", width:85, cell: (row: typeof allRows[0], ri: number) => <span style={{ fontSize:"0.82rem", fontWeight:600, color:"#0c0f1a" }}>{row.entry.totalAmount.toLocaleString("en-PK")}</span> },
              { key:"paidby", label:"Paid By", width:90, cell: (row: typeof allRows[0], ri: number) => <span style={{ fontSize:"0.82rem", color:"#4a7af5", fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis", maxWidth:86, display:"block" }}>{row.paidMember?.displayName || row.entry.paidBy}</span> },
            ].map(col => (
              <div key={col.key} style={{ flexShrink:0, width:col.width, display:"flex", flexDirection:"column", borderRight:"1px solid #e0e7ff" }}>
                <div style={{ background:"#4a7af5", height: HDR1_H + HDR2_H, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 10px" }}>
                  <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#fff" }}>{col.label}</span>
                </div>
                {allRows.length === 0 && col.key === "date"
                  ? <div style={{ height:ROW_H, display:"flex", alignItems:"center", justifyContent:"center", color:"#9ca3af", fontSize:"0.82rem", padding:"0 10px", whiteSpace:"nowrap" }}>No entries yet.</div>
                  : allRows.map((row, ri) => (
                    <div key={row.entry.id} style={{ display:"flex", alignItems:"center", justifyContent:"center", height:ROW_H, borderBottom:"1px solid #e0e7ff", background:"#fff", padding:"0 10px", overflow:"hidden" }}>
                      {col.cell(row, ri)}
                    </div>
                  ))
                }
              </div>
            ))}

            {/* Shares */}
            <MemberSection
              label="Shares" members={members} outerRef={memberSectionRef}
              renderTd={(m, row) => {
                const amt = row.entry.shares[m.username] ?? 0;
                const sc = amt > 0 && row.minAmt > 0 ? Math.round(amt / row.minAmt) : (row.entry.participants.includes(m.username) ? 1 : 0);
                return sc > 0 ? <span style={{ fontWeight:700, color:"#0c0f1a" }}>{sc}</span> : "";
              }}
            />

            {/* Amounts */}
            <MemberSection
              label="Amounts" members={members} collapsed={!amountsOpen} onToggle={() => setAmountsOpen(o => !o)}
              renderTd={(m, row) => {
                const hasVal = row.entry.participants.includes(m.username);
                return hasVal
                  ? <span style={{ fontWeight:600, color:"#0c0f1a" }}>{(row.entry.shares[m.username] ?? 0).toLocaleString("en-PK")}</span>
                  : <span style={{ color:"#c4c9d8" }}>-</span>;
              }}
            />

            {/* Fixed right: Description + Edit */}
            <div style={{ flexShrink:0, width:220, display:"flex", flexDirection:"column", borderLeft:"1px solid #e0e7ff" }}>
              <div style={{ background:"#4a7af5", height: HDR1_H + HDR2_H, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 14px" }}>
                <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#fff" }}>Description</span>
              </div>
              {allRows.length === 0
                ? <div style={{ height:ROW_H }} />
                : allRows.map((row, ri) => (
                  <div key={row.entry.id} style={{ display:"flex", alignItems:"center", justifyContent:"center", height:ROW_H, borderBottom:"1px solid #e0e7ff", background:"#fff", padding:"0 6px", gap:6 }}>
                    <span style={{ fontSize:"0.82rem", color:"#0c0f1a", flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textAlign:"center" }}>{row.entry.description}</span>
                    <button onClick={() => setEditEntry(row.entry)} title="Edit" aria-label={`Edit entry: ${row.entry.description}`}
                      style={{ background:"none", border:"none", cursor:"pointer", padding:4, borderRadius:6, display:"inline-flex", alignItems:"center", color:"#9ca3af", flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                      </svg>
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
          </div>
        );
      })()}

      {/* ── DUES SECTION ── */}
      <div className="dues-wrap">
        <table className="dues-table" style={{ minWidth: Math.max(500, 160 + members.length * 130) }}>
          <thead>
            <tr>
              <th className="dues-label">Dues</th>
              {members.map((m) => (
                <th key={m.username} className="dues-member">
                  {m.displayName || m.username}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="dues-row-label">Total Paid</td>
              {dues.map((d) => <td key={d.username} className="dues-val">{fmt(d.totalPaid)}</td>)}
            </tr>
            <tr>
              <td className="dues-row-label">Total Due</td>
              {dues.map((d) => <td key={d.username} className="dues-val">{fmt(d.totalDue)}</td>)}
            </tr>
            <tr className="dues-pending-row">
              <td className="dues-row-label">Total Pending</td>
              {dues.map((d) => (
                <td key={d.username} className={d.pending >= 0 ? "dues-pending-pos" : "dues-pending-neg"}>
                  {fmt(d.pending)}
                </td>
              ))}
            </tr>
            <tr className="dues-status-row">
              <td className="dues-row-label">Status</td>
              {dues.map((d) => (
                <td key={d.username} style={{ textAlign:"right" }}>
                  <span style={{
                    display:"inline-block", padding:"2px 10px", borderRadius:999, fontSize:"0.72rem", fontWeight:700,
                    background: d.status === "To Receive" ? "#dcfce7" : "#fef2f2",
                    color: d.status === "To Receive" ? "#059669" : "#dc2626",
                  }}>{d.status}</span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── BAR CHART ── */}
      {dues.length > 0 && (() => {
        const CHART_H = 300;   // total chart area height px
        const AXIS_W  = 72;    // left axis width
        const BAR_AREA_H = CHART_H - 40; // minus name label area
        const maxAbs  = Math.max(...dues.map((d) => Math.abs(d.pending)), 1);

        // Nice round Y-axis max
        const rawMax = maxAbs * 1.2;
        const mag    = Math.pow(10, Math.floor(Math.log10(rawMax)));
        const yMax   = Math.ceil(rawMax / mag) * mag;
        const yMin   = -yMax;
        const range  = yMax - yMin;

        // Pixel helpers: y=0 line is at middle of BAR_AREA_H
        const zeroY  = BAR_AREA_H / 2;
        const pxPerUnit = BAR_AREA_H / range;

        // Y axis ticks
        const ticks: number[] = [];
        const step = yMax / 2;
        for (let v = yMax; v >= yMin; v -= step) ticks.push(Math.round(v));

        const fmtY = (v: number) => v === 0 ? "0" : (Math.abs(v) >= 1000 ? `${(v/1000).toFixed(0)}k` : v.toString());

        return (
          <div style={{ borderRadius:14, border:"1.5px solid #d0d8ee", background:"#fff", boxShadow:"0 2px 16px rgba(31,88,234,0.07)", margin:"0 5px 28px", overflow:"hidden" }}>
            {/* Title */}
            <div style={{ background:"#4a7af5", padding:"10px 16px",  }}>
              <span style={{ color:"#fff", fontWeight:700, fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.06em" }}>Dues Chart</span>
            </div>
            <div className="ld-chart-scroll" style={{ padding:"20px 16px 8px", overflowX:"auto" }}>
              <div style={{ minWidth: AXIS_W + dues.length * 80, display:"flex" }}>

                {/* Y Axis */}
                <div style={{ width:AXIS_W, flexShrink:0, height:BAR_AREA_H, position:"relative" }}>
                  {ticks.map((v) => {
                    const top = zeroY - v * pxPerUnit;
                    return (
                      <div key={v} style={{ position:"absolute", right:8, top, transform:"translateY(-50%)", fontSize:"0.68rem", color:"#9ca3af", fontWeight:600, whiteSpace:"nowrap" }}>
                        {v.toLocaleString("en-PK")}
                      </div>
                    );
                  })}
                </div>

                {/* Chart area */}
                <div style={{ flex:1, height:CHART_H, position:"relative" }}>
                  {/* Horizontal grid lines */}
                  {ticks.map((v) => {
                    const top = zeroY - v * pxPerUnit;
                    return (
                      <div key={v} style={{
                        position:"absolute", left:0, right:0, top,
                        height: v === 0 ? 2 : 1,
                        background: v === 0 ? "#4a7af5" : "#e8edf8",
                        opacity: v === 0 ? 0.5 : 1,
                      }} />
                    );
                  })}

                  {/* Bars */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:BAR_AREA_H, display:"flex", alignItems:"flex-start", gap:6, padding:"0 8px" }}>
                    {dues.map((d) => {
                      const isPos = d.pending >= 0;
                      const barPx = Math.max(3, Math.abs(d.pending) * pxPerUnit);
                      const barTop = isPos ? zeroY - barPx : zeroY;
                      const label = d.pending !== 0 ? d.pending.toLocaleString("en-PK") : "0";
                      return (
                        <div key={d.username} style={{ flex:1, height:BAR_AREA_H, position:"relative" }}>
                          {/* Bar */}
                          <div style={{
                            position:"absolute", left:"15%", right:"15%",
                            top: barTop, height: barPx,
                            background: isPos ? "#4a7af5" : "#ef4444",
                            borderRadius: isPos ? "4px 4px 0 0" : "0 0 4px 4px",
                          }} />
                          {/* Value label inside/above bar */}
                          <div style={{
                            position:"absolute", left:0, right:0,
                            top: isPos ? barTop - 18 : barTop + barPx + 2,
                            textAlign:"center", fontSize:"0.65rem", fontWeight:700,
                            color: isPos ? "#4a7af5" : "#ef4444",
                          }}>
                            {label}
                          </div>
                          {/* Name label */}
                          <div style={{
                            position:"absolute", bottom: -(CHART_H - BAR_AREA_H - 4), left:0, right:0,
                            textAlign:"center", fontSize:"0.68rem", color:"#374151", fontWeight:600,
                            whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis",
                          }}>
                            {d.displayName || d.username}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── ACTIVITY LOG ── */}
      <div style={{ borderRadius:14, border:"1.5px solid #d0d8ee", background:"#fff", boxShadow:"0 2px 16px rgba(31,88,234,0.07)", margin:"0 5px 28px", overflow:"hidden" }}>
        <div style={{ background:"#4a7af5", padding:"10px 16px",  }}>
          <span style={{ color:"#fff", fontWeight:700, fontSize:"0.78rem", textTransform:"uppercase", letterSpacing:"0.06em" }}>Activity History</span>
        </div>
        {monthActivities.length === 0 ? (
          <div style={{ padding:"24px", textAlign:"center", color:"#9ca3af", fontSize:"0.82rem" }}>No activity yet.</div>
        ) : (
          <div style={{ maxHeight:320, overflowY:"auto" }}>
            {monthActivities.map((a) => {
              const member = members.find((m) => m.username === a.username);
              const name = member?.displayName || a.username;
              const actionColor = a.action === "added" ? "#059669" : a.action === "updated" ? "#d97706" : "#dc2626";
              const actionLabel = a.action === "added" ? "added" : a.action === "updated" ? "updated" : "deleted";
              const timeStr = new Date(a.created_at).toLocaleString("en-PK", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" });
              return (
                <div key={a.id} className="ld-activity-item" style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"10px 16px", borderBottom:"1px solid #f0f4ff" }}>
                  <div style={{ width:32, height:32, borderRadius:999, background:"#f0f4ff", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:"0.75rem", fontWeight:700, color:"#4a7af5" }}>
                    {name.slice(0, 1).toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:"0.82rem", color:"#374151" }}>
                      <strong>{name}</strong>
                      {" "}
                      <span style={{ color:actionColor, fontWeight:600 }}>{actionLabel}</span>
                      {" "}entry
                      {a.entry_description && <> &ldquo;<span style={{ color:"#1e3a8a" }}>{a.entry_description}</span>&rdquo;</>}
                      {a.entry_amount != null && a.entry_amount > 0 && (
                        <span style={{ color:"#6b7280" }}> · Rs. {a.entry_amount.toLocaleString("en-PK")}</span>
                      )}
                    </div>
                    <div style={{ fontSize:"0.72rem", color:"#9ca3af", marginTop:2 }}>{timeStr}{a.entry_date ? ` · ${fmtDate(a.entry_date)}` : ""}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {addOpen && (
        <AddEntryDialog
          open={addOpen}
          onClose={() => { setAddOpen(false); void loadOne(id); void loadActivities(); }}
          ledger={ledger}
          currentUsername={username}
          defaultDate={effectiveMonth !== currentMonth ? effectiveMonth + "-01" : undefined}
        />
      )}
      {editEntry && (
        <EditEntryDialog
          open={true}
          onClose={() => { setEditEntry(null); void loadActivities(); }}
          ledger={ledger}
          entry={editEntry}
          currentUsername={username}
        />
      )}

      {receiptOpen && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:1000,padding:16 }}>
          <div className="ld-receipt-modal" style={{ background:"#fff",borderRadius:20,width:"100%",maxWidth:700,boxShadow:"0 8px 40px rgba(44,96,230,0.18)",maxHeight:"90vh",display:"flex",flexDirection:"column",overflow:"hidden" }}>
            {/* Header */}
            <div className="ld-receipt-modal-hd" style={{ background:"linear-gradient(135deg,#4a7af5,#3b6ce0)",padding:"22px 28px 18px" }}>
              <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between" }}>
                <div>
                  <div style={{ color:"#fff",fontWeight:800,fontSize:"1.15rem",letterSpacing:"-0.02em",marginBottom:3 }}>HisabFlow Dues Receipt</div>
                  <div style={{ color:"rgba(255,255,255,0.82)",fontSize:"0.8rem" }}>
                    Ledger: <strong style={{ color:"#fff" }}>{ledger.name}</strong> &nbsp;·&nbsp; {fmtMonth(effectiveMonth)}
                  </div>
                </div>
                <button aria-label="Close receipt" onClick={() => setReceiptOpen(false)} style={{ background:"rgba(255,255,255,0.18)",border:"none",borderRadius:999,color:"#fff",fontWeight:700,fontSize:"1.1rem",cursor:"pointer",width:32,height:32,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>×</button>
              </div>
            </div>
            {/* Dues table */}
            <div className="ld-receipt-modal-body" style={{ overflowY:"auto",flex:1,padding:"24px 28px" }}>
              <div style={{ fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.08em",color:"#4a7af5",marginBottom:12 }}>Dues Summary</div>
              <div style={{ overflowX:"auto" }}>
                <table style={{ width:"100%",borderCollapse:"collapse",fontSize:"0.85rem" }}>
                  <thead>
                    <tr style={{ background:"#f0f4ff" }}>
                      {["Member","Total Paid","Total Due","Pending","Status"].map((h, i) => (
                        <th key={h} style={{ padding:"10px 14px",textAlign: i === 0 ? "left" : "right",fontSize:"0.72rem",fontWeight:700,textTransform:"uppercase",letterSpacing:"0.06em",color:"#374151",whiteSpace:"nowrap" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dues.map((d) => (
                      <tr key={d.username} style={{ borderBottom:"1px solid #f0f4ff" }}>
                        <td style={{ padding:"13px 14px",fontWeight:600,color:"#1a1a2e" }}>{d.displayName || d.username}</td>
                        <td style={{ padding:"13px 14px",textAlign:"right",color:"#374151" }}>Rs. {d.totalPaid.toLocaleString("en-PK")}</td>
                        <td style={{ padding:"13px 14px",textAlign:"right",color:"#374151" }}>Rs. {d.totalDue.toLocaleString("en-PK")}</td>
                        <td style={{ padding:"13px 14px",textAlign:"right",fontWeight:700,color: d.pending >= 0 ? "#059669" : "#dc2626" }}>
                          {d.pending >= 0 ? "+" : ""}Rs. {Math.abs(d.pending).toLocaleString("en-PK")}
                        </td>
                        <td style={{ padding:"13px 14px",textAlign:"right" }}>
                          <span style={{ display:"inline-block",padding:"3px 12px",borderRadius:999,fontSize:"0.72rem",fontWeight:700,background: d.status === "To Receive" ? "#dcfce7" : "#fef2f2",color: d.status === "To Receive" ? "#059669" : "#dc2626" }}>
                            {d.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Footer */}
            <div className="ld-receipt-modal-footer" style={{ borderTop:"1px solid #e0e7ff",padding:"14px 28px",display:"flex",alignItems:"center",justifyContent:"space-between" }}>
              <span style={{ fontSize:"0.75rem",color:"#9ca3af" }}>
                Generated: {new Date().toLocaleString("en-PK", { dateStyle:"long", timeStyle:"short" })}
              </span>
              <button
                onClick={() => {
                  const html = buildReceiptHtml();
                  const blob = new Blob([html], { type:"text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url; a.download = `receipt-${ledger.name}-${effectiveMonth}.html`;
                  a.click(); URL.revokeObjectURL(url);
                }}
                style={{ padding:"9px 22px",borderRadius:999,border:"none",background:"#4a7af5",color:"#fff",fontWeight:700,fontSize:"0.82rem",cursor:"pointer" }}>
                Download Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { padding:"9px 20px",borderRadius:999,border:"none",background:"#4a7af5",color:"#fff",fontWeight:600,fontSize:"0.82rem",cursor:"pointer" };
const btnOutline: React.CSSProperties = { padding:"9px 20px",borderRadius:999,border:"1.5px solid #4a7af5",background:"#fff",color:"#4a7af5",fontWeight:600,fontSize:"0.82rem",cursor:"pointer" };
const inpStyle: React.CSSProperties = { padding:"9px 14px",borderRadius:10,border:"1.5px solid #e0e7ff",background:"#f5f7ff",fontSize:"0.875rem",color:"#0c0f1a",outline:"none" };

function CopyIdBar({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    try {
      navigator.clipboard.writeText(id).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1800); });
    } catch {
      const el = document.createElement("textarea");
      el.value = id; document.body.appendChild(el); el.select();
      document.execCommand("copy"); document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    }
  }
  return (
    <div style={{ width:"100%" }}>
      <button onClick={copy} title="Tap to copy Ledger ID" style={{
        display:"flex", alignItems:"center", justifyContent:"space-between", gap:8,
        padding:"6px 14px", borderRadius:999, width:"100%",
        border:"1.5px solid #e0e7ff", background:"#f5f7ff",
        cursor:"pointer", transition:"all 0.15s",
      }}>
        <span style={{ fontSize:"0.7rem", color:"#6b7280", fontWeight:600 }}>ID</span>
        <span style={{ fontSize:"0.7rem", color:"#4a7af5", fontWeight:600, fontFamily:"monospace" }}>
          {id.slice(0, 8)}...
        </span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={copied ? "#059669" : "#4a7af5"} strokeWidth="2.5">
          {copied
            ? <polyline points="20 6 9 17 4 12"/>
            : <><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>
          }
        </svg>
        {copied && <span style={{ fontSize:"0.68rem", color:"#059669", fontWeight:500 }}>Copied!</span>}
      </button>
    </div>
  );
}
