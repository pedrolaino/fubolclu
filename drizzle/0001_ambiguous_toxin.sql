CREATE TABLE "sync_state" (
	"key" text PRIMARY KEY NOT NULL,
	"synced_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "assist_player_name" text;--> statement-breakpoint
ALTER TABLE "match_events" ADD COLUMN "extra_minute" integer;--> statement-breakpoint
ALTER TABLE "matches" ADD COLUMN "stats" jsonb;