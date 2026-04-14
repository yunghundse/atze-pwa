#!/bin/bash
# atze PWA — Lokaler Testserver
# Öffnet die App im Browser auf http://localhost:8080

echo ""
echo "  🌴 atze — Lokaler Testserver"
echo "  ───────────────────────────"
echo "  Öffne im Browser: http://localhost:8080"
echo "  Stoppen: Ctrl+C"
echo ""

cd "$(dirname "$0")"

# Versuche Python 3, dann Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server 8080
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8080
else
    echo "Python nicht gefunden. Installiere Python oder öffne index.html direkt im Browser."
    exit 1
fi
