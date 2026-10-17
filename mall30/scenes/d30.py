"""День 30: рассвет. Дверь срывается — и над краем крыши поднимается вертолёт. Шарик. Роза. Лестница."""
from scenes.kit import *
from scenes.d29 import door_scene, roof_bg29
from scenes.d21 import RED
from scenes.shared import rosa_window_close
from sets import stores as ST


def shot_dawn_door(ctx, t, S):
    cam = Cam(Keys((0, 1300), (4, 1400)), Keys((0, 600), (4, 640)), Keys((0, 1.0), (4, 1.3)),
              shake=lambda t: 0.3 + 0.3 * abs(math.sin(t * 2)))
    door_scene(ctx, t, 0.9, cam, tod="dawn")
    fx.grade(ctx, "dawn", 0.35)
    if 2.0 < t < 2.6:
        r = rng(3)
        for k in range(4):
            dt = t - 2.0
            D.circle(ctx, *cam.to_screen(t, 1560 + r.uniform(-40, 40) + dt * 300, 690 + k * 50 - dt * 200), 7,
                     hexrgb("#d6b24c"), D.INK, 2)


def heli_inside(rosa=True, balloon=True, t=0.0):
    def fn(ctx):
        p = R.stand("side", t, 7)
        p.update(h1=(0.9, -2.6 + 0.1 * math.sin(t * 5)), face="happy" if balloon else "determined")
        SOLDIER.draw(ctx, 20, 30, 34, 1, p)
        if balloon:
            ST.balloon(ctx, 52, -80 + math.sin(t * 3) * 4, 16, RED[0], string=40, sway=-6, note=True)
        if rosa:
            p2 = R.stand("front", t, 4)
            p2.update(a1=(2.8 + 0.3 * math.sin(t * 12), 0.2), a2=(2.8 - 0.3 * math.sin(t * 12), 0.2), face="laugh")
            ROSA.draw(ctx, -60, 30, 32, 1, p2)
    return fn


def shot_rise(ctx, t, S):
    """Ветер, пыль: из-за края крыши поднимается вертолёт."""
    cam = Cam(960, Keys((0, 640), (5, 520)), Keys((0, 0.9), (5, 0.8)), shake=lambda t: 0.25)
    with layer(ctx, cam, t):
        roof_bg29(ctx, "dawn")
        CITY.roof_door(ctx, 1450, 860, 0.0, "dawn")
        hy = Keys((0, 1200), (3.0, 520, "out"))(t)
        CITY.helicopter(ctx, 700, hy, 1.0, t, False, 1.0, -0.05, inside=heli_inside(True, True, t))
        CITY.parapet_front(ctx, -1200, 3200, 1000, tod="dawn")
        p = R.stand("front", t, 1)
        p.update(a1=(2.3, 1.6), a2=(0.4, 0.3), face="shock", blink=0, hturn=-0.5, look=(-0.8, -0.5))
        HERO.draw(ctx, 1500, 1000, 110, 1, p)
        draw_dog(ctx, 1660, 1004, 90, -1, dog_pose(t, "stand", bark=1.0))
        r = rng(30)
        for k in range(30):
            ph = (t * 0.9 + r.random()) % 1
            D.line(ctx, 200 + r.random() * 1600 + ph * 400, 900 + r.random() * 100, 260 + r.random() * 1600 + ph * 400,
                   900 + r.random() * 100, hexrgb("#e9e2d2"), 3, alpha=0.5 * (1 - ph))
    fx.grade(ctx, "dawn", 0.3)


def shot_soldier(ctx, t, S):
    """В проёме: солдат держит красный шарик с запиской."""
    cam = Cam(700 + 40, 470, 3.2, shake=lambda t: 0.15)
    with layer(ctx, cam, t):
        roof_bg29(ctx, "dawn")
        CITY.helicopter(ctx, 700, 520, 1.0, t, False, 1.0, -0.05, inside=heli_inside(False, True, t))
    fx.grade(ctx, "dawn", 0.25)
    D.text(ctx, "YOUR NOTE", W / 2 + 420, 260, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp((t - 0.5) / 0.3))


def shot_rosa(ctx, t, S):
    cam = Cam(700 - 30, 470, 3.2, shake=lambda t: 0.15)
    with layer(ctx, cam, t):
        roof_bg29(ctx, "dawn")
        CITY.helicopter(ctx, 700, 520, 1.0, t, False, 1.0, -0.05, inside=heli_inside(True, True, t))
    fx.grade(ctx, "dawn", 0.25)
    D.text(ctx, "ROSA!", W / 2 - 420, 260, 110, D.FONT_TITLE, hexrgb("#ffd34a"), stroke=D.INK, slw=12,
           alpha=clamp((t - 0.4) / 0.2))


def shot_told(ctx, t, S):
    """Как это вышло: Роза на своей крыше в день 23 — её забирают. Шарик на лобовом стекле."""
    d = S.cue(5) - S.cue(4)
    half = d * 0.5
    if t < half:
        cam = Cam(960, 500, Keys((0, 1.1), (half, 1.2)))
        with layer(ctx, cam, t):
            C.sky(ctx, -400, -400, 2800, 1700, "night", moon=(1500, 200, 40))
            C.skyline(ctx, -400, 2400, 900, "night", depth=0, seed=301, hmin=200, hmax=500)
            CITY.parapet_front(ctx, -400, 2400, 960, tod="night")
            CITY.helicopter(ctx, 1150, 420, 0.8, t, True, 1.0, 0.05)
            p = R.stand("front", t, 4)
            p.update(a1=(2.8, 0.2), a2=(2.8, 0.2), face="happy")
            ROSA.draw(ctx, 760, 960, 100, 1, p)
            D.circle(ctx, 1150, 560, 40, None, None, 0)
        fx.grade(ctx, "memory", 0.55)
        D.text(ctx, "DAY 23", W - 110, 230, 70, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=10)
        D.text(ctx, "\"THERE'S A BOY IN THE MALL. WITH A DOG.\"", W / 2, 900, 48, D.FONT_HAND, hexrgb("#f7eedb"),
               stroke=D.INK, slw=7, alpha=clamp((t - 0.5) / 0.3))
    else:
        tt = t - half
        cam = Cam(960, 540, Keys((0, 1.0), (half, 1.15)))
        with layer(ctx, cam, tt):
            C.sky(ctx, -400, -400, 2800, 1700, "day")
            C.clouds(ctx, -200, 100, 2400, seed=5, n=6)
            D.rect(ctx, 260, 200, 1400, 700, hexrgb("#9fb3bd"), D.INK, 10, wob=0.5)
            D.line(ctx, 960, 200, 960, 900, D.INK, 10)
            ST.balloon(ctx, 1200, 520, 90, RED[0], string=220, sway=-60, note=True)
            D.rect(ctx, 1080, 760, 120, 150, hexrgb("#f6f1e6"), D.INK, 3, wob=0.6)
            D.text(ctx, "LIBERTY", 1140, 820, 22, D.FONT_HAND, hexrgb("#1f2a55"))
            D.text(ctx, "MALL ROOF", 1140, 850, 22, D.FONT_HAND, hexrgb("#1f2a55"))
        fx.grade(ctx, "memory", 0.4)
        D.text(ctx, "DAY 24", W - 110, 230, 70, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=10)


def shot_escape(ctx, t, S):
    """Лестница: он хватается, Претцель за пазухой. Дверь падает, они высыпают на крышу — не достают."""
    T_DOOR = 1.0
    lift = Keys((0, 0), (1.4, 0), (4.5, 520, "io"))
    cam = Cam(Keys((0, 1250), (4.5, 1150)), Keys((0, 600), (4.5, 380)), Keys((0, 0.95), (4.5, 0.85)),
              shake=lambda t: shake_k(t, T_DOOR, 0.6, 1.2) + 0.15)
    with layer(ctx, cam, t):
        roof_bg29(ctx, "dawn")
        CITY.roof_door(ctx, 1450, 860, 1.0 if t > T_DOOR else 0.0, "dawn")
        hy = 120 - lift(t)
        CITY.helicopter(ctx, 1000, hy, 1.0, t, False, 1.0, -0.04, inside=heli_inside(True, False, t))
        # верёвочная лестница
        lx = 1000 - 30
        top = hy + 60
        bot = top + 700
        D.line(ctx, lx - 30, top, lx - 30 + math.sin(t * 2) * 10, bot, hexrgb("#8a6a52"), 6)
        D.line(ctx, lx + 30, top, lx + 30 + math.sin(t * 2) * 10, bot, hexrgb("#8a6a52"), 6)
        for k in range(12):
            y = top + 40 + k * 55
            D.line(ctx, lx - 30, y, lx + 30, y, hexrgb("#8a6a52"), 5)
        # герой на лестнице
        hero_y = min(1000, bot - 40) if t > 1.4 else 1000
        p = R.stand("front", t, 1)
        if t > 1.4:
            p.update(h1=(-0.25, -3.6), h2=(0.25, -3.9), f1=(-0.2, -0.3), f2=(0.2, 0.0), face="happy", hturn=0.0)
        else:
            p.update(a1=(2.6, 0.4), a2=(2.6, 0.4), face="shock", blink=0)
        hx = lx if t > 1.4 else lerp(1500, lx, smooth(t / 1.4))
        J = HERO.draw(ctx, hx, hero_y, 92, 1, p)
        draw_dog(ctx, hx + 10, hero_y - 150, 50, 1, dog_pose(t, "stand", bark=0.5))
        # толпа вываливается из двери
        if t > T_DOOR:
            for k in range(9):
                st = T_DOOR + k * 0.18
                if t < st:
                    continue
                look = R.LIBERTY if k == 0 else R.zombie_look(3000 + k)
                zx = lerp(1610, 1100 + (k % 4) * 90, clamp((t - st) / 1.2))
                p = zombie_reach(t, k)
                p.update(a1=(2.5 + 0.2 * math.sin(t * 6 + k), -0.2), a2=(2.4, -0.1), mouth=1.0)
                R.Fig(look).draw(ctx, zx, 1000 + (k % 3) * 12, 92, -1, p)
        CITY.parapet_front(ctx, -1200, 3200, 1080, tod="dawn")
    fx.grade(ctx, "dawn", 0.3)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_dawn_door),
        Shot(c(1) - 0.1, shot_rise),
        Shot(c(2) - 0.1, shot_soldier),
        Shot(c(3) - 0.1, shot_rosa),
        Shot(c(4) - 0.1, shot_told, "white", 0.3),
        Shot(c(5) - 0.2, shot_escape, "white", 0.25),
    ]
    S.sfx += [(c(1), "helicopter", 1.0), (c(5) - 0.2 + 1.0, "door_burst", 1.0)]
