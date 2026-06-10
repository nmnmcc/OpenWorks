CREATE TABLE "group_bans" (
	"id" text PRIMARY KEY,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reason" text,
	"banned_by_id" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_mutes" (
	"id" text PRIMARY KEY,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"reason" text,
	"muted_by_id" text NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY,
	"content" jsonb NOT NULL,
	"author_id" text NOT NULL,
	"post_id" text NOT NULL,
	"parent_id" text,
	"group_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" text PRIMARY KEY,
	"user_id" text NOT NULL,
	"post_id" text,
	"comment_id" text,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN "visibility" text DEFAULT 'public' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "group_bans_groupId_userId_idx" ON "group_bans" ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "group_bans_userId_idx" ON "group_bans" ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "group_mutes_groupId_userId_idx" ON "group_mutes" ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "group_mutes_userId_idx" ON "group_mutes" ("user_id");--> statement-breakpoint
CREATE INDEX "comments_authorId_idx" ON "comments" ("author_id");--> statement-breakpoint
CREATE INDEX "comments_postId_idx" ON "comments" ("post_id");--> statement-breakpoint
CREATE INDEX "comments_parentId_idx" ON "comments" ("parent_id");--> statement-breakpoint
CREATE INDEX "comments_groupId_idx" ON "comments" ("group_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_userId_postId_idx" ON "votes" ("user_id","post_id");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_userId_commentId_idx" ON "votes" ("user_id","comment_id");--> statement-breakpoint
CREATE INDEX "votes_postId_idx" ON "votes" ("post_id");--> statement-breakpoint
CREATE INDEX "votes_commentId_idx" ON "votes" ("comment_id");--> statement-breakpoint
ALTER TABLE "group_bans" ADD CONSTRAINT "group_bans_group_id_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_bans" ADD CONSTRAINT "group_bans_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_bans" ADD CONSTRAINT "group_bans_banned_by_id_users_id_fkey" FOREIGN KEY ("banned_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_mutes" ADD CONSTRAINT "group_mutes_group_id_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_mutes" ADD CONSTRAINT "group_mutes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "group_mutes" ADD CONSTRAINT "group_mutes_muted_by_id_users_id_fkey" FOREIGN KEY ("muted_by_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_group_id_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_users_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_post_id_posts_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "votes" ADD CONSTRAINT "votes_comment_id_comments_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "comments"("id") ON DELETE CASCADE;