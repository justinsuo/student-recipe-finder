"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Activity, Bluetooth, Watch } from "lucide-react";
import { NourishShell } from "@/components/nourish/NourishShell";
import { ProfileView } from "@/components/nourish/ProfileView";
import { SectionHeading } from "@/components/ui/SectionHeading";

const INTEGRATIONS = [
  {
    name: "Apple Health",
    icon: Heart,
    tone: "rose",
    description: "Pull weight, activity, and water from iOS. Coming soon.",
  },
  {
    name: "Google Fit / Health Connect",
    icon: Activity,
    tone: "sky",
    description: "Pull steps and active calories from Android. Coming soon.",
  },
  {
    name: "Fitbit",
    icon: Watch,
    tone: "violet",
    description: "Sync activity, sleep, and heart rate. Coming soon.",
  },
  {
    name: "Garmin / Oura",
    icon: Bluetooth,
    tone: "indigo",
    description: "Sync workouts and recovery. Coming soon.",
  },
] as const;

const TONE_BG: Record<string, string> = {
  rose: "bg-rose-100 text-rose-700",
  sky: "bg-sky-100 text-sky-700",
  violet: "bg-violet-100 text-violet-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export default function NourishSettingsPage() {
  // ProfileView includes a "reset profile" action that fires its callback;
  // if invoked we send the user back to the Nourish dashboard so the
  // onboarding wizard fires fresh.
  const [reset, setReset] = useState(false);

  return (
    <NourishShell
      title="Settings."
      description="Your profile, calorie + macro targets, units, and partner-app integrations."
    >
      {reset ? (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-700">
            Profile reset. Head back to{" "}
            <Link
              href="/nourish"
              className="font-semibold text-emerald-700 hover:underline"
            >
              Nourish
            </Link>{" "}
            to set up again.
          </p>
        </div>
      ) : (
        <ProfileView onResetProfile={() => setReset(true)} />
      )}

      <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <SectionHeading
          eyebrow="Integrations"
          title="Sync from your devices."
          description="None of these are live yet — they ship as we hook each platform up. Your existing local data is unaffected."
          tone="sky"
        />
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {INTEGRATIONS.map(({ name, icon: Icon, tone, description }) => (
            <li
              key={name}
              className="flex items-start gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4"
            >
              <span
                className={`grid h-10 w-10 flex-none place-items-center rounded-xl ${TONE_BG[tone]}`}
                aria-hidden
              >
                <Icon size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-stone-900">
                    {name}
                  </p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-stone-200 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-700">
                    Not connected
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-600">{description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </NourishShell>
  );
}
