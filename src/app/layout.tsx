import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "BlinkSplit — AI Receipt Scanner + Solana Blinks",
    template: "%s | BlinkSplit",
  },
  description:
    "Snap a receipt. AI splits it. Solana Blinks collect every share in 30 seconds. No app downloads.",
  metadataBase: new URL("https://100xdevs.vercel.app"),
  keywords: [
    "Solana",
    "Blinks",
    "bill splitting",
    "receipt scanner",
    "AI",
    "USDC",
    "crypto payments",
    "group payments",
  ],
  authors: [{ name: "BlinkSplit" }],
  creator: "BlinkSplit",
  category: "Finance",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "BlinkSplit — Split Bills in <30s on Solana",
    description:
      "AI receipt scanner + Solana Blinks for instant bill splitting. Drop a link in the group chat, everyone pays their exact USDC share.",
    type: "website",
    siteName: "BlinkSplit",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "BlinkSplit — Split Bills in <30s on Solana",
    description:
      "AI receipt scanner + Solana Blinks for instant bill splitting.",
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
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-background text-text-primary">{children}</body>
    </html>
  );
}
