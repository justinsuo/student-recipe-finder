"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { AlertTriangle, X } from "lucide-react";
import { clsx } from "clsx";
import { Button } from "@/components/ui/Button";

/**
 * Shared confirm/destructive-action dialog. Bottom-sheet on mobile,
 * centered on desktop. Used for bulk inserts (pantry presets, "Add N
 * missing items"), and destructive clears (clear pantry / grocery /
 * diary). Honest copy + per-tone styling so the user knows when an
 * action is reversible vs. when it isn't.
 *
 * Wired for keyboard:
 *   - Escape closes
 *   - Confirm button receives focus on open
 *   - Tab cycle stays inside the dialog
 *   - Outside click closes (matches the rest of the app's modal
 *     conventions)
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    previouslyFocused.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previouslyFocused.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        aria-hidden
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-body"
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl motion-safe:animate-[fadeUp_220ms_ease-out] sm:rounded-3xl"
      >
        <div className="flex items-start gap-3 border-b border-stone-100 px-5 py-4">
          <div
            className={clsx(
              "grid h-10 w-10 flex-none place-items-center rounded-xl text-white shadow-sm",
              destructive
                ? "bg-gradient-to-br from-red-500 to-red-700 shadow-red-200"
                : "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-200",
            )}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p
              className={clsx(
                "text-[10px] font-semibold uppercase tracking-[0.14em]",
                destructive ? "text-red-700" : "text-emerald-700",
              )}
            >
              {destructive ? "Heads up" : "Confirm"}
            </p>
            <h2
              id="confirm-title"
              className="text-base font-semibold text-stone-900"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100"
          >
            <X size={16} />
          </button>
        </div>

        <div id="confirm-body" className="px-5 py-4 text-sm leading-relaxed text-stone-700">
          {body}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-stone-100 bg-stone-50/60 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {cancelLabel}
          </Button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={clsx(
              "inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
              destructive
                ? "bg-gradient-to-br from-red-600 to-red-700 shadow-red-200 hover:from-red-700 hover:to-red-800 focus-visible:ring-red-500"
                : "bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-200 hover:from-emerald-700 hover:to-emerald-800 focus-visible:ring-emerald-500",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
