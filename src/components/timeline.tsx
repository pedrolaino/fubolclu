import type { EventType } from "@/db/schema";
import type { TimelineEvent } from "@/lib/match";

// Small shapes instead of icons; the event is always written out too.
const marker: Record<EventType, string> = {
  goal: "size-2.5 rounded-full bg-ink",
  penalty_goal: "size-2.5 rounded-full bg-ink",
  own_goal: "size-2.5 rounded-full shadow-[inset_0_0_0_2px_var(--color-ink)]",
  missed_penalty: "size-2.5 rounded-full shadow-[inset_0_0_0_2px_var(--color-faint)]",
  yellow_card: "h-3.5 w-2.5 bg-[#f5c400]",
  red_card: "h-3.5 w-2.5 bg-[#d2202a]",
  substitution: "h-0.5 w-2.5 bg-mute",
};

export function Timeline({
  events,
  homeName,
  awayName,
}: {
  events: TimelineEvent[];
  homeName: string;
  awayName: string;
}) {
  return (
    <ol>
      {events.map((e, i) => {
        const home = e.side === "home";
        return (
          <li
            key={i}
            className="grid grid-cols-[3.25rem_1fr] items-baseline border-t-2 border-soft py-2 wide:grid-cols-[1fr_4.5rem_1fr]"
          >
            <span className="figures col-start-1 row-start-1 text-lg wide:col-start-2 wide:text-center">
              {e.minute}
            </span>
            <span
              className={`col-start-2 row-start-1 ${
                home ? "wide:col-start-1 wide:text-right" : "wide:col-start-3"
              }`}
            >
              <span
                className={`flex items-center gap-2 font-semibold ${home ? "wide:flex-row-reverse" : ""}`}
              >
                <i aria-hidden className={`shrink-0 ${marker[e.type]}`} />
                {e.title}
              </span>
              <span className="block text-[15px]">{e.detail}</span>
              <span className="block text-[13px] text-mute wide:sr-only">
                {home ? homeName : awayName}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
