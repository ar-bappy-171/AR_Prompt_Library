"use client";

import * as React from "react";
import { BarChart3, BookOpen, Heart, Library, Plus, Sparkles } from "lucide-react";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const filter = useVaultStore((s) => s.filter);
  const setFilter = useVaultStore((s) => s.setFilter);
  const openEditor = useVaultStore((s) => s.openEditor);
  const setTemplatesOpen = useVaultStore((s) => s.setTemplatesOpen);
  const setAnalyticsOpen = useVaultStore((s) => s.setAnalyticsOpen);
  const setCollectionsOpen = useVaultStore((s) => s.setCollectionsOpen);
  const favorites = useVaultStore((s) => s.favorites);
  const collections = useVaultStore((s) => s.collections);

  const item = (
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    badge?: number
  ) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-full flex-col items-center justify-center gap-0.5 px-0.5 transition-colors",
        active ? "text-primary" : "text-muted-foreground active:text-foreground"
      )}
    >
      <span className="relative">
        {icon}
        {typeof badge === "number" && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-4 rounded-full bg-primary px-1 text-center text-[9px] leading-4 font-bold text-primary-foreground">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span className="text-[10px] leading-none font-medium">{label}</span>
      {active && <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-primary" />}
    </button>
  );

  return (
    <nav
      aria-label="Primary"
      className="glass fixed inset-x-0 bottom-0 z-40 border-t pb-safe lg:hidden"
    >
      {/* Center FAB — anchored to the nav itself so it stays perfectly centered */}
      <button
        type="button"
        onClick={() => openEditor(null)}
        aria-label="Create new prompt"
        className="brand-gradient absolute -top-6 left-1/2 z-10 flex size-14 -translate-x-1/2 items-center justify-center rounded-full text-white shadow-lg shadow-primary/40 ring-4 ring-background transition-transform hover:scale-105 active:scale-95"
      >
        <Plus className="size-6" strokeWidth={2.4} aria-hidden="true" />
      </button>

      <div className="grid h-16 grid-cols-6">
        {item(filter === "all", () => setFilter("all"), <Library className="size-5" />, "Prompts")}
        {item(
          filter === "favorites",
          () => setFilter("favorites"),
          <Heart className={cn("size-5", filter === "favorites" && "fill-current")} />,
          "Favorites",
          favorites.length
        )}

        {/* spacer under the FAB */}
        <div className="flex items-end justify-center pb-2">
          <span className="text-[10px] font-medium text-muted-foreground">New</span>
        </div>

        {item(false, () => setCollectionsOpen(true), <BookOpen className="size-5" />, "Sets", collections.length)}
        {item(false, () => setTemplatesOpen(true), <Sparkles className="size-5" />, "Templates")}
        {item(false, () => setAnalyticsOpen(true), <BarChart3 className="size-5" />, "Stats")}
      </div>
    </nav>
  );
}
