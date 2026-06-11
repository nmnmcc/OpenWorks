"use client";

import { worksPageQuery, workSearchQuery } from "@/atoms/works";
import { SectionBoundary } from "@/components/SectionBoundary";
import { WorkCard } from "@/components/library/WorkCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useT } from "@/lib/i18n/locale";
import { useAtomSuspense } from "@effect/atom-react";
import { BookOpenIcon, PlusIcon, SearchIcon } from "lucide-react";
import Link from "next/link";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";
import type { WorksPageArgs } from "@/atoms/works";
import { PAGE_SIZE } from "@/atoms/posts";

const TYPES = ["all", "book", "movie", "tv", "game"] as const;
const SORTS = ["popular", "new", "top"] as const;

function WorkGrid({ args }: { readonly args: Omit<WorksPageArgs, "offset"> }) {
  const [t] = useT();

  return (
    <PagedList
      className="gap-4"
      emptyState={<EmptyState icon={<BookOpenIcon />} title={t.common.noResults} />}
      pageQuery={(offset) => worksPageQuery({ ...args, offset })}
      renderContainer={(pages) => (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
          {pages}
        </div>
      )}
      renderPage={(works) => works.map((work) => <WorkCard key={work.id} work={work} />)}
    />
  );
}

function SearchResults({ q, type }: { readonly q: string; readonly type?: string }) {
  const [pageCount, setPageCount] = useState(1);
  const offsets = Array.from({ length: pageCount }, (_, i) => i * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-4">
      {offsets.map((offset) => (
        <SectionBoundary key={offset}>
          <SearchResultsPage
            isLast={offset === (pageCount - 1) * PAGE_SIZE}
            offset={offset}
            onLoadMore={() => setPageCount((c) => c + 1)}
            q={q}
            type={type}
          />
        </SectionBoundary>
      ))}
    </div>
  );
}

function SearchResultsPage({
  q,
  type,
  offset,
  isLast,
  onLoadMore,
}: {
  readonly q: string;
  readonly type?: string;
  readonly offset: number;
  readonly isLast: boolean;
  readonly onLoadMore: () => void;
}) {
  const [t] = useT();
  const result = useAtomSuspense(workSearchQuery(q, type, offset));

  if (offset === 0 && result.value.hits.length === 0) {
    return <EmptyState icon={<SearchIcon />} title={t.common.noResults} />;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
        {result.value.hits.map((work) => (
          <WorkCard key={work.id} work={work} />
        ))}
      </div>
      {isLast && result.value.hits.length === PAGE_SIZE && (
        <Button className="self-center" onClick={onLoadMore} variant="outline">
          {t.common.loadMore}
        </Button>
      )}
    </>
  );
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | Library                       [+ New]    |
 * | [All][Book][Movie][TV][Game]             |
 * |  ^------- TabsList scroll-x --------^    |
 * | [Sort v] [Search________________] [Q]   |
 * |  ^shrink-0  ^flex-1 min-w-0   ^shrink-0  |
 * | +------+ +------+                       |
 * | |cover | |cover |  <- grid-cols-2        |
 * | |Title | |Title |                       |
 * | +------+ +------+                       |
 * |       [Load more]                       |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | Library                             [+ New]        |
 * | [All] [Book] [Movie] [TV] [Game]                   |
 * | [Sort v] [Search________________________] [Q]      |
 * | +------+ +------+ +------+                        |
 * | |cover | |cover | |cover |  <- grid-cols-3         |
 * | |Title | |Title | |Title |                        |
 * | +------+ +------+ +------+                        |
 * |            [Load more]                             |
 * +----------------------------------------------------+
 *         w-full max-w-5xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------------+
 * |     Library                                 [+ New]        |
 * |     [All] [Book] [Movie] [TV] [Game]                       |
 * |     [Sort v] [Search_________________________] [Q]         |
 * |     +------+ +------+ +------+ +------+                   |
 * |     |cover | |cover | |cover | |cover |  <- grid-cols-4    |
 * |     |Title | |Title | |Title | |Title |                   |
 * |     +------+ +------+ +------+ +------+                   |
 * |                  [Load more]                               |
 * +------------------------------------------------------------+
 *           w-full max-w-5xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------------+
 * |         Library                                      [+ New]         |
 * |         [All] [Book] [Movie] [TV] [Game]                             |
 * |         [Sort v] [Search______________________________] [Q]          |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |         |cover | |cover | |cover | |cover | |cover | <- cols-5     |
 * |         |Title | |Title | |Title | |Title | |Title |               |
 * |         +------+ +------+ +------+ +------+ +------+               |
 * |                       [Load more]                                   |
 * +----------------------------------------------------------------------+
 *               w-full max-w-5xl mx-auto
 *
 * max-w-5xl (64rem) 居中容器。类型 Tabs 控制 type 筛选，排序 Select 控制
 * sort（popular/new/top），搜索框走 Meilisearch 全文搜索。
 * WorkCard 网格 2/3/4/5 列（sm/lg/2xl 断点）。PagedList 分页。
 * 标题行：h1 与 [+ New] 均为固定短标签（按钮 shrink-0），justify-between
 * 推开两端，320px 下两者合计仍小于行宽；宽端留白落在中间。
 * 筛选行：Sort select shrink-0 w-28，搜索框 flex-1 min-w-0，搜索按钮
 * shrink-0；320px 下输入框收缩截断，控件不溢出。
 * q 非空时切换到搜索结果模式（独立分页逻辑），清空 q 回到浏览模式。
 * 边界：0 个作品 → EmptyState。搜索 0 结果 → EmptyState。
 */
export default function LibraryBrowsePage() {
  const [t] = useT();
  const [type, setType] = useQueryState("type", parseAsString.withDefault("all"));
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("popular"));
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [searchInput, setSearchInput] = useState(q);

  const handleSearch = () => {
    void setQ(searchInput.trim() || null);
  };

  const effectiveType = type === "all" ? undefined : type;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.library.title}</h1>
        <Button asChild size="sm">
          <Link href="/library/new">
            <PlusIcon className="size-4" />
            {t.library.newWork}
          </Link>
        </Button>
      </div>

      <Tabs onValueChange={(details) => void setType(details.value === "all" ? null : details.value)} value={type}>
        <TabsList>
          {TYPES.map((tp) => (
            <TabsTrigger key={tp} value={tp}>
              {tp === "all" ? t.library.browse : t.library.type[tp]}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="flex items-center gap-2">
        <SimpleSelect
          className="w-28 shrink-0"
          items={SORTS.map((s) => ({ value: s, label: t.library.sort[s] }))}
          onChange={(val) => void setSort(val)}
          value={sort}
        />
        <Input
          className="min-w-0 flex-1"
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={t.library.browse}
          value={searchInput}
        />
        <Button className="shrink-0" onClick={handleSearch} size="icon-sm" variant="outline">
          <SearchIcon className="size-4" />
        </Button>
      </div>

      <SectionBoundary>
        {q.trim() ? (
          <SearchResults key={q} q={q} type={effectiveType} />
        ) : (
          <WorkGrid
            args={{
              type: effectiveType,
              sort: sort as "popular" | "new" | "top",
              tag: undefined,
            }}
            key={`${type}-${sort}`}
          />
        )}
      </SectionBoundary>
    </div>
  );
}
