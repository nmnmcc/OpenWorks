"use client";

import { hiddenPageQuery, unhidePostAtom } from "@/atoms/hidden";
import { Keys } from "@/atoms/keys";
import { postQuery } from "@/atoms/posts";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { HiddenPostEntry } from "@openworks/backend/api";
import { EyeOffIcon } from "lucide-react";
import Link from "next/link";

function HiddenPostRow({ postId }: { readonly postId: string }) {
  const result = useAtomValue(postQuery(postId));

  if (!AsyncResult.isSuccess(result)) {
    return <Skeleton className="h-5 w-48" />;
  }

  return (
    <Link className="block truncate font-medium hover:underline" href={`/posts/${postId}`}>
      {result.value.title}
    </Link>
  );
}

function HiddenEntryCard({ entry }: { readonly entry: HiddenPostEntry }) {
  const [t] = useT();
  const unhidePost = useAtomSet(unhidePostAtom, { mode: "promise" });

  async function handleUnhide() {
    try {
      await unhidePost({ query: { postId: entry.postId }, reactivityKeys: [Keys.hidden, Keys.posts] });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <Card className="flex-row items-center gap-3 p-3 [--space:--spacing(3)]">
      <div className="min-w-0 flex-1">
        <HiddenPostRow postId={entry.postId} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TimeAgo className="text-muted-foreground text-xs" date={entry.createdAt} />
        <Button onClick={handleUnhide} size="xs" variant="outline">
          {t.post.unhideAction}
        </Button>
      </div>
    </Card>
  );
}

function HiddenList() {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState icon={<EyeOffIcon />} title={t.hidden.empty} />}
      pageQuery={hiddenPageQuery}
      renderPage={(entries) => entries.map((entry) => <HiddenEntryCard entry={entry} key={entry.id} />)}
    />
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Hidden                                   |
 * | +--------------------------------------+ |
 * | | Post title...     3h ago [Unhide]    | |
 * | |  ^min-w-0 flex-1   ^--- shrink-0 ---^ | |
 * | |   + truncate                         | |
 * | +--------------------------------------+ |
 * | | Post title...     1d ago [Unhide]    | |
 * | +--------------------------------------+ |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | Hidden                                         |
 * | +--------------------------------------------+ |
 * | | Post title link...        3h ago [Unhide]  | |
 * | +--------------------------------------------+ |
 * | | Post title link...        1d ago [Unhide]  | |
 * | +--------------------------------------------+ |
 * +------------------------------------------------+
 *         w-full max-w-3xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * |       Hidden                                         |
 * |       +--------------------------------------------+ |
 * |       | Post title link...        3h ago [Unhide]  | |
 * |       +--------------------------------------------+ |
 * |       | Post title link...        1d ago [Unhide]  | |
 * |       +--------------------------------------------+ |
 * +------------------------------------------------------+
 *           w-full max-w-3xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * |            Hidden                                              |
 * |            +--------------------------------------------+      |
 * |            | Post title link...        3h ago [Unhide]  |      |
 * |            +--------------------------------------------+      |
 * |            | Post title link...        1d ago [Unhide]  |      |
 * |            +--------------------------------------------+      |
 * +----------------------------------------------------------------+
 *                w-full max-w-3xl mx-auto
 *
 * max-w-3xl (48rem) 居中容器，所有断点布局相同，仅两侧留白随视口增大。
 * 每项 Card 始终为 flex-row 横向布局：左侧标题链接 (min-w-0 flex-1) + 右侧时间与操作 (shrink-0)。
 * 边界：0 项 → EmptyState（眼睛关闭图标）。
 *       帖子异步加载，未就绪时 Skeleton。
 *       超长标题通过 truncate 截断；极窄视口 (320px) 下标题与按钮仍为同行。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function HiddenPage() {
  const [t] = useT();

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-4 text-xl font-semibold">{t.hidden.title}</h1>
        <SectionBoundary>
          <HiddenList />
        </SectionBoundary>
      </div>
    </RequireAuth>
  );
}
