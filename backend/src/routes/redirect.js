'use strict';

const express = require('express');
const pool = require('../db/postgres');
const redis = require('../db/redis');
const config = require('../config');
const { hasCrlf } = require('../utils/http');

const router = express.Router();

// GET /r/<code> — cache-aside redirect.
//   CACHE_ENABLED=false -> every redirect reads Postgres.
//   CACHE_ENABLED=true  -> Redis first; miss falls through to Postgres and
//                          repopulates Redis with a TTL.
router.get('/r/:code', async (req, res) => {
  const code = req.params.code;
  const key = `url:${code}`;
  let longUrl = null;

  if (config.cacheEnabled) {
    const t0 = process.hrtime.bigint();
    try {
      longUrl = await redis.get(key);
    } catch {
      longUrl = null;
    }
    if (longUrl !== null) {
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      console.log(`CACHE HIT ${key} (${ms.toFixed(1)}ms)`);
    }
  }

  if (longUrl === null) {
    const t0 = process.hrtime.bigint();
    try {
      const result = await pool.query('SELECT long_url FROM links WHERE code = $1', [code]);
      longUrl = result.rows.length ? result.rows[0].long_url : null;
    } catch (err) {
      console.log(`DB ERROR ${key}: ${err.message}`);
      res.status(503).json({ error: 'database unavailable' });
      return;
    }
    const ms = Number(process.hrtime.bigint() - t0) / 1e6;
    if (longUrl === null) {
      console.log(`DB READ ${key} (${ms.toFixed(0)}ms) [not found]`);
      res.status(404).json({ error: 'no such link' });
      return;
    }
    if (config.cacheEnabled) {
      try {
        await redis.set(key, longUrl, { EX: config.cacheTtlSeconds });
      } catch {
        // best-effort cache write
      }
      console.log(`CACHE MISS ${key} -> db (${ms.toFixed(0)}ms)`);
    } else {
      console.log(`DB READ ${key} (${ms.toFixed(0)}ms)`);
    }
  }

  // The click counter always runs — browsers that cache a 301 never reach this again.
  try {
    await redis.incr(`clicks:${code}`);
  } catch {
    // best-effort click count
  }

  if (hasCrlf(longUrl)) {
    // Stored value is corrupt (shouldn't happen given the /shorten guard).
    res.status(500).json({ error: 'stored url is invalid' });
    return;
  }
  res.status(config.redirectStatus).location(longUrl).end();
});

module.exports = router;
