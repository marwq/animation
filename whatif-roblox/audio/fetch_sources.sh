#!/bin/bash
# Download the CC0 sound packs (OpenGameArt) used by audio/build_sfx.py into $SFX_SRC (default /tmp/sfxlib).
# All packs are CC0 (public domain): Kenney, Independent.nu, rubberduck, Fantozzi, qubodup and others.
set -e
DST=${SFX_SRC:-/tmp/sfxlib}; DL=$(mktemp -d)
B=https://opengameart.org/sites/default/files
ZIPS="RPGsounds_Kenney.zip UI_SFX_Set.zip kenney_casino-audio.zip Digital_SFX_Set.zip jingleSounds_Kenney.zip
kenney_interfaceSounds.zip sci-fi_sounds.zip swishes.zip 3pops.zip 100-CC0-SFX_0.zip sfx_100_v2.zip
water-splash-slime-sfx.zip sfx_loops.zip Rain%20OGG.zip 80-CC0-RPG-SFX_0.zip sound_effects.zip"
SEVENZ="Fantozzi-footsteps.7z independent_nu_ljudbank-hits_and_punches.7z"
LOOSE="bing_01_0.mp3 bing_02.mp3 bung_01.mp3 blah.mp3 bloop.mp3 blung_0.mp3 booleh.mp3 plup.mp3 uah.mp3 pop.ogg
applause-clapping-church-crowd-immersive.wav crowd_shouting.ogg boing.ogg"
mkdir -p "$DST/loose"
for z in $ZIPS; do f=$(python3 -c "import urllib.parse,sys;print(urllib.parse.unquote(sys.argv[1]))" "$z"); curl -sSL -o "$DL/$f" "$B/$z"; unzip -q -o "$DL/$f" -d "$DST/${f%.zip}"; done
pip install -q py7zr >/dev/null 2>&1 || true
for z in $SEVENZ; do curl -sSL -o "$DL/$z" "$B/$z"; python3 -I -c "import py7zr,sys; py7zr.SevenZipFile(sys.argv[1]).extractall(sys.argv[2])" "$DL/$z" "$DST/${z%.7z}"; done
for f in $LOOSE; do curl -sSL -o "$DST/loose/$f" "$B/$f"; done
echo "sources in $DST"
