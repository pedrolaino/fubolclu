import Link from "next/link";
import { timeLabel } from "@/lib/dates";
import type { Round } from "@/lib/league";
import { Crest } from "./crest";

export function RoundList({ round }: { round: Round }) {
  return (
    <section className="mb-11">
      <h2 className="display text-[40px]">{round.title}</h2>
      <p className="mt-2 mb-2.5 text-sm text-mute first-letter:uppercase">{round.day}</p>
      <ul>
        {round.matches.map((m) => {
          const played = m.homeGoals !== null && m.awayGoals !== null;
          return (
            <li key={m.id} className="border-t-2 border-soft">
              <Link
                href={`/partidos/${m.id}`}
                className="grid grid-cols-[1fr_56px_1fr] items-center py-[7px] text-sm font-semibold hover:underline"
              >
                <span className="flex min-w-0 items-center justify-end gap-2">
                  <span className="truncate">{m.home.name}</span>
                  <Crest team={m.home} size={26} />
                </span>
                <span
                  className={`figures text-center ${played ? "text-xl" : "text-[17px] text-mute"}`}
                >
                  {played ? `${m.homeGoals}-${m.awayGoals}` : timeLabel(m.kickoff)}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <Crest team={m.away} size={26} />
                  <span className="truncate">{m.away.name}</span>
                </span>
              </Link>
              {m.homePenalties !== null && m.awayPenalties !== null && (
                <p className="pb-2 text-center text-[13px] text-mute">
                  {m.homePenalties}-{m.awayPenalties} en los penales
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
