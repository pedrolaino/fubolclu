import type { Metadata } from "next";
import { SeasonMapView } from "@/components/season-map-view";
import { loadSeasonMap } from "@/db/season-map";
import { EmptyPage } from "@/components/empty-page";

export const metadata: Metadata = { title: "Cómo se define todo" };

export default async function ComoSeDefine() {
  const map = await loadSeasonMap();
  if (!map)
    return (
      <EmptyPage title="Cómo se define todo">
        Todavía no hay partidos cargados de esta temporada.
      </EmptyPage>
    );
  return <SeasonMapView map={map} />;
}
