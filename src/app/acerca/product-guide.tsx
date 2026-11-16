"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const views = [
  {
    key: "tablas",
    label: "Tablas",
    action: "Abrir tablas",
    href: "/liga-profesional#anual",
    alt: "Captura de la Liga Profesional: pestañas para cambiar entre zonas, tabla anual y promedios",
  },
  {
    key: "equipos",
    label: "Equipos",
    action: "Ver River Plate",
    href: "/equipos/river-plate",
    alt: "Captura de la ficha de River Plate: posición por fecha y resultados",
  },
  {
    key: "definiciones",
    label: "Definiciones",
    action: "Ver cómo se define todo",
    href: "/como-se-define",
    alt: "Captura de Cómo se define todo: campeones, clasificación a copas y descensos",
  },
];

export function ProductGuide() {
  const [selected, setSelected] = useState(0);
  const view = views[selected];
  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const next =
      event.key === "ArrowRight"
        ? (index + 1) % views.length
        : event.key === "ArrowLeft"
          ? (index + views.length - 1) % views.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? views.length - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    setSelected(next);
    document.getElementById(`guide-tab-${views[next].key}`)?.focus();
  }
  return (
    <div className="fc-tour">
      <div className="fc-tourHead">
        <div role="tablist" aria-label="Cómo usar FubolClú" className="fc-tourTabs">
          {views.map((item, index) => (
            <button
              key={item.key}
              id={`guide-tab-${item.key}`}
              role="tab"
              aria-selected={selected === index}
              aria-controls="guide-panel"
              tabIndex={selected === index ? 0 : -1}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => onKeyDown(event, index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <Link href={view.href} prefetch={false} className="fc-tourAction">
          {view.action}
          <svg className="fc-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 19 19 5M5 5h14v14" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </Link>
      </div>
      <div id="guide-panel" role="tabpanel" aria-labelledby={`guide-tab-${view.key}`} tabIndex={0}>
        <Link href={view.href} prefetch={false} aria-label={view.action} className="fc-tourScreen">
          <picture>
            <source
              media="(max-width: 639px)"
              srcSet={`/landing/guide/${view.key}-mobile.webp`}
              width={390}
              height={520}
            />
            <Image
              src={`/landing/guide/${view.key}.webp`}
              alt={view.alt}
              width={1280}
              height={720}
              sizes="(max-width: 639px) 100vw, 1200px"
              unoptimized
              className="fc-guideImage"
            />
          </picture>
        </Link>
      </div>
    </div>
  );
}
