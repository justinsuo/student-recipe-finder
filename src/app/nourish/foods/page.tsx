"use client";

import { NourishShell } from "@/components/nourish/NourishShell";
import { FoodsView } from "@/components/nourish/FoodsView";

export default function NourishFoodsPage() {
  return (
    <NourishShell
      title="My foods."
      description="Custom foods, recently logged, and frequently used. Build your own database of brand-specific or homemade items."
    >
      <FoodsView />
    </NourishShell>
  );
}
