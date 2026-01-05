import { t } from "../i18n/i18n";

export function renderRanking(): string {
  return `
    <h2 class="text-3xl font-bold text-white mb-6">${t("general.rankingTitle")}</h2>
    <p class="text-white/80">${t("general.rankingDesc")}</p>
  `;
}
