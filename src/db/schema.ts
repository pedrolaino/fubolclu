import {
  bigint,
  date,
  index,
  integer,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

export type Competition = "liga-profesional" | "primera-nacional" | "copa-argentina";
export type MatchStatus = "scheduled" | "live" | "finished" | "postponed" | "cancelled";
export type EventType =
  | "goal"
  | "own_goal"
  | "penalty_goal"
  | "missed_penalty"
  | "yellow_card"
  | "red_card"
  | "substitution";

const tz = (name: string) => timestamp(name, { withTimezone: true });

export const teams = pgTable("teams", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logoUrl: text("logo_url"),
});

export const players = pgTable("players", {
  id: integer("id").primaryKey(),
  name: text("name").notNull(),
});

export const matches = pgTable(
  "matches",
  {
    id: bigint("id", { mode: "number" }).primaryKey(),
    competition: text("competition").$type<Competition>().notNull(),
    season: integer("season").notNull(),
    roundLabel: text("round_label").notNull(),
    tournament: text("tournament").$type<"apertura" | "clausura">(),
    phase: text("phase").$type<"league" | "knockout">().notNull(),
    matchday: integer("matchday"),
    kickoff: tz("kickoff").notNull(),
    status: text("status").$type<MatchStatus>().notNull(),
    homeTeamId: integer("home_team_id")
      .notNull()
      .references(() => teams.id),
    awayTeamId: integer("away_team_id")
      .notNull()
      .references(() => teams.id),
    homeGoals: integer("home_goals"),
    awayGoals: integer("away_goals"),
    homePenalties: integer("home_penalties"),
    awayPenalties: integer("away_penalties"),
    detailsSyncedAt: tz("details_synced_at"),
    updatedAt: tz("updated_at").notNull(),
  },
  (t) => [
    index("matches_competition_season_idx").on(t.competition, t.season),
    index("matches_kickoff_idx").on(t.kickoff),
  ],
);

export const matchEvents = pgTable(
  "match_events",
  {
    id: serial("id").primaryKey(),
    matchId: bigint("match_id", { mode: "number" })
      .notNull()
      .references(() => matches.id, { onDelete: "cascade" }),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    playerId: integer("player_id").references(() => players.id),
    playerName: text("player_name").notNull(),
    assistPlayerId: integer("assist_player_id").references(() => players.id),
    type: text("type").$type<EventType>().notNull(),
    minute: integer("minute").notNull(),
  },
  (t) => [index("match_events_match_id_idx").on(t.matchId)],
);

// The provider's own table: kept for zone membership and as a cross-check.
export const providerStandings = pgTable(
  "provider_standings",
  {
    competition: text("competition").$type<Competition>().notNull(),
    season: integer("season").notNull(),
    groupName: text("group_name").notNull(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    position: integer("position").notNull(),
    played: integer("played").notNull(),
    won: integer("won").notNull(),
    drawn: integer("drawn").notNull(),
    lost: integer("lost").notNull(),
    goalsFor: integer("goals_for").notNull(),
    goalsAgainst: integer("goals_against").notNull(),
    points: integer("points").notNull(),
  },
  (t) => [primaryKey({ columns: [t.competition, t.season, t.groupName, t.teamId] })],
);

export const historicalPoints = pgTable(
  "historical_points",
  {
    season: integer("season").notNull(),
    teamId: integer("team_id")
      .notNull()
      .references(() => teams.id),
    played: integer("played").notNull(),
    points: integer("points").notNull(),
  },
  (t) => [primaryKey({ columns: [t.season, t.teamId] })],
);

export const syncRuns = pgTable("sync_runs", {
  id: serial("id").primaryKey(),
  startedAt: tz("started_at").notNull(),
  finishedAt: tz("finished_at"),
  requestsUsed: integer("requests_used").notNull(),
  status: text("status").notNull(),
  error: text("error"),
});

export const apiUsage = pgTable("api_usage", {
  day: date("day").primaryKey(),
  requests: integer("requests").notNull().default(0),
});
