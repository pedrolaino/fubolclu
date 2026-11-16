import type { CompetitionSeason } from "@/config/seasons/types";
import { dayLabel } from "@/lib/dates";
import {
  buildLeague,
  roundName,
  type AverageRow,
  type LeagueData,
  type LeagueMatch,
  type TableRow,
  type TeamView,
} from "@/lib/league";
import { paint } from "@/lib/paint";

export type SourceKey = "apertura" | "clausura" | "anual" | "copa-argentina" | "promedios";
type Contest = "apertura" | "clausura" | "copa-argentina";

// "decided" is final, "today" is how it stands if the table closed now, "open" has no holder yet.
export type State = "decided" | "today" | "open";

export const stateLabel: Record<State, string> = {
  decided: "Definido",
  today: "Si terminara hoy",
  open: "Todavía abierto",
};

export interface Entry {
  team: TeamView;
  note: string;
}

export interface SeatView {
  key: string;
  name: string;
  source: SourceKey;
  state: State;
  line: string;
  // What winning it leads to.
  then: string;
  // The holders, or the teams still alive when the seat is open.
  entries: Entry[];
}

export interface SourceView {
  key: SourceKey;
  name: string;
  href: string | null;
  about: string;
  status: string;
  // Where each team stands in it, in words.
  places: Record<number, string>;
}

export interface Slot {
  door: Contest | "anual";
  label: string;
  team: TeamView | null;
  state: State;
}

export interface SeasonMap {
  leader: TeamView;
  summary: string;
  sources: SourceView[];
  seats: SeatView[];
  libertadores: Slot[];
  trofeo: { state: State; line: string; teams: (TeamView | null)[] } | null;
  notes: string[];
  teams: TeamView[];
  contests: { key: Contest; withArticle: string; champion: number | null; alive: number[] }[];
}

const isPending = (m: LeagueMatch) =>
  m.status === "scheduled" || m.status === "live" || m.status === "postponed";

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const list = (xs: string[]) =>
  xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} y ${xs.at(-1)}`;
const upper = (s: string) => s[0].toUpperCase() + s.slice(1);
const comma = (n: number) => n.toFixed(3).replace(".", ",");

// "Octavos de final" -> "los octavos de final"
const phrase = (round: string) =>
  round === "Final"
    ? "la final"
    : round === "Semifinales"
      ? "las semifinales"
      : `los ${round.toLowerCase()}`;

// Single-match ties: goals decide, then penalties.
function winner(m: LeagueMatch) {
  if (m.status !== "finished" || m.homeGoals === null || m.awayGoals === null) return null;
  if (m.homeGoals !== m.awayGoals) return m.homeGoals > m.awayGoals ? m.homeTeamId : m.awayTeamId;
  const { homePenalties: h, awayPenalties: a } = m;
  if (h === null || a === null || h === a) return null;
  return h > a ? m.homeTeamId : m.awayTeamId;
}

function bracket(matches: LeagueMatch[], names: (id: number) => string) {
  const sorted = [...matches].sort((a, b) => a.kickoff.getTime() - b.kickoff.getTime());
  // Latest round each team played, and whether it went out there.
  const reached = new Map<number, { round: string; out: boolean }>();
  for (const m of sorted) {
    const won = winner(m);
    for (const id of [m.homeTeamId, m.awayTeamId]) {
      reached.set(id, { round: roundName(m), out: won !== null && won !== id });
    }
  }
  const final = sorted.find((m) => roundName(m) === "Final");
  const champion = final ? winner(final) : null;
  const alive = champion ? [champion] : [...reached].filter(([, r]) => !r.out).map(([id]) => id);
  const next = sorted.find(isPending);

  let finalLine = "";
  if (final && champion !== null) {
    const home = final.homeTeamId === champion;
    const [gf, ga] = home
      ? [final.homeGoals!, final.awayGoals!]
      : [final.awayGoals!, final.homeGoals!];
    const [pf, pa] = home
      ? [final.homePenalties, final.awayPenalties]
      : [final.awayPenalties, final.homePenalties];
    const penalties = gf === ga ? ` (${pf} a ${pa} en los penales)` : "";
    finalLine = `Ganó la final ${gf} a ${ga}${penalties} contra ${names(home ? final.awayTeamId : final.homeTeamId)}.`;
  }

  const place = (id: number) => {
    const r = reached.get(id);
    if (!r) return "No juega esta etapa.";
    if (champion === id) return "Campeón.";
    if (r.out)
      return r.round === "Final" ? "Perdió la final." : `Quedó afuera en ${phrase(r.round)}.`;
    const own = sorted.find((m) => isPending(m) && (m.homeTeamId === id || m.awayTeamId === id));
    if (own) return `Sigue vivo: juega ${phrase(roundName(own))}.`;
    return alive.length === 2 ? "Es finalista." : "Sigue vivo.";
  };

  return {
    started: sorted.length > 0,
    champion,
    alive,
    finalLine,
    next: next ? { round: roundName(next), day: dayLabel(next.kickoff) } : null,
    place,
  };
}

export function buildSeasonMap(
  data: LeagueData,
  cupMatches: LeagueMatch[],
  config: CompetitionSeason,
  now: Date,
): SeasonMap | null {
  const league = buildLeague(data, config, now);
  const annual = league.tabs.find((t) => t.kind === "table" && t.key === "anual");
  if (annual?.kind !== "table" || !config.annual) return null;
  const averages = league.tabs.find((t) => t.kind === "averages");
  const averageRows: AverageRow[] = averages?.kind === "averages" ? averages.rows : [];

  const views = new Map(data.teams.map((t) => [t.id, { ...t, ...paint(t.id) }]));
  const team = (id: number) => views.get(id)!;
  const doors = config.libertadoresDoors ?? [];
  const annualOver = !data.matches.some((m) => m.phase === "league" && isPending(m));
  const knockouts = (tournament: Contest) =>
    data.matches.filter((m) => m.phase === "knockout" && m.tournament === tournament);
  const brackets: Record<Contest, ReturnType<typeof bracket>> = {
    apertura: bracket(knockouts("apertura"), (id) => team(id).name),
    clausura: bracket(knockouts("clausura"), (id) => team(id).name),
    "copa-argentina": bracket(cupMatches, (id) => team(id).name),
  };

  const rows: TableRow[] = annual.rows;
  const first = rows[0];
  const lastRows = rows.slice(-config.annual.relegated).reverse();
  const worstAverages = averageRows.slice(-(config.averages?.relegated ?? 0)).reverse();
  const annualState: State = annualOver ? "decided" : "today";
  const top = config.zoneLines?.find((l) => "top" in l);
  const spots = top && "top" in top ? top.top : undefined;
  const knockoutsAbout = spots
    ? `Pasan los ${spots} primeros de cada zona a los cruces de eliminación directa.`
    : "";
  const leadsTo = (door: Contest) =>
    [
      doors.includes(door) ? "entra a la Libertadores 2027" : "",
      config.trofeoDeCampeones && door !== "copa-argentina" ? "juega el Trofeo de Campeones" : "",
    ]
      .filter(Boolean)
      .join(" y ");

  function contestLine(key: Contest) {
    const b = brackets[key];
    if (b.champion !== null) return b.finalLine;
    if (!b.started) {
      return key === "copa-argentina"
        ? "Todavía no hay partidos de la copa cargados."
        : `Todavía se juega la fase de zonas. ${knockoutsAbout}`.trim();
    }
    if (!b.next) {
      return b.alive.length === 2
        ? "Ya están los dos finalistas y la final todavía no tiene fecha."
        : `Siguen vivos ${b.alive.length} equipos.`;
    }
    const verb = b.next.round === "Final" ? "se juega" : "se juegan";
    return `Siguen vivos ${b.alive.length} equipos. ${upper(phrase(b.next.round))} ${verb} el ${b.next.day}.`;
  }

  const contestSeat = (key: Contest, name: string): SeatView => {
    const b = brackets[key];
    const decided = b.champion !== null;
    return {
      key: key === "copa-argentina" ? key : `campeon-${key}`,
      name,
      source: key,
      state: decided ? "decided" : "open",
      line: contestLine(key),
      then: leadsTo(key) ? `El campeón ${leadsTo(key)}.` : "",
      entries: b.alive.map((id) => ({ team: team(id), note: "" })),
    };
  };
  const openContests = (["clausura", "copa-argentina"] as const).filter(
    (k) => brackets[k].champion === null && brackets[k].started,
  );

  // Libertadores: the champions first, then down the annual table skipping those already in.
  const taken = new Set(
    (["apertura", "clausura", "copa-argentina"] as const).flatMap((k) => {
      const id = brackets[k].champion;
      return id !== null && doors.includes(k) ? [id] : [];
    }),
  );
  const annualPlaces = rows
    .filter((r) => !taken.has(r.team.id))
    .slice(0, config.annual.libertadores);
  const doorLabel: Record<Contest, string> = {
    apertura: "Campeón del Apertura",
    clausura: "Campeón del Clausura",
    "copa-argentina": "Copa Argentina",
  };
  const libertadores: Slot[] = [
    ...doors.map((door): Slot => {
      const id = brackets[door].champion;
      return {
        door,
        label: doorLabel[door],
        team: id === null ? null : team(id),
        state: id === null ? "open" : "decided",
      };
    }),
    ...annualPlaces.map((r): Slot => ({
      door: "anual",
      label: "Tabla anual",
      team: r.team,
      state: annualState,
    })),
  ];

  const aliveNames = (id: number) =>
    openContests
      .filter((k) => brackets[k].alive.includes(id))
      .map((k) => contestName[k].withArticle);

  const annualEntry = (r: TableRow, extra = ""): Entry => ({
    team: r.team,
    note: `${rows.indexOf(r) + 1}º con ${plural(r.points, "punto", "puntos")} en ${plural(r.played, "partido", "partidos")}.${extra}`,
  });

  const second = rows[1];
  const margin = !second
    ? ""
    : first.points === second.points
      ? ` Igualado en puntos con ${second.team.name}.`
      : ` Le lleva ${plural(first.points - second.points, "punto", "puntos")} a ${second.team.name}.`;
  const pendingCount = data.matches.filter((m) => m.phase === "league" && isPending(m)).length;

  const seats: SeatView[] = [
    contestSeat("apertura", "Campeón del Apertura"),
    contestSeat("clausura", "Campeón del Clausura"),
    ...(doors.includes("copa-argentina")
      ? [
          {
            ...contestSeat("copa-argentina", "Ganador de la Copa Argentina"),
            then: "El ganador entra a la Libertadores 2027.",
          },
        ]
      : []),
    {
      key: "campeon-liga",
      name: "Campeón de Liga",
      source: "anual",
      state: annualState,
      line: annualOver
        ? "Terminó primero en la tabla anual."
        : `Primero en la tabla anual, con ${plural(pendingCount, "partido", "partidos")} por jugarse.${margin}`,
      then: "",
      entries: [annualEntry(first, annualOver ? margin : "")],
    },
    {
      key: "libertadores-anual",
      name: "Libertadores por la tabla anual",
      source: "anual",
      state: annualState,
      line: `Los ${config.annual.libertadores} mejores de la tabla que no entraron por otra vía.`,
      then: "",
      entries: annualPlaces.map((r) => {
        const alive = aliveNames(r.team.id);
        return annualEntry(
          r,
          alive.length
            ? ` Sigue vivo en ${list(alive)}: si gana, entra por ahí y su lugar pasa al siguiente de la tabla.`
            : "",
        );
      }),
    },
    {
      key: "descenso-anual",
      name: "Desciende por la tabla anual",
      source: "anual",
      state: annualState,
      line: "El último de la tabla anual baja a la Primera Nacional.",
      then: "",
      entries: lastRows.map((r) => annualEntry(r)),
    },
    ...(averages
      ? [
          {
            key: "descenso-promedio",
            name: "Desciende por el promedio",
            source: "promedios" as const,
            state: annualState,
            line: "El de peor promedio baja a la Primera Nacional.",
            then: "",
            entries: worstAverages.map((r) => ({
              team: r.team,
              note: `${averageRows.indexOf(r) + 1}º con promedio ${comma(r.average)}: ${plural(r.points, "punto", "puntos")} en ${plural(r.played, "partido", "partidos")}.`,
            })),
          },
        ]
      : []),
  ];

  const relegatedBoth = lastRows.filter((r) => worstAverages.some((w) => w.team.id === r.team.id));
  const notes = relegatedBoth.map(
    (r) =>
      `${r.team.name} está último en la tabla anual y también tiene el peor promedio, así que ocupa un solo lugar de descenso.`,
  );

  const champion = (key: Contest) => {
    const id = brackets[key].champion;
    return id === null ? null : team(id);
  };
  const trofeo = config.trofeoDeCampeones
    ? (() => {
        const teams = [champion("apertura"), champion("clausura")];
        const known = teams.filter((t) => t !== null);
        return {
          state: (known.length === 2 ? "decided" : "open") as State,
          teams,
          line:
            known.length === 2
              ? `Se juega entre ${known[0].name} y ${known[1].name}.`
              : known.length === 1
                ? `Ya está ${known[0].name}. Falta el campeón del ${teams[0] ? "Clausura" : "Apertura"}.`
                : "Faltan los dos campeones.",
        };
      })()
    : null;

  const everyone = new Set([...rows.map((r) => r.team.id), ...brackets["copa-argentina"].alive]);
  const sources: SourceView[] = [
    {
      key: "apertura",
      name: "Apertura",
      href: null,
      about: `Primer torneo del año. ${knockoutsAbout}`.trim(),
      status:
        brackets.apertura.champion !== null
          ? "Terminó"
          : brackets.apertura.started
            ? "En cruces"
            : "En zonas",
      places: {},
    },
    {
      key: "clausura",
      name: "Clausura",
      href: "/liga-profesional",
      about: `Segundo torneo del año. ${knockoutsAbout}`.trim(),
      status:
        brackets.clausura.champion !== null
          ? "Terminó"
          : brackets.clausura.started
            ? "En cruces"
            : "En zonas",
      places: {},
    },
    {
      key: "copa-argentina",
      name: "Copa Argentina",
      href: "/copa-argentina",
      about: "Eliminación directa a un partido.",
      status: brackets["copa-argentina"].champion !== null ? "Terminó" : "En juego",
      places: {},
    },
    {
      key: "anual",
      name: "Tabla anual",
      href: "/liga-profesional#anual",
      about:
        "Suma los puntos de la fase de zonas del Apertura y del Clausura. Los cruces no cuentan.",
      status: annualOver ? "Cerrada" : `Faltan ${plural(pendingCount, "partido", "partidos")}`,
      places: {},
    },
    ...(averages
      ? [
          {
            key: "promedios" as const,
            name: "Promedios",
            href: "/liga-profesional#promedios",
            about: "Puntos por partido de las últimas tres temporadas en Primera.",
            status: annualOver ? "Cerrada" : "En juego",
            places: {},
          },
        ]
      : []),
  ];
  for (const s of sources) {
    for (const id of everyone) {
      const bracketKey = s.key as Contest;
      if (s.key === "anual") {
        const i = rows.findIndex((r) => r.team.id === id);
        if (i >= 0) s.places[id] = `${i + 1}º con ${plural(rows[i].points, "punto", "puntos")}.`;
      } else if (s.key === "promedios") {
        const i = averageRows.findIndex((r) => r.team.id === id);
        if (i >= 0) s.places[id] = `${i + 1}º con promedio ${comma(averageRows[i].average)}.`;
      } else if (brackets[bracketKey].started) {
        s.places[id] = brackets[bracketKey].place(id);
      }
    }
  }

  const points = plural(first.points, "punto", "puntos");
  return {
    leader: first.team,
    summary: `${
      annualOver
        ? `Terminó primero en la tabla anual con ${points} y es el Campeón de Liga.`
        : `Lidera la tabla anual con ${points}.`
    } Acá se ve quién entra a la Libertadores 2027, quién baja y qué falta definir.`,
    sources,
    seats,
    libertadores,
    trofeo,
    notes,
    teams: [...everyone].map(team).sort((a, b) => a.name.localeCompare(b.name, "es")),
    contests: (["apertura", "clausura", "copa-argentina"] as const).map((key) => ({
      key,
      withArticle: contestName[key].withArticle,
      champion: brackets[key].champion,
      alive: brackets[key].alive,
    })),
  };
}

const contestName: Record<Contest, { withArticle: string }> = {
  apertura: { withArticle: "el Apertura" },
  clausura: { withArticle: "el Clausura" },
  "copa-argentina": { withArticle: "la Copa Argentina" },
};

const doorPhrase: Record<Slot["door"], string> = {
  apertura: "como campeón del Apertura",
  clausura: "como campeón del Clausura",
  "copa-argentina": "como ganador de la Copa Argentina",
  anual: "por la tabla anual",
};

// Every seat a team is in, and the one sentence that says so.
export function describeTeam(map: SeasonMap, teamId: number) {
  const name = map.teams.find((t) => t.id === teamId)!.name;
  const holds = (key: string) =>
    map.seats.find((s) => s.key === key)!.entries.some((e) => e.team.id === teamId);
  const state = (key: string) => map.seats.find((s) => s.key === key)!.state;
  const clauses: string[] = [];

  if (holds("campeon-liga")) {
    clauses.push(
      state("campeon-liga") === "decided" ? "es Campeón de Liga" : "sería Campeón de Liga",
    );
  }
  const slot = map.libertadores.find((s) => s.team?.id === teamId);
  if (slot) {
    clauses.push(
      `${slot.state === "decided" ? "ya está" : "entraría"} en la Libertadores 2027 ${doorPhrase[slot.door]}`,
    );
  }
  const byAnnual = holds("descenso-anual");
  const byAverage = holds("descenso-promedio");
  if (byAnnual || byAverage) {
    const done = state(byAnnual ? "descenso-anual" : "descenso-promedio") === "decided";
    const verb = done ? "desciende" : "descendería";
    clauses.push(
      byAnnual && byAverage
        ? `${verb} a la Primera Nacional: es el último de la tabla anual y también tiene el peor promedio`
        : `${verb} a la Primera Nacional por ${byAnnual ? "la tabla anual" : "el promedio"}`,
    );
  }
  if (map.trofeo?.teams.some((t) => t?.id === teamId)) clauses.push("va al Trofeo de Campeones");

  const alive = map.contests.filter((c) => c.champion === null && c.alive.includes(teamId));
  if (alive.length) {
    const where = list(alive.map((c) => `en ${c.withArticle}`));
    // Winning either gives a Libertadores place.
    clauses.push(
      slot ? `sigue vivo ${where}` : `sigue vivo ${where}, que da lugar en la Libertadores 2027`,
    );
  }

  if (!clauses.length) {
    return `${name} no está en ninguna plaza por ahora: ni de Libertadores ni de descenso.`;
  }
  return `${name} ${list(clauses)}.`;
}
