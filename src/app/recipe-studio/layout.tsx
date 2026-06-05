import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recipe Studio — Waivy",
  description: "Build your own recipe cards, edit AI-generated recipes, and generate food images. Your personal kitchen notebook with macros and cost built in.",
  openGraph: {
    title: "Recipe Studio — Waivy",
    description: "Build custom recipe cards, edit AI recipes, and generate food images.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
