import { t } from "../i18n/i18n";

// Página para Registrarse o Loguearse
export function renderAuth(): string {
  return `
    <section class="flex flex-col items-center justify-center min-h-screen text-white">
      <h1 class="text-5xl font-extrabold mb-8 drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">
        ${t("auth.welcome")}
      </h1>

      <div class="bg-indigo-900/80 backdrop-blur-sm rounded-2xl px-10 py-8 shadow-2xl w-full max-w-md">
        <p class="text-sm text-white/80 mb-6 text-center">
          ${t("auth.orRegister")}
        </p>

        <!-- CAMPOS DE USUARIO Y CONTRASEÑA -->
        <div class="flex flex-col gap-4 mb-6">
          <div class="flex flex-col text-left text-xs font-semibold text-white/80 gap-1">
            <label for="auth-username">${t("auth.username")}</label>
            <input
              id="auth-username"
              type="text"
              autocomplete="username"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              placeholder="${t("auth.placeholderUser")}"
            />
          </div>

          <div class="flex flex-col text-left text-xs font-semibold text-white/80 gap-1">
            <label for="auth-password">${t("auth.password")}</label>
            <input
              id="auth-password"
              type="password"
              autocomplete="current-password"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              placeholder="${t("auth.placeholderPass")}"
            />
          </div>

          <div class="flex flex-col text-left text-xs font-semibold text-white/80 gap-1">
            <label for="auth-otp">2FA (si aplica)</label>
            <input
              id="auth-otp"
              type="text"
              inputmode="numeric"
              autocomplete="one-time-code"
              class="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-pink-400 focus:border-transparent"
              placeholder="123456"
            />
          </div>
        </div>

        <!-- BOTONES -->
        <div class="flex flex-col gap-4">
          <button id="btn-login"
            class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-3 rounded-lg shadow-lg">
            ${t("auth.loginBtn")}
          </button>

          <button id="btn-register"
            class="bg-pink-500 hover:bg-pink-400 text-white font-semibold py-3 rounded-lg shadow-lg">
            ${t("auth.registerBtn")}
          </button>
        </div>

        <p class="text-xs text-white/60 mt-4 text-center">
          ${t("auth.authNote")}
        </p>

        <p id="auth-error" class="text-xs text-red-300 mt-2 text-center hidden"></p>
      </div>
    </section>
  `;
}
