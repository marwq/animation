"""Бандит — настоящая енотиха (и её енотята). Вид сбоку.

draw_raccoon(ctx, x, gy, s, f, p): x, gy — точка на земле под серединой тела, s — пикселей на u
(как у людей), f = ±1 — куда смотрит. Взрослая енотиха ~1.0u в длину и ~0.6u в холке.
Позы (p["mode"]): stand, walk, run, sit (столбиком, лапки у груди), eat (ест с лапок, жуёт),
sleep (клубком, хвост вокруг носа), held (на руках, висит вертикально), climb (лезет вверх),
jump, peek (только голова, для крупных планов).
p["baby"] — енотёнок (крупнее голова, короче тело, пушистее).
p["hold"](ctx, x, y) — предмет в передних лапках (в позах sit/eat), рисуется в локальных u.
"""
import math
import cairo
from .core import hexrgb, shade, TAU, clamp
from . import draw as D

FUR = hexrgb("#9a9ea6")
FUR_D = hexrgb("#6f737c")
BELLY = hexrgb("#c9ccd2")
MASK = hexrgb("#26272c")
WHITE = hexrgb("#f7f5f0")
PAW = hexrgb("#3a3b41")
NOSE = hexrgb("#1c1d21")
INK = D.INK


def raccoon_pose(t, mode="stand", phase=0.0, look=0.0, chew=0.0, tail=1.0, **kw):
    p = dict(t=t, mode=mode, phase=phase, look=look, chew=chew, tail=tail)
    p.update(kw)
    return p


# --- части тела --------------------------------------------------------------

def _limb(ctx, top, foot, w, c, lw, paw=True, knee_dx=0.03):
    knee = ((top[0] + foot[0]) / 2 + knee_dx, (top[1] + foot[1]) / 2)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    for cc, ww in ((INK, w + lw * 1.6), (c, w)):
        D.col(ctx, cc)
        ctx.set_line_width(ww)
        ctx.move_to(*top)
        ctx.line_to(*knee)
        ctx.line_to(*foot)
        ctx.stroke()
    if paw:
        D.ellipse(ctx, foot[0] + 0.025, foot[1] - 0.012, w * 0.75, w * 0.42, PAW, INK, lw * 0.6)


def _tail(ctx, pts, lw, puff=1.0):
    w = 0.17 * puff
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    D.col(ctx, INK)
    ctx.set_line_width(w + lw * 2.0)
    D.catmull(ctx, pts)
    ctx.stroke()
    D.col(ctx, FUR)
    ctx.set_line_width(w)
    D.catmull(ctx, pts)
    ctx.stroke()
    # кольца
    D.col(ctx, MASK)
    ctx.set_line_cap(cairo.LINE_CAP_BUTT)
    ctx.set_dash([0.07 * puff, 0.075 * puff], 0.1)
    ctx.set_line_width(w * 0.98)
    D.catmull(ctx, pts)
    ctx.stroke()
    ctx.set_dash([])
    D.circle(ctx, pts[-1][0], pts[-1][1], w * 0.5, MASK, None, 0)


def raccoon_head(ctx, x, y, p, lw, scale=1.0, rot=0.0):
    """Голова: (x, y) — центр черепа, морда вправо (+x)."""
    t = p.get("t", 0.0)
    chew = p.get("chew", 0.0)
    look = p.get("look", 0.0)
    mode = p.get("mode")
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot + look * 0.3)
    ctx.scale(scale, scale)
    # уши
    for ex, ey, c in ((-0.13, -0.17, shade(FUR, -0.2)), (0.02, -0.2, FUR)):
        ctx.move_to(ex - 0.08, ey + 0.05)
        ctx.curve_to(ex - 0.09, ey - 0.08, ex + 0.07, ey - 0.1, ex + 0.07, ey + 0.04)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, INK)
        ctx.set_line_width(lw * 0.8)
        ctx.stroke()
        ctx.move_to(ex - 0.06, ey + 0.03)
        ctx.curve_to(ex - 0.065, ey - 0.06, ex + 0.05, ey - 0.07, ex + 0.05, ey + 0.03)
        ctx.close_path()
        D.col(ctx, WHITE)
        ctx.set_line_width(0.022)
        ctx.stroke()
    # череп + морда одной формой
    ctx.move_to(-0.2, 0.02)
    ctx.curve_to(-0.22, -0.16, -0.05, -0.22, 0.08, -0.17)
    ctx.curve_to(0.18, -0.13, 0.22, -0.06, 0.33, -0.01)
    ctx.curve_to(0.37, 0.01, 0.36, 0.06, 0.31, 0.07)
    ctx.curve_to(0.2, 0.1, 0.06, 0.14, -0.06, 0.13)
    ctx.curve_to(-0.16, 0.12, -0.2, 0.08, -0.2, 0.02)
    ctx.close_path()
    D.col(ctx, FUR)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip_preserve()
    ctx.new_path()
    # светлые щёки и морда
    D.ellipse(ctx, 0.12, 0.07, 0.2, 0.08, WHITE, None, 0)
    # белая «бровь» над маской
    D.ellipse(ctx, 0.06, -0.1, 0.11, 0.035, WHITE, None, 0, rot=-0.25)
    # маска: полоса от глаза назад к щеке
    ctx.move_to(-0.1, -0.06)
    ctx.curve_to(-0.02, -0.1, 0.12, -0.08, 0.17, -0.04)
    ctx.curve_to(0.15, 0.0, 0.08, 0.03, 0.0, 0.03)
    ctx.curve_to(-0.06, 0.04, -0.12, 0.06, -0.15, 0.05)
    ctx.close_path()
    D.col(ctx, MASK)
    ctx.fill()
    # тёмная полоса по лбу к носу
    D.col(ctx, shade(FUR, -0.25))
    ctx.move_to(0.0, -0.2)
    ctx.curve_to(0.08, -0.15, 0.18, -0.08, 0.3, -0.02)
    ctx.set_line_width(0.03)
    ctx.stroke()
    ctx.restore()
    D.col(ctx, INK)
    ctx.set_line_width(lw * 0.85)
    ctx.stroke()
    # нос
    D.ellipse(ctx, 0.345, 0.01, 0.035, 0.028, NOSE, None, 0)
    D.circle(ctx, 0.338, 0.0, 0.009, WHITE, None, 0)
    # глаз (блестит в маске)
    blink = p.get("blink", 0) > 0.5 or mode == "sleep" or ((t * 0.7 + 0.3) % 3.9 < 0.1)
    if blink:
        D.col(ctx, WHITE)
        ctx.set_line_width(0.02)
        ctx.arc(0.08, -0.03, 0.03, 0.2, math.pi - 0.2)
        ctx.stroke()
    else:
        D.circle(ctx, 0.085, -0.035, 0.034, NOSE, None, 0)
        D.circle(ctx, 0.095, -0.047, 0.012, WHITE, None, 0)
    # рот (жуёт)
    op = clamp(chew) * (0.5 + 0.5 * math.sin(t * 22))
    if p.get("bite"):
        op = 1.0
    if op > 0.05:
        ctx.move_to(0.18, 0.07)
        ctx.line_to(0.32, 0.065)
        ctx.line_to(0.26, 0.07 + 0.07 * op)
        ctx.close_path()
        D.col(ctx, hexrgb("#6a2a2a"))
        ctx.fill()
        D.col(ctx, WHITE)
        ctx.move_to(0.29, 0.066)
        ctx.line_to(0.3, 0.09)
        ctx.line_to(0.31, 0.066)
        ctx.fill()
    else:
        D.col(ctx, INK)
        ctx.set_line_width(0.016)
        ctx.move_to(0.33, 0.04)
        ctx.curve_to(0.3, 0.075, 0.24, 0.075, 0.2, 0.06)
        ctx.stroke()
    # усы
    D.col(ctx, INK, 0.55)
    ctx.set_line_width(0.01)
    for k in (-1, 0, 1):
        ctx.move_to(0.28, 0.03 + k * 0.015)
        ctx.line_to(0.46, 0.0 + k * 0.045)
    ctx.stroke()
    if mode == "sleep":
        for k in range(3):
            ph = (t * 0.5 + k / 3) % 1
            D.text(ctx, "z", 0.25 + ph * 0.3, -0.25 - ph * 0.45, 0.12 + ph * 0.1, D.FONT_HAND, INK, alpha=1 - ph)
    ctx.restore()


# --- позы ---------------------------------------------------------------------

def _body_path(ctx, hump=0.0, breath=0.0):
    """Туловище: таз выше плеч (енотья «горка»), короткое и круглое."""
    ctx.move_to(0.32, -0.04)
    ctx.curve_to(0.34, -0.26, 0.2, -0.36, 0.0, -0.46 - hump)
    ctx.curve_to(-0.2, -0.54 - hump, -0.42, -0.42, -0.42, -0.2)
    ctx.curve_to(-0.43, -0.02, -0.28, 0.06 + breath, -0.05, 0.06 + breath)
    ctx.curve_to(0.16, 0.06, 0.32, 0.06, 0.32, -0.04)
    ctx.close_path()


def _body(ctx, lw, hump=0.0, breath=0.0):
    _body_path(ctx, hump, breath)
    D.col(ctx, FUR)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip_preserve()
    ctx.new_path()
    D.ellipse(ctx, -0.06, -0.5 - hump, 0.46, 0.15, FUR_D, None, 0)   # тёмная спина
    D.ellipse(ctx, 0.05, 0.08, 0.36, 0.1, BELLY, None, 0)           # светлое брюхо
    # штрихи меха
    D.col(ctx, shade(FUR, -0.12))
    ctx.set_line_width(0.012)
    for k in range(6):
        xx = -0.36 + k * 0.13
        ctx.move_to(xx, -0.22)
        ctx.line_to(xx + 0.04, -0.12)
    ctx.stroke()
    ctx.restore()
    D.col(ctx, INK)
    ctx.set_line_width(lw * 0.85)
    ctx.stroke()


def draw_raccoon(ctx, x, gy, s, f, p, alpha=1.0):
    t = p.get("t", 0.0)
    mode = p.get("mode", "stand")
    ph = p.get("phase", 0.0) % 1.0
    baby = p.get("baby", False)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    if baby:
        ctx.scale(0.55, 0.55)
    if alpha < 1:
        ctx.push_group()
    lw = max(0.04, 1.2 / s) * (1.5 if baby else 1.0)
    hs = 1.55 if baby else 1.3          # масштаб головы
    breath = math.sin(t * 2.6) * 0.008
    if mode == "sit" or mode == "eat":
        _sit(ctx, p, lw, breath, hs, eat=(mode == "eat"))
    elif mode == "sleep":
        _sleep(ctx, p, lw, breath, hs)
    elif mode == "held":
        _held(ctx, p, lw, hs)
    elif mode == "climb":
        _climb(ctx, p, lw, hs)
    elif mode == "peek":
        raccoon_head(ctx, 0, 0, p, lw, hs)
    else:
        _walk(ctx, p, lw, breath, hs, mode, ph)
    if alpha < 1:
        ctx.pop_group_to_source()
        ctx.paint_with_alpha(alpha)
    ctx.restore()


def _walk(ctx, p, lw, breath, hs, mode, ph):
    t = p.get("t", 0.0)
    hop, tilt = 0.0, 0.0
    if mode == "walk":
        hop = -0.012 * abs(math.sin(TAU * ph))
    elif mode == "run":
        hop = -0.09 * max(0.0, math.sin(TAU * ph))
        tilt = 0.1 * math.sin(TAU * ph)
    elif mode == "jump":
        j = clamp(p.get("jump", 0.0))
        hop = -p.get("height", 0.9) * math.sin(math.pi * j)
        tilt = -0.45 * math.cos(math.pi * j)
    body_y = -0.3
    ctx.save()
    ctx.translate(0, body_y + hop)
    ground = -(body_y + hop)
    # хвост
    sw = math.sin(t * 2.0) * 0.05 * p.get("tail", 1.0)
    if mode == "run":
        tp = [(-0.42, -0.25), (-0.65, -0.3), (-0.88, -0.28 + sw), (-1.05, -0.2 + sw)]
    else:
        tp = [(-0.38, -0.24), (-0.58, -0.14), (-0.74, 0.0 + sw), (-0.88, 0.12 + sw)]
    _tail(ctx, tp, lw)
    legs = [(0.2, 0.0, 0.06), (-0.26, 0.5, 0.08), (0.12, 0.5, 0.06), (-0.32, 0.0, 0.08)]
    far = shade(FUR_D, -0.15)
    for i in (2, 3):
        _leg4(ctx, legs[i], ph, mode, ground, tilt, far, lw, p)
    ctx.save()
    ctx.rotate(tilt)
    _body(ctx, lw, 0.0, breath)
    ctx.restore()
    for i in (0, 1):
        _leg4(ctx, legs[i], ph, mode, ground, tilt, FUR_D, lw, p)
    ct, st = math.cos(tilt), math.sin(tilt)
    hx, hy = 0.36, -0.3
    if mode == "run":
        hx, hy = 0.42, -0.24
    hx, hy = hx * ct - hy * st, hx * st + hy * ct
    raccoon_head(ctx, hx, hy, p, lw, hs, rot=tilt * 0.5)
    ctx.restore()


def _leg4(ctx, leg, ph, mode, ground, tilt, c, lw, p):
    lx, off, w = leg
    ct, st = math.cos(tilt), math.sin(tilt)
    top = (lx * ct - (-0.05) * st, lx * st + (-0.05) * ct)
    if mode in ("walk", "run"):
        q = (ph + off) % 1.0
        amp = 0.14 if mode == "walk" else 0.3
        if q < 0.55:
            u = q / 0.55
            fx, fy = amp * (0.5 - u), 0.0
        else:
            u = (q - 0.55) / 0.45
            fx, fy = amp * (-0.5 + u), -0.08 * math.sin(math.pi * u) * (1.5 if mode == "run" else 1)
        foot = (top[0] + fx, ground + fy)
    elif mode == "jump":
        j = clamp(p.get("jump", 0.0))
        e = abs(math.cos(math.pi * j))
        foot = (top[0] + (0.22 if lx > 0 else -0.22) * (0.3 + 0.7 * e), top[1] + 0.26 - 0.08 * (1 - e))
    else:
        foot = (top[0] + (0.03 if lx > 0 else -0.03), ground)
    _limb(ctx, top, foot, w, c, lw)


def _sit(ctx, p, lw, breath, hs, eat=False):
    """Сидит столбиком на задних лапах, передние лапки у груди (или у рта)."""
    t = p.get("t", 0.0)
    sw = math.sin(t * 1.6) * 0.04 * p.get("tail", 1.0)
    _tail(ctx, [(-0.16, -0.08), (-0.4, -0.02), (-0.62, 0.0 + sw * 0.3), (-0.82, -0.06 + sw)], lw)
    # бедро задней лапы
    D.ellipse(ctx, -0.04, -0.13, 0.2, 0.14, FUR, INK, lw * 0.85)
    D.ellipse(ctx, 0.14, -0.015, 0.09, 0.035, PAW, INK, lw * 0.6)
    # корпус вертикально, чуть наклонён вперёд
    ctx.move_to(-0.2, -0.04)
    ctx.curve_to(-0.3, -0.36, -0.12, -0.7, 0.08, -0.7)
    ctx.curve_to(0.26, -0.66, 0.26, -0.3, 0.2, -0.04)
    ctx.close_path()
    D.col(ctx, FUR)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip_preserve()
    ctx.new_path()
    D.ellipse(ctx, 0.16, -0.36, 0.12, 0.3, BELLY, None, 0)
    D.ellipse(ctx, -0.26, -0.4, 0.12, 0.34, FUR_D, None, 0)
    ctx.restore()
    D.col(ctx, INK)
    ctx.set_line_width(lw * 0.85)
    ctx.stroke()
    hx, hy = 0.12, -0.8 + breath
    # передние лапки
    if eat:
        k = 0.5 + 0.5 * math.sin(t * 7)
        pw = (0.3, hy + 0.12 + 0.02 * k)
    else:
        pw = (0.28, -0.42)
    for dx, c in ((-0.04, shade(FUR_D, -0.15)), (0.03, FUR_D)):
        _limb(ctx, (0.1 + dx, -0.56), (pw[0] + dx, pw[1]), 0.055, c, lw, paw=False, knee_dx=0.06)
    hold = p.get("hold")
    if hold:
        hold(ctx, pw[0] + 0.04, pw[1])
    for dx in (-0.04, 0.03):
        D.ellipse(ctx, pw[0] + dx + 0.01, pw[1], 0.04, 0.032, PAW, INK, lw * 0.6)
    raccoon_head(ctx, hx, hy, p, lw, hs, rot=0.2 if eat else 0.0)


def _sleep(ctx, p, lw, breath, hs):
    t = p.get("t", 0.0)
    ctx.save()
    ctx.translate(0, -0.19)
    D.ellipse(ctx, 0, 0, 0.4, 0.19 + breath, FUR, INK, lw * 0.85)
    ctx.save()
    ctx.scale(0.4, 0.19 + breath)
    ctx.arc(0, 0, 1, 0, TAU)
    ctx.restore()
    ctx.save()
    ctx.clip()
    D.ellipse(ctx, 0, -0.18, 0.4, 0.1, FUR_D, None, 0)
    ctx.restore()
    ctx.restore()
    raccoon_head(ctx, 0.26, -0.16 + breath, dict(p, mode="sleep"), lw, hs, rot=0.35)
    # хвост вокруг носа
    _tail(ctx, [(-0.36, -0.12), (-0.4, 0.0), (-0.1, 0.04), (0.3, 0.02), (0.48, -0.06)], lw, 0.95)


def _held(ctx, p, lw, hs):
    """На руках: висит вертикально, (0,0) — точка подмышками."""
    t = p.get("t", 0.0)
    sw = math.sin(t * 3) * 0.03
    for dx in (-0.08, 0.06):
        _limb(ctx, (dx, 0.42), (dx + sw, 0.66), 0.07, FUR_D, lw)
    _tail(ctx, [(-0.04, 0.48), (0.04, 0.68), (-0.04 + sw * 2, 0.86), (0.04 + sw * 3, 1.02)], lw, 0.9)
    D.ellipse(ctx, 0, 0.24, 0.19, 0.3, FUR, INK, lw * 0.85)
    ctx.save()
    ctx.translate(0, 0.24)
    ctx.scale(0.19, 0.3)
    ctx.arc(0, 0, 1, 0, TAU)
    ctx.restore()
    ctx.save()
    ctx.clip()
    D.ellipse(ctx, 0.08, 0.22, 0.09, 0.26, BELLY, None, 0)
    ctx.restore()
    for dx in (-0.07, 0.08):
        _limb(ctx, (dx, 0.04), (dx + 0.1, 0.28), 0.055, FUR_D, lw)
    raccoon_head(ctx, 0.04, -0.12, p, lw, hs, rot=-0.25)


def _climb(ctx, p, lw, hs):
    """Лезет вверх по столбу: тело вертикально, морда вверх; (0,0) — нижние лапы."""
    t = p.get("t", 0.0)
    ph = p.get("phase", 0.0) % 1.0
    a = math.sin(TAU * ph)
    _tail(ctx, [(-0.05, -0.12), (-0.12, 0.08), (-0.06 + a * 0.04, 0.3), (-0.12, 0.5)], lw, 0.95)
    for dy, c in ((0.0, shade(FUR_D, -0.15)), (0.06, FUR_D)):
        _limb(ctx, (0.0, -0.2), (0.14, -0.02 + dy * 0.2 + a * 0.05), 0.075, c, lw)
    ctx.save()
    ctx.translate(0.02, -0.5)
    ctx.rotate(-math.pi / 2)
    _body(ctx, lw, 0.0, 0.0)
    ctx.restore()
    for dy, c in ((0.0, shade(FUR_D, -0.15)), (0.06, FUR_D)):
        _limb(ctx, (0.06, -0.78), (0.16, -0.96 - dy - a * 0.06), 0.06, c, lw)
    raccoon_head(ctx, 0.03, -0.98, p, lw, hs, rot=-math.pi / 2 + 0.3)
