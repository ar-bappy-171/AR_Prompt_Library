"use client";

import * as React from "react";
import { Check, Copy, Flame, Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useVaultStore } from "@/lib/prompt-vault/store";
import type { Prompt } from "@/lib/prompt-vault/types";
import { categoryById, copyText, timeAgo } from "@/lib/prompt-vault/utils";
import { cn } from "@/lib/utils";
import { CategoryBadge } from "./prompt-card";
import { Highlight } from "./highlight";
import { StarRating } from "./star-rating";

export function PromptListItem({ prompt }: { prompt: Prompt }) {
  const query = useVaultStore((s) => s.query);
  const favorites = useVaultStore((s) => s.favorites);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const registerCopy = useVaultStore((s) => s.registerCopy);
  const openDetails = useVaultStore((s) => s.openDetails);
  const selectionMode = useVaultStore((s) => s.selectionMode);
  const selected = useVaultStore((s) => s.selected);
  const toggleSelected = useVaultStore((s) => s.toggleSelected);

  const isFav = favorites.includes(prompt.id);
  const isSelected = selected.includes(prompt.id);
  const categories = useVaultStore((s) => s.categories);
  const cat = categoryById(categories, prompt.category);
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await copyText(prompt.content);
    if (ok) {
      registerCopy(prompt.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Prompt copied", { description: prompt.title });
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
        "group relative flex cursor-pointer items-center gap-3 rounded-xl border bg-card px-3.5 py-3 shadow-xs transition-all outline-none hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
        isSelected && "ring-2 ring-primary border-primary/50"
      )}
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-2 left-0 w-[3px] rounded-full"
        style={{ background: cat?.color ?? "#888" }}
      />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className="truncate text-sm font-semibold tracking-tight">
            <Highlight text={prompt.title} query={query} />
          </h3>
          <CategoryBadge prompt={prompt} />
          {prompt.usageCount > 0 && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
              <Flame className="size-3 text-orange-400/80" /> {prompt.usageCount}
            </span>
          )}
        </div>
        <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          <Highlight text={prompt.content} query={query} />
        </p>
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        {prompt.tags.slice(0, 2).map((t) => (
          <span key={t} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
            #{t}
          </span>
        ))}
      </div>

      <div className="hidden w-24 shrink-0 md:block">
        <StarRating value={prompt.rating} size="sm" />
      </div>

      <span className="hidden w-16 shrink-0 text-right text-[11px] text-muted-foreground/80 lg:inline">
        {timeAgo(prompt.updatedAt)}
      </span>

      <div className="flex shrink-0 items-center gap-0.5">
        <Button
          variant="ghost"
          size="iconXs"
          aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
          className={cn(
            isFav ? "text-amber-500 hover:text-amber-500" : "text-muted-foreground/50 hover:text-amber-500"
          )}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(prompt.id);
          }}
        >
          <Heart className={cn("size-4", isFav && "fill-current")} />
        </Button>
        <Button
          variant="ghost"
          size="iconXs"
          aria-label={copied ? "Copied" : "Copy prompt"}
          onClick={handleCopy}
          className={cn(
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
