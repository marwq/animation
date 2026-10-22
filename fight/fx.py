"""Эффекты: искра удара, пыль, дым, звёздочки, пот, жилка злости, пар,
золотые лучи, блеск, «вжух», тень. Без текста и линий скорости.

Каждая функция рисует эффект в возрасте age (кадров от начала).
"""
import math
import random

import cairo

OUT = (0.08, 0.07, 0.07)


def ease_out(t):
    t = min(max(t, 0.0), 1.0)
    return 1 - (1 - t) ** 3


def ease_in(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * t


def ease_io(t):
    t = min(max(t, 0.0), 1.0)
    return t * t * (3 - 2 * t)


def _star_path(ctx, x, y, r_out, r_in, n, rot=0.0):
    for i in range(2 * n):
        r = r_out if i % 2 == 0 else r_in
        a = rot + math.pi * i / n - math.pi / 2
        p = (x + r * math.cos(a), y + r * math.sin(a))
        if i == 0:
            ctx.move_to(*p)
        else:
            ctx.line_to(*p)
    ctx.close_path()


def shadow(ctx, x, y, w, lift=0.0, color=(0.45, 0.30, 0.12)):
    """Мягкая полупрозрачная тень; при подъёме в воздух меньше и светлее."""
    k = max(0.35, 1 - lift / 500)
    a = 0.32 * k
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(w * k / 2, w * k * 0.13)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, 1)
    g.add_color_stop_rgba(0, *color, a)
    g.add_color_stop_rgba(0.7, *color, a * 0.8)
    g.add_color_stop_rgba(1, *color, 0)
    ctx.set_source(g)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.fill()
    ctx.restore()


def spark(ctx, x, y, age, size=1.0, dur=8):
    """Жёлто-белая звезда удара в точке касания."""
    if not 0 <= age < dur:
        return
    t = age / dur
    s = size * (0.55 + 0.75 * ease_out(t * 1.6)) * (1 - 0.3 * t)
    a = 1.0 if t < 0.6 else 1 - (t - 0.6) / 0.4
    rot = age * 0.08
    ctx.save()
    _star_path(ctx, x, y, 95 * s, 38 * s, 8, rot)
    ctx.set_source_rgba(1.0, 0.82, 0.12, a)
    ctx.fill_preserve()
    ctx.set_source_rgba(0.85, 0.40, 0.05, a)
    ctx.set_line_width(4)
    ctx.stroke()
    _star_path(ctx, x, y, 55 * s, 24 * s, 8, rot + 0.2)
    ctx.set_source_rgba(1, 1, 0.92, a)
    ctx.fill()
    # разлетающиеся искорки
    rng = random.Random(int(x * 7 + y * 13))
    for i in range(7):
        ang = rng.uniform(0, 2 * math.pi)
        d = (60 + 90 * ease_out(t)) * size * rng.uniform(0.8, 1.3)
        px, py = x + d * math.cos(ang), y + d * math.sin(ang)
        _star_path(ctx, px, py, 12 * size * (1 - t), 5 * size * (1 - t), 4, ang)
        ctx.set_source_rgba(1, 0.9, 0.3, a)
        ctx.fill()
    ctx.restore()


def puff_cloud(ctx, x, y, r, alpha, fill=(0.93, 0.89, 0.80), line=(0.55, 0.45, 0.33), seed=1, n=7):
    """Комок из кружков с общей обводкой (пыль, «вжух», дым)."""
    rng = random.Random(seed)
    circles = []
    for i in range(n):
        a = 2 * math.pi * i / n + rng.uniform(-0.3, 0.3)
        d = r * rng.uniform(0.35, 0.6)
        circles.append((x + d * math.cos(a), y + d * math.sin(a) * 0.75, r * rng.uniform(0.45, 0.65)))
    circles.append((x, y, r * 0.6))
    if alpha <= 0:
        return
    ctx.save()
    # непрозрачно в группу, потом целиком с прозрачностью — внутренние контуры не просвечивают
    ctx.push_group()
    ctx.set_line_width(max(2.0, r * 0.08))
    for cx, cy, cr in circles:
        ctx.new_sub_path()
        ctx.arc(cx, cy, cr, 0, 2 * math.pi)
    ctx.set_source_rgba(*line)
    ctx.stroke()
    for cx, cy, cr in circles:
        ctx.new_sub_path()
        ctx.arc(cx, cy, cr, 0, 2 * math.pi)
    ctx.set_source_rgba(*fill)
    ctx.fill()
    # светлый блик
    for cx, cy, cr in circles[:3]:
        ctx.new_sub_path()
        ctx.arc(cx - cr * 0.25, cy - cr * 0.3, cr * 0.35, 0, 2 * math.pi)
    ctx.set_source_rgba(1, 1, 1, 0.5)
    ctx.fill()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)
    ctx.restore()


def dust(ctx, x, y, age, n=6, spread=160, size=1.0, dur=18, seed=0):
    """Бежевые клубы пыли у земли, разлетаются в стороны и тают."""
    if not 0 <= age < dur:
        return
    t = age / dur
    rng = random.Random(seed + int(x))
    for i in range(n):
        side = -1 if i % 2 == 0 else 1
        k = (i // 2 + 1) / (n // 2 + 1)
        dx = side * spread * k * ease_out(t) * rng.uniform(0.8, 1.2)
        dy = -30 * k * ease_out(t) * size - rng.uniform(0, 15)
        r = (26 + 30 * k) * size * (0.6 + 0.6 * ease_out(t))
        a = 1 - ease_in(t)
        puff_cloud(ctx, x + dx, y + dy, r, a * 0.95, seed=i + seed, n=5)


def smoke(ctx, x, y, age, size=1.0, dur=26, seed=5):
    """Серое облако дыма превращения: быстро раздувается, держится, тает."""
    if not 0 <= age < dur:
        return
    t = age / dur
    grow = 0.55 + 0.45 * ease_out(min(1, t * 3))
    a = 1.0 if t < 0.65 else 1 - (t - 0.65) / 0.35
    rng = random.Random(seed)
    blobs = []
    for i in range(11):
        ang = 2 * math.pi * i / 11 + rng.uniform(-0.2, 0.2)
        d = 150 * size * rng.uniform(0.6, 1.0)
        blobs.append((math.cos(ang) * d, math.sin(ang) * d * 1.25, 110 * size * rng.uniform(0.7, 1.0)))
    blobs.append((0, 0, 150 * size))
    ctx.save()
    ctx.push_group()
    ctx.translate(x, y)
    ctx.scale(grow * (1 + 0.15 * t), grow * (1 + 0.15 * t))
    ctx.set_line_width(7)
    for cx, cy, r in blobs:
        ctx.new_sub_path()
        ctx.arc(cx + math.sin(age * 0.3 + cx) * 4, cy - age * 1.2, r, 0, 2 * math.pi)
    ctx.set_source_rgb(0.35, 0.35, 0.38)
    ctx.stroke_preserve()
    ctx.set_source_rgb(0.78, 0.78, 0.80)
    ctx.fill()
    for cx, cy, r in blobs[:6]:
        ctx.new_sub_path()
        ctx.arc(cx - r * 0.2 + math.sin(age * 0.3 + cx) * 4, cy - r * 0.25 - age * 1.2, r * 0.45, 0, 2 * math.pi)
    ctx.set_source_rgb(0.85, 0.85, 0.87)
    ctx.fill()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(a)
    ctx.restore()


def flash(ctx, alpha, w=1920, h=1080):
    if alpha <= 0:
        return
    ctx.save()
    ctx.identity_matrix()
    ctx.set_source_rgba(1, 1, 1, alpha)
    ctx.rectangle(0, 0, w, h)
    ctx.fill()
    ctx.restore()


def star_small(ctx, x, y, r, rot=0.0, alpha=1.0, color=(1.0, 0.85, 0.15)):
    _star_path(ctx, x, y, r, r * 0.45, 5, rot)
    ctx.set_source_rgba(*color, alpha)
    ctx.fill_preserve()
    ctx.set_source_rgba(*OUT, alpha)
    ctx.set_line_width(max(2.0, r * 0.18))
    ctx.stroke()


def dizzy(ctx, x, y, age, rx=90, n=4, size=1.0):
    """Звёздочки кружатся над головой."""
    for i in range(n):
        a = age * 0.16 + 2 * math.pi * i / n
        px = x + rx * size * math.cos(a)
        py = y + rx * size * 0.32 * math.sin(a)
        r = (17 + 4 * math.sin(a)) * size
        star_small(ctx, px, py, r, a)


def sweat(ctx, x, y, age, size=1.0, side=1):
    """Синяя капля пота у головы, сползает и повторяется."""
    t = (age % 20) / 20
    yy = y + 30 * t * size
    a = 1 - t * 0.6
    s = 26 * size
    ctx.save()
    ctx.translate(x, yy)
    ctx.scale(side, 1)
    ctx.move_to(0, -s)
    ctx.curve_to(s * 0.15, -s * 0.4, s * 0.62, 0, s * 0.62, s * 0.38)
    ctx.curve_to(s * 0.62, s * 0.78, s * 0.3, s, 0, s)
    ctx.curve_to(-s * 0.3, s, -s * 0.62, s * 0.78, -s * 0.62, s * 0.38)
    ctx.curve_to(-s * 0.62, 0, -s * 0.15, -s * 0.4, 0, -s)
    ctx.close_path()
    ctx.set_source_rgba(0.45, 0.78, 1.0, a)
    ctx.fill_preserve()
    ctx.set_source_rgba(0.1, 0.3, 0.6, a)
    ctx.set_line_width(3)
    ctx.stroke()
    ctx.arc(-s * 0.2, s * 0.35, s * 0.15, 0, 2 * math.pi)
    ctx.set_source_rgba(1, 1, 1, a)
    ctx.fill()
    ctx.restore()


def anger(ctx, x, y, age, size=1.0):
    """Красная «жилка злости» — четыре изогнутых уголка, пульсирует."""
    s = size * (1 + 0.15 * math.sin(age * 0.9)) * 30
    ctx.save()
    ctx.translate(x, y)
    for k in range(4):
        ctx.save()
        ctx.rotate(k * math.pi / 2 + math.pi / 4)
        ctx.move_to(s * 0.25, s * 0.95)
        ctx.curve_to(s * 0.25, s * 0.45, s * 0.45, s * 0.25, s * 0.95, s * 0.25)
        ctx.restore()
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_source_rgba(*OUT)
    ctx.set_line_width(s * 0.42)
    ctx.stroke_preserve()
    ctx.set_source_rgba(0.93, 0.12, 0.12)
    ctx.set_line_width(s * 0.26)
    ctx.stroke()
    ctx.restore()


def steam(ctx, x, y, age, size=1.0):
    """Белые клубы пара вылетают с двух сторон головы."""
    for side in (-1, 1):
        for k in range(3):
            t = ((age + k * 6) % 18) / 18
            px = x + side * (20 + 60 * t) * size
            py = y - 70 * t * size
            r = (14 + 18 * t) * size
            puff_cloud(ctx, px, py, r, 1 - t, fill=(1, 1, 1), line=(0.55, 0.6, 0.65), seed=k + 3, n=4)


def rays(ctx, x, y, age, r=260, alpha=1.0, n=14):
    """Золотые лучи за спиной перед превращением."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(age * 0.05)
    for i in range(n):
        a0 = 2 * math.pi * i / n
        w = math.pi / n * 0.55
        rr = r * (1.0 if i % 2 else 0.75)
        ctx.move_to(0, 0)
        ctx.line_to(rr * math.cos(a0 - w), rr * math.sin(a0 - w))
        ctx.line_to(rr * math.cos(a0 + w), rr * math.sin(a0 + w))
        ctx.close_path()
    g = cairo.RadialGradient(0, 0, 0, 0, 0, r)
    g.add_color_stop_rgba(0, 1, 0.95, 0.55, 0.95 * alpha)
    g.add_color_stop_rgba(0.6, 1, 0.80, 0.15, 0.75 * alpha)
    g.add_color_stop_rgba(1, 1, 0.75, 0.1, 0)
    ctx.set_source(g)
    ctx.fill()
    ctx.restore()


def twinkle(ctx, x, y, age, size=1.0, dur=20):
    """Четырёхлучевая звёздочка-блеск: вспыхивает и гаснет."""
    if not 0 <= age < dur:
        return
    t = age / dur
    s = size * 60 * math.sin(math.pi * t)
    if s < 1:
        return
    c = s * 0.13
    tips = [(0, -s), (s, 0), (0, s), (-s, 0)]
    ctrl = [(c, -c), (c, c), (-c, c), (-c, -c)]
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(t * 1.2)
    ctx.move_to(*tips[0])
    for k in range(4):
        ctx.curve_to(*ctrl[k], *ctrl[k], *tips[(k + 1) % 4])
    ctx.close_path()
    ctx.set_source_rgba(1, 1, 0.85, 1)
    ctx.fill_preserve()
    ctx.set_source_rgba(1, 0.72, 0.1, 1)
    ctx.set_line_width(3)
    ctx.stroke()
    ctx.restore()


def whoosh(ctx, x, y, age, size=1.0, dur=14, trail=-1):
    """Маленькое облачко там, где прошёл удар мимо; trail — куда тянется след."""
    if not 0 <= age < dur:
        return
    t = age / dur
    for k in range(3):
        puff_cloud(ctx, x + trail * 40 * k * size * (1 + t), y + (k - 1) * 18 * size,
                   (22 - 4 * k) * size * (0.7 + 0.6 * t), (1 - t) * 0.95,
                   fill=(1, 1, 1), line=(0.55, 0.6, 0.65), seed=k + 11, n=5)
