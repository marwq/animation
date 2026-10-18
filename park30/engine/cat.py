"""Анкор — рыжая полосатая кошка капитана. Вид сбоку.

draw_cat(ctx, x, gy, s, f, p): x, gy — точка на земле под серединой тела, s — пикселей на u
(как у людей, u = диаметр головы человека), f = ±1 — куда смотрит.
Позы: stand, walk, run, sit, lie, sleep, jump, hiss, held (на руках: висит вертикально).
"""
import math
import cairo
from .core import hexrgb, shade, TAU, clamp
from . import draw as D

FUR = hexrgb("#f28a2c")
FUR_D = hexrgb("#c9611a")
WHITE = hexrgb("#fbf3e6")
EYE = hexrgb("#8fd14a")
PINK = hexrgb("#f29a9a")
INK = D.INK


def cat_pose(t, mode="stand", phase=0.0, meow=0.0, look=0.0, tail=1.0, **kw):
    p = dict(t=t, mode=mode, phase=phase, meow=meow, look=look, tail=tail)
    p.update(kw)
    return p


def _leg(ctx, top, foot, lw, c, paw=True):
    knee = ((top[0] + foot[0]) / 2 + 0.03, (top[1] + foot[1]) / 2)
    D.col(ctx, INK)
    ctx.set_line_width(lw * 1.9)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.move_to(*top)
    ctx.line_to(*knee)
    ctx.line_to(*foot)
    ctx.stroke()
    D.col(ctx, c)
    ctx.set_line_width(lw * 1.0)
    ctx.move_to(*top)
    ctx.line_to(*knee)
    ctx.line_to(*foot)
    ctx.stroke()
    if paw:
        D.ellipse(ctx, foot[0] + 0.03, foot[1] - 0.01, 0.06, 0.035, WHITE, INK, lw * 0.45)


def _tail(ctx, base, t, mode, amt, lw, puff=1.0):
    sw = math.sin(t * 2.2) * 0.25 * amt
    if mode in ("sit",):
        pts = [base, (base[0] - 0.1, base[1] + 0.08), (base[0] + 0.12, base[1] + 0.14), (base[0] + 0.4, base[1] + 0.12)]
    elif mode in ("lie", "sleep"):
        pts = [base, (base[0] - 0.15, base[1] + 0.05), (base[0] - 0.05, base[1] + 0.2), (base[0] + 0.4, base[1] + 0.24)]
    elif mode == "hiss":
        pts = [base, (base[0] - 0.05, base[1] - 0.3), (base[0] + 0.02, base[1] - 0.6), (base[0] - 0.04, base[1] - 0.8)]
    elif mode == "run":
        pts = [base, (base[0] - 0.25, base[1] - 0.05), (base[0] - 0.5, base[1] - 0.1 + sw * 0.3),
               (base[0] - 0.72, base[1] - 0.15)]
    elif mode == "held":
        pts = [base, (base[0] + 0.05, base[1] + 0.25), (base[0] - 0.05 + sw * 0.4, base[1] + 0.5),
               (base[0] + 0.05 + sw * 0.6, base[1] + 0.7)]
    else:
        pts = [base, (base[0] - 0.14, base[1] - 0.1), (base[0] - 0.2 + sw * 0.3, base[1] - 0.34),
               (base[0] - 0.1 + sw, base[1] - 0.5)]
    for c, w in ((INK, 0.095 * puff + lw * 2), (FUR, 0.095 * puff)):
        D.col(ctx, c)
        ctx.set_line_width(w)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        D.catmull(ctx, pts)
        ctx.stroke()
    # полоски на хвосте
    D.col(ctx, FUR_D)
    for k in (0.35, 0.6, 0.85):
        i = min(int(k * 3), 2)
        a, b = pts[i], pts[i + 1]
        u = k * 3 - i
        x, y = a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u
        ctx.arc(x, y, 0.032 * puff, 0, TAU)
        ctx.fill()


def _head(ctx, x, y, p, lw, f):
    t = p.get("t", 0.0)
    meow = p.get("meow", 0.0)
    look = p.get("look", 0.0)
    mode = p.get("mode")
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(look * 0.25)
    # уши
    for ex, c in ((-0.13, FUR_D), (0.09, FUR)):
        ctx.move_to(ex - 0.1, -0.12)
        ctx.line_to(ex - 0.02, -0.38)
        ctx.line_to(ex + 0.1, -0.14)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, INK)
        ctx.set_line_width(lw * 0.8)
        ctx.stroke()
        D.col(ctx, PINK)
        ctx.move_to(ex - 0.05, -0.15)
        ctx.line_to(ex - 0.02, -0.29)
        ctx.line_to(ex + 0.05, -0.16)
        ctx.close_path()
        ctx.fill()
    D.ellipse(ctx, 0, 0, 0.26, 0.23, FUR, INK, lw * 0.85)
    # полоски на лбу
    D.col(ctx, FUR_D)
    ctx.set_line_width(0.035)
    for k in (-0.07, 0.0, 0.07):
        ctx.move_to(k, -0.21)
        ctx.line_to(k * 1.1, -0.12)
        ctx.stroke()
    # морда
    D.ellipse(ctx, 0.15, 0.08, 0.13, 0.1, WHITE, None, 0)
    D.ellipse(ctx, 0.25, 0.02, 0.035, 0.025, PINK, INK, lw * 0.4)
    # глаз
    sleep = mode in ("sleep",) or p.get("blink", 0) > 0.5 or ((t * 0.8 + 0.4) % 4.1 < 0.12)
    if sleep:
        D.col(ctx, INK)
        ctx.set_line_width(0.025)
        ctx.arc(0.1, -0.03, 0.045, 0.2, math.pi - 0.2)
        ctx.stroke()
    else:
        wide = 1.25 if mode == "hiss" else 1.0
        D.ellipse(ctx, 0.1, -0.04, 0.055 * wide, 0.065 * wide, EYE, INK, lw * 0.45)
        D.ellipse(ctx, 0.11, -0.04, 0.014 * (2.2 if mode == "hiss" else 1.0), 0.05, INK, None, 0)
        D.circle(ctx, 0.12, -0.07, 0.012, (1, 1, 1), None, 0)
    # рот
    if meow > 0.05 or mode == "hiss":
        op = max(meow, 0.8 if mode == "hiss" else 0)
        ctx.move_to(0.12, 0.1)
        ctx.line_to(0.25, 0.08)
        ctx.line_to(0.22, 0.1 + 0.1 * op)
        ctx.close_path()
        D.col(ctx, hexrgb("#7a2a2a"))
        ctx.fill()
        if mode == "hiss":
            D.col(ctx, (1, 1, 1))
            ctx.move_to(0.2, 0.09)
            ctx.line_to(0.215, 0.13)
            ctx.line_to(0.23, 0.09)
            ctx.fill()
    else:
        D.col(ctx, INK)
        ctx.set_line_width(0.018)
        ctx.move_to(0.25, 0.045)
        ctx.curve_to(0.23, 0.09, 0.19, 0.09, 0.17, 0.07)
        ctx.stroke()
    # усы
    D.col(ctx, INK, 0.7)
    ctx.set_line_width(0.012)
    for k in (-1, 0, 1):
        ctx.move_to(0.2, 0.06 + k * 0.02)
        ctx.line_to(0.42, 0.04 + k * 0.05)
    ctx.stroke()
    # крошечная фуражка
    if p.get("hat"):
        ctx.save()
        ctx.translate(-0.02, -0.2)
        ctx.rotate(-0.15)
        ctx.move_to(-0.14, 0.02)
        ctx.curve_to(-0.2, -0.1, 0.18, -0.12, 0.16, 0.02)
        ctx.close_path()
        D.col(ctx, hexrgb("#fbfaf5"))
        ctx.fill_preserve()
        D.col(ctx, INK)
        ctx.set_line_width(0.02)
        ctx.stroke()
        D.col(ctx, hexrgb("#20232e"))
        ctx.rectangle(-0.14, -0.0, 0.3, 0.04)
        ctx.fill()
        ctx.move_to(0.06, 0.04)
        ctx.line_to(0.24, 0.05)
        ctx.set_line_width(0.035)
        ctx.stroke()
        D.circle(ctx, 0.01, -0.03, 0.025, hexrgb("#e3b84a"), None, 0)
        ctx.restore()
    ctx.restore()


def draw_cat(ctx, x, gy, s, f, p, alpha=1.0):
    t = p.get("t", 0.0)
    mode = p.get("mode", "stand")
    ph = p.get("phase", 0.0) % 1.0
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    if alpha < 1:
        ctx.push_group()
    lw = max(0.045, 1.2 / s)
    body_y, tilt, hop, arch = -0.36, 0.0, 0.0, 0.0
    if mode == "walk":
        hop = -0.015 * abs(math.sin(TAU * ph))
    elif mode == "run":
        hop = -0.12 * max(0, math.sin(TAU * ph))
        tilt = 0.12 * math.sin(TAU * ph)
    elif mode == "jump":
        j = clamp(p.get("jump", 0.0))
        hop = -p.get("height", 1.0) * math.sin(math.pi * j)
        tilt = -0.5 * math.cos(math.pi * j)
    elif mode == "hiss":
        arch = 0.18
        body_y = -0.42
    elif mode in ("lie", "sleep"):
        body_y = -0.17
    elif mode == "sit":
        body_y = -0.3
    breath = math.sin(t * 2.4) * 0.008
    if mode == "held":
        _held(ctx, p, lw)
    elif mode == "sit":
        _sit(ctx, p, lw, breath)
    elif mode in ("lie", "sleep"):
        _lie(ctx, p, lw, breath)
    else:
        ctx.translate(0, body_y + hop)
        ground = -(body_y + hop)
        legs = [(0.3, 0.0), (-0.3, 0.5), (0.22, 0.5), (-0.36, 0.0)]
        far_c = shade(FUR, -0.25)
        order = [2, 3, 0, 1]
        _tail(ctx, (-0.48, -0.05 - arch), t, mode, p.get("tail", 1.0), lw, 1.45 if mode == "hiss" else 1.0)
        for i in order[:2]:
            lx, off = legs[i]
            _draw_leg(ctx, lx, off, ph, mode, ground, tilt, far_c, lw, p, arch)
        ctx.save()
        ctx.rotate(tilt)
        # туловище (с выгнутой спиной при шипении)
        ctx.move_to(-0.5, 0.0)
        ctx.curve_to(-0.5, -0.24 - arch * 2, 0.4, -0.26 - arch * 2, 0.5, -0.04)
        ctx.curve_to(0.52, 0.14, 0.2, 0.2 + breath, -0.1, 0.19 + breath)
        ctx.curve_to(-0.4, 0.18, -0.52, 0.12, -0.5, 0.0)
        ctx.close_path()
        D.col(ctx, FUR)
        ctx.fill_preserve()
        ctx.save()
        ctx.clip_preserve()
        ctx.new_path()
        D.col(ctx, FUR_D)
        for k in range(4):
            xx = -0.32 + k * 0.17
            ctx.move_to(xx - 0.04, -0.3)
            ctx.line_to(xx + 0.04, -0.3)
            ctx.line_to(xx + 0.01, -0.05)
            ctx.close_path()
            ctx.fill()
        D.ellipse(ctx, 0.25, 0.16, 0.3, 0.1, WHITE, None, 0)
        if p.get("vest"):
            _vest(ctx)
        ctx.restore()
        D.col(ctx, INK)
        ctx.set_line_width(lw * 0.85)
        ctx.stroke()
        if mode == "hiss":   # дыбом
            D.col(ctx, INK)
            ctx.set_line_width(0.02)
            for k in range(7):
                xx = -0.4 + k * 0.13
                yy = -0.2 - arch * 2 * math.sin(math.pi * (k + 0.5) / 7) - 0.02
                ctx.move_to(xx, yy)
                ctx.line_to(xx + 0.02, yy - 0.08)
            ctx.stroke()
        ctx.restore()
        for i in order[2:]:
            lx, off = legs[i]
            _draw_leg(ctx, lx, off, ph, mode, ground, tilt, FUR, lw, p, arch)
        hx, hy = 0.5, -0.22 - arch * 1.6
        if mode == "run":
            hx, hy = 0.56, -0.12
        hx, hy = hx * math.cos(tilt) - hy * math.sin(tilt), hx * math.sin(tilt) + hy * math.cos(tilt)
        _head(ctx, hx, hy, p, lw, f)
    if alpha < 1:
        ctx.pop_group_to_source()
        ctx.paint_with_alpha(alpha)
    ctx.restore()


def _draw_leg(ctx, lx, off, ph, mode, ground, tilt, c, lw, p, arch):
    ct, st = math.cos(tilt), math.sin(tilt)
    top = (lx * ct - 0.08 * st, lx * st + 0.08 * ct)
    if mode in ("walk", "run"):
        q = (ph + off) % 1.0
        amp = 0.16 if mode == "walk" else 0.34
        if q < 0.55:
            u = q / 0.55
            fx, fy = amp * (0.5 - u), 0.0
        else:
            u = (q - 0.55) / 0.45
            fx, fy = amp * (-0.5 + u), -0.1 * math.sin(math.pi * u) * (1.6 if mode == "run" else 1)
        foot = (top[0] + fx, ground + fy)
    elif mode == "jump":
        j = clamp(p.get("jump", 0.0))
        ext = math.cos(math.pi * j)
        foot = (top[0] + (0.3 if lx > 0 else -0.3) * (0.4 + 0.6 * abs(ext)) * (1 if lx > 0 else 1),
                top[1] + 0.32 - 0.1 * (1 - abs(ext)))
    else:
        foot = (top[0] + (0.04 if lx > 0 else -0.04), ground)
    _leg(ctx, top, foot, lw, c)


def _sit(ctx, p, lw, breath):
    t = p.get("t", 0.0)
    _tail(ctx, (-0.18, -0.06), t, "sit", p.get("tail", 1.0), lw)
    # задняя лапа-бедро
    D.ellipse(ctx, -0.08, -0.18, 0.24, 0.18, FUR, INK, lw * 0.85)
    # корпус вертикально
    ctx.move_to(-0.2, -0.05)
    ctx.curve_to(-0.32, -0.4, -0.05, -0.75, 0.15, -0.7)
    ctx.curve_to(0.32, -0.62, 0.28, -0.25, 0.22, -0.02)
    ctx.close_path()
    D.col(ctx, FUR)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip_preserve()
    ctx.new_path()
    D.ellipse(ctx, 0.2, -0.38, 0.12, 0.3, WHITE, None, 0)
    D.col(ctx, FUR_D)
    for k in range(3):
        ctx.rectangle(-0.3, -0.62 + k * 0.16, 0.18, 0.05)
    ctx.fill()
    if p.get("vest"):
        _vest(ctx)
    ctx.restore()
    D.col(ctx, INK)
    ctx.set_line_width(lw * 0.85)
    ctx.stroke()
    # передние лапы
    for dx, c in ((0.08, shade(FUR, -0.15)), (0.18, FUR)):
        _leg(ctx, (dx, -0.4), (dx + 0.02, -0.01), lw, c)
    _head(ctx, 0.16, -0.82 + breath, p, lw, 1)


def _lie(ctx, p, lw, breath):
    t = p.get("t", 0.0)
    mode = p.get("mode")
    _tail(ctx, (-0.42, -0.05), t, mode, 0.3, lw)
    ctx.save()
    ctx.translate(0, -0.17 + breath)
    D.ellipse(ctx, 0, 0, 0.5, 0.18 + breath, FUR, INK, lw * 0.85)
    ctx.save()
    ctx.scale(0.5, 0.18)
    ctx.arc(0, 0, 1, 0, TAU)
    ctx.restore()
    ctx.save()
    ctx.clip()
    D.col(ctx, FUR_D)
    for k in range(4):
        ctx.rectangle(-0.3 + k * 0.16, -0.2, 0.05, 0.14)
    ctx.fill()
    if p.get("vest"):
        _vest(ctx)
    ctx.restore()
    # лапки впереди
    D.ellipse(ctx, 0.42, 0.13, 0.12, 0.05, WHITE, INK, lw * 0.5)
    ctx.restore()
    hy = -0.32 if mode == "lie" else -0.22
    _head(ctx, 0.42, hy + breath, p, lw, 1)
    if mode == "sleep":
        for k in range(3):
            ph = (t * 0.5 + k / 3) % 1
            D.text(ctx, "z", 0.6 + ph * 0.3, -0.5 - ph * 0.5, 0.12 + ph * 0.1, D.FONT_HAND, INK, alpha=1 - ph)


def _held(ctx, p, lw):
    """Кошка на руках: висит вертикально, (0,0) — точка подмышками."""
    t = p.get("t", 0.0)
    sw = math.sin(t * 3) * 0.04
    for dx in (-0.1, 0.06):
        _leg(ctx, (dx, 0.45), (dx + sw, 0.75), lw, FUR)
    _tail(ctx, (-0.05, 0.5), t, "held", 1.0, lw)
    D.ellipse(ctx, 0, 0.25, 0.2, 0.32, FUR, INK, lw * 0.85)
    ctx.save()
    ctx.translate(0, 0.25)
    ctx.scale(0.2, 0.32)
    ctx.arc(0, 0, 1, 0, TAU)
    ctx.restore()
    ctx.save()
    ctx.clip()
    D.ellipse(ctx, 0.08, 0.2, 0.1, 0.3, WHITE, None, 0)
    if p.get("vest"):
        _vest(ctx)
    ctx.restore()
    for dx in (-0.08, 0.1):
        _leg(ctx, (dx, 0.05), (dx + 0.08, 0.32), lw, shade(FUR, -0.1))
    _head(ctx, 0.04, -0.12, p, lw, 1)


def _vest(ctx):
    """Детский спасжилет."""
    D.col(ctx, hexrgb("#f2782e"))
    ctx.rectangle(-0.35, -0.35, 0.65, 0.8)
    ctx.fill()
    D.col(ctx, hexrgb("#f2f0e6"))
    ctx.rectangle(-0.35, -0.08, 0.65, 0.05)
    ctx.fill()
