"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search, X, Clock4, Sparkles, Tag, Carrot, ChefHat } from "lucide-react";
import { clsx } from "clsx";
import type { Recipe } from "@/lib/types";
import {
  buildRecipeIndex,
  suggestForQuery,
  type SearchScope,
} from "@/lib/search/recipeSearch";
import {
  TRENDING_SUGGESTIONS,
  addRecentSearch,
  clearRecentSearches,
  getRecentSearches,
  removeRecentSearch,
} from "@/lib/search/recentSearches";
import { HighlightedMatch } from "./HighlightedMatch";

interface Props {
  recipes: Recipe[];
  value: string;
  onChange: (v: string) => void;
  scope?: SearchScope;
  onScopeChange?: (s: SearchScope) => void;
  placeholder?: string;
  /**
   * Whether the parent has zero results given current filters + query —
   * if true, we'll show the zero-state suggestions in the dropdown too.
   */
  zeroResults?: boolean;
}

interface Suggestion {
  kind: "recipe" | "ingredient" | "tag" | "recent" | "trending";
  value: string;
  recipeId?: string;
}

const SCOPES: { value: SearchScope; label: string }[] = [
  { value: "all", label: "All" },
  { value: "names", label: "Names" },
  { value: "ingredients", label: "Ingredients" },
  { value: "tags", label: "Tags" },
];

const KIND_META: Record<
  Suggestion["kind"],
  { label: string; icon: React.ReactNode; tone: string }
> = {
  recipe: { label: "Recipe", icon: <ChefHat size={11} />, tone: "text-emerald-700" },
  ingredient: { label: "Ingredient", icon: <Carrot size={11} />, tone: "text-amber-700" },
  tag: { label: "Tag", icon: <Tag size={11} />, tone: "text-violet-700" },
  recent: { label: "Recent", icon: <Clock4 size={11} />, tone: "text-stone-500" },
  trending: { label: "Trending", icon: <Sparkles size={11} />, tone: "text-sky-700" },
};

export function SmartRecipeSearch({
  recipes,
  value,
  onChange,
  scope = "all",
  onScopeChange,
  placeholder = "Search recipes, ingredients, tags…",
}: Props) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRecents(getRecentSearches());
  }, []);

  // Build the recipe index once per recipes-array identity
  const index = useMemo(() => buildRecipeIndex(recipes), [recipes]);

  // Compute suggestions (typed query OR empty-state recents/trending)
  const suggestions: Suggestion[] = useMemo(() => {
    if (!value.trim()) {
      const recent = recents.slice(0, 5).map((v) => ({
        kind: "recent" as const,
        value: v,
      }));
      const trending = TRENDING_SUGGESTIONS.slice(0, 6).map((v) => ({
        kind: "trending" as const,
        value: v,
      }));
      return [...recent, ...trending];
    }
    const { recipes: r, ingredients, tags } = suggestForQuery(value, index, 4);
    const out: Suggestion[] = [];
    for (const x of r) out.push({ kind: "recipe", value: x.value, recipeId: x.recipeId });
    for (const x of ingredients) out.push({ kind: "ingredient", value: x });
    for (const x of tags) out.push({ kind: "tag", value: x });
    return out.slice(0, 10);
  }, [value, recents, index]);

  // Click outside closes
  useEffect(() => {
    function onClickAway(e: MouseEvent) {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickAway);
    return () => document.removeEventListener("mousedown", onClickAway);
  }, []);

  function applySuggestion(s: Suggestion) {
    if (s.kind === "recipe") {
      onChange(s.value);
      addRecentSearch(s.value);
      setRecents(getRecentSearches());
      setOpen(false);
    } else {
      onChange(s.value);
      addRecentSearch(s.value);
      setRecents(getRecentSearches());
      // Keep dropdown open so user sees results live
    }
  }

  function commitOnEnter() {
    const trimmed = value.trim();
    if (trimmed) addRecentSearch(trimmed);
    setRecents(getRecentSearches());
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActiveIndex((i) => Math.min(suggestions.length - 1, i + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(-1, i - 1));
      return;
    }
    if (e.key === "Enter") {
      if (activeIndex >= 0 && suggestions[activeIndex]) {
        e.preventDefault();
        applySuggestion(suggestions[activeIndex]);
      } else {
        commitOnEnter();
      }
    }
  }

  // Group suggestions by kind for display
  const grouped = useMemo(() => {
    const groups: Partial<Record<Suggestion["kind"], Suggestion[]>> = {};
    suggestions.forEach((s) => {
      (groups[s.kind] ??= []).push(s);
    });
    return groups;
  }, [suggestions]);

  // Flat index keeps keyboard nav consistent with grouped rendering order
  const groupOrder: Suggestion["kind"][] = value.trim()
    ? ["recipe", "ingredient", "tag"]
    : ["recent", "trending"];

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={16}
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
        />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-opt-${activeIndex}` : undefined
          }
          className="h-11 w-full rounded-full border border-stone-200 bg-white py-2.5 pl-10 pr-10 text-sm shadow-sm focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        />
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange("");
              inputRef.current?.focus();
            }}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Scope chips */}
      {onScopeChange && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500">
            Search in
          </span>
          {SCOPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => onScopeChange(s.value)}
              aria-pressed={scope === s.value}
              className={clsx(
                "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                scope === s.value
                  ? "bg-emerald-600 text-white"
                  : "border border-stone-200 bg-white text-stone-700 hover:bg-stone-50",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-30 mt-2 max-h-[24rem] w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white shadow-lg"
        >
          {suggestions.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-stone-500">
              Keep typing to see suggestions…
            </div>
          ) : (
            <>
              {groupOrder.map((kind) => {
                const items = grouped[kind];
                if (!items || items.length === 0) return null;
                const meta = KIND_META[kind];
                return (
                  <div
                    key={kind}
                    className="border-b border-stone-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between px-3 pt-2">
                      <p
                        className={clsx(
                          "text-[11px] font-semibold uppercase tracking-wide",
                          meta.tone,
                        )}
                      >
                        {meta.label === "Recent" ? "Recent searches" : meta.label === "Trending" ? "Try a popular search" : meta.label}
                      </p>
                      {kind === "recent" && recents.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            clearRecentSearches();
                            setRecents([]);
                          }}
                          className="text-[11px] text-stone-500 hover:underline"
                        >
                          Clear all
                        </button>
                      )}
                    </div>
                    <ul>
                      {items.map((s) => {
                        const flatIdx = suggestions.indexOf(s);
                        const active = flatIdx === activeIndex;
                        return (
                          <li
                            key={`${kind}-${s.value}`}
                            id={`${listboxId}-opt-${flatIdx}`}
                            role="option"
                            aria-selected={active}
                          >
                            <button
                              type="button"
                              onMouseEnter={() => setActiveIndex(flatIdx)}
                              onClick={() => applySuggestion(s)}
                              className={clsx(
                                "flex w-full items-center gap-2 px-3 py-2 text-left text-sm",
                                active ? "bg-emerald-50" : "hover:bg-stone-50",
                              )}
                            >
                              <span className="text-stone-400">{meta.icon}</span>
                              <span className="flex-1 truncate text-stone-800">
                                {value.trim() ? (
                                  <HighlightedMatch text={s.value} query={value} />
                                ) : (
                                  s.value
                                )}
                              </span>
                              {kind === "recent" && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeRecentSearch(s.value);
                                    setRecents(getRecentSearches());
                                  }}
                                  aria-label={`Remove ${s.value} from recents`}
                                  className="rounded-full p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                                >
                                  <X size={11} />
                                </button>
                              )}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
