"use client";

import { PageError } from "@/components/shared/PageError";
import { Spinner } from "@/components/ui/spinner";
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface SectionBoundaryProps {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * 加载态（默认 fallback）：
 * +-------------------------------+
 * |          [Spinner]            |
 * |          (py-12)              |
 * +-------------------------------+
 *
 * 错误边界 + Suspense 包裹层。
 * 加载中显示居中 spinner；出错渲染 PageError（带重试按钮）。
 */
export function SectionBoundary({ children, fallback }: SectionBoundaryProps) {
  return (
    <ErrorBoundary FallbackComponent={PageError}>
      <Suspense
        fallback={
          fallback ?? (
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          )
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
