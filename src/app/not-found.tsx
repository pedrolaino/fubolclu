import type { Metadata } from "next";
import Link from "next/link";
import { nobody } from "@/components/empty-page";
import { Hero } from "@/components/hero";
import { h2 } from "@/components/front-page";

export const metadata: Metadata = { title: "Página no encontrada" };

const competitions = [
  ["/liga-profesional", "Liga Profesional"],
  ["/primera-nacional", "Primera Nacional"],
  ["/copa-argentina", "Copa Argentina"],
];

export default function NotFound() {
  return (
    <div>
      <Hero
        subject={nobody}
        title="Página no encontrada"
        summary="No hay nada en esta dirección. Puede que el enlace esté mal escrito o que el equipo o el partido no estén en nuestros datos."
        sticker={false}
      />
      <main className="mx-auto max-w-[1200px] px-4 pt-12 pb-24">
        <h2 className="text-lg font-semibold">
          Las tablas, los partidos y los goleadores están en cada competencia.
        </h2>
        <ul className="mt-4 grid gap-3">
          {competitions.map(([href, label]) => (
            <li key={href}>
              <Link href={href} className={`${h2} hover:underline`}>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
}
