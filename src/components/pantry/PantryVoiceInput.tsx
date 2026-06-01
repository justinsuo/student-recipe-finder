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
  isAiEnabled,
  recognizeIngredientsFromText,
  type VisionResult,
} from "@/lib/anthropic";
import { INGREDIENT_MAP } from "@/data/ingredients";

// --- Web Speech API types (minimal, since lib.dom doesn't include these) ---

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
  readonly message?: string;
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
  const [result, setResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const Ctor = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!Ctor);
  }, []);

  if (!isAiEnabled() || !supported) return null;

  function start() {
    setError(null);
    setResult(null);
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

    let finalText = "";
    rec.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        const t = r[0].transcript;
        if (r.isFinal) finalText += t;
        else interimText += t;
      }
      if (finalText) setTranscript((prev) => (prev + " " + finalText).trim());
      finalText = "";
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
    // Use the accumulated transcript to extract ingredients
    const finalTranscript = (transcript + " " + interim).trim();
    if (finalTranscript) extractIngredients(finalTranscript);
  }

  async function extractIngredients(text: string) {
    setProcessing(true);
    setError(null);
    try {
      const res = await recognizeIngredientsFromText(text);
      const valid = res.recognized.filter((r) => INGREDIENT_MAP.has(r.id));
      setResult({
        ...res,
        recognized: valid,
        unrecognized: [
          ...res.unrecognized,
          ...res.recognized
            .filter((r) => !INGREDIENT_MAP.has(r.id))
            .map((r) => r.name),
        ],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't process voice input");
    } finally {
      setProcessing(false);
    }
  }

  function addAll() {
    if (!result) return;
    const next = new Set(addedIds);
    for (const r of result.recognized) {
      if (!pantry.some((p) => p.ingredientId === r.id)) {
        addPantryItem({ ingredientId: r.id });
      }
      next.add(r.id);
    }
    setAddedIds(next);
  }

  function reset() {
    setTranscript("");
    setInterim("");
    setResult(null);
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
          Hit the mic, say what you have — &ldquo;rice, eggs, some peanut
          butter, frozen veg, two tortillas&rdquo; — and we&apos;ll add them.
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
        {(transcript || result || error) && (
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
          <Loader2 size={16} className="animate-spin" /> Picking out
          ingredients…
        </div>
      )}

      {error && (
        <div className="mt-3 flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle size={16} className="mt-0.5 flex-none" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <div className="rounded-2xl bg-white p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-stone-900">
                Recognized ({result.recognized.length})
              </h3>
              {result.recognized.length > 0 && (
                <Button
                  size="sm"
                  onClick={addAll}
                  leftIcon={<Plus size={14} />}
                >
                  Add all to pantry
                </Button>
              )}
            </div>
            {result.recognized.length === 0 ? (
              <p className="mt-2 text-sm text-stone-600">
                Didn&apos;t catch any catalog ingredients. Try again or add
                items manually.
              </p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {result.recognized.map((r) => {
                  const ing = INGREDIENT_MAP.get(r.id);
                  const already =
                    addedIds.has(r.id) ||
                    pantry.some((p) => p.ingredientId === r.id);
                  return (
                    <button
                      key={r.id}
                      disabled={already}
                      onClick={() => {
                        addPantryItem({ ingredientId: r.id });
                        setAddedIds(new Set([...addedIds, r.id]));
                      }}
                      className={
                        already
                          ? "inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700"
                          : "inline-flex items-center gap-1 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs font-medium text-stone-800 hover:border-emerald-300 hover:bg-emerald-50"
                      }
                    >
                      {already ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Plus size={12} />
                      )}
                      {ing?.name ?? r.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {result.unrecognized.length > 0 && (
            <div className="rounded-2xl bg-amber-50 p-4">
              <h3 className="text-sm font-semibold text-amber-900">
                Not in our catalog ({result.unrecognized.length})
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.unrecognized.map((u, i) => (
                  <span
                    key={`${u}-${i}`}
                    className="rounded-full bg-white px-3 py-1.5 text-xs text-amber-900"
                  >
                    {u}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
