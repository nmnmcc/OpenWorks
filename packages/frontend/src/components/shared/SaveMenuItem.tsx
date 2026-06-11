"use client";

import { savedEntryQuery, type SavedTarget } from "@/atoms/saved";
import { MenuItem } from "@/components/ui/menu";
import { useT } from "@/lib/i18n/locale";
import { useAtomValue } from "@effect/atom-react";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";

/**
 * 帖子/评论操作菜单中的"收藏/取消收藏"项。挂载时按目标（postId 或
 * commentId）查询单条收藏状态（limit 1），决定显示 Save 还是 Unsave；
 * 选中行为由父级 Menu 的 onSelect 以 "save"/"unsave" 值处理。
 * 须置于懒挂载的 MenuContent 内，使查询仅在菜单打开时发起。
 */
export function SaveMenuItem(target: SavedTarget) {
  const [t] = useT();
  const result = useAtomValue(savedEntryQuery(target));
  const isSaved = AsyncResult.isSuccess(result) && result.value.length > 0;

  return <MenuItem value={isSaved ? "unsave" : "save"}>{isSaved ? t.post.unsaveAction : t.post.saveAction}</MenuItem>;
}
