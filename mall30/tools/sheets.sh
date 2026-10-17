#!/bin/sh
# Контактные листы нескольких дней в одну картинку: tools/sheets.sh d08 d09 d10
cd "$(dirname "$0")/.."
for k in "$@"; do python3 tools/preview.py sheet "$k" 1.5 >/dev/null || exit 1; done
python3 - "$@" <<'PY'
import sys
from PIL import Image
ims = [Image.open(f"build/preview/{k}_sheet.jpg") for k in sys.argv[1:]]
w = 1920 // len(ims)
ims = [i.resize((w, int(i.height * w / i.width))) for i in ims]
c = Image.new("RGB", (w * len(ims), max(i.height for i in ims)), "white")
for n, i in enumerate(ims):
    c.paste(i, (n * w, 0))
c.save("build/preview/multi.jpg", quality=88)
PY
