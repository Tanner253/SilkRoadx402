import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "SilkRoadx402 - Anonymous Software Marketplace",
  description: "The first decentralized marketplace for private software sales using x402 payments on Solana",
  icons: {
    icon: '/correcto.png',
    shortcut: '/correcto.png',
    apple: '/correcto.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-black text-gray-100 pb-16" suppressHydrationWarning>
        {children}
        <Footer />
      </body>
    </html>
  );
}

