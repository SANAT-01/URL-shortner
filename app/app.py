#!/usr/bin/env python3
"""shortly — a URL shortener (Python standard library only, no pip deps).

Endpoints:
  POST /shorten       -> body is the raw long URL; allocates an id from a Postgres
                         sequence, base62-encodes it, stores the mapping, returns
                         {"code": ..., "short_url": ...}
  GET  /r/<code>      -> redirect to the long URL (301 or 302 per REDIRECT_STATUS),
                         click counted in Redis under clicks:<code>
  GET  /stats/<code>  -> {"code": ..., "clicks": N} from Redis
  GET  /health        -> {"ok": true}

Cache-aside on the redirect path:
  * CACHE_ENABLED=false -> every redirect reads Postgres. Logs: DB READ url:<code> (<ms>ms)
  * CACHE_ENABLED=true  -> look in Redis first.
        hit  -> logs:  CACHE HIT url:<code> (<ms>ms)
        miss -> read Postgres, SET url:<code> with a 1h TTL, logs:
                CACHE MISS url:<code> -> db (<ms>ms)

Redis and Postgres are reached with tiny hand-rolled clients (RESP / PG wire v3,
trust auth) so the image needs no third-party packages — just python:alpine.
"""
import json
import os
import socket
import struct
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CACHE_ENABLED = os.environ.get("CACHE_ENABLED", "false").lower() == "true"
REDIRECT_STATUS = int(os.environ.get("REDIRECT_STATUS", "302"))
CACHE_TTL = 3600  # long enough to outlast the lab session
PGHOST = os.environ.get("PGHOST", "pg")
PGUSER = os.environ.get("PGUSER", "app")
PGDATABASE = os.environ.get("PGDATABASE", "shortener")
REDISHOST = os.environ.get("REDISHOST", "redis")

ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"


def base62(n):
    if n == 0:
        return ALPHABET[0]
    out = ""
    while n:
        n, r = divmod(n, 62)
        out = ALPHABET[r] + out
    return out


# ----------------------------- minimal Redis (RESP) -----------------------------
def _redis(*args):
    with socket.create_connection((REDISHOST, 6379), timeout=5) as s:
        cmd = b"*%d\r\n" % len(args)
        for a in args:
            b = str(a).encode()
            cmd += b"$%d\r\n%s\r\n" % (len(b), b)
        s.sendall(cmd)
        return _resp_read(s.makefile("rb"))


def _resp_read(f):
    line = f.readline()
    tag, rest = line[:1], line[1:].strip()
    if tag == b"+":
        return rest.decode()
    if tag == b"-":
        raise RuntimeError(rest.decode())
    if tag == b":":
        return int(rest)
    if tag == b"$":
        n = int(rest)
        if n == -1:
            return None
        data = f.read(n)
        f.read(2)  # trailing CRLF
        return data.decode()
    if tag == b"*":
        n = int(rest)
        return None if n == -1 else [_resp_read(f) for _ in range(n)]
    return None


# ------------------- minimal Postgres (wire v3, trust auth) ---------------------
def _pg_read_msg(f):
    hdr = f.read(5)
    if len(hdr) < 5:
        return None, b""
    tag = hdr[:1]
    length = struct.unpack("!I", hdr[1:5])[0]
    return tag, f.read(length - 4)


def pg_query_scalar(sql):
    """Run a simple query and return the first column of the first row (text), or None."""
    with socket.create_connection((PGHOST, 5432), timeout=5) as s:
        params = b"user\x00" + PGUSER.encode() + b"\x00database\x00" + PGDATABASE.encode() + b"\x00\x00"
        s.sendall(struct.pack("!II", len(params) + 8, 196608) + params)
        f = s.makefile("rb")
        while True:
            tag, _ = _pg_read_msg(f)
            if tag is None or tag == b"Z":
                break
        query = sql.encode() + b"\x00"
        s.sendall(b"Q" + struct.pack("!I", len(query) + 4) + query)
        value = None
        while True:
            tag, body = _pg_read_msg(f)
            if tag is None:
                break
            if tag == b"D":  # DataRow
                ncols = struct.unpack("!H", body[:2])[0]
                off = 2
                for i in range(ncols):
                    ln = struct.unpack("!i", body[off:off + 4])[0]
                    off += 4
                    if ln == -1:
                        col = None
                    else:
                        col = body[off:off + ln].decode()
                        off += ln
                    if i == 0 and value is None:
                        value = col
            elif tag == b"Z":  # ReadyForQuery
                break
        return value


def sql_quote(text):
    return "'" + text.replace("'", "''") + "'"


# ----------------------------------- HTTP --------------------------------------
class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _json(self, code, obj):
        data = (json.dumps(obj) + "\n").encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        path = self.path.split("?", 1)[0]
        if path != "/shorten":
            self._json(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length") or 0)
        long_url = self.rfile.read(length).decode().strip()
        if not long_url.startswith("http"):
            self._json(400, {"error": "body must be a URL starting with http(s)"})
            return
        try:
            # The key-generation fork from the video: a global counter (a Postgres
            # sequence) + base62. No hash collisions, no retry loop.
            next_id = int(pg_query_scalar("SELECT nextval('link_ids')"))
            code = base62(next_id)
            pg_query_scalar(
                "INSERT INTO links (id, code, long_url) VALUES (%d, %s, %s) RETURNING code"
                % (next_id, sql_quote(code), sql_quote(long_url))
            )
        except Exception as e:
            print("DB ERROR shorten: %s" % e, flush=True)
            self._json(503, {"error": "database unavailable"})
            return
        print("SHORTEN %s -> %s" % (code, long_url), flush=True)
        self._json(201, {"code": code, "short_url": "http://localhost:8000/r/%s" % code})

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path.startswith("/r/"):
            self.redirect(path[3:])
        elif path.startswith("/stats/"):
            self.stats(path.rsplit("/", 1)[-1])
        elif path == "/health":
            self._json(200, {"ok": True})
        else:
            self._json(404, {"error": "not found"})

    def redirect(self, code):
        key = "url:%s" % code
        long_url = None
        if CACHE_ENABLED:
            t0 = time.time()
            try:
                long_url = _redis("GET", key)
            except Exception:
                long_url = None
            if long_url is not None:
                print("CACHE HIT %s (%.1fms)" % (key, (time.time() - t0) * 1000), flush=True)
        if long_url is None:
            t0 = time.time()
            try:
                long_url = pg_query_scalar("SELECT long_url FROM links WHERE code = %s" % sql_quote(code))
            except Exception as e:
                print("DB ERROR %s: %s" % (key, e), flush=True)
                self._json(503, {"error": "database unavailable"})
                return
            ms = (time.time() - t0) * 1000
            if long_url is None:
                print("DB READ %s (%.0fms) [not found]" % (key, ms), flush=True)
                self._json(404, {"error": "no such link"})
                return
            if CACHE_ENABLED:
                try:
                    _redis("SET", key, long_url, "EX", CACHE_TTL)
                except Exception:
                    pass
                print("CACHE MISS %s -> db (%.0fms)" % (key, ms), flush=True)
            else:
                print("DB READ %s (%.0fms)" % (key, ms), flush=True)
        # The click counter always runs — this is the "visibility" the 301 task
        # is about. Browsers that cache a 301 never reach this line again.
        try:
            _redis("INCR", "clicks:%s" % code)
        except Exception:
            pass
        body = b""
        self.send_response(REDIRECT_STATUS)
        self.send_header("Location", long_url)
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def stats(self, code):
        try:
            clicks = _redis("GET", "clicks:%s" % code)
        except Exception:
            clicks = None
        self._json(200, {"code": code, "clicks": int(clicks or 0)})

    def log_message(self, *_):
        pass  # our own log lines above are the interesting ones


if __name__ == "__main__":
    # Default socketserver backlog is 5 — hammer.sh's 20-way concurrency overflows
    # it and hides the DB-vs-cache latency story behind ~1s TCP SYN retransmits.
    ThreadingHTTPServer.request_queue_size = 128
    ThreadingHTTPServer(("0.0.0.0", 8000), Handler).serve_forever()
