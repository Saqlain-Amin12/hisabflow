"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { getStoredUsername } from "@/lib/profile";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BASE = `${API}/api/v1/budget`;

function numOnly(val: string) {
  const cleaned = val.replace(/[^0-9.]/g, "");
  const parts = cleaned.split(".");
  if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
  if (parts[1] !== undefined && parts[1].length > 2) return parts[0] + "." + parts[1].slice(0, 2);
  return cleaned;
}

const numKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowed = ["Backspace","Delete","ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Tab","Enter","."];
  if (!allowed.includes(e.key) && !/^[0-9]$/.test(e.key) && !e.metaKey && !e.ctrlKey) e.preventDefault();
};

// ── Types ──────────────────────────────────────────────────────────────────
type Category = "income" | "bills" | "expenses" | "savings" | "debt";
type Tab = "budget" | "goal-tracker" | "goal-ledger" | "goal-dashboard";

interface Tx   { id: string; tx_date: string; amount: number; category: Category; subcategory: string; notes: string | null; created_at: string | null; updated_at: string | null; }
interface SummaryRow { category: Category; budget: number; actual: number; left: number; }
interface Summary { month: string; rows: SummaryRow[]; total_left: number; }
interface GoalOut { id: string; name: string; start_date: string; goal_date: string; goal_amount: number; starting_amount: number; total_saved: number; monthly_target: number; progress_pct: number; }
interface GoalEntry { id: string; goal_id: string; goal_name: string; entry_date: string; amount: number; notes: string | null; }

const DEFAULTS: Record<Category, string[]> = {
  income:   ["Paycheck", "Pocket Money", "Business", "Side Hustle", "Interest Income", "Dividends", "Other"],
  bills:    ["Rent", "Electricity", "Water", "Internet", "Mobile", "Gas", "Gym", "Health Insurance", "Spotify", "Netflix", "ChatGPT", "Claude", "Gemini", "Midjourney", "GitHub Copilot", "AI Subscription"],
  expenses: ["Food", "Dining Out", "Transportation", "Household", "Education", "Health", "Beauty", "Gifts", "Self-development", "Entertainment"],
  savings:  ["Emergency Fund", "Car", "Travel", "Renovation"],
  debt:     ["Credit Card", "Student Loan", "Mortgage", "Other"],
};
const CAT_LABEL: Record<Category, string> = { income:"Income", bills:"Bills", expenses:"Expenses", savings:"Savings", debt:"Debt" };
const SLICE_COLORS = ["#1d4ed8","#7c3aed","#059669","#0891b2","#f59e0b"];
const CAT_COLOR: Record<Category, string> = { income:"#059669", bills:"#1d4ed8", expenses:"#ef4444", savings:"#10b981", debt:"#8b5cf6" };
const CAT_LIGHT: Record<Category, string> = { income:"#d1fae5", bills:"#dbeafe", expenses:"#fee2e2", savings:"#d1fae5", debt:"#ede9fe" };
const GOAL_COLORS  = ["#1d4ed8","#7c3aed","#059669","#d97706","#e11d48","#0891b2"];

function fmt(n: number) { return n.toLocaleString("en-PK",{minimumFractionDigits:2,maximumFractionDigits:2}); }
function monthLabel(m: string) { const [y,mo]=m.split("-"); return new Date(+y,+mo-1).toLocaleString("en",{month:"long",year:"numeric"}); }
function currentMonth() { return new Date().toISOString().slice(0,7); }
function fmtTime(iso: string | null) { if(!iso) return "--"; const d=new Date(iso); return d.toLocaleTimeString("en-PK",{hour:"2-digit",minute:"2-digit",hour12:true}); }
function fmtDate(ymd: string) { const [y,m,d]=ymd.split("-"); return `${d}/${m}/${y}`; }

// ── Donut Chart ────────────────────────────────────────────────────────────
function DonutChart({spent,total,size=150}:{spent:number;total:number;size?:number}) {
  const r=(size/2)-16, circ=2*Math.PI*r, pct=total>0?Math.min(spent/total,1):0, dash=pct*circ, cx=size/2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#dbeafe" strokeWidth="18"/>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#1d4ed8" strokeWidth="18"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ/4} strokeLinecap="round"
        style={{transition:"stroke-dasharray .6s ease"}}/>
      <text x={cx} y={cx-5} textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b">Left</text>
      <text x={cx} y={cx+13} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1d4ed8">
        {total>0?`${Math.round((1-pct)*100)}%`:"—"}
      </text>
    </svg>
  );
}

function AllocationDonut({rows,size=150}:{rows:SummaryRow[];size?:number}) {
  const out=rows.filter(r=>r.category!=="income"), total=out.reduce((s,r)=>s+r.actual,0)||1;
  const r=(size/2)-14, circ=2*Math.PI*r, cx=size/2; let off=circ/4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#dbeafe" strokeWidth="20"/>
      {out.map((row)=>{ const d=row.actual/total*circ; const el=<circle key={row.category} cx={cx} cy={cx} r={r} fill="none" stroke={CAT_COLOR[row.category]} strokeWidth="20" strokeDasharray={`${d} ${circ-d}`} strokeDashoffset={off}/>; off-=d; return el; })}
    </svg>
  );
}

function SpendingBar({rows}:{rows:SummaryRow[]}) {
  const cats = rows.filter(r=>r.category!=="income"&&r.category!=="debt");
  const max = Math.max(...cats.map(r=>r.actual), 1);
  return (
    <div style={{width:"100%",display:"flex",flexDirection:"column",gap:"14px"}}>
      {cats.map((r)=>(
        <div key={r.category} style={{display:"flex",alignItems:"center",gap:"10px"}}>
          <div style={{width:"64px",fontSize:"0.71rem",fontWeight:700,color:"#374151",textAlign:"right",flexShrink:0}}>{CAT_LABEL[r.category]}</div>
          <div style={{flex:1,height:"20px",background:CAT_LIGHT[r.category],borderRadius:"4px",overflow:"hidden"}}>
            <div style={{height:"100%",width:`${r.actual/max*100}%`,background:CAT_COLOR[r.category],borderRadius:"4px",transition:"width .6s ease",minWidth:r.actual>0?"4px":"0"}}/>
          </div>
          <div style={{width:"72px",fontSize:"0.7rem",fontWeight:700,color:CAT_COLOR[r.category],textAlign:"right",flexShrink:0}}>{r.actual>0?`${(r.actual/1000).toFixed(1)}k`:"—"}</div>
        </div>
      ))}
      <div style={{display:"flex",gap:"10px",marginTop:"2px"}}>
        <div style={{width:"64px",flexShrink:0}}/>
        <div style={{flex:1,display:"flex",justifyContent:"space-between",fontSize:"0.6rem",color:"#94a3b8",paddingTop:"4px",borderTop:"1px solid #f1f5f9"}}>
          <span>0</span><span>{(max/2/1000).toFixed(1)}k</span><span>{(max/1000).toFixed(1)}k</span>
        </div>
        <div style={{width:"72px",flexShrink:0}}/>
      </div>
    </div>
  );
}

function GoalDonut({goals,size=180}:{goals:GoalOut[];size?:number}) {
  const total=goals.reduce((s,g)=>s+g.goal_amount,0)||1;
  const r=(size/2)-18, circ=2*Math.PI*r, cx=size/2; let off=circ/4;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#dbeafe" strokeWidth="22"/>
      {goals.map((g,i)=>{ const d=g.goal_amount/total*circ; const el=<circle key={g.id} cx={cx} cy={cx} r={r} fill="none" stroke={GOAL_COLORS[i%GOAL_COLORS.length]} strokeWidth="22" strokeDasharray={`${d} ${circ-d}`} strokeDashoffset={off}/>; off-=d; return el; })}
    </svg>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function IndividualPage() {
  useAuthGuard();
  const username = getStoredUsername() ?? "";
  const [month, setMonth] = useState(currentMonth());
  const [tab, setTab] = useState<Tab>("budget");

  const [txs, setTxs]             = useState<Tx[]>([]);
  const [summary, setSummary]     = useState<Summary|null>(null);
  const [goals, setGoals]         = useState<GoalOut[]>([]);
  const [goalEntries, setGoalEntries] = useState<GoalEntry[]>([]);
  const [loading, setLoading]     = useState(false);

  const [showTxModal, setShowTxModal]     = useState(false);
  const [txCatLocked, setTxCatLocked]     = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [editTx, setEditTx] = useState<Tx|null>(null);
  const [editTxForm, setEditTxForm] = useState({date:"",amount:"",notes:""});

  const [txForm, setTxForm] = useState({date:new Date().toISOString().slice(0,10),amount:"",category:"expenses" as Category,subcategory:"",notes:""});
  const [goalForm, setGoalForm] = useState({name:"",start_date:"",goal_date:"",goal_amount:"",starting_amount:""});
  const [entryForm, setEntryForm] = useState({goal_id:"",entry_date:new Date().toISOString().slice(0,10),amount:"",notes:""});
  const [formErr, setFormErr] = useState("");

  const today = new Date().toISOString().slice(0,10);
  const prevMonth = () => { const [y,m]=month.split("-").map(Number),d=new Date(y,m-2); setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); };
  const nextMonth = () => { const [y,m]=month.split("-").map(Number),d=new Date(y,m);   setMonth(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`); };
  const isCurrentMonth = month >= today.slice(0,7);
  const isFutureMonth = month > today.slice(0,7);
  const monthMin = `${month}-01`;
  const monthMax = isFutureMonth ? today : (month === today.slice(0,7) ? today : new Date(+month.split("-")[0], +month.split("-")[1], 0).toISOString().slice(0,10));
  // default date for new transaction: today if current month, otherwise last day of that month
  const defaultTxDate = month === today.slice(0,7) ? today : monthMax;

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const safe = (url: string, fallback: unknown = []) =>
        fetch(url).then(r => r.ok ? r.json() : fallback).catch(() => fallback);
      const qs = `username=${username}&month=${month}`;
      const [t,s,g,ge] = await Promise.all([
        safe(`${BASE}/transactions?${qs}`),
        safe(`${BASE}/summary/${month}?username=${username}`, null),
        safe(`${BASE}/goals?username=${username}`),
        safe(`${BASE}/goal-entries?username=${username}`),
      ]);
      setTxs(Array.isArray(t)?t:[]);
      setSummary((s as Summary)?.month?(s as Summary):null);
      setGoals(Array.isArray(g)?g:[]);
      setGoalEntries(Array.isArray(ge)?ge:[]);
    } finally { setLoading(false); }
  }, [username, month]);

  useEffect(() => { load(); }, [load]);

  async function handleAddTx(e:React.FormEvent) {
    e.preventDefault(); setFormErr("");
    const parsedAmt = parseFloat(txForm.amount);
    if (!txForm.subcategory) return setFormErr("Subcategory is required.");
    if (!txForm.amount || isNaN(parsedAmt) || parsedAmt <= 0) return setFormErr("Enter a valid positive amount.");
    try {
      const res = await fetch(`${BASE}/transactions?username=${username}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tx_date:txForm.date,amount:parsedAmt,category:txForm.category,subcategory:txForm.subcategory,notes:txForm.notes||null})});
      if (!res.ok) return setFormErr("Failed to add.");
      setTxForm(f=>({...f,amount:"",subcategory:"",notes:""}));
      setShowTxModal(false); load();
    } catch { setFormErr("Cannot connect to server. Make sure the backend is running."); }
  }

  async function deleteTx(id:string) {
    try { await fetch(`${BASE}/transactions/${id}?username=${username}`,{method:"DELETE"}); load(); } catch { setFormErr("Failed to delete transaction. Please try again."); }
  }

  function openEditTx(t:Tx) {
    setEditTx(t);
    setEditTxForm({date:t.tx_date,amount:String(t.amount),notes:t.notes??""});
    setFormErr("");
  }
  async function handleEditTxSave(e:React.FormEvent) {
    e.preventDefault(); setFormErr("");
    const parsedEditAmt = parseFloat(editTxForm.amount);
    if (!editTx) return;
    if (!editTxForm.amount || isNaN(parsedEditAmt) || parsedEditAmt <= 0) return setFormErr("Enter a valid positive amount.");
    try {
      const res = await fetch(`${BASE}/transactions/${editTx.id}?username=${username}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({tx_date:editTxForm.date,amount:parsedEditAmt,notes:editTxForm.notes||null})});
      if (!res.ok) return setFormErr("Failed to update.");
      setEditTx(null); load();
    } catch { setFormErr("Cannot connect to server. Make sure the backend is running."); }
  }

  async function handleAddGoal(e:React.FormEvent) {
    e.preventDefault(); setFormErr("");
    const parsedGoalAmt = parseFloat(goalForm.goal_amount);
    if (!goalForm.name||!goalForm.start_date||!goalForm.goal_date) return setFormErr("All fields required.");
    if (!goalForm.goal_amount || isNaN(parsedGoalAmt) || parsedGoalAmt <= 0) return setFormErr("Enter a valid positive goal amount.");
    try {
      const res = await fetch(`${BASE}/goals?username=${username}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:goalForm.name,start_date:goalForm.start_date,goal_date:goalForm.goal_date,goal_amount:parsedGoalAmt,starting_amount:parseFloat(goalForm.starting_amount)||0})});
      if (!res.ok) return setFormErr("Failed to add goal.");
      setGoalForm({name:"",start_date:"",goal_date:"",goal_amount:"",starting_amount:""});
      setShowGoalModal(false); load();
    } catch { setFormErr("Cannot connect to server. Make sure the backend is running."); }
  }
  async function deleteGoal(id:string) {
    try { await fetch(`${BASE}/goals/${id}?username=${username}`,{method:"DELETE"}); load(); } catch { setFormErr("Failed to delete goal. Please try again."); }
  }

  async function handleAddEntry(e:React.FormEvent) {
    e.preventDefault(); setFormErr("");
    const parsedEntryAmt = parseFloat(entryForm.amount);
    if (!entryForm.goal_id) return setFormErr("Please select a goal.");
    if (!entryForm.amount || isNaN(parsedEntryAmt) || parsedEntryAmt <= 0) return setFormErr("Enter a valid positive amount.");
    try {
      const res = await fetch(`${BASE}/goal-entries?username=${username}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({goal_id:entryForm.goal_id,entry_date:entryForm.entry_date,amount:parsedEntryAmt,notes:entryForm.notes||null})});
      if (!res.ok) return setFormErr("Failed to add entry.");
      setEntryForm(f=>({...f,amount:"",notes:"",goal_id:""}));
      setShowEntryModal(false); load();
    } catch { setFormErr("Cannot connect to server. Make sure the backend is running."); }
  }
  async function deleteEntry(id:string) {
    try { await fetch(`${BASE}/goal-entries/${id}?username=${username}`,{method:"DELETE"}); load(); } catch { setFormErr("Failed to delete entry. Please try again."); }
  }

  const sr = (cat:Category) => summary?.rows.find(r=>r.category===cat);
  const incomeActual = sr("income")?.actual??0;
  const totalOut = (summary?.rows??[]).filter(r=>r.category!=="income").reduce((s,r)=>s+r.actual,0);
  const totalGoal  = goals.reduce((s,g)=>s+g.goal_amount,0);
  const totalSaved = goals.reduce((s,g)=>s+g.total_saved,0);

  const TRACKER_CATS: Category[] = ["income","bills","expenses","savings"];

  return (
    <>
      <style>{`
        .bp{font-family:'Inter',system-ui,sans-serif;background:#f1f5f9;min-height:100vh;color:#0f172a;display:flex;flex-direction:column;}
        .bp *{box-sizing:border-box;}
        .bp-inner{width:100%;max-width:1280px;margin:0 auto;}
        .bp-hd{background:#f1f5f9;padding:16px 20px 12px;}
        .bp-hd-top{display:flex;align-items:center;justify-content:space-between;}
        .bp-page-nav{display:flex;align-items:center;gap:8px;}
        .bp-page-title,.bp-page-link{display:inline-flex;align-items:center;padding:7px 18px;border-radius:9px;font-size:0.9rem;font-weight:800;letter-spacing:-0.01em;text-decoration:none;cursor:pointer;transition:background .15s,box-shadow .15s;}
        .bp-page-title{background:linear-gradient(135deg,#1e3a8a,#3b6ef5);color:#fff;box-shadow:0 4px 14px rgba(29,78,216,0.25);}
        .bp-page-link{background:#fff;color:#1d4ed8;border:1.5px solid #bfdbfe;box-shadow:0 2px 8px rgba(29,78,216,0.08);}
        .bp-page-link:hover{background:#eff6ff;box-shadow:0 4px 14px rgba(29,78,216,0.15);}
        .bp-month-nav{display:flex;align-items:center;gap:8px;}
        .bp-mn-btn{background:#fff;border:1.5px solid #e2e8f0;border-radius:8px;color:#1d4ed8;width:28px;height:28px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.95rem;transition:background .15s,border-color .15s;box-shadow:0 1px 4px rgba(0,0,0,0.07);}
        .bp-mn-btn:hover{background:#eff6ff;border-color:#1d4ed8;}
        .bp-mn-label{font-size:0.85rem;font-weight:700;color:#1d4ed8;min-width:120px;text-align:center;}
        .bp-body{flex:1;padding:14px 0 24px;width:100%;}
        .bp-tabs-bar{display:flex;gap:6px;flex-wrap:wrap;}
        .bp-tab{padding:7px 18px;font-size:0.8rem;font-weight:600;color:#64748b;cursor:pointer;border:1.5px solid #e2e8f0;background:#fff;border-radius:8px;transition:all .15s;white-space:nowrap;font-family:inherit;}
        .bp-tab:hover{background:#eff6ff;color:#1d4ed8;border-color:#bfdbfe;}
        .bp-tab.active{background:linear-gradient(135deg,#1d4ed8,#3b6ef5);color:#fff;border-color:transparent;box-shadow:0 2px 8px rgba(29,78,216,0.25);}
        .bp-cards{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:14px;}
        .bp-card{background:#fff;padding:20px 24px;border-right:1px solid #f1f5f9;border-top:none;box-shadow:0 2px 8px rgba(0,0,0,0.05);border-radius:8px 8px 0 0;}
        .bp-card:last-child{border-right:none;}
        .bp-card-lbl{font-size:0.67rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;}
        .bp-card-val{font-size:1.45rem;font-weight:800;letter-spacing:-0.03em;}
        .bp-card-sub{font-size:0.7rem;color:#94a3b8;margin-top:2px;}
        .c-blue{color:#1d4ed8;} .c-green{color:#059669;} .c-red{color:#dc2626;} .c-amber{color:#d97706;}
        .bp-charts{display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-bottom:14px;border-bottom:1px solid #f1f5f9;}
        .bp-chart-card{background:#fff;padding:20px 24px;border-right:1px solid #f1f5f9;box-shadow:0 2px 8px rgba(0,0,0,0.05);display:flex;flex-direction:column;align-items:center;}
        .bp-chart-card:last-child{border-right:none;}
        .bp-chart-ttl{font-size:0.67rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:14px;text-align:center;width:100%;}
        .bp-chart-inner{width:100%;display:flex;justify-content:center;}
        .bp-donut-row{display:flex;align-items:center;gap:20px;}
        .bp-legend{display:flex;flex-direction:column;gap:7px;}
        .bp-leg-item{display:flex;align-items:center;gap:7px;font-size:0.75rem;color:#374151;}
        .bp-leg-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
        .bp-section{background:#fff;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.06);margin-bottom:10px;border-top:1px solid #f1f5f9;}
        .bp-sec-hd{background:linear-gradient(135deg,#1d4ed8,#3b6ef5);padding:12px 18px;display:flex;align-items:center;justify-content:space-between;}
        .bp-sec-hd h3{font-size:0.75rem;font-weight:800;color:#fff;text-transform:uppercase;letter-spacing:.06em;margin:0;}
        .bp-icon-btn{background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.28);border-radius:7px;color:#fff;width:26px;height:26px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:0.9rem;font-weight:700;transition:background .15s;flex-shrink:0;}
        .bp-icon-btn:hover{background:rgba(255,255,255,0.3);}
        .bp-tbl{width:100%;border-collapse:collapse;}
        .bp-tbl th{font-size:0.65rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;padding:9px 18px;text-align:left;background:#f8faff;border-bottom:1px solid #e2e8f0;}
        .bp-tbl th:nth-child(2){text-align:right;}
        .bp-tbl td{font-size:0.8rem;padding:9px 18px;border-bottom:1px solid #f1f5f9;color:#374151;}
        .bp-tbl td:nth-child(2){text-align:right;font-weight:600;}
        .bp-tbl tr:last-child td{border-bottom:none;}
        .bp-tbl tr:hover td{background:#f8faff;}
        .bp-tbl-total td{font-weight:800;color:#0f172a;background:#f8faff;border-top:2px solid #e2e8f0;}
        .bp-trackers{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:10px;}
        .bp-prog-track{width:100%;height:7px;background:#dbeafe;border-radius:4px;overflow:hidden;min-width:80px;}
        .bp-prog-fill{height:100%;background:linear-gradient(90deg,#1d4ed8,#3b6ef5);border-radius:4px;transition:width .5s ease;}
        .bp-gd-summary{background:#fff;padding:32px;text-align:center;box-shadow:0 1px 4px rgba(0,0,0,0.05);margin-bottom:10px;border-top:1px solid #f1f5f9;}
        .bp-gd-numbers{font-size:2rem;font-weight:800;color:#1d4ed8;letter-spacing:-0.04em;margin-bottom:6px;}
        .bp-gd-pct{font-size:1rem;font-weight:700;color:#64748b;}
        .bp-gd-sublbl{font-size:0.72rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-bottom:12px;}
        .bp-bar-chart{display:flex;flex-direction:column;gap:10px;}
        .bp-bc-row{display:flex;align-items:center;gap:10px;}
        .bp-bc-lbl{font-size:0.72rem;color:#374151;width:90px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .bp-bc-track{flex:1;height:24px;background:#f1f5f9;border-radius:6px;overflow:hidden;}
        .bp-bc-fill{height:100%;border-radius:6px;transition:width .5s ease;}
        .bp-bc-val{font-size:0.72rem;font-weight:700;color:#1d4ed8;width:80px;text-align:right;}
        .bp-bkd-row{display:flex;align-items:center;gap:10px;margin-bottom:8px;}
        .bp-bkd-lbl{font-size:0.72rem;color:#374151;width:130px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .bp-bkd-track{flex:1;height:8px;background:#dbeafe;border-radius:4px;overflow:hidden;}
        .bp-bkd-fill{height:100%;background:linear-gradient(90deg,#1d4ed8,#3b6ef5);border-radius:4px;transition:width .5s ease;}
        .bp-bkd-pct{font-size:0.7rem;font-weight:700;color:#1d4ed8;width:40px;text-align:right;}
        .bp-badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:0.65rem;font-weight:700;}
        .cat-income{background:#dbeafe;color:#1d4ed8;} .cat-bills{background:#fef3c7;color:#d97706;}
        .cat-expenses{background:#ffe4e6;color:#e11d48;} .cat-savings{background:#d1fae5;color:#059669;} .cat-debt{background:#f3e8ff;color:#7c3aed;}
        .bp-del{background:none;border:none;color:#94a3b8;cursor:pointer;padding:3px;border-radius:5px;transition:color .15s,background .15s;display:inline-flex;align-items:center;justify-content:center;}
        .bp-del:hover{color:#dc2626;background:#fef2f2;}
        .bp-del-c{margin:0 auto;}
        .bp-ov{position:fixed;inset:0;background:rgba(0,0,0,0.42);z-index:200;display:flex;align-items:center;justify-content:center;padding:20px;}
        .bp-modal{background:#fff;border-radius:20px;padding:28px;width:100%;max-width:420px;max-height:82vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.22);}
        .bp-modal-ttl{font-size:1rem;font-weight:800;color:#0f172a;margin-bottom:18px;}
        .bp-fld{margin-bottom:13px;}
        .bp-lbl{display:block;font-size:0.7rem;font-weight:700;color:#374151;margin-bottom:4px;text-transform:uppercase;letter-spacing:.04em;}
        .bp-inp{width:100%;padding:10px 13px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:0.875rem;color:#0f172a;font-family:inherit;background:#f8faff;outline:none;transition:border-color .2s,box-shadow .2s;}
        .bp-inp:focus{border-color:#1d4ed8;box-shadow:0 0 0 3px rgba(29,78,216,0.1);background:#fff;}
        .bp-modal-acts{display:flex;gap:10px;margin-top:18px;}
        .bp-save{flex:1;padding:11px;border-radius:10px;border:none;background:linear-gradient(135deg,#1d4ed8,#3b6ef5);color:#fff;font-weight:700;cursor:pointer;font-family:inherit;box-shadow:0 4px 14px rgba(29,78,216,0.3);}
        .bp-cancel{padding:11px 18px;border-radius:10px;border:1.5px solid #e2e8f0;background:#fff;color:#64748b;font-weight:600;cursor:pointer;font-family:inherit;}
        .bp-form-err{font-size:0.75rem;color:#dc2626;margin-bottom:10px;}
        .bp-empty{text-align:center;padding:32px;color:#94a3b8;font-size:0.82rem;}
        .bp-loading{text-align:center;padding:60px;color:#94a3b8;}
        .bp-gt-charts{display:grid;grid-template-columns:1fr 1fr;gap:0;margin-bottom:10px;border-bottom:1px solid #f1f5f9;}
        @media(max-width:1100px){
          .bp-charts{grid-template-columns:1fr 1fr;}
        }
        @media(max-width:900px){
          .bp-cards{grid-template-columns:1fr 1fr;}
          .bp-charts,.bp-trackers,.bp-gt-charts{grid-template-columns:1fr;}
          .bp-body{padding:10px 0 24px;}
          .bp-hd{padding:12px 14px 0;}
          .bp-tabs-bar{padding:0 8px;}
          .bp-tab{padding:11px 14px;}
        }
        @media(max-width:640px){
          .bp-cards{grid-template-columns:1fr 1fr;}
          .bp-hd-top{flex-direction:column;align-items:flex-start;gap:10px;}
          .bp-month-nav{align-self:flex-end;}
          .bp-page-nav{flex-wrap:wrap;gap:6px;}
          .bp-tabs-bar{gap:6px;overflow-x:auto;flex-wrap:nowrap;padding-bottom:4px;}
          .bp-tab{padding:8px 12px;font-size:0.75rem;white-space:nowrap;}
          .bp-card{padding:12px 14px;}
          .bp-card-val{font-size:1.1rem;}
          .bp-chart-card{padding:14px 12px;}
          .bp-section{margin:0 0 10px;}
          .bp-modal{padding:20px 16px;}
          .bp-donut-row{flex-direction:column;align-items:center;gap:12px;}
        }
        @media(max-width:640px){
          .bp-section{overflow-x:auto;}
          .bp-tbl th,.bp-tbl td{padding:7px 10px;font-size:0.75rem;}
          .bp-tbl th{font-size:0.62rem;}
          .bp-mn-label{min-width:100px;font-size:0.78rem;}
        }
        @media(max-width:420px){
          .bp-cards{grid-template-columns:1fr;}
          .bp-page-nav .bp-page-link,.bp-page-nav .bp-page-title{padding:6px 12px;font-size:0.78rem;}
          .bp-modal{padding:16px 12px;max-height:calc(100dvh - 24px);}
          .bp-tabs-bar{gap:4px;}
          .bp-tab{padding:7px 10px;font-size:0.72rem;}
          .bp-hd{padding:10px 10px 0;}
          .bp-card-val{font-size:1rem;}
          .bp-card{padding:10px 12px;}
          .bp-sec-hd{flex-wrap:wrap;gap:6px;}
          .bp-icon-btn{width:26px;height:26px;font-size:1rem;}
          .bp-mn-btn{padding:4px 8px;font-size:0.78rem;}
        }
      `}</style>

      <div className="bp">
        <div className="bp-hd">
         <div className="bp-inner">
          <div className="bp-hd-top">
            <div className="bp-page-nav">
              <div className="bp-page-title">Personal Finance</div>
              <a href="/insights" className="bp-page-link">Insights</a>
            </div>
            {(tab==="budget") && (
              <div className="bp-month-nav">
                <button className="bp-mn-btn" onClick={prevMonth}>&#8249;</button>
                <div className="bp-mn-label">{monthLabel(month)}</div>
                <button className="bp-mn-btn" onClick={nextMonth} disabled={isCurrentMonth} style={{opacity:isCurrentMonth?0.3:1,cursor:isCurrentMonth?"not-allowed":"pointer"}}>&#8250;</button>
              </div>
            )}
          </div>
         </div>
        </div>

        <div className="bp-body">
         <div className="bp-inner">
          {loading && <div className="bp-loading">Loading...</div>}

          {/* BUDGET TAB */}
          {!loading && tab==="budget" && (
            <>
              <div className="bp-cards">
                <div className="bp-card" style={{borderTop:"3px solid #059669"}}>
                  <div className="bp-card-lbl">Income</div>
                  <div className="bp-card-val c-blue">{fmt(incomeActual)}</div>
                  <div className="bp-card-sub">Logged this month</div>
                </div>
                <div className="bp-card" style={{borderTop:"3px solid #dc2626"}}>
                  <div className="bp-card-lbl">Total Spent</div>
                  <div className="bp-card-val c-red">{fmt(totalOut)}</div>
                  <div className="bp-card-sub">Month outflows</div>
                </div>
                <div className="bp-card" style={{borderTop:`3px solid ${(summary?.total_left??0)>=0?"#059669":"#dc2626"}`}}>
                  <div className="bp-card-lbl">Remaining</div>
                  <div className={`bp-card-val ${(summary?.total_left??0)>=0?"c-green":"c-red"}`}>{fmt(summary?.total_left??0)}</div>
                  <div className="bp-card-sub">Net balance</div>
                </div>
                <div className="bp-card" style={{borderTop:"3px solid #1d4ed8"}}>
                  <div className="bp-card-lbl">Transactions</div>
                  <div className="bp-card-val c-blue">{txs.length}</div>
                  <div className="bp-card-sub">Logged this month</div>
                </div>
              </div>

              <div className="bp-charts">
                <div className="bp-chart-card" style={{background:"#eff6ff",borderTop:"3px solid #1d4ed8"}}>
                  <div className="bp-chart-ttl">Amount Left to Spend</div>
                  <div className="bp-chart-inner">
                    <div className="bp-donut-row">
                      <DonutChart spent={totalOut} total={incomeActual} size={140}/>
                      <div className="bp-legend">
                        <div className="bp-leg-item"><div className="bp-leg-dot" style={{background:"#1d4ed8"}}/><span>Spent - {fmt(totalOut)}</span></div>
                        <div className="bp-leg-item"><div className="bp-leg-dot" style={{background:"#dbeafe"}}/><span>Left - {fmt(Math.max(summary?.total_left??0,0))}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bp-chart-card" style={{background:"#faf5ff",borderTop:"3px solid #7c3aed"}}>
                  <div className="bp-chart-ttl">Allocation Summary</div>
                  <div className="bp-chart-inner">
                    <div className="bp-donut-row">
                      <AllocationDonut rows={summary?.rows??[]} size={130}/>
                      <div className="bp-legend">
                        {summary?.rows.filter(r=>r.category!=="income"&&r.category!=="debt").map((r)=>(
                          <div key={r.category} className="bp-leg-item">
                            <div className="bp-leg-dot" style={{background:CAT_COLOR[r.category]}}/>
                            <span>{CAT_LABEL[r.category]} {totalOut>0?Math.round(r.actual/totalOut*100):0}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bp-chart-card" style={{background:"#fff7ed",borderTop:"3px solid #f59e0b"}}>
                  <div className="bp-chart-ttl">Spending by Category</div>
                  <div className="bp-chart-inner" style={{width:"100%"}}>
                    <SpendingBar rows={summary?.rows??[]}/>
                  </div>
                </div>
              </div>


              <div className="bp-trackers">
                {TRACKER_CATS.map(cat=>{
                  const ct=txs.filter(t=>t.category===cat);
                  const ta=ct.reduce((s,t)=>s+t.amount,0);
                  return (
                    <div key={cat} className="bp-section">
                      <div className="bp-sec-hd">
                        <h3>{CAT_LABEL[cat]} Tracker</h3>
                        <button className="bp-icon-btn" title={isFutureMonth?"Cannot add to a future month":"Add Transaction"} disabled={isFutureMonth} onClick={()=>{if(isFutureMonth)return;setTxForm(f=>({...f,date:defaultTxDate,category:cat,subcategory:""}));setTxCatLocked(true);setShowTxModal(true);}} style={{opacity:isFutureMonth?0.35:1,cursor:isFutureMonth?"not-allowed":"pointer"}}>+</button>
                      </div>
                      <table className="bp-tbl">
                      <colgroup><col style={{width:"20%"}}/><col style={{width:"20%"}}/><col style={{width:"20%"}}/><col style={{width:"20%"}}/><col style={{width:"20%"}}/></colgroup>
                        <thead>
                          <tr>
                            <th style={{textAlign:"left"}}>Category</th>
                            <th style={{textAlign:"right"}}>Amount</th>
                            <th style={{textAlign:"center"}}>Edit</th>
                            <th style={{textAlign:"center"}}>Delete</th>
                            <th style={{textAlign:"left"}}>Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ct.length===0
                            ? <tr><td colSpan={5} style={{textAlign:"center",color:"#94a3b8",padding:"20px",fontWeight:400}}>No transactions yet.</td></tr>
                            : ct.map(t=>(
                                  <tr key={t.id}>
                                    <td style={{textAlign:"left"}}>{t.subcategory}</td>
                                    <td style={{textAlign:"right",fontWeight:600}}>{fmt(t.amount)}</td>
                                    <td style={{textAlign:"center"}}>
                                      <button className="bp-del bp-del-c" title="Edit" onClick={()=>openEditTx(t)}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                      </button>
                                    </td>
                                    <td style={{textAlign:"center"}}>
                                      <button className="bp-del bp-del-c" title="Delete" style={{color:"#dc2626"}} onClick={()=>{if(confirm("Delete this transaction?"))deleteTx(t.id);}}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                                      </button>
                                    </td>
                                    <td style={{textAlign:"left",color:"#64748b",fontSize:"0.78rem"}}>{t.notes??<span style={{color:"#cbd5e1"}}>—</span>}</td>
                                  </tr>
                              ))
                          }
                          {ct.length>0 && (
                            <tr className="bp-tbl-total">
                              <td style={{textAlign:"left"}}>Total</td>
                              <td style={{textAlign:"right"}}>{fmt(ta)}</td>
                              <td></td><td></td><td></td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  );
                })}

              </div>

              {/* Transaction Tracker — full width, auto-populated */}
              <div className="bp-section">
                <div className="bp-sec-hd">
                  <h3>Transaction Tracker</h3>
                </div>
                {txs.length===0
                  ? <div className="bp-empty">No transactions this month.</div>
                  : <div style={{maxHeight:"280px",overflowY:"auto"}}>
                    <table className="bp-tbl">
                      <thead>
                        <tr>
                          <th style={{textAlign:"left"}}>Category</th>
                          <th style={{textAlign:"left"}}>Subcategory</th>
                          <th style={{textAlign:"right"}}>Amount</th>
                          <th style={{textAlign:"center"}}>Status</th>
                          <th style={{textAlign:"center"}}>Date</th>
                          <th style={{textAlign:"center"}}>Time</th>
                        </tr>
                      </thead>
                      <tbody>

                        {txs.map(t=>{
                          const isUpdated = !!t.updated_at;
                          const ts = t.updated_at ?? t.created_at;
                          return (
                            <tr key={t.id}>
                              <td style={{textAlign:"left"}}><span className={`bp-badge cat-${t.category}`}>{CAT_LABEL[t.category]}</span></td>
                              <td style={{textAlign:"left"}}>{t.subcategory}</td>
                              <td style={{textAlign:"right",fontWeight:600}}>{fmt(t.amount)}</td>
                              <td style={{textAlign:"center"}}>
                                <span style={{display:"inline-block",padding:"2px 8px",borderRadius:"999px",fontSize:"0.65rem",fontWeight:700,background:isUpdated?"#fef3c7":"#d1fae5",color:isUpdated?"#d97706":"#059669"}}>
                                  {isUpdated?"Updated":"Added"}
                                </span>
                              </td>
                              <td style={{textAlign:"center",color:"#64748b"}}>{fmtDate(t.tx_date)}</td>
                              <td style={{textAlign:"center",color:"#64748b",whiteSpace:"nowrap"}}>{fmtTime(ts)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                }
              </div>
            </>
          )}

          {/* GOAL TRACKER TAB */}
          {!loading && tab==="goal-tracker" && (
            <>
              <div className="bp-cards">
                <div className="bp-card">
                  <div className="bp-card-lbl">Total Goal Amount</div>
                  <div className="bp-card-val c-blue">{fmt(totalGoal)}</div>
                </div>
                <div className="bp-card">
                  <div className="bp-card-lbl">Total Starting Amount</div>
                  <div className="bp-card-val c-blue">{fmt(goals.reduce((s,g)=>s+g.starting_amount,0))}</div>
                </div>
                <div className="bp-card">
                  <div className="bp-card-lbl">Total Saved</div>
                  <div className="bp-card-val c-green">{fmt(totalSaved)}</div>
                </div>
                <div className="bp-card">
                  <div className="bp-card-lbl">Number of Goals</div>
                  <div className="bp-card-val c-blue">{goals.length}</div>
                </div>
              </div>

              <div className="bp-gt-charts">
                <div className="bp-chart-card">
                  <div className="bp-chart-ttl">Goals Distribution</div>
                  {goals.length===0
                    ? <div className="bp-empty">No goals yet.</div>
                    : <div className="bp-donut-row">
                        <GoalDonut goals={goals} size={160}/>
                        <div className="bp-legend">
                          {goals.map((g,i)=>(
                            <div key={g.id} className="bp-leg-item">
                              <div className="bp-leg-dot" style={{background:GOAL_COLORS[i%GOAL_COLORS.length]}}/>
                              <span>{g.name} -- {totalGoal>0?Math.round(g.goal_amount/totalGoal*100):0}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                  }
                </div>
                <div className="bp-chart-card">
                  <div className="bp-chart-ttl">Monthly Contribution Targets</div>
                  {goals.length===0
                    ? <div className="bp-empty">No goals yet.</div>
                    : <div className="bp-bar-chart">
                        {goals.map((g,i)=>{
                          const max=Math.max(...goals.map(x=>x.monthly_target))||1;
                          return (
                            <div key={g.id} className="bp-bc-row">
                              <div className="bp-bc-lbl">{g.name}</div>
                              <div className="bp-bc-track"><div className="bp-bc-fill" style={{width:`${g.monthly_target/max*100}%`,background:GOAL_COLORS[i%GOAL_COLORS.length]}}/></div>
                              <div className="bp-bc-val">{fmt(g.monthly_target)}</div>
                            </div>
                          );
                        })}
                      </div>
                  }
                </div>
              </div>
            </>
          )}

          {/* GOAL LEDGER TAB */}
          {!loading && tab==="goal-ledger" && (
            <div className="bp-section">
              <div className="bp-sec-hd">
                <h3>Goal Ledger</h3>
                <button className="bp-icon-btn" onClick={()=>{setFormErr("");setShowGoalModal(true);}}>+</button>
              </div>
              {goals.length===0
                ? <div className="bp-empty">No goals yet. Click + to add one.</div>
                : <table className="bp-tbl">
                    <thead>
                      <tr>
                        <th style={{textAlign:"left"}}>Goal</th><th style={{textAlign:"left"}}>Start</th><th style={{textAlign:"left"}}>Target Date</th>
                        <th>Goal Amount</th><th>Starting Amount</th><th>Monthly Target</th><th>Progress</th><th>%</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {goals.map(g=>(
                        <tr key={g.id}>
                          <td style={{fontWeight:700,textAlign:"left"}}>{g.name}</td>
                          <td style={{textAlign:"left"}}>{g.start_date}</td>
                          <td style={{textAlign:"left"}}>{g.goal_date}</td>
                          <td>{fmt(g.goal_amount)}</td>
                          <td>{fmt(g.starting_amount)}</td>
                          <td>{fmt(g.monthly_target)}</td>
                          <td><div className="bp-prog-track"><div className="bp-prog-fill" style={{width:`${g.progress_pct}%`}}/></div></td>
                          <td className="c-blue">{g.progress_pct}%</td>
                          <td><button className="bp-del" onClick={()=>deleteGoal(g.id)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg></button></td>
                        </tr>
                      ))}
                      <tr className="bp-tbl-total">
                        <td colSpan={3}>Total</td>
                        <td>{fmt(totalGoal)}</td>
                        <td>{fmt(goals.reduce((s,g)=>s+g.starting_amount,0))}</td>
                        <td>{fmt(goals.reduce((s,g)=>s+g.monthly_target,0))}</td>
                        <td><div className="bp-prog-track"><div className="bp-prog-fill" style={{width:`${totalGoal>0?Math.round(totalSaved/totalGoal*100):0}%`}}/></div></td>
                        <td className="c-blue">{totalGoal>0?Math.round(totalSaved/totalGoal*100):0}%</td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
              }
            </div>
          )}

          {/* GOAL DASHBOARD TAB */}
          {!loading && tab==="goal-dashboard" && (
            <>
              <div className="bp-gd-summary">
                <div className="bp-gd-sublbl">Total Saved vs Total Savings Goal</div>
                <div className="bp-gd-numbers">{fmt(totalSaved)} / {fmt(totalGoal)}</div>
                <div className="bp-gd-pct">{totalGoal>0?((totalSaved/totalGoal)*100).toFixed(2):0}%</div>
              </div>

              <div className="bp-section">
                <div className="bp-sec-hd">
                  <h3>Goal Ledger - Contributions</h3>
                  <button className="bp-icon-btn" onClick={()=>{setFormErr("");setEntryForm(f=>({...f,entry_date:today}));setShowEntryModal(true);}}>+</button>
                </div>
                {goalEntries.length===0
                  ? <div className="bp-empty">No contributions yet. Click + to log one.</div>
                  : <table className="bp-tbl">
                      <thead><tr><th style={{textAlign:"left"}}>Date</th><th style={{textAlign:"left"}}>Goal</th><th>Amount</th><th style={{textAlign:"left"}}>Notes</th><th></th></tr></thead>
                      <tbody>
                        {goalEntries.map(e=>(
                          <tr key={e.id}>
                            <td style={{textAlign:"left"}}>{e.entry_date}</td>
                            <td style={{textAlign:"left",fontWeight:600}}>{e.goal_name}</td>
                            <td>{fmt(e.amount)}</td>
                            <td style={{textAlign:"left",color:"#94a3b8"}}>{e.notes??"--"}</td>
                            <td><button className="bp-del" onClick={()=>deleteEntry(e.id)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg></button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                }
              </div>
            </>
          )}
         </div>
        </div>

        {/* Add Transaction Modal */}
        {showTxModal && (
          <div className="bp-ov" onClick={e=>e.target===e.currentTarget&&setShowTxModal(false)}>
            <div className="bp-modal">
              <div className="bp-modal-ttl">Add Transaction</div>
              {formErr&&<div className="bp-form-err">{formErr}</div>}
              <form onSubmit={handleAddTx}>
                <div className="bp-fld"><label className="bp-lbl">Date</label><input className="bp-inp" type="date" min={monthMin} max={monthMax} value={txForm.date} onChange={e=>setTxForm(f=>({...f,date:e.target.value}))}/></div>
                <div className="bp-fld"><label className="bp-lbl">Amount (Rs)</label><input className="bp-inp" type="text" inputMode="decimal" placeholder="0.00" value={txForm.amount} onChange={e=>setTxForm(f=>({...f,amount:numOnly(e.target.value)}))} onKeyDown={numKeyDown}/></div>
                {txCatLocked
                  ? <div className="bp-fld"><label className="bp-lbl">Category</label><div className="bp-inp" style={{color:"#1d4ed8",fontWeight:700,background:"#eff6ff",borderColor:"#bfdbfe"}}>{CAT_LABEL[txForm.category]}</div></div>
                  : <div className="bp-fld"><label className="bp-lbl">Category</label>
                      <select className="bp-inp" value={txForm.category} onChange={e=>setTxForm(f=>({...f,category:e.target.value as Category,subcategory:""}))}>
                        {(["income","bills","expenses","savings","debt"] as Category[]).map(c=><option key={c} value={c}>{CAT_LABEL[c]}</option>)}
                      </select>
                    </div>
                }
                <div className="bp-fld"><label className="bp-lbl">Subcategory</label>
                  <select className="bp-inp" value={txForm.subcategory} onChange={e=>setTxForm(f=>({...f,subcategory:e.target.value}))}>
                    <option value="">Select...</option>
                    {DEFAULTS[txForm.category].map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="bp-fld"><label className="bp-lbl">Notes (optional)</label><input className="bp-inp" type="text" placeholder="e.g. Monthly rent" value={txForm.notes} onChange={e=>setTxForm(f=>({...f,notes:e.target.value}))}/></div>
                <div className="bp-modal-acts">
                  <button type="button" className="bp-cancel" onClick={()=>setShowTxModal(false)}>Cancel</button>
                  <button type="submit" className="bp-save">Add Transaction</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Goal Modal */}
        {showGoalModal && (
          <div className="bp-ov" onClick={e=>e.target===e.currentTarget&&setShowGoalModal(false)}>
            <div className="bp-modal">
              <div className="bp-modal-ttl">Add New Goal</div>
              {formErr&&<div className="bp-form-err">{formErr}</div>}
              <form onSubmit={handleAddGoal}>
                <div className="bp-fld"><label className="bp-lbl">Goal Name</label><input className="bp-inp" type="text" placeholder="e.g. Emergency Fund" value={goalForm.name} onChange={e=>setGoalForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="bp-fld"><label className="bp-lbl">Start Date</label><input className="bp-inp" type="date" value={goalForm.start_date} onChange={e=>setGoalForm(f=>({...f,start_date:e.target.value}))}/></div>
                <div className="bp-fld"><label className="bp-lbl">Target Date</label><input className="bp-inp" type="date" value={goalForm.goal_date} onChange={e=>setGoalForm(f=>({...f,goal_date:e.target.value}))}/></div>
                <div className="bp-fld"><label className="bp-lbl">Goal Amount (Rs)</label><input className="bp-inp" type="text" inputMode="decimal" placeholder="0.00" value={goalForm.goal_amount} onChange={e=>setGoalForm(f=>({...f,goal_amount:numOnly(e.target.value)}))} onKeyDown={numKeyDown}/></div>
                <div className="bp-fld"><label className="bp-lbl">Starting Amount (Rs)</label><input className="bp-inp" type="text" inputMode="decimal" placeholder="0.00" value={goalForm.starting_amount} onChange={e=>setGoalForm(f=>({...f,starting_amount:numOnly(e.target.value)}))} onKeyDown={numKeyDown}/></div>
                <div className="bp-modal-acts">
                  <button type="button" className="bp-cancel" onClick={()=>setShowGoalModal(false)}>Cancel</button>
                  <button type="submit" className="bp-save">Add Goal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Transaction Modal */}
        {editTx && (
          <div className="bp-ov" onClick={e=>e.target===e.currentTarget&&setEditTx(null)}>
            <div className="bp-modal">
              <div className="bp-modal-ttl">Edit Transaction</div>
              {formErr&&<div className="bp-form-err">{formErr}</div>}
              <form onSubmit={handleEditTxSave}>
                <div className="bp-fld"><label className="bp-lbl">Date</label><input className="bp-inp" type="date" min={monthMin} max={monthMax} value={editTxForm.date} onChange={e=>setEditTxForm(f=>({...f,date:e.target.value}))}/></div>
                <div className="bp-fld"><label className="bp-lbl">Amount (Rs)</label><input className="bp-inp" type="text" inputMode="decimal" placeholder="0.00" value={editTxForm.amount} onChange={e=>setEditTxForm(f=>({...f,amount:numOnly(e.target.value)}))} onKeyDown={numKeyDown}/></div>
                <div className="bp-fld"><label className="bp-lbl">Notes (optional)</label><input className="bp-inp" type="text" value={editTxForm.notes} onChange={e=>setEditTxForm(f=>({...f,notes:e.target.value}))}/></div>
                <div style={{fontSize:"0.72rem",color:"#94a3b8",marginBottom:"10px"}}>Category and subcategory cannot be changed. Delete and re-add if needed.</div>
                <div className="bp-modal-acts">
                  <button type="button" className="bp-cancel" onClick={()=>setEditTx(null)}>Cancel</button>
                  <button type="submit" className="bp-save">Save Changes</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Goal Entry Modal */}
        {showEntryModal && (
          <div className="bp-ov" onClick={e=>e.target===e.currentTarget&&setShowEntryModal(false)}>
            <div className="bp-modal">
              <div className="bp-modal-ttl">Log Contribution</div>
              {formErr&&<div className="bp-form-err">{formErr}</div>}
              <form onSubmit={handleAddEntry}>
                <div className="bp-fld"><label className="bp-lbl">Goal</label>
                  <select className="bp-inp" value={entryForm.goal_id} onChange={e=>setEntryForm(f=>({...f,goal_id:e.target.value}))}>
                    <option value="">Select goal...</option>
                    {goals.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
                <div className="bp-fld"><label className="bp-lbl">Date</label><input className="bp-inp" type="date" min={monthMin} max={monthMax} value={entryForm.entry_date} onChange={e=>setEntryForm(f=>({...f,entry_date:e.target.value}))}/></div>
                <div className="bp-fld"><label className="bp-lbl">Amount (Rs)</label><input className="bp-inp" type="text" inputMode="decimal" placeholder="0.00" value={entryForm.amount} onChange={e=>setEntryForm(f=>({...f,amount:numOnly(e.target.value)}))} onKeyDown={numKeyDown}/></div>
                <div className="bp-fld"><label className="bp-lbl">Notes (optional)</label><input className="bp-inp" type="text" placeholder="e.g. Monthly contribution" value={entryForm.notes} onChange={e=>setEntryForm(f=>({...f,notes:e.target.value}))}/></div>
                <div className="bp-modal-acts">
                  <button type="button" className="bp-cancel" onClick={()=>setShowEntryModal(false)}>Cancel</button>
                  <button type="submit" className="bp-save">Log Contribution</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
