import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardShell from "@/components/DashboardShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brain Cloud License Hub - Enterprise Workstation Fleet",
  description: "Cryptographic node-locking, remote license management, and real-time offline synchronization for Brain workstations.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#080C15] text-slate-100 antialiased selection:bg-indigo-500/30 selection:text-indigo-200">
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
