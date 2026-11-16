import Link from "next/link";
import type { Tie } from "@/lib/cup";
import type { Day, FrontMatch, Side } from "@/lib/front-page";
import type { ScorerRow, TableRow, TeamView } from "@/lib/league";
import { stateLabel, type SeatView } from "@/lib/season-map";
import { Crest } from "./crest";

export const h2 = "display text-[44px] wide:text-[56px]";
const h3 = "display text-[30px] wide:text-[34px]";

const sections = [
  ["/liga-profesional", "Liga Profesional", "Zonas, tabla anual, promedios y goleadores"],
  ["/primera-nacional", "Primera Nacional", "Las dos zonas y el Reducido"],
  ["/copa-argentina", "Copa Argentina", "El cuadro, ronda por ronda"],
  ["/como-se-define", "Cómo se define todo", "Campeones, Libertadores y descensos"],
];

// What the site is and where to go, right under the hero.
export function SectionIndex() {
  return (
    <nav aria-label="Secciones" className="border-t-[6px] border-ink pt-4 wide:mt-14">
      <p className="text-lg font-medium">Tablas, fixture y goleadores del fútbol argentino.</p>
      <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 wide:grid-cols-4 wide:gap-x-8">
        {sections.map(([href, name, about]) => (
          <li key={href}>
            <Link href={href} className="group block">
              <span className="display block text-[28px] group-hover:underline wide:text-[30px]">
                {name}
              </span>
              <span className="mt-2 block text-[15px] text-mute">{about}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Score({ m }: { m: FrontMatch }) {
  if (m.status === "postponed" || m.status === "cancelled") {
    return (
      <span className="text-center text-[13px] text-mute">
        {m.status === "postponed" ? "Postergado" : "Suspendido"}
      </span>
    );
  }
  if (m.homeGoals === null || m.awayGoals === null) {
    return (
      <span className="figures text-center text-[17px] text-mute">
        {m.unconfirmed ? "vs" : m.time}
      </span>
    );
  }
  return (
    <span className="figures text-center text-xl">
      {m.homeGoals}-{m.awayGoals}
    </span>
  );
}

function MatchRow({ m }: { m: FrontMatch }) {
  const note =
    m.homePenalties !== null && m.awayPenalties !== null
      ? `${m.homePenalties}-${m.awayPenalties} en los penales`
      : m.status === "live"
        ? "En juego"
        : null;
  return (
    <li className="border-t-2 border-soft">
      <Link
        href={`/partidos/${m.id}`}
        className="grid grid-cols-[1fr_72px_1fr] items-center py-[7px] text-sm font-semibold hover:underline wide:text-[15px]"
      >
        <span className="flex min-w-0 items-center justify-end gap-2">
          <span className="truncate">{m.home.name}</span>
          <Crest team={m.home} size={26} />
        </span>
        <Score m={m} />
        <span className="flex min-w-0 items-center gap-2">
          <Crest team={m.away} size={26} />
          <span className="truncate">{m.away.name}</span>
        </span>
      </Link>
      {note && <p className="pb-2 text-center text-[13px] text-mute">{note}</p>}
    </li>
  );
}

function DayBlock({ day }: { day: Day }) {
  return (
    <div className="mt-6">
      <h3 className="display text-[26px] first-letter:uppercase">{day.day}</h3>
      {day.groups.map((g) => (
        <div key={g.label} className="mt-2">
          <p className="mb-1 text-[13px] font-semibold text-mute">{g.label}</p>
          <ul>
            {g.matches.map((m) => (
              <MatchRow key={m.id} m={m} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function MatchDays({ title, side, empty }: { title: string; side: Side; empty: string }) {
  return (
    <section>
      <h2 className={h2}>{title}</h2>
      {side.days.length ? (
        side.days.map((d) => <DayBlock key={d.day} day={d} />)
      ) : (
        <p className="mt-4">{empty}</p>
      )}
      {side.more.map((c) => (
        <p key={c.href} className="mt-3 text-sm font-semibold">
          Hay {c.count === 1 ? "1 partido más" : `${c.count} partidos más`} de la{" "}
          <Link href={c.href} className="underline">
            {c.name}
          </Link>
          .
        </p>
      ))}
    </section>
  );
}

const th = "pb-1.5 text-[13px] font-semibold text-mute";

// Position, team, played and points: the zone table cut to what fits beside another.
export function ZoneTable({
  title,
  href,
  rows,
  lines,
}: {
  title: string;
  href: string;
  rows: TableRow[];
  lines: number[];
}) {
  return (
    <section className="min-w-0">
      <h3 className={h3}>
        <Link href={href} className="hover:underline">
          {title}
        </Link>
      </h3>
      <table className="mt-2 w-full border-collapse tabular-nums">
        <thead>
          <tr>
            <th className={`${th} text-left`} colSpan={2}>
              Equipo
            </th>
            <th className={`${th} text-right`}>PJ</th>
            <th className={`${th} text-right`}>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={r.team.id}
              className={`border-t-2 border-soft ${lines.includes(i + 1) ? "border-b-[6px] border-b-ink" : ""}`}
            >
              <td
                className={`display w-8 py-[5px] text-[22px] ${lines.length && i >= lines[0] ? "text-faint" : ""}`}
              >
                {i + 1}
              </td>
              <td className="max-w-0 py-[5px] text-[15px] font-semibold">
                <Link
                  href={`/equipos/${r.team.slug}`}
                  className="flex items-center gap-2.5 hover:underline"
                >
                  <Crest team={r.team} size={24} />
                  <span className="truncate">{r.team.name}</span>
                </Link>
              </td>
              <td className="w-9 py-[5px] text-right text-sm font-medium">{r.played}</td>
              <td className="display w-11 py-[5px] text-right text-[24px]">{r.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function TopScorers({ rows, note }: { rows: ScorerRow[]; note?: string }) {
  return (
    <section>
      <h3 className={h3}>
        <Link href="/liga-profesional#goleadores" className="hover:underline">
          Goleadores
        </Link>
      </h3>
      <ol className="mt-3">
        {rows.map((r, i) => (
          <li
            key={`${r.playerName}-${r.team.id}`}
            className="grid grid-cols-[2rem_1fr_auto] items-center gap-x-2.5 border-t-2 border-soft py-[7px]"
          >
            <span className="display text-[24px]">{i + 1}</span>
            <Link
              href={`/equipos/${r.team.slug}`}
              className="flex min-w-0 items-center gap-2.5 hover:underline"
            >
              <Crest team={r.team} size={28} />
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-semibold">{r.playerName}</span>
                <span className="block truncate text-[13px] font-medium text-mute">
                  {r.team.name}
                </span>
              </span>
            </Link>
            <span className="display text-[30px]">{r.goals}</span>
          </li>
        ))}
      </ol>
      {note && <p className="mt-3 text-sm font-semibold">{note}</p>}
    </section>
  );
}

function TeamName({ team }: { team: TeamView }) {
  return (
    <Link href={`/equipos/${team.slug}`} className="font-semibold hover:underline">
      {team.name}
    </Link>
  );
}

function Seat({ seat }: { seat: SeatView }) {
  const settled = seat.state !== "open";
  // An open seat with many teams still alive shows them as a crowd of small crests.
  const crowd = seat.entries.length > 3;
  const teams = seat.entries.map((e) => e.team);
  return (
    <li className={`border-t-[6px] pt-4 ${settled ? "border-ink" : "border-faint"}`}>
      <h3 className="display text-[34px] wide:text-[40px]">{seat.name}</h3>
      <p className={`mt-1.5 text-sm font-semibold ${seat.state === "decided" ? "" : "text-mute"}`}>
        {stateLabel[seat.state]}
      </p>
      {crowd ? (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {teams.map((team) => (
            <li key={team.id} title={team.name}>
              <Link href={`/equipos/${team.slug}`} aria-label={team.name} className="block">
                <Crest team={team} size={30} />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 flex items-center gap-4">
          <span className="flex shrink-0 -space-x-3">
            {teams.map((team, i) => (
              <span key={team.id} className={i % 2 ? "-rotate-6" : "rotate-[8deg]"}>
                <Crest team={team} size={teams.length > 1 ? 56 : 64} />
              </span>
            ))}
          </span>
          <p className="text-lg leading-snug">
            {teams.map((team, i) => (
              <span key={team.id}>
                {i > 0 && (i === teams.length - 1 ? " y " : ", ")}
                <TeamName team={team} />
              </span>
            ))}
          </p>
        </div>
      )}
      <p className="mt-4 max-w-[40ch] text-[15px]">{seat.line}</p>
    </li>
  );
}

export function SeasonStrip({ seats, notes }: { seats: SeatView[]; notes: string[] }) {
  return (
    <section>
      <h2 className="display text-[64px] wide:text-[128px]">
        <Link href="/como-se-define" className="hover:underline">
          Cómo viene el año
        </Link>
      </h2>
      <ul className="mt-6 grid gap-x-10 gap-y-12 wide:mt-10 wide:grid-cols-3">
        {seats.map((seat) => (
          <Seat key={seat.key} seat={seat} />
        ))}
      </ul>
      {notes.map((note) => (
        <p key={note} className="mt-6 text-sm font-semibold">
          {note}
        </p>
      ))}
      <p className="mt-8">
        <Link href="/como-se-define" className="text-lg font-semibold underline">
          Ver de dónde sale cada lugar de la Libertadores y del descenso
        </Link>
      </p>
    </section>
  );
}

export function ZoneLeader({
  title,
  href,
  row,
  summary,
}: {
  title: string;
  href: string;
  row: TableRow;
  summary: string;
}) {
  return (
    <section className="border-t-2 border-soft pt-3">
      <h3 className={h3}>
        <Link href={href} className="hover:underline">
          {title}
        </Link>
      </h3>
      <div className="mt-3 flex items-center gap-4">
        <Crest team={row.team} size={56} />
        <div className="min-w-0 flex-1">
          <TeamName team={row.team} />
          <p className="mt-0.5 text-[15px]">{summary}</p>
        </div>
        <p className="text-right">
          <span className="display block text-[56px]">{row.points}</span>
          <span className="text-[13px] font-semibold text-mute">puntos</span>
        </p>
      </div>
    </section>
  );
}

function TieSide({ tie, side }: { tie: Tie; side: "home" | "away" }) {
  const team = tie[side];
  const lost = tie.winner !== null && tie.winner !== side;
  return (
    <span className={`flex items-center gap-2 ${lost ? "text-mute" : ""}`}>
      <Crest team={team} size={26} />
      <span className="min-w-0 flex-1 text-[15px] leading-tight font-semibold">{team.name}</span>
      <span className="figures text-xl">{tie[`${side}Goals`]}</span>
    </span>
  );
}

export function CupRound({ title, ties }: { title: string; ties: Tie[] }) {
  return (
    <div>
      <h3 className={h3}>{title}</h3>
      <ul className="mt-2">
        {ties.map((t) => (
          <li key={t.id} className="border-t-2 border-soft">
            <Link href={`/partidos/${t.id}`} className="grid gap-1.5 py-2.5 hover:underline">
              <TieSide tie={t} side="home" />
              <TieSide tie={t} side="away" />
            </Link>
            {t.homePenalties !== null && t.awayPenalties !== null && (
              <p className="pb-2.5 text-sm text-mute">
                {t.homePenalties}-{t.awayPenalties} en los penales
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
