"use client";

import * as React from "react";
import {
  Check,
  ChevronRight,
  Copy,
  GripVertical,
  Plus,
  Search,
  SearchX,
  Trash2,
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
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useVaultStore } from "@/lib/prompt-vault/store";
import type { Prompt } from "@/lib/prompt-vault/types";
import { categoryById, copyText } from "@/lib/prompt-vault/utils";
import { cn } from "@/lib/utils";

export function CollectionDetailDialog() {
  const openId = useVaultStore((s) => s.openCollectionId);
  const close = useVaultStore((s) => s.closeCollection);
  const collections = useVaultStore((s) => s.collections);
  const prompts = useVaultStore((s) => s.prompts);
  const categories = useVaultStore((s) => s.categories);
  const setCollectionPrompts = useVaultStore((s) => s.setCollectionPrompts);
  const registerCopy = useVaultStore((s) => s.registerCopy);

  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [pickerQuery, setPickerQuery] = React.useState("");
  const [copied, setCopied] = React.useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const collection = collections.find((c) => c.id === openId) ?? null;

  /* ordered prompts that still exist in the vault */
  const items = React.useMemo(() => {
    if (!collection) return [] as Prompt[];
    const byId = new Map(prompts.map((p) => [p.id, p]));
    return collection.promptIds
      .map((id) => byId.get(id))
      .filter((p): p is Prompt => Boolean(p));
  }, [collection, prompts]);

  const missing = collection ? collection.promptIds.length - items.length : 0;

  /* prompts available to add (not already in collection, matching search) */
  const candidates = React.useMemo(() => {
    if (!collection) return [] as Prompt[];
    const inCol = new Set(collection.promptIds);
    const q = pickerQuery.trim().toLowerCase();
    return prompts
      .filter((p) => !inCol.has(p.id))
      .filter(
        (p) =>
          !q ||
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      );
  }, [collection, prompts, pickerQuery]);

  const handleDragEnd = (event: DragEndEvent) => {
    if (!collection) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = items.map((p) => p.id);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    setCollectionPrompts(collection.id, arrayMove(ids, from, to));
  };

  const removeItem = (promptId: string) => {
    if (!collection) return;
    setCollectionPrompts(
      collection.id,
      collection.promptIds.filter((id) => id !== promptId)
    );
  };

  const addItem = (promptId: string) => {
    if (!collection) return;
    setCollectionPrompts(collection.id, [...collection.promptIds, promptId]);
  };

  const copyAll = async () => {
    if (!collection || items.length === 0) return;
    const block = items
      .map((p, i) => `${i + 1}. ${p.title}\n\n${p.content}`)
      .join("\n\n──────────\n\n");
    const ok = await copyText(block);
    if (ok) {
      items.forEach((p) => registerCopy(p.id));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Playbook copied", {
        description: `${items.length} prompt${items.length === 1 ? "" : "s"} as one ordered block`,
      });
    } else {
      toast.error("Couldn't access the clipboard");
    }
  };

  return (
    <Dialog
      open={Boolean(collection)}
      onOpenChange={(open) => {
        if (!open) {
          close();
          setPickerOpen(false);
          setPickerQuery("");
        }
      }}
    >
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        {collection && (
          <>
            <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4">
              <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    color: collection.color,
                    background: `color-mix(in srgb, ${collection.color} 12%, transparent)`,
                  }}
                >
                  <Copy className="size-4" />
                </span>
                <span className="truncate">{collection.name}</span>
                <span
                  className="ml-auto shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                  style={{
                    color: collection.color,
                    background: `color-mix(in srgb, ${collection.color} 12%, transparent)`,
                  }}
                >
                  {items.length}
                </span>
              </DialogTitle>
              {collection.description && (
                <DialogDescription className="line-clamp-2">
                  {collection.description}
                </DialogDescription>
              )}
            </DialogHeader>

            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-6 py-4">
              {missing > 0 && (
                <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
                  {missing} prompt{missing === 1 ? "" : "s"} in this collection no longer exist in
                  your vault and were hidden.
                </p>
              )}

              {items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center">
                  <SearchX className="size-8 text-muted-foreground/40" aria-hidden="true" />
                  <p className="text-sm font-medium">This collection is empty</p>
                  <p className="max-w-xs text-xs text-muted-foreground">
                    Add prompts below to build your playbook — order them however you like.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 gap-1.5"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus className="size-3.5" /> Add prompts
                  </Button>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={items.map((p) => p.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {items.map((p, i) => (
                        <SortableRow key={p.id} id={p.id} index={i}>
                          <CollectionRow
                            prompt={p}
                            index={i}
                            onRemove={() => removeItem(p.id)}
                          />
                        </SortableRow>
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

              {/* add-prompts picker */}
              {pickerOpen ? (
                <div className="animate-in-item space-y-2 rounded-xl border-2 border-primary/30 bg-primary/5 p-3">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search
                        className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <Input
                        value={pickerQuery}
                        onChange={(e) => setPickerQuery(e.target.value)}
                        placeholder="Search prompts to add…"
                        className="h-8 rounded-lg bg-card pl-8 text-sm"
                        autoFocus
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label="Close picker"
                      onClick={() => {
                        setPickerOpen(false);
                        setPickerQuery("");
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                  <div className="scrollbar-thin max-h-64 space-y-1 overflow-y-auto">
                    {candidates.length === 0 ? (
                      <p className="px-2 py-4 text-center text-xs text-muted-foreground">
                        {prompts.length === 0
                          ? "Your vault is empty — create prompts first."
                          : pickerQuery
                            ? "No prompts match that search."
                            : "Every prompt is already in this collection."}
                      </p>
                    ) : (
                      candidates.map((p) => {
                        const cat = categoryById(categories, p.category);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => addItem(p.id)}
                            className="flex w-full items-center gap-2 rounded-lg bg-card px-2.5 py-2 text-left text-sm transition-colors hover:bg-accent"
                          >
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ background: cat?.color ?? "#888" }}
                              aria-hidden="true"
                            />
                            <span className="min-w-0 flex-1 truncate font-medium">{p.title}</span>
                            <Plus className="size-3.5 shrink-0 text-muted-foreground" />
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                items.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full gap-1.5 border-dashed"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Plus className="size-4" /> Add prompts
                  </Button>
                )
              )}
            </div>

            {items.length > 0 && (
              <div className="flex shrink-0 items-center gap-2 border-t px-6 py-4">
                <p className="hidden text-xs text-muted-foreground sm:block">
                  Tip: drag the handles to reorder the playbook.
                </p>
                <Button
                  onClick={copyAll}
                  className="brand-gradient ml-auto gap-1.5 rounded-xl font-semibold text-white shadow-md shadow-primary/25"
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied!" : `Copy all (${items.length})`}
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SortableRow({
  id,
  index,
  children,
}: {
  id: string;
  index: number;
  children: React.ReactNode;
}) {
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
        aria-label={`Reorder step ${index + 1}`}
        className="absolute top-1/2 -left-2.5 z-20 flex size-6 -translate-y-1/2 cursor-grab items-center justify-center rounded-full border bg-background text-muted-foreground shadow-md transition-colors hover:bg-accent hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-3.5" />
      </button>
    </div>
  );
}

function CollectionRow({
  prompt,
  index,
  onRemove,
}: {
  prompt: Prompt;
  index: number;
  onRemove: () => void;
}) {
  const categories = useVaultStore((s) => s.categories);
  const openDetails = useVaultStore((s) => s.openDetails);
  const closeCollection = useVaultStore((s) => s.closeCollection);
  const cat = categoryById(categories, prompt.category);

  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-card px-3 py-2.5">
      <span
        className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
        style={{
          color: cat?.color ?? "#888",
          background: `color-mix(in srgb, ${cat?.color ?? "#888"} 12%, transparent)`,
        }}
      >
        {index + 1}
      </span>
      <button
        type="button"
        onClick={() => {
          closeCollection();
          openDetails(prompt.id);
        }}
        className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Open prompt ${prompt.title}`}
      >
        <p className="truncate text-sm font-medium">{prompt.title}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {cat?.name ?? "Other"} · {prompt.content.slice(0, 60)}…
        </p>
      </button>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
      <Button
        variant="ghost"
        size="iconSm"
        aria-label={`Remove ${prompt.title} from collection`}
        className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={onRemove}
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
