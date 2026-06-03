"use client";

import { useEffect, useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import {
  clearLocation,
  getLocation,
  listRegions,
  setLocationFromZip,
  setLocationManual,
} from "@/lib/pricing/locationStorage";
import { getRegion } from "@/lib/pricing/regions";
import { Button } from "@/components/ui/Button";

interface Props {
  variant?: "compact" | "card";
  onChange?: () => void;
}

/**
 * Lets the user set a ZIP code or pick a region directly. All values stored
 * in localStorage only.
 */
export function LocationSetup({ variant = "card", onChange }: Props) {
  const [regionId, setRegionId] = useState("national");
  const [zip, setZip] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const loc = getLocation();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRegionId(loc.regionId);
    if (loc.zipCode) setZip(loc.zipCode);
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const region = getRegion(regionId);

  function applyZip() {
    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) return;
    const loc = setLocationFromZip(trimmed);
    setRegionId(loc.regionId);
    onChange?.();
  }

  function applyRegion(id: string) {
    setRegionId(id);
    setLocationManual(id);
    onChange?.();
  }

  function reset() {
    setRegionId("national");
    setZip("");
    clearLocation();
    onChange?.();
  }

  const isCompact = variant === "compact";

  return (
    <section
      className={
        isCompact
          ? "rounded-2xl border border-stone-200 bg-white p-3"
          : "rounded-3xl border border-stone-200 bg-white p-5 sm:p-6"
      }
    >
      <div className="flex items-start gap-2">
        <div className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-sky-100 text-sky-700">
          <MapPin size={16} />
        </div>
        <div className="flex-1">
          <p
            className={
              isCompact
                ? "text-xs font-semibold uppercase tracking-wide text-stone-700"
                : "text-sm font-semibold uppercase tracking-wide text-stone-700"
            }
          >
            Local pricing
          </p>
          <p className="text-xs text-stone-600">
            Recipe costs use your region. Current:{" "}
            <span className="font-semibold text-stone-900">
              {region.label} (×{region.multiplier.toFixed(2)})
            </span>
          </p>
        </div>
        {regionId !== "national" && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Trash2 size={12} />}
            onClick={reset}
            title="Clear ZIP and use national-average pricing"
          >
            Reset pricing location
          </Button>
        )}
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_2fr]">
        <div>
          <label className="text-xs font-medium text-stone-700">
            ZIP code
          </label>
          <div className="mt-1 flex gap-2">
            <input
              value={zip}
              onChange={(e) => setZip(e.target.value)}
              maxLength={5}
              inputMode="numeric"
              placeholder="94720"
              className="w-full rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
            <Button onClick={applyZip} size="sm" disabled={!/^\d{5}$/.test(zip)}>
              Use
            </Button>
          </div>
          <p className="mt-1 text-[11px] text-stone-500">
            We don&apos;t send your ZIP anywhere — stored only in this browser.
          </p>
        </div>
        <div>
          <label className="text-xs font-medium text-stone-700">
            Or pick a region
          </label>
          <select
            value={regionId}
            onChange={(e) => applyRegion(e.target.value)}
            className="mt-1 w-full rounded-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
          >
            {listRegions().map((r) => (
              <option key={r.id} value={r.id}>
                {r.label} (×{r.multiplier.toFixed(2)})
              </option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
