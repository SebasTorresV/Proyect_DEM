import { login, getSession, getAdminDefault } from "./auth.js";
import { qs } from "./utils.js";

const form = document.querySelector("#loginForm");
const feedback = document.querySelector("#loginFeedback");
const adminCreds = document.querySelector("#adminCredentials");

function showMessage(message, type = "error") {
  if (!feedback) return;
  feedback.textContent = message;
  feedback.dataset.state = type;
  feedback.hidden = false;
}

function redirectByRole(usuario) {
  const redirectParam = qs("redirect");
  if (redirectParam) {
    window.location.href = redirectParam;
    return;
  }
  const destino = usuario.rol === "admin" ? "./admin.html" : "./organizador.html";
  window.location.href = destino;
}

function inicializar() {
  const session = getSession();
  if (session) {
    redirectByRole(session);
    return;
  }
  const admin = getAdminDefault();
  if (adminCreds) {
    adminCreds.textContent = `${admin.email} / ${admin.password}`;
  }
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  try {
    const data = new FormData(form);
    const email = data.get("email").trim();
    const password = data.get("password");
    const usuario = login(email, password);
    showMessage("Ingreso exitoso", "success");
    setTimeout(() => redirectByRole(usuario), 600);
  } catch (error) {
    console.error(error);
    showMessage(error.message || "No fue posible iniciar sesión");
  }
});

document.addEventListener("DOMContentLoaded", inicializar);
