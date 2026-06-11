"use client";

import { Keys } from "@/atoms/keys";
import { deleteMessageAtom, inboxPageQuery, markMessageReadAtom, sentPageQuery } from "@/atoms/messages";
import { SectionBoundary } from "@/components/SectionBoundary";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { MessageComposeDialog } from "@/components/shared/MessageComposeDialog";
import { PagedList } from "@/components/shared/PagedList";
import { PortableTextView } from "@/components/shared/PortableTextView";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { UserLink } from "@/components/shared/UserLink";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet } from "@effect/atom-react";
import type { MessageEntry } from "@openworks/backend/api";
import { MailIcon, PenSquareIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

interface MessageRowProps {
  readonly message: MessageEntry;
  readonly box: "inbox" | "sent";
}

function MessageRow({ message, box }: MessageRowProps) {
  const [t] = useT();
  const markRead = useAtomSet(markMessageReadAtom, { mode: "promise" });
  const deleteMessage = useAtomSet(deleteMessageAtom, { mode: "promise" });
  const [deleteOpen, setDeleteOpen] = useState(false);

  const unread = box === "inbox" && !message.isRead;

  function handleOpenChange(open: boolean) {
    if (open && unread) {
      markRead({ params: { id: message.id }, reactivityKeys: [Keys.messages, Keys.notifications] }).catch(
        (error: unknown) => {
          showApiError(t.errors, error);
        },
      );
    }
  }

  return (
    <Card className="p-3 [--space:--spacing(3)]">
      <Collapsible onOpenChange={(details) => handleOpenChange(details.open)}>
        <CollapsibleTrigger className="flex w-full items-center gap-2 text-left">
          {unread && <span aria-hidden className="bg-info size-2 shrink-0 rounded-full" />}
          <span className="flex min-w-0 flex-1 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <span className="text-muted-foreground flex shrink-0 items-center gap-1 text-xs">
              {box === "inbox" ? t.messages.from : t.messages.to}
              <UserLink className="max-w-40 truncate" id={box === "inbox" ? message.senderId : message.recipientId} />
            </span>
            <span className={unread ? "truncate text-sm font-semibold" : "truncate text-sm"}>{message.subject}</span>
          </span>
          <TimeAgo className="text-muted-foreground shrink-0 text-xs" date={message.createdAt} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 flex items-start gap-2 border-t pt-2">
            <PortableTextView className="min-w-0 flex-1" value={message.body} />
            <Button
              aria-label={t.common.delete}
              className="text-destructive shrink-0"
              onClick={() => setDeleteOpen(true)}
              size="icon-sm"
              variant="ghost"
            >
              <Trash2Icon />
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <ConfirmDialog
        confirmLabel={t.common.delete}
        description={t.messages.deleteConfirmBody}
        destructive
        onConfirm={() =>
          deleteMessage({ params: { id: message.id }, reactivityKeys: [Keys.messages] })
            .then(() => undefined)
            .catch((error: unknown) => {
              showApiError(t.errors, error);
            })
        }
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title={t.messages.deleteConfirmTitle}
      />
    </Card>
  );
}

function Inbox() {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState icon={<MailIcon />} title={t.messages.emptyInbox} />}
      pageQuery={inboxPageQuery}
      renderPage={(messages) =>
        messages.map((message) => <MessageRow box="inbox" key={message.id} message={message} />)
      }
    />
  );
}

function Sent() {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState icon={<MailIcon />} title={t.messages.emptySent} />}
      pageQuery={sentPageQuery}
      renderPage={(messages) =>
        messages.map((message) => <MessageRow box="sent" key={message.id} message={message} />)
      }
    />
  );
}

/**
 * Mobile (<640px):
 * +-------------------------------+
 * | Messages          [Compose]   |
 * | [Inbox | Sent]                |
 * |-------------------------------|
 * | [*] From user                 |
 * |     Subject text...   3h ago  |
 * |     (click to expand)         |
 * |   +-------------------------+ |
 * |   | Message body   [Delete] | |
 * |   +-------------------------+ |
 * |-------------------------------|
 * |     To user                   |
 * |     Subject text...   1d ago  |
 * +-------------------------------+
 * From/To label and Subject stack vertically
 * (flex-col) on mobile. w-full fills viewport.
 *
 * Tablet (640-1023px):
 * +-------------------------------------------+
 * | Messages                    [Compose]     |
 * | [Inbox | Sent]                            |
 * |-------------------------------------------|
 * | [*] From user  Subject text...    3h ago  |
 * |     (click to expand)                     |
 * |   +-------------------------------------+ |
 * |   | Message body          [Delete]      | |
 * |   +-------------------------------------+ |
 * |-------------------------------------------|
 * |     To user    Subject text...    1d ago  |
 * +-------------------------------------------+
 * sm:flex-row kicks in -- From/To and Subject
 * sit on one line. max-w-3xl centered.
 *
 * Desktop (1024-1535px):
 * +----------------------------------------------+
 * | Messages                     [Compose]       |
 * | [Inbox | Sent]                               |
 * |----------------------------------------------|
 * | [*] From user  Subject text...    3h ago     |
 * |     (click to expand)                        |
 * |   +----------------------------------------+ |
 * |   | Message body          [Delete]         | |
 * |   +----------------------------------------+ |
 * |----------------------------------------------|
 * |     To user    Subject text...    1d ago     |
 * +----------------------------------------------+
 * same structure as Tablet -- max-w-3xl centered
 * with wider viewport margins.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------------+
 * |      Messages                     [Compose]            |
 * |      [Inbox | Sent]                                    |
 * |--------------------------------------------------------|
 * |      [*] From user  Subject text...        3h ago      |
 * |          (click to expand)                             |
 * |        +--------------------------------------------+  |
 * |        | Message body               [Delete]        |  |
 * |        +--------------------------------------------+  |
 * |--------------------------------------------------------|
 * |          To user    Subject text...        1d ago      |
 * +--------------------------------------------------------+
 * same structure -- max-w-3xl (48rem) centered,
 * large symmetric margins from mx-auto.
 *
 * w-full max-w-3xl mx-auto 居中容器。Tabs 切换 inbox/sent。
 * 消息行用 Collapsible 展开正文；展开 inbox 未读消息自动标记已读。
 * 关键响应式断点：消息行中 from/subject 使用
 * `flex-col sm:flex-row sm:items-center sm:gap-2`，
 * sm 以下竖排堆叠，sm 及以上单行并排。
 * 行内宽度处置：未读点/时间 shrink-0；发件人组 shrink-0 但用户名被
 * max-w-40 + truncate 封顶（超长名截断为省略号）；subject truncate
 * 吃掉行内余宽并截断。标题行：h1 与 [Compose] 均固定宽，justify-between
 * 推开两端。展开正文行：正文 min-w-0 flex-1（吃满余宽、超长词由
 * wrap-anywhere 断行），删除按钮 shrink-0。
 * 边界：0 条消息 -> EmptyState（inbox/sent 各自独立）。
 *       未读消息：蓝点（bg-info）+ 粗体 subject。
 *       删除消息弹出 ConfirmDialog 确认。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function MessagesPage() {
  const [t] = useT();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t.messages.title}</h1>
          <Button onClick={() => setComposeOpen(true)} size="sm">
            <PenSquareIcon />
            {t.messages.compose}
          </Button>
        </div>

        <Tabs defaultValue="inbox">
          <TabsList className="mb-3 w-fit">
            <TabsTrigger value="inbox">{t.messages.inbox}</TabsTrigger>
            <TabsTrigger value="sent">{t.messages.sent}</TabsTrigger>
          </TabsList>
          <TabsContent value="inbox">
            <SectionBoundary>
              <Inbox />
            </SectionBoundary>
          </TabsContent>
          <TabsContent value="sent">
            <SectionBoundary>
              <Sent />
            </SectionBoundary>
          </TabsContent>
        </Tabs>

        <MessageComposeDialog onOpenChange={setComposeOpen} open={composeOpen} />
      </div>
    </RequireAuth>
  );
}
