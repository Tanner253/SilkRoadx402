import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SolanaWalletProvider } from "@/components/providers/WalletProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AppInitializer } from "@/components/providers/AppInitializer";
import { UIProviders } from "@/components/providers/UIProviders";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OpenFund - No KYC Crowdfunding on Solana",
  description: "Raise funds for anything, anywhere, anonymously. No banks, no bureaucracy. Powered by Solana.",
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
        <SolanaWalletProvider>
          <AuthProvider>
            <UIProviders>
              <div className="relative">
                <Navbar />
                <main className="pt-24 pb-16">
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
