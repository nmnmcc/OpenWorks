import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    sessions: r.many.sessions(),
    accounts: r.many.accounts(),
    groupMembers: r.many.groupMembers(),
    groupInvitations: r.many.groupInvitations({
      from: r.users.id,
      to: r.groupInvitations.invitedById,
    }),
    posts: r.many.posts({
      from: r.users.id,
      to: r.posts.authorId,
    }),
    comments: r.many.comments({
      from: r.users.id,
      to: r.comments.authorId,
    }),
    votes: r.many.votes(),
    bans: r.many.groupBans({
      from: r.users.id,
      to: r.groupBans.userId,
    }),
    bansIssued: r.many.groupBans({
      from: r.users.id,
      to: r.groupBans.bannedById,
    }),
    mutes: r.many.groupMutes({
      from: r.users.id,
      to: r.groupMutes.userId,
    }),
    mutesIssued: r.many.groupMutes({
      from: r.users.id,
      to: r.groupMutes.mutedById,
    }),
    userFlairs: r.many.userFlairs(),
    savedItems: r.many.savedItems(),
    hiddenPosts: r.many.hiddenPosts(),
    reports: r.many.reports({
      from: r.users.id,
      to: r.reports.reporterId,
    }),
    sentMessages: r.many.messages({
      from: r.users.id,
      to: r.messages.senderId,
    }),
    receivedMessages: r.many.messages({
      from: r.users.id,
      to: r.messages.recipientId,
    }),
    notifications: r.many.notifications(),
    pollVotes: r.many.pollVotes(),
  },
  sessions: {
    user: r.one.users({
      from: r.sessions.userId,
      to: r.users.id,
    }),
  },
  accounts: {
    user: r.one.users({
      from: r.accounts.userId,
      to: r.users.id,
    }),
  },
  groups: {
    roles: r.many.roles(),
    members: r.many.groupMembers(),
    invitations: r.many.groupInvitations(),
    posts: r.many.posts(),
    comments: r.many.comments(),
    bans: r.many.groupBans(),
    mutes: r.many.groupMutes(),
    postFlairs: r.many.postFlairs(),
    userFlairs: r.many.userFlairs(),
    reports: r.many.reports(),
    rules: r.many.groupRules(),
    modLog: r.many.modLog(),
    wikiPages: r.many.wikiPages(),
  },
  roles: {
    group: r.one.groups({
      from: r.roles.groupId,
      to: r.groups.id,
    }),
    rolePermissions: r.many.rolePermissions(),
    members: r.many.groupMembers(),
  },
  permissions: {
    rolePermissions: r.many.rolePermissions(),
  },
  rolePermissions: {
    role: r.one.roles({
      from: r.rolePermissions.roleId,
      to: r.roles.id,
    }),
    permission: r.one.permissions({
      from: r.rolePermissions.permissionId,
      to: r.permissions.id,
    }),
  },
  groupMembers: {
    group: r.one.groups({
      from: r.groupMembers.groupId,
      to: r.groups.id,
    }),
    user: r.one.users({
      from: r.groupMembers.userId,
      to: r.users.id,
    }),
    role: r.one.roles({
      from: r.groupMembers.roleId,
      to: r.roles.id,
    }),
  },
  groupInvitations: {
    group: r.one.groups({
      from: r.groupInvitations.groupId,
      to: r.groups.id,
    }),
    role: r.one.roles({
      from: r.groupInvitations.roleId,
      to: r.roles.id,
    }),
    invitedBy: r.one.users({
      from: r.groupInvitations.invitedById,
      to: r.users.id,
    }),
  },
  groupBans: {
    group: r.one.groups({
      from: r.groupBans.groupId,
      to: r.groups.id,
    }),
    user: r.one.users({
      from: r.groupBans.userId,
      to: r.users.id,
    }),
    bannedBy: r.one.users({
      from: r.groupBans.bannedById,
      to: r.users.id,
    }),
  },
  groupMutes: {
    group: r.one.groups({
      from: r.groupMutes.groupId,
      to: r.groups.id,
    }),
    user: r.one.users({
      from: r.groupMutes.userId,
      to: r.users.id,
    }),
    mutedBy: r.one.users({
      from: r.groupMutes.mutedById,
      to: r.users.id,
    }),
  },
  postFlairs: {
    group: r.one.groups({
      from: r.postFlairs.groupId,
      to: r.groups.id,
    }),
    posts: r.many.posts(),
  },
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
    group: r.one.groups({
      from: r.posts.groupId,
      to: r.groups.id,
    }),
    flair: r.one.postFlairs({
      from: r.posts.flairId,
      to: r.postFlairs.id,
    }),
    removedBy: r.one.users({
      from: r.posts.removedById,
      to: r.users.id,
    }),
    comments: r.many.comments(),
    votes: r.many.votes(),
    savedItems: r.many.savedItems(),
    hiddenPosts: r.many.hiddenPosts(),
    reports: r.many.reports(),
    poll: r.one.polls({
      from: r.posts.id,
      to: r.polls.postId,
    }),
  },
  comments: {
    author: r.one.users({
      from: r.comments.authorId,
      to: r.users.id,
    }),
    post: r.one.posts({
      from: r.comments.postId,
      to: r.posts.id,
    }),
    parent: r.one.comments({
      from: r.comments.parentId,
      to: r.comments.id,
    }),
    group: r.one.groups({
      from: r.comments.groupId,
      to: r.groups.id,
    }),
    removedBy: r.one.users({
      from: r.comments.removedById,
      to: r.users.id,
    }),
    children: r.many.comments({
      from: r.comments.id,
      to: r.comments.parentId,
    }),
    votes: r.many.votes(),
    savedItems: r.many.savedItems(),
    reports: r.many.reports(),
  },
  votes: {
    user: r.one.users({
      from: r.votes.userId,
      to: r.users.id,
    }),
    post: r.one.posts({
      from: r.votes.postId,
      to: r.posts.id,
    }),
    comment: r.one.comments({
      from: r.votes.commentId,
      to: r.comments.id,
    }),
  },
  userFlairs: {
    group: r.one.groups({
      from: r.userFlairs.groupId,
      to: r.groups.id,
    }),
    user: r.one.users({
      from: r.userFlairs.userId,
      to: r.users.id,
    }),
  },
  savedItems: {
    user: r.one.users({
      from: r.savedItems.userId,
      to: r.users.id,
    }),
    post: r.one.posts({
      from: r.savedItems.postId,
      to: r.posts.id,
    }),
    comment: r.one.comments({
      from: r.savedItems.commentId,
      to: r.comments.id,
    }),
  },
  hiddenPosts: {
    user: r.one.users({
      from: r.hiddenPosts.userId,
      to: r.users.id,
    }),
    post: r.one.posts({
      from: r.hiddenPosts.postId,
      to: r.posts.id,
    }),
  },
  reports: {
    group: r.one.groups({
      from: r.reports.groupId,
      to: r.groups.id,
    }),
    reporter: r.one.users({
      from: r.reports.reporterId,
      to: r.users.id,
    }),
    post: r.one.posts({
      from: r.reports.postId,
      to: r.posts.id,
    }),
    comment: r.one.comments({
      from: r.reports.commentId,
      to: r.comments.id,
    }),
    resolvedBy: r.one.users({
      from: r.reports.resolvedById,
      to: r.users.id,
    }),
  },
  groupRules: {
    group: r.one.groups({
      from: r.groupRules.groupId,
      to: r.groups.id,
    }),
  },
  modLog: {
    group: r.one.groups({
      from: r.modLog.groupId,
      to: r.groups.id,
    }),
    moderator: r.one.users({
      from: r.modLog.moderatorId,
      to: r.users.id,
    }),
  },
  messages: {
    sender: r.one.users({
      from: r.messages.senderId,
      to: r.users.id,
    }),
    recipient: r.one.users({
      from: r.messages.recipientId,
      to: r.users.id,
    }),
  },
  notifications: {
    user: r.one.users({
      from: r.notifications.userId,
      to: r.users.id,
    }),
  },
  wikiPages: {
    group: r.one.groups({
      from: r.wikiPages.groupId,
      to: r.groups.id,
    }),
    lastEditedBy: r.one.users({
      from: r.wikiPages.lastEditedById,
      to: r.users.id,
    }),
    revisions: r.many.wikiRevisions(),
  },
  wikiRevisions: {
    page: r.one.wikiPages({
      from: r.wikiRevisions.pageId,
      to: r.wikiPages.id,
    }),
    editedBy: r.one.users({
      from: r.wikiRevisions.editedById,
      to: r.users.id,
    }),
  },
  polls: {
    post: r.one.posts({
      from: r.polls.postId,
      to: r.posts.id,
    }),
    options: r.many.pollOptions(),
    votes: r.many.pollVotes(),
  },
  pollOptions: {
    poll: r.one.polls({
      from: r.pollOptions.pollId,
      to: r.polls.id,
    }),
    votes: r.many.pollVotes(),
  },
  pollVotes: {
    poll: r.one.polls({
      from: r.pollVotes.pollId,
      to: r.polls.id,
    }),
    option: r.one.pollOptions({
      from: r.pollVotes.optionId,
      to: r.pollOptions.id,
    }),
    user: r.one.users({
      from: r.pollVotes.userId,
      to: r.users.id,
    }),
  },
  searchOutbox: {},
}));
