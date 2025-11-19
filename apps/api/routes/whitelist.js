'use strict'

const path = require('node:path')

// Load whitelist into memory at startup
const whitelistData = require('../data/whitelist.json')
const whitelistCache = new Set(whitelistData.map(addr => addr.toLowerCase()))

module.exports = async function (fastify, opts) {
  // GET /api/whitelist/check/:address
  fastify.get('/api/whitelist/check/:address', {
    schema: {
      params: {
        type: 'object',
        properties: {
          address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' }
        },
        required: ['address']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            isEligible: { type: 'boolean' },
            address: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            error: { type: 'string' }
          }
        }
      }
    }
  }, async function (request, reply) {
    const { address } = request.params

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return reply.status(400).send({
        error: 'Invalid address format. Must be a valid Ethereum address (0x...)'
      })
    }

    const isEligible = whitelistCache.has(address.toLowerCase())

    return {
      isEligible,
      address: address.toLowerCase()
    }
  })

  // GET /api/whitelist/count - Get total whitelisted addresses
  fastify.get('/api/whitelist/count', async function (request, reply) {
    return {
      count: whitelistCache.size
    }
  })
}
