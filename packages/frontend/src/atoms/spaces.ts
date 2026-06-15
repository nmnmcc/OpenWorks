import { Keys } from "./keys";
import { PAGE_SIZE } from "./posts";
import { ApiClient } from "./runtime";

export const spaceSearchQuery = (q: string, offset = 0) =>
  ApiClient.query("spaces", "search", {
    query: { q, limit: PAGE_SIZE, offset },
  });

export const spacesPageQuery = (offset: number) =>
  ApiClient.query("spaces", "list", {
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.spaces],
  });

export const joinedSpacesQuery = ApiClient.query("spaces", "list", {
  query: { joined: "true", limit: PAGE_SIZE },
  reactivityKeys: [Keys.spaces],
});

export const spaceQuery = (id: string) =>
  ApiClient.query("spaces", "getById", {
    params: { id },
    reactivityKeys: [Keys.space(id)],
    timeToLive: "5 minutes",
  });

export const membershipQuery = (spaceId: string) =>
  ApiClient.query("spaces", "getMembership", {
    params: { id: spaceId },
    reactivityKeys: [Keys.members(spaceId)],
  });

export const membersPageQuery = (spaceId: string, offset: number) =>
  ApiClient.query("spaces", "listMembers", {
    params: { id: spaceId },
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.members(spaceId)],
  });

export const bansPageQuery = (spaceId: string, offset: number) =>
  ApiClient.query("spaces", "listBans", {
    params: { id: spaceId },
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.bans(spaceId)],
  });

export const mutesPageQuery = (spaceId: string, offset: number) =>
  ApiClient.query("spaces", "listMutes", {
    params: { id: spaceId },
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.mutes(spaceId)],
  });

export const invitationsPageQuery = (spaceId: string, offset: number) =>
  ApiClient.query("spaces", "listInvitations", {
    params: { id: spaceId },
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.invitations(spaceId)],
  });

export const spaceWorksPageQuery = (spaceId: string, offset: number) =>
  ApiClient.query("spaces", "listWorks", {
    params: { id: spaceId },
    query: { limit: PAGE_SIZE, offset },
    reactivityKeys: [Keys.spaceWorks(spaceId)],
  });

export const spaceWorksPreviewQuery = (spaceId: string) =>
  ApiClient.query("spaces", "listWorks", {
    params: { id: spaceId },
    query: { limit: 5 },
    reactivityKeys: [Keys.spaceWorks(spaceId)],
  });

export const createSpaceAtom = ApiClient.mutation("spaces", "create");
export const updateSpaceAtom = ApiClient.mutation("spaces", "update");
export const deleteSpaceAtom = ApiClient.mutation("spaces", "delete");
export const joinSpaceAtom = ApiClient.mutation("spaces", "join");
export const leaveSpaceAtom = ApiClient.mutation("spaces", "leave");
export const removeMemberAtom = ApiClient.mutation("spaces", "removeMember");
export const banUserAtom = ApiClient.mutation("spaces", "ban");
export const unbanUserAtom = ApiClient.mutation("spaces", "unban");
export const muteUserAtom = ApiClient.mutation("spaces", "mute");
export const unmuteUserAtom = ApiClient.mutation("spaces", "unmute");
export const createInvitationAtom = ApiClient.mutation("spaces", "createInvitation");
export const revokeInvitationAtom = ApiClient.mutation("spaces", "revokeInvitation");
export const acceptInvitationAtom = ApiClient.mutation("spaces", "acceptInvitation");
export const addSpaceWorkAtom = ApiClient.mutation("spaces", "addWork");
export const removeSpaceWorkAtom = ApiClient.mutation("spaces", "removeWork");
