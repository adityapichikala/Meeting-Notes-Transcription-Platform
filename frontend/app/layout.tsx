/**
 * Root layout — sets fonts, base metadata, Material Symbols, and global CSS.
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MeetingMind",
    template: "%s | MeetingMind",
  },
  description:
    "AI-powered meeting intelligence: transcripts, summaries, topics, and action items.",
};

import Providers from "./providers";
import { Toaster } from "sonner";
import { SideNavBar } from "@/components/shared/SideNavBar";
import { TopNavBar } from "@/components/shared/TopNavBar";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full dark`}>
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        />
      </head>
      <body className="min-h-full bg-[#0F0F13] text-slate-100 antialiased overflow-hidden">
        <Providers>
          <div className="flex h-screen w-full">
            <SideNavBar />
            <TopNavBar />
            <main className="ml-[240px] mt-16 flex-1 h-[calc(100vh-64px)] overflow-hidden relative">
              {children}
            </main>
          </div>
          <Toaster theme="dark" position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
