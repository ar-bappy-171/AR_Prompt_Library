"use client";

import * as React from "react";
import { Delete, ShieldCheck, Vault } from "lucide-react";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { cn } from "@/lib/utils";
import { GradientWord } from "./sidebar";

const MAX_PIN = 8;

/** Full-screen privacy gate shown while the vault is locked. */
export function LockScreen() {
  const unlock = useVaultStore((s) => s.unlock);
  const hint = useVaultStore((s) => s.security?.hint ?? "");

  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState(false);
  const [checking, setChecking] = React.useState(false);

  const submit = React.useCallback(
    async (value: string) => {
      if (!value || checking) return;
      setChecking(true);
      const ok = await unlock(value);
      setChecking(false);
      if (ok) {
        setPin("");
        setError(false);
      } else {
        setError(true);
        setPin("");
        setTimeout(() => setError(false), 1600);
      }
    },
    [checking, unlock]
  );

  const press = (digit: string) => {
    if (error) return;
    setPin((p) => {
      const next = (p + digit).slice(0, MAX_PIN);
      return next;
    });
  };

  const backspace = () => setPin((p) => p.slice(0, -1));

  /* physical keyboard support */
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") backspace();
      else if (e.key === "Enter") void submit(pin);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pin, submit]);

  return (
    <div
      className="app-bg fixed inset-0 z-[100] flex flex-col items-center justify-center px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Vault locked — enter your PIN"
    >
      <div className="w-full max-w-xs">
        {/* brand */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="brand-gradient mb-4 flex size-16 items-center justify-center rounded-2xl text-white shadow-lg shadow-primary/30">
            <Vault className="size-8" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight">
            Prompt <GradientWord>Vault</GradientWord>
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <ShieldCheck className="size-4 text-emerald-500" aria-hidden="true" />
            Locked — enter your PIN to continue
          </p>
        </div>

        {/* PIN dots */}
        <div
          className={cn(
            "mb-3 flex items-center justify-center gap-3",
            error && "animate-shake"
          )}
          aria-live="polite"
        >
          {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
            <span
              key={i}
              className={cn(
                "size-3.5 rounded-full border-2 transition-all",
                i < pin.length
                  ? "scale-110 border-primary bg-primary"
                  : "border-muted-foreground/30 bg-transparent",
                error && i < pin.length && "border-destructive bg-destructive"
              )}
            />
          ))}
          <span className="sr-only">{pin.length} digits entered</span>
        </div>

        {hint && (
          <p className="mb-3 text-center text-xs text-muted-foreground">
            Hint: <span className="font-medium text-foreground/80">{hint}</span>
          </p>
        )}
        {error && (
          <p className="mb-3 text-center text-xs font-medium text-destructive">
            Wrong PIN — try again
          </p>
        )}

        {/* keypad */}
        <div className="mx-auto grid max-w-[260px] grid-cols-3 gap-2.5">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
            <KeypadButton key={d} onClick={() => press(d)}>
              {d}
            </KeypadButton>
          ))}
          <KeypadButton onClick={() => void submit(pin)} disabled={!pin || checking} accent>
            Unlock
          </KeypadButton>
          <KeypadButton onClick={() => press("0")}>0</KeypadButton>
          <KeypadButton onClick={backspace} disabled={!pin} ariaLabel="Delete last digit">
            <Delete className="size-5" aria-hidden="true" />
          </KeypadButton>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-foreground/70">
          Your PIN is stored only on this device as a hash.
        </p>
      </div>
    </div>
  );
}

function KeypadButton({
  children,
  onClick,
  disabled,
  accent,
  ariaLabel,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  accent?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={cn(
        "flex h-14 items-center justify-center rounded-2xl border bg-card/70 text-lg font-semibold shadow-xs transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95 disabled:opacity-40",
        accent
          ? "brand-gradient border-transparent text-sm text-white uppercase tracking-wide shadow-md shadow-primary/25 hover:brightness-105"
          : "hover:border-primary/40 hover:bg-accent"
      )}
    >
      {children}
    </button>
  );
}
