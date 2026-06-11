"use client";

import { authDialogAtom } from "@/atoms/auth-dialog";
import { unreadCountQuery } from "@/atoms/notifications";
import { postComposeDialogAtom } from "@/atoms/post-compose-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Menu, MenuContent, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { BellIcon, PlusIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";

function NotificationBell() {
  const [t] = useT();
  const result = useAtomValue(unreadCountQuery);
  const count = AsyncResult.isSuccess(result) ? result.value.count : 0;

  return (
    <Button asChild aria-label={t.nav.notifications} className="relative max-lg:hidden" size="icon-md" variant="ghost">
      <Link href="/notifications">
        <BellIcon />
        {count > 0 && (
          <span className="bg-destructive absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-medium text-white">
            {count > 99 ? "99+" : count}
          </span>
        )}
      </Link>
    </Button>
  );
}

/**
 * Mobile (<640px)
 *
 * Logged in:
 * +--------------------------------------+
 * | Logo  [ Search... ]           (Av)  |
 * +--------------------------------------+
 *          ^-mx-auto-^      avatar menu
 *
 * Anonymous:
 * +--------------------------------------+
 * | Logo  [ Search... ]  [SignIn][SignUp]|
 * +--------------------------------------+
 *
 * 移动端导航由底部 BottomNav 接管，Header 仅保留 Logo、搜索和头像菜单。
 * 创建帖子和通知铃铛移至底部导航栏（max-lg:hidden）。
 *
 * Tablet (640-1023px)
 *
 * Logged in:
 * +----------------------------------------------+
 * | Logo     [   Search...   ]            (Av)  |
 * +----------------------------------------------+
 *            ^--mx-auto, max-w-md--^
 *
 * Anonymous:
 * +----------------------------------------------+
 * | Logo     [   Search...   ]  [SignIn] [SignUp]|
 * +----------------------------------------------+
 *
 * 与移动端一致——创建/通知在底部导航栏。
 *
 * Desktop (1024-1535px)
 *
 * Logged in:
 * +--------------------------------------------------------------+
 * | Logo        [    Search...    ]         [+ Post] [Bell] (Av) |
 * +--------------------------------------------------------------+
 *               ^-mx-auto, max-w-md-^       gap-3 spacing
 *
 * Anonymous:
 * +--------------------------------------------------------------+
 * | Logo        [    Search...    ]       [Sign in] [Sign up]    |
 * +--------------------------------------------------------------+
 *
 * 侧栏在 AppLayout 中常驻，底部导航隐藏。
 *
 * Ultra-wide (>=1536px)
 *
 * Logged in:
 * +=================================================================+
 * |      | Logo     [   Search...  ]     [+ Post] [Bell] (Av) |    |
 * +=================================================================+
 *        ^------------- max-w-5xl, mx-auto -------------------^
 *
 * Anonymous:
 * +=================================================================+
 * |      | Logo     [   Search...  ]       [Sign in] [Sign up] |   |
 * +=================================================================+
 *        ^------------- max-w-5xl, mx-auto --------------------^
 *
 * 与 Desktop 结构一致，但内容区被 max-w-5xl (64rem) 封顶并 mx-auto 居中。
 *
 * 吸顶 z-40，半透明模糊背景（bg-background/90 backdrop-blur），下边框。
 * - 搜索框：mx-auto w-full max-w-md
 * 行内宽度处置：logo 与右侧动作组均 shrink-0（固定宽），搜索框是行内唯一
 * 可收缩项（Input 自带 min-w-0，320px 下收窄到剩余空间）；宽端搜索框被
 * max-w-md 封顶、整行被 max-w-5xl 封顶，余宽落在搜索框两侧（mx-auto）。
 * 已登录动作组控件等高：+Post（md，h-8）、铃铛（icon-md，size-8）、
 * 头像触发器（md，size-8）均为 32px。
 * - 已登录："+Post"和铃铛桌面端可见（max-lg:hidden），移动/平板通过底部导航访问
 * - 匿名：显示登录/注册按钮，点击打开 AuthDialog
 * 边界：长用户名通过头像 fallback 截断（2 字符）。
 */
export function Header() {
  const router = useRouter();
  const [t] = useT();
  const { data: session } = authClient.useSession();
  const setAuthDialog = useAtomSet(authDialogAtom);
  const setPostComposeDialog = useAtomSet(postComposeDialogAtom);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q");
    if (typeof q === "string" && q.trim().length > 0) {
      router.push(`/search?q=${encodeURIComponent(q.trim())}`);
    }
  }

  function handleMenuSelect({ value }: { readonly value: string }) {
    if (value === "sign-out") {
      authClient.signOut().then(() => router.refresh());
      return;
    }
    router.push(value);
  }

  return (
    <header className="bg-background/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-2.5">
        <Link className="shrink-0 text-lg font-semibold" href="/">
          OpenWorks
        </Link>

        <form className="mx-auto w-full max-w-md" onSubmit={handleSearch}>
          <Input aria-label={t.nav.searchPlaceholder} name="q" placeholder={t.nav.searchPlaceholder} type="search" />
        </form>

        {session ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              className="max-lg:hidden"
              onClick={() => setPostComposeDialog({ open: true, spaceId: "" })}
              size="md"
              variant="ghost"
            >
              <PlusIcon />
              <span className="hidden sm:inline">{t.nav.createPost}</span>
            </Button>

            <NotificationBell />

            <Menu onSelect={handleMenuSelect}>
              <MenuTrigger
                aria-label={session.user.name}
                className="focus-visible:ring-ring/32 rounded-full outline-none focus-visible:ring-[3px]"
              >
                <Avatar size="md">
                  <AvatarImage alt={session.user.name} src={session.user.image ?? undefined} />
                  <AvatarFallback>{session.user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </MenuTrigger>
              <MenuContent className="min-w-48">
                <MenuItem value={`/users/${session.user.id}`}>{t.nav.profile}</MenuItem>
                <MenuItem value="/spaces">{t.nav.spaces}</MenuItem>
                <MenuItem value="/messages">{t.nav.messages}</MenuItem>
                <MenuItem value="/saved">{t.nav.saved}</MenuItem>
                <MenuItem value="/hidden">{t.nav.hidden}</MenuItem>
                <MenuSeparator />
                <MenuItem value="/settings">{t.nav.settings}</MenuItem>
                <MenuItem value="sign-out">{t.nav.signOut}</MenuItem>
              </MenuContent>
            </Menu>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Button onClick={() => setAuthDialog({ open: true, mode: "login" })} size="sm" variant="ghost">
              {t.nav.signIn}
            </Button>
            <Button onClick={() => setAuthDialog({ open: true, mode: "register" })} size="sm">
              {t.nav.signUp}
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
