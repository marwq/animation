"""Обложка «DAY 1 / DAY 30» для круиза.

Слева день 1: солнечная палуба у бассейна, официант Лео с подносом коктейлей, вечеринка.
Справа день 30: рассвет в шторм, верх трубы, Лео в капитанской фуражке и спасжилете с кошкой
дёргает цепь латунного гудка, снизу лезут сочно-зелёные зомби.

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
from scenes.shared import *
from scenes.d01 import tray

TOP_X, BOT_X = 1010, 900     # наклонная граница половин (вверху, внизу)


def clip_left(ctx):
    D.path(ctx, [(0, 0), (TOP_X, 0), (BOT_X, H), (0, H)])
    ctx.clip()


def clip_right(ctx):
    D.path(ctx, [(TOP_X, 0), (W, 0), (W, H), (BOT_X, H)])
    ctx.clip()


def left(ctx):
    ctx.save()
    clip_left(ctx)
    cam = Cam(2100, 520, 0.62)
    deck_back(ctx, 0.0, cam, "day", 1.0, sun=(2300, -120, 80))
    with layer(ctx, cam, 0.0):
        r = rng(3)
        for i in range(7):
            p = dance_pose(i * 0.37, i) if "dance_pose" in globals() else R.stand("side", 0, i)
            x = 1250 + i * 230
            R.Fig(R.Look(seed=40 + i, **R.PASSENGERS[i % len(R.PASSENGERS)])).draw(ctx, x, DK.GF + 60 + (i % 2) * 40, 92,
                                                              1 if i % 2 else -1, p)
    # конфетти
    r = rng(11)
    for i in range(70):
        ctx.save()
        ctx.translate(r.uniform(0, TOP_X), r.uniform(0, 700))
        ctx.rotate(r.uniform(0, 3))
        D.rect(ctx, -9, -5, 18, 10, hexrgb(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#3fbf6a", "#f05a8a"])), None,
               0, wob=0)
        ctx.restore()
    # Лео с подносом, крупно, по пояс
    p = R.stand("side", 0, 1)
    p.update(face="laugh", hturn=0.75, h1=(1.15, -2.25), h2=(0.35, -1.6), mouth=0.8, blink=0.0)
    LEO.draw(ctx, 470, 1720, 330, 1, p, extra=lambda c, J, l: tray(c, J, "hand1", -0.05) if l == "front" else None)
    ctx.restore()


def right(ctx):
    ctx.save()
    clip_right(ctx)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2b1d5a"), (0.55, "#c2507a"), (1, "#ffb36a")])
    SEA.sun(ctx, 1500, 610, 90, "dawn")
    fx.glow(ctx, 1500, 610, 600, "#ffcf8a", 0.4)
    SEA.cloudbank(ctx, 900, 2100, 220, "storm", seed=5, n=7, s0=1.0, s1=1.6, alpha=0.9)
    SEA.ocean(ctx, 0.0, 900, 2100, 640, 1200, "dawn", rough=0.6, seed=4, sun_x=1500)
    SEA.cutter(ctx, 1720, 648, 0.35, -1)
    # площадка трубы
    D.rect(ctx, 880, 860, 1100, 300, hexrgb("#e8ecef"), D.INK, 6, wob=0)
    D.rect(ctx, 880, 920, 1100, 70, hexrgb("#1c3f7c"), None, 0, wob=0)
    OD.railing(ctx, 880, 2000, 860, "dawn", h=110, glass=False)
    OD.horn(ctx, 1200, 860, 1.25, "dawn", chain_pull=0.6, blast=1.0)
    # зомби лезут снизу
    for i, (x, y, s, f) in enumerate(((990, 1420, 150, 1), (1210, 1480, 170, 1), (1430, 1450, 150, 1),
                                      (1890, 1430, 175, -1), (1780, 1560, 165, -1))):
        p = zombie_reach(0.3 * i, i)
        p.update(a1=(2.7, 0.25), a2=(2.4, 0.4), mouth=1.0, lean=-0.1, neck=-0.3, blink=0.0)
        R.Fig(R.zombie_look(700 + i * 3, ["hawaiian", None, "chef", "officer", None][i])).draw(ctx, x, y, s, f, p)
    # Лео: фуражка, жилет, кошка, тянет цепь
    p = R.stand("side", 0, 1)
    p.update(face="scream", mouth=1.0, blink=0.0, hturn=0.55, h1=(0.85, -2.2), h2=(0.75, -2.1), lean=-0.15)
    J = LEO_VEST.draw(ctx, 1640, 1390, 250, -1, p)
    cx, cy = LEO_VEST.world(1640, 1390, 250, -1, J["top"])
    draw_cat(ctx, cx - 50, cy + 190, 150, -1, cat_pose(0.0, "held", meow=1.0))
    hx, hy = LEO_VEST.world(1640, 1390, 250, -1, J["hand1"])
    D.line(ctx, hx, hy, 1290, 820, D.INK, 10)
    for k in range(9):
        D.ellipse(ctx, lerp(hx, 1290, k / 8), lerp(hy, 820, k / 8), 9, 14, None, D.INK, 4)
    # дождь
    SEA.rain_streaks(ctx, 0.0, TOP_X - 120, 0, W - TOP_X + 120, H, 0.8, 0.5, alpha=0.35)
    ctx.restore()


def labels(ctx):
    # граница
    D.line(ctx, TOP_X, -10, BOT_X, H + 10, D.INK, 30)
    D.line(ctx, TOP_X, -10, BOT_X, H + 10, hexrgb("#fff6d8"), 14)
    D.text(ctx, "DAY 1", 400, 200, 170, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=18, rot=-0.05)
    D.text(ctx, "DAY 30", 1520, 200, 170, D.FONT_TITLE, hexrgb("#ff4a3a"), stroke=D.INK, slw=18, rot=0.04)


def main():
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    left(ctx)
    right(ctx)
    labels(ctx)
    fx.vignette(ctx, 0.35) if hasattr(fx, "vignette") else None
    os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
    big = os.path.join(ROOT, "build", "thumbnail_1080.png")
    surf.write_to_png(big)
    im = Image.open(big).convert("RGB")
    im = ImageEnhance.Color(im).enhance(1.18)
    im = ImageEnhance.Contrast(im).enhance(1.06)
    im = im.resize((1280, 720), Image.LANCZOS)
    p = os.path.join(ROOT, "build", "thumbnail.png")
    im.save(p)
    os.makedirs(os.path.join(ROOT, "docs"), exist_ok=True)
    im.save(os.path.join(ROOT, "docs", "thumbnail.jpg"), quality=92)
    print(p)


if __name__ == "__main__":
    main()
