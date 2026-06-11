"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import type { FallbackProps } from "react-error-boundary";

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 * +-------------------------------+
 * |      "Failed to load"         |
 * |          [Retry]              |
 * +-------------------------------+
 *
 * 居中列，py-16。作为 ErrorBoundary 的 fallback。
 * 重试按钮调用 resetErrorBoundary 重新渲染子组件。
 */
export function PageError({ resetErrorBoundary }: FallbackProps) {
  const [t] = useT();

  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <p className="text-muted-foreground text-sm">{t.errors.loadFailed}</p>
      <Button onClick={resetErrorBoundary} size="sm" variant="outline">
        {t.common.retry}
      </Button>
    </div>
  );
}
