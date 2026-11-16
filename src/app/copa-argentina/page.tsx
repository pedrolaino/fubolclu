import type { Metadata } from "next";
import { Bracket } from "@/components/bracket";
import { Hero } from "@/components/hero";
import { loadCup } from "@/db/cup";
import { paintStyle } from "@/lib/paint";
import { EmptyPage } from "@/components/empty-page";

export const metadata: Metadata = { title: "Copa Argentina" };

export default async function CopaArgentina() {
  const cup = await loadCup();

  if (!cup) {
    return (
      <EmptyPage title="Copa Argentina">
        Todavía no se jugó ningún partido de la Copa Argentina.
      </EmptyPage>
    );
  }
  const { hero, rounds, open } = cup;
  return (
    <div style={paintStyle(hero.subject)}>
      <Hero subject={hero.subject} title={hero.title} summary={hero.summary} />
      <main className="mx-auto max-w-[1200px] px-4 pt-9 pb-20 wide:pt-32">
        <Bracket rounds={rounds} open={open} />
      </main>
    </div>
  );
}
