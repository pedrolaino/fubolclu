import type { EventType } from "@/db/schema";
import { dayLabel, timeLabel } from "@/lib/dates";
import type { TeamView } from "@/lib/league";
import { roundOf, toTeamView, type TeamData, type TeamMatch } from "@/lib/team";

export interface MatchData {
  match: TeamMatch & { stats: unknown };
  home: TeamData["teams"][number];
  away: TeamData["teams"][number];
  events: {
    teamId: number;
    type: EventType;
    playerName: string;
    assistPlayerName: string | null;
    minute: number;
    extraMinute: number | null;
  }[];
}

export interface TimelineEvent {
  side: "home" | "away";
  minute: string;
  type: EventType;
  title: string;
  detail: string;
}

export interface StatRow {
  label: string;
  homeText: string;
  awayText: string;
  // 0 to 1, the length of each bar.
  homeShare: number;
  awayShare: number;
}

const eventTitle: Record<EventType, string> = {
  goal: "Gol",
  penalty_goal: "Gol de penal",
  own_goal: "Gol en contra",
  missed_penalty: "Penal errado",
  yellow_card: "Amarilla",
  red_card: "Roja",
  substitution: "Cambio",
};

function timeline(data: MatchData): TimelineEvent[] {
  const sideOf = (e: MatchData["events"][number]) => {
    const own = e.teamId === data.match.homeTeamId;
    // An own goal counts for the other team.
    return own !== (e.type === "own_goal") ? "home" : "away";
  };
  return data.events
    .toSorted((a, b) => a.minute - b.minute || (a.extraMinute ?? 0) - (b.extraMinute ?? 0))
    .map((e) => ({
      side: sideOf(e),
      minute: `${e.minute}${e.extraMinute ? `+${e.extraMinute}` : ""}'`,
      type: e.type,
      title: eventTitle[e.type],
      // For substitutions the "assist" is the player coming on.
      detail:
        e.type === "substitution"
          ? e.assistPlayerName
            ? `Entra ${e.assistPlayerName} por ${e.playerName}`
            : `Sale ${e.playerName}`
          : e.assistPlayerName && e.type !== "own_goal"
            ? `${e.playerName}, asistencia de ${e.assistPlayerName}`
            : e.playerName,
    }));
}

type Figures = Map<string, number>;

const ratio = (part: number, whole: number) => (whole ? part / whole : undefined);

// [label, kind, value]; undefined when the provider didn't send what it needs.
const statDefinitions: [
  string,
  "percent" | "count" | "decimal",
  (f: Figures) => number | undefined,
][] = [
  ["Posesión", "percent", (f) => f.get("Possession")],
  ["Goles esperados", "decimal", (f) => f.get("Expected Goals")],
  [
    "Remates",
    "count",
    (f) => {
      const parts = ["Shots on target", "Shots off target", "Blocked shots"].map((k) => f.get(k));
      return parts.includes(undefined) ? undefined : parts.reduce((a, b) => a! + b!, 0);
    },
  ],
  ["Remates al arco", "count", (f) => f.get("Shots on target")],
  ["Chances claras", "count", (f) => f.get("Big Chances Created")],
  ["Córners", "count", (f) => f.get("Corners")],
  ["Faltas", "count", (f) => f.get("Fouls")],
  ["Offsides", "count", (f) => f.get("Offsides")],
  ["Pases", "count", (f) => f.get("Total passes")],
  [
    "Precisión de pases",
    "percent",
    (f) => ratio(f.get("Successful passes") ?? NaN, f.get("Total passes") ?? 0),
  ],
  ["Atajadas", "count", (f) => f.get("Goalkeeper saves")],
  ["Amarillas", "count", (f) => f.get("Yellow cards")],
];

// The provider's `statistics` array: one entry per team with named values.
function figuresByTeam(stats: unknown) {
  const byTeam = new Map<number, Figures>();
  if (!Array.isArray(stats)) return byTeam;
  for (const entry of stats) {
    const id = entry?.team?.id;
    if (typeof id !== "number" || !Array.isArray(entry.statistics)) continue;
    const figures: Figures = new Map();
    for (const s of entry.statistics) {
      if (typeof s?.displayName === "string" && typeof s.value === "number") {
        figures.set(s.displayName, s.value);
      }
    }
    byTeam.set(id, figures);
  }
  return byTeam;
}

const decimal = new Intl.NumberFormat("es-AR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function statRows(data: MatchData): StatRow[] {
  const byTeam = figuresByTeam(data.match.stats);
  const [home, away] = [byTeam.get(data.match.homeTeamId), byTeam.get(data.match.awayTeamId)];
  if (!home || !away) return [];
  return statDefinitions.flatMap(([label, kind, value]) => {
    const [h, a] = [value(home), value(away)];
    if (h === undefined || a === undefined || Number.isNaN(h) || Number.isNaN(a)) return [];
    const text = (n: number) =>
      kind === "percent"
        ? `${Math.round(n * 100)}%`
        : kind === "decimal"
          ? decimal.format(n)
          : `${n}`;
    const scale = kind === "percent" ? 1 : Math.max(h, a);
    return [
      {
        label,
        homeText: text(h),
        awayText: text(a),
        homeShare: scale ? h / scale : 0,
        awayShare: scale ? a / scale : 0,
      },
    ];
  });
}

function summary(data: MatchData) {
  const { match: m, home, away } = data;
  const round = roundOf(m);
  const day = dayLabel(m.kickoff);
  const [hg, ag, hp, ap] = [m.homeGoals, m.awayGoals, m.homePenalties, m.awayPenalties];
  const scored = hg !== null && ag !== null;

  if (m.status === "postponed" || m.status === "cancelled") {
    return `${home.name} y ${away.name} iban a jugar el ${day} por ${round}, pero el partido se ${
      m.status === "postponed" ? "postergó" : "suspendió"
    }.`;
  }
  if (m.status === "live" && scored) {
    return `${home.name} y ${away.name} juegan por ${round} y van ${hg}-${ag}.`;
  }
  if (m.status !== "finished" || !scored) {
    return `${home.name} recibe a ${away.name} el ${day} a las ${timeLabel(m.kickoff)} por ${round}.`;
  }
  if (hg !== ag) {
    const [winner, loser, high, low] = hg > ag ? [home, away, hg, ag] : [away, home, ag, hg];
    return `${winner.name} le ganó ${high}-${low} a ${loser.name} por ${round}, el ${day}.`;
  }
  const draw = `${home.name} y ${away.name} empataron ${hg}-${ag} por ${round}, el ${day}`;
  if (hp === null || ap === null) return `${draw}.`;
  const [winner, high, low] = hp > ap ? [home, hp, ap] : [away, ap, hp];
  return `${draw}, y ${winner.name} ganó ${high}-${low} en los penales.`;
}

export function buildMatch(data: MatchData) {
  const { match: m } = data;
  const scored = m.homeGoals !== null && m.awayGoals !== null;
  const home: TeamView = toTeamView(data.home);
  const away: TeamView = toTeamView(data.away);
  return {
    home,
    away,
    title:
      scored && m.status !== "scheduled" ? `${m.homeGoals}-${m.awayGoals}` : timeLabel(m.kickoff),
    summary: summary(data),
    finished: m.status === "finished",
    // Only a played match has details to show, and only once they have been fetched.
    awaitingDetails: (m.status === "finished" || m.status === "live") && m.detailsSyncedAt === null,
    events: timeline(data),
    stats: statRows(data),
  };
}

export type MatchPage = ReturnType<typeof buildMatch>;
