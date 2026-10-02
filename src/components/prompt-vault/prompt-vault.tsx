"use client";

import * as React from "react";
import { Keyboard, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { cn } from "@/lib/utils";
import { AnalyticsDialog } from "./analytics-dialog";
import { CategoriesDialog } from "./categories-dialog";
import { CategoryChips } from "./category-chips";
import { ConfirmDialog } from "./confirm-dialog";
import { MobileNav } from "./mobile-nav";
import { PromptDetailsDialog } from "./prompt-details-dialog";
import { PromptEditorDialog } from "./prompt-editor-dialog";
import { PromptGallery } from "./prompt-gallery";
import { ShortcutsDialog } from "./shortcuts-dialog";
import { Sidebar } from "./sidebar";
import { TemplatesDialog } from "./templates-dialog";
import { Topbar } from "./topbar";

export function PromptVault() {
  const undo = useVaultStore((s) => s.undo);
  const redo = useVaultStore((s) => s.redo);
  const openEditor = useVaultStore((s) => s.openEditor);
  const setShortcutsOpen = useVaultStore((s) => s.setShortcutsOpen);
  const importBundle = useVaultStore((s) => s.importBundle);
  const requestConfirm = useVaultStore((s) => s.requestConfirm);
  const markHydrated = useVaultStore((s) => s.markHydrated);

  /* mounted flag → avoids SSR/client hydration mismatch with persisted store */
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
    markHydrated();
  }, [markHydrated]);

  /* global shortcuts */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement | null;
      const typing =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (mod && e.key.toLowerCase() === "n" && !e.shiftKey) {
        e.preventDefault();
        openEditor(null);
      } else if (mod && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "y" && !typing) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, openEditor]);

  /* import handler */
  const onImportFile = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text) as { prompts?: unknown[] };
        const count = Array.isArray(data.prompts) ? data.prompts.length : 0;
        if (!count) {
          toast.error("No prompts found in that file");
          return;
        }
        const current = useVaultStore.getState().prompts.length;
        if (current === 0) {
          importBundle(data as never, "replace");
          toast.success(`Imported ${count} prompt${count === 1 ? "" : "s"}`);
        } else {
          requestConfirm({
            title: "Import and replace?",
            message: `Your vault currently holds ${current} prompt${current === 1 ? "" : "s"}. Importing will replace them with the ${count} prompt${count === 1 ? "" : "s"} from the file. You can undo afterwards.`,
            confirmLabel: "Replace vault",
            danger: false,
            onConfirm: () => {
              importBundle(data as never, "replace");
              toast.success(`Imported ${count} prompt${count === 1 ? "" : "s"}`);
            },
          });
        }
      } catch {
        toast.error("Couldn't read that file — is it a Prompt Vault export?");
      }
    },
    [importBundle, requestConfirm]
  );

  return (
    <div className="app-bg relative flex min-h-dvh flex-col">
      {/* a11y skip link */}
      <a
        href="#pv-content-top"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <div className="flex flex-1">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar />
          <CategoryChips />

          <main
            id="pv-content-top"
            className="mx-auto w-full max-w-[1600px] flex-1 scroll-mt-24 px-4 pt-4 pb-28 sm:px-6 lg:px-8 lg:pb-12"
          >
            {mounted ? <PromptGallery /> : <GallerySkeleton />}
          </main>

          <Footer onShortcuts={() => setShortcutsOpen(true)} />
        </div>
      </div>

      <MobileNav />

      {/* dialogs */}
      <PromptEditorDialog />
      <PromptDetailsDialog />
      <AnalyticsDialog />
      <TemplatesDialog />
      <CategoriesDialog />
      <ShortcutsDialog />
      <ConfirmDialog />

      {/* hidden import input (shared by sidebar + mobile) */}
      <input
        id="pv-import-file"
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={onImportFile}
        aria-label="Import vault backup"
      />
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-4 w-40 rounded bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-44 rounded-2xl bg-muted/60" />
        ))}
      </div>
    </div>
  );
}

function Footer({ onShortcuts }: { onShortcuts: () => void }) {
  return (
    <footer className="mt-auto border-t bg-card/40">
      <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6 lg:px-8">
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-foreground">Prompt Vault</strong> — everything is
            stored privately in your browser.
          </span>
        </p>
        <button
          type="button"
          onClick={onShortcuts}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          )}
        >
          <Keyboard className="size-3.5" aria-hidden="true" />
          Keyboard shortcuts
        </button>
      </div>
    </footer>
  );
}
