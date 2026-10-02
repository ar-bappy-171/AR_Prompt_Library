"use client";

import * as React from "react";
import { Delete, Eye, EyeOff, Lock, LockKeyhole, ShieldCheck, Unlock } from "lucide-react";
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
import { cn } from "@/lib/utils";

type Mode = "set" | "change" | "manage";
const MAX_PIN = 8;

export function SecurityDialog() {
  const open = useVaultStore((s) => s.securityOpen);
  const setOpen = useVaultStore((s) => s.setSecurityOpen);
  const security = useVaultStore((s) => s.security);
  const setPin = useVaultStore((s) => s.setPin);
  const removePin = useVaultStore((s) => s.removePin);
  const lock = useVaultStore((s) => s.lock);

  const hasPin = Boolean(security?.pinHash);
  const [mode, setMode] = React.useState<Mode>("set");
  const [current, setCurrent] = React.useState("");
  const [pin, setPinValue] = React.useState("");
  const [confirmPin, setConfirmPin] = React.useState("");
  const [hint, setHint] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  /* reset whenever opened */
  React.useEffect(() => {
    if (open) {
      setMode(hasPin ? "manage" : "set");
      setCurrent("");
      setPinValue("");
      setConfirmPin("");
      setHint("");
      setBusy(false);
    }
  }, [open, hasPin]);

  const close = () => setOpen(false);

  const saveNewPin = async () => {
    if (pin.length < 4) {
      toast.error("PIN must be at least 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("PINs don't match");
      return;
    }
    setBusy(true);
    await setPin(pin, hint);
    setBusy(false);
    toast.success("Privacy lock enabled", {
      description: "The vault locks automatically when the tab is hidden.",
    });
    close();
  };

  const changePin = async () => {
    if (current.length < 4) {
      toast.error("Enter your current PIN first");
      return;
    }
    if (pin.length < 4) {
      toast.error("New PIN must be at least 4 digits");
      return;
    }
    if (pin !== confirmPin) {
      toast.error("New PINs don't match");
      return;
    }
    setBusy(true);
    const okCurrent = await useVaultStore.getState().unlock(current);
    if (!okCurrent) {
      setBusy(false);
      toast.error("Current PIN is incorrect");
      return;
    }
    await setPin(pin, hint);
    setBusy(false);
    toast.success("PIN updated");
    close();
  };

  const removeLock = async () => {
    if (current.length < 4) {
      toast.error("Enter your current PIN to disable the lock");
      return;
    }
    setBusy(true);
    const ok = await removePin(current);
    setBusy(false);
    if (!ok) {
      toast.error("Current PIN is incorrect");
      return;
    }
    toast.success("Privacy lock removed");
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-sm">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <DialogTitle className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
            <ShieldCheck className="size-5 text-primary" /> Privacy lock
          </DialogTitle>
          <DialogDescription>
            Protect your vault with a PIN. It locks automatically when the tab is hidden.
          </DialogDescription>
        </DialogHeader>

        <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {hasPin && mode === "manage" && (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 px-4 py-3">
                <LockKeyhole className="size-5 text-emerald-500" aria-hidden="true" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Lock is active</p>
                  <p className="text-xs text-muted-foreground">
                    {security?.hint ? `Hint: ${security.hint}` : "No hint set"}
                  </p>
                </div>
              </div>

              <Button
                onClick={() => {
                  lock();
                  close();
                  toast("Vault locked", { description: "Enter your PIN to unlock." });
                }}
                className="brand-gradient w-full gap-2 rounded-xl font-semibold text-white shadow-md shadow-primary/25"
              >
                <Lock className="size-4" /> Lock now
              </Button>

              <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm font-medium">Change or remove</p>
                <PinField label="Current PIN" value={current} onChange={setCurrent} />
                <Button
                  variant="outline"
                  className="w-full gap-1.5"
                  onClick={() => {
                    setMode("change");
                    setCurrent("");
                    setPinValue("");
                    setConfirmPin("");
                    setHint(security?.hint ?? "");
                  }}
                >
                  <Unlock className="size-4" /> Change PIN
                </Button>
                <Button
                  variant="destructive"
                  className="w-full gap-1.5"
                  disabled={busy}
                  onClick={() => void removeLock()}
                >
                  Remove lock
                </Button>
              </div>
            </>
          )}

          {(mode === "set" || mode === "change") && (
            <div className="space-y-3">
              {mode === "change" && (
                <PinField label="Current PIN" value={current} onChange={setCurrent} />
              )}
              <PinField
                label="New PIN (4–8 digits)"
                value={pin}
                onChange={(v) => setPinValue(v.replace(/\D/g, "").slice(0, MAX_PIN))}
                autoFocus={mode === "set"}
              />
              <PinField
                label="Confirm new PIN"
                value={confirmPin}
                onChange={(v) => setConfirmPin(v.replace(/\D/g, "").slice(0, MAX_PIN))}
              />
              <div className="space-y-1.5">
                <Label htmlFor="pin-hint">Hint (optional)</Label>
                <Input
                  id="pin-hint"
                  value={hint}
                  onChange={(e) => setHint(e.target.value.slice(0, 40))}
                  placeholder="e.g. my usual year"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode(hasPin ? "manage" : "set")}
                >
                  Cancel
                </Button>
                <Button
                  className="brand-gradient gap-1.5 rounded-lg font-semibold text-white"
                  disabled={busy}
                  onClick={() => void (mode === "set" ? saveNewPin() : changePin())}
                >
                  <Lock className="size-4" />
                  {mode === "set" ? "Enable lock" : "Save new PIN"}
                </Button>
              </div>
            </div>
          )}

          <p className="rounded-lg bg-muted px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
            The PIN never leaves this device — only a salted SHA-256 hash is stored in your
            browser. If you forget it, clear this site's storage to reset the vault.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PinField({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  const [show, setShow] = React.useState(false);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`pin-${label}`}>{label}</Label>
      <div className="relative">
        <Input
          id={`pin-${label}`}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, MAX_PIN))}
          type={show ? "text" : "password"}
          inputMode="numeric"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="••••"
          className="pr-10 tracking-[0.3em]"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide PIN" : "Show PIN"}
          className="absolute top-1/2 right-2.5 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      <div className="flex items-center gap-1">
        {Array.from({ length: Math.max(4, value.length) }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1 w-4 rounded-full",
              i < value.length ? "bg-primary" : "bg-muted-foreground/25"
            )}
          />
        ))}
      </div>
    </div>
  );
}
