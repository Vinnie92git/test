// (LUCIA) PARA internacionalización - Gestor de traducciones
// Este archivo centraliza la lógica de traducción. Permite cambiar entre español e inglés
// y mantiene el idioma seleccionado en localStorage para recordarlo entre sesiones.
import { es } from "./es";
import { en } from "./en";

type Language = 'es' | 'en';

// Tipo para obtener todas las claves anidadas posibles
type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

// Usamos el tipo es como base para las claves
type TranslationKey = NestedKeyOf<typeof es>;

const languages = { es, en };

let currentLang: Language = (localStorage.getItem("lang") as Language) || "es";

export function setLanguage(lang: Language): void {
  if (!languages[lang]) return;
  currentLang = lang;
  localStorage.setItem("lang", lang);
  // Disparar evento personalizado para que otros componentes se enteren
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: lang }));
}

export function getCurrentLang(): Language {
  try {
    const stored = localStorage.getItem("lang") as Language | null;
    if (stored === "es" || stored === "en") {
      if (stored !== currentLang) currentLang = stored;
      return stored;
    }
  } catch (_) {}
  return currentLang;
}

export function t(key: TranslationKey): string {
  const parts = key.split('.');
  let value: any = languages[currentLang];
  
  for (const part of parts) {
    value = value?.[part];
    if (!value) {
      console.warn(`⚠️ Translation key not found: "${key}" in language "${currentLang}"`);
      // Intentar con español como fallback
      const fallbackValue = getFallbackTranslation(key);
      return fallbackValue || key;
    }
  }
  return value;
}

function getFallbackTranslation(key: TranslationKey): string {
  const parts = key.split('.');
  let value: any = languages['es']; // Español como fallback
  
  for (const part of parts) {
    value = value?.[part];
    if (!value) return '';
  }
  return value;
}

// (LUCIA) PARA internacionalización - Hacer funciones disponibles globalmente
// Esto es necesario para que puedan ser llamadas desde event handlers en HTML
if (typeof window !== 'undefined') {
  (window as any).t = t;
  (window as any).setLanguage = setLanguage;
  (window as any).getCurrentLang = getCurrentLang;
  
  // Debug: mostrar estado de internacionalización
  console.log("🌐 i18n initialized. Current language:", currentLang);
  console.log("🔧 Functions available: t(), setLanguage(), getCurrentLang()");
}

// Función helper para forzar actualización de toda la UI
export function refreshUI(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('languageChanged'));
  }
}