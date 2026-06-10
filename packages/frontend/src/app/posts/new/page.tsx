"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAtomSet } from "@effect/atom-react";
import { createPostAtom } from "@/atoms/posts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";

export default function NewPostPage() {
  const router = useRouter();
  const createPost = useAtomSet(createPostAtom, { mode: "promise" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const title = formData.get("title") as string;
    const text = formData.get("content") as string;

    try {
      await createPost({
        payload: {
          title,
          content: [
            {
              _type: "block",
              children: [{ _type: "span", text }],
            },
          ],
        },
        reactivityKeys: ["posts"],
      });
      router.push("/posts");
    } catch {
      setError("Failed to create post");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Card>
        <CardHeader title="New post" />
        <form onSubmit={handleSubmit}>
          <CardContent className="flex flex-col gap-4">
            {error && <p className="text-destructive text-sm">{error}</p>}
            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-sm font-medium">
                Title
              </label>
              <Input id="title" name="title" required />
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="content" className="text-sm font-medium">
                Content
              </label>
              <Textarea id="content" name="content" required rows={6} />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" isLoading={loading}>
              Create post
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
