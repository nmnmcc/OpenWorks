"use client";

import { PostFeed } from "@/components/post/PostFeed";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/locale";
import { useState } from "react";

type FeedKind = "home" | "all";
type SortKind = "hot" | "new" | "top";

function parseSort(value: string): SortKind {
  return value === "new" ? "new" : value === "top" ? "top" : "hot";
}

/**
 * Mobile (<640px):
 * +-----------------------------+
 * | [Home|All]   [Sort: v Hot]  |
 * |  ^tabs        ^w-32 shrink-0|
 * |-----------------------------|
 * | [PostCard]                  |
 * | [PostCard]                  |
 * | [PostCard]                  |
 * |       [Load more]          |
 * +-----------------------------+
 * w-full, same structure. 320px: sort select
 * keeps w-32 (shrink-0); tabs list is the
 * shrinking item (max-w-full overflow-x-auto,
 * scrolls instead of clipping).
 *
 * Tablet (640-1023px):
 * +--------------------------------------+
 * | [Home | All]          [Sort: v Hot]  |
 * |--------------------------------------|
 * | [PostCard]                           |
 * | [PostCard]                           |
 * | [PostCard]                           |
 * |           [Load more]               |
 * +--------------------------------------+
 * same structure -- max-w-3xl centered,
 * comfortable spacing in top bar.
 *
 * Desktop (1024-1535px):
 * +------------------------------------------+
 * | [Home | All]              [Sort: v Hot]  |
 * |------------------------------------------|
 * | [PostCard]                               |
 * | [PostCard]                               |
 * | [PostCard]                               |
 * |           [Load more]                    |
 * +------------------------------------------+
 * same structure -- max-w-3xl centered with
 * wider viewport margin on both sides.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------+
 * |      [Home | All]              [Sort: v Hot]      |
 * |--------------------------------------------------|
 * |      [PostCard]                                   |
 * |      [PostCard]                                   |
 * |      [PostCard]                                   |
 * |               [Load more]                         |
 * +--------------------------------------------------+
 * same structure -- max-w-3xl (48rem) centered,
 * large symmetric margins from mx-auto.
 *
 * w-full max-w-3xl mx-auto 居中容器。顶部栏：左侧 Tabs 切换
 * feed（home/all），右侧 SimpleSelect 切换排序（hot/new/top）。
 * 顶栏宽度处置：窄端排序选择器 w-32 shrink-0 不压缩，tabs 列表
 * max-w-full + overflow-x-auto 收缩（必要时内部横滚）；宽端
 * justify-between 把两端推开，余宽落在中间。
 * 顶栏控件等高：选择器 h-9 sm:h-8 与 TabsTrigger（h-9 sm:h-8）一致。
 * feed/sort 变化时通过 key 重建 PostFeed。
 * 无响应式断点——所有尺寸结构一致。
 * 边界：空 feed -> PostFeed 内部处理空态。
 */
export default function HomePage() {
  const [t] = useT();
  const [feed, setFeed] = useState<FeedKind>("home");
  const [sort, setSort] = useState<SortKind>("hot");

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <Tabs onValueChange={(details) => setFeed(details.value === "all" ? "all" : "home")} value={feed}>
          <TabsList>
            <TabsTrigger value="home">{t.feed.home}</TabsTrigger>
            <TabsTrigger value="all">{t.feed.all}</TabsTrigger>
          </TabsList>
        </Tabs>

        <SimpleSelect
          ariaLabel={t.feed.hot}
          className="h-9 w-32 shrink-0 sm:h-8"
          items={[
            { value: "hot", label: t.feed.hot },
            { value: "new", label: t.feed.new },
            { value: "top", label: t.feed.top },
          ]}
          onChange={(value) => setSort(parseSort(value))}
          value={sort}
        />
      </div>

      <PostFeed feed={feed} key={`${feed}:${sort}`} sort={sort} />
    </div>
  );
}
