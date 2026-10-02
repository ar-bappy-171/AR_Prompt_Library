"use client";

import * as React from "react";
import { BookOpen, Check, FolderPlus, Pencil, Play, Plus, Trash2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { COLLECTION_COLORS } from "@/lib/prompt-vault/data";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { cn } from "@/lib/utils";

interface EditingState {
  id: string | null; // null = creating
  name: string;
  description: string;
  color: string;
}

export function CollectionsDialog() {
  const open = useVaultStore((s) => s.collectionsOpen);
  const setOpen = useVaultStore((s) => s.setCollectionsOpen);
  const collections = useVaultStore((s) => s.collections);
  const prompts = useVaultStore((s) => s.prompts);
  const addCollection = useVaultStore((s) => s.addCollection);
  const updateCollection = useVaultStore((s) => s.updateCollection);
  const deleteCollection = useVaultStore((s) => s.deleteCollection);
  const openCollection = useVaultStore((s) => s.openCollection);
  const requestConfirm = useVaultStore((s) => s.requestConfirm);

  const [editing, setEditing] = React.useState<EditingState | null>(null);

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const c of collections) {
      map.set(
        c.id,
        c.promptIds.filter((id) => prompts.some((p) => p.id === id)).length
      );
    }
    return map;
  }, [collections, prompts]);

  const startCreate = () =>
    setEditing({
      id: null,
      name: "",
      description: "",
      color: COLLECTION_COLORS[Math.floor(Math.random() * COLLECTION_COLORS.length)],
    });

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Collection needs a name");
      return;
    }
    if (editing.id) {
      updateCollection(editing.id, {
        name: editing.name.trim(),
        description: editing.description.trim(),
        color: editing.color,
      });
      toast.success("Collection updated");
    } else {
      addCollection(editing.name, editing.description, editing.color);
      toast.success("Collection created", {
        description: "Open it and add prompts to build your playbook.",
      });
    }
    setEditing(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <BookOpen className="size-5 text-primary" /> Collections
          </DialogTitle>
          <DialogDescription>
            Group related prompts into ordered playbooks — then copy them all with one click.
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* editor / creator */}
          {editing && (
            <div className="animate-in-item space-y-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="col-name">Name</Label>
                <Input
                  id="col-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Blog workflow"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="col-desc">Description (optional)</Label>
                <Input
                  id="col-desc"
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  placeholder="What is this playbook for?"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Accent color</Label>
                <div className="flex flex-wrap gap-2">
                  {COLLECTION_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      onClick={() => setEditing({ ...editing, color: c })}
                      className="flex size-7 items-center justify-center rounded-full transition-transform hover:scale-110"
                      style={{
                        background: c,
                        outline: editing.color === c ? "2px solid var(--foreground)" : "none",
                        outlineOffset: 2,
                      }}
                    >
                      {editing.color === c && <Check className="size-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="brand-gradient rounded-lg font-semibold text-white"
                  onClick={save}
                >
                  {editing.id ? "Save changes" : "Create collection"}
                </Button>
              </div>
            </div>
          )}

          {/* list */}
          <div className="space-y-1.5">
            {collections.map((c) => {
              const count = counts.get(c.id) ?? 0;
              return (
                <div
                  key={c.id}
                  className="group flex items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5"
                >
                  <span
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{
                      color: c.color,
                      background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                    }}
                  >
                    <BookOpen className="size-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      openCollection(c.id);
                    }}
                    className="min-w-0 flex-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`Open collection ${c.name}`}
                  >
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {c.description || "No description"}
                    </p>
                  </button>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                    style={{
                      color: c.color,
                      background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                    }}
                  >
                    {count}
                  </span>
                  {count > 0 && (
                    <Button
                      variant="ghost"
                      size="iconSm"
                      aria-label={`Open ${c.name}`}
                      className="text-muted-foreground"
                      onClick={() => {
                        setOpen(false);
                        openCollection(c.id);
                      }}
                    >
                      <Play className="size-3.5" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`Edit ${c.name}`}
                    className="text-muted-foreground"
                    onClick={() =>
                      setEditing({
                        id: c.id,
                        name: c.name,
                        description: c.description,
                        color: c.color,
                      })
                    }
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="iconSm"
                    aria-label={`Delete ${c.name}`}
                    className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    onClick={() =>
                      requestConfirm({
                        title: `Delete “${c.name}”?`,
                        message:
                          "The collection will be removed. Your prompts themselves stay in the vault. You can undo this.",
                        confirmLabel: "Delete",
                        danger: true,
                        onConfirm: () => {
                          deleteCollection(c.id);
                          toast.success("Collection deleted");
                        },
                      })
                    }
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>

          {collections.length === 0 && !editing && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed px-4 py-8 text-center">
              <BookOpen className="size-8 text-muted-foreground/40" aria-hidden="true" />
              <p className="text-sm font-medium">No collections yet</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                Create a collection to chain prompts into a reusable playbook.
              </p>
            </div>
          )}

          {!editing && (
            <Button
              variant="outline"
              className={cn("w-full gap-2 border-dashed")}
              onClick={startCreate}
            >
              <FolderPlus className="size-4" /> New collection
            </Button>
          )}
        </div>

        {collections.length > 0 && !editing && (
          <div className="shrink-0 border-t px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              className="w-full gap-1.5 text-muted-foreground"
              onClick={startCreate}
            >
              <Plus className="size-3.5" /> Quick create
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
