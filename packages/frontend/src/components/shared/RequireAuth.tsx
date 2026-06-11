"use client";

import { authDialogAtom } from "@/atoms/auth-dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { LogInIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 * +------------------------------------+
 * |                                    |
 * |        (lock icon)                 |
 * |   Sign in to continue (wraps)      |
 * |      [Sign in] [Sign up]           |
 * |       ^ fixed-width pair, centered |
 * |                                    |
 * +------------------------------------+
 *
 * 全高居中提示。已登录时透传 children。
 * 宽度处置：按钮对为固定短标签（自带 shrink-0），合计远窄于 320px，整组
 * 居中；提示文本窄端自然折行；宽端留白对称落在两侧（items-center）。
 * 会话加载中显示 spinner。
 */
export function RequireAuth({ children }: { readonly children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const [t] = useT();
  const setDialog = useAtomSet(authDialogAtom);

  if (isPending) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-64 flex-col items-center justify-center gap-4">
        <LogInIcon className="text-muted-foreground size-10" />
        <p className="text-muted-foreground">{t.auth.signInSubtitle}</p>
        <div className="flex gap-2">
          <Button onClick={() => setDialog({ open: true, mode: "login" })} variant="default">
            {t.nav.signIn}
          </Button>
          <Button onClick={() => setDialog({ open: true, mode: "register" })} variant="outline">
            {t.nav.signUp}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
