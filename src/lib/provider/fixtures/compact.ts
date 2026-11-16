// The league-phase fixtures store one row per match to stay small; this rebuilds the provider page shape.
export interface CompactMatches {
  teams: Record<string, string>;
  matches: (string | number | null)[][];
}

export function toProviderPage({ teams, matches }: CompactMatches) {
  const team = (id: number) => ({ id, name: teams[id], logo: null });
  return {
    data: matches.map(([id, round, date, home, away, score, description]) => ({
      id,
      round,
      date,
      state: { score: { current: score, penalties: null }, description },
      homeTeam: team(home as number),
      awayTeam: team(away as number),
    })),
    pagination: { totalCount: matches.length, offset: 0, limit: matches.length },
  };
}
