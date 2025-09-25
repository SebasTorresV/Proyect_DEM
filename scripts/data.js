const STORAGE_KEYS = {
  EVENTOS: "chivospot_eventos",
};

let cacheEventosBase = null;
let cacheEventosCombinados = null;
let cacheZonas = null;

function tieneLocalStorage() {
  try {
    return typeof window !== "undefined" && "localStorage" in window && window.localStorage !== null;
  } catch (error) {
    console.warn("LocalStorage no disponible", error);
    return false;
  }
}

function leerStorage(key) {
  if (!tieneLocalStorage()) return [];
  try {
    const data = window.localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`No se pudo leer ${key}`, error);
    return [];
  }
}

function escribirStorage(key, value) {
  if (!tieneLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`No se pudo guardar ${key}`, error);
  }
}

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }
  return response.json();
}

function normalizarNumero(valor, fallback = 0) {
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : fallback;
}

function normalizarEvento(evento) {
  return {
    ...evento,
    lat: normalizarNumero(evento.lat, 0),
    lon: normalizarNumero(evento.lon, 0),
    precioMin: normalizarNumero(evento.precioMin, 0),
    precioMax: normalizarNumero(evento.precioMax, evento.precioMin ?? 0),
    imagen: evento.imagen && evento.imagen.trim() ? evento.imagen : "./assets/img/placeholder-evento.svg",
  };
}

function combinarEventos(base, persistidos) {
  const mapa = new Map();
  base.forEach((evento) => {
    mapa.set(evento.slug, normalizarEvento(evento));
  });
  persistidos.forEach((evento) => {
    mapa.set(evento.slug, normalizarEvento(evento));
  });
  return Array.from(mapa.values());
}

function invalidarEventos() {
  cacheEventosCombinados = null;
}

async function getEventosBase() {
  if (!cacheEventosBase) {
    const base = await fetchJSON("./datos/eventos.json");
    cacheEventosBase = Array.isArray(base) ? base.map(normalizarEvento) : [];
  }
  return cacheEventosBase;
}

function getEventosPersistidos() {
  return leerStorage(STORAGE_KEYS.EVENTOS).map(normalizarEvento);
}

function guardarEventosPersistidos(eventos) {
  escribirStorage(STORAGE_KEYS.EVENTOS, eventos);
  invalidarEventos();
}

export function obtenerStorageKeys() {
  return { ...STORAGE_KEYS };
}

export async function getEventos() {
  if (!cacheEventosCombinados) {
    const [base, persistidos] = await Promise.all([getEventosBase(), getEventosPersistidos()]);
    cacheEventosCombinados = combinarEventos(base, persistidos);
  }
  return cacheEventosCombinados.slice().sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio));
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

export async function createEvento(evento) {
  const eventosPersistidos = getEventosPersistidos();
  const nuevo = normalizarEvento(evento);
  eventosPersistidos.push(nuevo);
  guardarEventosPersistidos(eventosPersistidos);
  return nuevo;
}

export async function updateEvento(slug, cambios) {
  const eventosTodos = await getEventos();
  const existente = eventosTodos.find((evento) => evento.slug === slug);
  if (!existente) {
    throw new Error("El evento no existe");
  }
  const actualizado = normalizarEvento({ ...existente, ...cambios });
  const eventosPersistidos = getEventosPersistidos();
  const index = eventosPersistidos.findIndex((evento) => evento.slug === slug);
  if (index === -1) {
    eventosPersistidos.push(actualizado);
  } else {
    eventosPersistidos[index] = actualizado;
  }
  guardarEventosPersistidos(eventosPersistidos);
  return actualizado;
}

export function deleteEvento(slug) {
  const eventosPersistidos = getEventosPersistidos().filter((evento) => evento.slug !== slug);
  guardarEventosPersistidos(eventosPersistidos);
}

export function resetEventosPersistidos() {
  guardarEventosPersistidos([]);
}

export function obtenerEventosPersistidos() {
  return getEventosPersistidos();
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
