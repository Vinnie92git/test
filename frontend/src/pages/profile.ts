import { t } from "../i18n/i18n";

export function renderProfile(): string {
  
  return `
    <section class="w-full max-w-3xl mx-auto text-white">
      <h2 class="text-3xl font-bold mb-6">${t("general.profileTitle")}</h2>
      <p class="text-white/80 mb-8">${t("general.profileDesc")}</p>

      <div class="bg-indigo-900/80 border border-white/10 rounded-2xl p-6 shadow-xl">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-semibold">Seguridad</h3>
            <p class="text-sm text-white/70">Configura 2FA para proteger tu cuenta.</p>
          </div>
          <span id="2fa-status" class="text-sm px-3 py-1 rounded-full bg-white/10 border border-white/20">Estado: -</span>
        </div>

        <div class="flex flex-col gap-3">
          <button id="btn-2fa-init" class="bg-violet-600 hover:bg-violet-500 text-white font-semibold py-2 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed">Generar código 2FA</button>

        <div id="2fa-secret-box" class="hidden bg-white/5 border border-white/10 rounded-lg p-4 text-sm">
          <p class="mb-3">Escanea este código QR con tu app autenticadora (Google Authenticator, Authy...):</p>
          <div id="2fa-qr" class="mb-3 flex justify-center bg-white p-2 rounded"></div>
          <p class="mb-2 text-xs text-white/70">O copia este secreto si prefieres:</p>
          <code id="2fa-secret" class="block text-pink-200 break-all text-xs"></code>
          <p class="text-xs text-white/60 mt-3">Luego introduce el código de 6 dígitos para activarlo.</p>
        </div>

          <div class="flex gap-2 items-center">
            <input id="input-2fa-otp" type="text" inputmode="numeric" placeholder="123456" class="flex-1 px-3 py-2 rounded bg-white/10 border border-white/20 text-sm text-white focus:outline-none focus:ring-2 focus:ring-pink-400" />
            <button id="btn-2fa-confirm" class="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed">Confirmar</button>
            <button id="btn-2fa-disable" class="bg-red-600 hover:bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow disabled:opacity-50 disabled:cursor-not-allowed">Desactivar</button>
          </div>

          <p id="2fa-message" class="text-sm text-white/80"></p>
        </div>
      </div>
    </section>
  `;
}
