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


# ------------------------------------------------------------------ луг (как в роликах автора)
def _stepped_hills(rng, base, top, step, bumps):
    """Пологие холмы с пиксельным (ступенчатым) краем."""
    pts = [(-M, base)]
    x = -M
    while x <= W + M:
        y = base - sum(h * math.exp(-((x - cx) / w) ** 2) for cx, w, h in bumps)
        y = round(max(top, y) / step) * step
        pts += [(x, pts[-1][1]), (x, y)]
        x += step * rng.randint(2, 4)
    pts += [(W + M, pts[-1][1]), (W + M, base)]
    return pts


def _tree(ctx, x, base, s, rng):
    """Блочное дерево: ствол и крона из квадратов, без обводки (дальний план)."""
    ctx.set_source_rgba(*hexc('#8a5a32'))
    ctx.rectangle(x - 8 * s, base - 70 * s, 16 * s, 70 * s)
    ctx.fill()
    leaf = [hexc('#3f9e3c'), hexc('#4fb44a'), hexc('#37893a')]
    b = 22 * s
    rows = [(-2, 2), (-3, 3), (-3, 3), (-2, 2)]
    for r, (a, e) in enumerate(rows):
        for c in range(a, e):
            ctx.set_source_rgba(*rng.choice(leaf))
            ctx.rectangle(x + c * b, base - 70 * s - (len(rows) - r) * b, b + 0.5, b + 0.5)
            ctx.fill()


def _tuft(ctx, x, y, s=1.0):
    """Пучок травы «ʍ» тёмной линией."""
    ctx.move_to(x, y)
    ctx.line_to(x + 5 * s, y - 13 * s)
    ctx.line_to(x + 10 * s, y - 3 * s)
    ctx.line_to(x + 16 * s, y - 15 * s)
    ctx.line_to(x + 21 * s, y - 2 * s)
    ctx.line_to(x + 27 * s, y - 12 * s)


def _flower(ctx, x, y, color, s=1.0):
    p = 6 * s
    ctx.set_source_rgba(*hexc('#2d7d24'))
    ctx.rectangle(x - 1.5 * s, y, 3 * s, 12 * s)
    ctx.fill()
    ctx.set_source_rgba(*hexc(color))
    for dx, dy in ((0, -p), (p, 0), (0, p), (-p, 0)):
        ctx.rectangle(x + dx - p / 2, y + dy - p / 2 - p, p, p)
    ctx.fill()
    ctx.set_source_rgba(*hexc('#ffe14a'))
    ctx.rectangle(x - p / 2, y - p / 2 - p, p, p)
    ctx.fill()


MEADOWS = {
    # каждый ролик — свой вариант: другое небо, трава, дальний план
    'spring': dict(sky=('#3b97ee', '#86c9f3', '#e3f4cf'), grass='#43c934', grass_dark='#3bb72e',
                   grass_light='#50d240', dirt='#b46d2f', dirt_dark=('#9b5a26', '#8b4f21', '#a86429'),
                   hills=('#b5e2c4', '#86cf8a'), trees=True, flowers=('#ff4b5c', '#ffffff', '#ffd23f', '#7a8cff')),
    'mountains': dict(sky=('#2a9fe2', '#8fd3f2', '#f0f7da'), grass='#4cc63c', grass_dark='#41b433',
                      grass_light='#5dd64c', dirt='#a8642c', dirt_dark=('#8f5325', '#7d4820', '#9a5a27'),
                      hills=('#a9c9df', '#8fd27f'), mountains=True, bushes=True, mushrooms=True, stones=True),
    'lake': dict(sky=('#3a8fe8', '#7fc0f0', '#e6f1ff'), grass='#3fbf3a', grass_dark='#36aa31',
                 grass_light='#52cf47', dirt='#b0703a', dirt_dark=('#985e2f', '#8a5229', '#a4683a'),
                 hills=('#c3e3cf', '#93d48c'), lake=True, birches=True, sunflowers=True),
    'farm': dict(sky=('#4aa3e6', '#9bd2ef', '#fbf3d9'), grass='#5cc23a', grass_dark='#51ad33',
                 grass_light='#6fd14a', dirt='#a96a33', dirt_dark=('#91582a', '#844f25', '#9d6230'),
                 hills=('#cfe6c0', '#a6d98a'), fence=True, haystacks=True, pumpkins=True),
    'windmill': dict(sky=('#3d9be9', '#8dcbf1', '#eaf6ec'), grass='#47c43a', grass_dark='#3eb033',
                     grass_light='#58d14a', dirt='#a0663a', dirt_dark=('#895631', '#7b4c2b', '#955e35'),
                     hills=('#bfe0c6', '#8fd07f'), windmill=True, tulips=True),
}


def _windmill(ctx, x, base, s):
    """Пиксельная мельница на холме: башня, крыша, четыре крыла."""
    b = 10 * s
    tower = [(-3, 3)] * 4 + [(-4, 4)] * 5 + [(-5, 5)] * 5 + [(-6, 6)] * 4
    top = base - len(tower) * b
    for r, (a, e) in enumerate(tower):
        ctx.rectangle(x + a * b, top + r * b, (e - a) * b, b + 0.5)
    ctx.set_source_rgba(*hexc('#e9dcc3'))
    ctx.fill()
    ctx.rectangle(x - 1.5 * b, base - 4 * b, 3 * b, 4 * b)
    ctx.set_source_rgba(*hexc('#8a5b36'))
    ctx.fill()
    ctx.rectangle(x - 1.5 * b, top + 4 * b, 3 * b, 2 * b)
    ctx.set_source_rgba(*hexc('#7fb6e0'))
    ctx.fill()
    for r, (a, e) in enumerate(((-1, 1), (-2, 2), (-4, 4))):
        ctx.rectangle(x + a * b, top - (3 - r) * b, (e - a) * b, b + 0.5)
    ctx.set_source_rgba(*hexc('#b8483a'))
    ctx.fill()
    hub = (x, top - b)
    for k in range(4):
        ctx.save()
        ctx.translate(*hub)
        ctx.rotate(math.radians(20 + 90 * k))
        ctx.rectangle(-b * 0.4, 0, b * 0.8, 10 * b)
        ctx.set_source_rgba(*hexc('#7a5332'))
        ctx.fill()
        for j in range(3, 10, 2):
            ctx.rectangle(b * 0.4, j * b, 2.4 * b, b * 1.4)
        ctx.set_source_rgba(*hexc('#f7f2e6'))
        ctx.fill()
        ctx.restore()
    ctx.rectangle(hub[0] - b * 0.8, hub[1] - b * 0.8, b * 1.6, b * 1.6)
    ctx.set_source_rgba(*hexc('#5c3d24'))
    ctx.fill()


def _tulip(ctx, x, y, color, s=1.0):
    p = 6 * s
    ctx.set_source_rgba(*hexc('#2d7d24'))
    ctx.rectangle(x - 1.5 * s, y - 22 * s, 3 * s, 22 * s)
    ctx.rectangle(x - 7 * s, y - 12 * s, 6 * s, 3 * s)
    ctx.fill()
    ctx.set_source_rgba(*hexc(color))
    for dx, dy in ((-1, 0), (0, 0), (1, 0), (-1, -1), (1, -1), (0, -1), (-1, 1), (0, 1), (1, 1)):
        if (dx, dy) == (0, -1):
            continue
        ctx.rectangle(x + dx * p - p / 2, y - 28 * s + dy * p - p / 2, p, p)
    ctx.fill()


def _fence(ctx, base, rng):
    """Деревянный пиксельный забор вдоль дальнего края луга."""
    post, rail, dark = hexc('#b07a45'), hexc('#c48c52'), hexc('#8a5b30')
    for y in (base - 46, base - 24):
        ctx.rectangle(-M, y, W + 2 * M, 9)
        ctx.set_source_rgba(*rail)
        ctx.fill()
        ctx.rectangle(-M, y + 7, W + 2 * M, 2)
        ctx.set_source_rgba(*dark)
        ctx.fill()
    x = -M + 10
    while x < W + M:
        ctx.rectangle(x, base - 62, 14, 62)
        ctx.set_source_rgba(*post)
        ctx.fill()
        ctx.rectangle(x + 10, base - 62, 4, 62)
        ctx.set_source_rgba(*dark)
        ctx.fill()
        x += 88


def _haystack(ctx, x, base, s, rng):
    """Стог сена из пиксельных рядов: широкий низ, круглая макушка."""
    cols = [hexc('#e8c24a'), hexc('#d9ae3a'), hexc('#f2d36a')]
    b = 14 * s
    rows = [(-1, 1), (-3, 3), (-4, 4), (-5, 5), (-5, 5), (-6, 6), (-6, 6)]
    for r, (a, e) in enumerate(rows):
        for c in range(a, e):
            ctx.set_source_rgba(*rng.choice(cols))
            ctx.rectangle(x + c * b, base - (len(rows) - r) * b, b + 0.5, b + 0.5)
            ctx.fill()
    ctx.set_source_rgba(*hexc('#b8902c'))
    for k in range(3):
        ctx.rectangle(x - 4 * b + k * 3 * b, base - 3 * b, 2 * b, 3)
    ctx.fill()


def _pumpkin(ctx, x, y, s=1.0):
    """Тыковка с обводкой и хвостиком."""
    ctx.save()
    ctx.translate(x, y - 14 * s)
    ctx.scale(22 * s, 15 * s)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()
    ctx.set_source_rgba(*hexc('#f08a24'))
    ctx.fill_preserve()
    ctx.set_source_rgba(*OUT)
    ctx.set_line_width(2.5)
    ctx.stroke()
    ctx.set_source_rgba(*hexc('#c96a14'))
    ctx.set_line_width(2)
    for dx in (-8, 8):
        ctx.move_to(x + dx * s, y - 27 * s)
        ctx.curve_to(x + dx * 1.4 * s, y - 18 * s, x + dx * 1.4 * s, y - 10 * s, x + dx * s, y - 1 * s)
    ctx.stroke()
    ctx.rectangle(x - 2.5 * s, y - 36 * s, 5 * s, 9 * s)
    ctx.set_source_rgba(*hexc('#4f7a22'))
    ctx.fill_preserve()
    ctx.set_source_rgba(*OUT)
    ctx.set_line_width(2)
    ctx.stroke()


def _lake(ctx, rng, y0=812, y1=874, step=12):
    """Пруд за краем травы: пиксельный берег, светлая рябь, камыши."""
    pts = []
    x = 260
    while x <= 1700:
        pts.append((x, y0 + step * rng.choice([0, 0, 1])))
        x += step * rng.randint(3, 6)
    poly = [(240, y1)]
    for (xa, ya), (xb, _) in zip(pts, pts[1:] + [(1720, 0)]):
        poly += [(xa, ya), (xb, ya)]
    poly.append((1720, y1))
    _poly(ctx, poly)
    g = cairo.LinearGradient(0, y0, 0, y1)
    g.add_color_stop_rgb(0, *hexc('#4aa8e8')[:3])
    g.add_color_stop_rgb(1, *hexc('#2f84cf')[:3])
    ctx.set_source(g)
    ctx.fill()
    ctx.set_source_rgba(1, 1, 1, 0.55)
    for _ in range(26):
        rx, ry = rng.uniform(320, 1640), rng.uniform(y0 + 14, y1 - 8)
        ctx.rectangle(round(rx / 6) * 6, round(ry / 6) * 6, step * rng.randint(2, 5), 4)
    ctx.fill()
    # камыши по краям
    for bx in (300, 340, 1630, 1675):
        for k in range(3):
            xx = bx + k * 9
            h = rng.uniform(40, 70)
            ctx.rectangle(xx, y0 + 30 - h, 4, h)
            ctx.set_source_rgba(*hexc('#3b7f2a'))
            ctx.fill()
            ctx.rectangle(xx - 2, y0 + 30 - h, 8, 16)
            ctx.set_source_rgba(*hexc('#7a4a22'))
            ctx.fill()


def _birch(ctx, x, base, s, rng):
    """Берёзка: белый ствол с чёрными пятнами, светлая крона из квадратов."""
    ctx.rectangle(x - 7 * s, base - 110 * s, 14 * s, 110 * s)
    ctx.set_source_rgba(*hexc('#f1efe6'))
    ctx.fill()
    ctx.set_source_rgba(*hexc('#2b2b2b'))
    for k in range(5):
        ctx.rectangle(x - 7 * s + rng.choice([0, 6]) * s, base - (18 + k * 20) * s, 8 * s, 4 * s)
    ctx.fill()
    leaf = [hexc('#7cc84f'), hexc('#8fd65c'), hexc('#6ab843')]
    b = 20 * s
    for r, (a, e) in enumerate(((-1, 2), (-2, 3), (-2, 3), (-1, 2))):
        for c in range(a, e):
            ctx.set_source_rgba(*rng.choice(leaf))
            ctx.rectangle(x + c * b - b / 2, base - 110 * s - (4 - r) * b + b, b + 0.5, b + 0.5)
            ctx.fill()


def _sunflower(ctx, x, y, s=1.0):
    """Пиксельный подсолнух на коротком стебле."""
    p = 7 * s
    ctx.set_source_rgba(*hexc('#2d7d24'))
    ctx.rectangle(x - 2 * s, y - 26 * s, 4 * s, 26 * s)
    ctx.rectangle(x + 2 * s, y - 14 * s, 8 * s, 4 * s)
    ctx.fill()
    ctx.set_source_rgba(*hexc('#ffcc1f'))
    for dx, dy in ((-1, -1), (0, -1), (1, -1), (-1, 0), (1, 0), (-1, 1), (0, 1), (1, 1), (0, -2), (0, 2), (-2, 0), (2, 0)):
        ctx.rectangle(x + dx * p - p / 2, y - 34 * s + dy * p - p / 2, p, p)
    ctx.fill()
    ctx.set_source_rgba(*hexc('#7a4a1c'))
    ctx.rectangle(x - p / 2, y - 34 * s - p / 2, p, p)
    ctx.fill()


def _mountains(ctx, rng, base, step=16):
    """Дальние пиксельные горы со снежными шапками."""
    for cx, w, h, col in ((260, 420, 330, '#9fb9d6'), (820, 520, 400, '#93aed0'),
                          (1420, 460, 360, '#9fb9d6'), (1900, 380, 300, '#a7c0db')):
        pts = []
        x = cx - w
        while x <= cx + w:
            t = 1 - abs(x - cx) / w
            y = round((base - h * t ** 1.15 + rng.choice([0, step, -step]) * (0.2 < t < 0.9)) / step) * step
            pts.append((x, y))
            x += step * rng.randint(1, 3)
        poly = [(cx - w, base)]
        for (xa, ya), (xb, _) in zip(pts, pts[1:] + [(cx + w, 0)]):
            poly += [(xa, ya), (xb, ya)]
        poly.append((cx + w, base))
        _poly(ctx, poly)
        ctx.set_source_rgba(*hexc(col))
        ctx.fill()
        # тень на правом склоне
        shade = [(cx, base)] + [(xa, ya) for xa, ya in poly if xa >= cx] + [(cx + w, base)]
        _poly(ctx, shade)
        ctx.set_source_rgba(0.35, 0.42, 0.58, 0.18)
        ctx.fill()
        # снег — верхушка выше линии снега
        line = base - h * 0.82
        ctx.save()
        _poly(ctx, poly)
        ctx.clip()
        ctx.rectangle(cx - w, base - h - 40, 2 * w, h * 0.18 + 40 + rng.choice([0, step]))
        ctx.set_source_rgba(*hexc('#eef3fb'))
        ctx.fill()
        for k in range(-2, 3):
            if rng.random() < 0.6:
                ctx.rectangle(cx + k * step * 2, line, step * 2, step * rng.randint(1, 2))
        ctx.fill()
        ctx.restore()


def _block_bush(ctx, x, base, s, rng):
    """Блочный куст из квадратов."""
    leaf = [hexc('#3a9a36'), hexc('#48ad40'), hexc('#2f8530')]
    b = 20 * s
    for r, (a, e) in enumerate(((-1, 2), (-2, 3), (-3, 3))):
        for c in range(a, e):
            ctx.set_source_rgba(*rng.choice(leaf))
            ctx.rectangle(x + c * b, base - (3 - r) * b, b + 0.5, b + 0.5)
            ctx.fill()


def _mushroom(ctx, x, y, s=1.0):
    """Красный грибок с белыми точками и обводкой."""
    ctx.rectangle(x - 5 * s, y - 14 * s, 10 * s, 14 * s)
    ctx.set_source_rgba(*hexc('#f6ecd6'))
    ctx.fill_preserve()
    ctx.set_source_rgba(*OUT)
    ctx.set_line_width(2.5)
    ctx.stroke()
    ctx.move_to(x - 15 * s, y - 13 * s)
    ctx.curve_to(x - 15 * s, y - 32 * s, x + 15 * s, y - 32 * s, x + 15 * s, y - 13 * s)
    ctx.close_path()
    ctx.set_source_rgba(*hexc('#e8322d'))
    ctx.fill_preserve()
    ctx.set_source_rgba(*OUT)
    ctx.stroke()
    ctx.set_source_rgba(1, 1, 1)
    for dx, dy in ((-7, -20), (5, -24), (8, -16)):
        ctx.arc(x + dx * s, y + dy * s, 2.6 * s, 0, 2 * math.pi)
        ctx.fill()


def meadow(name='spring', seed=11):
    """Луг: небо с переходом цвета, трава с рукописным краем и пучками,
    ступенчатая граница с пиксельной землёй. Ступни бойцов — на y = 945."""
    v = MEADOWS[name]
    rng = random.Random(seed)
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W + 2 * M, H + 2 * M)
    ctx = cairo.Context(surf)
    ctx.translate(M, M)

    g = cairo.LinearGradient(0, -M, 0, 880)
    for t, c in zip((0.0, 0.55, 1.0), v['sky']):
        g.add_color_stop_rgb(t, *hexc(c)[:3])
    ctx.set_source(g)
    ctx.paint()

    # дальний план: холмы и блочные деревья (или горы и кусты)
    far, near = v['hills']
    if v.get('mountains'):
        _mountains(ctx, rng, 820)
        g2 = cairo.LinearGradient(0, 560, 0, 820)
        g2.add_color_stop_rgba(0, 0.94, 0.97, 0.88, 0.0)
        g2.add_color_stop_rgba(1, 0.94, 0.97, 0.88, 0.55)
        ctx.set_source(g2)
        ctx.rectangle(-M, 560, W + 2 * M, 300)
        ctx.fill()
    else:
        _poly(ctx, _stepped_hills(rng, 900, 640, 16, [(250, 260, 170), (900, 330, 120), (1600, 300, 190)]))
        ctx.set_source_rgba(*hexc(far))
        ctx.fill()
    hills = _stepped_hills(rng, 900, 700, 16, [(-50, 300, 140), (620, 240, 95), (1300, 320, 130), (2000, 260, 120)])
    if v.get('windmill'):
        _poly(ctx, hills)
        ctx.set_source_rgba(*hexc(near))
        ctx.fill()
        for wx, sc in ((300, 1.0), (1650, 0.8)):
            wy = min(y for x, y in hills if abs(x - wx) < 40) + 8
            _windmill(ctx, wx, wy, sc)
    if v.get('haystacks'):
        _poly(ctx, hills)
        ctx.set_source_rgba(*hexc(near))
        ctx.fill()
        for hx, sc in ((170, 1.0), (330, 0.75), (1600, 0.9), (1790, 1.1)):
            hy = min(y for x, y in hills if abs(x - hx) < 40) + 6
            _haystack(ctx, hx, hy, sc, rng)
    if v.get('birches'):
        _poly(ctx, hills)
        ctx.set_source_rgba(*hexc(near))
        ctx.fill()
        for bx, sc in ((120, 0.95), (210, 0.75), (1770, 0.9), (1860, 1.05)):
            by = min(y for x, y in hills if abs(x - bx) < 40) + 4
            _birch(ctx, bx, by, sc, rng)
    if v.get('bushes'):
        _poly(ctx, hills)
        ctx.set_source_rgba(*hexc(near))
        ctx.fill()
        for bx, sc in ((90, 1.0), (520, 0.8), (1060, 0.9), (1380, 1.1), (1760, 0.85)):
            by = min(y for x, y in hills if abs(x - bx) < 40) + 4
            _block_bush(ctx, bx, by, sc, rng)
    if v.get('trees'):
        for tx, sc in ((150, 0.9), (700, 0.75), (1250, 1.0), (1440, 0.8), (1820, 0.9)):
            ty = min(y for x, y in hills if abs(x - tx) < 40) + 6
            _tree(ctx, tx, ty, sc, rng)
    _poly(ctx, hills)
    ctx.set_source_rgba(*hexc(near))
    ctx.fill()
    if v.get('lake'):
        _lake(ctx, rng)
    if v.get('fence'):
        _fence(ctx, 878, rng)

    # трава: верхний край неровный, с пучками, чёрная обводка
    top = 872
    edge = [(-M, top)]
    x = -M
    while x < W + M:
        if rng.random() < 0.18:
            for _ in range(rng.randint(2, 4)):
                edge.append((x, top + rng.uniform(-2, 2)))
                edge.append((x + 5, top - rng.uniform(9, 17)))
                x += rng.uniform(9, 13)
        x += rng.uniform(18, 34)
        edge.append((x, top + rng.uniform(-3, 3)))
    # нижний край травы — ступеньки блоков, уходящих в землю
    bottom = []
    x = W + M
    while x > -M:
        y = 990 + 26 * rng.choice([0, 1, 1, 2, 3])
        w = 52 * rng.randint(1, 2)
        bottom += [(x, y), (x - w, y)]
        x -= w
    grass = edge + bottom

    # земля
    ctx.set_source_rgba(*hexc(v['dirt']))
    ctx.rectangle(-M, 960, W + 2 * M, H + M - 960 + M)
    ctx.fill()
    for yy in range(980, H + M, 30):
        for xx in range(-M, W + M, 30):
            if rng.random() < 0.38:
                ctx.set_source_rgba(*hexc(rng.choice(v['dirt_dark'])))
                ctx.rectangle(xx, yy, 30, 30)
                ctx.fill()
    for _ in range(40):
        ctx.save()
        ctx.translate(rng.uniform(-M, W + M), rng.uniform(1030, H + M))
        ctx.scale(rng.uniform(5, 10), rng.uniform(4, 7))
        ctx.arc(0, 0, 1, 0, 2 * math.pi)
        ctx.restore()
        ctx.set_source_rgba(0.35, 0.18, 0.08, 0.8)
        ctx.fill()

    _poly(ctx, grass)
    ctx.set_source_rgba(*hexc(v['grass']))
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    for yy in range(top - 20, 1100, 32):
        for xx in range(-M, W + M, 32):
            r = rng.random()
            if r < 0.16:
                ctx.set_source_rgba(*hexc(v['grass_dark']))
            elif r < 0.24:
                ctx.set_source_rgba(*hexc(v['grass_light']))
            else:
                continue
            ctx.rectangle(xx, yy, 32, 32)
            ctx.fill()
    ctx.restore()
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    # обводка: верхний край и ступеньки
    ctx.move_to(*edge[0])
    for p in edge[1:]:
        ctx.line_to(*p)
    ctx.set_source_rgba(*OUT)
    ctx.set_line_width(5)
    ctx.stroke()
    ctx.move_to(*bottom[0])
    for p in bottom[1:]:
        ctx.line_to(*p)
    ctx.set_line_width(5)
    ctx.stroke()

    # пучки травы и цветочки (не там, где стоят бойцы — им не мешают, они ниже ступней)
    ctx.set_source_rgba(*hexc('#1f5f1a'))
    ctx.set_line_width(3.5)
    for _ in range(26):
        _tuft(ctx, rng.uniform(0, W), rng.uniform(905, 985), rng.uniform(0.9, 1.3))
    ctx.stroke()
    for _ in range(22 if v.get('flowers') else 0):
        _flower(ctx, rng.uniform(0, W), rng.uniform(900, 975), rng.choice(v['flowers']), rng.uniform(0.8, 1.1))
    if v.get('stones'):
        for _ in range(14):
            sx, sy, sw = rng.uniform(0, W), rng.uniform(905, 980), rng.choice([14, 18, 22])
            ctx.rectangle(sx, sy - sw * 0.6, sw, sw * 0.6)
            ctx.set_source_rgba(*hexc(rng.choice(['#9aa0a6', '#b4b9be', '#878d93'])))
            ctx.fill_preserve()
            ctx.set_source_rgba(*OUT)
            ctx.set_line_width(2)
            ctx.stroke()
    if v.get('tulips'):
        cols = ('#e8323a', '#ffcf2e', '#ff6fb0', '#f47a1f')
        for k in range(30):
            tx = 40 + k * 64 + rng.uniform(-12, 12)
            _tulip(ctx, tx, rng.uniform(925, 985), cols[k % 4], rng.uniform(0.9, 1.15))
    if v.get('pumpkins'):
        for px_ in (90, 520, 1380, 1700, 1870):
            _pumpkin(ctx, px_ + rng.uniform(-25, 25), rng.uniform(935, 985), rng.uniform(0.9, 1.2))
    if v.get('sunflowers'):
        for fx_ in (60, 330, 700, 1230, 1580, 1850):
            _sunflower(ctx, fx_ + rng.uniform(-25, 25), rng.uniform(930, 985), rng.uniform(0.9, 1.15))
    if v.get('mushrooms'):
        for mx in (70, 610, 1180, 1690, 1880):
            _mushroom(ctx, mx + rng.uniform(-30, 30), rng.uniform(925, 975), rng.uniform(0.9, 1.2))
    return surf


SKIES = {'desert': desert, 'meadow': meadow}


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
