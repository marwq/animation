#!/bin/bash
# Готовая минута: звук (окно глубин + сборка), склейка с видео, копия для просмотра меньше 28 МБ.
#   pov/finish-minute.sh 420 480 08_7-00_8-00
set -e
A=$1
B=$2
NAME=$3
cd "$(dirname "$0")/.."
# первые три минуты звучат из audio.py, глубины — окнами audio_deep.py
if [ "$A" -ge 180 ] && [ ! -f "pov/out/deep_audio/seg_${A}_${B}.wav" ]; then python3 pov/audio_deep.py "$A" "$B"; fi
python3 pov/assemble_audio.py "$A" "$B"
ffmpeg -y -loglevel error -i "pov/out/min/video_${A}_${B}.mp4" -i "pov/out/min/audio_${A}_${B}.wav" -c:v copy -c:a aac -b:a 192k -shortest "pov/out/min/seg_${A}_${B}.mp4"
echo "frames: $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 "pov/out/min/seg_${A}_${B}.mp4")"
ffmpeg -y -loglevel error -i "pov/out/min/seg_${A}_${B}.mp4" -vf "fps=1/5,scale=480:-1,tile=4x3" -frames:v 1 "pov/out/sheet_${A}.png"
pov/review-segment.sh "pov/out/min/seg_${A}_${B}.mp4" "pov/renders/minutes/${NAME}.mp4"
