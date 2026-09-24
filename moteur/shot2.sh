#!/bin/sh
# usage: shot2.sh out.png "query" width height
Q="$2"; W="${3:-1360}"; H="${4:-900}"
/opt/pw-browsers/chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars --virtual-time-budget=90000 --window-size=$W,$H --screenshot="$1" "file://$(pwd)/shops2.html?$Q" 2>/dev/null >/dev/null
/opt/pw-browsers/chromium --headless=new --no-sandbox --disable-gpu --virtual-time-budget=90000 --dump-dom "file://$(pwd)/shops2.html?$Q" 2>/dev/null | grep -o '<pre class="err">[^<]*' | head -5
