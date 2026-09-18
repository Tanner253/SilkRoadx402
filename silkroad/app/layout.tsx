import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CoinCTAModal } from "@/components/modals/CoinCTAModal";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { WatchProvider } from "@/components/donations/WatchProvider";
import { WatchBanner } from "@/components/donations/WatchBanner";
import { ExternalLinkGuard } from "@/components/ExternalLinkGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://openfund.fun";
const DESCRIPTION =
  "No-KYC crowdfunding on Robinhood Chain. Start a fundraiser in minutes, or give ETH straight from your own wallet — no accounts, no wallet connection.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "OpenFund — Open Fundraising", template: "%s · OpenFund" },
  description: DESCRIPTION,
  applicationName: "OpenFund",
  openGraph: {
    type: "website",
    siteName: "OpenFund",
    title: "OpenFund — Good things start with a little.",
    description: DESCRIPTION,
    images: [{ url: "/images/brand/openfund-og-1200x630.png", width: 1200, height: 630, alt: "OpenFund" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpenFund — Good things start with a little.",
    description: DESCRIPTION,
    images: ["/images/brand/openfund-og-1200x630.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <SmoothScroll />
        <WatchProvider>
          <CoinCTAModal />
          <ExternalLinkGuard />
          <div className={`app-shell ${process.env.NEXT_PUBLIC_X_COMMUNITY_URL ? "has-community-banner" : ""}`}>
            <Navbar />
            <main className="app-main">{children}</main>
            <Footer />
            <WatchBanner />
          </div>
        </WatchProvider>
      </body>
    </html>
  );
}
