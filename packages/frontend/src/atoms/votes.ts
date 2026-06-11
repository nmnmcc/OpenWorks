import { ApiClient } from "./runtime";

export const castVoteAtom = ApiClient.mutation("votes", "cast");
export const removeVoteAtom = ApiClient.mutation("votes", "remove");
