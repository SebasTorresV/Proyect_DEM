import { getZonas } from "./data.js";

function distanciaHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function inferirZona(lat, lon) {
  const zonas = await getZonas();
  let minDist = Infinity;
  let zonaCercana = null;
  zonas.forEach((zona) => {
    const dist = distanciaHaversine(lat, lon, zona.lat, zona.lon);
    if (dist < minDist) {
      minDist = dist;
      zonaCercana = zona;
    }
  });
  return zonaCercana;
}

export function solicitarUbicacion() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("La geolocalización no está soportada"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 8000 }
    );
  });
}
