const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:3001";

export async function apiFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const token = sessionStorage.getItem("authToken"); // <-- aquí, no fuera
  const headers = new Headers(init.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${AUTH_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  return res;
}

/**
 * Función helper para manejar desautenticación (401)
 * Limpia el storage y redirige a login
 */
export function handleUnauthorized(): void {
  sessionStorage.removeItem("authToken");
  sessionStorage.removeItem("username");
  // motivo para mostrar error en la pantalla de login
  sessionStorage.setItem("authErrorKey", "auth.errorSessionReplaced");
  if (window.location.hash !== "#auth") {
    window.location.hash = "auth";
  }
}
