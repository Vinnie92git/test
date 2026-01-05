import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';

// Ensure data directory exists
if (!existsSync('./data')) {
  mkdirSync('./data', { recursive: true });
}

const db = new Database('./data/user.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    auth_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    display_name TEXT,
    avatar TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(auth_id)
  );

  CREATE TABLE IF NOT EXISTS friendships (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    friend_id INTEGER NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'blocked')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (friend_id) REFERENCES users(id),
    UNIQUE(user_id, friend_id)
  );
`);

export function upsertUserFromAuth(authId, username, displayName = null, avatar = null) {
  const existing = db.prepare(`SELECT id FROM users WHERE auth_id = ?`).get(authId);
  if (existing) {
    const stmt = db.prepare(`
      UPDATE users SET username = ?, display_name = ?, avatar = ? WHERE auth_id = ?
    `);
    stmt.run(username, displayName, avatar, authId);
    return { id: existing.id, authId, username, displayName, avatar };
  }

  const stmt = db.prepare(`
    INSERT INTO users (auth_id, username, display_name, avatar)
    VALUES (?, ?, ?, ?)
  `);
  const info = stmt.run(authId, username, displayName, avatar);
  return { id: info.lastInsertRowid, authId, username, displayName, avatar };
}

export function findByAuthId(authId) {
  const row = db.prepare(`SELECT id, auth_id as authId, username, display_name as displayName, avatar, created_at as createdAt FROM users WHERE auth_id = ?`).get(authId);
  return row || null;
}

// ==================== FRIENDSHIP FUNCTIONS ====================

/**
 * Enviar solicitud de amistad
 */
export function sendFriendRequest(userId, friendId) {
  if (userId === friendId) {
    throw new Error('No puedes enviarte una solicitud a ti mismo');
  }

  // Verificar que ambos usuarios existen
  const user = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
  const friend = db.prepare('SELECT id FROM users WHERE id = ?').get(friendId);
  
  if (!user || !friend) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar si ya existe una relación
  const existing = db.prepare(`
    SELECT * FROM friendships 
    WHERE (user_id = ? AND friend_id = ?) 
       OR (user_id = ? AND friend_id = ?)
  `).get(userId, friendId, friendId, userId);

  if (existing) {
    if (existing.status === 'blocked') {
      throw new Error('No puedes enviar solicitud a este usuario');
    }
    throw new Error('Ya existe una solicitud de amistad');
  }

  const stmt = db.prepare(`
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (?, ?, 'pending')
  `);
  
  const info = stmt.run(userId, friendId);
  return { id: info.lastInsertRowid, userId, friendId, status: 'pending' };
}

/**
 * Aceptar solicitud de amistad
 */
export function acceptFriendRequest(userId, friendId) {
  const friendship = db.prepare(`
    SELECT * FROM friendships 
    WHERE user_id = ? AND friend_id = ? AND status = 'pending'
  `).get(friendId, userId);

  if (!friendship) {
    throw new Error('Solicitud de amistad no encontrada');
  }

  const stmt = db.prepare(`
    UPDATE friendships 
    SET status = 'accepted' 
    WHERE id = ?
  `);
  
  stmt.run(friendship.id);
  return { success: true };
}

/**
 * Rechazar solicitud de amistad
 */
export function rejectFriendRequest(userId, friendId) {
  const result = db.prepare(`
    DELETE FROM friendships 
    WHERE user_id = ? AND friend_id = ? AND status = 'pending'
  `).run(friendId, userId);

  if (result.changes === 0) {
    throw new Error('Solicitud de amistad no encontrada');
  }

  return { success: true };
}

/**
 * Eliminar amigo
 */
export function removeFriend(userId, friendId) {
  const result = db.prepare(`
    DELETE FROM friendships 
    WHERE (user_id = ? AND friend_id = ?) 
       OR (user_id = ? AND friend_id = ?)
  `).run(userId, friendId, friendId, userId);

  if (result.changes === 0) {
    throw new Error('Amistad no encontrada');
  }

  return { success: true };
}

/**
 * Obtener lista de amigos aceptados
 */
export function getFriends(userId) {
  const friends = db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.display_name as displayName,
      u.avatar,
      f.created_at as friendsSince
    FROM friendships f
    JOIN users u ON (
      CASE 
        WHEN f.user_id = ? THEN u.id = f.friend_id
        ELSE u.id = f.user_id
      END
    )
    WHERE (f.user_id = ? OR f.friend_id = ?)
      AND f.status = 'accepted'
  `).all(userId, userId, userId);

  return friends;
}

/**
 * Obtener solicitudes de amistad pendientes (recibidas)
 */
export function getPendingRequests(userId) {
  const requests = db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.display_name as displayName,
      u.avatar,
      f.created_at as requestedAt
    FROM friendships f
    JOIN users u ON u.id = f.user_id
    WHERE f.friend_id = ? AND f.status = 'pending'
  `).all(userId);

  return requests;
}

/**
 * Obtener solicitudes enviadas (pendientes de aceptación)
 */
export function getSentRequests(userId) {
  const requests = db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.display_name as displayName,
      u.avatar,
      f.created_at as requestedAt
    FROM friendships f
    JOIN users u ON u.id = f.friend_id
    WHERE f.user_id = ? AND f.status = 'pending'
  `).all(userId);

  return requests;
}

/**
 * Bloquear usuario
 */
export function blockUser(userId, friendId) {
  // Primero eliminar cualquier amistad existente
  db.prepare(`
    DELETE FROM friendships 
    WHERE (user_id = ? AND friend_id = ?) 
       OR (user_id = ? AND friend_id = ?)
  `).run(userId, friendId, friendId, userId);

  // Crear relación de bloqueo
  const stmt = db.prepare(`
    INSERT INTO friendships (user_id, friend_id, status)
    VALUES (?, ?, 'blocked')
  `);
  
  stmt.run(userId, friendId);
  return { success: true };
}

/**
 * Buscar usuarios por username (para añadir amigos)
 */
export function searchUsers(query, currentUserId, limit = 10) {
  const users = db.prepare(`
    SELECT 
      u.id,
      u.username,
      u.display_name as displayName,
      u.avatar
    FROM users u
    WHERE u.username LIKE ? 
      AND u.id != ?
    LIMIT ?
  `).all(`%${query}%`, currentUserId, limit);

  return users;
}
