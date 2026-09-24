#!/bin/bash
cd "$(dirname "$0")"
enc() { python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }
CH=/opt/pw-browsers/chromium; OPT="--headless=new --no-sandbox --disable-gpu --hide-scrollbars"
$CH $OPT --virtual-time-budget=200000 --window-size=1200,2200 --screenshot=recap-1.png "file://$(pwd)/base.html?size=230&title=$(enc '1 · Tokens de base — 8 finitions × 4 états')" 2>/dev/null >/dev/null &
$CH $OPT --virtual-time-budget=200000 --window-size=1440,1300 --screenshot=recap-2.png "file://$(pwd)/frames.html?cols=5&size=250&title=$(enc '2 · Cadres épiques — 20 entités spéciales')" 2>/dev/null >/dev/null &
./shot2.sh recap-3.png "pack=1&title=$(enc '3 · Boutiques, pack 1 — objets entassés')&sub1=$(enc '7 boutiques + Marché ambulant')" 1360 860 &
./shot2.sh recap-4.png "pack=2&concept=vitrine&title=$(enc '4 · Boutiques, pack 2 — Vitrine')&sub=$(enc '7 boutiques + Marché ambulant')" 1360 860 &
wait
./shot2.sh recap-5.png "pack=2&concept=enseigne&title=$(enc '5 · Boutiques, pack 2 — Enseigne')&sub=$(enc '7 boutiques + Marché ambulant')" 1360 860 &
./shot2.sh recap-6.png "pack=2&concept=auvent&title=$(enc '6 · Boutiques, pack 2 — Auvent')&sub=$(enc '7 boutiques + Marché ambulant')" 1360 860 &
./shot2.sh recap-7.png "pack=2&concept=porte&title=$(enc '7 · Boutiques, pack 2 — Porte')&sub=$(enc '7 boutiques + Marché ambulant')" 1360 860 &
$CH $OPT --virtual-time-budget=200000 --window-size=1360,860 --screenshot=recap-8.png "file://$(pwd)/fonds.html?title=$(enc '8 · Fonds sans PNJ — A · Intérieur')" 2>/dev/null >/dev/null &
wait
ls -la recap-*.png
