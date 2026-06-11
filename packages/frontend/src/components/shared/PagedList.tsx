"use client";

import { PAGE_SIZE } from "@/atoms/posts";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSuspense } from "@effect/atom-react";
import type * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type * as Atom from "effect/unstable/reactivity/Atom";
import { useState, useTransition, type ReactNode } from "react";

interface PagedListProps<A, E> {
  readonly pageQuery: (offset: number) => Atom.Atom<AsyncResult.AsyncResult<ReadonlyArray<A>, E>>;
  readonly renderPage: (items: ReadonlyArray<A>) => ReactNode;
  readonly renderContainer?: (pages: ReactNode) => ReactNode;
  readonly emptyState: ReactNode;
  readonly className?: string;
}

interface PagedListPageProps<A, E> {
  readonly atom: Atom.Atom<AsyncResult.AsyncResult<ReadonlyArray<A>, E>>;
  readonly renderPage: (items: ReadonlyArray<A>) => ReactNode;
}

function PagedListPage<A, E>({ atom, renderPage }: PagedListPageProps<A, E>) {
  const result = useAtomSuspense(atom);

  return <>{renderPage(result.value)}</>;
}

interface LoadMoreButtonProps<A, E> {
  readonly atom: Atom.Atom<AsyncResult.AsyncResult<ReadonlyArray<A>, E>>;
  readonly isPending: boolean;
  readonly onLoadMore: () => void;
}

function LoadMoreButton<A, E>({ atom, isPending, onLoadMore }: LoadMoreButtonProps<A, E>) {
  const [t] = useT();
  const result = useAtomSuspense(atom);

  if (result.value.length < PAGE_SIZE) {
    return null;
  }

  return (
    <Button className="self-center" isLoading={isPending} onClick={onLoadMore} variant="outline">
      {t.common.loadMore}
    </Button>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +-------------------------------+
 * | [page 0 items]                |
 * | [page 1 items]                |
 * |       [Load more]             |  <- self-center, only when last page is full
 * +-------------------------------+
 *
 * 通用分页列表（PAGE_SIZE/页，offset 递增）。根容器 flex-col（gap 由
 * className 覆盖），各页条目依序平铺；renderContainer 可把页面包进自定
 * 义容器（如 Table > TableBody，此时各页渲染 TableRow 片段）。
 * "加载更多"在 startTransition 中追加一页：等待期间旧内容保持可见，
 * 按钮显示 loading；新页就绪后无闪烁追加。
 * 边界：首页 0 条 → 渲染 emptyState；末页不满 PAGE_SIZE → 隐藏按钮。
 */
export function PagedList<A, E>({ pageQuery, renderPage, renderContainer, emptyState, className }: PagedListProps<A, E>) {
  const firstPage = useAtomSuspense(pageQuery(0));
  const [pageCount, setPageCount] = useState(1);
  const [isPending, startTransition] = useTransition();

  if (firstPage.value.length === 0) {
    return <>{emptyState}</>;
  }

  const offsets = Array.from({ length: pageCount }, (_, index) => index * PAGE_SIZE);
  const pages = offsets.map((offset) => (
    <PagedListPage atom={pageQuery(offset)} key={offset} renderPage={renderPage} />
  ));

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {renderContainer ? renderContainer(pages) : pages}
      <LoadMoreButton
        atom={pageQuery((pageCount - 1) * PAGE_SIZE)}
        isPending={isPending}
        onLoadMore={() => startTransition(() => setPageCount((count) => count + 1))}
      />
    </div>
  );
}
