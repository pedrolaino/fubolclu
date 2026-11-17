import type { SeasonConfig } from "@/config/seasons/types";
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
import {
  contestName,
  isUpcoming,
  ofContest,
  tableState,
  tieWinner,
  unconfirmedKickoff,
  unplayed,
  withArticle,
} from "@/lib/results";

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
  libertadoresYear: number;
  // The season's closing line, when its config has one.
  note: string | null;
  sources: SourceView[];
  seats: SeatView[];
  libertadores: Slot[];
  trofeo: { state: State; line: string; teams: (TeamView | null)[] } | null;
  notes: string[];
  teams: TeamView[];
  contests: { key: Contest; withArticle: string; champion: number | null; alive: number[] }[];
}

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

function winner(m: LeagueMatch) {
  const side = tieWinner(m);
  return side === null ? null : side === "home" ? m.homeTeamId : m.awayTeamId;
}

function bracket(matches: LeagueMatch[], names: (id: number) => string, now: Date) {
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
  const next = sorted.find((m) => isUpcoming(m, now));
  const tbd = unconfirmedKickoff(matches);

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
    const own = sorted.find((m) => unplayed(m) && (m.homeTeamId === id || m.awayTeamId === id));
    if (own) return `Sigue vivo: juega ${phrase(roundName(own))}.`;
    return alive.length === 2 ? "Es finalista." : "Sigue vivo.";
  };

  return {
    started: sorted.length > 0,
    champion,
    alive,
    finalLine,
    next: next ? { round: roundName(next), day: tbd(next) ? null : dayLabel(next.kickoff) } : null,
    place,
  };
}

export function buildSeasonMap(
  data: LeagueData,
  cupMatches: LeagueMatch[],
  season: SeasonConfig,
  now: Date,
): SeasonMap | null {
  const config = season.competitions.find((c) => c.competition === "liga-profesional");
  if (!config) return null;
  const year = season.season + 1;
  const league = buildLeague(data, config, now);
  const annual = league.tabs.find((t) => t.kind === "table" && t.key === "anual");
  if (annual?.kind !== "table" || !config.annual) return null;
  const averages = league.tabs.find((t) => t.kind === "averages");
  const averageRows: AverageRow[] = averages?.kind === "averages" ? averages.rows : [];

  const views = new Map(data.teams.map((t) => [t.id, { ...t, ...paint(t.id) }]));
  const team = (id: number) => views.get(id)!;
  const doors = config.libertadoresDoors ?? [];
  const leagueMatches = data.matches.filter((m) => m.phase === "league");
  const knockouts = (tournament: Contest) =>
    data.matches.filter((m) => m.phase === "knockout" && m.tournament === tournament);
  const brackets: Record<Contest, ReturnType<typeof bracket>> = {
    apertura: bracket(knockouts("apertura"), (id) => team(id).name, now),
    clausura: bracket(knockouts("clausura"), (id) => team(id).name, now),
    "copa-argentina": bracket(cupMatches, (id) => team(id).name, now),
  };
  // A tournament starts with its first league match.
  const kickedOff = (key: Contest) =>
    leagueMatches.some((m) => m.tournament === key && m.kickoff <= now);

  const rows: TableRow[] = annual.rows;
  const first = rows[0];
  const annualTable = tableState(rows, leagueMatches);
  const annualStarted = annualTable !== "unstarted";
  const annualOver = annualTable === "over";
  // Teams without games have no average and can't be the worst.
  const rankedAverages = averageRows.filter((r) => r.played > 0);
  const worstAverages = rankedAverages.slice(-(config.averages?.relegated ?? 0)).reverse();
  const downByAverage = (id: number) => worstAverages.some((w) => w.team.id === id);
  // A team last in both goes down by the average; its annual place passes up the table.
  const lastRows = annualStarted
    ? rows
        .filter((r) => !downByAverage(r.team.id))
        .slice(-config.annual.relegated)
        .reverse()
    : [];
  const annualState: State = !annualStarted ? "open" : annualOver ? "decided" : "today";
  const averagesState: State = !rankedAverages.length ? "open" : annualOver ? "decided" : "today";
  const top = config.zoneLines?.find((l) => "top" in l);
  const spots = top && "top" in top ? top.top : undefined;
  const knockoutsAbout = spots
    ? `Pasan los ${spots} primeros de cada zona a los cruces de eliminación directa.`
    : "";
  const leadsTo = (door: Contest) =>
    [
      doors.includes(door) ? `entra a la Libertadores ${year}` : "",
      config.trofeoDeCampeones && door !== "copa-argentina" ? "juega el Trofeo de Campeones" : "",
    ]
      .filter(Boolean)
      .join(" y ");

  function contestLine(key: Contest) {
    const b = brackets[key];
    if (b.champion !== null) return b.finalLine;
    if (!b.started) {
      if (key === "copa-argentina") return "Todavía no hay partidos de la copa cargados.";
      if (!kickedOff(key)) return "Todavía no empezó.";
      return `Todavía se juega la fase de zonas. ${knockoutsAbout}`.trim();
    }
    const alive = `${b.alive.length === 1 ? "Sigue vivo" : "Siguen vivos"} ${plural(b.alive.length, "equipo", "equipos")}.`;
    if (!b.next) {
      return b.alive.length === 2
        ? "Ya están los dos finalistas y la final todavía no tiene fecha."
        : alive;
    }
    const one = b.next.round === "Final";
    if (!b.next.day) {
      return `${alive} ${upper(phrase(b.next.round))} todavía no ${one ? "tiene" : "tienen"} fecha confirmada.`;
    }
    return `${alive} ${upper(phrase(b.next.round))} ${one ? "se juega" : "se juegan"} el ${b.next.day}.`;
  }

  const contestSeat = (key: Contest): SeatView => {
    const b = brackets[key];
    const decided = b.champion !== null;
    return {
      key: key === "copa-argentina" ? key : `campeon-${key}`,
      name: key === "copa-argentina" ? `Ganador ${ofContest(key)}` : `Campeón ${ofContest(key)}`,
      source: key,
      state: decided ? "decided" : "open",
      line: contestLine(key),
      then: leadsTo(key) ? `El campeón ${leadsTo(key)}.` : "",
      entries: b.alive.map((id) => ({ team: team(id), note: "" })),
    };
  };
  const openContests = doors.filter((k) => brackets[k].champion === null && brackets[k].started);
  const aliveNames = (id: number) =>
    openContests.filter((k) => brackets[k].alive.includes(id)).map(withArticle);

  // Libertadores: the champions first, then down the annual table skipping those already in.
  // A club holds one place, so a second door it wins frees a place for the annual table.
  const taken = new Set<number>();
  const doorSlots = doors.flatMap((door): Slot[] => {
    const id = brackets[door].champion;
    if (id !== null && taken.has(id)) return [];
    if (id !== null) taken.add(id);
    return [
      {
        door,
        label: door === "copa-argentina" ? contestName(door) : `Campeón ${ofContest(door)}`,
        team: id === null ? null : team(id),
        state: id === null ? "open" : "decided",
      },
    ];
  });
  const annualCount = config.annual.libertadores + doors.length - doorSlots.length;
  const annualPlaces = annualStarted
    ? rows.filter((r) => !taken.has(r.team.id)).slice(0, annualCount)
    : [];
  // The annual places are final only when none of their holders can still get in another way.
  const placesState: State =
    annualState === "decided" && annualPlaces.some((r) => aliveNames(r.team.id).length)
      ? "today"
      : annualState;
  const libertadores: Slot[] = [
    ...doorSlots,
    ...(annualStarted ? annualPlaces : Array<null>(annualCount).fill(null)).map((r): Slot => ({
      door: "anual",
      label: "Tabla anual",
      team: r?.team ?? null,
      state: placesState,
    })),
  ];

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
  const pendingCount = leagueMatches.filter(unplayed).length;
  const nothingPlayed = "Todavía no se jugó ningún partido de la tabla anual.";

  const seats: SeatView[] = [
    contestSeat("apertura"),
    contestSeat("clausura"),
    ...(doors.includes("copa-argentina")
      ? [
          {
            ...contestSeat("copa-argentina"),
            then: `El ganador entra a la Libertadores ${year}.`,
          },
        ]
      : []),
    {
      key: "campeon-liga",
      name: "Campeón de Liga",
      source: "anual",
      state: annualState,
      line: !annualStarted
        ? nothingPlayed
        : annualOver
          ? "Terminó primero en la tabla anual."
          : `Primero en la tabla anual, con ${plural(pendingCount, "partido", "partidos")} por jugarse.${margin}`,
      then: "",
      entries: annualStarted ? [annualEntry(first, annualOver ? margin : "")] : [],
    },
    {
      key: "libertadores-anual",
      name: "Libertadores por la tabla anual",
      source: "anual",
      state: placesState,
      line: `Los ${annualCount} mejores de la tabla que no entraron por otra vía.`,
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
      line: "El último de la tabla anual baja a la Primera Nacional. Si también tiene el peor promedio, baja el anteúltimo.",
      then: "",
      entries: lastRows.map((r) => annualEntry(r)),
    },
    ...(averages
      ? [
          {
            key: "descenso-promedio",
            name: "Desciende por el promedio",
            source: "promedios" as const,
            state: averagesState,
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

  const bottom = rows.at(-1);
  const notes =
    annualStarted && bottom && downByAverage(bottom.team.id) && lastRows[0]
      ? [
          `${bottom.team.name} está último en la tabla anual y también tiene el peor promedio. Baja por el promedio y el lugar de la tabla anual pasa al anteúltimo, ${lastRows[0].team.name}.`,
        ]
      : [];

  const champion = (key: Contest) => {
    const id = brackets[key].champion;
    return id === null ? null : team(id);
  };
  const trofeo = config.trofeoDeCampeones
    ? (() => {
        const [a, c] = [champion("apertura"), champion("clausura")];
        return {
          state: (a && c && a.id !== c.id ? "decided" : "open") as State,
          teams: [a, c],
          // TODO: who plays a club that won both tournaments is not modelled.
          line:
            a && c
              ? a.id === c.id
                ? `${a.name} ganó el Apertura y el Clausura. Su rival todavía no está definido.`
                : `Se juega entre ${a.name} y ${c.name}.`
              : a || c
                ? `Ya está ${(a ?? c)!.name}. Falta el campeón ${ofContest(a ? "clausura" : "apertura")}.`
                : "Faltan los dos campeones.",
        };
      })()
    : null;

  const everyone = new Set([...rows.map((r) => r.team.id), ...brackets["copa-argentina"].alive]);
  const tournamentStatus = (key: Contest) =>
    brackets[key].champion !== null
      ? "Terminó"
      : brackets[key].started
        ? "En cruces"
        : kickedOff(key)
          ? "En zonas"
          : "Todavía no empezó";
  const sources: SourceView[] = [
    {
      key: "apertura",
      name: contestName("apertura"),
      href: null,
      about: `Primer torneo del año. ${knockoutsAbout}`.trim(),
      status: tournamentStatus("apertura"),
      places: {},
    },
    {
      key: "clausura",
      name: contestName("clausura"),
      href: "/liga-profesional",
      about: `Segundo torneo del año. ${knockoutsAbout}`.trim(),
      status: tournamentStatus("clausura"),
      places: {},
    },
    {
      key: "copa-argentina",
      name: contestName("copa-argentina"),
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
      status: annualOver
        ? "Cerrada"
        : `${pendingCount === 1 ? "Falta" : "Faltan"} ${plural(pendingCount, "partido", "partidos")}`,
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
        if (i >= 0) {
          s.places[id] = averageRows[i].played
            ? `${i + 1}º con promedio ${comma(averageRows[i].average)}.`
            : "Todavía no tiene promedio.";
        }
      } else if (brackets[bracketKey].started) {
        s.places[id] = brackets[bracketKey].place(id);
      }
    }
  }

  const points = plural(first.points, "punto", "puntos");
  return {
    leader: first.team,
    summary: `${
      !annualStarted
        ? nothingPlayed
        : annualOver
          ? `Terminó primero en la tabla anual con ${points} y es el Campeón de Liga.`
          : `Lidera la tabla anual con ${points}.`
    } Acá se ve quién entra a la Libertadores ${year}, quién baja y qué falta definir.`,
    libertadoresYear: year,
    note: season.note ?? null,
    sources,
    seats,
    libertadores,
    trofeo,
    notes,
    teams: [...everyone].map(team).sort((a, b) => a.name.localeCompare(b.name, "es")),
    contests: (["apertura", "clausura", "copa-argentina"] as const).map((key) => ({
      key,
      withArticle: withArticle(key),
      champion: brackets[key].champion,
      alive: brackets[key].alive,
    })),
  };
}

const doorPhrase = (door: Slot["door"]) =>
  door === "anual"
    ? "por la tabla anual"
    : `como ${door === "copa-argentina" ? "ganador" : "campeón"} ${ofContest(door)}`;

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
      `${slot.state === "decided" ? "ya está" : "entraría"} en la Libertadores ${map.libertadoresYear} ${doorPhrase(slot.door)}`,
    );
  }
  const byAnnual = holds("descenso-anual");
  const byAverage = holds("descenso-promedio");
  if (byAnnual || byAverage) {
    const done = state(byAnnual ? "descenso-anual" : "descenso-promedio") === "decided";
    const verb = done ? "desciende" : "descendería";
    clauses.push(
      `${verb} a la Primera Nacional por ${byAnnual ? "la tabla anual" : "el promedio"}`,
    );
  }
  if (map.trofeo?.teams.some((t) => t?.id === teamId)) clauses.push("va al Trofeo de Campeones");

  const alive = map.contests.filter((c) => c.champion === null && c.alive.includes(teamId));
  if (alive.length) {
    const where = list(alive.map((c) => `en ${c.withArticle}`));
    // Winning any of them gives a Libertadores place.
    const gives = alive.length === 1 ? "que da" : "que dan";
    clauses.push(
      slot
        ? `sigue vivo ${where}`
        : `sigue vivo ${where}, ${gives} lugar en la Libertadores ${map.libertadoresYear}`,
    );
  }

  if (!clauses.length) {
    return `${name} no está en ninguna plaza por ahora: ni de Libertadores ni de descenso.`;
  }
  return `${name} ${list(clauses)}.`;
}
