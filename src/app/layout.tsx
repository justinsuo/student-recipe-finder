import type { Metadata } from "next";
import { Nunito, Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppStoreProvider } from "@/lib/AppStore";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Chatbot } from "@/components/layout/Chatbot";
import { ToastProvider } from "@/components/ui/Toast";
import { AppMotionProvider } from "@/components/motion/AppMotionProvider";

// Nunito = warm, rounded, app-like — used everywhere the existing code
// references --font-geist-sans. The variable name is kept for
// backwards-compat with the rest of the codebase; only the underlying
// face changes.
const nunito = Nunito({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

// Inter for very small UI bits + tabular numerics where Nunito's
// rounder shapes get noisy.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Waivy — Eat well, spend less",
  description:
    "Waivy is an AI cooking assistant for students. Pantry-aware recipes, real cost per serving, macros, and a grocery list built in.",
  applicationName: "Waivy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${nunito.variable} ${inter.variable} ${geistMono.variable}`}>
      <body className="min-h-screen bg-[#FFF8ED] text-[#241A12] antialiased">
        <AppStoreProvider>
          <ToastProvider>
            <AppMotionProvider>
              <Navbar />
              <main className="app-main mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
                {children}
              </main>
              <BottomNav />
              <Chatbot />
            </AppMotionProvider>
          </ToastProvider>
        </AppStoreProvider>
      </body>
    </html>
  );
}
