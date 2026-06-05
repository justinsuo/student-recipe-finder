import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Grocery List — Waivy",
  description: "Your auto-generated shopping list with regional price estimates. Add missing ingredients from any recipe, group by category, and see your total before checkout.",
  openGraph: {
    title: "Grocery List — Waivy",
    description: "Auto-generated shopping list with regional price estimates from your chosen recipes.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
