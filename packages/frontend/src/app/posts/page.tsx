"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAtomSuspense } from "@effect/atom-react";
import { ErrorBoundary } from "react-error-boundary";
import { postsAtom } from "@/atoms/posts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

function PostsList() {
  const result = useAtomSuspense(postsAtom);
  const posts = result.value;

  if (posts.length === 0) {
    return <p className="text-muted-foreground py-12 text-center">No posts yet. Create your first one!</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <Card key={post.id}>
          <CardHeader title={post.title} />
          <CardContent>
            <p className="text-muted-foreground text-sm">{new Date(post.createdAt).toLocaleDateString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function PostsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-semibold text-2xl">Posts</h1>
        <Button asChild>
          <Link href="/posts/new">New post</Link>
        </Button>
      </div>

      <ErrorBoundary fallback={<p className="text-destructive">Failed to load posts.</p>}>
        <Suspense
          fallback={
            <div className="flex justify-center py-12">
              <Spinner />
            </div>
          }
        >
          <PostsList />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
