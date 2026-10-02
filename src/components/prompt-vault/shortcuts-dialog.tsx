"use client";

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useVaultStore } from "@/lib/prompt-vault/store";

const SHORTCUTS: Array<{ keys: string; action: string }> = [
  { keys: "Ctrl N", action: "New prompt" },
  { keys: "Ctrl K", action: "Focus search" },
  { keys: "/", action: "Focus search" },
  { keys: "Ctrl Z", action: "Undo" },
  { keys: "Ctrl Y", action: "Redo" },
  { keys: "Esc", action: "Close dialogs" },
];

export function ShortcutsDialog() {
  const open = useVaultStore((s) => s.shortcutsOpen);
  const setOpen = useVaultStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Keyboard className="size-5 text-primary" /> Keyboard shortcuts
          </DialogTitle>
          <DialogDescription>Move around the vault at lightning speed.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          {SHORTCUTS.map((s) => (
            <div
              key={s.keys}
              className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm odd:bg-muted/50"
            >
              <span className="text-muted-foreground">{s.action}</span>
              <kbd className="rounded-md border bg-background px-2 py-0.5 text-xs font-semibold shadow-xs">
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
