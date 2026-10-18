"""Обложка «DAY 1 / DAY 30» для круиза.

Слева день 1: солнечная палуба у бассейна, официант Лео с подносом коктейлей, вечеринка.
Справа день 30: ночь, луна и молния, орда сочно-зелёных зомби со светящимися глазами до горизонта;
Лео в капитанской фуражке и спасжилете прячется за ящиком, обнимает кошку, весь в поту.

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


def drop(ctx, x, y, s, ang=0.0):
    """Капля пота: остриё вверх."""
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
    D.col(ctx, D.INK)
    ctx.set_line_width(0.22)
    ctx.stroke()
    D.ellipse(ctx, -0.35, 0.2, 0.18, 0.32, hexrgb("#ffffff"), None, 0, rot=0.3)
    ctx.restore()


def zombie(ctx, x, gy, s, f, seed, kind=None, reach=True, a=1.0):
    p = zombie_reach(0.37 * seed, seed) if reach else zombie_idle(0.37 * seed, seed)
    if reach:
        p.update(a1=(1.45 + 0.25 * math.sin(seed), -0.15), a2=(1.25, -0.05), lean=0.2)
    p.update(mouth=0.9, blink=0.0)
    fig = R.Fig(R.zombie_look(seed, kind))
    J = fig.draw(ctx, x, gy, s, f, p)
    return fig.world(x, gy, s, f, J["head"])


def right(ctx):
    ctx.save()
    clip_right(ctx)
    # ночное небо, луна, молния
    D.vgrad(ctx, 0, 0, W, H, [(0, "#050822"), (0.6, "#13205a"), (1, "#1d2f6e")])
    SEA.stars(ctx, 880, 0, 1100, 560, 0.0, 7, 1.2)
    fx.glow(ctx, 1190, 330, 480, "#cfe0ff", 0.45)
    SEA.moon(ctx, 1190, 330, 78)
    SEA.cloudbank(ctx, 1420, 2150, 330, "night", seed=8, n=6, s0=1.0, s1=1.5, alpha=0.95)
    pts = [(1840, 0), (1800, 120), (1835, 150), (1770, 300), (1805, 320), (1740, 470)]
    D.polyline(ctx, pts, hexrgb("#bfe0ff"), 22, 0.35)
    D.polyline(ctx, pts, hexrgb("#ffffff"), 8)
    SEA.ocean(ctx, 0.0, 880, 2100, 560, 900, "night", rough=0.4, seed=4, sun_x=1170)
    # палуба
    D.rect(ctx, 880, 640, 1100, 500, hexrgb("#3a3f5e"), None, 0, wob=0)
    D.col(ctx, hexrgb("#30354f"))
    ctx.set_line_width(3)
    for k in range(10):
        y = 660 + k * k * 6
        ctx.move_to(880, y)
        ctx.line_to(1980, y)
    ctx.stroke()
    OD.railing(ctx, 880, 2000, 640, "night", h=70, glass=False)
    # дальняя орда: ряды голов до самого горизонта
    heads = []
    r = rng(30)
    rows = [(690, 46, 22), (740, 58, 18), (800, 74, 15), (870, 92, 12)]
    for ri, (gy, sc, n) in enumerate(rows):
        for i in range(n):
            x = 900 + (i + r.uniform(-0.3, 0.3)) * (1100 / n)
            if ri >= 2 and x > 1560:
                continue
            hx, hy = zombie(ctx, x, gy + sc * 2.2, sc, 1 if x < 1500 else -1, 5000 + ri * 40 + i, reach=ri >= 1)
            heads.append((hx, hy, sc))
    D.rect(ctx, 880, 0, 1100, H, hexrgb("#0a1236"), None, 0, wob=0, alpha=0.35)
    for hx, hy, sc in heads:
        zombie_glow_eyes(ctx, hx + 0.1 * sc, hy, sc * 0.13, 0.9)
    # средний план
    mids = []
    for i, (x, gy, sc) in enumerate(((960, 1290, 115), (1100, 1320, 125), (1240, 1300, 118), (1500, 1250, 100),
                                     (1640, 1230, 95))):
        mids.append((zombie(ctx, x, gy, sc, 1 if x < 1450 else -1, 6100 + i,
                            ["hawaiian", "chef", None, "officer", None][i]), sc))
    D.rect(ctx, 880, 0, 1100, H, hexrgb("#0a1236"), None, 0, wob=0, alpha=0.18)
    for (hx, hy), sc in mids:
        zombie_glow_eyes(ctx, hx + 0.1 * sc, hy, sc * 0.13, 1.0)
    # передний план: двое тянутся через ящик к Лео
    for i, (x, gy, sc) in enumerate(((1060, 1520, 205),)):
        p = zombie_reach(0.2, 7000 + i)
        p.update(a1=(1.75, -0.2), a2=(1.55, -0.12), lean=0.28, mouth=1.0, blink=0.0, neck=-0.05)
        fig = R.Fig(R.zombie_look(7000 + i, ["hawaiian", None][i]))
        J = fig.draw(ctx, x, gy, sc, 1, p)
        hx, hy = fig.world(x, gy, sc, 1, J["head"])
        zombie_glow_eyes(ctx, hx + 0.1 * sc, hy, sc * 0.13, 1.0)
    # ящик со спасжилетами — укрытие между ними и Лео
    bx0, bx1, by0 = 1270, 1590, 800
    D.rect(ctx, bx0, by0, bx1 - bx0, H - by0 + 20, hexrgb("#c98a3e"), D.INK, 9, wob=0)
    D.rect(ctx, bx0 - 14, by0 - 18, bx1 - bx0 + 28, 36, hexrgb("#a86f2c"), D.INK, 7, wob=0)
    for k in range(3):
        D.line(ctx, bx0, by0 + 110 + k * 90, bx1, by0 + 110 + k * 90, hexrgb("#9a6224"), 6)
    D.rect(ctx, bx0 + 35, by0 + 40, bx1 - bx0 - 70, 64, hexrgb("#f2782e"), D.INK, 5, wob=0)
    D.text(ctx, "LIFE VESTS", (bx0 + bx1) / 2, by0 + 86, 36, D.FONT_TITLE, hexrgb("#fff6d8"))
    # из-за ящика высовывается зомби: голова над краем, руки через край
    sc = 190
    zx, zy = 1395, by0 - 105
    ctx.save()
    ctx.rectangle(880, 0, 1100, by0 - 16)
    ctx.clip()
    R.Fig(R.zombie_look(7101, "chef")).head_only(ctx, zx, zy, sc, 1, {"view": "front", "mouth": 1.0, "neck_line": False,
                                                                     "blink": 0.0})
    ctx.restore()
    zombie_glow_eyes(ctx, zx, zy - 0.02 * sc, sc * 0.13, 1.0)
    for k, (hx_, ang) in enumerate(((1300, -0.3), (1500, 0.3))):
        D.ellipse(ctx, hx_, by0 - 10, 34, 20, hexrgb(R.ZOMBIE_SKIN[1]), D.INK, 5)
        for f_ in range(4):
            fx_ = hx_ - 24 + f_ * 16
            D.line(ctx, fx_, by0 - 2, fx_ + ang * 10, by0 + 30, D.INK, 13)
            D.line(ctx, fx_, by0 - 2, fx_ + ang * 10, by0 + 30, hexrgb(R.ZOMBIE_SKIN[1]), 7)
    # Лео прячется за ящиком: сжался, обнимает кошку, косится на зомби
    s = 215
    lx, lgy = 1790, 1150
    p = floor_sit_pose(0.0, 1, "scared", hug=True)
    p.update(blink=0.0, mouth=0.4, hturn=0.8, look=(-1.0, 0.0), lean=0.12, neck=0.18)
    J = LEO_VEST.draw(ctx, lx, lgy, s, -1, p)
    hx, hy = LEO_VEST.world(lx, lgy, s, -1, J["head"])
    cx, cy = LEO_VEST.world(lx, lgy, s, -1, J["hand1"])
    draw_cat(ctx, cx + 30, cy + 10, 150, -1, cat_pose(0.0, "held", meow=1.0))
    # пот вокруг лица и дрожь
    for (dx, dy, ds, da) in ((-150, -10, 22, -0.7), (150, -20, 24, 0.7), (-175, 80, 17, -1.1), (180, 70, 18, 1.1),
                             (-120, -95, 14, -0.4), (125, -100, 15, 0.4), (40, 30, 11, 0.0)):
        drop(ctx, hx + dx, hy + dy, ds, da)
    for k in (-1, 1):
        for jj in range(3):
            a0 = math.pi * (0.9 if k < 0 else -0.1)
            ctx.arc(hx, hy + 10, 205 + jj * 28, a0, a0 + math.pi * 0.2)
            D.col(ctx, hexrgb("#fff6d8"), 0.9 - jj * 0.25)
            ctx.set_line_width(8)
            ctx.stroke()
    # холодный лунный свет и дождь
    SEA.rain_streaks(ctx, 0.0, TOP_X - 120, 0, W - TOP_X + 120, H, 0.7, 0.5, alpha=0.3)
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
