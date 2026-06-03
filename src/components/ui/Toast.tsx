"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, X, AlertCircle, Sparkles } from "lucide-react";
import { clsx } from "clsx";

// Small in-app toast / "reward" notification system. Designed to feel
// satisfying ("Saved!", "Created 5 recipe ideas") without being noisy.
//
// Usage:
//   const toast = useToast();
//   toast.success("Saved to your recipe box");
//   toast.reward("Created 5 recipe ideas 🎉");
//   toast.info("Added 3 items to Grocery");
//   toast.error("Couldn't generate a recipe — try again");

type ToastKind = "success" | "info" | "reward" | "error";

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  success: (msg: string) => void;
  info: (msg: string) => void;
  reward: (msg: string) => void;
  error: (msg: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++counter.current;
    setItems((prev) => [...prev, { id, kind, message }]);
    // Auto-dismiss; errors stick a bit longer so the user can read them.
    const ttl = kind === "error" ? 5000 : 3000;
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, ttl);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m) => push("success", m),
      info: (m) => push("info", m),
      reward: (m) => push("reward", m),
      error: (m) => push("error", m),
    }),
    [push],
  );

  function dismiss(id: number) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed left-1/2 top-4 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-3 sm:left-auto sm:right-6 sm:top-6 sm:translate-x-0"
      >
        {items.map((t) => (
          <ToastView key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Fallback no-op so components don't crash if used outside the
    // provider (e.g. in tests, isolated stories).
    return {
      success: () => {},
      info: () => {},
      reward: () => {},
      error: () => {},
    };
  }
  return ctx;
}

function ToastView({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    // tiny stagger so the entry animation runs
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, []);

  const style = (() => {
    switch (item.kind) {
      case "success":
        return {
          ring: "ring-emerald-200",
          bg: "bg-emerald-600",
          icon: <Check size={14} />,
        };
      case "reward":
        return {
          ring: "ring-violet-200",
          bg: "bg-violet-600",
          icon: <Sparkles size={14} />,
        };
      case "error":
        return {
          ring: "ring-red-200",
          bg: "bg-red-600",
          icon: <AlertCircle size={14} />,
        };
      default:
        return {
          ring: "ring-stone-200",
          bg: "bg-stone-800",
          icon: <Check size={14} />,
        };
    }
  })();

  return (
    <div
      role="status"
      className={clsx(
        "pointer-events-auto flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm shadow-lg ring-1 transition-all duration-200 motion-reduce:transition-none",
        style.ring,
        show ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
      )}
    >
      <span
        className={clsx(
          "grid h-6 w-6 place-items-center rounded-full text-white",
          style.bg,
        )}
        aria-hidden
      >
        {style.icon}
      </span>
      <span className="text-stone-800">{item.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-1 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
        aria-label="Dismiss notification"
      >
        <X size={12} />
      </button>
    </div>
  );
}
