"""День 2: ночью магазин светится, как фонарь, и к нему, как мотыльки, тянутся силуэты. В городе без света одно
окно видно за мили. Щиток: сорок автоматов, ни одной подписи. По одному гасишь фасад — вывеска последней."""
import cairo

from scenes.kit import *

ZT = ("#1e2a40", 0.28)                       # зомби на ночной парковке
SIGN = (1154, 708, 1587, 788)
LAMPS = [(500, 290), (680, 280), (2110, 290), (2300, 280)]
POOLS = [(640, 1180, 420), (2230, 1200, 420)]
GLASS = [(950, 838, 1300, 1032), (1300, 838, 1640, 1032), (1640, 838, 1992, 1032)]
WALKERS = [((-60, 1500), (820, 1118), 0.0), ((2800, 1430), (2010, 1100), 1.3), ((1150, 1700), (1330, 1150), 2.1)]


def shot(start, fn, trans="cut", tlen=0.3):
    return Shot(start, lambda ctx, t, S, f=fn, s0=start: f(ctx, s0 + t, S), trans, tlen)


def lot_r(y):
    """Перспектива парковки (по разметке мест и тележкам): горизонт ≈ 892."""
    return max(14.0, 0.13 * (y - 892))


# --- фасад: огни, мотыльки, силуэты, отключение --------------------------------------

def dim(ctx, color, alpha, shape):
    """Затемнение умножением (текстура фона сохраняется): shape(ctx) задаёт путь."""
    if alpha <= 0:
        return
    ctx.save()
    shape(ctx)
    ctx.clip()
    ctx.set_operator(cairo.OPERATOR_MULTIPLY)
    D.col(ctx, hexrgb(color), alpha)
    ctx.paint()
    ctx.restore()


def dim_soft(ctx, color, alpha, x, y, r, sy=1.0):
    """Мягкое радиальное затемнение умножением (погасший фонарь и его пятно на асфальте)."""
    if alpha <= 0:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1, sy)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, r)
    g.add_color_stop_rgba(0, 0, 0, 0, alpha)
    g.add_color_stop_rgba(0.55, 0, 0, 0, alpha * 0.8)
    g.add_color_stop_rgba(1, 0, 0, 0, 0)
    ctx.set_operator(cairo.OPERATOR_MULTIPLY)
    D.col(ctx, hexrgb(color))
    ctx.mask(g)
    ctx.restore()


def off_k(T, t0):
    """Выключатель: 0 → 1 с коротким миганием."""
    if T < t0:
        return 0.0
    u = T - t0
    if u < 0.06:
        return 1.0
    if u < 0.1:
        return 0.3
    return 1.0


def moths(ctx, T, k=1.0):
    if k <= 0:
        return
    for i, (lx, ly) in enumerate(LAMPS):
        for j in range(4):
            a = T * (2.2 + 0.4 * j) + i * 1.7 + j * 2.1
            x = lx + math.cos(a) * (40 + 18 * j) + math.sin(a * 2.3) * 10
            y = ly + 40 + math.sin(a * 1.4) * (25 + 8 * j)
            flap = 3 + 3 * abs(math.sin(T * 30 + j))
            D.ellipse(ctx, x - flap, y, flap, 3, hexrgb("#fff3d0"), None, 0, alpha=0.85 * k)
            D.ellipse(ctx, x + flap, y, flap, 3, hexrgb("#fff3d0"), None, 0, alpha=0.85 * k)


def walker_pos(T, S, i):
    """Путь силуэта: подтягиваются к свету, после отключения — разбредаются."""
    (x0, y0), (x1, y1), sd = WALKERS[i]
    t0 = S.cue(2) - 0.1 + 0.4 * i
    t_dark = S.word("last", S.cue(5)) + 0.6
    k = clamp((T - t0) / 13.0)
    back = clamp((T - t_dark) / 6.0) * 0.25
    u = k - back
    x, y = lerp(x0, x1, u), lerp(y0, y1, u)
    moving = (k < 1 and T > t0) or back > 0
    f = (1 if x1 > x0 else -1) * (-1 if back > 0 else 1)
    dist = math.hypot(x1 - x0, y1 - y0) * (u if back == 0 else (2 - u))
    return x, y, f, dist, moving, sd


def walkers(ctx, T, S):
    for i in range(len(WALKERS)):
        x, y, f, dist, moving, sd = walker_pos(T, S, i)
        r = lot_r(y)
        if moving:
            p = shamble(dist / (ST.WALK_STRIDE * r), sd)
        else:
            p = ST.stand(T, int(sd * 10))
            p.update(h1=(1.6, -3.9), h2=(1.4, -3.7), lean=0.12, tilt=0.15 + 0.05 * math.sin(T + sd), mouth=0.7)
        p["blink"] = False
        ST.draw(ctx, x, y, r, f, p, zombie_look(int(sd * 10) + 3, ZT))


def exterior(ctx, T, S, cam, l, lights=None):
    """lights: dict с моментами отключения (lot, glass0..2, sign) или None — всё горит."""
    lights = lights or {}
    k_lot = off_k(T, lights.get("lot", 1e9))
    with on(ctx, cam, l):
        paint(ctx, "exterior_night")
        x0, y0, x1, y1 = SIGN
        k_sign = off_k(T, lights.get("sign", 1e9))
        if k_sign < 1:
            fx.glow(ctx, (x0 + x1) / 2, (y0 + y1) / 2, 380, "#7cf09a", 0.12 * (1 - k_sign))
            D.text(ctx, "GREENLEAF MARKET", (x0 + x1) / 2, y1 - 22, 52, "Inter", hexrgb("#f7fff4"), bold=True,
                   stroke=hexrgb("#1f5a33"), slw=5, tracking=3, alpha=1 - k_sign)
        # фонари парковки
        for lx, ly in LAMPS:
            dim_soft(ctx, "#5a6278", k_lot, lx, ly + 12, 150)
        for lx, ly in ((980, 598), (1732, 604)):         # дальние фонари у фасада
            dim_soft(ctx, "#4a5268", k_lot, lx, ly, 60)
        for px, py, pr in POOLS:
            dim_soft(ctx, "#3a4058", k_lot * 0.9, px, py, pr * 1.3, 0.38)
        for gi in range(3):                              # свет из витрин на асфальте гаснет вместе с ними
            kg = off_k(T, lights.get("glass%d" % gi, 1e9))
            dim_soft(ctx, "#3a4058", kg * 0.85, 1120 + gi * 340, 1110, 330, 0.35)
        for gi, (gx0, gy0, gx1, gy1) in enumerate(GLASS):
            kg = off_k(T, lights.get("glass%d" % gi, 1e9))
            dim(ctx, "#1c2236", kg * 0.92, lambda c, a=(gx0, gy0, gx1, gy1): c.rectangle(a[0], a[1], a[2] - a[0],
                                                                                             a[3] - a[1]))
        dim(ctx, "#203024", k_sign * 0.95, lambda c: c.rectangle(x0 - 6, y0 - 6, x1 - x0 + 12, y1 - y0 + 12))
        moths(ctx, T, 1 - k_lot)
        if T > S.cue(2) - 0.4:
            walkers(ctx, T, S)
    # общая ночь сгущается, когда всё выключено
    allk = min(k_lot, off_k(T, lights.get("sign", 1e9)))
    fx.flash(ctx, 0.35 * allk, "#05070f")


def lantern(ctx, T, S):
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("exterior_night", 1360, 820, Keys((0, 1.18), (5.5, 1.04, "lin")))
    exterior(ctx, T, S, cam, l)


def drifting(ctx, T, S):
    l = T - (S.cue(2) - 0.3)
    cam = PlateCam("exterior_night", 1360, 900, Keys((0, 1.0), (5.5, 1.04, "lin")))
    exterior(ctx, T, S, cam, l)


# --- город без света ------------------------------------------------------------------

def town(ctx, T, S):
    l = T - (S.cue(3) - 0.3)
    cam = PlateCam("town_aerial", Keys((0, 1700), (5, 1500, "lin")), Keys((0, 820), (5, 760, "lin")),
                   Keys((0, 1.9), (5, 1.0, "io")))
    with on(ctx, cam, l):
        paint(ctx, "town_aerial")
        # вывеска: зелёная, ровная надпись вместо мешанины
        ox, oy = 1617, 706
        ux, uy = 131, 41
        L = math.hypot(ux, uy)
        ctx.save()
        ctx.transform(cairo.Matrix(ux / L, uy / L, -3 / 38, 1.0, ox, oy))
        D.rect(ctx, -4, -3, L + 8, 42, hexrgb("#3f9d5a"), INK, 4, wob=0)
        D.text(ctx, "GREENLEAF", L / 2, 29, 25, "Inter", hexrgb("#f7fff4"), bold=True, tracking=1)
        ctx.restore()
        # весь город без света, кроме магазина
        ctx.save()
        ctx.push_group()
        D.col(ctx, hexrgb("#2c3550"))
        ctx.paint()
        ctx.set_operator(cairo.OPERATOR_DEST_OUT)
        g = cairo.RadialGradient(1640, 880, 120, 1640, 880, 620)
        g.add_color_stop_rgba(0, 0, 0, 0, 1)
        g.add_color_stop_rgba(1, 0, 0, 0, 0)
        ctx.set_source(g)
        ctx.paint()
        pat = ctx.pop_group()
        ctx.set_operator(cairo.OPERATOR_MULTIPLY)
        ctx.set_source(pat)
        ctx.paint()
        ctx.restore()
        fx.glow(ctx, 1640, 820, 420, "#ffcf7a", 0.22 + 0.03 * math.sin(T * 3))


# --- щиток -----------------------------------------------------------------------------

COL = (1132, 450, 1290, 1104)       # левая колонка автоматов
ROWS = 20


def switches(ctx, T, flips):
    """Свой ряд автоматов поверх нарисованного: flips — моменты, когда ряд i выключается."""
    x0, y0, x1, y1 = COL
    h = (y1 - y0) / ROWS
    for i in range(ROWS):
        y = y0 + i * h
        D.rect(ctx, x0, y + 2, x1 - x0, h - 4, hexrgb("#e3dfd3"), INK, 3, wob=0)
        k = smooth(clamp((T - flips[i]) / 0.08)) if i in flips else 0.0
        tx = lerp(x0 + 18, x0 + 80, k)
        D.rrect(ctx, tx, y + 6, 58, h - 12, 4, hexrgb("#1f2024") if k < 0.5 else hexrgb("#3a3b40"), INK, 2)
        D.circle(ctx, x1 - 18, y + h / 2, 5, hexrgb("#c8392f") if k > 0.5 else hexrgb("#7a9a6a"), INK, 1.5)


def panel_hero(ctx, T, S):
    """Герой у щитка: «сорок автоматов, и ни одной подписи»."""
    l = T - (S.cue(4) - 0.3)
    t_lab = S.word("labeled", S.cue(4)) - 0.3
    cam = PlateCam("breaker", 1500, 780, Keys((0, 1.0), (5, 1.06, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "breaker")
        switches(ctx, T, {})
        x, gy, r = 2180, 1780, 150
        p = pose(T, 3, face="think" if T > t_lab else "neutral", look=(0.5, -0.1),
                 h1=(0.55, -5.0) if T > t_lab else (0.3, -2.35), h2=(-0.1, -2.4), tilt=0.12 if T > t_lab else 0.0)
        J = figure(ctx, x, gy, r, -1, p, ST.HERO, tint=("#d9cdb0", 0.1))
        hx, hy = at(J, x, gy, r, -1, "head")
        for i, (dx, dy, s) in enumerate(((-190, -230, 120), (-50, -310, 95), (90, -250, 78))):
            k = ease_out_back(clamp((T - t_lab - i * 0.15) / 0.3))
            if k > 0:
                D.text(ctx, "?", hx + dx, hy + dy, s * k, "Inter", hexrgb("#f4f1e8"), bold=True, stroke=INK, slw=8)


def flip_close(ctx, T, S):
    """Крупно: палец щёлкает автоматами один за другим."""
    l = T - (S.cue(5) - 0.3)
    flips = {3: S.cue(5) + 0.15, 4: S.cue(5) + 0.55, 5: S.cue(5) + 0.95}
    cam = PlateCam("breaker", 1240, 640, 2.4)
    with on(ctx, cam, l):
        paint(ctx, "breaker")
        switches(ctx, T, flips)
    # рука: к следующему по очереди автомату
    x0, y0, x1, y1 = COL
    h = (y1 - y0) / ROWS
    target = 3
    for i, tf in sorted(flips.items()):
        if T > tf + 0.12:
            target = i + 1
    tx, ty = cam.to_screen(l, x0 + 60, y0 + (min(target, 5) + 0.5) * h)
    D.line(ctx, W + 80, H + 60, tx + 40, ty + 10, INK, 26)
    D.circle(ctx, tx + 34, ty + 6, 20, INK, None, 0)


def lights_out(ctx, T, S):
    t0 = S.cue(5) + 1.3
    t_last = S.word("last", S.cue(5))
    lights = {"lot": t0 + 0.1, "glass0": t0 + 0.5, "glass1": t0 + 0.75, "glass2": t0 + 1.0, "sign": t_last + 0.05}
    l = T - t0
    cam = PlateCam("exterior_night", 1360, 880, Keys((0, 1.04), (5, 1.0, "lin")))
    exterior(ctx, T, S, cam, l, lights)


def rule(ctx, T, S):
    l = T - (S.cue(5, end=True) + 1.2)
    CD.rule_card(ctx, l, CD.icon_bulb, "STORE RULE 1", "Light is an invitation.")


def build(S):
    c, w = S.cue, S.word
    t_out = c(5) + 1.3
    t_last = w("last", c(5))
    S.shots = [
        Shot(0, day_shot(2)),
        shot(c(1) - 0.3, lantern),
        shot(c(2) - 0.3, drifting),
        shot(c(3) - 0.3, town),
        shot(c(4) - 0.3, panel_hero),
        shot(c(5) - 0.3, flip_close),
        shot(t_out, lights_out),
        shot(c(5, end=True) + 1.2, rule, "fade", 0.3),
    ]
    S.amb = [(c(1) - 0.3, c(3) - 0.3, "crickets", 0.5), (c(1) - 0.3, c(3) - 0.3, "lamp_buzz", 0.35),
             (c(2) + 1.0, c(3) - 0.3, "groans", 0.35),
             (c(3) - 0.3, c(4) - 0.3, "wind_loop", 0.4),
             (c(4) - 0.3, t_out, "store_hum", 0.5),
             (t_out, c(5, end=True) + 1.2, "crickets", 0.45)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(5) + 0.15, "breaker", 0.7), (c(5) + 0.55, "breaker", 0.7),
             (c(5) + 0.95, "breaker", 0.7), (t_out + 0.1, "power_down", 0.5), (t_out + 0.5, "breaker", 0.35),
             (t_out + 0.75, "breaker", 0.3), (t_out + 1.0, "breaker", 0.3), (t_last + 0.05, "sign_off", 0.6),
             (c(5, end=True) + 1.2, "card", 0.5)]
    S.music = [(c(1) - 0.3, c(3) - 0.3, "mystery", 0.55), (c(3) - 0.3, t_out, "tension", 0.45),
               (t_out, S.dur, "lonely", 0.5)]
