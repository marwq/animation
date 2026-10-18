"""Лайнер Sea Empress снаружи: вид сбоку (нос справа) и сверху.

Локальные координаты вида сбоку: ватерлиния y = 0, нос около x = +1250, корма около x = -1220,
верх трубы около y = -830. Масштаб s, f = -1 — нос слева.
"""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D

INK = D.INK
WHITE = hexrgb("#fbfaf6")
NAVY = hexrgb("#1c3f7c")
TEAL = hexrgb("#19a7b0")
GOLD = hexrgb("#e9b949")
ORANGE = hexrgb("#f2782e")

DECK_TOP = -560        # верхняя палуба с бассейном
BRIDGE_X = (690, 960)
FUNNEL_X = (-300, -60)


def _night(tod):
    return tod in ("night", "deepnight", "dusk", "storm")


def _tint(c, tod):
    k = {"day": 0.0, "morning": 0.0, "dawn": 0.12, "golden": 0.1, "sunset": 0.2, "dusk": 0.4, "night": 0.62,
         "deepnight": 0.72, "storm": 0.45, "green": 0.25, "overcast": 0.12}.get(tod, 0)
    tone = {"dawn": "#f2b8a0", "golden": "#ffcf9a", "sunset": "#f08a7a", "dusk": "#6a4a8a", "night": "#24346a",
            "deepnight": "#141e48", "storm": "#4a5560", "green": "#6a8a5a", "overcast": "#a8b4bc"}.get(tod)
    if not tone:
        return c
    return mix(c, hexrgb(tone), k)


def ship_side(ctx, x, wl, s=1.0, tod="day", lit=0.0, f=1, seed=3, slides=True, antenna=True):
    """Статичная часть корабля (для кэша)."""
    ctx.save()
    ctx.translate(x, wl)
    ctx.scale(f * s, s)
    T = lambda c: _tint(hexrgb(c) if isinstance(c, str) else c, tod)
    lw = 3.0 / max(s, 0.2)
    r = rng(seed)
    # --- надстройка (каюты с балконами) ---
    rows = 8
    y0 = -235
    for k in range(rows):
        top = y0 - (k + 1) * 41
        xa = -1120 + (40 if k > 5 else 0)
        xb = 1010 - k * 14 - (40 if k > 4 else 0)
        D.rect(ctx, xa, top, xb - xa, 41, T(WHITE), None, 0, wob=0)
        # балконы
        n = int((xb - xa) / 34)
        for i in range(n):
            bx = xa + 6 + i * 34
            if -880 < bx < -640 and k < 6:    # прорезь Променада/Бордвока
                continue
            D.rect(ctx, bx, top + 8, 28, 28, T("#9fd8ec"), None, 0, wob=0)
            if lit > 0 and r.random() < 0.55 * lit:
                D.rect(ctx, bx + 2, top + 10, 24, 24, hexrgb("#ffd978"), None, 0, wob=0)
            D.line(ctx, bx, top + 22, bx + 28, top + 22, T("#ffffff"), 1.5 / s)
        D.line(ctx, xa, top + 41, xb, top + 41, T(shade(WHITE, -0.25)), 2 / s)
        # бирюзовые полосы
        if k in (2, 5):
            D.rect(ctx, xa, top + 36, xb - xa, 5, T(TEAL), None, 0, wob=0)
    top_y = y0 - rows * 41       # = -563
    # отсек Бордвока (открытый «каньон») — тень
    D.rect(ctx, -880, top_y, 240, rows * 41 - 120, T("#2a4a6a") if not _night(tod) else hexrgb("#141c34"),
           None, 0, wob=0)
    for i in range(6):
        D.circle(ctx, -860 + i * 42, top_y + 40 + (i % 2) * 20, 5, hexrgb("#ffd978") if lit > 0 or not _night(tod)
                 else hexrgb("#3a4060"), None, 0)
    # контур надстройки
    D.poly(ctx, [(-1120, -235), (-1120, top_y + 80), (-1080, top_y), (1010 - 7 * 14 - 40, top_y),
                 (1010, -235)], None, INK, lw, wob=0)
    # --- спасательные шлюпки ---
    D.rect(ctx, -1150, -235, 2240, 85, T("#eef0f0"), INK, lw, wob=0)
    for i in range(15):
        bx = -1040 + i * 135
        if -900 < bx < -640:
            continue
        D.rrect(ctx, bx, -222, 100, 40, 18, T(ORANGE), INK, lw * 0.8)
        D.rect(ctx, bx + 18, -212, 64, 12, T("#ffffff"), None, 0, wob=0)
        D.line(ctx, bx + 10, -232, bx + 10, -222, INK, lw * 0.7)
        D.line(ctx, bx + 90, -232, bx + 90, -222, INK, lw * 0.7)
    # --- корпус ---
    hull = [(-1205, -150), (1150, -150), (1265, -165), (1215, -60), (1150, 10), (-1180, 10), (-1210, -60)]
    D.poly(ctx, hull, T(NAVY), INK, lw, wob=0)
    D.rect(ctx, -1205, -152, 2420, 8, T(WHITE), None, 0, wob=0)
    D.poly(ctx, [(-1190, -8), (1170, -8), (1150, 10), (-1180, 10)], T("#d23a3a"), None, 0, wob=0)
    for i in range(40):
        px = -1100 + i * 55
        D.circle(ctx, px, -112, 7, T("#f2f0e6") if not (lit > 0 and i % 3) else hexrgb("#ffd978"), INK, 1.2 / s)
    D.text(ctx, "SEA EMPRESS", 880, -70, 44, D.FONT_TITLE, T(WHITE)) if f > 0 else _mirror_text(ctx, 880, -70)
    # волна-логотип на корпусе
    D.col(ctx, T(TEAL))
    ctx.set_line_width(10)
    ctx.move_to(-1150, -40)
    ctx.curve_to(-900, -110, -700, 10, -400, -60)
    ctx.stroke()
    # якорь
    D.circle(ctx, 1120, -120, 12, T("#24324a"), INK, 2)
    # --- верхняя палуба: ограждение, шезлонги ---
    D.rect(ctx, -1080, top_y - 18, 1900, 18, T("#cfeaf2"), INK, lw * 0.7, wob=0)
    for i in range(48):
        D.line(ctx, -1075 + i * 40, top_y - 18, -1075 + i * 40, top_y, T("#9ab"), 1.2 / s)
    for i in range(16):
        ux = -1000 + i * 105
        if FUNNEL_X[0] - 120 < ux < FUNNEL_X[1] + 20 or 120 < ux < 460:
            continue
        c = T(["#e8423c", "#f2c230", "#2f8fd8", "#f05a8a", "#16a39a"][i % 5])
        D.line(ctx, ux, top_y - 18, ux, top_y - 58, INK, 2.5)
        D.poly(ctx, [(ux - 34, top_y - 50), (ux, top_y - 72), (ux + 34, top_y - 50)], c, INK, 2, wob=0)
    for px in (-520, 560):
        D.line(ctx, px, top_y - 18, px + 6, top_y - 90, T("#8a5a3a"), 7)
        for k in range(5):
            a = -math.pi / 2 + (k - 2) * 0.6
            D.ellipse(ctx, px + 6 + math.cos(a) * 26, top_y - 92 + math.sin(a) * 16 + 10, 30, 8, T("#2fa84a"), INK, 1.5,
                      rot=a)
    # --- труба ---
    fx0, fx1 = FUNNEL_X
    fun = [(fx0 - 10, top_y), (fx0 - 50, -790), (fx0 - 40, -818), (fx1 - 30, -832), (fx1 + 10, -812), (fx1, top_y)]
    D.poly(ctx, fun, T(WHITE), INK, lw, wob=0)
    ctx.save()
    D.path(ctx, fun)
    ctx.clip()
    D.rect(ctx, fx0 - 80, -900, 400, 110, T(NAVY), None, 0, wob=0)
    D.rect(ctx, fx0 - 80, -790, 400, 10, T(GOLD), None, 0, wob=0)
    D.rect(ctx, fx0 - 80, top_y - 30, 400, 30, T(TEAL), None, 0, wob=0)
    ctx.restore()
    D.poly(ctx, fun, None, INK, lw, wob=0)
    D.circle(ctx, (fx0 + fx1) / 2 + 10, -700, 42, T(NAVY), INK, lw * 0.8)
    _crown(ctx, (fx0 + fx1) / 2 + 10, -704, 26, T(GOLD))
    # скалодром на задней стенке трубы
    D.poly(ctx, [(fx0 - 70, top_y), (fx0 - 100, -750), (fx0 - 50, -760), (fx0 - 12, top_y)], T("#5a6a7a"), INK,
           lw * 0.7, wob=0)
    for i in range(14):
        D.circle(ctx, fx0 - 50 - i * 2.8 + r.uniform(-14, 14), top_y - 20 - i * 13,
                 5, T(r.choice(["#e8423c", "#f2c230", "#3fbf6a", "#2f8fd8"])), None, 0)
    # --- горки ---
    if slides:
        _slides(ctx, 160, top_y, T, lw)
    # --- мостик и мачта ---
    bx0, bx1 = BRIDGE_X
    D.rect(ctx, bx0, top_y - 70, bx1 - bx0, 70, T(WHITE), INK, lw, wob=0)
    D.rect(ctx, bx0 + 10, top_y - 56, bx1 - bx0 - 20, 26, T("#1f2c44"), None, 0, wob=0)
    D.rect(ctx, bx1 - 10, top_y - 60, 90, 22, T(WHITE), INK, lw * 0.8, wob=0)   # крыло мостика
    if lit > 0:
        D.rect(ctx, bx0 + 14, top_y - 52, 60, 18, hexrgb("#7fe0c8"), None, 0, wob=0, alpha=0.6 * lit)
    mx = (bx0 + bx1) / 2 + 30
    D.line(ctx, mx, top_y - 70, mx, top_y - 200, INK, 6)
    D.line(ctx, mx - 40, top_y - 160, mx + 40, top_y - 160, INK, 4)
    if antenna:
        D.line(ctx, mx, top_y - 200, mx, top_y - 260, INK, 3)
        D.circle(ctx, mx, top_y - 262, 4, hexrgb("#e8423c"), None, 0)
    # вертолётная площадка на носу (буква H на палубе сбоку не видна — только знак)
    D.rect(ctx, 960, top_y + 40, 110, 10, T("#f2c230"), INK, lw * 0.6, wob=0)
    ctx.restore()


def _mirror_text(ctx, x, y):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(-1, 1)
    D.text(ctx, "SEA EMPRESS", 0, 0, 44, D.FONT_TITLE, WHITE)
    ctx.restore()


def _crown(ctx, x, y, r, c):
    pts = [(x - r, y + r * 0.5), (x - r, y - r * 0.3), (x - r * 0.5, y + r * 0.05), (x, y - r * 0.6),
           (x + r * 0.5, y + r * 0.05), (x + r, y - r * 0.3), (x + r, y + r * 0.5)]
    D.poly(ctx, pts, c, INK, 2, wob=0)


def _slides(ctx, x, top_y, T, lw):
    """Две закрученные горки-трубы над палубой."""
    for (cx, col, h, ph) in ((x, "#f2c230", 210, 0.0), (x + 170, "#16a3b0", 260, 1.3)):
        pts = []
        for k in range(60):
            u = k / 59
            a = ph + u * TAU * 1.6
            pts.append((cx + math.cos(a) * 80 * (1 - 0.3 * u), top_y - 10 - u * h + math.sin(a) * 26))
        for c, w in ((INK, 30), (T(col), 22)):
            D.col(ctx, c)
            ctx.set_line_width(w)
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.set_line_join(cairo.LINE_JOIN_ROUND)
            D.path(ctx, pts, closed=False)
            ctx.stroke()
        D.col(ctx, (1, 1, 1), 0.35)
        ctx.set_line_width(5)
        D.path(ctx, [(p[0] - 4, p[1] - 5) for p in pts], closed=False)
        ctx.stroke()
    # башня
    D.rect(ctx, x + 40, top_y - 280, 60, 280, T("#e8eef0"), INK, lw * 0.7, wob=0)
    for k in range(9):
        D.line(ctx, x + 40, top_y - 30 * k, x + 100, top_y - 30 * k, INK, 1.5)


def radar(ctx, x, wl, s, t, f=1, tod="day"):
    """Вращающаяся антенна радара (поверх кэшированного корабля)."""
    mx = (BRIDGE_X[0] + BRIDGE_X[1]) / 2 + 30
    top_y = -235 - 8 * 41
    ctx.save()
    ctx.translate(x, wl)
    ctx.scale(f * s, s)
    w = 60 * math.cos(t * 2.5)
    D.rect(ctx, mx - abs(w), top_y - 178, abs(w) * 2 + 1, 8, _tint(hexrgb("#f4f4f0"), tod), INK, 2, wob=0)
    ctx.restore()


def smoke(ctx, x, wl, s, t, f=1, a=0.5):
    """Дымок из трубы."""
    fx = (FUNNEL_X[0] + FUNNEL_X[1]) / 2
    for k in range(6):
        u = ((t * 0.25 + k / 6) % 1.0)
        px = x + f * s * (fx - u * 260)
        py = wl + s * (-840 - u * 140)
        D.circle(ctx, px, py, s * (18 + 50 * u), hexrgb("#e8ecef"), None, 0, alpha=a * (1 - u))


def wake(ctx, x, wl, s, t, f=1, speed=1.0, length=1600):
    """Пенный след за кормой и бурун у носа."""
    sx = x - f * s * 1200
    for k in range(40):
        u = k / 40
        px = sx - f * s * u * length
        yy = wl + 6 * s + math.sin(t * 4 + k) * 3
        w = s * (30 + 120 * u)
        D.ellipse(ctx, px, yy, w, s * (5 + 10 * u), (1, 1, 1), None, 0,
                  alpha=0.55 * (1 - u) * (0.6 + 0.4 * math.sin(t * 5 + k * 1.3)) * speed)
    bx = x + f * s * 1180
    for k in range(5):
        D.ellipse(ctx, bx + f * s * (k * 18 - 40), wl - 4 * s, s * (30 - k * 4), s * 7, (1, 1, 1), None, 0,
                  alpha=0.7 * speed)


def ship_top(ctx, x, y, s, t=0.0, ang=0.0, people=None, tod="day"):
    """Вид сверху: нос направо. people — [(x, y, цвет)] в локальных координатах."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    T = lambda c: _tint(hexrgb(c) if isinstance(c, str) else c, tod)
    hull = [(-1200, -180), (900, -190), (1150, -120), (1270, 0), (1150, 120), (900, 190), (-1200, 180),
            (-1240, 100), (-1240, -100)]
    D.poly(ctx, [(px + 10, py + 14) for px, py in hull], (0, 0, 0), None, 0, wob=0, alpha=0.2)
    D.poly(ctx, hull, T(WHITE), INK, 5, wob=0)
    # тиковая палуба
    D.poly(ctx, [(-1100, -150), (850, -150), (1050, -60), (1050, 60), (850, 150), (-1100, 150)], T("#d9a868"), INK, 3,
           wob=0)
    D.col(ctx, T("#c4934f"))
    ctx.set_line_width(2)
    for k in range(-7, 8):
        ctx.move_to(-1100, k * 20)
        ctx.line_to(1050 - abs(k) * 12, k * 20)
    ctx.stroke()
    # Бордвок: щель с каруселью
    D.rect(ctx, -900, -60, 280, 120, T("#2a4a6a"), INK, 3, wob=0)
    D.circle(ctx, -760, 0, 40, T("#f05a8a"), INK, 3)
    # бассейны
    for (px, py, w, h) in ((-580, -120, 240, 100), (-580, 20, 240, 100), (60, -60, 170, 120)):
        D.rrect(ctx, px, py, w, h, 20, T("#33c9e0"), INK, 4)
        D.rrect(ctx, px + 10, py + 10, w - 20, h - 20, 14, T("#6fe0f0"), None, 0)
    for (hx, hy) in ((10, -115), (10, 110), (290, -115), (290, 110)):
        D.circle(ctx, hx, hy, 28, T("#5fd8e8"), INK, 3)
    # зонтики и шезлонги
    r = rng(7)
    for i in range(26):
        px = r.uniform(-1050, 600)
        py = r.choice([-135, 135]) + r.uniform(-8, 8)
        if -920 < px < -600:
            continue
        D.circle(ctx, px, py, 22, T(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#f05a8a", "#16a39a"])), INK, 2)
    # горки — спирали
    for (cx, cy, col) in ((480, -40, "#f2c230"), (560, 50, "#16a3b0")):
        D.col(ctx, INK)
        ctx.set_line_width(28)
        _spiral(ctx, cx, cy)
        D.col(ctx, T(col))
        ctx.set_line_width(20)
        _spiral(ctx, cx, cy)
    # труба
    D.ellipse(ctx, -180, 0, 130, 70, T(WHITE), INK, 4)
    D.ellipse(ctx, -180, 0, 100, 48, T(NAVY), INK, 3)
    # вертолётная площадка
    D.circle(ctx, 960, 0, 85, T("#3a4048"), INK, 4)
    D.circle(ctx, 960, 0, 70, None, T("#f2c230"), 6)
    D.text(ctx, "H", 960, 30, 90, D.FONT_TITLE, T("#f4f4f0"))
    # мостик
    D.rect(ctx, 760, -175, 120, 350, T("#e8eef0"), INK, 4, wob=0)
    # шлюпки по бортам
    for i in range(14):
        bx = -1000 + i * 140
        if -920 < bx < -600:
            continue
        for sy in (-1, 1):
            D.rrect(ctx, bx, sy * 182 - 14, 90, 28, 12, T(ORANGE), INK, 2.5)
    if people:
        for (px, py, c) in people:
            D.circle(ctx, px, py, 9, c, INK, 2)
    ctx.restore()


def _spiral(ctx, cx, cy):
    ctx.move_to(cx + 70, cy)
    for k in range(1, 60):
        a = k / 59 * TAU * 1.5
        rr = 70 - k * 0.8
        ctx.line_to(cx + math.cos(a) * rr, cy + math.sin(a) * rr)
    ctx.stroke()
