# 🔄 Integración Frontend → Auth Service → User Service

## 📋 Resumen de Cambios

He implementado el flujo completo de autenticación y sincronización de usuarios entre el frontend, auth-service y user-service.

---

## 🎯 Flujo Completo Implementado

```
┌─────────────────────────────────────────────────────────────────┐
│                        1. REGISTRO/LOGIN                         │
│                                                                  │
│  Frontend (auth.ts) → auth-service:3001                         │
│  ├─ POST /register  →  Crea usuario + Hash password            │
│  └─ POST /login     →  Valida credenciales                     │
│                                                                  │
│  Respuesta: { userId, username, token }                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    2. SINCRONIZACIÓN AUTOMÁTICA                  │
│                                                                  │
│  authClient.ts → user-service:3002                              │
│  └─ POST /sync + JWT  →  Crea/actualiza perfil en user.db      │
│                                                                  │
│  ✅ Esto ocurre AUTOMÁTICAMENTE tras login/registro exitoso     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    3. NAVEGACIÓN AL INICIO                       │
│                                                                  │
│  main.ts guarda en localStorage:                                │
│  ├─ authToken: "eyJhbGciOi..."                                  │
│  └─ username: "alice"                                           │
│                                                                  │
│  Redirige a: window.location.hash = "inicio"                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    4. CONSULTAR PERFIL (opcional)                │
│                                                                  │
│  Usuario navega a página "Perfil" (TU PERFIL)                  │
│  main.ts → user-service:3002                                    │
│  └─ GET /me + JWT  →  Obtiene datos completos del perfil       │
│                                                                  │
│  Muestra: ID, username, displayName, avatar, createdAt          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Archivos Creados

### 1. `/frontend/src/api/userClient.ts` ✨ NUEVO
Cliente TypeScript para comunicarse con `user-service`.

**Funciones exportadas:**
```typescript
// Sincroniza usuario con user-service (llamado automáticamente)
syncUser(token: string): Promise<SyncResponse>

// Obtiene perfil completo del usuario
getMyProfile(token: string): Promise<MeResponse>
```

**Interfaces:**
```typescript
interface UserProfile {
  id: number;              // ID local en user-service
  authId: number;          // ID del usuario en auth-service
  username: string;
  displayName: string | null;
  avatar: string | null;
  createdAt: string;       // ISO timestamp
}
```

---

## 🔧 Archivos Modificados

### 1. `/frontend/src/api/authClient.ts`

**Cambios:**
- ✅ Importa `syncUser` de `userClient.ts`
- ✅ Después de `login()` exitoso → llama `syncUser(token)`
- ✅ Después de `register()` exitoso → llama `syncUser(token)`

**Código añadido:**
```typescript
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
```

**⚠️ Nota importante:**
- Si `user-service` está caído, el login/registro **NO falla**
- Solo se muestra un warning en consola
- El usuario puede seguir usando la app con el token de auth

---

### 2. `/frontend/src/pages/profile.ts`

**Cambios:**
- ✅ Diseño completo de la página de perfil
- ✅ Avatar circular con inicial del username
- ✅ Contenedor `<div id="profile-data">` para cargar datos dinámicamente
- ✅ Spinner de carga mientras se obtienen los datos
- ✅ Botón "Cerrar sesión" (`btn-logout`)

**Diseño:**
```
┌────────────────────────────────────────┐
│           TU PERFIL                    │
│                                        │
│  ┌────────┐                            │
│  │   A    │  alice                     │
│  └────────┘  Miembro                   │
│                                        │
│  ┌──────────────────────────────────┐ │
│  │ User ID          #1              │ │
│  │ Username         alice           │ │
│  │ Display Name     —               │ │
│  │ Member since     12/16/2025      │ │
│  └──────────────────────────────────┘ │
│                                        │
│  [ Cerrar sesión ]                     │
└────────────────────────────────────────┘
```

---

### 3. `/frontend/src/main.ts`

**Cambios:**
- ✅ Importa `getMyProfile` de `userClient.ts`
- ✅ Añade lógica en `attachPageEvents()` para página "perfil"
- ✅ Carga automática del perfil al navegar a la página
- ✅ Manejo de errores con mensaje amigable
- ✅ Botón de logout funcional

**Lógica de carga del perfil:**
```typescript
if (page === "perfil") {
  // 1. Listener para el botón de logout
  const logoutBtn = document.getElementById("btn-logout");
  logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("username");
    window.location.hash = "auth";
  });

  // 2. Cargar perfil desde user-service
  const loadProfile = async () => {
    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const response = await getMyProfile(token);
      // Renderiza datos en profile-data
      profileDataDiv.innerHTML = `...`;
    } catch (err) {
      // Muestra error amigable
      profileDataDiv.innerHTML = `<p class="text-red-400">⚠️ Error</p>`;
    }
  };

  loadProfile();
}
```

---

### 4. `/frontend/src/i18n/es.ts` y `/frontend/src/i18n/en.ts`

**Traducciones añadidas:**
```typescript
general: {
  // ...existing translations...
  guest: "Invitado" / "Guest",
  member: "Miembro" / "Member",
  logout: "Cerrar sesión" / "Log out"
}
```

---

## 🧪 Cómo Probar el Flujo Completo

### **Requisitos previos:**
```bash
# 1. Levantar todos los servicios
docker-compose up --build

# 2. Verificar que estén corriendo:
docker-compose ps
# Deberías ver:
# - auth-service (puerto 3001)
# - user-service (puerto 3002)
# - frontend (puerto 3000)
```

### **Paso 1: Registrar usuario**
1. Abre el navegador en `http://localhost:3000`
2. Deberías ver la página de login/registro
3. Ingresa credenciales:
   - Usuario: `alice`
   - Contraseña: `secret123`
4. Click en **"Registrarse"**

**Lo que sucede internamente:**
```javascript
// 1. POST http://localhost:3001/register
//    { username: "alice", password: "secret123" }
//    ↓
//    auth-service guarda en auth.db
//    Respuesta: { userId: 1, username: "alice", token: "eyJ..." }

// 2. syncUser(token) automático
//    POST http://localhost:3002/sync
//    Authorization: Bearer eyJ...
//    ↓
//    user-service guarda en user.db
//    Respuesta: { ok: true, user: {...} }

// 3. localStorage.setItem("authToken", token)
//    localStorage.setItem("username", "alice")

// 4. Redirige a #inicio
```

**Verifica en consola del navegador:**
```
✅ Usuario registrado y sincronizado con user-service
Auth OK: { userId: 1, username: "alice", token: "..." }
```

---

### **Paso 2: Ver perfil**
1. Click en el menú superior: **"TU PERFIL"**
2. Deberías ver tu información:
   ```
   User ID: #1
   Username: alice
   Display Name: —
   Member since: 12/16/2025
   ```

**Lo que sucede internamente:**
```javascript
// GET http://localhost:3002/me
// Authorization: Bearer eyJ...
// ↓
// user-service busca en user.db WHERE auth_id = 1
// Respuesta: { user: { id: 1, authId: 1, username: "alice", ... } }
```

---

### **Paso 3: Verificar base de datos**

**Opción A: Desde contenedor**
```bash
# Ver datos en auth-service
docker-compose exec auth-service sqlite3 auth.db "SELECT * FROM auth_users;"
# Salida: 1|alice|$2a$10$...|2025-12-16 15:30:00

# Ver datos en user-service
docker-compose exec user-service sqlite3 user.db "SELECT * FROM users;"
# Salida: 1|1|alice|||2025-12-16 15:30:00
```

**Opción B: Copiar DB localmente**
```bash
docker cp ft_transcendence-user-service-1:/app/user.db ./user.db
sqlite3 user.db "SELECT * FROM users;"
```

---

### **Paso 4: Probar login (usuario existente)**
1. Click en **"Cerrar sesión"** en el perfil
2. Deberías volver a la página de login
3. Ingresa las mismas credenciales: `alice` / `secret123`
4. Click en **"Iniciar sesión"**

**Lo que sucede:**
- auth-service valida password
- syncUser() actualiza datos en user-service (idempotente)
- Redirige a inicio

---

## 🔍 Debugging y Troubleshooting

### **Problema: "Error al sincronizar con user-service"**

**Causa:** `user-service` no está corriendo o tiene error

**Solución:**
```bash
# Ver logs de user-service
docker-compose logs user-service

# Verificar que esté levantado
docker-compose ps user-service

# Reconstruir si es necesario
docker-compose up --build user-service
```

---

### **Problema: "Token inválido" en user-service**

**Causa:** Los servicios usan diferentes `AUTH_JWT_SECRET`

**Solución:**
1. Verificar que ambos servicios carguen el mismo `.env`:
```yaml
# docker-compose.yml
user-service:
  env_file:
    - ./auth-service/.env  # ← DEBE ser el mismo
```

2. Verificar el contenido:
```bash
cat auth-service/.env | grep AUTH_JWT_SECRET
```

---

### **Problema: Perfil no carga (404)**

**Causa:** Usuario no sincronizado en `user-service`

**Solución manual:**
```bash
# 1. Obtener token desde localStorage del navegador
# Abre DevTools → Application → Local Storage → authToken

# 2. Sincronizar manualmente
curl -X POST http://localhost:3002/sync \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# 3. Verificar
curl http://localhost:3002/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 📊 Comparación: Antes vs Después

### **ANTES:**
```
Frontend → auth-service
  ↓
Login/Registro OK
  ↓
Token guardado en localStorage
  ↓
❌ No hay perfil de usuario extendido
❌ Cada servicio tendría que llamar a auth-service
```

### **DESPUÉS:**
```
Frontend → auth-service → user-service (automático)
  ↓                ↓             ↓
Login/Registro   JWT          Perfil creado
  ↓
Token guardado
  ↓
✅ Perfil disponible en user-service
✅ Otros servicios pueden consultar /me con JWT
✅ Datos extendidos (avatar, displayName, etc.)
✅ Historial centralizado
```

---

## 🚀 Próximas Mejoras Recomendadas

### **1. Actualizar perfil**
Añadir endpoint y UI para editar `displayName` y `avatar`:
```typescript
// userClient.ts
export async function updateProfile(token: string, data: {
  displayName?: string;
  avatar?: string;
}): Promise<UserProfile> {
  const res = await fetch(`${USER_BASE_URL}/me`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
}
```

### **2. Subir avatar**
Permitir upload de imágenes:
- Usar `FormData` para enviar archivos
- Almacenar en `/app/uploads` o servicio externo (S3)
- Guardar URL en campo `avatar`

### **3. Verificación de token en frontend**
Añadir middleware para verificar token antes de navegar:
```typescript
function requireAuth(page: Page): boolean {
  const token = localStorage.getItem("authToken");
  if (!token && page !== "auth") {
    window.location.hash = "auth";
    return false;
  }
  return true;
}
```

### **4. Refresh token**
Implementar refresh tokens para evitar que el usuario tenga que volver a loguearse cada hora:
- `auth-service`: Emitir `access_token` (1h) + `refresh_token` (7 días)
- Frontend: Antes de hacer requests, verificar expiración y renovar

### **5. Indicador de sincronización**
Mostrar toast/notificación cuando el usuario se sincroniza:
```typescript
// Después de syncUser()
showToast("✅ Perfil sincronizado");
```

---

## 📝 Notas Finales

### **✅ Ventajas de esta arquitectura:**
1. **Separación de concerns:** Auth vs Profile management
2. **Escalabilidad:** Cada servicio puede escalar independientemente
3. **Seguridad:** Passwords nunca salen de auth-service
4. **Flexibilidad:** Puedes añadir campos sin modificar auth
5. **Experiencia de usuario:** Sincronización automática transparente

### **⚠️ Consideraciones de producción:**
1. Mover `AUTH_JWT_SECRET` fuera del repo (Docker secrets, Vault)
2. Usar HTTPS en todos los servicios
3. Añadir rate limiting
4. Implementar refresh tokens
5. Añadir healthchecks en Docker Compose
6. Monitoreo y logging centralizado (ELK, Datadog)
7. Tests E2E del flujo completo

---

## 🎉 Resumen

Has implementado con éxito:
- ✅ Cliente TypeScript para `user-service` (`userClient.ts`)
- ✅ Sincronización automática tras login/registro
- ✅ Página de perfil funcional con datos reales
- ✅ Botón de logout
- ✅ Manejo de errores robusto
- ✅ Traducciones en español e inglés
- ✅ Integración completa Frontend ↔ Auth ↔ User

**El flujo ahora es completamente funcional de punta a punta.**
