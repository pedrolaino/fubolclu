"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import type { AverageRow, Result, ScorerRow, Tab, TableRow, TeamView } from "@/lib/league";
import { Crest } from "./crest";
import { Hero } from "./hero";
import { Tabs, tabId } from "./tabs";
import { paintStyle } from "@/lib/paint";

const resultName: Record<Result, string> = { W: "Ganó", D: "Empató", L: "Perdió" };
const resultDot: Record<Result, string> = {
  W: "bg-ink",
  D: "bg-faint",
  L: "shadow-[inset_0_0_0_2px_var(--color-faint)]",
};

const th = "px-2 pt-4 pb-2 text-[13px] font-semibold text-mute";
const num = "px-2 py-[7px] text-right font-medium";
const big = "display px-2 py-[7px] text-[28px] wide:text-[34px]";
const secondary = "hidden wide:table-cell";

function TeamCell({ team, children }: { team: TeamView; children?: React.ReactNode }) {
  return (
    <td className="px-2 py-[7px] text-[15px] font-semibold wide:text-[17px] wide:whitespace-nowrap">
      <Link
        href={`/equipos/${team.slug}`}
        className="inline-flex items-center gap-3 hover:underline"
      >
        <Crest team={team} size={34} shared={!children} />
        {children ?? team.name}
      </Link>
    </td>
  );
}

// Rows keep their identity per team, so switching tables moves them instead of redrawing.
function Row({
  id,
  position,
  below,
  line,
  children,
}: {
  id: string | number;
  position: number;
  below: boolean;
  line: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.tr
      layout="position"
      layoutId={`row-${id}`}
      transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      className={`border-t-2 border-soft ${line ? "border-b-[6px] border-b-ink" : ""}`}
    >
      <td className={`${big} w-10 wide:w-[52px] ${below ? "text-faint" : ""}`}>{position}</td>
      {children}
    </motion.tr>
  );
}

function StandingsRows({ rows, lines }: { rows: TableRow[]; lines: number[] }) {
  return rows.map((r, i) => {
    const diff = r.goalsFor - r.goalsAgainst;
    return (
      <Row
        key={r.team.id}
        id={r.team.id}
        position={i + 1}
        below={lines.length > 0 && i >= lines[0]}
        line={lines.includes(i + 1)}
      >
        <TeamCell team={r.team} />
        <td className={num}>{r.played}</td>
        <td className={`${num} ${secondary}`}>{r.won}</td>
        <td className={`${num} ${secondary}`}>{r.drawn}</td>
        <td className={`${num} ${secondary}`}>{r.lost}</td>
        <td className={`${num} ${secondary}`}>
          {r.goalsFor}:{r.goalsAgainst}
        </td>
        <td className={num}>{diff > 0 ? `+${diff}` : diff}</td>
        <td className={`${num} ${secondary}`}>
          <span aria-hidden className="inline-flex gap-[3px]">
            {r.form.map((result, j) => (
              <i key={j} className={`size-2.5 rounded-full ${resultDot[result]}`} />
            ))}
          </span>
          <span className="sr-only">{r.form.map((result) => resultName[result]).join(", ")}</span>
        </td>
        <td className={`${big} w-12 text-right wide:w-16 ${i === 0 ? "text-lead-ink" : ""}`}>
          {r.points}
        </td>
      </Row>
    );
  });
}

function AverageRows({ rows, lines }: { rows: AverageRow[]; lines: number[] }) {
  return rows.map((r, i) => (
    <Row key={r.team.id} id={r.team.id} position={i + 1} below={false} line={lines.includes(i + 1)}>
      <TeamCell team={r.team} />
      <td className={`${num} ${secondary}`}>{r.points}</td>
      <td className={`${num} ${secondary}`}>{r.played}</td>
      <td className={`${big} w-24 text-right ${i === rows.length - 1 ? "text-lead-ink" : ""}`}>
        {r.played ? r.average.toFixed(3).replace(".", ",") : "–"}
      </td>
    </Row>
  ));
}

function ScorerRows({ rows }: { rows: ScorerRow[] }) {
  return rows.map((r, i) => (
    <Row
      key={`${r.playerName}-${r.team.id}`}
      id={`${r.playerName}-${r.team.id}`}
      position={i + 1}
      below={false}
      line={false}
    >
      <TeamCell team={r.team}>
        <span>
          {r.playerName}
          <span className="block text-[13px] font-medium text-mute">{r.team.name}</span>
        </span>
      </TeamCell>
      <td className={num}>{r.penalties || ""}</td>
      <td className={`${big} w-16 text-right ${i === 0 ? "text-lead-ink" : ""}`}>{r.goals}</td>
    </Row>
  ));
}

const headings: Record<Tab["kind"], [string, boolean][]> = {
  table: [
    ["PJ", false],
    ["G", true],
    ["E", true],
    ["P", true],
    ["Goles", true],
    ["Dif", false],
    ["Últimos 5", true],
    ["Pts", false],
  ],
  averages: [
    ["Pts", true],
    ["PJ", true],
    ["Promedio", false],
  ],
  scorers: [
    ["De penal", false],
    ["Goles", false],
  ],
};

function onHash(callback: () => void) {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
}

export function LeagueView({ tabs, children }: { tabs: Tab[]; children?: React.ReactNode }) {
  // The open table lives in the hash, so /liga-profesional#anual is a link to it.
  const hash = useSyncExternalStore(
    onHash,
    () => window.location.hash.slice(1),
    () => "",
  );
  const tab = tabs.find((t) => t.key === hash) ?? tabs[0];
  const open = (key: string) => window.location.replace(`#${key}`);

  return (
    <div style={paintStyle(tab.subject)}>
      <Hero subject={tab.subject} title={tab.title} summary={tab.summary} />
      <main className="mx-auto grid max-w-[1200px] gap-10 px-4 pt-9 pb-20 wide:grid-cols-[minmax(0,1fr)_340px] wide:gap-14">
        <section>
          <Tabs
            items={tabs}
            current={tab.key}
            onSelect={open}
            panelId="tabla"
            className="mb-1.5 gap-x-4 wide:gap-x-[22px]"
          />
          <table
            id="tabla"
            role="tabpanel"
            aria-labelledby={tabId("tabla", tab.key)}
            className="w-full border-collapse tabular-nums"
          >
            <thead>
              <tr>
                <th className={`${th} text-left`} colSpan={2}>
                  {tab.kind === "scorers" ? "Jugador" : "Equipo"}
                </th>
                {headings[tab.kind].map(([label, hide]) => (
                  <th key={label} className={`${th} text-right ${hide ? secondary : ""}`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tab.kind === "table" && <StandingsRows rows={tab.rows} lines={tab.lines} />}
              {tab.kind === "averages" && <AverageRows rows={tab.rows} lines={tab.lines} />}
              {tab.kind === "scorers" && <ScorerRows rows={tab.rows} />}
            </tbody>
          </table>
          {tab.notes.map((note) => (
            <p key={note} className="mt-3 text-sm font-semibold">
              {note}
            </p>
          ))}
        </section>
        {children}
      </main>
    </div>
  );
}
