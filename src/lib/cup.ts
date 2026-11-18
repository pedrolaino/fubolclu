import { dayLabel, roundDays } from "@/lib/dates";
import {
  nextStagePhrase,
  roundName,
  roundPhrase,
  stageDepth,
  type LeagueData,
  type LeagueMatch,
  type MatchView,
  type TeamView,
} from "@/lib/league";
import { paint } from "@/lib/paint";
import { isUpcoming, tieWinner, unconfirmedKickoff } from "@/lib/results";

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

const info = (roundLabel: string) => ({ roundLabel, phase: "knockout" as const, matchday: null });

// "están postergados" for "los cuartos de final", "está postergada" for "la final"
const postponed = (phrase: string) =>
  ({ la: "está postergada", las: "están postergadas" })[phrase.split(" ")[0]] ??
  "están postergados";

// Rounds as the bracket draws them: earliest first, the ties of each by kickoff.
// TODO: the data doesn't say which tie feeds which, so there are no connector lines.
export function buildCup(data: CupData, now: Date) {
  const teams = new Map(data.teams.map((t) => [t.id, { ...t, ...paint(t.id) }]));
  const team = (id: number): TeamView => teams.get(id)!;
  const byKickoff = [...data.matches].sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  const tbd = unconfirmedKickoff(data.matches);

  const last = byKickoff.findLast((m) => tieWinner(m));
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
    unconfirmed: tbd(m),
    winner: tieWinner(m),
  });

  const rounds: BracketRound[] = [];
  for (const label of new Set(byKickoff.map((m) => m.roundLabel))) {
    const ties = byKickoff.filter((m) => m.roundLabel === label);
    const dated = ties.filter((m) => !tbd(m));
    rounds.push({
      key: label.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      title: roundName(info(label)),
      day: roundDays(
        dated.map((m) => m.kickoff),
        ties.length - dated.length,
      ),
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

  const depth = stageDepth(info(last.roundLabel));
  const nextPhrase = nextStagePhrase(info(last.roundLabel));
  const nextTie = byKickoff.find(
    (m) =>
      stageDepth(info(m.roundLabel)) === depth + 1 &&
      m.status !== "finished" &&
      m.status !== "cancelled" &&
      (m.homeTeamId === winner.id || m.awayTeamId === winner.id),
  );
  const rival =
    nextTie && team(nextTie.homeTeamId === winner.id ? nextTie.awayTeamId : nextTie.homeTeamId);
  let next = "";
  if (depth === 5) next = "Es el campeón de la Copa Argentina.";
  else if (!nextPhrase) next = "";
  else if (!nextTie || !rival) next = `Ya está en ${nextPhrase}; todavía no tiene fecha.`;
  else if (nextTie.status === "postponed") {
    next = `${nextPhrase[0].toUpperCase()}${nextPhrase.slice(1)} contra ${rival.name} ${postponed(nextPhrase)}.`;
  } else if (!isUpcoming(nextTie, now)) next = `Ya está en ${nextPhrase}, contra ${rival.name}.`;
  else if (nextTie.status === "live") next = `Está jugando ${nextPhrase} contra ${rival.name}.`;
  else if (tbd(nextTie)) {
    next = `Enfrenta a ${rival.name} por ${nextPhrase}; todavía no tiene fecha confirmada.`;
  } else {
    next = `El ${dayLabel(nextTie.kickoff)} enfrenta a ${rival.name} por ${nextPhrase}.`;
  }

  return {
    rounds,
    // The round where the latest result came in.
    open: rounds.find((r) => r.ties.some((t) => t.id === last.id))!.key,
    hero: { subject: winner, title: winner.name, summary: `${result} ${next}`.trim() },
  };
}
