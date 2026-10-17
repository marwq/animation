"""День 22: рассвет. Сетка перерезана — шестьсот красных шаров над серым Манхэттеном."""
from scenes.kit import *
from scenes.d21 import balloon_cloud, RED
from scenes.shared import binocular, rosa_window_close
from sets import stores as ST


def dawn_roof(c):
    C.sky(c, -1500, -2600, 5000, 3800, "dawn", sun=(1700, 520, 60))
    C.clouds(c, -1000, -1500, 4000, seed=22, color="#f6c9b0", alpha=0.4, n=8, scale=1.8)
    C.skyline(c, -1500, 3500, 720, "dawn", depth=0, seed=221, esb_x=400, hmin=220, hmax=560)
    CITY.roof(c, -1500, 3500, 860, "dawn")


def shot_cut(ctx, t, S):
    """Ножницы режут верёвку сетки."""
    T = 1.0
    cam = Cam(Keys((0, 1610), (T, 1610), (2.5, 1450)), Keys((0, 830), (2.5, 700)), Keys((0, 2.4), (2.5, 1.5)))
    with layer(ctx, cam, t):
        bg(ctx, "roof_dawn", (-1500, -2600, 5000, 4000), dawn_roof)
        rise = 0 if t < T else (t - T) ** 2 * 140
        balloon_cloud(ctx, t, 160, net=t < T, rise=rise)
        if t < T:
            D.line(ctx, 1610, 840, 1610, 900, D.INK, 4)
        p = R.stand("side", t, 1)
        snip = 0.15 * math.sin(t * 20) if t < T else 0
        p.update(h1=(0.65, -1.4 + snip), face="determined" if t < T else "happy",
                 neck=0.2 if t < T else -0.4, look=(0, -1) if t > T else (0, 0))
        HERO.draw(ctx, 1540, 990, 98, 1, p)
        draw_dog(ctx, 1380, 994, 82, 1, dog_pose(t, "sit"))
    fx.grade(ctx, "dawn", 0.3)


def shot_rise(ctx, t, S):
    """Камера поднимается вместе с облаком шаров; крыша уходит вниз."""
    cam = Cam(Keys((0, 1250), (5, 1500)), Keys((0, 500), (5, -900, "io")), Keys((0, 1.0), (5, 0.65)))
    with layer(ctx, cam, t):
        bg(ctx, "roof_dawn", (-1500, -2600, 5000, 4000), dawn_roof)
        p = R.stand("front", t, 1)
        p.update(neck=-0.4, look=(0, -1), face="happy", a1=(2.6, 0.3), a2=(2.4, 0.4))
        HERO.draw(ctx, 1540, 990, 98, 1, p)
        draw_dog(ctx, 1400, 994, 82, 1, dog_pose(t, "sit", look=-0.5))
        balloon_cloud(ctx, t + 1, 160, net=False, rise=200 + t * 260, spread=1.0 + t * 0.12)
    fx.grade(ctx, "dawn", 0.3)


def grey_city(c, seed=231):
    C.sky(c, -2000, -1200, 7000, 2600, "dawn", sun=(4200, 300, 80))
    C.skyline(c, -2000, 5000, 900, "overcast", depth=0, seed=seed, esb_x=900, hmin=300, hmax=700)
    C.skyline(c, -2000, 5000, 1150, "overcast", depth=1, seed=seed + 2, hmin=200, hmax=600)


def shot_drift(ctx, t, S):
    """Над городом: единственный цвет — красные шары. Параллакс, камера летит вместе с ними."""
    cam = Cam(Keys((0, 600), (8, 2400, "lin")), Keys((0, 500), (8, 420)), 0.8, anchor=(600, 500))
    with layer(ctx, cam, t, 0.25):
        bg(ctx, "grey_far", (-2000, -1200, 7000, 2600), lambda c: C.sky(c, -2000, -1200, 7000, 2600, "dawn",
                                                                        sun=(3400, 300, 80)))
    with layer(ctx, cam, t, 0.45):
        bg(ctx, "grey_sky1", (-2000, -400, 7000, 1500), lambda c: C.skyline(c, -2000, 5000, 900, "overcast", depth=0,
                                                                             seed=231, esb_x=1500, hmin=300, hmax=700))
    with layer(ctx, cam, t, 0.8):
        bg(ctx, "grey_sky2", (-2000, -200, 7000, 1700), lambda c: C.skyline(c, -2000, 5000, 1250, "overcast",
                                                                             depth=1, seed=233, hmin=250, hmax=700))
    with layer(ctx, cam, t):
        cx = 900 + t * 225
        balloon_cloud(ctx, t, 220, cx=cx, base=700, net=False, spread=1.6 + t * 0.08, scale=0.75)
    fx.grade(ctx, "dawn", 0.2)


def shot_rosa(ctx, t, S):
    def scene(c):
        p = R.stand("front", t, 4)
        jump = abs(math.sin(t * 6)) * 0.15
        p.update(a1=(2.9 + 0.2 * math.sin(t * 9), 0.2), a2=(2.9 - 0.2 * math.sin(t * 9), 0.2), face="laugh",
                 hip=(0, -jump))
        rosa_window_close(c, t, "dawn", pose_fn=lambda tt: p, light=0.4)
        r = rng(4)
        for k in range(18):
            bx = (r.uniform(-200, 2200) - t * 260) % 2400 - 200
            by = r.uniform(100, 900)
            ST.balloon(c, bx, by, 40, r.choice(RED), string=80, sway=15)
    binocular(ctx, scene, t)
    fx.grade(ctx, "dawn", 0.2)


def shot_far(ctx, t, S):
    """Силуэт со спины на краю крыши; шары рассыпаются точками к солнцу."""
    cam = Cam(960, 520, Keys((0, 1.0), (6, 1.08)))
    with layer(ctx, cam, t):
        bg(ctx, "grey_city", (-2000, -1200, 7000, 2600), grey_city)
        r = rng(7)
        for k in range(120):
            bx = 1100 + r.uniform(-400, 400) + t * 70 * r.uniform(0.6, 1.4)
            by = 380 + r.uniform(-200, 160) - t * 15
            D.circle(ctx, bx, by, 6 + r.random() * 4, hexrgb(r.choice(RED)), D.INK, 1.2)
        CITY.parapet_front(ctx, -400, 2400, 1000, tod="dawn")
        p = R.stand("back", t, 1)
        HERO.draw(ctx, 700, 1000, 120, 1, p)
        draw_dog(ctx, 860, 1004, 96, 1, dog_pose(t, "sit", look=-0.3))
    fx.grade(ctx, "dawn", 0.3)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_cut),
        Shot(c(1) - 0.1, shot_rise),
        Shot(c(2) - 0.1, shot_drift, "fade", 0.4),
        Shot(c(3) - 0.1, shot_rosa),
        Shot(c(4) - 0.1, shot_far, "fade", 0.4),
    ]
