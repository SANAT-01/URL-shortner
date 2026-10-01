'use strict';

// CRLF in a value that later lands in a response header (e.g. Location) would
// corrupt the HTTP response — reject it at the boundary instead.
function hasCrlf(value) {
  return /[\r\n]/.test(value);
}

module.exports = { hasCrlf };
