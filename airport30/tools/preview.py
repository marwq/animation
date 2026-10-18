"""Проверка: стоп-кадры сегмента и контактный лист, короткие видео-превью.

python tools/preview.py sheet d01 [шаг_сек]      → build/preview/d01_sheet.jpg
python tools/preview.py still d01 12.5            → build/preview/d01_12.50.png
python tools/preview.py clip d01 [нач] [кон] [fps] → build/preview/d01.mp4
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

from PIL import Image, ImageDraw  # noqa: E402
from engine import render  # noqa: E402
from scenes import timeline  # noqa: E402

OUT = os.path.join(ROOT, "build", "preview")


def main():
    os.makedirs(OUT, exist_ok=True)
    cmd, key = sys.argv[1], sys.argv[2]
    film = timeline.build(only={key})
    seg = next(s for s in film.segments if s.key == key)
    if cmd == "still":
        for a in sys.argv[3:]:
            t = float(a)
            p = os.path.join(OUT, f"{key}_{t:05.2f}.png")
            render.still(film, seg.start + t, p)
            print(p)
    elif cmd == "sheet":
        step = float(sys.argv[3]) if len(sys.argv) > 3 else 1.0
        ts = [0.05 + i * step for i in range(int(seg.dur / step))]
        if len(sys.argv) > 4:
            ts = [float(x) for x in sys.argv[4:]]
        thumbs = []
        for t in ts:
            p = os.path.join(OUT, "_tmp.png")
            render.still(film, seg.start + t, p)
            im = Image.open(p).convert("RGB").resize((480, 270))
            d = ImageDraw.Draw(im)
            d.rectangle([0, 0, 52, 16], fill="black")
            d.text((3, 2), f"{t:.2f}", fill="yellow")
            thumbs.append(im)
        cols = 4
        rows = (len(thumbs) + cols - 1) // cols
        sheet = Image.new("RGB", (480 * cols, 270 * rows), "white")
        for i, im in enumerate(thumbs):
            sheet.paste(im, ((i % cols) * 480, (i // cols) * 270))
        p = os.path.join(OUT, f"{key}_sheet.jpg")
        sheet.save(p, quality=85)
        print(p)
    elif cmd == "clip":
        t0 = float(sys.argv[3]) if len(sys.argv) > 3 else 0.0
        t1 = float(sys.argv[4]) if len(sys.argv) > 4 else seg.dur
        fps = int(sys.argv[5]) if len(sys.argv) > 5 else 30
        f0 = int((seg.start + t0) * 30)
        f1 = int((seg.start + t1) * 30)
        p = os.path.join(OUT, f"{key}.mp4")
        render.render_range(film, f0, f1, p, 30, max(1, 30 // fps))
        print(p)


if __name__ == "__main__":
    main()
