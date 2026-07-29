import type { Metadata } from "next";
import Link from "next/link";
import { LpMobileMenu } from "@/components/navigation/lp-mobile-menu";
import { AuthRedirect } from "@/components/auth-redirect";
import { ContactSection } from "@/components/contact-section";

export const metadata: Metadata = {
  title: "HisabFlow — Split Bills, Settle Debts Instantly",
  description:
    "HisabFlow makes it effortless to track shared expenses, split bills fairly, and settle debts with your friends, flatmates, and travel groups in Pakistan. Free to use, no card required.",
  keywords: [
    "bill splitting app Pakistan", "expense tracker Pakistan", "split bills friends",
    "shared expense manager", "hisab kitab app", "settle debts online",
    "group expense tracker", "roommate expenses PKR", "personal finance app Pakistan",
    "budget tracker free", "who owes who app", "travel expense splitter",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "HisabFlow — Split Bills, Settle Debts Instantly",
    description:
      "Track shared expenses, split bills fairly, and settle up with friends and flatmates. Free forever, no card required.",
    type: "website",
    locale: "en_PK",
    siteName: "HisabFlow",
  },
  twitter: {
    card: "summary_large_image",
    title: "HisabFlow — Split Bills, Settle Debts Instantly",
    description:
      "Track shared expenses, split bills fairly, and settle up with friends and flatmates. Free forever.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
};

export default function LandingPage() {
  return (
    <>
      <style>{`
        .lp {
          --blue: #4a7af5;
          --blue-dark: #1644c0;
          --blue-deep: #0b1e5e;
          --blue-light: #e8f0fe;
          --ink: #0f172a;
          --ink-soft: #475569;
          --ink-muted: #94a3b8;
          --line: #e2e8f0;
          --panel: #f8fafc;
          --white: #ffffff;
          --green: #059669;
          --coral: #f43f5e;
          font-family: "Inter", system-ui, sans-serif;
          color: var(--ink);
          background: linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #3b6ef5 100%);
          -webkit-font-smoothing: antialiased;
        }
        .lp *, .lp *::before, .lp *::after { box-sizing: border-box; }
        .lp a { text-decoration: none; color: inherit; }
        .lp ul { list-style: none; margin: 0; padding: 0; }
        .lp h1, .lp h2, .lp h3, .lp h4 { margin: 0; letter-spacing: -0.02em; }
        .lp p { margin: 0; }
        .lp img { max-width: 100%; }
        .lp .wrap { max-width: 1160px; margin: 0 auto; padding: 0 24px; }

        /* ── NAVBAR ── */
        .lp-nav {
          position: sticky; top: 0; z-index: 100;
          background: linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #3b6ef5 100%);
          border-bottom: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 4px 32px rgba(0,0,0,0.18);
        }
        .lp-nav-inner {
          display: flex; align-items: center;
          height: 68px; max-width: 1160px; margin: 0 auto; padding: 0 24px;
        }
        .lp-logo {
          display: flex; align-items: center;
          font-weight: 800; font-size: 1.25rem; color: #ffffff;
          letter-spacing: -0.02em; gap: 10px;
        }
        .lp-nav-links {
          flex: 1; display: flex; justify-content: center; align-items: center; gap: 2px;
        }
        .lp-nav-links a {
          font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.82);
          padding: 7px 26px; border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .lp-nav-links a:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .lp-nav-cta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
        .lp-nav-cta .lp-login {
          font-size: 0.875rem; font-weight: 500; color: rgba(255,255,255,0.88);
          padding: 7px 16px; border-radius: 8px;
          transition: background 0.15s, color 0.15s;
        }
        .lp-nav-cta .lp-login:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .lp-nav-cta .lp-signup {
          font-size: 0.875rem; font-weight: 700; color: #1e40af;
          background: #fff; padding: 9px 22px; border-radius: 999px;
          box-shadow: 0 0 20px rgba(255,255,255,0.25), 0 4px 12px rgba(0,0,0,0.1);
          transition: opacity 0.15s, transform 0.1s, box-shadow 0.15s;
        }
        .lp-nav-cta .lp-signup:hover { opacity: 0.93; transform: translateY(-1px); box-shadow: 0 0 28px rgba(255,255,255,0.35), 0 6px 18px rgba(0,0,0,0.12); }
        .lp-hamburger {
          display: none; background: none; border: none;
          color: #fff; cursor: pointer; padding: 6px;
        }

        /* ── HERO ── */
        .lp-hero {
          background: linear-gradient(160deg, #fff 0%, #f0f4ff 60%, #dde8ff 100%);
          padding: 88px 0 0;
          overflow: hidden;
          position: relative;
        }
        .lp-hero::before {
          content: '';
          position: absolute; top: -120px; right: -120px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(74,122,245,0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-hero::after {
          content: '';
          position: absolute; bottom: 0; left: -80px;
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 70%);
          pointer-events: none;
        }
        .lp-hero-inner {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 56px; align-items: center; padding-bottom: 88px;
          position: relative; z-index: 1;
        }
        .lp-hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(74,122,245,0.08); border: 1px solid rgba(74,122,245,0.25);
          border-radius: 999px; padding: 6px 14px;
          font-size: 0.75rem; font-weight: 700; color: #2563eb;
          letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 22px;
          box-shadow: 0 0 16px rgba(74,122,245,0.1);
        }
        .lp-hero-badge span {
          width: 7px; height: 7px; border-radius: 50%;
          background: #4ade80; box-shadow: 0 0 6px #4ade80;
          display: inline-block;
        }
        .lp-hero h1 {
          font-size: clamp(2.2rem, 4.5vw, 3.4rem);
          font-weight: 800; line-height: 1.1; color: #0c0f1a;
          margin-bottom: 22px;
        }
        .lp-hero h1 em { font-style: normal; color: #2563eb; }
        .lp-hero-sub {
          font-size: 1.05rem; line-height: 1.8; color: #64748b;
          max-width: 420px; margin-bottom: 36px;
        }
        .lp-hero-actions { display: flex; gap: 14px; flex-wrap: wrap; }
        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #2563eb, #4a7af5);
          color: #fff; font-size: 0.95rem; font-weight: 700;
          padding: 14px 30px; border-radius: 999px;
          box-shadow: 0 4px 24px rgba(37,99,235,0.38), 0 0 0 0 rgba(37,99,235,0);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .lp-btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(37,99,235,0.5); }
        .lp-btn-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.8); backdrop-filter: blur(8px);
          border: 1.5px solid rgba(37,99,235,0.3);
          color: #2563eb; font-size: 0.95rem; font-weight: 600;
          padding: 14px 30px; border-radius: 999px;
          box-shadow: 0 2px 12px rgba(37,99,235,0.08);
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
        }
        .lp-btn-outline:hover { background: #eef2ff; border-color: #2563eb; box-shadow: 0 4px 18px rgba(37,99,235,0.14); }

        /* hero visual */
        .lp-hero-visual { display: flex; justify-content: center; align-items: flex-end; }
        .lp-phone-appbar {
          background: linear-gradient(135deg, #2563eb, #4a7af5);
          padding: 10px 12px 8px;
        }

        /* ── HOW TO USE ── */
        .lp-how {
          padding: 88px 0;
          background: linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #3b6ef5 100%);
          position: relative; overflow: hidden;
        }
        .lp-how::before {
          content: '';
          position: absolute; top: -200px; right: -200px;
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 65%);
          pointer-events: none;
        }
        .lp-how::after {
          content: '';
          position: absolute; bottom: -150px; left: -150px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 65%);
          pointer-events: none;
        }
        .lp-how .wrap { position: relative; z-index: 1; }
        .lp-how-title {
          text-align: center; font-size: clamp(1.5rem, 3vw, 2.1rem);
          font-weight: 800; color: #fff; margin-bottom: 10px; letter-spacing: -0.03em;
        }
        .lp-how-sub {
          text-align: center; color: rgba(255,255,255,0.7);
          font-size: 1rem; margin-bottom: 52px;
        }
        .lp-how-grid {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
        }
        .lp-how-card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 20px; padding: 36px 32px;
          transition: background 0.2s, border-color 0.2s, transform 0.2s;
        }
        .lp-how-card:hover {
          background: rgba(255,255,255,0.1);
          border-color: rgba(255,255,255,0.25);
          transform: translateY(-2px);
        }
        .lp-how-card-label {
          font-size: 0.7rem; font-weight: 700; color: rgba(255,255,255,0.6);
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 10px;
        }
        .lp-how-card h3 {
          font-size: 1.15rem; font-weight: 800; color: #fff;
          margin-bottom: 24px; letter-spacing: -0.02em;
        }
        .lp-how-card ol { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
        .lp-how-item { display: flex; gap: 13px; align-items: flex-start; }
        .lp-how-num {
          width: 26px; height: 26px; border-radius: 50%;
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
          color: #fff; font-size: 0.7rem; font-weight: 800;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
        }
        .lp-how-item span { font-size: 0.875rem; color: rgba(255,255,255,0.82); line-height: 1.65; }
        .lp-how-btn {
          display: inline-flex; align-items: center; gap: 6px; margin-top: 28px;
          padding: 11px 24px; border-radius: 999px;
          background: #fff; color: #1e40af;
          font-weight: 700; font-size: 0.875rem;
          box-shadow: 0 4px 18px rgba(0,0,0,0.15);
          transition: opacity 0.15s, transform 0.1s;
        }
        .lp-how-btn:hover { opacity: 0.92; transform: translateY(-1px); }

        /* ── FOOTER ── */
        .lp-footer {
          background: linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #3b6ef5 100%);
          color: rgba(255,255,255,0.75);
          padding: 72px 0 32px;
          position: relative; overflow: hidden;
        }
        .lp-footer::before {
          content: '';
          position: absolute; top: -100px; right: -100px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 65%);
          pointer-events: none;
        }
        .lp-footer .wrap { position: relative; z-index: 1; }
        .lp-footer-grid {
          display: grid; grid-template-columns: 1.5fr 1fr 1fr;
          gap: 40px; padding-bottom: 48px;
          border-bottom: 1px solid rgba(255,255,255,0.12);
        }
        .lp-footer-brand-name { font-size: 1.2rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }
        .lp-footer-brand p {
          margin-top: 14px; font-size: 0.875rem; line-height: 1.7;
          color: rgba(255,255,255,0.6); max-width: 280px;
        }
        .lp-footer-col h4 {
          color: #fff; font-size: 0.875rem; font-weight: 700;
          margin-bottom: 18px; letter-spacing: -0.01em;
        }
        .lp-footer-col li { margin-bottom: 10px; }
        .lp-footer-col a {
          font-size: 0.875rem; color: rgba(255,255,255,0.6);
          transition: color 0.15s;
        }
        .lp-footer-col a:hover { color: #fff; }
        .lp-footer-bottom {
          display: flex; justify-content: center;
          padding-top: 28px; font-size: 0.8rem; color: rgba(255,255,255,0.4);
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 860px) {
          .lp-nav-links { display: none; }
          .lp-hamburger { display: flex; align-items: center; justify-content: center; }
          .lp-hero-inner { grid-template-columns: 1fr; }
          .lp-hero { padding: 56px 0 0; }
          .lp-hero-inner { padding-bottom: 56px; }
          .lp-hero-visual { justify-content: center; }
          .lp-how-grid { grid-template-columns: 1fr; }
          .lp-footer-grid { grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px) {
          .wrap { padding: 0 16px; }
          .lp-footer-grid { grid-template-columns: 1fr; }
          .lp-hero-actions { flex-direction: column; }
          .lp-btn-primary, .lp-btn-outline { justify-content: center; }
          .lp-nav-inner { padding: 0 12px; height: 56px; }
          .lp-nav-cta .lp-login { display: none; }
          .lp-nav-cta .lp-signup { padding: 7px 14px; font-size: 0.78rem; }
          .lp-logo { font-size: 1.05rem; }
          .lp-how { padding: 48px 0; }
          .lp-how-card { padding: 24px 18px; }
          .lp-how-num { width: 28px; height: 28px; font-size: 0.8rem; flex-shrink: 0; }
          .lp-hero-visual-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; width: 100%; padding: 0 16px 16px; }
          .lp-hero-visual { justify-content: flex-start; min-width: 572px; padding-bottom: 16px; }
        }
        @media (max-width: 400px) {
          .lp-nav-inner { padding: 0 10px; }
          .lp-logo { font-size: 1rem; }
        }
      `}</style>

      <div className="lp">
        {/* NAVBAR */}
        <nav className="lp-nav" aria-label="Main navigation">
          <div className="lp-nav-inner">
            <Link href="/" className="lp-logo" aria-label="HisabFlow home" style={{color:"#fff"}}>
              HisabFlow
            </Link>
            <ul className="lp-nav-links" role="list">
              <li><Link href="/">Home</Link></li>
              <li><Link href="/individual">Personal</Link></li>
              <li><Link href="/team">Team</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/profile">Profile</Link></li>

            </ul>
            <div className="lp-nav-cta">
              <Link href="/login" className="lp-login">Log in</Link>
              <Link href="/register" className="lp-signup">Get Started</Link>
            </div>
            <LpMobileMenu />
          </div>
        </nav>

        {/* HERO */}
        <section className="lp-hero" aria-labelledby="hero-heading">
          <div className="wrap lp-hero-inner">
            <div>

              <h1 id="hero-heading">
                Split bills.<br />Settle up.<br /><em>Stress-free.</em>
              </h1>
              <p className="lp-hero-sub">
                No more awkward money talks.<br />Every rupee tracked, every debt cleared.
              </p>
              <div className="lp-hero-actions">
                <Link href="/register" className="lp-btn-primary">
                  Get Started Free
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/login" className="lp-btn-outline">Log In</Link>
              </div>
            </div>

            <div className="lp-hero-visual-wrap" aria-hidden="true">
            <div className="lp-hero-visual" style={{paddingBottom:"48px"}}>
              {/* SVG phone frames — realistic device mockups */}
              <div style={{position:"relative",width:"572px",height:"520px",flexShrink:0}}>

                {/* ── Phone 1 — Home / Dashboard ── */}
                <div style={{position:"absolute",bottom:0,left:0,transformOrigin:"50% 100%",transform:"rotate(-5deg)",zIndex:1}}>
                  <svg width="230" height="500" viewBox="0 0 230 500" xmlns="http://www.w3.org/2000/svg" style={{filter:"drop-shadow(0 24px 60px rgba(0,0,0,0.6)) drop-shadow(0 8px 16px rgba(0,0,0,0.4))"}}>
                    <defs>
                      <clipPath id="sc1"><rect x="7" y="7" width="216" height="486" rx="30"/></clipPath>
                      <linearGradient id="fg1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2c2c2c"/><stop offset="40%" stopColor="#0d0d0d"/><stop offset="100%" stopColor="#1c1c1c"/></linearGradient>
                    </defs>
                    {/* body */}
                    <rect x="1" y="1" width="228" height="498" rx="38" fill="url(#fg1)"/>
                    <rect x="1" y="1" width="228" height="498" rx="38" fill="none" stroke="#2e2e2e" strokeWidth="1.2"/>
                    {/* subtle top shine */}
                    <path d="M38 1.5 Q115 0 192 1.5" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none"/>
                    {/* screen via foreignObject */}
                    <foreignObject x="7" y="7" width="216" height="486" clipPath="url(#sc1)">
                      <div style={{width:"216px",height:"486px",background:"linear-gradient(160deg,#fff 0%,#f0f4ff 100%)",overflow:"hidden",fontFamily:"Inter,system-ui,sans-serif"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 16px 4px",color:"#0c0f1a"}}>
                          <span style={{fontSize:"0.65rem",fontWeight:700}}>9:15</span>
                          <div style={{display:"flex",alignItems:"center",gap:3}}>
                            <svg width="10" height="7" viewBox="0 0 10 7"><rect x="0" y="4" width="2" height="3" rx="0.4" fill="#0c0f1a"/><rect x="2.5" y="2.5" width="2" height="4.5" rx="0.4" fill="#0c0f1a"/><rect x="5" y="1" width="2" height="6" rx="0.4" fill="#0c0f1a"/><rect x="7.5" y="0" width="2" height="7" rx="0.4" fill="rgba(0,0,0,0.2)"/></svg>
                            <svg width="13" height="7" viewBox="0 0 13 7"><rect x="0" y="1" width="11" height="5" rx="1.2" stroke="#0c0f1a" strokeWidth="0.9" fill="none"/><rect x="11.2" y="2" width="1.3" height="3" rx="0.4" fill="#0c0f1a"/><rect x="1" y="2" width="7.5" height="3" rx="0.3" fill="#0c0f1a"/></svg>
                          </div>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 16px 9px",background:"linear-gradient(145deg,#1e3a8a,#3b6ef5)"}}>
                          <span style={{fontSize:"0.85rem",fontWeight:900,color:"#fff",letterSpacing:"-0.03em"}}>HisabFlow</span>
                          <div style={{fontSize:"0.58rem",fontWeight:700,background:"rgba(255,255,255,0.2)",color:"#fff",padding:"3px 9px",borderRadius:999,border:"1px solid rgba(255,255,255,0.35)"}}>Register</div>
                        </div>
                        <div style={{padding:"18px 16px 0"}}>
                          <div style={{fontSize:"1.15rem",fontWeight:900,color:"#0c0f1a",lineHeight:1.18,letterSpacing:"-0.03em",marginBottom:10}}>
                            Split bills.<br/>Settle up.<br/><span style={{color:"#2563eb"}}>Stress-free.</span>
                          </div>
                          <div style={{fontSize:"0.6rem",color:"#64748b",lineHeight:1.65,marginBottom:16}}>Every rupee tracked.<br/>Every debt cleared instantly.</div>
                          <div style={{display:"flex",gap:7,marginBottom:20}}>
                            <div style={{fontSize:"0.6rem",fontWeight:700,background:"linear-gradient(135deg,#2563eb,#4a7af5)",color:"#fff",padding:"6px 12px",borderRadius:999,boxShadow:"0 3px 10px rgba(37,99,235,0.4)"}}>Get Started Free</div>
                            <div style={{fontSize:"0.6rem",fontWeight:600,border:"1.5px solid #cbd5e1",color:"#374151",padding:"6px 12px",borderRadius:999}}>Log In</div>
                          </div>
                        </div>
                        <div style={{padding:"0 16px",display:"flex",flexDirection:"column",gap:10}}>
                          <div style={{background:"#fff",borderLeft:"3px solid #2563eb",borderRadius:10,padding:"10px 14px",boxShadow:"0 2px 8px rgba(37,99,235,0.1)"}}>
                            <div style={{fontSize:"0.68rem",fontWeight:800,color:"#1d4ed8",marginBottom:3}}>Team Ledger</div>
                            <div style={{fontSize:"0.58rem",color:"#64748b",lineHeight:1.5}}>Split expenses & track dues with your group</div>
                          </div>
                          <div style={{background:"#fff",borderLeft:"3px solid #059669",borderRadius:10,padding:"10px 14px",boxShadow:"0 2px 8px rgba(5,150,105,0.1)"}}>
                            <div style={{fontSize:"0.68rem",fontWeight:800,color:"#065f46",marginBottom:3}}>Personal Finance</div>
                            <div style={{fontSize:"0.58rem",color:"#64748b",lineHeight:1.5}}>Track income, expenses & savings monthly</div>
                          </div>
                        </div>
                      </div>
                    </foreignObject>
                    {/* punch-hole camera on top */}
                    <circle cx="115" cy="25" r="7" fill="#0a0a0a"/>
                    <circle cx="115" cy="25" r="5.2" fill="#050505"/>
                    <circle cx="113.5" cy="23.5" r="1.4" fill="rgba(255,255,255,0.06)"/>
                    {/* volume buttons left */}
                    <rect x="-1" y="92" width="3.5" height="22" rx="1.75" fill="#1e1e1e"/>
                    <rect x="-1" y="124" width="3.5" height="38" rx="1.75" fill="#1e1e1e"/>
                    <rect x="-1" y="172" width="3.5" height="38" rx="1.75" fill="#1e1e1e"/>
                    {/* power button right */}
                    <rect x="227.5" y="130" width="3.5" height="54" rx="1.75" fill="#1e1e1e"/>
                    {/* gesture bar */}
                    <rect x="87" y="488" width="56" height="3.5" rx="1.75" fill="#333"/>
                  </svg>
                </div>

                {/* ── Phone 2 — Team Ledger ── */}
                <div style={{position:"absolute",bottom:0,left:176,transformOrigin:"50% 100%",transform:"rotate(1deg)",zIndex:2}}>
                  <svg width="230" height="500" viewBox="0 0 230 500" xmlns="http://www.w3.org/2000/svg" style={{filter:"drop-shadow(0 28px 70px rgba(0,0,0,0.65)) drop-shadow(0 8px 20px rgba(0,0,0,0.45))"}}>
                    <defs>
                      <clipPath id="sc2"><rect x="7" y="7" width="216" height="486" rx="30"/></clipPath>
                      <linearGradient id="fg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2c2c2c"/><stop offset="40%" stopColor="#0d0d0d"/><stop offset="100%" stopColor="#1c1c1c"/></linearGradient>
                    </defs>
                    <rect x="1" y="1" width="228" height="498" rx="38" fill="url(#fg2)"/>
                    <rect x="1" y="1" width="228" height="498" rx="38" fill="none" stroke="#2e2e2e" strokeWidth="1.2"/>
                    <path d="M38 1.5 Q115 0 192 1.5" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none"/>
                    <foreignObject x="7" y="7" width="216" height="486" clipPath="url(#sc2)">
                      <div style={{width:"216px",height:"486px",background:"#f8faff",overflow:"hidden",fontFamily:"Inter,system-ui,sans-serif"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 16px 4px",background:"#fff"}}>
                          <span style={{fontSize:"0.65rem",fontWeight:700,color:"#0c0f1a"}}>10:02</span>
                          <div style={{display:"flex",alignItems:"center",gap:3}}>
                            <svg width="10" height="7" viewBox="0 0 10 7"><rect x="0" y="4" width="2" height="3" rx="0.4" fill="#0c0f1a"/><rect x="2.5" y="2.5" width="2" height="4.5" rx="0.4" fill="#0c0f1a"/><rect x="5" y="1" width="2" height="6" rx="0.4" fill="#0c0f1a"/><rect x="7.5" y="0" width="2" height="7" rx="0.4" fill="rgba(0,0,0,0.2)"/></svg>
                            <svg width="13" height="7" viewBox="0 0 13 7"><rect x="0" y="1" width="11" height="5" rx="1.2" stroke="#0c0f1a" strokeWidth="0.9" fill="none"/><rect x="11.2" y="2" width="1.3" height="3" rx="0.4" fill="#0c0f1a"/><rect x="1" y="2" width="7.5" height="3" rx="0.3" fill="#0c0f1a"/></svg>
                          </div>
                        </div>
                        <div style={{background:"linear-gradient(135deg,#059669,#10b981)",padding:"10px 16px 14px"}}>
                          <div style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.8)",fontWeight:600,marginBottom:2}}>Personal Finance</div>
                          <div style={{fontSize:"1rem",fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>July 2026</div>
                        </div>
                        <div style={{padding:"12px 16px 0"}}>
                          <div style={{display:"flex",gap:8,marginBottom:14}}>
                            {([{label:"Income",val:"45,000",col:"#059669",bg:"#d1fae5"},{label:"Spent",val:"28,400",col:"#dc2626",bg:"#fee2e2"},{label:"Left",val:"16,600",col:"#2563eb",bg:"#dbeafe"}] as {label:string;val:string;col:string;bg:string}[]).map((s,i)=>(
                              <div key={i} style={{flex:1,background:s.bg,borderRadius:8,padding:"7px 8px"}}>
                                <div style={{fontSize:"0.5rem",color:s.col,fontWeight:700,marginBottom:2}}>{s.label}</div>
                                <div style={{fontSize:"0.65rem",fontWeight:900,color:s.col,letterSpacing:"-0.01em"}}>{s.val}</div>
                              </div>
                            ))}
                          </div>
                          <div style={{fontSize:"0.58rem",fontWeight:700,color:"#374151",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Transactions</div>
                          {([{sub:"Salary",cat:"Income",amt:"+45,000",col:"#059669"},{sub:"Rent",cat:"Bills",amt:"-15,000",col:"#dc2626"},{sub:"Groceries",cat:"Expenses",amt:"-3,200",col:"#dc2626"},{sub:"Savings Dep.",cat:"Savings",amt:"-10,200",col:"#2563eb"}] as {sub:string;cat:string;amt:string;col:string}[]).map((r,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 0",borderBottom:"1px solid #e0e7ff"}}>
                              <div>
                                <div style={{fontSize:"0.66rem",fontWeight:700,color:"#0c0f1a"}}>{r.sub}</div>
                                <div style={{fontSize:"0.55rem",color:"#94a3b8",marginTop:1}}>{r.cat}</div>
                              </div>
                              <span style={{fontSize:"0.68rem",fontWeight:800,color:r.col}}>{r.amt}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </foreignObject>
                    <circle cx="115" cy="25" r="7" fill="#0a0a0a"/>
                    <circle cx="115" cy="25" r="5.2" fill="#050505"/>
                    <circle cx="113.5" cy="23.5" r="1.4" fill="rgba(255,255,255,0.06)"/>
                    <rect x="-1" y="92" width="3.5" height="22" rx="1.75" fill="#1e1e1e"/>
                    <rect x="-1" y="124" width="3.5" height="38" rx="1.75" fill="#1e1e1e"/>
                    <rect x="-1" y="172" width="3.5" height="38" rx="1.75" fill="#1e1e1e"/>
                    <rect x="227.5" y="130" width="3.5" height="54" rx="1.75" fill="#1e1e1e"/>
                    <rect x="87" y="488" width="56" height="3.5" rx="1.75" fill="#333"/>
                  </svg>
                </div>

                {/* ── Phone 3 — Team Ledger ── */}
                <div style={{position:"absolute",bottom:0,left:352,transformOrigin:"50% 100%",transform:"rotate(6deg)",zIndex:3}}>
                  <svg width="230" height="500" viewBox="0 0 230 500" xmlns="http://www.w3.org/2000/svg" style={{filter:"drop-shadow(0 28px 70px rgba(0,0,0,0.65)) drop-shadow(0 8px 20px rgba(0,0,0,0.45))"}}>
                    <defs>
                      <clipPath id="sc3"><rect x="7" y="7" width="216" height="486" rx="30"/></clipPath>
                      <linearGradient id="fg3" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#2c2c2c"/><stop offset="40%" stopColor="#0d0d0d"/><stop offset="100%" stopColor="#1c1c1c"/></linearGradient>
                    </defs>
                    <rect x="1" y="1" width="228" height="498" rx="38" fill="url(#fg3)"/>
                    <rect x="1" y="1" width="228" height="498" rx="38" fill="none" stroke="#2e2e2e" strokeWidth="1.2"/>
                    <path d="M38 1.5 Q115 0 192 1.5" stroke="rgba(255,255,255,0.08)" strokeWidth="1.5" fill="none"/>
                    <foreignObject x="7" y="7" width="216" height="486" clipPath="url(#sc3)">
                      <div style={{width:"216px",height:"486px",background:"#f8faff",overflow:"hidden",fontFamily:"Inter,system-ui,sans-serif"}}>
                        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 16px 4px",background:"#fff"}}>
                          <span style={{fontSize:"0.65rem",fontWeight:700,color:"#0c0f1a"}}>10:48</span>
                          <div style={{display:"flex",alignItems:"center",gap:3}}>
                            <svg width="10" height="7" viewBox="0 0 10 7"><rect x="0" y="4" width="2" height="3" rx="0.4" fill="#0c0f1a"/><rect x="2.5" y="2.5" width="2" height="4.5" rx="0.4" fill="#0c0f1a"/><rect x="5" y="1" width="2" height="6" rx="0.4" fill="#0c0f1a"/><rect x="7.5" y="0" width="2" height="7" rx="0.4" fill="rgba(0,0,0,0.2)"/></svg>
                            <svg width="13" height="7" viewBox="0 0 13 7"><rect x="0" y="1" width="11" height="5" rx="1.2" stroke="#0c0f1a" strokeWidth="0.9" fill="none"/><rect x="11.2" y="2" width="1.3" height="3" rx="0.4" fill="#0c0f1a"/><rect x="1" y="2" width="7.5" height="3" rx="0.3" fill="#0c0f1a"/></svg>
                          </div>
                        </div>
                        <div style={{background:"linear-gradient(135deg,#1e3a8a,#3b6ef5)",padding:"10px 16px 14px"}}>
                          <div style={{fontSize:"0.6rem",color:"rgba(255,255,255,0.75)",fontWeight:600,marginBottom:3}}>Team Ledger</div>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                            <span style={{fontSize:"1rem",fontWeight:900,color:"#fff",letterSpacing:"-0.02em"}}>Flat Expenses</span>
                            <span style={{fontSize:"0.58rem",background:"rgba(255,255,255,0.2)",color:"#fff",padding:"2px 8px",borderRadius:999,fontWeight:600}}>Jul 2026</span>
                          </div>
                        </div>
                        <div style={{padding:"12px 16px 0"}}>
                          <div style={{fontSize:"0.58rem",fontWeight:700,color:"#1d4ed8",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Recent Entries</div>
                          {([{date:"Jul 20",desc:"Groceries",amt:"2,400",by:"Zain"},{date:"Jul 21",desc:"Electricity",amt:"3,800",by:"Hamza"},{date:"Jul 23",desc:"Internet",amt:"1,500",by:"Ali"}] as {date:string;desc:string;amt:string;by:string}[]).map((e,i)=>(
                            <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #e0e7ff"}}>
                              <div>
                                <div style={{fontSize:"0.68rem",fontWeight:700,color:"#0c0f1a"}}>{e.desc}</div>
                                <div style={{fontSize:"0.56rem",color:"#94a3b8",marginTop:2}}>{e.date} · Paid by {e.by}</div>
                              </div>
                              <span style={{fontSize:"0.68rem",fontWeight:800,color:"#1d4ed8"}}>Rs {e.amt}</span>
                            </div>
                          ))}
                        </div>
                        <div style={{padding:"12px 16px"}}>
                          <div style={{fontSize:"0.58rem",fontWeight:700,color:"#1d4ed8",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:8}}>Dues</div>
                          {([{name:"Zain",pending:"-167",pos:false},{name:"Hamza",pending:"+1,233",pos:true},{name:"Ali",pending:"-1,066",pos:false}] as {name:string;pending:string;pos:boolean}[]).map((d,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:"1px solid #e0e7ff"}}>
                              <div style={{display:"flex",alignItems:"center",gap:7}}>
                                <div style={{width:24,height:24,borderRadius:"50%",background:"linear-gradient(135deg,#2563eb,#4a7af5)",color:"#fff",fontSize:"0.6rem",fontWeight:800,display:"flex",alignItems:"center",justifyContent:"center"}}>{d.name[0]}</div>
                                <span style={{fontSize:"0.68rem",fontWeight:600,color:"#0c0f1a"}}>{d.name}</span>
                              </div>
                              <span style={{fontSize:"0.68rem",fontWeight:800,color:d.pos?"#059669":"#dc2626"}}>{d.pending}</span>
                            </div>
                          ))}
                          <div style={{marginTop:12,padding:"8px",borderRadius:999,background:"linear-gradient(135deg,#2563eb,#4a7af5)",color:"#fff",fontSize:"0.65rem",fontWeight:700,textAlign:"center",boxShadow:"0 4px 14px rgba(37,99,235,0.35)"}}>Download Receipt</div>
                        </div>
                      </div>
                    </foreignObject>
                    <circle cx="115" cy="25" r="7" fill="#0a0a0a"/>
                    <circle cx="115" cy="25" r="5.2" fill="#050505"/>
                    <circle cx="113.5" cy="23.5" r="1.4" fill="rgba(255,255,255,0.06)"/>
                    <rect x="-1" y="92" width="3.5" height="22" rx="1.75" fill="#1e1e1e"/>
                    <rect x="-1" y="124" width="3.5" height="38" rx="1.75" fill="#1e1e1e"/>
                    <rect x="-1" y="172" width="3.5" height="38" rx="1.75" fill="#1e1e1e"/>
                    <rect x="227.5" y="130" width="3.5" height="54" rx="1.75" fill="#1e1e1e"/>
                    <rect x="87" y="488" width="56" height="3.5" rx="1.75" fill="#333"/>
                  </svg>
                </div>

              </div>
            </div>
            </div>
          </div>
        </section>

        <main>
          {/* HOW TO USE */}
          <section className="lp-how">
            <div className="wrap">
              <h2 className="lp-how-title">How to Use HisabFlow?</h2>
              <p className="lp-how-sub">Two features, both simple to use.</p>
              <div className="lp-how-grid">
                <div className="lp-how-card">
                  <div className="lp-how-card-label">Team Ledger</div>
                  <h3>Track shared expenses with your group</h3>
                  <ol>
                    {[
                      "Go to Team and click Create Ledger. Give it a name.",
                      "Share the Ledger ID with your group. They join by clicking Join Ledger.",
                      "Click Add Entry to log an expense. Set who paid and each person share count.",
                      "The Dues table shows who owes what. Download a receipt when done.",
                    ].map((s, i) => (
                      <li key={i} className="lp-how-item">
                        <span className="lp-how-num">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <Link href="/team" className="lp-how-btn">
                    Open Team
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                </div>

                <div className="lp-how-card">
                  <div className="lp-how-card-label">Personal Finance</div>
                  <h3>Track your own income, expenses and dues</h3>
                  <ol>
                    {[
                      "Go to Personal and tap the + button to add a record.",
                      "Choose type: Expense, Income, Given, or Received.",
                      "Fill in the amount, category, and date. For Given or Received, add the person name.",
                      "Send a receipt via WhatsApp for any Given or Received record.",
                    ].map((s, i) => (
                      <li key={i} className="lp-how-item">
                        <span className="lp-how-num">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                  <Link href="/individual" className="lp-how-btn">
                    Open Personal
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* CONTACT */}
          <ContactSection />
        </main>

        {/* FOOTER */}
        <footer className="lp-footer">
          <div className="wrap">
            <div className="lp-footer-grid">
              <div className="lp-footer-brand">
                <div className="lp-footer-brand-name">HisabFlow</div>
                <p>The simplest way for roommates, trip groups, and friends to split bills and settle up, free forever.</p>
              </div>
              <div className="lp-footer-col">
                <h4>Pages</h4>
                <ul role="list">
                  <li><Link href="/team">Team Ledger</Link></li>
                  <li><Link href="/individual">Personal Finance</Link></li>
                  <li><Link href="/how-to-use">How to Use</Link></li>
                  <li><Link href="/#contact">Contact</Link></li>
                </ul>
              </div>
              <div className="lp-footer-col">
                <h4>Account</h4>
                <ul role="list">
                  <li><Link href="/login">Sign In</Link></li>
                  <li><Link href="/register">Create Account</Link></li>
                  <li><Link href="/forgot-password">Forgot Password</Link></li>
                </ul>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <span>&copy; 2026 HisabFlow. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
