import { requireRole, logout } from "./auth.js";
import { getZonas, createEvento, getEventos, obtenerStorageKeys } from "./data.js";
import { fmtFecha, fmtPrecio, slugify, promedioNumeros } from "./utils.js";

const session = requireRole(["organizador"]);

const organizerName = document.querySelector("#organizerName");
const logoutBtn = document.querySelector("#logoutBtn");
const eventForm = document.querySelector("#organizerEventForm");
const eventFeedback = document.querySelector("#organizerEventFeedback");
const eventsList = document.querySelector("#organizerEventsList");
const statsTotal = document.querySelector("#orgStatsTotal");
const statsUpcoming = document.querySelector("#orgStatsUpcoming");
const statsAvgPrice = document.querySelector("#orgStatsAvgPrice");
const zoneSelect = document.querySelector("#organizerZone");

let zonas = [];
let eventosPropios = [];
const storageKeys = obtenerStorageKeys();

function showMessage(container, message, type = "success") {
  if (!container) return;
  container.textContent = message;
  container.dataset.state = type;
  container.hidden = false;
  setTimeout(() => {
    container.hidden = true;
  }, 4000);
}

function renderEvents() {
  eventsList.innerHTML = "";
  if (!eventosPropios.length) {
    const empty = document.createElement("p");
    empty.className = "empty";
    empty.textContent = "Aún no has creado eventos. Completa el formulario para publicar el primero.";
    eventsList.appendChild(empty);
    actualizarEstadisticas();
    return;
  }
  eventosPropios
    .slice()
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
    .forEach((evento) => {
      const article = document.createElement("article");
      article.className = "card";
      article.innerHTML = `
        <div class="card-content">
          <h3>${evento.titulo}</h3>
          <div class="card-meta">
            <span>${fmtFecha(evento.fechaInicio)}</span>
            <span>${evento.municipio || ""}</span>
            <span>${fmtPrecio(evento.precioMin, evento.precioMax)}</span>
          </div>
        </div>
        <div class="card-actions">
          <a class="btn btn-secondary" href="./evento.html?slug=${evento.slug}">Ver ficha</a>
        </div>
      `;
      eventsList.appendChild(article);
    });
  actualizarEstadisticas();
}

function actualizarEstadisticas() {
  if (statsTotal) statsTotal.textContent = eventosPropios.length;
  if (statsUpcoming) {
    const now = new Date();
    const proximos = eventosPropios.filter((evento) => new Date(evento.fechaInicio) >= now);
    statsUpcoming.textContent = proximos.length;
  }
  if (statsAvgPrice) {
    const promedios = eventosPropios.map((evento) => (Number(evento.precioMin) + Number(evento.precioMax)) / 2);
    const promedio = promedioNumeros(promedios);
    statsAvgPrice.textContent = promedio ? fmtPrecio(promedio, promedio) : "-";
  }
}

function obtenerDatosEvento(form) {
  const data = new FormData(form);
  const titulo = data.get("titulo").trim();
  const zona = data.get("zona");
  if (!titulo || !zona) {
    throw new Error("Título y zona son obligatorios");
  }
  return {
    slug: `${slugify(titulo)}-${Date.now()}`,
    titulo,
    zona,
    municipio: data.get("municipio").trim(),
    lugar: data.get("lugar").trim(),
    lat: Number(data.get("lat")),
    lon: Number(data.get("lon")),
    fechaInicio: data.get("fechaInicio"),
    fechaFin: data.get("fechaFin"),
    categoria: data.get("categoria"),
    precioMin: Number(data.get("precioMin")),
    precioMax: Number(data.get("precioMax")),
    imagen: data.get("imagen").trim(),
    descripcion: data.get("descripcion").trim(),
    enlace: data.get("enlace").trim(),
    creadoPor: session.email,
    creadoPorNombre: session.nombre,
    creadoEn: new Date().toISOString(),
  };
}

async function recargarEventos() {
  const todos = await getEventos();
  eventosPropios = todos.filter((evento) => evento.creadoPor === session.email);
  renderEvents();
}

async function inicializar() {
  organizerName.textContent = session?.nombre || "Organizador";
  zonas = await getZonas();
  zoneSelect.innerHTML = "";
  zonas.forEach((zona) => {
    const option = document.createElement("option");
    option.value = zona.slug;
    option.textContent = zona.nombre;
    zoneSelect.appendChild(option);
  });
  await recargarEventos();
}

eventForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const datos = obtenerDatosEvento(eventForm);
    await createEvento(datos);
    eventForm.reset();
    showMessage(eventFeedback, "Evento publicado correctamente");
    await recargarEventos();
  } catch (error) {
    console.error(error);
    showMessage(eventFeedback, error.message, "error");
  }
});

logoutBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  logout();
});

window.addEventListener("storage", async (event) => {
  if (event.key === storageKeys.EVENTOS) {
    await recargarEventos();
  }
});

document.addEventListener("DOMContentLoaded", inicializar);
