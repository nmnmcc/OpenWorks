import { defineRelations } from "drizzle-orm";

import * as schema from "./schema/all";

export const relations = defineRelations(schema, (r) => ({
  users: {
    sessions: r.many.sessions(),
    accounts: r.many.accounts(),
    spaceMembers: r.many.spaceMembers(),
    spaceInvitations: r.many.spaceInvitations({
      from: r.users.id,
      to: r.spaceInvitations.invitedById,
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
    bans: r.many.spaceBans({
      from: r.users.id,
      to: r.spaceBans.userId,
    }),
    bansIssued: r.many.spaceBans({
      from: r.users.id,
      to: r.spaceBans.bannedById,
    }),
    mutes: r.many.spaceMutes({
      from: r.users.id,
      to: r.spaceMutes.userId,
    }),
    mutesIssued: r.many.spaceMutes({
      from: r.users.id,
      to: r.spaceMutes.mutedById,
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
    createdWorks: r.many.works({
      from: r.users.id,
      to: r.works.createdById,
    }),
    workRatings: r.many.workRatings(),
    libraryItems: r.many.libraryItems(),
    workTagApplications: r.many.workTagApplications(),
    shelves: r.many.shelves({
      from: r.users.id,
      to: r.shelves.ownerId,
    }),
    chapterProgress: r.many.chapterProgress(),
    createdCreators: r.many.creators({
      from: r.users.id,
      to: r.creators.createdById,
    }),
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
  spaces: {
    roles: r.many.roles(),
    members: r.many.spaceMembers(),
    invitations: r.many.spaceInvitations(),
    posts: r.many.posts(),
    comments: r.many.comments(),
    bans: r.many.spaceBans(),
    mutes: r.many.spaceMutes(),
    postFlairs: r.many.postFlairs(),
    userFlairs: r.many.userFlairs(),
    reports: r.many.reports(),
    rules: r.many.spaceRules(),
    modLog: r.many.modLog(),
    wikiPages: r.many.wikiPages(),
  },
  roles: {
    space: r.one.spaces({
      from: r.roles.spaceId,
      to: r.spaces.id,
    }),
    rolePermissions: r.many.rolePermissions(),
    members: r.many.spaceMembers(),
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
  spaceMembers: {
    space: r.one.spaces({
      from: r.spaceMembers.spaceId,
      to: r.spaces.id,
    }),
    user: r.one.users({
      from: r.spaceMembers.userId,
      to: r.users.id,
    }),
    role: r.one.roles({
      from: r.spaceMembers.roleId,
      to: r.roles.id,
    }),
  },
  spaceInvitations: {
    space: r.one.spaces({
      from: r.spaceInvitations.spaceId,
      to: r.spaces.id,
    }),
    role: r.one.roles({
      from: r.spaceInvitations.roleId,
      to: r.roles.id,
    }),
    invitedBy: r.one.users({
      from: r.spaceInvitations.invitedById,
      to: r.users.id,
    }),
  },
  spaceBans: {
    space: r.one.spaces({
      from: r.spaceBans.spaceId,
      to: r.spaces.id,
    }),
    user: r.one.users({
      from: r.spaceBans.userId,
      to: r.users.id,
    }),
    bannedBy: r.one.users({
      from: r.spaceBans.bannedById,
      to: r.users.id,
    }),
  },
  spaceMutes: {
    space: r.one.spaces({
      from: r.spaceMutes.spaceId,
      to: r.spaces.id,
    }),
    user: r.one.users({
      from: r.spaceMutes.userId,
      to: r.users.id,
    }),
    mutedBy: r.one.users({
      from: r.spaceMutes.mutedById,
      to: r.users.id,
    }),
  },
  postFlairs: {
    space: r.one.spaces({
      from: r.postFlairs.spaceId,
      to: r.spaces.id,
    }),
    posts: r.many.posts(),
  },
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
    }),
    space: r.one.spaces({
      from: r.posts.spaceId,
      to: r.spaces.id,
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
    work: r.one.works({
      from: r.posts.workId,
      to: r.works.id,
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
    space: r.one.spaces({
      from: r.comments.spaceId,
      to: r.spaces.id,
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
    space: r.one.spaces({
      from: r.userFlairs.spaceId,
      to: r.spaces.id,
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
    space: r.one.spaces({
      from: r.reports.spaceId,
      to: r.spaces.id,
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
  spaceRules: {
    space: r.one.spaces({
      from: r.spaceRules.spaceId,
      to: r.spaces.id,
    }),
  },
  modLog: {
    space: r.one.spaces({
      from: r.modLog.spaceId,
      to: r.spaces.id,
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
    space: r.one.spaces({
      from: r.wikiPages.spaceId,
      to: r.spaces.id,
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
  works: {
    createdBy: r.one.users({
      from: r.works.createdById,
      to: r.users.id,
    }),
    targetWork: r.one.works({
      from: r.works.targetWorkId,
      to: r.works.id,
    }),
    variants: r.many.works({
      from: r.works.id,
      to: r.works.targetWorkId,
    }),
    revisions: r.many.workRevisions(),
    credits: r.many.workCredits(),
    tagApplications: r.many.workTagApplications(),
    aliases: r.many.workAliases(),
    ratings: r.many.workRatings(),
    chapters: r.many.workChapters(),
    libraryItems: r.many.libraryItems(),
    systemRequirements: r.many.workSystemRequirements(),
    shelfItems: r.many.shelfItems(),
    posts: r.many.posts(),
  },
  workRevisions: {
    work: r.one.works({
      from: r.workRevisions.workId,
      to: r.works.id,
    }),
    editedBy: r.one.users({
      from: r.workRevisions.editedById,
      to: r.users.id,
    }),
  },
  creators: {
    createdBy: r.one.users({
      from: r.creators.createdById,
      to: r.users.id,
    }),
    revisions: r.many.creatorRevisions(),
    credits: r.many.workCredits(),
  },
  creatorRevisions: {
    creator: r.one.creators({
      from: r.creatorRevisions.creatorId,
      to: r.creators.id,
    }),
    editedBy: r.one.users({
      from: r.creatorRevisions.editedById,
      to: r.users.id,
    }),
  },
  workCredits: {
    work: r.one.works({
      from: r.workCredits.workId,
      to: r.works.id,
    }),
    creator: r.one.creators({
      from: r.workCredits.creatorId,
      to: r.creators.id,
    }),
  },
  workTags: {
    applications: r.many.workTagApplications(),
  },
  workTagApplications: {
    work: r.one.works({
      from: r.workTagApplications.workId,
      to: r.works.id,
    }),
    tag: r.one.workTags({
      from: r.workTagApplications.tagId,
      to: r.workTags.id,
    }),
    user: r.one.users({
      from: r.workTagApplications.userId,
      to: r.users.id,
    }),
  },
  workAliases: {
    work: r.one.works({
      from: r.workAliases.workId,
      to: r.works.id,
    }),
    createdBy: r.one.users({
      from: r.workAliases.createdById,
      to: r.users.id,
    }),
  },
  workRatings: {
    work: r.one.works({
      from: r.workRatings.workId,
      to: r.works.id,
    }),
    user: r.one.users({
      from: r.workRatings.userId,
      to: r.users.id,
    }),
  },
  workChapters: {
    work: r.one.works({
      from: r.workChapters.workId,
      to: r.works.id,
    }),
    progress: r.many.chapterProgress(),
  },
  chapterProgress: {
    user: r.one.users({
      from: r.chapterProgress.userId,
      to: r.users.id,
    }),
    chapter: r.one.workChapters({
      from: r.chapterProgress.chapterId,
      to: r.workChapters.id,
    }),
  },
  libraryItems: {
    user: r.one.users({
      from: r.libraryItems.userId,
      to: r.users.id,
    }),
    work: r.one.works({
      from: r.libraryItems.workId,
      to: r.works.id,
    }),
    lastReadChapter: r.one.workChapters({
      from: r.libraryItems.lastReadChapterId,
      to: r.workChapters.id,
    }),
  },
  shelves: {
    owner: r.one.users({
      from: r.shelves.ownerId,
      to: r.users.id,
    }),
    items: r.many.shelfItems(),
  },
  shelfItems: {
    shelf: r.one.shelves({
      from: r.shelfItems.shelfId,
      to: r.shelves.id,
    }),
    work: r.one.works({
      from: r.shelfItems.workId,
      to: r.works.id,
    }),
  },
  workSystemRequirements: {
    work: r.one.works({
      from: r.workSystemRequirements.workId,
      to: r.works.id,
    }),
  },
}));
