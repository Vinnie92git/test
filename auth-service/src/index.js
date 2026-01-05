import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import {
  createUser,
  findUserByUsername,
  createSessionForUser,
  findSession,
  deleteSession,
  findUserById,
  setTwofaSecret,
  enableTwofa,
  disableTwofa,
} from './userRepository.js';

const fastify = Fastify({ logger: true });

// Plugin JWT (tarea simple: firmar/verificar tokens)
fastify.register(jwt, {
  secret: process.env.AUTH_JWT_SECRET,
  sign: {
    algorithm: 'HS256',
    expiresIn: '1h',
  },
});

// Helper para proteger rutas con JWT
fastify.decorate('authenticate', async function (request, reply) {
  const auth = request.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401);
    throw new Error('Token ausente');
  }
  const token = auth.slice('Bearer '.length).trim();
  try {
    request.user = await request.jwtVerify({ token });
  } catch (err) {
    reply.code(401);
    throw new Error('Token inválido');
  }
});

// Salud
fastify.get('/', async () => {
  return { message: 'Auth Service activo' };
});

// REGISTRO
fastify.post('/register', async (request, reply) => {
  const { username, password } = request.body || {};
  if (!username || !password) {
    reply.code(400);
    return { error: 'Faltan credenciales' };
  }
  const existing = await findUserByUsername(username);
  if (existing) {
    reply.code(409);
    return { error: 'Ese usuario ya existe' };
  }
  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await createUser(username, passwordHash);

  // Crear sesión para el usuario
  const session = await createSessionForUser(user.id);
  const token = await reply.jwtSign({
    sub: user.id,
    username: user.username,
    sessionId: session.id,
  });

  reply.code(201);
  return {
    userId: user.id,
    username: user.username,
    token,
    twofaEnabled: false,
  };
});

// LOGIN
fastify.post('/login', async (request, reply) => {
  const { username, password, otp } = request.body || {};
  if (!username || !password) {
    reply.code(400);
    return { error: 'Faltan credenciales' };
  }
  const user = await findUserByUsername(username);
  if (!user) {
    reply.code(401);
    return { error: 'Usuario o contraseña incorrectos' };
  }
  const ok = bcrypt.compareSync(password, user.passwordHash);
  if (!ok) {
    reply.code(401);
    return { error: 'Usuario o contraseña incorrectos' };
  }

  // Validación 2FA si está habilitado
  if (user.twofaEnabled) {
    if (!otp) {
      reply.code(401);
      return { error: '2fa_required' };
    }
    const isValidOtp = authenticator.check(String(otp), user.twofaSecret || '');
    if (!isValidOtp) {
      reply.code(401);
      return { error: 'Código 2FA incorrecto' };
    }
  }

  const session = await createSessionForUser(user.id);
  const token = await reply.jwtSign({
    sub: user.id,
    username: user.username,
    sessionId: session.id,
  });
  
  return {
    userId: user.id,
    username: user.username,
    token,
    twofaEnabled: user.twofaEnabled,
  };
});

// LOGOUT
fastify.post(
  '/logout',
  { preHandler: [fastify.authenticate] },
  async (request, reply) => {
    const payload = request.user;

    if (payload.sessionId) {
      deleteSession(payload.sessionId, payload.sub);
    }

    reply.code(204);
  }
);

// /me (para otros microservicios y el front)
fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const payload = request.user;

  const user = findUserById(payload.sub);
  if (!user || user.currentSessionId !== payload.sessionId) {
    reply.code(401);
    return { error: 'Sesión inválida' };
  }

  const session = findSession(payload.sessionId, payload.sub);
  if (!session) {
    reply.code(401);
    return { error: 'Sesión inválida' };
  }

  return {
    userId: payload.sub,
    username: payload.username,
  };
});

// Estado de 2FA
fastify.get('/2fa/status', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await findUserById(request.user.sub);
  if (!user) {
    reply.code(404);
    return { error: 'Usuario no encontrado' };
  }
  return { enabled: user.twofaEnabled };
});

// Inicia configuración: genera secreto y lo guarda pendiente de confirmación
fastify.post('/2fa/init', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const user = await findUserById(request.user.sub);
  if (!user) {
    reply.code(404);
    return { error: 'Usuario no encontrado' };
  }

  const secret = authenticator.generateSecret();
  setTwofaSecret(user.id, secret);
  const otpauth = authenticator.keyuri(user.username, 'Ft_Transcendence', secret);

  return { secret, otpauth };
});

// Confirma código para habilitar 2FA
fastify.post('/2fa/confirm', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { otp } = request.body || {};
  if (!otp) {
    reply.code(400);
    return { error: 'Falta el código 2FA' };
  }

  const user = await findUserById(request.user.sub);
  if (!user) {
    reply.code(404);
    return { error: 'Usuario no encontrado' };
  }
  if (!user.twofaSecret) {
    reply.code(400);
    return { error: 'No hay secreto 2FA configurado. Inicia primero /2fa/init' };
  }

  const ok = authenticator.check(String(otp), user.twofaSecret);
  if (!ok) {
    reply.code(400);
    return { error: 'Código 2FA incorrecto' };
  }

  enableTwofa(user.id);
  return { enabled: true };
});

// Deshabilita 2FA verificando el código actual
fastify.post('/2fa/disable', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const { otp } = request.body || {};
  const user = await findUserById(request.user.sub);
  if (!user) {
    reply.code(404);
    return { error: 'Usuario no encontrado' };
  }
  if (!user.twofaEnabled) {
    return { enabled: false };
  }
  if (!otp) {
    reply.code(400);
    return { error: 'Falta el código 2FA' };
  }

  const ok = authenticator.check(String(otp), user.twofaSecret || '');
  if (!ok) {
    reply.code(400);
    return { error: 'Código 2FA incorrecto' };
  }

  disableTwofa(user.id);
  return { enabled: false };
});

const allowedOrigins = (process.env.AUTH_CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

fastify.register(cors, {
  origin: allowedOrigins.length > 0 ? allowedOrigins : false,
  methods: ["GET", "POST", "OPTIONS"],
});

fastify.listen({ port: 3001, host: '0.0.0.0' }, (err) => {
  if (err) throw err;
  console.log('Auth Service iniciado en puerto 3001');
});
