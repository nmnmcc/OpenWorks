"use client";

import { moderationLogPageQuery } from "@/atoms/moderation-log";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useT } from "@/lib/i18n/locale";
import { useParams } from "next/navigation";

function ModerationLogSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-medium">{t.mod.log.title}</h2>
      <PagedList
        emptyState={<EmptyState title={t.mod.log.empty} />}
        pageQuery={(offset) => moderationLogPageQuery(spaceId, offset)}
        renderPage={(entries) =>
          entries.map((entry) => (
            <Card className="gap-1.5 p-3 [--space:--spacing(3)]" key={entry.id}>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary">{entry.action}</Badge>
                <span className="text-muted-foreground text-xs">
                  {entry.targetType} · {entry.targetId.slice(0, 8)}
                </span>
              </div>
              <div className="text-muted-foreground flex flex-wrap items-center gap-1.5 text-xs">
                <span className="flex min-w-0 items-center gap-1">
                  {t.mod.log.moderator}: <UserLink className="max-w-40 truncate" id={entry.moderatorId} />
                </span>
                <span aria-hidden>·</span>
                <TimeAgo date={entry.createdAt} />
              </div>
              {entry.details !== null && entry.details !== undefined && (
                <Collapsible>
                  <CollapsibleTrigger className="text-muted-foreground text-xs underline underline-offset-2">
                    {t.mod.log.target}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <pre className="bg-muted mt-1 overflow-x-auto rounded-md p-2 text-xs">
                      {JSON.stringify(entry.details, null, 2)}
                    </pre>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </Card>
          ))
        }
      />
    </div>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +----------------------------------------------+
 * | Mod Log                                      |
 * |----------------------------------------------|
 * | [ban_user] post · abc123de                   |
 * | Moderator: UserLink · 3h ago                 |
 * | [Details v]  (Collapsible JSON)              |
 * |----------------------------------------------|
 * | [remove_post] post · def456gh                |
 * | Moderator: UserLink · 1d ago                 |
 * +----------------------------------------------+
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * 本页自身无断点，所有视口下结构一致。
 *
 * 每项 Card，action 为 Badge，目标类型 + ID 截断显示。
 * 宽度处置：动作行 = Badge + 目标短 ID，flex-wrap 折行；moderator 行 =
 * 标签 + 用户名（max-w-40 truncate）+ 时间，flex-wrap 折行；details 的
 * JSON 用 pre overflow-x-auto 在卡片内横滚。
 * details 非 null 时可展开查看 JSON。
 * 边界：0 条日志 → EmptyState。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function ModerationLogPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <ModerationLogSection spaceId={params.id} />
    </ModBoundary>
  );
}
