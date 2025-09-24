let cacheEventos = null;
let cacheZonas = null;

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }
  return response.json();
}

export async function getEventos() {
  if (!cacheEventos) {
    cacheEventos = await fetchJSON("./datos/eventos.json");
  }
  return cacheEventos;
}

export async function getZonas() {
  if (!cacheZonas) {
    cacheZonas = await fetchJSON("./datos/zonas.json");
  }
  return cacheZonas;
}

export async function getEventosPorZona(zonaSlug) {
  const eventos = await getEventos();
  return eventos.filter((evento) => evento.zona === zonaSlug);
}

export async function getEventoBySlug(slug) {
  const eventos = await getEventos();
  return eventos.find((evento) => evento.slug === slug);
}

export function filtrarPorFecha(eventos, rango) {
  if (!rango) return eventos;
  const { start, end } = rango;
  return eventos.filter((evento) => {
    const fecha = new Date(evento.fechaInicio);
    return fecha >= start && fecha <= end;
  });
}

export function filtrarPorCategoria(eventos, categoria) {
  if (!categoria || categoria === "todas") return eventos;
  return eventos.filter((evento) => evento.categoria === categoria);
}

export function filtrarPorPrecio(eventos, filtroPrecio) {
  if (!filtroPrecio || filtroPrecio === "todos") return eventos;
  if (filtroPrecio === "gratis") {
    return eventos.filter((evento) => evento.precioMin === 0 && evento.precioMax === 0);
  }
  return eventos.filter((evento) => evento.precioMax > 0);
}
