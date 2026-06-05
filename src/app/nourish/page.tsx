import { PageHeader } from "@/components/ui/PageHeader";
import NourishClient from "@/components/nourish/NourishClient";

/**
 * Nourish "Today" page — server component so the PageHeader is statically
 * rendered in HTML (visible to crawlers and users before JS loads).
 * The interactive dashboard is a client component that hydrates after load.
 */
export default function NourishTodayPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Nourish"
        title="Today's nourish."
        description="Calories left, macros to hit, and what to cook to get there. Log meals from search, recipes, voice, or photo."
        tone="emerald"
      />
      <NourishClient />
    </div>
  );
}
