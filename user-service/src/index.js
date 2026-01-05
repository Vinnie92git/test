import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import { upsertUserFromAuth, findByAuthId } from './userRepository.js'
import friendRoutes from './routes/friendRoutes.js'

const fastify = Fastify({ logger: true })

// CORS básico para desarrollo
fastify.register(cors, {
  origin: ['http://localhost:3000', 'http://localhost:5173']
})

// JWT: usamos la misma clave que auth-service (en producción pasar via secrets)
fastify.register(jwt, {
  secret: process.env.AUTH_JWT_SECRET
})

// Middleware para extraer y verificar token enviado en Authorization
fastify.decorate('authenticate', async function (request, reply) {
  const auth = request.headers['authorization']
  if (!auth || !auth.startsWith('Bearer ')) {
    reply.code(401)
    throw new Error('Token ausente')
  }

  const token = auth.slice('Bearer '.length).trim()
  try {
    // request.jwtVerify() lee el header/crea request.user
    // usando token explícito con fastify jwt: fastify.jwt.verify(token)
    const payload = fastify.jwt.verify(token)
    request.user = payload
  } catch (err) {
    reply.code(401)
    throw new Error('Token inválido')
  }
})

// Salud
fastify.get('/', async () => ({ message: 'User Service activo' }))

// Endpoint: sincronizar/guardar info del usuario a partir del token
fastify.post('/sync', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const userPayload = request.user
  // payload esperado: { sub: userId, username }
  if (!userPayload || !userPayload.sub) {
    reply.code(400)
    return { error: 'Token sin payload esperado' }
  }

  const authId = userPayload.sub
  const username = userPayload.username || null
  const displayName = userPayload.displayName || null
  const avatar = userPayload.avatar || null

  try {
    const user = upsertUserFromAuth(authId, username, displayName, avatar)
    reply.code(200)
    return { ok: true, user }
  } catch (err) {
    request.log.error(err)
    reply.code(500)
    return { error: 'Error al guardar usuario' }
  }
})

// Obtener info del usuario por token
fastify.get('/me', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  const authId = request.user.sub
  const user = findByAuthId(authId)
  if (!user) {
    reply.code(404)
    return { error: 'Usuario no encontrado' }
  }
  return { user }
})

// Registrar rutas de amigos (con autenticación)
fastify.register(friendRoutes, { prefix: '', preHandler: [fastify.authenticate] })

fastify.listen({ port: 3002, host: '0.0.0.0' }, err => {
  if (err) throw err
  console.log('User Service iniciado en puerto 3002')
})
