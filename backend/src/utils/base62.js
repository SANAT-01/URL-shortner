'use strict';

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

function base62(n) {
  if (n === 0) return ALPHABET[0];
  let out = '';
  while (n > 0) {
    const r = n % 62;
    n = Math.floor(n / 62);
    out = ALPHABET[r] + out;
  }
  return out;
}

module.exports = { base62 };
