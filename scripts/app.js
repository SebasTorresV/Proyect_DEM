import { getEventos, getZonas, obtenerStorageKeys } from "./data.js";
import {
  fmtFechaCorta,
  fmtTiempoRelativo,
  fmtPrecio,
  formatAddress,
  todayRange,
} from "./utils.js";
import { linkMapa } from "./maps.js";
import { solicitarUbicacion, inferirZona } from "./geoloc.js";

const sectionsContainer = document.querySelector("#sectionsContainer");
const zoneChips = document.querySelector("#zoneChips");
const btnUseLocation = document.querySelector("#btnUseLocation");
const yearCopy = document.querySelector("#yearCopy");

const DEFAULT_ZONES = ["santa-tecla", "san-salvador", "merliot"];
let zonasDisponibles = [];
let eventos = [];
let ordenActual = [];

function createCard(evento) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `
    <img src="${evento.imagen}" alt="${evento.titulo}" loading="lazy">
    <div class="card-content">
      <h3>${evento.titulo}</h3>
      <div class="card-meta">
        <span class="card-time-label">${fmtTiempoRelativo(evento.fechaInicio)}</span>
        <span>${fmtFechaCorta(evento.fechaInicio)}</span>
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

function renderSection(zonaSlug) {
  const zona = zonasDisponibles.find((z) => z.slug === zonaSlug);
  if (!zona) return null;
  const eventosZona = eventos.filter((evento) => evento.zona === zonaSlug);
  const zonaEventos = eventosZona
    .slice()
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
    .slice(0, 8);
  const rangoHoy = todayRange();
  const eventosHoy = eventosZona
    .filter((evento) => {
      const fecha = new Date(evento.fechaInicio);
      return fecha >= rangoHoy.start && fecha <= rangoHoy.end;
    });

  const section = document.createElement("section");
  section.className = "zone-section";
  section.id = `zona-${zona.slug}`;
  section.innerHTML = `
    <div class="zone-section-header">
      <h2>${zona.nombre} – Hoy y próximos</h2>
      <div class="section-actions">
        <a class="btn btn-secondary" href="./lugar.html?slug=${zona.slug}">Ver más en ${zona.nombre}</a>
        <a class="btn btn-ghost" href="./lugar.html?slug=${zona.slug}#map">Ver mapa</a>
      </div>
    </div>
    <div class="cards-grid" role="list"></div>
  `;
  const list = section.querySelector(".cards-grid");

  if (!zonaEventos.length) {
    const mensaje = document.createElement("p");
    mensaje.className = "empty";
    if (!eventosZona.length) {
      mensaje.innerHTML = `Aún no hay eventos publicados en ${zona.nombre}. Pide a un organizador que cree uno desde el panel correspondiente.`;
    } else {
      mensaje.innerHTML = `No hay eventos hoy en ${zona.nombre} — mira los de esta semana.`;
    }
    section.appendChild(mensaje);
    eventosZona
      .slice()
      .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
      .slice(0, 8)
      .forEach((evento) => list.appendChild(createCard(evento)));
  } else if (!eventosHoy.length) {
    const mensaje = document.createElement("p");
    mensaje.className = "empty";
    mensaje.innerHTML = `No hay eventos hoy en ${zona.nombre} — mira los próximos disponibles.`;
    section.appendChild(mensaje);
    zonaEventos.forEach((evento) => list.appendChild(createCard(evento)));
  } else {
    zonaEventos.forEach((evento) => list.appendChild(createCard(evento)));
  }

  return section;
}

function renderChips(order) {
  zoneChips.innerHTML = "";
  order.forEach((slug) => {
    const zona = zonasDisponibles.find((z) => z.slug === slug);
    if (!zona) return;
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "chip";
    button.type = "button";
    button.textContent = zona.nombre;
    button.addEventListener("click", () => {
      const target = document.querySelector(`#zona-${zona.slug}`);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
    li.appendChild(button);
    zoneChips.appendChild(li);
  });
}

function renderSections(order) {
  sectionsContainer.innerHTML = "";
  order.forEach((slug) => {
    const section = renderSection(slug);
    if (section) sectionsContainer.appendChild(section);
  });
  if (!eventos.length) {
    const aviso = document.createElement("p");
    aviso.className = "empty";
    aviso.innerHTML =
      "Aún no hay eventos publicados. Los administradores y organizadores pueden crear el primero desde el panel de gestión.";
    sectionsContainer.appendChild(aviso);
  }
}

async function init() {
  try {
    [eventos, zonasDisponibles] = await Promise.all([getEventos(), getZonas()]);
    const orden = DEFAULT_ZONES.filter((slug) => zonasDisponibles.some((z) => z.slug === slug));
    zonasDisponibles.forEach((zona) => {
      if (!orden.includes(zona.slug)) orden.push(zona.slug);
    });
    ordenActual = orden;
    renderChips(ordenActual);
    renderSections(ordenActual);
  } catch (error) {
    console.error(error);
    const errorMsg = document.createElement("p");
    errorMsg.className = "empty";
    errorMsg.textContent = "No pudimos cargar los eventos. Intenta nuevamente más tarde.";
    sectionsContainer.appendChild(errorMsg);
  }
}

btnUseLocation?.addEventListener("click", async () => {
  btnUseLocation.disabled = true;
  btnUseLocation.textContent = "Buscando...";
  try {
    const coords = await solicitarUbicacion();
    const zona = await inferirZona(coords.latitude, coords.longitude);
    if (zona) {
      const nuevaOrden = [zona.slug, ...zonasDisponibles.map((z) => z.slug).filter((slug) => slug !== zona.slug)];
      ordenActual = nuevaOrden;
      renderChips(ordenActual);
      renderSections(ordenActual);
      btnUseLocation.textContent = `Cerca de ti: ${zona.nombre}`;
    } else {
      btnUseLocation.textContent = "No encontramos tu zona";
    }
  } catch (error) {
    console.warn("Ubicación no disponible", error);
    btnUseLocation.textContent = "Permite usar ubicación";
  } finally {
    btnUseLocation.disabled = false;
  }
});

if (yearCopy) {
  yearCopy.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", init);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("SW no registrado", error));
  });
}

const storageKeys = obtenerStorageKeys?.() || {};

window.addEventListener("storage", async (event) => {
  if (event.key === storageKeys.EVENTOS) {
    eventos = await getEventos();
    renderSections(ordenActual.length ? ordenActual : DEFAULT_ZONES);
  }
});
