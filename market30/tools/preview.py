"""Стоп-кадры: python3 tools/preview.py d00 1.0 5.5 ... → scratch/prev_d00_1.0.png;  --sheet — лист 4×3."""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
from engine.render import still  # noqa: E402
from scenes import timeline  # noqa: E402

OUT = os.environ.get("PREV", "/tmp/prev")


def main():
    args = sys.argv[1:]
    key = args.pop(0)
    film = timeline.build(only=[key])
    os.makedirs(OUT, exist_ok=True)
    S = film.segments[0]
    if args and args[0] == "--sheet":
        n = int(args[1]) if len(args) > 1 else 12
        ts = [S.dur * (i + 0.5) / n for i in range(n)]
    else:
        ts = [float(a) for a in args]
    paths = []
    for t in ts:
        p = os.path.join(OUT, f"prev_{key}_{t:05.2f}.png")
        still(film, S.start + t, p)
        paths.append(p)
    if len(paths) > 1:
        from PIL import Image
        cols = 3 if len(paths) > 4 else 2
        rows = (len(paths) + cols - 1) // cols
        sheet = Image.new("RGB", (640 * cols, 360 * rows))
        for i, p in enumerate(paths):
            sheet.paste(Image.open(p).convert("RGB").resize((640, 360)), ((i % cols) * 640, (i // cols) * 360))
        sheet.save(os.path.join(OUT, f"sheet_{key}.jpg"), quality=88)
        print(os.path.join(OUT, f"sheet_{key}.jpg"))
    else:
        print(paths[0])


if __name__ == "__main__":
    main()
