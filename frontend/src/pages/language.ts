import { t, getCurrentLang } from "../i18n/i18n";

export function renderLanguage(): string {
  const currentLang = getCurrentLang();
  try {
    const stored = typeof window !== "undefined" ? localStorage.getItem("lang") : null;
    console.log("[Languages] render -> current:", currentLang, ", stored:", stored);
  } catch (_) {}

  const option = (lang: "es" | "en", label: string) => {
    const isActive = currentLang === lang;
    const baseClasses = "flex items-center gap-3 w-full px-4 py-3 rounded-xl border transition";
    const activeClasses = isActive
      ? "border-pink-400/80 bg-white/10 shadow-lg shadow-pink-500/20"
      : "border-white/20 hover:border-white/50 bg-white/5";

    return `
      <button data-lang="${lang}" class="${baseClasses} ${activeClasses}" aria-pressed="${isActive}">
        <span class="text-2xl">${lang === "es" ? "🇪🇸" : "🇬🇧"}</span>
        <span class="text-left">
          <span class="block font-semibold">${label}</span>
          <span class="block text-xs text-white/60">${isActive ? t("language.description") : ""}</span>
        </span>
        ${isActive ? '<span class="ml-auto text-xs px-2 py-1 rounded bg-pink-500/20 border border-pink-400/50">✓</span>' : ""}
      </button>
    `;
  };

  return `
    <section class="text-white max-w-xl w-full px-6 py-8 bg-indigo-900/70 rounded-2xl shadow-2xl border border-white/10 backdrop-blur">
      <h2 class="text-3xl font-bold mb-3">${t("language.title")}</h2>
      <p class="text-white/80 mb-6">${t("language.description")}</p>

      <div class="grid gap-4 sm:grid-cols-2">
        ${option("es", t("language.spanish"))}
        ${option("en", t("language.english"))}
      </div>
    </section>
  `;
}
