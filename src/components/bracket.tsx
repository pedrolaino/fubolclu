"use client";

import Link from "next/link";
import { useState } from "react";
import { dayLabel, timeLabel } from "@/lib/dates";
import type { BracketRound, Tie } from "@/lib/cup";
import { Crest } from "./crest";
import { Tabs, tabId } from "./tabs";

function Side({ tie, side }: { tie: Tie; side: "home" | "away" }) {
  const team = tie[side];
  const goals = tie[`${side}Goals`];
  const lost = tie.winner !== null && tie.winner !== side;
  return (
    <span className={`flex items-center gap-2 ${lost ? "text-mute" : ""}`}>
      <Crest team={team} size={26} />
      <span className="min-w-0 flex-1 text-[15px] leading-tight font-semibold">{team.name}</span>
      <span className="figures text-xl">{goals}</span>
    </span>
  );
}

function TieItem({ tie }: { tie: Tie }) {
  const shootout =
    tie.homePenalties !== null && tie.awayPenalties !== null
      ? `${tie.homePenalties}-${tie.awayPenalties} en los penales`
      : null;
  const when =
    tie.status === "postponed"
      ? "Postergado"
      : tie.unconfirmed
        ? "Día y horario a confirmar"
        : tie.status === "scheduled" || tie.status === "live"
          ? `${dayLabel(tie.kickoff)} a las ${timeLabel(tie.kickoff)}`
          : null;
  return (
    <li className="border-t-2 border-soft">
      <Link href={`/partidos/${tie.id}`} className="grid gap-1.5 py-2.5 hover:underline">
        <Side tie={tie} side="home" />
        <Side tie={tie} side="away" />
      </Link>
      {(shootout || when) && <p className="pb-2.5 text-sm text-mute">{shootout ?? when}</p>}
    </li>
  );
}

// One round at a time under 860px, every round side by side above it.
export function Bracket({ rounds, open }: { rounds: BracketRound[]; open: string }) {
  const [current, setCurrent] = useState(open);
  return (
    <section>
      <Tabs
        items={rounds.map((r) => ({ key: r.key, label: r.title }))}
        current={current}
        onSelect={setCurrent}
        panelId="cuadro"
        className="mb-4 gap-x-4 wide:hidden"
      />
      <div
        id="cuadro"
        role="tabpanel"
        aria-labelledby={tabId("cuadro", current)}
        className="wide:grid wide:auto-cols-[minmax(200px,1fr)] wide:grid-flow-col wide:gap-5 wide:overflow-x-auto"
      >
        {rounds.map((r) => (
          <div key={r.key} className={r.key === current ? "" : "hidden wide:block"}>
            <h2 className="display mb-1 hidden text-[32px] wide:block">{r.title}</h2>
            <p className="mb-2.5 text-sm text-mute first-letter:uppercase">{r.day}</p>
            <ul>
              {r.ties.map((t) => (
                <TieItem key={t.id} tie={t} />
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
