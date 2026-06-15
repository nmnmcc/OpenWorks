"use client";

import { worksPageQuery } from "@/atoms/works";
import { WorkCard } from "@/components/library/WorkCard";
import { useT } from "@/lib/i18n/locale";
import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

interface WorkCarouselRowProps {
  readonly sort: "new" | "popular";
}

/**
 * Mobile (<640px):
 * +---------------------------------+
 * | New works              [All >]  |
 * | [card][card][card][ca..  ->     |
 * |  ^ w-28 shrink-0 each, overflow |
 * |    -x-auto + snap, ~2.5 visible |
 * +---------------------------------+
 *
 * Tablet (640-1023px):
 * +--------------------------------------------+
 * | New works                         [All >]  |
 * | [card][card][card][card][card][c.. ->      |
 * |  ^ w-32 each, ~4.5 visible, scrolls        |
 * +--------------------------------------------+
 *
 * Desktop (1024-1535px) / Ultra-wide (>=1536px):
 * +------------------------------------------------+
 * | New works                             [All >]  |
 * | [card][card][card][card][card][card][..  ->    |
 * |  ^ w-32 each, ~5.5 visible in max-w-3xl feed   |
 * +------------------------------------------------+
 *
 * 首页 feed 穿插的作品轮播行（REZICS 式发现性注入）。横向滚动
 * （overflow-x-auto + snap-x），卡片复用 WorkCard 并以固定宽包裹
 * （w-28 sm:w-32 shrink-0，永不收缩，超出横滚）；标题行 = 标题
 * （min-w-0 truncate）+ "查看全部"链接（shrink-0，指向 /library
 * 对应排序）。容器宽度由父级 feed 列（max-w-3xl）决定。
 * 边界：加载中/加载失败/0 条作品 → 整行不渲染（返回 null），
 * feed 不留空洞；标题超长（窄视口 + 长译文）truncate。
 */
export function WorkCarouselRow({ sort }: WorkCarouselRowProps) {
  const [t] = useT();
  const result = useAtomValue(worksPageQuery({ sort, offset: 0 }));

  if (!AsyncResult.isSuccess(result) || result.value.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h2 className="min-w-0 truncate text-sm font-medium">
          {sort === "new" ? t.feed.newWorks : t.feed.popularWorks}
        </h2>
        <Link
          className="text-muted-foreground hover:text-foreground flex shrink-0 items-center text-xs transition-colors"
          href={`/library?sort=${sort}`}
        >
          {t.common.viewAll}
          <ChevronRightIcon className="size-3.5" />
        </Link>
      </div>
      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
        {result.value.slice(0, 10).map((work) => (
          <WorkCard className="w-28 shrink-0 snap-start sm:w-32" key={work.id} work={work} />
        ))}
      </div>
    </div>
  );
}
