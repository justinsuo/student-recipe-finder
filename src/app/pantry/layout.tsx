import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Pantry — Waivy",
  description: "Add your ingredients by typing, pasting, or snapping a photo. Waivy matches your pantry to recipes you can actually make tonight, with cost per serving and what's missing.",
  openGraph: {
    title: "My Pantry — Waivy",
    description: "Add ingredients to your pantry and find recipes you can make tonight.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
