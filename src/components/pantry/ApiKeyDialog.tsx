"use client";

import { useEffect, useState } from "react";
import { Key, X, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getApiKey, setApiKey, clearApiKey } from "@/lib/anthropic";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function ApiKeyDialog({ open, onClose, onSaved }: Props) {
  const [value, setValue] = useState("");
  const [existing, setExisting] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      const k = getApiKey();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExisting(k);
      setValue("");
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700">
              <Key size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-stone-900">
                Anthropic API key
              </h2>
              <p className="text-xs text-stone-500">
                Required to enable AI features on this page
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-3 text-sm text-stone-700">
          <p>
            Paste your Anthropic API key to enable photo recognition and
            personalized AI chat. The key is stored only in this browser&apos;s
            localStorage and is sent directly to Anthropic — never to any
            other server.
          </p>
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
          >
            Get an API key <ExternalLink size={12} />
          </a>
        </div>

        {existing && (
          <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            ✅ A key is currently saved (ends in <code>…{existing.slice(-4)}</code>).
          </div>
        )}

        <label className="mt-4 block">
          <span className="text-xs font-medium text-stone-700">
            New API key
          </span>
          <input
            type="password"
            placeholder="sk-ant-…"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
            className="mt-1 w-full rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 font-mono text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
          />
        </label>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {existing && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => {
                clearApiKey();
                setExisting(null);
                onSaved?.();
              }}
            >
              Remove key
            </Button>
          )}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={!value.trim()}
              onClick={() => {
                setApiKey(value.trim());
                onSaved?.();
                onClose();
              }}
            >
              Save key
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
