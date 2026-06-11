"use client";

import { Keys } from "@/atoms/keys";
import { bansPageQuery, banUserAtom, unbanUserAtom } from "@/atoms/spaces";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { UserPicker } from "@/components/shared/UserPicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

function BanDialog({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const banUser = useAtomSet(banUserAtom, { mode: "promise" });

  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [pickerGeneration, setPickerGeneration] = useState(0);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (userId === undefined) return;
    setBusy(true);
    try {
      await banUser({
        params: { id: spaceId },
        payload: {
          userId,
          reason: reason.trim().length > 0 ? reason.trim() : undefined,
          expiresAt: expiresAt.length > 0 ? new Date(expiresAt) : undefined,
        },
        reactivityKeys: [Keys.bans(spaceId)],
      });
      setUserId(undefined);
      setPickerGeneration((g) => g + 1);
      setReason("");
      setExpiresAt("");
      setOpen(false);
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog onOpenChange={(details) => setOpen(details.open)} open={open}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusIcon />
          {t.mod.bans.add}
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader title={t.mod.bans.add} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t.common.user}</span>
              <UserPicker
                key={pickerGeneration}
                onValueChange={setUserId}
                placeholder={t.mod.bans.searchUser}
                value={userId}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="ban-reason">
                {t.common.reason} ({t.common.optional})
              </label>
              <Input id="ban-reason" onChange={(event) => setReason(event.target.value)} value={reason} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="ban-expires">
                {t.common.expiresAt} ({t.common.optional})
              </label>
              <Input
                id="ban-expires"
                onChange={(event) => setExpiresAt(event.target.value)}
                type="datetime-local"
                value={expiresAt}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => setOpen(false)} type="button" variant="outline">
              {t.common.cancel}
            </Button>
            <Button disabled={userId === undefined} isLoading={busy} type="submit" variant="destructive">
              {t.mod.bans.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BansSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const unbanUser = useAtomSet(unbanUserAtom, { mode: "promise" });

  async function handleUnban(banId: string) {
    try {
      await unbanUser({ params: { id: spaceId, banId }, reactivityKeys: [Keys.bans(spaceId)] });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t.mod.bans.title}</h2>
        <BanDialog spaceId={spaceId} />
      </div>

      <PagedList
        emptyState={<EmptyState title={t.mod.bans.empty} />}
        pageQuery={(offset) => bansPageQuery(spaceId, offset)}
        renderContainer={(pages) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.user}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.common.reason}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.mod.bans.bannedBy}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.common.expiresAt}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>{pages}</TableBody>
          </Table>
        )}
        renderPage={(bans) =>
          bans.map((ban) => (
            <TableRow key={ban.id}>
              <TableCell>
                <UserLink id={ban.userId} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {ban.reason ?? t.common.none}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <UserLink id={ban.bannedById} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {ban.expiresAt !== null ? <TimeAgo date={ban.expiresAt} /> : t.common.never}
              </TableCell>
              <TableCell>
                <Button onClick={() => handleUnban(ban.id)} size="xs" variant="outline">
                  {t.mod.bans.unban}
                </Button>
              </TableCell>
            </TableRow>
          ))
        }
      />
    </div>
  );
}

/**
 * Mobile (<640px):
 * +-------------------------------+
 * | Bans            [+ Ban User]  |
 * | +---------------------------+ |
 * | | User          |           | |
 * | |---------------|-----------|  |
 * | | link          | [Unban]   |  |
 * | +---------------------------+ |
 * +-------------------------------+
 * 仅显示 User + Action 列，Reason/BannedBy/Expires 隐藏。
 *
 * Tablet (640-1023px):
 * +--------------------------------------------+
 * | Bans                       [+ Ban User]    |
 * | +----------------------------------------+ |
 * | | User  | Reason   | Expires |           | |
 * | |-------|----------|---------|-----------|  |
 * | | link  | text     | 3d ago  | [Unban]   |  |
 * | +----------------------------------------+ |
 * +--------------------------------------------+
 * sm 起显示 Reason + Expires 列；BannedBy 仍隐藏。
 *
 * Desktop (1024-1535px) / Ultra-wide (>=1536px):
 * +------------------------------------------------------+
 * | Bans                                  [+ Ban User]   |
 * | +--------------------------------------------------+ |
 * | | User  | Reason | Banned by | Expires |           | |
 * | |-------|--------|-----------|---------|-----------|  |
 * | | link  | text   | link      | 3d ago  | [Unban]  |  |
 * | +--------------------------------------------------+ |
 * +------------------------------------------------------+
 * lg 起显示全部 5 列。
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * Table 布局。新建 ban 通过 Dialog（UserPicker + reason + expiresAt）。
 * 宽度处置：标题行 = h2（固定短文本）+ [+ Ban]（按钮自带 shrink-0），
 * justify-between 推开两端；表格窄端由 Table 外层 overflow-auto 整体横滚
 * （列另按断点 hidden sm:/lg:table-cell 降级隐藏），宽端列宽随容器伸展。
 * 边界：0 个 ban → EmptyState。
 *       expiresAt 为 null → 显示 "never"。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function ModBansPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <BansSection spaceId={params.id} />
    </ModBoundary>
  );
}
