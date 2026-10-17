#!/usr/bin/env bash
# Скачать ассеты (в репозиторий не кладём): небо, текстуры, звуки, шрифт.
# usage: fetch_assets.sh <assets_dir>
#   Poly Haven HDRI — CC0          https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky
#   ambientCG текстуры — CC0       https://ambientcg.com
#   Kenney Impact/Interface Sounds — CC0  https://kenney.nl/assets
#   Montserrat ExtraBold — SIL OFL https://fonts.google.com/specimen/Montserrat
set -euo pipefail
A="${1:-$(dirname "$0")/assets}"
mkdir -p "$A/tex" "$A/sfx" "$A/fonts"
curl -sSL -o "$A/sky.hdr" "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/2k/kloofendal_48d_partly_cloudy_puresky_2k.hdr"
for id in Asphalt026C Concrete034 Grass004 Gravel022; do
  curl -sSL -o "$A/tex/$id.zip" "https://ambientcg.com/get?file=${id}_1K-JPG.zip"
  mkdir -p "$A/tex/$id" && unzip -q -o "$A/tex/$id.zip" -d "$A/tex/$id"
done
for pk in impact-sounds interface-sounds; do
  url=$(curl -sS "https://kenney.nl/assets/$pk" | grep -oE "https://kenney.nl/media/pages/assets/$pk/[^\"]+\.zip" | head -1)
  curl -sSL -o "$A/sfx/$pk.zip" "$url" && mkdir -p "$A/sfx/$pk" && unzip -q -o "$A/sfx/$pk.zip" -d "$A/sfx/$pk"
done
ttf=$(curl -sS -A "Mozilla/5.0 (Windows NT 6.1)" "https://fonts.googleapis.com/css2?family=Montserrat:wght@800" | grep -oE "https://fonts.gstatic.com[^)]+" | head -1)
curl -sSL -o "$A/fonts/Montserrat-ExtraBold.ttf" "$ttf"
echo "assets in $A"
