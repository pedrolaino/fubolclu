import type { Metadata } from "next";
import { SeasonMapView } from "@/components/season-map-view";
import { loadSeasonMap } from "@/db/season-map";

export const metadata: Metadata = { title: "Cómo se define todo" };

export default async function ComoSeDefine() {
  const map = await loadSeasonMap();
  if (!map) return <p className="p-4">Todavía no hay partidos cargados de esta temporada.</p>;
  return <SeasonMapView map={map} />;
}
