"use client";

import { commentQuery } from "@/atoms/comments";
import { Keys } from "@/atoms/keys";
import { postQuery } from "@/atoms/posts";
import { savedPageQuery, unsaveItemAtom } from "@/atoms/saved";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { portableTextToPlainText } from "@/lib/portable-text";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { SavedItemEntry } from "@openworks/backend/api";
import { BookmarkIcon } from "lucide-react";
import Link from "next/link";

function SavedPostRow({ postId }: { readonly postId: string }) {
  const [t] = useT();
  const result = useAtomValue(postQuery(postId));

  if (!AsyncResult.isSuccess(result)) {
    return <Skeleton className="h-5 w-48" />;
  }

  return (
    <div className="min-w-0">
      <Badge className="mb-1" variant="secondary">
        {t.saved.postLabel}
      </Badge>
      <Link className="block truncate font-medium hover:underline" href={`/posts/${postId}`}>
        {result.value.title}
      </Link>
    </div>
  );
}

function SavedCommentRow({ commentId }: { readonly commentId: string }) {
  const [t] = useT();
  const result = useAtomValue(commentQuery(commentId));

  if (!AsyncResult.isSuccess(result)) {
    return <Skeleton className="h-5 w-48" />;
  }

  return (
    <div className="min-w-0">
      <Badge className="mb-1" variant="secondary">
        {t.saved.commentLabel}
      </Badge>
      <Link className="block hover:underline" href={`/posts/${result.value.postId}`}>
        <span className="line-clamp-2 text-sm">{portableTextToPlainText(result.value.content)}</span>
      </Link>
    </div>
  );
}

function SavedEntryCard({ entry }: { readonly entry: SavedItemEntry }) {
  const [t] = useT();
  const unsaveItem = useAtomSet(unsaveItemAtom, { mode: "promise" });

  async function handleUnsave() {
    try {
      await unsaveItem({
        query: { postId: entry.postId ?? undefined, commentId: entry.commentId ?? undefined },
        reactivityKeys: [Keys.saved],
      });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <Card className="flex-row items-center gap-3 p-3 [--space:--spacing(3)]">
      <div className="min-w-0 flex-1">
        {entry.postId !== null && <SavedPostRow postId={entry.postId} />}
        {entry.commentId !== null && <SavedCommentRow commentId={entry.commentId} />}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TimeAgo className="text-muted-foreground text-xs" date={entry.createdAt} />
        <Button onClick={handleUnsave} size="xs" variant="outline">
          {t.post.unsaveAction}
        </Button>
      </div>
    </Card>
  );
}

function SavedList() {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState icon={<BookmarkIcon />} title={t.saved.empty} />}
      pageQuery={savedPageQuery}
      renderPage={(entries) => entries.map((entry) => <SavedEntryCard entry={entry} key={entry.id} />)}
    />
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Saved                                    |
 * | +--------------------------------------+ |
 * | | [Post] Title...   3h ago [Unsave]    | |
 * | |  ^min-w-0 flex-1   ^--- shrink-0 ---^ | |
 * | |   title truncate / comment clamp-2   | |
 * | +--------------------------------------+ |
 * | | [Comment] Text... 1d ago [Unsave]    | |
 * | +--------------------------------------+ |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | Saved                                          |
 * | +--------------------------------------------+ |
 * | | [Post] Post title...       3h ago [Unsave] | |
 * | +--------------------------------------------+ |
 * | | [Comment] Comment text...  1d ago [Unsave] | |
 * | +--------------------------------------------+ |
 * +------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * |       Saved                                          |
 * |       +--------------------------------------------+ |
 * |       | [Post] Post title...       3h ago [Unsave] | |
 * |       +--------------------------------------------+ |
 * |       | [Comment] Comment text...  1d ago [Unsave] | |
 * |       +--------------------------------------------+ |
 * +------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * |            Saved                                               |
 * |            +--------------------------------------------+      |
 * |            | [Post] Post title...       3h ago [Unsave] |      |
 * |            +--------------------------------------------+      |
 * |            | [Comment] Comment text...  1d ago [Unsave] |      |
 * |            +--------------------------------------------+      |
 * +----------------------------------------------------------------+
 *                w-full max-w-3xl mx-auto
 *
 * max-w-3xl (48rem) 居中容器，所有断点布局相同，仅两侧留白随视口增大。
 * 每项 Card 始终为 flex-row 横向布局：左侧内容 (min-w-0 flex-1) + 右侧时间与操作 (shrink-0)。
 * Post 与 Comment 通过 Badge 标签区分，Comment 内容 line-clamp-2 截断。
 * 边界：0 项 → EmptyState（书签图标）。
 *       帖子/评论异步加载，未就绪时显示 Skeleton。
 *       超长标题通过 truncate 截断；极窄视口 (320px) 下标题与按钮仍为同行。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function SavedPage() {
  const [t] = useT();

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-4 text-xl font-semibold">{t.saved.title}</h1>
        <SectionBoundary>
          <SavedList />
        </SectionBoundary>
      </div>
    </RequireAuth>
  );
}
