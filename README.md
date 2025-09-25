# ChivoSpot

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

- `datos/zonas.json`: zonas disponibles con centroides para la detección de cercanía.
- Botones **Abrir ubicación** generan deep-links a Google Maps o Apple Maps según el dispositivo.
- `Usar mi ubicación` detecta tu municipio aproximado y prioriza esa sección en la home.
- PWA ligera (`manifest.json` + `sw.js`) para cachear recursos estáticos opcionalmente.

## Accesibilidad y UX
- HTML5 semántico con roles y mensajes de estado.
- Navegación por teclado con estados de foco visibles.

¡Felices eventos! ✨
