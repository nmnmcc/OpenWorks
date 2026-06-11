"use client";

import { postsPageQuery } from "@/atoms/posts";
import { PostCard } from "@/components/post/PostCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { useT } from "@/lib/i18n/locale";
import type { ReactNode } from "react";

interface PostFeedProps {
  readonly feed?: "home" | "all";
  readonly spaceId?: string;
  readonly sort: "hot" | "new" | "top";
  readonly emptyState?: ReactNode;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +-------------------------------+
 * | [PostCard]                    |
 * | [PostCard]                    |
 * | [PostCard]                    |
 * |       [Load more]             |
 * +-------------------------------+
 *
 * 单列竖向帖子卡片列表（flex-col gap-3），所有断点布局一致。
 * 分页由 PagedList 承担：末页满载时显示"加载更多"（self-center），
 * 追加页在 transition 中加载，旧内容保持可见。
 * 边界：首页 0 条 → EmptyState。
 *       已隐藏帖子由服务端过滤（posts.list 排除当前用户 hiddenPosts）。
 */
export function PostFeed({ feed, spaceId, sort, emptyState }: PostFeedProps) {
  const [t] = useT();

  return (
    <SectionBoundary>
      <PagedList
        className="gap-3"
        emptyState={emptyState ?? <EmptyState hint={t.feed.emptyHint} title={t.feed.empty} />}
        pageQuery={(offset) => postsPageQuery({ feed, spaceId, sort, offset })}
        renderPage={(posts) => posts.map((post) => <PostCard key={post.id} post={post} />)}
      />
    </SectionBoundary>
  );
}
