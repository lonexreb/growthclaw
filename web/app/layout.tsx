import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GrowthClaw — Founder Scouting Dashboard",
  description:
    "Autonomous founder-scouting outbound engine for Crowdstake AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`} suppressHydrationWarning>
      <body className="min-h-screen bg-gc-bg text-gc-text">
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
