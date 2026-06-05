import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nourish — Track Macros & Calories — Waivy",
  description: "Log meals, track protein, carbs, fat, and calories. Set daily targets, photo-log with AI, and see your nutrition trends over time.",
  openGraph: {
    title: "Nourish — Track Macros & Calories — Waivy",
    description: "Log meals, track macros, and see your nutrition trends with AI-powered food logging.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
