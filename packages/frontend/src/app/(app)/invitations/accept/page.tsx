"use client";

import { Keys } from "@/atoms/keys";
import { acceptInvitationAtom } from "@/atoms/spaces";
import { EmptyState } from "@/components/shared/EmptyState";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { MailOpenIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseAsString, useQueryState } from "nuqs";
import { Suspense, useState } from "react";

function AcceptInvitation() {
  const [t] = useT();
  const router = useRouter();
  const acceptInvitation = useAtomSet(acceptInvitationAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);

  const [token] = useQueryState("token", parseAsString.withDefault(""));

  if (token.length === 0) {
    return <EmptyState icon={<MailOpenIcon />} title={t.invite.noToken} />;
  }

  async function handleAccept() {
    setBusy(true);
    try {
      const membership = await acceptInvitation({
        payload: { token },
        reactivityKeys: [Keys.spaces],
      });
      toast.success({ title: t.invite.accepted });
      router.push(`/spaces/${membership.spaceId}`);
    } catch (error) {
      showApiError(t.errors, error);
      setBusy(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader description={t.invite.description} title={t.invite.title} />
      <CardContent />
      <CardFooter className="justify-end">
        <Button isLoading={busy} onClick={handleAccept}>
          {t.invite.accept}
        </Button>
      </CardFooter>
    </Card>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 *          +-------------------------------+
 *          | Invitation                    |
 *          | Description                   |
 *          |                    [Accept]   |
 *          +-------------------------------+
 *
 * Card max-w-sm 居中（w-full max-w-sm mx-auto），py-12 外边距。
 * 所有视口下结构一致，无断点。宽度处置：窄端卡片收缩至视口宽（w-full），
 * 宽端 max-w-sm 封顶；[Accept] 为固定宽按钮右对齐（justify-end），
 * 留白落在行首；标题/描述文本自然折行。
 * 接受成功跳转至空间页。
 * 边界：token 为空 → EmptyState "无效邀请"。
 */
export default function AcceptInvitationPage() {
  return (
    <RequireAuth>
      <div className="flex justify-center py-12">
        <Suspense>
          <AcceptInvitation />
        </Suspense>
      </div>
    </RequireAuth>
  );
}
