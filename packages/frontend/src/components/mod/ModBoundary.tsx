"use client";

import { EmptyState } from "@/components/shared/EmptyState";
import { PageError } from "@/components/shared/PageError";
import { Spinner } from "@/components/ui/spinner";
import { useT } from "@/lib/i18n/locale";
import { ShieldOffIcon } from "lucide-react";
import { Suspense, type ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

function ModFallback({ error, resetErrorBoundary }: FallbackProps) {
  const [t] = useT();

  const forbidden =
    typeof error === "object" &&
    error !== null &&
    "_tag" in error &&
    typeof error._tag === "string" &&
    error._tag.endsWith("Forbidden");

  if (forbidden) {
    return <EmptyState icon={<ShieldOffIcon />} title={t.mod.notModerator} />;
  }

  return <PageError error={error} resetErrorBoundary={resetErrorBoundary} />;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * 加载态：居中 spinner（py-12）。
 * 权限不足（Forbidden）→ EmptyState（盾牌图标 + 提示）。
 * 其他错误 → PageError（带重试按钮）。
 */
export function ModBoundary({ children }: { readonly children: ReactNode }) {
  return (
    <ErrorBoundary fallbackRender={ModFallback}>
      <Suspense
        fallback={
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        }
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}
