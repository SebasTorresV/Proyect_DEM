# ChivoSpot

Portal estático de eventos locales que puedes abrir directamente con tu navegador. Incluye una home con secciones por zona (Santa Tecla, San Salvador y Merliot), fichas detalladas por evento, panel de zona con filtros y, ahora, paneles específicos para **Administradores** y **Organizadores** que permiten crear y gestionar eventos sin backend.

## Estructura principal
- `index.html`: inicio con carruseles por zona, botón **Usar mi ubicación** y acceso rápido al panel.
- `lugar.html`: lista completa de eventos filtrada por zona con filtros de fecha/categoría/precio y opción de mapa.
- `evento.html`: ficha detallada con guardar, compartir, organizador responsable y botón **Abrir ubicación**.
- `acceso.html`: pantalla de inicio de sesión para administradores y organizadores.
- `admin.html`: panel para administrar organizadores y gestionar eventos (crear, editar, eliminar, asignar responsables).
- `organizador.html`: panel para crear eventos propios y consultar métricas personales.
- `datos/`: fuentes de datos en JSON (`eventos` sin registros iniciales y `zonas` con coordenadas).
- `scripts/`: módulos ES para datos, utilidades, geolocalización, mapas y lógica de cada panel.
- `styles/`: estilos globales, layout y componentes reutilizables.

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

> Los datos de eventos y usuarios se almacenan en `localStorage`, por lo que todo funciona sin backend. Borra el almacenamiento del navegador para reiniciar el demo.

## Roles y permisos
- **Administrador**
  - Credenciales por defecto: `admin@chivospot.com / admin123`.
  - Puede crear cuentas de organizadores, asignar eventos, editar información y eliminar publicaciones.
  - Ve un resumen del sistema con métricas globales.
- **Organizador**
  - Solo puede crear nuevos eventos y consultar estadísticas personales (total creados, próximos y precio promedio).
  - Visualiza la lista de eventos publicados bajo su cuenta.

## Datos y funciones clave
- `datos/eventos.json`: colección vacía para arrancar sin datos ficticios. Los eventos creados desde los paneles se guardan en `localStorage` y se combinan con el archivo base si existieran datos precargados.
- `datos/zonas.json`: zonas disponibles con centroides para la detección de cercanía.
- Botones **Abrir ubicación** generan deep-links a Google Maps o Apple Maps según el dispositivo.
- `Usar mi ubicación` detecta tu municipio aproximado y prioriza esa sección en la home.
- PWA ligera (`manifest.json` + `sw.js`) para cachear recursos estáticos opcionalmente.

## Accesibilidad y UX
- HTML5 semántico con roles y mensajes de estado.
- Navegación por teclado con estados de foco visibles.
- Estados vacíos amigables cuando aún no existen eventos o cuando los filtros no arrojan resultados.

¡Felices eventos! ✨
