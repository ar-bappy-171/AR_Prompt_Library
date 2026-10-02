"use client";

import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  GripVertical,
  Info,
  SearchX,
  Trash2,
  Vault,
  X,
} from "lucide-react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useVaultStore } from "@/lib/prompt-vault/store";
import type { Prompt } from "@/lib/prompt-vault/types";
import {
  categoryById,
  copyText,
  estimateTokens,
  filterAndSortPrompts,
  wordCount,
} from "@/lib/prompt-vault/utils";
import { cn } from "@/lib/utils";
import { PromptCard } from "./prompt-card";
import { PromptCoverCard } from "./prompt-cover-card";
import { PromptListItem } from "./prompt-list-item";

const PAGE_SIZE = 12;

export function PromptGallery() {
  const hydrated = useVaultStore((s) => s.hydrated);
  const prompts = useVaultStore((s) => s.prompts);
  const categories = useVaultStore((s) => s.categories);
  const favorites = useVaultStore((s) => s.favorites);
  const customOrder = useVaultStore((s) => s.customOrder);
  const filter = useVaultStore((s) => s.filter);
  const query = useVaultStore((s) => s.query);
  const sort = useVaultStore((s) => s.sort);
  const page = useVaultStore((s) => s.page);
  const setPage = useVaultStore((s) => s.setPage);
  const view = useVaultStore((s) => s.view);
  const reorderPrompts = useVaultStore((s) => s.reorderPrompts);
  const openEditor = useVaultStore((s) => s.openEditor);
  const loadSample = useVaultStore((s) => s.loadSample);
  const setQuery = useVaultStore((s) => s.setQuery);
  const setFilter = useVaultStore((s) => s.setFilter);
  const selectionMode = useVaultStore((s) => s.selectionMode);
  const selected = useVaultStore((s) => s.selected);
  const clearSelection = useVaultStore((s) => s.clearSelection);
  const deleteMany = useVaultStore((s) => s.deleteMany);
  const requestConfirm = useVaultStore((s) => s.requestConfirm);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const filtered = React.useMemo(
    () => filterAndSortPrompts(prompts, { query, filter, favorites, sort, customOrder }),
    [prompts, query, filter, favorites, sort, customOrder]
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const stats = React.useMemo(() => {
    const words = filtered.reduce((acc, p) => acc + wordCount(p.content), 0);
    const tokens = filtered.reduce((acc, p) => acc + estimateTokens(p.content), 0);
    return { words, tokens };
  }, [filtered]);

  const catName = React.useMemo(() => {
    if (filter === "all") return null;
    if (filter === "favorites") return "Favorites";
    return categoryById(categories, filter)?.name ?? null;
  }, [filter, categories]);

  const dragEnabled = sort === "custom";

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = paged.map((p) => p.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    reorderPrompts(arrayMove(ids, from, to));
  };

  /* ------------------------------ loading state ----------------------------- */
  if (!hydrated) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-2xl border bg-card p-4">
            <Skeleton className="h-4 w-24 rounded-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-12 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  /* ------------------------------- empty states ------------------------------ */
  if (filtered.length === 0) {
    if (prompts.length === 0 && filter === "all" && !query) {
      return (
        <EmptyState
          icon={<Vault className="size-10 text-primary" aria-hidden="true" />}
          title="Your vault is empty"
          subtitle="Save your best AI prompts here so they're always one click away. Everything stays private in your browser."
        >
          <Button onClick={() => openEditor(null)} className="brand-gradient gap-2 rounded-xl font-semibold text-white shadow-md shadow-primary/25">
            Add your first prompt
          </Button>
          <Button variant="outline" className="gap-2 rounded-xl" onClick={() => loadSample()}>
            Load sample prompts
          </Button>
        </EmptyState>
      );
    }
    return (
      <EmptyState
        icon={<SearchX className="size-10 text-muted-foreground/60" aria-hidden="true" />}
        title="No prompts found"
        subtitle={
          query
            ? `Nothing matches “${query}”${catName ? ` in ${catName}` : ""}. Try different keywords or clear the filters.`
            : catName
              ? `${catName} doesn't have any prompts yet.`
              : "Nothing to show here yet."
        }
      >
        <Button
          variant="outline"
          className="gap-2 rounded-xl"
          onClick={() => {
            setQuery("");
            setFilter("all");
          }}
        >
          <X className="size-4" /> Clear search & filters
        </Button>
      </EmptyState>
    );
  }

  /* --------------------------------- content -------------------------------- */
  return (
    <div className="space-y-4">
      {/* results bar */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground tabular-nums">{(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</span>{" "}
          of <span className="font-semibold text-foreground tabular-nums">{filtered.length}</span>
          {catName && (
            <>
              {" "}in <span className="font-medium text-foreground">{catName}</span>
            </>
          )}
        </p>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span className="tabular-nums">{stats.words.toLocaleString()} words</span>
          <span className="hidden size-1 rounded-full bg-border sm:block" />
          <span className="hidden tabular-nums sm:block">≈{stats.tokens.toLocaleString()} tokens</span>
        </div>
      </div>

      {dragEnabled && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-xs text-primary">
          <GripVertical className="size-4 shrink-0" />
          <span>
            <strong className="font-semibold">Custom order:</strong> drag cards by the handle to
            rearrange your vault.
          </span>
        </div>
      )}

      {/* selection toolbar */}
      {selectionMode && (
        <div className="animate-in-item flex items-center gap-2 rounded-xl border bg-card px-4 py-2.5 shadow-sm">
          <span className="text-sm font-medium">
            {selected.length} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            className="ml-auto gap-1.5"
            disabled={selected.length === 0}
            onClick={async () => {
              const text = prompts
                .filter((p) => selected.includes(p.id))
                .map((p) => `# ${p.title}\n\n${p.content}`)
                .join("\n\n──────────\n\n");
              const ok = await copyText(text);
              if (ok) toast.success("Prompts copied", { description: `${selected.length} prompts as one block` });
            }}
          >
            <Copy className="size-3.5" /> Copy
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5"
            disabled={selected.length === 0}
            onClick={() =>
              requestConfirm({
                title: `Delete ${selected.length} prompt${selected.length > 1 ? "s" : ""}?`,
                message: "The selected prompts will be removed from your vault. You can undo this.",
                confirmLabel: "Delete all",
                danger: true,
                onConfirm: () => {
                  deleteMany(selected);
                  clearSelection();
                },
              })
            }
          >
            <Trash2 className="size-3.5" /> Delete
          </Button>
          <Button variant="ghost" size="iconSm" onClick={clearSelection} aria-label="Exit selection mode">
            <X className="size-4" />
          </Button>
        </div>
      )}

      {/* grid / cover / list */}
      {dragEnabled ? (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={paged.map((p) => p.id)}
            strategy={view === "list" ? verticalListSortingStrategy : rectSortingStrategy}
          >
            {view === "list" ? (
              <div className="flex flex-col gap-2.5">
                {paged.map((p) => (
                  <SortableRow key={p.id} id={p.id}>
                    <PromptListItem prompt={p} />
                  </SortableRow>
                ))}
              </div>
            ) : (
              <div
                className={
                  view === "cover"
                    ? "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
                    : "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
                }
              >
                {paged.map((p) => (
                  <SortableCard key={p.id} id={p.id}>
                    {view === "cover" ? <PromptCoverCard prompt={p} /> : <PromptCard prompt={p} />}
                  </SortableCard>
                ))}
              </div>
            )}
          </SortableContext>
        </DndContext>
      ) : view === "list" ? (
        <div className="flex flex-col gap-2.5">
          {paged.map((p) => (
            <PromptListItem key={p.id} prompt={p} />
          ))}
        </div>
      ) : view === "cover" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {paged.map((p) => (
            <PromptCoverCard key={p.id} prompt={p} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {paged.map((p) => (
            <PromptCard key={p.id} prompt={p} />
          ))}
        </div>
      )}

      {/* pagination */}
      {totalPages > 1 && (
        <Pagination
          page={safePage}
          totalPages={totalPages}
          onChange={(p) => {
            setPage(p);
            document.getElementById("pv-content-top")?.scrollIntoView({ behavior: "smooth" });
          }}
        />
      )}

      {filtered.length > 0 && prompts.length > 0 && filtered.length === prompts.length && (
        <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground/70">
          <Info className="size-3.5" />
          Everything is stored privately in your browser — no account, no cloud.
        </div>
      )}
    </div>
  );
}

/* ------------------------------ sortables ------------------------------ */

function SortableCard({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-80 shadow-2xl")}
    >
      {children}
      <button
        type="button"
        aria-label="Drag to reorder"
        className="absolute top-1/2 -left-2.5 z-20 flex size-6 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
    </div>
  );
}

function SortableRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-80 shadow-2xl")}
    >
      {children}
      <button
        type="button"
        aria-label="Drag to reorder"
        className="absolute top-1/2 -left-3 z-20 flex size-6 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md hover:bg-accent active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
    </div>
  );
}

/* ------------------------------ pagination ------------------------------ */

function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = React.useMemo(() => {
    const window = 1;
    const list: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - page) <= window) list.push(i);
      else if (list[list.length - 1] !== "…") list.push("…");
    }
    return list;
  }, [page, totalPages]);

  const btn =
    "flex size-9 items-center justify-center rounded-lg text-sm font-medium transition-colors";

  return (
    <nav className="flex items-center justify-center gap-1 pt-2" aria-label="Pagination">
      <Button
        variant="outline"
        size="iconSm"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-label={`Page ${p}`}
            aria-current={p === page ? "page" : undefined}
            className={cn(
              btn,
              p === page
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {p}
          </button>
        )
      )}
      <Button
        variant="outline"
        size="iconSm"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}

/* ------------------------------ empty state ------------------------------ */

export function EmptyState({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="animate-in-item mx-auto flex max-w-md flex-col items-center px-4 py-16 text-center sm:py-24">
      <div className="relative mb-5">
        <div className="brand-gradient absolute inset-0 scale-150 rounded-full opacity-15 blur-2xl" aria-hidden="true" />
        <div className="relative flex size-20 items-center justify-center rounded-3xl border bg-card shadow-sm">
          {icon}
        </div>
      </div>
      <h2 className="font-display text-xl font-bold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
      {children && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{children}</div>}
    </div>
  );
}
