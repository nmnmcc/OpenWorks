import { faker } from "@faker-js/faker";
import { hashPassword } from "better-auth/crypto";
import { Console, Effect } from "effect";
import { v7 } from "uuid";

import type { PortableTextBlock } from "../../../libraries/portable-text";
import type { Database } from "../../../services/database";
import * as schema from "../../../services/database/schema/all";

type Block = typeof PortableTextBlock.Type;
type Content = readonly [Block, ...Block[]];

const content = (text: string): Content => [
  {
    _type: "block",
    _key: v7(),
    style: "normal",
    markDefs: [],
    children: [{ _type: "span", _key: v7(), text, marks: [] }],
  },
];

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

const makeSpaceRoles = (spaceId: string) => ({
  admin: {
    id: v7(),
    name: "admin",
    description: "Full access",
    spaceId,
    isDefault: false,
  },
  moderator: {
    id: v7(),
    name: "moderator",
    description: "Moderation access",
    spaceId,
    isDefault: false,
  },
  member: {
    id: v7(),
    name: "member",
    description: "Standard member",
    spaceId,
    isDefault: true,
  },
  viewer: {
    id: v7(),
    name: "viewer",
    description: "Read-only access",
    spaceId,
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
  const spaces = [engineering, design, secret];

  const eng = makeSpaceRoles(engineering.id);
  const des = makeSpaceRoles(design.id);
  const sec = makeSpaceRoles(secret.id);
  const roles = [...Object.values(eng), ...Object.values(des), ...Object.values(sec)];

  const manageAll = { id: v7(), action: "manage", subject: "all", inverted: false };
  const managePost = { id: v7(), action: "manage", subject: "Post", inverted: false };
  const manageComment = { id: v7(), action: "manage", subject: "Comment", inverted: false };
  const manageSpaceMember = {
    id: v7(),
    action: "manage",
    subject: "SpaceMember",
    inverted: false,
  };
  const manageSpaceBan = { id: v7(), action: "manage", subject: "SpaceBan", inverted: false };
  const manageSpaceMute = { id: v7(), action: "manage", subject: "SpaceMute", inverted: false };
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
  const readSpace = { id: v7(), action: "read", subject: "Space", inverted: false };
  const updateSpace = { id: v7(), action: "update", subject: "Space", inverted: false };
  const readSpaceMember = { id: v7(), action: "read", subject: "SpaceMember", inverted: false };
  const readSpaceBan = { id: v7(), action: "read", subject: "SpaceBan", inverted: false };

  const permissions = [
    manageAll,
    managePost,
    manageComment,
    manageSpaceMember,
    manageSpaceBan,
    manageSpaceMute,
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
    readSpace,
    updateSpace,
    readSpaceMember,
    readSpaceBan,
  ];

  const adminPerms = [manageAll];
  const modPerms = [
    managePost,
    manageComment,
    manageSpaceMember,
    manageSpaceBan,
    manageSpaceMute,
    readSpace,
    updateSpace,
    readSpaceMember,
    readSpaceBan,
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
    readSpace,
    readSpaceMember,
  ];
  const viewerPerms = [readPost, readComment, readVote, readSpace, readSpaceMember];

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

  const spaceMembers = [
    { id: v7(), spaceId: engineering.id, userId: admin.id, roleId: eng.admin.id },
    { id: v7(), spaceId: design.id, userId: admin.id, roleId: des.member.id },
    { id: v7(), spaceId: secret.id, userId: admin.id, roleId: sec.admin.id },
    { id: v7(), spaceId: engineering.id, userId: alice.id, roleId: eng.member.id },
    { id: v7(), spaceId: design.id, userId: alice.id, roleId: des.moderator.id },
    { id: v7(), spaceId: design.id, userId: bob.id, roleId: des.admin.id },
    { id: v7(), spaceId: engineering.id, userId: bob.id, roleId: eng.member.id },
    { id: v7(), spaceId: secret.id, userId: carol.id, roleId: sec.member.id },
    { id: v7(), spaceId: engineering.id, userId: carol.id, roleId: eng.viewer.id },
  ];

  const post1 = {
    id: v7(),
    title: faker.lorem.sentence(),
    content: content(faker.lorem.paragraph()),
    authorId: admin.id,
    spaceId: engineering.id,
  };
  const post2 = {
    id: v7(),
    title: faker.lorem.sentence(),
    content: content(faker.lorem.paragraph()),
    authorId: bob.id,
    spaceId: design.id,
  };
  const post3 = {
    id: v7(),
    title: faker.lorem.sentence(),
    content: content(faker.lorem.paragraph()),
    authorId: alice.id,
    spaceId: engineering.id,
  };
  const post4 = {
    id: v7(),
    title: faker.lorem.sentence(),
    content: content(faker.lorem.paragraph()),
    authorId: carol.id,
    spaceId: secret.id,
  };
  const posts = [post1, post2, post3, post4];

  const comments = [
    {
      id: v7(),
      content: content(faker.lorem.sentence()),
      authorId: alice.id,
      postId: post1.id,
      parentId: null,
      spaceId: engineering.id,
    },
    {
      id: v7(),
      content: content(faker.lorem.sentence()),
      authorId: bob.id,
      postId: post1.id,
      parentId: null,
      spaceId: engineering.id,
    },
    {
      id: v7(),
      content: content(faker.lorem.sentence()),
      authorId: admin.id,
      postId: post2.id,
      parentId: null,
      spaceId: design.id,
    },
    {
      id: v7(),
      content: content(faker.lorem.sentence()),
      authorId: carol.id,
      postId: post4.id,
      parentId: null,
      spaceId: secret.id,
    },
  ];

  const votes = [
    { id: v7(), userId: alice.id, postId: post1.id, commentId: null, value: 1 },
    { id: v7(), userId: bob.id, postId: post1.id, commentId: null, value: 1 },
    { id: v7(), userId: admin.id, postId: post2.id, commentId: null, value: -1 },
    { id: v7(), userId: bob.id, postId: null, commentId: comments[0]!.id, value: 1 },
    { id: v7(), userId: carol.id, postId: post4.id, commentId: null, value: 1 },
  ];

  const spaceBans = [
    {
      id: v7(),
      spaceId: design.id,
      userId: carol.id,
      reason: "Spam",
      bannedById: bob.id,
    },
  ];

  const creatorAuthor = {
    id: v7(),
    name: "Brandon Sanderson",
    kind: "person",
    bio: content("American author of epic fantasy and science fiction."),
    createdById: admin.id,
  };
  const creatorStudio = {
    id: v7(),
    name: "Valve Corporation",
    kind: "organization",
    bio: content("American video game developer and digital distribution company."),
    createdById: bob.id,
  };
  const creatorDirector = {
    id: v7(),
    name: "Christopher Nolan",
    kind: "person",
    bio: content("British-American filmmaker known for nonlinear narratives."),
    createdById: alice.id,
  };
  const creators = [creatorAuthor, creatorStudio, creatorDirector];

  const workBook = {
    id: v7(),
    type: "book",
    title: "The Way of Kings",
    originalTitle: null,
    description: content("The Way of Kings is an epic fantasy novel by Brandon Sanderson, the first in The Stormlight Archive series."),
    coverUrl: null,
    releaseDate: new Date("2010-08-31"),
    isbn: "9780765326355",
    pageCount: 1007,
    runtimeMinutes: null,
    seasonCount: null,
    episodeCount: null,
    platforms: null,
    website: null,
    nsfw: false,
    targetWorkId: null,
    createdById: admin.id,
    ratingCount: 3,
    ratingSum: 26,
    recommendedCount: 3,
    reviewCount: 1,
    libraryCount: 2,
  };
  const workBookVariant = {
    id: v7(),
    type: "book",
    title: "The Way of Kings (Hardcover)",
    originalTitle: null,
    description: content("Hardcover edition of The Way of Kings."),
    coverUrl: null,
    releaseDate: new Date("2010-08-31"),
    isbn: "9780765326362",
    pageCount: 1007,
    runtimeMinutes: null,
    seasonCount: null,
    episodeCount: null,
    platforms: null,
    website: null,
    nsfw: false,
    targetWorkId: workBook.id,
    createdById: admin.id,
    ratingCount: 0,
    ratingSum: 0,
    recommendedCount: 0,
    reviewCount: 0,
    libraryCount: 0,
  };
  const workGame = {
    id: v7(),
    type: "game",
    title: "Portal 2",
    originalTitle: null,
    description: content("Portal 2 is a first-person puzzle-platform game developed by Valve Corporation."),
    coverUrl: null,
    releaseDate: new Date("2011-04-19"),
    isbn: null,
    pageCount: null,
    runtimeMinutes: null,
    seasonCount: null,
    episodeCount: null,
    platforms: ["windows", "macos", "linux"],
    website: "https://www.thinkwithportals.com",
    nsfw: false,
    targetWorkId: null,
    createdById: bob.id,
    ratingCount: 2,
    ratingSum: 19,
    recommendedCount: 2,
    reviewCount: 0,
    libraryCount: 1,
  };
  const workMovie = {
    id: v7(),
    type: "movie",
    title: "Inception",
    originalTitle: null,
    description: content("A thief who steals corporate secrets through the use of dream-sharing technology."),
    coverUrl: null,
    releaseDate: new Date("2010-07-16"),
    isbn: null,
    pageCount: null,
    runtimeMinutes: 148,
    seasonCount: null,
    episodeCount: null,
    platforms: null,
    website: null,
    nsfw: false,
    targetWorkId: null,
    createdById: alice.id,
    ratingCount: 2,
    ratingSum: 18,
    recommendedCount: 2,
    reviewCount: 0,
    libraryCount: 1,
  };
  const worksData = [workBook, workBookVariant, workGame, workMovie];

  const chapter1 = {
    id: v7(),
    workId: workBook.id,
    title: "Prelude to the Stormlight Archive",
    position: 0,
    content: content("Kalak rounded a rocky spire and stumbled to a stop before the body of a dying thunderclast."),
  };
  const chapter2 = {
    id: v7(),
    workId: workBook.id,
    title: "Prologue: To Kill",
    position: 1,
    content: content("Szeth-son-son-Vallano, Truthless of Shinovar, wore white on the day he was to kill a king."),
  };
  const chapter3 = {
    id: v7(),
    workId: workBook.id,
    title: "Chapter 1: Stormblessed",
    position: 2,
    content: content("The crem that gave the Shattered Plains their name was not like the crem of the east."),
  };
  const workChapters = [chapter1, chapter2, chapter3];

  const workCredits = [
    { id: v7(), workId: workBook.id, creatorId: creatorAuthor.id, role: "author", characterName: null, position: 0 },
    { id: v7(), workId: workGame.id, creatorId: creatorStudio.id, role: "developer", characterName: null, position: 0 },
    { id: v7(), workId: workGame.id, creatorId: creatorStudio.id, role: "publisher", characterName: null, position: 1 },
    { id: v7(), workId: workMovie.id, creatorId: creatorDirector.id, role: "director", characterName: null, position: 0 },
    { id: v7(), workId: workMovie.id, creatorId: creatorDirector.id, role: "writer", characterName: null, position: 1 },
  ];

  const tagFantasy = { id: v7(), name: "fantasy" };
  const tagSciFi = { id: v7(), name: "science fiction" };
  const tagPuzzle = { id: v7(), name: "puzzle" };
  const workTags = [tagFantasy, tagSciFi, tagPuzzle];

  const workTagApplications = [
    { id: v7(), workId: workBook.id, tagId: tagFantasy.id, userId: admin.id },
    { id: v7(), workId: workBook.id, tagId: tagFantasy.id, userId: alice.id },
    { id: v7(), workId: workGame.id, tagId: tagPuzzle.id, userId: bob.id },
    { id: v7(), workId: workGame.id, tagId: tagSciFi.id, userId: bob.id },
    { id: v7(), workId: workMovie.id, tagId: tagSciFi.id, userId: alice.id },
  ];

  const workAliases = [
    { id: v7(), workId: workBook.id, value: "TWoK", kind: "abbreviation", createdById: admin.id },
    { id: v7(), workId: workBook.id, value: "Stormlight 1", kind: "common", createdById: alice.id },
    { id: v7(), workId: workGame.id, value: "P2", kind: "abbreviation", createdById: bob.id },
  ];

  const workRatings = [
    { id: v7(), workId: workBook.id, userId: admin.id, value: 9 },
    { id: v7(), workId: workBook.id, userId: alice.id, value: 8 },
    { id: v7(), workId: workBook.id, userId: bob.id, value: 9 },
    { id: v7(), workId: workGame.id, userId: bob.id, value: 10 },
    { id: v7(), workId: workGame.id, userId: carol.id, value: 9 },
    { id: v7(), workId: workMovie.id, userId: alice.id, value: 9 },
    { id: v7(), workId: workMovie.id, userId: carol.id, value: 9 },
  ];

  const chapterProgress = [
    { id: v7(), userId: admin.id, chapterId: chapter1.id },
    { id: v7(), userId: admin.id, chapterId: chapter2.id },
    { id: v7(), userId: alice.id, chapterId: chapter1.id },
  ];

  const libraryItems = [
    { id: v7(), userId: admin.id, workId: workBook.id, status: "completed", lastReadChapterId: chapter3.id },
    { id: v7(), userId: alice.id, workId: workBook.id, status: "active", lastReadChapterId: chapter1.id },
    { id: v7(), userId: bob.id, workId: workGame.id, status: "completed", lastReadChapterId: null },
    { id: v7(), userId: carol.id, workId: workMovie.id, status: "completed", lastReadChapterId: null },
  ];

  const shelfFavorites = {
    id: v7(),
    ownerId: admin.id,
    name: "Favorites",
    description: "My favorite works",
    isPublic: true,
    itemCount: 2,
  };
  const shelfPrivate = {
    id: v7(),
    ownerId: alice.id,
    name: "Wishlist",
    description: "Want to read/play/watch later",
    isPublic: false,
    itemCount: 1,
  };
  const shelves = [shelfFavorites, shelfPrivate];

  const shelfItems = [
    { id: v7(), shelfId: shelfFavorites.id, workId: workBook.id, note: "Best fantasy series" },
    { id: v7(), shelfId: shelfFavorites.id, workId: workMovie.id, note: null },
    { id: v7(), shelfId: shelfPrivate.id, workId: workGame.id, note: "Play when on sale" },
  ];

  const reviewPost = {
    id: v7(),
    title: "The Way of Kings is a masterpiece",
    type: "review",
    content: content("This book completely changed my expectations for epic fantasy. The world-building is unparalleled."),
    authorId: admin.id,
    spaceId: null,
    workId: workBook.id,
  };
  const reviewPosts = [reviewPost];

  const workExternalRefs = [
    { id: v7(), workId: workBook.id, source: "isbn", externalId: "9780765326355", url: null },
    { id: v7(), workId: workGame.id, source: "steam", externalId: "620", url: "https://store.steampowered.com/app/620" },
  ];

  const workSystemRequirements = [
    {
      id: v7(),
      workId: workGame.id,
      platform: "windows",
      tier: "minimum",
      os: "Windows 7 / Vista / XP",
      cpu: "3.0 GHz P4, Dual Core 2.0",
      memory: "2 GB RAM",
      graphics: "Video card must be 128 MB or more with support for Pixel Shader 2.0b",
      storage: "8 GB",
      notes: null,
    },
    {
      id: v7(),
      workId: workGame.id,
      platform: "windows",
      tier: "recommended",
      os: "Windows 7",
      cpu: "Intel Core 2 Duo 2.4 GHz",
      memory: "4 GB RAM",
      graphics: "NVIDIA GeForce GTX 560 or ATI Radeon HD 6XXX",
      storage: "8 GB",
      notes: null,
    },
  ];

  return {
    users,
    accounts,
    spaces,
    roles,
    permissions,
    rolePermissions,
    spaceMembers,
    posts,
    comments,
    votes,
    spaceBans,
    creators,
    works: worksData,
    workChapters,
    workCredits,
    workTags,
    workTagApplications,
    workAliases,
    workRatings,
    chapterProgress,
    libraryItems,
    shelves,
    shelfItems,
    reviewPosts,
    workExternalRefs,
    workSystemRequirements,
  };
});

const deleteAllTables = (database: typeof Database.Service) =>
  Effect.gen(function* () {
    yield* database.delete(schema.shelfItems);
    yield* database.delete(schema.shelves);
    yield* database.delete(schema.chapterProgress);
    yield* database.delete(schema.libraryItems);
    yield* database.delete(schema.workSystemRequirements);
    yield* database.delete(schema.workExternalRefs);
    yield* database.delete(schema.workRatings);
    yield* database.delete(schema.workTagApplications);
    yield* database.delete(schema.workTags);
    yield* database.delete(schema.workAliases);
    yield* database.delete(schema.workChapters);
    yield* database.delete(schema.workCredits);
    yield* database.delete(schema.creatorRevisions);
    yield* database.delete(schema.workRevisions);
    yield* database.delete(schema.votes);
    yield* database.delete(schema.comments);
    yield* database.delete(schema.posts);
    yield* database.delete(schema.works);
    yield* database.delete(schema.creators);
    yield* database.delete(schema.spaceBans);
    yield* database.delete(schema.spaceMutes);
    yield* database.delete(schema.spaceInvitations);
    yield* database.delete(schema.spaceMembers);
    yield* database.delete(schema.rolePermissions);
    yield* database.delete(schema.permissions);
    yield* database.delete(schema.roles);
    yield* database.delete(schema.spaces);
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
    yield* database.insert(schema.spaces).values(data.spaces);
    yield* database.insert(schema.roles).values(data.roles);
    yield* database.insert(schema.permissions).values(data.permissions);
    yield* database.insert(schema.rolePermissions).values(data.rolePermissions);
    yield* database.insert(schema.spaceMembers).values(data.spaceMembers);
    yield* database.insert(schema.creators).values(data.creators);
    yield* database.insert(schema.works).values(data.works);
    yield* database.insert(schema.workChapters).values(data.workChapters);
    yield* database.insert(schema.workCredits).values(data.workCredits);
    yield* database.insert(schema.workTags).values(data.workTags);
    yield* database.insert(schema.workTagApplications).values(data.workTagApplications);
    yield* database.insert(schema.workAliases).values(data.workAliases);
    yield* database.insert(schema.workRatings).values(data.workRatings);
    yield* database.insert(schema.chapterProgress).values(data.chapterProgress);
    yield* database.insert(schema.libraryItems).values(data.libraryItems);
    yield* database.insert(schema.shelves).values(data.shelves);
    yield* database.insert(schema.shelfItems).values(data.shelfItems);
    yield* database.insert(schema.posts).values(data.posts);
    yield* database.insert(schema.posts).values(data.reviewPosts);
    yield* database.insert(schema.comments).values(data.comments);
    yield* database.insert(schema.votes).values(data.votes);
    yield* database.insert(schema.spaceBans).values(data.spaceBans);
    yield* database.insert(schema.workExternalRefs).values(data.workExternalRefs);
    yield* database.insert(schema.workSystemRequirements).values(data.workSystemRequirements);

    yield* Console.log(
      `Seeded: ${data.users.length} users, ${data.spaces.length} spaces, ${data.posts.length + data.reviewPosts.length} posts (${data.reviewPosts.length} reviews), ${data.creators.length} creators, ${data.works.length} works, ${data.workChapters.length} chapters, ${data.shelves.length} shelves`,
    );
  });
