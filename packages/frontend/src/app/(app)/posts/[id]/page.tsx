"use client";

import { commentsQuery } from "@/atoms/comments";
import { Keys } from "@/atoms/keys";
import { postQuery, updatePostAtom } from "@/atoms/posts";
import { CommentComposer } from "@/components/comment/CommentComposer";
import { buildCommentTree, CommentTree } from "@/components/comment/CommentTree";
import { PollView } from "@/components/post/PollView";
import { PostCard } from "@/components/post/PostCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PortableTextEditor } from "@/components/shared/PortableTextEditor";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { SpaceLink } from "@/components/shared/SpaceLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { toPortableTextContent } from "@/lib/portable-text";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import type { Post } from "@openworks/backend/api";
import { ArrowLeftIcon } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";

interface PostEditFormProps {
  readonly post: Post;
  readonly onDone: () => void;
}

function PostEditForm({ post, onDone }: PostEditFormProps) {
  const [t] = useT();
  const [title, setTitle] = useState(post.title);
  const [blocks, setBlocks] = useState<ReadonlyArray<unknown> | undefined>(post.content ?? undefined);
  const [url, setUrl] = useState(post.url ?? "");
  const [busy, setBusy] = useState(false);
  const updatePost = useAtomSet(updatePostAtom, { mode: "promise" });

  const hasUrl = post.type === "link" || post.type === "image";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await updatePost({
        params: { id: post.id },
        payload: {
          title,
          content: hasUrl ? undefined : toPortableTextContent(blocks),
          url: hasUrl ? url : undefined,
        },
        reactivityKeys: [Keys.posts, Keys.post(post.id)],
      });
      onDone();
    } catch (error) {
      showApiError(t.errors, error);
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader title={t.composer.editTitle} />
      <form className="contents" onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium" htmlFor="edit-title">
              {t.composer.postTitle}
            </label>
            <Input id="edit-title" onChange={(event) => setTitle(event.target.value)} required value={title} />
          </div>
          {hasUrl ? (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="edit-url">
                {t.composer.url}
              </label>
              <Input id="edit-url" onChange={(event) => setUrl(event.target.value)} type="url" value={url} />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="edit-body">
                {t.composer.body}
              </label>
              <PortableTextEditor
                className="min-h-40"
                id="edit-body"
                initialValue={post.content ?? undefined}
                onChange={setBlocks}
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button onClick={onDone} type="button" variant="outline">
            {t.common.cancel}
          </Button>
          <Button isLoading={busy} type="submit">
            {t.common.save}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

interface CommentListProps {
  readonly postId: string;
  readonly postAuthorId: string;
  readonly locked: boolean;
  readonly sort: "top" | "new";
}

function CommentList({ postId, postAuthorId, locked, sort }: CommentListProps) {
  const [t] = useT();
  const result = useAtomSuspense(commentsQuery(postId));
  const tree = useMemo(() => buildCommentTree(result.value, sort), [result.value, sort]);

  if (tree.length === 0) {
    return <EmptyState title={t.comments.empty} />;
  }

  return <CommentTree locked={locked} nodes={tree} postAuthorId={postAuthorId} postId={postId} />;
}

function PostDetail({ id }: { readonly id: string }) {
  const [t] = useT();
  const router = useRouter();
  const result = useAtomSuspense(postQuery(id));
  const [editing, setEditing] = useState(false);
  const [sort, setSort] = useState<"top" | "new">("top");

  const post = result.value;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2 text-sm">
        <Button onClick={() => router.back()} size="sm" variant="ghost">
          <ArrowLeftIcon />
          {t.nav.back}
        </Button>
        {post.spaceId !== null && (
          <>
            <span className="text-muted-foreground" aria-hidden>
              ·
            </span>
            <SpaceLink className="text-muted-foreground hover:text-foreground truncate" id={post.spaceId} />
          </>
        )}
      </div>

      {editing ? (
        <PostEditForm onDone={() => setEditing(false)} post={post} />
      ) : (
        <PostCard detail onDeleted={() => router.push("/")} onEdit={() => setEditing(true)} post={post} />
      )}

      {post.type === "poll" && (
        <SectionBoundary>
          <PollView postId={post.id} />
        </SectionBoundary>
      )}

      <section className="flex flex-col gap-3">
        {post.locked ? (
          <p className="bg-muted/48 text-muted-foreground rounded-lg border p-3 text-sm">{t.comments.lockedNotice}</p>
        ) : (
          <CommentComposer postId={post.id} />
        )}

        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">{t.comments.title(post.commentCount)}</h2>
          <SimpleSelect
            ariaLabel={t.comments.sortTop}
            className="w-28 shrink-0"
            items={[
              { value: "top", label: t.comments.sortTop },
              { value: "new", label: t.comments.sortNew },
            ]}
            onChange={(value) => setSort(value === "new" ? "new" : "top")}
            value={sort}
          />
        </div>

        <SectionBoundary>
          <CommentList locked={post.locked} postAuthorId={post.authorId} postId={post.id} sort={sort} />
        </SectionBoundary>
      </section>
    </div>
  );
}

/**
 * Mobile (<640px):
 * +-----------------------------+
 * | [<- Back] · Space Name      |
 * |-----------------------------|
 * | [PostCard detail=true]      |
 * | [PollView? if type=poll]    |
 * |-----------------------------|
 * | [CommentComposer] or Locked |
 * | Comments (3)  [Sort: v Top] |
 * | [CommentTree]               |
 * +-----------------------------+
 * w-full, single column. All content
 * fills available width.
 *
 * Tablet (640-1023px):
 * +--------------------------------------+
 * | [<- Back]  · Space Name              |
 * |--------------------------------------|
 * | [PostCard detail=true]               |
 * | [PollView? -- if type=poll]          |
 * |--------------------------------------|
 * | [CommentComposer] or "Locked" notice |
 * | Comments (3)          [Sort: v Top]  |
 * | [CommentTree]                        |
 * +--------------------------------------+
 * same structure -- max-w-3xl centered.
 *
 * Desktop (1024-1535px):
 * +---------------------------------------------+
 * | [<- Back]  · Space Name                     |
 * |---------------------------------------------|
 * | [PostCard detail=true]                      |
 * | [PollView? -- if type=poll]                 |
 * |---------------------------------------------|
 * | [CommentComposer] or "Locked" notice        |
 * | Comments (3)              [Sort: v Top]     |
 * | [CommentTree]                               |
 * +---------------------------------------------+
 * same structure -- max-w-3xl centered with
 * wider viewport margins.
 *
 * Ultra-wide (>=1536px):
 * +-------------------------------------------------------+
 * |      [<- Back]  · Space Name                          |
 * |-------------------------------------------------------|
 * |      [PostCard detail=true]                           |
 * |      [PollView? -- if type=poll]                      |
 * |-------------------------------------------------------|
 * |      [CommentComposer] or "Locked" notice             |
 * |      Comments (3)              [Sort: v Top]          |
 * |      [CommentTree]                                    |
 * +-------------------------------------------------------+
 * same structure -- max-w-3xl (48rem) centered,
 * large symmetric margins from mx-auto.
 *
 * w-full max-w-3xl mx-auto 居中容器。单列布局，无响应式断点。
 * 行内宽度处置：返回行 = [Back] 按钮（自带 shrink-0）+ 分隔点 + 空间链接
 * （truncate，超长名截断为省略号）；评论标题行 = h2（固定短文本）+ 排序
 * 选择器（w-28 shrink-0），justify-between 推开两端；编辑表单 footer 为
 * 固定宽按钮右对齐（justify-end），留白落在行首。
 * 编辑模式时 PostCard 替换为 PostEditForm（标题 + 正文/URL 编辑）。
 * 边界：已锁帖 -> CommentComposer 替换为锁帖提示横幅。
 *       0 条评论 -> EmptyState。
 *       删除帖子后跳转首页。
 *       linkUrl 为 null -> 不跳转。
 */
export default function PostDetailPage() {
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <SectionBoundary>
        <PostDetail id={params.id} />
      </SectionBoundary>
    </div>
  );
}
