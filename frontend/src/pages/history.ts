import { t } from "../i18n/i18n";

export function renderHistory(): string {
  return `
    <h2 class="text-3xl font-bold text-white mb-6">${t("general.historialTitle")}</h2>
    <p class="text-white/80">${t("general.historialDesc")}</p>
  `;
}
