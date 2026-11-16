import type { SeasonConfig } from "./types";

export const season2026: SeasonConfig = {
  season: 2026,
  note: "En 2027 se terminan las zonas: los 30 equipos juegan un solo torneo de todos contra todos.",
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
      zoneLines: [{ top: 8, note: "Sobre la línea, los 8 que juegan los octavos de final." }],
      annual: { libertadores: 3, relegated: 1 },
      averages: { relegated: 1 },
      libertadoresDoors: ["apertura", "clausura", "copa-argentina"],
      trofeoDeCampeones: true,
    },
    {
      competition: "primera-nacional",
      leagueId: 110563,
      standings: true,
      rounds: [
        { label: /^Regular Season - (\d+)$/, phase: "league" },
        { label: /./, phase: "knockout" },
      ],
      zoneLines: [
        {
          top: 8,
          note: "Sobre la primera línea, los 8 mejores de la zona. El primero juega la final por el título y el primer ascenso; del segundo al octavo, el Reducido por el segundo ascenso.",
        },
        { bottom: 2, note: "Debajo de la segunda línea, los 2 que descienden." },
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
