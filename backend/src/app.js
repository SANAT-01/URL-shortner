'use strict';

const express = require('express');
const healthRouter = require('./routes/health');
const shortenRouter = require('./routes/shorten');
const redirectRouter = require('./routes/redirect');
const statsRouter = require('./routes/stats');

const app = express();
app.disable('x-powered-by');

app.use(healthRouter);
app.use(shortenRouter);
app.use(redirectRouter);
app.use(statsRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'not found' });
});

module.exports = app;
