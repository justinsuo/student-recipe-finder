import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Explore Cuisines — Waivy",
  description: "Discover recipes from around the world — Italian, Thai, Mexican, Indian, and more. Browse by cuisine with cost and macro information for every dish.",
  openGraph: {
    title: "Explore Cuisines — Waivy",
    description: "Discover recipes from around the world with cost and macro information.",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
