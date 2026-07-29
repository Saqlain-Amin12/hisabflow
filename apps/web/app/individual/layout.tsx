import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Personal Finance",
  description: "Track your personal budget, set savings goals, and monitor spending by category with HisabFlow's personal finance dashboard.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
