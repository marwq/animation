"""Аттракционы Starfall Park: колесо обозрения, карусель, горки «Тандерболт» с поездом, башня
свободного падения, волнолёт, чашки, бревенчатый спуск, канатная дорога, зиплайн, детская горка.

Все функции рисуют в мировых координатах; движение задаётся параметрами (угол, фаза, u).
"""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU
from engine import draw as D
from sets.base import tone, NIGHT
from sets.park import star, BRIGHT

INK = D.INK


def Tf(tod):
    return lambda c: tone(c, tod)


def bulbs(ctx, pts, on, t=0.0, r=7, cols=("#fff2a0",), glow=True, chase=False):
    """Лампочки по точкам; chase — бегущие огни."""
    for k, (x, y) in enumerate(pts):
        lit = on and (not chase or ((k + int(t * 8)) % 3 != 0))
        c = hexrgb(cols[k % len(cols)])
        if lit:
            if glow:
                D.radial(ctx, x, y, r * 4, cols[k % len(cols)], 0.45, 0)
            D.circle(ctx, x, y, r, c, None, 0)
        else:
            D.circle(ctx, x, y, r * 0.8, shade(c, -0.45), None, 0)


# --- колесо обозрения ------------------------------------------------------------

def big_wheel(ctx, x, cy, R=1300, ang=0.0, tod="day", lights=None, gondola=None, n=12, t=0.0, gy=None):
    """Колесо обозрения: центр (x, cy), радиус R, поворот ang. gondola(ctx, i, gx, gy, s) —
    дорисовать пассажиров в кабинке i (кабинка висит вертикально под точкой подвеса)."""
    T = Tf(tod)
    lights = (tod in NIGHT) if lights is None else lights
    gy = cy + R + 300 if gy is None else gy
    steel = T("#fbfaf6")
    # опоры (А-образные, сзади)
    for sx in (-1, 1):
        D.poly(ctx, [(x - 40, cy), (x + 40, cy), (x + sx * R * 0.55 + 50, gy), (x + sx * R * 0.55 - 50, gy)],
               T("#2f8fd8"), INK, 5, wob=0)
    D.rect(ctx, x - R * 0.6, gy - 40, R * 1.2, 40, T("#1f5f9e"), INK, 4, wob=0)
    # обод (двойной) и спицы
    for rr, w in ((R, 26), (R * 0.93, 14)):
        ctx.arc(x, cy, rr, 0, TAU)
        D.col(ctx, INK)
        ctx.set_line_width(w + 8)
        ctx.stroke()
        ctx.arc(x, cy, rr, 0, TAU)
        D.col(ctx, steel)
        ctx.set_line_width(w)
        ctx.stroke()
    ns = 24
    for k in range(ns):
        a = ang + k * TAU / ns
        D.line(ctx, x, cy, x + math.cos(a) * R * 0.93, cy + math.sin(a) * R * 0.93, INK, 9)
        D.line(ctx, x, cy, x + math.cos(a) * R * 0.93, cy + math.sin(a) * R * 0.93, steel, 4)
        # перекладины между ободами
        b = a + TAU / ns
        D.line(ctx, x + math.cos(a) * R, cy + math.sin(a) * R, x + math.cos(b) * R * 0.93,
               cy + math.sin(b) * R * 0.93, steel, 4)
    # огни по ободу
    pts = [(x + math.cos(ang + k * TAU / 72) * R, cy + math.sin(ang + k * TAU / 72) * R) for k in range(72)]
    bulbs(ctx, pts, lights, t, r=8, cols=("#fff2a0", "#ff8ac8", "#8ad8ff"), chase=True)
    # ступица
    D.circle(ctx, x, cy, 90, T("#f2c230"), INK, 5)
    star(ctx, x, cy, 60, T("#e8423c"), 3)
    # кабинки
    for i in range(n):
        a = ang + i * TAU / n
        px, py = x + math.cos(a) * R, cy + math.sin(a) * R
        cabin(ctx, px, py, 1.0, T(BRIGHT[i % len(BRIGHT)]), tod, lights, gondola, i)
    return pts


def cabin(ctx, px, py, s, c, tod, lights, gondola=None, i=0):
    """Кабинка колеса: висит на штанге под точкой подвеса (px, py)."""
    T = Tf(tod)
    D.line(ctx, px, py, px, py + 60 * s, INK, 8)
    gx, gy = px, py + 60 * s
    D.poly(ctx, [(gx - 110 * s, gy + 40 * s), (gx, gy - 6 * s), (gx + 110 * s, gy + 40 * s)], c, INK, 4, wob=0)
    D.rrect(ctx, gx - 100 * s, gy + 36 * s, 200 * s, 190 * s, 26 * s, T("#fbfaf6"), INK, 4)
    D.rect(ctx, gx - 84 * s, gy + 56 * s, 168 * s, 92 * s, hexrgb("#ffe9a0") if lights else T("#bfe6f5"), INK, 3,
           wob=0)
    if gondola:
        ctx.save()
        ctx.rectangle(gx - 84 * s, gy + 56 * s, 168 * s, 92 * s)
        ctx.clip()
        gondola(ctx, i, gx, gy + 148 * s, s)
        ctx.restore()
    D.rect(ctx, gx - 100 * s, gy + 148 * s, 200 * s, 78 * s, c, INK, 4, wob=0)
    star(ctx, gx, gy + 188 * s, 22 * s, T("#ffd23a"))


# --- карусель ---------------------------------------------------------------------

HORSE_COLS = ["#fbfaf6", "#f2c8a0", "#c8a0f2", "#a0d8f2", "#f2a0c0", "#fff2a0"]


def horse(ctx, x, y, s, f, c, t=0.0, tod="day", seed=0):
    """Карусельная лошадка (сбоку): (x, y) — середина седла."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(f * s, s)
    cc = T(c)
    # ноги в «галопе»
    for (lx, ly, ex, ey) in ((50, 30, 110, 110), (30, 34, 70, 120), (-50, 30, -120, 90), (-36, 34, -70, 120)):
        D.line(ctx, lx, ly, ex, ey, INK, 22)
        D.line(ctx, lx, ly, ex, ey, cc, 15)
        D.circle(ctx, ex, ey, 9, T("#2b2f3a"), None, 0)
    # хвост
    D.curve(ctx, [(-80, -10), (-125, 10), (-140, 70)], INK, 22)
    D.curve(ctx, [(-80, -10), (-125, 10), (-140, 70)], T("#8a5a34"), 14)
    # тело
    D.ellipse(ctx, 0, 10, 92, 46, cc, INK, 4)
    # шея и голова
    D.poly(ctx, [(50, -10), (80, -100), (120, -96), (100, 10)], cc, INK, 4, wob=0)
    D.ellipse(ctx, 118, -96, 50, 28, cc, INK, 4, rot=0.45)
    D.circle(ctx, 112, -108, 6, INK, None, 0)
    D.poly(ctx, [(84, -118), (96, -150), (104, -114)], cc, INK, 3, wob=0)
    # грива
    for k in range(5):
        D.circle(ctx, 70 + k * 6, -100 + k * 20, 16, T("#f2c230"), INK, 2)
    # седло и попона
    D.ellipse(ctx, -6, -30, 50, 18, T("#e8423c"), INK, 3)
    D.poly(ctx, [(-40, -20), (30, -20), (24, 30), (-34, 30)], T("#2f8fd8"), INK, 3, wob=0)
    star(ctx, -5, 6, 14, T("#ffd23a"))
    ctx.restore()


def carousel(ctx, x, gy, s=1.0, ang=0.0, t=0.0, tod="day", lights=None, run=1.0, riders=None, n=12, music=0.0,
             standers=None, n_stand=0):
    """standers(ctx, j, px, py, depth, f) — кто стоит на платформе между лошадками (n_stand мест)."""
    """Карусель в 3/4: платформа, центральная колонна, лошадки на шестах (вверх-вниз),
    купол с фестонами и лампочками. riders(ctx, i, hx, hy, hs, f, front) — кто на лошадке i."""
    T = Tf(tod)
    lights = (tod in NIGHT or run > 0) if lights is None else lights
    rx, ry = 760 * s, 170 * s
    py = gy - 120 * s           # уровень платформы (центр эллипса)
    top = py - 760 * s          # нижний край купола
    # купол: задняя часть
    D.ellipse(ctx, x, top, rx + 60 * s, ry + 30 * s, T("#e8423c"), INK, 5)
    # платформа
    D.ellipse(ctx, x, py + 40 * s, rx + 30 * s, ry + 26 * s, T("#8a5a34"), INK, 5)
    D.ellipse(ctx, x, py, rx + 30 * s, ry + 26 * s, T("#f2c230"), INK, 5)
    D.ellipse(ctx, x, py, rx - 30 * s, ry - 10 * s, T("#f6dc7a"), None, 0)
    slots = []
    for i in range(n):
        a = ang + i * TAU / n
        hx = x + math.cos(a) * rx * 0.86
        depth = math.sin(a)
        hy_base = py + depth * ry * 0.86
        bob = math.sin(t * 2.4 * run + i * 1.7) * 60 * s * run if run > 0 else math.sin(i * 1.7) * 30 * s
        f = -1 if depth > 0 else 1
        slots.append((depth, i, hx, hy_base, bob, f))
    stand_slots = []
    for j in range(n_stand):
        a = ang + (j + 0.5) * TAU / max(1, n_stand) + 0.13
        rr = (0.55 + 0.3 * ((j * 7) % 3) / 2)
        px = x + math.cos(a) * rx * rr
        depth = math.sin(a)
        py = py_ = (gy - 120 * s) + depth * ry * rr
        stand_slots.append((depth, j, px, py, -1 if math.cos(a) * (1 if depth > 0 else -1) > 0 else 1))
    slots.sort()
    stand_slots.sort()

    def pole_and_horse(i, hx, hy_base, bob, f, depth):
        hs = s * (0.9 + 0.12 * depth)
        D.line(ctx, hx, top + ry * 0.86 * depth, hx, hy_base, INK, 12 * s)
        D.line(ctx, hx, top + ry * 0.86 * depth, hx, hy_base, T("#f2c230"), 6 * s)
        hy = hy_base - 300 * s + bob
        horse(ctx, hx, hy, hs, f, HORSE_COLS[i % len(HORSE_COLS)], t, tod, i)
        if riders:
            riders(ctx, i, hx, hy - 30 * hs, hs, f, depth > 0)

    def standers_where(cond):
        if standers:
            for depth, j, px, py, f in stand_slots:
                if cond(depth):
                    standers(ctx, j, px, py, depth, f)

    standers_where(lambda dd: dd <= -0.3)
    for depth, i, hx, hb, bob, f in slots:
        if depth <= 0:
            pole_and_horse(i, hx, hb, bob, f, depth)
    standers_where(lambda dd: -0.3 < dd <= 0)
    # центральная колонна с зеркалами
    D.rect(ctx, x - 150 * s, top, 300 * s, py - top, T("#2f8fd8"), INK, 5, wob=0)
    for k in range(4):
        D.rrect(ctx, x - 120 * s + k * 62 * s, top + 120 * s, 52 * s, 180 * s, 14 * s,
                T("#cfeaff") if not lights else hexrgb("#fff2c0"), INK, 3)
        star(ctx, x - 94 * s + k * 62 * s, top + 360 * s, 16 * s, T("#ffd23a"))
    standers_where(lambda dd: 0 < dd <= 0.4)
    for depth, i, hx, hb, bob, f in slots:
        if depth > 0:
            pole_and_horse(i, hx, hb, bob, f, depth)
    standers_where(lambda dd: dd > 0.4)
    # купол: передняя кромка с фестонами
    nf = 16
    for k in range(nf):
        a0 = math.pi * k / nf
        a1 = math.pi * (k + 1) / nf
        x0, y0 = x + math.cos(a0) * (rx + 60 * s), top + math.sin(a0) * (ry + 30 * s)
        x1, y1 = x + math.cos(a1) * (rx + 60 * s), top + math.sin(a1) * (ry + 30 * s)
        c = T("#e8423c") if k % 2 == 0 else T("#fbfaf6")
        D.poly(ctx, [(x0, y0 - 60 * s), (x1, y1 - 60 * s), (x1, y1), (x0, y0)], c, INK, 3, wob=0)
        ctx.arc((x0 + x1) / 2, (y0 + y1) / 2, abs(x1 - x0) / 2, 0, math.pi)
        D.col(ctx, c)
        ctx.fill_preserve()
        D.col(ctx, INK)
        ctx.set_line_width(3)
        ctx.stroke()
    # конус крыши
    D.poly(ctx, [(x - rx - 60 * s, top - 60 * s), (x, top - 520 * s), (x + rx + 60 * s, top - 60 * s)],
           T("#e8423c"), INK, 5, wob=0)
    for k in range(-3, 4):
        D.line(ctx, x, top - 520 * s, x + k * (rx + 60 * s) / 3, top - 60 * s, T("#fbfaf6"), 10 * s)
    D.line(ctx, x, top - 520 * s, x, top - 650 * s, INK, 8)
    D.poly(ctx, [(x, top - 650 * s), (x + 90 * s, top - 620 * s), (x, top - 590 * s)], T("#f2c230"), INK, 3, wob=0)
    pts = [(x + math.cos(math.pi * k / 30) * (rx + 60 * s), top - 60 * s + math.sin(math.pi * k / 30) * (ry + 30 * s))
           for k in range(31)]
    bulbs(ctx, pts, lights, t, r=9 * s, cols=("#fff2a0",), chase=run > 0)
    if music > 0:
        for k in range(5):
            ph = (t * 0.6 + k / 5) % 1
            mx = x + (k - 2) * 280 * s + math.sin(t * 2 + k) * 40
            my = top - 300 * s - ph * 500 * s
            note(ctx, mx, my, 1.4 * s, T(BRIGHT[k % 8]), (1 - ph) * music, double=k % 2 == 0)
    return dict(py=py, top=top, rx=rx, ry=ry)


# --- американские горки «Тандерболт» -----------------------------------------------

class Track:
    """Путь горок: ломаная по точкам (сглаженная), доступ по длине дуги."""

    def __init__(self, pts, samples=12):
        sm = []
        n = len(pts)
        for i in range(n - 1):
            p0 = pts[max(0, i - 1)]
            p1, p2 = pts[i], pts[i + 1]
            p3 = pts[min(n - 1, i + 2)]
            for k in range(samples):
                u = k / samples
                u2, u3 = u * u, u * u * u
                sm.append(tuple(0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2
                                       + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3) for j in (0, 1)))
        sm.append(pts[-1])
        self.p = sm
        self.d = [0.0]
        for a, b in zip(sm, sm[1:]):
            self.d.append(self.d[-1] + math.hypot(b[0] - a[0], b[1] - a[1]))
        self.L = self.d[-1]

    def at(self, s):
        s = clamp(s, 0, self.L)
        lo, hi = 0, len(self.d) - 1
        while hi - lo > 1:
            m = (lo + hi) // 2
            if self.d[m] <= s:
                lo = m
            else:
                hi = m
        a, b = self.p[lo], self.p[hi]
        seg = self.d[hi] - self.d[lo] or 1
        u = (s - self.d[lo]) / seg
        return (lerp(a[0], b[0], u), lerp(a[1], b[1], u)), math.atan2(b[1] - a[1], b[0] - a[0])


def thunderbolt_track(x0=0.0, gy=900.0, H=2600.0):
    """Путь: станция → подъём → большой спуск → петля → холм → возврат к станции."""
    pts = [(x0 - 600, gy - 200), (x0 + 400, gy - 200), (x0 + 900, gy - 300), (x0 + 1600, gy - 200 - H * 0.55),
           (x0 + 2200, gy - 200 - H), (x0 + 2500, gy - 230 - H), (x0 + 2800, gy - 200 - H * 0.8),
           (x0 + 3300, gy - 260), (x0 + 3800, gy - 160), (x0 + 4300, gy - 300)]
    # петля
    # вертикальная петля: вход снизу слева направо, вверх по правой стороне, через верх влево,
    # вниз по левой и выход снизу со сдвигом вправо (y вниз: низ петли = cy + r)
    cx, cy, r = x0 + 4700, gy - 860, 560
    for k in range(1, 16):
        a = math.pi / 2 - k * TAU / 16
        pts.append((cx + math.cos(a) * r * 0.85 + k / 16 * 260, cy + math.sin(a) * r))
    pts += [(cx + 420, gy - 300), (x0 + 5700, gy - 280), (x0 + 6300, gy - 700), (x0 + 6900, gy - 320),
            (x0 + 7500, gy - 220)]
    return pts


def coaster_track(ctx, track, gy, tod="day", rail="#e8423c", support="#2f6fd0", lights=False, t=0.0,
                  lattice_until=None):
    """Рельсы, шпалы и опоры по пути track (Track)."""
    T = Tf(tod)
    pts = track.p
    # опоры
    step = 180.0
    s = 0.0
    while s < track.L:
        (px, py), a = track.at(s)
        if py < gy - 40:
            D.line(ctx, px, py + 14, px, gy, INK, 16)
            D.line(ctx, px, py + 14, px, gy, T(support), 9)
            if lattice_until and s < lattice_until:
                D.line(ctx, px - 80, gy, px, py + 14, T(support), 5)
            D.rect(ctx, px - 22, gy - 14, 44, 14, T("#8f99a3"), INK, 2, wob=0)
        s += step
    # шпалы
    s = 0.0
    while s < track.L:
        (px, py), a = track.at(s)
        nx, ny = -math.sin(a), math.cos(a)
        D.line(ctx, px - nx * 26, py - ny * 26, px + nx * 26, py + ny * 26, INK, 8)
        s += 40.0
    # рельсы
    for off, w in ((-16, 12), (16, 12)):
        ctx.new_path()
        for k, (x, y) in enumerate(pts):
            if k == 0:
                a = math.atan2(pts[1][1] - y, pts[1][0] - x)
            else:
                a = math.atan2(y - pts[k - 1][1], x - pts[k - 1][0])
            nx, ny = -math.sin(a), math.cos(a)
            (ctx.move_to if k == 0 else ctx.line_to)(x + nx * off, y + ny * off)
        D.col(ctx, INK)
        ctx.set_line_width(w + 6)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.stroke_preserve()
        D.col(ctx, T(rail))
        ctx.set_line_width(w)
        ctx.stroke()
    if lights:
        bp = [track.at(k * 120)[0] for k in range(int(track.L / 120))]
        bulbs(ctx, bp, True, t, r=6, cols=("#fff2a0", "#ff8ac8"), chase=True)


def coaster_car(ctx, x, y, ang, s=1.0, c="#ffd23a", tod="day", riders=None, i=0, front=False):
    """Вагончик на рельсах: (x, y) — точка пути (низ колёс), ang — наклон пути."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    if riders:
        riders(ctx, i)
    D.rrect(ctx, -110, -130, 220, 110, 30, T(c), INK, 4)
    D.rect(ctx, -110, -60, 220, 18, T("#2b2f3a"), INK, 2, wob=0)
    if front:
        D.poly(ctx, [(70, -130), (130, -110), (120, -40), (90, -20)], T(c), INK, 4, wob=0)
        D.poly(ctx, [(-20, -120), (20, -120), (-5, -88), (25, -88), (-25, -40), (-8, -76), (-34, -76)],
               T("#e8423c"), INK, 2, wob=0)
    for wx in (-70, 70):
        D.circle(ctx, wx, -14, 18, T("#2b2f3a"), INK, 3)
    ctx.restore()


def coaster_train(ctx, track, s_head, n=5, gap=240.0, tod="day", riders=None, cols=None):
    """Поезд: голова на дуге s_head; вагоны позади по пути."""
    cols = cols or ["#ffd23a", "#2f8fd8", "#e8423c", "#3fbf6a", "#7a4fc2", "#f2783a"]
    for k in range(n - 1, -1, -1):
        (px, py), a = track.at(s_head - k * gap)
        coaster_car(ctx, px, py - 6, a, 1.0, cols[k % len(cols)], tod, riders, k, front=(k == 0))


def station(ctx, x, gy, tod="day", w=1400, lit=None, name="THUNDERBOLT"):
    """Станция посадки горок: навес, табло, турникеты."""
    T = Tf(tod)
    lit = (tod in NIGHT) if lit is None else lit
    D.rect(ctx, x, gy - 200, w, 200, T("#c9d0d6"), INK, 4, wob=0)
    for k in range(int(w / 30)):
        D.line(ctx, x + k * 30, gy - 200, x + k * 30, gy, T("#aeb6bc"), 2)
    for px in (x + 40, x + w - 80):
        D.rect(ctx, px, gy - 760, 40, 560, T("#2f6fd0"), INK, 4, wob=0)
    D.poly(ctx, [(x - 80, gy - 760), (x + w + 80, gy - 760), (x + w + 40, gy - 840), (x - 40, gy - 840)],
           T("#2f6fd0"), INK, 4, wob=0)
    D.rrect(ctx, x + w / 2 - 420, gy - 960, 840, 140, 24, T("#1c2440"), INK, 5)
    D.text(ctx, name, x + w / 2, gy - 866, 90, D.FONT_TITLE, T("#ffd23a"), stroke=INK, slw=6)
    bolt_icon(ctx, x + w / 2 - 470, gy - 890, 1.0, T("#ffd23a"))
    bolt_icon(ctx, x + w / 2 + 470, gy - 890, 1.0, T("#ffd23a"))
    bulbs(ctx, [(x - 60 + k * 60, gy - 760) for k in range(int(w / 60) + 3)], lit, 0, r=7)


def bolt_icon(ctx, x, y, s, c):
    """Молния — эмблема «Тандерболта»."""
    pts = [(-10, -60), (30, -60), (8, -14), (34, -14), (-20, 64), (-4, 6), (-30, 6)]
    D.poly(ctx, [(x + px * s, y + py * s) for px, py in pts], c, INK, 3, wob=0)


def note(ctx, x, y, s, c, alpha=1.0, double=False):
    """Нота (♪/♫ шрифт не рисует)."""
    c = hexrgb(c) if isinstance(c, str) else c
    D.ellipse(ctx, x, y, 22 * s, 16 * s, c, INK, 3, alpha=alpha, rot=-0.35)
    D.line(ctx, x + 18 * s, y - 4 * s, x + 18 * s, y - 90 * s, INK, 8 * s, alpha)
    if double:
        D.ellipse(ctx, x + 60 * s, y - 10 * s, 22 * s, 16 * s, c, INK, 3, alpha=alpha, rot=-0.35)
        D.line(ctx, x + 78 * s, y - 14 * s, x + 78 * s, y - 100 * s, INK, 8 * s, alpha)
        D.line(ctx, x + 18 * s, y - 90 * s, x + 78 * s, y - 100 * s, INK, 14 * s, alpha)
    else:
        D.curve(ctx, [(x + 18 * s, y - 90 * s), (x + 46 * s, y - 70 * s), (x + 40 * s, y - 40 * s)], INK, 7 * s, alpha)


# --- башня свободного падения -----------------------------------------------------

def drop_tower(ctx, x, gy, h=3000, car=0.0, tod="day", lights=None, t=0.0, dark=False, riders=None):
    """Башня: car 0..1 — высота кольца с сиденьями."""
    T = Tf(tod)
    lights = (tod in NIGHT) if lights is None else lights
    lights = lights and not dark
    D.poly(ctx, [(x - 70, gy), (x + 70, gy), (x + 50, gy - h), (x - 50, gy - h)], T("#7a4fc2"), INK, 5, wob=0)
    for k in range(int(h / 160)):
        y = gy - 80 - k * 160
        D.line(ctx, x - 60, y, x + 60, y - 80, T("#9a7ad8"), 5)
    D.poly(ctx, [(x - 130, gy - h), (x + 130, gy - h), (x + 90, gy - h - 140), (x - 90, gy - h - 140)],
           T("#e8423c"), INK, 5, wob=0)
    D.line(ctx, x, gy - h - 140, x, gy - h - 260, INK, 8)
    D.circle(ctx, x, gy - h - 270, 16, hexrgb("#ff4a3a") if lights else T("#8a2a2a"), INK, 3)
    cy = gy - 300 - car * (h - 600)
    D.rrect(ctx, x - 230, cy - 60, 460, 120, 30, T("#f2c230"), INK, 5)
    if riders:
        riders(ctx, x, cy - 60)
    for k in range(5):
        D.rect(ctx, x - 200 + k * 85, cy - 40, 60, 80, T("#2b2f3a"), INK, 3, wob=0)
    pts = [(x, gy - 200 - k * 200) for k in range(int((h - 200) / 200))]
    bulbs(ctx, pts, lights, t, r=10, cols=("#ff8ac8", "#8ad8ff", "#fff2a0"), chase=True)


# --- волнолёт ------------------------------------------------------------------------

def swing_ride(ctx, x, gy, ang=0.0, spin=1.0, tod="day", lights=None, t=0.0, riders=None, cloth=None, n=16):
    """Волнолёт: столб, вращающийся «зонт», цепи с сиденьями разлетаются на угол ~ spin.
    cloth(ctx, i, sx, sy, out) — вместо сидений висят полотнища (сушка шара)."""
    T = Tf(tod)
    lights = (tod in NIGHT) if lights is None else lights
    top = gy - 1500
    rx, ry = 520, 110
    D.rect(ctx, x - 50, top, 100, gy - top, T("#16a39a"), INK, 5, wob=0)
    D.ellipse(ctx, x, gy - 30, 260, 60, T("#8f99a3"), INK, 4)
    L = 700
    th = 0.15 + 0.85 * clamp(spin) * 0.9           # угол отклонения цепей
    seats = []
    for i in range(n):
        a = ang + i * TAU / n
        depth = math.sin(a)
        ax, ay = x + math.cos(a) * rx, top + depth * ry
        out = math.sin(th) * L
        sx = x + math.cos(a) * (rx + out)
        sy = top + math.cos(th) * L + depth * (ry + out * 0.2)
        seats.append((depth, i, ax, ay, sx, sy))
    seats.sort()

    def chain_seat(i, ax, ay, sx, sy, depth):
        if cloth:
            cloth(ctx, i, ax, ay, sx, sy)
            return
        D.line(ctx, ax, ay, sx, sy, INK, 4)
        D.line(ctx, ax + 6, ay, sx + 6, sy, INK, 4)
        if riders:
            riders(ctx, i, sx, sy, depth)
        D.rrect(ctx, sx - 34, sy - 10, 68, 26, 8, T(BRIGHT[i % 8]), INK, 3)

    for d, i, ax, ay, sx, sy in seats:
        if d <= 0:
            chain_seat(i, ax, ay, sx, sy, d)
    # зонт
    D.ellipse(ctx, x, top, rx + 30, ry + 20, T("#f2c230"), INK, 5)
    for d, i, ax, ay, sx, sy in seats:
        if d > 0:
            chain_seat(i, ax, ay, sx, sy, d)
    D.poly(ctx, [(x - rx - 30, top), (x, top - 320), (x + rx + 30, top)], T("#16a39a"), INK, 5, wob=0)
    for k in range(-3, 4):
        D.line(ctx, x, top - 320, x + k * (rx + 30) / 3, top, T("#fbfaf6"), 6)
    pts = [(x + math.cos(ang + k * TAU / 24) * (rx + 30), top + math.sin(ang + k * TAU / 24) * (ry + 20))
           for k in range(24) if math.sin(ang + k * TAU / 24) > -0.2]
    bulbs(ctx, pts, lights, t, r=8)


# --- чашки --------------------------------------------------------------------------

def teacup(ctx, x, gy, s=1.0, c="#f05a8a", spin=0.0, tod="day", inside=None):
    """Чашка-аттракцион сбоку: inside(ctx, x, rim_y, s) рисует пассажира внутри (до передней стенки)."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.ellipse(ctx, 0, -10, 230, 40, T("#c9d0d6"), INK, 4)
    D.ellipse(ctx, 0, -230, 190, 46, shade(T(c), -0.3), INK, 4)
    ctx.restore()
    if inside:
        inside(ctx, x, gy - 230 * s, s)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    ctx.move_to(-190, -230)
    ctx.curve_to(-190, -60, -110, -30, 0, -30)
    ctx.curve_to(110, -30, 190, -60, 190, -230)
    ctx.curve_to(150, -200, -150, -200, -190, -230)
    ctx.close_path()
    D.col(ctx, T(c))
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(4)
    ctx.stroke()
    # узор: точки, бегущие при вращении
    for k in range(6):
        u = ((k / 6 + spin * 0.16) % 1.0)
        px = -170 + u * 340
        if -160 < px < 160:
            D.circle(ctx, px, -120 + 30 * (1 - (px / 170) ** 2) * 0, 16 * (1 - abs(px) / 260), T("#fbfaf6"), None, 0)
    ctx.arc(205, -150, 40, -math.pi / 2, math.pi / 2)
    D.col(ctx, INK)
    ctx.set_line_width(20)
    ctx.stroke()
    ctx.arc(205, -150, 40, -math.pi / 2, math.pi / 2)
    D.col(ctx, T(c))
    ctx.set_line_width(12)
    ctx.stroke()
    ctx.restore()


# --- бревенчатый спуск --------------------------------------------------------------

def flume_path(x0, gy):
    """Жёлоб: высокий подъёмник → ровный участок → большой спуск → плюх в лагуну."""
    return Track([(x0 - 200, gy - 1200), (x0 + 600, gy - 1200), (x0 + 1400, gy - 1180), (x0 + 1800, gy - 1100),
                  (x0 + 2300, gy - 600), (x0 + 2600, gy - 160), (x0 + 2900, gy - 60), (x0 + 3400, gy - 40)], 14)


def flume(ctx, track, gy, tod="day", t=0.0):
    """Жёлоб с водой на опорах."""
    T = Tf(tod)
    s = 0.0
    while s < track.L:
        (px, py), a = track.at(s)
        if py < gy - 80:
            D.line(ctx, px, py + 40, px, gy, INK, 18)
            D.line(ctx, px, py + 40, px, gy, T("#a8743a"), 10)
        s += 220.0
    for off, c, w in ((0, T("#8a5a34"), 70), (0, T("#4fb8e8"), 44)):
        ctx.new_path()
        for k, (x, y) in enumerate(track.p):
            (ctx.move_to if k == 0 else ctx.line_to)(x, y + off)
        D.col(ctx, INK)
        ctx.set_line_width(w + 8)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.stroke_preserve()
        D.col(ctx, c)
        ctx.set_line_width(w)
        ctx.stroke()
    # блики воды
    s = (t * 300) % 120
    while s < track.L:
        (px, py), a = track.at(s)
        D.line(ctx, px - 20 * math.cos(a), py - 20 * math.sin(a), px + 20 * math.cos(a), py + 20 * math.sin(a),
               hexrgb("#e6f8ff"), 4, 0.8)
        s += 120


def log_boat(ctx, x, y, ang, s=1.0, tod="day", cargo=None):
    """Бревно-лодка: (x, y) — точка на воде жёлоба."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    if cargo:
        cargo(ctx)
    D.rrect(ctx, -170, -70, 340, 80, 36, T("#a8743a"), INK, 4)
    for k in range(4):
        D.curve(ctx, [(-140 + k * 80, -50), (-120 + k * 80, -30), (-140 + k * 80, -10)], T("#7a4a24"), 3)
    D.ellipse(ctx, 170, -30, 22, 40, T("#e8c08a"), INK, 3)
    for k in range(3):
        D.ellipse(ctx, 170, -30, 14 - k * 4, 30 - k * 8, None, T("#a8743a"), 2)
    ctx.restore()


def splash(ctx, x, y, k, s=1.0, c="#e6f8ff", seed=0):
    """Брызги: k 0..1 — фаза."""
    if k <= 0 or k >= 1:
        return
    r = rng(seed)
    for i in range(16):
        a = -math.pi * (0.1 + 0.8 * r.random())
        v = r.uniform(200, 520) * s
        px = x + math.cos(a) * v * k
        py = y + math.sin(a) * v * k + 900 * s * k * k
        D.circle(ctx, px, py, (16 + r.random() * 14) * s * (1 - k), hexrgb(c), INK, 2, alpha=1 - k * 0.6)
    D.ellipse(ctx, x, y, 200 * s * (0.4 + k), 40 * s * (1 - k), hexrgb(c), None, 0, alpha=0.7 * (1 - k))


# --- канатная дорога Sky Ride и зиплайн ----------------------------------------------

def sky_ride_cable(x0, y0, x1, y1, sag=140):
    def f(u):
        return lerp(x0, x1, u), lerp(y0, y1, u) + sag * 4 * u * (1 - u)
    return f


def sky_tower(ctx, x, gy, h=1600, tod="day"):
    T = Tf(tod)
    D.poly(ctx, [(x - 90, gy), (x + 90, gy), (x + 24, gy - h), (x - 24, gy - h)], T("#f2c230"), INK, 5, wob=0)
    for k in range(int(h / 200)):
        y = gy - 100 - k * 200
        w = 90 - (gy - y) / h * 66
        D.line(ctx, x - w, y, x + w, y - 100, T("#d8a830"), 5)
    D.rect(ctx, x - 140, gy - h - 30, 280, 40, T("#e8423c"), INK, 4, wob=0)
    D.circle(ctx, x - 110, gy - h - 10, 22, T("#c9d0d6"), INK, 3)
    D.circle(ctx, x + 110, gy - h - 10, 22, T("#c9d0d6"), INK, 3)


def sky_bucket(ctx, x, y, s=1.0, c="#2f8fd8", tod="day", riders=None, sway=0.0):
    """Кабинка-«ведро» канатки: (x, y) — точка крепления на тросе."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(sway)
    ctx.scale(s, s)
    D.circle(ctx, 0, 0, 12, T("#2b2f3a"), INK, 3)
    D.line(ctx, 0, 0, 0, 180, INK, 7)
    D.curve(ctx, [(0, 180), (-70, 200), (-80, 260)], INK, 6)
    D.poly(ctx, [(-90, 150), (90, 150), (70, 120), (-70, 120)], T(c), INK, 3, wob=0)
    if riders:
        riders(ctx, 0, 300)
    D.rrect(ctx, -110, 260, 220, 110, 30, T(c), INK, 4)
    D.rect(ctx, -110, 290, 220, 16, T("#fbfaf6"), None, 0, wob=0)
    ctx.restore()


def cable(ctx, f, n=40, tod="day", w=5):
    pts = [f(k / n) for k in range(n + 1)]
    D.polyline(ctx, pts, INK, w + 2)
    D.polyline(ctx, pts, tone("#5a606c", tod), w)


def zip_tower(ctx, x, gy, h=1300, tod="day"):
    T = Tf(tod)
    for k in (-1, 1):
        D.line(ctx, x + k * 140, gy, x + k * 60, gy - h, INK, 20)
        D.line(ctx, x + k * 140, gy, x + k * 60, gy - h, T("#a8743a"), 12)
    for j in range(int(h / 220)):
        y = gy - 110 - j * 220
        D.line(ctx, x - 130 + j * 9, y, x + 130 - j * 9, y - 110, T("#a8743a"), 8)
        D.line(ctx, x + 130 - j * 9, y, x - 130 + j * 9, y - 110, T("#a8743a"), 8)
    D.rect(ctx, x - 200, gy - h - 30, 400, 40, T("#8a5a34"), INK, 4, wob=0)
    D.line(ctx, x - 180, gy - h - 30, x - 180, gy - h - 140, INK, 8)
    D.line(ctx, x + 180, gy - h - 30, x + 180, gy - h - 140, INK, 8)
    D.line(ctx, x - 180, gy - h - 130, x + 180, gy - h - 130, INK, 8)
    D.rect(ctx, x - 140, gy - h - 260, 280, 90, T("#e8423c"), INK, 4, wob=0)
    D.text(ctx, "ZIP LINE", x, gy - h - 196, 50, D.FONT_TITLE, T("#fbfaf6"))


# --- Kiddie Land ---------------------------------------------------------------------

def kiddie_slide(ctx, x, gy, s=1.0, tod="day"):
    """Детская горка с лестницей (лестница слева, скат вправо)."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    for lx in (-200, -140):
        D.line(ctx, lx, 0, lx + 40, -360, INK, 14)
        D.line(ctx, lx, 0, lx + 40, -360, T("#2f8fd8"), 7)
    for k in range(6):
        y = -40 - k * 60
        D.line(ctx, -200 + (-y / 360) * 40, y, -140 + (-y / 360) * 40, y, T("#2f8fd8"), 7)
    D.rect(ctx, -170, -380, 140, 30, T("#f2c230"), INK, 4, wob=0)
    ctx.move_to(-40, -370)
    ctx.curve_to(80, -320, 120, -60, 300, -30)
    ctx.line_to(300, 0)
    ctx.curve_to(100, -40, 60, -300, -40, -340)
    ctx.close_path()
    D.col(ctx, T("#e8423c"))
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.restore()


def bumper_car(ctx, x, gy, s=1.0, c="#e8423c", f=1, tod="day", rider=None, t=0.0):
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    D.rrect(ctx, -150, -60, 300, 60, 30, T("#2b2f3a"), INK, 4)
    if rider:
        rider(ctx)
    D.rrect(ctx, -130, -130, 260, 90, 30, T(c), INK, 4)
    D.line(ctx, -60, -130, -40, -900, INK, 6)
    D.line(ctx, -60, -130, -40, -900, T("#c9d0d6"), 3)
    star(ctx, 60, -88, 20, T("#ffd23a"))
    if int(t * 10) % 7 == 0:
        D.circle(ctx, -40, -900, 14, hexrgb("#bfe6ff"), None, 0)
    ctx.restore()
