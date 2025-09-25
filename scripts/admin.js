import {
  requireRole,
  logout,
  getOrganizadores,
  createOrganizador,
  deleteOrganizador,
  getAdminDefault,
  getOrganizadoresStorageKey,
} from "./auth.js";
import { getEventos, getZonas, createEvento, updateEvento, deleteEvento, obtenerStorageKeys } from "./data.js";
import { fmtFecha, fmtPrecio, slugify, toDatetimeLocal } from "./utils.js";

const session = requireRole(["admin"]);

const adminName = document.querySelector("#adminName");
const logoutBtn = document.querySelector("#logoutBtn");
const organizerForm = document.querySelector("#organizerForm");
const organizerFeedback = document.querySelector("#organizerFeedback");
const organizerTableBody = document.querySelector("#organizerTableBody");
const eventForm = document.querySelector("#eventForm");
const eventFeedback = document.querySelector("#eventFeedback");
const eventTableBody = document.querySelector("#eventsTableBody");
const zonesSelect = document.querySelector("#eventZone");
const ownerSelect = document.querySelector("#eventOwner");
const statsEvents = document.querySelector("#statsEvents");
const statsOrganizers = document.querySelector("#statsOrganizers");
const statsUpcoming = document.querySelector("#statsUpcoming");

const storageKeys = obtenerStorageKeys();

let zonas = [];
let eventos = [];

function showMessage(container, message, type = "success") {
  if (!container) return;
  container.textContent = message;
  container.dataset.state = type;
  container.hidden = false;
  setTimeout(() => {
    container.hidden = true;
  }, 4000);
}

function limpiarEventForm() {
  if (!eventForm) return;
  eventForm.reset();
  const slugField = eventForm.querySelector("[name='slug']");
  if (slugField) slugField.value = "";
  const submit = eventForm.querySelector("button[type='submit']");
  if (submit) submit.textContent = "Crear evento";
  if (ownerSelect && ownerSelect.options.length) {
    ownerSelect.value = ownerSelect.options[0].value;
  }
}

function obtenerNombrePropietario(email) {
  if (email === session.email) return session.nombre;
  if (email === getAdminDefault().email) return getAdminDefault().nombre;
  const organizador = getOrganizadores().find((org) => org.email === email);
  return organizador ? organizador.nombre : "";
}

function renderOrganizadores() {
  const organizadores = getOrganizadores();
  organizerTableBody.innerHTML = "";
  if (!organizadores.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "Aún no hay organizadores creados.";
    row.appendChild(cell);
    organizerTableBody.appendChild(row);
  } else {
    organizadores.forEach((org) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${org.nombre}</td>
        <td>${org.email}</td>
        <td>${org.telefono || "-"}</td>
        <td>${fmtFecha(org.creadoEn)}</td>
        <td>
          <button class="btn btn-ghost" data-action="delete" data-id="${org.id}">Eliminar</button>
        </td>
      `;
      organizerTableBody.appendChild(row);
    });
  }
  popularSelectPropietarios();
  actualizarEstadisticas();
}

function popularSelectPropietarios() {
  if (!ownerSelect) return;
  ownerSelect.innerHTML = "";
  const adminOption = document.createElement("option");
  adminOption.value = getAdminDefault().email;
  adminOption.dataset.nombre = getAdminDefault().nombre;
  adminOption.textContent = "Administrador";
  ownerSelect.appendChild(adminOption);

  const organizadores = getOrganizadores();
  organizadores.forEach((org) => {
    const option = document.createElement("option");
    option.value = org.email;
    option.dataset.nombre = org.nombre;
    option.textContent = org.nombre;
    ownerSelect.appendChild(option);
  });
  ownerSelect.value = ownerSelect.options[0]?.value || "";
}

function renderEventos() {
  eventTableBody.innerHTML = "";
  if (!eventos.length) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 6;
    cell.textContent = "No hay eventos publicados. Usa el formulario para crear el primero.";
    row.appendChild(cell);
    eventTableBody.appendChild(row);
    actualizarEstadisticas();
    return;
  }

  eventos
    .slice()
    .sort((a, b) => new Date(a.fechaInicio) - new Date(b.fechaInicio))
    .forEach((evento) => {
      const row = document.createElement("tr");
      const ownerName = evento.creadoPorNombre || obtenerNombrePropietario(evento.creadoPor);
      row.innerHTML = `
        <td>${evento.titulo}</td>
        <td>${evento.zona}</td>
        <td>${fmtFecha(evento.fechaInicio)}</td>
        <td>${fmtPrecio(evento.precioMin, evento.precioMax)}</td>
        <td>${ownerName || "-"}</td>
        <td class="table-actions">
          <button class="btn btn-secondary" data-action="edit" data-slug="${evento.slug}">Editar</button>
          <button class="btn btn-ghost" data-action="delete" data-slug="${evento.slug}">Eliminar</button>
        </td>
      `;
      eventTableBody.appendChild(row);
    });
  actualizarEstadisticas();
}

function actualizarEstadisticas() {
  const organizadores = getOrganizadores();
  if (statsOrganizers) {
    statsOrganizers.textContent = organizadores.length;
  }
  if (statsEvents) {
    statsEvents.textContent = eventos.length;
  }
  if (statsUpcoming) {
    const ahora = new Date();
    const proximos = eventos.filter((evento) => new Date(evento.fechaInicio) >= ahora);
    statsUpcoming.textContent = proximos.length;
  }
}

function llenarFormularioEvento(evento) {
  if (!eventForm) return;
  eventForm.titulo.value = evento.titulo || "";
  eventForm.zona.value = evento.zona || "";
  eventForm.municipio.value = evento.municipio || "";
  eventForm.lugar.value = evento.lugar || "";
  eventForm.fechaInicio.value = toDatetimeLocal(evento.fechaInicio);
  eventForm.fechaFin.value = toDatetimeLocal(evento.fechaFin);
  eventForm.lat.value = evento.lat || "";
  eventForm.lon.value = evento.lon || "";
  eventForm.categoria.value = evento.categoria || "musica";
  eventForm.precioMin.value = evento.precioMin ?? 0;
  eventForm.precioMax.value = evento.precioMax ?? 0;
  eventForm.imagen.value = evento.imagen || "";
  eventForm.descripcion.value = evento.descripcion || "";
  eventForm.enlace.value = evento.enlace || "";
  const ownerEmail = evento.creadoPor || getAdminDefault().email;
  if (ownerSelect && ownerEmail) {
    const existe = Array.from(ownerSelect.options).some((option) => option.value === ownerEmail);
    if (!existe) {
      const option = document.createElement("option");
      option.value = ownerEmail;
      option.dataset.nombre = evento.creadoPorNombre || ownerEmail;
      option.textContent = evento.creadoPorNombre || ownerEmail;
      ownerSelect.appendChild(option);
    }
  }
  ownerSelect.value = ownerEmail;
  const slugField = eventForm.querySelector("[name='slug']");
  if (slugField) slugField.value = evento.slug;
  const submit = eventForm.querySelector("button[type='submit']");
  if (submit) submit.textContent = "Actualizar evento";
}

function obtenerDatosEvento(form) {
  const data = new FormData(form);
  const titulo = data.get("titulo").trim();
  const zona = data.get("zona");
  if (!titulo || !zona) {
    throw new Error("El título y la zona son obligatorios");
  }
  const slugExistente = data.get("slug");
  const slug = slugExistente && slugExistente.trim().length ? slugExistente : `${slugify(titulo)}-${Date.now()}`;
  const ownerOption = ownerSelect?.selectedOptions?.[0];
  const creadoPor = ownerOption?.value || getAdminDefault().email;
  const creadoPorNombre = ownerOption?.dataset.nombre || obtenerNombrePropietario(creadoPor) || "";
  const esNuevo = !(slugExistente && slugExistente.trim().length);
  const registroBase = {
    slug,
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
    creadoPor,
    creadoPorNombre,
    actualizadoEn: new Date().toISOString(),
  };
  if (esNuevo) {
    registroBase.creadoEn = new Date().toISOString();
  }
  return registroBase;
}

async function cargarDatosIniciales() {
  adminName.textContent = session?.nombre || "Administrador";
  zonas = await getZonas();
  zonesSelect.innerHTML = "";
  zonas.forEach((zona) => {
    const option = document.createElement("option");
    option.value = zona.slug;
    option.textContent = zona.nombre;
    zonesSelect.appendChild(option);
  });
  renderOrganizadores();
  eventos = await getEventos();
  renderEventos();
}

organizerForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const data = new FormData(organizerForm);
    createOrganizador({
      nombre: data.get("nombre").trim(),
      email: data.get("email").trim(),
      password: data.get("password"),
      telefono: data.get("telefono").trim(),
    });
    organizerForm.reset();
    renderOrganizadores();
    showMessage(organizerFeedback, "Organizador creado correctamente");
  } catch (error) {
    console.error(error);
    showMessage(organizerFeedback, error.message, "error");
  }
});

organizerTableBody?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action='delete']");
  if (!button) return;
  const { id } = button.dataset;
  if (confirm("¿Eliminar este organizador? Sus eventos creados permanecerán publicados.")) {
    deleteOrganizador(id);
    renderOrganizadores();
    showMessage(organizerFeedback, "Organizador eliminado", "info");
  }
});

eventForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    const datos = obtenerDatosEvento(eventForm);
    const slugField = eventForm.querySelector("[name='slug']");
    if (slugField && slugField.value) {
      await updateEvento(datos.slug, datos);
      showMessage(eventFeedback, "Evento actualizado");
    } else {
      await createEvento(datos);
      showMessage(eventFeedback, "Evento creado");
    }
    eventos = await getEventos();
    renderEventos();
    limpiarEventForm();
  } catch (error) {
    console.error(error);
    showMessage(eventFeedback, error.message, "error");
  }
});

eventTableBody?.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;
  const { action, slug } = button.dataset;
  const evento = eventos.find((item) => item.slug === slug);
  if (action === "edit" && evento) {
    llenarFormularioEvento(evento);
  }
  if (action === "delete" && slug) {
    if (confirm("¿Seguro que deseas eliminar este evento?")) {
      deleteEvento(slug);
      eventos = await getEventos();
      renderEventos();
      showMessage(eventFeedback, "Evento eliminado", "info");
      limpiarEventForm();
    }
  }
});

logoutBtn?.addEventListener("click", (event) => {
  event.preventDefault();
  logout();
});

window.addEventListener("storage", async (event) => {
  if (event.key === storageKeys.EVENTOS || event.key === getOrganizadoresStorageKey()) {
    eventos = await getEventos();
    renderEventos();
    renderOrganizadores();
  }
});

document.addEventListener("DOMContentLoaded", cargarDatosIniciales);
