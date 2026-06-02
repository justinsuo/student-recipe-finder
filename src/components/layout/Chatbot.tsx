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
            "flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
            open ? "bg-stone-900" : "bg-emerald-600",
          )}
          aria-label={open ? "Close chat with Pesto" : "Ask Pesto, the cooking assistant"}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <MessageCircle size={22} />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-3 bottom-24 z-50 mx-auto flex max-h-[72vh] w-auto max-w-md flex-col rounded-3xl border border-stone-200 bg-white shadow-2xl sm:inset-x-auto sm:right-6 sm:left-auto">
          <div className="flex items-center justify-between border-b border-stone-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-900">Pesto</p>
                <p className="text-xs text-stone-500">Cheap-eats AI assistant</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full p-2 text-stone-500 hover:bg-stone-100"
              aria-label="Close"
            >
              <X size={18} />
            </button>
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
                <p className="px-1 pb-2 text-xs font-medium uppercase tracking-wide text-stone-500">
                  Try asking
                </p>
                <div className="flex flex-wrap gap-2">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-xs text-stone-700 hover:border-emerald-300 hover:bg-emerald-50"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            className="flex items-center gap-2 border-t border-stone-200 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a recipe, budget, or pantry…"
              className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm focus:border-emerald-400 focus:bg-white focus:outline-none"
              aria-label="Chat message"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white disabled:opacity-40"
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

// Very small markdown renderer — supports **bold** and basic line breaks
function renderMarkdown(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    parts.push(
      <strong key={`b-${key++}`} className="font-semibold">
        {match[1]}
      </strong>,
    );
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
