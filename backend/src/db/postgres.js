'use strict';

const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.pg.host,
  port: config.pg.port,
  user: config.pg.user,
  password: config.pg.password,
  database: config.pg.database,
});

module.exports = pool;
