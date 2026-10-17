"""Магазины и служебные помещения: супермаркет, подвал и метро, аркада, боулинг, батуты,
зоомагазин, мебельный, электроника, праздничный, кино, эскалатор, кухня (воспоминание), телефон."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1, W, H
from engine import draw as D
from . import common as C

INK = D.INK
PROD = ["#c23b33", "#e2a33b", "#3f8a84", "#7a6aa3", "#f0ece0", "#5f8a5a", "#c9805a", "#2f3d5c", "#d9b44a",
        "#b6503f", "#9fb3bd"]


# --- супермаркет: ряд в перспективе ------------------------------------------------

VPX, VPY = 960, 470


def _persp(x, y, u):
    """Точка (x, y) ближнего плана, уведённая к точке схода на долю u (0..1)."""
    k = 1 - u
    return VPX + (x - VPX) * k, VPY + (y - VPY) * k


def aisle(ctx, sign="4  CHIPS • SNACKS", lights=1.0, back="DAIRY • MILK", seed=3, depth=0.82):
    """Ряд супермаркета, вид вдоль прохода."""
    D.rect(ctx, -200, -200, 2320, 1480, hexrgb("#cfc4ae"), None, 0, wob=0)
    # потолок
    D.poly(ctx, [(-200, -200), (2120, -200), _persp(2120, -200, depth), _persp(-200, -200, depth)],
           hexrgb("#8a8494"), None, 0, wob=0)
    # пол
    D.poly(ctx, [(-200, 1280), (2120, 1280), _persp(2120, 1280, depth), _persp(-200, 1280, depth)],
           hexrgb("#e3d6bb"), None, 0, wob=0)
    D.col(ctx, hexrgb("#d2c3a4"))
    ctx.set_line_width(2)
    for k in range(12):
        u = 1 - 1 / (1 + k * 0.45)
        a = _persp(-200, 1280, u * depth)
        b = _persp(2120, 1280, u * depth)
        ctx.move_to(*a)
        ctx.line_to(*b)
    ctx.stroke()
    # дальняя стена
    fa, fb = _persp(-200, -200, depth), _persp(2120, 1280, depth)
    D.rect(ctx, fa[0], fa[1], fb[0] - fa[0], fb[1] - fa[1], hexrgb("#d9cdb5"), INK, 2)
    C.sign(ctx, VPX - 90, VPY - 70, 180, 36, back, bg="#3f8a84", seed=2)
    # светильники
    for k in range(8):
        u = 1 - 1 / (1 + k * 0.5)
        a = _persp(820, -120, u * depth)
        b = _persp(1100, -120, u * depth)
        c2 = _persp(1100, -60, u * depth)
        d2 = _persp(820, -60, u * depth)
        D.poly(ctx, [a, b, c2, d2], mix(hexrgb("#8d8778"), hexrgb("#fbf3df"), lights), INK, 1.5, wob=0)
    # стеллажи
    r = rng(seed)
    for side in (-1, 1):
        xn = 240 if side < 0 else 1680            # ближняя кромка полки
        xb = -200 if side < 0 else 2120           # стена за полкой
        top, bot = 60, 1080
        # боковина-торец
        D.poly(ctx, [(xn, top), (xn, bot), _persp(xn, bot, depth), _persp(xn, top, depth)],
               hexrgb("#e9e1cf"), INK, 2.5, wob=0.3, seed=side)
        levels = 6
        for lv in range(levels):
            y0 = top + 40 + lv * (bot - top - 60) / levels
            y1 = y0 + (bot - top - 60) / levels - 22
            n = 26
            for k in range(n):
                u0 = 1 - 1 / (1 + k * 0.32)
                u1 = 1 - 1 / (1 + (k + 0.92) * 0.32)
                u0 *= depth
                u1 *= depth
                p1, p2 = _persp(xn, y0, u0), _persp(xn, y0, u1)
                p3, p4 = _persp(xn, y1, u1), _persp(xn, y1, u0)
                c = hexrgb(r.choice(PROD))
                D.poly(ctx, [p1, p2, p3, p4], c, INK, 1.2, wob=0)
                if k < 6:
                    # этикетка
                    m1 = _persp(xn, (y0 + y1) / 2 - 8, (u0 + u1) / 2)
                    D.col(ctx, hexrgb("#f4efe0"), 0.8)
                    ctx.arc(m1[0], m1[1], 9 * (1 - u0), 0, TAU)
                    ctx.fill()
            # полка
            a, b = _persp(xn, y1 + 4, 0), _persp(xn, y1 + 4, depth)
            D.line(ctx, a[0], a[1], b[0], b[1], hexrgb("#9a9183"), 9)
            D.line(ctx, a[0], a[1] + 6, b[0], b[1] + 2, INK, 2)
    # табличка ряда
    D.line(ctx, VPX - 120, -200, VPX - 120, 120, INK, 3)
    D.line(ctx, VPX + 120, -200, VPX + 120, 120, INK, 3)
    C.sign(ctx, VPX - 200, 110, 400, 70, sign, bg="#3f8a84", seed=5)


def aisle_scale(y):
    """Масштаб фигуры в проходе по её точке на полу."""
    return 105 * (y - VPY) / (1080 - VPY)


def shelves_side(ctx, x0, x1, floor=880, seed=1, label=None):
    """Стеллаж сбоку (для проезда камеры вдоль ряда)."""
    D.rect(ctx, x0, 0, x1 - x0, floor, hexrgb("#cfc4ae"), None, 0, wob=0)
    D.rect(ctx, x0, 0, x1 - x0, 120, hexrgb("#8a8494"), None, 0, wob=0)
    C.ceiling_lights(ctx, x0, x1, 60, 360, 160, 1.0)
    r = rng(seed)
    top = 170
    D.rect(ctx, x0, top, x1 - x0, floor - top, hexrgb("#e9e1cf"), INK, 3, wob=0.4)
    levels = 6
    for lv in range(levels):
        y0 = top + 20 + lv * (floor - top - 30) / levels
        y1 = y0 + (floor - top - 30) / levels - 18
        x = x0 + 10
        while x < x1 - 10:
            w = r.uniform(34, 70)
            h = (y1 - y0) * r.uniform(0.6, 0.95)
            c = hexrgb(r.choice(PROD))
            if r.random() < 0.5:
                D.rect(ctx, x, y1 - h, w, h, c, INK, 2, wob=0.3, seed=int(x))
                D.rect(ctx, x + 6, y1 - h * 0.7, w - 12, h * 0.3, hexrgb("#f4efe0"), None, 0, wob=0, alpha=0.7)
            else:
                # банки
                n = int(w // 24)
                for k in range(n):
                    D.rect(ctx, x + k * 24, y1 - h * 0.7, 22, h * 0.7, c, INK, 1.5, wob=0)
            x += w + 4
        D.rect(ctx, x0, y1, x1 - x0, 14, hexrgb("#9a9183"), INK, 2, wob=0)
    D.rect(ctx, x0, floor, x1 - x0, 300, hexrgb("#e3d6bb"), None, 0, wob=0)
    D.line(ctx, x0, floor, x1, floor, INK, 3)


def cart(ctx, x, gy, s=1.0, f=1, items=0, tilt=0.0, seed=0):
    """Тележка (вид сбоку). s — масштаб (1 ≈ рядом с героем при u=80)."""
    ctx.save()
    ctx.translate(x, gy)
    ctx.rotate(tilt)
    ctx.scale(f * s, s)
    if items:
        r = rng(seed)
        for k in range(items):
            bx = -60 + (k % 5) * 26 + r.uniform(-4, 4)
            by = -150 - (k // 5) * 26
            D.rect(ctx, bx, by, 24, 30, hexrgb(r.choice(PROD)), INK, 1.5, wob=0)
    D.col(ctx, hexrgb("#9aa3a8"))
    ctx.set_line_width(3)
    pts = [(-80, -140), (80, -140), (65, -60), (-70, -60)]
    D.path(ctx, pts)
    ctx.stroke()
    for k in range(7):
        xx = -80 + k * 26
        ctx.move_to(xx, -140)
        ctx.line_to(xx * 0.85 + 4, -60)
    for k in range(3):
        yy = -140 + k * 27
        ctx.move_to(-80 + k * 4, yy)
        ctx.line_to(80 - k * 5, yy)
    ctx.stroke()
    D.polyline(ctx, [(-80, -140), (-110, -165), (-125, -165)], INK, 5)
    D.polyline(ctx, [(-70, -60), (-60, -20), (60, -20), (65, -60)], INK, 4)
    for wx in (-50, 50):
        D.circle(ctx, wx, -10, 10, hexrgb("#2c2a2a"), INK, 2)
    ctx.restore()


# --- подвал, решётка метро, генератор ------------------------------------------------

def basement(ctx, light=1.0, gen=True, gate_x=1180, label=True):
    """Подвальный коридор: бетон, трубы, табличка метро, решётка, генератор слева."""
    wall = hexrgb("#a49f93")
    D.rect(ctx, -400, -100, 2800, 1300, wall, None, 0, wob=0)
    D.col(ctx, shade(wall, -0.08))
    ctx.set_line_width(2)
    for j in range(12):
        y = 120 + j * 70
        ctx.move_to(-400, y)
        ctx.line_to(2400, y)
    ctx.stroke()
    # трубы
    for k, (y, c) in enumerate([(40, "#8f6f5a"), (80, "#6d7f8a"), (115, "#9a9a92")]):
        D.rect(ctx, -400, y, 2800, 26, hexrgb(c), INK, 2.5, wob=0.4, seed=k)
        for x in range(-300, 2400, 420):
            D.rect(ctx, x, y - 6, 18, 38, shade(hexrgb(c), -0.2), INK, 2, wob=0)
    # пол
    D.rect(ctx, -400, 880, 2800, 400, hexrgb("#7d786e"), None, 0, wob=0)
    D.line(ctx, -400, 880, 2400, 880, INK, 3)
    # проём в метро
    gx = gate_x
    D.rect(ctx, gx, 300, 560, 580, hexrgb("#121116"), INK, 4, wob=0.5)
    # ступени вниз в темноту
    for k in range(6):
        y = 640 + k * 40
        D.line(ctx, gx + 40 + k * 10, y, gx + 520 - k * 10, y, hexrgb("#2a2830"), 4)
    D.rect(ctx, gx - 20, 260, 600, 50, hexrgb("#2a2a2a"), INK, 3, wob=0.3)
    if label:
        D.text(ctx, "34 St  ↓  SUBWAY", gx + 280, 296, 32, D.FONT_TITLE, hexrgb("#f4f0e4"))
        D.circle(ctx, gx + 30, 285, 16, hexrgb("#e2a33b"), INK, 2)
        D.text(ctx, "B", gx + 30, 294, 22, D.FONT_TITLE, INK)
    if gen:
        generator(ctx, 260, 880)
    # лампа
    D.line(ctx, 900, -100, 900, 180, INK, 3)
    D.poly(ctx, [(860, 180), (940, 180), (920, 160), (880, 160)], hexrgb("#4a4744"), INK, 2, wob=0)
    D.circle(ctx, 900, 188, 12, mix(hexrgb("#555"), hexrgb("#fff2c0"), light), INK, 2)


def generator(ctx, x, floor, running=0.0, t=0.0):
    sh = math.sin(t * 60) * 2 * running
    ctx.save()
    ctx.translate(sh, 0)
    D.rect(ctx, x, floor - 260, 380, 240, hexrgb("#d6b24c"), INK, 4, wob=0.5, seed=4)
    D.rect(ctx, x + 20, floor - 240, 160, 120, shade(hexrgb("#d6b24c"), -0.2), INK, 3)
    D.col(ctx, INK)
    ctx.set_line_width(3)
    for k in range(5):
        ctx.move_to(x + 30, floor - 225 + k * 22)
        ctx.line_to(x + 170, floor - 225 + k * 22)
    ctx.stroke()
    D.rect(ctx, x + 220, floor - 230, 130, 70, hexrgb("#2a2a2e"), INK, 3)
    D.text(ctx, "BACKUP", x + 285, floor - 188, 24, D.FONT_TITLE, hexrgb("#e2a33b"))
    D.circle(ctx, x + 330, floor - 120, 10, mix(hexrgb("#553333"), hexrgb("#7cff6a"), running), INK, 2)
    D.rect(ctx, x + 300, floor - 330, 30, 80, hexrgb("#5a5754"), INK, 3)
    D.rect(ctx, x - 10, floor - 30, 400, 30, hexrgb("#4a4744"), INK, 3)
    ctx.restore()
    if running > 0:
        for k in range(4):
            ph = (t * 1.5 + k * 0.25) % 1
            D.circle(ctx, x + 315 + ph * 40, floor - 340 - ph * 160, 20 + ph * 40, hexrgb("#8a8680"), None, 0,
                     alpha=0.4 * (1 - ph) * running)


def gate_bars(ctx, gx=1180, top=310, bot=880, w=560, bend=0.0, t=0.0, locks=0, padlock=True, shake=0.0):
    """Стальная решётка перед проёмом метро. locks — число велозамков (до 22)."""
    sh = math.sin(t * 50) * 3 * shake
    D.col(ctx, hexrgb("#6a6862"))
    n = 14
    for k in range(n + 1):
        x = gx + k * w / n + sh
        b = bend * math.sin(math.pi * k / n) * 26
        ctx.set_line_width(9)
        ctx.move_to(x, top)
        ctx.curve_to(x + b * 0.3, top + 150, x + b, (top + bot) / 2, x, bot)
        ctx.stroke()
    for y in (top + 20, (top + bot) / 2, bot - 30):
        D.rect(ctx, gx - 6 + sh, y - 8, w + 12, 16, hexrgb("#5a5852"), INK, 2.5, wob=0)
    D.col(ctx, INK)
    ctx.set_line_width(2)
    for k in range(n + 1):
        x = gx + k * w / n + sh
        b = bend * math.sin(math.pi * k / n) * 26
        ctx.move_to(x + 4.5, top)
        ctx.curve_to(x + b * 0.3 + 4.5, top + 150, x + b + 4.5, (top + bot) / 2, x + 4.5, bot)
        ctx.stroke()
    if padlock:
        lx, ly = gx + w / 2 + sh, (top + bot) / 2 + 30
        D.col(ctx, INK)
        ctx.set_line_width(7)
        ctx.arc(lx, ly - 12, 18, math.pi, TAU)
        ctx.stroke()
        D.rect(ctx, lx - 26, ly - 12, 52, 44, hexrgb("#d6b24c"), INK, 3, wob=0)
    r = rng(22)
    cols = ["#c23b33", "#2f3d5c", "#e2a33b", "#3f8a84", "#7a6aa3", "#1f1f1f"]
    for k in range(min(locks, 22)):
        lx = gx + 30 + r.random() * (w - 60) + sh
        ly = top + 60 + r.random() * (bot - top - 120)
        c = hexrgb(r.choice(cols))
        D.col(ctx, c)
        ctx.set_line_width(8)
        ctx.arc(lx, ly, 22, 0, TAU)
        ctx.stroke()
        D.rect(ctx, lx - 10, ly + 14, 20, 26, shade(c, -0.2), INK, 2, wob=0)


def footprints(ctx, gx, gy, n=24, seed=4, alpha=0.5, reveal=1.0):
    r = rng(seed)
    for k in range(int(n * reveal)):
        x = gx + r.uniform(0, 520)
        y = gy + r.uniform(0, 90)
        D.ellipse(ctx, x, y, 12, 6, hexrgb("#2a2622"), None, 0, alpha=alpha, rot=r.uniform(-0.4, 0.4))
        for j in range(4):
            D.circle(ctx, x + 14 + j * 4, y - 4 + j * 2, 2.5, hexrgb("#2a2622"), None, 0, alpha=alpha)


def water(ctx, x0, x1, level, t, depth=400, c="#6e5f47", alpha=0.85):
    """Мутная вода по уровню level (y поверхности)."""
    D.col(ctx, c, alpha)
    ctx.move_to(x0, level)
    x = x0
    while x <= x1:
        ctx.line_to(x, level + math.sin(x * 0.02 + t * 3) * 6 + math.sin(x * 0.05 - t * 2) * 3)
        x += 20
    ctx.line_to(x1, level + depth)
    ctx.line_to(x0, level + depth)
    ctx.close_path()
    ctx.fill()
    D.col(ctx, "#cfc0a0", 0.5)
    ctx.set_line_width(3)
    x = x0
    ctx.move_to(x0, level)
    while x <= x1:
        ctx.line_to(x, level + math.sin(x * 0.02 + t * 3) * 6 + math.sin(x * 0.05 - t * 2) * 3)
        x += 20
    ctx.stroke()


# --- аркада ---------------------------------------------------------------------

SCREEN_C = ["#4ad0ff", "#ff5ac8", "#7cff6a", "#ffd34a", "#ff7a3a", "#a07cff"]


def arcade(ctx, lit=0.2):
    D.rect(ctx, -400, -100, 2800, 1400, hexrgb("#2a2440"), None, 0, wob=0)
    # неоновая вывеска
    C.sign(ctx, 560, 60, 800, 110, "GALAXY ARCADE", bg="#1c1830", fg="#ff7ad8", seed=3)
    D.rect(ctx, -400, 820, 2800, 500, hexrgb("#3a2f5a"), None, 0, wob=0)
    r = rng(8)
    for k in range(60):
        x, y = r.uniform(-400, 2400), r.uniform(830, 1300)
        D.col(ctx, hexrgb(r.choice(SCREEN_C)), 0.35)
        ctx.arc(x, y, r.uniform(4, 10), 0, TAU)
        ctx.fill()
    D.line(ctx, -400, 820, 2400, 820, INK, 3)
    for i in range(7):
        cabinet(ctx, -120 + i * 330, 830, seed=i)


def cabinet(ctx, x, floor, seed=0, glow=1.0, w=220):
    r = rng(seed)
    body = hexrgb(r.choice(["#3a4a9a", "#9a3a6a", "#3a7a6a", "#7a5a2a", "#5a3a8a"]))
    D.poly(ctx, [(x, floor), (x, floor - 520), (x + 30, floor - 560), (x + w - 30, floor - 560), (x + w, floor - 520),
                 (x + w, floor)], body, INK, 3.5, wob=0.5, seed=seed)
    D.rect(ctx, x + 14, floor - 545, w - 28, 60, hexrgb("#1a1a24"), INK, 2.5, wob=0)
    sc = hexrgb(r.choice(SCREEN_C))
    D.rect(ctx, x + 24, floor - 470, w - 48, 170, mix(hexrgb("#141420"), sc, 0.25 + 0.35 * glow), INK, 3, wob=0)
    # пиксельная картинка
    for k in range(10):
        px = x + 40 + r.random() * (w - 90)
        py = floor - 450 + r.random() * 130
        D.rect(ctx, px, py, 12, 12, mix(hexrgb("#141420"), hexrgb(r.choice(SCREEN_C)), glow), None, 0, wob=0)
    D.poly(ctx, [(x + 10, floor - 290), (x + w - 10, floor - 290), (x + w + 10, floor - 240), (x - 10, floor - 240)],
           shade(body, -0.2), INK, 3, wob=0)
    D.line(ctx, x + 70, floor - 266, x + 70, floor - 300, INK, 5)
    D.circle(ctx, x + 70, floor - 302, 9, hexrgb("#d9483b"), INK, 2)
    for k in range(3):
        D.circle(ctx, x + 120 + k * 26, floor - 262, 8, hexrgb(SCREEN_C[k]), INK, 2)
    D.rect(ctx, x + w / 2 - 20, floor - 160, 40, 50, hexrgb("#1a1a24"), INK, 2, wob=0)
    return (x + w / 2, floor - 385)


# --- боулинг (перспектива дорожек) ------------------------------------------------------

BVX, BVY = 960, 400


def bowling(ctx, lit=0.6, lanes=5):
    D.rect(ctx, -400, -100, 2800, 1400, hexrgb("#2c2a3c"), None, 0, wob=0)
    D.rect(ctx, 480, 300, 960, 130, hexrgb("#1c1a28"), INK, 3)
    D.text(ctx, "BOWL-O-RAMA", 960, 268, 70, D.FONT_TITLE, mix(hexrgb("#7a4a6a"), hexrgb("#ff8ad0"), lit))
    for k in range(lanes):
        u = (k - lanes // 2)
        x0n, x1n = 960 + u * 520 - 230, 960 + u * 520 + 230
        x0f, x1f = 960 + u * 150 - 62, 960 + u * 150 + 62
        D.poly(ctx, [(x0n, 1100), (x1n, 1100), (x1f, 430), (x0f, 430)], hexrgb("#d9b47a"), INK, 3, wob=0.3, seed=k)
        D.col(ctx, hexrgb("#c9a06a"))
        ctx.set_line_width(1.5)
        for j in range(1, 8):
            a = lerp(x0n, x1n, j / 8)
            b = lerp(x0f, x1f, j / 8)
            ctx.move_to(a, 1100)
            ctx.line_to(b, 430)
        ctx.stroke()
        # стрелки
        for j in range(5):
            f = 0.62
            a = lerp(lerp(x0n, x1n, 0.2 + j * 0.15), lerp(x0f, x1f, 0.2 + j * 0.15), f)
            yy = lerp(1100, 430, f)
            D.poly(ctx, [(a - 7, yy + 10), (a + 7, yy + 10), (a, yy - 8)], hexrgb("#8a5a3a"), None, 0, wob=0)
        # желоба
        D.poly(ctx, [(x0n - 50, 1100), (x0n, 1100), (x0f, 430), (x0f - 14, 430)], hexrgb("#4a4856"), INK, 2, wob=0)
        D.poly(ctx, [(x1n, 1100), (x1n + 50, 1100), (x1f + 14, 430), (x1f, 430)], hexrgb("#4a4856"), INK, 2, wob=0)
    # линия заступа
    D.line(ctx, -400, 1010, 2400, 1010, hexrgb("#3a3a46"), 6)


def pin(ctx, x, y, s=1.0, ang=0.0, alpha=1.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    pts = [(0, -60), (9, -54), (10, -40), (6, -30), (14, -10), (12, 0), (-12, 0), (-14, -10), (-6, -30), (-10, -40),
           (-9, -54)]
    D.blob(ctx, pts, hexrgb("#f6f2e8"), INK, 2.5, alpha)
    D.rect(ctx, -7, -40, 14, 4, hexrgb("#c23b33"), None, 0, wob=0, alpha=alpha)
    D.rect(ctx, -7, -34, 14, 4, hexrgb("#c23b33"), None, 0, wob=0, alpha=alpha)
    ctx.restore()


def pin_spots(lane_x=960, y=440, s=1.0):
    """Позиции 10 кеглей (треугольник) у дальнего конца дорожки."""
    out = []
    for row in range(4):
        for k in range(row + 1):
            out.append((lane_x + (k - row / 2) * 24 * s, y - row * 8 * s))
    return out


def ball(ctx, x, y, r, c="#2f3d5c", rot=0.0):
    D.circle(ctx, x, y, r, hexrgb(c) if isinstance(c, str) else c, INK, max(1.5, r * 0.08))
    for k in range(3):
        a = rot + k * 0.5
        D.circle(ctx, x + math.cos(a) * r * 0.4, y + math.sin(a) * r * 0.4 - r * 0.2, r * 0.1, INK, None, 0)


# --- батутный парк -------------------------------------------------------------------

def trampoline_park(ctx, tod="day"):
    wall = hexrgb("#d6d0c0")
    D.rect(ctx, -400, -1600, 2800, 2900, wall, None, 0, wob=0)
    # верхние окна
    for k in range(5):
        wx = 60 + k * 380
        D.rect(ctx, wx, -1450, 300, 260, None, INK, 4)
        C.sky(ctx, wx, -1450, 300, 260, tod, moon=None)
        C.skyline(ctx, wx, wx + 300, -1190, tod, depth=0, seed=k, hmin=60, hmax=180,
                  esb_x=wx + 150 if k == 2 else None, lit=0.0)
        D.rect(ctx, wx, -1450, 300, 260, None, INK, 4)
        D.line(ctx, wx + 150, -1450, wx + 150, -1190, INK, 4)
    C.sign(ctx, 660, -1050, 600, 100, "BOUNCE NYC", bg="#e8853a", seed=4)
    # сетка
    D.col(ctx, INK, 0.25)
    ctx.set_line_width(1.5)
    for x in range(-400, 2400, 40):
        ctx.move_to(x, -900)
        ctx.line_to(x, 700)
    for y in range(-900, 700, 40):
        ctx.move_to(-400, y)
        ctx.line_to(2400, y)
    ctx.stroke()
    D.rect(ctx, -400, 700, 2800, 600, hexrgb("#6a7a9a"), None, 0, wob=0)
    D.line(ctx, -400, 700, 2400, 700, INK, 3)
    # батуты
    for k in range(3):
        x = -200 + k * 520
        D.rect(ctx, x, 700, 500, 70, hexrgb("#d9483b"), INK, 3)
        D.rect(ctx, x + 40, 704, 420, 30, hexrgb("#2a2a34"), INK, 2, wob=0)
    # яма с поролоном / шарами
    D.rect(ctx, 1380, 640, 640, 140, hexrgb("#2f3d5c"), INK, 3)


def foam_pit_balls(ctx, t, x0=1390, x1=2010, y=650, n=140, seed=3, splash=0.0, splash_x=1700):
    r = rng(seed)
    for k in range(n):
        bx = r.uniform(x0, x1)
        by = y + r.uniform(-40, 80)
        if splash > 0:
            d = (bx - splash_x)
            k_ = math.exp(-(d / 180) ** 2)
            by -= k_ * 260 * math.sin(math.pi * clamp(splash)) * r.uniform(0.5, 1.4)
            bx += d * 0.4 * math.sin(math.pi * clamp(splash))
        rr = r.uniform(26, 34)
        D.ellipse(ctx, bx, by, rr, rr * 1.15, hexrgb(r.choice(["#c23b33", "#e2a33b", "#3f8a84", "#c23b6a",
                                                                   "#7a6aa3", "#5f8a5a", "#f0ece0"])), INK, 2)
        D.ellipse(ctx, bx - rr * 0.3, by - rr * 0.4, rr * 0.18, rr * 0.25, hexrgb("#ffffff"), None, 0, alpha=0.5)


# --- зоомагазин, мебельный, электроника, праздничный ---------------------------------------

def pet_store(ctx):
    D.rect(ctx, -400, -100, 2800, 1400, hexrgb("#b9cfa9"), None, 0, wob=0)
    C.sign(ctx, 660, 40, 600, 90, "PAWS & CLAWS", bg="#5f8a5a", seed=2)
    for i in range(5):
        for j in range(3):
            x, y = 100 + i * 340, 190 + j * 200
            D.rect(ctx, x, y, 280, 170, hexrgb("#efe6d2"), INK, 3, seed=i * 3 + j)
            D.col(ctx, INK)
            ctx.set_line_width(2.5)
            for k in range(9):
                ctx.move_to(x + 15 + k * 31, y)
                ctx.line_to(x + 15 + k * 31, y + 170)
            ctx.stroke()
    # аквариум
    D.rect(ctx, 1700, 300, 360, 220, hexrgb("#7fb7d8"), INK, 4)
    for k in range(4):
        D.ellipse(ctx, 1760 + k * 80, 380 + (k % 2) * 60, 22, 12, hexrgb("#e2a33b"), INK, 2)
    D.rect(ctx, -400, 860, 2800, 500, hexrgb("#d9cdb2"), None, 0, wob=0)
    D.line(ctx, -400, 860, 2400, 860, INK, 3)
    # жёрдочка попугая
    D.line(ctx, 1500, 860, 1500, 520, hexrgb("#8a6a52"), 10)
    D.line(ctx, 1430, 520, 1570, 520, hexrgb("#8a6a52"), 10)


def parrot(ctx, x, y, s=1.0, t=0.0, talk=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    bob = math.sin(t * 3) * 3
    D.ellipse(ctx, 0, -40 + bob, 26, 42, hexrgb("#3fa85a"), INK, 3)
    D.circle(ctx, 8, -88 + bob, 22, hexrgb("#3fa85a"), INK, 3)
    D.poly(ctx, [(24, -92 + bob), (44, -84 + bob), (26, -72 + bob)], hexrgb("#e2a33b"), INK, 2.5, wob=0)
    if talk > 0:
        D.poly(ctx, [(26, -80 + bob), (40, -76 + bob), (26, -70 + bob)], hexrgb("#6a2a24"), None, 0, wob=0)
    D.circle(ctx, 14, -94 + bob, 4, INK, None, 0)
    D.poly(ctx, [(-10, -10 + bob), (-30, 40), (-6, 30)], hexrgb("#c23b33"), INK, 2.5, wob=0)
    ctx.restore()


def bedroom_store(ctx, lights=0.5, gate=0.0):
    D.rect(ctx, -400, -100, 2800, 1400, hexrgb("#c9c3d6"), None, 0, wob=0)
    C.sign(ctx, 610, 40, 700, 90, "SLEEP KINGDOM", bg="#4a6a9a", seed=4)
    D.rect(ctx, -400, 860, 2800, 500, hexrgb("#a99a86"), None, 0, wob=0)
    D.line(ctx, -400, 860, 2400, 860, INK, 3)
    for k, x in enumerate((-100, 600, 1300)):
        bed(ctx, x, 860, seed=k)
        # лампа на тумбочке
        D.rect(ctx, x + 520, 760, 90, 100, hexrgb("#8a6a52"), INK, 3)
        D.poly(ctx, [(x + 530, 700), (x + 600, 700), (x + 585, 650), (x + 545, 650)],
               mix(hexrgb("#bcb2a0"), hexrgb("#fff2c0"), lights), INK, 2.5, wob=0)
        D.line(ctx, x + 565, 700, x + 565, 760, INK, 4)
    # дверь подсобки
    D.rect(ctx, 2020, 420, 200, 440, hexrgb("#7a6a5a"), INK, 3)
    D.rect(ctx, 2050, 450, 140, 40, hexrgb("#efe6d2"), INK, 2)
    D.text(ctx, "STAFF", 2120, 478, 24, D.FONT_TITLE, INK)


def bed(ctx, x, floor, seed=0, w=520, c=None):
    r = rng(seed)
    c = hexrgb(c or r.choice(["#7a9ac9", "#c97a8a", "#8ac99a"]))
    D.rect(ctx, x, floor - 330, 40, 330, hexrgb("#8a6a52"), INK, 3)
    D.rect(ctx, x, floor - 160, w, 90, hexrgb("#f4efe4"), INK, 3, seed=seed)
    D.rect(ctx, x + 50, floor - 140, w - 50, 70, c, INK, 3, seed=seed + 1)
    D.ellipse(ctx, x + 110, floor - 175, 70, 26, hexrgb("#f4efe4"), INK, 3)
    D.rect(ctx, x, floor - 70, w, 70, hexrgb("#6a5a4a"), INK, 3)
    D.rect(ctx, x + w - 90, floor - 180, 70, 40, hexrgb("#e2a33b"), INK, 2, seed=seed)
    D.text(ctx, "$2999", x + w - 55, floor - 152, 18, D.FONT_TITLE, INK)


def electronics(ctx, t=0.0, power=1.0, static=True):
    D.rect(ctx, -400, -100, 2800, 1400, hexrgb("#4a4a58"), None, 0, wob=0)
    C.sign(ctx, 710, 30, 500, 80, "NOVA TECH", bg="#2f3d5c", seed=6)
    r = rng(3)
    for i in range(6):
        for j in range(3):
            x, y = 160 + i * 270, 150 + j * 200
            D.rect(ctx, x, y, 240, 160, hexrgb("#1a1a20"), INK, 4, seed=i + j)
            if power > 0:
                c = mix(hexrgb("#2a3a5a"), hexrgb("#9fc3e8"), 0.5 + 0.5 * math.sin(t * 2 + i + j))
                D.rect(ctx, x + 10, y + 10, 220, 140, mix(hexrgb("#1a1a20"), c, power), None, 0, wob=0)
                if static:
                    rr = rng(int(t * 12) + i * 7 + j)
                    for k in range(30):
                        D.rect(ctx, x + 10 + rr.random() * 210, y + 10 + rr.random() * 130, 6, 2,
                               hexrgb("#e8eef4"), None, 0, wob=0, alpha=0.5 * power)
    D.rect(ctx, -400, 860, 2800, 500, hexrgb("#8a8478"), None, 0, wob=0)
    D.rect(ctx, 200, 700, 1500, 160, hexrgb("#6a6458"), INK, 3)
    D.line(ctx, -400, 860, 2400, 860, INK, 3)


def radio(ctx, x, y, s=1.0, on=0.0, t=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.rrect(ctx, -110, -80, 220, 110, 18, hexrgb("#b5523b"), INK, 3)
    D.circle(ctx, -50, -25, 34, hexrgb("#3a3330"), INK, 3)
    D.rect(ctx, 10, -60, 80, 30, mix(hexrgb("#4a4440"), hexrgb("#ffe08a"), on), INK, 2, wob=0)
    D.line(ctx, 80, -80, 120, -170, INK, 4)
    if on > 0:
        for k in range(3):
            ph = (t * 1.2 + k / 3) % 1
            ctx.set_line_width(3)
            D.col(ctx, INK, on * (1 - ph))
            ctx.arc(-50, -25, 40 + ph * 70, -0.6, 0.6)
            ctx.stroke()
    ctx.restore()


def party_store(ctx):
    D.rect(ctx, -400, -100, 2800, 1400, hexrgb("#e9c9d6"), None, 0, wob=0)
    C.sign(ctx, 660, 40, 600, 90, "PARTY PLANET", bg="#c23b6a", seed=7)
    r = rng(5)
    for k in range(60):
        x, y = r.uniform(-300, 2300), r.uniform(150, 600)
        D.line(ctx, x, y + 30, x + r.uniform(-20, 20), y + 200, INK, 1.5)
        D.ellipse(ctx, x, y, 30, 36, hexrgb(r.choice(["#c23b33", "#e2a33b", "#3f8a84", "#c23b6a", "#7a6aa3"])), INK, 2)
    D.rect(ctx, -400, 860, 2800, 500, hexrgb("#d6c2b2"), None, 0, wob=0)
    D.line(ctx, -400, 860, 2400, 860, INK, 3)


def helium_tank(ctx, x, floor, s=1.0):
    ctx.save()
    ctx.translate(x, floor)
    ctx.scale(s, s)
    D.rrect(ctx, -32, -260, 64, 260, 26, hexrgb("#5f8a5a"), INK, 3)
    D.rect(ctx, -12, -290, 24, 34, hexrgb("#b9b6ae"), INK, 2.5, wob=0)
    D.text(ctx, "He", 0, -140, 30, D.FONT_TITLE, hexrgb("#f4efe4"))
    ctx.restore()


def balloon(ctx, x, y, r=30, c="#c23b33", string=120, sway=0.0, note=False):
    c = hexrgb(c) if isinstance(c, str) else c
    D.curve(ctx, [(x, y + r * 1.1), (x + sway * 0.5, y + r + string * 0.5), (x + sway, y + r + string)], INK, 1.5)
    if note:
        D.rect(ctx, x + sway - 8, y + r + string - 4, 16, 22, hexrgb("#f4efe4"), INK, 1.5, wob=0)
    D.ellipse(ctx, x, y, r, r * 1.18, c, INK, 2)
    D.ellipse(ctx, x - r * 0.3, y - r * 0.4, r * 0.18, r * 0.28, hexrgb("#ffffff"), None, 0, alpha=0.45)
    D.poly(ctx, [(x - 4, y + r * 1.18), (x + 4, y + r * 1.18), (x, y + r * 1.18 + 6)], c, INK, 1.2, wob=0)


def cinema(ctx, glow=1.0):
    D.rect(ctx, -400, -100, 2800, 1400, hexrgb("#1c1820"), None, 0, wob=0)
    D.rect(ctx, 260, 80, 1400, 560, mix(hexrgb("#2a2a34"), hexrgb("#e8e2d0"), glow), INK, 4)
    for row in range(4):
        y = 760 + row * 110
        n = 10 + row
        for k in range(n):
            x = 960 + (k - (n - 1) / 2) * (150 + row * 14)
            D.rrect(ctx, x - 60 - row * 6, y - 110, 120 + row * 12, 140 + row * 10, 18, hexrgb("#8a2a2e"), INK, 3)


def projector_beam(ctx, t, alpha=0.12):
    ctx.save()
    ctx.set_operator(cairo.OPERATOR_ADD)
    g = cairo.LinearGradient(960, -100, 960, 640)
    g.add_color_stop_rgba(0, 1, 0.95, 0.85, alpha * 2)
    g.add_color_stop_rgba(1, 1, 0.95, 0.85, alpha * 0.5)
    ctx.set_source(g)
    ctx.move_to(940, -100)
    ctx.line_to(980, -100)
    ctx.line_to(1660, 640)
    ctx.line_to(260, 640)
    ctx.close_path()
    ctx.fill()
    ctx.restore()


# --- эскалатор крупно -----------------------------------------------------------------

ESC_LOW = (380, 980)
ESC_HIGH = (1560, 300)


def escalator_big(ctx, run=0.0):
    """Большой эскалатор (вид сбоку): низ слева, верх справа. Возвращает функцию «точка на ступенях»."""
    wall = hexrgb("#ddd0b6")
    D.rect(ctx, -400, -400, 2800, 1700, wall, None, 0, wob=0)
    # верхний этаж
    D.rect(ctx, 1500, -400, 900, 700, hexrgb("#d3c6aa"), None, 0, wob=0)
    D.rect(ctx, 1480, 300, 1000, 60, shade(wall, -0.2), INK, 4, wob=0.6)
    D.rect(ctx, -400, 980, 2800, 400, hexrgb("#e6d8bc"), None, 0, wob=0)
    D.line(ctx, -400, 980, 2400, 980, INK, 3)
    x0, y0 = ESC_LOW
    x1, y1 = ESC_HIGH
    D.poly(ctx, [(x0 - 120, y0), (x0, y0), (x1, y1), (x1 + 120, y1), (x1 + 120, y1 + 90), (x1, y1 + 90),
                 (x0 + 60, y0 + 30)], hexrgb("#8f8a80"), INK, 4, seed=3)
    # ступени
    n = 28
    for k in range(n):
        f = (k + run % 1.0) / n
        px, py = lerp(x0, x1, f), lerp(y0, y1, f)
        D.line(ctx, px, py, px + (x1 - x0) / n, py, INK, 3)
        D.line(ctx, px + (x1 - x0) / n, py, px + (x1 - x0) / n, py + (y1 - y0) / n, INK, 3)
    D.line(ctx, x0 - 120, y0, x0, y0, INK, 4)
    D.line(ctx, x1, y1, x1 + 120, y1, INK, 4)
    # поручни
    D.line(ctx, x0 - 140, y0 - 110, x1 + 140, y1 - 110, hexrgb("#2b2b2e"), 14)
    D.line(ctx, x0 - 140, y0 - 110, x1 + 140, y1 - 110, INK, 3)
    D.col(ctx, "#b9cdd2", 0.25)
    ctx.move_to(x0 - 140, y0 - 110)
    ctx.line_to(x1 + 140, y1 - 110)
    ctx.line_to(x1 + 120, y1)
    ctx.line_to(x0 - 120, y0)
    ctx.close_path()
    ctx.fill()


def esc_point(f):
    """Точка на ступенях эскалатора (f=0 низ, 1 верх)."""
    x0, y0 = ESC_LOW
    x1, y1 = ESC_HIGH
    return lerp(x0, x1, f), lerp(y0, y1, f)


# --- кухня (воспоминание) --------------------------------------------------------------

def kitchen(ctx):
    D.rect(ctx, -400, -100, 2800, 1400, hexrgb("#f1d9a8"), None, 0, wob=0)
    # окно
    D.rect(ctx, 1240, 140, 420, 320, hexrgb("#bfe0f0"), INK, 5)
    D.line(ctx, 1450, 140, 1450, 460, INK, 5)
    D.line(ctx, 1240, 300, 1660, 300, INK, 5)
    D.poly(ctx, [(1210, 120), (1300, 120), (1290, 470), (1210, 470)], hexrgb("#d9483b"), INK, 3)
    D.poly(ctx, [(1600, 120), (1690, 120), (1690, 470), (1610, 470)], hexrgb("#d9483b"), INK, 3)
    # шкафы и плита
    D.rect(ctx, 80, 200, 760, 200, hexrgb("#9ac9b0"), INK, 4)
    for k in range(4):
        D.rect(ctx, 100 + k * 185, 220, 165, 160, hexrgb("#a9d6bd"), INK, 3)
    D.rect(ctx, 80, 560, 760, 320, hexrgb("#9ac9b0"), INK, 4)
    D.rect(ctx, 60, 540, 800, 30, hexrgb("#efe6d2"), INK, 3)
    D.rect(ctx, 330, 600, 260, 220, hexrgb("#e9e4d8"), INK, 3)
    D.rect(ctx, 360, 650, 200, 130, hexrgb("#3a3330"), INK, 3)
    D.rect(ctx, -400, 880, 2800, 400, hexrgb("#c9805a"), None, 0, wob=0)
    D.col(ctx, hexrgb("#b56f4a"))
    ctx.set_line_width(3)
    for x in range(-400, 2400, 120):
        ctx.move_to(x, 880)
        ctx.line_to(x - 80, 1280)
    ctx.stroke()
    D.line(ctx, -400, 880, 2400, 880, INK, 3)
    # стол с лазаньей
    D.rect(ctx, 1050, 700, 700, 30, hexrgb("#efe6d2"), INK, 3)
    D.line(ctx, 1100, 730, 1100, 880, INK, 8)
    D.line(ctx, 1700, 730, 1700, 880, INK, 8)
    D.rect(ctx, 1280, 650, 240, 56, hexrgb("#e9e4d8"), INK, 3)
    D.rect(ctx, 1290, 640, 220, 24, hexrgb("#c9502f"), INK, 2.5)
    D.rect(ctx, 1290, 650, 220, 10, hexrgb("#f2c45a"), None, 0, wob=0)


# --- телефон крупно ----------------------------------------------------------------

def phone(ctx, x, y, s=1.0, screen=1.0, bars=0, battery=0.4, draw_screen=None):
    """Телефон в руке (крупно). draw_screen(ctx, x, y, w, h) рисует экран."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.rrect(ctx, -230, -430, 460, 860, 60, hexrgb("#1c1c22"), INK, 6)
    sx, sy, sw, sh = -205, -380, 410, 760
    D.rrect(ctx, sx, sy, sw, sh, 30, mix(hexrgb("#0e0e14"), hexrgb("#e9eef2"), screen), None, 0)
    if screen > 0:
        # строка состояния
        for k in range(4):
            D.rect(ctx, sx + 30 + k * 16, sy + 40 - k * 6, 10, 10 + k * 6, hexrgb("#2a2a30") if k < bars else
                   hexrgb("#b9bcc4"), None, 0, wob=0, alpha=screen)
        D.rect(ctx, sx + sw - 80, sy + 26, 50, 22, None, hexrgb("#2a2a30"), 3, wob=0, alpha=screen)
        D.rect(ctx, sx + sw - 77, sy + 29, 44 * battery, 16, hexrgb("#d9483b") if battery < 0.2 else hexrgb("#2a2a30"),
               None, 0, wob=0, alpha=screen)
        if draw_screen:
            ctx.save()
            ctx.rectangle(sx, sy, sw, sh)
            ctx.clip()
            draw_screen(ctx, sx, sy, sw, sh)
            ctx.restore()
    ctx.restore()


def bubble(ctx, x, y, w, txt, mine=False, size=30, alpha=1.0, status=None):
    lines = []
    cur = ""
    ctx.save()
    D.font(ctx, D.FONT_DAY, size)
    for word in txt.split():
        test = (cur + " " + word).strip()
        if ctx.text_extents(test).x_advance > w - 40 and cur:
            lines.append(cur)
            cur = word
        else:
            cur = test
    lines.append(cur)
    ctx.restore()
    h = 30 + len(lines) * size * 1.25
    c = hexrgb("#3f8ae0") if mine else hexrgb("#dcdde2")
    D.rrect(ctx, x, y, w, h, 26, c, None, 0, alpha)
    for i, l in enumerate(lines):
        D.text(ctx, l, x + 22, y + 18 + size + i * size * 1.25 - 6, size, D.FONT_DAY,
               hexrgb("#ffffff") if mine else hexrgb("#1c1c22"), "left", alpha=alpha)
    if status:
        D.text(ctx, status, x + w - 10, y + h + 26, 20, D.FONT_DAY, hexrgb("#8a8d96"), "right", alpha=alpha)
    return h
