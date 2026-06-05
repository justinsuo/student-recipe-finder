import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Chef — Waivy",
  description: "Generate original recipes from your pantry. Tell AI Chef what you have, your budget, and your equipment — get 4 complete recipes with cost, macros, and step-by-step instructions.",
  openGraph: {
    title: "AI Chef — Waivy",
    description: "Generate original recipes from your pantry, budget, and equipment with AI Chef.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
