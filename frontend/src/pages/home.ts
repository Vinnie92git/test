import { t } from "../i18n/i18n";

export function renderHome(): string {
  return `
    <h1 class="text-7xl font-bold text-center mb-12 text-white drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]">
      ${t("home.title")}
    </h1>
    <div class="flex justify-center gap-10">
      <button class="bg-violet-700 text-white px-10 py-4 rounded-full shadow-xl shadow-violet-900/70">
        ${t("home.local")}
      </button>
      <button class="bg-violet-700 text-white px-10 py-4 rounded-full shadow-xl shadow-violet-900/70">
        ${t("home.online")}
      </button>
      <button class="bg-violet-700 text-white px-10 py-4 rounded-full shadow-xl shadow-violet-900/70">
        ${t("home.tournament")}
      </button>
    </div>
  `;
}
