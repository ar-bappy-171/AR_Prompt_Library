"use client";

import * as React from "react";
import { Loader2, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useVaultStore } from "@/lib/prompt-vault/store";
import type { PromptDraft } from "@/lib/prompt-vault/types";
import { complexityScore, estimateTokens, wordCount } from "@/lib/prompt-vault/utils";
import { CategoryIcon } from "./category-icon";
import { ImagePicker } from "./image-picker";
import { StarRating } from "./star-rating";
import { TagInput } from "./tag-input";

const EMPTY: PromptDraft = {
  title: "",
  content: "",
  category: "",
  tags: [],
  notes: "",
  images: [],
  rating: 0,
  engine: "",
};

export function PromptEditorDialog() {
  const editor = useVaultStore((s) => s.editor);
  const closeEditor = useVaultStore((s) => s.closeEditor);
  const prompts = useVaultStore((s) => s.prompts);
  const categories = useVaultStore((s) => s.categories);
  const allTags = React.useMemo(
    () => Array.from(new Set(prompts.flatMap((p) => p.tags))).slice(0, 40),
    [prompts]
  );
  const addPrompt = useVaultStore((s) => s.addPrompt);
  const updatePrompt = useVaultStore((s) => s.updatePrompt);
  const deletePrompt = useVaultStore((s) => s.deletePrompt);
  const requestConfirm = useVaultStore((s) => s.requestConfirm);
  const setCategoriesOpen = useVaultStore((s) => s.setCategoriesOpen);

  const editing = editor.promptId ? prompts.find((p) => p.id === editor.promptId) : null;
  const [form, setForm] = React.useState<PromptDraft>(EMPTY);
  const [saving, setSaving] = React.useState(false);

  // (Re)initialize the form whenever the dialog opens for a prompt (or for "new")
  React.useEffect(() => {
    if (!editor.open) return;
    if (editor.promptId) {
      const p = useVaultStore.getState().prompts.find((x) => x.id === editor.promptId);
      if (p) {
        setForm({
          title: p.title,
          content: p.content,
          category: p.category,
          tags: [...p.tags],
          notes: p.notes ?? "",
          images: p.images.map((i) => ({ ...i })),
          rating: p.rating,
          engine: p.engine ?? "",
        });
        return;
      }
    }
    const prefill = useVaultStore.getState().editorPrefill;
    if (prefill) {
      setForm({ ...prefill });
      return;
    }
    setForm({
      ...EMPTY,
      category:
        useVaultStore.getState().filter !== "all" && useVaultStore.getState().filter !== "favorites"
          ? useVaultStore.getState().filter
          : (useVaultStore.getState().categories[0]?.id ?? ""),
    });
  }, [editor.open, editor.promptId]);

  const set = <K extends keyof PromptDraft>(key: K, value: PromptDraft[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const words = wordCount(form.content);
  const tokens = estimateTokens(form.content);
  const complexity = form.content ? complexityScore({ content: form.content }) : 0;

  const handleSave = () => {
    if (!form.title.trim()) {
      toast.error("Please give your prompt a title");
      return;
    }
    if (!form.content.trim()) {
      toast.error("The prompt text can't be empty");
      return;
    }
    setSaving(true);
    const draft: PromptDraft = {
      ...form,
      title: form.title.trim(),
      content: form.content.trim(),
      notes: form.notes.trim(),
      engine: form.engine.trim(),
      category: form.category || categories[0]?.id || "other",
    };
    setTimeout(() => {
      if (editing) {
        updatePrompt(editing.id, draft);
        toast.success("Prompt updated", { description: draft.title });
      } else {
        addPrompt(draft);
        toast.success("Prompt saved to vault", { description: draft.title });
      }
      setSaving(false);
      closeEditor();
    }, 150);
  };

  const handleDelete = () => {
    if (!editing) return;
    requestConfirm({
      title: "Delete this prompt?",
      message: `“${editing.title}” will be removed. You can undo afterwards.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => {
        deletePrompt(editing.id);
        toast.success("Prompt deleted");
        closeEditor();
      },
    });
  };

  return (
    <Dialog open={editor.open} onOpenChange={(open) => !open && closeEditor()}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="font-display text-lg font-bold tracking-tight">
            {editing ? "Edit prompt" : "New prompt"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {editing
              ? "Refine your prompt — changes are saved to your vault."
              : "Craft it once, reuse it forever. Stored privately in your browser."}
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="pv-title">Title *</Label>
            <Input
              id="pv-title"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Fantasy Landscape Generator"
              maxLength={120}
              autoFocus
              className="h-10"
            />
          </div>

          {/* Category + engine */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="pv-category">Category</Label>
                <button
                  type="button"
                  onClick={() => setCategoriesOpen(true)}
                  className="text-[11px] font-medium text-primary hover:underline"
                >
                  Manage
                </button>
              </div>
              <Select value={form.category} onValueChange={(v) => set("category", v)}>
                <SelectTrigger id="pv-category" className="h-10 w-full">
                  <SelectValue placeholder="Choose category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="flex size-4 items-center justify-center rounded"
                          style={{ color: c.color }}
                        >
                          <CategoryIcon icon={c.icon} className="size-3.5" />
                        </span>
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pv-engine">AI engine / model</Label>
              <Input
                id="pv-engine"
                value={form.engine}
                onChange={(e) => set("engine", e.target.value)}
                placeholder="e.g. GPT-4o, Midjourney v6"
                className="h-10"
              />
            </div>
          </div>

          {/* Prompt text */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="pv-content">Prompt text *</Label>
              {words > 0 && (
                <span className="text-[11px] tabular-nums text-muted-foreground">
                  {words} words · ≈{tokens} tokens · complexity {complexity}/5
                </span>
              )}
            </div>
            <Textarea
              id="pv-content"
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              placeholder="Write your prompt here. Use {{placeholders}} for parts you swap per use…"
              rows={8}
              className="min-h-36 resize-y font-[450] leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            <TagInput
              tags={form.tags}
              onChange={(tags) => set("tags", tags)}
              suggestions={allTags}
              placeholder="Add tags like seo, fantasy, code-review…"
            />
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <ImagePicker
              images={form.images}
              onChange={(imgs) => set("images", imgs)}
              type="input"
              label="Reference images"
            />
            <ImagePicker
              images={form.images}
              onChange={(imgs) => set("images", imgs)}
              type="result"
              label="Result images"
            />
          </div>

          <Separator />

          {/* Rating + notes */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
            <div className="space-y-1.5">
              <Label>Effectiveness</Label>
              <div className="flex h-10 items-center rounded-lg border bg-background px-3">
                <StarRating
                  value={form.rating}
                  onChange={(v) => set("rating", v)}
                  size="lg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="pv-notes">Notes (tips, settings…)</Label>
              <Textarea
                id="pv-notes"
                value={form.notes}
                onChange={(e) => set("notes", e.target.value)}
                placeholder="e.g. Works best with --ar 16:9, temperature 0.7…"
                rows={2}
                className="resize-y"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 items-center gap-2 border-t px-6 py-4 sm:justify-between">
          {editing ? (
            <Button
              variant="ghost"
              onClick={handleDelete}
              className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="size-4" /> Delete
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={closeEditor}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="brand-gradient min-w-32 gap-2 rounded-xl font-semibold text-white shadow-md shadow-primary/25"
            >
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
              {editing ? "Save changes" : "Save prompt"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
