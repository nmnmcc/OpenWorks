import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const moderationLogPageQuery = (spaceId: string, offset: number) =>
  ApiClient.query("moderationLogs", "list", {
    query: { spaceId, limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.moderationLogs(spaceId)],
  });
