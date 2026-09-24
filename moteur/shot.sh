#!/bin/sh
# usage: shot.sh out.png "query" width height
Q="$2"; W="${3:-1360}"; H="${4:-1500}"
/opt/pw-browsers/chromium --headless=new --no-sandbox --disable-gpu --hide-scrollbars --virtual-time-budget=60000 --window-size=$W,$H --screenshot="$1" "file://$(pwd)/frames.html?$Q" 2>/dev/null >/dev/null
