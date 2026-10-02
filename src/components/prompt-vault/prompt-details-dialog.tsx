"use client";

import * as React from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Flame,
  Heart,
  History,
  Pencil,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { categoryById, complexityScore, copyText, estimateTokens, formatDate, timeAgo, wordCount } from "@/lib/prompt-vault/utils";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "./category-icon";

export function PromptDetailsDialog() {
  const detailsId = useVaultStore((s) => s.detailsId);
  const closeDetails = useVaultStore((s) => s.closeDetails);
  const prompts = useVaultStore((s) => s.prompts);
  const categories = useVaultStore((s) => s.categories);
  const favorites = useVaultStore((s) => s.favorites);
  const toggleFavorite = useVaultStore((s) => s.toggleFavorite);
  const registerCopy = useVaultStore((s) => s.registerCopy);
  const openEditor = useVaultStore((s) => s.openEditor);

  const prompt = detailsId ? prompts.find((p) => p.id === detailsId) : null;
  const [copied, setCopied] = React.useState(false);
  const [lightbox, setLightbox] = React.useState<string | null>(null);
  const cat = prompt ? categoryById(categories, prompt.category) : null;
  const isFav = prompt ? favorites.includes(prompt.id) : false;

  const handleCopy = async () => {
    if (!prompt) return;
    const ok = await copyText(prompt.content);
    if (ok) {
      registerCopy(prompt.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      toast.success("Prompt copied to clipboard");
    } else {
      toast.error("Couldn't access the clipboard");
    }
  };

  return (
    <>
      <Dialog open={Boolean(prompt)} onOpenChange={(open) => !open && closeDetails()}>
        <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
          {prompt && (
            <>
              <DialogHeader className="shrink-0 space-y-3 border-b px-6 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  {cat && (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
                      style={{
                        color: cat.color,
                        background: `color-mix(in srgb, ${cat.color} 12%, transparent)`,
                      }}
                    >
                      <CategoryIcon icon={cat.icon} className="size-3.5" />
                      {cat.name}
                    </span>
                  )}
                  {prompt.engine && (
                    <Badge variant="secondary" className="rounded-full text-[11px]">
                      {prompt.engine}
                    </Badge>
                  )}
                  <span
                    className={cn(
                      "ml-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                      prompt.rating >= 4
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : prompt.rating >= 3
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    <Star className="size-3" /> complexity {complexityScore(prompt)}/5
                  </span>
                </div>
                <DialogTitle className="font-display text-xl font-bold tracking-tight">
                  {prompt.title}
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Prompt details, usage and metadata
                </DialogDescription>
              </DialogHeader>

              <div className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {/* the prompt */}
                <div className="relative">
                  <pre className="scrollbar-thin max-h-72 overflow-y-auto rounded-xl border bg-muted/40 p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {prompt.content}
                  </pre>
                  <Button
                    size="sm"
                    onClick={handleCopy}
                    className={cn(
                      "absolute top-3 right-3 gap-1.5 rounded-lg shadow-md",
                      copied
                        ? "bg-emerald-500 text-white hover:bg-emerald-500"
                        : "brand-gradient text-white"
                    )}
                  >
                    {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>

                {/* images */}
                {prompt.images.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Attachments
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {prompt.images.map((img) => (
                        <button
                          key={img.id}
                          type="button"
                          onClick={() => setLightbox(img.src)}
                          aria-label="View image full size"
                          className="overflow-hidden rounded-lg border transition-transform hover:scale-[1.03]"
                        >
                          <img src={img.src} alt="Prompt attachment" className="size-20 object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* tags */}
                {prompt.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {prompt.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="rounded-md font-normal">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* notes */}
                {prompt.notes && (
                  <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3.5">
                    <h3 className="mb-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                      Notes
                    </h3>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/85">
                      {prompt.notes}
                    </p>
                  </div>
                )}

                <Separator />

                {/* metadata */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-4">
                  <Meta label="Created" value={formatDate(prompt.createdAt)} icon={<CalendarDays className="size-3.5" />} />
                  <Meta label="Updated" value={timeAgo(prompt.updatedAt)} icon={<History className="size-3.5" />} />
                  <Meta label="Times used" value={String(prompt.usageCount || 0)} icon={<Flame className="size-3.5" />} />
                  <Meta label="Rating" value={prompt.rating ? `${prompt.rating}/5` : "—"} icon={<Star className="size-3.5" />} />
                  <Meta label="Words" value={wordCount(prompt.content).toLocaleString()} />
                  <Meta label="Est. tokens" value={`≈${estimateTokens(prompt.content).toLocaleString()}`} />
                  <Meta label="Complexity" value={`${complexityScore(prompt)}/5`} />
                  <Meta label="Images" value={String(prompt.images.length)} />
                </div>
              </div>

              {/* footer actions */}
              <div className="flex shrink-0 items-center gap-2 border-t px-6 py-4">
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => toggleFavorite(prompt.id)}
                  aria-pressed={isFav}
                >
                  <Heart className={cn("size-4", isFav && "fill-amber-500 text-amber-500")} />
                  {isFav ? "Favorited" : "Favorite"}
                </Button>
                <Button
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => {
                    closeDetails();
                    openEditor(prompt.id);
                  }}
                >
                  <Pencil className="size-4" /> Edit
                </Button>
                <Button onClick={handleCopy} className="brand-gradient ml-auto gap-1.5 rounded-xl font-semibold text-white shadow-md shadow-primary/25">
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  Copy prompt
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* lightbox */}
      <Dialog open={Boolean(lightbox)} onOpenChange={(open) => !open && setLightbox(null)}>
        <DialogContent className="max-h-[90dvh] border-none bg-transparent p-0 shadow-none sm:max-w-3xl [&>button]:bg-background/80 [&>button]:rounded-full [&>button]:p-1">
          {lightbox && (
            <img
              src={lightbox}
              alt="Prompt attachment full size"
              className="max-h-[85dvh] w-full rounded-xl object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Meta({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
