#!/usr/bin/env bash
# Сборка ролика: кадры планов → 1080×1920, цветокор, вспышки на ударах, приглушённый план 7,
# субтитры и звук → jersey-barrier.mp4
# usage: assemble.sh <render_dir> <mix.wav> <fonts_dir> <out.mp4>
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
R="$1"; MIX="$2"; FONTS="$3"; OUT="$4"
SEQ="$(mktemp -d)"
i=0
for shot in s1_hook s2_aerial s3_slope s4_wall s5a_climb s5b_lane s6_replay s7_case s8_final; do
  for f in $(ls "$R/$shot"/f_*.jpg | sort); do
    ln -s "$f" "$SEQ/$(printf %05d $i).jpg"; i=$((i+1))
  done
done
echo "frames: $i"
read -r HOOK WALL REPLAY <<<"$(python3 -c "import json;e=json.load(open('$HERE/events.json'));print(e['hook_impact'],e['wall_impact'],e['replay_impact'])")"
flash() { echo "eq=brightness=0.22:contrast=1.15:enable='between(t,$1,$1+0.084)'"; }
VF="scale=1080:1920:flags=lanczos,unsharp=5:5:0.5:5:5:0.0,eq=contrast=1.04:saturation=1.08"
VF="$VF,$(flash "$HOOK"),$(flash "$WALL"),$(flash "$REPLAY")"
VF="$VF,eq=saturation=0.85:brightness=-0.04:enable='between(t,19.06,25.46)',vignette=angle=PI/4.5:enable='between(t,19.06,25.46)'"
VF="$VF,ass=$HERE/subs.ass:fontsdir=$FONTS"
ffmpeg -hide_banner -loglevel error -y -framerate 24 -i "$SEQ/%05d.jpg" -i "$MIX" \
  -vf "$VF" -c:v libx264 -preset slow -crf 17 -profile:v high -pix_fmt yuv420p \
  -c:a aac -b:a 192k -ar 48000 -t 28 -movflags +faststart "$OUT"
rm -rf "$SEQ"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
