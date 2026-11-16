# FubolClú: introducción y guía

La página está en `/acerca`. `/` sigue abriendo los partidos y las tablas. El footer incluye un enlace a la introducción.

[Escritorio](landing-desktop.webp) · [Celular](landing-mobile.webp)

## Contenido

La apertura tiene un título, una captura del sitio y el enlace para entrar. La guía permite cambiar entre tablas, equipos y definiciones, con un enlace a la pantalla que muestra cada captura. Al final están los accesos a los torneos.

Se quitaron la sección de la API, las explicaciones de arquitectura, los eslóganes y el segundo logo del cierre. El nombre visible es FubolClú. El repositorio, el paquete, los slugs y los dominios conservan su nombre.

## Revisión de textos

Se aplicó [Humanizer 4.0.0](https://github.com/blader/humanizer/blob/main/SKILL.md) al contenido de la introducción, la guía, los accesos y el footer, incluidos títulos de página, etiquetas accesibles y textos alternativos. Se revisaron esos cuatro bloques completos. La revisión no incluye los relatos deportivos que el sitio genera a partir de los resultados.

Se eliminaron los remates que repetían una idea, las frases sobre el proyecto y las explicaciones que podía mostrar la interfaz. Las etiquetas que quedan nombran una pantalla o una acción. No se añadieron promesas, estadísticas ni testimonios.

La tipografía y los colores conservan la dirección de Taste Skill de la primera propuesta. La guía usa controles de pestañas en lugar del efecto decorativo sobre el título. El informe del auditor de la primera propuesta corresponde a una versión anterior; no se presenta como validación de este diseño.

## Capturas

La portada es una captura del sitio público tomada el 16 de noviembre de 2026. Las imágenes de la guía se obtuvieron renderizando la aplicación con los registros de 2026 que el repositorio conserva en `src/lib/provider/fixtures`, cargados únicamente en una base local descartable. No representan un marcador en vivo. Hay una captura para escritorio y otra para celular en cada vista. La versión de celular muestra el contenido a su tamaño de lectura, en lugar de reducir toda la pantalla de escritorio.

No se usaron secrets de producción ni se consultó la API de fútbol para obtener las imágenes. Los resultados que ve una persona al abrir las secciones siguen saliendo de la base del sitio.

## Verificación de esta revisión

- 172 tests existentes aprobados.
- ESLint, TypeScript, Prettier y compilación de producción aprobados.
- Guía probada en producción a 320, 390, 768, 1024 y 1440 px, sin desborde horizontal ni imágenes rotas.
- Cambio de pestañas con clic y flechas de teclado; enlaces hacia las secciones y regreso desde Acerca; contenido inicial disponible sin JavaScript.
- Sin errores de navegador. El build y las capturas usan una base local descartable.
