"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X, Sparkles } from "lucide-react";
import { clsx } from "clsx";
import { chatRespond } from "@/lib/chatbot";
import { useAppStore } from "@/lib/AppStore";
import { RECIPE_MAP } from "@/data/recipes";
import { calculateCostPerServing } from "@/lib/recipeScoring";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  recipeIds?: string[];
}

const STARTER_PROMPTS = [
  "What can I make with rice and eggs?",
  "Cheap high-protein dinner under $2",
  "Vegan meal prep ideas",
  "Quick breakfast under 10 minutes",
];

export function Chatbot() {
  const { pantry, saved } = useAppStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "greet",
      role: "assistant",
      content:
        "Hey! I'm **Pesto**, your cheap-eats kitchen sidekick. Tell me what you're craving, what's in your fridge, or your budget — and I'll find you a meal.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef(0);
  // Hide the floating button while the user is typing in a form field
  // so it doesn't overlap inputs / the mobile keyboard.
  const [hiddenByInput, setHiddenByInput] = useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, open]);

  useEffect(() => {
    function isEditable(t: EventTarget | null): boolean {
      if (!(t instanceof HTMLElement)) return false;
      const tag = t.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || t.isContentEditable;
    }
    function onFocus(e: FocusEvent) {
      if (isEditable(e.target)) setHiddenByInput(true);
    }
    function onBlur(e: FocusEvent) {
      if (isEditable(e.target)) setHiddenByInput(false);
    }
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    const nextId = ++counterRef.current;
    const userMsg: ChatMessage = {
      id: `u-${nextId}`,
      role: "user",
      content: trimmed,
    };
    const reply = chatRespond(trimmed, { pantry, savedRecipeIds: saved });
    const assistantMsg: ChatMessage = {
      id: `a-${nextId}`,
      role: "assistant",
      content: reply.message,
      recipeIds: reply.recipeIds,
    };
    setMessages((m) => [...m, userMsg, assistantMsg]);
    setInput("");
  }

  return (
    <>
      <div
        className={clsx(
          // On mobile we sit above the BottomNav (~76px). At md+ no bottom
          // nav exists, so we drop back to the original position.
          "group fixed bottom-24 right-4 z-50 flex items-center gap-2 transition-opacity md:bottom-6 md:right-6",
          // Safe area: extra room on iOS so the button doesn't sit on the
          // home indicator.
          "pb-[env(safe-area-inset-bottom)]",
          // Don't obscure inputs while typing — but keep it interactive
          // when the panel is open.
          hiddenByInput && !open && "pointer-events-none opacity-0",
        )}
      >
        {/* Tooltip — visible on hover/focus */}
        <span
          role="tooltip"
          className={clsx(
            "pointer-events-none rounded-full bg-stone-900 px-2.5 py-1 text-xs font-medium text-white shadow opacity-0 transition-opacity duration-150",
            !open && "group-hover:opacity-100 group-focus-within:opacity-100",
          )}
        >
          Ask Pesto
        </span>
        <button
          onClick={() => setOpen((o) => !o)}
          className={clsx(
            "relative flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
            open
              ? "bg-stone-900"
              : "bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-300/40",
          )}
          aria-label={
            open
              ? "Close chat with Pesto"
              : "Ask Pesto, the cooking assistant"
          }
          aria-expanded={open}
        >
          {!open && (
            <span
              aria-hidden
              className="absolute inset-0 rounded-full motion-safe:animate-[pulseGlow_2.6s_ease-in-out_infinite]"
            />
          )}
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-3 bottom-44 z-50 mx-auto flex max-h-[72vh] w-auto max-w-md flex-col overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-2xl motion-safe:animate-[fadeUp_240ms_ease-out] sm:inset-x-auto sm:bottom-24 sm:right-6 sm:left-auto">
          <div className="relative overflow-hidden border-b border-stone-200 px-4 py-3">
            <div
              aria-hidden
              className="dot-grid pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(circle_at_70%_30%,black,transparent_70%)]"
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-200/60">
                  <Sparkles size={18} />
                  <span
                    aria-hidden
                    className="absolute -bottom-0.5 -right-0.5 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-white bg-emerald-500"
                  />
                </div>
                <div>
                  <p className="text-sm font-semibold text-stone-900">
                    Pesto
                  </p>
                  <p className="text-[11px] text-stone-500">
                    Cheap-eats sidekick · online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
            {messages.length === 1 && (
              <div className="pt-1">
                <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((p, i) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 transition-all motion-safe:hover:-translate-y-px hover:border-emerald-300 hover:bg-emerald-50 motion-safe:animate-[fadeUp_500ms_ease-out_both]"
                      style={{ animationDelay: `${i * 70}ms` }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-stone-200 bg-stone-50/40 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a recipe, budget, or pantry…"
              className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-100"
              aria-label="Chat message"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-sm shadow-emerald-200 transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
              aria-label="Send"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={clsx("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={clsx(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "bg-emerald-600 text-white"
            : "bg-stone-100 text-stone-800",
        )}
      >
        <div className="whitespace-pre-wrap leading-relaxed">
          {renderMarkdown(message.content)}
        </div>
        {message.recipeIds && message.recipeIds.length > 0 && (
          <div className="mt-3 space-y-2">
            {message.recipeIds.map((id) => {
              const r = RECIPE_MAP.get(id);
              if (!r) return null;
              return (
                <Link
                  key={id}
                  href={`/recipes/${id}`}
                  className="flex items-center gap-3 rounded-xl bg-white px-3 py-2 text-stone-800 shadow-sm transition-colors hover:bg-emerald-50"
                >
                  <span className="text-2xl">{r.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.name}</p>
                    <p className="text-xs text-stone-500">
                      ${calculateCostPerServing(r).toFixed(2)}/serving · {r.totalTimeMinutes} min
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// Very small markdown renderer — supports **bold** and basic line breaks.
// Keys include the match index so two `renderMarkdown` calls in the same
// parent tree don't collide on `b-0`, `b-1`, ...
function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <strong key={`b-${match.index}`} className="font-semibold">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
