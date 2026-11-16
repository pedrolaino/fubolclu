import { dayLabel, rangeLabel } from "@/lib/dates";
import {
  roundName,
  roundPhrase,
  type LeagueData,
  type LeagueMatch,
  type MatchView,
  type TeamView,
} from "@/lib/league";
import { paint } from "@/lib/paint";

export type CupMatch = Pick<
  LeagueMatch,
  | "id"
  | "roundLabel"
  | "status"
  | "kickoff"
  | "homeTeamId"
  | "awayTeamId"
  | "homeGoals"
  | "awayGoals"
  | "homePenalties"
  | "awayPenalties"
>;

export interface CupData {
  teams: LeagueData["teams"];
  matches: CupMatch[];
}

export interface Tie extends MatchView {
  winner: "home" | "away" | null;
}

export interface BracketRound {
  key: string;
  title: string;
  day: string;
  ties: Tie[];
}

// The provider's labels, in the order they are played.
const stages = [
  "Round of 64",
  "Round of 32",
  "Round of 16",
  "Quarter-finals",
  "Semi-finals",
  "Final",
];

const info = (roundLabel: string) => ({ roundLabel, phase: "knockout" as const, matchday: null });

function winnerOf(m: CupMatch) {
  if (m.status !== "finished" || m.homeGoals === null || m.awayGoals === null) return null;
  if (m.homeGoals !== m.awayGoals) return m.homeGoals > m.awayGoals ? "home" : "away";
  if (m.homePenalties === null || m.awayPenalties === null) return null;
  return m.homePenalties > m.awayPenalties ? "home" : "away";
}

// Rounds as the bracket draws them: earliest first, the ties of each by kickoff.
// TODO: the data doesn't say which tie feeds which, so there are no connector lines.
export function buildCup(data: CupData) {
  const teams = new Map(data.teams.map((t) => [t.id, { ...t, ...paint(t.id) }]));
  const team = (id: number): TeamView => teams.get(id)!;
  const byKickoff = [...data.matches].sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());

  const last = byKickoff.findLast((m) => winnerOf(m));
  if (!last) return null;

  const view = (m: CupMatch): Tie => ({
    id: m.id,
    kickoff: m.kickoff,
    status: m.status,
    home: team(m.homeTeamId),
    away: team(m.awayTeamId),
    homeGoals: m.homeGoals,
    awayGoals: m.awayGoals,
    homePenalties: m.homePenalties,
    awayPenalties: m.awayPenalties,
    winner: winnerOf(m),
  });

  const rounds: BracketRound[] = [];
  for (const label of new Set(byKickoff.map((m) => m.roundLabel))) {
    const ties = byKickoff.filter((m) => m.roundLabel === label);
    rounds.push({
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: roundName(info(label)),
      day: rangeLabel(ties[0].kickoff, ties.at(-1)!.kickoff),
      ties: ties.map(view),
    });
  }

  const won = view(last);
  const [winner, loser] = won.winner === "home" ? [won.home, won.away] : [won.away, won.home];
  const [goalsFor, goalsAgainst] =
    won.winner === "home" ? [won.homeGoals!, won.awayGoals!] : [won.awayGoals!, won.homeGoals!];
  const [pensFor, pensAgainst] =
    won.winner === "home"
      ? [won.homePenalties, won.awayPenalties]
      : [won.awayPenalties, won.homePenalties];
  const phrase = roundPhrase(info(last.roundLabel));
  const result =
    goalsFor === goalsAgainst
      ? `Empató ${goalsFor}-${goalsAgainst} con ${loser.name} en ${phrase} y ganó ${pensFor}-${pensAgainst} por penales.`
      : `Le ganó a ${loser.name} ${goalsFor}-${goalsAgainst} en ${phrase}.`;

  const nextLabel = stages[stages.indexOf(last.roundLabel) + 1];
  const nextTie = byKickoff.find(
    (m) =>
      m.status === "scheduled" &&
      m.roundLabel === nextLabel &&
      (m.homeTeamId === winner.id || m.awayTeamId === winner.id),
  );
  let next: string;
  if (last.roundLabel === "Final") next = "Es el campeón de la Copa Argentina.";
  else if (nextTie) {
    const rival = team(nextTie.homeTeamId === winner.id ? nextTie.awayTeamId : nextTie.homeTeamId);
    next = `El ${dayLabel(nextTie.kickoff)} enfrenta a ${rival.name} por ${roundPhrase(info(nextLabel))}.`;
  } else if (nextLabel) {
    next = `Ya está en ${roundPhrase(info(nextLabel))}; todavía no tiene fecha.`;
  } else next = "";

  return {
    rounds,
    // The round where the latest result came in.
    open: rounds.find((r) => r.ties.some((t) => t.id === last.id))!.key,
    hero: { subject: winner, title: winner.name, summary: `${result} ${next}`.trim() },
  };
}
