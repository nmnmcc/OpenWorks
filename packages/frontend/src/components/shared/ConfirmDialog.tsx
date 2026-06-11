"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useT } from "@/lib/i18n/locale";
import { useState } from "react";

interface ConfirmDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly title: string;
  readonly description?: string;
  readonly confirmLabel: string;
  readonly destructive?: boolean;
  readonly onConfirm: () => Promise<void> | void;
}

/**
 * Mobile (<640px):
 * +----------------------------------+
 * | Title (wraps)                    |
 * | Description? (wraps)             |
 * |                                  |
 * | [            Confirm           ] |
 * | [            Cancel            ] |
 * +----------------------------------+
 * Footer 按钮纵向堆叠（flex-col-reverse），各占满整行。
 *
 * Tablet / Desktop / Ultra-wide (>=640px):
 * +----------------------------------+
 * | Title                            |
 * | Description?                     |
 * |                                  |
 * |            [Cancel] [Confirm]    |
 * +----------------------------------+
 *              ^ fixed-width buttons (shrink-0), right-aligned,
 *                leftover space on the left
 *
 * AlertDialog size="sm"（max-w 封顶，窄视口收缩至视口宽）。destructive 模式下
 * 确认按钮为红色。确认时触发 onConfirm（可 async），完成后自动关闭。
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
}: ConfirmDialogProps) {
  const [t] = useT();
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog onOpenChange={(details) => onOpenChange(details.open)} open={open}>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && <AlertDialogDescription>{description}</AlertDialogDescription>}
        </AlertDialogHeader>
        <AlertDialogBody />
        <AlertDialogFooter>
          <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
          <AlertDialogAction isLoading={busy} onClick={handleConfirm} variant={destructive ? "destructive" : "default"}>
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
