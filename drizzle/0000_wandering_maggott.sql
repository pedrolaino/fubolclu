CREATE TABLE "api_usage" (
	"day" date PRIMARY KEY NOT NULL,
	"requests" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "historical_points" (
	"season" integer NOT NULL,
	"team_id" integer NOT NULL,
	"played" integer NOT NULL,
	"points" integer NOT NULL,
	CONSTRAINT "historical_points_season_team_id_pk" PRIMARY KEY("season","team_id")
);
--> statement-breakpoint
CREATE TABLE "match_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_id" bigint NOT NULL,
	"team_id" integer NOT NULL,
	"player_id" integer,
	"player_name" text NOT NULL,
	"assist_player_id" integer,
	"type" text NOT NULL,
	"minute" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" bigint PRIMARY KEY NOT NULL,
	"competition" text NOT NULL,
	"season" integer NOT NULL,
	"round_label" text NOT NULL,
	"tournament" text,
	"phase" text NOT NULL,
	"matchday" integer,
	"kickoff" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"home_team_id" integer NOT NULL,
	"away_team_id" integer NOT NULL,
	"home_goals" integer,
	"away_goals" integer,
	"home_penalties" integer,
	"away_penalties" integer,
	"details_synced_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "players" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_standings" (
	"competition" text NOT NULL,
	"season" integer NOT NULL,
	"group_name" text NOT NULL,
	"team_id" integer NOT NULL,
	"position" integer NOT NULL,
	"played" integer NOT NULL,
	"won" integer NOT NULL,
	"drawn" integer NOT NULL,
	"lost" integer NOT NULL,
	"goals_for" integer NOT NULL,
	"goals_against" integer NOT NULL,
	"points" integer NOT NULL,
	CONSTRAINT "provider_standings_competition_season_group_name_team_id_pk" PRIMARY KEY("competition","season","group_name","team_id")
);
--> statement-breakpoint
CREATE TABLE "sync_runs" (
	"id" serial PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone,
	"requests_used" integer NOT NULL,
	"status" text NOT NULL,
	"error" text
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"logo_url" text,
	CONSTRAINT "teams_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "historical_points" ADD CONSTRAINT "historical_points_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_player_id_players_id_fk" FOREIGN KEY ("player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_events" ADD CONSTRAINT "match_events_assist_player_id_players_id_fk" FOREIGN KEY ("assist_player_id") REFERENCES "public"."players"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_home_team_id_teams_id_fk" FOREIGN KEY ("home_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_away_team_id_teams_id_fk" FOREIGN KEY ("away_team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_standings" ADD CONSTRAINT "provider_standings_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "match_events_match_id_idx" ON "match_events" USING btree ("match_id");--> statement-breakpoint
CREATE INDEX "matches_competition_season_idx" ON "matches" USING btree ("competition","season");--> statement-breakpoint
CREATE INDEX "matches_kickoff_idx" ON "matches" USING btree ("kickoff");