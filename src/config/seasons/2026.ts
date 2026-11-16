import type { SeasonConfig } from "./types";

export const season2026: SeasonConfig = {
  season: 2026,
  competitions: [
    {
      competition: "liga-profesional",
      leagueId: 109712,
      standings: true,
      rounds: [
        // The provider labels Apertura matchdays "Regular Season - N", except matchday 9.
        { label: /^(?:Regular Season|Apertura) - (\d+)$/, phase: "league", tournament: "apertura" },
        { label: /^Apertura - /, phase: "knockout", tournament: "apertura" },
        { label: /^Clausura - (\d+)$/, phase: "league", tournament: "clausura" },
        { label: /./, phase: "knockout", tournament: "clausura" },
      ],
    },
    {
      competition: "primera-nacional",
      leagueId: 110563,
      standings: true,
      rounds: [
        { label: /^Regular Season - (\d+)$/, phase: "league" },
        { label: /./, phase: "knockout" },
      ],
    },
    {
      competition: "copa-argentina",
      leagueId: 111414,
      standings: false,
      rounds: [{ label: /./, phase: "knockout" }],
    },
  ],
};
