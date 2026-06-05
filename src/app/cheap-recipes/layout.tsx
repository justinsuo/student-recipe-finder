import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cheap Recipes — Waivy",
  description: "Browse 200+ budget-friendly recipes ranked by cost per serving. Filter by equipment, diet, time, and meal type. Find what you can cook tonight for under $3.",
  openGraph: {
    title: "Cheap Recipes — Waivy",
    description: "Budget-friendly recipes ranked by cost per serving. Filter by equipment, diet, and more.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
