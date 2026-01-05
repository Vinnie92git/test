import { syncUser } from "./userClient";

export interface LoginRequest {
  username: string;
  password: string;
  otp?: string;
}

export interface LoginResponse {
  userId: number;
  username: string;
  token: string;
  twofaEnabled?: boolean;
}

export interface RegisterRequest {
  username: string;
  password: string;
}

// Permite configurar la URL del auth-service por entorno (.env de Vite)
const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL ?? "http://localhost:3001";

// Función auxiliar para intentar leer el cuerpo de error como JSON
async function parseError(res: Response): Promise<any> {
  try {
    return await res.clone().json();
  } catch {
    return {};
  }
}

export async function login(req: LoginRequest): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorBody = await parseError(res);
    if (res.status === 401) {
      if (errorBody?.error === "2fa_required") {
        throw new Error("2FA_REQUIRED");
      }
      throw new Error(errorBody.error || "Usuario o contraseña incorrectos");
    }
    throw new Error(errorBody.error || "Error al iniciar sesión");
  }

  const authData = await res.json();

  // Sincronizar automáticamente con user-service
  try {
    await syncUser(authData.token);
    console.log("✅ Usuario sincronizado con user-service");
  } catch (syncError) {
    console.warn("⚠️ Error al sincronizar con user-service:", syncError);
    // No bloqueamos el login si falla la sincronización
  }

  return authData;
}

export async function register(req: RegisterRequest): Promise<LoginResponse> {
  const res = await fetch(`${AUTH_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorBody = await parseError(res);
    if (res.status === 409) {
      throw new Error(errorBody.error || "Ese usuario ya existe");
    }
    throw new Error(errorBody.error || "Error al registrarse");
  }

  const authData = await res.json();

  // Sincronizar automáticamente con user-service
  try {
    await syncUser(authData.token);
    console.log("✅ Usuario registrado y sincronizado con user-service");
  } catch (syncError) {
    console.warn("⚠️ Error al sincronizar con user-service:", syncError);
    // No bloqueamos el registro si falla la sincronización
  }

  return authData;
}

export async function logoutRequest(token: string): Promise<void> {
  const res = await fetch(`${AUTH_BASE_URL}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Aceptamos 204 como OK; si viene otra cosa, no rompemos el cliente,
  // solo lo anotamos en consola.
  if (!res.ok && res.status !== 204) {
    console.warn("Logout request failed with status", res.status);
  }
}

export async function get2faStatus(token: string): Promise<{ enabled: boolean }> {
  const res = await fetch(`${AUTH_BASE_URL}/2fa/status`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("No se pudo obtener el estado 2FA");
  return res.json();
}

export async function init2fa(token: string): Promise<{ secret: string; otpauth: string }> {
  const res = await fetch(`${AUTH_BASE_URL}/2fa/init`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error("No se pudo iniciar 2FA");
  return res.json();
}

export async function confirm2fa(token: string, otp: string): Promise<{ enabled: boolean }> {
  const res = await fetch(`${AUTH_BASE_URL}/2fa/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "Código 2FA incorrecto");
  }
  return res.json();
}

export async function disable2fa(token: string, otp: string): Promise<{ enabled: boolean }> {
  const res = await fetch(`${AUTH_BASE_URL}/2fa/disable`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ otp }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || "No se pudo desactivar 2FA");
  }
  return res.json();
}
