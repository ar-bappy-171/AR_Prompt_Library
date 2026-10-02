"use client";

import * as React from "react";
import { BarChart3, Database, Flame, Heart, Star, Type } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { categoryById, estimateTokens, wordCount } from "@/lib/prompt-vault/utils";

export function AnalyticsDialog() {
  const open = useVaultStore((s) => s.analyticsOpen);
  const setOpen = useVaultStore((s) => s.setAnalyticsOpen);
  const prompts = useVaultStore((s) => s.prompts);
  const categories = useVaultStore((s) => s.categories);
  const favorites = useVaultStore((s) => s.favorites);

  const stats = React.useMemo(() => {
    const words = prompts.reduce((acc, p) => acc + wordCount(p.content), 0);
    const tokens = prompts.reduce((acc, p) => acc + estimateTokens(p.content), 0);
    const rated = prompts.filter((p) => p.rating > 0);
    const avgRating = rated.length
      ? rated.reduce((acc, p) => acc + p.rating, 0) / rated.length
      : 0;
    const byCat = new Map<string, number>();
    for (const p of prompts) byCat.set(p.category, (byCat.get(p.category) ?? 0) + 1);
    const byRating = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: prompts.filter((p) => p.rating === r).length,
    }));
    const tagCounts = new Map<string, number>();
    for (const p of prompts) for (const t of p.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 12);
    const mostUsed = [...prompts].sort((a, b) => b.usageCount - a.usageCount).slice(0, 5);
    return { words, tokens, avgRating, byCat, byRating, topTags, mostUsed, ratedCount: rated.length };
  }, [prompts]);

  const maxCat = Math.max(1, ...Array.from(stats.byCat.values()));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <BarChart3 className="size-5 text-primary" /> Vault analytics
          </DialogTitle>
          <DialogDescription>Insights into your prompt collection.</DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {prompts.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Add some prompts first — analytics will light up here.
            </p>
          ) : (
            <>
              {/* top stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard icon={<Database className="size-4" />} label="Prompts" value={prompts.length} tone="violet" />
                <StatCard icon={<Type className="size-4" />} label="Words" value={stats.words.toLocaleString()} tone="teal" />
                <StatCard icon={<Heart className="size-4" />} label="Favorites" value={favorites.length} tone="rose" />
                <StatCard
                  icon={<Star className="size-4" />}
                  label="Avg rating"
                  value={stats.avgRating ? stats.avgRating.toFixed(1) : "—"}
                  tone="amber"
                />
              </div>

              {/* category distribution */}
              <section className="space-y-3">
                <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  By category
                </h3>
                <div className="space-y-2.5">
                  {categories.map((c) => {
                    const count = stats.byCat.get(c.id) ?? 0;
                    if (count === 0) return null;
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-xs font-medium" style={{ color: c.color }}>
                          {c.name}
                        </span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${(count / maxCat) * 100}%`,
                              background: `linear-gradient(90deg, ${c.color}, color-mix(in srgb, ${c.color} 55%, white))`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs font-semibold tabular-nums">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* ratings + tags */}
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <section className="space-y-3">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Rating spread
                  </h3>
                  <div className="space-y-2">
                    {stats.byRating.map(({ rating, count }) => (
                      <div key={rating} className="flex items-center gap-2.5">
                        <span className="flex w-10 items-center gap-0.5 text-xs font-medium text-muted-foreground">
                          {rating}
                          <Star className="size-3 fill-amber-400 text-amber-400" />
                        </span>
                        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-amber-400 transition-all duration-500"
                            style={{ width: `${prompts.length ? (count / prompts.length) * 100 : 0}%` }}
                          />
                        </div>
                        <span className="w-6 text-right text-xs tabular-nums text-muted-foreground">{count}</span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    Top tags
                  </h3>
                  {stats.topTags.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No tags yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {stats.topTags.map(([tag, count]) => (
                        <span
                          key={tag}
                          className="rounded-full border bg-secondary/60 px-2.5 py-1 text-xs font-medium"
                        >
                          #{tag} <span className="text-muted-foreground">×{count}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* most used */}
              {stats.mostUsed.some((p) => p.usageCount > 0) && (
                <section className="space-y-3">
                  <h3 className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                    <Flame className="size-3.5 text-orange-400" /> Most used
                  </h3>
                  <div className="space-y-1.5">
                    {stats.mostUsed
                      .filter((p) => p.usageCount > 0)
                      .map((p, i) => {
                        const cat = categoryById(categories, p.category);
                        return (
                          <div key={p.id} className="flex items-center gap-3 rounded-lg border bg-card/60 px-3 py-2">
                            <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {i + 1}
                            </span>
                            <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.title}</span>
                            <span className="hidden text-[11px] sm:inline" style={{ color: cat?.color }}>
                              {cat?.name}
                            </span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-orange-400">
                              <Flame className="size-3.5" /> {p.usageCount}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const TONES: Record<string, string> = {
  violet: "bg-primary/10 text-primary",
  teal: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  tone: keyof typeof TONES;
}) {
  return (
    <div className="rounded-xl border bg-card p-3.5">
      <div className={`mb-2 flex size-8 items-center justify-center rounded-lg ${TONES[tone]}`}>
        {icon}
      </div>
      <p className="text-xl font-bold tabular-nums tracking-tight">{value}</p>
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
