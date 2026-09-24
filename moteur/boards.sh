#!/bin/bash
cd "$(dirname "$0")"
enc() { python3 -c "import urllib.parse,sys;print(urllib.parse.quote(sys.argv[1]))" "$1"; }
./shot2.sh final-fondsA.png "pack=2&concept=porte&bg=A&title=$(enc 'Fonds sans PNJ — A · Intérieur')&sub=$(enc 'On voit la boutique par la porte ouverte (montré ici dans les contours Porte)')" 1360 860 &
./shot2.sh final-fondsB.png "pack=2&concept=porte&bg=B&title=$(enc 'Fonds sans PNJ — B · Objet phare')&sub=$(enc 'L’objet emblématique de la boutique sous un halo (montré ici dans les contours Porte)')" 1360 860 &
/opt/pw-browsers/chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars --virtual-time-budget=200000 --window-size=1380,1330 --screenshot=final-situation.png "file://$(pwd)/combo.html?preset=situation&size=250&cols=5" 2>/dev/null >/dev/null &
wait
ls -la final-fondsA.png final-fondsB.png final-situation.png final-ambulant.png
