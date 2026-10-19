"""Сетка поверх фона для разметки координат: python3 tools/grid.py name → scratch/grid_name.jpg"""
import os
import sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
name, out = sys.argv[1], sys.argv[2]
im = Image.open(os.path.join(ROOT, "assets", "bg", name + ".png")).convert("RGB")
d = ImageDraw.Draw(im)
w, h = im.size
for x in range(0, w, 100):
    d.line([(x, 0), (x, h)], fill=(255, 0, 0) if x % 500 == 0 else (255, 160, 160), width=3 if x % 500 == 0 else 1)
    if x % 200 == 0:
        d.text((x + 4, 4), str(x), fill=(255, 255, 0))
for y in range(0, h, 100):
    d.line([(0, y), (w, y)], fill=(0, 0, 255) if y % 500 == 0 else (160, 160, 255), width=3 if y % 500 == 0 else 1)
    if y % 200 == 0:
        d.text((4, y + 4), str(y), fill=(255, 255, 0))
im.resize((w // 2, h // 2)).save(out, quality=85)
