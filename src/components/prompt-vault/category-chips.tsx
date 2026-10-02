"use client";

import * as React from "react";
import { Heart, LayoutGrid } from "lucide-react";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { cn } from "@/lib/utils";

export function CategoryChips() {
  const prompts = useVaultStore((s) => s.prompts);
  const categories = useVaultStore((s) => s.categories);
  const favorites = useVaultStore((s) => s.favorites);
  const filter = useVaultStore((s) => s.filter);
  const setFilter = useVaultStore((s) => s.setFilter);
  const query = useVaultStore((s) => s.query);

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of prompts) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [prompts]);

  const chip = (
    key: string,
    active: boolean,
    onClick: () => void,
    label: React.ReactNode,
    count?: number,
    color?: string
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-all active:scale-95",
        active
          ? "border-transparent bg-primary text-primary-foreground shadow-md shadow-primary/25"
          : "border-border bg-card/70 text-foreground/80 hover:border-primary/30 hover:bg-accent"
      )}
    >
      {color && <span className="size-2 rounded-full" style={{ background: color }} />}
      {label}
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] leading-4 font-semibold tabular-nums",
            active ? "bg-white/20 text-primary-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="lg:hidden">
      <div
        className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3 pb-2.5"
        role="tablist"
        aria-label="Filter by category"
      >
        {chip(
          "all",
          filter === "all" && !query,
          () => setFilter("all"),
          <>
            <LayoutGrid className="size-3.5" /> All
          </>,
          prompts.length
        )}
        {chip(
          "favorites",
          filter === "favorites",
          () => setFilter("favorites"),
          <>
            <Heart className={cn("size-3.5", filter === "favorites" && "fill-current")} /> Favorites
          </>,
          favorites.length
        )}
        {categories.map((c) =>
          chip(`cat-${c.id}`, filter === c.id, () => setFilter(c.id), c.name, counts.get(c.id) ?? 0, c.color)
        )}
      </div>
      {query && (
        <p className="px-4 pb-2 text-xs text-muted-foreground">
          Filtering results for “<span className="font-medium text-foreground">{query}</span>”
        </p>
      )}
    </div>
  );
}
