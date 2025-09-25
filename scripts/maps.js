const IOS_REGEX = /iPad|iPhone|iPod/;
let leafletModule;

export function linkMapa(lat, lon) {
  if (typeof lat !== "number" || typeof lon !== "number") {
    return "https://www.google.com/maps";
  }
  const coords = `${lat},${lon}`;
  if (typeof navigator !== "undefined" && IOS_REGEX.test(navigator.userAgent)) {
    return `http://maps.apple.com/?daddr=${coords}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${coords}`;
}

export async function initLeaflet(puntos = []) {
  if (!puntos.length) return null;
  try {
    if (!leafletModule) {
      leafletModule = await import("https://unpkg.com/leaflet@1.9.4/dist/leaflet-src.esm.js");
    }
    const map = leafletModule.map("map");
    leafletModule
      .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors',
      })
      .addTo(map);
    const markers = puntos.map((p) =>
      leafletModule.marker([p.lat, p.lon]).addTo(map).bindPopup(`<strong>${p.titulo}</strong><br>${p.lugar}`)
    );
    const bounds = leafletModule.latLngBounds(markers.map((marker) => marker.getLatLng()));
    map.fitBounds(bounds, { padding: [32, 32] });
    return { map, leaflet: leafletModule, markers };
  } catch (error) {
    console.warn("Leaflet no disponible", error);
    return null;
  }
}

export function actualizarMarcadores(mapContext, puntos = []) {
  if (!mapContext || !mapContext.leaflet) return;
  const { map, leaflet } = mapContext;
  map.eachLayer((layer) => {
    if (layer instanceof leaflet.Marker) {
      map.removeLayer(layer);
    }
  });
  const markers = puntos.map((p) =>
    leaflet.marker([p.lat, p.lon]).addTo(map).bindPopup(`<strong>${p.titulo}</strong><br>${p.lugar}`)
  );
  if (markers.length) {
    const bounds = leaflet.latLngBounds(markers.map((marker) => marker.getLatLng()));
    map.fitBounds(bounds, { padding: [32, 32] });
  }
}
