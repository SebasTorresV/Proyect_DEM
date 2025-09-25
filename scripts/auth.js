const SESSION_KEY = "chivospot_session";
const ORGANIZADORES_KEY = "chivospot_organizadores";

const ADMIN_DEFAULT = {
  id: "admin",
  nombre: "Administrador General",
  email: "admin@chivospot.com",
  password: "admin123",
  rol: "admin",
};

function tieneLocalStorage() {
  try {
    return typeof window !== "undefined" && "localStorage" in window && window.localStorage !== null;
  } catch (error) {
    console.warn("LocalStorage no disponible", error);
    return false;
  }
}

function leerJSON(key, fallback = null) {
  if (!tieneLocalStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (error) {
    console.warn(`No se pudo leer ${key}`, error);
    return fallback;
  }
}

function escribirJSON(key, value) {
  if (!tieneLocalStorage()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`No se pudo guardar ${key}`, error);
  }
}

function generarIdOrganizador(nombre) {
  const base = nombre.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const timestamp = Date.now().toString(36);
  return `${base || "organizador"}-${timestamp}`;
}

export function getOrganizadores() {
  const lista = leerJSON(ORGANIZADORES_KEY, []);
  if (!Array.isArray(lista)) return [];
  return lista;
}

export function createOrganizador({ nombre, email, password, telefono = "" }) {
  if (!nombre || !email || !password) {
    throw new Error("Nombre, correo y contraseña son obligatorios");
  }
  const organizadores = getOrganizadores();
  const yaExiste = organizadores.some((org) => org.email.toLowerCase() === email.toLowerCase());
  if (yaExiste) {
    throw new Error("Ya existe un organizador con este correo");
  }
  const nuevo = {
    id: generarIdOrganizador(nombre),
    nombre,
    email,
    password,
    telefono,
    rol: "organizador",
    creadoEn: new Date().toISOString(),
  };
  organizadores.push(nuevo);
  escribirJSON(ORGANIZADORES_KEY, organizadores);
  return nuevo;
}

export function deleteOrganizador(id) {
  const organizadores = getOrganizadores();
  const filtrados = organizadores.filter((org) => org.id !== id);
  escribirJSON(ORGANIZADORES_KEY, filtrados);
  return filtrados;
}

export function getSession() {
  const session = leerJSON(SESSION_KEY, null);
  return session;
}

function guardarSesion(usuario) {
  escribirJSON(SESSION_KEY, usuario);
}

export function logout() {
  if (tieneLocalStorage()) {
    window.localStorage.removeItem(SESSION_KEY);
  }
  window.location.href = "./acceso.html";
}

export function login(email, password) {
  if (!email || !password) {
    throw new Error("Ingresa correo y contraseña");
  }
  if (email.toLowerCase() === ADMIN_DEFAULT.email && password === ADMIN_DEFAULT.password) {
    const session = { ...ADMIN_DEFAULT };
    guardarSesion(session);
    return session;
  }
  const organizadores = getOrganizadores();
  const match = organizadores.find((org) => org.email.toLowerCase() === email.toLowerCase() && org.password === password);
  if (!match) {
    throw new Error("Credenciales no válidas");
  }
  const session = { ...match };
  guardarSesion(session);
  return session;
}

export function requireRole(roles = []) {
  const session = getSession();
  if (!session || (roles.length && !roles.includes(session.rol))) {
    const destino = new URL("./acceso.html", window.location.href);
    destino.searchParams.set("redirect", window.location.pathname);
    window.location.replace(destino.toString());
    throw new Error("No autorizado");
  }
  return session;
}

export function isAdmin(session = getSession()) {
  return session?.rol === "admin";
}

export function getAdminDefault() {
  return { ...ADMIN_DEFAULT };
}

export function getOrganizadoresStorageKey() {
  return ORGANIZADORES_KEY;
}
