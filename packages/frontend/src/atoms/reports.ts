import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export interface ReportsPageArgs {
  readonly spaceId: string;
  readonly status?: "pending" | "resolved" | "dismissed";
  readonly offset: number;
}

export const reportsPageQuery = (args: ReportsPageArgs) =>
  ApiClient.query("reports", "list", {
    query: { spaceId: args.spaceId, status: args.status, limit: PAGE_SIZE, offset: args.offset },
    reactivityKeys: [Keys.reports(args.spaceId)],
  });

export const createReportAtom = ApiClient.mutation("reports", "create");
export const resolveReportAtom = ApiClient.mutation("reports", "resolve");
