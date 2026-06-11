"use client";

import { ModNav } from "@/components/mod/ModNav";
import { useT } from "@/lib/i18n/locale";
import { ShieldIcon } from "lucide-react";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | (shield) Mod Tools                       |
 * | [ModNav -- vertical stack]               |
 * | {children}                               |
 * +------------------------------------------+
 *              w-full
 *
 * Tablet (640-1023px):
 * +------------------------------------------------+
 * | (shield) Mod Tools                             |
 * | [ModNav -- vertical stack]                     |
 * | {children}                                     |
 * +------------------------------------------------+
 *         w-full max-w-5xl mx-auto
 *
 * Desktop (1024-1535px):
 * +------------------------------------------------------+
 * |       (shield) Mod Tools                             |
 * |       +----------+----------------------------------+|
 * |       | [ModNav] | {children}                       ||
 * |       | (11rem)  | (minmax(0, 1fr))                 ||
 * |       +----------+----------------------------------+|
 * +------------------------------------------------------+
 *     lg:grid-cols-[11rem_minmax(0,1fr)] gap-4
 *         w-full max-w-5xl mx-auto
 *
 * Ultra-wide (>=1536px):
 * +----------------------------------------------------------------+
 * |            (shield) Mod Tools                                  |
 * |            +----------+----------------------------------+     |
 * |            | [ModNav] | {children}                       |     |
 * |            | (11rem)  | (minmax(0, 1fr))                 |     |
 * |            +----------+----------------------------------+     |
 * +----------------------------------------------------------------+
 *     lg:grid-cols-[11rem_minmax(0,1fr)] gap-4
 *               w-full max-w-5xl mx-auto
 *
 * max-w-5xl (64rem) 居中容器。
 * >=1024px (lg) 时 grid 双列：左侧 ModNav 固定 11rem，右侧内容 minmax(0, 1fr)。
 * <1024px 时 flex-col 竖向堆叠，ModNav 在 children 上方（gap-4）。
 */
export default function ModLayout({ children }: { readonly children: ReactNode }) {
  const [t] = useT();
  const params = useParams<{ id: string }>();

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h1 className="mb-4 flex items-center gap-2 text-xl font-semibold">
        <ShieldIcon className="size-5" />
        {t.mod.title}
      </h1>
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)]">
        <ModNav spaceId={params.id} />
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
