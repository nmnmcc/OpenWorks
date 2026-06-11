import { Keys } from "./keys";
import { ApiClient } from "./runtime";

export const rulesQuery = (spaceId: string) =>
  ApiClient.query("rules", "list", {
    query: { spaceId },
    reactivityKeys: [Keys.rules(spaceId)],
  });

export const createRuleAtom = ApiClient.mutation("rules", "create");
export const updateRuleAtom = ApiClient.mutation("rules", "update");
export const deleteRuleAtom = ApiClient.mutation("rules", "delete");
