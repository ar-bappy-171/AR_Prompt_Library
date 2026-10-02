"use client";

import * as React from "react";
import {
  ArrowDownWideNarrow,
  Grid2x2,
  Image as ImageIcon,
  List,
  Lock,
  Moon,
  Redo2,
  Search,
  ShieldCheck,
  Sun,
  Undo2,
  Vault,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useVaultStore } from "@/lib/prompt-vault/store";
import type { SortKey } from "@/lib/prompt-vault/types";
import { cn } from "@/lib/utils";
import { GradientWord } from "./sidebar";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  title: "Title A–Z",
  rating: "Top rated",
  usage: "Most used",
  custom: "Custom order",
};

export function Topbar() {
  const query = useVaultStore((s) => s.query);
  const setQuery = useVaultStore((s) => s.setQuery);
  const sort = useVaultStore((s) => s.sort);
  const setSort = useVaultStore((s) => s.setSort);
  const view = useVaultStore((s) => s.view);
  const setView = useVaultStore((s) => s.setView);
  const undo = useVaultStore((s) => s.undo);
  const redo = useVaultStore((s) => s.redo);
  const past = useVaultStore((s) => s.past.length);
  const future = useVaultStore((s) => s.future.length);
  const openEditor = useVaultStore((s) => s.openEditor);
  const hasPin = Boolean(useVaultStore((s) => s.security?.pinHash));
  const lock = useVaultStore((s) => s.lock);
  const setSecurityOpen = useVaultStore((s) => s.setSecurityOpen);

  const searchRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="glass sticky top-0 z-30 border-b">
      {/* Row 1 — mobile identity row (hidden on desktop) */}
      <div className="flex items-center gap-2 px-4 pt-3 lg:hidden">
        <div className="brand-gradient flex size-8 items-center justify-center rounded-lg text-primary-foreground shadow-sm">
          <Vault className="size-4" aria-hidden="true" />
        </div>
        <h1 className="font-display text-base font-bold tracking-tight">
          Prompt <GradientWord>Vault</GradientWord>
        </h1>
        <div className="ml-auto flex items-center gap-1">
          <UndoRedoButtons undo={undo} redo={redo} past={past} future={future} compact />
          {hasPin && (
            <Button
              variant="ghost"
              size="iconSm"
              className="size-9 text-muted-foreground hover:text-foreground lg:size-8"
              onClick={lock}
              aria-label="Lock vault now"
              title="Lock now"
            >
              <Lock className="size-4" />
            </Button>
          )}
          {!hasPin && (
            <Button
              variant="ghost"
              size="iconSm"
              className="size-9 text-muted-foreground hover:text-foreground lg:size-8"
              onClick={() => setSecurityOpen(true)}
              aria-label="Privacy lock settings"
              title="Privacy lock"
            >
              <ShieldCheck className="size-4" />
            </Button>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Row 2 — search + tools */}
      <div className="mx-auto flex w-full max-w-[1600px] items-center gap-2 px-4 py-3 sm:px-6 lg:py-3.5">
        <div className="relative min-w-0 flex-1 sm:max-w-xl">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search prompts, tags, content…"
            aria-label="Search prompts"
            className="h-10 rounded-xl border-input/70 bg-card/60 pl-9 pr-20 shadow-sm transition-shadow focus-visible:shadow-md focus-visible:shadow-primary/10 md:h-10"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          ) : (
            <kbd className="absolute top-1/2 right-2.5 hidden -translate-y-1/2 items-center gap-0.5 rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground md:flex">
              Ctrl K
            </kbd>
          )}
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Desktop-only undo/redo + theme */}
          <div className="hidden items-center gap-1 lg:flex">
            <UndoRedoButtons undo={undo} redo={redo} past={past} future={future} />
            {hasPin ? (
              <Button
                variant="ghost"
                size="iconSm"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={lock}
                aria-label="Lock vault now"
                title="Lock now"
              >
                <Lock className="size-4" />
              </Button>
            ) : null}
            <ThemeToggle />
          </div>

          <span className="mx-1 hidden h-6 w-px bg-border lg:block" />

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-10 gap-2 rounded-xl px-3 md:h-10">
                <ArrowDownWideNarrow className="size-4 text-muted-foreground" />
                <span className="hidden text-sm xl:inline">{SORT_LABELS[sort]}</span>
                <span className="xl:hidden">Sort</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuRadioGroup
                value={sort}
                onValueChange={(v) => setSort(v as SortKey)}
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                  <DropdownMenuRadioItem key={k} value={k}>
                    {SORT_LABELS[k]}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View toggle */}
          <div
            className="flex h-10 items-center rounded-xl border bg-card/60 p-1 shadow-sm"
            role="group"
            aria-label="View mode"
          >
            <ViewButton active={view === "grid"} onClick={() => setView("grid")} label="Grid view">
              <Grid2x2 className="size-4" />
            </ViewButton>
            <ViewButton active={view === "cover"} onClick={() => setView("cover")} label="Cover view">
              <ImageIcon className="size-4" />
            </ViewButton>
            <ViewButton active={view === "list"} onClick={() => setView("list")} label="List view">
              <List className="size-4" />
            </ViewButton>
          </div>

          {/* New prompt (desktop — FAB on mobile lives in bottom nav) */}
          <Button
            onClick={() => openEditor(null)}
            className="brand-gradient ml-1 hidden h-10 gap-2 rounded-xl px-4 font-semibold text-white shadow-md shadow-primary/25 lg:inline-flex"
          >
            <PlusIcon />
            New
          </Button>
        </div>
      </div>
    </header>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ViewButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="iconSm"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "rounded-lg",
        active
          ? "bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Button>
  );
}

function UndoRedoButtons({
  undo,
  redo,
  past,
  future,
  compact,
}: {
  undo: () => void;
  redo: () => void;
  past: number;
  future: number;
  compact?: boolean;
}) {
  return (
    <>
      <Button
        variant="ghost"
        size="iconSm"
        onClick={undo}
        disabled={past === 0}
        aria-label="Undo"
        title="Undo (Ctrl+Z)"
        className={cn("text-muted-foreground hover:text-foreground", compact && "size-9")}
      >
        <Undo2 className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="iconSm"
        onClick={redo}
        disabled={future === 0}
        aria-label="Redo"
        title="Redo (Ctrl+Y)"
        className={cn("text-muted-foreground hover:text-foreground", compact && "size-9")}
      >
        <Redo2 className="size-4" />
      </Button>
    </>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="iconSm"
      className="size-9 text-muted-foreground hover:text-foreground lg:size-8"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {mounted ? (
        isDark ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <Moon className="size-4 opacity-0" />
      )}
    </Button>
  );
}
