"use client";

import { Keys } from "@/atoms/keys";
import { membersPageQuery, removeMemberAtom } from "@/atoms/spaces";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import type { SpaceMemberEntry } from "@openworks/backend/api";
import { UserMinusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

function MembersSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const removeMember = useAtomSet(removeMemberAtom, { mode: "promise" });
  const [removing, setRemoving] = useState<SpaceMemberEntry | undefined>(undefined);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-medium">{t.mod.members.title}</h2>
      <PagedList
        emptyState={<EmptyState title={t.mod.members.empty} />}
        pageQuery={(offset) => membersPageQuery(spaceId, offset)}
        renderContainer={(pages) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.user}</TableHead>
                <TableHead>{t.mod.members.joinedAt}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>{pages}</TableBody>
          </Table>
        )}
        renderPage={(members) =>
          members.map((member) => (
            <TableRow key={member.id}>
              <TableCell>
                <UserLink id={member.userId} />
              </TableCell>
              <TableCell>
                <TimeAgo className="text-muted-foreground" date={member.createdAt} />
              </TableCell>
              <TableCell>
                <Button
                  aria-label={t.common.remove}
                  className="text-destructive"
                  onClick={() => setRemoving(member)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <UserMinusIcon />
                </Button>
              </TableCell>
            </TableRow>
          ))
        }
      />

      {removing && (
        <ConfirmDialog
          confirmLabel={t.common.remove}
          description={t.mod.members.removeConfirmBody}
          destructive
          onConfirm={() =>
            removeMember({
              params: { id: spaceId, memberId: removing.id },
              reactivityKeys: [Keys.spaces, Keys.space(spaceId), Keys.members(spaceId)],
            })
              .then(() => undefined)
              .catch((error: unknown) => {
                showApiError(t.errors, error);
              })
          }
          onOpenChange={(open) => {
            if (!open) {
              setRemoving(undefined);
            }
          }}
          open
          title={t.mod.members.removeConfirmTitle}
        />
      )}
    </div>
  );
}

/**
 * Mobile (<640px):
 * +-------------------------------+
 * | Members                       |
 * | +---------------------------+ |
 * | | User     | Joined | [x]  | |
 * | |----------|--------|------|  |
 * | | UserLink | 3mo    | [x]  |  |
 * | +---------------------------+ |
 * +-------------------------------+
 * 3 列均可见（User + Joined + Kick icon 足够窄）。
 *
 * Tablet (640-1023px) / Desktop (1024-1535px) / Ultra-wide (>=1536px):
 * +----------------------------------------------+
 * | Members                                      |
 * | +------------------------------------------+ |
 * | | User       | Joined     |                | |
 * | |------------|------------|--------|        | |
 * | | UserLink   | 3mo ago    | [Kick] |        | |
 * | +------------------------------------------+ |
 * +----------------------------------------------+
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * Table 布局。踢出通过 ConfirmDialog 确认。
 * 宽度处置：表格窄端由 Table 外层 overflow-auto 整体横滚，宽端列宽随容器
 * 伸展；行内操作为单个 icon-sm 按钮（自带 shrink-0）。
 * 边界：0 成员 → EmptyState（标题保留）。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function ModMembersPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <MembersSection spaceId={params.id} />
    </ModBoundary>
  );
}
