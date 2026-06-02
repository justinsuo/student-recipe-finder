import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppStoreProvider } from "@/lib/AppStore";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Chatbot } from "@/components/layout/Chatbot";
import { ToastProvider } from "@/components/ui/Toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Student Recipe Finder — Eat well, spend less",
  description:
    "Find cheap, practical recipes built around your budget, your pantry, and your equipment.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <AppStoreProvider>
          <ToastProvider>
            <Navbar />
            <main className="app-main mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
              {children}
            </main>
            <BottomNav />
            <Chatbot />
          </ToastProvider>
        </AppStoreProvider>
      </body>
    </html>
  );
}
