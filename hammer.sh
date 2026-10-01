#!/bin/sh
# hammer.sh [N] [CONCURRENCY] [CODE] — hammer one short code and print latency stats.
# Defaults: 200 requests, 20 in flight, code cat42 (the celebrity link).
N="${1:-200}"
C="${2:-20}"
CODE="${3:-cat42}"
URL="http://localhost:8000/r/$CODE"
DIR=$(mktemp -d)
PER=$((N / C))

i=0
while [ "$i" -lt "$C" ]; do
  (
    j=0
    while [ "$j" -lt "$PER" ]; do
      curl -s -o /dev/null -w "%{time_total}\n" "$URL"
      j=$((j + 1))
    done
  ) > "$DIR/w$i" &
  i=$((i + 1))
done
wait

cat "$DIR"/w* | sort -n > "$DIR/all"
TOTAL=$(wc -l < "$DIR/all" | tr -d '[:space:]')
awk -v total="$TOTAL" '
  { ms[NR] = $1 * 1000 }
  END {
    p50 = ms[int(total * 0.50) + (total * 0.50 == int(total * 0.50) ? 0 : 1)]
    p99 = ms[int(total * 0.99) + (total * 0.99 == int(total * 0.99) ? 0 : 1)]
    if (int(total * 0.99) >= total) p99 = ms[total]
    sum = 0; for (i = 1; i <= total; i++) sum += ms[i]
    printf "%d requests against /r/%s\n", total, code
    printf "  avg %.1fms   p50 %.1fms   p99 %.1fms\n", sum / total, p50, p99
  }
' code="$CODE" "$DIR/all"
rm -rf "$DIR"
