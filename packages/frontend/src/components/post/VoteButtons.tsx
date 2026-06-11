"use client";

import { voteStateAtom } from "@/atoms/vote-state";
import { castVoteAtom, removeVoteAtom } from "@/atoms/votes";
import { Button } from "@/components/ui/button";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtom, useAtomSet } from "@effect/atom-react";
import { ArrowBigDownIcon, ArrowBigUpIcon } from "lucide-react";

interface VoteButtonsProps {
  readonly targetId: string;
  readonly kind: "post" | "comment";
  readonly score: number;
  readonly compact?: boolean;
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * Default (compact=false):    Compact (compact=true):
 *      [^]                    [^] 42 [v]
 *       42
 *      [v]
 *
 * 布局由 compact 属性决定（非响应式）：默认竖排（flex-col），compact 横排（flex-row）。
 * 所有断点外观一致。分数用 Intl.NumberFormat compact 格式化（如 "1.2K"）。
 * 宽度处置：按钮自带 shrink-0，计数 min-w-6 且 compact 格式保证短文本——整组为
 * 固定内容宽、不可压缩，窄端由父行（PostCard/CommentTree 的 flex-wrap）折行消化。
 * 已点赞：orange-600。已踩：indigo-600。再次点击同一方向取消投票。
 * 边界：分数可为负数。客户端 delta 追踪实现乐观更新。
 */
export function VoteButtons({ targetId, kind, score, compact = false }: VoteButtonsProps) {
  const [t, tag] = useT();
  const [voteState, setVoteState] = useAtom(voteStateAtom);
  const castVote = useAtomSet(castVoteAtom, { mode: "promise" });
  const removeVote = useAtomSet(removeVoteAtom, { mode: "promise" });

  const state = voteState[targetId];
  const displayScore = score + (state?.delta ?? 0);
  const formattedScore = new Intl.NumberFormat(tag, { notation: "compact" }).format(displayScore);

  async function handleVote(value: 1 | -1) {
    try {
      if (state && state.value === value) {
        await removeVote({ params: { id: state.voteId } });
        setVoteState((current) => Object.fromEntries(Object.entries(current).filter(([key]) => key !== targetId)));
        return;
      }
      const previousValue = state?.value ?? 0;
      const previousDelta = state?.delta ?? 0;
      const vote = await castVote({
        payload: {
          postId: kind === "post" ? targetId : undefined,
          commentId: kind === "comment" ? targetId : undefined,
          value,
        },
      });
      setVoteState((current) => ({
        ...current,
        [targetId]: { voteId: vote.id, value, delta: previousDelta + value - previousValue },
      }));
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <div className={cn("text-muted-foreground flex items-center", compact ? "flex-row gap-0.5" : "flex-col gap-0.5")}>
      <Button
        aria-label={t.post.upvote}
        aria-pressed={state?.value === 1}
        className={cn(state?.value === 1 && "text-orange-600")}
        onClick={() => handleVote(1)}
        size={compact ? "icon-xs" : "icon-sm"}
        variant="ghost"
      >
        <ArrowBigUpIcon className={cn("size-4.5", state?.value === 1 && "fill-current")} />
      </Button>
      <span
        className={cn(
          "min-w-6 text-center text-xs font-medium tabular-nums",
          state?.value === 1 && "text-orange-600",
          state?.value === -1 && "text-indigo-600",
        )}
      >
        {formattedScore}
      </span>
      <Button
        aria-label={t.post.downvote}
        aria-pressed={state?.value === -1}
        className={cn(state?.value === -1 && "text-indigo-600")}
        onClick={() => handleVote(-1)}
        size={compact ? "icon-xs" : "icon-sm"}
        variant="ghost"
      >
        <ArrowBigDownIcon className={cn("size-4.5", state?.value === -1 && "fill-current")} />
      </Button>
    </div>
  );
}
