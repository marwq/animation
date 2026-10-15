#!/bin/bash
# Весь ролик одним файлом: видео минут склеиваются без перекодирования, звук собирается целиком.
#   pov/assemble-full.sh   -> pov/out/what_if_you_kept_sinking_forever.mp4
set -e
cd "$(dirname "$0")/.."
LIST=pov/out/full_parts.txt
: > "$LIST"
for r in 0_60 60_120 120_180 180_240 240_300 300_360 360_420 420_480 480_540 540_600 600_660 660_720 720_780 780_840 840_900 900_930; do
  echo "file '$(pwd)/pov/out/min/video_${r}.mp4'" >> "$LIST"
done
ffmpeg -y -loglevel error -f concat -safe 0 -i "$LIST" -c copy pov/out/full_video.mp4
python3 pov/assemble_audio.py 0 930 pov/out/full_audio.wav
ffmpeg -y -loglevel error -i pov/out/full_video.mp4 -i pov/out/full_audio.wav -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart pov/out/what_if_you_kept_sinking_forever.mp4
ffprobe -v error -show_entries format=duration -of csv=p=0 pov/out/what_if_you_kept_sinking_forever.mp4
du -h pov/out/what_if_you_kept_sinking_forever.mp4
