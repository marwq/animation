"""Пиктограммы для второго ролика: грабитель, мебель спальни, кухня, полиция, интерфейсы."""
import math

import skia

from .core import (AMBER, BG, BLUE, DARK, DIM, GREEN, GREY, RED, SOFT, WHITE, capsule, clamp, color, draw_text,
                   ease_out, font, glow_circle, lerp, paint, path_from, rrect, xf)
from .picto import D2R, person_side

BEANIE = (58, 60, 66)
TORCH = (255, 236, 190)


def poses():
    """Готовые позы для person_side."""
    return {
        "stand": dict(),
        "listen": dict(armF=135, foreF=65, lean=-2, tilt=10),
        "phone": dict(armF=140, foreF=62, tilt=6),
        "type": dict(armF=-60, foreF=-55, armB=-50, foreB=-60, tilt=18, lean=6),
        "push": dict(lean=24, armF=-80, foreF=-10, armB=-75, foreB=-12, thighF=28, shinF=30, thighB=-22, shinB=10),
        "reach": dict(armF=-95, foreF=-5, lean=4),
        "crouch": dict(lean=30, thighF=70, shinF=120, thighB=60, shinB=115, armF=-40, foreF=-30, armB=-20,
                       foreB=-20, bob=0.2),
        "carry_bat": dict(armF=-150, foreF=40, armB=-60, foreB=-40),
    }


def person_sit_floor(c, x, y, s, col=WHITE, a=1.0, facing=1, phone=False, glow=0.0):
    """Человек сидит на полу, колени к груди, спиной к стене. (x, y) — точка на полу под тазом."""
    f = facing
    pf = paint(col, a)
    g = 0.012 * s
    hip = (x, y - 0.06 * s)
    sh = (x - f * 0.03 * s, y - 0.37 * s)
    knee = (x + f * 0.2 * s, y - 0.28 * s)
    foot = (x + f * 0.3 * s, y - 0.04 * s)
    capsule(c, hip[0], hip[1], knee[0], knee[1], 0.1 * s, pf, g)
    capsule(c, knee[0], knee[1], foot[0], foot[1], 0.1 * s, pf, g)
    capsule(c, hip[0], hip[1] - 0.02 * s, sh[0], sh[1], 0.17 * s, pf, g)
    hand = (x + f * 0.2 * s, y - 0.36 * s)
    elbow = (x + f * 0.1 * s, y - 0.22 * s)
    capsule(c, sh[0], sh[1] + 0.03 * s, elbow[0], elbow[1], 0.08 * s, pf, g)
    capsule(c, elbow[0], elbow[1], hand[0], hand[1], 0.08 * s, pf, g)
    hc = (sh[0] + f * 0.02 * s, sh[1] - 0.13 * s)
    c.drawCircle(hc[0], hc[1], 0.088 * s + g, paint(BG, a))
    c.drawCircle(hc[0], hc[1], 0.088 * s, pf)
    if phone:
        c.drawRRect(rrect(hand[0] - 0.03 * s, hand[1] - 0.07 * s, 0.06 * s, 0.1 * s, 0.01 * s), paint(DIM, a))
        if glow > 0:
            c.drawCircle(hc[0], hc[1], 0.2 * s, paint(BLUE, 0.25 * glow * a, blur=0.08 * s))
            c.drawRRect(rrect(hand[0] - 0.025 * s, hand[1] - 0.065 * s, 0.05 * s, 0.085 * s, 0.008 * s),
                        paint((160, 200, 255), glow * a))
    return {"head": hc, "hand": hand}


def burglar(c, x, y, s, pose=None, facing=1, a=1.0, torch=0.0, torch_ang=8.0, sack=True, col=SOFT,
            torch_len=2.2):
    """Грабитель: шапка, мешок, фонарик. Рисуется серым, чтобы отличаться от героя."""
    info = person_side(c, x, y, s, pose or {}, facing=facing, col=col, a=a)
    hx, hy = info["head"]
    f = facing
    # шапка
    cap = skia.Path()
    cap.addArc(skia.Rect.MakeXYWH(hx - 0.095 * s, hy - 0.11 * s, 0.19 * s, 0.19 * s), 180, 180)
    cap.close()
    c.drawPath(cap, paint(BEANIE, a))
    c.drawRRect(rrect(hx - 0.1 * s, hy - 0.035 * s, 0.2 * s, 0.035 * s, 0.01 * s), paint(BEANIE, a))
    c.drawCircle(hx, hy - 0.11 * s, 0.025 * s, paint(BEANIE, a))
    # маска на глазах
    c.drawRRect(rrect(hx - 0.02 * s + f * 0.01 * s, hy - 0.005 * s, 0.11 * s, 0.035 * s, 0.01 * s), paint(BG, a))
    if sack:
        sx, sy = info["shoulder"]
        bx = sx - f * 0.12 * s
        c.drawOval(skia.Rect.MakeXYWH(bx - 0.11 * s, sy - 0.02 * s, 0.22 * s, 0.26 * s), paint(GREY, a))
        c.drawLine(sx, sy, bx, sy + 0.02 * s, paint(GREY, a, stroke=0.03 * s))
    hx2, hy2 = info["hand"]
    if torch > 0:
        ang = torch_ang * D2R
        L = torch_len * s
        dx, dy = math.cos(ang) * f, math.sin(ang)
        ex, ey = hx2 + dx * L, hy2 + dy * L
        nx, ny = -dy, dx
        w = 0.42 * L
        cone = path_from([(hx2, hy2), (ex + nx * w, ey + ny * w), (ex - nx * w, ey - ny * w)], True)
        sh = skia.GradientShader.MakeLinear([skia.Point(hx2, hy2), skia.Point(ex, ey)],
                                            [color(TORCH, 0.45 * torch * a), color(TORCH, 0.0)])
        p = paint(TORCH, 1)
        p.setShader(sh)
        c.drawPath(cone, p)
        c.drawRRect(rrect(hx2 - 0.03 * s, hy2 - 0.02 * s, 0.07 * s, 0.04 * s, 0.01 * s), paint(DIM, a))
        glow_circle(c, hx2 + dx * 0.04 * s, hy2, 0.015 * s, TORCH, a * torch)
    return info


def dresser(c, x, y, s, col=WHITE, a=1.0):
    """Комод анфас/сбоку. y — пол, s — высота."""
    pf = paint(col, a)
    w = 0.9 * s
    c.drawRRect(rrect(x - w / 2, y - s, w, s - 0.06 * s, 0.03 * s), pf)
    for k in range(3):
        yy = y - s + 0.08 * s + k * 0.28 * s
        c.drawRRect(rrect(x - w / 2 + 0.06 * s, yy, w - 0.12 * s, 0.22 * s, 0.02 * s), paint(BG, a, stroke=0.02 * s))
        c.drawCircle(x, yy + 0.11 * s, 0.025 * s, paint(BG, a))
    c.drawRect(skia.Rect.MakeLTRB(x - w / 2 + 0.04 * s, y - 0.06 * s, x - w / 2 + 0.1 * s, y), pf)
    c.drawRect(skia.Rect.MakeLTRB(x + w / 2 - 0.1 * s, y - 0.06 * s, x + w / 2 - 0.04 * s, y), pf)


def chair_side(c, x, y, s, tilt=0.0, col=WHITE, a=1.0):
    """Стул сбоку (спинка слева). tilt — наклон в градусах вокруг задней ножки."""
    with xf(c, x, y, r=tilt):
        p = paint(col, a, stroke=0.07 * s)
        c.drawLine(-0.25 * s, 0, -0.25 * s, -s, p)
        c.drawLine(0.25 * s, 0, 0.25 * s, -0.5 * s, p)
        c.drawLine(-0.28 * s, -0.5 * s, 0.3 * s, -0.5 * s, paint(col, a, stroke=0.09 * s))
        c.drawLine(-0.25 * s, -0.78 * s, -0.25 * s, -0.98 * s, paint(col, a, stroke=0.14 * s))


def door_front(c, x, y, s, lock=0.0, handle_turn=0.0, col=WHITE, a=1.0, open_=0.0):
    """Дверь анфас с ручкой и замком. lock 0..1 — поворот защёлки."""
    w = 0.46 * s * (1 - 0.85 * open_)
    c.drawRect(skia.Rect.MakeLTRB(x - 0.25 * s, y - s - 0.03 * s, x + 0.25 * s, y), paint(col, a, stroke=0.025 * s))
    c.drawRect(skia.Rect.MakeLTRB(x - 0.23 * s, y - s, x - 0.23 * s + w, y), paint(col, a))
    for k in range(2):
        c.drawRRect(rrect(x - 0.19 * s, y - s + 0.08 * s + k * 0.46 * s, 0.38 * s * (1 - 0.85 * open_),
                          0.36 * s, 0.01 * s), paint(BG, a * 0.5, stroke=0.012 * s))
    if open_ < 0.5:
        hx, hy = x + 0.15 * s, y - 0.5 * s
        with xf(c, hx, hy, r=-30 * handle_turn):
            c.drawRRect(rrect(-0.1 * s, -0.016 * s, 0.11 * s, 0.032 * s, 0.015 * s), paint(BG, a))
        c.drawCircle(hx, hy, 0.028 * s, paint(BG, a))
        # защёлка
        with xf(c, hx, hy - 0.08 * s, r=90 * lock):
            c.drawCircle(0, 0, 0.022 * s, paint(BG, a))
            c.drawLine(-0.012 * s, 0, 0.012 * s, 0, paint(RED if lock > 0.5 else GREY, a, stroke=0.008 * s))


def closet(c, x, y, s, open_=0.0, col=WHITE, a=1.0, inside=None, t=0.0):
    """Шкаф анфас с двумя дверцами и верхней полкой. s — высота. inside(c) рисует содержимое."""
    w = 0.75 * s
    c.drawRect(skia.Rect.MakeLTRB(x - w / 2, y - s, x + w / 2, y), paint(col, a, stroke=0.025 * s))
    c.drawRect(skia.Rect.MakeLTRB(x - w / 2 + 0.02 * s, y - s + 0.02 * s, x + w / 2 - 0.02 * s, y - 0.02 * s),
               paint(DARK, a))
    # полка сверху
    c.drawLine(x - w / 2, y - 0.75 * s, x + w / 2, y - 0.75 * s, paint(col, a * 0.8, stroke=0.02 * s))
    c.drawLine(x - 0.3 * s, y - 0.68 * s, x + 0.3 * s, y - 0.68 * s, paint(GREY, a, stroke=0.012 * s))
    if inside:
        inside(c)
    dw = w / 2 * (1 - open_)
    c.drawRect(skia.Rect.MakeLTRB(x - w / 2, y - s, x - w / 2 + dw, y), paint(col, a))
    c.drawRect(skia.Rect.MakeLTRB(x + w / 2 - dw, y - s, x + w / 2, y), paint(col, a))
    if open_ < 0.2:
        c.drawLine(x, y - s, x, y, paint(BG, a, stroke=0.012 * s))
        c.drawCircle(x - 0.04 * s, y - 0.5 * s, 0.015 * s, paint(BG, a))
        c.drawCircle(x + 0.04 * s, y - 0.5 * s, 0.015 * s, paint(BG, a))


def fridge(c, x, y, s, open_=0.0, col=WHITE, a=1.0, light=0.0):
    """Холодильник анфас. open_ — дверца распахивается влево, изнутри свет."""
    w = 0.5 * s
    if light > 0:
        cone = path_from([(x - w / 2, y - s), (x + w / 2, y - s), (x + w / 2 + 0.9 * s, y), (x - w / 2 - 0.2 * s, y)], True)
        c.drawPath(cone, paint((210, 230, 255), 0.12 * light * a, blur=0.06 * s))
    c.drawRRect(rrect(x - w / 2, y - s, w, s - 0.03 * s, 0.04 * s), paint(col if open_ < 0.05 else (230, 240, 255), a))
    if open_ > 0.05:
        c.drawRRect(rrect(x - w / 2 + 0.03 * s, y - s + 0.03 * s, w - 0.06 * s, s - 0.1 * s, 0.03 * s),
                    paint((200, 220, 245), a))
        for k in range(3):
            c.drawLine(x - w / 2 + 0.04 * s, y - 0.75 * s + k * 0.22 * s, x + w / 2 - 0.04 * s,
                       y - 0.75 * s + k * 0.22 * s, paint(GREY, a, stroke=0.012 * s))
        dw = w * (1 - 0.7 * open_)
        c.drawRRect(rrect(x - w / 2 - dw * 0.9 * open_, y - s, dw, s - 0.03 * s, 0.04 * s), paint(col, a))
    else:
        c.drawLine(x - w / 2, y - 0.66 * s, x + w / 2, y - 0.66 * s, paint(BG, a, stroke=0.015 * s))
        c.drawLine(x + w / 2 - 0.06 * s, y - 0.9 * s, x + w / 2 - 0.06 * s, y - 0.75 * s, paint(BG, a, stroke=0.02 * s))
        c.drawLine(x + w / 2 - 0.06 * s, y - 0.58 * s, x + w / 2 - 0.06 * s, y - 0.4 * s, paint(BG, a, stroke=0.02 * s))


def tv(c, x, y, s, on=0.0, col=WHITE, a=1.0):
    """Телевизор на тумбе. y — пол, s — ширина."""
    c.drawRect(skia.Rect.MakeLTRB(x - 0.5 * s, y - 0.25 * s, x + 0.5 * s, y), paint(col, a))
    c.drawRRect(rrect(x - 0.5 * s, y - 0.85 * s, s, 0.56 * s, 0.03 * s), paint(col, a))
    c.drawRect(skia.Rect.MakeLTRB(x - 0.46 * s, y - 0.81 * s, x + 0.46 * s, y - 0.33 * s),
               paint((90, 120, 160) if on > 0.5 else BG, a))
    c.drawLine(x, y - 0.29 * s, x, y - 0.25 * s, paint(col, a, stroke=0.05 * s))


def laptop(c, x, y, s, col=WHITE, a=1.0, open_=1.0):
    c.drawRRect(rrect(x - 0.5 * s, y - 0.06 * s, s, 0.06 * s, 0.02 * s), paint(col, a))
    with xf(c, x - 0.45 * s, y - 0.06 * s, r=-90 * open_ + 0):
        c.drawRRect(rrect(0, -0.04 * s, 0.9 * s * 0.7, 0.04 * s, 0.01 * s), paint(col, a))


def bat(c, x, y, s, ang=0.0, col=(200, 160, 110), a=1.0):
    with xf(c, x, y, r=ang):
        p = skia.Path()
        p.moveTo(0, -0.02 * s)
        p.lineTo(0.55 * s, -0.035 * s)
        p.quadTo(s, -0.06 * s, s, 0)
        p.quadTo(s, 0.06 * s, 0.55 * s, 0.035 * s)
        p.lineTo(0, 0.02 * s)
        p.close()
        c.drawPath(p, paint(col, a))
        c.drawCircle(-0.01 * s, 0, 0.03 * s, paint(col, a))


def police_car(c, x, y, s, t=0.0, col=WHITE, a=1.0, lights=True):
    """Полицейская машина сбоку. s — длина."""
    pf = paint(col, a)
    body = skia.Path()
    body.moveTo(x - 0.5 * s, y - 0.08 * s)
    body.lineTo(x - 0.5 * s, y - 0.22 * s)
    body.lineTo(x - 0.3 * s, y - 0.25 * s)
    body.lineTo(x - 0.18 * s, y - 0.38 * s)
    body.lineTo(x + 0.18 * s, y - 0.38 * s)
    body.lineTo(x + 0.32 * s, y - 0.25 * s)
    body.lineTo(x + 0.5 * s, y - 0.22 * s)
    body.lineTo(x + 0.5 * s, y - 0.08 * s)
    body.close()
    c.drawPath(body, pf)
    c.drawRect(skia.Rect.MakeLTRB(x - 0.15 * s, y - 0.35 * s, x - 0.01 * s, y - 0.26 * s), paint(BG, a))
    c.drawRect(skia.Rect.MakeLTRB(x + 0.02 * s, y - 0.35 * s, x + 0.16 * s, y - 0.26 * s), paint(BG, a))
    c.drawRect(skia.Rect.MakeLTRB(x - 0.42 * s, y - 0.19 * s, x + 0.42 * s, y - 0.14 * s), paint(BLUE, a * 0.9))
    for wx in (-0.3, 0.3):
        c.drawCircle(x + wx * s, y - 0.08 * s, 0.085 * s, paint(BG, a))
        c.drawCircle(x + wx * s, y - 0.08 * s, 0.065 * s, pf)
    if lights:
        on = (t * 3) % 1 < 0.5
        c.drawRRect(rrect(x - 0.08 * s, y - 0.43 * s, 0.16 * s, 0.05 * s, 0.01 * s), paint(DIM, a))
        glow_circle(c, x - 0.045 * s, y - 0.405 * s, 0.022 * s, RED if on else (60, 60, 70), a, spread=3)
        glow_circle(c, x + 0.045 * s, y - 0.405 * s, 0.022 * s, BLUE if not on else (60, 60, 70), a, spread=3)


def keyfob(c, x, y, s, press=0.0, col=WHITE, a=1.0):
    c.drawRRect(rrect(x - 0.22 * s, y - 0.5 * s, 0.44 * s, 0.8 * s, 0.2 * s), paint(col, a))
    c.drawCircle(x, y - 0.25 * s, 0.1 * s, paint(DIM, a))
    c.drawCircle(x, y + 0.02 * s, 0.1 * s, paint(DIM, a))
    c.drawCircle(x, y + 0.2 * s, 0.1 * s * (1 - 0.15 * press), paint(RED, a))
    c.drawCircle(x, y - 0.6 * s, 0.07 * s, paint(col, a, stroke=0.03 * s))
    c.drawRRect(rrect(x - 0.06 * s, y - 0.95 * s, 0.12 * s, 0.38 * s, 0.03 * s), paint(GREY, a))


def cat(c, x, y, s, col=WHITE, a=1.0, sit=True, tail=0.0):
    """Кошка сидит боком. y — пол, s — высота."""
    pf = paint(col, a)
    c.drawOval(skia.Rect.MakeXYWH(x - 0.28 * s, y - 0.55 * s, 0.5 * s, 0.55 * s), pf)
    c.drawCircle(x + 0.12 * s, y - 0.7 * s, 0.17 * s, pf)
    for ex in (0.02, 0.2):
        c.drawPath(path_from([(x + ex * s - 0.06 * s, y - 0.8 * s), (x + ex * s, y - 0.98 * s),
                              (x + ex * s + 0.06 * s, y - 0.82 * s)], True), pf)
    tl = skia.Path()
    tl.moveTo(x - 0.25 * s, y - 0.05 * s)
    tl.quadTo(x - 0.55 * s, y - 0.05 * s, x - 0.5 * s - math.sin(tail) * 0.1 * s, y - 0.4 * s)
    c.drawPath(tl, paint(col, a, stroke=0.07 * s))
    c.drawCircle(x + 0.18 * s, y - 0.72 * s, 0.025 * s, paint(BG, a))


def milk(c, x, y, s, col=WHITE, a=1.0):
    c.drawPath(path_from([(x - 0.25 * s, y), (x - 0.25 * s, y - 0.75 * s), (x, y - s), (x + 0.25 * s, y - 0.75 * s),
                          (x + 0.25 * s, y)], True), paint(col, a))
    draw_text(c, "MILK", x, y - 0.3 * s, font(0.17 * s, "bold"), paint(BG, a), "center")


def plate(c, x, y, s, col=WHITE, a=1.0):
    c.drawOval(skia.Rect.MakeXYWH(x - 0.5 * s, y - 0.1 * s, s, 0.2 * s), paint(col, a))
    c.drawOval(skia.Rect.MakeXYWH(x - 0.32 * s, y - 0.06 * s, 0.64 * s, 0.12 * s), paint(BG, a * 0.4, stroke=0.02 * s))


def coin(c, x, y, s, col=AMBER, a=1.0, rot=0.0):
    c.drawOval(skia.Rect.MakeXYWH(x - 0.5 * s * abs(math.cos(rot)), y - 0.5 * s, s * abs(math.cos(rot)) + 1, s),
               paint(col, a))


def eyes_peek(c, x, y, s, a=1.0, blink_=1.0):
    """Два глаза в темноте (для «кого-то на полке»)."""
    for dx in (-0.5, 0.5):
        c.drawOval(skia.Rect.MakeXYWH(x + dx * s - 0.18 * s, y - 0.12 * s * blink_, 0.36 * s, 0.24 * s * blink_),
                   paint(WHITE, a))
        c.drawCircle(x + dx * s + 0.05 * s, y, 0.08 * s * blink_, paint(BG, a))


def dial_pad(c, x, y, w, pressed=None, typed="", col=WHITE, a=1.0, t=0.0):
    """Клавиатура телефона: pressed — нажатая клавиша (строка), typed — набранный номер."""
    f = font(w * 0.09, "bold")
    draw_text(c, typed, x, y - w * 0.62, font(w * 0.13, "bold"), paint(col, a), "center", tracking=6)
    keys = "123456789*0#"
    for i, k in enumerate(keys):
        cx = x + (i % 3 - 1) * w * 0.3
        cy = y - w * 0.36 + (i // 3) * w * 0.27
        on = pressed == k
        c.drawCircle(cx, cy, w * 0.11, paint(GREEN if on else DIM, a))
        draw_text(c, k, cx, cy + w * 0.032, f, paint(BG if on else col, a), "center")
