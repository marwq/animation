#!/bin/bash
# Делит готовый ролик на куски по минуте, каждый меньше 30 МБ (два прохода x264 под нужный размер),
# и делает одну копию для репозитория меньше 95 МБ.
#   pov/split-for-review.sh pov/out/style_test.mp4 pov/out/review
set -e
SRC=${1:-pov/out/style_test.mp4}
OUT=${2:-pov/out/review}
mkdir -p "$OUT"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$SRC")
PART=60
N=$(python3 -c "import math; print(math.ceil($DUR / $PART))")
for i in $(seq 0 $((N - 1))); do
  START=$((i * PART))
  LEN=$(python3 -c "print(min($PART, $DUR - $START))")
  # 28 МБ на кусок: видео = 28·8·1024 кбит / длина − 160 кбит звука
  VBR=$(python3 -c "print(int(28 * 8 * 1024 / $LEN - 160))")
  NAME="$OUT/part$((i + 1)).mp4"
  ffmpeg -y -loglevel error -ss "$START" -t "$LEN" -i "$SRC" -c:v libx264 -preset slow -b:v "${VBR}k" -pass 1 -passlogfile "$OUT/pass" -an -f mp4 /dev/null
  ffmpeg -y -loglevel error -ss "$START" -t "$LEN" -i "$SRC" -c:v libx264 -preset slow -b:v "${VBR}k" -pass 2 -passlogfile "$OUT/pass" -c:a aac -b:a 160k -movflags +faststart "$NAME"
  echo "$NAME $(du -m "$NAME" | cut -f1) MB"
done
# копия целиком для репозитория (GitHub не принимает файлы больше 100 МБ)
VBR=$(python3 -c "print(int(92 * 8 * 1024 / $DUR - 192))")
ffmpeg -y -loglevel error -i "$SRC" -c:v libx264 -preset slow -b:v "${VBR}k" -pass 1 -passlogfile "$OUT/pass" -an -f mp4 /dev/null
ffmpeg -y -loglevel error -i "$SRC" -c:v libx264 -preset slow -b:v "${VBR}k" -pass 2 -passlogfile "$OUT/pass" -c:a aac -b:a 192k -movflags +faststart "$OUT/full.mp4"
echo "$OUT/full.mp4 $(du -m "$OUT/full.mp4" | cut -f1) MB"
rm -f "$OUT"/pass*
