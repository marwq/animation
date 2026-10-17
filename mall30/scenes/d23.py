"""День 23: окно Розы тёмное. «ОНИ В ЗДАНИИ. ИДУ НА КРЫШУ». Фонарик по лестнице: 21, 22… и всё."""
from scenes.kit import *
from scenes.shared import window_view, binocular, rosa_window_close


def shot_dark_window(ctx, t, S):
    cam = Cam(Keys((0, 960), (4, 990)), Keys((0, 520), (4, 470)), Keys((0, 0.85), (4, 1.05)))
    window_view(ctx, t, cam, "dusk", 0.0)
    p = R.stand("back", t, 2)
    HERO.draw(ctx, 520, H + 330, 240, 1, p)
    fx.grade(ctx, "dusk", 0.4)
    D.text(ctx, "6:00 PM", W - 90, 180, 70, D.FONT_DAY, hexrgb("#f7eedb"), "right", True, stroke=D.INK, slw=8)


def shot_scared_sign(ctx, t, S):
    def scene(c):
        p = R.stand("front", t, 4)
        p.update(h1=(-0.8, -2.9), h2=(0.8, -2.9), face="scared", blink=0, hturn=-0.4 * math.sin(t * 3))
        rosa_window_close(c, t, "night", sign=["THEY'RE IN", "THE BUILDING!", "GOING TO", "THE ROOF"],
                          sign_k=clamp(t / 0.25), pose_fn=lambda tt: p, light=0.5)
    sh = math.sin(t * 40) * 3
    ctx.save()
    ctx.translate(sh, 0)
    binocular(ctx, scene, t)
    ctx.restore()
    fx.grade(ctx, "night", 0.3)
    D.text(ctx, "7:00 PM", W - 90, 180, 70, D.FONT_DAY, hexrgb("#f7eedb"), "right", True, stroke=D.INK, slw=8)


def stair_tower(c):
    C.sky(c, -600, -1600, 3200, 3000, "night", moon=(1600, -1200, 40))
    CITY.rosa_tower(c, 600, 1400, 560, 26, "night", lit=0.0)
    # колонна узких окон лестницы справа
    flh = 44
    top = 1400 - (26 * flh + 60)
    for f in range(26):
        D.rect(c, 600 + 560 - 50, top + 34 + f * flh, 26, flh - 20, hexrgb("#1c1d30"), D.INK, 1.5, wob=0)


def light_floor(t, d):
    """Этаж, на котором фонарик, по времени."""
    return lerp(18, 22, clamp(t / d))


def shot_stairs(ctx, t, S):
    """Фонарик поднимается по лестнице, окно за окном. Камера идёт вверх."""
    d = S.cue(3) - S.cue(2) + 1.0
    flh = 44
    top = 1400 - (26 * flh + 60)
    fl = light_floor(t, d)
    ly = top + 34 + (26 - fl) * flh + (flh - 20) / 2
    lx = 600 + 560 - 37
    cam = Cam(lx - 200, lambda tt: top + 34 + (26 - light_floor(tt, d)) * flh, 1.6)
    with layer(ctx, cam, t):
        bg(ctx, "stair_tower", (-600, -1600, 3200, 3100), stair_tower)
    sx, sy = cam.to_screen(t, lx, ly)
    fx.grade(ctx, "night", 0.5)
    on = not (fl >= 22 and t > d - 0.2)
    if on:
        fx.glow(ctx, sx, sy, 90, "#fff2c8", 0.8)
        D.circle(ctx, sx, sy, 10, hexrgb("#fff8e0"), None, 0)
    D.text(ctx, "%d" % int(fl), W - 140, 220, 160, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=12)
    D.text(ctx, "FLOOR", W - 140, 290, 50, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=8)


def shot_stopped(ctx, t, S):
    """Свет замер на 22-м — и погас."""
    flh = 44
    top = 1400 - (26 * flh + 60)
    lx = 600 + 560 - 37
    ly = top + 34 + 4 * flh + (flh - 20) / 2
    cam = Cam(lx - 200, ly, Keys((0, 1.6), (3, 1.3)))
    with layer(ctx, cam, t):
        bg(ctx, "stair_tower", (-600, -1600, 3200, 3100), stair_tower)
    fx.grade(ctx, "night", 0.5)
    if t < 1.0:
        sx, sy = cam.to_screen(t, lx, ly)
        fl = 1.0 if (t < 0.6 or int(t * 12) % 2) else 0.3
        fx.glow(ctx, sx, sy, 90, "#fff2c8", 0.8 * fl)
        D.circle(ctx, sx, sy, 10, hexrgb("#fff8e0"), None, 0, alpha=fl)


def shot_vigil(ctx, t, S):
    """Всю ночь у стекла: небо светлеет, окно Розы остаётся тёмным."""
    d = S.dur - (S.cue(4) - 0.1)
    k = clamp(t / d)
    tod = "night" if k < 0.6 else "dawn"
    cam = Cam(960, 560, Keys((0, 0.9), (d, 1.0)))
    window_view(ctx, t, cam, tod, 0.0, frame=True)
    fx.grade(ctx, "night", 0.5 * (1 - k))
    p = R.stand("side", t, 2)
    p.update(k1=(2.15, 1.85), k2=(2.0, 1.7), hip=(0, 1.5), neck=0.1, h1=(0.75, -1.2), h2=(0.7, -1.15),
             face="sad", hturn=0.6, blink=1.0 if k > 0.7 else R.blink(t, 2))
    HERO.draw(ctx, 520, H + 40, 230, 1, p)
    draw_dog(ctx, 820, H + 44, 190, -1, dog_pose(t, "lie"))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_dark_window),
        Shot(c(1) - 0.1, shot_scared_sign),
        Shot(c(2) - 0.1, shot_stairs),
        Shot(c(3) + 1.0, shot_stopped),
        Shot(c(4) - 0.1, shot_vigil, "fade", 0.5),
    ]
    S.tods = [(0, "dusk"), (c(1), "night"), (c(4) + 3.5, "dawn")]
