"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STARTER_TEMPLATES } from "@/lib/prompt-vault/data";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { categoryById } from "@/lib/prompt-vault/utils";
import { CategoryIcon } from "./category-icon";

export function TemplatesDialog() {
  const open = useVaultStore((s) => s.templatesOpen);
  const setOpen = useVaultStore((s) => s.setTemplatesOpen);
  const categories = useVaultStore((s) => s.categories);
  const openEditorWith = useVaultStore((s) => s.openEditorWith);

  const applyTemplate = (index: number) => {
    const { description: _description, icon: _icon, ...draft } = STARTER_TEMPLATES[index];
    setOpen(false);
    openEditorWith({ ...draft, tags: [...draft.tags], images: [] });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <Sparkles className="size-5 text-primary" /> Starter templates
          </DialogTitle>
          <DialogDescription>
            Battle-tested prompt blueprints — open one and tweak it into your own.
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin grid flex-1 grid-cols-1 gap-3 overflow-y-auto px-6 py-5 sm:grid-cols-2">
          {STARTER_TEMPLATES.map((t, i) => {
            const cat = categoryById(categories, t.category);
            return (
              <div
                key={t.title}
                className="card-hover group flex flex-col rounded-xl border bg-card p-4"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span
                    className="flex size-8 items-center justify-center rounded-lg"
                    style={{
                      color: cat?.color,
                      background: `color-mix(in srgb, ${cat?.color ?? "#888"} 12%, transparent)`,
                    }}
                  >
                    <CategoryIcon icon={t.icon} className="size-4" />
                  </span>
                  <h3 className="min-w-0 flex-1 truncate text-sm font-semibold">{t.title}</h3>
                </div>
                <p className="mb-3 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {t.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold" style={{ color: cat?.color }}>
                    {cat?.name}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1.5 rounded-lg text-xs"
                    onClick={() => applyTemplate(i)}
                  >
                    Use <ArrowRight className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
