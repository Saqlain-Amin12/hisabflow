import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How to Use HisabFlow",
  description: "Step-by-step guide to splitting bills, tracking shared expenses, and settling dues with HisabFlow. Learn how to create ledgers, add expenses, and view who owes what.",
  keywords: ["how to split bills", "expense tracking guide", "bill splitting tutorial", "HisabFlow guide"],
  openGraph: {
    title: "How to Use HisabFlow — Complete Guide",
    description: "Step-by-step guide to splitting bills and tracking shared expenses with HisabFlow.",
    type: "article",
  },
};

const steps = [
  {
    num: "01",
    title: "Create or Join a Team Ledger",
    desc: "Go to the Team page and click Create Ledger. Give it a name (e.g. \"Flat Expenses\"). Share the Ledger ID with your flatmates. They can join by clicking Join Ledger and entering the ID.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a7af5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    num: "02",
    title: "Add Expenses (Entries)",
    desc: "Click + Add Entry. Fill in the date, description (e.g. Biryani), total amount, and who paid. Each member's share count is set below: 0 means they didn't participate, 1 means one share, 2 means two shares. The app automatically splits the amount and distributes the remainder to the last person.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a7af5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
  },
  {
    num: "03",
    title: "View the Dues Table",
    desc: "Below the entries table you'll see the Dues Summary. It shows each member's Total Paid, Total Due, Pending amount, and Status. Green 'To Receive' means they paid more than their share. Red 'To Pay' means they owe money.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a7af5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
      </svg>
    ),
  },
  {
    num: "04",
    title: "Navigate Months",
    desc: "Use the ← → arrows to switch between months. Each month has its own entries and dues. When a month is over, click Close Month to lock it — no new entries can be added to a closed month.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a7af5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
  },
  {
    num: "05",
    title: "Download the Receipt",
    desc: "Click the ⬇ Receipt button to preview the Dues Summary as a clean, printable receipt. Hit Download Receipt to save it as an HTML file — open it in any browser to print or share as PDF.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a7af5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    ),
  },
  {
    num: "06",
    title: "Activity History",
    desc: "Every entry added or updated is logged in the Activity History section. It auto-updates whenever someone makes a change so the whole group stays in sync.",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4a7af5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
];

const faqs = [
  {
    q: "Can I have multiple ledgers?",
    a: "Yes. Create a separate ledger for each group: flat, office, trip, etc. Each ledger has its own members, entries, and dues.",
  },
  {
    q: "What if someone has a different share count?",
    a: "When adding an entry, set each person's share count. For example, if Ahmad brought a guest, set his count to 2. The app will give him double the share of the amount.",
  },
  {
    q: "How is the amount split exactly?",
    a: "The total is divided by total shares using whole-number arithmetic. Any remainder (1–2 Rs) is distributed to the last members, so the sum always equals the total exactly.",
  },
  {
    q: "What does 'Pending' mean in the dues table?",
    a: "Pending = Total Paid − Total Due. Positive means they overpaid (To Receive). Negative means they still owe (To Pay).",
  },
  {
    q: "Can I edit or delete an entry?",
    a: "Yes. Click the edit icon on any entry row. From there you can update the amount, description, date, or shares, or delete the entry entirely.",
  },
  {
    q: "What happens when I close a month?",
    a: "The month is locked and no new entries can be added to it. You can still view and download the receipt for that month.",
  },
];

export default function HowToUsePage() {
  return (
    <div style={{ minHeight: "80vh", background: "#f5f7ff", paddingBottom: 64 }}>
      <style>{`
        .htu-hero { padding: 56px 20px 48px; }
        .htu-hero h1 { font-size: 2rem; }
        .htu-wrap { max-width: 780px; margin: 0 auto; padding: 0 20px; }
        .htu-step { background: #fff; border-radius: 14px; border: 1.5px solid #e0e7ff; padding: 22px 24px; display: flex; gap: 20px; align-items: flex-start; }
        .htu-tbl-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; border-radius: 14px; border: 1.5px solid #e0e7ff; }
        @media (max-width: 640px) {
          .htu-hero { padding: 36px 16px 32px; }
          .htu-hero h1 { font-size: 1.5rem; }
          .htu-wrap { padding: 0 12px; }
          .htu-step { padding: 16px 14px; gap: 14px; }
        }
        @media (max-width: 420px) {
          .htu-hero h1 { font-size: 1.3rem; }
          .htu-step { flex-direction: column; gap: 10px; }
        }
      `}</style>

      {/* Hero */}
      <div className="htu-hero" style={{ background: "linear-gradient(135deg,#4a7af5,#3b6ce0)", textAlign: "center" }}>
        <h1 className="htu-hero-h1" style={{ color: "#fff", fontWeight: 800, margin: "0 0 12px", letterSpacing: "-0.02em" }}>
          How to Use HisabFlow
        </h1>
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "1rem", margin: "0 auto", maxWidth: 480 }}>
          A complete guide to managing shared expenses with the Team feature, from creating a ledger to settling dues.
        </p>
      </div>

      <div className="htu-wrap">

        {/* Steps */}
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4a7af5", textTransform: "uppercase", letterSpacing: ".08em", margin: "48px 0 24px" }}>
          Step-by-Step Guide
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {steps.map((s) => (
            <div key={s.num} className="htu-step">
              <div style={{ flexShrink: 0, width: 48, height: 48, borderRadius: 12, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {s.icon}
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#4a7af5", background: "#eef2ff", borderRadius: 6, padding: "2px 8px", letterSpacing: ".04em" }}>
                    STEP {s.num}
                  </span>
                  <h3 style={{ margin: 0, fontSize: "0.97rem", fontWeight: 700, color: "#0c0f1a" }}>{s.title}</h3>
                </div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#4b5563", lineHeight: 1.65 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dues explained */}
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4a7af5", textTransform: "uppercase", letterSpacing: ".08em", margin: "48px 0 20px" }}>
          Understanding the Dues Table
        </h2>
        <div className="htu-tbl-wrap">
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", minWidth: 420 }}>
            <thead>
              <tr style={{ background: "#f0f4ff" }}>
                {["Column", "What it means"].map((h) => (
                  <th key={h} style={{ padding: "11px 18px", textAlign: "left", fontWeight: 700, color: "#374151", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: ".05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["Total Paid", "Sum of all amounts this member paid across all entries in the month"],
                ["Total Due", "Their fair share of all group expenses based on their share counts"],
                ["Pending", "Total Paid − Total Due. Positive = overpaid (green), Negative = owes (red)"],
                ["Status", "'To Receive' if they paid more than owed. 'To Pay' if they owe money."],
              ].map(([col, desc]) => (
                <tr key={col} style={{ borderTop: "1px solid #f0f4ff" }}>
                  <td style={{ padding: "12px 18px", fontWeight: 700, color: "#0c0f1a", whiteSpace: "nowrap" }}>{col}</td>
                  <td style={{ padding: "12px 18px", color: "#4b5563" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* FAQ */}
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#4a7af5", textTransform: "uppercase", letterSpacing: ".08em", margin: "48px 0 20px" }}>
          Frequently Asked Questions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {faqs.map((f) => (
            <div key={f.q} style={{ background: "#fff", borderRadius: 12, border: "1.5px solid #e0e7ff", padding: "18px 22px" }}>
              <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#0c0f1a", fontSize: "0.92rem" }}>Q: {f.q}</p>
              <p style={{ margin: 0, color: "#4b5563", fontSize: "0.87rem", lineHeight: 1.65 }}>{f.a}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ marginTop: 48, textAlign: "center" }}>
          <Link href="/team" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "13px 32px", background: "#4a7af5", color: "#fff",
            borderRadius: 999, fontWeight: 700, fontSize: "0.95rem", textDecoration: "none",
          }}>
            Go to Team Ledger
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </Link>
        </div>

      </div>
    </div>
  );
}
