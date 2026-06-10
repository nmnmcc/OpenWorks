CREATE TABLE "posts" (
	"id" text PRIMARY KEY,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"author_id" text NOT NULL,
	"group_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "posts_authorId_idx" ON "posts" ("author_id");--> statement-breakpoint
CREATE INDEX "posts_groupId_idx" ON "posts" ("group_id");--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_group_id_groups_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE CASCADE;