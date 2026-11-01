#!/bin/bash
# Timestamped contact sheet of the rendered full video, for syncing sound.
# usage: tools/strip.sh START DURATION [FPS=10] [OUT=/tmp/strip_START.jpg]
# Tiles are 320px wide, labelled with ABSOLUTE video time in seconds.
set -e
cd "$(dirname "$0")/.."
S=$1; D=$2; FPS=${3:-10}; OUT=${4:-/tmp/strip_${S}.jpg}
N=$(python3 -c "import math;print(max(1,math.ceil($D*$FPS)))")
COLS=6; ROWS=$(( (N + COLS - 1) / COLS ))
ffmpeg -v error -y -ss "$S" -t "$D" -i out/whatif_full.mp4 -vf "fps=$FPS,scale=320:-1,drawtext=text='%{pts\:flt\:$S}':x=6:y=6:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.65:fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf,tile=${COLS}x${ROWS}:padding=2" -frames:v 1 "$OUT"
echo "$OUT"
