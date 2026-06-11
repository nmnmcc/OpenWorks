"use client";

import { Keys } from "@/atoms/keys";
import { markAllNotificationsReadAtom, markNotificationReadAtom, notificationsPageQuery } from "@/atoms/notifications";
import { SectionBoundary } from "@/components/SectionBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { useAtomSet } from "@effect/atom-react";
import type { NotificationEntry } from "@openworks/backend/api";
import { BellIcon, CheckCheckIcon } from "lucide-react";
import { useRouter } from "next/navigation";

function NotificationRow({ notification }: { readonly notification: NotificationEntry }) {
  const [t] = useT();
  const router = useRouter();
  const markRead = useAtomSet(markNotificationReadAtom, { mode: "promise" });

  async function handleClick() {
    try {
      if (!notification.isRead) {
        await markRead({ params: { id: notification.id }, reactivityKeys: [Keys.notifications] });
      }
      if (notification.linkUrl !== null) {
        router.push(notification.linkUrl);
      }
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <Card
      className={cn(
        "hover:bg-accent cursor-pointer p-3 transition-colors [--space:--spacing(3)]",
        !notification.isRead && "border-info/48 bg-info/4",
      )}
      onClick={handleClick}
    >
      <div className="flex items-start gap-2">
        {!notification.isRead && <span aria-hidden className="bg-info mt-1.5 size-2 shrink-0 rounded-full" />}
        <div className="min-w-0 flex-1 wrap-anywhere">
          <p className={cn("text-sm", !notification.isRead && "font-semibold")}>{notification.title}</p>
          {notification.body !== null && <p className="text-muted-foreground text-sm">{notification.body}</p>}
        </div>
        <TimeAgo className="text-muted-foreground shrink-0 text-xs" date={notification.createdAt} />
      </div>
    </Card>
  );
}

function NotificationList() {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState icon={<BellIcon />} title={t.notifications.empty} />}
      pageQuery={notificationsPageQuery}
      renderPage={(notifications) =>
        notifications.map((notification) => <NotificationRow key={notification.id} notification={notification} />)
      }
    />
  );
}

/**
 * Mobile (<640px):
 * +-----------------------------+
 * | Notifications  [Mark all]   |
 * |-----------------------------|
 * | [*] Title (bold)    3h ago  |
 * |     Body text               |
 * |-----------------------------|
 * |     Title (read)    1d ago  |
 * +-----------------------------+
 * w-full, single column. Notification
 * cards fill available width.
 *
 * Tablet (640-1023px):
 * +--------------------------------------+
 * | Notifications       [Mark all read]  |
 * |--------------------------------------|
 * | [*] Title (bold if unread)   3h ago  |
 * |     Body text                        |
 * |--------------------------------------|
 * |     Title (read)             1d ago  |
 * +--------------------------------------+
 * same structure -- max-w-3xl centered.
 *
 * Desktop (1024-1535px):
 * +------------------------------------------+
 * | Notifications         [Mark all read]    |
 * |------------------------------------------|
 * | [*] Title (bold if unread)    3h ago     |
 * |     Body text                            |
 * |------------------------------------------|
 * |     Title (read)              1d ago     |
 * +------------------------------------------+
 * same structure -- max-w-3xl centered with
 * wider viewport margins.
 *
 * Ultra-wide (>=1536px):
 * +--------------------------------------------------+
 * |      Notifications         [Mark all read]       |
 * |--------------------------------------------------|
 * |      [*] Title (bold if unread)       3h ago     |
 * |          Body text                               |
 * |--------------------------------------------------|
 * |          Title (read)                 1d ago     |
 * +--------------------------------------------------+
 * same structure -- max-w-3xl (48rem) centered,
 * large symmetric margins from mx-auto.
 *
 * w-full max-w-3xl mx-auto 居中容器。无响应式断点——所有尺寸结构一致。
 * 行内宽度处置：通知行 = 蓝点（shrink-0）+ 内容（min-w-0 flex-1，标题/正文
 * 自然折行，超长无空格词由 wrap-anywhere 断行）+ 时间（shrink-0）；标题行
 * h1 与 [Mark all read] 均为固定短标签（按钮自带 shrink-0），justify-between
 * 推开两端，320px 下两者合计仍小于行宽。
 * 未读通知：左侧蓝点（bg-info）+ 蓝色边框/背景（border-info/48 bg-info/4）+ 粗体标题。
 * 点击通知：标记已读并跳转 linkUrl。
 * 边界：0 条通知 -> EmptyState。
 *       linkUrl 为 null -> 仅标记已读，不跳转。
 *       body 为 null -> 不显示正文行。
 *       列表分页（PagedList，每页 25 条），末页满载时显示"加载更多"。
 */
export default function NotificationsPage() {
  const [t] = useT();
  const markAllRead = useAtomSet(markAllNotificationsReadAtom, { mode: "promise" });

  async function handleMarkAllRead() {
    try {
      await markAllRead({ reactivityKeys: [Keys.notifications] });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">{t.notifications.title}</h1>
          <Button onClick={handleMarkAllRead} size="sm" variant="outline">
            <CheckCheckIcon />
            {t.notifications.markAllRead}
          </Button>
        </div>
        <SectionBoundary>
          <NotificationList />
        </SectionBoundary>
      </div>
    </RequireAuth>
  );
}
