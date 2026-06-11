"use client";

import { createReportAtom } from "@/atoms/reports";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { useState, type FormEvent } from "react";

interface ReportDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly postId?: string;
  readonly commentId?: string;
}

/**
 * Mobile (<640px):
 * +----------------------------------+
 * | Report                           |
 * | [Textarea: reason...      rows=4]|
 * | [            Submit            ] |
 * | [            Cancel            ] |
 * +----------------------------------+
 * Footer 按钮纵向堆叠（flex-col-reverse），各占满整行。
 *
 * Tablet / Desktop / Ultra-wide (>=640px):
 * +----------------------------------+
 * | Report                           |
 * | [Textarea: reason...      rows=4]|
 * |            [Cancel]  [Submit]    |
 * +----------------------------------+
 *              ^ fixed-width buttons (shrink-0), right-aligned
 *
 * 宽度处置：textarea 独占一行（w-full）；footer 按钮行 <640px 纵向堆叠，
 * >=640px 右对齐固定宽按钮，留白落在行首。
 * Dialog size="sm"（max-w 封顶，窄视口收缩至视口宽）。提交成功后清空 reason 并关闭。
 * 边界：空白 reason → 阻止提交。
 */
export function ReportDialog({ open, onOpenChange, postId, commentId }: ReportDialogProps) {
  const [t] = useT();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const createReport = useAtomSet(createReportAtom, { mode: "promise" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reason.trim().length === 0) {
      return;
    }
    setBusy(true);
    try {
      await createReport({ payload: { postId, commentId, reason: reason.trim() } });
      toast.success({ title: t.post.reported });
      setReason("");
      onOpenChange(false);
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog onOpenChange={(details) => onOpenChange(details.open)} open={open}>
      <DialogContent size="sm">
        <DialogHeader title={t.post.reportAction} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody>
            <Textarea
              onChange={(event) => setReason(event.target.value)}
              placeholder={t.common.reason}
              required
              rows={4}
              value={reason}
            />
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t.common.cancel}
            </Button>
            <Button isLoading={busy} type="submit">
              {t.common.submit}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
