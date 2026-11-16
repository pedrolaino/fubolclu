import Image from "next/image";
import type { TeamView } from "@/lib/league";

// Decorative: the team's name is always written next to it.
export function Crest({
  team,
  size,
  className = "sticker",
}: {
  team: TeamView;
  size: number;
  className?: string;
}) {
  if (!team.logoUrl) {
    return (
      <span
        aria-hidden
        className={`inline-block shrink-0 rounded-full ${className}`}
        style={{ width: size, height: size, background: team.lead }}
      />
    );
  }
  return (
    <Image
      src={team.logoUrl}
      alt=""
      width={size}
      height={size}
      // Crests are a few KB each; nothing to gain from the optimizer.
      unoptimized
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
