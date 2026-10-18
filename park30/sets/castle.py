"""Сказочный замок в центре парка: башни с синими конусами и флагами, стены с зубцами, ворота с
решёткой, ров с подъёмным мостом; внутренний двор (вид изнутри) с часами на башне."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU
from engine import draw as D
from sets.base import tone, NIGHT
from sets.park import star, BRIGHT

INK = D.INK
WALL = "#f6eee0"
WALL_D = "#e2d4bc"
ROOF = "#2f6fd0"
GOLD = "#ffd23a"


def Tf(tod):
    return lambda c: tone(c, tod)


def tower(ctx, x, gy, w, h, tod="day", roof_h=None, flag=True, lit=0.0, t=0.0, windows=2, seed=0, roof=ROOF):
    T = Tf(tod)
    roof_h = roof_h or w * 1.25
    D.rect(ctx, x - w / 2, gy - h, w, h, T(WALL), INK, 4, wob=0)
    D.rect(ctx, x + w / 2 - w * 0.22, gy - h, w * 0.22, h, T(WALL_D), None, 0, wob=0)
    D.rect(ctx, x - w / 2, gy - h, w, h, None, INK, 4, wob=0)
    # кирпичики
    r = rng(seed)
    for k in range(int(h / 70)):
        bx = x - w / 2 + r.uniform(10, w - 60)
        D.rect(ctx, bx, gy - h + 40 + k * 70, 44, 18, None, T(WALL_D), 2, wob=0)
    # окна-бойницы
    for k in range(windows):
        wy = gy - h + 120 + k * (h - 240) / max(1, windows - 1 if windows > 1 else 1)
        if windows == 1:
            wy = gy - h * 0.6
        D.rrect(ctx, x - w * 0.12, wy, w * 0.24, w * 0.36, w * 0.12, hexrgb("#ffe9a0") if lit > 0 else T("#3a4a7a"),
                INK, 3)
    # зубцы под крышей
    D.rect(ctx, x - w / 2 - 20, gy - h - 30, w + 40, 40, T(WALL), INK, 4, wob=0)
    # конус
    D.poly(ctx, [(x - w / 2 - 34, gy - h - 26), (x, gy - h - 26 - roof_h), (x + w / 2 + 34, gy - h - 26)],
           T(roof), INK, 4, wob=0)
    D.poly(ctx, [(x, gy - h - 26 - roof_h), (x + w / 2 + 34, gy - h - 26), (x + w * 0.18, gy - h - 26)],
           shade(T(roof), -0.18), None, 0, wob=0)
    # фестоны по низу конуса и золотые кольца
    ctx.save()
    D.path(ctx, [(x - w / 2 - 34, gy - h - 26), (x, gy - h - 26 - roof_h), (x + w / 2 + 34, gy - h - 26)])
    ctx.clip()
    nsc = max(4, int((w + 68) / 60))
    for k in range(nsc):
        cx_ = x - w / 2 - 34 + (k + 0.5) * (w + 68) / nsc
        ctx.arc(cx_, gy - h - 26, (w + 68) / nsc / 2, math.pi, 0)
        D.col(ctx, shade(T(roof), 0.25))
        ctx.fill()
    for k in (0.42, 0.7):
        yy = gy - h - 26 - roof_h * k
        D.line(ctx, x - w, yy, x + w, yy, T(GOLD), 10)
    ctx.restore()
    D.line(ctx, x - w / 2 - 34, gy - h - 26, x + w / 2 + 34, gy - h - 26, T(GOLD), 8)
    D.poly(ctx, [(x - w / 2 - 34, gy - h - 26), (x, gy - h - 26 - roof_h), (x + w / 2 + 34, gy - h - 26)],
           None, INK, 4, wob=0)
    D.circle(ctx, x, gy - h - 26 - roof_h, 16, T(GOLD), INK, 3)
    if flag:
        top = gy - h - 26 - roof_h
        D.line(ctx, x, top, x, top - 140, INK, 6)
        wv = math.sin(t * 4 + seed) * 12
        D.poly(ctx, [(x, top - 140), (x + 110, top - 120 + wv), (x + 100, top - 96 + wv * 0.5), (x, top - 80)],
               T(BRIGHT[seed % len(BRIGHT)]), INK, 3, wob=0)
        star(ctx, x + 42, top - 112 + wv * 0.4, 12, T(GOLD))


def banner(ctx, x, y, w=160, h=360, tod="day", c="#e8423c", t=0.0, seed=0):
    """Свисающее знамя со звездой (x, y — верх по центру)."""
    T = Tf(tod)
    sw = math.sin(t * 1.5 + seed) * 6
    D.line(ctx, x - w / 2 - 20, y, x + w / 2 + 20, y, INK, 10)
    D.line(ctx, x - w / 2 - 20, y, x + w / 2 + 20, y, T(GOLD), 5)
    D.poly(ctx, [(x - w / 2, y), (x + w / 2, y), (x + w / 2 + sw, y + h), (x + sw, y + h - 60),
                 (x - w / 2 + sw, y + h)], T(c), INK, 4, wob=0)
    D.line(ctx, x - w / 2 + 14, y + 10, x - w / 2 + 14 + sw, y + h - 30, T(GOLD), 5)
    D.line(ctx, x + w / 2 - 14, y + 10, x + w / 2 - 14 + sw, y + h - 30, T(GOLD), 5)
    star(ctx, x + sw * 0.5, y + h * 0.4, w * 0.28, T(GOLD), 3)


def pennants(ctx, x0, y0, x1, y1, tod="day", sag=80, seed=0, t=0.0):
    T = Tf(tod)
    n = max(4, int(math.hypot(x1 - x0, y1 - y0) / 70))
    pts = [(lerp(x0, x1, k / n), lerp(y0, y1, k / n) + sag * 4 * (k / n) * (1 - k / n)) for k in range(n + 1)]
    D.polyline(ctx, pts, INK, 3)
    for k in range(n):
        a, b = pts[k], pts[k + 1]
        D.poly(ctx, [a, b, ((a[0] + b[0]) / 2 + math.sin(t * 3 + k) * 4, (a[1] + b[1]) / 2 + 50)],
               T(BRIGHT[(k + seed) % len(BRIGHT)]), INK, 2, wob=0)


def lantern(ctx, x, y, tod="day", on=None):
    T = Tf(tod)
    on = (tod in NIGHT) if on is None else on
    D.line(ctx, x, y - 60, x + 50, y - 60, INK, 8)
    D.line(ctx, x + 50, y - 60, x + 50, y - 30, INK, 5)
    D.poly(ctx, [(x + 30, y - 30), (x + 70, y - 30), (x + 64, y + 40), (x + 36, y + 40)],
           hexrgb("#ffe08a") if on else T("#c9d0d6"), INK, 3, wob=0)
    D.poly(ctx, [(x + 26, y - 30), (x + 50, y - 54), (x + 74, y - 30)], T("#2b2f3a"), INK, 3, wob=0)
    if on:
        D.radial(ctx, x + 50, y + 5, 200, "#ffd978", 0.5, 0)


def planter(ctx, x, gy, tod="day", seed=0):
    T = Tf(tod)
    D.poly(ctx, [(x - 90, gy - 120), (x + 90, gy - 120), (x + 70, gy), (x - 70, gy)], T("#c8603a"), INK, 4, wob=0)
    r = rng(seed)
    for k in range(9):
        fx = x - 70 + k * 17 + r.uniform(-5, 5)
        fy = gy - 140 - r.uniform(0, 60)
        D.circle(ctx, fx, fy + 20, 26, T("#3a8a3a"), INK, 2)
    for k in range(6):
        D.circle(ctx, x - 60 + k * 24 + r.uniform(-6, 6), gy - 170 - r.uniform(0, 30), 12,
                 T(r.choice(["#e8423c", "#ffd23a", "#f05a8a", "#ffffff"])), INK, 2)


def barrel(ctx, x, gy, tod="day", s=1.0):
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rrect(ctx, -70, -190, 140, 190, 40, T("#a8743a"), INK, 4)
    for yy in (-160, -40):
        D.line(ctx, -68, yy, 68, yy, T("#5a606c"), 10)
    ctx.restore()


def wall(ctx, x0, x1, gy, h, tod="day", merlons=True):
    T = Tf(tod)
    D.rect(ctx, x0, gy - h, x1 - x0, h, T(WALL), INK, 4, wob=0)
    for k in range(int((x1 - x0) / 120)):
        D.rect(ctx, x0 + 30 + k * 120, gy - h + 60, 60, 24, None, T(WALL_D), 2, wob=0)
    if merlons:
        for k in range(int((x1 - x0) / 90) + 1):
            mx = x0 + k * 90
            if mx + 50 <= x1:
                D.rect(ctx, mx, gy - h - 50, 50, 54, T(WALL), INK, 4, wob=0)


def gatehouse(ctx, x, gy, w=700, h=900, tod="day", open_k=1.0, lit=0.0):
    """Ворота: арка, решётка (open_k 1 — поднята)."""
    T = Tf(tod)
    D.rect(ctx, x - w / 2, gy - h, w, h, T(WALL), INK, 4, wob=0)
    aw, ah = w * 0.5, h * 0.6
    ctx.move_to(x - aw / 2, gy)
    ctx.line_to(x - aw / 2, gy - ah + aw / 2)
    ctx.arc(x, gy - ah + aw / 2, aw / 2, math.pi, 0)
    ctx.line_to(x + aw / 2, gy)
    ctx.close_path()
    D.col(ctx, hexrgb("#ffe9a0") if lit > 0 else T("#3a3040"))
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    py = gy - ah - (ah * 0.95) * clamp(open_k)
    for k in range(9):
        xx = x - aw / 2 + k * aw / 8
        D.line(ctx, xx, py, xx, py + ah + 40, INK, 12)
        D.line(ctx, xx, py, xx, py + ah + 40, T("#5a606c"), 6)
    for k in range(7):
        yy = py + 40 + k * ah / 6
        D.line(ctx, x - aw / 2, yy, x + aw / 2, yy, T("#5a606c"), 6)
    ctx.restore()
    ctx.move_to(x - aw / 2, gy)
    ctx.line_to(x - aw / 2, gy - ah + aw / 2)
    ctx.arc(x, gy - ah + aw / 2, aw / 2, math.pi, 0)
    ctx.line_to(x + aw / 2, gy)
    D.col(ctx, INK)
    ctx.set_line_width(5)
    ctx.stroke()
    for k in range(int(w / 90)):
        D.rect(ctx, x - w / 2 + 10 + k * 90, gy - h - 50, 50, 54, T(WALL), INK, 4, wob=0)
    star(ctx, x, gy - ah - 90, 50, T(GOLD), 3)


def castle(ctx, x, gy, s=1.0, tod="day", t=0.0, lit=None, gate_open=1.0, clock=None):
    """Фасад замка (фронтально): x — центр ворот, gy — земля у ворот."""
    T = Tf(tod)
    lit = (0.8 if tod in NIGHT else 0.0) if lit is None else lit
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    # дальние башенки разной высоты
    for (tx, tb, tw, th, sd) in ((-260, -900, 160, 900, 7), (260, -900, 160, 1000, 8), (-820, -500, 200, 700, 9),
                                 (820, -500, 200, 760, 10)):
        tower(ctx, tx, tb, tw, th, tod, roof_h=tw * 1.6, lit=lit, t=t, windows=1, seed=sd,
              roof="#7a4fc2" if sd % 2 else ROOF)
    # донжон
    tower(ctx, 0, -500, 520, 1500, tod, roof_h=800, lit=lit, t=t, windows=3, seed=1)
    # розовое окно
    D.circle(ctx, 0, -1100, 110, hexrgb("#ffe9a0") if lit > 0 else T("#8ac8f0"), INK, 5)
    for k in range(8):
        a = k * TAU / 8
        D.line(ctx, 0, -1100, math.cos(a) * 110, -1100 + math.sin(a) * 110, INK, 4)
    D.circle(ctx, 0, -1100, 30, T("#e8423c"), INK, 3)
    if clock:
        D.circle(ctx, 0, -1500, 150, T("#fbfaf6"), INK, 6)
        for k in range(12):
            a = k * TAU / 12
            D.line(ctx, math.cos(a) * 120, -1500 + math.sin(a) * 120, math.cos(a) * 138, -1500 + math.sin(a) * 138,
                   INK, 5)
        hh, mm = clock
        for ang, L, w in ((hh / 12 * TAU, 70, 12), (mm / 60 * TAU, 110, 7)):
            D.line(ctx, 0, -1500, math.sin(ang) * L, -1500 - math.cos(ang) * L, INK, w)
        D.circle(ctx, 0, -1500, 12, INK, None, 0)
    for side in (-1, 1):
        tower(ctx, side * 520, -300, 300, 1100, tod, roof_h=440, lit=lit, t=t, seed=2 + side)
    wall(ctx, -1500, 1500, 0, 600, tod)
    for bx, c in ((-1050, "#e8423c"), (-620, "#2f6fd0"), (620, "#2f6fd0"), (1050, "#e8423c")):
        banner(ctx, bx, -560, 170, 380, tod, c, t, int(bx))
    for side in (-1, 1):
        tower(ctx, side * 1500, 0, 380, 1000, tod, roof_h=480, lit=lit, t=t, seed=5 + side)
    pennants(ctx, -1500, -1040, -520, -1400, tod, 120, 1, t)
    pennants(ctx, 520, -1400, 1500, -1040, tod, 120, 4, t)
    gatehouse(ctx, 0, 0, 760, 820, tod, gate_open, lit)
    for side in (-1, 1):
        lantern(ctx, side * 420 - (60 if side > 0 else -10), -520, tod, lit > 0)
    ctx.restore()


def moat(ctx, x0, x1, y, tod="day", t=0.0, depth=260, bridge=None):
    """Ров перед стеной: вода с бликами; bridge = (x, w) — мост к воротам."""
    T = Tf(tod)
    D.rect(ctx, x0, y, x1 - x0, depth, T("#3fa8d8"), INK, 4, wob=0)
    D.rect(ctx, x0, y, x1 - x0, 30, T("#2a7aa8"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 90)):
        wx = x0 + k * 90 + (t * 30 + k * 23) % 90
        wy = y + 70 + (k * 37) % (depth - 100)
        D.line(ctx, wx, wy, wx + 40, wy, hexrgb("#e6f8ff"), 3, 0.7)
    if bridge:
        bx, bw = bridge
        D.rect(ctx, bx - bw / 2, y - 20, bw, depth + 40, T("#a8743a"), INK, 4, wob=0)
        for k in range(int(bw / 50)):
            D.line(ctx, bx - bw / 2 + k * 50, y - 20, bx - bw / 2 + k * 50, y + depth + 20, T("#8a5a24"), 3)


def courtyard(ctx, tod="day", x0=-1800, x1=4200, gy=900, lit=None, clock=None, t=0.0):
    """Двор замка изнутри: высокие стены по кругу, донжон с часами сзади, брусчатка, ворота сбоку."""
    T = Tf(tod)
    lit = (0.8 if tod in NIGHT else 0.0) if lit is None else lit
    cx = (x0 + x1) / 2
    tower(ctx, cx, gy - 600, 700, 1800, tod, roof_h=900, lit=lit, t=t, windows=3, seed=1)
    if clock:
        D.circle(ctx, cx, gy - 1900, 190, T("#fbfaf6"), INK, 6)
        for k in range(12):
            a = k * TAU / 12
            D.line(ctx, cx + math.cos(a) * 150, gy - 1900 + math.sin(a) * 150, cx + math.cos(a) * 175,
                   gy - 1900 + math.sin(a) * 175, INK, 6)
        hh, mm = clock
        for ang, L, w in ((hh / 12 * TAU, 90, 14), (mm / 60 * TAU, 140, 8)):
            D.line(ctx, cx, gy - 1900, cx + math.sin(ang) * L, gy - 1900 - math.cos(ang) * L, INK, w)
        D.circle(ctx, cx, gy - 1900, 14, INK, None, 0)
    wall(ctx, x0, x1, gy - 40, 820, tod)
    for xx in (x0 + 300, x1 - 300):
        tower(ctx, xx, gy - 40, 420, 1200, tod, roof_h=520, lit=lit, t=t, seed=int(xx) % 7)
    gatehouse(ctx, x1 - 1100, gy - 40, 640, 760, tod, 0.0, lit)
    for k, bx in enumerate((x0 + 900, x0 + 1700, x1 - 1900)):
        banner(ctx, bx, gy - 820, 180, 420, tod, ["#e8423c", "#2f6fd0", "#7a4fc2"][k], t, k)
    for lx in (x0 + 1300, x1 - 1500, x1 - 700):
        lantern(ctx, lx, gy - 560, tod, lit > 0)
    pennants(ctx, x0 + 300, gy - 1300, cx - 350, gy - 1600, tod, 140, 2, t)
    pennants(ctx, cx + 350, gy - 1600, x1 - 300, gy - 1300, tod, 140, 5, t)
    # брусчатка (в пределах двора)
    ctx.save()
    ctx.rectangle(x0, gy - 60, x1 - x0, 1300)
    ctx.clip()
    D.rect(ctx, x0, gy - 60, x1 - x0, 1300, T("#e2d2b0"), None, 0, wob=0)
    r = rng(5)
    for row in range(16):
        yy = gy - 50 + row * row * 5 + row * 22
        hh = 16 + row * 2.2
        for k in range(int((x1 - x0) / 96) + 2):
            xx = x0 - 40 + k * 96 + (48 if row % 2 else 0) + r.uniform(-6, 6)
            D.rrect(ctx, xx, yy, 86, hh, 8, T("#cdb995"), None, 0)
    ctx.restore()
    D.rect(ctx, x0, gy - 60, x1 - x0, 14, T("#b8a480"), None, 0, wob=0)
    for px in (x0 + 600, x1 - 2300):
        planter(ctx, px, gy - 30, tod, int(px))
    barrel(ctx, x1 - 450, gy - 20, tod)
    barrel(ctx, x1 - 300, gy - 10, tod, 0.9)
