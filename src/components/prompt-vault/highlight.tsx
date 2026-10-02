"use client";

import * as React from "react";

/**
 * Highlights occurrences of `query` inside `text` with a subtle mark.
 * Splits on fixed string matches (case-insensitive), not regex.
 */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) return <>{text}</>;

  const parts: React.ReactNode[] = [];
  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  let i = 0;
  let key = 0;

  while (i < text.length) {
    const idx = lower.indexOf(needle, i);
    if (idx === -1) {
      parts.push(text.slice(i));
      break;
    }
    if (idx > i) parts.push(text.slice(i, idx));
    parts.push(
      <mark
        key={key++}
        className="rounded-[4px] bg-primary/15 px-0.5 font-medium text-primary dark:bg-primary/25"
      >
        {text.slice(idx, idx + needle.length)}
      </mark>
    );
    i = idx + needle.length;
  }

  return <>{parts}</>;
}
