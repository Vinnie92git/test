
import Database from 'better-sqlite3';
import crypto from 'crypto';

const db = new Database('auth.db');
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS auth_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    twofa_enabled INTEGER DEFAULT 0,
    twofa_secret TEXT,
    current_session_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS auth_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES auth_users(id) ON DELETE CASCADE
  );
`);

// Añadir columnas si no existen
try { db.exec("ALTER TABLE auth_users ADD COLUMN twofa_enabled INTEGER DEFAULT 0"); } catch (_) {}
try { db.exec("ALTER TABLE auth_users ADD COLUMN twofa_secret TEXT"); } catch (_) {}
try { db.exec("ALTER TABLE auth_users ADD COLUMN current_session_id INTEGER"); } catch (_) {}

export function createUser(username, passwordHash) {
  const stmt = db.prepare(`
    INSERT INTO auth_users (username, password_hash, twofa_enabled, twofa_secret)
    VALUES (?, ?, 0, NULL)
  `);
  const info = stmt.run(username, passwordHash);
  return {
    id: info.lastInsertRowid,
    username,
    twofaEnabled: false,
    twofaSecret: null,
  };
}

export function findUserByUsername(username) {
  const stmt = db.prepare(`
    SELECT id, username, password_hash, twofa_enabled, twofa_secret, current_session_id
    FROM auth_users
    WHERE username = ?
  `);
  const row = stmt.get(username);
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    twofaEnabled: !!row.twofa_enabled,
    twofaSecret: row.twofa_secret || null,
    currentSessionId: row.current_session_id,
  };
}

export function findUserById(id) {
  const stmt = db.prepare(`
    SELECT id, username, password_hash, twofa_enabled, twofa_secret, current_session_id
    FROM auth_users
    WHERE id = ?
  `);
  const row = stmt.get(id);
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    twofaEnabled: !!row.twofa_enabled,
    twofaSecret: row.twofa_secret || null,
    currentSessionId: row.current_session_id,
  };
}

export function setTwofaSecret(userId, secret) {
  const stmt = db.prepare(`
    UPDATE auth_users
    SET twofa_secret = ?, twofa_enabled = 0
    WHERE id = ?
  `);
  stmt.run(secret, userId);
}

export function enableTwofa(userId) {
  const stmt = db.prepare(`
    UPDATE auth_users
    SET twofa_enabled = 1
    WHERE id = ?
  `);
  stmt.run(userId);
}

export function disableTwofa(userId) {
  const stmt = db.prepare(`
    UPDATE auth_users
    SET twofa_enabled = 0, twofa_secret = NULL
    WHERE id = ?
  `);
  stmt.run(userId);
}

export function createSessionForUser(userId) {
  const sessionToken = crypto.randomUUID();

  const stmt = db.prepare(`
    INSERT INTO auth_sessions (user_id, session_token)
    VALUES (?, ?)
  `);
  const info = stmt.run(userId, sessionToken);

  // marcar esta sesión como la actual del usuario
  db.prepare(`
    UPDATE auth_users
    SET current_session_id = ?
    WHERE id = ?
  `).run(info.lastInsertRowid, userId);

  return {
    id: info.lastInsertRowid,
    userId,
    sessionToken,
  };
}

export function findSession(sessionId, userId) {
  const stmt = db.prepare(`
    SELECT id, user_id, session_token, created_at, last_seen_at
    FROM auth_sessions
    WHERE id = ? AND user_id = ?
  `);
  const row = stmt.get(sessionId, userId);
  if (!row) return null;

  // Opcional: actualizar last_seen_at en cada validación
  db.prepare(`
    UPDATE auth_sessions
    SET last_seen_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(row.id);

  return {
    id: row.id,
    userId: row.user_id,
    sessionToken: row.session_token,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
  };
}

export function deleteSession(sessionId, userId) {
  db.prepare(`
    DELETE FROM auth_sessions
    WHERE id = ? AND user_id = ?
  `).run(sessionId, userId);
}
