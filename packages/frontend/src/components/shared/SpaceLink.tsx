"use client";

import { spaceQuery } from "@/atoms/spaces";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import Link from "next/link";

interface SpaceLinkProps {
  readonly id: string;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- inline text, no responsive breakpoints):
 *
 *   ... in SpaceName ...     (loaded: medium-weight link, hover underline)
 *   ... in [▒▒▒▒▒▒]  ...     (loading: inline skeleton, h-3.5 w-16)
 *   ... in unknown   ...     (failed: muted fallback text)
 *
 * 行内元素，随宿主文本流排版；自身不截断不换行，宽度处置（truncate/min-w-0 等）
 * 由调用方通过 className 按其行布局决定。
 */
export function SpaceLink({ id, className }: SpaceLinkProps) {
  const [t] = useT();
  const result = useAtomValue(spaceQuery(id));

  if (AsyncResult.isSuccess(result)) {
    return (
      <Link className={cn("font-medium hover:underline", className)} href={`/spaces/${id}`}>
        {result.value.name}
      </Link>
    );
  }

  if (AsyncResult.isFailure(result)) {
    return <span className={cn("text-muted-foreground", className)}>{t.common.unknown}</span>;
  }

  return <Skeleton className={cn("inline-block h-3.5 w-16 align-middle", className)} />;
}
