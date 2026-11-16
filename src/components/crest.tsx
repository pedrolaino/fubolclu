import Image from "next/image";
import { ViewTransition } from "react";
import type { TeamView } from "@/lib/league";

// Decorative: the team's name is always written next to it.
export function Crest({
  team,
  size,
  className = "sticker",
  shared = false,
  eager = false,
}: {
  team: TeamView;
  size: number;
  className?: string;
  // Morphs into the same team's crest on the next page; at most one per team on a page.
  shared?: boolean;
  // For the hero sticker, which is the biggest thing on the first screen.
  eager?: boolean;
}) {
  const crest = team.logoUrl ? (
    <Image
      src={team.logoUrl}
      alt=""
      width={size}
      height={size}
      // Crests are a few KB each; nothing to gain from the optimizer.
      unoptimized
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      className={`shrink-0 object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  ) : (
    <span
      aria-hidden
      className={`inline-block shrink-0 rounded-full ${className}`}
      style={{ width: size, height: size, background: team.lead }}
    />
  );
  if (!shared) return crest;
  return (
    <ViewTransition name={`crest-${team.id}`} share="morph" default="none">
      {crest}
    </ViewTransition>
  );
}
