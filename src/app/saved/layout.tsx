import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Saved Recipes — Waivy",
  description: "Your bookmarked recipes in one place. Browse saved recipes from the database, your AI-generated favorites, and custom recipes you've built.",
  openGraph: {
    title: "Saved Recipes — Waivy",
    description: "Your bookmarked recipes — database picks, AI-generated favorites, and custom creations.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
