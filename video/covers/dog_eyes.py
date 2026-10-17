"""Обложка: чёрная собака-пиктограмма смотрит прямо в камеру, глаза — две красные точки.

  python covers/dog_eyes.py   → out/covers/dog_<фон>.png (1280×720)
"""
import os
import sys

import numpy as np
import skia
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

from engine.core import H, W, color, paint  # noqa: E402
from engine.fx import Post  # noqa: E402

DOG = (8, 8, 9)
EYE = (232, 22, 30)
CX = W / 2
BGS = {"red": (226, 24, 32), "light": (236, 234, 228), "dark": (32, 32, 36)}


def head():
    """Голова овчарки анфас: широкий череп, заметно более узкая морда, уши торчком и чуть наружу."""
    p = skia.Path()
    p.moveTo(CX, 250)
    p.cubicTo(CX + 165, 250, CX + 250, 330, CX + 245, 450)
    p.cubicTo(CX + 240, 545, CX + 200, 590, CX + 150, 615)
    p.cubicTo(CX + 125, 630, CX + 120, 660, CX + 118, 720)
    p.cubicTo(CX + 116, 775, CX + 80, 805, CX, 808)
    p.cubicTo(CX - 80, 805, CX - 116, 775, CX - 118, 720)
    p.cubicTo(CX - 120, 660, CX - 125, 630, CX - 150, 615)
    p.cubicTo(CX - 200, 590, CX - 240, 545, CX - 245, 450)
    p.cubicTo(CX - 250, 330, CX - 165, 250, CX, 250)
    p.close()
    for s in (1, -1):
        e = skia.Path()
        e.moveTo(CX + s * 60, 290)
        e.cubicTo(CX + s * 140, 230, CX + s * 220, 160, CX + s * 285, 105)
        e.quadTo(CX + s * 315, 82, CX + s * 318, 122)
        e.cubicTo(CX + s * 320, 220, CX + s * 295, 315, CX + s * 238, 420)
        e.close()
        p = skia.Op(p, e, skia.PathOp.kUnion_PathOp)
    return p


def body():
    """Шея и грудь, расширяются книзу."""
    p = skia.Path()
    p.moveTo(CX - 110, 690)
    p.cubicTo(CX - 190, 870, CX - 400, 930, CX - 470, 1010)
    p.lineTo(CX - 500, H + 40)
    p.lineTo(CX + 500, H + 40)
    p.lineTo(CX + 470, 1010)
    p.cubicTo(CX + 400, 930, CX + 190, 870, CX + 110, 690)
    p.close()
    return p


def draw(c, bg):
    col = BGS[bg]
    c.clear(color(col))
    c.drawPath(body(), paint(DOG))
    hd = head()
    # зазор между головой и шеей — цветом фона, как на пиктограммах
    c.drawPath(hd, paint(col, stroke=24))
    c.drawPath(hd, paint(DOG))
    cut = paint(col, stroke=9)
    # нос и пасть — вырезами
    nose = skia.Path()
    nose.moveTo(CX - 60, 712)
    nose.cubicTo(CX - 62, 680, CX + 62, 680, CX + 60, 712)
    nose.cubicTo(CX + 56, 742, CX + 22, 758, CX, 760)
    nose.cubicTo(CX - 22, 758, CX - 56, 742, CX - 60, 712)
    nose.close()
    c.drawPath(nose, cut)
    c.drawLine(CX, 760, CX, 785, cut)
    # глаза — две красные точки, смотрят прямо
    for s in (-1, 1):
        c.drawCircle(CX + s * 108, 462, 23, paint(EYE))


def main():
    out = os.path.join(HERE, "out", "covers")
    os.makedirs(out, exist_ok=True)
    for bg in BGS:
        arr = np.zeros((H, W, 4), np.uint8)
        draw(skia.Canvas(arr), bg)
        img = Post().apply(arr, 0.0, 0, bloom=0.0)
        path = os.path.join(out, f"dog_{bg}.png")
        Image.fromarray(img).resize((1280, 720), Image.LANCZOS).save(path)
        print("→", path)


if __name__ == "__main__":
    main()
