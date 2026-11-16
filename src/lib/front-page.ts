import type { Competition } from "@/db/schema";
import { dayLabel, timeLabel } from "@/lib/dates";
import {
  nextStagePhrase,
  roundName,
  stageDepth,
  type MatchView,
  type TeamView,
} from "@/lib/league";
import { contestName, tieWinner, unconfirmedKickoff } from "@/lib/results";
import { competitionName, roundOf, toTeamView, type TeamData, type TeamMatch } from "@/lib/team";

export interface FrontData {
  teams: TeamData["teams"];
  // Every match of the season from a week before now to a week after.
  matches: TeamMatch[];
}

export interface Lead {
  subject: TeamView;
  title: string;
  summary: string;
}

export interface FrontMatch extends MatchView {
  time: string;
}

export interface Day {
  day: string;
  // One per competition and round, in order of the first kickoff.
  groups: { label: string; matches: FrontMatch[] }[];
}

export interface Side {
  days: Day[];
  // Matches that didn't fit, per competition.
  more: { href: string; name: string; count: number }[];
}

const DAY = 24 * 60 * 60 * 1000;
const competitions: Competition[] = ["liga-profesional", "primera-nacional", "copa-argentina"];
const shown = 10;

// What winning the match settles, as far as the formats say.
function consequence(m: TeamMatch) {
  if (stageDepth(m) === 5) {
    if (m.competition === "copa-argentina") return "Es el campeón de la Copa Argentina.";
    if (m.competition === "liga-profesional") return `Es el campeón del ${competitionName(m)}.`;
    // The provider calls the title decider "Super Final"; the Reducido's own final is only the second promotion.
    if (/Super Final/.test(m.roundLabel)) {
      return "Es el campeón y el primer ascenso a la Liga Profesional.";
    }
    return "";
  }
  const next = nextStagePhrase(m);
  return next ? `Pasa a ${next}.` : "";
}

// The second division only takes the cover when the top flight and the cup have no result.
const tier = (m: TeamMatch) => (m.competition === "primera-nacional" ? 1 : 0);

// The front page's subject: the winner of the deepest knockout match of the last week.
function pickLead(data: FrontData, team: (id: number) => TeamView, now: Date): Lead | null {
  const [m] = data.matches
    .filter(
      (m) =>
        m.phase === "knockout" &&
        m.kickoff <= now &&
        now.getTime() - m.kickoff.getTime() <= 7 * DAY &&
        tieWinner(m),
    )
    .sort(
      (a, b) =>
        tier(a) - tier(b) ||
        stageDepth(b) - stageDepth(a) ||
        b.kickoff.getTime() - a.kickoff.getTime() ||
        competitions.indexOf(a.competition) - competitions.indexOf(b.competition),
    );
  if (!m) return null;

  const home = tieWinner(m) === "home";
  const winner = team(home ? m.homeTeamId : m.awayTeamId);
  const loser = team(home ? m.awayTeamId : m.homeTeamId);
  const [gf, ga] = home ? [m.homeGoals!, m.awayGoals!] : [m.awayGoals!, m.homeGoals!];
  const [pf, pa] = home ? [m.homePenalties, m.awayPenalties] : [m.awayPenalties, m.homePenalties];
  const where = `en ${roundOf(m)} el ${dayLabel(m.kickoff)}`;
  const result =
    gf === ga
      ? `Empató ${gf}-${ga} con ${loser.name} ${where} y ganó ${pf}-${pa} por penales.`
      : `Le ganó ${gf}-${ga} a ${loser.name} ${where}.`;
  return {
    subject: winner,
    title: winner.name,
    summary: `${result} ${consequence(m)}`.trim(),
  };
}

function side(
  matches: TeamMatch[],
  team: (id: number) => TeamView,
  tbd: (m: TeamMatch) => boolean,
): Side {
  const days: Day[] = [];
  // Matches whose kickoff is still the round's placeholder go together after the dated days.
  const undated: Day = { day: "Fecha a confirmar", groups: [] };
  for (const m of matches.slice(0, shown)) {
    const unconfirmed = tbd(m);
    const day = dayLabel(m.kickoff);
    if (!unconfirmed && days.at(-1)?.day !== day) days.push({ day, groups: [] });
    const { groups } = unconfirmed ? undated : days.at(-1)!;
    const label = `${competitionName(m)}, ${roundName(m).toLowerCase()}`;
    let group = groups.find((g) => g.label === label);
    if (!group) groups.push((group = { label, matches: [] }));
    // A match the data still has as scheduled has no score yet, whatever the row holds.
    const scored = m.status !== "scheduled";
    group.matches.push({
      id: m.id,
      kickoff: m.kickoff,
      status: m.status,
      home: team(m.homeTeamId),
      away: team(m.awayTeamId),
      homeGoals: scored ? m.homeGoals : null,
      awayGoals: scored ? m.awayGoals : null,
      homePenalties: scored ? m.homePenalties : null,
      awayPenalties: scored ? m.awayPenalties : null,
      unconfirmed,
      time: unconfirmed ? "" : timeLabel(m.kickoff),
    });
  }
  if (undated.groups.length) days.push(undated);
  const rest = matches.slice(shown);
  const more = competitions
    .map((c) => ({
      href: `/${c}`,
      name: contestName(c),
      count: rest.filter((m) => m.competition === c).length,
    }))
    .filter((c) => c.count > 0);
  return { days, more };
}

export function buildFrontPage(data: FrontData, now: Date) {
  const teams = new Map(data.teams.map((t) => [t.id, toTeamView(t)]));
  const team = (id: number) => teams.get(id)!;
  const t = now.getTime();
  const byKickoff = data.matches.toSorted((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  const tbd = unconfirmedKickoff(data.matches);

  const upcoming = byKickoff.filter(
    (m) => m.status === "scheduled" && m.kickoff > now && m.kickoff.getTime() - t <= 7 * DAY,
  );
  // Anything that should have started, including matches the last sync still had as scheduled.
  const results = byKickoff
    .filter((m) => m.kickoff <= now && t - m.kickoff.getTime() <= 4 * DAY)
    .reverse();
  // Latest day first, but each day's matches in the order they were played.
  const recent = side(results, team, tbd);
  for (const day of recent.days) {
    day.groups.reverse();
    for (const g of day.groups) g.matches.reverse();
  }

  return {
    lead: pickLead(data, team, now),
    upcoming: side(upcoming, team, tbd),
    results: recent,
  };
}

export type FrontPage = ReturnType<typeof buildFrontPage>;
