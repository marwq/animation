"""День 28: тот самый момент из начала — люки, крик — и погоня вверх по эскалатору."""
from scenes.kit import *
from scenes import cold
from sets import stores as ST


def shot_hatch2(ctx, t, S):
    """Следующий люк. И ещё один."""
    x, y = cold.HATCH[2]
    cam = Cam(x, y - 60, Keys((0, 2.0), (2, 2.3)), shake=lambda t: shake_k(t, 0.3, 0.3, 0.6) + shake_k(t, 0.9, 0.3, 0.6))
    with layer(ctx, cam, t):
        bg(ctx, "fc_night", (-400, 0, 2800, 1300), cold._fc)
        cold.hatch_draw(ctx, t, 2, 0.0, 1.0 if (0.3 < t < 0.5 or 0.9 < t < 1.1) else 0.0)
    lx, ly = cam.to_screen(t, cold.TABLE_X - 60, cold.TABLE_Y - 230)
    fx.darkness(ctx, 0.78, [fx.Light(lx, ly, 900, glow_a=0.15), fx.Light(W / 2, H / 2, 600, power=0.4, glow_a=0)])
    fx.grade(ctx, "night", 0.6)


def shot_rise(ctx, t, S):
    """Общий план: из всех люков лезут — они пришли снизу."""
    cam = Cam(Keys((0, 1250), (4, 1150)), 640, Keys((0, 0.95), (4, 1.05)), shake=lambda t: 0.1)
    with layer(ctx, cam, t):
        bg(ctx, "fc_night", (-400, 0, 2800, 1300), cold._fc)
        for i in range(3):
            cold.hatch_draw(ctx, t, i, 1.0)
        for i, sd in enumerate((31, 32, 33)):
            cold.emerging(ctx, t, i, clamp(t * 0.45), sd)
        for i, sd in enumerate((34, 35, 36)):
            cold.emerging(ctx, t, i, clamp(t * 0.45 - 0.6), sd)
        cold.camp_table(ctx, t)
        p = R.stand("front", t, 3)
        p.update(face="scream", blink=0, hturn=0.5, a1=(0.5, 1.4), a2=(0.9, 1.2), lean=-0.08)
        HERO.draw(ctx, cold.HERO_X, cold.HERO_Y, cold.fs(cold.HERO_Y), 1, p)
        draw_dog(ctx, cold.HERO_X + 150, cold.HERO_Y + 20, cold.fs(cold.HERO_Y) * 0.95, 1,
                 dog_pose(t, "stand", bark=1.0))
    lx, ly = cam.to_screen(t, cold.TABLE_X - 60, cold.TABLE_Y - 230)
    fx.darkness(ctx, 0.7, [fx.Light(lx, ly, 700, glow_a=0.2), fx.Light(W / 2, 300, 900, power=0.4, glow_a=0)])
    fx.grade(ctx, "night", 0.5)


def shot_climb(ctx, t, S):
    """Вверх по стоящему эскалатору с Претцелем под мышкой. За спиной — сорок."""
    d = S.cue(4) - S.cue(3) + 0.2
    f = Keys((0, 0.0), (d, 0.92, "lin"))
    cam = Cam(lambda tt: ST.esc_point(f(tt))[0] - 120, lambda tt: ST.esc_point(f(tt))[1] - 150, 1.15,
              shake=lambda t: 0.15)
    with layer(ctx, cam, t):
        bg(ctx, "esc_big_n", (-400, -400, 2800, 1700), ST.escalator_big)
        # зомби следом
        for k in range(8):
            fk = f(t) - 0.08 - k * 0.055
            if fk < -0.1:
                continue
            x, y = ST.esc_point(clamp(fk, -0.2, 1))
            if fk < 0:
                x, y = ST.ESC_LOW[0] + fk * 1200, ST.ESC_LOW[1]
            look = R.zombie_look(2800 + k)
            R.Fig(look).draw(ctx, x - (k % 2) * 30, y, 82, 1, R.gait(t * 1.6 + k * 0.37, "shamble", "side", k),
                             extra=None)
        x, y = ST.esc_point(f(t))
        dist = f(t) * 1350 / 85
        p = R.gait(dist / 3.0 * 1.6, "run", "side")
        p.update(a2=(1.2, 1.4), face="scream", blink=0, hturn=0.6)
        HERO.draw(ctx, x, y, 85, 1, p)
        draw_dog(ctx, x + 10, y - 150, 52, 1, dog_pose(t, "stand", bark=0.6))
    fx.darkness(ctx, 0.62, [fx.Light(*cam.to_screen(t, x + 60, y - 200), 700, kind="cone", ang=-0.6, spread=0.4,
                                     power=0.8, glow_a=0.05), fx.Light(W / 2, 100, 900, power=0.35, glow_a=0)])
    fx.grade(ctx, "night", 0.5)


def shot_top(ctx, t, S):
    """Наверху: шестьдесят шаров. Он берёт первый. Вспышка: бросок №412."""
    cam = Cam(Keys((0, 1650), (3, 1700)), Keys((0, 260), (3, 240)), Keys((0, 1.6), (3, 2.4)))
    with layer(ctx, cam, t):
        bg(ctx, "esc_big_n", (-400, -400, 2800, 1700), ST.escalator_big)
        cols = ["#2f3d5c", "#c23b33", "#3f8a84", "#e2a33b", "#7a6aa3", "#1f1f24"]
        for k in range(30):
            ST.ball(ctx, 1570 + k * 34, 278, 18, cols[k % 6])
            ST.ball(ctx, 1587 + k * 34, 246, 18, cols[(k + 3) % 6])
        p = R.stand("side", t, 1)
        p.update(h1=(0.55, -1.7), h2=(0.5, -1.6), face="determined", lean=-0.05)
        J = HERO.draw(ctx, 1640, 300, 82, -1, p)
        hx, hy = HERO.world(1640, 300, 82, -1, J["hand1"])
        ST.ball(ctx, hx, hy, 20, "#c23b33")
        draw_dog(ctx, 1760, 304, 64, -1, dog_pose(t, "sit", bark=0.4))
    fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 1650, 200), 600, power=0.8, glow_a=0.1)])
    fx.grade(ctx, "night", 0.4)
    if 1.6 < t < 2.4:
        fx.flash(ctx, 0.25, "#ffd34a")
        D.text(ctx, "#412", W / 2, H / 2, 260, D.FONT_TITLE, hexrgb("#ffd34a"), stroke=D.INK, slw=16,
               alpha=clamp((t - 1.6) / 0.15) * clamp((2.4 - t) / 0.2))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, cold.shot_stove),
        Shot(c(0, True) - 1.6, cold.shot_hatch),
        Shot(c(1) - 0.1, shot_hatch2),
        Shot(c(2) - 0.1, lambda ctx, t, S: cold.shot_turn(ctx, t, S)),
        Shot(c(2) + 1.6, shot_rise),
        Shot(c(3) - 0.1, shot_climb),
        Shot(c(4) - 0.1, shot_top),
    ]
    S.sfx += [(c(0, True) - 1.6 + 0.45, "hatch_bang", 1.0), (c(2) - 0.1 + 0.85, "scream", 1.0)]
