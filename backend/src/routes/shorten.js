'use strict';

const express = require('express');
const pool = require('../db/postgres');
const config = require('../config');
const { base62 } = require('../utils/base62');
const { hasCrlf } = require('../utils/http');

const router = express.Router();

// POST /shorten — body is the raw long URL. Allocates an id from the Postgres
// sequence, base62-encodes it, stores the mapping.
router.post('/shorten', express.text({ type: () => true, limit: '1mb' }), async (req, res) => {
  const longUrl = (req.body || '').toString().trim();
  if (!longUrl.startsWith('http') || hasCrlf(longUrl)) {
    res.status(400).json({ error: 'body must be a URL starting with http(s)' });
    return;
  }

  let code;
  try {
    const seq = await pool.query("SELECT nextval('link_ids') AS id");
    const nextId = Number(seq.rows[0].id);
    code = base62(nextId);
    await pool.query(
      'INSERT INTO links (id, code, long_url) VALUES ($1, $2, $3) RETURNING code',
      [nextId, code, longUrl]
    );
  } catch (err) {
    console.log(`DB ERROR shorten: ${err.message}`);
    res.status(503).json({ error: 'database unavailable' });
    return;
  }

  console.log(`SHORTEN ${code} -> ${longUrl}`);
  res.status(201).json({ code, short_url: `${config.publicBaseUrl}/r/${code}` });
});

module.exports = router;
