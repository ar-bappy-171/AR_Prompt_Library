"use client";

import * as React from "react";
import {
  BarChart3,
  BookOpen,
  Download,
  Heart,
  Library,
  Plus,
  Settings2,
  ShieldCheck,
  Sparkles,
  Upload,
  Vault,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { InstallAppButton } from "./pwa";
import { storageSizeOf } from "@/lib/prompt-vault/utils";

export function GradientWord({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={className}
      style={{
        background: "linear-gradient(115deg, oklch(0.54 0.247 293), oklch(0.62 0.24 340))",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        color: "transparent",
      }}
    >
      {children}
    </span>
  );
}

export function Sidebar() {
  const prompts = useVaultStore((s) => s.prompts);
  const categories = useVaultStore((s) => s.categories);
  const favorites = useVaultStore((s) => s.favorites);
  const filter = useVaultStore((s) => s.filter);
  const setFilter = useVaultStore((s) => s.setFilter);
  const openEditor = useVaultStore((s) => s.openEditor);
  const setTemplatesOpen = useVaultStore((s) => s.setTemplatesOpen);
  const setAnalyticsOpen = useVaultStore((s) => s.setAnalyticsOpen);
  const setCategoriesOpen = useVaultStore((s) => s.setCategoriesOpen);
  const setCollectionsOpen = useVaultStore((s) => s.setCollectionsOpen);
  const setSecurityOpen = useVaultStore((s) => s.setSecurityOpen);
  const collections = useVaultStore((s) => s.collections);
  const hasPin = Boolean(useVaultStore((s) => s.security?.pinHash));

  const counts = React.useMemo(() => {
    const byCat = new Map<string, number>();
    for (const p of prompts) byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1);
    return byCat;
  }, [prompts]);

  const size = React.useMemo(
    () => storageSizeOf({ prompts, categories, favorites, customOrder: [] }),
    [prompts, categories, favorites]
  );

  const navItem = (
    key: string,
    active: boolean,
    onClick: () => void,
    icon: React.ReactNode,
    label: string,
    count?: number,
    dotColor?: string
  ) => (
    <button
      key={key}
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "bg-primary/10 text-primary dark:bg-primary/15"
          : "text-foreground/75 hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <span className="flex size-5 items-center justify-center">{icon}</span>
      <span className="flex-1 truncate text-left">{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] font-semibold tabular-nums",
            active ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          {count}
        </span>
      )}
      {dotColor && <span className="size-1.5 rounded-full" style={{ background: dotColor }} />}
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <aside className="sticky top-0 hidden h-dvh w-[272px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar/70 backdrop-blur-sm lg:flex">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 pt-5 pb-4">
          <div className="brand-gradient flex size-10 items-center justify-center rounded-xl text-primary-foreground shadow-md shadow-primary/25">
            <Vault className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-lg leading-tight font-bold tracking-tight">
              Prompt <GradientWord>Vault</GradientWord>
            </h1>
            <p className="text-[11px] font-medium text-muted-foreground">AI prompt manager</p>
          </div>
        </div>

        <div className="px-4 pb-3">
          <Button
            onClick={() => openEditor(null)}
            className="brand-gradient w-full gap-2 rounded-xl font-semibold text-white shadow-md shadow-primary/25 transition-transform hover:scale-[1.015] active:scale-[0.99]"
            size="lg"
          >
            <Plus className="size-4.5" aria-hidden="true" />
            New Prompt
            <kbd className="ml-auto hidden rounded border border-white/25 bg-white/10 px-1.5 py-0.5 text-[10px] font-medium text-white/85 xl:inline">
              Ctrl N
            </kbd>
          </Button>
        </div>

        <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-4 pb-4" aria-label="Vault navigation">
          {/* Library */}
          <div className="space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              Library
            </p>
            {navItem("all", filter === "all", () => setFilter("all"), <Library className="size-4.5" />, "All Prompts", prompts.length)}
            {navItem(
              "favorites",
              filter === "favorites",
              () => setFilter("favorites"),
              <Heart className={cn("size-4.5", filter === "favorites" && "fill-current")} />,
              "Favorites",
              favorites.length
            )}
            {navItem("templates", false, () => setTemplatesOpen(true), <Sparkles className="size-4.5" />, "Templates")}
            {navItem("collections", false, () => setCollectionsOpen(true), <BookOpen className="size-4.5" />, "Collections", collections.length)}
            {navItem("analytics", false, () => setAnalyticsOpen(true), <BarChart3 className="size-4.5" />, "Analytics")}
            {navItem(
              "privacy",
              false,
              () => setSecurityOpen(true),
              <ShieldCheck className={cn("size-4.5", hasPin && "text-emerald-500")} />,
              "Privacy Lock"
            )}
          </div>

          {/* Categories */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-3 pb-1">
              <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Categories
              </p>
              <Button
                variant="ghost"
                size="iconSm"
                className="size-6 text-muted-foreground hover:text-foreground"
                onClick={() => setCategoriesOpen(true)}
                aria-label="Manage categories"
              >
                <Settings2 className="size-3.5" />
              </Button>
            </div>
            {categories.map((c) =>
              navItem(
                `cat-${c.id}`,
                filter === c.id,
                () => setFilter(c.id),
                <CategoryIcon icon={c.icon} className="size-4.5" />,
                c.name,
                counts.get(c.id) ?? 0,
                c.color
              )
            )}
          </div>
        </nav>

        <Separator className="opacity-70" />

        {/* Footer */}
        <div className="space-y-3 px-4 py-4">
          <InstallAppButton className="w-full" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => document.getElementById("pv-import-file")?.click()}
            >
              <Upload className="size-3.5" /> Import
            </Button>
            <ExportButton />
          </div>
          <div className="flex items-center justify-between gap-2 px-1 text-[11px] text-muted-foreground">
            <Badge variant="secondary" className="gap-1 font-normal">
              <Wand2 className="size-3" /> {size} local
            </Badge>
            <Badge
              variant="secondary"
              className="gap-1 border-emerald-500/25 bg-emerald-500/10 font-normal text-emerald-600 dark:text-emerald-400"
            >
              <ShieldCheck className="size-3" /> v2.1
            </Badge>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function ExportButton() {
  const exportBundle = useVaultStore((s) => s.exportBundle);
  return (
    <Button
      variant="outline"
      size="sm"
      className="flex-1 gap-1.5"
      onClick={() => {
        const bundle = exportBundle();
        const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `prompt-vault-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      }}
    >
      <Download className="size-3.5" /> Export
    </Button>
  );
}
