import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: "Team Ledger | HisabFlow" },
  description: "View and manage entries, dues, and receipts for your team ledger on HisabFlow.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
