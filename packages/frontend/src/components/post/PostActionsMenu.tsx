"use client";

import { hiddenEntryQuery, hidePostAtom, unhidePostAtom } from "@/atoms/hidden";
import { Keys } from "@/atoms/keys";
import {
  deletePostAtom,
  lockPostAtom,
  pinPostAtom,
  removePostAtom,
  unlockPostAtom,
  unpinPostAtom,
} from "@/atoms/posts";
import { saveItemAtom, unsaveItemAtom } from "@/atoms/saved";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { SaveMenuItem } from "@/components/shared/SaveMenuItem";
import { Button } from "@/components/ui/button";
import { Menu, MenuContent, MenuGroup, MenuItem, MenuSeparator, MenuTrigger } from "@/components/ui/menu";
import { toast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { showApiError } from "@/lib/errors";
import { useT } from "@/lib/i18n/locale";
import { useAtomSet, useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";
import type { Post } from "@openworks/backend/api";
import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";

interface PostActionsMenuProps {
  readonly post: Post;
  readonly onEdit?: () => void;
  readonly onDeleted?: () => void;
}

function HideMenuItem({ postId }: { readonly postId: string }) {
  const [t] = useT();
  const result = useAtomValue(hiddenEntryQuery(postId));
  const isHidden = AsyncResult.isSuccess(result) && result.value.length > 0;

  return (
    <MenuItem value={isHidden ? "unhide" : "hide"}>{isHidden ? t.post.unhideAction : t.post.hideAction}</MenuItem>
  );
}

/**
 * Mobile / Tablet / Desktop / Ultra-wide (all identical -- no responsive breakpoints):
 *
 * [...] -> dropdown menu:
 * +--------------------+
 * | Save / Unsave      |
 * | Hide / Unhide      |
 * | Report             |
 * |--------------------|  (author only)
 * | Edit               |
 * | Delete             |
 * |--------------------|  (space post only)
 * | MOD ACTIONS        |
 * | Pin / Unpin        |
 * | Lock / Unlock      |
 * | Remove             |
 * +--------------------+
 *
 * 图标触发器（MoreHorizontal icon-xs），弹出 min-w-44 下拉菜单。
 * 所有断点下均为弹出式菜单，无响应式差异。
 * Save/Hide 状态由菜单打开时的单帖查询决定（MenuContent 懒挂载，
 * 不拉取全量收藏/隐藏列表）；取消收藏/取消隐藏按 postId 寻址。
 * 各区段根据作者身份 / spaceId 条件渲染。
 * 删除和举报打开确认/举报对话框。
 */
export function PostActionsMenu({ post, onEdit, onDeleted }: PostActionsMenuProps) {
  const [t] = useT();
  const { data: session } = authClient.useSession();
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const saveItem = useAtomSet(saveItemAtom, { mode: "promise" });
  const unsaveItem = useAtomSet(unsaveItemAtom, { mode: "promise" });
  const hidePost = useAtomSet(hidePostAtom, { mode: "promise" });
  const unhidePost = useAtomSet(unhidePostAtom, { mode: "promise" });
  const pinPost = useAtomSet(pinPostAtom, { mode: "promise" });
  const unpinPost = useAtomSet(unpinPostAtom, { mode: "promise" });
  const lockPost = useAtomSet(lockPostAtom, { mode: "promise" });
  const unlockPost = useAtomSet(unlockPostAtom, { mode: "promise" });
  const removePost = useAtomSet(removePostAtom, { mode: "promise" });
  const deletePost = useAtomSet(deletePostAtom, { mode: "promise" });

  const isAuthor = session?.user.id === post.authorId;
  const postKeys = [Keys.posts, Keys.post(post.id)];

  async function run(action: () => Promise<unknown>, successMessage?: string) {
    try {
      await action();
      if (successMessage !== undefined) {
        toast.success({ title: successMessage });
      }
    } catch (error) {
      showApiError(t.errors, error);
    }
  }

  function handleSelect({ value }: { readonly value: string }) {
    switch (value) {
      case "save":
        return run(() => saveItem({ payload: { postId: post.id }, reactivityKeys: [Keys.saved] }), t.post.saved);
      case "unsave":
        return run(
          () => unsaveItem({ query: { postId: post.id }, reactivityKeys: [Keys.saved] }),
          t.post.unsaved,
        );
      case "hide":
        return run(
          () => hidePost({ payload: { postId: post.id }, reactivityKeys: [Keys.hidden, Keys.posts] }),
          t.post.hiddenToast,
        );
      case "unhide":
        return run(() => unhidePost({ query: { postId: post.id }, reactivityKeys: [Keys.hidden, Keys.posts] }));
      case "report":
        setReportOpen(true);
        return;
      case "edit":
        onEdit?.();
        return;
      case "delete":
        setDeleteOpen(true);
        return;
      case "pin":
        return run(() => pinPost({ params: { id: post.id }, reactivityKeys: postKeys }));
      case "unpin":
        return run(() => unpinPost({ params: { id: post.id }, reactivityKeys: postKeys }));
      case "lock":
        return run(() => lockPost({ params: { id: post.id }, reactivityKeys: postKeys }));
      case "unlock":
        return run(() => unlockPost({ params: { id: post.id }, reactivityKeys: postKeys }));
      case "remove":
        return run(() => removePost({ params: { id: post.id }, payload: {}, reactivityKeys: postKeys }));
      default:
        return;
    }
  }

  return (
    <>
      <Menu onSelect={handleSelect}>
        <MenuTrigger asChild>
          <Button aria-label={t.common.actions} size="icon-xs" variant="ghost">
            <MoreHorizontalIcon />
          </Button>
        </MenuTrigger>
        <MenuContent className="min-w-44">
          <SaveMenuItem postId={post.id} />
          <HideMenuItem postId={post.id} />
          <MenuItem value="report">{t.post.reportAction}</MenuItem>
          {isAuthor && (
            <>
              <MenuSeparator />
              {onEdit && <MenuItem value="edit">{t.common.edit}</MenuItem>}
              <MenuItem className="text-destructive" value="delete">
                {t.common.delete}
              </MenuItem>
            </>
          )}
          {post.spaceId !== null && (
            <>
              <MenuSeparator />
              <MenuGroup heading={t.post.modSection}>
                <MenuItem value={post.pinned ? "unpin" : "pin"}>
                  {post.pinned ? t.post.unpinAction : t.post.pinAction}
                </MenuItem>
                <MenuItem value={post.locked ? "unlock" : "lock"}>
                  {post.locked ? t.post.unlockAction : t.post.lockAction}
                </MenuItem>
                <MenuItem value="remove">{t.post.removeActionMod}</MenuItem>
              </MenuGroup>
            </>
          )}
        </MenuContent>
      </Menu>

      <ReportDialog onOpenChange={setReportOpen} open={reportOpen} postId={post.id} />
      <ConfirmDialog
        confirmLabel={t.common.delete}
        description={t.post.deleteConfirmBody}
        destructive
        onConfirm={() => deletePost({ params: { id: post.id }, reactivityKeys: postKeys }).then(() => onDeleted?.())}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        title={t.post.deleteConfirmTitle}
      />
    </>
  );
}
