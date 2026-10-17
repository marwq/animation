"""Обложка: чёрная собака анфас смотрит в камеру, красные глаза с жёлтым свечением.

  python covers/dog_eyes.py   → out/covers/dog_eyes_dark.png и dog_eyes_red.png (1280×720)
"""
import os
import sys

import numpy as np
import skia
from PIL import Image

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, HERE)

from engine.core import H, W, color, paint, xf  # noqa: E402
from engine.fx import Post  # noqa: E402

DOG = (6, 6, 7)
CX = W / 2


def silhouette():
    """Голова овчарки анфас, уши и плечи одним контуром."""
    p = skia.Path()
    # голова: широкий лоб и скулы, морда сужается вниз к носу
    p.moveTo(CX, 255)
    p.cubicTo(CX + 140, 255, CX + 250, 300, CX + 280, 420)
    p.cubicTo(CX + 300, 500, CX + 285, 560, CX + 230, 610)
    p.cubicTo(CX + 185, 650, CX + 150, 700, CX + 135, 760)
    p.cubicTo(CX + 125, 815, CX + 80, 860, CX, 865)
    p.cubicTo(CX - 80, 860, CX - 125, 815, CX - 135, 760)
    p.cubicTo(CX - 150, 700, CX - 185, 650, CX - 230, 610)
    p.cubicTo(CX - 285, 560, CX - 300, 500, CX - 280, 420)
    p.cubicTo(CX - 250, 300, CX - 140, 255, CX, 255)
    p.close()
    # уши: широкое основание, кончики наружу
    for s in (1, -1):
        e = skia.Path()
        e.moveTo(CX + s * 70, 290)
        e.cubicTo(CX + s * 150, 230, CX + s * 230, 150, CX + s * 300, 70)
        e.quadTo(CX + s * 330, 45, CX + s * 338, 85)
        e.cubicTo(CX + s * 350, 200, CX + s * 330, 330, CX + s * 270, 450)
        e.close()
        p = skia.Op(p, e, skia.PathOp.kUnion_PathOp)
    # шея и плечи
    b = skia.Path()
    b.moveTo(CX - 220, 660)
    b.cubicTo(CX - 280, 830, CX - 420, 900, CX - 480, 1000)
    b.lineTo(CX - 530, 1120)
    b.lineTo(CX + 530, 1120)
    b.lineTo(CX + 480, 1000)
    b.cubicTo(CX + 420, 900, CX + 280, 830, CX + 220, 660)
    b.close()
    return skia.Op(p, b, skia.PathOp.kUnion_PathOp)


def face(c):
    """Почти невидимые детали морды: переносица, нос, пасть, брови."""
    bridge = skia.Path()
    bridge.moveTo(CX - 60, 520)
    bridge.cubicTo(CX - 70, 620, CX - 95, 700, CX - 85, 760)
    bridge.lineTo(CX + 85, 760)
    bridge.cubicTo(CX + 95, 700, CX + 70, 620, CX + 60, 520)
    bridge.close()
    c.drawPath(bridge, paint((17, 17, 19), blur=6))
    nose = skia.Path()
    nose.moveTo(CX - 62, 745)
    nose.cubicTo(CX - 64, 712, CX + 64, 712, CX + 62, 745)
    nose.cubicTo(CX + 58, 780, CX + 20, 800, CX, 802)
    nose.cubicTo(CX - 20, 800, CX - 58, 780, CX - 62, 745)
    nose.close()
    c.drawPath(nose, paint((30, 30, 34)))
    c.drawOval(skia.Rect.MakeXYWH(CX - 34, 724, 40, 16), paint((120, 120, 130), 0.35, blur=4))
    c.drawLine(CX, 802, CX, 830, paint((34, 34, 38), stroke=5))
    m = skia.Path()
    m.moveTo(CX - 70, 845)
    m.quadTo(CX - 30, 830, CX, 832)
    m.quadTo(CX + 30, 830, CX + 70, 845)
    c.drawPath(m, paint((34, 34, 38), stroke=5))
    for s in (1, -1):
        c.drawLine(CX + s * 40, 420, CX + s * 175, 445, paint((26, 26, 29), stroke=10))


def eye(c, x, y, tilt):
    with xf(c, x, y, r=tilt):
        # жёлтый ореол и красное свечение
        c.drawCircle(0, 0, 105, paint((255, 196, 40), 0.38, blur=38))
        c.drawCircle(0, 0, 70, paint((255, 214, 70), 0.5, blur=18))
        c.drawCircle(0, 0, 54, paint((255, 40, 24), 0.85, blur=12))
        almond = skia.Path()
        almond.moveTo(-60, 2)
        almond.quadTo(0, -48, 60, -6)
        almond.quadTo(0, 40, -60, 2)
        almond.close()
        c.drawPath(almond, paint((255, 36, 28)))
        c.save()
        c.clipPath(almond, doAntiAlias=True)
        c.drawCircle(0, -2, 30, paint((255, 120, 90), 0.9, blur=9))
        c.restore()
        # зрачок смотрит прямо в камеру
        c.drawCircle(0, -2, 12, paint((25, 0, 0)))
        c.drawCircle(-9, -12, 5, paint((255, 245, 220), 0.95))


def draw(c, bg="dark"):
    if bg == "red":
        sh = skia.GradientShader.MakeRadial(skia.Point(CX, 420), 1100,
                                            [color((236, 26, 34)), color((150, 8, 14))])
    else:
        sh = skia.GradientShader.MakeRadial(skia.Point(CX, 420), 1000,
                                            [color((46, 44, 50)), color((8, 8, 10))])
    p = skia.Paint(AntiAlias=True)
    p.setShader(sh)
    c.drawRect(skia.Rect.MakeWH(W, H), p)
    sil = silhouette()
    # контровой свет: ореол вокруг силуэта, чтобы читалась форма
    rim = (255, 240, 220) if bg == "dark" else (40, 0, 0)
    c.drawPath(sil, paint(rim, 0.55 if bg == "dark" else 0.5, blur=22))
    c.drawPath(sil, paint(rim, 0.35 if bg == "dark" else 0.4, stroke=6))
    c.drawPath(sil, paint(DOG))
    face(c)
    eye(c, CX - 115, 492, 14)
    eye(c, CX + 115, 492, -14)


def main():
    out = os.path.join(HERE, "out", "covers")
    os.makedirs(out, exist_ok=True)
    for bg in ("dark", "red"):
        arr = np.zeros((H, W, 4), np.uint8)
        c = skia.Canvas(arr)
        draw(c, bg)
        img = Post().apply(arr, 0.0, 0, bloom=0.8)
        path = os.path.join(out, f"dog_eyes_{bg}.png")
        Image.fromarray(img).resize((1280, 720), Image.LANCZOS).save(path)
        print("→", path)


if __name__ == "__main__":
    main()
