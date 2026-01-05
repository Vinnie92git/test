import Fastify from 'fastify'
const fastify = Fastify({ logger: true })

fastify.get('/', async () => {
  return { message: 'Chat Service activo' }
})

fastify.listen({ port: 5001, host: '0.0.0.0' }, err => {
  if (err) throw err
  console.log('Chat Service iniciado en puerto 5001')
})
