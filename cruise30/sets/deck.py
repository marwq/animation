"""Палуба 15: бассейн, бар, вход в ресторан, горки, большой экран на трубе, дверь экипажа.

Вид сбоку поперёк палубы. Пол GF = 880. За дальним ограждением — океан (горизонт HY = 560).
Мир по x: от -800 до 4600.
"""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1, W, H
from engine import draw as D
from . import sea as SEA

INK = D.INK
GF = 880
HY = 560
X0, X1 = -800, 5600
POOL = (1400, 2600)
TUB = (2760, 3060)
TOWER = (3200, 3420)
SPLASH = (3460, 3860)
CREW_DOOR = 4250
LADDER_X = 4420
BUFFET = (-640, 380)
BAR = (430, 960)
SCREEN = (1560, 140, 1100, 520)     # x, y, w, h — экран на трубе

NIGHT = ("night", "deepnight", "dusk", "storm")


def tone(c, tod):
    c = hexrgb(c) if isinstance(c, str) else c
    k = {"day": 0, "morning": 0.05, "dawn": 0.15, "golden": 0.12, "sunset": 0.22, "dusk": 0.38, "night": 0.55,
         "deepnight": 0.68, "storm": 0.42, "green": 0.25, "overcast": 0.15, "rain": 0.3}.get(tod, 0)
    t = {"morning": "#ffe8c8", "dawn": "#f2b0a0", "golden": "#ffc890", "sunset": "#f08a7a", "dusk": "#6a4a8a",
         "night": "#2a3a78", "deepnight": "#18224e", "storm": "#4a5560", "green": "#6a8a5a", "overcast": "#a8b4bc",
         "rain": "#6a7a8a"}.get(tod)
    return mix(c, hexrgb(t), k) if t else c


# --- задник: небо и океан (каждый кадр) ---------------------------------------------

def backdrop(ctx, t, tod="day", x0=X0 - 600, x1=X1 + 600, hy=HY, sun=None, moon=None, rough=0.0, stars_a=1.0,
             clouds=True, seed=4):
    sky_tod = "sunset" if tod == "golden" else tod
    sea_tod = "night" if tod == "deepnight" else tod
    SEA.sky(ctx, x0, -900, x1 - x0, hy + 900, sky_tod)
    if tod in ("night", "deepnight") and stars_a > 0:
        SEA.stars(ctx, x0, -900, x1 - x0, hy + 850, t, seed, 0.8, stars_a)
    if sun:
        SEA.sun(ctx, *sun, tod)
    if moon:
        SEA.moon(ctx, *moon)
    if clouds:
        SEA.cloudbank(ctx, x0, x1, hy - 260, sky_tod if tod != "rain" else "storm", seed=seed, n=9, s0=0.5, s1=1.0)
    SEA.ocean(ctx, t, x0, x1, hy, hy + 420, sea_tod if tod != "rain" else "storm", rough=rough, seed=seed,
              sun_x=(sun or moon or (None,))[0])


# --- дальний план: надстройки за палубой (кэш) -------------------------------------

def far(ctx, tod="day", power=1.0, screen=True, slides=True, broken=False):
    T = lambda c: tone(c, tod)
    lit = power > 0 and tod in NIGHT
    # дальнее стеклянное ограждение
    D.rect(ctx, X0, 690, X1 - X0, 70, T("#bfe6f2"), None, 0, wob=0, alpha=0.55)
    D.line(ctx, X0, 690, X1, 690, T("#e8eef0"), 8)
    D.line(ctx, X0, 690, X1, 690, INK, 2)
    for x in range(X0, X1, 160):
        D.line(ctx, x, 690, x, 760, T("#d8dee2"), 6)
    D.rect(ctx, X0, 760, X1 - X0, 12, T("#c9d2d6"), INK, 2, wob=0)
    # труба с огромным экраном
    sx, sy, sw, sh = SCREEN
    D.poly(ctx, [(sx - 140, 772), (sx - 90, -300), (sx + sw + 60, -340), (sx + sw + 140, 772)], T("#f6f6f2"), INK, 4,
           wob=0)
    D.rect(ctx, sx - 120, -320, sw + 260, 140, T("#1c3f7c"), None, 0, wob=0)
    D.rect(ctx, sx - 120, -180, sw + 260, 14, T("#e9b949"), None, 0, wob=0)
    D.rect(ctx, sx - 30, sy - 30, sw + 60, sh + 60, T("#2b2f3a"), INK, 4, wob=0)
    D.circle(ctx, sx + sw / 2, -60, 70, T("#1c3f7c"), INK, 4)
    D.poly(ctx, [(sx + sw / 2 - 42, -40), (sx + sw / 2 - 42, -80), (sx + sw / 2 - 20, -62), (sx + sw / 2, -96),
                 (sx + sw / 2 + 20, -62), (sx + sw / 2 + 42, -80), (sx + sw / 2 + 42, -40)], T("#e9b949"), INK, 3,
           wob=0)
    D.text(ctx, "SEA EMPRESS", sx + sw / 2, 60, 64, D.FONT_TITLE, T("#1c3f7c"))
    for spk in (sx - 90, sx + sw + 60):
        D.rrect(ctx, spk, sy + 60, 40, 120, 10, T("#2b2f3a"), INK, 3)
    if not screen:
        D.rect(ctx, sx, sy, sw, sh, T("#1a1f2c"), None, 0, wob=0)
    # бар «тики» с соломенной крышей
    bx0, bx1 = BAR
    D.rect(ctx, bx0 + 20, 560, bx1 - bx0 - 40, 230, T("#7a4a2a"), INK, 3, wob=0)
    r = rng(5)
    for i in range(22):
        c = T(r.choice(["#3fbf6a", "#e8423c", "#f2c230", "#2f8fd8", "#a86a3a", "#f05a8a"]))
        bx = bx0 + 50 + i * 20
        D.rrect(ctx, bx, 610 - r.uniform(0, 30), 14, 50 + r.uniform(0, 30), 4, c, INK, 1.5)
    D.line(ctx, bx0 + 30, 668, bx1 - 30, 668, T("#5a3a20"), 8)
    D.poly(ctx, [(bx0 - 40, 580), (bx0 + 60, 470), (bx1 - 60, 470), (bx1 + 40, 580)], T("#e8c068"), INK, 3, wob=0.5)
    D.col(ctx, T("#c9a04a"))
    ctx.set_line_width(3)
    for i in range(30):
        x = bx0 - 30 + i * (bx1 - bx0 + 60) / 30
        ctx.move_to(x, 580)
        ctx.line_to(x + 14, 600 + (i % 3) * 8)
    ctx.stroke()
    D.rect(ctx, bx0 + 150, 430, 230, 50, T("#16a39a"), INK, 3, wob=0)
    D.text(ctx, "SPLASH BAR", bx0 + 265, 466, 34, D.FONT_TITLE, T("#fff6d8"))
    # стойка
    D.rect(ctx, bx0, 700, bx1 - bx0, 100, T("#a86a3a"), INK, 3, wob=0)
    D.rect(ctx, bx0 - 10, 690, bx1 - bx0 + 20, 16, T("#5a3a20"), INK, 3, wob=0)
    for i in range(6):
        D.rect(ctx, bx0 + 20 + i * 88, 712, 60, 70, T("#c98a4a"), None, 0, wob=0, alpha=0.5)
    # ресторан
    fx0, fx1 = BUFFET
    D.rect(ctx, fx0, 300, fx1 - fx0, 480, T("#f6f4ee"), INK, 4, wob=0)
    for i in range(5):
        gx = fx0 + 30 + i * 196
        D.rect(ctx, gx, 380, 170, 380, T("#9fd8ec") if not lit else hexrgb("#ffe7a8"), INK, 3, wob=0)
        if not lit:
            D.poly(ctx, [(gx + 20, 760), (gx + 70, 760), (gx + 150, 380), (gx + 100, 380)], T("#ffffff"), None, 0,
                   wob=0, alpha=0.35)
    D.rect(ctx, fx0 + 260, 310, 500, 60, T("#e8423c"), INK, 3, wob=0)
    D.text(ctx, "HORIZON BUFFET", fx0 + 510, 355, 40, D.FONT_TITLE, T("#fff6d8"))
    # горки: башня и трубы
    tx0, tx1 = TOWER
    D.rect(ctx, tx0, 120, tx1 - tx0, 660, T("#eef2f4"), INK, 4, wob=0)
    for k in range(14):
        y = 160 + k * 45
        D.line(ctx, tx0 + 10, y, tx1 - 10, y + 30, T("#b8c4ca"), 5)
    D.rect(ctx, tx0 - 20, 100, tx1 - tx0 + 40, 40, T("#f05a8a"), INK, 3, wob=0)
    if slides and not broken:
        _tube(ctx, T("#f2c230"), [(tx1, 160), (3700, 90), (3900, 260), (3600, 380), (3500, 520), (3720, 640),
                                   (3820, 760)], 66)
        _tube(ctx, T("#16a3b0"), [(tx0, 220), (2950, 140), (2860, 330), (3100, 430), (3420, 470), (3560, 700),
                                   (3640, 790)], 60)
    elif slides and broken:
        _tube(ctx, T("#f2c230"), [(tx1, 160), (3700, 90), (3880, 230)], 66)
        _tube(ctx, T("#16a3b0"), [(3560, 700), (3640, 790)], 60)
    # дверь экипажа и трап на мостик
    D.rect(ctx, CREW_DOOR - 110, 470, 330, 310, T("#e8eef0"), INK, 4, wob=0)
    D.rrect(ctx, CREW_DOOR - 60, 520, 130, 260, 14, T("#8a96a0"), INK, 4)
    D.rect(ctx, CREW_DOOR - 50, 540, 110, 50, T("#f2c230"), INK, 2, wob=0)
    D.text(ctx, "CREW", CREW_DOOR + 5, 572, 26, D.FONT_TITLE, INK)
    D.text(ctx, "ONLY", CREW_DOOR + 5, 600, 22, D.FONT_TITLE, INK)
    D.circle(ctx, CREW_DOOR + 45, 660, 8, T("#d6b24c"), INK, 2)
    ladder(ctx, LADDER_X, 100, 780, tod)
    D.rect(ctx, LADDER_X - 160, 60, 400, 50, T("#e8eef0"), INK, 4, wob=0)
    # гирлянды и флажки
    _bunting(ctx, -600, 4400, 250, tod, lit)
    if power > 0:
        _string_lights(ctx, 380, 3200, 420, tod, lit)


def ladder(ctx, x, y0, y1, tod="day", w=70, c="#9aa6ae"):
    D.line(ctx, x - w / 2, y0, x - w / 2, y1, INK, 9)
    D.line(ctx, x + w / 2, y0, x + w / 2, y1, INK, 9)
    D.line(ctx, x - w / 2, y0, x - w / 2, y1, tone(c, tod), 5)
    D.line(ctx, x + w / 2, y0, x + w / 2, y1, tone(c, tod), 5)
    y = y1 - 30
    while y > y0 + 10:
        D.line(ctx, x - w / 2, y, x + w / 2, y, INK, 7)
        D.line(ctx, x - w / 2, y, x + w / 2, y, tone(c, tod), 3.5)
        y -= 44


def _tube(ctx, c, pts, w):
    for col, lw in ((INK, w + 9), (c, w)):
        D.col(ctx, col)
        ctx.set_line_width(lw)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        D.catmull(ctx, pts)
        ctx.stroke()
    D.col(ctx, (1, 1, 1), 0.35)
    ctx.set_line_width(w * 0.18)
    D.catmull(ctx, [(x - w * 0.18, y - w * 0.22) for x, y in pts])
    ctx.stroke()


def _bunting(ctx, x0, x1, y, tod, lit):
    cols = ["#e8423c", "#f2c230", "#2f8fd8", "#3fbf6a", "#f05a8a", "#ffffff"]
    span = 600
    x = x0
    while x < x1:
        pts = [(x + span * u, y + math.sin(math.pi * u) * 70) for u in (0, 0.25, 0.5, 0.75, 1.0)]
        D.curve(ctx, pts, INK, 2)
        for k in range(11):
            u = (k + 0.5) / 11
            px, py = x + span * u, y + math.sin(math.pi * u) * 70
            D.poly(ctx, [(px - 18, py), (px + 18, py), (px, py + 36)], tone(cols[k % 6], tod), INK, 1.5, wob=0)
        x += span


def _string_lights(ctx, x0, x1, y, tod, lit):
    span = 470
    x = x0
    k = 0
    while x < x1:
        for i in range(12):
            u = (i + 0.5) / 12
            px, py = x + span * u, y + math.sin(math.pi * u) * 60
            if lit:
                D.radial(ctx, px, py, 26, "#ffe08a", 0.45, 0)
            D.circle(ctx, px, py, 6, hexrgb("#fff2b0") if lit else tone("#f6f0d8", tod), INK, 1.2)
            k += 1
        D.curve(ctx, [(x + span * u, y + math.sin(math.pi * u) * 60 - 6) for u in (0, 0.25, 0.5, 0.75, 1)], INK, 1.5)
        x += span


# --- палуба: пол, бассейн, шезлонги (кэш) ------------------------------------------

def floor(ctx, tod="day", chairs=True, mess=0.0, seed=3):
    T = lambda c: tone(c, tod)
    # тиковый настил
    D.rect(ctx, X0, 772, X1 - X0, 1400, T("#dca15e"), None, 0, wob=0)
    D.col(ctx, T("#c4874a"))
    ctx.set_line_width(2.5)
    for k in range(9):
        y = 772 + (k ** 1.5) * 9
        ctx.move_to(X0, y)
        ctx.line_to(X1, y)
    ctx.stroke()
    r = rng(seed)
    for k in range(260):
        x = r.uniform(X0, X1)
        y = 780 + r.uniform(0, 420)
        D.line(ctx, x, y, x, y + 8 + (y - 772) * 0.03, T("#c4874a"), 2)
    D.line(ctx, X0, 772, X1, 772, INK, 3)
    # бассейн
    p0, p1 = POOL
    D.rect(ctx, p0 - 30, GF - 6, p1 - p0 + 60, 18, T("#f4f2ec"), INK, 3, wob=0)
    D.rect(ctx, p0, GF + 12, p1 - p0, 170, T("#7fe2ee"), INK, 3, wob=0)
    D.col(ctx, T("#5fcfe0"))
    ctx.set_line_width(2)
    for x in range(p0, p1, 50):
        ctx.move_to(x, GF + 12)
        ctx.line_to(x, GF + 182)
    for y in range(GF + 40, GF + 182, 40):
        ctx.move_to(p0, y)
        ctx.line_to(p1, y)
    ctx.stroke()
    # лесенка в бассейн
    for lx in (p0 + 60, p1 - 80):
        D.curve(ctx, [(lx, GF + 60), (lx, GF - 40), (lx + 30, GF - 50)], INK, 9)
        D.curve(ctx, [(lx, GF + 60), (lx, GF - 40), (lx + 30, GF - 50)], T("#d8e0e4"), 5)
    # джакузи
    t0, t1 = TUB
    D.rrect(ctx, t0, GF - 90, t1 - t0, 100, 40, T("#f4f2ec"), INK, 4)
    D.rrect(ctx, t0 + 20, GF - 76, t1 - t0 - 40, 30, 15, T("#6fe0f0"), INK, 2)
    # бассейн-приёмник горки
    s0, s1 = SPLASH
    D.rect(ctx, s0, GF - 6, s1 - s0, 16, T("#f4f2ec"), INK, 3, wob=0)
    D.rect(ctx, s0 + 20, GF + 10, s1 - s0 - 40, 110, T("#7fe2ee"), INK, 3, wob=0)
    if chairs:
        cols = ["#e8423c", "#f2c230", "#2f8fd8", "#f05a8a", "#16a39a"]
        spots = [960, 1110, 1260, 2640, 3080, 3920, 4070]
        for i, x in enumerate(spots):
            lounger(ctx, x, GF, T(cols[i % 5]), tod, tilt=(r.uniform(-0.3, 0.3) if mess > 0.5 else 0))
        for i, x in enumerate([1030, 1330, 2700, 3990]):
            umbrella(ctx, x, GF - 10, T(cols[(i + 2) % 5]), tod, open_=1.0 if mess < 0.5 else 0.0)
        for x in (-700, 470, 1450, 2500, 3140, 4180):
            palm_pot(ctx, x, GF + 10, tod)
        # спасательные круги на ограждении
        for x in (2080, 3940):
            lifering(ctx, x, 725, tod)
    if mess > 0:
        for k in range(int(30 * mess)):
            x = r.uniform(X0, X1)
            y = GF + r.uniform(20, 180)
            kind = r.random()
            if kind < 0.4:
                D.ellipse(ctx, x, y, 22, 8, T(r.choice(["#f4f2ec", "#e8423c", "#f2c230"])), INK, 2)
            elif kind < 0.7:
                D.poly(ctx, [(x, y), (x + 20, y - 4), (x + 16, y + 6)], T("#bfe6f2"), INK, 1.5, wob=0)
            else:
                D.ellipse(ctx, x, y, 30, 6, T("#8ad0e0"), None, 0, alpha=0.5)


def lounger(ctx, x, gy, c, tod="day", tilt=0.0, f=1):
    ctx.save()
    ctx.translate(x, gy)
    ctx.rotate(tilt)
    ctx.scale(f, 1)
    D.line(ctx, -60, -20, -60, 0, INK, 5)
    D.line(ctx, 60, -20, 60, 0, INK, 5)
    D.poly(ctx, [(-80, -26), (40, -26), (90, -70), (100, -64), (54, -16), (-80, -16)], tone("#f4f4ef", tod), INK, 3,
           wob=0)
    D.poly(ctx, [(-70, -32), (36, -32), (82, -72), (90, -68), (46, -26), (-70, -26)], c, None, 0, wob=0)
    D.rrect(ctx, 64, -84, 34, 18, 8, tone("#ffffff", tod), INK, 2)
    ctx.restore()


def umbrella(ctx, x, gy, c, tod="day", open_=1.0, h=230, rot=0.0):
    ctx.save()
    ctx.translate(x, gy)
    ctx.rotate(rot)
    D.line(ctx, 0, 0, 0, -h, INK, 8)
    D.line(ctx, 0, 0, 0, -h, tone("#f4f2ec", tod), 4)
    D.rect(ctx, -26, -10, 52, 12, tone("#c9c4b8", tod), INK, 2, wob=0)
    w = 150 * open_ + 18
    hh = 60 * open_ + 120 * (1 - open_)
    pts = [(-w, -h + 40 * open_ + 100 * (1 - open_)), (0, -h - 18), (w, -h + 40 * open_ + 100 * (1 - open_))]
    D.poly(ctx, pts, c, INK, 3, wob=0)
    if open_ > 0.5:
        for k in (-0.5, 0.0, 0.5):
            D.poly(ctx, [(0, -h - 18), (w * (k - 0.17), -h + 40), (w * (k + 0.17), -h + 40)], tone("#ffffff", tod),
                   None, 0, wob=0, alpha=0.85)
        for k in range(-3, 4):
            D.circle(ctx, k * w / 3.3, -h + 44, 9, c, INK, 1.5)
    ctx.restore()


def palm_pot(ctx, x, gy, tod="day", s=1.0, sway=0.0):
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.poly(ctx, [(-50, -80), (50, -80), (40, 0), (-40, 0)], tone("#f4f2ec", tod), INK, 3, wob=0)
    D.rect(ctx, -54, -92, 108, 16, tone("#16a39a", tod), INK, 3, wob=0)
    D.curve(ctx, [(0, -90), (8, -180), (2 + sway * 10, -280)], INK, 16)
    D.curve(ctx, [(0, -90), (8, -180), (2 + sway * 10, -280)], tone("#a8743a", tod), 11)
    tx, ty = 2 + sway * 10, -282
    for k in range(7):
        a = -math.pi / 2 + (k - 3) * 0.62 + sway * 0.15
        L = 135
        ex, ey = tx + math.cos(a) * L, ty + math.sin(a) * L * 0.55 + 55
        mx, my = tx + math.cos(a) * L * 0.5, ty + math.sin(a) * L * 0.5 - 18
        nx, ny = -math.sin(a), math.cos(a)
        ctx.move_to(tx, ty)
        ctx.curve_to(mx + nx * 26, my + ny * 26, ex + nx * 10, ey + ny * 10, ex, ey)
        ctx.curve_to(ex - nx * 4, ey - ny * 4, mx - nx * 6, my - ny * 6, tx, ty)
        ctx.close_path()
        D.col(ctx, tone("#2fae4f" if k % 2 else "#4cc35e", tod))
        ctx.fill_preserve()
        D.col(ctx, INK)
        ctx.set_line_width(2.5)
        ctx.stroke()
    D.circle(ctx, tx - 8, ty + 6, 9, tone("#7a4a2a", tod), INK, 2)
    D.circle(ctx, tx + 9, ty + 8, 9, tone("#7a4a2a", tod), INK, 2)
    ctx.restore()


def lifering(ctx, x, y, tod="day", r=34):
    D.circle(ctx, x, y, r, tone("#f2782e", tod), INK, 3)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(a)
        D.rect(ctx, r * 0.55, -8, r * 0.45, 16, tone("#ffffff", tod), None, 0, wob=0)
        ctx.restore()
    D.circle(ctx, x, y, r * 0.5, tone("#bfe6f2", tod), INK, 3)


def water(ctx, t, x0, x1, y, depth=170, tod="day", slosh=0.0, alpha=0.62, ripples=None):
    """Анимированная поверхность воды в бассейне (поверх людей в воде)."""
    c = tone("#2fc0e8", tod)
    pts = []
    for k in range(41):
        u = k / 40
        x = lerp(x0, x1, u)
        yy = y + math.sin(t * 2.4 + u * 18) * 3 + slosh * math.sin(u * math.pi - t * 3) * 30
        pts.append((x, yy))
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.line_to(x1, y + depth)
    ctx.line_to(x0, y + depth)
    ctx.close_path()
    D.col(ctx, c, alpha)
    ctx.fill()
    D.col(ctx, (1, 1, 1), 0.85)
    ctx.set_line_width(4)
    D.path(ctx, pts, closed=False)
    ctx.stroke()
    # блики на дне
    D.col(ctx, (1, 1, 1), 0.25)
    ctx.set_line_width(2.5)
    for k in range(int((x1 - x0) / 60)):
        bx = x0 + 30 + k * 60 + math.sin(t * 1.3 + k) * 12
        by = y + 60 + (k % 3) * 30
        ctx.move_to(bx - 18, by)
        ctx.curve_to(bx - 6, by - 8, bx + 6, by + 8, bx + 18, by)
    ctx.stroke()
    if ripples:
        for (rx, rt) in ripples:
            k = t - rt
            if 0 < k < 1.5:
                D.ellipse(ctx, rx, y + 2, 30 + 160 * k, 6 + 10 * k, None, (1, 1, 1), 3, alpha=1 - k / 1.5)


def screen_cartoon(ctx, t, tod="sunset", alpha=1.0):
    """Мультфильм на большом экране: улыбающееся солнце и прыгающий кролик."""
    sx, sy, sw, sh = SCREEN
    ctx.save()
    ctx.rectangle(sx, sy, sw, sh)
    ctx.clip()
    D.vgrad(ctx, sx, sy, sw, sh, [(0, "#7fd0ff"), (1, "#d8f4ff")])
    D.rect(ctx, sx, sy + sh * 0.72, sw, sh * 0.3, hexrgb("#6fd06a"), None, 0, wob=0)
    cx, cy = sx + sw * 0.78, sy + 110
    D.circle(ctx, cx, cy, 70, hexrgb("#ffd84a"), INK, 5)
    D.circle(ctx, cx - 22, cy - 10, 7, INK, None, 0)
    D.circle(ctx, cx + 22, cy - 10, 7, INK, None, 0)
    ctx.arc(cx, cy + 10, 30, 0.3, math.pi - 0.3)
    D.col(ctx, INK)
    ctx.set_line_width(5)
    ctx.stroke()
    hop = abs(math.sin(t * 3.2)) * 120
    bx = sx + 200 + (t * 120) % (sw - 300)
    by = sy + sh * 0.72 - hop
    D.ellipse(ctx, bx, by - 50, 50, 60, hexrgb("#ffffff"), INK, 5)
    D.circle(ctx, bx + 30, by - 120, 40, hexrgb("#ffffff"), INK, 5)
    for k in (-1, 1):
        D.ellipse(ctx, bx + 20 + k * 16, by - 190, 12, 40, hexrgb("#ffffff"), INK, 4)
    D.circle(ctx, bx + 45, by - 128, 6, INK, None, 0)
    ctx.restore()
    D.col(ctx, (0, 0, 0), 1 - alpha)
    ctx.rectangle(sx, sy, sw, sh)
    ctx.fill()


def screen_glow(ctx, a=1.0):
    sx, sy, sw, sh = SCREEN
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    D.col(ctx, "#8fc8ff", 0.15 * a)
    ctx.move_to(sx, sy + sh)
    ctx.line_to(sx + sw, sy + sh)
    ctx.line_to(sx + sw + 500, GF + 200)
    ctx.line_to(sx - 500, GF + 200)
    ctx.close_path()
    ctx.fill()
    ctx.restore()
