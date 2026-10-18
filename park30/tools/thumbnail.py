"""Обложка «DAY 1 / DAY 30» для парка развлечений.

Слева день 1: солнечный парк — колесо обозрения, горка, карусель; Раскал в костюме весело машет со сладкой ватой.
Справа день 30: ночь, луна, салют над замком, светящийся шар в заплатках, орда сочно-зелёных зомби со светящимися
глазами до горизонта; Тео без костюма прячется за корзиной шара, обнимает Бандит, весь в поту, а через борт уже
тянутся руки.

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
    cam = Cam(450, 260, 0.42)
    grass_back(ctx, 0.0, cam, "day", -3000, 5000, sun=(1900, -700, 120))
    with layer(ctx, cam, 0.0):
        RD.big_wheel(ctx, -350, PK.FL - 1550, 1250, 0.2, "day", t=0.0, gy=PK.FL)
        tr = RD.Track(RD.thunderbolt_track(800, PK.FL, 2100))
        RD.coaster_track(ctx, tr, PK.FL, "day")
        RD.coaster_train(ctx, tr, 3300, 4, 240, "day")
        RD.carousel(ctx, 1150, PK.FL + 420, 0.8, 0.5, 0.0, "day", run=1.0, music=1.0)
        PK.balloon_bunch(ctx, 2050, PK.FL - 20, 0.0, 7, 1.8, seed=3, string_len=300)
    # Раскал крупно: машет, в другой руке сладкая вата
    s = 235
    p = R.stand("front", 0, 1)
    p.update(h1=(-1.15, -2.7), h2=(1.0, -2.3), blink=0.0)
    J = RASCAL.draw(ctx, 470, 1650, s, 1, rascal_pose(p, None))
    hx, hy = RASCAL.world(470, 1650, s, 1, J["hand2"])
    D.line(ctx, hx, hy, hx + 16, hy - 150, hexrgb("#fbfaf6"), 12)
    D.line(ctx, hx, hy, hx + 16, hy - 150, D.INK, 2)
    D.circle(ctx, hx + 22, hy - 220, 95, hexrgb("#ffb6d8"), D.INK, 6)
    D.circle(ctx, hx - 20, hy - 250, 40, hexrgb("#ffd6e8"), None, 0)
    for (x, y, r_) in ((120, 420, 28), (860, 560, 34), (770, 330, 22)):
        star(ctx, x, y, r_, hexrgb("#ffd23a"), 3)
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
    fig = R.Fig(R.park_zombie(seed, kind))
    J = fig.draw(ctx, x, gy, s, f, p)
    return fig.world(x, gy, s, f, J["head"])


def right(ctx):
    ctx.save()
    clip_right(ctx)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#050822"), (0.55, "#13205a"), (1, "#1d2f6e")])
    SEA.stars(ctx, 880, 0, 1100, 520, 0.0, 7, 1.2)
    # салют
    for (x, y, c, k, sd) in ((1080, 360, "#ff4a6a", 0.55, 1), (1330, 120, "#4ad8ff", 0.5, 3)):
        LK.firework(ctx, x, y, k, 0.8, c, seed=sd, n=30)
    # замок на горизонте
    HZ = 620
    ctx.save()
    ctx.translate(1240, HZ)
    ctx.scale(0.2, 0.2)
    CA.castle(ctx, 0, 0, 1.0, "night", 0.0, lit=0.9)
    ctx.restore()
    D.rect(ctx, 880, HZ, 1100, H - HZ, hexrgb("#1f2a3a"), None, 0, wob=0)
    # светящийся шар с корзиной справа: огромный, уходит за верх кадра
    bx, bgy, bs = 1740, 1190, 0.62
    fx.glow(ctx, bx, 300, 520, "#ffb03c", 0.4)
    by = bgy - (300 + 420 + 160) * bs
    e = BL.envelope(ctx, bx, by, 0.85 * bs, 1.0, "night", glow=1.0, t=0.0)
    # орда до горизонта
    heads = []
    r = rng(30)
    rows = [(HZ + 20, 40, 26), (HZ + 80, 52, 22), (HZ + 150, 68, 17), (HZ + 230, 88, 13)]
    for ri, (gy, sc, n) in enumerate(rows):
        for i in range(n):
            x = 900 + (i + r.uniform(-0.3, 0.3)) * (1100 / n)
            hx, hy = zombie(ctx, x, gy + sc * 2.2, sc, 1 if x < 1600 else -1, 5000 + ri * 40 + i, reach=ri >= 1)
            heads.append((hx, hy, sc))
    D.rect(ctx, 880, 0, 1100, H, hexrgb("#0a1236"), None, 0, wob=0, alpha=0.3)
    for hx, hy, sc in heads:
        zombie_glow_eyes(ctx, hx + 0.1 * sc, hy, sc * 0.13, 0.9)
    mids = []
    for i, (x, gy, sc) in enumerate(((955, 1250, 112), (1900, 1250, 108))):
        mids.append((zombie(ctx, x, gy, sc, 1 if x < 1600 else -1, 6100 + i, ["staff", "chef"][i]), sc))
    for (hx, hy), sc in mids:
        zombie_glow_eyes(ctx, hx + 0.1 * sc, hy, sc * 0.13, 1.0)
    BL.basket(ctx, bx, bgy, bs * 1.6, "night", 1.0, 0.0, tanks=2,
              cables_to=(e["left"][0], e["left"][1], e["right"][0], e["right"][1]))
    rim = bgy - 300 * bs * 1.6
    # через борт тянутся зелёные руки
    for (hx_, hy_, ang) in ((bx + 60, rim - 18, 0.3), (bx + 180, rim - 8, 0.5), (bx - 40, rim - 24, -0.2)):
        D.ellipse(ctx, hx_, hy_, 34, 20, hexrgb(R.ZOMBIE_SKIN[1]), D.INK, 5)
        for f_ in range(4):
            fx_ = hx_ - 24 + f_ * 16
            D.line(ctx, fx_, hy_ + 8, fx_ + ang * 10, hy_ + 40, D.INK, 13)
            D.line(ctx, fx_, hy_ + 8, fx_ + ang * 10, hy_ + 40, hexrgb(R.ZOMBIE_SKIN[1]), 7)
    # Тео прячется слева от корзины: сжался, обнимает Бандит, косится на руки; весь в поту
    s = 220
    lx, lgy = 1250, 1160
    p = floor_sit_pose(0.0, 1, "scared", hug=True)
    p.update(blink=0.0, mouth=0.45, hturn=0.35, look=(1.0, -0.3), lean=0.12, neck=0.18)
    J = THEO.draw(ctx, lx, lgy, s, 1, p)
    hx, hy = THEO.world(lx, lgy, s, 1, J["head"])
    cx, cy = THEO.world(lx, lgy, s, 1, J["hand1"])
    draw_raccoon(ctx, cx - 30, cy + 120, 150, 1, raccoon_pose(0.0, "sit", look=0.8))
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
