import type { TeamPage } from "@/lib/team";

const row = "flex items-baseline justify-between border-t-2 border-soft py-1.5";

export function TeamAside({
  standing,
  scorers,
}: {
  standing: NonNullable<TeamPage["standing"]>;
  scorers: NonNullable<TeamPage["scorers"]>;
}) {
  const { record } = standing;
  return (
    <aside className="wide:pt-16">
      <section className="mb-11">
        <h2 className="display text-[40px]">Goleadores</h2>
        {scorers.rows.length ? (
          <ol className="mt-3">
            {scorers.rows.map((s) => (
              <li key={s.playerName} className={row}>
                <span className="font-semibold">
                  {s.playerName}
                  {s.penalties > 0 && (
                    <span className="block text-[13px] font-medium text-mute">
                      {s.penalties === 1 ? "1 de penal" : `${s.penalties} de penal`}
                    </span>
                  )}
                </span>
                <span className="display text-[28px] tabular-nums">{s.goals}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-3 text-mute">{scorers.empty}</p>
        )}
        {scorers.note && <p className="mt-3 text-sm font-semibold">{scorers.note}</p>}
      </section>
      <section>
        <h2 className="display text-[40px]">Su campaña</h2>
        <dl className="mt-3">
          {(
            [
              ["Jugados", record.played],
              ["Ganados", record.won],
              ["Empatados", record.drawn],
              ["Perdidos", record.lost],
              ["Goles a favor", record.goalsFor],
              ["Goles en contra", record.goalsAgainst],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className={row}>
              <dt className="font-semibold">{label}</dt>
              <dd className="display text-[28px] tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </aside>
  );
}
