"""Фоны. Каждый ролик — своя локация, всегда дневная, без надписей.

Фон рисуется один раз с запасом по краям (на тряску камеры), облачка
поверх рисуются в каждом кадре — они медленно плывут слева направо.
Ступни персонажей стоят на y = 945.
"""
import math
import random

import cairo

W, H = 1920, 1080
M = 64                       # запас на тряску и наезд камеры
OUT = (0.11, 0.09, 0.09)


def hexc(h, a=1.0):
    h = h.lstrip('#')
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (a,)


def _poly(ctx, pts):
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.close_path()


# ------------------------------------------------------------------ пустынный каньон
def _mesa_profile(rng, x0, x1, base, top, step=24):
    """Ступенчатый (пиксельный) силуэт месы: плоская вершина, уступы по бокам."""
    w = x1 - x0
    pts = [(x0, base)]
    # левый склон уступами
    n = rng.randint(4, 6)
    xs = sorted(rng.uniform(x0, x0 + w * 0.32) for _ in range(n))
    ys = sorted((rng.uniform(top, base) for _ in range(n)), reverse=True)
    for x, y in zip(xs, ys):
        x, y = round(x / step) * step, round(y / step) * step
        pts += [(x, pts[-1][1]), (x, y)]
    # вершина с мелкими ступеньками
    x = pts[-1][0]
    while x < x0 + w * 0.68:
        x += step * rng.randint(2, 5)
        y = round((top + rng.choice([0, 0, step, -step])) / step) * step
        pts += [(x, pts[-1][1]), (x, y)]
    # правый склон
    xs = sorted(rng.uniform(x0 + w * 0.68, x1) for _ in range(n))
    ys = sorted(rng.uniform(top, base) for _ in range(n))
    for x, y in zip(xs, ys):
        x, y = round(x / step) * step, round(y / step) * step
        pts += [(x, pts[-1][1]), (x, max(y, pts[-1][1]))]
    pts += [(x1, pts[-1][1]), (x1, base)]
    return pts


def _bands(ctx, pts, y_top, y_bot, colors, rng, step=24):
    """Горизонтальные полосы терракоты внутри силуэта, с пиксельными краями."""
    ctx.save()
    _poly(ctx, pts)
    ctx.clip()
    y = y_top - step * 2
    k = 0
    while y < y_bot:
        h = step * rng.choice([1, 1, 2, 2, 3])
        ctx.set_source_rgba(*colors[k % len(colors)])
        # волнистая пиксельная граница полосы
        ctx.move_to(-M, y)
        x = -M
        while x < W + M:
            dy = step * rng.choice([0, 0, 0, 1, -1]) * 0.5
            ctx.line_to(x, y + dy)
            x += step * rng.randint(2, 6)
            ctx.line_to(x, y + dy)
        ctx.line_to(W + M, y_bot + 200)
        ctx.line_to(-M, y_bot + 200)
        ctx.close_path()
        ctx.fill()
        y += h
        k += 1
    ctx.restore()


def _cactus(ctx, x, base, h, s, rng):
    """Блочный кактус с полосками и точками, как в майнкрафте."""
    g, gd, gl = hexc('#3f9b3a'), hexc('#2b7330'), hexc('#5dbb4f')
    w = 0.26 * h
    arms = [(-1, 0.45 * h, 0.22 * h), (1, 0.62 * h, 0.18 * h)]

    def block(x0, y0, x1, y1):
        ctx.rectangle(x0, y0, x1 - x0, y1 - y0)
        ctx.set_source_rgba(*g)
        ctx.fill_preserve()
        ctx.set_source_rgba(*OUT)
        ctx.set_line_width(4 * s)
        ctx.stroke()
        # продольные полоски
        n = max(2, int((x1 - x0) / (10 * s)))
        for i in range(1, n):
            xx = x0 + (x1 - x0) * i / n
            ctx.set_source_rgba(*(gd if i % 2 else gl))
            ctx.rectangle(xx - 2 * s, y0 + 4 * s, 3 * s, y1 - y0 - 8 * s)
            ctx.fill()
        for _ in range(int((y1 - y0) / (14 * s))):
            ctx.set_source_rgba(0.12, 0.25, 0.1, 0.9)
            ctx.rectangle(rng.uniform(x0 + 3 * s, x1 - 6 * s), rng.uniform(y0 + 3 * s, y1 - 6 * s), 3 * s, 3 * s)
            ctx.fill()

    for side, ay, al in arms:
        ax = x + side * w / 2
        ex = ax + side * al
        aw = w * 0.6
        # горизонтальная часть руки и вертикальная вверх
        if side < 0:
            block(ex, base - ay - aw, ax, base - ay)
            block(ex, base - ay - aw - 0.22 * h, ex + aw, base - ay - aw + 2 * s)
        else:
            block(ax, base - ay - aw, ex, base - ay)
            block(ex - aw, base - ay - aw - 0.2 * h, ex, base - ay - aw + 2 * s)
    block(x - w / 2, base - h, x + w / 2, base)


def _bush(ctx, x, base, s):
    ctx.set_source_rgba(*hexc('#7a5230'))
    ctx.set_line_width(4 * s)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for a, l in ((-60, 34), (-100, 40), (-130, 30), (-80, 26), (-30, 22)):
        r = math.radians(a)
        ctx.move_to(x, base)
        mx, my = x + math.cos(r) * l * 0.5 * s, base + math.sin(r) * l * 0.5 * s
        ctx.line_to(mx, my)
        ctx.line_to(mx + math.cos(r - 0.4) * l * 0.5 * s, my + math.sin(r - 0.4) * l * 0.5 * s)
        ctx.move_to(mx, my)
        ctx.line_to(mx + math.cos(r + 0.5) * l * 0.4 * s, my + math.sin(r + 0.5) * l * 0.4 * s)
    ctx.stroke()


def desert(seed=7):
    """Дневной каньон: месы в терракотовую полоску, песок, кактусы."""
    rng = random.Random(seed)
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W + 2 * M, H + 2 * M)
    ctx = cairo.Context(surf)
    ctx.translate(M, M)

    # небо: глубокий голубой сверху, светлый бирюзовый к горизонту
    g = cairo.LinearGradient(0, -M, 0, 700)
    g.add_color_stop_rgb(0.0, *hexc('#2f8fe6')[:3])
    g.add_color_stop_rgb(0.55, *hexc('#71bdf2')[:3])
    g.add_color_stop_rgb(1.0, *hexc('#cdeef3')[:3])
    ctx.set_source(g)
    ctx.paint()

    # дальние месы — светлее, с голубоватой дымкой
    far = [hexc(c) for c in ('#f0b98a', '#e6a173', '#f6cfa3', '#df9068', '#f2c193')]
    for x0, x1, top in ((-M, 520, 470), (700, 1260, 430), (1400, W + M, 455)):
        pts = _mesa_profile(rng, x0, x1, 760, top, 16)
        _bands(ctx, pts, top, 760, far, rng, 16)
        # дымка: дальние месы светлее и чуть голубее
        g = cairo.LinearGradient(0, 400, 0, 780)
        g.add_color_stop_rgba(0, 0.84, 0.93, 0.98, 0.30)
        g.add_color_stop_rgba(1, 0.95, 0.92, 0.85, 0.10)
        ctx.set_source(g)
        _poly(ctx, pts)
        ctx.fill()

    # ближние месы — насыщенная терракота, с обводкой
    near = [hexc(c) for c in ('#c8663a', '#e19a5d', '#a8492f', '#d97c45', '#f0b77a', '#b5573a')]
    for x0, x1, top in ((-M - 40, 300, 560), (1500, W + M + 40, 540)):
        pts = _mesa_profile(rng, x0, x1, 860, top, 24)
        _bands(ctx, pts, top, 860, near, rng, 24)
        _poly(ctx, pts)
        ctx.set_source_rgba(0.35, 0.16, 0.10, 0.9)
        ctx.set_line_width(4)
        ctx.stroke()

    # песчаная равнина до края земли
    g = cairo.LinearGradient(0, 760, 0, 880)
    g.add_color_stop_rgb(0, *hexc('#f3d9a0')[:3])
    g.add_color_stop_rgb(1, *hexc('#ecc785')[:3])
    ctx.set_source(g)
    ctx.rectangle(-M, 750, W + 2 * M, 200)
    ctx.fill()
    # мелкие дюны
    ctx.set_source_rgba(*hexc('#e5bd78'))
    for cx, w_, h_ in ((380, 420, 34), (1100, 520, 30), (1700, 380, 26)):
        ctx.move_to(cx - w_ / 2, 840)
        ctx.curve_to(cx - w_ / 4, 840 - h_, cx + w_ / 4, 840 - h_, cx + w_ / 2, 840)
        ctx.close_path()
        ctx.fill()

    # кактусы и сухие кусты на дальнем плане (не там, где стоят бойцы)
    _cactus(ctx, 1030, 842, 120, 0.8, rng)
    _cactus(ctx, 120, 850, 150, 0.9, rng)
    _cactus(ctx, 1830, 848, 135, 0.85, rng)
    for x in (300, 760, 1290, 1640):
        _bush(ctx, x, 846, 0.8)

    # земля: песок с пиксельным неровным краем и чёрной обводкой
    step = 24
    edge = []
    x = -M
    y = 868
    while x < W + M + step:
        edge.append((x, y))
        x += step * rng.randint(1, 3)
        edge.append((x, y))
        y = 868 + step * rng.choice([0, 0, 0, 1, -1]) * 0.5
    sand_top = edge + [(W + M, H + M), (-M, H + M)]
    _poly(ctx, sand_top)
    g = cairo.LinearGradient(0, 860, 0, 1000)
    g.add_color_stop_rgb(0, *hexc('#ffe39c')[:3])
    g.add_color_stop_rgb(1, *hexc('#f2c76c')[:3])
    ctx.set_source(g)
    ctx.fill()
    # светлая кромка
    ctx.set_source_rgba(*hexc('#fff3c8'))
    for (xa, ya), (xb, yb) in zip(edge[::2], edge[1::2]):
        ctx.rectangle(xa, ya + 3, xb - xa, 8)
    ctx.fill()
    ctx.move_to(*edge[0])
    for p in edge[1:]:
        ctx.line_to(*p)
    ctx.set_source_rgba(*OUT)
    ctx.set_line_width(5)
    ctx.stroke()
    # песчинки и камушки на поверхности
    for _ in range(140):
        px, py = rng.uniform(-M, W + M), rng.uniform(895, 1000)
        ctx.set_source_rgba(*hexc(rng.choice(['#e0b25e', '#d9a650', '#fff0bd'])))
        sz = rng.choice([4, 6, 8])
        ctx.rectangle(round(px / 4) * 4, round(py / 4) * 4, sz, sz)
        ctx.fill()

    # песчаник ниже: пиксельные блоки
    top = 1000
    edge2 = []
    x = -M
    while x < W + M + step:
        yy = top + step * rng.choice([0, 0, 1, -1]) * 0.5
        edge2 += [(x, yy)]
        x += step * rng.randint(1, 3)
        edge2 += [(x, yy)]
    _poly(ctx, edge2 + [(W + M, H + M), (-M, H + M)])
    ctx.set_source_rgba(*hexc('#d9a35a'))
    ctx.fill()
    for row in range(5):
        y0 = top + 10 + row * 30
        x = -M + (row % 2) * 40
        while x < W + M:
            w_ = rng.choice([60, 80, 100])
            ctx.set_source_rgba(*hexc(rng.choice(['#cf9850', '#c48a45', '#e2b067', '#d59f58'])))
            ctx.rectangle(x + 3, y0 + 3, w_ - 6, 24)
            ctx.fill()
            x += w_
    ctx.move_to(*edge2[0])
    for p in edge2[1:]:
        ctx.line_to(*p)
    ctx.set_source_rgba(0.45, 0.28, 0.12, 0.9)
    ctx.set_line_width(4)
    ctx.stroke()
    return surf


SKIES = {'desert': desert}


# ------------------------------------------------------------------ облачка
class Clouds:
    """5–6 пиксельных облачков без обводки, плывут слева направо 18–34 px/с."""

    def __init__(self, seed=3, n=6):
        rng = random.Random(seed)
        self.items = []
        ys = [70, 250, 130, 300, 90, 210]
        for i in range(n):
            x = (i + rng.uniform(0.1, 0.6)) * (W + 400) / n - 200
            y = ys[i % len(ys)] + rng.uniform(-20, 20)
            v = rng.uniform(18, 34) / 24.0
            s = rng.choice([16, 18, 20])
            self.items.append((x, y, v, s, self._shape(rng)))

    @staticmethod
    def _shape(rng):
        """Ряды клеток снизу вверх уже: широкое основание, «шапка» сверху."""
        w = rng.randint(7, 11)
        a0 = rng.randint(1, 2)
        b0 = w - rng.randint(1, 3)
        top = [(a0 + rng.randint(1, 2), max(a0 + 3, b0 - rng.randint(1, 3)))]
        if rng.random() < 0.5:
            t = top[0]
            top.insert(0, (t[0] + 1, max(t[0] + 2, t[1] - 2)))
        return top + [(a0, b0), (0, w)]

    def draw(self, ctx, f):
        for x, y, v, s, cells in self.items:
            span = W + 400
            xx = (x + v * f + 200) % span - 200
            h = len(cells)
            for r, (a, b) in enumerate(cells):
                ctx.rectangle(xx + a * s, y + r * s, (b - a) * s, s)
            ctx.set_source_rgba(1, 1, 1, 0.97)
            ctx.fill()
            # лёгкая тень снизу, без обводки
            a, b = cells[-1]
            ctx.rectangle(xx + a * s, y + (h - 1) * s + s * 0.55, (b - a) * s, s * 0.45)
            ctx.set_source_rgba(0.80, 0.90, 0.97, 1)
            ctx.fill()
