#!/usr/bin/env node
'use strict';

require('dotenv').config();

const app = require('./app');
const redis = require('./db/redis');
const config = require('./config');

async function main() {
  await redis.connect();
  app.listen(config.port, '0.0.0.0', () => {
    console.log(`listening on :${config.port}`);
  });
}

main().catch((err) => {
  console.error('fatal startup error:', err);
  process.exit(1);
});
