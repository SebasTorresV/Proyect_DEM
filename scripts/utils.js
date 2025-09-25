export function qs(key) {
  const params = new URLSearchParams(window.location.search);
  return params.get(key);
}

export function fmtFecha(fechaISO) {
  if (!fechaISO) return "Fecha por confirmar";
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return "Fecha por confirmar";
  return new Intl.DateTimeFormat("es-SV", {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "numeric",
    minute: "2-digit",
  }).format(fecha);
}

export function fmtFechaCorta(fechaISO) {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return "Próximamente";
  return new Intl.DateTimeFormat("es-SV", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(fecha);
}

export function fmtTiempoRelativo(fechaISO) {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return "Próximamente";
  const diffMs = fecha.getTime() - Date.now();
  const diffMin = Math.round(diffMs / (1000 * 60));
  if (diffMin <= 0) return "Ya comenzó";
  if (diffMin < 60) return `Empieza en ${diffMin} min`;
  const diffHoras = Math.round(diffMin / 60);
  if (diffHoras < 24) return `Empieza en ${diffHoras} h`;
  const diffDias = Math.round(diffHoras / 24);
  if (diffDias === 1) return "Mañana";
  if (diffDias < 7) return `En ${diffDias} días`;
  const diffSem = Math.round(diffDias / 7);
  if (diffSem === 1) return "La próxima semana";
  return `En ${diffSem} semanas`;
}

export function fmtPrecio(min, max) {
  if (min === 0 && max === 0) return "Gratis";
  if (min === max) {
    return new Intl.NumberFormat("es-SV", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(min);
  }
  return `${new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(min)} - ${new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD", maximumFractionDigits: 2 }).format(max)}`;
}

export function slugToName(slug, zonas) {
  const zona = zonas.find((z) => z.slug === slug);
  return zona ? zona.nombre : slug;
}

export function groupBy(array, key) {
  return array.reduce((acc, item) => {
    const group = item[key];
    if (!acc[group]) acc[group] = [];
    acc[group].push(item);
    return acc;
  }, {});
}

export function todayRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

export function weekendRange() {
  const now = new Date();
  const day = now.getDay();
  const saturdayOffset = (6 - day + 7) % 7;
  const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + saturdayOffset);
  const sunday = new Date(saturday);
  sunday.setDate(sunday.getDate() + 1);
  const monday = new Date(sunday);
  monday.setDate(monday.getDate() + 1);
  return { start: saturday, end: monday };
}

export function daysRange(days = 30) {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);
  return { start, end };
}

export function isWithinRange(fechaISO, { start, end }) {
  if (!fechaISO) return false;
  const fecha = new Date(fechaISO);
  return fecha >= start && fecha <= end;
}

export function formatAddress(evento) {
  const partes = [evento.lugar, evento.municipio].filter(Boolean);
  return partes.join(" · ");
}
