"use client";

import * as React from "react";
import { BookOpen, Check, Plus } from "lucide-react";
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
import { COLLECTION_COLORS } from "@/lib/prompt-vault/data";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { cn } from "@/lib/utils";

/**
 * Quick picker shown from the prompt card menu / details dialog:
 * toggle which collections contain the prompt, or create one on the fly.
 */
export function AddToCollectionDialog() {
  const promptId = useVaultStore((s) => s.addToCollectionPromptId);
  const close = useVaultStore((s) => s.closeAddToCollection);
  const collections = useVaultStore((s) => s.collections);
  const prompts = useVaultStore((s) => s.prompts);
  const togglePromptInCollection = useVaultStore((s) => s.togglePromptInCollection);
  const addCollection = useVaultStore((s) => s.addCollection);

  const [creating, setCreating] = React.useState(false);
  const [name, setName] = React.useState("");

  const prompt = promptId ? prompts.find((p) => p.id === promptId) : null;

  const handleToggle = (collectionId: string) => {
    if (!prompt) return;
    const added = togglePromptInCollection(collectionId, prompt.id);
    const col = collections.find((c) => c.id === collectionId);
    if (added) toast.success(`Added to ${col?.name ?? "collection"}`);
    else toast(`Removed from ${col?.name ?? "collection"}`);
  };

  const handleCreate = () => {
    if (!prompt) return;
    if (!name.trim()) {
      toast.error("Give the collection a name");
      return;
    }
    const col = addCollection(name, `Made for “${prompt.title}”`, COLLECTION_COLORS[0]);
    togglePromptInCollection(col.id, prompt.id);
    setName("");
    setCreating(false);
    toast.success(`Added to ${col.name}`);
  };

  return (
    <Dialog
      open={Boolean(prompt)}
      onOpenChange={(open) => {
        if (!open) {
          close();
          setCreating(false);
          setName("");
        }
      }}
    >
      <DialogContent className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 font-display text-base font-bold tracking-tight">
            <BookOpen className="size-4.5 text-primary" /> Add to collection
          </DialogTitle>
          <DialogDescription className="truncate">
            {prompt ? prompt.title : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin flex-1 space-y-1.5 overflow-y-auto px-6 py-4">
          {collections.length === 0 && !creating && (
            <p className="py-4 text-center text-xs text-muted-foreground">
              No collections yet — create your first one below.
            </p>
          )}

          {collections.map((c) => {
            const member = prompt ? c.promptIds.includes(prompt.id) : false;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => handleToggle(c.id)}
                aria-pressed={member}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  member ? "border-primary/50 bg-primary/5" : "bg-card hover:bg-accent"
                )}
              >
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    color: c.color,
                    background: `color-mix(in srgb, ${c.color} 12%, transparent)`,
                  }}
                >
                  <BookOpen className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block text-[11px] text-muted-foreground">
                    {c.promptIds.length} prompt{c.promptIds.length === 1 ? "" : "s"}
                  </span>
                </span>
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-md border",
                    member && "border-primary bg-primary text-primary-foreground"
                  )}
                >
                  {member && <Check className="size-3.5" />}
                </span>
              </button>
            );
          })}

          {creating ? (
            <div className="animate-in-item flex gap-2 pt-1">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Collection name…"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
              <Button size="sm" className="brand-gradient rounded-lg text-white" onClick={handleCreate}>
                Create
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setCreating(false)}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-2 w-full gap-1.5 border-dashed"
              onClick={() => setCreating(true)}
            >
              <Plus className="size-4" /> New collection
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
