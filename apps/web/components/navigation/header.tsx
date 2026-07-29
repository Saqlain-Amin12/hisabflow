"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { mainNav } from "@/config/nav";
import { clearStoredProfile } from "@/lib/profile";

const HIDE_ON = ["/", "/login", "/register", "/forgot-password"];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  if (HIDE_ON.includes(pathname)) return null;

  function handleLogout() {
    clearStoredProfile();
    router.push("/login");
  }

  return (
    <>
      <style>{`
        .nh {
          position: sticky; top: 0; z-index: 50; width: 100%;
          background: linear-gradient(145deg, #1e3a8a 0%, #1d4ed8 45%, #3b6ef5 100%);
          border-bottom: 1px solid rgba(255,255,255,0.12);
          box-shadow: 0 4px 28px rgba(0,0,0,0.18);
        }
        .nh-inner {
          display: flex; align-items: center;
          padding: 0 32px; height: 68px; position: relative;
        }
        .nh-back {
          background: none; border: none; cursor: pointer;
          color: rgba(255,255,255,0.75); font-size: 0.875rem; font-weight: 500;
          white-space: nowrap; padding: 6px 10px; border-radius: 8px; flex-shrink: 0;
          transition: background 0.15s, color 0.15s; font-family: inherit;
          display: flex; align-items: center; gap: 4px;
        }
        .nh-back:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .nh-logo {
          display: flex; align-items: center; text-decoration: none; flex-shrink: 0;
          margin-left: 20px; gap: 8px;
        }
        .nh-logo-dot {
          width: 28px; height: 28px; border-radius: 8px;
          background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.7rem; font-weight: 800; color: #fff;
          box-shadow: 0 0 10px rgba(255,255,255,0.1);
        }
        .nh-name { font-size: 1.25rem; font-weight: 800; color: #fff; letter-spacing: -0.02em; }

        .nh-nav {
          position: absolute; left: 50%; transform: translateX(-50%);
          display: flex; align-items: center; gap: 2px;
        }
        .nh-link {
          padding: 7px 26px; border-radius: 8px;
          font-size: 0.875rem; font-weight: 500;
          color: rgba(255,255,255,0.75); text-decoration: none; white-space: nowrap;
          transition: background 0.15s, color 0.15s;
        }
        .nh-link:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .nh-link.active {
          background: rgba(255,255,255,0.18);
          color: #fff; font-weight: 700;
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15);
        }

        .nh-right { margin-left: auto; flex-shrink: 0; }
        .nh-logout {
          padding: 8px 22px; border-radius: 999px;
          border: 1.5px solid rgba(255,255,255,0.35);
          background: rgba(255,255,255,0.1); color: #fff;
          font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .nh-logout:hover {
          background: rgba(255,255,255,0.2);
          border-color: rgba(255,255,255,0.6);
          box-shadow: 0 0 16px rgba(255,255,255,0.1);
        }

        .nh-burger {
          display: none; background: none; border: none; color: #fff; cursor: pointer;
          padding: 6px; border-radius: 8px; margin-left: 8px; transition: background 0.15s;
        }
        .nh-burger:hover { background: rgba(255,255,255,0.12); }

        .nh-mobile {
          display: none; flex-direction: column;
          background: rgba(20,50,160,0.95);
          backdrop-filter: blur(12px);
          border-top: 1px solid rgba(255,255,255,0.1);
          padding: 8px 20px 16px;
        }
        .nh-mobile.open { display: flex; }
        .nh-mlink {
          padding: 11px 14px; border-radius: 10px;
          font-size: 0.9rem; font-weight: 500;
          color: rgba(255,255,255,0.8); text-decoration: none;
          transition: background 0.15s, color 0.15s;
        }
        .nh-mlink:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .nh-mlink.active { background: rgba(255,255,255,0.15); color: #fff; font-weight: 700; }
        .nh-mdivider { height: 1px; background: rgba(255,255,255,0.12); margin: 8px 0; }
        .nh-mlogout {
          padding: 11px 14px; border-radius: 10px; background: none; border: none;
          cursor: pointer; font-size: 0.9rem; font-weight: 500;
          color: rgba(255,255,255,0.7); width: 100%; text-align: left;
          transition: background 0.15s, color 0.15s; font-family: inherit;
        }
        .nh-mlogout:hover { background: rgba(255,255,255,0.1); color: #fff; }

        @media (max-width: 768px) {
          .nh-nav { display: none; }
          .nh-right { display: none; }
          .nh-burger { display: flex; align-items: center; justify-content: center; }
          .nh-inner { padding: 0 16px; }
        }
      `}</style>

      <header className="nh">
        <div className="nh-inner">
          <button className="nh-back" onClick={() => router.back()}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back
          </button>

          <Link href="/" className="nh-logo" aria-label="HisabFlow home">
            <span className="nh-name">HisabFlow</span>
          </Link>

          <nav aria-label="Primary" className="nh-nav">
            {mainNav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href) && item.href !== "/";
              return (
                <Link key={item.href} href={item.href} className={`nh-link${active ? " active" : ""}`}>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="nh-right">
            <button className="nh-logout" onClick={handleLogout}>Logout</button>
          </div>

          <button type="button" className="nh-burger" onClick={() => setMenuOpen((o) => !o)} aria-label={menuOpen ? "Close menu" : "Open menu"}>
            {menuOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        <div className={`nh-mobile${menuOpen ? " open" : ""}`}>
          {mainNav.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href) && item.href !== "/";
            return (
              <Link key={item.href} href={item.href} className={`nh-mlink${active ? " active" : ""}`} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            );
          })}
          <div className="nh-mdivider" />
          <button className="nh-mlogout" onClick={handleLogout}>Logout</button>
        </div>
      </header>
    </>
  );
}
