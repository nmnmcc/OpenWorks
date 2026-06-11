"use client";

import { Keys } from "@/atoms/keys";
import { joinSpaceAtom, leaveSpaceAtom, membershipQuery } from "@/atoms/spaces";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import { useState } from "react";

interface JoinButtonProps {
  readonly spaceId: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * Not joined:   [  Join  ]    (primary button)
 * Joined:       [ Leave  ]    (outline destructive button)
 *
 * 单个按钮，所有断点外观一致。已加入时直接显示"离开"操作文字
 * （无 hover-only 切换，确保触控设备功能一致）。
 * 成员身份通过单条 membership 查询判断，不拉取成员列表。
 * 边界：membership 查询中/未登录 → joined 默认 false 显示 Join。
 */
export function JoinButton({ spaceId }: JoinButtonProps) {
  const [t] = useT();
  const membershipResult = useAtomValue(membershipQuery(spaceId));
  const joinSpace = useAtomSet(joinSpaceAtom, { mode: "promise" });
  const leaveSpace = useAtomSet(leaveSpaceAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);

  const joined = AsyncResult.isSuccess(membershipResult) && membershipResult.value !== null;

  const reactivityKeys = [Keys.spaces, Keys.space(spaceId), Keys.members(spaceId)];

  async function handleClick() {
    setBusy(true);
    try {
      if (joined) {
        await leaveSpace({ params: { id: spaceId }, reactivityKeys });
        toast.success({ title: t.spaces.leftToast });
      } else {
        await joinSpace({ params: { id: spaceId }, reactivityKeys });
        toast.success({ title: t.spaces.joinedToast });
      }
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  if (joined) {
    return (
      <Button isLoading={busy} onClick={handleClick} variant="outline">
        {t.spaces.leave}
      </Button>
    );
  }

  return (
    <Button isLoading={busy} onClick={handleClick}>
      {t.spaces.join}
    </Button>
  );
}
