import { paint } from "@/lib/paint";
import { Hero } from "./hero";

// Stands in for the team in charge on pages that have none.
export const nobody = { id: 0, name: "", slug: "", logoUrl: null, ...paint(0) };

// A page with nothing to show yet keeps the header, so there is a way out of it.
export function EmptyPage({ title, children }: { title: string; children: string }) {
  return (
    <>
      <Hero subject={nobody} title={title} summary={children} sticker={false} />
      <main className="min-h-[30vh]" />
    </>
  );
}
