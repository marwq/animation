#!/bin/bash
# Готовая минута ролика про вращение: звук окна, склейка с видео, проверка, копия для просмотра < 28 МБ.
#   spin/finish-minute.sh 240 300 05_4-00_5-00
set -e
A=$1
B=$2
NAME=$3
cd "$(dirname "$0")/.."
python3 spin/audio.py "$A" "$B"
python3 spin/audio.py --cut "$A" "$B"
ffmpeg -y -loglevel error -i "spin/out/min/video_${A}_${B}.mp4" -i "spin/out/min/audio_${A}_${B}.wav" -c:v copy -c:a aac -b:a 192k -shortest "spin/out/min/seg_${A}_${B}.mp4"
echo "frames: $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "spin/out/min/seg_${A}_${B}.mp4")"
ffmpeg -hide_banner -nostats -i "spin/out/min/seg_${A}_${B}.mp4" -af ebur128=framelog=quiet -f null - 2>&1 | grep -A1 Integrated | tail -1
ffmpeg -y -loglevel error -i "spin/out/min/seg_${A}_${B}.mp4" -vf "fps=1/5,scale=480:-1,tile=4x3" -frames:v 1 "spin/out/sheet_${A}.png"
pov/review-segment.sh "spin/out/min/seg_${A}_${B}.mp4" "spin/renders/minutes/${NAME}.mp4"
