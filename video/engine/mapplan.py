"""План квартиры сверху: стены, двери, мебель, лидарное «проявление» точками.

Координаты плана — условные единицы 0..100 × 0..60; на экран переводятся через MapView.
"""
import math

import numpy as np
import skia

from .core import BG, DIM, GREY, RED, SOFT, WHITE, clamp, color, draw_text, font, paint

# стены: отрезки (x1, y1, x2, y2); проёмы уже вырезаны
WALLS = [
    (0, 0, 100, 0), (100, 0, 100, 60), (100, 60, 0, 60), (0, 60, 0, 0),
    # линия y=28 (верхний ряд комнат / коридор)
    (0, 28, 29, 28), (37, 28, 46, 28), (53, 28, 63, 28), (77, 28, 100, 28),
    # линия y=34 (коридор / нижний ряд)
    (0, 34, 18, 34), (40, 34, 79, 34), (87, 34, 100, 34),
    # перегородки
    (40, 0, 40, 28), (58, 0, 58, 28), (70, 34, 70, 60),
]
DOORS = [  # (петля x, y, радиус, начальный угол, размах)
    (29, 28, 8, -90, 90), (46, 28, 7, -90, 90), (79, 34, 8, 180, 90),
]
ROOMS = {
    "BEDROOM": (20, 14), "BATH": (49, 14), "KITCHEN": (79, 14),
    "HALL": (50, 31), "LIVING ROOM": (35, 47), "GARAGE": (85, 47),
}
ROOM_RECTS = {
    "BEDROOM": (0, 0, 40, 28), "BATH": (40, 0, 58, 28), "KITCHEN": (58, 0, 100, 28),
    "HALL": (0, 28, 100, 34), "LIVING ROOM": (0, 34, 70, 60), "GARAGE": (70, 34, 100, 60),
}
# мебель: прямоугольники (x, y, w, h)
FURNITURE = [
    (3, 3, 17, 13),      # кровать
    (3, 3, 4, 13),       # изголовье
    (21, 3, 4, 4),       # тумбочка
    (30, 2, 8, 6),       # шкаф
    (42, 2, 14, 7),      # ванна
    (43, 20, 5, 6),      # унитаз
    (60, 2, 38, 6),      # столешница
    (92, 8, 6, 18),      # столешница угол
    (70, 14, 12, 8),     # стол
    (4, 50, 28, 8),      # диван
    (12, 40, 12, 6),     # журнальный столик
    (50, 36, 18, 3),     # тумба ТВ
    (74, 38, 22, 18),    # машина
]
BED = (3, 3, 17, 13)
SHAPE = (22, 9)          # «фигура», вокруг которой пылесос убирает 400 раз
DOCK = (60, 31)          # станция в коридоре

# маршрут уборки (лидарное сканирование)
PATH = [
    (60, 31), (50, 31), (34, 31), (33, 24), (33, 18), (26, 20), (22, 22), (12, 23), (6, 22),
    (8, 18), (26, 16), (34, 12), (34, 4), (26, 10), (30, 25), (33, 31), (20, 31), (12, 31),
    (14, 38), (8, 44), (20, 48), (40, 44), (48, 40), (64, 42), (60, 52), (40, 56), (36, 40),
    (44, 31), (50, 31), (50, 22), (50, 12), (52, 24), (54, 31), (70, 31), (70, 24), (66, 12),
    (84, 12), (88, 22), (76, 24), (70, 31), (84, 31), (84, 40), (90, 50), (80, 54), (84, 36),
    (84, 31), (62, 31),
]
HEAT = [(22, 10, 1.0), (75, 9, 0.9), (16, 46, 0.8), (52, 24, 0.6), (95, 16, 0.5)]


def _seg_cross(p, q, a, b):
    """Пересекаются ли отрезки p→q (массивы) со стеной a→b."""
    def orient(px, py, qx, qy, rx, ry):
        return (qx - px) * (ry - py) - (qy - py) * (rx - px)
    o1 = orient(p[:, 0], p[:, 1], q[:, 0], q[:, 1], a[0], a[1])
    o2 = orient(p[:, 0], p[:, 1], q[:, 0], q[:, 1], b[0], b[1])
    o3 = orient(a[0], a[1], b[0], b[1], p[:, 0], p[:, 1])
    o4 = orient(a[0], a[1], b[0], b[1], q[:, 0], q[:, 1])
    return (o1 * o2 < -1e-6) & (o3 * o4 < -1e-6)


class Scan:
    """Предрасчёт: когда каждая точка стены впервые попала в луч лидара."""

    def __init__(self, path=PATH, speed=24.0, reach=26.0, step=0.7):
        pts = []
        for x1, y1, x2, y2 in WALLS:
            n = max(2, int(math.hypot(x2 - x1, y2 - y1) / step))
            for k in range(n + 1):
                pts.append((x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n))
        for fx, fy, fw, fh in FURNITURE:
            for (x1, y1, x2, y2) in ((fx, fy, fx + fw, fy), (fx + fw, fy, fx + fw, fy + fh),
                                     (fx + fw, fy + fh, fx, fy + fh), (fx, fy + fh, fx, fy)):
                n = max(2, int(math.hypot(x2 - x1, y2 - y1) / (step * 1.4)))
                for k in range(n):
                    pts.append((x1 + (x2 - x1) * k / n, y1 + (y2 - y1) * k / n))
        self.pts = np.array(pts, dtype=np.float64)
        # время вдоль маршрута
        seg = [0.0]
        for (x1, y1), (x2, y2) in zip(path[:-1], path[1:]):
            seg.append(seg[-1] + math.hypot(x2 - x1, y2 - y1) / speed)
        self.path, self.seg_t = path, seg
        self.duration = seg[-1]
        self.reveal = np.full(len(pts), np.inf)
        walls = [(np.array(w[:2], float), np.array(w[2:], float)) for w in WALLS]
        tt = 0.0
        while tt <= self.duration:
            rx, ry = self.pos(tt)
            d = np.hypot(self.pts[:, 0] - rx, self.pts[:, 1] - ry)
            cand = np.where((d < reach) & np.isinf(self.reveal))[0]
            if len(cand):
                p = np.repeat([[rx, ry]], len(cand), axis=0)
                q = self.pts[cand] + (np.array([rx, ry]) - self.pts[cand]) * 0.02
                blocked = np.zeros(len(cand), bool)
                for a, b in walls:
                    blocked |= _seg_cross(p, q, a, b)
                vis = cand[~blocked]
                self.reveal[vis] = tt + d[vis] / 120.0
            tt += 0.05

    def pos(self, tt):
        tt = clamp(tt, 0, self.duration)
        for i in range(len(self.seg_t) - 1):
            if tt <= self.seg_t[i + 1]:
                k = (tt - self.seg_t[i]) / max(1e-6, self.seg_t[i + 1] - self.seg_t[i])
                (x1, y1), (x2, y2) = self.path[i], self.path[i + 1]
                return x1 + (x2 - x1) * k, y1 + (y2 - y1) * k
        return self.path[-1]

    def heading(self, tt):
        a, b = self.pos(tt - 0.05), self.pos(tt + 0.05)
        return math.degrees(math.atan2(b[1] - a[1], b[0] - a[0]))


class MapView:
    """Перевод координат плана в экранные."""

    def __init__(self, cx, cy, width):
        self.k = width / 100.0
        self.ox = cx - 50 * self.k
        self.oy = cy - 30 * self.k

    def p(self, x, y):
        return self.ox + x * self.k, self.oy + y * self.k

    def rect(self, x, y, w, h):
        return skia.Rect.MakeXYWH(self.ox + x * self.k, self.oy + y * self.k, w * self.k, h * self.k)


def draw_plan(c, v, a=1.0, walls=1.0, doors=1.0, furniture=1.0, labels=0.0, wall_col=WHITE,
              fill_rooms=None, highlight=None, hl_a=0.0, label_set=None):
    """Чистый план (стиль приложения)."""
    if fill_rooms:
        for name, (x0, y0, x1, y1) in ROOM_RECTS.items():
            col, al = fill_rooms
            c.drawRect(v.rect(x0, y0, x1 - x0, y1 - y0), paint(col, al * a))
    if highlight and hl_a > 0:
        x0, y0, x1, y1 = ROOM_RECTS[highlight]
        c.drawRect(v.rect(x0, y0, x1 - x0, y1 - y0), paint(WHITE, 0.16 * hl_a * a))
    if furniture > 0:
        pf = paint(GREY, a * furniture, stroke=max(1.5, 0.28 * v.k))
        for fx, fy, fw, fh in FURNITURE:
            c.drawRect(v.rect(fx, fy, fw, fh), pf)
    if walls > 0:
        pw = paint(wall_col, a * walls, stroke=max(2.0, 0.85 * v.k), cap="square")
        for x1, y1, x2, y2 in WALLS:
            c.drawLine(*v.p(x1, y1), *v.p(x2, y2), pw)
    if doors > 0:
        pd = paint(SOFT, a * doors, stroke=max(1.2, 0.3 * v.k))
        for hx, hy, r, a0, sw in DOORS:
            arc = skia.Path()
            px, py = v.p(hx - r, hy - r)
            arc.addArc(skia.Rect.MakeXYWH(px, py, 2 * r * v.k, 2 * r * v.k), a0, sw)
            c.drawPath(arc, pd)
            ang = math.radians(a0)
            c.drawLine(*v.p(hx, hy), *v.p(hx + math.cos(ang) * r, hy + math.sin(ang) * r), pd)
    if labels > 0:
        f = font(max(10, 2.0 * v.k), "regular")
        for name, (x, y) in ROOMS.items():
            if label_set is not None and name not in label_set:
                continue
            al = labels if label_set is None else label_set[name]
            draw_text(c, name, *v.p(x, y + 0.7), f, paint(SOFT, a * al), "center", tracking=0.25 * v.k)


def draw_scan(c, v, scan, tt, a=1.0, ray_col=RED, rays=True, robot=True, glow_new=True):
    """Лидарная съёмка: точки проявляются по мере прохода робота."""
    rv = scan.reveal
    seen = rv <= tt
    if seen.any():
        idx = np.where(seen)[0]
        age = tt - rv[idx]
        old = idx[age > 0.6]
        new = idx[age <= 0.6]
        path = skia.Path()
        r = max(1.4, 0.32 * v.k)
        for i in old:
            x, y = v.p(*scan.pts[i])
            path.addCircle(x, y, r)
        c.drawPath(path, paint(WHITE, 0.85 * a))
        if len(new):
            pn = skia.Path()
            for i in new:
                x, y = v.p(*scan.pts[i])
                pn.addCircle(x, y, r * 1.6)
            c.drawPath(pn, paint(RED, a))
            if glow_new:
                c.drawPath(pn, paint(RED, 0.5 * a, blur=r * 3))
    rx, ry = scan.pos(tt)
    sx, sy = v.p(rx, ry)
    if rays:
        # вращающийся луч + несколько попаданий
        ang = tt * 9.0
        lr = 26 * v.k
        ex, ey = sx + math.cos(ang) * lr, sy + math.sin(ang) * lr
        sh = skia.GradientShader.MakeLinear([skia.Point(sx, sy), skia.Point(ex, ey)],
                                            [color(ray_col, 0.9 * a), color(ray_col, 0.0)])
        p = paint(ray_col, a, stroke=max(1.5, 0.25 * v.k))
        p.setShader(sh)
        c.drawLine(sx, sy, ex, ey, p)
        recent = np.where((rv <= tt) & (rv > tt - 0.12))[0][:40]
        pr = paint(ray_col, 0.35 * a, stroke=1.0)
        for i in recent:
            x, y = v.p(*scan.pts[i])
            c.drawLine(sx, sy, x, y, pr)
    return sx, sy
