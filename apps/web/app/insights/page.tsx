"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuthGuard } from "@/lib/use-auth-guard";
import { getStoredUsername } from "@/lib/profile";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BASE = `${API}/api/v1/budget`;

type Category = "income" | "bills" | "expenses" | "savings" | "debt";
interface Tx { id: string; tx_date: string; amount: number; category: Category; subcategory: string; notes: string | null; created_at: string | null; updated_at: string | null; }
interface SummaryRow { category: Category; budget: number; actual: number; left: number; }
interface Summary { month: string; rows: SummaryRow[]; total_left: number; }

const CAT_LABEL: Record<Category, string> = { income:"Income", bills:"Bills", expenses:"Expenses", savings:"Savings", debt:"Debt" };
const CAT_COLOR: Record<Category, string> = { income:"#059669", bills:"#f59e0b", expenses:"#ef4444", savings:"#3b82f6", debt:"#8b5cf6" };

function currentMonth() { return new Date().toISOString().slice(0,7); }
function monthLabel(m: string) { const [y,mo]=m.split("-"); return new Date(+y,+mo-1).toLocaleString("en",{month:"long",year:"numeric"}); }
function fmt(n: number) { return n.toLocaleString("en-PK",{minimumFractionDigits:2,maximumFractionDigits:2}); }

export default function InsightsPage() {
  useAuthGuard();
  const username = getStoredUsername() ?? "";
  const [month, setMonth] = useState(currentMonth());
  const [txs, setTxs] = useState<Tx[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    try {
      const [t, s] = await Promise.all([
        fetch(`${BASE}/transactions?username=${username}&month=${month}`).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch(`${BASE}/summary/${month}?username=${username}`).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);
      setTxs(Array.isArray(t) ? t : []);
      setSummary(s?.month ? s : null);
    } finally { setLoading(false); }
  }, [username, month]);

  useEffect(() => { load(); }, [load]);

  function prevMonthNav() { const d = new Date(month + "-01"); d.setMonth(d.getMonth() - 1); setMonth(d.toISOString().slice(0,7)); }
  function nextMonthNav() { const d = new Date(month + "-01"); d.setMonth(d.getMonth() + 1); setMonth(d.toISOString().slice(0,7)); }
  const isCurrentMonth = month >= currentMonth();

  const income = summary?.rows.find(r => r.category === "income")?.actual ?? txs.filter(x => x.category === "income").reduce((a,x) => a+x.amount, 0);
  const catTotals = summary?.rows.filter(r => r.category !== "income") ?? [];
  const totalOut = catTotals.reduce((s, r) => s + r.actual, 0);

  const spendMap: Record<string, { amount: number; category: Category }> = {};
  txs.filter(t => t.category !== "income").forEach(t => {
    if (!spendMap[t.subcategory]) spendMap[t.subcategory] = { amount: 0, category: t.category };
    spendMap[t.subcategory].amount += t.amount;
  });
  const topSpend = Object.entries(spendMap).sort((a,b) => b[1].amount - a[1].amount).slice(0, 8);
  const maxSpend = topSpend[0]?.[1].amount || 1;

  const dayMap: Record<string, number> = {};
  txs.filter(t => t.category !== "income").forEach(t => { const d = t.tx_date.slice(8); dayMap[d] = (dayMap[d] ?? 0) + t.amount; });
  const days = Object.entries(dayMap).sort((a,b) => a[0].localeCompare(b[0]));
  const maxDay = Math.max(...days.map(d => d[1]), 1);

  return (
    <>
      <style>{`
        .in { background: #f1f5f9; min-height: 100vh; font-family: "Inter", system-ui, sans-serif; }
        .in-inner { width: 100%; max-width: 1280px; margin: 0 auto; }
        .in-hd { background: #f1f5f9; padding: 16px 20px 12px; }
        .in-hd-top { display: flex; align-items: center; justify-content: space-between; }
        .in-page-nav { display: flex; align-items: center; gap: 8px; }
        .in-page-link { display: inline-flex; align-items: center; padding: 7px 18px; border-radius: 9px; font-size: 0.9rem; font-weight: 800; letter-spacing: -0.01em; text-decoration: none; cursor: pointer; background: #fff; color: #1d4ed8; border: 1.5px solid #bfdbfe; box-shadow: 0 2px 8px rgba(29,78,216,0.08); transition: background .15s; }
        .in-page-link:hover { background: #eff6ff; }
        .in-page-title { display: inline-flex; align-items: center; padding: 7px 18px; background: linear-gradient(135deg,#1e3a8a,#3b6ef5); border-radius: 9px; font-size: 0.9rem; font-weight: 800; color: #fff; letter-spacing: -0.01em; box-shadow: 0 4px 14px rgba(29,78,216,0.25); }
        .in-month-nav { display: flex; align-items: center; gap: 8px; }
        .in-mn-btn { background: #fff; border: 1.5px solid #e2e8f0; border-radius: 8px; color: #1d4ed8; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 0.95rem; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
        .in-mn-btn:hover { background: #eff6ff; border-color: #1d4ed8; }
        .in-mn-label { font-size: 0.82rem; font-weight: 700; color: #1e3a8a; }
        .in-body { padding: 20px 20px 40px; }
        .in-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .in-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin-bottom: 16px; }
        .in-card { background: #fff; border-radius: 12px; padding: 18px 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); margin-bottom: 16px; }
        .in-card-title { font-size: 0.72rem; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 14px; }
        .in-stat { font-size: 1.5rem; font-weight: 800; color: #0c0f1a; margin-bottom: 2px; }
        .in-stat-label { font-size: 0.72rem; color: #94a3b8; }
        .in-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 9px; }
        .in-bar-label { font-size: 0.72rem; color: #334155; font-weight: 600; width: 90px; flex-shrink: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .in-bar-track { flex: 1; background: #f1f5f9; border-radius: 999px; height: 8px; overflow: hidden; }
        .in-bar-fill { height: 100%; border-radius: 999px; transition: width .5s ease; }
        .in-bar-val { font-size: 0.68rem; font-weight: 700; color: #475569; width: 70px; text-align: right; flex-shrink: 0; }
        .in-day-row { display: flex; align-items: flex-end; gap: 4px; height: 80px; }
        .in-day-col { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
        .in-day-bar { width: 100%; background: #3b6ef5; border-radius: 4px 4px 0 0; transition: height .4s ease; }
        .in-day-lbl { font-size: 0.5rem; color: #94a3b8; font-weight: 600; }
        .in-cat-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .in-cat-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .in-cat-name { font-size: 0.72rem; font-weight: 600; color: #334155; flex: 1; }
        .in-cat-pct { font-size: 0.68rem; font-weight: 700; color: #64748b; }
        .in-loading { padding: 60px 20px; text-align: center; color: #94a3b8; font-size: 0.9rem; }
        .in-empty { text-align: center; color: #94a3b8; font-size: 0.82rem; padding: 24px 0; }
        @media (max-width: 768px) {
          .in-grid { grid-template-columns: 1fr; }
          .in-grid-3 { grid-template-columns: 1fr; }
          .in-hd-top { flex-direction: column; gap: 10px; align-items: flex-start; }
          .in-month-nav { align-self: flex-end; }
          .in-body { padding: 14px 12px 32px; }
          .in-hd { padding: 12px 14px 10px; }
        }
        @media (max-width: 480px) {
          .in-bar-label { width: 70px; font-size: 0.68rem; }
          .in-bar-val { width: 56px; font-size: 0.65rem; }
          .in-card { padding: 14px 12px; }
        }
      `}</style>

      <div className="in">
        <div className="in-hd">
          <div className="in-inner">
            <div className="in-hd-top">
              <div className="in-page-nav">
                <a href="/individual" className="in-page-link">Personal Finance</a>
                <div className="in-page-title">Insights</div>
              </div>
              <div className="in-month-nav">
                <button className="in-mn-btn" onClick={prevMonthNav}>&#8249;</button>
                <div className="in-mn-label">{monthLabel(month)}</div>
                <button className="in-mn-btn" onClick={nextMonthNav} disabled={isCurrentMonth} style={{opacity:isCurrentMonth?0.3:1,cursor:isCurrentMonth?"not-allowed":"pointer"}}>&#8250;</button>
              </div>
            </div>
          </div>
        </div>

        <div className="in-body">
          <div className="in-inner">
            {loading ? <div className="in-loading">Loading insights...</div> : (
              <>
                <div className="in-grid-3">
                  <div className="in-card" style={{borderTop:"3px solid #059669",marginBottom:0}}>
                    <div className="in-card-title">Total Income</div>
                    <div className="in-stat" style={{color:"#059669"}}>Rs {fmt(income)}</div>
                    <div className="in-stat-label">this month</div>
                  </div>
                  <div className="in-card" style={{borderTop:"3px solid #ef4444",marginBottom:0}}>
                    <div className="in-card-title">Total Spent</div>
                    <div className="in-stat" style={{color:"#ef4444"}}>Rs {fmt(totalOut)}</div>
                    <div className="in-stat-label">across all categories</div>
                  </div>
                  <div className="in-card" style={{borderTop:`3px solid ${income-totalOut>=0?"#059669":"#ef4444"}`,marginBottom:0}}>
                    <div className="in-card-title">Net Savings</div>
                    <div className="in-stat" style={{color:income-totalOut>=0?"#059669":"#ef4444"}}>Rs {fmt(income-totalOut)}</div>
                    <div className="in-stat-label">{income>0?`${Math.round((income-totalOut)/income*100)}% of income`:"—"}</div>
                  </div>
                </div>

                <div style={{height:16}}/>

                <div className="in-grid">
                  <div className="in-card" style={{marginBottom:0}}>
                    <div className="in-card-title">Top Spending Items</div>
                    {topSpend.length===0 ? <div className="in-empty">No spending data</div>
                      : topSpend.map(([name,{amount,category}])=>(
                        <div key={name} className="in-bar-row">
                          <div className="in-bar-label" title={name}>{name}</div>
                          <div className="in-bar-track"><div className="in-bar-fill" style={{width:`${(amount/maxSpend)*100}%`,background:CAT_COLOR[category]}}/></div>
                          <div className="in-bar-val">Rs {fmt(amount)}</div>
                        </div>
                      ))
                    }
                  </div>
                  <div className="in-card" style={{marginBottom:0}}>
                    <div className="in-card-title">Spending by Category</div>
                    {totalOut===0 ? <div className="in-empty">No spending data</div>
                      : catTotals.filter(r=>r.actual>0).map(r=>(
                        <div key={r.category}>
                          <div className="in-cat-row">
                            <div className="in-cat-dot" style={{background:CAT_COLOR[r.category]}}/>
                            <div className="in-cat-name">{CAT_LABEL[r.category]}</div>
                            <div className="in-cat-pct">{Math.round(r.actual/totalOut*100)}%</div>
                          </div>
                          <div style={{marginBottom:10,marginLeft:20}}>
                            <div className="in-bar-track" style={{height:6}}><div className="in-bar-fill" style={{width:`${(r.actual/totalOut)*100}%`,background:CAT_COLOR[r.category]}}/></div>
                            <div style={{fontSize:"0.65rem",color:"#94a3b8",marginTop:2}}>Rs {fmt(r.actual)}</div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>

                <div className="in-card" style={{marginBottom:0}}>
                  <div className="in-card-title">Daily Spending Trend</div>
                  {days.length===0 ? <div className="in-empty">No spending data</div>
                    : <div className="in-day-row">
                        {days.map(([day,amt])=>(
                          <div key={day} className="in-day-col">
                            <div className="in-day-bar" style={{height:`${Math.max((amt/maxDay)*72,4)}px`}} title={`Rs ${fmt(amt)}`}/>
                            <div className="in-day-lbl">{day}</div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
