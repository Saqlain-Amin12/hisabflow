import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Spending Insights",
  description: "Visualise your monthly spending patterns, compare with previous months, and track your financial averages on HisabFlow.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
