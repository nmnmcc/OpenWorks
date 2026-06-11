import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface EmptyStateProps {
  readonly title: string;
  readonly hint?: string;
  readonly icon?: ReactNode;
  readonly action?: ReactNode;
  readonly className?: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 * +-------------------------------+
 * |           [icon?]             |
 * |           Title               |
 * |          Hint text?           |
 * |          [Action?]            |
 * +-------------------------------+
 *
 * 居中列，py-16。图标通过 [&_svg]:size-8 统一大小。
 * 除 title 外所有插槽可选。可通过 className 扩展。
 */
export function EmptyState({ title, hint, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center gap-2 py-16 text-center", className)}>
      {icon && <div className="text-muted-foreground [&_svg]:size-8">{icon}</div>}
      <p className="text-sm font-medium">{title}</p>
      {hint && <p className="text-muted-foreground text-sm">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
