import type { Standing } from "@/lib/team";

const W = 400;
const H = 230;
const pad = { left: 30, right: 12, top: 12, bottom: 28 };

export function PositionChart({ standing }: { standing: Standing }) {
  const { history, size, spots } = standing;
  const first = history[0].matchday;
  const last = history.at(-1)!.matchday;
  const x = (matchday: number) =>
    last === first
      ? W / 2
      : pad.left + ((matchday - first) / (last - first)) * (W - pad.left - pad.right);
  const step = (H - pad.top - pad.bottom) / Math.max(size - 1, 1);
  const y = (position: number) => pad.top + (position - 1) * step;

  const ticks = history.filter(
    (h) =>
      h.matchday === first ||
      h.matchday === last ||
      (h.matchday % 5 === 0 && last - h.matchday > 1),
  );
  const alt = history.map((h) => `fecha ${h.matchday}, ${h.position}º`).join("; ");
  const points = history.map((h) => `${x(h.matchday)},${y(h.position)}`).join(" ");
  const end = history.at(-1)!;

  return (
    <svg
      role="img"
      aria-label={`Posición en cada fecha, de 1º a ${size}º: ${alt}.`}
      viewBox={`0 0 ${W} ${H}`}
      className="h-auto w-full max-w-[480px] overflow-visible"
    >
      {[1, size].map((p) => (
        <g key={p}>
          <line
            x1={pad.left}
            x2={W - pad.right}
            y1={y(p)}
            y2={y(p)}
            stroke="var(--color-soft)"
            strokeWidth={2}
          />
          <text
            x={pad.left - 8}
            y={y(p) + 4}
            textAnchor="end"
            fontSize={12}
            fill="var(--color-mute)"
          >
            {p}º
          </text>
        </g>
      ))}
      {spots && (
        <line
          x1={pad.left}
          x2={W - pad.right}
          y1={y(spots + 0.5)}
          y2={y(spots + 0.5)}
          stroke="var(--color-ink)"
          strokeWidth={4}
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke="var(--lead-ink)"
        strokeWidth={3}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={x(end.matchday)}
        cy={y(end.position)}
        r={6}
        fill="var(--lead-ink)"
        stroke="var(--color-ink)"
        strokeWidth={2}
      />
      {ticks.map((h) => (
        <text
          key={h.matchday}
          x={x(h.matchday)}
          y={H - 6}
          textAnchor="middle"
          fontSize={12}
          fill="var(--color-mute)"
        >
          {h.matchday}
        </text>
      ))}
    </svg>
  );
}
