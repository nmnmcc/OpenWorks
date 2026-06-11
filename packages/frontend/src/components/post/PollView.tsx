"use client";

import { Keys } from "@/atoms/keys";
import { pollQuery, votePollAtom } from "@/atoms/polls";
import { Button } from "@/components/ui/button";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { formatRelativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";
import { useAtomSet, useAtomSuspense } from "@effect/atom-react";
import { Match } from "effect";
import { CheckCircle2Icon } from "lucide-react";
import { useState } from "react";

interface PollViewProps {
  readonly postId: string;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * Before voting:
 * +------------------------------------+
 * | [Option A                        ] |
 * | [Option B                        ] |
 * | 0 votes                            |
 * +------------------------------------+
 *
 * After voting / closed:
 * +------------------------------------+
 * | [====== Option A  (check)  60%  4] |
 * | [==     Option B           40%  2] |
 * | 6 votes · Closed / Ends in 2d      |
 * +------------------------------------+
 *
 * Width handling (result row):
 * [====== Option text............ (check)    60% · 4]
 *         ^- min-w-0 + truncate -^ ^shrink-0  ^shrink-0
 *
 * 圆角边框容器（rounded-lg border p-3），所有断点布局一致。
 * 窄端：结果行选项文本 truncate（min-w-0 链 + 省略号），check 图标与右侧统计
 * shrink-0 不压缩；投票按钮内文本 truncate（按钮自带 whitespace-nowrap）。
 * 宽端：行宽随容器伸展（justify-between 把统计推到行尾），无内部 max-w。
 * 选项按 position 排序。结果条：百分比宽度背景填充（absolute inset-y-0）。
 * 用户已投选项高亮（check 图标 + primary/16 背景）。
 * 边界：0 票 → 所有条 0%。已截止 → 不显示投票按钮。
 */
export function PollView({ postId }: PollViewProps) {
  const [t, tag] = useT();
  const result = useAtomSuspense(pollQuery(postId));
  const votePoll = useAtomSet(votePollAtom, { mode: "promise" });
  const [busy, setBusy] = useState(false);

  const poll = result.value;
  const options = [...poll.options].sort((a, b) => a.position - b.position);
  const total = options.reduce((sum, option) => sum + option.voteCount, 0);
  const [now] = useState(Date.now);
  const closed = poll.votingEndsAt !== null && poll.votingEndsAt.getTime() <= now;
  const shouldShowResults = poll.userVotedOptionId !== null || closed;

  async function handleVote(optionId: string) {
    setBusy(true);
    try {
      await votePoll({ params: { postId }, payload: { optionId }, reactivityKeys: [Keys.poll(postId)] });
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border p-3">
      <div className="flex flex-col gap-2">
        {Match.value(shouldShowResults).pipe(
          Match.when(true, () =>
            options.map((option) => {
              const share = total > 0 ? option.voteCount / total : 0;
              const isMine = option.id === poll.userVotedOptionId;
              return (
                <div className="relative overflow-hidden rounded-md border px-3 py-1.5" key={option.id}>
                  <div
                    aria-hidden
                    className={cn("absolute inset-y-0 left-0", isMine ? "bg-primary/16" : "bg-muted")}
                    style={{ width: `${Math.round(share * 100)}%` }}
                  />
                  <div className="relative flex items-center justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="truncate">{option.text}</span>
                      {isMine && <CheckCircle2Icon className="text-primary size-3.5 shrink-0" />}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {Math.round(share * 100)}% · {t.poll.votes(option.voteCount)}
                    </span>
                  </div>
                </div>
              );
            }),
          ),
          Match.orElse(() =>
            options.map((option) => (
              <Button
                className="justify-start"
                disabled={busy}
                key={option.id}
                onClick={() => handleVote(option.id)}
                variant="outline"
              >
                <span className="truncate">{option.text}</span>
              </Button>
            )),
          ),
        )}
      </div>

      <p className="text-muted-foreground mt-2 text-xs">
        {t.poll.votes(total)}
        {closed && <> · {t.poll.closed}</>}
        {!closed && poll.votingEndsAt !== null && <> · {t.poll.endsAt(formatRelativeTime(poll.votingEndsAt, tag))}</>}
      </p>
    </div>
  );
}
