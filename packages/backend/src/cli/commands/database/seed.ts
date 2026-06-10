import { v7 } from "uuid";
import { Console, Effect } from "effect";
import { faker } from "@faker-js/faker";
import { hashPassword } from "better-auth/crypto";
import type { PortableTextBlock } from "../../../libraries/portable-text";
import type { Database } from "../../../services/database";
import * as schema from "../../../services/database/schema";

type Block = typeof PortableTextBlock.Type;
type Content = readonly [Block, ...Block[]];

const content = (text: string): Content => [{ _type: "block", children: [{ _type: "span", text }] }];

const makeUser = () => {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  return {
    id: v7(),
    name: `${firstName} ${lastName}`,
    email: faker.internet.email({ firstName, lastName }).toLowerCase(),
    emailVerified: true,
  };
};

const makeGroupRoles = (groupId: string) => ({
  admin: {
    id: v7(),
    name: "admin",
    description: "Full access",
    groupId,
    isDefault: false,
  },
  moderator: {
    id: v7(),
    name: "moderator",
    description: "Moderation access",
    groupId,
    isDefault: false,
  },
  member: {
    id: v7(),
    name: "member",
    description: "Standard member",
    groupId,
    isDefault: true,
  },
  viewer: {
    id: v7(),
    name: "viewer",
    description: "Read-only access",
    groupId,
    isDefault: false,
  },
});

export const makeSeedData = Effect.gen(function* () {
  faker.seed(42);
  const hashed = yield* Effect.tryPromise(() => hashPassword("password123"));

  const admin = makeUser();
  const alice = makeUser();
  const bob = makeUser();
  const carol = makeUser();
  const users = [admin, alice, bob, carol];

  const accounts = users.map((user) => ({
    id: v7(),
    accountId: user.id,
    providerId: "credential",
    userId: user.id,
    password: hashed,
  }));

  const engineering = {
    id: v7(),
    name: "Engineering",
    slug: "engineering",
    description: faker.company.catchPhrase(),
    visibility: "public",
  };
  const design = {
    id: v7(),
    name: "Design",
    slug: "design",
    description: faker.company.catchPhrase(),
    visibility: "public",
  };
  const secret = {
    id: v7(),
    name: "Secret Projects",
    slug: "secret-projects",
    description: faker.company.catchPhrase(),
    visibility: "private",
  };
  const groups = [engineering, design, secret];

  const eng = makeGroupRoles(engineering.id);
  const des = makeGroupRoles(design.id);
  const sec = makeGroupRoles(secret.id);
  const roles = [...Object.values(eng), ...Object.values(des), ...Object.values(sec)];

  const manageAll = { id: v7(), action: "manage", subject: "all", inverted: false };
  const managePost = { id: v7(), action: "manage", subject: "Post", inverted: false };
  const manageComment = { id: v7(), action: "manage", subject: "Comment", inverted: false };
  const manageGroupMember = {
    id: v7(),
    action: "manage",
    subject: "GroupMember",
    inverted: false,
  };
  const manageGroupBan = { id: v7(), action: "manage", subject: "GroupBan", inverted: false };
  const manageGroupMute = { id: v7(), action: "manage", subject: "GroupMute", inverted: false };
  const createPost = { id: v7(), action: "create", subject: "Post", inverted: false };
  const readPost = { id: v7(), action: "read", subject: "Post", inverted: false };
  const updateOwnPost = {
    id: v7(),
    action: "update",
    subject: "Post",
    conditions: { authorId: "${user.id}" },
    inverted: false,
  };
  const deleteOwnPost = {
    id: v7(),
    action: "delete",
    subject: "Post",
    conditions: { authorId: "${user.id}" },
    inverted: false,
  };
  const createComment = { id: v7(), action: "create", subject: "Comment", inverted: false };
  const readComment = { id: v7(), action: "read", subject: "Comment", inverted: false };
  const updateOwnComment = {
    id: v7(),
    action: "update",
    subject: "Comment",
    conditions: { authorId: "${user.id}" },
    inverted: false,
  };
  const deleteOwnComment = {
    id: v7(),
    action: "delete",
    subject: "Comment",
    conditions: { authorId: "${user.id}" },
    inverted: false,
  };
  const createVote = { id: v7(), action: "create", subject: "Vote", inverted: false };
  const readVote = { id: v7(), action: "read", subject: "Vote", inverted: false };
  const deleteOwnVote = {
    id: v7(),
    action: "delete",
    subject: "Vote",
    conditions: { userId: "${user.id}" },
    inverted: false,
  };
  const readGroup = { id: v7(), action: "read", subject: "Group", inverted: false };
  const updateGroup = { id: v7(), action: "update", subject: "Group", inverted: false };
  const readGroupMember = { id: v7(), action: "read", subject: "GroupMember", inverted: false };
  const readGroupBan = { id: v7(), action: "read", subject: "GroupBan", inverted: false };

  const permissions = [
    manageAll,
    managePost,
    manageComment,
    manageGroupMember,
    manageGroupBan,
    manageGroupMute,
    createPost,
    readPost,
    updateOwnPost,
    deleteOwnPost,
    createComment,
    readComment,
    updateOwnComment,
    deleteOwnComment,
    createVote,
    readVote,
    deleteOwnVote,
    readGroup,
    updateGroup,
    readGroupMember,
    readGroupBan,
  ];

  const adminPerms = [manageAll];
  const modPerms = [
    managePost,
    manageComment,
    manageGroupMember,
    manageGroupBan,
    manageGroupMute,
    readGroup,
    updateGroup,
    readGroupMember,
    readGroupBan,
  ];
  const memberPerms = [
    createPost,
    readPost,
    updateOwnPost,
    deleteOwnPost,
    createComment,
    readComment,
    updateOwnComment,
    deleteOwnComment,
    createVote,
    readVote,
    deleteOwnVote,
    readGroup,
    readGroupMember,
  ];
  const viewerPerms = [readPost, readComment, readVote, readGroup, readGroupMember];

  const mapPerms = (roleId: string, perms: { id: string }[]) => perms.map((p) => ({ roleId, permissionId: p.id }));

  const rolePermissions = [
    ...mapPerms(eng.admin.id, adminPerms),
    ...mapPerms(eng.moderator.id, modPerms),
    ...mapPerms(eng.member.id, memberPerms),
    ...mapPerms(eng.viewer.id, viewerPerms),
    ...mapPerms(des.admin.id, adminPerms),
    ...mapPerms(des.moderator.id, modPerms),
    ...mapPerms(des.member.id, memberPerms),
    ...mapPerms(des.viewer.id, viewerPerms),
    ...mapPerms(sec.admin.id, adminPerms),
    ...mapPerms(sec.moderator.id, modPerms),
    ...mapPerms(sec.member.id, memberPerms),
    ...mapPerms(sec.viewer.id, viewerPerms),
  ];

  const groupMembers = [
    { id: v7(), groupId: engineering.id, userId: admin.id, roleId: eng.admin.id },
    { id: v7(), groupId: design.id, userId: admin.id, roleId: des.member.id },
    { id: v7(), groupId: secret.id, userId: admin.id, roleId: sec.admin.id },
    { id: v7(), groupId: engineering.id, userId: alice.id, roleId: eng.member.id },
    { id: v7(), groupId: design.id, userId: alice.id, roleId: des.moderator.id },
    { id: v7(), groupId: design.id, userId: bob.id, roleId: des.admin.id },
    { id: v7(), groupId: engineering.id, userId: bob.id, roleId: eng.member.id },
    { id: v7(), groupId: secret.id, userId: carol.id, roleId: sec.member.id },
    { id: v7(), groupId: engineering.id, userId: carol.id, roleId: eng.viewer.id },
  ];

  const post1 = {
    id: v7(),
    title: faker.lorem.sentence(),
    content: content(faker.lorem.paragraph()),
    authorId: admin.id,
    groupId: engineering.id,
  };
  const post2 = {
    id: v7(),
    title: faker.lorem.sentence(),
    content: content(faker.lorem.paragraph()),
    authorId: bob.id,
    groupId: design.id,
  };
  const post3 = {
    id: v7(),
    title: faker.lorem.sentence(),
    content: content(faker.lorem.paragraph()),
    authorId: alice.id,
    groupId: engineering.id,
  };
  const post4 = {
    id: v7(),
    title: faker.lorem.sentence(),
    content: content(faker.lorem.paragraph()),
    authorId: carol.id,
    groupId: secret.id,
  };
  const posts = [post1, post2, post3, post4];

  const comments = [
    {
      id: v7(),
      content: content(faker.lorem.sentence()),
      authorId: alice.id,
      postId: post1.id,
      parentId: null,
      groupId: engineering.id,
    },
    {
      id: v7(),
      content: content(faker.lorem.sentence()),
      authorId: bob.id,
      postId: post1.id,
      parentId: null,
      groupId: engineering.id,
    },
    {
      id: v7(),
      content: content(faker.lorem.sentence()),
      authorId: admin.id,
      postId: post2.id,
      parentId: null,
      groupId: design.id,
    },
    {
      id: v7(),
      content: content(faker.lorem.sentence()),
      authorId: carol.id,
      postId: post4.id,
      parentId: null,
      groupId: secret.id,
    },
  ];

  const votes = [
    { id: v7(), userId: alice.id, postId: post1.id, commentId: null, value: 1 },
    { id: v7(), userId: bob.id, postId: post1.id, commentId: null, value: 1 },
    { id: v7(), userId: admin.id, postId: post2.id, commentId: null, value: -1 },
    { id: v7(), userId: bob.id, postId: null, commentId: comments[0]!.id, value: 1 },
    { id: v7(), userId: carol.id, postId: post4.id, commentId: null, value: 1 },
  ];

  const groupBans = [
    {
      id: v7(),
      groupId: design.id,
      userId: carol.id,
      reason: "Spam",
      bannedById: bob.id,
    },
  ];

  return {
    users,
    accounts,
    groups,
    roles,
    permissions,
    rolePermissions,
    groupMembers,
    posts,
    comments,
    votes,
    groupBans,
  };
});

const deleteAllTables = (database: typeof Database.Service) =>
  Effect.gen(function* () {
    yield* database.delete(schema.searchOutbox);
    yield* database.delete(schema.votes);
    yield* database.delete(schema.comments);
    yield* database.delete(schema.posts);
    yield* database.delete(schema.groupBans);
    yield* database.delete(schema.groupMutes);
    yield* database.delete(schema.groupInvitations);
    yield* database.delete(schema.groupMembers);
    yield* database.delete(schema.rolePermissions);
    yield* database.delete(schema.permissions);
    yield* database.delete(schema.roles);
    yield* database.delete(schema.groups);
    yield* database.delete(schema.accounts);
    yield* database.delete(schema.sessions);
    yield* database.delete(schema.verifications);
    yield* database.delete(schema.users);
    yield* Console.log("Cleared all tables");
  });

export const runSeed = (database: typeof Database.Service, clean: boolean) =>
  Effect.gen(function* () {
    if (clean) {
      yield* deleteAllTables(database);
    }

    const data = yield* makeSeedData;

    yield* database.insert(schema.users).values(data.users);
    yield* database.insert(schema.accounts).values(data.accounts);
    yield* database.insert(schema.groups).values(data.groups);
    yield* database.insert(schema.roles).values(data.roles);
    yield* database.insert(schema.permissions).values(data.permissions);
    yield* database.insert(schema.rolePermissions).values(data.rolePermissions);
    yield* database.insert(schema.groupMembers).values(data.groupMembers);
    yield* database.insert(schema.posts).values(data.posts);
    yield* database.insert(schema.comments).values(data.comments);
    yield* database.insert(schema.votes).values(data.votes);
    yield* database.insert(schema.groupBans).values(data.groupBans);

    yield* Console.log(
      `Seeded: ${data.users.length} users, ${data.groups.length} groups, ${data.roles.length} roles, ${data.permissions.length} permissions, ${data.groupMembers.length} members, ${data.posts.length} posts, ${data.comments.length} comments, ${data.votes.length} votes, ${data.groupBans.length} bans`,
    );
  });
