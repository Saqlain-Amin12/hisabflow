import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { siteConfig } from "@/config/site";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Header } from "@/components/navigation";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "HisabFlow — Split Bills, Settle Debts Instantly",
    template: "%s | HisabFlow",
  },
  description: siteConfig.description,
  keywords: [
    "bill splitting app", "expense tracker Pakistan", "split bills friends",
    "shared expense manager", "hisab kitab", "settle debts online",
    "group expense tracker", "roommate expenses", "personal finance PKR",
    "budget tracker Pakistan", "HisabFlow",
  ],
  authors: [{ name: "HisabFlow" }],
  creator: "HisabFlow",
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: siteConfig.url,
    siteName: "HisabFlow",
    title: "HisabFlow — Split Bills, Settle Debts Instantly",
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "HisabFlow — Split Bills, Settle Debts Instantly",
    description: siteConfig.description,
    creator: "@hisabflow",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Script id="ld-org" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "HisabFlow",
          "url": siteConfig.url,
          "description": siteConfig.description,
          "applicationCategory": "FinanceApplication",
          "operatingSystem": "Web",
          "offers": { "@type": "Offer", "price": "0", "priceCurrency": "PKR" },
          "featureList": ["Bill splitting", "Shared expense tracking", "Personal budget management", "Savings goals"],
          "inLanguage": "en",
          "audience": { "@type": "Audience", "geographicArea": { "@type": "Country", "name": "Pakistan" } },
        })}} />
        <ThemeProvider>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
