# Landing de FubolClu

`GATE: OPEN 18 (rounds used up)`. El resultado completo y todas las observaciones están en [landing-audit.txt](landing-audit.txt). No es un pase total del auditor visual.

[Vista de escritorio](landing-desktop.webp) · [Vista de celular](landing-mobile.webp).

La propuesta está en `/acerca`, en la rama `feat/landing-acerca`. La portada `/`, las pantallas de los torneos y el acceso a los datos conservan su implementación.

## Decisiones de diseño

- Negro y blanco, Barlow para texto y Barlow Condensed 800 italic para títulos, como pidió el brief y usa el sitio.
- Una captura real de la portada, tomada el 16 de noviembre de 2026, convertida a WebP (112 KiB). Es una imagen editorial, no una tabla en vivo. Se puede reemplazar cuando se complete la carga de datos, sin cambiar el diseño.
- Cuatro bloques: presentación, tablas calculadas, presupuesto de requests y enlaces a las cuatro secciones existentes.
- Entrada breve del título, respuesta al puntero de los enlaces y el momento `liquid-type` de Taste Skill en “Elegí tu torneo”, con intensidad baja. En celular y con movimiento reducido queda estático. El contenido también se puede leer sin JavaScript.
- Textos en español argentino, centrados en el producto. Los datos técnicos salen del README y del código: 100 requests permitidos, tope de sincronización de 90, persistencia en Postgres y tablas calculadas desde los resultados. No se inventaron posiciones, equipos, estadísticas ni testimonios.

## Taste Skill

Se instaló con el comando oficial:

```sh
npx skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend --agent codex --yes
```

Versión: 2.5.1; commit de origen: `f6b76575f949707b4e3c37cd86cb44b0b98643e8`.

Se usaron sus guías de copy, jerarquía, composición, movimiento, accesibilidad y revisión en navegador. Los cuatro archivos de `public/landing/taste/moments` son copias sin modificar, con la licencia MIT en `public/landing/taste/LICENSE`.

El brief y la integración existente prevalecen sobre algunas reglas de la skill: se conservan las tipografías, los colores y el footer compartido; el proyecto sigue siendo una aplicación Next.js con base de datos, sin convertirlo en un export estático. El sorteo propuso un collage triptych, Mona Sans, chalk-tomato y liquid-type. Se retuvo liquid-type y se adaptó el hero a la captura grande solicitada. No se agregaron shaders ni una nueva hoja de estilos global para el sitio: todos los selectores propios están prefijados con `fc-`.

El auditor de Taste Skill exige su propio shell `.wrap`, una única línea de columnas en toda la página y un footer de una pantalla completa. Esas observaciones se registran como diferencias con su plantilla, no como verificaciones aprobadas. También interpreta “TODO” dentro de “Cómo se define todo” como un placeholder: es el nombre real de la sección, indicado por el usuario. La otra excepción es la entrada CSS propia, en lugar de la marca global `html.m-enter` de la skill.

## Verificación

- 172 tests existentes aprobados.
- TypeScript, formato y lint del código de la aplicación aprobados.
- Compilación de producción aprobada con Postgres local y el esquema de las migraciones.
- Navegador: escritorio, tablet y celular, desde 320 hasta 1440 px. Sin desborde horizontal; apertura completa a 390 × 844.
- Prueba de navegación de producción aprobada: cuatro destinos, anclas, teclado, retorno a la ruta, movimiento reducido, contenido sin JavaScript y cero errores de navegador. No se detectaron requests al proveedor de fútbol.
- Auditor de rendimiento de la skill: 0 FAIL y 5 WARN en una corrida local (no es una medición de campo). Advierte 644 KiB de JavaScript parseado, cinco archivos de fuentes y un CLS de 0,103 en la carga de escritorio. Las fuentes y el layout raíz se conservan del proyecto.
- ESLint completo: 0 errores y 2 advertencias de exportación anónima en las copias sin modificar del kit.
- La prueba local usa una base descartable sin datos de producción. No se cargaron secrets, no se ejecutó la sincronización y no se hicieron consultas a Highlightly.

No hacen falta fotografías ni materiales adicionales del cliente. La captura de la portada puede actualizarse después de la siguiente sincronización.
