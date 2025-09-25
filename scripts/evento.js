import { getEventoBySlug, getEventosPorZona } from "./data.js";
import { qs, fmtFecha, fmtPrecio, formatAddress } from "./utils.js";
import { linkMapa } from "./maps.js";

const yearCopy = document.querySelector("#yearCopy");
const eventTitle = document.querySelector("#eventTitle");
const eventImage = document.querySelector("#eventImage");
const eventTiming = document.querySelector("#eventTiming");
const eventLocation = document.querySelector("#eventLocation");
const eventPrice = document.querySelector("#eventPrice");
const eventCategory = document.querySelector("#eventCategory");
const eventDescription = document.querySelector("#eventDescription");
const eventExternalLink = document.querySelector("#eventExternalLink");
const btnOpenLocation = document.querySelector("#btnOpenLocation");
const btnShare = document.querySelector("#btnShare");
const btnSave = document.querySelector("#btnSave");
const relatedList = document.querySelector("#relatedList");
const eventOwner = document.querySelector("#eventOwner");

let eventoActual = null;

function createRelatedCard(evento) {
  const article = document.createElement("article");
  article.className = "card";
  article.innerHTML = `
    <img src="${evento.imagen}" alt="${evento.titulo}" loading="lazy">
    <div class="card-content">
      <h3>${evento.titulo}</h3>
      <div class="card-meta">
        <span>${fmtFecha(evento.fechaInicio)}</span>
        <span>${formatAddress(evento)}</span>
      </div>
    </div>
    <div class="card-actions">
      <a class="btn btn-secondary" href="${linkMapa(evento.lat, evento.lon)}" target="_blank" rel="noopener">Ir</a>
      <a class="btn btn-primary" href="./evento.html?slug=${evento.slug}">Ver detalles</a>
    </div>
  `;
  return article;
}

function shareEvento(evento) {
  const url = window.location.href;
  const texto = `Vamos a ${evento.titulo} en ${formatAddress(evento)}. Mira los detalles en ${url}`;
  if (navigator.share) {
    navigator.share({ title: evento.titulo, text: texto, url }).catch((error) => console.warn("Share cancelado", error));
  }
}

function prepararLinkCompartir(evento) {
  const url = window.location.href;
  const texto = `Vamos a ${evento.titulo} en ${formatAddress(evento)}. Mira los detalles en ${url}`;
  btnShare.href = `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

function toggleGuardar() {
  const guardados = JSON.parse(localStorage.getItem("chivospot_guardados") || "[]");
  if (!eventoActual) return;
  const yaExiste = guardados.includes(eventoActual.slug);
  if (yaExiste) {
    const nuevos = guardados.filter((slug) => slug !== eventoActual.slug);
    localStorage.setItem("chivospot_guardados", JSON.stringify(nuevos));
    btnSave.textContent = "Guardar";
  } else {
    guardados.push(eventoActual.slug);
    localStorage.setItem("chivospot_guardados", JSON.stringify(guardados));
    btnSave.textContent = "Guardado";
  }
}

async function cargarEvento() {
  const slug = qs("slug");
  if (!slug) {
    eventTitle.textContent = "Evento no encontrado";
    eventDescription.textContent = "No se proporcionó un evento válido.";
    return;
  }
  try {
    eventoActual = await getEventoBySlug(slug);
    if (!eventoActual) {
      eventTitle.textContent = "Evento no disponible";
      eventDescription.textContent = "El evento que buscas ya no está publicado.";
      return;
    }
    document.title = `${eventoActual.titulo} | ChivoSpot`;
    eventTitle.textContent = eventoActual.titulo;
    eventImage.src = eventoActual.imagen;
    eventImage.alt = eventoActual.titulo;
    eventTiming.textContent = fmtFecha(eventoActual.fechaInicio);
    eventLocation.textContent = formatAddress(eventoActual);
    eventPrice.textContent = fmtPrecio(eventoActual.precioMin, eventoActual.precioMax);
    eventCategory.textContent = `Categoría: ${eventoActual.categoria}`;
    const descripcion = eventoActual.descripcion || "Este evento aún no tiene una descripción detallada.";
    eventDescription.innerHTML = `<p>${descripcion}</p>`;
    if (eventoActual.enlace) {
      eventExternalLink.href = eventoActual.enlace;
      eventExternalLink.hidden = false;
    } else {
      eventExternalLink.hidden = true;
    }
    if (eventOwner) {
      if (eventoActual.creadoPorNombre) {
        eventOwner.textContent = `Organizado por ${eventoActual.creadoPorNombre}`;
        eventOwner.hidden = false;
      } else {
        eventOwner.hidden = true;
      }
    }
    const mapaLink = linkMapa(eventoActual.lat, eventoActual.lon);
    if (!eventoActual.lat || !eventoActual.lon) {
      btnOpenLocation.disabled = true;
      btnOpenLocation.textContent = "Ubicación pendiente";
    }
    btnOpenLocation.addEventListener("click", () => {
      if (eventoActual.lat && eventoActual.lon) {
        window.open(mapaLink, "_blank");
      }
    });
    prepararLinkCompartir(eventoActual);
    btnShare.addEventListener("click", (event) => {
      if (navigator.share) {
        event.preventDefault();
        shareEvento(eventoActual);
      }
    });
    btnSave.addEventListener("click", toggleGuardar);
    const guardados = JSON.parse(localStorage.getItem("chivospot_guardados") || "[]");
    if (guardados.includes(eventoActual.slug)) {
      btnSave.textContent = "Guardado";
    }
    const relacionados = (await getEventosPorZona(eventoActual.zona))
      .filter((evento) => evento.slug !== eventoActual.slug)
      .slice(0, 3);
    if (!relacionados.length) {
      const empty = document.createElement("p");
      empty.className = "empty";
      empty.textContent = "No hay eventos relacionados aún.";
      relatedList.appendChild(empty);
    } else {
      relacionados.forEach((evento) => relatedList.appendChild(createRelatedCard(evento)));
    }
  } catch (error) {
    console.error(error);
    eventDescription.textContent = "No pudimos cargar la información del evento.";
  }
}

if (yearCopy) {
  yearCopy.textContent = new Date().getFullYear();
}

document.addEventListener("DOMContentLoaded", cargarEvento);
