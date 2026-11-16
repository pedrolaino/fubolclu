import type { StatRow } from "@/lib/match";

export function StatBars({ rows }: { rows: StatRow[] }) {
  return (
    <ul>
      {rows.map((r) => (
        <li key={r.label} className="border-t-2 border-soft py-2.5">
          <div className="flex items-baseline justify-between gap-3">
            <span className="figures text-xl">{r.homeText}</span>
            <span className="text-center text-sm font-semibold">{r.label}</span>
            <span className="figures text-xl">{r.awayText}</span>
          </div>
          <div aria-hidden className="mt-1.5 grid grid-cols-2 gap-1">
            <div className="flex justify-end">
              <span className="h-2 bg-lead" style={{ width: `${r.homeShare * 100}%` }} />
            </div>
            <div>
              <span className="block h-2 bg-ink" style={{ width: `${r.awayShare * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
