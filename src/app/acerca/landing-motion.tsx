"use client";

import { useEffect } from "react";

// The skill's modules stay unbundled and only mount on this route.
export function LandingMotion() {
  useEffect(() => {
    const root = document.querySelector(".fc-landing");
    if (!root) return;
    let disposed = false;
    let teardown: (() => void) | undefined;
    const momentUrl = "/landing/taste/moments/moments.js";
    import(/* webpackIgnore: true */ momentUrl)
      .then((module) => {
        if (disposed) return;
        teardown = () => module.unmountAll(root);
        return module.mountAll(root);
      })
      .catch((error) => console.warn("No se pudo iniciar la animación de la landing.", error));
    return () => {
      disposed = true;
      teardown?.();
    };
  }, []);
  return null;
}
