"use client";

import { commentQuery } from "@/atoms/comments";
import { Keys } from "@/atoms/keys";
import { postQuery } from "@/atoms/posts";
import { reportsPageQuery, resolveReportAtom } from "@/atoms/reports";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { SimpleSelect } from "@/components/shared/SimpleSelect";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { portableTextToPlainText } from "@/lib/portable-text";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { ReportEntry } from "@openworks/backend/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type ReportStatus = "pending" | "resolved" | "dismissed";

function parseStatus(value: string): ReportStatus {
  return value === "resolved" || value === "dismissed" ? value : "pending";
}

function PostTarget({ postId }: { readonly postId: string }) {
  const [t] = useT();
  const result = useAtomValue(postQuery(postId));

  return (
    <Link className="text-sm font-medium hover:underline" href={`/posts/${postId}`}>
      {t.mod.reports.postTarget}: {AsyncResult.isSuccess(result) ? result.value.title : postId.slice(0, 8)}
    </Link>
  );
}

function CommentTarget({ commentId }: { readonly commentId: string }) {
  const [t] = useT();
  const result = useAtomValue(commentQuery(commentId));

  if (!AsyncResult.isSuccess(result)) {
    return (
      <span className="text-muted-foreground text-sm">
        {t.mod.reports.commentTarget}: {commentId.slice(0, 8)}
      </span>
    );
  }

  const excerpt = portableTextToPlainText(result.value.content);

  return (
    <Link className="text-sm hover:underline" href={`/posts/${result.value.postId}`}>
      {t.mod.reports.commentTarget}: <span className="text-muted-foreground">{excerpt.slice(0, 120)}</span>
    </Link>
  );
}

interface ResolveDialogProps {
  readonly report: ReportEntry;
  readonly status: "resolved" | "dismissed";
  readonly spaceId: string;
  readonly onClose: () => void;
}

function ResolveDialog({ report, status, spaceId, onClose }: ResolveDialogProps) {
  const [t] = useT();
  const resolveReport = useAtomSet(resolveReportAtom, { mode: "promise" });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await resolveReport({
        params: { id: report.id },
        payload: {
          status,
          resolutionNote: note.trim().length > 0 ? note.trim() : undefined,
        },
        reactivityKeys: [Keys.reports(spaceId)],
      });
      onClose();
    } catch (error) {
      showApiError(t.errors, error);
      setBusy(false);
    }
  }

  return (
    <Dialog onOpenChange={(details) => (details.open ? undefined : onClose())} open>
      <DialogContent size="sm">
        <DialogHeader title={status === "resolved" ? t.mod.reports.resolveTitle : t.mod.reports.dismissTitle} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody>
            <Textarea
              onChange={(event) => setNote(event.target.value)}
              placeholder={`${t.mod.reports.resolutionNote} (${t.common.optional})`}
              rows={3}
              value={note}
            />
          </DialogBody>
          <DialogFooter>
            <Button onClick={onClose} type="button" variant="outline">
              {t.common.cancel}
            </Button>
            <Button isLoading={busy} type="submit">
              {status === "resolved" ? t.mod.reports.resolve : t.mod.reports.dismiss}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ReportsSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const [status, setStatus] = useState<ReportStatus>("pending");
  const [resolving, setResolving] = useState<
    { readonly report: ReportEntry; readonly status: "resolved" | "dismissed" } | undefined
  >(undefined);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t.mod.reports.title}</h2>
        <SimpleSelect
          ariaLabel={t.common.status}
          className="w-36 shrink-0"
          items={[
            { value: "pending", label: t.mod.reports.statusPending },
            { value: "resolved", label: t.mod.reports.statusResolved },
            { value: "dismissed", label: t.mod.reports.statusDismissed },
          ]}
          onChange={(value) => setStatus(parseStatus(value))}
          value={status}
        />
      </div>

      <PagedList
        emptyState={<EmptyState title={t.mod.reports.empty} />}
        key={status}
        pageQuery={(offset) => reportsPageQuery({ spaceId, status, offset })}
        renderPage={(reports) =>
          reports.map((report) => (
            <Card className="gap-2 p-3 [--space:--spacing(3)]" key={report.id}>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
                <Badge
                  variant={
                    report.status === "pending" ? "warning" : report.status === "resolved" ? "success" : "secondary"
                  }
                >
                  {report.status === "pending"
                    ? t.mod.reports.statusPending
                    : report.status === "resolved"
                      ? t.mod.reports.statusResolved
                      : t.mod.reports.statusDismissed}
                </Badge>
                <span className="flex min-w-0 items-center gap-1">
                  {t.mod.reports.reporter}: <UserLink className="max-w-40 truncate" id={report.reporterId} />
                </span>
                <TimeAgo date={report.createdAt} />
              </div>

              {report.postId !== null && <PostTarget postId={report.postId} />}
              {report.commentId !== null && <CommentTarget commentId={report.commentId} />}

              <p className="text-sm">{report.reason}</p>

              {report.resolutionNote !== null && (
                <p className="text-muted-foreground text-sm italic">{report.resolutionNote}</p>
              )}

              {report.status === "pending" && (
                <div className="flex gap-2">
                  <Button onClick={() => setResolving({ report, status: "resolved" })} size="xs">
                    {t.mod.reports.resolve}
                  </Button>
                  <Button onClick={() => setResolving({ report, status: "dismissed" })} size="xs" variant="outline">
                    {t.mod.reports.dismiss}
                  </Button>
                </div>
              )}
            </Card>
          ))
        }
      />

      {resolving && (
        <ResolveDialog
          spaceId={spaceId}
          onClose={() => setResolving(undefined)}
          report={resolving.report}
          status={resolving.status}
        />
      )}
    </div>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +------------------------------------------------------+
 * | Reports                  [Status: v Pending]         |
 * |------------------------------------------------------|
 * | [Warning] Reporter: user · 3h ago                    |
 * | Post: "Post title"                                   |
 * | Reason text                                          |
 * | Resolution note? (italic)                            |
 * | [Resolve] [Dismiss]    (pending only)                |
 * |------------------------------------------------------|
 * | [Success] ...resolved report...                      |
 * +------------------------------------------------------+
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * 本页自身无断点，所有视口下结构一致。
 *
 * 按 status 过滤（pending/resolved/dismissed）。
 * 宽度处置：标题行 = h2 + 状态选择器（w-36 shrink-0，超长标签由 SelectValue
 * 截断）；举报行 meta = Badge + 举报人（min-w-0，用户名 max-w-40 truncate）
 * + 时间，flex-wrap 折行；理由与目标文本自然折行。
 * 每项 Card，Badge 颜色按状态变化。
 * Resolve/Dismiss 打开 Dialog 填写 resolutionNote。
 * 边界：0 个举报 → EmptyState。
 *       postId/commentId 可能为 null（只显示存在的目标）。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"；
 *       切换 status 通过 key 重置分页。
 */
export default function ModReportsPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <ReportsSection spaceId={params.id} />
    </ModBoundary>
  );
}
