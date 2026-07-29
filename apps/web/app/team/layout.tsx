import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team Ledgers",
  description: "Manage your shared team ledgers, track group expenses, and see who owes what with HisabFlow.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
