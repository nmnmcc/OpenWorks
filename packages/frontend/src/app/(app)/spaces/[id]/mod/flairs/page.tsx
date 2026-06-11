"use client";

import {
  createPostFlairAtom,
  deletePostFlairAtom,
  postFlairsQuery,
  removeUserFlairAtom,
  setUserFlairAtom,
  updatePostFlairAtom,
  userFlairQuery,
} from "@/atoms/flairs";
import { Keys } from "@/atoms/keys";
import { ModBoundary } from "@/components/mod/ModBoundary";
import { EmptyState } from "@/components/shared/EmptyState";
import { UserLink } from "@/components/shared/UserLink";
import { UserPicker } from "@/components/shared/UserPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomSuspense, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { PostFlairEntry } from "@openworks/backend/api";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";

interface FlairDialogProps {
  readonly spaceId: string;
  readonly flair?: PostFlairEntry;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

function FlairDialog({ spaceId, flair, open, onOpenChange }: FlairDialogProps) {
  const [t] = useT();
  const createFlair = useAtomSet(createPostFlairAtom, { mode: "promise" });
  const updateFlair = useAtomSet(updatePostFlairAtom, { mode: "promise" });

  const [name, setName] = useState(flair?.name ?? "");
  const [color, setColor] = useState(flair?.color ?? "#6366f1");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (flair) {
        await updateFlair({
          params: { id: flair.id },
          payload: { name: name.trim(), color },
          reactivityKeys: [Keys.postFlairs(spaceId)],
        });
      } else {
        await createFlair({
          payload: { spaceId, name: name.trim(), color },
          reactivityKeys: [Keys.postFlairs(spaceId)],
        });
      }
      onOpenChange(false);
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog onOpenChange={(details) => onOpenChange(details.open)} open={open}>
      <DialogContent size="sm">
        <DialogHeader title={flair ? t.mod.flairs.editTitle : t.mod.flairs.add} />
        <form className="flex min-h-0 flex-col" onSubmit={handleSubmit}>
          <DialogBody className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="flair-name">
                {t.mod.flairs.name}
              </label>
              <Input id="flair-name" onChange={(event) => setName(event.target.value)} required value={name} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium" htmlFor="flair-color">
                {t.mod.flairs.color}
              </label>
              <input
                className="h-9 w-16 cursor-pointer rounded-md border bg-transparent p-1"
                id="flair-color"
                onChange={(event) => setColor(event.target.value)}
                type="color"
                value={color}
              />
            </div>
          </DialogBody>
          <DialogFooter>
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">
              {t.common.cancel}
            </Button>
            <Button isLoading={busy} type="submit">
              {flair ? t.common.save : t.common.create}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface UserFlairPanelProps {
  readonly spaceId: string;
  readonly userId: string;
}

function UserFlairPanel({ spaceId, userId }: UserFlairPanelProps) {
  const [t] = useT();
  const result = useAtomValue(userFlairQuery(spaceId, userId));
  const setUserFlair = useAtomSet(setUserFlairAtom, { mode: "promise" });
  const removeUserFlair = useAtomSet(removeUserFlairAtom, { mode: "promise" });

  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  if (!AsyncResult.isSuccess(result)) {
    return null;
  }

  const current = result.value;

  async function handleSet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      await setUserFlair({
        payload: { spaceId, userId, text: text.trim() },
        reactivityKeys: [Keys.userFlair(spaceId, userId)],
      });
      setText("");
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  async function handleClear() {
    setBusy(true);
    try {
      await removeUserFlair({
        query: { spaceId, userId },
        reactivityKeys: [Keys.userFlair(spaceId, userId)],
      });
    } catch (error) {
      showApiError(t.errors, error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-3">
      <div className="flex items-center gap-2 text-sm">
        <UserLink className="truncate" id={userId} />
        {current !== null ? (
          <Badge variant="secondary">
            {current.color !== null && (
              <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: current.color }} />
            )}
            <span className="truncate">{current.text}</span>
          </Badge>
        ) : (
          <span className="text-muted-foreground">{t.mod.flairs.notSet}</span>
        )}
      </div>
      <form className="flex items-center gap-2" onSubmit={handleSet}>
        <Input
          onChange={(event) => setText(event.target.value)}
          placeholder={t.mod.flairs.text}
          required
          size="sm"
          value={text}
        />
        <Button isLoading={busy} size="sm" type="submit">
          {t.mod.flairs.setAction}
        </Button>
        {current !== null && (
          <Button disabled={busy} onClick={handleClear} size="sm" type="button" variant="outline">
            {t.mod.flairs.clearAction}
          </Button>
        )}
      </form>
    </div>
  );
}

function FlairsSection({ spaceId }: { readonly spaceId: string }) {
  const [t] = useT();
  const result = useAtomSuspense(postFlairsQuery(spaceId));
  const deleteFlair = useAtomSet(deletePostFlairAtom, { mode: "promise" });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingFlair, setEditingFlair] = useState<PostFlairEntry | undefined>(undefined);
  const [lookupUserId, setLookupUserId] = useState<string | undefined>(undefined);

  async function handleDelete(flair: PostFlairEntry) {
    try {
      await deleteFlair({ params: { id: flair.id }, reactivityKeys: [Keys.postFlairs(spaceId)] });
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium">{t.mod.flairs.title}</h2>
        <Button
          onClick={() => {
            setEditingFlair(undefined);
            setDialogOpen(true);
          }}
          size="sm"
        >
          <PlusIcon />
          {t.mod.flairs.add}
        </Button>
      </div>

      {result.value.length === 0 ? (
        <EmptyState title={t.mod.flairs.empty} />
      ) : (
        <div className="flex flex-col gap-2">
          {result.value.map((flair) => (
            <Card className="flex-row items-center gap-2 p-3 [--space:--spacing(3)]" key={flair.id}>
              <Badge variant="secondary">
                {flair.color !== null && (
                  <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: flair.color }} />
                )}
                <span className="truncate">{flair.name}</span>
              </Badge>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  aria-label={t.common.edit}
                  onClick={() => {
                    setEditingFlair(flair);
                    setDialogOpen(true);
                  }}
                  size="icon-sm"
                  variant="ghost"
                >
                  <PencilIcon />
                </Button>
                <Button
                  aria-label={t.common.delete}
                  className="text-destructive"
                  onClick={() => handleDelete(flair)}
                  size="icon-sm"
                  variant="ghost"
                >
                  <Trash2Icon />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Separator />

      <h2 className="font-medium">{t.mod.flairs.userFlairTitle}</h2>
      <UserPicker onValueChange={setLookupUserId} placeholder={t.mod.flairs.searchUser} value={lookupUserId} />
      {lookupUserId !== undefined && <UserFlairPanel spaceId={spaceId} key={lookupUserId} userId={lookupUserId} />}

      {dialogOpen && (
        <FlairDialog
          flair={editingFlair}
          spaceId={spaceId}
          key={editingFlair?.id ?? "new"}
          onOpenChange={setDialogOpen}
          open={dialogOpen}
        />
      )}
    </div>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * +----------------------------------------------+
 * | Post Flairs                    [+ Add Flair] |
 * |----------------------------------------------|
 * | [(dot) Flair A]              [Edit] [Delete] |
 * | [(dot) Flair B]              [Edit] [Delete] |
 * |----------------------------------------------|
 * | User Flairs                                  |
 * | [s] Search user... (UserPicker w-full)        |
 * | +------------------------------------------+ |
 * | | user link  [(dot) current flair]         | |
 * | | [new text input]  [Set]  [Clear?]        | |
 * | +------------------------------------------+ |
 * +----------------------------------------------+
 *
 * 嵌套在父级 ModLayout 中，响应式宽度由 ModLayout 控制。
 * 本页自身无断点，所有视口下结构一致。
 *
 * 帖子 flair 管理（上半）+ 用户 flair 查询（下半）。
 * 宽度处置：标题行 = h2 + [+ Add]（按钮自带 shrink-0），justify-between；
 * flair 行 = Badge（overflow-hidden 可收缩，名称 truncate）+ ml-auto 操作组
 * （icon-sm 等高，shrink-0）；用户查询面板：用户名/当前 flair 名 truncate；
 * 表单行 = Input（size=sm 与 sm 按钮等高，min-w-0 收缩）+ sm 按钮组
 * （shrink-0），宽端 Input 伸展吃满余宽。
 * 边界：0 个 flair → EmptyState。
 *       用户当前无 flair → 不显示 Clear 按钮。
 */
export default function ModFlairsPage() {
  const params = useParams<{ id: string }>();

  return (
    <ModBoundary>
      <FlairsSection spaceId={params.id} />
    </ModBoundary>
  );
}
