"""Сетка 2×2 стоп-кадров: python tools/grid.py d18:24 d19:20 d22:14 d30:20 → build/preview/grid.jpg"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from PIL import Image  # noqa: E402
from engine import render  # noqa: E402
from scenes import timeline  # noqa: E402

items = [a.split(":") for a in sys.argv[1:]]
film = timeline.build(only={k for k, _ in items})
ims = []
for k, t in items:
    seg = next(s for s in film.segments if s.key == k)
    p = os.path.join(ROOT, "build", "preview", "_g.png")
    render.still(film, seg.start + float(t), p)
    ims.append(Image.open(p).convert("RGB").resize((960, 540)))
cols = 2
rows = (len(ims) + 1) // 2
g = Image.new("RGB", (960 * cols, 540 * rows))
for i, im in enumerate(ims):
    g.paste(im, ((i % 2) * 960, (i // 2) * 540))
g.save(os.path.join(ROOT, "build", "preview", "grid.jpg"), quality=88)
