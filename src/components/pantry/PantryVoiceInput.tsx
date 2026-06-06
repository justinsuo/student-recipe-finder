"use client";

import { useEffect, useRef, useState } from "react";
import {
  Mic,
  Square,
  Loader2,
  AlertCircle,
  Plus,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAppStore } from "@/lib/AppStore";
import {
  isWorkerConfigured,
  resolveIngredients,
  type ResolvedIngredient,
} from "@/lib/workerClient";
import {
  findExistingByName,
  getCachedResolution,
  resolvedToCustom,
  saveCustomIngredient,
  setCachedResolution,
} from "@/lib/customIngredientStorage";
import { INGREDIENTS } from "@/data/ingredients";

// --- Web Speech API types ---
interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}
interface SpeechRecognition extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}
declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function PantryVoiceInput() {
  const { addPantryItem, pantry } = useAppStore();
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [processing, setProcessing] = useState(false);
  const [resolved, setResolved] = useState<ResolvedIngredient[] | null>(null);
  const [ignoredText, setIgnoredText] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!Ctor);
  }, []);

  // Stop any active SpeechRecognition on unmount so navigating away
  // mid-listen doesn't leave the microphone held open in the background.
  useEffect(() => {
    return () => {
      const rec = recognitionRef.current;
      if (rec) {
        try {
          rec.stop();
        } catch {
          /* recognition may already be stopped */
        }
        recognitionRef.current = null;
      }
    };
  }, []);

  if (!isWorkerConfigured() || !supported) return null;

  function start() {
    setError(null);
    setResolved(null);
    setIgnoredText([]);
    setAddedIds(new Set());
    setTranscript("");
    setInterim("");

    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Ctor) {
      setError("Speech recognition isn't supported in this browser.");
      return;
    }
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interimText = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r[0].transcript;
        if (r.isFinal) finalText += t;
        else interimText += t;
      }
      if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
      setInterim(interimText);
    };
    rec.onerror = (e) => {
      setError(`Microphone error: ${e.error}`);
      setListening(false);
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  }

  function stop() {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
    const finalTranscript = (transcript + " " + interim).trim();
    if (finalTranscript) resolve(finalTranscript);
  }

  async function resolve(text: string) {
    setProcessing(true);
    setError(null);
    try {
      // Cache lookup so the same phrase doesn't ping the worker twice
      let items = getCachedResolution(text);
      if (!items) {
        const result = await resolveIngredients(text, "voice");
        items = result.ingredients;
        setIgnoredText(result.ignoredText || []);
        setCachedResolution(text, items);
      }
      setResolved(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't process voice input");
    } finally {
      setProcessing(false);
    }
  }

  function addOne(r: ResolvedIngredient) {
    // Either reuse an existing built-in/custom id, or create a new custom one
    const existing = findExistingByName(
      r.canonicalName,
      INGREDIENTS.map((i) => ({ name: i.name, id: i.id })),
    );
    let ingredientId: string;
    if (existing) {
      ingredientId = existing.id;
    } else {
      const custom = resolvedToCustom(r);
      saveCustomIngredient(custom);
      ingredientId = custom.id;
    }
    if (!pantry.some((p) => p.ingredientId === ingredientId)) {
      addPantryItem({ ingredientId, useSoon: r.useSoon });
    }
    setAddedIds((prev) => new Set([...prev, r.canonicalName.toLowerCase()]));
  }

  function addAll() {
    if (!resolved) return;
    for (const r of resolved) addOne(r);
  }

  function reset() {
    setTranscript("");
    setInterim("");
    setResolved(null);
    setIgnoredText([]);
    setError(null);
    setAddedIds(new Set());
  }

  return (
    <section className="rounded-3xl border border-sky-200 bg-sky-50/50 p-5 sm:p-6">
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-sky-800">
          <Sparkles size={16} /> Speak your pantry
        </h2>
        <p className="mt-1 text-sm text-sky-900">
          Hit the mic, say what you have — &ldquo;apple cider vinegar, eggs, frozen
          broccoli, some old tortillas&rdquo; — and we&apos;ll keep multi-word
          ingredients together.
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {!listening ? (
          <Button
            onClick={start}
            leftIcon={<Mic size={16} />}
            disabled={processing}
            variant="primary"
          >
            Start speaking
          </Button>
        ) : (
          <Button
            onClick={stop}
            leftIcon={<Square size={16} />}
            variant="danger"
          >
            Stop & add
          </Button>
        )}
        {(transcript || resolved || error) && (
          <Button onClick={reset} variant="ghost" size="sm">
            Clear
          </Button>
        )}
        {listening && (
          <span className="inline-flex items-center gap-2 rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-800">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            Listening…
          </span>
        )}
      </div>

      {(transcript || interim) && (
        <div className="mt-4 rounded-2xl bg-white p-4 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Heard you say
          </p>
          <p className="mt-1 text-stone-800">
            {transcript}
            {interim && <span className="text-stone-400"> {interim}</span>}
          </p>
        </div>
      )}

      {processing && (
        <div className="mt-3 flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm text-sky-800">
          <Loader2 size={16} className="animate-spin" /> Understanding
          ingredients…
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 flex-none" /> {error}
        </div>
      )}

      {resolved && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900">
                Recognized ({resolved.length})
              </h3>
              {resolved.length > 0 && (
                <Button
                  size="sm"
                  onClick={addAll}
                  leftIcon={<Plus size={14} />}
                >
                  Add all to pantry
                </Button>
              )}
            </div>
            {resolved.length === 0 ? (
              <p className="mt-2 text-sm text-stone-600">
                Didn&apos;t pick out any ingredients. Try again or add items
                manually.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {resolved.map((r, idx) => {
                  const key = r.canonicalName.toLowerCase();
                  const already = addedIds.has(key);
                  return (
                    <button
                      key={`${key}-${idx}`}
                      disabled={already}
                      onClick={() => addOne(r)}
                      className={
                        already
                          ? "inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700"
                          : "inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:border-emerald-300 hover:bg-emerald-50"
                      }
                      title={`${r.category} · ${r.ingredientRole}`}
                    >
                      {already ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Plus size={12} />
                      )}
                      {r.displayName || r.canonicalName}
                      {r.useSoon && (
                        <span className="ml-0.5 rounded-full bg-amber-200 px-1.5 text-[10px] font-semibold text-amber-900">
                          use soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {ignoredText.length > 0 && (
            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900">
              Ignored as non-food: {ignoredText.join(", ")}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
