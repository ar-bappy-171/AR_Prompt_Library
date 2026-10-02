"use client";

import * as React from "react";
import { Check, Copy, Flame, FolderPlus, Heart, CopyPlus, MoreHorizontal, Pencil, Quote, Square, SquareCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useVaultStore } from "@/lib/prompt-vault/store";
import type { Prompt } from "@/lib/prompt-vault/types";
import { categoryById, copyText, timeAgo } from "@/lib/prompt-vault/utils";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";
import { Highlight } from "./highlight";
import { StarRating } from "./star-rating";

/**
 * Image-first card used by the "Cover" view mode — ideal for
 * visual prompts (Midjourney, DALL·E, UI mockups…).
 */
export function PromptCoverCard({ prompt }: { prompt: Prompt }) {
  const query = useVaultStore((s) => s.query);
  const favorites = useVaultStore((s) => s.favorites);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const registerCopy = useVaultStore((s) => s.registerCopy);
  const openDetails = useVaultStore((s) => s.openDetails);
  const openEditor = useVaultStore((s) => s.openEditor);
  const duplicatePrompt = useVaultStore((s) => s.duplicatePrompt);
  const deletePrompt = useVaultStore((s) => s.deletePrompt);
  const requestConfirm = useVaultStore((s) => s.requestConfirm);
  const openAddToCollection = useVaultStore((s) => s.openAddToCollection);
  const selectionMode = useVaultStore((s) => s.selectionMode);
  const selected = useVaultStore((s) => s.selected);
  const toggleSelected = useVaultStore((s) => s.toggleSelected);
  const categories = useVaultStore((s) => s.categories);

  const cat = categoryById(categories, prompt.category);
  const isFav = favorites.includes(prompt.id);
  const isSelected = selected.includes(prompt.id);
  const [copied, setCopied] = React.useState(false);

  /* prefer a result image for the cover, fall back to any attachment */
  const cover =
    prompt.images.find((i) => i.type === "result")?.src ?? prompt.images[0]?.src ?? null;

  const handleCopy = async (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    const ok = await copyText(prompt.content);
    if (ok) {
      registerCopy(prompt.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Prompt copied to clipboard", { description: prompt.title });
    } else {
      toast.error("Couldn't access the clipboard");
    }
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open prompt: ${prompt.title}`}
      onClick={() => {
        if (selectionMode) toggleSelected(prompt.id);
        else openDetails(prompt.id);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (selectionMode) toggleSelected(prompt.id);
          else openDetails(prompt.id);
        }
      }}
      className={cn(
        "card-hover group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-card text-left shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "border-primary/50 ring-2 ring-primary"
      )}
    >
      {/* cover */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {cover ? (
          <img
            src={cover}
            alt={`${prompt.title} cover`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="flex size-full items-center justify-center"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, ${cat?.color ?? "#8b5cf6"} 26%, transparent), color-mix(in srgb, ${
                cat?.color ?? "#8b5cf6"
              } 8%, transparent))`,
            }}
            aria-hidden="true"
          >
            <Quote className="size-10 text-foreground/25" />
          </div>
        )}

        {/* gradient scrim */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
          aria-hidden="true"
        />

        {/* top row: category + actions */}
        <div className="absolute inset-x-0 top-0 flex items-start gap-1.5 p-2.5">
          <span
            className="inline-flex items-center gap-1 rounded-full bg-background/85 px-2 py-0.5 text-[11px] font-semibold backdrop-blur"
            style={{ color: cat?.color }}
          >
            <CategoryIcon icon={cat?.icon ?? "folder"} className="size-3" />
            {cat?.name ?? "Other"}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="iconXs"
              aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFav}
              className={cn(
                "bg-background/85 text-foreground/80 backdrop-blur transition-transform hover:scale-110 hover:bg-background/85",
                isFav ? "text-amber-500 hover:text-amber-500" : "hover:text-amber-500"
              )}
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(prompt.id);
              }}
            >
              <Heart className={cn("size-4", isFav && "fill-current")} />
            </Button>
            <CoverMenu
              onEdit={(e) => {
                e.stopPropagation();
                openEditor(prompt.id);
              }}
              onDuplicate={(e) => {
                e.stopPropagation();
                duplicatePrompt(prompt.id);
                toast.success("Prompt duplicated");
              }}
              onAddToCollection={(e) => {
                e.stopPropagation();
                openAddToCollection(prompt.id);
              }}
              onDelete={(e) => {
                e.stopPropagation();
                requestConfirm({
                  title: "Delete this prompt?",
                  message: `“${prompt.title}” will be moved out of your vault. You can undo this action.`,
                  confirmLabel: "Delete",
                  danger: true,
                  onConfirm: () => {
                    deletePrompt(prompt.id);
                    toast.success("Prompt deleted", { description: "Press Ctrl+Z to undo" });
                  },
                });
              }}
            />
          </div>
        </div>

        {/* title over image */}
        <div className="absolute inset-x-0 bottom-0 p-3.5">
          <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold tracking-tight text-white drop-shadow-sm">
            <Highlight text={prompt.title} query={query} />
          </h3>
        </div>

        {selectionMode && (
          <div className="absolute top-2.5 left-2.5 rounded-md bg-background/90 p-0.5 shadow-sm backdrop-blur">
            {isSelected ? (
              <SquareCheck className="size-5 text-primary" aria-hidden="true" />
            ) : (
              <Square className="size-5 text-muted-foreground" aria-hidden="true" />
            )}
          </div>
        )}
      </div>

      {/* body */}
      <div className="flex-1 space-y-2 px-4 pt-3">
        <p className="line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
          <Highlight text={prompt.content} query={query} />
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          {prompt.engine && (
            <Badge variant="secondary" className="rounded-full text-[10px] font-medium">
              {prompt.engine}
            </Badge>
          )}
          {prompt.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 2 && (
            <span className="px-0.5 text-[11px] text-muted-foreground/70">
              +{prompt.tags.length - 2}
            </span>
          )}
        </div>
      </div>

      {/* footer */}
      <div className="mt-3 flex items-center gap-2 border-t bg-muted/30 px-4 py-2.5">
        <StarRating value={prompt.rating} size="sm" />
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          {prompt.usageCount > 0 && (
            <>
              <Flame className="size-3 text-orange-400/80" aria-hidden="true" />
              {prompt.usageCount}
            </>
          )}
        </span>
        <span className="hidden text-[11px] text-muted-foreground/80 sm:inline">
          {timeAgo(prompt.updatedAt)}
        </span>
        <Button
          variant="ghost"
          size="iconXs"
          aria-label={copied ? "Copied" : "Copy prompt"}
          onClick={handleCopy}
          className={cn(
            "shrink-0",
            copied
              ? "text-emerald-500 hover:text-emerald-500"
              : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
          )}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </article>
  );
}

function CoverMenu(props: {
  onEdit: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onAddToCollection: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="iconXs"
          aria-label="Prompt actions"
          className="bg-background/85 text-foreground/80 backdrop-blur hover:bg-background/85"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuItem onClick={props.onEdit}>
          <Pencil className="size-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={props.onDuplicate}>
          <CopyPlus className="size-4" /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem onClick={props.onAddToCollection}>
          <FolderPlus className="size-4" /> Add to collection
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={props.onDelete}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
