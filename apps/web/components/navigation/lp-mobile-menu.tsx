"use client";

import { useState } from "react";
import Link from "next/link";

export function LpMobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="lp-hamburger"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="lp-mobile-menu open">
          <Link href="/" onClick={() => setOpen(false)}>Home</Link>
          <Link href="/individual" onClick={() => setOpen(false)}>Personal</Link>
          <Link href="/team" onClick={() => setOpen(false)}>Team</Link>
          <Link href="/profile" onClick={() => setOpen(false)}>Profile</Link>
          <Link href="/contact" onClick={() => setOpen(false)}>Contact</Link>
          <Link href="/login" onClick={() => setOpen(false)}>Log in</Link>
          <Link href="/register" className="lp-signup-mob" onClick={() => setOpen(false)}>Get Started Free</Link>
        </div>
      )}
    </>
  );
}
