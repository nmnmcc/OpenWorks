"use client";

import { userQuery } from "@/atoms/users";
import { Skeleton } from "@/components/ui/skeleton";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import Link from "next/link";

interface UserLinkProps {
  readonly id: string;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- inline text, no responsive breakpoints):
 *
 *   ... posted by DisplayName ...     (loaded: medium-weight link, hover underline)
 *   ... posted by [▒▒▒▒▒▒]    ...     (loading: inline skeleton, h-3.5 w-16)
 *   ... posted by unknown     ...     (failed: muted fallback text)
 *
 * 行内元素，随宿主文本流排版；自身不截断不换行，宽度处置（truncate/min-w-0 等）
 * 由调用方通过 className 按其行布局决定。
 */
export function UserLink({ id, className }: UserLinkProps) {
  const [t] = useT();
  const result = useAtomValue(userQuery(id));

  if (AsyncResult.isSuccess(result)) {
    const user = result.value;
    return (
      <Link className={cn("font-medium hover:underline", className)} href={`/users/${id}`}>
        {user.displayName ?? user.name}
      </Link>
    );
  }

  if (AsyncResult.isFailure(result)) {
    return <span className={cn("text-muted-foreground", className)}>{t.common.unknown}</span>;
  }

  return <Skeleton className={cn("inline-block h-3.5 w-16 align-middle", className)} />;
}
