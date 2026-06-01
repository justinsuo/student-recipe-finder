"use client";

import { normalize, tokenize } from "@/lib/search/searchNormalization";

/**
 * Highlights the parts of `text` that match tokens from `query`. Falls back to
 * plain text if there's no overlap. Returns React nodes that can be embedded
 * inline. Pure presentation.
 */
export function HighlightedMatch({
  text,
  query,
}: {
  text: string;
  query: string;
}) {
  if (!query.trim()) return <>{text}</>;
  const tokens = tokenize(query);
  if (tokens.length === 0) return <>{text}</>;

  const normText = normalize(text);
  // Build segments by scanning the normalized text in chunks
  const matches: Array<{ start: number; end: number }> = [];
  for (const t of tokens) {
    if (t.length < 2) continue;
    let idx = 0;
    while (idx < normText.length) {
      const found = normText.indexOf(t, idx);
      if (found === -1) break;
      matches.push({ start: found, end: found + t.length });
      idx = found + t.length;
    }
  }
  if (matches.length === 0) return <>{text}</>;
  matches.sort((a, b) => a.start - b.start);
  // Merge overlapping ranges
  const merged: Array<{ start: number; end: number }> = [];
  for (const m of matches) {
    const last = merged[merged.length - 1];
    if (last && m.start <= last.end) {
      last.end = Math.max(last.end, m.end);
    } else {
      merged.push({ ...m });
    }
  }
  // Reconstruct using the *original* text by walking with a mirror cursor.
  // We rely on normalize() preserving character count for ASCII food names,
  // which is what we have. If not, fall back to plain.
  if (normText.length !== text.length) return <>{text}</>;
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (let i = 0; i < merged.length; i++) {
    const { start, end } = merged[i];
    if (cursor < start) parts.push(text.slice(cursor, start));
    parts.push(
      <mark
        key={i}
        className="rounded bg-emerald-100 px-0.5 font-semibold text-emerald-900"
      >
        {text.slice(start, end)}
      </mark>,
    );
    cursor = end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return <>{parts}</>;
}
