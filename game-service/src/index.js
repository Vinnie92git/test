import Fastify from 'fastify'
const fastify = Fastify({ logger: true })

fastify.get('/', async () => {
  return { message: 'Game Service activo' }
})

fastify.listen({ port: 4000, host: '0.0.0.0' }, err => {
  if (err) throw err
  console.log('Game Service iniciado en puerto 4000')
})
