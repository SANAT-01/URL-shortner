'use strict';

const express = require('express');
const redis = require('../db/redis');

const router = express.Router();

router.get('/stats/:code', async (req, res) => {
  const code = req.params.code;
  let clicks = null;
  try {
    clicks = await redis.get(`clicks:${code}`);
  } catch {
    clicks = null;
  }
  res.status(200).json({ code, clicks: parseInt(clicks || '0', 10) });
});

module.exports = router;
