"use client";

import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = ["settings", "rules", "flairs", "members", "bans", "mutes", "invitations", "reports", "log"] as const;

interface ModNavProps {
  readonly spaceId: string;
}

/**
 * Mobile (<640px):
 * +------------------------------------------+
 * | [Settings][Rules][Flairs][Members]       |
 * | [Bans][Mutes][Invitations]              |
 * | [Reports][Log]                          |
 * +------------------------------------------+
 * flex-wrap 换行排列，所有项均可见，无需横向滚动。
 *
 * Tablet (640-1023px):
 * +----------------------------------------------------+
 * | [Settings][Rules][Flairs][Members][Bans][Mutes]    |
 * | [Invitations][Reports][Log]                        |
 * +----------------------------------------------------+
 * 同样 flex-wrap，宽度更大时大部分可能在一行内。
 *
 * Desktop (1024-1535px) / Ultra-wide (>=1536px):
 * +------------------+
 * | [Settings]       |
 * | [Rules]          |
 * | [Flairs]         |
 * | [Members]        |
 * | [Bans]           |
 * | [Mutes]          |
 * | [Invitations]    |
 * | [Reports]        |
 * | [Log]            |
 * +------------------+
 * lg: 断点切换为 flex-col 竖向布局。
 *
 * 宽度处置：<lg 横排按整项 flex-wrap 换行（按钮自带 shrink-0 +
 * whitespace-nowrap，不收缩不截断）；lg+ 竖排占满 11rem 导航列宽，
 * 标签为固定短词恒不溢出。
 * 当前路由高亮（variant=secondary），其余 ghost。
 */
export function ModNav({ spaceId }: ModNavProps) {
  const [t] = useT();
  const pathname = usePathname();

  return (
    <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
      {SECTIONS.map((section) => {
        const href = `/spaces/${spaceId}/mod/${section}`;
        return (
          <Button
            asChild
            className="justify-start"
            key={section}
            size="sm"
            variant={pathname === href ? "secondary" : "ghost"}
          >
            <Link href={href}>{t.mod.nav[section]}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
