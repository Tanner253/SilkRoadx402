import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/providers/WalletProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppInitializer } from "@/components/providers/AppInitializer";
import { UIProviders } from "@/components/providers/UIProviders";
import { CoinCTAModal } from "@/components/modals/CoinCTAModal";
import { SmoothScroll } from "@/components/providers/SmoothScroll";

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
        <AppInitializer />
        <SmoothScroll />
        <SolanaWalletProvider>
          <AuthProvider>
            <UIProviders>
              <CoinCTAModal />
              <div className={`app-shell ${process.env.NEXT_PUBLIC_X_COMMUNITY_URL ? "has-community-banner" : ""}`}>
                <Navbar />
                <main className="app-main">
                  {children}
                </main>
                <Footer />
              </div>
            </UIProviders>
          </AuthProvider>
        </SolanaWalletProvider>
      </body>
    </html>
  );
}
