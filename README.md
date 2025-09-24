# ChivoSpot

Portal estático de eventos locales que puedes abrir directamente con tu navegador. Incluye home con secciones por zona (Santa Tecla, San Salvador, Merliot), fichas detalladas por evento y páginas con filtros y mapa opcional por zona.

## Estructura principal
- `index.html`: inicio con carruseles por zona, botón **Usar mi ubicación** y enlaces rápidos.
- `lugar.html`: lista completa de eventos filtrada por zona con filtros de fecha/categoría/precio y opción de mapa.
- `evento.html`: ficha detallada con guardar, compartir y botón **Abrir ubicación**.
- `datos/`: fuentes de datos en JSON (eventos y zonas con coordenadas).
- `scripts/`: módulos ES para datos, utilidades, geolocalización, mapas y páginas.
- `styles/`: estilos globales, layout y componentes.

## Quickstart local
1. **Abrir directamente**: descarga o clona el repositorio y abre `index.html` en tu navegador.
2. **Servir estáticamente** (recomendado para evitar bloqueos de `fetch`):
   ```bash
   # Opción 1 (Python)
   # python3 -m http.server 4173

   # Opción 2 (Node.js http-server)
   # npx http-server -p 4173
   ```
   Luego visita `http://localhost:4173`.

## Datos y funciones clave
- `datos/eventos.json`: 15 eventos con fechas dentro de los próximos 60 días, precios, coordenadas y categorías.
- `datos/zonas.json`: zonas disponibles con centroides para la detección de cercanía.
- Botones **Abrir ubicación** generan deep-links a Google Maps o Apple Maps según el dispositivo.
- `Usar mi ubicación` detecta tu municipio aproximado y prioriza esa sección en la home.
- PWA ligera (`manifest.json` + `sw.js`) para cachear recursos estáticos opcionalmente.

## Accesibilidad y UX
- HTML5 semántico con roles y mensajes de estado.
- Navegación por teclado con estados de foco visibles.
- Estados vacíos amigables cuando no hay eventos para un filtro dado.

¡Felices eventos! ✨
