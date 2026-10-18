"""Обложка «DAY 1 / DAY 30».

Слева день 1: толстый счастливый Сэм объедается сладостями в кондитерском отделе.
Справа день 30: худой, грязный, мокрый от страха, свет погас, зомби за стеклом,
в темноте и тянут руки с краёв кадра.

    python3 tools/thumbnail.py        → build/thumbnail.png (1280x720), docs/thumbnail.jpg
"""
import os
import sys
import math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)

import cairo
from PIL import Image, ImageEnhance

from engine.core import W, H, TAU, hexrgb, mix, shade, rng
from engine import draw as D, rig as R, fx

INK = D.INK
SS = 2                       # рисуем вдвое крупнее, потом уменьшаем
TOP_X, BOT_X = 1000, 925     # наклонная граница половин (вверху, внизу)
HS = 285                     # масштаб героя (пикселей на диаметр головы)
GY = 1486                    # «земля» героя — ноги за кадром, видно по пояс

FAT = R.Look(**{**R.HERO.__dict__, "girth": 1.62, "limb_k": 1.3,
                "details": ("nametag", "pocket", "buttons", "belly"), "torso_line": True})
THIN = R.Look(**{**R.HERO.__dict__, "girth": 0.6, "limb_k": 0.7, "body": "#2c3a57",
                 "details": ("nametag", "pocket", "belt", "stains", "torn"), "torso_line": True})
SPRINKLES = ["#f6eedd", "#e2a33b", "#3f8a84", "#c23b33", "#7a6aa3", "#6fb3d9"]
CANDY = ["#e8505b", "#f2b134", "#4bb3a6", "#8f6fc2", "#f07fae", "#6fb3d9", "#f6eedd"]


# --- сладости -------------------------------------------------------------------

def wrapped(ctx, x, y, s, c, rot=0.0):
    """Конфета в фантике-бантике."""
    c = D.C(c)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    for k in (-1, 1):
        D.poly(ctx, [(k * 0.45 * s, 0), (k * 1.08 * s, -0.48 * s), (k * 0.98 * s, 0), (k * 1.08 * s, 0.48 * s)],
               shade(c, 0.18), INK, 0.09 * s, wob=0)
    D.ellipse(ctx, 0, 0, 0.62 * s, 0.44 * s, c, INK, 0.09 * s)
    D.line(ctx, -0.32 * s, -0.16 * s, 0.05 * s, -0.27 * s, "#ffffff", 0.09 * s, 0.6)
    ctx.restore()


def lollipop(ctx, x, y, r, c1, c2, stick=2.3, ang=math.pi / 2):
    sx, sy = x + math.cos(ang) * stick * r, y + math.sin(ang) * stick * r
    D.line(ctx, x, y, sx, sy, INK, r * 0.24)
    D.line(ctx, x, y, sx, sy, "#f4efe4", r * 0.13)
    D.circle(ctx, x, y, r, hexrgb(c1), None, 0)
    D.col(ctx, hexrgb(c2))
    ctx.set_line_width(r * 0.2)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    n = 80
    ctx.move_to(x, y)
    for k in range(n + 1):
        a = k / n * TAU * 2.7
        rr = r * 0.86 * k / n
        ctx.line_to(x + math.cos(a) * rr, y + math.sin(a) * rr)
    ctx.stroke()
    D.circle(ctx, x, y, r, None, INK, r * 0.1)
    D.ellipse(ctx, x - r * 0.4, y - r * 0.45, r * 0.22, r * 0.12, "#ffffff", None, 0, alpha=0.6, rot=-0.6)


def donut(ctx, x, y, r, icing="#f08cb0", bite=None, rot=0.0, seed=0):
    """Пончик с глазурью и посыпкой; bite — угол, с которого откусан."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.push_group()
    D.circle(ctx, 0, 0, r, hexrgb("#d99a55"), INK, r * 0.07)
    pts = []
    for k in range(48):
        a = k / 48 * TAU
        rr = r * (0.84 + 0.07 * math.sin(a * 7 + seed))
        pts.append((math.cos(a) * rr, math.sin(a) * rr))
    D.blob(ctx, pts, hexrgb(icing), INK, r * 0.035)
    rr = rng(seed)
    for k in range(34):
        a = rr.uniform(0, TAU)
        d = rr.uniform(0.42, 0.76) * r
        px, py = math.cos(a) * d, math.sin(a) * d
        an = rr.uniform(0, math.pi)
        dx, dy = math.cos(an) * r * 0.055, math.sin(an) * r * 0.055
        D.line(ctx, px - dx, py - dy, px + dx, py + dy, hexrgb(rr.choice(SPRINKLES)), r * 0.05)
    D.circle(ctx, 0, 0, r * 0.3, hexrgb("#c98a48"), INK, r * 0.06)
    ctx.set_operator(cairo.OPERATOR_CLEAR)
    D.circle(ctx, 0, 0, r * 0.22, (0, 0, 0), None, 0)
    ctx.set_operator(cairo.OPERATOR_OVER)
    if bite is not None:
        bites = [(bite + d, r * 0.95, r * 0.3) for d in (-0.32, 0.0, 0.32)]
        # контур укуса: обводим круги внутри пончика, потом вырезаем их
        ctx.save()
        ctx.arc(0, 0, r, 0, TAU)
        ctx.clip()
        for a, d, br in bites:
            D.circle(ctx, math.cos(a) * d, math.sin(a) * d, br, hexrgb("#f3d7a6"), INK, r * 0.12)
        ctx.restore()
        ctx.set_operator(cairo.OPERATOR_CLEAR)
        for a, d, br in bites:
            D.circle(ctx, math.cos(a) * d, math.sin(a) * d, br - r * 0.03, (0, 0, 0), None, 0)
        ctx.set_operator(cairo.OPERATOR_OVER)
    ctx.pop_group_to_source()
    ctx.paint()
    ctx.restore()


def choco(ctx, x, y, w, h, rot=0.0, wrap="#c23b33", label="CHOCO"):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    D.rect(ctx, -w / 2, -h / 2, w, h, hexrgb("#6b3a24"), INK, h * 0.07, wob=0)
    for k in range(1, 3):
        D.line(ctx, -w / 2 + k * w * 0.15, -h / 2 + 4, -w / 2 + k * w * 0.15, h / 2 - 4, "#4a2616", h * 0.05)
    D.line(ctx, -w / 2 + 4, 0, -w / 2 + w * 0.42, 0, "#4a2616", h * 0.05)
    D.rect(ctx, -w / 2 + w * 0.42, -h / 2 - h * 0.08, w * 0.6, h * 1.16, hexrgb(wrap), INK, h * 0.07, wob=0)
    D.text(ctx, label, -w / 2 + w * 0.72, h * 0.16, h * 0.42, D.FONT_TITLE, hexrgb("#f6eedd"))
    ctx.restore()


def cone(ctx, x, y, s, rot=0.0, scoops=("#f6e3c4", "#f08cb0", "#7a4a30")):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    D.poly(ctx, [(-0.46 * s, 0), (0.46 * s, 0), (0, 1.45 * s)], hexrgb("#d9a25a"), INK, 0.07 * s, wob=0)
    ctx.save()
    D.path(ctx, [(-0.46 * s, 0), (0.46 * s, 0), (0, 1.45 * s)])
    ctx.clip()
    for k in range(-4, 5):
        D.line(ctx, k * 0.25 * s - 0.6 * s, 0, k * 0.25 * s + 0.4 * s, 1.5 * s, "#b07a3a", 0.04 * s)
        D.line(ctx, k * 0.25 * s + 0.6 * s, 0, k * 0.25 * s - 0.4 * s, 1.5 * s, "#b07a3a", 0.04 * s)
    ctx.restore()
    for i, c in enumerate(scoops):
        cy = -0.3 * s - i * 0.55 * s
        pts = []
        for k in range(24):
            a = k / 24 * TAU
            rr = 0.52 * s * (1 + (0.12 if (k % 3 == 0 and math.sin(a) > 0.2) else 0))
            pts.append((math.cos(a) * rr, cy + math.sin(a) * rr * 0.86))
        D.blob(ctx, pts, hexrgb(c), INK, 0.07 * s)
    D.circle(ctx, 0.05 * s, -0.3 * s - len(scoops) * 0.55 * s - 0.05 * s, 0.17 * s, hexrgb("#c23b33"), INK, 0.06 * s)
    ctx.restore()


def cupcake(ctx, x, y, s, c="#f08cb0", rot=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    D.poly(ctx, [(-0.5 * s, -0.5 * s), (0.5 * s, -0.5 * s), (0.38 * s, 0.35 * s), (-0.38 * s, 0.35 * s)],
           hexrgb("#6fb3d9"), INK, 0.07 * s, wob=0)
    for k in range(-2, 3):
        D.line(ctx, k * 0.18 * s, -0.45 * s, k * 0.14 * s, 0.3 * s, "#4f93b9", 0.05 * s)
    D.blob(ctx, [(-0.6 * s, -0.5 * s), (-0.45 * s, -0.95 * s), (-0.1 * s, -1.05 * s), (0.05 * s, -1.4 * s),
                 (0.3 * s, -1.0 * s), (0.6 * s, -0.85 * s), (0.6 * s, -0.5 * s)], hexrgb(c), INK, 0.07 * s)
    D.circle(ctx, 0.05 * s, -1.42 * s, 0.15 * s, hexrgb("#c23b33"), INK, 0.05 * s)
    ctx.restore()


def gummy(ctx, x, y, s, c, rot=0.0):
    """Мармеладный мишка."""
    c = D.C(c)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    for (dx, dy, rr) in ((-0.3, -0.85, 0.16), (0.3, -0.85, 0.16), (0, -0.62, 0.36), (-0.36, 0.0, 0.18),
                         (0.36, 0.0, 0.18), (0, 0.15, 0.42), (-0.24, 0.55, 0.2), (0.24, 0.55, 0.2)):
        D.circle(ctx, dx * s, dy * s, rr * s, c, INK, 0.06 * s)
    for (dx, dy, rr) in ((-0.3, -0.85, 0.16), (0.3, -0.85, 0.16), (0, -0.62, 0.36), (-0.36, 0.0, 0.18),
                         (0.36, 0.0, 0.18), (0, 0.15, 0.42), (-0.24, 0.55, 0.2), (0.24, 0.55, 0.2)):
        D.circle(ctx, dx * s, dy * s, rr * s - 0.03 * s, c, None, 0)
    D.circle(ctx, -0.12 * s, -0.66 * s, 0.05 * s, INK, None, 0)
    D.circle(ctx, 0.12 * s, -0.66 * s, 0.05 * s, INK, None, 0)
    D.ellipse(ctx, -0.1 * s, 0.0, 0.1 * s, 0.16 * s, "#ffffff", None, 0, alpha=0.45)
    ctx.restore()


def jar(ctx, x, base, w, h, seed, lid="#c23b33", kind="balls"):
    """Банка с конфетами на полке."""
    r = rng(seed)
    ctx.save()
    D.rrect_path(ctx, x, base - h, w, h, w * 0.18)
    ctx.clip()
    D.col(ctx, hexrgb("#f4ece4"))
    ctx.paint()
    if kind == "balls":
        rr = w * 0.12
        yy = base - rr
        row = 0
        while yy > base - h * 0.85:
            xx = x + rr + (rr if row % 2 else 0) * 0.9
            while xx < x + w:
                D.circle(ctx, xx, yy, rr, hexrgb(r.choice(CANDY)), INK, 1.6)
                xx += rr * 1.85
            yy -= rr * 1.6
            row += 1
    else:   # леденцы-палочки
        for k in range(7):
            cx = x + w * (0.15 + 0.7 * k / 6)
            lollipop(ctx, cx, base - h * (0.62 + 0.15 * (k % 2)), w * 0.12, r.choice(CANDY), "#f6eedd", stick=4)
    ctx.restore()
    D.rrect(ctx, x, base - h, w, h, w * 0.18, None, INK, 3.5)
    D.rrect(ctx, x + w * 0.1, base - h - w * 0.16, w * 0.8, w * 0.2, w * 0.05, hexrgb(lid), INK, 3.5)
    D.col(ctx, hexrgb("#ffffff"), 0.45)
    D.rrect(ctx, x + w * 0.12, base - h * 0.88, w * 0.1, h * 0.6, w * 0.05, hexrgb("#ffffff"), None, 0, alpha=0.45)


# --- зомби ---------------------------------------------------------------------

def zhand(ctx, x, y, ang, s, skin="#9fab98", sleeve="#4a5a6e", arm=6.0, spread=1.0, curl=0.0):
    """Рука зомби: из-за края кадра к точке (x, y) — центру ладони."""
    skin, sleeve = hexrgb(skin), hexrgb(sleeve)
    lw = 0.09 * s
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    D.poly(ctx, [(-arm * s, -0.42 * s), (-0.55 * s, -0.36 * s), (-0.55 * s, 0.36 * s), (-arm * s, 0.46 * s)],
           skin, INK, lw, wob=0)
    D.poly(ctx, [(-arm * s, -0.5 * s), (-1.6 * s, -0.47 * s), (-1.5 * s, -0.1 * s), (-1.7 * s, 0.2 * s),
                 (-1.55 * s, 0.52 * s), (-arm * s, 0.56 * s)], sleeve, INK, lw, wob=0)
    fingers = [(-0.36, 0.95), (-0.12, 1.08), (0.12, 1.02), (0.34, 0.85)]
    for j, (oy, ln) in enumerate(fingers):
        a = (oy * 0.5) * spread
        bx, by = 0.2 * s, oy * s * 0.85
        ex = bx + math.cos(a) * ln * s
        ey = by + math.sin(a) * ln * s
        mx = bx + math.cos(a) * ln * s * 0.55
        my = by + math.sin(a) * ln * s * 0.55
        ex2 = mx + math.cos(a + curl) * ln * s * 0.45
        ey2 = my + math.sin(a + curl) * ln * s * 0.45
        for c, w in ((INK, 0.27 * s + lw * 2), (skin, 0.27 * s)):
            D.polyline(ctx, [(bx, by), (mx, my), (ex2, ey2)], c, w)
    # большой палец
    for c, w in ((INK, 0.28 * s + lw * 2), (skin, 0.28 * s)):
        D.polyline(ctx, [(-0.1 * s, -0.4 * s), (0.25 * s, -0.75 * s), (0.5 * s, -0.85 * s)], c, w)
    D.ellipse(ctx, 0, 0, 0.62 * s, 0.55 * s, skin, INK, lw)
    D.ellipse(ctx, 0.04 * s, 0, 0.5 * s, 0.43 * s, skin, None, 0)
    D.line(ctx, -0.2 * s, -0.1 * s, 0.25 * s, 0.05 * s, shade(skin, -0.25), 0.04 * s)
    ctx.restore()


def eyes_glow(ctx, x, y, s, a=1.0):
    """Глаза в темноте."""
    for k in (-1, 1):
        fx.glow(ctx, x + k * s * 0.55, y, s * 2.2, "#c8f0a0", 0.22 * a)
        D.ellipse(ctx, x + k * s * 0.55, y, s * 0.32, s * 0.24, "#e8ffd0", None, 0, alpha=a)


# --- половины -------------------------------------------------------------------

def clip_left(ctx):
    D.path(ctx, [(0, 0), (TOP_X, 0), (BOT_X, H), (0, H)])
    ctx.clip()


def clip_right(ctx):
    D.path(ctx, [(TOP_X, 0), (W, 0), (W, H), (BOT_X, H)])
    ctx.clip()


def arms_on_top(fig, which=(1, 2)):
    """В анфас руки рисуются за телом; для жестов у лица — дорисовать поверх."""
    def ex(ctx, J, layer):
        if layer == "mid":
            lw = R.LIMB_W * fig.look.limb_k
            for i in which:
                fig._arm(ctx, J, i, fig.look.limb, lw)
    return ex


def day1(ctx):
    # стена кондитерского отдела: пастельные полосы
    D.rect(ctx, 0, 0, W, H, hexrgb("#f9dcd3"), None, 0, wob=0)
    for k in range(0, 24):
        if k % 2:
            D.rect(ctx, k * 64, 0, 64, H, hexrgb("#f5cbc2"), None, 0, wob=0)
    # маркиза
    for k in range(18):
        c = "#e8505b" if k % 2 else "#fbf3ea"
        D.poly(ctx, [(k * 70 - 20, 0), (k * 70 + 50, 0), (k * 70 + 50, 70), (k * 70 + 15, 100), (k * 70 - 20, 70)],
               hexrgb(c), INK, 3, wob=0)
    # полки с банками
    r = rng(11)
    for row, base in enumerate((430, 690)):
        x = -40 + row * 50
        while x < 1060:
            w = r.uniform(120, 160)
            h = r.uniform(150, 190)
            jar(ctx, x, base, w, h, int(x) + row * 100, lid=r.choice(["#c23b33", "#3f8a84", "#e2a33b", "#7a6aa3"]),
                kind="pops" if r.random() < 0.25 else "balls")
            x += w + r.uniform(18, 34)
        D.rect(ctx, -20, base, 1100, 26, hexrgb("#c98a5a"), INK, 3.5, wob=0)
        D.rect(ctx, -20, base + 26, 1100, 12, hexrgb("#9a6a42"), INK, 2.5, wob=0)
    # мягкий свет сверху
    fx.glow(ctx, 480, 380, 700, "#fff0d8", 0.25)

    # герой: толстый, счастливый, рот набит
    fig = R.Fig(FAT)
    gy = GY - 70
    p = R.stand("front", 0.6, 1)
    p.update(face="eat", eyes="happy", cheeks=1.2, smear=1.0, mouth=0.7, htilt=0.1, lean=0.0,
             h1=(-1.0, -3.0), h2=(1.0, -3.5))
    J = fig.draw(ctx, 470, gy, HS, 1, p, extra=arms_on_top(fig))
    hx, hy = fig.world(470, gy, HS, 1, J["head"])
    h1 = fig.world(470, gy, HS, 1, J["hand1"])
    h2 = fig.world(470, gy, HS, 1, J["hand2"])
    hr = R.LIMB_W * FAT.limb_k * HS * 0.62
    # пончик у рта (откушен со стороны рта) и леденец в поднятой руке
    donut(ctx, h1[0] - 40, h1[1] - 30, 118, "#f08cb0", bite=-0.15, rot=0.0, seed=3)
    D.circle(ctx, h1[0], h1[1], hr, INK, None, 0)
    lollipop(ctx, h2[0] + 14, h2[1] - 135, 92, "#e8505b", "#fbf3ea", stick=1.6, ang=math.pi / 2 + 0.1)
    D.circle(ctx, h2[0], h2[1], hr, INK, None, 0)
    # крошки и посыпка летят изо рта
    rr = rng(5)
    mx, my = hx + 5, hy + 70
    for k in range(18):
        a = rr.choice((rr.uniform(-0.6, 0.5), rr.uniform(2.5, 3.5)))
        d = rr.uniform(150, 230)
        x, y = mx + math.cos(a) * d, my + math.sin(a) * d * 0.6
        if rr.random() < 0.5:
            D.circle(ctx, x, y, rr.uniform(5, 9), hexrgb("#d99a55"), INK, 2)
        else:
            an = rr.uniform(0, math.pi)
            D.line(ctx, x - 9 * math.cos(an), y - 9 * math.sin(an), x + 9 * math.cos(an), y + 9 * math.sin(an),
                   hexrgb(rr.choice(SPRINKLES)), 7)
    # конфеты в воздухе
    for (x, y, s, c, rot) in ((175, 300, 34, "#f2b134", 0.5), (820, 520, 30, "#4bb3a6", -0.4),
                              (110, 610, 28, "#8f6fc2", 0.9), (860, 300, 26, "#e8505b", 0.2)):
        wrapped(ctx, x, y, s, c, rot)
        D.line(ctx, x - 60, y + 40, x - 95, y + 62, INK, 4, 0.5)
        D.line(ctx, x - 50, y + 58, x - 78, y + 76, INK, 4, 0.5)
    # гора сладостей на переднем плане
    pile = rng(21)
    for k in range(60):
        x = pile.uniform(-30, 980)
        y = pile.uniform(1000, 1100) - max(0, abs(x - 470) - 220) * 0.25
        kind = pile.random()
        c = pile.choice(CANDY)
        if kind < 0.45:
            wrapped(ctx, x, y, pile.uniform(26, 40), c, pile.uniform(-1, 1))
        elif kind < 0.6:
            gummy(ctx, x, y, pile.uniform(28, 40), c, pile.uniform(-0.6, 0.6))
        elif kind < 0.72:
            choco(ctx, x, y, 170, 70, pile.uniform(-0.5, 0.5), pile.choice(["#c23b33", "#3f8a84", "#7a6aa3"]))
        elif kind < 0.84:
            donut(ctx, x, y, pile.uniform(55, 70), pile.choice(["#f08cb0", "#7a4a30", "#f6e3c4"]),
                  rot=pile.uniform(0, TAU), seed=k)
        else:
            cupcake(ctx, x, y, pile.uniform(50, 62), pile.choice(["#f08cb0", "#f6e3c4", "#b9a3e3"]),
                    pile.uniform(-0.3, 0.3))
    cone(ctx, 840, 900, 70, 0.35)
    cone(ctx, 95, 905, 62, -0.3, ("#b9e3c6", "#f6e3c4"))
    lollipop(ctx, 740, 850, 60, "#4bb3a6", "#fbf3ea", stick=2.6)
    lollipop(ctx, 200, 870, 54, "#f2b134", "#e8505b", stick=2.6, ang=math.pi / 2 - 0.2)
    fx.grade(ctx, "warm", 0.35)


def tinted(ctx, draw_fn, color, a):
    """Нарисовать и умножить на цвет только нарисованное (прозрачное не трогать)."""
    ctx.push_group()
    draw_fn()
    shape = ctx.pop_group()
    ctx.push_group()
    ctx.set_source(shape)
    ctx.paint()
    ctx.set_operator(cairo.OPERATOR_MULTIPLY)
    D.col(ctx, color, a)
    ctx.paint()
    lit = ctx.pop_group()
    ctx.set_source(lit)
    ctx.mask(shape)


def drop(ctx, x, y, r_, a):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    ctx.move_to(0, -r_ * 2)
    ctx.curve_to(r_ * 0.9, -r_ * 0.4, r_, r_ * 0.9, 0, r_)
    ctx.curve_to(-r_, r_ * 0.9, -r_ * 0.9, -r_ * 0.4, 0, -r_ * 2)
    ctx.close_path()
    D.col(ctx, hexrgb("#a9d8f0"))
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(3.5)
    ctx.stroke()
    D.circle(ctx, -r_ * 0.3, -r_ * 0.2, r_ * 0.25, "#ffffff", None, 0, alpha=0.9)
    ctx.restore()


def day30(ctx):
    HX = 1490
    D.rect(ctx, BOT_X - 40, 0, W, H, hexrgb("#4a5470"), None, 0, wob=0)
    # окно-витрина: за стеклом ночь и толпа
    wx0, wy0, wx1, wy1 = 1185, 150, 1990, 880
    ctx.save()
    ctx.rectangle(wx0, wy0, wx1 - wx0, wy1 - wy0)
    ctx.clip()
    D.vgrad(ctx, wx0, wy0, wx1 - wx0, wy1 - wy0, [(0, "#3e5288"), (1, "#7480a6")])
    rz = rng(44)
    for k in range(30):
        x = rz.uniform(wx0 - 40, wx1)
        s = rz.uniform(34, 52)
        look = R.zombie_look(4000 + k)
        p = R.stand("front", k * 0.3, k)
        p.update(a1=(1.2, -0.2), a2=(1.1, -0.1), lean=0.1, neck=0.2, mouth=0.5)
        R.Fig(look).draw(ctx, x, wy1 + 60 + rz.uniform(0, 50), s, 1, p)
    fx.tint(ctx, "#33447a", 0.5)
    for (x, y, s, seed) in ((1262, 300, 150, 51), (1800, 300, 160, 52), (1890, 575, 175, 53),
                            (1265, 650, 140, 54)):
        look = R.zombie_look(seed)
        R.Fig(look).head_only(ctx, x, y, s, -1 if x > 1500 else 1,
                              {"view": "front", "mouth": 0.9, "hturn": 0.0, "neck_line": False})
    ctx.restore()
    # стекло, ладони, трещины
    D.col(ctx, hexrgb("#b8c8e0"), 0.16)
    ctx.rectangle(wx0, wy0, wx1 - wx0, wy1 - wy0)
    ctx.fill()
    for (x, y, a, s) in ((1690, 210, -1.3, 46), (1950, 330, -1.9, 44), (1700, 790, -1.6, 50)):
        zhand(ctx, x, y, a, s, arm=0.6)
    ck = rng(9)
    for (cx, cy) in ((1700, 420), (1290, 800)):
        for k in range(9):
            a = ck.uniform(0, TAU)
            pts = [(cx, cy)]
            x, y = cx, cy
            for j in range(4):
                a += ck.uniform(-0.5, 0.5)
                d = ck.uniform(40, 90)
                x, y = x + math.cos(a) * d, y + math.sin(a) * d
                pts.append((x, y))
            D.polyline(ctx, pts, "#eef4ff", 3, 0.75)
    D.rect(ctx, wx0, wy0, wx1 - wx0, wy1 - wy0, None, INK, 10, wob=0)
    # 30 зарубок на стене
    tc = hexrgb("#ece6d6")
    for g in range(6):
        gx = 1012 + (g % 2) * 86
        gy = 270 + (g // 2) * 115
        for k in range(4):
            D.line(ctx, gx + k * 15, gy, gx + k * 15 + 3, gy + 72, tc, 6)
        D.line(ctx, gx - 10, gy + 56, gx + 60, gy + 14, tc, 6)
    # пол и пустые фантики от тех самых сладостей
    D.rect(ctx, BOT_X - 40, 905, W, 200, hexrgb("#3a3a4a"), INK, 3, wob=0)
    fr = rng(77)
    for k in range(10):
        x = fr.uniform(BOT_X + 30, W - 30)
        wrapped(ctx, x, fr.uniform(960, 1060), 30, shade(hexrgb(fr.choice(CANDY)), -0.3), fr.uniform(-1, 1))
    corners = [(1075, 985, 230, 71, 1), (1900, 1000, 250, 72, -1)]

    # света нет: всё тонет в синей темноте
    fx.grade(ctx, "deepnight", 0.8)
    g = cairo.RadialGradient(HX, 520, 150, HX, 520, 900)
    dk = hexrgb("#06060d")
    g.add_color_stop_rgba(0, *dk, 0.0)
    g.add_color_stop_rgba(0.5, *dk, 0.4)
    g.add_color_stop_rgba(1, *dk, 0.85)
    ctx.set_source(g)
    ctx.paint()
    # совсем близко, из темноты по углам — головы зомби
    def heads():
        for (x, y, s, seed, f) in corners:
            look = R.zombie_look(seed)
            D.rrect(ctx, x - 0.42 * s, y + 0.5 * s, 0.84 * s, 1.4 * s, 0.12 * s, look.body, INK, 0.05 * s)
            R.Fig(look).head_only(ctx, x, y, s, f, {"view": "front", "mouth": 1.0, "hturn": 0.25 * f,
                                                     "htilt": 0.2 * f, "neck_line": True})
    tinted(ctx, heads, "#4a5280", 0.9)
    for (x, y, s) in ((1010, 760, 9), (1120, 690, 7), (1890, 880, 9), (1960, 760, 8), (1150, 860, 8),
                      (1015, 590, 7)):
        eyes_glow(ctx, x, y, s)
    # лунный ореол за героем — чтобы силуэт читался
    fx.glow(ctx, HX, 560, 420, "#8fa6e8", 0.22)

    # герой: худой, грязный, трясётся, руки у лица
    fig = R.Fig(THIN)
    p = R.stand("front", 0.0, 1)
    p.update(face="scream", mouth=0.75, pupil=0.55, whites=1.28, sweat=1.0, dirt=1.0, bags=1.0, hollow=1.0,
             htilt=-0.06, lean=-0.04, h1=(-0.43, -3.2), h2=(0.45, -3.24))
    J = {}

    def hero():
        J.update(fig.draw(ctx, HX, GY, HS, 1, p, extra=arms_on_top(fig)))
        hx, hy = fig.world(HX, GY, HS, 1, J["head"])
        D.circle(ctx, hx - 70, hy - 108, 13, hexrgb("#2a201c"), None, 0)
        D.circle(ctx, hx + 58, hy - 120, 9, hexrgb("#2a201c"), None, 0)
        D.polyline(ctx, [(hx + 95, hy - 75), (hx + 112, hy - 52), (hx + 104, hy - 30)], INK, 4)
    tinted(ctx, hero, "#9aa8d8", 0.75)
    hx, hy = fig.world(HX, GY, HS, 1, J["head"])

    # руки зомби тянутся к нему из темноты
    def hands():
        zhand(ctx, 1235, 880, -0.6, 66, sleeve="#5a4a5e", curl=0.35)
        zhand(ctx, 1735, 470, math.pi + 0.12, 60, sleeve="#4a5a6e", curl=-0.3, skin="#a8b29c")
        zhand(ctx, 1770, 800, math.pi + 0.5, 66, sleeve="#6e5a4a", curl=-0.35, skin="#98a593")
    tinted(ctx, hands, "#7d88b8", 0.85)
    # пот летит в стороны, дрожь
    for (dx, dy, r_, a) in ((-180, -40, 17, 0.5), (190, -75, 19, -0.5), (-155, -150, 13, 0.7),
                            (150, -175, 12, -0.3)):
        drop(ctx, hx + dx, hy + dy, r_, a)
    for k in (-1, 1):
        for j in range(3):
            x = hx + k * (218 + j * 26)
            D.curve(ctx, [(x, hy + 40 + j * 10), (x + k * 10, hy + 80 + j * 10), (x, hy + 120 + j * 10)],
                    "#e8eefc", 5, 0.85)


def title(ctx, txt, cx, fill, maxw):
    size = 200
    w = D.text_width(ctx, txt, size, D.FONT_TITLE)
    size *= min(1.0, maxw / w)
    y = 40 + size * 0.86
    D.text(ctx, txt, cx + 6, y + 9, size, D.FONT_TITLE, INK, stroke=INK, slw=size * 0.13, alpha=0.45)
    D.text(ctx, txt, cx, y, size, D.FONT_TITLE, hexrgb(fill), stroke=INK, slw=size * 0.13)


def render():
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W * SS, H * SS)
    ctx = cairo.Context(surf)
    ctx.scale(SS, SS)
    ctx.save()
    clip_left(ctx)
    day1(ctx)
    ctx.restore()
    ctx.save()
    clip_right(ctx)
    day30(ctx)
    ctx.restore()
    fx.paper_and_grain(ctx, 0, grain=0.05, paper=0.3, vignette=0.45)
    # граница
    D.line(ctx, TOP_X, -10, BOT_X, H + 10, INK, 24)
    D.line(ctx, TOP_X, -10, BOT_X, H + 10, "#f4efe4", 10)
    title(ctx, "DAY 1", 475, "#fbf6ec", 820)
    title(ctx, "DAY 30", 1450, "#e8392f", 860)
    surf.flush()
    img = Image.frombuffer("RGBA", (W * SS, H * SS), bytes(surf.get_data()), "raw", "BGRA", 0, 1).convert("RGB")
    img = ImageEnhance.Color(img).enhance(1.12)
    os.makedirs(os.path.join(ROOT, "build"), exist_ok=True)
    big = img.resize((1920, 1080), Image.LANCZOS)
    big.save(os.path.join(ROOT, "build", "thumbnail_1080p.png"))
    small = img.resize((1280, 720), Image.LANCZOS)
    small.save(os.path.join(ROOT, "build", "thumbnail.png"))
    small.save(os.path.join(ROOT, "docs", "thumbnail.jpg"), quality=92)
    return small


if __name__ == "__main__":
    render()
    print("build/thumbnail.png, build/thumbnail_1080p.png, docs/thumbnail.jpg")
