CREATE TABLE "post_flairs" (
	"id" uuid PRIMARY KEY,
	"space_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_flairs" (
	"id" uuid PRIMARY KEY,
	"space_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"text" text NOT NULL,
	"color" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_items" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"post_id" uuid,
	"comment_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hidden_posts" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"post_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY,
	"space_id" uuid NOT NULL,
	"reporter_id" uuid NOT NULL,
	"post_id" uuid,
	"comment_id" uuid,
	"reason" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"resolved_by_id" uuid,
	"resolution_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "space_rules" (
	"id" uuid PRIMARY KEY,
	"space_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mod_log" (
	"id" uuid PRIMARY KEY,
	"space_id" uuid NOT NULL,
	"moderator_id" uuid NOT NULL,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" uuid NOT NULL,
	"details" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY,
	"sender_id" uuid NOT NULL,
	"recipient_id" uuid NOT NULL,
	"subject" text NOT NULL,
	"body" jsonb NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"deleted_by_sender" boolean DEFAULT false NOT NULL,
	"deleted_by_recipient" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"body" text,
	"link_url" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_pages" (
	"id" uuid PRIMARY KEY,
	"space_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"last_edited_by_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wiki_revisions" (
	"id" uuid PRIMARY KEY,
	"page_id" uuid NOT NULL,
	"content" jsonb NOT NULL,
	"edited_by_id" uuid NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" uuid PRIMARY KEY,
	"poll_id" uuid NOT NULL,
	"text" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" uuid PRIMARY KEY,
	"poll_id" uuid NOT NULL,
	"option_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" uuid PRIMARY KEY,
	"post_id" uuid NOT NULL UNIQUE,
	"voting_ends_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_revisions" (
	"id" uuid PRIMARY KEY,
	"work_id" uuid NOT NULL,
	"edited_by_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "works" (
	"id" uuid PRIMARY KEY,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"original_title" text,
	"description" jsonb,
	"cover_url" text,
	"release_date" timestamp,
	"isbn" text,
	"page_count" integer,
	"runtime_minutes" integer,
	"season_count" integer,
	"episode_count" integer,
	"platforms" text[],
	"website" text,
	"nsfw" boolean DEFAULT false NOT NULL,
	"target_work_id" uuid,
	"created_by_id" uuid,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"rating_sum" integer DEFAULT 0 NOT NULL,
	"recommended_count" integer DEFAULT 0 NOT NULL,
	"review_count" integer DEFAULT 0 NOT NULL,
	"library_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creator_revisions" (
	"id" uuid PRIMARY KEY,
	"creator_id" uuid NOT NULL,
	"edited_by_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "creators" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"bio" jsonb,
	"image_url" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_credits" (
	"id" uuid PRIMARY KEY,
	"work_id" uuid NOT NULL,
	"creator_id" uuid NOT NULL,
	"role" text NOT NULL,
	"character_name" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_tag_applications" (
	"id" uuid PRIMARY KEY,
	"work_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_tags" (
	"id" uuid PRIMARY KEY,
	"name" text NOT NULL UNIQUE,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_aliases" (
	"id" uuid PRIMARY KEY,
	"work_id" uuid NOT NULL,
	"value" text NOT NULL,
	"kind" text NOT NULL,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_ratings" (
	"id" uuid PRIMARY KEY,
	"work_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chapter_progress" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"chapter_id" uuid NOT NULL,
	"completed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_chapters" (
	"id" uuid PRIMARY KEY,
	"work_id" uuid NOT NULL,
	"title" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"content" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "library_items" (
	"id" uuid PRIMARY KEY,
	"user_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"status" text NOT NULL,
	"last_read_chapter_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shelf_items" (
	"id" uuid PRIMARY KEY,
	"shelf_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shelves" (
	"id" uuid PRIMARY KEY,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT true NOT NULL,
	"item_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "work_system_requirements" (
	"id" uuid PRIMARY KEY,
	"work_id" uuid NOT NULL,
	"platform" text NOT NULL,
	"tier" text NOT NULL,
	"os" text,
	"cpu" text,
	"memory" text,
	"graphics" text,
	"storage" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "space_works" (
	"id" uuid PRIMARY KEY,
	"space_id" uuid NOT NULL,
	"work_id" uuid NOT NULL,
	"added_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "group_bans" RENAME TO "space_bans";--> statement-breakpoint
ALTER TABLE "group_invitations" RENAME TO "space_invitations";--> statement-breakpoint
ALTER TABLE "group_members" RENAME TO "space_members";--> statement-breakpoint
ALTER TABLE "group_mutes" RENAME TO "space_mutes";--> statement-breakpoint
ALTER TABLE "groups" RENAME TO "spaces";--> statement-breakpoint
ALTER TABLE "roles" DROP CONSTRAINT "roles_group_id_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "space_bans" DROP CONSTRAINT "group_bans_group_id_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "space_invitations" DROP CONSTRAINT "group_invitations_group_id_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "space_members" DROP CONSTRAINT "group_members_group_id_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "space_mutes" DROP CONSTRAINT "group_mutes_group_id_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_group_id_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_group_id_groups_id_fkey";--> statement-breakpoint
ALTER TABLE "accounts" DROP CONSTRAINT "accounts_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "sessions" DROP CONSTRAINT "sessions_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "space_bans" DROP CONSTRAINT "group_bans_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "space_bans" DROP CONSTRAINT "group_bans_banned_by_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "space_invitations" DROP CONSTRAINT "group_invitations_role_id_roles_id_fkey";--> statement-breakpoint
ALTER TABLE "space_invitations" DROP CONSTRAINT "group_invitations_invited_by_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "space_members" DROP CONSTRAINT "group_members_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "space_members" DROP CONSTRAINT "group_members_role_id_roles_id_fkey";--> statement-breakpoint
ALTER TABLE "space_mutes" DROP CONSTRAINT "group_mutes_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "space_mutes" DROP CONSTRAINT "group_mutes_muted_by_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_author_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_post_id_posts_id_fkey";--> statement-breakpoint
ALTER TABLE "comments" DROP CONSTRAINT "comments_parent_id_comments_id_fkey";--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "votes_user_id_users_id_fkey";--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "votes_post_id_posts_id_fkey";--> statement-breakpoint
ALTER TABLE "votes" DROP CONSTRAINT "votes_comment_id_comments_id_fkey";--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_role_id_roles_id_fkey";--> statement-breakpoint
ALTER TABLE "role_permissions" DROP CONSTRAINT "role_permissions_permission_id_permissions_id_fkey";--> statement-breakpoint
ALTER TABLE "roles" RENAME COLUMN "group_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "space_id" SET DATA TYPE uuid USING "space_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_bans" RENAME COLUMN "group_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "space_bans" ALTER COLUMN "space_id" SET DATA TYPE uuid USING "space_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_invitations" RENAME COLUMN "group_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "space_invitations" ALTER COLUMN "space_id" SET DATA TYPE uuid USING "space_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_members" RENAME COLUMN "group_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "space_members" ALTER COLUMN "space_id" SET DATA TYPE uuid USING "space_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_mutes" RENAME COLUMN "group_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "space_mutes" ALTER COLUMN "space_id" SET DATA TYPE uuid USING "space_id"::uuid;--> statement-breakpoint
ALTER TABLE "posts" RENAME COLUMN "group_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "space_id" SET DATA TYPE uuid USING "space_id"::uuid;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "space_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" RENAME COLUMN "group_id" TO "space_id";--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "space_id" SET DATA TYPE uuid USING "space_id"::uuid;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "space_id" DROP NOT NULL;--> statement-breakpoint
DROP INDEX "roles_groupId_idx";--> statement-breakpoint
DROP INDEX "group_bans_groupId_userId_idx";--> statement-breakpoint
DROP INDEX "group_bans_userId_idx";--> statement-breakpoint
DROP INDEX "group_invitations_groupId_idx";--> statement-breakpoint
DROP INDEX "group_invitations_email_idx";--> statement-breakpoint
DROP INDEX "group_members_groupId_userId_idx";--> statement-breakpoint
DROP INDEX "group_members_userId_idx";--> statement-breakpoint
DROP INDEX "group_members_roleId_idx";--> statement-breakpoint
DROP INDEX "group_mutes_groupId_userId_idx";--> statement-breakpoint
DROP INDEX "group_mutes_userId_idx";--> statement-breakpoint
DROP INDEX "posts_groupId_idx";--> statement-breakpoint
DROP INDEX "comments_groupId_idx";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "display_name" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "banner" text;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "banner" text;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "posting_restriction" text DEFAULT 'member' NOT NULL;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "nsfw" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "spaces" ADD COLUMN "member_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "type" text DEFAULT 'text' NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "url" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "flair_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "work_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "pinned" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "locked" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "nsfw" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "spoiler" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "removed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "removed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "removed_reason" text;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "comment_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "removed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "removed_by_id" uuid;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "removed_reason" text;--> statement-breakpoint
ALTER TABLE "comments" ADD COLUMN "score" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "id" SET DEFAULT pg_catalog.gen_random_uuid();--> statement-breakpoint
ALTER TABLE "space_bans" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "space_bans" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_bans" ALTER COLUMN "banned_by_id" SET DATA TYPE uuid USING "banned_by_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_invitations" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "space_invitations" ALTER COLUMN "role_id" SET DATA TYPE uuid USING "role_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_invitations" ALTER COLUMN "invited_by_id" SET DATA TYPE uuid USING "invited_by_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_members" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "space_members" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_members" ALTER COLUMN "role_id" SET DATA TYPE uuid USING "role_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_mutes" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "space_mutes" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "space_mutes" ALTER COLUMN "muted_by_id" SET DATA TYPE uuid USING "muted_by_id"::uuid;--> statement-breakpoint
ALTER TABLE "spaces" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "permissions" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "role_id" SET DATA TYPE uuid USING "role_id"::uuid;--> statement-breakpoint
ALTER TABLE "role_permissions" ALTER COLUMN "permission_id" SET DATA TYPE uuid USING "permission_id"::uuid;--> statement-breakpoint
ALTER TABLE "roles" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "author_id" SET DATA TYPE uuid USING "author_id"::uuid;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "author_id" SET DATA TYPE uuid USING "author_id"::uuid;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "post_id" SET DATA TYPE uuid USING "post_id"::uuid;--> statement-breakpoint
ALTER TABLE "comments" ALTER COLUMN "parent_id" SET DATA TYPE uuid USING "parent_id"::uuid;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "id" SET DATA TYPE uuid USING "id"::uuid;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "user_id" SET DATA TYPE uuid USING "user_id"::uuid;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "post_id" SET DATA TYPE uuid USING "post_id"::uuid;--> statement-breakpoint
ALTER TABLE "votes" ALTER COLUMN "comment_id" SET DATA TYPE uuid USING "comment_id"::uuid;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_bans" ADD CONSTRAINT "group_bans_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_bans" ADD CONSTRAINT "group_bans_banned_by_id_users_id_fkey" FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_invitations" ADD CONSTRAINT "group_invitations_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_invitations" ADD CONSTRAINT "group_invitations_invited_by_id_users_id_fkey" FOREIGN KEY ("invited_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_members" ADD CONSTRAINT "group_members_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_members" ADD CONSTRAINT "group_members_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "space_mutes" ADD CONSTRAINT "group_mutes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_mutes" ADD CONSTRAINT "group_mutes_muted_by_id_users_id_fkey" FOREIGN KEY ("muted_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_comment_id_comments_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE;--> statement-breakpoint
CREATE INDEX "roles_spaceId_idx" ON "roles" ("space_id");--> statement-breakpoint
CREATE UNIQUE INDEX "space_bans_spaceId_userId_idx" ON "space_bans" ("space_id","user_id");--> statement-breakpoint
CREATE INDEX "space_bans_userId_idx" ON "space_bans" ("user_id");--> statement-breakpoint
CREATE INDEX "space_invitations_spaceId_idx" ON "space_invitations" ("space_id");--> statement-breakpoint
CREATE INDEX "space_invitations_email_idx" ON "space_invitations" ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "space_members_spaceId_userId_idx" ON "space_members" ("space_id","user_id");--> statement-breakpoint
CREATE INDEX "space_members_userId_idx" ON "space_members" ("user_id");--> statement-breakpoint
CREATE INDEX "space_members_roleId_idx" ON "space_members" ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "space_mutes_spaceId_userId_idx" ON "space_mutes" ("space_id","user_id");--> statement-breakpoint
CREATE INDEX "space_mutes_userId_idx" ON "space_mutes" ("user_id");--> statement-breakpoint
CREATE INDEX "post_flairs_spaceId_idx" ON "post_flairs" ("space_id");--> statement-breakpoint
CREATE INDEX "posts_spaceId_idx" ON "posts" ("space_id");--> statement-breakpoint
CREATE INDEX "posts_flairId_idx" ON "posts" ("flair_id");--> statement-breakpoint
CREATE INDEX "posts_workId_idx" ON "posts" ("work_id");--> statement-breakpoint
CREATE INDEX "comments_spaceId_idx" ON "comments" ("space_id");--> statement-breakpoint
CREATE UNIQUE INDEX "user_flairs_spaceId_userId_idx" ON "user_flairs" ("space_id","user_id");--> statement-breakpoint
CREATE INDEX "user_flairs_userId_idx" ON "user_flairs" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_items_userId_postId_idx" ON "saved_items" ("user_id","post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "saved_items_userId_commentId_idx" ON "saved_items" ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "saved_items_userId_idx" ON "saved_items" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "hidden_posts_userId_postId_idx" ON "hidden_posts" ("user_id","post_id");--> statement-breakpoint
CREATE INDEX "reports_spaceId_idx" ON "reports" ("space_id");--> statement-breakpoint
CREATE INDEX "reports_reporterId_idx" ON "reports" ("reporter_id");--> statement-breakpoint
CREATE INDEX "reports_postId_idx" ON "reports" ("post_id");--> statement-breakpoint
CREATE INDEX "reports_commentId_idx" ON "reports" ("comment_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" ("status");--> statement-breakpoint
CREATE INDEX "space_rules_spaceId_idx" ON "space_rules" ("space_id");--> statement-breakpoint
CREATE INDEX "mod_log_spaceId_idx" ON "mod_log" ("space_id");--> statement-breakpoint
CREATE INDEX "mod_log_moderatorId_idx" ON "mod_log" ("moderator_id");--> statement-breakpoint
CREATE INDEX "mod_log_createdAt_idx" ON "mod_log" ("created_at");--> statement-breakpoint
CREATE INDEX "messages_senderId_idx" ON "messages" ("sender_id");--> statement-breakpoint
CREATE INDEX "messages_recipientId_idx" ON "messages" ("recipient_id");--> statement-breakpoint
CREATE INDEX "notifications_userId_idx" ON "notifications" ("user_id");--> statement-breakpoint
CREATE INDEX "notifications_userId_isRead_idx" ON "notifications" ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "wiki_pages_spaceId_slug_idx" ON "wiki_pages" ("space_id","slug");--> statement-breakpoint
CREATE INDEX "wiki_pages_spaceId_idx" ON "wiki_pages" ("space_id");--> statement-breakpoint
CREATE INDEX "wiki_revisions_pageId_idx" ON "wiki_revisions" ("page_id");--> statement-breakpoint
CREATE INDEX "poll_options_pollId_idx" ON "poll_options" ("poll_id");--> statement-breakpoint
CREATE UNIQUE INDEX "poll_votes_pollId_userId_idx" ON "poll_votes" ("poll_id","user_id");--> statement-breakpoint
CREATE INDEX "poll_votes_optionId_idx" ON "poll_votes" ("option_id");--> statement-breakpoint
CREATE INDEX "work_revisions_workId_idx" ON "work_revisions" ("work_id");--> statement-breakpoint
CREATE INDEX "works_type_idx" ON "works" ("type");--> statement-breakpoint
CREATE INDEX "works_createdById_idx" ON "works" ("created_by_id");--> statement-breakpoint
CREATE INDEX "works_targetWorkId_idx" ON "works" ("target_work_id");--> statement-breakpoint
CREATE INDEX "creator_revisions_creatorId_idx" ON "creator_revisions" ("creator_id");--> statement-breakpoint
CREATE INDEX "creators_createdById_idx" ON "creators" ("created_by_id");--> statement-breakpoint
CREATE UNIQUE INDEX "work_credits_workId_creatorId_role_idx" ON "work_credits" ("work_id","creator_id","role");--> statement-breakpoint
CREATE INDEX "work_credits_workId_idx" ON "work_credits" ("work_id");--> statement-breakpoint
CREATE INDEX "work_credits_creatorId_idx" ON "work_credits" ("creator_id");--> statement-breakpoint
CREATE UNIQUE INDEX "work_tag_applications_workId_tagId_userId_idx" ON "work_tag_applications" ("work_id","tag_id","user_id");--> statement-breakpoint
CREATE INDEX "work_tag_applications_workId_idx" ON "work_tag_applications" ("work_id");--> statement-breakpoint
CREATE INDEX "work_tag_applications_tagId_idx" ON "work_tag_applications" ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "work_aliases_workId_value_idx" ON "work_aliases" ("work_id","value");--> statement-breakpoint
CREATE UNIQUE INDEX "work_ratings_userId_workId_idx" ON "work_ratings" ("user_id","work_id");--> statement-breakpoint
CREATE INDEX "work_ratings_workId_idx" ON "work_ratings" ("work_id");--> statement-breakpoint
CREATE UNIQUE INDEX "chapter_progress_userId_chapterId_idx" ON "chapter_progress" ("user_id","chapter_id");--> statement-breakpoint
CREATE INDEX "chapter_progress_userId_idx" ON "chapter_progress" ("user_id");--> statement-breakpoint
CREATE INDEX "work_chapters_workId_idx" ON "work_chapters" ("work_id");--> statement-breakpoint
CREATE UNIQUE INDEX "library_items_userId_workId_idx" ON "library_items" ("user_id","work_id");--> statement-breakpoint
CREATE INDEX "library_items_userId_idx" ON "library_items" ("user_id");--> statement-breakpoint
CREATE INDEX "library_items_workId_idx" ON "library_items" ("work_id");--> statement-breakpoint
CREATE UNIQUE INDEX "shelf_items_shelfId_workId_idx" ON "shelf_items" ("shelf_id","work_id");--> statement-breakpoint
CREATE INDEX "shelf_items_shelfId_idx" ON "shelf_items" ("shelf_id");--> statement-breakpoint
CREATE INDEX "shelf_items_workId_idx" ON "shelf_items" ("work_id");--> statement-breakpoint
CREATE INDEX "shelves_ownerId_idx" ON "shelves" ("owner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "work_system_requirements_workId_platform_tier_idx" ON "work_system_requirements" ("work_id","platform","tier");--> statement-breakpoint
CREATE UNIQUE INDEX "space_works_spaceId_workId_idx" ON "space_works" ("space_id","work_id");--> statement-breakpoint
CREATE INDEX "space_works_workId_idx" ON "space_works" ("work_id");--> statement-breakpoint
ALTER TABLE "roles" ADD CONSTRAINT "roles_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_bans" ADD CONSTRAINT "space_bans_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_invitations" ADD CONSTRAINT "space_invitations_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_members" ADD CONSTRAINT "space_members_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_mutes" ADD CONSTRAINT "space_mutes_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "post_flairs" ADD CONSTRAINT "post_flairs_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_flair_id_post_flairs_id_fkey" FOREIGN KEY ("flair_id") REFERENCES "post_flairs"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_removed_by_id_users_id_fkey" FOREIGN KEY ("removed_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_removed_by_id_users_id_fkey" FOREIGN KEY ("removed_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "user_flairs" ADD CONSTRAINT "user_flairs_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "user_flairs" ADD CONSTRAINT "user_flairs_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "saved_items" ADD CONSTRAINT "saved_items_comment_id_comments_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hidden_posts" ADD CONSTRAINT "hidden_posts_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "hidden_posts" ADD CONSTRAINT "hidden_posts_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_users_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_comment_id_comments_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_resolved_by_id_users_id_fkey" FOREIGN KEY ("resolved_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "space_rules" ADD CONSTRAINT "space_rules_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mod_log" ADD CONSTRAINT "mod_log_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "mod_log" ADD CONSTRAINT "mod_log_moderator_id_users_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_last_edited_by_id_users_id_fkey" FOREIGN KEY ("last_edited_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wiki_revisions" ADD CONSTRAINT "wiki_revisions_page_id_wiki_pages_id_fkey" FOREIGN KEY ("page_id") REFERENCES "wiki_pages"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "wiki_revisions" ADD CONSTRAINT "wiki_revisions_edited_by_id_users_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_polls_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fkey" FOREIGN KEY ("poll_id") REFERENCES "polls"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_poll_options_id_fkey" FOREIGN KEY ("option_id") REFERENCES "poll_options"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_revisions" ADD CONSTRAINT "work_revisions_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_revisions" ADD CONSTRAINT "work_revisions_edited_by_id_users_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_target_work_id_works_id_fkey" FOREIGN KEY ("target_work_id") REFERENCES "works"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "works" ADD CONSTRAINT "works_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "creator_revisions" ADD CONSTRAINT "creator_revisions_creator_id_creators_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "creator_revisions" ADD CONSTRAINT "creator_revisions_edited_by_id_users_id_fkey" FOREIGN KEY ("edited_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "creators" ADD CONSTRAINT "creators_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_credits" ADD CONSTRAINT "work_credits_creator_id_creators_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "creators"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_tag_applications" ADD CONSTRAINT "work_tag_applications_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_tag_applications" ADD CONSTRAINT "work_tag_applications_tag_id_work_tags_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "work_tags"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_tag_applications" ADD CONSTRAINT "work_tag_applications_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_aliases" ADD CONSTRAINT "work_aliases_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_aliases" ADD CONSTRAINT "work_aliases_created_by_id_users_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "work_ratings" ADD CONSTRAINT "work_ratings_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_ratings" ADD CONSTRAINT "work_ratings_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "chapter_progress" ADD CONSTRAINT "chapter_progress_chapter_id_work_chapters_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "work_chapters"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_chapters" ADD CONSTRAINT "work_chapters_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "library_items" ADD CONSTRAINT "library_items_last_read_chapter_id_work_chapters_id_fkey" FOREIGN KEY ("last_read_chapter_id") REFERENCES "work_chapters"("id") ON DELETE SET NULL;--> statement-breakpoint
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_shelf_id_shelves_id_fkey" FOREIGN KEY ("shelf_id") REFERENCES "shelves"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shelf_items" ADD CONSTRAINT "shelf_items_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "shelves" ADD CONSTRAINT "shelves_owner_id_users_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "work_system_requirements" ADD CONSTRAINT "work_system_requirements_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_works" ADD CONSTRAINT "space_works_space_id_spaces_id_fkey" FOREIGN KEY ("space_id") REFERENCES "spaces"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_works" ADD CONSTRAINT "space_works_work_id_works_id_fkey" FOREIGN KEY ("work_id") REFERENCES "works"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "space_works" ADD CONSTRAINT "space_works_added_by_id_users_id_fkey" FOREIGN KEY ("added_by_id") REFERENCES "users"("id") ON DELETE SET NULL;