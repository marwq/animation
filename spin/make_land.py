"""Маска суши для глобуса (равнопромежуточная проекция 2048×1024) из world-atlas (Natural Earth, 1:50 млн).

    npm i --no-save world-atlas@2.0.2
    python3 spin/make_land.py      -> spin/assets/land.png
"""
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
W, H = 2048, 1024


def decode(topo):
    sx, sy = topo['transform']['scale']
    tx, ty = topo['transform']['translate']
    arcs = []
    for arc in topo['arcs']:
        x = y = 0
        pts = []
        for dx, dy in arc:
            x += dx
            y += dy
            pts.append((x * sx + tx, y * sy + ty))
        arcs.append(pts)
    return arcs


def ring(arcs, idx):
    pts = []
    for i in idx:
        a = arcs[i] if i >= 0 else arcs[~i][::-1]
        pts.extend(a if not pts else a[1:])
    return pts


def main():
    topo = json.loads((ROOT / 'node_modules/world-atlas/land-50m.json').read_text())
    arcs = decode(topo)
    img = Image.new('L', (W * 3, H), 0)  # три копии по долготе — для колец через линию перемены дат
    d = ImageDraw.Draw(img)
    for geom in topo['objects']['land']['geometries']:
        polys = geom['arcs'] if geom['type'] == 'MultiPolygon' else [geom['arcs']]
        for poly in polys:
            for k, r in enumerate(poly):
                pts = ring(arcs, r)
                # непрерывная долгота: убираем скачки через ±180
                out, off, prev = [], 0.0, None
                for lon, lat in pts:
                    if prev is not None and abs(lon - prev) > 180:
                        off -= 360 * (1 if lon > prev else -1)
                    prev = lon
                    out.append((lon + off, lat))
                if out and abs(out[-1][0] - out[0][0]) > 180:  # Антарктида: замыкаем через полюс
                    out += [(out[-1][0], -90), (out[0][0], -90)]
                xy = [((lon + 180) / 360 * W + W, (90 - lat) / 180 * H) for lon, lat in out]
                d.polygon(xy, fill=0 if k else 255)
    full = img.crop((W, 0, 2 * W, H))
    left = img.crop((0, 0, W, H))
    right = img.crop((2 * W, 0, 3 * W, H))
    full = Image.composite(Image.new('L', (W, H), 255), full, left)
    full = Image.composite(Image.new('L', (W, H), 255), full, right)
    full = full.filter(ImageFilter.GaussianBlur(0.8))
    out = ROOT / 'spin/assets/land.png'
    full.save(out, optimize=True)
    print(out.relative_to(ROOT), out.stat().st_size // 1024, 'KB')


if __name__ == '__main__':
    main()
