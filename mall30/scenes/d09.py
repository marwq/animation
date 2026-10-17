"""День 9: батутный парк, яма из трёх тысяч шариков. В верхнем окне — тёмный город."""
from scenes.kit import *
from sets import stores as ST

FLOOR = 700
TR_X = 60 + 250        # центр второго батута


def tp_bg(ctx, tod):
    bg(ctx, "tramp_" + tod, (-400, -1600, 2800, 2900), lambda c: ST.trampoline_park(c, tod))


def shot_enter(ctx, t, S):
    """Вход с огромной охапкой шариков."""
    w = Walk(Keys((0, -200), (3.2, 900, "out")), FLOOR, 90, "walk", t1=6)
    cam = Cam(Keys((0, 700), (3.5, 960)), Keys((0, 300), (3.5, 360)), 0.95)
    with layer(ctx, cam, t):
        tp_bg(ctx, "day")
        x = w.x(t)
        J = w.draw(ctx, HERO, t, {"face": "happy", "a1": (2.8, 0.2), "a2": (2.7, 0.2)})
        r = rng(5)
        for k in range(26):
            bx = x + r.uniform(-140, 140) + math.sin(t * 2 + k) * 8
            by = FLOOR - 470 - r.uniform(0, 260)
            ST.balloon(ctx, bx, by, 30, r.choice(["#c23b33", "#e2a33b", "#3f8a84", "#c23b6a", "#7a6aa3"]),
                       string=FLOOR - 340 - by - 20, sway=(x - bx) * 0.8)
        draw_dog(ctx, w.x(t) - 160, FLOOR + 4, 82, 1, dog_pose(t, "trot", phase=w.dist(t)))
    fx.grade(ctx, "warm", 0.12)


def shot_fill(ctx, t, S):
    """Шарики сыплются в яму."""
    cam = Cam(1700, 500, Keys((0, 1.4), (4, 1.25)))
    with layer(ctx, cam, t):
        tp_bg(ctx, "day")
        n = int(40 + clamp(t / 3.5) * 120)
        ST.foam_pit_balls(ctx, t, n=n)
        r = rng(9)
        for k in range(16):
            ph = (t * 0.9 + k / 16) % 1
            bx = 1500 + r.random() * 420
            by = lerp(-80, 640, ph ** 1.6)
            ST.balloon(ctx, bx, by, 28, r.choice(["#c23b33", "#e2a33b", "#3f8a84", "#c23b6a", "#7a6aa3"]),
                       string=30, sway=10)
        p = R.stand("side", t, 1)
        p.update(a1=(2.4 + 0.3 * math.sin(t * 6), 0.4), a2=(2.2, 0.5), face="laugh")
        HERO.draw(ctx, 1320, FLOOR, 90, 1, p)
    fx.grade(ctx, "warm", 0.12)


def jump_h(t, period=1.1, base=260, grow=110, n0=0):
    """Высота прыжка (px) и номер прыжка."""
    k = int(t / period)
    ph = (t % period) / period
    h = (base + grow * min(k, 4)) * 4 * ph * (1 - ph)
    return h, k, ph


def shot_jump(ctx, t, S):
    """Прыжки всё выше. Камера идёт вверх-вниз за героем."""
    h, k, ph = jump_h(t)
    cam = Cam(TR_X + 150, lambda t: FLOOR - 200 - jump_h(t)[0] * 0.75, 1.15)
    with layer(ctx, cam, t):
        tp_bg(ctx, "day")
        sag = 26 * max(0, 1 - ph * 8) + 26 * max(0, (ph - 0.88) * 8)
        p = R.stand("front", t, 1)
        if ph < 0.1 or ph > 0.9:
            p.update(hip=(0, 0.35), f1=(-0.25, 0), f2=(0.25, 0), a1=(0.5, -0.3), a2=(0.5, -0.3), face="happy")
        else:
            up = math.sin(ph * math.pi)
            p.update(a1=(2.6 * up + 0.3, 0.2), a2=(2.6 * up + 0.3, 0.2), f1=(-0.3, -0.35 * up), f2=(0.3, -0.35 * up),
                     face="laugh", hturn=0.0)
        HERO.draw(ctx, TR_X + 150, FLOOR + sag - h, 92, 1, p)
        D.line(ctx, TR_X - 100, FLOOR + 6, TR_X + 150, FLOOR + 6 + sag, D.INK, 4)
        D.line(ctx, TR_X + 150, FLOOR + 6 + sag, TR_X + 400, FLOOR + 6, D.INK, 4)
    fx.grade(ctx, "warm", 0.12)
    if k >= 1:
        D.text(ctx, "HIGHER" + "!" * min(k, 3), W - 110, 200, 80, D.FONT_TITLE, hexrgb("#f7eedb"), "right",
               stroke=D.INK, slw=10, alpha=clamp(1 - ph * 1.5) if ph < 0.6 else 0)


def shot_top(ctx, t, S):
    """Высшая точка, замедление: в верхнем окне — Эмпайр-стейт. Лицо: радость → тишина."""
    cam = Cam(Keys((0, TR_X + 150), (3, 760)), Keys((0, -1150), (3, -1300)), Keys((0, 1.25), (3, 1.9)))
    with layer(ctx, cam, t):
        tp_bg(ctx, "dusk")
        p = R.stand("front", t, 1)
        p.update(a1=(2.9, 0.1), a2=(2.9, 0.1), f1=(-0.3, -0.2), f2=(0.3, -0.2), hturn=0.0, look=(0.6, -0.6),
                 face="happy" if t < 1.0 else "neutral", neck=-0.2, blink=0)
        HERO.draw(ctx, TR_X + 150 + t * 20, -900 + t * 8, 92, 1, p)
    fx.grade(ctx, "dusk", 0.35)


def dark_city(c):
    C.sky(c, -600, -400, 3200, 1800, "night", moon=(1500, 200, 40))
    C.skyline(c, -600, 2600, 900, "night", depth=0, seed=91, esb_x=960, hmin=260, hmax=560, lit=0.0)
    C.skyline(c, -600, 2600, 1100, "night", depth=1, seed=93, hmin=200, hmax=420, lit=0.0)


def shot_dark(ctx, t, S):
    """Город без единого огня."""
    cam = Cam(960, Keys((0, 520), (4, 480)), Keys((0, 1.0), (4, 1.12)))
    with layer(ctx, cam, t):
        bg(ctx, "dark_city", (-600, -400, 3200, 1800), dark_city)
    fx.grade(ctx, "night", 0.4)
    # рама окна
    D.rect(ctx, -10, -10, W + 20, 90, hexrgb("#5d5a58"), D.INK, 4, wob=0)
    D.rect(ctx, -10, H - 90, W + 20, 100, hexrgb("#5d5a58"), D.INK, 4, wob=0)
    D.rect(ctx, W / 2 - 18, 0, 36, H, hexrgb("#5d5a58"), D.INK, 4, wob=0)
    k = clamp((t - 0.6) / 0.4)
    D.text(ctx, "8,000,000 PEOPLE", W / 2, 300, 70, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10, alpha=k)
    D.text(ctx, "0 LIGHTS", W / 2, 400, 90, D.FONT_TITLE, hexrgb("#d9483b"), stroke=D.INK, slw=10,
           alpha=clamp((t - 1.4) / 0.4))


def shot_fall(ctx, t, S):
    """Падение в шарики — брызги шариков. Сверху: лежит, свет медленно уходит."""
    T_HIT = 0.6
    if t < T_HIT + 1.2:
        cam = Cam(1700, 520, 1.3, shake=lambda t: shake_k(t, T_HIT, 0.3, 0.5))
        with layer(ctx, cam, t):
            tp_bg(ctx, "dusk")
            sp = clamp((t - T_HIT) / 1.0) if t > T_HIT else 0.0
            ST.foam_pit_balls(ctx, t, splash=sp)
            if t < T_HIT:
                y = lerp(-200, 690, (t / T_HIT) ** 2)
                p = R.stand("front", t, 1)
                p.update(a1=(2.6, 0.2), a2=(2.6, 0.2), f1=(-0.35, -0.3), f2=(0.35, -0.3), face="scream")
                HERO.draw(ctx, 1700, y, 92, 1, p)
        fx.grade(ctx, "dusk", 0.35)
    else:
        tt = t - (T_HIT + 1.2)
        cam = Cam(960, 540, Keys((0, 1.35), (6, 0.95)))
        with layer(ctx, cam, tt):
            D.col(ctx, hexrgb("#2f3d5c"))
            ctx.paint()
            r = rng(12)
            for k in range(420):
                bx, by = r.uniform(-300, 2200), r.uniform(-300, 1400)
                rr = 46
                D.circle(ctx, bx, by, rr, hexrgb(r.choice(["#c23b33", "#e2a33b", "#3f8a84", "#c23b6a", "#7a6aa3",
                                                            "#5f8a5a", "#f0ece0"])), D.INK, 3)
                D.circle(ctx, bx - 14, by - 16, 9, hexrgb("#ffffff"), None, 0, alpha=0.5)
            p = R.stand("front", tt, 1)
            p.update(a1=(1.5, 0.2), a2=(1.5, 0.2), f1=(-0.4, 0), f2=(0.4, 0), face="sad", hturn=0.0, look=(0, -0.4))
            HERO.draw(ctx, 960, 760, 120, 1, p)
        fx.grade(ctx, "dusk", 0.3 + 0.4 * clamp(tt / 5))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_enter),
        Shot(c(1) - 0.1, shot_fill),
        Shot(c(2) - 0.1, shot_jump),
        Shot(c(3) - 0.1, shot_top),
        Shot(c(4) - 0.1, shot_dark),
        Shot(c(5) - 0.6, shot_fall),
    ]
    S.tods = [(0, "day"), (c(3), "dusk")]
