"""Starfall Park, снаружи: небо, озеро с маяком на горизонте, площадь, фонари, флажки,
витрины Главной улицы, тележки с едой, баллоны пропана, ворота, заборы.

Мировые координаты: пол (ноги героев) FL = 900, горизонт озера HZ = 520.
T(c) = tone(c, tod) — подкраска под время суток.
"""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D
from sets import sea as SEA
from sets.base import tone, NIGHT

INK = D.INK
FL = 900
HZ = 520
BRIGHT = ["#e8423c", "#2f8fd8", "#f2c230", "#3fbf6a", "#f2783a", "#7a4fc2", "#f05a8a", "#16a39a"]
PASTEL = ["#ffd6e0", "#cfe8ff", "#fff1b8", "#d8f5d0", "#ffe0c2", "#e6d8ff", "#c8f0ec"]


def Tf(tod):
    return lambda c: tone(c, tod)


def star(ctx, x, y, r, c, lw=0.0, ink=INK, rot=0.0):
    """Пятиконечная звезда (шрифт значок ★ не рисует)."""
    pts = []
    for k in range(10):
        rr = r if k % 2 == 0 else r * 0.45
        a = -math.pi / 2 + rot + k * math.pi / 5
        pts.append((x + math.cos(a) * rr, y + math.sin(a) * rr))
    D.poly(ctx, pts, hexrgb(c) if isinstance(c, str) else c, ink if lw else None, lw, wob=0)


# --- небо и даль --------------------------------------------------------------

def sky(ctx, t, tod="day", x0=-3000, x1=8000, hz=HZ, sun=None, moon=None, clouds=True, seed=4, stars=True):
    SEA.sky(ctx, x0, -2200, x1 - x0, hz + 2240, "sunset" if tod == "golden" else tod)
    if tod in NIGHT and stars:
        SEA.stars(ctx, x0, -2200, x1 - x0, hz + 1900, t, 7, 1.0)
    if sun:
        SEA.sun(ctx, *sun, tod)
    if moon:
        SEA.moon(ctx, *moon)
    if clouds:
        SEA.cloudbank(ctx, x0, x1, hz - 520, tod, seed=seed, n=max(4, int((x1 - x0) / 900)), s0=0.8, s1=1.4)


def far_lake(ctx, t, tod="day", x0=-3000, x1=8000, hz=HZ, lighthouse_x=None, beam=0.0, town=False):
    """Полоса озера у горизонта и холмы дальнего берега; маяк Гаса (мигает)."""
    T = Tf(tod)
    # дальний берег — синие холмы
    r = rng(17)
    pts = [(x0, hz - 10)]
    x = x0
    while x < x1:
        x += r.uniform(160, 340)
        pts.append((x, hz - 30 - r.uniform(0, 70)))
    pts += [(x1, hz - 10), (x1, hz + 4), (x0, hz + 4)]
    D.poly(ctx, pts, T("#7fa8c8") if tod not in NIGHT else T("#3a4a7a"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 120)):
        tx = x0 + k * 120 + r.uniform(-40, 40)
        D.poly(ctx, [(tx - 14, hz - 6), (tx, hz - 50 - r.uniform(0, 20)), (tx + 14, hz - 6)],
               T("#5f8aa8") if tod not in NIGHT else T("#2a3866"), None, 0, wob=0)
    if town:
        for k in range(14):
            bx = x0 + 200 + k * 150 + r.uniform(-20, 20)
            bh = r.uniform(40, 130)
            D.rect(ctx, bx, hz - bh, r.uniform(60, 110), bh, T("#6f8fb0"), None, 0, wob=0)
    # вода
    far, near = SEA.SEA.get(tod, SEA.SEA["day"])
    D.vgrad(ctx, x0, hz, x1 - x0, 90, [(0, far), (1, mix(hexrgb(far), hexrgb(near), 0.5))])
    for k in range(int((x1 - x0) / 60)):
        wx = x0 + k * 60 + (t * 12 + k * 37) % 60
        wy = hz + 12 + (k * 13) % 70
        D.line(ctx, wx, wy, wx + 26, wy, mix(hexrgb(far), hexrgb("#ffffff"), 0.4), 2, 0.6)
    if lighthouse_x is not None:
        lighthouse_far(ctx, lighthouse_x, hz - 28, 1.0, tod, beam)


def lighthouse_far(ctx, x, base, s=1.0, tod="day", beam=0.0):
    """Маяк на дальнем мысу (маленький, на горизонте)."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, base)
    ctx.scale(s, s)
    D.poly(ctx, [(-70, 20), (-30, -6), (40, -8), (80, 20)], T("#6f8a6a"), None, 0, wob=0)
    D.poly(ctx, [(-11, 0), (11, 0), (7, -78), (-7, -78)], T("#fbfaf6"), INK, 1.6, wob=0)
    for k in range(3):
        y = -12 - k * 24
        D.poly(ctx, [(-10 + k * 1.2, y), (10 - k * 1.2, y), (9.5 - k * 1.2, y - 10), (-9.5 + k * 1.2, y - 10)],
               T("#e8423c"), None, 0, wob=0)
    D.rect(ctx, -9, -92, 18, 14, T("#2b2f3a"), INK, 1.4, wob=0)
    D.poly(ctx, [(-11, -92), (0, -104), (11, -92)], T("#e8423c"), INK, 1.4, wob=0)
    lit = beam > 0 or tod in NIGHT
    if lit:
        D.rect(ctx, -6, -90, 12, 10, hexrgb("#fff2a0"), None, 0, wob=0)
    ctx.restore()
    if beam > 0:
        ctx.save()
        D.radial(ctx, x, base - 85 * s, 120 * s * (0.6 + beam), "#fff2a0", 0.75 * beam, 0)
        ctx.restore()


# --- площадь и мелочи -----------------------------------------------------------

def plaza(ctx, tod="day", x0=-3000, x1=8000, y0=FL - 60, y1=FL + 900, c="#efd9b0", seed=2):
    """Мощёная площадь: тёплая плитка в перспективе, цветные дорожки."""
    T = Tf(tod)
    D.rect(ctx, x0, y0, x1 - x0, y1 - y0, T(c), None, 0, wob=0)
    D.col(ctx, T(shade(hexrgb(c), -0.08)))
    ctx.set_line_width(2)
    for k in range(10):
        yy = y0 + (y1 - y0) * (k / 10) ** 1.8
        ctx.move_to(x0, yy)
        ctx.line_to(x1, yy)
    ctx.stroke()
    for k in range(int((x1 - x0) / 140) + 1):
        xx = x0 + k * 140
        ctx.move_to(xx, y0)
        ctx.line_to(xx + (xx - (x0 + x1) / 2) * 0.6, y1)
    ctx.stroke()
    # цветная полоса-дорожка
    D.rect(ctx, x0, y0 + 18, x1 - x0, 22, T("#e8423c"), None, 0, wob=0, alpha=0.55)
    D.rect(ctx, x0, y0, x1 - x0, 10, T(shade(hexrgb(c), -0.2)), None, 0, wob=0)


def lamp_post(ctx, x, gy, s=1.0, tod="day", on=None):
    T = Tf(tod)
    on = (tod in NIGHT) if on is None else on
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rect(ctx, -14, -24, 28, 24, T("#2e5a4a"), INK, 3, wob=0)
    D.rect(ctx, -6, -420, 12, 400, T("#2e5a4a"), INK, 3, wob=0)
    for k in (-1, 1):
        D.curve(ctx, [(0, -380), (k * 40, -400), (k * 70, -380)], INK, 8)
        D.curve(ctx, [(0, -380), (k * 40, -400), (k * 70, -380)], T("#2e5a4a"), 4)
        D.poly(ctx, [(k * 70 - 18, -380), (k * 70 + 18, -380), (k * 70 + 12, -330), (k * 70 - 12, -330)],
               hexrgb("#fff2b0") if on else T("#e9e2c8"), INK, 3, wob=0)
        D.poly(ctx, [(k * 70 - 22, -382), (k * 70, -400), (k * 70 + 22, -382)], T("#2e5a4a"), INK, 3, wob=0)
    D.circle(ctx, 0, -430, 12, T("#f2c230"), INK, 3)
    ctx.restore()
    if on:
        for k in (-1, 1):
            D.radial(ctx, x + k * 70 * s, gy - 355 * s, 160 * s, "#ffe9a0", 0.55, 0)


def bunting(ctx, x0, x1, y, sag=60, n=None, tod="day", seed=1, t=0.0):
    """Гирлянда флажков между двумя точками."""
    T = Tf(tod)
    n = n or max(4, int(abs(x1 - x0) / 60))
    pts = []
    for k in range(n + 1):
        u = k / n
        pts.append((lerp(x0, x1, u), y + sag * 4 * u * (1 - u)))
    D.polyline(ctx, pts, INK, 2.5)
    r = rng(seed)
    for k in range(n):
        a, b = pts[k], pts[k + 1]
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2
        sw = math.sin(t * 3 + k) * 3
        c = T(BRIGHT[(k + seed) % len(BRIGHT)])
        D.poly(ctx, [(a[0] + 4, a[1] + 1), (b[0] - 4, b[1] + 1), (mx + sw, my + 38)], c, INK, 1.8, wob=0)


def bench(ctx, x, gy, s=1.0, tod="day"):
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    for lx in (-90, 90):
        D.rect(ctx, lx - 8, -70, 16, 70, T("#2e5a4a"), INK, 2.5, wob=0)
    D.rect(ctx, -120, -84, 240, 20, T("#c8783a"), INK, 3, wob=0)
    D.rect(ctx, -120, -150, 240, 18, T("#c8783a"), INK, 3, wob=0)
    D.rect(ctx, -120, -122, 240, 18, T("#c8783a"), INK, 3, wob=0)
    ctx.restore()


def trash_bin(ctx, x, gy, s=1.0, tod="day", c="#2f8fd8"):
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.poly(ctx, [(-40, -150), (40, -150), (34, 0), (-34, 0)], T(c), INK, 3, wob=0)
    D.rrect(ctx, -46, -168, 92, 22, 10, T(shade(hexrgb(c), -0.2)), INK, 3)
    star(ctx, 0, -84, 26, T("#ffd23a"))
    ctx.restore()


def flower_bed(ctx, x, gy, w=300, tod="day", seed=3):
    T = Tf(tod)
    D.rrect(ctx, x - w / 2, gy - 50, w, 50, 14, T("#a8743a"), INK, 3)
    r = rng(seed)
    for k in range(int(w / 26)):
        fx = x - w / 2 + 14 + k * 26 + r.uniform(-4, 4)
        fy = gy - 56 - r.uniform(0, 26)
        D.line(ctx, fx, gy - 48, fx, fy, T("#3a8a3a"), 3)
        D.circle(ctx, fx, fy, 9, T(r.choice(["#e8423c", "#f2c230", "#f05a8a", "#ffffff", "#7a4fc2"])), INK, 1.5)
        D.circle(ctx, fx, fy, 3, T("#ffe36a"), None, 0)


def balloon_bunch(ctx, x, y, t=0.0, n=5, s=1.0, seed=0, tod="day", string_len=160):
    """Связка воздушных шариков (у продавца)."""
    T = Tf(tod)
    r = rng(seed)
    for k in range(n):
        bx = x + r.uniform(-50, 50) * s + math.sin(t * 1.3 + k) * 6
        by = y - string_len * s - r.uniform(0, 70) * s
        D.curve(ctx, [(x, y), ((x + bx) / 2 + 8, (y + by) / 2), (bx, by + 34 * s)], INK, 1.5)
        D.ellipse(ctx, bx, by, 26 * s, 32 * s, T(BRIGHT[(k + seed) % 8]), INK, 2)
        D.ellipse(ctx, bx - 9 * s, by - 12 * s, 6 * s, 9 * s, hexrgb("#ffffff"), None, 0, alpha=0.6)


def free_balloon(ctx, x, y, s=1.0, c="#e8423c", t=0.0, tod="day"):
    """Один улетающий шарик с ниткой."""
    T = Tf(tod)
    D.curve(ctx, [(x, y + 34 * s), (x + 8 * s + math.sin(t * 3) * 6 * s, y + 90 * s), (x - 4 * s, y + 140 * s)],
            INK, 1.5)
    D.ellipse(ctx, x, y, 26 * s, 32 * s, T(c), INK, 2)
    D.ellipse(ctx, x - 9 * s, y - 12 * s, 6 * s, 9 * s, hexrgb("#ffffff"), None, 0, alpha=0.6)


def fence(ctx, x0, x1, gy, h=150, tod="day", c="#2e5a4a"):
    """Кованый парковый забор."""
    T = Tf(tod)
    D.rect(ctx, x0, gy - h, x1 - x0, 10, T(c), INK, 2.5, wob=0)
    D.rect(ctx, x0, gy - 30, x1 - x0, 10, T(c), INK, 2.5, wob=0)
    for k in range(int((x1 - x0) / 34) + 1):
        xx = x0 + k * 34
        D.line(ctx, xx, gy, xx, gy - h - 16, INK, 6)
        D.line(ctx, xx, gy, xx, gy - h - 16, T(c), 3)
        D.poly(ctx, [(xx - 6, gy - h - 12), (xx, gy - h - 30), (xx + 6, gy - h - 12)], T(c), INK, 1.5, wob=0)


# --- Главная улица ---------------------------------------------------------------

SHOPS = [  # (вывеска, цвет фасада, цвет навеса, товар)
    ("POPCORN", "#ffd6e0", "#e8423c", "popcorn"),
    ("SWEETS", "#cfe8ff", "#2f8fd8", "candy"),
    ("ICE CREAM", "#fff1b8", "#f05a8a", "icecream"),
    ("SOUVENIRS", "#d8f5d0", "#16a39a", "plush"),
    ("ARCADE", "#e6d8ff", "#7a4fc2", "arcade"),
    ("HOT DOGS", "#ffe0c2", "#f2783a", "hotdog"),
    ("COTTON CANDY", "#ffd6e0", "#f05a8a", "cotton"),
    ("PHOTO", "#c8f0ec", "#2f8fd8", "photo"),
]
SHOP_W = 820


def _goods(ctx, kind, x, y, w, h, T, seed):
    r = rng(seed)
    if kind == "popcorn":
        for k in range(5):
            bx = x + 40 + k * (w - 80) / 4
            D.poly(ctx, [(bx - 28, y + h - 10), (bx + 28, y + h - 10), (bx + 36, y + h - 90), (bx - 36, y + h - 90)],
                   T("#fbfaf6"), INK, 2.5, wob=0)
            for j in range(4):
                D.rect(ctx, bx - 30 + j * 16, y + h - 90, 8, 80, T("#e8423c"), None, 0, wob=0)
            for j in range(7):
                D.circle(ctx, bx - 30 + j * 10, y + h - 96 - (j % 3) * 8, 11, T("#fff3c4"), INK, 1.2)
    elif kind == "candy":
        for k in range(14):
            cx = x + 30 + (k % 7) * (w - 60) / 6
            cy = y + 50 + (k // 7) * 90
            D.line(ctx, cx, cy, cx, cy + 60, T("#fbfaf6"), 6)
            D.circle(ctx, cx, cy, 24, T(BRIGHT[(k + seed) % 8]), INK, 2)
            D.curve(ctx, [(cx - 14, cy), (cx, cy - 12), (cx + 14, cy)], T("#ffffff"), 3)
    elif kind == "icecream":
        for k in range(6):
            cx = x + 40 + k * (w - 80) / 5
            cy = y + h - 30
            D.poly(ctx, [(cx - 20, cy - 60), (cx + 20, cy - 60), (cx, cy)], T("#d8a058"), INK, 2, wob=0)
            for j in range(2):
                D.circle(ctx, cx, cy - 74 - j * 30, 24, T(["#ffb6c8", "#fff3c4", "#8a5a34", "#b8f0c8"][(k + j) % 4]),
                         INK, 2)
    elif kind == "plush":
        for k in range(5):
            cx = x + 50 + k * (w - 100) / 4
            cy = y + h - 60
            c = T(BRIGHT[(k * 3 + seed) % 8])
            D.circle(ctx, cx, cy - 50, 34, c, INK, 2)
            D.circle(ctx, cx - 24, cy - 80, 12, c, INK, 2)
            D.circle(ctx, cx + 24, cy - 80, 12, c, INK, 2)
            D.ellipse(ctx, cx, cy + 6, 40, 34, c, INK, 2)
            D.circle(ctx, cx - 10, cy - 54, 4, INK, None, 0)
            D.circle(ctx, cx + 10, cy - 54, 4, INK, None, 0)
    elif kind == "arcade":
        for k in range(3):
            cx = x + 60 + k * (w - 120) / 2
            D.rect(ctx, cx - 50, y + 40, 100, h - 40, T(BRIGHT[(k * 2 + 1) % 8]), INK, 2.5, wob=0)
            D.rect(ctx, cx - 36, y + 60, 72, 56, T("#1c2440"), INK, 2, wob=0)
            D.rect(ctx, cx - 24, y + 76, 20, 20, T("#4cff8a"), None, 0, wob=0)
    elif kind == "hotdog":
        for k in range(4):
            cx = x + 70 + k * (w - 140) / 3
            cy = y + h - 60
            D.rrect(ctx, cx - 60, cy - 18, 120, 36, 18, T("#e8b070"), INK, 2)
            D.rrect(ctx, cx - 66, cy - 10, 132, 20, 10, T("#c8503a"), INK, 2)
            D.curve(ctx, [(cx - 50, cy - 8), (cx - 25, cy - 16), (cx, cy - 6), (cx + 25, cy - 16), (cx + 50, cy - 8)],
                    T("#f2c230"), 4)
    elif kind == "cotton":
        for k in range(6):
            cx = x + 40 + k * (w - 80) / 5
            cy = y + 70 + (k % 2) * 30
            D.line(ctx, cx, cy, cx, cy + 110, T("#fbfaf6"), 6)
            D.circle(ctx, cx, cy, 42, T(["#ffb6d8", "#b8dcff", "#e6c8ff"][k % 3]), INK, 2)
    elif kind == "photo":
        for k in range(4):
            cx = x + 40 + k * (w - 80) / 3
            D.rect(ctx, cx - 50, y + 40 + (k % 2) * 20, 100, 76, T("#fbfaf6"), INK, 2.5, wob=0)
            D.rect(ctx, cx - 42, y + 48 + (k % 2) * 20, 84, 52, T(PASTEL[k]), None, 0, wob=0)
            D.circle(ctx, cx, y + 76 + (k % 2) * 20, 14, T("#9a9ea6"), INK, 1.5)


def storefront(ctx, x, gy, name, facade, awning, goods, tod="day", lit=0.0, seed=0, w=SHOP_W, shut=False):
    """Двухэтажная витрина в стиле старой Главной улицы."""
    T = Tf(tod)
    H1, H2 = 660, 440
    top = gy - H1 - H2
    # фасад и пилястры
    D.rect(ctx, x, top, w, H1 + H2, T(facade), INK, 4, wob=0)
    for px in (x, x + w - 40):
        D.rect(ctx, px, top, 40, H1 + H2, T(shade(hexrgb(facade), -0.12)), INK, 3, wob=0)
    # карниз с зубчиками
    D.rect(ctx, x - 30, top - 50, w + 60, 50, T("#fbfaf6"), INK, 4, wob=0)
    for k in range(int((w + 60) / 40)):
        D.rect(ctx, x - 26 + k * 40, top, 24, 18, T(shade(hexrgb(facade), -0.2)), INK, 1.5, wob=0)
    D.poly(ctx, [(x + w / 2 - 120, top - 50), (x + w / 2, top - 130), (x + w / 2 + 120, top - 50)],
           T("#fbfaf6"), INK, 4, wob=0)
    D.circle(ctx, x + w / 2, top - 76, 18, T(awning), INK, 3)
    # окна второго этажа с цветочными ящиками
    for k in range(2):
        wx = x + 110 + k * (w - 340)
        D.rect(ctx, wx, top + 60, 120, 200, T("#bfe6f5") if lit <= 0 else hexrgb("#ffe9a0"), INK, 4, wob=0)
        D.line(ctx, wx + 60, top + 60, wx + 60, top + 260, INK, 3)
        D.line(ctx, wx, top + 150, wx + 120, top + 150, INK, 3)
        D.rect(ctx, wx - 16, top + 260, 152, 34, T("#a8743a"), INK, 3, wob=0)
        for j in range(6):
            D.circle(ctx, wx - 4 + j * 26, top + 254, 12, T(BRIGHT[(j + seed) % 8]), INK, 1.5)
        D.rect(ctx, wx - 26, top + 40, 172, 26, T(shade(hexrgb(facade), -0.22)), INK, 2, wob=0)
    # вывеска
    D.rrect(ctx, x + 60, top + H2 - 70, w - 120, 96, 18, T("#fbfaf6"), INK, 4)
    D.rrect(ctx, x + 72, top + H2 - 58, w - 144, 72, 12, T(awning), None, 0)
    D.text(ctx, name, x + w / 2, top + H2 + 2, 52 if len(name) < 10 else 42, D.FONT_TITLE, T("#fbfaf6"))
    # витрина
    wy = gy - H1 + 180
    D.rect(ctx, x + 60, wy, w - 300, H1 - 260, T("#bfe6f5") if lit <= 0 else hexrgb("#ffe7a8"), INK, 4, wob=0)
    ctx.save()
    ctx.rectangle(x + 62, wy + 2, w - 304, H1 - 264)
    ctx.clip()
    _goods(ctx, goods, x + 62, wy + 2, w - 304, H1 - 264, T, seed)
    D.poly(ctx, [(x + 80, wy), (x + 200, wy), (x + 90, wy + H1), (x - 30, wy + H1)], hexrgb("#ffffff"), None, 0,
           wob=0, alpha=0.25)
    ctx.restore()
    # дверь
    dx = x + w - 180
    D.rect(ctx, dx - 20, gy - 470, 160, 470, T(shade(hexrgb(awning), -0.25)), INK, 4, wob=0)
    D.rect(ctx, dx + 4, gy - 440, 112, 170, T("#bfe6f5"), INK, 3, wob=0)
    D.circle(ctx, dx + 116, gy - 230, 9, T("#f2c230"), INK, 2)
    if shut:
        D.line(ctx, dx - 30, gy - 380, dx + 150, gy - 160, T("#c9d0d6"), 12)
        D.line(ctx, dx - 30, gy - 160, dx + 150, gy - 380, T("#c9d0d6"), 12)
    # полосатый навес
    ay = gy - H1 + 30
    n = 9
    for k in range(n):
        ax0 = x - 10 + k * (w + 20) / n
        ax1 = ax0 + (w + 20) / n
        c = T(awning) if k % 2 == 0 else T("#fbfaf6")
        D.poly(ctx, [(ax0, ay), (ax1, ay), (ax1 + 6, ay + 110), (ax0 + 6, ay + 110)], c, None, 0, wob=0)
        ctx.arc((ax0 + ax1) / 2 + 6, ay + 110, (ax1 - ax0) / 2, 0, math.pi)
        D.col(ctx, c)
        ctx.fill()
    D.line(ctx, x - 10, ay, x + w + 10, ay, INK, 4)
    D.rect(ctx, x, gy - 14, w, 14, T(shade(hexrgb(facade), -0.3)), INK, 3, wob=0)


def main_street(ctx, tod="day", x0=-1400, x1=6000, lit=None, shut=False, seed=0):
    """Ряд витрин вдоль улицы (стоят у дальнего края тротуара, gy = FL - 60)."""
    lit = (0.8 if tod in NIGHT else 0.0) if lit is None else lit
    k = 0
    x = x0
    while x < x1:
        name, fac, awn, goods = SHOPS[(k + seed) % len(SHOPS)]
        storefront(ctx, x, FL - 60, name, fac, awn, goods, tod, lit, seed=k + seed, shut=shut)
        x += SHOP_W
        k += 1


# --- тележки, ларьки, баллоны -----------------------------------------------------

def cart(ctx, x, gy, s=1.0, kind="popcorn", tod="day", tipped=0.0):
    """Тележка-ларёк на колёсах с полосатым зонтом: popcorn / cotton / icecream."""
    T = Tf(tod)
    cols = {"popcorn": ("#e8423c", "POPCORN"), "cotton": ("#f05a8a", "COTTON CANDY"), "icecream": ("#2f8fd8", "ICE CREAM")}
    c, label = cols.get(kind, cols["popcorn"])
    ctx.save()
    ctx.translate(x, gy)
    ctx.rotate(-tipped * 1.45)
    ctx.scale(s, s)
    for wx in (-110, 110):
        D.circle(ctx, wx, -40, 40, T("#2b2f3a"), INK, 3)
        D.circle(ctx, wx, -40, 14, T("#c9d0d6"), INK, 2)
    D.rrect(ctx, -160, -250, 320, 180, 16, T(c), INK, 4)
    D.rect(ctx, -160, -230, 320, 30, T("#fbfaf6"), INK, 3, wob=0)
    D.text(ctx, label, 0, -206, 26 if len(label) > 9 else 30, D.FONT_TITLE, T(c))
    D.rect(ctx, -140, -420, 280, 170, T("#e9f6ff"), INK, 4, wob=0, alpha=0.9)
    if kind == "popcorn":
        r = rng(4)
        for k in range(26):
            D.circle(ctx, -120 + r.uniform(0, 240), -270 - r.uniform(0, 70), 12, T("#fff3c4"), INK, 1.2)
    elif kind == "cotton":
        for k in range(4):
            D.line(ctx, -90 + k * 60, -300, -90 + k * 60, -370, T("#fbfaf6"), 5)
            D.circle(ctx, -90 + k * 60, -380, 32, T(["#ffb6d8", "#b8dcff"][k % 2]), INK, 2)
    else:
        for k in range(4):
            D.circle(ctx, -90 + k * 60, -300, 26, T(["#ffb6c8", "#fff3c4", "#8a5a34", "#b8f0c8"][k]), INK, 2)
    # зонт
    D.line(ctx, 0, -420, 0, -560, INK, 6)
    n = 6
    for k in range(n):
        a0, a1 = -160 + k * 320 / n, -160 + (k + 1) * 320 / n
        D.poly(ctx, [(0, -620), (a0, -540), (a1, -540)], T(c) if k % 2 == 0 else T("#fbfaf6"), INK, 3, wob=0)
    D.circle(ctx, 0, -624, 10, T("#f2c230"), INK, 2)
    ctx.restore()


def propane_tank(ctx, x, gy, s=1.0, tod="day", ang=0.0, lying=False, c="#e8f0f4"):
    """Баллон пропана (как у грилей): стоит или лежит/катится (ang — поворот при качении)."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    if lying:
        ctx.translate(0, -34)
        ctx.rotate(ang)
        D.rrect(ctx, -60, -34, 120, 68, 30, T(c), INK, 3)
        D.line(ctx, -60, -10, 60, -10, T("#c23b33"), 5)
        D.line(ctx, -30, -34, -30, 34, shade(T(c), -0.1), 2)
        D.line(ctx, 30, -34, 30, 34, shade(T(c), -0.1), 2)
        D.rect(ctx, 60, -12, 16, 24, T("#c9d0d6"), INK, 2, wob=0)
    else:
        D.rrect(ctx, -34, -120, 68, 116, 28, T(c), INK, 3)
        D.rect(ctx, -34, -90, 68, 8, T("#c23b33"), None, 0, wob=0)
        D.rect(ctx, -38, -10, 76, 10, T("#8f99a3"), INK, 2, wob=0)
        D.rrect(ctx, -22, -150, 44, 34, 8, None, INK, 4)
        D.rect(ctx, -6, -140, 12, 22, T("#c9d0d6"), INK, 2, wob=0)
    ctx.restore()


def grill(ctx, x, gy, s=1.0, tod="day"):
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    for lx in (-80, 80):
        D.line(ctx, lx, 0, lx * 0.8, -150, INK, 6)
    D.rrect(ctx, -110, -230, 220, 90, 24, T("#2b2f3a"), INK, 3)
    D.rect(ctx, -110, -200, 220, 10, T("#c9d0d6"), None, 0, wob=0)
    ctx.restore()


def gate(ctx, x, gy, w=900, h=700, tod="day", chained=True, t=0.0):
    """Главные ворота парка с аркой STARFALL PARK и цепью с замком."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    for px in (-w / 2 - 80, w / 2):
        D.rect(ctx, px, -h - 120, 80, h + 120, T("#c8a46a"), INK, 4, wob=0)
        D.rect(ctx, px - 10, -h - 150, 100, 40, T("#e8d0a0"), INK, 4, wob=0)
        D.circle(ctx, px + 40, -h - 180, 26, T("#ffd23a"), INK, 3)
    ctx.move_to(-w / 2 - 80, -h - 60)
    ctx.curve_to(-w / 3, -h - 300, w / 3, -h - 300, w / 2 + 80, -h - 60)
    ctx.line_to(w / 2 + 80, -h + 20)
    ctx.curve_to(w / 3, -h - 210, -w / 3, -h - 210, -w / 2 - 80, -h + 20)
    ctx.close_path()
    D.col(ctx, T("#2f8fd8"))
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(4)
    ctx.stroke()
    D.text(ctx, "STARFALL PARK", 0, -h - 130, 74, D.FONT_TITLE, T("#ffd23a"), stroke=INK, slw=6)
    for k in range(7):
        a = math.pi + (k + 0.5) * math.pi / 7
        star(ctx, math.cos(a) * w * 0.48, -h - 120 + math.sin(a) * 140, 16, T("#fff6d8"))
    # створки решётки
    for side in (-1, 1):
        x0 = 0 if side > 0 else -w / 2
        D.rect(ctx, x0, -h, w / 2, 14, T("#2e5a4a"), INK, 3, wob=0)
        D.rect(ctx, x0, -60, w / 2, 14, T("#2e5a4a"), INK, 3, wob=0)
        for k in range(int(w / 2 / 40) + 1):
            xx = x0 + k * 40
            D.line(ctx, xx, 0, xx, -h, INK, 7)
            D.line(ctx, xx, 0, xx, -h, T("#2e5a4a"), 3.5)
        D.circle(ctx, x0 + w / 4, -h / 2, 70, None, INK, 6)
        D.circle(ctx, x0 + w / 4, -h / 2, 70, None, T("#2e5a4a"), 3)
    if chained:
        chain(ctx, -110, -h / 2 + 20, 110, -h / 2 + 20, sag=40, tod=tod)
        padlock(ctx, 0, -h / 2 + 70, 1.0, tod)
    ctx.restore()


def chain(ctx, x0, y0, x1, y1, sag=40, tod="day", link=26):
    T = Tf(tod)
    n = max(3, int(math.hypot(x1 - x0, y1 - y0) / link))
    for k in range(n):
        u = (k + 0.5) / n
        x = lerp(x0, x1, u)
        y = lerp(y0, y1, u) + sag * 4 * u * (1 - u)
        if k % 2 == 0:
            D.ellipse(ctx, x, y, link * 0.62, link * 0.36, None, INK, 9)
            D.ellipse(ctx, x, y, link * 0.62, link * 0.36, None, T("#a9b0b8"), 4.5)
        else:
            D.ellipse(ctx, x, y, link * 0.2, link * 0.36, None, INK, 9)
            D.ellipse(ctx, x, y, link * 0.2, link * 0.36, None, T("#a9b0b8"), 4.5)


def padlock(ctx, x, y, s=1.0, tod="day"):
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    ctx.arc(0, -30, 26, math.pi, 0)
    D.col(ctx, INK)
    ctx.set_line_width(14)
    ctx.stroke()
    ctx.arc(0, -30, 26, math.pi, 0)
    D.col(ctx, T("#c9d0d6"))
    ctx.set_line_width(7)
    ctx.stroke()
    D.rrect(ctx, -40, -34, 80, 70, 12, T("#f2c230"), INK, 4)
    D.circle(ctx, 0, -6, 9, INK, None, 0)
    D.rect(ctx, -3, -6, 6, 20, INK, None, 0, wob=0)
    ctx.restore()


def sign_post(ctx, x, gy, labels, tod="day", s=1.0):
    """Указатель-стрелки: labels = [(текст, цвет, направление ±1)]."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rect(ctx, -10, -560, 20, 560, T("#8a5a34"), INK, 3, wob=0)
    for k, (txt, c, d) in enumerate(labels):
        y = -540 + k * 92
        w = 60 + 26 * len(txt)
        x0 = 0 if d > 0 else -w
        pts = [(x0, y), (x0 + w, y), (x0 + w + 30 * d if d > 0 else x0 + w, y + 35), (x0 + w, y + 70), (x0, y + 70)]
        if d < 0:
            pts = [(x0 + w, y), (x0, y), (x0 - 30, y + 35), (x0, y + 70), (x0 + w, y + 70)]
        D.poly(ctx, pts, T(c), INK, 3, wob=0)
        D.text(ctx, txt, x0 + w / 2, y + 50, 36, D.FONT_TITLE, T("#fbfaf6"))
    ctx.restore()
