'use strict';

const { createClient } = require('redis');
const config = require('../config');

const redis = createClient({
  socket: { host: config.redis.host, port: config.redis.port },
});
redis.on('error', (err) => console.error('Redis client error:', err.message));

module.exports = redis;
