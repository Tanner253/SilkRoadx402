import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CoinCTAModal } from "@/components/modals/CoinCTAModal";
import { SmoothScroll } from "@/components/providers/SmoothScroll";
import { WatchProvider } from "@/components/donations/WatchProvider";
import { WatchBanner } from "@/components/donations/WatchBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenFund — Open Fundraising",
  description: "Raise funds for what matters with OpenFund. Preparing for ETH donations on Robinhood Chain.",
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
