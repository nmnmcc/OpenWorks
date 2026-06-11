"use client";

import { Keys } from "@/atoms/keys";
import { createInvitationAtom, invitationsPageQuery, revokeInvitationAtom } from "@/atoms/spaces";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { showApiError } from "@/lib/errors";
import type { Translation } from "@/lib/i18n";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import { CopyIcon, PlusIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

function statusLabel(t: Translation, status: string): string {
  switch (status) {
    case "pending":
      return t.mod.invitations.statusPending;
    case "accepted":
      return t.mod.invitations.statusAccepted;
    case "revoked":
      return t.mod.invitations.statusRevoked;
    case "expired":
      return t.mod.invitations.statusExpired;
    default:
      return status;
  }
}

function InviteDialog({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const createInvitation = useAtomSet(createInvitationAtom, { mode: "promise" });

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await createInvitation({
        params: { id: spaceId },
        payload: {
          email: email.trim(),
          expiresAt: expiresAt.length > 0 ? new Date(expiresAt) : undefined,
        },
        reactivityKeys: [Keys.invitations(spaceId)],
      });
      setEmail("");
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
          {t.mod.invitations.add}
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader title={t.mod.invitations.add} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="invite-email">
                {t.mod.invitations.email}
              </label>
              <Input
                id="invite-email"
                onChange={(event) => setEmail(event.target.value)}
                required
                type="email"
                value={email}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="invite-expires">
                {t.common.expiresAt} ({t.common.optional})
              </label>
              <Input
                id="invite-expires"
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
            <Button isLoading={busy} type="submit">
              {t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvitationsSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const revokeInvitation = useAtomSet(revokeInvitationAtom, { mode: "promise" });

  async function handleCopy(token: string) {
    await navigator.clipboard.writeText(`${window.location.origin}/invitations/accept?token=${token}`);
    toast.success({ title: t.common.copied });
  }

  async function handleRevoke(invitationId: string) {
    try {
      await revokeInvitation({
        params: { id: spaceId, invitationId },
        reactivityKeys: [Keys.invitations(spaceId)],
      });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t.mod.invitations.title}</h2>
        <InviteDialog spaceId={spaceId} />
      </div>

      <PagedList
        emptyState={<EmptyState title={t.mod.invitations.empty} />}
        pageQuery={(offset) => invitationsPageQuery(spaceId, offset)}
        renderContainer={(pages) => (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.mod.invitations.email}</TableHead>
                <TableHead>{t.common.status}</TableHead>
                <TableHead className="hidden lg:table-cell">{t.mod.invitations.invitedBy}</TableHead>
                <TableHead className="hidden sm:table-cell">{t.common.expiresAt}</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>{pages}</TableBody>
          </Table>
        )}
        renderPage={(invitations) =>
          invitations.map((invitation) => (
            <TableRow key={invitation.id}>
              <TableCell className="max-w-[10rem] truncate">{invitation.email}</TableCell>
              <TableCell>
                <Badge variant={invitation.status === "pending" ? "info" : "secondary"}>
                  {statusLabel(t, invitation.status)}
                </Badge>
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <UserLink id={invitation.invitedById} />
              </TableCell>
              <TableCell className="text-muted-foreground hidden sm:table-cell">
                <TimeAgo date={invitation.expiresAt} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button
                    aria-label={t.common.copyLink}
                    onClick={() => handleCopy(invitation.token)}
                    size="icon-sm"
                    variant="ghost"
                  >
                    <CopyIcon />
                  </Button>
                  {invitation.status === "pending" && (
                    <Button onClick={() => handleRevoke(invitation.id)} size="sm" variant="outline">
                      {t.mod.invitations.revoke}
                    </Button>
                  )}
                </div>
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
 * +----------------------------------+
 * | Invitations         [+ Invite]   |
 * | +------------------------------+ |
 * | | Email   | Status |           | |
 * | |---------|--------|-----------|  |
 * | | a@b.c   |Pending | [C][R]   |  |
 * | +------------------------------+ |
 * +----------------------------------+
 * 仅显示 Email + Status + Action 列，长邮箱截断 (max-w-[10rem])。
 *
 * Tablet (640-1023px):
 * +---------------------------------------------+
 * | Invitations                    [+ Invite]   |
 * | +-----------------------------------------+ |
 * | | Email  | Status  | Expires |            | |
 * | |--------|---------|---------|------------|  |
 * | | a@b.c  | Pending | 3d ago  | [C][R]    |  |
 * | +-----------------------------------------+ |
 * +---------------------------------------------+
 * sm 起显示 Expires 列；InvitedBy 仍隐藏。
 *
 * Desktop (1024-1535px) / Ultra-wide (>=1536px):
 * +------------------------------------------------------+
 * | Invitations                          [+ Invite]      |
 * | +--------------------------------------------------+ |
 * | | Email  | Status  | Invited by | Expires |        | |
 * | |--------|---------|------------|---------|--------|  |
 * | | a@b.c  | Pending | link       | 3d ago  |[C][R] |  |
 * | +--------------------------------------------------+ |
 * +------------------------------------------------------+
 * lg 起显示全部 5 列。
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * [C] 复制邀请链接，[R] 撤销（仅 pending）。
 * 宽度处置：标题行 = h2 + [+ Invite]（按钮自带 shrink-0），justify-between；
 * email 列 max-w-[10rem] truncate；操作组 = icon-sm + sm 按钮（等高 h-7，
 * shrink-0）；表格窄端由 Table 外层 overflow-auto 整体横滚（列按断点降级隐藏）。
 * 新建通过 Dialog（email + expiresAt）。
 * 边界：0 个邀请 → EmptyState。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function ModInvitationsPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <InvitationsSection spaceId={params.id} />
    </ModBoundary>
  );
}
