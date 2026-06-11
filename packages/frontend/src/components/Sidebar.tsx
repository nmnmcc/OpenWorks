"use client";

import { PAGE_SIZE } from "@/atoms/posts";
import { joinedSpacesQuery } from "@/atoms/spaces";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { BookOpenIcon, CompassIcon, HomeIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

function NavLink({
  href,
  icon,
  label,
  active,
}: {
  readonly href: string;
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly active: boolean;
}) {
  return (
    <Link
      className={cn(
        "hover:bg-accent flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
        active && "bg-accent font-medium",
      )}
      href={href}
    >
      {icon}
      {label}
    </Link>
  );
}

function JoinedSpaces() {
  const [t] = useT();
  const result = useAtomValue(joinedSpacesQuery);

  if (!AsyncResult.isSuccess(result) || result.value.length === 0) {
    return null;
  }

  return (
    <>
      <Separator />
      <div className="flex flex-col gap-0.5">
        <h3 className="text-muted-foreground px-3 py-1 text-xs font-medium tracking-wider uppercase">{t.nav.spaces}</h3>
        {result.value.map((space) => (
          <Link
            className="hover:bg-accent flex items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors"
            href={`/spaces/${space.id}`}
            key={space.id}
          >
            <Avatar className="shrink-0" size="sm">
              <AvatarImage alt={space.name} src={space.icon ?? undefined} />
              <AvatarFallback>{space.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <span className="min-w-0 truncate">{space.name}</span>
          </Link>
        ))}
        {result.value.length === PAGE_SIZE && (
          <Link
            className="text-primary hover:bg-accent rounded-md px-3 py-1.5 text-sm transition-colors"
            href="/spaces"
          >
            {t.nav.allSpaces}
          </Link>
        )}
      </div>
    </>
  );
}

/**
 * Mobile (<640px)
 *
 * (hidden -- max-lg:hidden, not rendered; replaced by BottomNav)
 *
 * Tablet (640-1023px)
 *
 * (hidden -- max-lg:hidden, not rendered; replaced by BottomNav)
 *
 * 移动端和平板端均不显示侧栏（max-lg:hidden，断点 lg = 1024px）。
 * 等价导航通过底部导航栏 BottomNav 提供。
 *
 * Desktop (1024-1535px)
 *
 * +---------------------+
 * | [Home]              |
 * | [Spaces]            |
 * | [Library]           |
 * | [Explore]           |
 * |---------------------|
 * | SPACES              |
 * | (av) LongSpaceNam.. |  <- name truncate, avatar shrink-0
 * | (av) Space B        |
 * +---------------------+
 * w-56, sticky top-14
 * h = 100svh - 3.5rem
 * border-r, overflow-y-auto
 *
 * Ultra-wide (>=1536px)
 *
 * +---------------------+
 * | [Home]              |
 * | [Spaces]            |
 * | [Library]           |
 * | [Explore]           |
 * |---------------------|
 * | SPACES              |
 * | (av) LongSpaceNam.. |  <- name truncate, avatar shrink-0
 * | (av) Space B        |
 * +---------------------+
 * w-56, sticky top-14
 * h = 100svh - 3.5rem
 * border-r, overflow-y-auto
 *
 * 与 Desktop 结构完全一致，侧栏宽度固定 w-56 不随视口增长。
 *
 * 紧贴 header 下方（top-14 = 3.5rem），sticky 定位占满剩余视口高度。
 * shrink-0 防止被 flex 压缩。右侧边框分隔。独立滚动（overflow-y-auto）。
 * 行内宽度处置：空间行 = 头像（自带 shrink-0）+ 名称（truncate，吃掉行内
 * 余宽并在超长时截断为省略号）；导航行图标 + 固定短标签，恒小于 w-56。
 * 边界：0 个已加入空间 → 分隔线和列表完全隐藏。
 *       长空间名通过 `truncate` 截断。
 *       列表仅取已加入空间首页（25 条）；满载时追加"查看全部社区"
 *       链接跳转 /spaces 目录（该页分页），列表自身不无限增长。
 */
export function Sidebar() {
  const [t] = useT();
  const pathname = usePathname();

  return (
    <nav className="sticky top-14 flex h-[calc(100svh-3.5rem)] w-56 shrink-0 flex-col gap-2 overflow-y-auto border-r py-3 pr-2 max-lg:hidden">
      <div className="flex flex-col gap-0.5">
        <NavLink active={pathname === "/"} href="/" icon={<HomeIcon className="size-4" />} label={t.nav.home} />
        <NavLink
          active={pathname === "/spaces"}
          href="/spaces"
          icon={<UsersIcon className="size-4" />}
          label={t.nav.spaces}
        />
        <NavLink
          active={pathname.startsWith("/library")}
          href="/library"
          icon={<BookOpenIcon className="size-4" />}
          label={t.library.title}
        />
        <NavLink
          active={pathname === "/search"}
          href="/search"
          icon={<CompassIcon className="size-4" />}
          label={t.nav.explore}
        />
      </div>

      <JoinedSpaces />
    </nav>
  );
}
