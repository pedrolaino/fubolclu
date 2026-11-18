import type { Competition, MatchStatus, Tournament } from "@/db/schema";

type Played = { status: MatchStatus | null };

// For deciding whether a table or a tournament is over: a postponed match is still owed.
export const unplayed = (m: Played) =>
  m.status === "scheduled" || m.status === "live" || m.status === "postponed";

const STALE = 3 * 60 * 60 * 1000;

// A match a "next match" sentence may name: on the calendar and not long past its kickoff,
// so a row the sync never closed doesn't read as coming up.
export const isUpcoming = (m: Played & { kickoff: Date }, now: Date) =>
  (m.status === "scheduled" || m.status === "live") && now.getTime() - m.kickoff.getTime() <= STALE;

type Slot = {
  status: MatchStatus | null;
  roundLabel: string;
  kickoff: Date;
  // Highlightly's kickoff, when TheSportsDB may have replaced it.
  providerKickoff?: Date;
  // Optional where every match given is of one competition.
  competition?: Competition;
};

// Highlightly gives every match of a round one shared kickoff until the fixture is scheduled,
// so four or more unplayed matches of a round at the same instant don't have a real date yet,
// unless TheSportsDB already gave that match its own.
export function unconfirmedKickoff(matches: Slot[]) {
  const raw = (m: Slot) => m.providerKickoff ?? m.kickoff;
  const key = (m: Slot) => `${m.competition ?? ""}|${m.roundLabel}|${raw(m).getTime()}`;
  const counts = new Map<string, number>();
  for (const m of matches) {
    if (m.status === "scheduled") counts.set(key(m), (counts.get(key(m)) ?? 0) + 1);
  }
  return (m: Slot) =>
    m.status === "scheduled" &&
    raw(m).getTime() === m.kickoff.getTime() &&
    (counts.get(key(m)) ?? 0) >= 4;
}

// "unstarted" until a match of the table has been played; "over" once none is left.
export function tableState(rows: { played: number }[], matches: Played[]) {
  if (!rows.some((r) => r.played > 0)) return "unstarted";
  return matches.some(unplayed) ? "open" : "over";
}

// Single-match ties: goals decide, then penalties. Level penalties or none after a draw: no winner.
export function tieWinner(m: {
  status: MatchStatus | null;
  homeGoals: number | null;
  awayGoals: number | null;
  homePenalties: number | null;
  awayPenalties: number | null;
}) {
  if (m.status !== "finished" || m.homeGoals === null || m.awayGoals === null) return null;
  if (m.homeGoals !== m.awayGoals) return m.homeGoals > m.awayGoals ? "home" : "away";
  const { homePenalties: h, awayPenalties: a } = m;
  if (h === null || a === null || h === a) return null;
  return h > a ? "home" : "away";
}

const names: Record<Competition | Tournament, [article: "el" | "la", name: string]> = {
  apertura: ["el", "Apertura"],
  clausura: ["el", "Clausura"],
  "liga-profesional": ["la", "Liga Profesional"],
  "primera-nacional": ["la", "Primera Nacional"],
  "copa-argentina": ["la", "Copa Argentina"],
};

// "Clausura", "Copa Argentina"
export const contestName = (key: Competition | Tournament) => names[key][1];
// "el Clausura", "la Copa Argentina"
export const withArticle = (key: Competition | Tournament) => names[key].join(" ");
// "del Clausura", "de la Copa Argentina"
export const ofContest = (key: Competition | Tournament) =>
  names[key][0] === "el" ? `del ${names[key][1]}` : `de la ${names[key][1]}`;
