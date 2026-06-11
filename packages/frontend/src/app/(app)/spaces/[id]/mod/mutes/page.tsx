"use client";

import { Keys } from "@/atoms/keys";
import { mutesPageQuery, muteUserAtom, unmuteUserAtom } from "@/atoms/spaces";
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

function MuteDialog({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const muteUser = useAtomSet(muteUserAtom, { mode: "promise" });

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
      await muteUser({
        params: { id: spaceId },
        payload: {
          userId,
          reason: reason.trim().length > 0 ? reason.trim() : undefined,
          expiresAt: expiresAt.length > 0 ? new Date(expiresAt) : undefined,
        },
        reactivityKeys: [Keys.mutes(spaceId)],
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
          {t.mod.mutes.add}
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader title={t.mod.mutes.add} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium">{t.common.user}</span>
              <UserPicker
                key={pickerGeneration}
                onValueChange={setUserId}
                placeholder={t.mod.mutes.searchUser}
                value={userId}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="mute-reason">
                {t.common.reason} ({t.common.optional})
              </label>
              <Input id="mute-reason" onChange={(event) => setReason(event.target.value)} value={reason} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="mute-expires">
                {t.common.expiresAt} ({t.common.optional})
              </label>
              <Input
                id="mute-expires"
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
              {t.mod.mutes.add}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MutesSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const unmuteUser = useAtomSet(unmuteUserAtom, { mode: "promise" });

  async function handleUnmute(muteId: string) {
    try {
      await unmuteUser({ params: { id: spaceId, muteId }, reactivityKeys: [Keys.mutes(spaceId)] });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t.mod.mutes.title}</h2>
        <MuteDialog spaceId={spaceId} />
      </div>

      <PagedList
        emptyState={<EmptyState title={t.mod.mutes.empty} />}
        pageQuery={(offset) => mutesPageQuery(spaceId, offset)}
        renderContainer={(pages) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.common.user}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.common.reason}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.mod.mutes.mutedBy}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.common.expiresAt}</TableHead>
                <TableHead className="w-20" />
              </TableRow>
            </TableHeader>
            <TableBody>{pages}</TableBody>
          </Table>
        )}
        renderPage={(mutes) =>
          mutes.map((mute) => (
            <TableRow key={mute.id}>
              <TableCell>
                <UserLink id={mute.userId} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {mute.reason ?? t.common.none}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <UserLink id={mute.mutedById} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                {mute.expiresAt !== null ? <TimeAgo date={mute.expiresAt} /> : t.common.never}
              </TableCell>
              <TableCell>
                <Button onClick={() => handleUnmute(mute.id)} size="xs" variant="outline">
                  {t.mod.mutes.unmute}
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
 * | Mutes          [+ Mute User]  |
 * | +---------------------------+ |
 * | | User          |           | |
 * | |---------------|-----------|  |
 * | | link          | [Unmute]  |  |
 * | +---------------------------+ |
 * +-------------------------------+
 * 仅显示 User + Action 列。
 *
 * Tablet (640-1023px):
 * +--------------------------------------------+
 * | Mutes                      [+ Mute User]   |
 * | +----------------------------------------+ |
 * | | User  | Reason   | Expires |           | |
 * | |-------|----------|---------|-----------|  |
 * | | link  | text     | 3d ago  | [Unmute]  |  |
 * | +----------------------------------------+ |
 * +--------------------------------------------+
 * sm 起显示 Reason + Expires 列；MutedBy 仍隐藏。
 *
 * Desktop (1024-1535px) / Ultra-wide (>=1536px):
 * +------------------------------------------------------+
 * | Mutes                                [+ Mute User]   |
 * | +--------------------------------------------------+ |
 * | | User  | Reason | Muted by  | Expires |           | |
 * | |-------|--------|-----------|---------|-----------|  |
 * | | link  | text   | link      | 3d ago  | [Unmute] |  |
 * | +--------------------------------------------------+ |
 * +------------------------------------------------------+
 * lg 起显示全部 5 列。
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * 与 Bans 页面响应策略一致。
 * 宽度处置：标题行 = h2（固定短文本）+ [+ Mute]（按钮自带 shrink-0），
 * justify-between 推开两端；表格窄端由 Table 外层 overflow-auto 整体横滚
 * （列按断点降级隐藏），宽端列宽随容器伸展。
 * 边界：0 个 mute → EmptyState。
 *       expiresAt 为 null → 显示 "never"。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function ModMutesPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <MutesSection spaceId={params.id} />
    </ModBoundary>
  );
}
