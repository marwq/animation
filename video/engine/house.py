"""Разрез двухэтажного дома: спальня и площадка сверху, кухня, гостиная и прихожая снизу, чердак.

Координаты экранные (дом занимает кадр целиком при камере по умолчанию). Сцены сажают героев
по точкам из SPOTS и включают свет в комнатах.
"""
import math

import skia

from . import picto as P
from . import picto2 as Q
from .core import AMBER, BG, DARK, DIM, GREY, RED, SOFT, WHITE, clamp, color, draw_text, font, lerp, paint, rrect

G, U, C, PEAK = 850, 610, 390, 205      # пол первого этажа, пол второго, потолок, конёк
X0, X1 = 250, 1670
WALL = 9

ROOMS = {
    "kitchen": (X0, U, 720, G), "living": (720, U, 1300, G), "hall": (1300, U, X1, G),
    "bedroom": (X0, C, 860, U), "landing": (860, C, 1390, U), "bath": (1390, C, X1, U),
    "attic": (X0, PEAK, X1, C),
}
STAIRS = ((1070, G), (1300, U))
BED_DOOR = (860, U)                      # дверь спальни в перегородке
SPOTS = {
    "bed": (430, U), "bedroom_floor": (330, U), "bed_door_in": (800, U), "bed_door_out": (920, U),
    "closet": (1050, U), "hatch": (1190, C), "landing": (1180, U), "stairs_bottom": (1060, G),
    "stairs_top": (1310, U), "fridge": (330, G), "table": (560, G), "back_door": (X0, G), "sofa": (950, G),
    "tv": (790, G), "front_door": (X1, G), "hall": (1480, G), "kitchen": (480, G),
}


def stairs_y(x):
    (x0, y0), (x1, y1) = STAIRS
    return lerp(y0, y1, clamp((x - x0) / (x1 - x0)))


def draw(c, t, light=None, a=1.0, bed_door=0.0, bed_locked=False, dresser_x=None, chair=False,
         fridge_open=0.0, back_locked=False, hatch=0.0, sleeper=False, moon=True, labels=0.0,
         closet_open=0.0, tv_on=0.0, stairs_hl=0.0):
    """Рисует дом. light — {комната: 0..1}, тёплая заливка. bed_door 0 — закрыта, 1 — открыта."""
    light = light or {}
    wp = paint(WHITE, a, stroke=WALL, cap="square")
    # комнаты
    for name, (x0, y0, x1, y1) in ROOMS.items():
        if name == "attic":
            continue
        L = light.get(name, 0.0)
        c.drawRect(skia.Rect.MakeLTRB(x0, y0, x1, y1), paint(DARK, a))
        if L > 0:
            c.drawRect(skia.Rect.MakeLTRB(x0, y0, x1, y1), paint((70, 58, 36), a * L))
    # крыша и чердак
    roof = skia.Path()
    roof.moveTo(X0 - 50, C)
    roof.lineTo((X0 + X1) / 2, PEAK)
    roof.lineTo(X1 + 50, C)
    roof.close()
    c.drawPath(roof, paint((14, 15, 17), a))
    if light.get("attic", 0) > 0:
        c.drawPath(roof, paint((60, 40, 30), a * light["attic"]))
    c.drawPath(roof, paint(WHITE, a, stroke=WALL, join="miter"))
    # окна
    if moon:
        P.window(c, 520, 470, 105, a=a)
    c.drawRect(skia.Rect.MakeXYWH(560, 665, 90, 70), paint(SOFT, a * 0.7, stroke=5))
    # мебель
    P.bed(c, 470, U, 330, sleeper=sleeper, zz=((t * 0.45) % 1 + 1e-3) if sleeper else 0, a=a)
    dx = dresser_x if dresser_x is not None else 700
    Q.dresser(c, dx, U, 115, a=a)
    if chair:
        Q.chair_side(c, 832, U, 95, tilt=-14, a=a)
    Q.closet(c, 1050, U, 175, open_=closet_open, a=a)
    c.drawRRect(rrect(1430, U - 60, 200, 60, 20), paint(WHITE, a))  # ванна
    c.drawRect(skia.Rect.MakeXYWH(1440, U - 140, 50, 70), paint(SOFT, a * 0.6, stroke=4))
    Q.fridge(c, 330, G, 175, open_=fridge_open, light=fridge_open, a=a)
    c.drawRect(skia.Rect.MakeLTRB(500, G - 85, 640, G - 75), paint(WHITE, a))  # стол
    c.drawRect(skia.Rect.MakeLTRB(510, G - 75, 520, G), paint(WHITE, a))
    c.drawRect(skia.Rect.MakeLTRB(620, G - 75, 630, G), paint(WHITE, a))
    Q.tv(c, 790, G, 115, on=tv_on, a=a)
    P.sofa(c, 945, G, 190, a=a)
    # лестница
    (sx0, sy0), (sx1, sy1) = STAIRS
    n = 10
    p = skia.Path()
    p.moveTo(sx0, sy0)
    for k in range(n):
        x = sx0 + (sx1 - sx0) * (k + 1) / n
        y_prev = sy0 + (sy1 - sy0) * k / n
        y = sy0 + (sy1 - sy0) * (k + 1) / n
        p.lineTo(sx0 + (sx1 - sx0) * k / n, y)
        p.lineTo(x, y)
    c.drawPath(p, paint(WHITE, a, stroke=6, join="miter"))
    if stairs_hl > 0:
        c.drawPath(p, paint(RED, a * stairs_hl, stroke=10, join="miter"))
    # стены и перекрытия
    c.drawLine(X0, C, X0, G, wp)
    c.drawLine(X1, C, X1, G, wp)
    c.drawLine(X0 - 20, G, X1 + 20, G, wp)
    c.drawLine(X0, C, X1, C, wp)
    c.drawLine(X0, U, 1240, U, wp)  # проём под лестницу
    c.drawLine(1300, U, X1, U, wp)
    c.drawLine(720, U, 720, G - 190, wp)
    c.drawLine(1300, U, 1300, G - 190, wp)
    c.drawLine(1390, C, 1390, U - 190, wp)
    # перегородка спальни с дверью
    c.drawLine(860, C, 860, U - 175, wp)
    dw = 175
    if bed_door < 0.98:
        c.drawRect(skia.Rect.MakeLTRB(855, U - dw * (1 - bed_door), 866, U), paint(WHITE, a))
        c.drawCircle(853, U - 85, 5, paint(RED if bed_locked else GREY, a))
    # люк на чердак
    c.drawLine(1150, C, 1150 + 80 * (1 - hatch), C + 0 * hatch, paint(BG, a, stroke=WALL + 2))
    c.drawLine(1150, C, 1150 + 80 * math.cos(hatch * 1.2), C + 80 * math.sin(hatch * 1.2), paint(SOFT, a, stroke=5))
    # задняя дверь кухни
    c.drawLine(X0, G - 175, X0, G, paint(BG, a, stroke=WALL + 2))
    c.drawRect(skia.Rect.MakeLTRB(X0 - 6, G - 175, X0 + 6, G), paint(SOFT, a))
    c.drawCircle(X0 + 14, G - 85, 5, paint(RED if back_locked else GREY, a))
    # входная дверь
    c.drawLine(X1, G - 185, X1, G, paint(BG, a, stroke=WALL + 2))
    c.drawRect(skia.Rect.MakeLTRB(X1 - 6, G - 185, X1 + 6, G), paint(SOFT, a))
    if labels > 0:
        f = font(16, "regular")
        for name, (x0, y0, x1, y1) in ROOMS.items():
            if name == "attic":
                continue
            draw_text(c, name.upper(), (x0 + x1) / 2, y0 + 28, f, paint(GREY, a * labels), "center", tracking=3)
        draw_text(c, "ATTIC", (X0 + X1) / 2, C - 28, f, paint(GREY, a * labels), "center", tracking=3)


def footprints(c, pts, t, t0, a=1.0, step=0.18, col=SOFT):
    """Следы вдоль ломаной pts: появляются по одному начиная с t0."""
    n = 0
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        seg = math.dist(pts[i], pts[i + 1])
        k = 0
        while k * 34 < seg:
            u = k * 34 / max(seg, 1)
            tt = t0 + n * step
            if t >= tt:
                al = a * clamp(1 - (t - tt) / 4.0) * 0.8 + a * 0.2
                x, y = lerp(x0, x1, u), lerp(y0, y1, u) - 4 - (n % 2) * 6
                c.drawOval(skia.Rect.MakeXYWH(x - 9, y - 4, 18, 8), paint(col, al))
            n += 1
            k += 1
