"use client";

import * as React from "react";
import { Check, Pencil, Plus, Settings2, Trash2 } from "lucide-react";
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
import { useVaultStore } from "@/lib/prompt-vault/store";
import { CATEGORY_ICON_KEYS, CATEGORY_ICONS, CategoryIcon } from "./category-icon";

const SWATCHES = [
  "#f43f5e",
  "#f59e0b",
  "#10b981",
  "#14b8a6",
  "#a855f7",
  "#64748b",
  "#ec4899",
  "#84cc16",
];

interface EditingState {
  id: string | null; // null = creating
  name: string;
  color: string;
  icon: string;
}

export function CategoriesDialog() {
  const open = useVaultStore((s) => s.categoriesOpen);
  const setOpen = useVaultStore((s) => s.setCategoriesOpen);
  const categories = useVaultStore((s) => s.categories);
  const prompts = useVaultStore((s) => s.prompts);
  const addCategory = useVaultStore((s) => s.addCategory);
  const updateCategory = useVaultStore((s) => s.updateCategory);
  const deleteCategory = useVaultStore((s) => s.deleteCategory);
  const requestConfirm = useVaultStore((s) => s.requestConfirm);

  const [editing, setEditing] = React.useState<EditingState | null>(null);

  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const p of prompts) map.set(p.category, (map.get(p.category) ?? 0) + 1);
    return map;
  }, [prompts]);

  const startCreate = () => {
    setEditing({
      id: null,
      name: "",
      color: SWATCHES[Math.floor(Math.random() * SWATCHES.length)],
      icon: "folder",
    });
  };

  const save = () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("Category needs a name");
      return;
    }
    if (editing.id) {
      updateCategory(editing.id, {
        name: editing.name.trim(),
        color: editing.color,
        icon: editing.icon,
      });
      toast.success("Category updated");
    } else {
      addCategory(editing.name, editing.color, editing.icon);
      toast.success("Category created");
    }
    setEditing(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <Settings2 className="size-5 text-primary" /> Manage categories
          </DialogTitle>
          <DialogDescription>
            Organize your vault. Deleting a category moves its prompts to “Other”.
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {/* editor / creator */}
          {editing && (
            <div className="animate-in-item space-y-3 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
              <div className="space-y-1.5">
                <Label htmlFor="cat-name">Name</Label>
                <Input
                  id="cat-name"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="e.g. Marketing"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && save()}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {SWATCHES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      onClick={() => setEditing({ ...editing, color: c })}
                      className="flex size-7 items-center justify-center rounded-full transition-transform hover:scale-110"
                      style={{ background: c, outline: editing.color === c ? "2px solid var(--foreground)" : "none", outlineOffset: 2 }}
                    >
                      {editing.color === c && <Check className="size-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Icon</Label>
                <div className="flex flex-wrap gap-1.5">
                  {CATEGORY_ICON_KEYS.map((key) => {
                    const Icon = CATEGORY_ICONS[key];
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-label={`Icon ${key}`}
                        onClick={() => setEditing({ ...editing, icon: key })}
                        className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                          editing.icon === key
                            ? "border-primary bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        <Icon className="size-4" />
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button variant="ghost" size="sm" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button size="sm" className="brand-gradient rounded-lg font-semibold text-white" onClick={save}>
                  {editing.id ? "Save changes" : "Create category"}
                </Button>
              </div>
            </div>
          )}

          {/* list */}
          <div className="space-y-1.5">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-xl border bg-card px-3.5 py-2.5"
              >
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ color: c.color, background: `color-mix(in srgb, ${c.color} 12%, transparent)` }}
                >
                  <CategoryIcon icon={c.icon} className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{c.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {counts.get(c.id) ?? 0} prompt{(counts.get(c.id) ?? 0) === 1 ? "" : "s"}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label={`Edit ${c.name}`}
                  className="text-muted-foreground"
                  onClick={() =>
                    setEditing({ id: c.id, name: c.name, color: c.color, icon: c.icon })
                  }
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="iconSm"
                  aria-label={`Delete ${c.name}`}
                  className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => {
                    const count = counts.get(c.id) ?? 0;
                    requestConfirm({
                      title: `Delete “${c.name}”?`,
                      message:
                        count > 0
                          ? `${count} prompt${count === 1 ? "" : "s"} will be moved to the fallback category. You can undo this.`
                          : "This empty category will be removed. You can undo this.",
                      confirmLabel: "Delete",
                      danger: true,
                      onConfirm: () => {
                        deleteCategory(c.id);
                        toast.success("Category deleted");
                      },
                    });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>

          {!editing && (
            <Button
              variant="outline"
              className="w-full gap-2 border-dashed"
              onClick={startCreate}
            >
              <Plus className="size-4" /> New category
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
