"""Обложка «DAY 1 / DAY 30».

Слева день 1: светлый проход с супами, герой в фартуке довольный, с банкой. Справа день 30: ночь, витрина
выбита, за тележками на цепях — стена зомби до горизонта; герой прячется за кассой, в поту, в ужасе.

    python3 tools/thumbnail.py        → build/thumbnail.png (1280x720), docs/thumbnail.jpg
"""
import os
import sys
import math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import cairo
from PIL import Image, ImageEnhance

from scenes.kit import *

TOP_X, BOT_X = 1010, 900


def clip_left(ctx):
    D.path(ctx, [(0, 0), (TOP_X, 0), (BOT_X, H), (0, H)])
    ctx.clip()


def clip_right(ctx):
    D.path(ctx, [(TOP_X, 0), (W, 0), (W, H), (BOT_X, H)])
    ctx.clip()


def multiply(ctx, color, alpha):
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_MULTIPLY)
    D.col(ctx, hexrgb(color), alpha)
    ctx.paint()
    ctx.restore()


def left(ctx):
    ctx.save()
    clip_left(ctx)
    cam = PlateCam("aisle_soup", 1500, 820, 1.25)
    with on(ctx, cam, 0):
        paint(ctx, "aisle_soup")
    fx.glow(ctx, 450, 300, 700, "#fff2c8", 0.25)
    x, gy, r = 470, H + 380, 150
    p = pose(0.0, 3, face="happy", look=(0.6, -0.1), h1=(1.4, -6.0), h2=(-1.0, -4.6), blink=False)
    J = figure(ctx, x, gy, r, 1, p, ST.HERO)
    hx, hy = at(J, x, gy, r, 1, "h1")
    ctx.save()
    ctx.translate(hx + 10, hy - 60)
    ctx.rotate(0.15)
    ctx.scale(0.55, 0.55)
    CD.icon_can_big(ctx)
    ctx.restore()
    ctx.restore()


def glow_eyes(ctx, x, y, s):
    for dx in (-0.18, 0.18):
        fx.glow(ctx, x + dx * s, y + 0.02 * s, s * 0.45, "#d8ff6a", 0.3)
        D.circle(ctx, x + dx * s, y + 0.02 * s, s * 0.1, hexrgb("#f2ff9a"), None, 0)


def right(ctx):
    ctx.save()
    clip_right(ctx)
    cam = PlateCam("front_day", 1640, 780, 1.45)
    heads = []
    with on(ctx, cam, 0):
        paint(ctx, "front_day")
        r_ = rng(31)
        for row in range(4):
            n = 7 + row * 2
            for i in range(n):
                x = 1180 + (i + r_.uniform(-0.3, 0.3)) * (980 / n)
                gy = 950 + row * 45
                rr = (40 + row * 10) * r_.uniform(0.92, 1.08)
                p = ST.front(0.3 * i, i)
                p.update(h1=(1.2 + 0.2 * math.sin(i), -5.0 + row * 0.3), h2=(-1.2, -4.9 + row * 0.3), mouth=1.0,
                         blink=False, tilt=0.15 * math.sin(i * 1.7))
                J = ST.draw(ctx, x, gy, rr, 1, p, zombie_look(400 + row * 30 + i, ("#1a2440", 0.3 - row * 0.05)))
                heads.append((ST.world(x, gy, rr, 1, J["head"]), rr))
        front_day_fg(ctx)
        for row in range(2):
            gy = 1090 + row * 60
            s = 4.4 * persp(gy, 0.2, 760)
            for i in range(5):
                cart(ctx, 1260 + i * 200 + row * 50, gy, s, 1 if row == 0 else -1, tilt=0.06 * math.sin(i + row))
            chain_line(ctx, 1180, gy - s * 0.75, 2140, gy - s * 0.75, 1.0, 18)
        for i in range(200):
            x = r_.uniform(1150, 2200)
            y = r_.uniform(1000, 1500)
            sz = r_.uniform(8, 18)
            D.rect(ctx, x, y, sz, sz, hexrgb("#d4ecf6"), hexrgb("#6a8a9a"), 1.5, wob=0)
    multiply(ctx, "#1a2450", 0.55)
    for (hx, hy), rr in heads:
        sx, sy = cam.to_screen(0, hx, hy)
        glow_eyes(ctx, sx, sy, rr * cam.scale(0))
    ctx.restore()
    ctx.save()
    clip_right(ctx)
    # герой выглядывает из-за кассы справа внизу: пот, ужас
    x, gy, r = 1700, H + 330, 130
    p = pose(0.0, 3, face="scream", look=(-0.8, -0.3), h1=(-1.3, -4.6), h2=(-1.1, -4.4), blink=False, sweat=True,
             lean=0.1)
    J = figure(ctx, x, gy, r, -1, p, ST.HERO, tint=("#4a5a90", 0.2))
    hx, hy = at(J, x, gy, r, -1, "head")
    D.poly(ctx, [(1180, 820), (W + 20, 790), (W + 20, H + 20), (1100, H + 20)], hexrgb("#2a2e3c"), INK, 10, wob=0)
    D.line(ctx, 1180, 835, W + 20, 805, hexrgb("#4a5068"), 8)
    for (fx_, fy_) in ((1560, 835), (1600, 828), (1640, 822)):                  # пальцы на краю кассы
        D.circle(ctx, fx_, fy_, 16, INK, None, 0)
    for (dx, dy, ds, da) in ((-190, -30, 24, -0.7), (180, -50, 26, 0.7), (-210, 80, 19, -1.1),
                             (210, 60, 20, 1.1), (-130, -140, 17, -0.4), (140, -150, 17, 0.4)):
        drop(ctx, hx + dx, hy + dy, ds, da)
    for k in (-1, 1):
        for jj in range(3):
            a0 = math.pi * (0.9 if k < 0 else -0.1)
            ctx.arc(hx, hy + 10, 200 + jj * 28, a0, a0 + math.pi * 0.2)
            D.col(ctx, hexrgb("#fff6d8"), 0.9 - jj * 0.25)
            ctx.set_line_width(8)
            ctx.stroke()
    ctx.restore()


def drop(ctx, x, y, s, ang=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    ctx.move_to(0, -1.6)
    ctx.curve_to(0.55, -0.6, 1.0, 0.0, 1.0, 0.45)
    ctx.curve_to(1.0, 1.05, 0.5, 1.4, 0.0, 1.4)
    ctx.curve_to(-0.5, 1.4, -1.0, 1.05, -1.0, 0.45)
    ctx.curve_to(-1.0, 0.0, -0.55, -0.6, 0, -1.6)
    ctx.close_path()
    D.col(ctx, hexrgb("#9fe0ff"))
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(0.22)
    ctx.stroke()
    ctx.restore()


def labels(ctx):
    D.line(ctx, TOP_X, -10, BOT_X, H + 10, INK, 30)
    D.line(ctx, TOP_X, -10, BOT_X, H + 10, hexrgb("#fff6d8"), 14)
    D.text(ctx, "DAY 1", 330, 190, 170, "Archivo Black", hexrgb("#ffe36a"), stroke=INK, slw=18, rot=-0.05)
    D.text(ctx, "DAY 30", 1540, 190, 170, "Archivo Black", hexrgb("#ff4a3a"), stroke=INK, slw=18, rot=0.04)


def main():
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    left(ctx)
    right(ctx)
    labels(ctx)
    os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
    big = os.path.join(ROOT, "build", "thumbnail_1080.png")
    surf.write_to_png(big)
    im = Image.open(big).convert("RGB")
    im = ImageEnhance.Color(im).enhance(1.15)
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = im.resize((1280, 720), Image.LANCZOS)
    p = os.path.join(ROOT, "build", "thumbnail.png")
    im.save(p)
    os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
    im.save(os.path.join(ROOT, "docs", "thumbnail.jpg"), quality=92)
    print(p)


if __name__ == "__main__":
    main()
