"""День 2: мастер-ключ, 140 магазинов, проверка решёток, карта «YOU ARE HERE»."""
from scenes.kit import *
from scenes.shared import gallery_bg, gallery_rail, gs, atrium_bg, GF

ALL_CLOSED = {n: 1.0 for n, _, _ in M.STORES}


def shot_walk(ctx, t, S):
    """Утро. Уборщик идёт по галерее со шваброй на плече."""
    w = Walk(Keys((0, 300), (6, 1500, "lin")), GF + 40, gs(), "walk", t1=8)
    cam = Cam(lambda t: w.x(t) + 120, 560, 1.15, drift=0.6)
    with layer(ctx, cam, t):
        gallery_bg("d02", "day", 0.9, ALL_CLOSED)(ctx)
        w.draw(ctx, HERO, t, {"a1": (0.45, 2.35)}, props=mop_shoulder)
    with layer(ctx, cam, t, 1.3):
        gallery_rail(ctx)
    fx.grade(ctx, "warm", 0.2)


def mop_shoulder(ctx, J, layer_):
    """Швабра на плече (локальные координаты)."""
    if layer_ != "front":
        return
    hx, hy = J["hand1"]
    dx, dy = -0.93, -0.36
    a = (hx - dx * 0.4, hy - dy * 0.4)
    b = (hx + dx * 2.1, hy + dy * 2.1)
    D.line(ctx, *a, *b, hexrgb("#a5764a"), 0.07)
    ctx.save()
    ctx.translate(*b)
    ctx.rotate(math.atan2(dy, dx) - math.pi / 2)
    for k in range(-3, 4):
        D.line(ctx, k * 0.04, 0, k * 0.06, 0.3, hexrgb("#d9d2c2"), 0.05)
    ctx.restore()


def keyring(ctx, x, y, s, t, swing=0.0):
    """Связка ключей на кольце. Ключи качаются."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.col(ctx, hexrgb("#b9b4a8"))
    ctx.set_line_width(10)
    ctx.arc(0, 0, 70, 0, TAU)
    ctx.stroke()
    D.col(ctx, D.INK)
    ctx.set_line_width(3)
    ctx.arc(0, 0, 75, 0, TAU)
    ctx.stroke()
    ctx.arc(0, 0, 65, 0, TAU)
    ctx.stroke()
    for k in range(9):
        a = math.pi * 0.25 + k * 0.17 + math.sin(t * 6 + k) * 0.08 * swing
        big = k == 4
        L = 230 if big else 150 + (k % 3) * 20
        ctx.save()
        ctx.translate(math.cos(a) * 70, math.sin(a) * 70)
        ctx.rotate(a - math.pi / 2)
        c = hexrgb("#d6b24c") if big or k % 3 == 0 else hexrgb("#b9b4a8")
        D.circle(ctx, 0, 30, 26 if big else 20, c, D.INK, 3)
        D.circle(ctx, 0, 30, 9, hexrgb("#1c1a20"), None, 0)
        D.rect(ctx, -9, 52, 18, L - 60, c, D.INK, 3, wob=0)
        for j in range(3):
            D.rect(ctx, 9, L - 40 - j * 26, 16, 14, c, D.INK, 2, wob=0)
        if big:
            D.rect(ctx, -60, 90, 50, 80, hexrgb("#f1e8d4"), D.INK, 2.5, wob=0.3)
            ctx.save()
            ctx.translate(-35, 130)
            ctx.rotate(math.pi / 2)
            D.text(ctx, "MASTER", 0, 8, 22, D.FONT_TITLE, hexrgb("#c23b33"))
            ctx.restore()
        ctx.restore()
    ctx.restore()


def shot_keys(ctx, t, S):
    cam = Cam(960, 540, Keys((0, 1.0), (3, 1.15)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#d9cdb5"))
        ctx.paint()
        D.rect(ctx, -400, 0, 2800, 380, hexrgb("#c9bca2"), None, 0, wob=0)
        M.storefront(ctx, 80, 1400, 700, "NOVA TECH", "#2f3d5c", "tv", 0.8, 1.0)
        ky = 440 + math.sin(t * 2.5) * 12
        D.line(ctx, 1010, -100, 1010, ky - 70, D.INK, 30)       # рука сверху
        keyring(ctx, 1010, ky, 1.25, t, 1.0)
        # блик
        gl = clamp(1 - abs(t - 0.9) / 0.25)
        if gl > 0:
            fx.glow(ctx, 1080, ky + 260, 140, "#fff6d0", 0.8 * gl)
    fx.grade(ctx, "warm", 0.25)


COUNTS = [("140", "STORES"), ("11", "RESTAURANTS"), ("1", "SUPERMARKET")]


def shot_atrium_tilt(ctx, t, S):
    """Атриум снизу вверх: пять этажей до стеклянной крыши. Всплывают цифры."""
    d = S.cue(3) - S.cue(2)
    cam = Cam(960, Keys((0, 2280), (d, 520, "io")), Keys((0, 0.95), (d, 0.72)))
    with layer(ctx, cam, t):
        atrium_bg("morning", 0.9, {})(ctx)
        M.fountain_water(ctx, t, 1.0)
    fx.grade(ctx, "warm", 0.15)
    for i, (num, lab) in enumerate(COUNTS):
        ta = 0.2 + i * d / 3.3
        k = clamp((t - ta) / 0.35)
        if k <= 0:
            continue
        sc = ease_out_back(k)
        y = 300 + i * 200
        ctx.save()
        ctx.translate(W / 2, y)
        ctx.scale(sc, sc)
        D.text(ctx, num, -30, 30, 130, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=12)
        D.text(ctx, lab, 0, 10, 64, D.FONT_TITLE, hexrgb("#f7eedb"), "left", stroke=D.INK, slw=10)
        ctx.restore()


def shot_gates(ctx, t, S):
    """Проверка решёток: подходит, дёргает, идёт дальше. Камера ведёт сбоку."""
    stops = [(0.0, 400), (0.7, 900), (1.3, 900), (2.0, 1600), (2.6, 1600), (3.3, 2300), (3.9, 2300), (5.0, 3000)]
    xk = Keys(*[(a, b, "io") for a, b in stops])
    w = Walk(xk, GF + 40, gs(), "brisk", t1=7)
    cam = Cam(lambda t: xk(t) + 60, 560, 1.25, drift=0.5)
    shk = 0.0
    tugs = [(0.75, 1.25), (2.05, 2.55), (3.35, 3.85)]
    tug = 0.0
    for a, b in tugs:
        if a <= t <= b:
            tug = math.sin((t - a) / (b - a) * math.pi * 3)
    with layer(ctx, cam, t):
        gallery_bg("d02", "day", 0.9, ALL_CLOSED)(ctx)
        extra = None
        if abs(tug) > 0 or any(a <= t <= b for a, b in tugs):
            extra = {"h1": (0.5, -1.4 - 0.1 * tug), "h2": (0.45, -1.35 - 0.1 * tug), "lean": -0.05 + 0.08 * tug,
                     "view": "side", "hturn": 0.6}
        w.draw(ctx, HERO, t, extra, f=-1 if extra else None)
    with layer(ctx, cam, t, 1.3):
        gallery_rail(ctx)
    fx.grade(ctx, "warm", 0.15)


def shot_alone(ctx, t, S):
    """Сверху: крошечная фигурка у фонтана в огромном пустом атриуме."""
    cam = Cam(960, Keys((0, 2100), (5, 1900)), Keys((0, 1.05), (5, 0.62)))
    with layer(ctx, cam, t):
        atrium_bg("day", 0.9, {})(ctx)
        M.fountain_water(ctx, t, 1.0)
        p = R.stand("front", t, 2)
        p["hturn"] = 0.0
        p["neck"] = -0.25
        fx.glow(ctx, 1240, M.AT_LEVELS[0] + 60, 160, "#fff2d0", 0.25)
        HERO.draw(ctx, 1240, M.AT_LEVELS[0] + 120, 52, 1, p)
    fx.grade(ctx, "warm", 0.15)


def shot_map(ctx, t, S):
    """Карта ТЦ: точка мигает, рука пишет имя. Камера отъезжает — герой у карты."""
    d = S.dur - (S.cue(5) - 0.2)
    write0 = 1.2
    cam = Cam(Keys((0, 1020), (write0 + 1.5, 1020), (d, 960)), Keys((0, 540), (write0 + 1.5, 540), (d, 520)),
              Keys((0, 2.2), (write0 + 1.5, 2.0), (d, 1.05, "io")))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#d9cdb5"))
        ctx.paint()
        bg(ctx, "d02_mapwall", (-400, -50, 2800, 1300), lambda c: M.gallery(c, -400, 2400, "day", 0.9, ALL_CLOSED))
        M.mall_map(ctx, 960, 520, 0.62, name_k=clamp((t - write0) / 0.8), dot_pulse=t)
        D.line(ctx, 960, 730, 960, GF, D.INK, 10)
        D.rect(ctx, 900, GF - 12, 120, 14, hexrgb("#4a4744"), D.INK, 2, wob=0)
        # рука с маркером
        if t < write0 + 1.2:
            k = clamp((t - write0) / 0.8)
            px = 960 + 0.62 * (100 + k * 120)
            py = 520 + 0.62 * (-30 + math.sin(k * 30) * 8)
            D.line(ctx, px + 300, py + 500, px + 20, py + 20, D.INK, 16)
            D.rect(ctx, px, py - 6, 70, 18, hexrgb("#1f2a55"), D.INK, 2, wob=0)
        p = R.stand("front", t, 2)
        p.update(hturn=-0.6, face="smile" if t > write0 + 1.0 else "neutral")
        HERO.draw(ctx, 1420, GF + 30, gs(), 1, p)
    fx.grade(ctx, "warm", 0.2)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_walk),
        Shot(c(1) - 0.1, shot_keys),
        Shot(c(2) - 0.1, shot_atrium_tilt, "fade", 0.3),
        Shot(c(3) - 0.1, shot_gates),
        Shot(c(4) - 0.1, shot_alone, "fade", 0.3),
        Shot(c(5) - 0.2, shot_map),
    ]
    S.sfx += [(c(1) + 0.2, "keys", 0.9)]
