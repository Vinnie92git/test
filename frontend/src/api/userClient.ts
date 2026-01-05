const USER_BASE_URL = "http://localhost:3002";

export interface UserProfile {
  id: number;
  authId: number;
  username: string;
  displayName: string | null;
  avatar: string | null;
  createdAt: string;
}

export interface SyncResponse {
  ok: boolean;
  user: UserProfile;
}

export interface MeResponse {
  user: UserProfile;
}

/**
 * Sincroniza el usuario en user-service después de login/registro.
 * Requiere un token JWT válido.
 */
export async function syncUser(token: string): Promise<SyncResponse> {
  const res = await fetch(`${USER_BASE_URL}/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let errorBody: any = {};
    try {
      errorBody = await res.clone().json();
    } catch {}
    throw new Error(errorBody.error || "Error al sincronizar usuario");
  }

  return res.json();
}

/**
 * Obtiene el perfil del usuario actual usando el token JWT.
 */
export async function getMyProfile(token: string): Promise<MeResponse> {
  const res = await fetch(`${USER_BASE_URL}/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    let errorBody: any = {};
    try {
      errorBody = await res.clone().json();
    } catch {}
    throw new Error(errorBody.error || "Error al obtener perfil");
  }

  return res.json();
}
