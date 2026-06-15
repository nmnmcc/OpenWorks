"use client";

import { Keys } from "@/atoms/keys";
import { markAllNotificationsReadAtom, markNotificationReadAtom, notificationsPageQuery } from "@/atoms/notifications";
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

export function NotificationsContent() {
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
        <NotificationList />
      </div>
    </RequireAuth>
  );
}
