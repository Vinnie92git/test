import * as userRepo from '../userRepository.js';

export default async function friendRoutes(fastify, options) {
  // Enviar solicitud de amistad
  fastify.post('/friends/request', async (request, reply) => {
    const { friendId } = request.body;
    const userId = request.user.id;

    if (!friendId) {
      return reply.code(400).send({ error: 'friendId es requerido' });
    }

    try {
      const result = userRepo.sendFriendRequest(userId, friendId);
      return reply.send({ ok: true, friendship: result });
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Aceptar solicitud de amistad
  fastify.post('/friends/accept/:friendId', async (request, reply) => {
    const { friendId } = request.params;
    const userId = request.user.id;

    try {
      const result = userRepo.acceptFriendRequest(userId, parseInt(friendId));
      return reply.send({ ok: true, ...result });
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Rechazar solicitud de amistad
  fastify.post('/friends/reject/:friendId', async (request, reply) => {
    const { friendId } = request.params;
    const userId = request.user.id;

    try {
      const result = userRepo.rejectFriendRequest(userId, parseInt(friendId));
      return reply.send({ ok: true, ...result });
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Eliminar amigo
  fastify.delete('/friends/:friendId', async (request, reply) => {
    const { friendId } = request.params;
    const userId = request.user.id;

    try {
      const result = userRepo.removeFriend(userId, parseInt(friendId));
      return reply.send({ ok: true, ...result });
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Obtener lista de amigos
  fastify.get('/friends', async (request, reply) => {
    const userId = request.user.id;

    try {
      const friends = userRepo.getFriends(userId);
      return reply.send({ ok: true, friends });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Obtener solicitudes pendientes (recibidas)
  fastify.get('/friends/pending', async (request, reply) => {
    const userId = request.user.id;

    try {
      const requests = userRepo.getPendingRequests(userId);
      return reply.send({ ok: true, requests });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Obtener solicitudes enviadas
  fastify.get('/friends/sent', async (request, reply) => {
    const userId = request.user.id;

    try {
      const requests = userRepo.getSentRequests(userId);
      return reply.send({ ok: true, requests });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });

  // Bloquear usuario
  fastify.post('/friends/block/:friendId', async (request, reply) => {
    const { friendId } = request.params;
    const userId = request.user.id;

    try {
      const result = userRepo.blockUser(userId, parseInt(friendId));
      return reply.send({ ok: true, ...result });
    } catch (error) {
      return reply.code(400).send({ error: error.message });
    }
  });

  // Buscar usuarios
  fastify.get('/users/search', async (request, reply) => {
    const { q } = request.query;
    const userId = request.user.id;

    if (!q || q.trim().length === 0) {
      return reply.code(400).send({ error: 'Parámetro de búsqueda "q" es requerido' });
    }

    try {
      const users = userRepo.searchUsers(q, userId);
      return reply.send({ ok: true, users });
    } catch (error) {
      return reply.code(500).send({ error: error.message });
    }
  });
}
