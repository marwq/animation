"""Библиотека пиктограмм: люди, пылесос, мебель, иконки.

Всё белое на чёрном, детали — «вырезы» цветом фона. Предметы на полу рисуются от точки
(x, y) = середина нижнего края; иконки — от центра. s — масштаб в пикселях.
"""
import math

import skia

from .core import (AMBER, BG, DIM, GREEN, GREY, RED, SOFT, WHITE, capsule, clamp, color,
                   draw_text, ease_out, font, glow_circle, lerp, paint, path_from, rrect, xf)

D2R = math.pi / 180


# ---------------------------------------------------------------- люди
def person_front(c, x, y, s, arms=(8, 8), legs=(4, 4), col=WHITE, a=1.0, gap=True,
                 head_dy=0.0, hands_up=0.0):
    """Человечек анфас (как на табличках). arms/legs — углы от вертикали, градусы
    (положительные — от тела наружу)."""
    g = 0.012 * s if gap else 0
    pf = paint(col, a)
    lw, aw = 0.105 * s, 0.085 * s
    # ноги
    for side, ang in ((-1, legs[0]), (1, legs[1])):
        hx, hy = x + side * 0.058 * s, y - 0.47 * s
        fx = hx + side * math.sin(ang * D2R) * 0.42 * s
        fy = hy + math.cos(ang * D2R) * 0.42 * s
        capsule(c, hx, hy, fx, fy, lw, pf, g)
    # туловище
    body = rrect(x - 0.135 * s, y - 0.81 * s, 0.27 * s, 0.37 * s, 0.07 * s)
    if g:
        c.drawRRect(body.makeOffset(0, 0), paint(BG, stroke=2 * g))
    c.drawRRect(body, pf)
    # руки
    for side, ang in ((-1, arms[0]), (1, arms[1])):
        sx, sy = x + side * 0.185 * s, y - 0.76 * s
        ang2 = lerp(ang, 165, hands_up)
        hx = sx + side * math.sin(ang2 * D2R) * 0.33 * s
        hy = sy + math.cos(ang2 * D2R) * 0.33 * s
        capsule(c, sx, sy, hx, hy, aw, pf, g)
    # голова
    hy = y - 0.935 * s + head_dy * s
    if g:
        c.drawCircle(x, hy, 0.088 * s + g, paint(BG))
    c.drawCircle(x, hy, 0.088 * s, pf)


WALK = dict(lean=4, tilt=0, thighF=0, shinF=6, thighB=0, shinB=6, armF=0, foreF=12, armB=0,
            foreB=12, bob=0.0)


def walk_pose(phase, stride=1.0, carry=False):
    p = dict(WALK)
    sn = math.sin(phase)
    p["thighF"] = 26 * sn * stride
    p["thighB"] = -26 * sn * stride
    p["shinF"] = 8 + 38 * max(0.0, math.sin(phase + 1.9)) * stride
    p["shinB"] = 8 + 38 * max(0.0, math.sin(phase + 1.9 + math.pi)) * stride
    p["armF"] = -24 * sn * stride
    p["armB"] = 24 * sn * stride
    p["bob"] = -0.014 * abs(math.cos(phase)) * stride
    if carry:
        p.update(armF=-62, foreF=70, armB=-55, foreB=72, lean=8)
    return p


def person_side(c, x, y, s, pose=None, facing=1, col=WHITE, a=1.0, gap=True, back_col=None):
    """Человечек в профиль с суставами. pose — словарь углов (см. WALK)."""
    p = dict(WALK)
    if pose:
        p.update(pose)
    f = facing
    g = 0.012 * s if gap else 0
    pf = paint(col, a)
    pb = paint(back_col or col, a)
    lw, aw = 0.1 * s, 0.08 * s
    hip = (x, y - 0.5 * s + p["bob"] * s)
    lean = p["lean"] * D2R
    sh = (hip[0] + math.sin(lean) * f * 0.31 * s, hip[1] - math.cos(lean) * 0.31 * s)

    def leg(th, sb, pnt):
        t = th * D2R
        k = (hip[0] + math.sin(t) * f * 0.235 * s, hip[1] + math.cos(t) * 0.235 * s)
        t2 = (th - sb) * D2R
        ft = (k[0] + math.sin(t2) * f * 0.235 * s, k[1] + math.cos(t2) * 0.235 * s)
        capsule(c, hip[0], hip[1], k[0], k[1], lw, pnt, g)
        capsule(c, k[0], k[1], ft[0], ft[1], lw, pnt, g)
        # стопа
        capsule(c, ft[0], ft[1], ft[0] + f * 0.05 * s, ft[1], lw * 0.8, pnt, 0)

    def arm(ua, fa, pnt):
        base = (sh[0] - f * 0.01 * s, sh[1] + 0.035 * s)
        t = ua * D2R
        e = (base[0] + math.sin(t) * f * 0.165 * s, base[1] + math.cos(t) * 0.165 * s)
        t2 = (ua + fa) * D2R
        h = (e[0] + math.sin(t2) * f * 0.155 * s, e[1] + math.cos(t2) * 0.155 * s)
        capsule(c, base[0], base[1], e[0], e[1], aw, pnt, g)
        capsule(c, e[0], e[1], h[0], h[1], aw, pnt, g)
        return h

    arm(p["armB"], p["foreB"], pb)
    leg(p["thighB"], p["shinB"], pb)
    capsule(c, hip[0], hip[1] - 0.02 * s, sh[0], sh[1] + 0.03 * s, 0.17 * s, pf, g)
    leg(p["thighF"], p["shinF"], pf)
    hand = arm(p["armF"], p["foreF"], pf)
    ht = (p["lean"] + p["tilt"]) * D2R
    hc = (sh[0] + math.sin(ht) * f * 0.135 * s, sh[1] - math.cos(ht) * 0.135 * s)
    if g:
        c.drawCircle(hc[0], hc[1], 0.088 * s + g, paint(BG))
    c.drawCircle(hc[0], hc[1], 0.088 * s, pf)
    return {"hand": hand, "head": hc, "hip": hip, "shoulder": sh}


def bust(c, x, y, s, kind="plain", col=WHITE, a=1.0, tie=True, bar=True, look=0.0):
    """Погрудный значок (голова и плечи). y — низ значка, s — высота."""
    pf = paint(col, a)
    # плечи
    sh = skia.Path()
    w = 0.5 * s
    top = y - 0.46 * s
    sh.moveTo(x - w, y)
    sh.lineTo(x - w, top + 0.16 * s)
    sh.quadTo(x - w, top, x - w + 0.16 * s, top)
    sh.lineTo(x + w - 0.16 * s, top)
    sh.quadTo(x + w, top, x + w, top + 0.16 * s)
    sh.lineTo(x + w, y)
    sh.close()
    hr = 0.24 * s
    hy = y - 0.73 * s
    if kind == "woman":
        hair = skia.Path()
        hair.addRRect(rrect(x - hr * 1.25, hy - hr * 1.18, hr * 2.5, hr * 2.55, hr * 0.95))
        c.drawPath(hair, pf)
    c.drawPath(sh, pf)
    if kind == "agent" and tie:
        # воротник и галстук — вырезами
        v = path_from([(x - 0.15 * s, top - 0.01 * s), (x, top + 0.22 * s), (x + 0.15 * s, top - 0.01 * s)], True)
        c.drawPath(v, paint(BG, a))
        tp = path_from([(x - 0.035 * s, top + 0.02 * s), (x + 0.035 * s, top + 0.02 * s),
                        (x + 0.05 * s, top + 0.3 * s), (x, top + 0.38 * s),
                        (x - 0.05 * s, top + 0.3 * s)], True)
        c.drawPath(tp, paint(DIM if col == WHITE else BG, a))
    # шея-разрыв
    c.drawCircle(x, hy, hr + 0.035 * s, paint(BG, a))
    c.drawCircle(x, hy, hr, pf)
    if kind == "agent" and bar:
        # чёрная полоса цензуры на глазах
        c.drawRRect(rrect(x - hr * 1.18 + look * 6, hy - hr * 0.3, hr * 2.36, hr * 0.42, 3), paint(BG, a))
    if kind == "firefighter":
        hp = skia.Path()
        hp.addArc(skia.Rect.MakeXYWH(x - hr * 1.05, hy - hr * 1.15, hr * 2.1, hr * 2.0), 180, 180)
        hp.close()
        c.drawPath(hp, paint(RED, a))
        c.drawRRect(rrect(x - hr * 1.45, hy - hr * 0.22, hr * 2.9, hr * 0.26, hr * 0.1), paint(RED, a))
        c.drawRRect(rrect(x - hr * 0.22, hy - hr * 1.0, hr * 0.44, hr * 0.5, 3), paint(AMBER, a))


def person_lying(c, x, y, s, col=WHITE, a=1.0):
    """Человек лежит на спине, голова слева. (x, y) — затылок на полу, s — рост."""
    pf = paint(col, a)
    g = 0.012 * s
    hr = 0.085 * s
    hx, hy = x + hr, y - hr - 0.005 * s
    capsule(c, x + 0.42 * s, y - 0.055 * s, x + 0.93 * s, y - 0.05 * s, 0.1 * s, pf, g)
    capsule(c, x + 0.95 * s, y - 0.05 * s, x + 0.96 * s, y - 0.14 * s, 0.08 * s, pf, g)
    capsule(c, x + 0.23 * s, y - 0.085 * s, x + 0.46 * s, y - 0.085 * s, 0.17 * s, pf, g)
    capsule(c, x + 0.25 * s, y - 0.12 * s, x + 0.52 * s, y - 0.1 * s, 0.075 * s, pf, g)
    c.drawCircle(hx, hy, hr + g, paint(BG, a))
    c.drawCircle(hx, hy, hr, pf)
    return {"head": (hx, hy)}


# ---------------------------------------------------------------- пылесос
def vacuum_side(c, x, y, s, led=GREEN, led_a=1.0, col=WHITE, a=1.0, sticker=False, speaker=False,
                lens=False):
    """Робот-пылесос сбоку, смотрит вправо. s — ширина."""
    pf = paint(col, a)
    c.drawCircle(x - 0.3 * s, y - 0.035 * s, 0.035 * s, pf)
    c.drawCircle(x + 0.3 * s, y - 0.035 * s, 0.035 * s, pf)
    c.drawRRect(rrect(x - 0.5 * s, y - 0.25 * s, s, 0.2 * s, 0.075 * s), paint(BG, a))
    c.drawRRect(rrect(x - 0.5 * s, y - 0.245 * s, s, 0.19 * s, 0.07 * s), pf)
    # башенка лидара
    c.drawRRect(rrect(x - 0.12 * s, y - 0.335 * s, 0.27 * s, 0.1 * s, 0.03 * s), pf)
    c.drawLine(x - 0.12 * s, y - 0.245 * s, x + 0.15 * s, y - 0.245 * s, paint(BG, a, stroke=0.016 * s))
    # бампер
    c.drawLine(x + 0.22 * s, y - 0.245 * s, x + 0.22 * s, y - 0.055 * s, paint(BG, a, stroke=0.014 * s))
    c.drawLine(x - 0.48 * s, y - 0.135 * s, x + 0.2 * s, y - 0.135 * s, paint(BG, a * 0.6, stroke=0.008 * s))
    if speaker:
        for i in range(4):
            c.drawCircle(x - 0.32 * s + i * 0.05 * s, y - 0.19 * s, 0.012 * s, paint(BG, a))
    if sticker:
        c.drawRRect(rrect(x - 0.4 * s, y - 0.225 * s, 0.38 * s, 0.07 * s, 0.01 * s), paint(AMBER, a))
        c.drawCircle(x - 0.37 * s, y - 0.19 * s, 0.014 * s, paint(RED, a))
        f = font(0.03 * s)
        draw_text(c, "VIDEO RECORDING", x - 0.345 * s, y - 0.18 * s, f, paint(BG, a))
    if lens:
        c.drawCircle(x + 0.36 * s, y - 0.15 * s, 0.05 * s, paint(BG, a))
        c.drawCircle(x + 0.36 * s, y - 0.15 * s, 0.028 * s, paint(DIM, a))
    # индикатор
    c.drawCircle(x + 0.36 * s, y - 0.195 * s if lens else y - 0.17 * s, 0.03 * s, paint(BG, a))
    if led_a > 0:
        glow_circle(c, x + 0.36 * s, y - 0.195 * s if lens else y - 0.17 * s, 0.018 * s, led, a * led_a)
    return {"lidar": (x + 0.15 * s, y - 0.29 * s), "led": (x + 0.36 * s, y - 0.17 * s),
            "front": (x + 0.5 * s, y - 0.1 * s), "nozzle": (x + 0.1 * s, y - 0.01 * s)}


def vacuum_top(c, x, y, s, rot=0.0, turret=0.0, led=GREEN, led_a=1.0, brush=0.0, col=WHITE, a=1.0):
    """Пылесос сверху. rot — куда смотрит (градусы, 0 = вправо), turret — поворот лидара."""
    r = s / 2
    with xf(c, x, y, r=rot):
        pf = paint(col, a)
        # боковая щётка
        bx, by = 0.5 * r, -0.62 * r
        for k in range(3):
            ang = (brush * 360 + k * 120) * D2R
            c.drawLine(bx, by, bx + math.cos(ang) * 0.42 * r, by + math.sin(ang) * 0.42 * r,
                       paint(SOFT, a * 0.9, stroke=0.045 * r))
        c.drawCircle(0, 0, r + 0.05 * r, paint(BG, a))
        c.drawCircle(0, 0, r, pf)
        # бампер
        arc = skia.Path()
        arc.addArc(skia.Rect.MakeXYWH(-0.84 * r, -0.84 * r, 1.68 * r, 1.68 * r), -70, 140)
        c.drawPath(arc, paint(BG, a, stroke=0.05 * r, cap="butt"))
        # кнопка и башня
        c.drawCircle(-0.42 * r, 0, 0.1 * r, paint(BG, a, stroke=0.035 * r))
        c.drawCircle(0.05 * r, 0, 0.3 * r, paint(BG, a))
        c.drawCircle(0.05 * r, 0, 0.25 * r, pf)
        ta = turret * D2R
        c.drawLine(0.05 * r, 0, 0.05 * r + math.cos(ta) * 0.25 * r, math.sin(ta) * 0.25 * r,
                   paint(BG, a, stroke=0.06 * r))
        if led_a > 0:
            glow_circle(c, 0.72 * r, 0, 0.055 * r, led, a * led_a)
    return {"turret": (x + math.cos(rot * D2R) * 0.05 * r, y + math.sin(rot * D2R) * 0.05 * r)}


def dock(c, x, y, s, cut=False, fill=0.0, bag_dy=0.0, col=WHITE, a=1.0, bag_a=1.0):
    """Станция самоочистки сбоку. s — высота. cut — разрез с мешком внутри."""
    pf = paint(col, a)
    c.drawPath(path_from([(x - 0.32 * s, y), (x + 0.75 * s, y), (x + 0.75 * s, y - 0.02 * s),
                          (x + 0.3 * s, y - 0.07 * s), (x - 0.32 * s, y - 0.07 * s)], True), pf)
    c.drawRRect(rrect(x - 0.34 * s, y - s, 0.62 * s, s - 0.09 * s, 0.07 * s), pf)
    c.drawLine(x - 0.34 * s, y - 0.86 * s, x + 0.28 * s, y - 0.86 * s, paint(BG, a, stroke=0.018 * s))
    glow_circle(c, x - 0.03 * s, y - 0.93 * s, 0.017 * s, GREEN, a * 0.9)
    info = {"inlet": (x + 0.2 * s, y - 0.05 * s), "bag": None}
    if cut:
        win = rrect(x - 0.26 * s, y - 0.8 * s, 0.46 * s, 0.6 * s, 0.04 * s)
        c.drawRRect(win, paint(BG, a))
        # мешок
        bx, by = x - 0.03 * s, y - 0.5 * s + bag_dy
        bag = rrect(bx - 0.17 * s, by - 0.24 * s, 0.34 * s, 0.46 * s, 0.05 * s)
        c.drawRRect(bag, paint(SOFT, a * bag_a, stroke=0.012 * s))
        if fill > 0:
            h = 0.44 * s * clamp(fill)
            c.save()
            c.clipRRect(bag)
            c.drawRect(skia.Rect.MakeXYWH(bx - 0.17 * s, by + 0.22 * s - h, 0.34 * s, h), paint(GREY, a * bag_a))
            c.restore()
        info["bag"] = (bx, by)
    return info


# ---------------------------------------------------------------- мебель
def bed(c, x, y, s, sleeper=True, sit=0.0, second=False, col=WHITE, a=1.0, head_col=None, zz=0.0):
    """Кровать сбоку, изголовье слева. s — длина. sit — 0 лежит, 1 сидит."""
    pf = paint(col, a)
    g = paint(BG, a)
    # ножки, рама, изголовье, изножье
    c.drawRect(skia.Rect.MakeLTRB(x - 0.5 * s, y - 0.1 * s, x - 0.46 * s, y), pf)
    c.drawRect(skia.Rect.MakeLTRB(x + 0.46 * s, y - 0.1 * s, x + 0.5 * s, y), pf)
    c.drawRRect(rrect(x - 0.5 * s, y - 0.56 * s, 0.045 * s, 0.5 * s, 0.018 * s), pf)
    c.drawRRect(rrect(x + 0.455 * s, y - 0.34 * s, 0.045 * s, 0.28 * s, 0.018 * s), pf)
    c.drawRect(skia.Rect.MakeLTRB(x - 0.47 * s, y - 0.17 * s, x + 0.47 * s, y - 0.1 * s), pf)
    c.drawRect(skia.Rect.MakeLTRB(x - 0.445 * s, y - 0.25 * s, x + 0.445 * s, y - 0.185 * s), pf)
    # подушка
    c.drawRRect(rrect(x - 0.43 * s, y - 0.305 * s, 0.15 * s, 0.065 * s, 0.03 * s), pf)
    info = {"head": None, "floor_y": y}
    if not sleeper:
        return info
    hc = head_col or col
    if second:
        c.drawCircle(x - 0.32 * s, y - 0.355 * s, 0.05 * s + 0.012 * s, g)
        c.drawCircle(x - 0.32 * s, y - 0.355 * s, 0.05 * s, paint(SOFT, a))
    hip = (x - 0.08 * s, y - 0.29 * s)
    tl = 0.2 * s
    # плечо: при sit=0 лежит влево от бедра, при sit=1 вертикально над ним
    th = lerp(180, 95, ease_out(sit)) * D2R
    shoulder = (hip[0] + math.cos(th) * tl, hip[1] - math.sin(th) * tl)
    head = (hip[0] + math.cos(th) * (tl + 0.085 * s), hip[1] - math.sin(th) * (tl + 0.085 * s))
    if sit > 0.02:
        capsule(c, hip[0], hip[1], shoulder[0], shoulder[1], 0.09 * s, pf, 0.006 * s)
    # одеяло
    bl = skia.Path()
    left = lerp(x - 0.29 * s, hip[0] - 0.03 * s, ease_out(sit))
    bl.moveTo(left, y - 0.245 * s)
    bl.lineTo(left, y - 0.33 * s)
    bl.quadTo(left + 0.02 * s, y - 0.38 * s, left + 0.1 * s, y - 0.385 * s)
    bl.lineTo(x + 0.2 * s, y - 0.385 * s)
    bl.quadTo(x + 0.32 * s, y - 0.4 * s, x + 0.38 * s, y - 0.36 * s)
    bl.quadTo(x + 0.44 * s, y - 0.33 * s, x + 0.445 * s, y - 0.28 * s)
    bl.lineTo(x + 0.445 * s, y - 0.245 * s)
    bl.close()
    c.drawPath(bl, paint(BG, a, stroke=0.016 * s))
    c.drawPath(bl, pf)
    c.drawCircle(head[0], head[1], 0.06 * s + 0.012 * s, g)
    c.drawCircle(head[0], head[1], 0.06 * s, paint(hc, a))
    info["head"] = head
    if zz > 0:
        f = font(0.05 * s)
        for k in range(3):
            ph = (zz + k / 3) % 1
            draw_text(c, "z", head[0] + 0.04 * s + ph * 0.08 * s, head[1] - 0.08 * s - ph * 0.14 * s,
                      font(0.035 * s + ph * 0.025 * s), paint(SOFT, a * math.sin(ph * math.pi)))
    return info


def window(c, x, y, s, moon=True, sun=False, col=WHITE, a=1.0, glow=0.0):
    """Окно с луной. (x, y) — центр, s — ширина."""
    pf = paint(col, a, stroke=0.06 * s)
    if moon:
        mx, my, mr = x + 0.14 * s, y - 0.14 * s, 0.11 * s
        c.drawCircle(mx, my, mr * 2.6, paint(AMBER, 0.08 * a * (1 + glow), blur=mr * 1.5))
        c.drawCircle(mx, my, mr, paint(AMBER, a))
        c.drawCircle(mx + mr * 0.5, my - mr * 0.35, mr * 0.88, paint(BG, a))
    if sun:
        c.drawCircle(x + 0.14 * s, y - 0.14 * s, 0.09 * s, paint(AMBER, a))
    c.drawRect(skia.Rect.MakeXYWH(x - 0.47 * s, y - 0.47 * s, 0.94 * s, 0.94 * s), pf)
    c.drawLine(x, y - 0.47 * s, x, y + 0.47 * s, paint(col, a, stroke=0.045 * s))
    c.drawLine(x - 0.47 * s, y, x + 0.47 * s, y, paint(col, a, stroke=0.045 * s))
    c.drawRRect(rrect(x - 0.6 * s, y + 0.47 * s, 1.2 * s, 0.07 * s, 0.03 * s), paint(col, a))


def lamp(c, x, y, s, on=0.0, col=WHITE, a=1.0):
    """Тумбочка с лампой. y — пол, s — высота."""
    pf = paint(col, a)
    c.drawRRect(rrect(x - 0.3 * s, y - 0.42 * s, 0.6 * s, 0.4 * s, 0.03 * s), pf)
    c.drawLine(x - 0.3 * s, y - 0.22 * s, x + 0.3 * s, y - 0.22 * s, paint(BG, a, stroke=0.02 * s))
    c.drawCircle(x, y - 0.32 * s, 0.025 * s, paint(BG, a))
    c.drawRect(skia.Rect.MakeLTRB(x - 0.25 * s, y - 0.02 * s, x - 0.2 * s, y), pf)
    c.drawRect(skia.Rect.MakeLTRB(x + 0.2 * s, y - 0.02 * s, x + 0.25 * s, y), pf)
    c.drawRRect(rrect(x - 0.08 * s, y - 0.47 * s, 0.16 * s, 0.05 * s, 0.02 * s), pf)
    c.drawLine(x, y - 0.47 * s, x, y - 0.68 * s, paint(col, a, stroke=0.03 * s))
    if on > 0:
        cone = path_from([(x - 0.17 * s, y - 0.66 * s), (x + 0.17 * s, y - 0.66 * s),
                          (x + 0.7 * s, y - 0.0 * s), (x - 0.7 * s, y - 0.0 * s)], True)
        c.drawPath(cone, paint(AMBER, 0.12 * on * a, blur=0.06 * s))
        c.drawCircle(x, y - 0.68 * s, 0.18 * s, paint(AMBER, 0.5 * on * a, blur=0.08 * s))
    c.drawPath(path_from([(x - 0.12 * s, y - 0.86 * s), (x + 0.12 * s, y - 0.86 * s),
                          (x + 0.19 * s, y - 0.66 * s), (x - 0.19 * s, y - 0.66 * s)], True),
               paint(AMBER if on > 0.5 else col, a))


def sofa(c, x, y, s, col=WHITE, a=1.0):
    """Диван анфас. s — ширина."""
    pf = paint(col, a)
    c.drawRRect(rrect(x - 0.42 * s, y - 0.55 * s, 0.84 * s, 0.32 * s, 0.06 * s), pf)
    c.drawRRect(rrect(x - 0.5 * s, y - 0.36 * s, 0.16 * s, 0.3 * s, 0.05 * s), pf)
    c.drawRRect(rrect(x + 0.34 * s, y - 0.36 * s, 0.16 * s, 0.3 * s, 0.05 * s), pf)
    c.drawRRect(rrect(x - 0.36 * s, y - 0.24 * s, 0.72 * s, 0.16 * s, 0.04 * s), paint(BG, a, stroke=0.02 * s))
    c.drawRRect(rrect(x - 0.36 * s, y - 0.24 * s, 0.72 * s, 0.16 * s, 0.04 * s), pf)
    c.drawLine(x, y - 0.24 * s, x, y - 0.08 * s, paint(BG, a, stroke=0.015 * s))
    c.drawRect(skia.Rect.MakeLTRB(x - 0.45 * s, y - 0.07 * s, x - 0.4 * s, y), pf)
    c.drawRect(skia.Rect.MakeLTRB(x + 0.4 * s, y - 0.07 * s, x + 0.45 * s, y), pf)


def door(c, x, y, s, open_=0.0, col=WHITE, a=1.0):
    """Дверь анфас. y — пол, s — высота."""
    pf = paint(col, a)
    w = 0.45 * s * (1 - 0.8 * open_)
    c.drawRect(skia.Rect.MakeLTRB(x - 0.225 * s, y - s, x - 0.225 * s + w, y), pf)
    c.drawCircle(x - 0.225 * s + w - 0.06 * s, y - 0.48 * s, 0.022 * s, paint(BG, a))


def trash_bin(c, x, y, s, shake=0.0, t=0.0, col=WHITE, a=1.0):
    """Мусорное ведро. s — высота. shake — амплитуда дрожи."""
    dx = math.sin(t * 90) * shake * 0.02 * s
    pf = paint(col, a)
    c.drawPath(path_from([(x - 0.32 * s + dx, y - 0.86 * s), (x + 0.32 * s + dx, y - 0.86 * s),
                          (x + 0.25 * s + dx, y), (x - 0.25 * s + dx, y)], True), pf)
    c.drawRRect(rrect(x - 0.38 * s + dx * 1.5, y - s, 0.76 * s, 0.1 * s, 0.03 * s), pf)
    c.drawRRect(rrect(x - 0.08 * s + dx * 1.5, y - 1.06 * s, 0.16 * s, 0.07 * s, 0.03 * s), pf)
    for k in (-1, 0, 1):
        c.drawLine(x + k * 0.13 * s + dx, y - 0.72 * s, x + k * 0.1 * s + dx, y - 0.14 * s,
                   paint(BG, a, stroke=0.04 * s))


def phone(c, x, y, w, h, col=WHITE, a=1.0, screen=BG):
    """Телефон по центру (x, y). Возвращает прямоугольник экрана."""
    c.drawRRect(rrect(x - w / 2, y - h / 2, w, h, w * 0.14), paint(col, a))
    sr = skia.Rect.MakeXYWH(x - w / 2 + w * 0.06, y - h / 2 + w * 0.12, w * 0.88, h - w * 0.24)
    c.drawRRect(skia.RRect.MakeRectXY(sr, w * 0.06, w * 0.06), paint(screen, a))
    c.drawRRect(rrect(x - w * 0.12, y - h / 2 + w * 0.045, w * 0.24, w * 0.035, w * 0.02), paint(BG, a))
    return sr


def dog_side(c, x, y, s, run=None, col=WHITE, a=1.0, facing=-1):
    """Собака сбоку. s — длина тела. run — фаза бега или None (стоит)."""
    pf = paint(col, a)
    f = facing
    bob = 0.0 if run is None else -abs(math.sin(run)) * 0.04 * s
    by = y - 0.42 * s + bob
    lw = 0.075 * s
    # лапы
    for k, (lx, ph) in enumerate(((-0.28, 0), (-0.2, 2.2), (0.24, math.pi), (0.32, math.pi + 2.2))):
        ang = 0 if run is None else math.sin(run + ph) * 35
        hx = x + f * lx * s
        fx = hx + f * math.sin(ang * D2R) * 0.33 * s
        fy = by + math.cos(ang * D2R) * 0.33 * s
        capsule(c, hx, by, fx, min(fy, y - 0.02 * s), lw, pf, 0.008 * s if k % 2 else 0)
    c.drawRRect(rrect(x - 0.38 * s, by - 0.13 * s, 0.76 * s, 0.24 * s, 0.11 * s), pf)
    # хвост
    tl = skia.Path()
    tl.moveTo(x - f * 0.36 * s, by - 0.06 * s)
    tl.quadTo(x - f * 0.5 * s, by - 0.12 * s, x - f * 0.52 * s, by - 0.3 * s + (0 if run is None else math.sin(run * 2) * 0.04 * s))
    c.drawPath(tl, paint(col, a, stroke=0.06 * s))
    # голова
    hx, hy = x + f * 0.45 * s, by - 0.24 * s
    c.drawLine(x + f * 0.3 * s, by - 0.05 * s, hx, hy, paint(col, a, stroke=0.16 * s))
    c.drawCircle(hx, hy, 0.13 * s, pf)
    c.drawRRect(rrect(hx + (f * 0.04 - 0.0) * s - (0.2 * s if f < 0 else 0), hy - 0.03 * s, 0.2 * s, 0.11 * s, 0.05 * s), pf)
    c.drawPath(path_from([(hx - f * 0.08 * s, hy - 0.08 * s), (hx - f * 0.02 * s, hy - 0.26 * s),
                          (hx + f * 0.05 * s, hy - 0.09 * s)], True), pf)
    c.drawCircle(hx + f * 0.06 * s, hy - 0.03 * s, 0.022 * s, paint(BG, a))
    c.drawCircle(hx + f * 0.27 * s, hy + 0.0 * s, 0.03 * s, paint(BG, a))


def poop(c, x, y, s, col=(150, 106, 72), a=1.0):
    """Кучка (собачья «ошибка»). y — низ, s — ширина."""
    pf = paint(col, a)
    c.drawRRect(rrect(x - 0.5 * s, y - 0.3 * s, s, 0.3 * s, 0.15 * s), pf)
    c.drawRRect(rrect(x - 0.36 * s, y - 0.52 * s, 0.72 * s, 0.26 * s, 0.13 * s), pf)
    c.drawRRect(rrect(x - 0.22 * s, y - 0.7 * s, 0.44 * s, 0.22 * s, 0.11 * s), pf)
    c.drawPath(path_from([(x - 0.1 * s, y - 0.66 * s), (x + 0.12 * s, y - 0.66 * s), (x + 0.04 * s, y - 0.86 * s)], True), pf)
    for k, yy in enumerate((0.27, 0.49)):
        c.drawLine(x - (0.36 - k * 0.14) * s, y - yy * s, x + (0.36 - k * 0.14) * s, y - yy * s,
                   paint(BG, a * 0.6, stroke=0.025 * s))


def sock(c, x, y, s, col=WHITE, a=1.0):
    """Носок, лежащий на полу. s — длина."""
    p = skia.Path()
    p.moveTo(x - 0.5 * s, y - 0.5 * s)
    p.lineTo(x - 0.15 * s, y - 0.5 * s)
    p.lineTo(x - 0.15 * s, y - 0.25 * s)
    p.lineTo(x + 0.35 * s, y - 0.25 * s)
    p.quadTo(x + 0.5 * s, y - 0.25 * s, x + 0.5 * s, y - 0.125 * s)
    p.quadTo(x + 0.5 * s, y, x + 0.35 * s, y)
    p.lineTo(x - 0.35 * s, y)
    p.quadTo(x - 0.5 * s, y, x - 0.5 * s, y - 0.15 * s)
    p.close()
    c.drawPath(p, paint(col, a))
    c.drawLine(x - 0.5 * s, y - 0.4 * s, x - 0.15 * s, y - 0.4 * s, paint(BG, a, stroke=0.035 * s))
    c.drawLine(x + 0.25 * s, y - 0.25 * s, x + 0.25 * s, y, paint(BG, a, stroke=0.03 * s))


def cable(c, x, y, s, col=WHITE, a=1.0):
    """Свёрнутый провод с вилкой. s — ширина."""
    pc = paint(col, a, stroke=0.06 * s)
    for k in range(3):
        c.drawOval(skia.Rect.MakeXYWH(x - 0.42 * s + k * 0.06 * s, y - 0.34 * s + k * 0.02 * s,
                                      0.6 * s, 0.3 * s), pc)
    p = skia.Path()
    p.moveTo(x + 0.15 * s, y - 0.06 * s)
    p.quadTo(x + 0.35 * s, y, x + 0.42 * s, y - 0.12 * s)
    c.drawPath(p, pc)
    c.drawRRect(rrect(x + 0.38 * s, y - 0.24 * s, 0.14 * s, 0.14 * s, 0.03 * s), paint(col, a))
    c.drawLine(x + 0.52 * s, y - 0.21 * s, x + 0.58 * s, y - 0.21 * s, paint(col, a, stroke=0.03 * s))
    c.drawLine(x + 0.52 * s, y - 0.13 * s, x + 0.58 * s, y - 0.13 * s, paint(col, a, stroke=0.03 * s))


def house(c, x, y, s, col=WHITE, a=1.0, door_=True, win=True, light=0.0):
    """Домик анфас. y — низ, s — ширина."""
    pf = paint(col, a)
    c.drawPath(path_from([(x - 0.42 * s, y), (x - 0.42 * s, y - 0.5 * s), (x, y - 0.86 * s),
                          (x + 0.42 * s, y - 0.5 * s), (x + 0.42 * s, y)], True), pf)
    c.drawPath(path_from([(x - 0.56 * s, y - 0.46 * s), (x, y - 0.94 * s), (x + 0.56 * s, y - 0.46 * s)]),
               paint(BG, a, stroke=0.05 * s, join="miter"))
    if door_:
        c.drawRRect(rrect(x - 0.09 * s, y - 0.3 * s, 0.18 * s, 0.3 * s, 0.02 * s), paint(BG, a))
    if win:
        wc = AMBER if light > 0.5 else BG
        c.drawRect(skia.Rect.MakeXYWH(x - 0.32 * s, y - 0.45 * s, 0.14 * s, 0.14 * s), paint(wc, a))
        c.drawRect(skia.Rect.MakeXYWH(x + 0.18 * s, y - 0.45 * s, 0.14 * s, 0.14 * s), paint(wc, a))


def garage(c, x, y, s, door_open=0.0, col=WHITE, a=1.0):
    """Гараж с подъёмной дверью. y — низ, s — ширина."""
    pf = paint(col, a)
    c.drawPath(path_from([(x - 0.5 * s, y), (x - 0.5 * s, y - 0.55 * s), (x, y - 0.8 * s),
                          (x + 0.5 * s, y - 0.55 * s), (x + 0.5 * s, y)], True), pf)
    dh = 0.42 * s
    c.drawRect(skia.Rect.MakeLTRB(x - 0.36 * s, y - dh, x + 0.36 * s, y), paint(BG, a))
    shown = dh * (1 - clamp(door_open))
    c.drawRect(skia.Rect.MakeLTRB(x - 0.34 * s, y - dh + 0.02 * s, x + 0.34 * s, y - dh + 0.02 * s + shown), pf)
    k = 1
    while k * 0.07 * s < shown:
        c.drawLine(x - 0.34 * s, y - dh + 0.02 * s + k * 0.07 * s, x + 0.34 * s, y - dh + 0.02 * s + k * 0.07 * s,
                   paint(BG, a, stroke=0.012 * s))
        k += 1


def toilet(c, x, y, s, col=WHITE, a=1.0):
    """Унитаз сбоку. y — пол, s — высота."""
    pf = paint(col, a)
    c.drawRRect(rrect(x - 0.38 * s, y - s, 0.2 * s, 0.5 * s, 0.03 * s), pf)
    p = skia.Path()
    p.moveTo(x - 0.2 * s, y - 0.5 * s)
    p.lineTo(x + 0.38 * s, y - 0.5 * s)
    p.quadTo(x + 0.38 * s, y - 0.2 * s, x + 0.05 * s, y - 0.2 * s)
    p.lineTo(x + 0.05 * s, y)
    p.lineTo(x - 0.2 * s, y)
    p.close()
    c.drawPath(p, pf)
    c.drawLine(x - 0.2 * s, y - 0.53 * s, x + 0.4 * s, y - 0.53 * s, paint(BG, a, stroke=0.025 * s))


def building(c, x, y, s, col=WHITE, a=1.0, label=None):
    """Офисное здание. y — низ, s — высота."""
    pf = paint(col, a)
    c.drawRect(skia.Rect.MakeLTRB(x - 0.25 * s, y - s, x + 0.25 * s, y), pf)
    for r in range(6):
        for k in range(3):
            c.drawRect(skia.Rect.MakeXYWH(x - 0.18 * s + k * 0.13 * s, y - 0.9 * s + r * 0.13 * s,
                                          0.08 * s, 0.07 * s), paint(BG, a))
    c.drawRect(skia.Rect.MakeXYWH(x - 0.06 * s, y - 0.13 * s, 0.12 * s, 0.13 * s), paint(BG, a))
    if label:
        f = font(0.12 * s)
        draw_text(c, label, x, y + 0.17 * s, f, paint(SOFT, a), "center")


# ---------------------------------------------------------------- иконки
def check(c, x, y, s, prog_=1.0, a=1.0, ring=True, col=GREEN):
    if ring:
        c.drawCircle(x, y, s * 0.5 * ease_out(min(1, prog_ * 2)), paint(col, a))
    k = clamp(prog_ * 1.6 - 0.5)
    if k <= 0:
        return
    pts = [(x - 0.22 * s, y + 0.0 * s), (x - 0.06 * s, y + 0.16 * s), (x + 0.25 * s, y - 0.16 * s)]
    p = skia.Path()
    p.moveTo(*pts[0])
    if k < 0.35:
        t = k / 0.35
        p.lineTo(lerp(pts[0][0], pts[1][0], t), lerp(pts[0][1], pts[1][1], t))
    else:
        p.lineTo(*pts[1])
        t = (k - 0.35) / 0.65
        p.lineTo(lerp(pts[1][0], pts[2][0], t), lerp(pts[1][1], pts[2][1], t))
    c.drawPath(p, paint(WHITE if ring else col, a, stroke=0.1 * s))


def cross(c, x, y, s, prog_=1.0, a=1.0, col=RED, width=None):
    """Красный крест, рисуется двумя штрихами."""
    w = width or 0.09 * s
    k1, k2 = clamp(prog_ * 2), clamp(prog_ * 2 - 1)
    gl = paint(col, 0.5 * a, stroke=w * 2.2, blur=w * 0.8)
    pc = paint(col, a, stroke=w)
    if k1 > 0:
        x1, y1, x2, y2 = x - s / 2, y - s / 2, x - s / 2 + s * k1, y - s / 2 + s * k1
        c.drawLine(x1, y1, x2, y2, gl)
        c.drawLine(x1, y1, x2, y2, pc)
    if k2 > 0:
        x1, y1, x2, y2 = x + s / 2, y - s / 2, x + s / 2 - s * k2, y - s / 2 + s * k2
        c.drawLine(x1, y1, x2, y2, gl)
        c.drawLine(x1, y1, x2, y2, pc)


def warn(c, x, y, s, a=1.0, col=AMBER):
    p = path_from([(x, y - 0.5 * s), (x + 0.55 * s, y + 0.45 * s), (x - 0.55 * s, y + 0.45 * s)], True)
    c.drawPath(p, paint(col, a, stroke=0.09 * s))
    c.drawLine(x, y - 0.12 * s, x, y + 0.16 * s, paint(col, a, stroke=0.09 * s))
    c.drawCircle(x, y + 0.32 * s, 0.055 * s, paint(col, a))


def eye(c, x, y, s, open_=1.0, look=(0.0, 0.0), col=WHITE, a=1.0, iris=None):
    """Глаз. s — ширина."""
    h = 0.32 * s * clamp(open_)
    p = skia.Path()
    p.moveTo(x - 0.5 * s, y)
    p.quadTo(x, y - h * 2, x + 0.5 * s, y)
    p.quadTo(x, y + h * 2, x - 0.5 * s, y)
    p.close()
    c.drawPath(p, paint(col, a, stroke=0.06 * s))
    if open_ > 0.15:
        c.save()
        c.clipPath(p, doAntiAlias=True)
        c.drawCircle(x + look[0] * 0.2 * s, y + look[1] * 0.1 * s, 0.17 * s, paint(iris or col, a))
        c.drawCircle(x + look[0] * 0.2 * s, y + look[1] * 0.1 * s, 0.07 * s, paint(BG, a))
        c.restore()


def mic(c, x, y, s, col=WHITE, a=1.0):
    c.drawRRect(rrect(x - 0.16 * s, y - 0.5 * s, 0.32 * s, 0.56 * s, 0.16 * s), paint(col, a))
    arc = skia.Path()
    arc.addArc(skia.Rect.MakeXYWH(x - 0.28 * s, y - 0.2 * s, 0.56 * s, 0.5 * s), 0, 180)
    c.drawPath(arc, paint(col, a, stroke=0.06 * s))
    c.drawLine(x, y + 0.3 * s, x, y + 0.45 * s, paint(col, a, stroke=0.06 * s))
    c.drawLine(x - 0.15 * s, y + 0.46 * s, x + 0.15 * s, y + 0.46 * s, paint(col, a, stroke=0.06 * s))


def speaker_icon(c, x, y, s, waves=1.0, col=WHITE, a=1.0):
    c.drawPath(path_from([(x - 0.4 * s, y - 0.14 * s), (x - 0.2 * s, y - 0.14 * s), (x, y - 0.34 * s),
                          (x, y + 0.34 * s), (x - 0.2 * s, y + 0.14 * s), (x - 0.4 * s, y + 0.14 * s)], True),
               paint(col, a))
    for k in range(3):
        if waves * 3 > k:
            arc = skia.Path()
            r = 0.16 * s + k * 0.13 * s
            arc.addArc(skia.Rect.MakeXYWH(x - r + 0.05 * s, y - r, 2 * r, 2 * r), -45, 90)
            c.drawPath(arc, paint(col, a * clamp(waves * 3 - k), stroke=0.06 * s))


def sun(c, x, y, s, col=AMBER, a=1.0, rot=0.0):
    c.drawCircle(x, y, 0.22 * s, paint(col, a))
    for k in range(8):
        ang = (rot + k * 45) * D2R
        c.drawLine(x + math.cos(ang) * 0.32 * s, y + math.sin(ang) * 0.32 * s,
                   x + math.cos(ang) * 0.46 * s, y + math.sin(ang) * 0.46 * s, paint(col, a, stroke=0.07 * s))


def lock(c, x, y, s, col=WHITE, a=1.0):
    arc = skia.Path()
    arc.addArc(skia.Rect.MakeXYWH(x - 0.2 * s, y - 0.45 * s, 0.4 * s, 0.45 * s), 180, 180)
    c.drawPath(arc, paint(col, a, stroke=0.08 * s))
    c.drawLine(x - 0.2 * s, y - 0.22 * s, x - 0.2 * s, y - 0.05 * s, paint(col, a, stroke=0.08 * s))
    c.drawLine(x + 0.2 * s, y - 0.22 * s, x + 0.2 * s, y - 0.05 * s, paint(col, a, stroke=0.08 * s))
    c.drawRRect(rrect(x - 0.32 * s, y - 0.08 * s, 0.64 * s, 0.5 * s, 0.06 * s), paint(col, a))
    c.drawCircle(x, y + 0.14 * s, 0.06 * s, paint(BG, a))


def bubble(c, x, y, w, h, tail=(-0.3, 1), col=WHITE, a=1.0, fill=False, stroke=5.0):
    """Облачко реплики по центру (x, y). tail — (смещение по x в долях w, 1 = вниз / -1 = вверх)."""
    r = min(h * 0.5, 28)
    tx = x + tail[0] * w
    ty = y + tail[1] * h / 2
    p = skia.Path()
    p.addRRect(rrect(x - w / 2, y - h / 2, w, h, r))
    t = path_from([(tx - 16, ty - tail[1] * 4), (tx + 14, ty - tail[1] * 4), (tx - 22, ty + tail[1] * 30)], True)
    p = skia.Op(p, t, skia.PathOp.kUnion_PathOp) or p
    if fill:
        c.drawPath(p, paint(col, a))
    else:
        c.drawPath(p, paint(BG, a))
        c.drawPath(p, paint(col, a, stroke=stroke))


def hair_strand(c, x, y, s, col=WHITE, a=1.0, wave=0.0):
    p = skia.Path()
    p.moveTo(x, y)
    p.cubicTo(x + 0.3 * s, y - 0.3 * s + wave, x + 0.6 * s, y + 0.3 * s - wave, x + s, y)
    c.drawPath(p, paint(col, a, stroke=0.03 * s))


def fingernail(c, x, y, s, col=WHITE, a=1.0):
    p = skia.Path()
    p.addArc(skia.Rect.MakeXYWH(x - 0.5 * s, y - 0.3 * s, s, 0.6 * s), 200, 140)
    c.drawPath(p, paint(col, a, stroke=0.14 * s))


def fire_truck(c, x, y, s, t=0.0, col=WHITE, a=1.0):
    """Пожарная машина сбоку, едет влево. s — длина."""
    pf = paint(RED, a)
    c.drawRRect(rrect(x - 0.5 * s, y - 0.34 * s, 0.7 * s, 0.26 * s, 0.03 * s), pf)
    c.drawPath(path_from([(x + 0.2 * s, y - 0.08 * s), (x + 0.2 * s, y - 0.34 * s), (x + 0.36 * s, y - 0.34 * s),
                          (x + 0.5 * s, y - 0.2 * s), (x + 0.5 * s, y - 0.08 * s)], True), pf)
    c.drawRect(skia.Rect.MakeLTRB(x + 0.25 * s, y - 0.3 * s, x + 0.36 * s, y - 0.2 * s), paint(BG, a))
    c.drawLine(x - 0.45 * s, y - 0.4 * s, x + 0.15 * s, y - 0.4 * s, paint(col, a, stroke=0.025 * s))
    for k in range(7):
        xx = x - 0.43 * s + k * 0.09 * s
        c.drawLine(xx, y - 0.43 * s, xx, y - 0.37 * s, paint(col, a, stroke=0.015 * s))
    for wx in (-0.32, 0.32):
        c.drawCircle(x + wx * s, y - 0.07 * s, 0.075 * s, paint(BG, a))
        c.drawCircle(x + wx * s, y - 0.07 * s, 0.06 * s, paint(col, a))
    blue = (60, 120, 255)
    on = (t * 4) % 1 < 0.5
    glow_circle(c, x + 0.3 * s, y - 0.37 * s, 0.025 * s, RED if on else blue, a)


def logo(c, x, y, s, t=0.0, reveal=0.0, a=1.0, ring_text=True):
    """Эмблема агентства: двойное кольцо, дом, внутри у пола — круглый «глаз».
    reveal: 0 — глаз, 1 — видно, что это пылесос сверху (красный огонёк)."""
    r = s / 2
    c.drawCircle(x, y, r, paint(WHITE, a, stroke=0.035 * s))
    c.drawCircle(x, y, r * 0.86, paint(WHITE, a * 0.5, stroke=0.012 * s))
    if ring_text:
        f = font(0.068 * s)
        txt = "OFFICE OF DOMESTIC CONTINUITY \u2022 " * 2
        n = len(txt)
        for i, ch in enumerate(txt):
            ang = -90 + i * 360 / n + t * 3
            with xf(c, x + math.cos(ang * D2R) * r * 0.93, y + math.sin(ang * D2R) * r * 0.93, r=ang + 90):
                draw_text(c, ch, 0, 0.024 * s, f, paint(SOFT, a), "center")
    # дом
    hs = r * 1.0
    c.drawPath(path_from([(x - 0.42 * hs, y + 0.42 * hs), (x - 0.42 * hs, y - 0.05 * hs), (x, y - 0.42 * hs),
                          (x + 0.42 * hs, y - 0.05 * hs), (x + 0.42 * hs, y + 0.42 * hs)], True),
               paint(WHITE, a, stroke=0.03 * s, join="miter"))
    # «глаз» у пола
    ex, ey = x, y + 0.22 * hs
    er = 0.15 * hs
    if reveal < 0.5:
        k = 1 - reveal * 2
        p = skia.Path()
        p.moveTo(ex - er * 1.5, ey)
        p.quadTo(ex, ey - er * 1.3 * k, ex + er * 1.5, ey)
        p.quadTo(ex, ey + er * 1.3 * k, ex - er * 1.5, ey)
        c.drawPath(p, paint(WHITE, a))
        c.drawCircle(ex, ey, er * 0.45 * k, paint(BG, a))
    else:
        k = (reveal - 0.5) * 2
        c.drawCircle(ex, ey, er * lerp(0.6, 1.0, k), paint(WHITE, a))
        c.drawCircle(ex - er * 0.05, ey, er * 0.38, paint(BG, a))
        c.drawCircle(ex - er * 0.05, ey, er * 0.3, paint(WHITE, a))
        glow_circle(c, ex + er * 0.72, ey, er * 0.12, RED, a * k)
