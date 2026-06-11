"use client";

import { Keys } from "@/atoms/keys";
import { sendMessageAtom } from "@/atoms/messages";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { UserPicker } from "@/components/shared/UserPicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { toPortableTextContent } from "@/lib/portable-text";
import { useAtomSet } from "@effect/atom-react";
import { useState, type FormEvent } from "react";

interface MessageComposeDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly recipientId?: string;
}

/**
 * Mobile (<640px):
 * +--------------------------------------+
 * | Compose Message                      |
 * | Recipient (if not preset)            |
 * |   [user picker w-full]               |
 * | Subject                              |
 * |   [input w-full]                     |
 * | Body                                 |
 * |   [portable text editor w-full]      |
 * | [               Send             ]   |
 * | [              Cancel            ]   |
 * +--------------------------------------+
 * Footer 按钮纵向堆叠（flex-col-reverse），各占满整行。
 *
 * Tablet / Desktop / Ultra-wide (>=640px):
 * +--------------------------------------+
 * | Compose Message                      |
 * | Recipient / Subject / Body           |
 * |   [inputs w-full]                    |
 * |             [Cancel]  [Send]         |
 * +--------------------------------------+
 *               ^ fixed-width buttons (shrink-0), right-aligned
 *
 * 宽度处置：表单控件全部独占一行（w-full，无同行并列）；唯一同行组是 footer
 * 按钮行——<640px 纵向堆叠，>=640px 右对齐固定宽按钮，留白落在行首。
 * 默认尺寸 Dialog（max-w 封顶，窄视口收缩至视口宽）。recipientId 预设时隐藏
 * 收件人输入框。
 * 发送成功后清空 subject、重挂载编辑器清空正文并关闭。
 * 边界：空白正文 → 阻止提交。
 */
export function MessageComposeDialog({ open, onOpenChange, recipientId }: MessageComposeDialogProps) {
  const [t] = useT();
  const sendMessage = useAtomSet(sendMessageAtom, { mode: "promise" });

  const [recipient, setRecipient] = useState<string | undefined>(recipientId);
  const [subject, setSubject] = useState("");
  const [blocks, setBlocks] = useState<ReadonlyArray<unknown> | undefined>(undefined);
  const [editorGeneration, setEditorGeneration] = useState(0);
  const [pickerGeneration, setPickerGeneration] = useState(0);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (recipient === undefined) return;
    const body = toPortableTextContent(blocks);
    if (body === undefined) {
      return;
    }
    setBusy(true);
    try {
      await sendMessage({
        payload: { recipientId: recipient, subject: subject.trim(), body },
        reactivityKeys: [Keys.messages],
      });
      toast.success({ title: t.messages.sent_toast });
      setRecipient(recipientId);
      setPickerGeneration((g) => g + 1);
      setSubject("");
      setBlocks(undefined);
      setEditorGeneration((generation) => generation + 1);
      onOpenChange(false);
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog onOpenChange={(details) => onOpenChange(details.open)} open={open}>
      <DialogContent>
        <DialogHeader title={t.messages.compose} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            {recipientId === undefined && (
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium">{t.messages.recipient}</span>
                <UserPicker
                  key={pickerGeneration}
                  onValueChange={setRecipient}
                  placeholder={t.messages.searchRecipient}
                  value={recipient}
                />
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="message-subject">
                {t.messages.subject}
              </label>
              <Input
                id="message-subject"
                maxLength={200}
                onChange={(event) => setSubject(event.target.value)}
                required
                value={subject}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="message-body">
                {t.messages.body}
              </label>
              <PortableTextEditor className="min-h-32" id="message-body" key={editorGeneration} onChange={setBlocks} />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t.common.cancel}
            </Button>
            <Button disabled={recipient === undefined} isLoading={busy} type="submit">
              {t.messages.send}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
