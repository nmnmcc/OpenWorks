"use client";

import { deleteCommentAtom, removeCommentAtom, updateCommentAtom } from "@/atoms/comments";
import { Keys } from "@/atoms/keys";
import { saveItemAtom, unsaveItemAtom } from "@/atoms/saved";
import { CommentComposer } from "@/components/comment/CommentComposer";
import { VoteButtons } from "@/components/post/VoteButtons";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { PortableTextView } from "@/components/shared/PortableTextView";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { SaveMenuItem } from "@/components/shared/SaveMenuItem";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { toPortableTextContent } from "@/lib/portable-text";
import { useAtomSet } from "@effect/atom-react";
import type { Comment } from "@openworks/backend/api";
import { Match } from "effect";
import { MoreHorizontalIcon } from "lucide-react";
import { useState, type FormEvent } from "react";

export interface CommentNode {
  readonly comment: Comment;
  readonly children: ReadonlyArray<CommentNode>;
}

export function buildCommentTree(comments: ReadonlyArray<Comment>, sort: "top" | "new"): ReadonlyArray<CommentNode> {
  const byParent = new Map<string | null, Array<Comment>>();
  for (const comment of comments) {
    const siblings = byParent.get(comment.parentId) ?? [];
    siblings.push(comment);
    byParent.set(comment.parentId, siblings);
  }

  const comparator =
    sort === "top"
      ? (a: Comment, b: Comment) => b.score - a.score
      : (a: Comment, b: Comment) => b.createdAt.getTime() - a.createdAt.getTime();

  const build = (parentId: string | null): Array<CommentNode> =>
    (byParent.get(parentId) ?? []).sort(comparator).map((comment) => ({ comment, children: build(comment.id) }));

  return build(null);
}

function countDescendants(node: CommentNode): number {
  return node.children.reduce((sum, child) => sum + 1 + countDescendants(child), 0);
}

interface CommentEditFormProps {
  readonly comment: Comment;
  readonly postId: string;
  readonly onDone: () => void;
}

function CommentEditForm({ comment, postId, onDone }: CommentEditFormProps) {
  const [t] = useT();
  const [blocks, setBlocks] = useState<ReadonlyArray<unknown> | undefined>(comment.content);
  const [busy, setBusy] = useState(false);
  const updateComment = useAtomSet(updateCommentAtom, { mode: "promise" });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = toPortableTextContent(blocks);
    if (content === undefined) {
      return;
    }
    setBusy(true);
    try {
      await updateComment({
        params: { id: comment.id },
        payload: { content },
        reactivityKeys: [Keys.comments(postId)],
      });
      onDone();
    } catch (error) {
      showApiError(t.errors, error);
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
      <PortableTextEditor autoFocus initialValue={comment.content} onChange={setBlocks} />
      <div className="flex justify-end gap-2">
        <Button onClick={onDone} size="sm" type="button" variant="ghost">
          {t.common.cancel}
        </Button>
        <Button isLoading={busy} size="sm" type="submit">
          {t.common.save}
        </Button>
      </div>
    </form>
  );
}

function MoreRepliesButton({ count, node }: { readonly count: number; readonly node: CommentNode }) {
  const [t] = useT();
  const [expanded, setExpanded] = useState(false);

  if (expanded) {
    return (
      <div className="mt-1 flex flex-col gap-3">
        {node.children.map((child) => (
          <div key={child.comment.id} className="text-muted-foreground text-xs wrap-anywhere">
            <UserLink id={child.comment.authorId} />
            <span className="ml-1.5">
              <PortableTextView value={child.comment.content} />
            </span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <button
      className="text-primary mt-1 text-xs font-medium hover:underline"
      onClick={() => setExpanded(true)}
      type="button"
    >
      {t.comments.showMoreReplies(count)}
    </button>
  );
}

interface CommentItemProps {
  readonly node: CommentNode;
  readonly postId: string;
  readonly postAuthorId: string;
  readonly locked: boolean;
  readonly depth?: number;
}

const MAX_DEPTH = 4;

function CommentItem({ node, postId, postAuthorId, locked, depth = 0 }: CommentItemProps) {
  const [t] = useT();
  const { data: session } = authClient.useSession();
  const [collapsed, setCollapsed] = useState(false);
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const saveItem = useAtomSet(saveItemAtom, { mode: "promise" });
  const unsaveItem = useAtomSet(unsaveItemAtom, { mode: "promise" });
  const deleteComment = useAtomSet(deleteCommentAtom, { mode: "promise" });
  const removeComment = useAtomSet(removeCommentAtom, { mode: "promise" });

  const comment = node.comment;
  const isAuthor = session?.user.id === comment.authorId;
  const isOp = comment.authorId === postAuthorId;
  const isEdited = comment.updatedAt.getTime() > comment.createdAt.getTime();

  async function run(action: () => Promise<unknown>, successMessage?: string) {
    try {
      await action();
      if (successMessage !== undefined) {
        toast.success({ title: successMessage });
      }
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  function handleSelect({ value }: { readonly value: string }) {
    switch (value) {
      case "save":
        return run(() => saveItem({ payload: { commentId: comment.id }, reactivityKeys: [Keys.saved] }), t.post.saved);
      case "unsave":
        return run(
          () => unsaveItem({ query: { commentId: comment.id }, reactivityKeys: [Keys.saved] }),
          t.post.unsaved,
        );
      case "report":
        setReportOpen(true);
        return;
      case "edit":
        setEditing(true);
        return;
      case "delete":
        setDeleteOpen(true);
        return;
      case "remove":
        return run(() =>
          removeComment({ params: { id: comment.id }, payload: {}, reactivityKeys: [Keys.comments(postId)] }),
        );
      default:
        return;
    }
  }

  if (collapsed) {
    return (
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <button
          aria-label={t.comments.expand(countDescendants(node) + 1)}
          className="text-primary font-medium hover:underline"
          onClick={() => setCollapsed(false)}
          type="button"
        >
          [+]
        </button>
        <UserLink className="truncate" id={comment.authorId} />
        <TimeAgo date={comment.createdAt} />
        <span>{t.comments.expand(countDescendants(node) + 1)}</span>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        aria-label={t.comments.collapse}
        className="group flex w-4 shrink-0 justify-center"
        onClick={() => setCollapsed(true)}
        type="button"
      >
        <span className="bg-border group-hover:bg-primary group-active:bg-primary w-0.5 rounded-full transition-colors" />
      </button>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
          <UserLink className="text-foreground truncate" id={comment.authorId} />
          {isOp && (
            <span className="bg-primary/16 text-primary rounded px-1 py-0.5 text-[10px] font-semibold">
              {t.comments.op}
            </span>
          )}
          <TimeAgo date={comment.createdAt} />
          {isEdited && <span className="italic">({t.common.edited})</span>}
          {comment.removed && <span className="text-destructive">{t.comments.removed}</span>}
        </div>

        {Match.value({ editing, removed: comment.removed }).pipe(
          Match.when({ editing: true }, () => (
            <CommentEditForm comment={comment} onDone={() => setEditing(false)} postId={postId} />
          )),
          Match.when({ removed: true }, () => (
            <p className="text-muted-foreground text-sm italic">{t.comments.removed}</p>
          )),
          Match.orElse(() => <PortableTextView value={comment.content} />),
        )}

        <div className="flex flex-wrap items-center gap-1">
          <VoteButtons compact kind="comment" score={comment.score} targetId={comment.id} />
          {!locked && (
            <Button onClick={() => setReplying((current) => !current)} size="xs" variant="ghost">
              {t.comments.replyAction}
            </Button>
          )}
          <Menu onSelect={handleSelect}>
            <MenuTrigger asChild>
              <Button aria-label={t.common.actions} size="icon-xs" variant="ghost">
                <MoreHorizontalIcon />
              </Button>
            </MenuTrigger>
            <MenuContent className="min-w-40">
              <SaveMenuItem commentId={comment.id} />
              <MenuItem value="report">{t.post.reportAction}</MenuItem>
              {isAuthor && !comment.removed && (
                <>
                  <MenuSeparator />
                  <MenuItem value="edit">{t.common.edit}</MenuItem>
                  <MenuItem className="text-destructive" value="delete">
                    {t.common.delete}
                  </MenuItem>
                </>
              )}
              {comment.spaceId !== null && !comment.removed && (
                <>
                  <MenuSeparator />
                  <MenuItem value="remove">{t.post.removeActionMod}</MenuItem>
                </>
              )}
            </MenuContent>
          </Menu>
        </div>

        {replying && (
          <div className="mt-1">
            <CommentComposer autoFocus onDone={() => setReplying(false)} parentId={comment.id} postId={postId} />
          </div>
        )}

        {node.children.length > 0 && depth < MAX_DEPTH && (
          <div className="mt-1 flex flex-col gap-3">
            {node.children.map((child) => (
              <CommentItem
                depth={depth + 1}
                key={child.comment.id}
                locked={locked}
                node={child}
                postAuthorId={postAuthorId}
                postId={postId}
              />
            ))}
          </div>
        )}
        {node.children.length > 0 && depth >= MAX_DEPTH && (
          <MoreRepliesButton count={countDescendants(node)} node={node} />
        )}
      </div>

      <ReportDialog commentId={comment.id} onOpenChange={setReportOpen} open={reportOpen} />
      <ConfirmDialog
        confirmLabel={t.common.delete}
        description={t.comments.deleteConfirmBody}
        destructive
        onConfirm={() =>
          deleteComment({
            params: { id: comment.id },
            reactivityKeys: [Keys.comments(postId), Keys.post(postId)],
          }).then(() => undefined)
        }
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title={t.comments.deleteConfirmTitle}
      />
    </div>
  );
}

interface CommentTreeProps {
  readonly nodes: ReadonlyArray<CommentNode>;
  readonly postId: string;
  readonly postAuthorId: string;
  readonly locked: boolean;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +--------------------------------------------------+
 * | | Author [OP] · 2h ago                           |
 * | | Comment body text...                           |
 * | | [^] 5 [v]  [Reply] [...]                      |
 * | |   | Child author · 1h ago                      |
 * | |   | Reply text...                              |
 * | |   | [^] 2 [v]  [Reply] [...]                  |
 * +--------------------------------------------------+
 *
 * Width handling (each comment row):
 * +--------------------------------------------------+
 * | | Author.. [OP] · 2h ago            (flex-wrap)  |
 * | | Comment body (wrap-anywhere)                   |
 * | | [^] 5 [v] [Reply] [...]           (flex-wrap)  |
 * +--------------------------------------------------+
 *  fixed ^------------ min-w-0 flex-1 --------------^
 *
 * flex-col gap-3 递归树形结构，所有断点布局一致。
 * 每级通过可点击折叠线（w-2.5, 1px border, hover -> primary）缩进。
 * 窄端：header 行 flex-wrap，作者链接 truncate（超长名截断为省略号）；动作行
 * flex-wrap（按钮自带 shrink-0，深嵌套 320px 下折行而非溢出）；折叠态行作者
 * truncate，时间与计数保持 min-content 不被压缩。
 * 宽端：内容列 min-w-0 flex-1 吃满余宽，行内各项保持内容宽，留白落在行尾。
 * 最大深度 MAX_DEPTH=4；超过后显示"展开 N 条回复"链接，行内展开
 * （行内行 wrap-anywhere，超长名/词断行）。
 * 折叠态：[+] 作者 · 时间 · N 条评论。
 * 边界：0 条评论 → 不渲染（父组件显示空态）。
 *       帖子已锁 → 隐藏回复按钮。
 *       已移除评论 → 斜体提示，编辑/删除隐藏。
 *       当评论作者 == 帖子作者时显示 OP 标记。
 */
export function CommentTree({ nodes, postId, postAuthorId, locked }: CommentTreeProps) {
  return (
    <div className="flex flex-col gap-3">
      {nodes.map((node) => (
        <CommentItem key={node.comment.id} locked={locked} node={node} postAuthorId={postAuthorId} postId={postId} />
      ))}
    </div>
  );
}
