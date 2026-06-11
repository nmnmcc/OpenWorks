"use client";

import { PAGE_SIZE, searchQuery } from "@/atoms/posts";
import { PostCard } from "@/components/post/PostCard";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import { useAtomSuspense } from "@effect/atom-react";
import { SearchIcon } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { useState } from "react";

interface SearchResultsPageProps {
  readonly q: string;
  readonly offset: number;
  readonly isLast: boolean;
  readonly onLoadMore: () => void;
}

function SearchResultsPage({ q, offset, isLast, onLoadMore }: SearchResultsPageProps) {
  const [t] = useT();
  const result = useAtomSuspense(searchQuery({ q, offset }));
  const { hits, estimatedTotalHits } = result.value;

  if (offset === 0 && hits.length === 0) {
    return <EmptyState icon={<SearchIcon />} title={t.search.empty} />;
  }

  return (
    <>
      {offset === 0 && <p className="text-muted-foreground text-sm">{t.search.resultCount(estimatedTotalHits)}</p>}
      {hits.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {isLast && hits.length === PAGE_SIZE && (
        <Button className="self-center" onClick={onLoadMore} variant="outline">
          {t.common.loadMore}
        </Button>
      )}
    </>
  );
}

function SearchResults({ q }: { readonly q: string }) {
  const [pageCount, setPageCount] = useState(1);
  const offsets = Array.from({ length: pageCount }, (_, index) => index * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      {offsets.map((offset) => (
        <SectionBoundary key={offset}>
          <SearchResultsPage
            isLast={offset === (pageCount - 1) * PAGE_SIZE}
            offset={offset}
            onLoadMore={() => setPageCount((count) => count + 1)}
            q={q}
          />
        </SectionBoundary>
      ))}
    </div>
  );
}

function SearchContent() {
  const [t] = useT();
  const [rawQ] = useQueryState("q", parseAsString.withDefault(""));
  const q = rawQ.trim();

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-4 text-xl font-semibold wrap-anywhere">
        {q.length > 0 ? t.search.resultsFor(q) : t.search.title}
      </h1>
      {q.length === 0 ? <EmptyState icon={<SearchIcon />} title={t.search.prompt} /> : <SearchResults key={q} q={q} />}
    </div>
  );
}

/**
 * Mobile (<640px):
 * +-----------------------------+
 * | "Results for: query"        |
 * | N results                   |
 * | [PostCard]                  |
 * | [PostCard]                  |
 * |       [Load more]          |
 * +-----------------------------+
 * w-full, single column fills
 * available width.
 *
 * Tablet (640-1023px):
 * +--------------------------------------+
 * | "Results for: query"                 |
 * | N results                            |
 * | [PostCard]                           |
 * | [PostCard]                           |
 * |           [Load more]               |
 * +--------------------------------------+
 * same structure -- max-w-3xl centered.
 *
 * Desktop (1024-1535px):
 * +------------------------------------------+
 * | "Results for: query"                     |
 * | N results                                |
 * | [PostCard]                               |
 * | [PostCard]                               |
 * |           [Load more]                    |
 * +------------------------------------------+
 * same structure -- max-w-3xl centered with
 * wider viewport margins.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------+
 * |      "Results for: query"                        |
 * |      N results                                   |
 * |      [PostCard]                                  |
 * |      [PostCard]                                  |
 * |               [Load more]                        |
 * +--------------------------------------------------+
 * same structure -- max-w-3xl (48rem) centered,
 * large symmetric margins from mx-auto.
 *
 * w-full max-w-3xl mx-auto 居中容器。从 URL searchParams 读取 ?q=。
 * 无响应式断点——所有尺寸结构一致。纵向单列无同行并列；标题含用户输入的
 * 查询串，wrap-anywhere 断行（超长无空格查询不溢出）。
 * 边界：q 为空 -> 显示搜索提示 EmptyState。
 *       0 结果 -> 显示空结果 EmptyState。
 *       Suspense 包裹 useSearchParams 以满足 Next.js 要求。
 *       分页通过 offset 追加 SearchResultsPage，每页 PAGE_SIZE 条。
 */
export default function SearchPage() {
  return <SearchContent />;
}
