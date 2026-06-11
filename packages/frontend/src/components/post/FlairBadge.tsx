"use client";

import { postFlairsQuery } from "@/atoms/flairs";
import { Badge } from "@/components/ui/badge";
import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";

interface FlairBadgeProps {
  readonly spaceId: string;
  readonly flairId: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * [(color-dot) Flair Name..]
 *              ^truncate（超长名截断为省略号，色点 shrink-0 不压缩）
 *
 * 内联二级 badge（variant=secondary），所有断点外观一致。
 * 窄端：badge 自带 overflow-hidden 可整体收缩，名称 truncate；宽端保持内容宽。
 * 仅 flair.color 非 null 时显示色点（size-2 rounded-full）。
 * 边界：flair 未找到或查询中 → 渲染 null。
 */
export function FlairBadge({ spaceId, flairId }: FlairBadgeProps) {
  const result = useAtomValue(postFlairsQuery(spaceId));
  if (!AsyncResult.isSuccess(result)) {
    return null;
  }
  const flair = result.value.find((entry) => entry.id === flairId);
  if (!flair) {
    return null;
  }

  return (
    <Badge variant="secondary">
      {flair.color !== null && (
        <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: flair.color }} />
      )}
      <span className="truncate">{flair.name}</span>
    </Badge>
  );
}
