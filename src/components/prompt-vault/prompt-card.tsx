"use client";

import * as React from "react";
import {
  Copy,
  Check,
  FolderPlus,
  GripVertical,
  Heart,
  MoreHorizontal,
  Pencil,
  Share2,
  Square,
  SquareCheck,
  Trash2,
  CopyPlus,
  Flame,
} from "lucide-react";
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

export function CategoryBadge({ prompt, className }: { prompt: Prompt; className?: string }) {
  const categories = useVaultStore((s) => s.categories);
  const cat = categoryById(categories, prompt.category);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold",
        className
      )}
      style={{
        color: cat?.color,
        background: `color-mix(in srgb, ${cat?.color ?? "#888"} 12%, transparent)`,
      }}
    >
      <CategoryIcon icon={cat?.icon ?? "folder"} className="size-3" />
      {cat?.name ?? "Other"}
    </span>
  );
}

interface PromptCardProps {
  prompt: Prompt;
  index?: number;
}

export function PromptCard({ prompt }: PromptCardProps) {
  const query = useVaultStore((s) => s.query);
  const favorites = useVaultStore((s) => s.favorites);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const registerCopy = useVaultStore((s) => s.registerCopy);
  const openDetails = useVaultStore((s) => s.openDetails);
  const openEditor = useVaultStore((s) => s.openEditor);
  const deletePrompt = useVaultStore((s) => s.deletePrompt);
  const duplicatePrompt = useVaultStore((s) => s.duplicatePrompt);
  const requestConfirm = useVaultStore((s) => s.requestConfirm);
  const openAddToCollection = useVaultStore((s) => s.openAddToCollection);
  const selectionMode = useVaultStore((s) => s.selectionMode);
  const selected = useVaultStore((s) => s.selected);
  const toggleSelected = useVaultStore((s) => s.toggleSelected);

  const isFav = favorites.includes(prompt.id);
  const isSelected = selected.includes(prompt.id);
  const [copied, setCopied] = React.useState(false);

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

  const handleDelete = (e: React.MouseEvent) => {
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
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if ("share" in navigator) {
      try {
        await navigator.share({ title: prompt.title, text: prompt.content });
        return;
      } catch {
        /* cancelled → do nothing */
      }
    } else {
      await copyText(prompt.content);
      toast.success("Copied — ready to share");
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
        isSelected && "ring-2 ring-primary border-primary/50"
      )}
    >
      {/* category accent bar */}
      <CardAccent category={prompt.category} />

      <div className="flex items-start gap-2 px-4 pt-4">
        <CategoryBadge prompt={prompt} />
        {prompt.engine && (
          <Badge variant="secondary" className="hidden rounded-full text-[10px] font-medium sm:inline-flex">
            {prompt.engine}
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="iconXs"
            aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
            aria-pressed={isFav}
            className={cn(
              "transition-transform hover:scale-110",
              isFav ? "text-amber-500 hover:text-amber-500" : "text-muted-foreground/50 hover:text-amber-500"
            )}
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(prompt.id);
            }}
          >
            <Heart className={cn("size-4", isFav && "fill-current")} />
          </Button>
          <CardMenu
            onEdit={(e) => {
              e.stopPropagation();
              openEditor(prompt.id);
            }}
            onDelete={handleDelete}
            onShare={handleShare}
            onDuplicate={(e) => {
              e.stopPropagation();
              duplicatePrompt(prompt.id);
              toast.success("Prompt duplicated");
            }}
            onSelect={(e) => {
              e.stopPropagation();
              toggleSelected(prompt.id);
            }}
            onAddToCollection={(e) => {
              e.stopPropagation();
              openAddToCollection(prompt.id);
            }}
          />
        </div>
      </div>

      <div className="flex-1 space-y-2 px-4 pt-2.5">
        <h3 className="line-clamp-1 text-[15px] leading-snug font-semibold tracking-tight">
          <Highlight text={prompt.title} query={query} />
        </h3>
        <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">
          <Highlight text={prompt.content} query={query} />
        </p>
      </div>

      {prompt.images.length > 0 && (
        <div className="flex gap-1.5 px-4 pt-3">
          {prompt.images.slice(0, 3).map((img) => (
            <img
              key={img.id}
              src={img.src}
              alt={`${prompt.title} attachment`}
              className="h-14 w-14 rounded-lg border object-cover"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ))}
          {prompt.images.length > 3 && (
            <div className="flex size-14 items-center justify-center rounded-lg border bg-muted text-xs font-semibold text-muted-foreground">
              +{prompt.images.length - 3}
            </div>
          )}
        </div>
      )}

      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {prompt.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
          {prompt.tags.length > 3 && (
            <span className="px-0.5 text-[11px] text-muted-foreground/70">
              +{prompt.tags.length - 3}
            </span>
          )}
        </div>
      )}

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

      {selectionMode && (
        <div className="absolute top-2.5 left-2.5 rounded-md bg-background/90 p-0.5 shadow-sm backdrop-blur">
          {isSelected ? (
            <SquareCheck className="size-5 text-primary" aria-hidden="true" />
          ) : (
            <Square className="size-5 text-muted-foreground" aria-hidden="true" />
          )}
        </div>
      )}
    </article>
  );
}

function CardAccent({ category }: { category: string }) {
  const categories = useVaultStore((s) => s.categories);
  const cat = categoryById(categories, category);
  return (
    <span
      aria-hidden="true"
      className="absolute inset-x-0 top-0 h-[3px]"
      style={{
        background: `linear-gradient(90deg, ${cat?.color ?? "#888"}, color-mix(in srgb, ${
          cat?.color ?? "#888"
        } 35%, transparent))`,
      }}
    />
  );
}

function CardMenu(props: {
  onEdit: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
  onDuplicate: (e: React.MouseEvent) => void;
  onSelect: (e: React.MouseEvent) => void;
  onAddToCollection: (e: React.MouseEvent) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="iconXs"
          aria-label="Prompt actions"
          className="text-muted-foreground/70 opacity-100 hover:bg-accent sm:opacity-0 sm:group-hover:opacity-100"
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
        <DropdownMenuItem onClick={props.onShare}>
          <Share2 className="size-4" /> Share
        </DropdownMenuItem>
        <DropdownMenuItem onClick={props.onSelect}>
          <SquareCheck className="size-4" /> Select
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={props.onDelete}>
          <Trash2 className="size-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
