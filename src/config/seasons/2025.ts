import type { SeasonConfig } from "./types";

// Only used to compute the 2025 points for the averages table.
export const season2025: SeasonConfig = {
  season: 2025,
  competitions: [
    {
      competition: "liga-profesional",
      leagueId: 109712,
      standings: true,
      rounds: [
        { label: /^1st Phase - (\d+)$/, phase: "league", tournament: "apertura" },
        { label: /^1st Phase - /, phase: "knockout", tournament: "apertura" },
        { label: /^2nd Phase - (\d+)$/, phase: "league", tournament: "clausura" },
        { label: /./, phase: "knockout", tournament: "clausura" },
      ],
    },
  ],
};
