"use client";

import { commentQuery } from "@/atoms/comments";
import { Keys } from "@/atoms/keys";
import { postQuery } from "@/atoms/posts";
import { savedPageQuery, unsaveItemAtom } from "@/atoms/saved";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { portableTextToPlainText } from "@/lib/portable-text";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { SavedItemEntry } from "@openworks/backend/api";
import { BookmarkIcon } from "lucide-react";
import Link from "next/link";

function SavedPostRow({ postId }: { readonly postId: string }) {
  const [t] = useT();
  const result = useAtomValue(postQuery(postId));

  if (!AsyncResult.isSuccess(result)) {
    return <Skeleton className="h-5 w-48" />;
  }

  return (
    <div className="min-w-0">
      <Badge className="mb-1" variant="secondary">
        {t.saved.postLabel}
      </Badge>
      <Link className="block truncate font-medium hover:underline" href={`/posts/${postId}`}>
        {result.value.title}
      </Link>
    </div>
  );
}

function SavedCommentRow({ commentId }: { readonly commentId: string }) {
  const [t] = useT();
  const result = useAtomValue(commentQuery(commentId));

  if (!AsyncResult.isSuccess(result)) {
    return <Skeleton className="h-5 w-48" />;
  }

  return (
    <div className="min-w-0">
      <Badge className="mb-1" variant="secondary">
        {t.saved.commentLabel}
      </Badge>
      <Link className="block hover:underline" href={`/posts/${result.value.postId}`}>
        <span className="line-clamp-2 text-sm">{portableTextToPlainText(result.value.content)}</span>
      </Link>
    </div>
  );
}

function SavedEntryCard({ entry }: { readonly entry: SavedItemEntry }) {
  const [t] = useT();
  const unsaveItem = useAtomSet(unsaveItemAtom, { mode: "promise" });

  async function handleUnsave() {
    try {
      await unsaveItem({
        query: { postId: entry.postId ?? undefined, commentId: entry.commentId ?? undefined },
        reactivityKeys: [Keys.saved],
      });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <Card className="flex-row items-center gap-3 p-3 [--space:--spacing(3)]">
      <div className="min-w-0 flex-1">
        {entry.postId !== null && <SavedPostRow postId={entry.postId} />}
        {entry.commentId !== null && <SavedCommentRow commentId={entry.commentId} />}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TimeAgo className="text-muted-foreground text-xs" date={entry.createdAt} />
        <Button onClick={handleUnsave} size="xs" variant="outline">
          {t.post.unsaveAction}
        </Button>
      </div>
    </Card>
  );
}

function SavedList() {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState icon={<BookmarkIcon />} title={t.saved.empty} />}
      pageQuery={savedPageQuery}
      renderPage={(entries) => entries.map((entry) => <SavedEntryCard entry={entry} key={entry.id} />)}
    />
  );
}

export function SavedContent() {
  const [t] = useT();

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-4 text-xl font-semibold">{t.saved.title}</h1>
        <SavedList />
      </div>
    </RequireAuth>
  );
}
