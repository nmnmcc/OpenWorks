"use client";

import { createCommentAtom } from "@/atoms/comments";
import { Keys } from "@/atoms/keys";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { Button } from "@/components/ui/button";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { toPortableTextContent } from "@/lib/portable-text";
import { useAtomSet } from "@effect/atom-react";
import { useState, type FormEvent } from "react";

interface CommentComposerProps {
  readonly postId: string;
  readonly parentId?: string;
  readonly autoFocus?: boolean;
  readonly onDone?: () => void;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +--------------------------------------+
 * | [editor toolbar]                     |
 * | Portable text editor                 |
 * +--------------------------------------+
 * |                  [Cancel?] [Submit]  |
 * +--------------------------------------+
 *                    ^ fixed-width buttons (shrink-0)
 *
 * flex-col gap-2 表单，所有断点布局一致。
 * 宽度处置：编辑器占满列宽（窄端由编辑器内部工具栏 flex-wrap 消化）；按钮行
 * 右对齐（justify-end），按钮为固定短标签（自带 shrink-0），窄端余宽收紧、
 * 宽端留白落在行首。取消按钮仅在提供 onDone 时显示（即回复模式）。
 * 提交成功后通过 key 重挂载编辑器以清空内容，并调用 onDone。
 * 边界：空白内容 → 阻止提交。
 */
export function CommentComposer({ postId, parentId, autoFocus = false, onDone }: CommentComposerProps) {
  const [t] = useT();
  const [blocks, setBlocks] = useState<ReadonlyArray<unknown> | undefined>(undefined);
  const [editorGeneration, setEditorGeneration] = useState(0);
  const [busy, setBusy] = useState(false);
  const createComment = useAtomSet(createCommentAtom, { mode: "promise" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = toPortableTextContent(blocks);
    if (content === undefined) {
      return;
    }
    setBusy(true);
    try {
      await createComment({
        payload: { postId, parentId, content },
        reactivityKeys: [Keys.comments(postId), Keys.post(postId)],
      });
      setBlocks(undefined);
      setEditorGeneration((generation) => generation + 1);
      onDone?.();
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <PortableTextEditor
        autoFocus={autoFocus}
        key={editorGeneration}
        onChange={setBlocks}
        placeholder={t.comments.placeholder}
      />
      <div className="flex justify-end gap-2">
        {onDone && (
          <Button onClick={onDone} size="sm" type="button" variant="ghost">
            {t.common.cancel}
          </Button>
        )}
        <Button isLoading={busy} size="sm" type="submit">
          {t.comments.submit}
        </Button>
      </div>
    </form>
  );
}
