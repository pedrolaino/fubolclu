import Link from "next/link";
import type { Result } from "@/lib/league";
import type { Fixture } from "@/lib/team";
import { Crest } from "./crest";

const resultName: Record<Result, string> = { W: "Ganó", D: "Empató", L: "Perdió" };
const resultDot: Record<Result, string> = {
  W: "bg-ink",
  D: "bg-faint",
  L: "shadow-[inset_0_0_0_2px_var(--color-faint)]",
};

const statusText: Partial<Record<Fixture["status"], string>> = {
  live: "En juego",
  postponed: "Postergado",
  cancelled: "Suspendido",
};

export function FixtureList({ title, fixtures }: { title: string; fixtures: Fixture[] }) {
  return (
    <section className="mb-11">
      <h2 className="display mb-2.5 text-[40px]">{title}</h2>
      <ul>
        {fixtures.map((f) => {
          const scored = f.homeGoals !== null && f.awayGoals !== null;
          const showScore = scored && (f.status === "finished" || f.status === "live");
          return (
            <li key={f.id} className="border-t-2 border-soft">
              <Link
                href={`/partidos/${f.id}`}
                className="grid grid-cols-[4.75rem_1fr_auto] items-center gap-x-2 py-2 hover:underline"
              >
                <span className="text-sm font-semibold">{f.date}</span>
                <span className="flex min-w-0 items-center gap-3">
                  <Crest team={f.rival} size={30} />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{f.rival.name}</span>
                    <span className="block truncate text-[13px] text-mute">
                      {f.competition}, {f.round.toLowerCase()}, de {f.home ? "local" : "visitante"}
                    </span>
                  </span>
                </span>
                <span className="flex items-center justify-end gap-3">
                  {statusText[f.status] && (
                    <span className="text-[13px] text-mute">{statusText[f.status]}</span>
                  )}
                  {showScore ? (
                    <span className="figures text-xl">
                      {f.homeGoals}-{f.awayGoals}
                    </span>
                  ) : f.status === "scheduled" ? (
                    <span className="figures text-[17px] text-mute">{f.time}</span>
                  ) : null}
                  {f.result && (
                    <>
                      <i
                        aria-hidden
                        title={resultName[f.result]}
                        className={`size-2.5 rounded-full ${resultDot[f.result]}`}
                      />
                      <span className="sr-only">{resultName[f.result]}</span>
                    </>
                  )}
                </span>
                {f.homePenalties !== null && f.awayPenalties !== null && (
                  <span className="col-span-2 col-start-2 pb-0.5 text-[13px] text-mute">
                    {f.homePenalties}-{f.awayPenalties} en los penales
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
