#!/bin/bash
# Один кусок ролика → копия для просмотра меньше 28 МБ (два прохода x264 под нужный размер).
#   pov/review-segment.sh pov/out/min/seg_180_240.mp4 pov/renders/minutes/04_3-00_4-00.mp4
set -e
SRC=$1
DST=$2
mkdir -p "$(dirname "$DST")"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
VBR=$(python3 -c "print(int(27.5 * 8 * 1024 / $DUR - 170))")
LOG=$(mktemp -d)/pass
ffmpeg -y -loglevel error -i "$SRC" -c:v libx264 -preset slow -b:v "${VBR}k" -pass 1 -passlogfile "$LOG" -an -f mp4 /dev/null
ffmpeg -y -loglevel error -i "$SRC" -c:v libx264 -preset slow -b:v "${VBR}k" -pass 2 -passlogfile "$LOG" -c:a aac -b:a 160k -movflags +faststart "$DST"
rm -rf "$(dirname "$LOG")"
echo "$DST $(du -m "$DST" | cut -f1) MB"
