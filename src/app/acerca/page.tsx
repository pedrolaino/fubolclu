import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductGuide } from "./product-guide";
import "./landing.css";

export const metadata: Metadata = {
  title: "Cómo usarlo",
  description:
    "Consultá las tablas del fútbol argentino, abrí la ficha de tu equipo y seguí las definiciones de cada torneo.",
  alternates: { canonical: "https://fubolclu.vercel.app/acerca" },
  openGraph: {
    title: "FubolClú: fútbol argentino",
    description: "Tablas, equipos y partidos.",
    url: "https://fubolclu.vercel.app/acerca",
    type: "website",
    locale: "es_AR",
    images: [{ url: "https://fubolclu.vercel.app/landing/inicio.webp", width: 1440, height: 1666 }],
  },
  twitter: { card: "summary_large_image" },
};

function Arrow() {
  return (
    <svg className="fc-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 12h16m-7-7 7 7-7 7" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <div className="fc-landing">
      <header className="fc-nav">
        <div className="fc-wrap">
          <a className="fc-skip" href="#contenido">
            Saltar al contenido
          </a>
          <Link href="/" className="display fc-wordmark">
            FubolClú
          </Link>
          <a href="#como-usarlo" className="fc-navGuide">
            Cómo usarlo
          </a>
          <Link href="/" prefetch={false} className="fc-navAction">
            Entrar <Arrow />
          </Link>
        </div>
      </header>
      <main id="contenido">
        <section className="fc-hero" aria-labelledby="hero-title">
          <div className="fc-wrap fc-heroGrid">
            <div className="fc-heroCopy">
              <h1 className="display" id="hero-title">
                Fútbol
                <br />
                argentino.
              </h1>
              <Link href="/" prefetch={false} className="fc-button">
                Ver partidos <Arrow />
              </Link>
            </div>
            <Link
              href="/"
              prefetch={false}
              className="fc-appFrame"
              aria-label="Abrir la portada de FubolClú"
            >
              <Image
                src="/landing/inicio.webp"
                alt="Captura de FubolClú con resultados, fixture y tablas"
                width={1440}
                height={1666}
                sizes="(min-width: 1000px) 680px, (min-width: 768px) 55vw, 100vw"
                priority
              />
            </Link>
          </div>
        </section>
        <section id="como-usarlo" className="fc-guide" aria-labelledby="guide-title">
          <div className="fc-wrap">
            <h2 className="display" id="guide-title">
              Cómo usarlo
            </h2>
            <ProductGuide />
            <nav className="fc-competitions" aria-label="Torneos">
              <Link href="/liga-profesional" prefetch={false}>
                <span className="display">Liga Profesional</span>
                <Arrow />
              </Link>
              <Link href="/primera-nacional" prefetch={false}>
                <span className="display">Primera Nacional</span>
                <Arrow />
              </Link>
              <Link href="/copa-argentina" prefetch={false}>
                <span className="display">Copa Argentina</span>
                <Arrow />
              </Link>
            </nav>
          </div>
        </section>
      </main>
    </div>
  );
}
