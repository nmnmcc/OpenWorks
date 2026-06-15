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

export function MessagesContent() {
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
