import {
  getEventosPorZona,
  getZonas,
  filtrarPorFecha,
  filtrarPorCategoria,
  filtrarPorPrecio,
} from "./data.js";
import {
  qs,
  fmtFecha,
  fmtPrecio,
  formatAddress,
  slugToName,
  todayRange,
  weekendRange,
  daysRange,
  isWithinRange,
} from "./utils.js";
import { linkMapa, initLeaflet, actualizarMarcadores } from "./maps.js";

const zoneTitle = document.querySelector("#zoneTitle");
const eventsList = document.querySelector("#eventsList");
const emptyState = document.querySelector("#emptyState");
const yearCopy = document.querySelector("#yearCopy");
const btnViewMap = document.querySelector("#btnViewMap");
const mapSection = document.querySelector("#mapSection");
const filterChips = Array.from(document.querySelectorAll(".chip"));
const categoriaSelect = document.querySelector("#categoriaSelect");
const precioSelect = document.querySelector("#precioSelect");

let eventosZona = [];
let zonas = [];
let mapaContexto = null;
let slugZona = qs("slug") || "santa-tecla";
let rangoActivo = null;
let eventosVisibles = [];

function createCard(evento) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `
    <img src="${evento.imagen}" alt="${evento.titulo}" loading="lazy">
    <div class="card-content">
      <h3>${evento.titulo}</h3>
      <div class="card-meta">
        <span>${fmtFecha(evento.fechaInicio)}</span>
        <span>${formatAddress(evento)}</span>
        <span>${fmtPrecio(evento.precioMin, evento.precioMax)}</span>
      </div>
    </div>
    <div class="card-actions">
      <a class="btn btn-secondary" href="${linkMapa(evento.lat, evento.lon)}" target="_blank" rel="noopener">Abrir ubicación</a>
      <a class="btn btn-primary" href="./evento.html?slug=${evento.slug}">Ver detalles</a>
    </div>
  `;
  return article;
}

function aplicarFiltros() {
  let filtrados = [...eventosZona];
  if (rangoActivo) {
    filtrados = filtrarPorFecha(filtrados, rangoActivo);
  }
  filtrados = filtrarPorCategoria(filtrados, categoriaSelect?.value);
  filtrados = filtrarPorPrecio(filtrados, precioSelect?.value);
  eventosVisibles = filtrados;
  renderLista(filtrados);
  if (!mapSection.hidden && mapaContexto) {
    actualizarMarcadores(mapaContexto, filtrados);
  }
}

function renderLista(eventos) {
  eventsList.innerHTML = "";
  if (!eventos.length) {
    emptyState.hidden = false;
    if (!eventosZona.length) {
      emptyState.textContent = `Aún no hay eventos publicados en ${slugToName(slugZona, zonas)}. Cuando un organizador cree uno aparecerá aquí.`;
    } else {
      const hayProximos = eventosZona.some((evento) => isWithinRange(evento.fechaInicio, daysRange(30)));
      emptyState.textContent = hayProximos
        ? `No hay eventos que coincidan con tus filtros en ${slugToName(slugZona, zonas)}.`
        : `No hay eventos hoy en ${slugToName(slugZona, zonas)} — mira los próximos.`;
    }
    return;
  }
  emptyState.hidden = true;
  eventos
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
    .forEach((evento) => eventsList.appendChild(createCard(evento)));
}

async function cargarMapa(eventos) {
  if (!eventos.length) return;
  if (!mapaContexto) {
    mapaContexto = await initLeaflet(eventos);
  } else {
    actualizarMarcadores(mapaContexto, eventos);
  }
}

function popularFiltros() {
  const categorias = Array.from(new Set(eventosZona.map((evento) => evento.categoria))).sort();
  categorias.forEach((categoria) => {
    const option = document.createElement("option");
    option.value = categoria;
    option.textContent = categoria.charAt(0).toUpperCase() + categoria.slice(1);
    categoriaSelect?.appendChild(option);
  });
}

async function init() {
  try {
    [eventosZona, zonas] = await Promise.all([getEventosPorZona(slugZona), getZonas()]);
    const zona = zonas.find((z) => z.slug === slugZona);
    if (!zona) {
      zoneTitle.textContent = "Zona no encontrada";
      emptyState.hidden = false;
      emptyState.textContent = "No pudimos encontrar la zona solicitada.";
      return;
    }
    document.title = `Eventos en ${zona.nombre} | ChivoSpot`;
    zoneTitle.textContent = `Eventos en ${zona.nombre}`;
    popularFiltros();
    aplicarFiltros();
    btnViewMap?.addEventListener("click", async () => {
      mapSection.hidden = !mapSection.hidden;
      btnViewMap.textContent = mapSection.hidden ? "Ver mapa" : "Ocultar mapa";
      if (!mapSection.hidden) {
        const dataset = eventosVisibles.length ? eventosVisibles : eventosZona;
        await cargarMapa(dataset);
      }
    });
  } catch (error) {
    console.error(error);
    emptyState.hidden = false;
    emptyState.textContent = "No pudimos cargar los eventos de esta zona.";
  }
}

filterChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    filterChips.forEach((c) => c.classList.remove("active"));
    chip.classList.add("active");
    const range = chip.dataset.range;
    if (range === "hoy") rangoActivo = todayRange();
    else if (range === "finde") rangoActivo = weekendRange();
    else if (range === "30d") rangoActivo = daysRange(30);
    else rangoActivo = null;
    aplicarFiltros();
  });
});

const chipTodos = filterChips.find((chip) => chip.dataset.range === "todos");
if (chipTodos) {
  chipTodos.classList.add("active");
}

categoriaSelect?.addEventListener("change", aplicarFiltros);
precioSelect?.addEventListener("change", aplicarFiltros);

if (yearCopy) {
  yearCopy.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", init);
