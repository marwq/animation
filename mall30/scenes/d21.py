"""День 21: шестьсот шаров и шестьсот записок. Претцель ненавидит шарики — ПОП — улица замирает."""
from scenes.kit import *
from scenes.d17 import roof_bg
from sets import stores as ST

NET_X, NET_Y = 1250, 880
RED = ["#c23b33", "#d24a3a", "#b8332c", "#e05a48"]


def balloon_cloud(ctx, t, n, cx=NET_X, base=NET_Y - 40, spread=1.0, rise=0.0, seed=21, net=True, scale=1.0):
    """Облако красных шаров под сеткой. rise — подъём (px)."""
    r = rng(seed)
    pts = []
    for k in range(n):
        a = r.random() * TAU
        rr = r.random() ** 0.5
        x = cx + math.cos(a) * rr * 330 * spread * scale + math.sin(t * 1.3 + k) * 6
        y = base - 260 * scale - math.sin(a) * rr * 200 * spread * scale - rise + math.cos(t * 1.1 + k) * 5
        pts.append((y, x, r.choice(RED), 22 + r.random() * 8))
    pts.sort()
    for y, x, c, rad in pts:
        ST.balloon(ctx, x, y, rad * scale, c, string=0)
    if net and rise <= 0:
        D.col(ctx, D.INK, 0.6)
        ctx.set_line_width(2)
        for k in range(-6, 7):
            ctx.move_to(cx + k * 55, base - 520 * scale)
            ctx.line_to(cx + k * 60, base)
        for j in range(5):
            ctx.move_to(cx - 360, base - j * 110 * scale)
            ctx.line_to(cx + 360, base - j * 110 * scale)
        ctx.stroke()
        for sx in (cx - 360, cx + 360):
            D.line(ctx, sx, base, sx, base + 40, D.INK, 4)


def shot_inflate(ctx, t, S):
    cam = Cam(Keys((0, 900), (5, 1050)), 600, Keys((0, 1.2), (5, 1.0)))
    n = int(lerp(40, 160, clamp(t / 4.5)))
    with layer(ctx, cam, t):
        roof_bg("day")(ctx)
        balloon_cloud(ctx, t, n)
        ST.helium_tank(ctx, 640, 990, 1.0)
        k = (t * 1.2) % 1.0
        p = R.stand("side", t, 1)
        p.update(h1=(0.75, -2.3), h2=(0.6, -2.0), face="determined")
        HERO.draw(ctx, 520, 990, 98, 1, p)
        ST.balloon(ctx, 700, 700, 10 + 26 * k, RED[0], string=0)
    fx.grade(ctx, "warm", 0.12)
    D.text(ctx, "%d" % int(lerp(1, 600, clamp(t / 4.5))), W - 120, 200, 140, D.FONT_TITLE, hexrgb("#d9483b"), "right",
           stroke=D.INK, slw=12)
    D.text(ctx, "BALLOONS", W - 120, 270, 50, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=8)


def shot_note(ctx, t, S):
    """Записка сворачивается и привязывается к нитке."""
    D.col(ctx, hexrgb("#8a6a52"))
    ctx.paint()
    roll = smooth((t - 3.2) / 0.8)
    w = lerp(1200, 90, roll)
    D.rect(ctx, 960 - w / 2, 300, w, 420, hexrgb("#f6f1e6"), D.INK, 4, wob=0.6)
    if roll < 0.4:
        lines = ["ALIVE.", "LIBERTY MALL ROOF.", "34TH STREET.", "PLEASE."]
        for i, l in enumerate(lines):
            k = clamp(t * 1.4 - i * 0.7)
            s = l[:int(len(l) * k)]
            D.text(ctx, s, 960, 400 + i * 90, 72, D.FONT_HAND, hexrgb("#1f2a55"), alpha=1 - roll * 2.5)
    if roll > 0.9:
        D.curve(ctx, [(960, 300), (980, 150), (940, 0), (960, -100)], D.INK, 3)


def shot_growl(ctx, t, S):
    cam = Cam(1050, 760, 2.0)
    with layer(ctx, cam, t):
        roof_bg("day")(ctx)
        ST.balloon(ctx, 1240, 760 + math.sin(t * 2) * 10, 48, RED[1], string=120, sway=-20)
        p = dog_pose(t, "stand", bark=0.25 * (1 + math.sin(t * 20)), wag=0.0)
        draw_dog(ctx, 1000, 990, 150, 1, p)
    fx.grade(ctx, "warm", 0.12)
    D.text(ctx, "grrr...", 820, 560, 70, D.FONT_HAND, hexrgb("#f7eedb"), stroke=D.INK, slw=8)


def shot_pop(ctx, t, S):
    T = 0.25
    cam = Cam(1050, 760, Keys((0, 2.0), (T, 2.0), (T + 0.2, 2.3, "out")), shake=lambda t: shake_k(t, T, 0.4, 1.0))
    with layer(ctx, cam, t):
        roof_bg("day")(ctx)
        if t < T:
            ST.balloon(ctx, 1160, 800, 48, RED[1], string=120, sway=-20)
            draw_dog(ctx, 1000, 990, 150, 1, dog_pose(t, "stand", bark=0.3))
        else:
            dt = t - T
            r = rng(3)
            for k in range(10):
                a = r.uniform(0, TAU)
                d = 60 + dt * 400
                ctx.save()
                ctx.translate(1160 + math.cos(a) * d, 800 + math.sin(a) * d + dt * dt * 300)
                ctx.rotate(a)
                D.poly(ctx, [(-14, -6), (14, -8), (10, 8), (-12, 6)], hexrgb(RED[1]), D.INK, 2, wob=0,
                       alpha=clamp(1 - dt))
                ctx.restore()
            jump = math.sin(math.pi * clamp(dt / 0.45)) * 160
            draw_dog(ctx, 980 - dt * 200, 990 - jump, 150, 1, dog_pose(t, "jump", jump=0.5))
    fx.grade(ctx, "warm", 0.12)
    if t > T:
        k = clamp((t - T) / 0.1)
        ctx.save()
        ctx.translate(W / 2 + 200, 300)
        sc = ease_out_back(k)
        ctx.scale(sc, sc)
        D.text(ctx, "POP!", 0, 0, 200, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=16)
        ctx.restore()


ST_CROWD = None


def street_crowd():
    global ST_CROWD
    if ST_CROWD is None:
        ST_CROWD = make_crowd(2101, 70, -300, 2300, 860, 1100, 42, 70)
    return ST_CROWD


def street_bg(c):
    C.sky(c, -600, -800, 3200, 1700, "day")
    C.skyline(c, -600, 2600, 620, "day", depth=0, seed=211, hmin=300, hmax=700)
    for k, (x, w, h, col) in enumerate([(-500, 600, 700, "#a99a8a"), (200, 500, 900, "#b0a090"),
                                        (800, 600, 760, "#9a8a7a"), (1500, 700, 880, "#a89888")]):
        C.building(c, x, 860, w, h, hexrgb(col), seed=220 + k)
    CITY.street(c, -600, 2600, 860, "day", seed=4, depth_y=1500)


def silent_fn(t0, t1):
    def fn(m, t):
        p = zombie_idle(t, m.seed % 97, "side")
        if t0 < t < t1:
            p = dict(p)
            p.update(view="front", hturn=0.0, neck=-0.35, look=(0, -1), mouth=0.2)
        return p
    return fn


def shot_silent(ctx, t, S):
    """Вся улица замолкает и смотрит вверх. Потом теряет интерес."""
    cam = Cam(960, Keys((0, 700), (5, 740)), Keys((0, 0.95), (5, 1.05)))
    with layer(ctx, cam, t):
        bg(ctx, "street21", (-600, -800, 3200, 2400), street_bg)
        draw_crowd(ctx, street_crowd(), t, silent_fn(0.1, S.cue(4) - S.cue(3) - 0.3 + 0.0))
    fx.grade(ctx, "warm", 0.1)


def shot_back(ctx, t, S):
    """Очень-очень тихо: на цыпочках обратно к работе. Претцель прячется за ногами."""
    w = Walk(Keys((0, 1500), (4, 900, "lin")), 990, 98, "sneak", t1=6)
    cam = Cam(lambda t: w.x(t) - 100, 620, 1.2)
    with layer(ctx, cam, t):
        roof_bg("day")(ctx)
        balloon_cloud(ctx, t, 160)
        w.draw(ctx, HERO, t, {"h1": (0.25, -3.4), "face": "worried"})
        draw_dog(ctx, w.x(t) + 130, 994, 82, -1, dog_pose(t, "trot", phase=w.dist(t) * 1.2, wag=0.0))
    fx.grade(ctx, "warm", 0.12)
    D.text(ctx, "shhh...", W / 2, 230, 90, D.FONT_HAND, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp((t - 0.5) / 0.3))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_inflate),
        Shot(c(1) - 0.1, shot_note),
        Shot(c(2) - 0.1, shot_growl),
        Shot(c(3) + 0.9, shot_pop),
        Shot(c(3) + 2.0, shot_silent),
        Shot(c(4) + 0.9, shot_back),
    ]
    S.sfx += [(c(3) + 0.9 + 0.25, "pop", 1.2)]
