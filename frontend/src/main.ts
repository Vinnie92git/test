import "./styles.css";

// Importamos las funciones que pintan cada página
import { login, register, logoutRequest, get2faStatus, init2fa, confirm2fa, disable2fa } from "./api/authClient";
import { apiFetch, handleUnauthorized } from "./api/apiClient"; 
import { renderAuth } from "./pages/auth";
import { renderHome } from "./pages/home";
import { renderHistory } from "./pages/history";
import { renderRanking } from "./pages/ranking";
import { renderFriends } from "./pages/friends";
import { renderCustomize } from "./pages/customize";
import { renderLanguage } from "./pages/language";
import { renderProfile } from "./pages/profile";
import { t, setLanguage, getCurrentLang } from "./i18n/i18n";
import QRCode from "qrcode";

// Tipo con todas las páginas que tenemos
type Page =
  | "auth"
  | "inicio"
  | "historial"
  | "ranking"
  | "amigos"
  | "customizar"
  | "lenguaje"
  | "perfil";

const app = document.getElementById("app");
if (app) {
  // Aplica el idioma guardado ANTES de renderizar el layout
  const initialLang = getCurrentLang();
  setLanguage(initialLang);
  renderLayout();
  initRouter();
  // Sincroniza posible <select id="lang-select"> en el primer render
  syncLegacySelect();
}

function renderLayout() {
  if (!app) return;
  // Estructura fija de la app: fondo + barra superior traducible
  app.innerHTML = `
    <div class="min-h-screen bg-[url('/images/home-bg.png')] bg-cover bg-center flex flex-col">
      <header id="main-header" class="bg-indigo-900/95 text-white text-xs tracking-widest">
        ${renderHeader()}
      </header>
      <main id="main-view" class="flex-1 flex flex-col items-center justify-center"></main>
    </div>
  `;
}

function renderHeader(): string {
  return `
    <nav class="max-w-6xl mx-auto flex">
      <button data-page="inicio" class="flex-1 px-6 py-3 border-l border-r border-white/40 hover:bg-indigo-700 transition">${t("menu.inicio")}</button>
      <button data-page="historial" class="flex-1 px-6 py-3 border-r border-white/40 hover:bg-indigo-700 transition">${t("menu.historial")}</button>
      <button data-page="ranking" class="flex-1 px-6 py-3 border-r border-white/40 hover:bg-indigo-700 transition">${t("menu.ranking")}</button>
      <button data-page="amigos" class="flex-1 px-6 py-3 border-r border-white/40 hover:bg-indigo-700 transition">${t("menu.amigos")}</button>
      <button data-page="customizar" class="flex-1 px-6 py-3 border-r border-white/40 hover:bg-indigo-700 transition">${t("menu.customizar")}</button>
      <button data-page="lenguaje" class="flex-1 px-6 py-3 border-r border-white/40 hover:bg-indigo-700 transition">${t("menu.lenguaje")}</button>
      <button data-page="perfil" class="flex-1 px-6 py-3 border-r border-white/40 hover:bg-indigo-700 transition">${t("menu.perfil")}</button>
      <!-- Botón salir, sin data-page porque no navega a una vista -->
      <button id="btn-logout" class="px-6 py-3 border-l border-white/40 hover:bg-indigo-700 bg-indigo-600 transition flex items-center justify-center">
        <img src="/icons/cerrar-sesion.png" alt="Cerrar sesión" class="w-5 h-5"/>
      </button>
    </nav>
  `;
}

/* ========== ROUTER ========== */

// Decide qué HTML se pinta en función de la página
async function renderPage(page: Page) {
  const main = document.getElementById("main-view");
  if (!main) return;

  // Si no es la página de auth, verificamos el token contra /me
  if (page !== "auth") {
    const res = await apiFetch("/me");
    if (res.status === 401) {
      handleUnauthorized();
      return; // no pintes la página protegida
    }
  }

  switch (page) {
    case "auth":
      main.innerHTML = renderAuth();
      break;
    case "inicio":
      main.innerHTML = renderHome();
      break;
    case "historial":
      main.innerHTML = renderHistory();
      break;
    case "ranking":
      main.innerHTML = renderRanking();
      break;
    case "amigos":
      main.innerHTML = renderFriends();
      break;
    case "customizar":
      main.innerHTML = renderCustomize();
      break;
    case "lenguaje":
      main.innerHTML = renderLanguage();
      break;
    case "perfil":
      main.innerHTML = renderProfile();
      break;
  }

  toggleHeader(page);
  highlightActiveTab(page);
  attachPageEvents(page);
}

// Marca visualmente qué botón de la barra superior está activo
function highlightActiveTab(page: Page) {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-page]");
  buttons.forEach((btn) => {
    const isActive = btn.dataset.page === page && page !== "auth";
    btn.classList.toggle("bg-indigo-700", isActive);
  });
}

function toggleHeader(page: Page) {
  const header = document.getElementById("main-header");
  if (!header) return;

  if (page === "auth") {
    header.classList.add("hidden");   // Tailwind: display: none
  } else {
    header.classList.remove("hidden");
  }
}

async function logout() {
  const token = sessionStorage.getItem("authToken");
  if (token) {
    try {
      await logoutRequest(token);
    } catch (err) {
      console.warn("Error llamando a /logout:", err);
    }
  }
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("username");
  window.location.hash = "auth";
}


function attachPageEvents(page: Page) {
  if (page === "auth") {
  // Mostrar error si venimos de una sesión invalidada
  const errorKey = sessionStorage.getItem("authErrorKey");
  if (errorKey) {
    alert(t(errorKey as any)); // o pintar un banner en vez de alert
    sessionStorage.removeItem("authErrorKey");
  }
    const loginBtn = document.getElementById("btn-login");
    const registerBtn = document.getElementById("btn-register");
    const usernameInput = document.getElementById("auth-username") as HTMLInputElement | null;
    const passwordInput = document.getElementById("auth-password") as HTMLInputElement | null;
    const otpInput = document.getElementById("auth-otp") as HTMLInputElement | null;
    const storedError = sessionStorage.getItem("authError");
    if (storedError) {
      alert(storedError); // error message
      sessionStorage.removeItem("authError");
    }
    const getCredentials = () => {
      if (!usernameInput || !passwordInput) return null;
      const username = usernameInput.value.trim();
      const password = passwordInput.value.trim();
      const otp = otpInput?.value.trim();
      if (!username || !password) {
        alert(t("auth.fillFields"));
        return null;
      }
      return { username, password, otp };
    };
    const onAuthSuccess = (data: { username: string; token: string }) => {
      console.log("Auth OK:", data);
      sessionStorage.setItem("authToken", data.token);
      sessionStorage.setItem("username", data.username);
      window.location.hash = "inicio";
    };
    const handleLogin = async () => {
       console.log("CLICK LOGIN"); 
      const creds = getCredentials();
      if (!creds) return;
      try {
        const data = await login(creds);
        onAuthSuccess(data);
      } catch (err: any) {
        console.error(err);
        if (err.message === "2FA_REQUIRED") {
          alert("Este usuario tiene 2FA activado. Introduce el código de 6 dígitos.");
        } else {
          alert(err.message || t("auth.errorLogin"));
        }
      }
    };
    const handleRegister = async () => {
      console.log("CLICK REGISTER");
      const creds = getCredentials();
      if (!creds) return;
      try {
        const data = await register(creds);
        // Registro + login automático
        onAuthSuccess(data);
      } catch (err: any) {
        console.error(err);
        alert(err.message || t("auth.errorRegister"));
      }
    };
    loginBtn?.addEventListener("click", handleLogin);
    registerBtn?.addEventListener("click", handleRegister);
  }
  if (page === "lenguaje") {
    // Eliminar selector legacy si existe para evitar confusión visual
    const oldSelect = document.getElementById("lang-select");
    if (oldSelect && oldSelect.parentElement) {
      oldSelect.parentElement.removeChild(oldSelect);
    }
    const langButtons = document.querySelectorAll<HTMLButtonElement>("[data-lang]");
    langButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const lang = btn.dataset.lang as "es" | "en" | undefined;
        if (!lang) return;
        setLanguage(lang);
      });
    });
    // Compatibilidad: si existe un <select id="lang-select">, sincronizarlo
    const select = document.getElementById("lang-select") as HTMLSelectElement | null;
    if (select) {
      try {
        // Establecer valor actual
        const current = getCurrentLang();
        select.value = current;
        // Escuchar cambios
        select.addEventListener("change", () => {
          const val = select.value === "en" ? "en" : "es";
          setLanguage(val);
        });
      } catch (_) {}
    }
  }
  
  if (page === "perfil") {
    const token = sessionStorage.getItem("authToken");
    const statusEl = document.getElementById("2fa-status");
    const secretBox = document.getElementById("2fa-secret-box");
    const secretEl = document.getElementById("2fa-secret");
    const msgEl = document.getElementById("2fa-message");
    const otpInput = document.getElementById("input-2fa-otp") as HTMLInputElement | null;
    const btnInit = document.getElementById("btn-2fa-init") as HTMLButtonElement | null;
    const btnConfirm = document.getElementById("btn-2fa-confirm") as HTMLButtonElement | null;
    const btnDisable = document.getElementById("btn-2fa-disable") as HTMLButtonElement | null;

    const setStatus = (enabled: boolean) => {
      if (statusEl) {
        statusEl.textContent = `Estado: ${enabled ? "Activado" : "Desactivado"}`;
        statusEl.className = `text-sm px-3 py-1 rounded-full border ${enabled ? "bg-emerald-700/60 border-emerald-400/60" : "bg-white/10 border-white/20"}`;
      }
      if (btnInit) btnInit.disabled = enabled;
      if (btnConfirm) btnConfirm.disabled = !secretBox || secretBox.classList.contains("hidden") || enabled;
      if (btnDisable) btnDisable.disabled = !enabled;
    };

    const setMessage = (text: string, color = "text-white/80") => {
      if (!msgEl) return;
      msgEl.textContent = text;
      msgEl.className = `text-sm ${color}`;
    };

    if (!token) {
      setMessage("Inicia sesión para gestionar 2FA", "text-red-300");
      setStatus(false);
      if (btnInit) btnInit.disabled = true;
      if (btnConfirm) btnConfirm.disabled = true;
      if (btnDisable) btnDisable.disabled = true;
      return;
    }

    const refreshStatus = async () => {
      try {
        const { enabled } = await get2faStatus(token);
        setStatus(enabled);
        if (!enabled && secretBox) secretBox.classList.add("hidden");
        if (!enabled && secretEl) secretEl.textContent = "";
        setMessage(enabled ? "2FA activo" : "2FA desactivado");
      } catch (err) {
        console.error(err);
        setMessage("No se pudo obtener el estado 2FA", "text-red-300");
      }
    };

    btnInit?.addEventListener("click", async () => {
      if (!token) return;
      try {
        const data = await init2fa(token);
        if (secretEl) secretEl.textContent = data.secret;
        if (secretBox) secretBox.classList.remove("hidden");

        // Generar QR como imagen desde otpauth URL
        const qrEl = document.getElementById("2fa-qr");
        if (qrEl) {
          qrEl.innerHTML = ""; // Limpiar QR previo
          try {
            const qrDataUrl = await QRCode.toDataURL(data.otpauth, { width: 250, margin: 1 });
            const img = document.createElement("img");
            img.src = qrDataUrl;
            img.alt = "QR Code for 2FA";
            img.style.maxWidth = "250px";
            qrEl.appendChild(img);
          } catch (qrErr) {
            console.error("Error generating QR:", qrErr);
            qrEl.innerHTML = "<p class='text-red-300 text-xs'>Error generando QR. Usa el secreto manual.</p>";
          }
        }

        setMessage("Secreto generado. Escanea el código QR o copia el secreto para activarlo.");
        setStatus(false);
      } catch (err) {
        console.error(err);
        setMessage("No se pudo generar el secreto", "text-red-300");
      }
    });

    btnConfirm?.addEventListener("click", async () => {
      if (!token) return;
      const otp = otpInput?.value.trim();
      if (!otp) {
        setMessage("Introduce el código de 6 dígitos", "text-red-300");
        return;
      }
      try {
        await confirm2fa(token, otp);
        setMessage("2FA activado correctamente", "text-emerald-200");
        if (secretBox) secretBox.classList.add("hidden");
        if (secretEl) secretEl.textContent = "";
        if (otpInput) otpInput.value = "";
        setStatus(true);
      } catch (err: any) {
        setMessage(err?.message || "Código incorrecto", "text-red-300");
      }
    });

    btnDisable?.addEventListener("click", async () => {
      if (!token) return;
      const otp = otpInput?.value.trim();
      if (!otp) {
        setMessage("Introduce un código válido para desactivar", "text-red-300");
        return;
      }
      try {
        await disable2fa(token, otp);
        setMessage("2FA desactivado", "text-amber-200");
        if (secretBox) secretBox.classList.add("hidden");
        if (secretEl) secretEl.textContent = "";
        if (otpInput) otpInput.value = "";
        setStatus(false);
      } catch (err: any) {
        setMessage(err?.message || "No se pudo desactivar", "text-red-300");
      }
    });

    refreshStatus();
  }
  // ...resto de páginas
}

function hasToken(): boolean {
  return !!sessionStorage.getItem("authToken");
}

// Lee la página actual desde el hash de la URL (#/inicio, #/historial, etc.)
function getPageFromHash(): Page {
  const hash = window.location.hash.replace("#", "") as Page;

  const validPages: Page[] = [
    "auth",
    "inicio",
    "historial",
    "ranking",
    "amigos",
    "customizar",
    "lenguaje",
    "perfil",
  ];

  if (!validPages.includes(hash)) {
    return "auth";
  }

  if (!hasToken() && hash !== "auth") {
    return "auth";
  }

  return hash;
}

// initRouter
function initRouter() {
  bindNavButtons();

  window.addEventListener("hashchange", () => {
    renderPage(getPageFromHash());
    syncLegacySelect();
  });

  window.addEventListener("languageChanged", () => {
    const header = document.getElementById("main-header");
    if (header) {
      header.innerHTML = renderHeader();
      bindNavButtons();
      highlightActiveTab(getPageFromHash());
    }
    syncLegacySelect();
    renderPage(getPageFromHash());
  });

  // Render inicial
  renderPage(getPageFromHash());
}


// Vuelve a asociar los botones de navegación tras re-renderizar el header
function bindNavButtons() {
  const buttons = document.querySelectorAll<HTMLButtonElement>("[data-page]");
  // Navegación normal entre páginas
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page as Page;
      window.location.hash = page; // dispara 'hashchange'
    });
  });
  // Aasociar el botón de cerrar sesión cada vez que se repinta el header
  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
    });
  }
}

// Compatibilidad con un <select id="lang-select"> heredado de bundles viejos
function syncLegacySelect() {
  const select = document.getElementById("lang-select") as HTMLSelectElement | null;
  if (!select) return;
  try {
    const current = getCurrentLang();
    if (select.value !== current) select.value = current;
    if (!(select as any)._boundLang) {
      select.addEventListener("change", () => {
        const val = select.value === "en" ? "en" : "es";
        setLanguage(val);
      });
      (select as any)._boundLang = true;
    }
  } catch (_) {}
}
