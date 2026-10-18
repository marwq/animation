"""Общие детали фонов: небо, силуэты города, окна, витрины, рольставни, плитка."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D

INK = D.INK

SKIES = {
    "day": ("#c9d5d9", "#ece2cc"),
    "morning": ("#cfdbe0", "#f2e3c6"),
    "overcast": ("#b7bcbf", "#d9d6cc"),
    "golden": ("#e9b47c", "#f6dcae"),
    "dusk": ("#5f5a8c", "#eaa07a"),
    "dawn": ("#7f86b0", "#f4c09c"),
    "night": ("#1f2448", "#40466f"),
    "deepnight": ("#141834", "#2a2f55"),
    "storm": ("#2e3440", "#56606c"),
    "greenstorm": ("#3d4a3f", "#8a9a6a"),
}

# цвет дальних зданий по времени суток
CITY_TONE = {
    "day": ("#a9b0b8", "#c4c6c4"), "morning": ("#aab2bc", "#c8c8c4"), "overcast": ("#9da2a6", "#b8b9b6"),
    "golden": ("#b58f7a", "#d0a98c"), "dusk": ("#5b5274", "#7d6a86"), "dawn": ("#6c6a8c", "#957f94"),
    "night": ("#262a4a", "#353a5e"), "deepnight": ("#1a1d3a", "#262a4a"), "storm": ("#363c46", "#4a525c"),
    "greenstorm": ("#3a4438", "#53604c"),
}


def sky(ctx, x, y, w, h, tod="day", stars=True, moon=None, sun=None, seed=1):
    top, bot = SKIES.get(tod, SKIES["day"])
    D.vgrad(ctx, x, y, w, h, [(0, top), (1, bot)])
    if tod in ("night", "deepnight") and stars:
        r = rng(seed)
        for i in range(int(w * h / 9000)):
            sx, sy = x + r.random() * w, y + r.random() * h * 0.7
            D.col(ctx, "#f3eedc", 0.3 + r.random() * 0.5)
            ctx.arc(sx, sy, 0.8 + r.random() * 1.6, 0, TAU)
            ctx.fill()
    if moon:
        mx, my, mr = moon
        D.radial(ctx, mx, my, mr * 3.2, "#e9e6d4", 0.25, 0)
        D.circle(ctx, mx, my, mr, hexrgb("#ece8d6"), INK, 3)
        D.circle(ctx, mx - mr * 0.3, my - mr * 0.2, mr * 0.18, hexrgb("#d9d4c0"), None, 0)
        D.circle(ctx, mx + mr * 0.25, my + mr * 0.3, mr * 0.12, hexrgb("#d9d4c0"), None, 0)
    if sun:
        sx, sy, sr = sun
        D.radial(ctx, sx, sy, sr * 4, "#fff0c8", 0.45, 0)
        D.circle(ctx, sx, sy, sr, hexrgb("#fff3d6"), None, 0)


def clouds(ctx, x, y, w, seed=2, color="#efe6d6", alpha=0.6, n=5, scale=1.0):
    r = rng(seed)
    for i in range(n):
        cx = x + r.random() * w
        cy = y + r.random() * 120 * scale
        D.col(ctx, color, alpha)
        for j in range(5):
            ctx.arc(cx + (j - 2) * 55 * scale, cy - (25 if j in (1, 3) else 0) * scale - (40 if j == 2 else 0) * scale,
                    (45 + r.random() * 30) * scale, 0, TAU)
            ctx.fill()


def building(ctx, x, base, w, h, c, lit=0.0, seed=0, win=True, top="flat", outline=True, wc=None, rows=None,
             dark_a=0.8):
    """Здание-коробка с окнами. lit — доля горящих окон (ночью); dark_a — заметность тёмных окон."""
    r = rng(seed)
    pts = [(x, base), (x, base - h), (x + w, base - h), (x + w, base)]
    if top == "step":
        pts = [(x, base), (x, base - h * 0.85), (x + w * 0.15, base - h * 0.85), (x + w * 0.15, base - h),
               (x + w * 0.85, base - h), (x + w * 0.85, base - h * 0.85), (x + w, base - h * 0.85), (x + w, base)]
    D.poly(ctx, pts, c, INK if outline else None, 2.5, wob=0.8, seed=seed)
    if win and w > 30:
        cols = max(2, int(w / 26))
        rws = rows or max(3, int(h / 34))
        ww = w / cols * 0.5
        wh = h / rws * 0.45
        dark = shade(c, -0.22)
        warm = hexrgb("#f4cf7d")
        for i in range(cols):
            for j in range(rws):
                wx = x + (i + 0.25) * w / cols
                wy = base - h + (j + 0.3) * h / rws + (0.15 * h if top == "step" else 0) * 0
                if wy > base - wh - 6:
                    continue
                on = r.random() < lit
                if not on and dark_a <= 0:
                    continue
                D.col(ctx, warm if on else (wc or dark), 0.95 if on else dark_a)
                ctx.rectangle(wx, wy, ww, wh)
                ctx.fill()


def empire_state(ctx, x, base, s, c, outline=True):
    """Силуэт Эмпайр-стейт-билдинг: x — центр, s — высота."""
    w = s * 0.22
    pts = []
    # ступенчатый силуэт
    steps = [(0.5, 0.0), (0.5, 0.62), (0.42, 0.62), (0.42, 0.7), (0.34, 0.7), (0.34, 0.8), (0.26, 0.8),
             (0.26, 0.86), (0.16, 0.86), (0.16, 0.92), (0.08, 0.92), (0.06, 0.97), (0.02, 0.97), (0.01, 1.0)]
    left = [(x - w * a * 2, base - s * b) for a, b in steps]
    right = [(x + w * a * 2, base - s * b) for a, b in reversed(steps)]
    pts = left + right
    D.poly(ctx, pts, c, INK if outline else None, 2.5, wob=0.5, seed=99)
    D.line(ctx, x, base - s, x, base - s * 1.1, INK if outline else c, 3)


def skyline(ctx, x0, x1, base, tod="day", depth=0, seed=3, lit=None, esb_x=None, hmin=200, hmax=520):
    """Ряд зданий. depth: 0 — дальний (бледный), 1 — средний, 2 — ближний."""
    far, mid = CITY_TONE.get(tod, CITY_TONE["day"])
    c = hexrgb(far) if depth == 0 else hexrgb(mid) if depth == 1 else shade(hexrgb(mid), -0.15)
    if lit is None:
        lit = 0.0
    r = rng(seed)
    x = x0
    if esb_x is not None:
        empire_state(ctx, esb_x, base, hmax * 1.6, shade(c, -0.05), outline=depth > 0)
    while x < x1:
        w = r.uniform(70, 180) * (1 + depth * 0.3)
        h = r.uniform(hmin, hmax) * (1 - depth * 0.15)
        if esb_x is not None and abs(x + w / 2 - esb_x) < 140:
            x += w * 0.6
            continue
        building(ctx, x, base, w, h, shade(c, r.uniform(-0.06, 0.06)), lit * (0.5 if depth == 0 else 1.0),
                 seed=int(x) + seed, top=r.choice(["flat", "flat", "step"]), outline=depth > 0,
                 dark_a=0.0 if depth == 0 else 0.45)
        x += w + r.uniform(-10, 8)


# --- элементы торгового центра ------------------------------------------------

def shutter(ctx, x, y, w, h, frac=1.0, c="#a9a9a2", seed=0):
    """Рольставня: frac — насколько опущена (0 поднята, 1 закрыта)."""
    hh = h * clamp(frac)
    if hh <= 1:
        D.rect(ctx, x - 4, y - 12, w + 8, 14, hexrgb("#6d6a63"), INK, 2.5, wob=0)
        return
    c = hexrgb(c) if isinstance(c, str) else c
    D.rect(ctx, x, y, w, hh, c, INK, 2.5, wob=0.6, seed=seed)
    D.col(ctx, shade(c, -0.18))
    ctx.set_line_width(2)
    k = 0
    yy = y + 14
    while yy < y + hh - 4:
        ctx.move_to(x + 3, yy)
        ctx.line_to(x + w - 3, yy)
        yy += 14
        k += 1
    ctx.stroke()
    D.rect(ctx, x + w / 2 - 22, y + hh - 16, 44, 9, shade(c, -0.3), None, 0, wob=0)
    D.rect(ctx, x - 4, y - 12, w + 8, 14, hexrgb("#6d6a63"), INK, 2.5, wob=0)


def grille(ctx, x, y, w, h, frac=1.0, c="#7c7a74"):
    """Решётчатая рольставня (сквозь неё видно)."""
    hh = h * clamp(frac)
    D.col(ctx, c)
    ctx.set_line_width(4)
    xx = x + 6
    while xx < x + w:
        ctx.move_to(xx, y)
        ctx.line_to(xx, y + hh)
        xx += 22
    yy = y + 10
    while yy < y + hh:
        ctx.move_to(x, yy)
        ctx.line_to(x + w, yy)
        yy += 40
    ctx.stroke()
    D.rect(ctx, x - 4, y - 12, w + 8, 14, hexrgb("#6d6a63"), INK, 2.5, wob=0)
    if hh > 6:
        D.line(ctx, x, y + hh, x + w, y + hh, INK, 5)


def glass(ctx, x, y, w, h, tint="#a8c2cc", alpha=0.35, glare=True, frame=True, seed=0):
    D.col(ctx, tint, alpha)
    ctx.rectangle(x, y, w, h)
    ctx.fill()
    if glare:
        ctx.save()
        ctx.rectangle(x, y, w, h)
        ctx.clip()
        D.col(ctx, "#ffffff", 0.16)
        for k in (0.15, 0.55):
            gx = x + w * k
            ctx.move_to(gx, y + h)
            ctx.line_to(gx + w * 0.18, y + h)
            ctx.line_to(gx + w * 0.18 + h * 0.6, y)
            ctx.line_to(gx + h * 0.6, y)
            ctx.close_path()
            ctx.fill()
        ctx.restore()
    if frame:
        D.rect(ctx, x, y, w, h, None, INK, 3, wob=0.5, seed=seed)


def sign(ctx, x, y, w, h, txt, bg="#3f8a84", fg="#f6eedd", size=None, family=None, seed=0, lw=3):
    D.rect(ctx, x, y, w, h, hexrgb(bg) if isinstance(bg, str) else bg, INK, lw, wob=0.6, seed=seed)
    size = size or h * 0.55
    fam = family or D.FONT_TITLE
    tw = D.text_width(ctx, txt, size, fam)
    if tw > w * 0.9:
        size *= w * 0.9 / tw
    D.text(ctx, txt, x + w / 2, y + h / 2 + size * 0.36, size, fam, hexrgb(fg) if isinstance(fg, str) else fg)


def tiles_floor(ctx, x0, y0, x1, y1, vx, vy, c="#e6d8bc", line="#d2c3a4", step=120, rows=6):
    """Пол с плиткой в перспективе (линии сходятся к точке схода vx, vy)."""
    D.rect(ctx, x0, y0, x1 - x0, y1 - y0, hexrgb(c), None, 0, wob=0)
    D.col(ctx, line)
    ctx.set_line_width(2)
    span = (x1 - x0) * 3
    n = int(span / step)
    for i in range(-n, n + 1):
        bx = vx + i * step * 1.6
        # пересечение линии от (vx,vy) к (bx, y1) с y0
        t = (y0 - vy) / (y1 - vy)
        tx = vx + (bx - vx) * t
        ctx.move_to(tx, y0)
        ctx.line_to(bx, y1)
    for j in range(1, rows + 1):
        f = (j / rows) ** 1.7
        yy = y0 + (y1 - y0) * f
        ctx.move_to(x0, yy)
        ctx.line_to(x1, yy)
    ctx.stroke()


def ceiling_lights(ctx, x0, x1, y, step=320, w=150, on=1.0, c="#fbf3df"):
    x = x0
    while x < x1:
        D.poly(ctx, [(x, y), (x + w, y), (x + w + 30, y + 22), (x + 30, y + 22)],
               mix(hexrgb("#8d8778"), hexrgb(c), on), INK, 2, wob=0.3, seed=int(x))
        x += step


def planter(ctx, x, y, s=1.0, seed=0):
    D.rect(ctx, x - 40 * s, y - 60 * s, 80 * s, 60 * s, hexrgb("#8a6a52"), INK, 3, seed=seed)
    r = rng(seed)
    for k in range(7):
        a = -math.pi / 2 + (k - 3) * 0.35
        L = (70 + r.random() * 50) * s
        D.col(ctx, "#5f8a5a")
        ctx.save()
        ctx.translate(x, y - 60 * s)
        ctx.rotate(a + math.pi / 2)
        D.ellipse(ctx, 0, -L / 2, 13 * s, L / 2, hexrgb("#6b9864"), INK, 2)
        ctx.restore()


def bench(ctx, x, y, w=220, s=1.0, c="#8a6a52"):
    c = hexrgb(c)
    D.rect(ctx, x, y - 60 * s, w, 14 * s, c, INK, 3, wob=0.4)
    D.rect(ctx, x, y - 100 * s, w, 14 * s, c, INK, 3, wob=0.4)
    for lx in (x + 16 * s, x + w - 28 * s):
        D.rect(ctx, lx, y - 60 * s, 12 * s, 60 * s, hexrgb("#4a423c"), INK, 2, wob=0)


def railing(ctx, x0, x1, y, h=90, glass_a=0.28):
    """Стеклянное ограждение балкона."""
    D.col(ctx, "#b9cdd2", glass_a)
    ctx.rectangle(x0, y - h, x1 - x0, h)
    ctx.fill()
    D.line(ctx, x0, y - h, x1, y - h, hexrgb("#8f8a80"), 8)
    D.line(ctx, x0, y - h, x1, y - h, INK, 2)
    x = x0
    while x <= x1:
        D.line(ctx, x, y - h, x, y, hexrgb("#8f8a80"), 4)
        x += 160
    D.line(ctx, x0, y, x1, y, INK, 3)
