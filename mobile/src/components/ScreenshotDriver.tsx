/**
 * Screenshot-tour driver. Mounted only when the shots flag file is present.
 * Seeds demo data, then walks every key screen, announcing each so the capture
 * script can grab a clean device screenshot. No-op in normal use.
 */
import { useEffect, useRef } from "react";
import { router } from "expo-router";
import { shotsConfig, seedDemoData, announce, demoRecipeId } from "~/lib/screenshots";

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function ScreenshotDriver() {
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current || !shotsConfig()?.enabled) return;
    ran.current = true;
    let cancelled = false;

    (async () => {
      seedDemoData();
      await delay(500);
      const rid = demoRecipeId();
      const tour: [string, string][] = [
        ["/", "01-home"],
        ["/ai-chef", "02-ai-chef"],
        ["/pantry", "03-pantry"],
        ["/nourish", "04-nourish"],
        ["/grocery", "05-grocery"],
        ["/recipes", "06-recipes"],
        [`/recipe/${rid}`, "07-recipe-detail"],
        [`/cook/${rid}`, "08-guided-cooking"],
        ["/cheap", "09-cheap"],
        ["/explore", "10-explore"],
        ["/saved", "11-saved"],
        ["/settings", "12-settings"],
      ];
      const per = shotsConfig()?.perRouteMs ?? 3400;
      for (const [path, name] of tour) {
        if (cancelled) return;
        try {
          router.replace(path as never);
        } catch {
          // a route that won't replace cleanly — skip it
          continue;
        }
        await delay(1600); // let the screen + images settle
        await announce(name); // ready to capture
        await delay(Math.max(800, per - 1600));
      }
      await announce("__done__");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
