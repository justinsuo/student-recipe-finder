"use client";

import { useState, useEffect } from "react";
import { clsx } from "clsx";
import { Activity, Unlink, ExternalLink, RefreshCw, ToggleLeft, ToggleRight, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  isFitbitConfigured,
  isFitbitConnected,
  startFitbitAuth,
  disconnectFitbit,
} from "@/lib/nourish/fitbitClient";
import {
  isStravaConfigured,
  isStravaConnected,
  startStravaAuth,
  disconnectStrava,
} from "@/lib/nourish/stravaClient";
import {
  getToken,
  getActivitySettings,
  setActivitySettings,
} from "@/lib/nourish/activityStorage";
import type { ActivitySettings } from "@/lib/nourish/activityTypes";

// ─── Provider card ─────────────────────────────────────────────────────────────

interface ProviderCardProps {
  name: string;
  description: string;
  color: string;
  logo: React.ReactNode;
  configured: boolean;
  connected: boolean;
  displayName?: string;
  profileImageUrl?: string;
  onConnect: () => void;
  onDisconnect: () => Promise<void>;
  setupInstructions: string;
}

function ProviderCard({
  name,
  description,
  color,
  logo,
  configured,
  connected,
  displayName,
  profileImageUrl,
  onConnect,
  onDisconnect,
  setupInstructions,
}: ProviderCardProps) {
  const [disconnecting, setDisconnecting] = useState(false);
  const [showSetup, setShowSetup] = useState(false);

  async function handleDisconnect() {
    setDisconnecting(true);
    try {
      await onDisconnect();
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div className={clsx(
      "rounded-2xl border p-4 space-y-3",
      connected ? "border-emerald-200 bg-emerald-50/40" : "border-stone-200 bg-white",
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={clsx("grid h-10 w-10 shrink-0 place-items-center rounded-xl text-white text-lg", color)}>
            {logo}
          </div>
          <div>
            <p className="text-sm font-bold text-stone-900">{name}</p>
            <p className="text-[11px] text-stone-500">{description}</p>
          </div>
        </div>
        <span className={clsx(
          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
          connected ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500",
        )}>
          {connected ? "Connected" : "Not connected"}
        </span>
      </div>

      {connected && (
        <div className="flex items-center gap-2 rounded-xl bg-white border border-stone-100 px-3 py-2">
          {profileImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileImageUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <div className="grid h-7 w-7 place-items-center rounded-full bg-stone-200 text-stone-500">
              <Activity size={13} />
            </div>
          )}
          <div>
            <p className="text-xs font-semibold text-stone-800">{displayName ?? "Connected account"}</p>
            <p className="text-[10px] text-stone-400">Syncing activity data</p>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {connected ? (
          <Button
            variant="danger"
            size="sm"
            leftIcon={disconnecting ? <RefreshCw size={13} className="animate-spin" /> : <Unlink size={13} />}
            onClick={handleDisconnect}
            disabled={disconnecting}
          >
            Disconnect
          </Button>
        ) : configured ? (
          <Button variant="primary" size="sm" leftIcon={<ExternalLink size={13} />} onClick={onConnect}>
            Connect {name}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowSetup((v) => !v)}>
              Setup required
            </Button>
          </div>
        )}
      </div>

      {!configured && showSetup && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 space-y-1">
          <p className="text-xs font-semibold text-amber-800">Setup instructions</p>
          <p className="text-[11px] text-amber-700 leading-relaxed">{setupInstructions}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function ActivityConnections() {
  const [fitbitConnected, setFitbitConnected] = useState(false);
  const [stravaConnected, setStravaConnected] = useState(false);
  const [fitbitToken, setFitbitTokenData] = useState<{ displayName?: string; profileImageUrl?: string } | null>(null);
  const [stravaToken, setStravaTokenData] = useState<{ displayName?: string; profileImageUrl?: string } | null>(null);
  const [settings, setSettings] = useState<ActivitySettings>({
    adjustTargetWithActivity: false,
    activityAdjustmentFraction: 0.7,
  });
  const [hydrated, setHydrated] = useState(false);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const fb = getToken("fitbit");
    const st = getToken("strava");
    setFitbitConnected(isFitbitConnected());
    setStravaConnected(isStravaConnected());
    setFitbitTokenData(fb ? { displayName: fb.displayName, profileImageUrl: fb.profileImageUrl } : null);
    setStravaTokenData(st ? { displayName: st.displayName, profileImageUrl: st.profileImageUrl } : null);
    setSettings(getActivitySettings());
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  function getRedirectUri(): string {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}${window.location.pathname}`;
  }

  function handleFitbitConnect() {
    startFitbitAuth(getRedirectUri()).catch((e) =>
      console.error("Fitbit auth error:", e),
    );
  }

  async function handleFitbitDisconnect() {
    await disconnectFitbit();
    setFitbitConnected(false);
    setFitbitTokenData(null);
  }

  function handleStravaConnect() {
    startStravaAuth(getRedirectUri());
  }

  async function handleStravaDisconnect() {
    await disconnectStrava();
    setStravaConnected(false);
    setStravaTokenData(null);
  }

  function handleToggleAdjustment(value: boolean) {
    const next = { ...settings, adjustTargetWithActivity: value };
    setSettings(next);
    setActivitySettings(next);
  }

  if (!hydrated) return null;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
          <Activity size={14} className="text-emerald-600" />
          Activity connections
        </h3>
        <p className="mt-0.5 text-xs text-stone-500">
          Connect your fitness tracker to see daily calorie expenditure alongside your food log.
          Data is labeled as estimated and never stored on any server.
        </p>
      </div>

      <ProviderCard
        name="Fitbit"
        description="Total daily calories burned, steps, active minutes"
        color="bg-[#00B0B9]"
        logo={<span className="font-bold text-sm">F</span>}
        configured={isFitbitConfigured()}
        connected={fitbitConnected}
        displayName={fitbitToken?.displayName}
        profileImageUrl={fitbitToken?.profileImageUrl}
        onConnect={handleFitbitConnect}
        onDisconnect={handleFitbitDisconnect}
        setupInstructions="1. Go to dev.fitbit.com → Register an App. 2. Set Application Type to 'Personal', OAuth 2.0 Application Type to 'Client'. 3. Set Callback URL to this page's URL. 4. Copy Client ID → add NEXT_PUBLIC_FITBIT_CLIENT_ID to your .env.local and redeploy."
      />

      <ProviderCard
        name="Strava"
        description="Workout activities with per-session calorie estimates"
        color="bg-[#FC4C02]"
        logo={<span className="font-bold text-sm">S</span>}
        configured={isStravaConfigured()}
        connected={stravaConnected}
        displayName={stravaToken?.displayName}
        profileImageUrl={stravaToken?.profileImageUrl}
        onConnect={handleStravaConnect}
        onDisconnect={handleStravaDisconnect}
        setupInstructions="1. Go to strava.com/settings/api → Create Application. 2. Set Authorization Callback Domain to this site's domain. 3. Copy Client ID → NEXT_PUBLIC_STRAVA_CLIENT_ID in .env.local. 4. Copy Client Secret → run 'wrangler secret put STRAVA_CLIENT_SECRET' in the worker/ folder. 5. Add STRAVA_CLIENT_ID as a wrangler.toml [vars] entry. Redeploy both."
      />

      {/* Opt-in target adjustment */}
      {(fitbitConnected || stravaConnected) && (
        <div className="rounded-2xl border border-stone-200 bg-white p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-stone-900">Adjust calorie target with activity</p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                When on, a conservative fraction of active calories from your tracker
                is added to today&apos;s target. Off by default.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleToggleAdjustment(!settings.adjustTargetWithActivity)}
              aria-pressed={settings.adjustTargetWithActivity}
              aria-label="Toggle calorie adjustment"
              className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-full"
            >
              {settings.adjustTargetWithActivity
                ? <ToggleRight size={28} className="text-emerald-500" />
                : <ToggleLeft size={28} className="text-stone-300" />}
            </button>
          </div>

          {settings.adjustTargetWithActivity && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 flex items-start gap-2">
              <Info size={13} className="shrink-0 mt-0.5 text-amber-600" />
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Device calorie estimates are frequently overstated.
                Only <strong>{Math.round(settings.activityAdjustmentFraction * 100)}%</strong> of
                active calories is added to keep the adjustment conservative.
                The Adaptive TDEE (learned from your actual intake + weight trend) remains the
                primary source of truth and is never overwritten.
              </p>
            </div>
          )}
        </div>
      )}

      <p className="text-[10px] text-stone-400 text-center">
        Activity tokens are stored only on this device. Disconnect at any time to remove all data.
        Not medical advice.
      </p>
    </div>
  );
}
