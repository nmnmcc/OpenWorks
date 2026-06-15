"use client";

import { hiddenPageQuery, unhidePostAtom } from "@/atoms/hidden";
import { Keys } from "@/atoms/keys";
import { postQuery } from "@/atoms/posts";
import { EmptyState } from "@/components/shared/EmptyState";
import { PagedList } from "@/components/shared/PagedList";
import { RequireAuth } from "@/components/shared/RequireAuth";
import { TimeAgo } from "@/components/shared/TimeAgo";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { HiddenPostEntry } from "@openworks/backend/api";
import { EyeOffIcon } from "lucide-react";
import Link from "next/link";

function HiddenPostRow({ postId }: { readonly postId: string }) {
  const result = useAtomValue(postQuery(postId));

  if (!AsyncResult.isSuccess(result)) {
    return <Skeleton className="h-5 w-48" />;
  }

  return (
    <Link className="block truncate font-medium hover:underline" href={`/posts/${postId}`}>
      {result.value.title}
    </Link>
  );
}

function HiddenEntryCard({ entry }: { readonly entry: HiddenPostEntry }) {
  const [t] = useT();
  const unhidePost = useAtomSet(unhidePostAtom, { mode: "promise" });

  async function handleUnhide() {
    try {
      await unhidePost({ query: { postId: entry.postId }, reactivityKeys: [Keys.hidden, Keys.posts] });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <Card className="flex-row items-center gap-3 p-3 [--space:--spacing(3)]">
      <div className="min-w-0 flex-1">
        <HiddenPostRow postId={entry.postId} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <TimeAgo className="text-muted-foreground text-xs" date={entry.createdAt} />
        <Button onClick={handleUnhide} size="xs" variant="outline">
          {t.post.unhideAction}
        </Button>
      </div>
    </Card>
  );
}

function HiddenList() {
  const [t] = useT();

  return (
    <PagedList
      emptyState={<EmptyState icon={<EyeOffIcon />} title={t.hidden.empty} />}
      pageQuery={hiddenPageQuery}
      renderPage={(entries) => entries.map((entry) => <HiddenEntryCard entry={entry} key={entry.id} />)}
    />
  );
}

export function HiddenContent() {
  const [t] = useT();

  return (
    <RequireAuth>
      <div className="mx-auto w-full max-w-3xl">
        <h1 className="mb-4 text-xl font-semibold">{t.hidden.title}</h1>
        <HiddenList />
      </div>
    </RequireAuth>
  );
}
