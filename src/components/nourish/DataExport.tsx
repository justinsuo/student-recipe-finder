"use client";

import { Download, FileJson, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  getDiaryEntries,
  getWeightLog,
  getProfile,
  getTargets,
  getCustomFoods,
} from "@/lib/nourish/storage";
import { entryTotals } from "@/lib/nourish/types";

// ─── Export helpers ───────────────────────────────────────────────────────────

function triggerDownload(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  // Revoke after the current tick so Safari's queued click can still
  // resolve the URL. Revoking synchronously cancels the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function exportJson() {
  const data = {
    exportedAt: new Date().toISOString(),
    profile: getProfile(),
    targets: getTargets(),
    diary: getDiaryEntries(),
    weightLog: getWeightLog(),
    customFoods: getCustomFoods(),
  };
  triggerDownload(
    `nourish-export-${new Date().toISOString().slice(0, 10)}.json`,
    JSON.stringify(data, null, 2),
    "application/json",
  );
}

function exportDiaryCsv() {
  const entries = getDiaryEntries();
  const rows: string[][] = [
    ["Date", "Meal", "Food", "Servings", "Calories", "Protein (g)", "Carbs (g)", "Fat (g)"],
  ];
  for (const e of entries) {
    const t = entryTotals(e);
    rows.push([
      e.date,
      e.meal,
      e.food.name,
      String(e.quantityServings),
      String(Math.round(t.kcal)),
      String(t.proteinG.toFixed(1)),
      String(t.carbG.toFixed(1)),
      String(t.fatG.toFixed(1)),
    ]);
  }
  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
  triggerDownload(
    `nourish-diary-${new Date().toISOString().slice(0, 10)}.csv`,
    csv,
    "text/csv",
  );
}

function exportWeightCsv() {
  const entries = getWeightLog();
  const rows: string[][] = [["Date", "Weight (kg)"]];
  for (const e of entries) {
    rows.push([e.date, String(e.weightKg)]);
  }
  const csv = rows.map((r) => r.join(",")).join("\n");
  triggerDownload(
    `nourish-weight-${new Date().toISOString().slice(0, 10)}.csv`,
    csv,
    "text/csv",
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DataExport() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-stone-900">Export your data</h3>
        <p className="mt-0.5 text-xs text-stone-500">
          Download everything stored on this device. Your data never leaves your browser.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<FileJson size={14} />}
          onClick={exportJson}
          className="w-full justify-start"
        >
          Full export (JSON)
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<FileText size={14} />}
          onClick={exportDiaryCsv}
          className="w-full justify-start"
        >
          Food diary (CSV)
        </Button>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Download size={14} />}
          onClick={exportWeightCsv}
          className="w-full justify-start"
        >
          Weight log (CSV)
        </Button>
      </div>

      <p className="text-[10px] text-stone-400">
        Exported files contain your diary entries, weight log, profile, and custom foods.
        No data is sent to any server.
      </p>
    </div>
  );
}
