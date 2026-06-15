"use client";

import { postsPageQuery } from "@/atoms/posts";
import { WorkCarouselRow } from "@/components/library/WorkCarouselRow";
import { PostCard } from "@/components/post/PostCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { useT } from "@/lib/i18n/locale";
import { Fragment, type ReactNode } from "react";

/** 第一条轮播插在第 FIRST_AT 张帖子卡之后，此后每 EVERY 张插一条（交替 new/popular）。 */
const FIRST_AT = 4;
const EVERY = 6;

interface PostFeedProps {
  readonly feed?: "home" | "all";
  readonly spaceId?: string;
  readonly sort: "hot" | "new" | "top";
  readonly emptyState?: ReactNode;
  readonly hideSpace?: boolean;
  readonly hideAuthor?: boolean;
  /** 仅首页 feed 开启：按节奏在帖子卡之间穿插作品轮播行。 */
  readonly withWorkCarousels?: boolean;
}

function carouselIndexAfter(globalIndex: number): number | null {
  const position = globalIndex + 1;
  if (position < FIRST_AT || (position - FIRST_AT) % EVERY !== 0) {
    return null;
  }
  return (position - FIRST_AT) / EVERY;
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
 * withWorkCarousels（仅首页 feed）：第 4 张帖子卡之后插入第一条作品
 * 轮播行（WorkCarouselRow，横滚），之后每 6 张交替插入"最新/热门"
 * 轮播；插入位置按全局序号（offset + 页内序号）计算，跨分页连续。
 * 边界：首页 0 条 → EmptyState（不渲染任何轮播）。
 *       轮播数据为空 → 该行自行返回 null，feed 不留空洞。
 *       已隐藏帖子由服务端过滤（posts.list 排除当前用户 hiddenPosts）。
 */
export function PostFeed({ feed, spaceId, sort, emptyState, hideSpace, hideAuthor, withWorkCarousels }: PostFeedProps) {
  const [t] = useT();

  return (
    <SectionBoundary>
      <PagedList
        className="gap-3"
        emptyState={emptyState ?? <EmptyState hint={t.feed.emptyHint} title={t.feed.empty} />}
        pageQuery={(offset) => postsPageQuery({ feed, spaceId, sort, offset })}
        renderPage={(posts, offset) =>
          posts.map((post, index) => {
            const carouselIndex = withWorkCarousels === true ? carouselIndexAfter(offset + index) : null;
            return (
              <Fragment key={post.id}>
                <PostCard hideAuthor={hideAuthor} hideSpace={hideSpace} post={post} />
                {carouselIndex !== null && <WorkCarouselRow sort={carouselIndex % 2 === 0 ? "new" : "popular"} />}
              </Fragment>
            );
          })
        }
      />
    </SectionBoundary>
  );
}
