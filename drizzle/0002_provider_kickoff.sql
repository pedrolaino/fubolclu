ALTER TABLE "matches" ADD COLUMN "provider_kickoff" timestamp with time zone;--> statement-breakpoint
UPDATE "matches" SET "provider_kickoff" = "kickoff";--> statement-breakpoint
ALTER TABLE "matches" ALTER COLUMN "provider_kickoff" SET NOT NULL;
