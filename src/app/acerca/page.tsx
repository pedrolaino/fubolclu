import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LandingMotion } from "./landing-motion";
import "./landing.css";

export const metadata: Metadata = {
  title: "El fútbol argentino, en orden",
  description:
    "Conocé FubolClu: tablas, fixture y goleadores del fútbol argentino, con tabla anual, promedios y un mapa de cómo se define la temporada.",
  alternates: { canonical: "https://fubolclu.vercel.app/acerca" },
  openGraph: {
    title: "FubolClu — El fútbol argentino, en orden",
    description: "Los partidos, las tablas y lo que se juega en cada torneo.",
    url: "https://fubolclu.vercel.app/acerca",
    type: "website",
    locale: "es_AR",
    images: [
      { url: "https://fubolclu.vercel.app/landing/portada.webp", width: 1440, height: 1666 },
    ],
  },
  twitter: { card: "summary_large_image" },
  other: { "page-type": "software", "site-kind": "software" },
};

function Arrow({ diagonal = false }: { diagonal?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="fc-arrow">
      <path
        d={diagonal ? "M5 19 19 5M5 5h14v14" : "M4 12h16m-7-7 7 7-7 7"}
        stroke="currentColor"
        strokeWidth="1.6"
      />
    </svg>
  );
}

const competitions = [
  {
    href: "/liga-profesional",
    title: "Liga Profesional",
    detail: "Zonas, tabla anual, promedios y goleadores",
    tag: "Primera división",
  },
  {
    href: "/primera-nacional",
    title: "Primera Nacional",
    detail: "Las dos zonas, la final y el Reducido",
    tag: "El ascenso",
  },
  {
    href: "/copa-argentina",
    title: "Copa Argentina",
    detail: "El cuadro completo, ronda por ronda",
    tag: "La copa",
  },
  {
    href: "/como-se-define",
    title: "Cómo se define todo",
    detail: "Campeones, cupos a copas y descensos",
    tag: "La temporada",
  },
];

export default function AboutPage() {
  return (
    <div className="fc-landing">
      <LandingMotion />
      <header className="fc-nav">
        <div className="fc-wrap">
          <a className="fc-skip" href="#contenido">
            Saltar al contenido
          </a>
          <Link href="/" className={`fc-wordmark display`}>
            FubolClu
          </Link>
          <nav aria-label="Acerca de FubolClu" className="fc-navLinks">
            <a href="#tablas">Las tablas</a>
            <a href="#datos">Los datos</a>
            <a href="#torneos">Los torneos</a>
          </nav>
          <Link href="/" prefetch={false} className="fc-navAction">
            Ver el fútbol <Arrow />
          </Link>
        </div>
      </header>

      <main id="contenido">
        <section className={`fc-hero hero`} data-enter aria-labelledby="hero-title">
          <div className="fc-wrap">
            <div className="fc-heroTop">
              <p>3 torneos. Tablas, fixture y goleadores.</p>
              <p>Fútbol argentino / Proyecto abierto</p>
            </div>
            <div className="fc-heroGrid">
              <div className="fc-heroCopy">
                <h1 id="hero-title" className="display">
                  El fútbol <br />
                  argentino,
                  <br />
                  <span>en orden.</span>
                </h1>
                <p className="fc-lead">
                  Seguí los partidos y entendé qué se juega en la Liga Profesional, la Primera
                  Nacional y la Copa Argentina.
                </p>
                <Link href="/" prefetch={false} className="fc-button">
                  Ver el fútbol <Arrow />
                </Link>
              </div>
              <Link
                href="/"
                prefetch={false}
                className="fc-appFrame"
                aria-label="Ver la portada de FubolClu"
              >
                <div className="fc-browserBar">
                  <span aria-hidden="true">● ● ●</span>
                  <span>fubolclu.vercel.app</span>
                  <Arrow diagonal />
                </div>
                <div className="fc-screenshot">
                  <Image
                    src="/landing/portada.webp"
                    alt="Portada de FubolClu con Godoy Cruz, los próximos cruces y los últimos resultados"
                    width={1440}
                    height={1666}
                    sizes="(min-width: 1100px) 700px, (min-width: 700px) 60vw, 100vw"
                    priority
                  />
                </div>
              </Link>
            </div>
            <div className="fc-heroFoot">
              <span>Del resultado a la tabla. De la tabla a lo que viene.</span>
              <a href="#tablas">
                Conocé el proyecto <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
        </section>

        <section id="tablas" className="fc-tables" aria-labelledby="tables-title">
          <div className="fc-wrap">
            <div className="fc-sectionHead">
              <h2 id="tables-title" className="display">
                Cada punto
                <br />
                tiene consecuencias.
              </h2>
              <p>
                FubolClu calcula la tabla anual y los promedios a partir de los resultados. El
                formato de cada temporada vive en el código.
              </p>
            </div>
            <div className="fc-featureGrid">
              <article className="fc-feature">
                <div
                  className="fc-tableVisual"
                  role="img"
                  aria-label="La tabla anual suma Apertura y Clausura"
                >
                  <span className="fc-visualLabel">Tabla anual</span>
                  <div className="fc-sum">
                    <span className="display">Apertura</span>
                    <span aria-hidden="true">+</span>
                    <span className="display">Clausura</span>
                  </div>
                  <div className="fc-total">
                    <span>Los puntos de la temporada</span>
                    <span aria-hidden="true">=</span>
                  </div>
                </div>
                <h3 className="display">La anual y los promedios</h3>
                <p>
                  Los puntos del año y el promedio de las últimas tres temporadas, calculados desde
                  los partidos.
                </p>
              </article>
              <article className="fc-feature">
                <div
                  className="fc-seasonVisual"
                  role="img"
                  aria-label="El mapa de la temporada reúne campeones, Libertadores y descensos"
                >
                  <span className="fc-visualLabel">Cómo se define todo</span>
                  <div>
                    <span>Campeones</span>
                    <Arrow diagonal />
                  </div>
                  <div>
                    <span>Libertadores</span>
                    <Arrow diagonal />
                  </div>
                  <div>
                    <span>Descensos</span>
                    <Arrow diagonal />
                  </div>
                </div>
                <h3 className="display">El mapa de la temporada</h3>
                <p>
                  Quién ocupa cada lugar y con qué criterio: títulos, clasificación a copas y
                  permanencia.
                </p>
              </article>
            </div>
            <Link href="/como-se-define" prefetch={false} className="fc-textLink">
              Ver cómo se define todo <Arrow />
            </Link>
          </div>
        </section>

        <section id="datos" className="fc-data" aria-labelledby="data-title">
          <div className="fc-wrap">
            <div className="fc-sectionHead">
              <h2 id="data-title" className="display">
                Los datos también
                <br />
                tienen un límite.
              </h2>
              <p>
                Highlightly permite 100 requests por día en su plan gratuito. FubolClu usa hasta 90
                y guarda los resultados en su base.
              </p>
            </div>
            <div className="fc-budgetGrid">
              <div
                className="fc-budget"
                role="img"
                aria-label="Presupuesto de sincronización: 90 de 100 requests diarios, con 10 de margen"
              >
                <div className="fc-budgetNumber" aria-label="90 de 100 requests diarios">
                  <span className="display">90</span>
                  <span>/ 100</span>
                </div>
                <div className="fc-meter" aria-hidden="true">
                  <span />
                </div>
                <p>
                  Tope diario de sincronización.
                  <br />
                  10 requests quedan como margen.
                </p>
              </div>
              <div className="fc-pipeline">
                <div>
                  <span className="fc-pipelineNumber">01</span>
                  <div>
                    <h3>Priorizar las consultas</h3>
                    <p>
                      Primero, partidos y tablas. El presupuesto restante completa goles, tarjetas y
                      estadísticas.
                    </p>
                  </div>
                </div>
                <div>
                  <span className="fc-pipelineNumber">02</span>
                  <div>
                    <h3>Guardar en Postgres</h3>
                    <p>La sincronización conserva los datos para que cada visita lea la base.</p>
                  </div>
                </div>
                <div>
                  <span className="fc-pipelineNumber">03</span>
                  <div>
                    <h3>Consultar desde la web</h3>
                    <p>
                      Navegar el sitio no consume requests a la API de fútbol. Los detalles se
                      completan por etapas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="fc-codeLine">
              <span>Next.js · TypeScript · Drizzle · Postgres</span>
              <a href="https://github.com/pedrolaino/fubolclu" className="fc-textLink">
                Ver el código <Arrow diagonal />
              </a>
            </div>
          </div>
        </section>

        <section id="torneos" className="fc-competitions" aria-labelledby="competitions-title">
          <div className="fc-wrap">
            <div className="fc-sectionHead">
              <h2
                id="competitions-title"
                className="display"
                data-moment="liquid-type"
                data-moment-opts='{"strength":0.3}'
              >
                Elegí tu torneo.
              </h2>
              <p>
                De la primera fecha a la definición.
                <br />
                Entrá a las tablas, los cruces y los resultados.
              </p>
            </div>
            <div className="fc-competitionList">
              {competitions.map((competition) => (
                <Link
                  key={competition.href}
                  href={competition.href}
                  prefetch={false}
                  className="fc-competition"
                >
                  <span className="fc-competitionTag">{competition.tag}</span>
                  <div>
                    <h3 className="display">{competition.title}</h3>
                    <p>{competition.detail}</p>
                  </div>
                  <Arrow diagonal />
                </Link>
              ))}
            </div>
            <div className="fc-closing">
              <span className="display">FubolClu</span>
              <p>
                Un proyecto sobre el fútbol argentino.
                <br />Y sobre cómo contar lo que pasa.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
