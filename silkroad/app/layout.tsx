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
import { SITE_DESCRIPTION, SITE_TAGLINE, SITE_TITLE, siteUrl } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: SITE_TITLE, template: "%s · OpenFund" },
  description: SITE_DESCRIPTION,
  applicationName: "OpenFund",
  openGraph: {
    type: "website",
    siteName: "OpenFund",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: "/images/brand/openfund-og-1200x630.png", width: 1200, height: 630, alt: `OpenFund — ${SITE_TAGLINE}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
          <div className="app-shell">
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
