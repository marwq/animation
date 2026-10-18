"""Аэростат Sky Balloon: оболочка из полос-клиньев с заплатками из костюмов, надув (лежит → встаёт →
стоит), свечение от горелки, корзина, горелка с пламенем, трос привязи; сарай; модель из пакета.

envelope(ctx, bx, by, s, fill, ...) — (bx, by) — горловина (низ оболочки), s — масштаб
(s = 1: высота оболочки ~1700, ширина ~1300). basket(...) — корзина под горловиной.
"""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, ease_io
from engine import draw as D
from sets.base import tone, NIGHT
from sets.park import star

INK = D.INK
GORES = ["#e8423c", "#ffd23a", "#2f8fd8", "#fbfaf6", "#e8423c", "#ffd23a", "#2f8fd8", "#fbfaf6",
         "#e8423c", "#ffd23a", "#2f8fd8", "#fbfaf6"]
# заплатки из костюмов: (φ — долгота -1..1, v — высота 0 верх..1 горловина, размер, вид)
PATCHES = [(-0.55, 0.32, 0.16, "dragon"), (0.2, 0.22, 0.13, "cow"), (0.62, 0.46, 0.14, "hotdog"),
           (-0.2, 0.55, 0.12, "cow"), (0.35, 0.68, 0.1, "dragon"), (-0.68, 0.62, 0.1, "hotdog"),
           (0.05, 0.42, 0.09, "rainbow"), (-0.4, 0.12, 0.1, "rainbow"), (0.75, 0.25, 0.08, "cow"),
           (-0.05, 0.78, 0.07, "dragon")]
ENV_H = 1700.0
ENV_R = 650.0


def Tf(tod):
    return lambda c: tone(c, tod)


def _radius(v):
    """Радиус оболочки на высоте v (0 — макушка, 1 — горловина), в долях ENV_R."""
    if v < 0.36:
        return math.sin(math.acos(1 - v / 0.36)) * 1.0
    u = (v - 0.36) / 0.64
    return lerp(1.0, 0.17, u ** 1.15) * (1 - 0.06 * math.sin(u * math.pi))


def _pt(cx, top, H, R, phi, v, lean=0.0):
    """Точка на видимой половине оболочки: phi -1..1 (лево-право), v 0..1 (верх-низ)."""
    r = _radius(v) * R
    x = cx + math.sin(phi * math.pi / 2) * r + lean * (1 - v) * H * 0.4
    y = top + v * H
    return x, y


def patch_shape(ctx, kind, T):
    """Узор заплатки в единичном квадрате [-1, 1]."""
    if kind == "dragon":
        D.rect(ctx, -1, -1, 2, 2, T("#3fbf6a"), None, 0, wob=0)
        D.col(ctx, T("#2a8a4a"))
        for k in range(3):
            for j in range(3):
                ctx.arc(-0.66 + j * 0.66, -0.6 + k * 0.6, 0.28, 0, math.pi)
                ctx.fill()
    elif kind == "cow":
        D.rect(ctx, -1, -1, 2, 2, T("#fbfaf6"), None, 0, wob=0)
        for (x, y, r) in ((-0.4, -0.3, 0.38), (0.5, 0.4, 0.3), (0.3, -0.6, 0.18)):
            D.ellipse(ctx, x, y, r, r * 0.8, T("#2b2c31"), None, 0)
    elif kind == "hotdog":
        D.rect(ctx, -1, -1, 2, 2, T("#f2c230"), None, 0, wob=0)
        D.rect(ctx, -1, -0.25, 2, 0.5, T("#c8503a"), None, 0, wob=0)
        D.col(ctx, T("#e8423c"))
        ctx.set_line_width(0.14)
        ctx.move_to(-0.9, 0)
        for k in range(5):
            ctx.line_to(-0.7 + k * 0.4, -0.15 if k % 2 == 0 else 0.15)
        ctx.stroke()
    else:
        cols = ["#e8423c", "#f2a03a", "#ffd23a", "#3fbf6a", "#2f8fd8", "#7a4fc2"]
        for k, c in enumerate(cols):
            D.rect(ctx, -1, -1 + k / 3, 2, 1 / 3 + 0.01, T(c), None, 0, wob=0)


def envelope(ctx, bx, by, s=1.0, fill=1.0, tod="day", spin=0.0, patches=None, glow=0.0, t=0.0, lean=0.0,
             wobble=0.0, n=12):
    """Оболочка: горловина в (bx, by). fill 0..1 — надув (меньше 1 — мятая и ниже).
    patches — сколько заплаток видно (None — все). glow — свечение от горелки."""
    T = Tf(tod)
    patches = PATCHES if patches is None else PATCHES[:patches]
    f = clamp(fill)
    H = ENV_H * s * (0.55 + 0.45 * f)
    R = ENV_R * s * (0.35 + 0.65 * f)
    top = by - H
    cx = bx
    wob = (1 - f) * 0.08 + wobble

    def P(phi, v):
        x, y = _pt(cx, top, H, R, phi, v, lean)
        if wob > 0:
            x += math.sin(v * 17 + phi * 5 + t * 3) * wob * R * 0.5 * (1 - v * 0.3)
            y += math.sin(phi * 9 + v * 5) * wob * H * 0.06
        return x, y

    # силуэт
    def outline_path():
        ctx.new_path()
        steps = 40
        for k in range(steps + 1):
            x, y = P(-1.0, k / steps)
            (ctx.move_to if k == 0 else ctx.line_to)(x, y)
        for k in range(steps + 1):
            x, y = P(1.0, 1 - k / steps)
            ctx.line_to(x, y)
        ctx.close_path()

    outline_path()
    ctx.save()
    ctx.clip()
    # клинья: n по кругу, видна половина (n/2), граница сдвигается с вращением spin (в клиньях)
    m = n // 2 + 2
    off = (spin % 1.0) * 2 / (n // 2)
    for i in range(-2, m + 1):
        p0 = -1 + i * 2 / (n // 2) + off
        p1 = p0 + 2 / (n // 2)
        lo, hi = max(-1.0, p0), min(1.0, p1)
        if hi <= lo:
            continue
        c = T(GORES[(i - int(math.floor(spin))) % len(GORES)])
        ctx.new_path()
        steps = 30
        for k in range(steps + 1):
            x, y = P(lo, k / steps)
            (ctx.move_to if k == 0 else ctx.line_to)(x, y)
        for k in range(steps + 1):
            x, y = P(hi, 1 - k / steps)
            ctx.line_to(x, y)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill()
    # заплатки
    for (phi, v, size, kind) in patches:
        if not -0.9 < phi < 0.9:
            continue
        x0, y0 = P(phi - size, v - size * 0.5)
        x1, y1 = P(phi + size, v - size * 0.5)
        x2, y2 = P(phi + size, v + size * 0.5)
        x3, y3 = P(phi - size, v + size * 0.5)
        ctx.save()
        ctx.new_path()
        ctx.move_to(x0, y0)
        ctx.line_to(x1, y1)
        ctx.line_to(x2, y2)
        ctx.line_to(x3, y3)
        ctx.close_path()
        ctx.clip_preserve()
        mx, my = (x0 + x1 + x2 + x3) / 4, (y0 + y1 + y2 + y3) / 4
        w, h = max(abs(x1 - x0), abs(x2 - x3)) / 2 + 1, (abs(y3 - y0) + abs(y2 - y1)) / 4 + 1
        ctx.save()
        ctx.translate(mx, my)
        ctx.scale(w, h)
        patch_shape(ctx, kind, T)
        ctx.restore()
        ctx.restore()
        D.col(ctx, INK)
        ctx.set_line_width(2.5 * s)
        ctx.set_dash([10 * s, 7 * s])
        ctx.move_to(x0, y0)
        ctx.line_to(x1, y1)
        ctx.line_to(x2, y2)
        ctx.line_to(x3, y3)
        ctx.close_path()
        ctx.stroke()
        ctx.set_dash([])
    # объём: тень справа и блик слева
    ctx.new_path()
    g = cairo.LinearGradient(cx - R, 0, cx + R, 0)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.22)
    g.add_color_stop_rgba(0.35, 1, 1, 1, 0.0)
    g.add_color_stop_rgba(0.7, 0, 0, 0, 0.0)
    g.add_color_stop_rgba(1, 0, 0, 0, 0.28)
    ctx.set_source(g)
    ctx.paint()
    # швы-ленты (горизонтальные пояса)
    D.col(ctx, INK, 0.25)
    ctx.set_line_width(3 * s)
    for v in (0.22, 0.45, 0.68):
        ctx.new_path()
        for k in range(31):
            x, y = P(-1 + k / 15, v)
            (ctx.move_to if k == 0 else ctx.line_to)(x, y + math.sin(k / 30 * math.pi) * R * 0.05)
        ctx.stroke()
    if glow > 0:
        gx, gy_ = P(0.0, 0.62)
        rg = cairo.RadialGradient(gx, gy_, 0, gx, gy_, R * 1.4)
        rg.add_color_stop_rgba(0, 1, 0.85, 0.45, 0.75 * glow)
        rg.add_color_stop_rgba(0.6, 1, 0.6, 0.2, 0.35 * glow)
        rg.add_color_stop_rgba(1, 1, 0.5, 0.1, 0.0)
        ctx.set_source(rg)
        ctx.paint()
    ctx.restore()
    outline_path()
    D.col(ctx, INK)
    ctx.set_line_width(5 * s)
    ctx.stroke()
    # корона на макушке и надпись
    if f > 0.8:
        D.circle(ctx, *P(0.0, 0.0), 26 * s, T("#fbfaf6"), INK, 3)
        lx, ly = P(0.0, 0.5)
        D.text(ctx, "SKY BALLOON", lx, ly + 20 * s, 64 * s, D.FONT_TITLE, T("#fbfaf6"), stroke=INK, slw=6 * s)
    # горловина: юбка
    xl, yl = P(-1.0, 1.0)
    xr, yr = P(1.0, 1.0)
    D.poly(ctx, [(xl, yl), (xr, yr), (xr + 20 * s, yr + 90 * s), (xl - 20 * s, yl + 90 * s)], T("#2b2f3a"), INK, 3,
           wob=0)
    return dict(throat=((xl + xr) / 2, (yl + yr) / 2 + 90 * s), left=(xl, yl), right=(xr, yr), top=P(0.0, 0.0),
                R=R, H=H)


def flame(ctx, x, y, k, s=1.0, t=0.0):
    """Пламя горелки вверх из (x, y), k 0..1 — сила."""
    if k <= 0:
        return
    h = (120 + 380 * k) * s * (0.9 + 0.1 * math.sin(t * 31))
    w = (26 + 30 * k) * s
    D.radial(ctx, x, y - h * 0.5, h * 0.9, "#ffb03c", 0.55 * k, 0)
    for c, kw, kh in (("#ff7a1c", 1.0, 1.0), ("#ffd23a", 0.65, 0.78), ("#fff6c8", 0.35, 0.55), ("#8ad8ff", 0.25, 0.2)):
        ctx.move_to(x - w * kw, y)
        ctx.curve_to(x - w * kw * 1.1, y - h * kh * 0.5, x - w * kw * 0.2, y - h * kh * 0.8, x, y - h * kh)
        ctx.curve_to(x + w * kw * 0.2, y - h * kh * 0.8, x + w * kw * 1.1, y - h * kh * 0.5, x + w * kw, y)
        ctx.close_path()
        D.col(ctx, hexrgb(c))
        ctx.fill()


def basket(ctx, x, gy, s=1.0, tod="day", burner=0.0, t=0.0, cables_to=None, inside=None, tanks=2):
    """Корзина: (x, gy) — низ корзины. cables_to — (xl, yl, xr, yr) точки на горловине.
    inside(ctx, x, rim_y, s) — кто в корзине (рисуется между задней и передней стенками)."""
    T = Tf(tod)
    w, h = 360 * s, 300 * s
    rim = gy - h
    frame_y = rim - 420 * s
    # стойки рамы горелки и тросы к оболочке
    for k in (-1, 1):
        D.line(ctx, x + k * w * 0.42, rim, x + k * 70 * s, frame_y, INK, 7 * s)
        D.line(ctx, x + k * w * 0.42, rim, x + k * 70 * s, frame_y, T("#8f99a3"), 3.5 * s)
    if cables_to:
        xl, yl, xr, yr = cables_to
        for (cx_, cy_), k in (((xl, yl), -1), ((xr, yr), 1)):
            D.line(ctx, x + k * 70 * s, frame_y, cx_, cy_, INK, 4 * s)
    # задняя стенка (тёмная внутренность)
    D.rect(ctx, x - w / 2 + 14 * s, rim - 6 * s, w - 28 * s, 40 * s, T("#5a3a1e"), None, 0, wob=0)
    for k in range(tanks):     # баллоны стоят у задней стенки, по углам
        tx = x - w / 2 + 50 * s if k == 0 else x + w / 2 - 50 * s
        D.rrect(ctx, tx - 32 * s, rim - 70 * s, 64 * s, 96 * s, 22 * s, T("#e8f0f4"), INK, 3)
        D.rect(ctx, tx - 32 * s, rim - 50 * s, 64 * s, 8 * s, T("#c23b33"), None, 0, wob=0)
    if inside:
        inside(ctx, x, rim, s)
    # горелка
    D.rrect(ctx, x - 80 * s, frame_y - 50 * s, 160 * s, 60 * s, 14 * s, T("#8f99a3"), INK, 3)
    for k in (-1, 1):
        D.circle(ctx, x + k * 40 * s, frame_y - 20 * s, 26 * s, T("#c9d0d6"), INK, 3)
        for j in range(3):
            D.circle(ctx, x + k * 40 * s, frame_y - 20 * s, (20 - j * 6) * s, None, T("#6a707a"), 2)
    flame(ctx, x, frame_y - 50 * s, burner, s, t)
    # плетёная корзина (передняя стенка)
    D.rect(ctx, x - w / 2, rim, w, h, T("#c8903a"), INK, 5, wob=0)
    D.col(ctx, T("#a8702a"))
    ctx.set_line_width(4 * s)
    for k in range(1, int(h / (26 * s))):
        yy = rim + k * 26 * s
        ctx.move_to(x - w / 2, yy)
        ctx.line_to(x + w / 2, yy)
    ctx.stroke()
    D.col(ctx, T("#8a5a24"), 0.8)
    for k in range(int(w / (34 * s))):
        for j in range(int(h / (26 * s))):
            xx = x - w / 2 + 17 * s + k * 34 * s + (17 * s if j % 2 else 0)
            if xx < x + w / 2 - 6 * s:
                ctx.rectangle(xx - 3 * s, rim + j * 26 * s + 4 * s, 6 * s, 18 * s)
    ctx.fill()
    D.rrect(ctx, x - w / 2 - 14 * s, rim - 24 * s, w + 28 * s, 40 * s, 18 * s, T("#7a4a24"), INK, 4)
    D.rect(ctx, x - w / 2, gy - 18 * s, w, 18 * s, T("#7a4a24"), INK, 3, wob=0)
    return dict(rim=rim, frame=frame_y, w=w)


def tether(ctx, x0, y0, x1, y1, taut=1.0, tod="day", knot=True, cut=None):
    """Трос привязи от корзины (x0, y0) к колышку (x1, y1). cut — (u, k): перегрызен в точке u."""
    T = Tf(tod)
    sag = (1 - taut) * 160
    pts = []
    for k in range(21):
        u = k / 20
        pts.append((lerp(x0, x1, u) + math.sin(u * 9) * 4 * (1 - taut), lerp(y0, y1, u) + sag * 4 * u * (1 - u)))
    if cut:
        cu, ck = cut
        i = max(1, int(cu * 20))
        a, b = pts[:i + 1], pts[i:]
        drop = ck * 120
        b = [(px + (px - b[0][0]) * 0.1 * ck, py + drop * (k / len(b))) for k, (px, py) in enumerate(b)]
        a = [(px, py - ck * 40 * (k / len(a))) for k, (px, py) in enumerate(a)]
        for seg in (a, b):
            D.polyline(ctx, seg, INK, 14)
            D.polyline(ctx, seg, T("#d8b878"), 8)
    else:
        D.polyline(ctx, pts, INK, 14)
        D.polyline(ctx, pts, T("#d8b878"), 8)
        for k in range(20):
            px, py = pts[k]
            D.line(ctx, px - 4, py - 4, px + 4, py + 4, T("#a8884a"), 2)
    # колышек и узел
    D.rect(ctx, x1 - 16, y1 - 10, 32, 60, T("#5a606c"), INK, 3, wob=0)
    if knot:
        D.circle(ctx, x1, y1 - 8, 22, T("#c8a868"), INK, 3)
        D.curve(ctx, [(x1 - 20, y1 - 8), (x1 - 2, y1 - 26), (x1 + 18, y1 - 6)], T("#a8884a"), 4)


def folded(ctx, x, gy, s=1.0, tod="day", seed=2):
    """Сложенная оболочка — гора полосатой ткани."""
    T = Tf(tod)
    r = rng(seed)
    heap = [(x - 520 * s, gy), (x - 470 * s, gy - 170 * s), (x - 300 * s, gy - 300 * s), (x - 80 * s, gy - 380 * s),
            (x + 160 * s, gy - 340 * s), (x + 380 * s, gy - 240 * s), (x + 520 * s, gy - 90 * s), (x + 540 * s, gy)]
    D.blob(ctx, heap, T(GORES[0]), INK, 4)
    ctx.save()
    D.catmull(ctx, heap, closed=True)
    ctx.clip()
    for k in range(7):        # складки-полосы разных клиньев
        yy = gy - 40 * s - k * 52 * s
        c = T(GORES[(k + 1) % 4])
        ctx.move_to(x - 600 * s, yy)
        for j in range(9):
            ctx.line_to(x - 600 * s + j * 150 * s, yy - 30 * s * math.sin(j * 1.3 + k) - 18 * s)
        ctx.line_to(x + 700 * s, yy + 40 * s)
        ctx.line_to(x - 600 * s, yy + 40 * s)
        ctx.close_path()
        D.col(ctx, c)
        ctx.fill()
    D.col(ctx, INK, 0.5)
    ctx.set_line_width(3)
    for k in range(6):
        ctx.move_to(x - 420 * s + k * 160 * s, gy - 30 * s)
        ctx.curve_to(x - 380 * s + k * 160 * s, gy - 150 * s, x - 330 * s + k * 150 * s, gy - 210 * s,
                     x - 300 * s + k * 140 * s, gy - 260 * s)
        ctx.stroke()
    ctx.restore()


def laid_out(ctx, x, gy, s=1.0, tod="day", patches=None, t=0.0, lift=0.0):
    """Оболочка разложена на земле (лежит на боку, горловиной влево), lift 0..1 — приподнимается от
    вентилятора. Рисуем как приплюснутый силуэт той же раскраски."""
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(1.0, 0.32 + 0.5 * lift)
    ctx.rotate(math.pi / 2)          # макушка вправо, горловина в (x, gy)
    ctx.translate(0, 0)
    envelope(ctx, 0, 0, s, 0.95, tod, 0.0, patches, 0.0, t, wobble=0.06 * (1 - lift))
    ctx.restore()


def shed(ctx, x, gy, w=1600, h=1100, tod="day", open_k=0.0, lit=None):
    """Сарай аэростата: деревянный, с раздвижными воротами (open_k 0..1)."""
    T = Tf(tod)
    lit = (tod in NIGHT) if lit is None else lit
    D.poly(ctx, [(x - w / 2, gy), (x - w / 2, gy - h), (x, gy - h - 380), (x + w / 2, gy - h), (x + w / 2, gy)],
           T("#c8603a"), INK, 5, wob=0)
    for k in range(int(w / 50)):
        xx = x - w / 2 + k * 50
        D.line(ctx, xx, gy, xx, gy - h, T("#a84a2a"), 3)
    D.poly(ctx, [(x - w / 2 - 60, gy - h + 10), (x, gy - h - 400), (x + w / 2 + 60, gy - h + 10)], None, INK, 0,
           wob=0)
    D.line(ctx, x - w / 2 - 60, gy - h + 20, x, gy - h - 400, INK, 30)
    D.line(ctx, x + w / 2 + 60, gy - h + 20, x, gy - h - 400, INK, 30)
    D.line(ctx, x - w / 2 - 60, gy - h + 20, x, gy - h - 400, T("#5a606c"), 22)
    D.line(ctx, x + w / 2 + 60, gy - h + 20, x, gy - h - 400, T("#5a606c"), 22)
    D.rrect(ctx, x - 420, gy - h - 200, 840, 130, 24, T("#fbfaf6"), INK, 4)
    D.text(ctx, "SKY BALLOON", x, gy - h - 112, 70, D.FONT_TITLE, T("#2f8fd8"))
    # проём и створки
    dw, dh = w * 0.7, h * 0.82
    D.rect(ctx, x - dw / 2, gy - dh, dw, dh, hexrgb("#ffe9a0") if lit else T("#2b2420"), INK, 4, wob=0)
    for side in (-1, 1):
        k = clamp(open_k)
        x0 = x - dw / 2 + (0 if side < 0 else dw / 2)
        shift = side * dw / 2 * k * 0.95
        D.rect(ctx, x0 + shift, gy - dh, dw / 2, dh, T("#e8763a"), INK, 4, wob=0)
        D.line(ctx, x0 + shift, gy - dh, x0 + shift + dw / 2, gy, T("#c8603a"), 6)
        D.line(ctx, x0 + shift + dw / 2, gy - dh, x0 + shift, gy, T("#c8603a"), 6)
    D.rect(ctx, x - dw / 2 - 30, gy - dh - 30, dw + 60, 30, T("#5a606c"), INK, 3, wob=0)


def trash_balloon(ctx, x, y, s=1.0, t=0.0, tod="day", fill=1.0, lit=True):
    """Модель из белого мусорного пакета со свечкой (урок первый): (x, y) — горловина пакета,
    стаканчик со свечкой висит ниже, его дно — y + 72·s."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    h = 220 * (0.4 + 0.6 * fill)
    wob = (1 - fill) * 18

    def bag_path():
        ctx.move_to(-30, 0)
        ctx.curve_to(-150 + wob, -h * 0.4, -110, -h + wob, 0, -h)
        ctx.curve_to(110, -h - wob, 150 - wob, -h * 0.4, 30, 0)
        ctx.close_path()
    bag_path()
    D.col(ctx, T("#eef2f5"))
    ctx.fill()
    if lit:       # свечка подсвечивает пакет изнутри
        bag_path()
        ctx.save()
        ctx.clip()
        D.radial(ctx, 0, -20, h * 0.9, "#ffc870", 0.55, 0)
        ctx.restore()
    bag_path()
    D.col(ctx, INK)
    ctx.set_line_width(4)
    ctx.stroke()
    for k in (-1, 1):       # складки плёнки
        D.curve(ctx, [(k * 40, -h * 0.2), (k * 70, -h * 0.5), (k * 40, -h * 0.85)], T("#b8c4cc"), 4)
    D.curve(ctx, [(-34, -4), (-10, 6), (10, -2), (34, -4)], T("#e8423c"), 6)      # завязки
    D.line(ctx, -34, -4, -48, 10, T("#e8423c"), 5)
    for k in (-1, 1):
        D.line(ctx, k * 30, 0, k * 14, 60, INK, 2)
    D.rect(ctx, -16, 60, 32, 12, T("#c9d0d6"), INK, 2, wob=0)
    D.rect(ctx, -6, 34, 12, 26, T("#f6a8c8"), INK, 2, wob=0)
    D.line(ctx, 0, 34, 0, 26, INK, 2)
    if lit:
        flame(ctx, 0, 30, 0.12, 0.5, t)
    ctx.restore()
