"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useVaultStore } from "@/lib/prompt-vault/store";
import { cn } from "@/lib/utils";

export function ConfirmDialog() {
  const confirm = useVaultStore((s) => s.confirm);
  const cancelConfirm = useVaultStore((s) => s.cancelConfirm);

  return (
    <AlertDialog open={Boolean(confirm)} onOpenChange={(open) => !open && cancelConfirm()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display">{confirm?.title}</AlertDialogTitle>
          <AlertDialogDescription>{confirm?.message}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              confirm?.onConfirm();
              cancelConfirm();
            }}
            className={cn(
              confirm?.danger &&
                "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20"
            )}
          >
            {confirm?.confirmLabel ?? "Confirm"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
