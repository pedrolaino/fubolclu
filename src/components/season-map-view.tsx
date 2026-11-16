"use client";

import Link from "next/link";
import { useState } from "react";
import type { TeamView } from "@/lib/league";
import {
  describeTeam,
  stateLabel,
  type SeasonMap,
  type SeatView,
  type SourceView,
} from "@/lib/season-map";
import { Crest } from "./crest";
import { Hero } from "./hero";

function TeamLink({ team, size = 34 }: { team: TeamView; size?: number }) {
  return (
    <Link href={`/equipos/${team.slug}`} className="inline-flex items-center gap-3 hover:underline">
      <Crest team={team} size={size} />
      <span className="font-semibold">{team.name}</span>
    </Link>
  );
}

function SeatRow({ seat, picked }: { seat: SeatView; picked: number | null }) {
  const hit = picked !== null && seat.entries.some((e) => e.team.id === picked);
  const mute = hit ? "text-faint" : "text-mute";
  // Too many to list by name: crests only, each still a link.
  const crowd = seat.state === "open" && seat.entries.length > 3;
  return (
    <li
      className={`relative border-t-2 border-soft py-4 pr-4 pl-10 first:border-t-0 before:absolute before:top-[30px] before:left-0 before:h-1.5 before:w-7 before:bg-ink ${hit ? "bg-ink text-paper" : ""}`}
    >
      <div className="grid gap-x-8 gap-y-3 wide:grid-cols-[minmax(0,15rem)_1fr]">
        <div>
          <h4
            className={`display text-[30px] wide:text-[34px] ${seat.key === "campeon-liga" && !hit ? "underline decoration-lead decoration-[6px] underline-offset-[6px]" : ""}`}
          >
            {seat.name}
          </h4>
          <p className={`mt-1.5 text-sm font-semibold ${seat.state === "decided" ? "" : mute}`}>
            {stateLabel[seat.state]}
          </p>
        </div>
        <div className="min-w-0">
          {crowd ? (
            <ul className="mb-3 flex flex-wrap gap-x-2 gap-y-3">
              {seat.entries.map(({ team }) => (
                <li key={team.id}>
                  <Link
                    href={`/equipos/${team.slug}`}
                    title={team.name}
                    aria-label={team.name}
                    className="block"
                  >
                    <Crest team={team} size={32} />
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="mb-3 grid gap-2.5">
              {seat.entries.map(({ team, note }) => (
                <li key={team.id}>
                  <TeamLink team={team} />
                  {note && <p className={`mt-0.5 pl-[46px] text-sm ${mute}`}>{note}</p>}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[15px]">{seat.line}</p>
          {seat.then && <p className={`mt-1 text-sm ${mute}`}>{seat.then}</p>}
        </div>
      </div>
    </li>
  );
}

function Source({
  source,
  seats,
  picked,
  children,
}: {
  source: SourceView;
  seats: SeatView[];
  picked: number | null;
  children?: React.ReactNode;
}) {
  const place = picked === null ? undefined : source.places[picked];
  return (
    <section className="border-t-[6px] border-ink pt-4 wide:grid wide:grid-cols-[250px_1fr]">
      <div className="pr-6 pb-4 wide:pb-0">
        <h3 className="display text-[40px]">
          {source.href ? (
            <Link href={source.href} className="hover:underline">
              {source.name}
            </Link>
          ) : (
            source.name
          )}
        </h3>
        <p className="mt-2 text-sm font-semibold">{source.status}</p>
        <p className="mt-1 max-w-[34ch] text-sm text-mute">{source.about}</p>
        {place && (
          <p className="mt-3 inline-block bg-ink px-2 py-1 text-sm font-semibold text-paper">
            {place}
          </p>
        )}
      </div>
      <div>
        <ul className="border-l-[6px] border-ink">
          {seats.map((seat) => (
            <SeatRow key={seat.key} seat={seat} picked={picked} />
          ))}
        </ul>
        {children}
      </div>
    </section>
  );
}

export function SeasonMapView({ map }: { map: SeasonMap }) {
  const [picked, setPicked] = useState<number | null>(null);
  const hit = (team: TeamView | null) => picked !== null && team?.id === picked;

  return (
    <div style={{ "--lead": map.leader.lead } as React.CSSProperties}>
      <Hero subject={map.leader} title={map.leader.name} summary={map.summary} />
      <main className="mx-auto max-w-[1200px] px-4 pt-9 pb-20">
        <div className="mb-12 wide:grid wide:grid-cols-[250px_1fr] wide:items-start">
          <label htmlFor="team" className="display block pb-2 text-[32px]">
            Elegí un equipo
          </label>
          <div>
            <select
              id="team"
              value={picked ?? ""}
              onChange={(e) => setPicked(e.target.value ? Number(e.target.value) : null)}
              className="w-full max-w-sm cursor-pointer border-2 border-ink bg-paper px-3 py-2 text-[17px] font-semibold"
            >
              <option value="">Ninguno</option>
              {map.teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            <p role="status" className="mt-4 min-h-[3.5em] max-w-[52ch] text-xl font-medium">
              {picked === null
                ? "Elegí un equipo y marcamos todo lo que tiene en juego."
                : describeTeam(map, picked)}
            </p>
          </div>
        </div>

        <h2 className="display mb-6 text-[44px] wide:text-[56px]">De dónde sale cada lugar</h2>
        <div className="grid gap-10">
          {map.sources.map((source) => (
            <Source
              key={source.key}
              source={source}
              seats={map.seats.filter((s) => s.source === source.key)}
              picked={picked}
            >
              {source.key === "promedios" &&
                map.notes.map((note) => (
                  <p key={note} className="mt-3 pl-10 text-sm font-semibold">
                    {note}
                  </p>
                ))}
            </Source>
          ))}
        </div>

        <h2 className="display mt-16 mb-6 text-[44px] wide:text-[56px]">Lo que reparten</h2>
        <div className="grid gap-10 wide:grid-cols-2 wide:gap-14">
          <section className="border-t-[6px] border-ink pt-4">
            <h3 className="display text-[40px]">Copa Libertadores 2027</h3>
            <p className="mt-2 mb-3 text-sm text-mute">Seis lugares, cada uno con su puerta.</p>
            <ul>
              {map.libertadores.map((slot) => (
                <li
                  key={`${slot.door}-${slot.team?.id ?? slot.label}`}
                  className={`flex items-center justify-between gap-4 border-t-2 border-soft px-2 py-[7px] ${hit(slot.team) ? "bg-ink text-paper" : ""}`}
                >
                  <span className={`text-sm ${hit(slot.team) ? "text-faint" : "text-mute"}`}>
                    {slot.label}
                  </span>
                  {slot.team ? (
                    <TeamLink team={slot.team} size={30} />
                  ) : (
                    <span className="text-[15px] font-semibold">Por definir</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
          {map.trofeo && (
            <section className="border-t-[6px] border-ink pt-4">
              <h3 className="display text-[40px]">Trofeo de Campeones</h3>
              <p className="mt-2 mb-3 text-sm text-mute">
                Campeón del Apertura contra campeón del Clausura.
              </p>
              <ul>
                {map.trofeo.teams.map((team, i) => (
                  <li
                    key={i}
                    className={`flex items-center justify-between gap-4 border-t-2 border-soft px-2 py-[7px] ${hit(team) ? "bg-ink text-paper" : ""}`}
                  >
                    <span className={`text-sm ${hit(team) ? "text-faint" : "text-mute"}`}>
                      {i === 0 ? "Apertura" : "Clausura"}
                    </span>
                    {team ? (
                      <TeamLink team={team} size={30} />
                    ) : (
                      <span className="text-[15px] font-semibold">Por definir</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[15px]">{map.trofeo.line}</p>
            </section>
          )}
        </div>

        <p className="display mt-16 border-t-[6px] border-ink pt-4 text-[32px] wide:text-[44px]">
          En 2027 se terminan las zonas: los 30 equipos juegan un solo torneo de todos contra todos.
        </p>
      </main>
    </div>
  );
}
