"""Стикмен в манере «иллюстрированного выживания»: большая белая круглая голова с чернильным контуром,
глаза-точки, брови и рот одной линией, тело, руки и ноги — тонкие чёрные палочки.

Единица длины — радиус головы r. Рост стоящего ≈ 8r (голова — четверть роста).
draw(ctx, x, gy, r, f, pose, look) — (x, gy) — точка на полу между стопами, f = ±1 — куда смотрит (вид сбоку/3/4).
Поза — словарь; отсутствующие поля берутся из stand().
"""
import math

import cairo

from .core import hexrgb, shade, mix, clamp, lerp, TAU
from . import draw as D

INK = hexrgb("#1d1b1f")
SKIN = hexrgb("#f6f3ec")
ZSKIN = hexrgb("#a7b48f")

NECK = 0.25
TORSO = 2.15
UARM, FARM = 1.2, 1.15
THIGH, SHIN = 1.4, 1.35
HIP_H = THIGH + SHIN - 0.05          # высота таза при прямых ногах
SHOULDER = 0.28                      # плечи чуть ниже основания шеи


def stand(t=0.0, seed=0):
    br = math.sin(t * 1.6 + seed) * 0.03
    return dict(hip=(0.0, HIP_H), lean=0.0, f1=(0.3, 0.0), f2=(-0.25, 0.0), h1=(0.22, -2.3 + br),
                h2=(-0.08, -2.32 + br), head=(0.0, 0.0), tilt=0.0, face="neutral", look=(0.35, 0.0),
                blink=False, view="side", breath=br)


def blinking(t, seed=0):
    """Моргание раз в ~3.5 с."""
    period = 3.1 + (seed % 5) * 0.35
    return ((t + seed * 0.77) % period) < 0.13


def turn(t, t0, f0, f1, d=0.22):
    """Поворот на месте: сбоку f0 → фас → сбоку f1. → (f, view)."""
    if t < t0:
        return f0, "side"
    if t < t0 + d:
        return (f0 if t < t0 + d / 2 else f1), "front"
    return f1, "side"


def front(t=0.0, seed=0):
    p = stand(t, seed)
    p.update(view="front", f1=(0.45, 0.0), f2=(-0.45, 0.0), h1=(0.75, -2.45), h2=(-0.75, -2.45),
             look=(0.0, 0.0))
    return p


RUN_STRIDE = 4.3        # пройденный путь за цикл бега, в r (стопа в опоре не скользит)
WALK_STRIDE = 1.85

# траектория стопы за цикл: (u, x, подъём)
_RUN_FOOT = [(0.0, 0.75, 0.0), (0.35, -0.75, 0.0), (0.45, -0.85, 0.35), (0.58, -0.55, 1.05), (0.76, 0.3, 0.95),
             (0.9, 0.9, 0.35), (1.0, 0.75, 0.0)]
_WALK_FOOT = [(0.0, 0.55, 0.0), (0.6, -0.55, 0.0), (0.7, -0.45, 0.18), (0.82, 0.0, 0.3), (0.93, 0.45, 0.12),
              (1.0, 0.55, 0.0)]


def _track(tr, u):
    u %= 1.0
    for (u0, x0, y0), (u1, x1, y1) in zip(tr, tr[1:]):
        if u0 <= u <= u1:
            k = (u - u0) / (u1 - u0) if u1 > u0 else 0.0
            if y0 == 0.0 and y1 == 0.0:          # опора — линейно, без скольжения
                return lerp(x0, x1, k), 0.0
            k = 0.5 - 0.5 * math.cos(k * math.pi)
            return lerp(x0, x1, k), lerp(y0, y1, k)
    return tr[0][1], tr[0][2]


def gait(ph, run=False):
    """Шаг/бег: фаза ph в циклах. Возвращает поля позы (стопы, руки, таз, наклон).
    Чтобы стопы не скользили, фигура должна проходить STRIDE·r за цикл."""
    tr = _RUN_FOOT if run else _WALK_FOOT
    fx1, fy1 = _track(tr, ph)
    fx2, fy2 = _track(tr, ph + 0.5)
    a = ph * TAU
    if run:
        hip = HIP_H - 0.18 + 0.12 * math.cos(2 * a - 0.5 * math.pi)
        lean = 0.3
    else:
        hip = HIP_H - 0.06 + 0.05 * math.cos(2 * a)
        lean = 0.05
    sl = TORSO - SHOULDER
    sx, sy = math.sin(lean) * sl, hip + math.cos(lean) * sl
    hands = []
    for sgn in (-1, 1):                 # рука идёт в противофазе своей ноге
        w = sgn * math.cos(a - 0.3)
        if run:
            th, bend = 0.95 * w, 1.45
        else:
            th, bend = 0.38 * w, 0.22 + 0.12 * max(0.0, w)
        dx = UARM * math.sin(th) + FARM * math.sin(th + bend)
        dy = UARM * math.cos(th) + FARM * math.cos(th + bend)
        hands.append((sx + dx, -(sy - dy)))
    return dict(f1=(fx1, -fy1), f2=(fx2, -fy2), hip=(0.0, hip), lean=lean, h1=hands[0], h2=hands[1])


def _ik(ax, ay, bx, by, l1, l2, bend):
    """Двухзвенная ИК: от (ax, ay) к (bx, by); bend = ±1 — сторона сгиба."""
    dx, dy = bx - ax, by - ay
    d = math.hypot(dx, dy)
    d2 = min(d, l1 + l2 - 1e-4)
    if d < 1e-6:
        return ax, ay + l1
    cosa = clamp((l1 * l1 + d2 * d2 - l2 * l2) / (2 * l1 * d2), -1, 1)
    base = math.atan2(dy, dx)
    a = base + bend * math.acos(cosa)
    jx, jy = ax + math.cos(a) * l1, ay + math.sin(a) * l1
    if d > l1 + l2:
        k = (l1 + l2) / d
        return lerp(ax, ax + dx * k, l1 / (l1 + l2)), lerp(ay, ay + dy * k, l1 / (l1 + l2))
    return jx, jy


def joints(pose):
    """Суставы в единицах r (y вниз, пол — y = 0), без зеркала по f."""
    p = stand()
    p.update(pose)
    hx, hy = p["hip"]
    hy = -hy
    ln = p["lean"]
    nx, ny = hx + math.sin(ln) * TORSO, hy - math.cos(ln) * TORSO
    sx, sy = hx + math.sin(ln) * (TORSO - SHOULDER), hy - math.cos(ln) * (TORSO - SHOULDER)
    hdx, hdy = p["head"]
    cx = nx + math.sin(ln + p["tilt"] * 0.5) * (NECK + 1.0) + hdx
    cy = ny - math.cos(ln + p["tilt"] * 0.5) * (NECK + 1.0) + hdy
    J = dict(hip=(hx, hy), neck=(nx, ny), sh=(sx, sy), head=(cx, cy))
    for k, (tx, ty) in (("f1", p["f1"]), ("f2", p["f2"])):
        J[k] = (tx, ty)
        J["knee" + k[1]] = _ik(hx, hy, tx, ty, THIGH, SHIN, -1)
    for k, (tx, ty) in (("h1", p["h1"]), ("h2", p["h2"])):
        J[k] = (tx, ty)
        J["elb" + k[1]] = _ik(sx, sy, tx, ty, UARM, FARM, 1)
    return J, p


def world(x, gy, r, f, pt):
    return x + f * pt[0] * r, gy + pt[1] * r


# --- лицо ---------------------------------------------------------------------------------

def face(ctx, cx, cy, r, f, p, zombie=False, lw=None):
    lw = lw or max(1.5, r * 0.07)
    kind = p.get("face", "neutral")
    view = p.get("view", "side")
    lx, ly = p.get("look", (0.35, 0.0))
    if view == "front":
        lx = lx * 0.5
    ex = cx + f * lx * r * 0.35
    ey = cy + r * 0.02 + ly * r * 0.15
    sep = r * (0.36 if view == "front" else 0.3)
    eyes = [(ex - sep * 0.5 * (1 if view == "front" else 0.9), ey), (ex + sep * 0.5 * (1 if view == "front" else 1.1), ey)]
    blink = p.get("blink", False)
    big = kind in ("scared", "shock", "scream")
    if zombie:
        # разные глаза, тяжёлые веки, синяки; зрачки смотрят вразнобой
        for i, (x, y) in enumerate(eyes):
            er = r * (0.13 if i == 0 else 0.105)
            D.circle(ctx, x, y + r * 0.03, er * 1.55, hexrgb("#55604a"), None, 0, alpha=0.55)
            D.circle(ctx, x, y, er, hexrgb("#eef0dc"), INK, lw * 0.6)
            D.circle(ctx, x + f * r * 0.025 * (1 if i else -0.4), y + r * 0.02 * i, er * 0.32, INK, None, 0)
            ctx.save()
            ctx.arc(x, y, er, 0, TAU)
            ctx.clip()
            lid = er * (0.85 if i == 0 else 0.6)
            D.rect(ctx, x - er, y - er, er * 2, lid, hexrgb("#8f9c79"), None, 0, wob=0)
            ctx.restore()
            D.line(ctx, x - er, y - er + lid, x + er, y - er + lid + r * 0.015 * (1 - 2 * i), INK, lw * 0.7)
            D.circle(ctx, x, y, er, None, INK, lw * 0.6)
    elif blink or kind == "sleep":
        for (x, y) in eyes:
            D.line(ctx, x - r * 0.07, y, x + r * 0.07, y, INK, lw)
    elif big:
        for (x, y) in eyes:
            D.circle(ctx, x, y, r * 0.12, hexrgb("#ffffff"), INK, lw * 0.6)
            D.circle(ctx, x + f * lx * r * 0.03, y + ly * r * 0.03, r * 0.055, INK, None, 0)
    else:
        for (x, y) in eyes:
            D.ellipse(ctx, x, y, r * 0.055, r * 0.075, INK, None, 0)
    # брови
    bro = {"neutral": 0.0, "worried": 0.35, "scared": 0.45, "shock": 0.2, "sad": 0.4, "angry": -0.4,
           "happy": -0.05, "scream": 0.5, "determined": -0.25, "think": 0.15}.get(kind, 0.0)
    if not zombie and kind not in ("neutral", "happy", "sleep"):
        for i, (x, y) in enumerate(eyes):
            s = 1 if i == 0 else -1
            by = y - r * (0.22 if big else 0.18)
            D.line(ctx, x - r * 0.08, by + s * bro * r * 0.06, x + r * 0.08, by - s * bro * r * 0.06, INK, lw * 0.9)
    # рот
    mx, my = ex + f * r * 0.02, cy + r * 0.42
    if zombie:
        # отвисшая челюсть, неровный рот, пара зубов; шрам со швами на щеке
        mo = p.get("mouth", 0.5)
        hgt = r * (0.1 + 0.1 * mo)
        pts = [(mx - r * 0.17, my - r * 0.03), (mx - r * 0.05, my - r * 0.06), (mx + r * 0.16, my - r * 0.01),
               (mx + r * 0.12, my + hgt), (mx - r * 0.02, my + hgt * 1.15), (mx - r * 0.14, my + hgt * 0.8)]
        D.poly(ctx, pts, hexrgb("#2e1f22"), INK, lw * 0.7, wob=0)
        for tx in (-0.08, 0.06):
            D.rect(ctx, mx + tx * r, my - r * 0.045, r * 0.05, r * 0.06, hexrgb("#e8e2c8"), INK, lw * 0.3, wob=0)
        sx0, sy0 = cx - f * r * 0.55, cy + r * 0.05
        D.line(ctx, sx0, sy0 - r * 0.22, sx0 + f * r * 0.08, sy0 + r * 0.2, hexrgb("#5b3a3a"), lw * 0.6)
        for k in range(3):
            yy = sy0 - r * 0.12 + k * r * 0.13
            xx = sx0 + f * r * 0.025 * k
            D.line(ctx, xx - r * 0.06, yy, xx + r * 0.06, yy + r * 0.02, INK, lw * 0.45)
    elif kind in ("scream", "shock"):
        D.ellipse(ctx, mx, my, r * 0.09, r * 0.13 if kind == "scream" else r * 0.09, hexrgb("#3a2a2a"), INK, lw * 0.7)
    elif kind in ("happy",):
        D.curve(ctx, [(mx - r * 0.14, my - r * 0.03), (mx, my + r * 0.08), (mx + r * 0.14, my - r * 0.03)], INK, lw)
    elif kind in ("sad", "worried", "scared"):
        D.curve(ctx, [(mx - r * 0.12, my + r * 0.05), (mx, my - r * 0.03), (mx + r * 0.12, my + r * 0.05)], INK, lw)
    elif kind == "talk":
        D.ellipse(ctx, mx, my, r * 0.08, r * 0.05 + r * 0.04 * abs(math.sin(p.get("t", 0) * 14)), hexrgb("#3a2a2a"),
                  INK, lw * 0.6)
    else:
        D.line(ctx, mx - r * 0.09, my, mx + r * 0.09, my, INK, lw)
    if p.get("sweat"):
        for k, (dx, dy, s) in enumerate(((-0.85, -0.35, 1.0), (0.9, -0.15, 0.8))):
            sx, sy = cx + dx * r, cy + dy * r
            D.poly(ctx, [(sx, sy - r * 0.16 * s), (sx + r * 0.08 * s, sy), (sx, sy + r * 0.08 * s),
                         (sx - r * 0.08 * s, sy)], hexrgb("#9fd8ff"), INK, lw * 0.5, wob=0)


# --- головные уборы и одежда ------------------------------------------------------------------

def cap(ctx, cx, cy, r, f, color="#c8392f", lw=2.0, view="side"):
    """Бейсболка: купол на верхней трети головы, козырёк вперёд по f (или на зрителя в фас)."""
    c = hexrgb(color)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.move_to(-r * 0.95, -r * 0.36)
    ctx.curve_to(-r * 0.98, -r * 1.22, r * 0.98, -r * 1.22, r * 0.95, -r * 0.36)
    ctx.curve_to(r * 0.5, -r * 0.28, -r * 0.5, -r * 0.28, -r * 0.95, -r * 0.36)
    ctx.close_path()
    D.col(ctx, c)
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(lw)
    ctx.stroke()
    D.circle(ctx, 0, -r * 1.0, r * 0.07, shade(c, -0.15), INK, lw * 0.6)
    if view == "back":
        D.ellipse(ctx, 0, -r * 0.42, r * 0.22, r * 0.09, shade(c, -0.35), INK, lw * 0.6)
    elif view == "front":
        D.curve(ctx, [(0, -r * 0.98), (0, -r * 0.6), (0, -r * 0.33)], shade(c, -0.25), lw * 0.7)
        ctx.move_to(-r * 0.78, -r * 0.34)
        ctx.curve_to(-r * 0.6, -r * 0.08, r * 0.6, -r * 0.08, r * 0.78, -r * 0.34)
        ctx.curve_to(r * 0.4, -r * 0.26, -r * 0.4, -r * 0.26, -r * 0.78, -r * 0.34)
        ctx.close_path()
        D.col(ctx, shade(c, -0.12))
        ctx.fill_preserve()
        D.col(ctx, INK)
        ctx.set_line_width(lw)
        ctx.stroke()
    else:
        D.curve(ctx, [(-f * r * 0.15, -r * 0.98), (f * r * 0.1, -r * 0.62), (f * r * 0.2, -r * 0.32)], shade(c, -0.25),
                lw * 0.7)
        D.poly(ctx, [(f * r * 0.62, -r * 0.42), (f * r * 1.5, -r * 0.34), (f * r * 1.44, -r * 0.24),
                     (f * r * 0.6, -r * 0.3)], shade(c, -0.12), INK, lw, wob=0)
    ctx.restore()


def apron(ctx, J, x, gy, r, f, color="#3f7d4e", lw=2.0, tag=True):
    """Фартук работника магазина: от груди до середины бедра, с лямкой на шее."""
    nx, ny = world(x, gy, r, f, J["neck"])
    hx, hy = world(x, gy, r, f, J["hip"])
    ux, uy = (hx - nx), (hy - ny)
    L = math.hypot(ux, uy) or 1
    ux, uy = ux / L, uy / L
    px, py = -uy, ux
    top = (nx + ux * r * 0.55, ny + uy * r * 0.55)
    bot = (hx + ux * r * 0.85, hy + uy * r * 0.85)
    wt, wb = r * 0.42, r * 0.62
    pts = [(top[0] - px * wt, top[1] - py * wt), (top[0] + px * wt, top[1] + py * wt),
           (bot[0] + px * wb, bot[1] + py * wb), (bot[0] - px * wb, bot[1] - py * wb)]
    D.line(ctx, pts[0][0], pts[0][1], nx - px * r * 0.15, ny - py * r * 0.15, INK, lw * 0.8)
    D.line(ctx, pts[1][0], pts[1][1], nx + px * r * 0.15, ny + py * r * 0.15, INK, lw * 0.8)
    D.poly(ctx, pts, hexrgb(color), INK, lw, wob=0)
    # карман
    mx, my = (top[0] + bot[0]) / 2, (top[1] + bot[1]) / 2 + r * 0.15
    D.rect(ctx, mx - r * 0.25, my, r * 0.5, r * 0.28, shade(hexrgb(color), -0.12), INK, lw * 0.6, wob=0)
    if tag:
        D.rect(ctx, top[0] + px * r * 0.05 * f, top[1] + r * 0.12, r * 0.24, r * 0.12, hexrgb("#f3efe2"), INK, lw * 0.5,
               wob=0)


# --- фигура --------------------------------------------------------------------------------

def draw(ctx, x, gy, r, f, pose, look=None, alpha=1.0):
    """look: dict(skin, zombie, cap, apron, hair, glasses, tie, coat, bun, shadow)."""
    look = look or {}
    J, p = joints(pose)
    lw = max(2.0, r * 0.1)
    tint = look.get("tint")
    if alpha < 1 or tint:
        ctx.push_group()
    if look.get("shadow", True):
        D.ellipse(ctx, x, gy + r * 0.04, r * 1.1, r * 0.18, hexrgb("#000000"), None, 0, alpha=0.18)
    W_ = lambda k: world(x, gy, r, f, J[k])
    ink = INK

    def limb(a, b, c, w=lw):
        ax, ay = W_(a)
        bx, by = W_(b)
        cx_, cy_ = W_(c)
        ctx.set_line_cap(1)
        ctx.set_line_join(1)
        D.col(ctx, ink)
        ctx.set_line_width(w)
        ctx.move_to(ax, ay)
        ctx.line_to(bx, by)
        ctx.line_to(cx_, cy_)
        ctx.stroke()

    # дальние конечности (2), тело, ближние (1)
    limb("hip", "knee2", "f2")
    limb("sh", "elb2", "h2")
    if look.get("coat"):
        nx, ny = W_("neck")
        hx, hy = W_("hip")
        D.poly(ctx, [(nx - r * 0.45, ny + r * 0.2), (nx + r * 0.45, ny + r * 0.2), (hx + r * 0.7, hy + r * 1.0),
                     (hx - r * 0.7, hy + r * 1.0)], hexrgb(look["coat"]), INK, lw * 0.6, wob=0)
    hx, hy = W_("hip")
    nx, ny = W_("neck")
    D.line(ctx, hx, hy, nx, ny, ink, lw)
    if look.get("shirt"):
        ux, uy = hx - nx, hy - ny
        L = math.hypot(ux, uy) or 1
        ux, uy = ux / L, uy / L
        px, py = -uy, ux
        top = (nx + ux * r * 0.12, ny + uy * r * 0.12)
        pts = [(top[0] - px * r * 0.5, top[1] - py * r * 0.5), (top[0] + px * r * 0.5, top[1] + py * r * 0.5)]
        for k in range(7):
            u = k / 6
            w_ = r * (0.62 - 0.08 * math.sin(k * 2.3))
            dd = L + r * (0.35 + 0.22 * ((k * 37) % 3) / 2)
            pts.append((nx + ux * dd + px * w_ * (1 - 2 * u), ny + uy * dd + py * w_ * (1 - 2 * u)))
        D.poly(ctx, pts, hexrgb(look["shirt"]), INK, lw * 0.6, wob=0)
        D.line(ctx, top[0] + px * r * 0.1, top[1] + py * r * 0.1, top[0] + ux * r * 0.55, top[1] + uy * r * 0.55,
               shade(hexrgb(look["shirt"]), -0.3), lw * 0.4)
    if look.get("tie"):
        D.poly(ctx, [(nx, ny + r * 0.15), (nx + r * 0.1, ny + r * 0.35), (nx, ny + r * 1.1), (nx - r * 0.1, ny + r * 0.35)],
               hexrgb(look["tie"]), INK, lw * 0.4, wob=0)
    if look.get("apron") and p.get("view") != "back":
        apron(ctx, J, x, gy, r, f, look["apron"], lw * 0.55)
    elif look.get("apron"):
        # со спины видны только завязки фартука
        bx, by = W_("hip")
        bx, by = lerp(bx, nx, 0.25), lerp(by, ny, 0.25)
        c_ = hexrgb(look["apron"])
        for sgn in (-1, 1):
            D.ellipse(ctx, bx + sgn * r * 0.22, by, r * 0.2, r * 0.1, c_, INK, lw * 0.4, rot=sgn * 0.4)
            D.line(ctx, bx, by, bx + sgn * r * 0.12, by + r * 0.45, c_, lw * 0.9)
        D.circle(ctx, bx, by, r * 0.08, shade(c_, -0.15), INK, lw * 0.4)
        D.line(ctx, bx - r * 0.5, by, bx + r * 0.5, by, c_, lw * 0.7)
    # голова
    cx, cy = W_("head")
    D.line(ctx, nx, ny, cx - f * math.sin(p["lean"]) * r * 0.9, cy + r * 0.9, ink, lw)
    skin = hexrgb(look.get("skin", "#f6f3ec")) if isinstance(look.get("skin", "#f6f3ec"), str) else look["skin"]
    if look.get("bun"):
        D.circle(ctx, cx - f * r * 0.55, cy - r * 0.75, r * 0.38, hexrgb(look.get("hair", "#e6e3df")), INK, lw * 0.6)
    D.circle(ctx, cx, cy, r, skin, INK, lw * 0.95)
    # тень на голове (свет сверху-спереди)
    ctx.save()
    ctx.arc(cx, cy, r - lw * 0.3, 0, TAU)
    ctx.clip()
    D.circle(ctx, cx - f * r * 0.45, cy + r * 0.35, r * 0.9, shade(skin, -0.12), None, 0, alpha=0.35)
    ctx.restore()
    if look.get("hair"):
        ctx.save()
        ctx.arc(cx, cy, r - lw * 0.2, 0, TAU)
        ctx.clip()
        if p.get("view") == "back":
            D.ellipse(ctx, cx, cy - r * 0.35, r * 1.1, r * 0.95, hexrgb(look["hair"]), None, 0)
        else:
            D.ellipse(ctx, cx - f * r * 0.15, cy - r * 0.95, r * 1.05, r * 0.55, hexrgb(look["hair"]), None, 0)
        ctx.restore()
        D.circle(ctx, cx, cy, r, None, INK, lw * 0.95)
    if p.get("view") != "back":
        face(ctx, cx, cy, r, f, p, zombie=look.get("zombie", False), lw=lw * 0.55)
    if look.get("glasses") and p.get("view") != "back":
        lx = p.get("look", (0.35, 0))[0]
        ex = cx + f * lx * r * 0.35
        ey = cy + r * 0.02
        for dx in (-0.16, 0.18):
            D.circle(ctx, ex + dx * r, ey, r * 0.17, None, hexrgb(look["glasses"]), lw * 0.45)
        D.line(ctx, ex - r * 0.0, ey, ex + r * 0.02, ey, hexrgb(look["glasses"]), lw * 0.4)
    if look.get("cap"):
        cap(ctx, cx, cy, r, f, look["cap"], lw * 0.8, p.get("view", "side"))
    limb("hip", "knee1", "f1")
    limb("sh", "elb1", "h1")
    # кисти и стопы — маленькие закругления
    for k in ("h1", "h2"):
        hx_, hy_ = W_(k)
        D.circle(ctx, hx_, hy_, lw * 0.75, ink, None, 0)
    for k in ("f1", "f2"):
        fx_, fy_ = W_(k)
        D.line(ctx, fx_ - f * r * 0.05, fy_, fx_ + f * r * 0.3, fy_, ink, lw * 1.1)
    if tint:
        ctx.save()
        ctx.set_operator(cairo.OPERATOR_ATOP)
        D.col(ctx, hexrgb(tint[0]), tint[1])
        ctx.paint()
        ctx.restore()
    if alpha < 1 or tint:
        ctx.pop_group_to_source()
        ctx.paint_with_alpha(alpha)
    return J


HERO = dict(cap="#c8392f", apron="#3f7d4e")
DALE = dict(hair="#6b5a4a", tie="#2f4a8a")
RUTH = dict(hair="#e6e3df", bun=True, glasses="#7a3a8a", coat="#f4f6f8")
ZOMBIE = dict(skin="#a7b48f", zombie=True, shirt="#6f6a5c")
