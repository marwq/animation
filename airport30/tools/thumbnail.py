"""Обложка «DAY 1 / DAY 30» для аэропорта.

Слева день 1: солнечный перрон, лайнер, Дэнни в светоотражающем жилете весело подбрасывает чемодан.
Справа день 30: ночь, луна, вышка с красным огнём, синие огни полосы, орда сочно-зелёных зомби со
светящимися глазами до горизонта; Дэнни в наушниках пилота прячется за багажной тележкой, обнимает
Пиклз (в огромных наушниках), весь в поту, а из-за чемоданов уже тянутся руки.

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
    cam = Cam(400, 380, 0.62)
    apron_back(ctx, 0.0, cam, "day", 1.0, sun=(1300, -150, 80), x0=-1600, x1=2600)
    with layer(ctx, cam, 0.0):
        PL.jet(ctx, 900, AP.GY - 20, 1.1, -1, "day", door=1.0)
        PL.tug(ctx, -350, AP.GY + 120, 1.0, 1, "day", carts=2, load=1.0, seed=3)
    # летящие чемоданы
    r = rng(5)
    for i, (x, y, a) in enumerate(((150, 330, -0.5), (330, 180, 0.4), (820, 300, 0.8), (720, 520, -0.3))):
        suitcase(ctx, x, y, 0.9 + 0.2 * (i % 2), RM.BAG_COLS[(i * 3) % len(RM.BAG_COLS)], a)
    # Дэнни крупно, по пояс: чемодан над головой
    s = 300
    p = R.stand("side", 0, 1)
    p.update(face="laugh", hturn=0.85, h1=(1.35, -3.7), h2=(0.9, -2.3), mouth=0.9, blink=0.0)
    J = DANNY.draw(ctx, 430, 1640, s, 1, p)
    hx, hy = DANNY.world(430, 1640, s, 1, J["hand1"])
    suitcase(ctx, hx + 20, hy + 60, 2.1, "#e8423c", 0.25)
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


def zombie(ctx, x, gy, s, f, seed, kind=None, reach=True):
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
    D.vgrad(ctx, 0, 0, W, H, [(0, "#050822"), (0.55, "#13205a"), (1, "#1d2f6e")])
    SEA.stars(ctx, 880, 0, 1100, 520, 0.0, 7, 1.2)
    fx.glow(ctx, 1260, 250, 460, "#cfe0ff", 0.45)
    SEA.moon(ctx, 1260, 250, 74)
    SEA.cloudbank(ctx, 1500, 2150, 300, "night", seed=8, n=6, s0=1.0, s1=1.5, alpha=0.95)
    # горизонт: огни терминала, вышка
    HZ = 560
    D.rect(ctx, 880, HZ - 70, 1100, 70, hexrgb("#1a2240"), D.INK, 4, wob=0)
    for k in range(22):
        D.rect(ctx, 900 + k * 50, HZ - 54, 30, 18, hexrgb("#ffd978"), None, 0, wob=0, alpha=0.7)
    tx = 1760
    D.rect(ctx, tx - 22, HZ - 330, 44, 300, hexrgb("#1a2240"), D.INK, 5, wob=0)
    D.poly(ctx, [(tx - 80, HZ - 400), (tx + 80, HZ - 400), (tx + 60, HZ - 330), (tx - 60, HZ - 330)],
           hexrgb("#2a3a6a"), D.INK, 5, wob=0)
    D.rect(ctx, tx - 66, HZ - 392, 132, 40, hexrgb("#7fe0c8"), D.INK, 3, wob=0, alpha=0.8)
    fx.glow(ctx, tx, HZ - 420, 90, "#ff4a3a", 0.7)
    D.circle(ctx, tx, HZ - 420, 12, hexrgb("#ff4a3a"), None, 0)
    # молния
    pts = [(1900, 0), (1860, 110), (1895, 140), (1830, 280), (1860, 300), (1810, 420)]
    D.polyline(ctx, pts, hexrgb("#bfe0ff"), 22, 0.35)
    D.polyline(ctx, pts, hexrgb("#ffffff"), 8)
    # бетон и синие огни полосы
    D.rect(ctx, 880, HZ, 1100, H - HZ, hexrgb("#2a3048"), None, 0, wob=0)
    D.poly(ctx, [(1350, HZ), (1420, HZ), (1980, H), (1100, H)], hexrgb("#353c58"), None, 0, wob=0)
    for k in range(9):
        u = (k / 9) ** 1.7
        y = HZ + (H - HZ) * u
        for xx in (lerp(1350, 1100, u), lerp(1420, 1980, u)):
            fx.glow(ctx, xx, y, 20 + 40 * u, "#4f8fff", 0.6)
            D.circle(ctx, xx, y, 3 + 9 * u, hexrgb("#9fc4ff"), None, 0)
    # орда до горизонта
    heads = []
    r = rng(30)
    rows = [(HZ + 30, 44, 22), (HZ + 90, 56, 18), (HZ + 160, 72, 15), (HZ + 240, 92, 12)]
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
    for i, (x, gy, sc) in enumerate(((960, 1290, 115), (1110, 1320, 125), (1250, 1300, 118), (1500, 1250, 100),
                                     (1650, 1230, 95))):
        mids.append((zombie(ctx, x, gy, sc, 1 if x < 1450 else -1, 6100 + i,
                            ["pilot", "attendant", "business", "tsa", "traveler"][i]), sc))
    D.rect(ctx, 880, 0, 1100, H, hexrgb("#0a1236"), None, 0, wob=0, alpha=0.18)
    for (hx, hy), sc in mids:
        zombie_glow_eyes(ctx, hx + 0.1 * sc, hy, sc * 0.13, 1.0)
    # передний план: зомби тянется к тележке
    p = zombie_reach(0.2, 7000)
    p.update(a1=(1.75, -0.2), a2=(1.55, -0.12), lean=0.28, mouth=1.0, blink=0.0, neck=-0.05)
    fig = R.Fig(R.zombie_look(7000, "traveler"))
    J = fig.draw(ctx, 1060, 1520, 205, 1, p)
    hx, hy = fig.world(1060, 1520, 205, 1, J["head"])
    zombie_glow_eyes(ctx, hx + 0.1 * 205, hy, 205 * 0.13, 1.0)
    # багажная тележка с горой чемоданов — укрытие
    bx0, bx1, by0 = 1250, 1610, 850
    r = rng(12)
    for row in range(3):
        for col in range(4 - row):
            cx = bx0 + 50 + col * 85 + row * 40 + r.uniform(-8, 8)
            cy = by0 - row * 100
            suitcase(ctx, cx, cy, 0.95, RM.BAG_COLS[r.randrange(len(RM.BAG_COLS))], r.uniform(-0.12, 0.12),
                     handle=row == 2)
    D.rect(ctx, bx0 - 20, by0, bx1 - bx0 + 40, 40, hexrgb("#c9d0d6"), D.INK, 7, wob=0)
    D.rect(ctx, bx0, by0 + 40, bx1 - bx0, H - by0, hexrgb("#8f99a3"), D.INK, 7, wob=0)
    D.rect(ctx, bx0 + 30, by0 + 70, bx1 - bx0 - 60, 60, hexrgb("#f2c230"), D.INK, 5, wob=0)
    D.text(ctx, "BAGGAGE", (bx0 + bx1) / 2, by0 + 116, 40, D.FONT_TITLE, hexrgb("#22252c"))
    # из-за чемоданов высовывается зомби-пилот: голова над грудой, руки через край
    sc = 180
    zx, zy = 1440, by0 - 330
    ctx.save()
    ctx.rectangle(880, 0, 1100, by0 - 260)
    ctx.clip()
    R.Fig(R.zombie_look(7101, "pilot")).head_only(ctx, zx, zy, sc, 1, {"view": "front", "mouth": 1.0,
                                                                      "neck_line": False, "blink": 0.0})
    ctx.restore()
    zombie_glow_eyes(ctx, zx, zy - 0.02 * sc, sc * 0.13, 1.0)
    for k, (hx_, hy_, ang) in enumerate(((1330, by0 - 235, -0.3), (1550, by0 - 250, 0.3))):
        D.ellipse(ctx, hx_, hy_, 34, 20, hexrgb(R.ZOMBIE_SKIN[1]), D.INK, 5)
        for f_ in range(4):
            fx_ = hx_ - 24 + f_ * 16
            D.line(ctx, fx_, hy_ + 8, fx_ + ang * 10, hy_ + 40, D.INK, 13)
            D.line(ctx, fx_, hy_ + 8, fx_ + ang * 10, hy_ + 40, hexrgb(R.ZOMBIE_SKIN[1]), 7)
    # Дэнни прячется за тележкой: сжался, обнимает Пиклз, косится на зомби
    s = 215
    lx, lgy = 1800, 1150
    p = floor_sit_pose(0.0, 1, "scared", hug=True)
    p.update(blink=0.0, mouth=0.4, hturn=0.3, look=(-1.0, 0.0), lean=0.12, neck=0.18)
    J = DANNY_PILOT.draw(ctx, lx, lgy, s, -1, p)
    hx, hy = DANNY_PILOT.world(lx, lgy, s, -1, J["head"])
    cx, cy = DANNY_PILOT.world(lx, lgy, s, -1, J["hand1"])
    draw_lab(ctx, cx - 10, cy + 170, 220, -1, dog_pose(0.0, "sit", headset=1.35, wag=0.0, look=-0.3))
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
    SEA.rain_streaks(ctx, 0.0, TOP_X - 120, 0, W - TOP_X + 120, H, 0.5, 0.5, alpha=0.25)
    ctx.restore()


def labels(ctx):
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
