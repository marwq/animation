"""День 12: новости Розы на картоне — эвакуация с крыш, только где видно людей. Ночь на матрасе."""
from scenes.kit import *
from scenes.shared import window_view, binocular, rosa_window_close
from sets import stores as ST


def rosa_radio(t):
    p = R.stand("front", t, 4)
    p.update(h1=(-0.8, -2.9), h2=(0.8, -2.9), face="neutral")
    return p


def bino_sign(lines, light=0.85, tod="dusk"):
    def fn(ctx, t, S):
        def scene(c):
            rosa_window_close(c, t, tod, sign=lines, sign_k=clamp((t - 0.2) / 0.3), pose_fn=rosa_radio, light=light)
            ST.radio(c, 1240, 1010, 0.9, 1.0, t)
        binocular(ctx, scene, t)
        fx.grade(ctx, "dusk", 0.2)
    return fn


def heli_far(ctx, x, y, s, t, light=True):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.col(ctx, hexrgb("#1c1c24"))
    ctx.move_to(-60, 0)
    ctx.curve_to(-60, -30, 40, -34, 60, -10)
    ctx.line_to(60, 10)
    ctx.line_to(-40, 14)
    ctx.close_path()
    ctx.fill()
    ctx.set_line_width(6)
    ctx.move_to(-50, -4)
    ctx.line_to(-160, -16)
    ctx.stroke()
    ph = math.cos(t * 40)
    ctx.move_to(-90 * ph, -38)
    ctx.line_to(90 * ph, -38)
    ctx.stroke()
    ctx.restore()
    if light:
        ctx.save()
        ctx.set_operator(cairo.OPERATOR_ADD)
        g = cairo.LinearGradient(x, y, x - 40, y + 600 * s)
        g.add_color_stop_rgba(0, 1, 0.97, 0.85, 0.35)
        g.add_color_stop_rgba(1, 1, 0.97, 0.85, 0)
        ctx.set_source(g)
        ctx.move_to(x, y + 10 * s)
        ctx.line_to(x - 140 * s * 3, y + 600 * s * 3)
        ctx.line_to(x + 60 * s * 3, y + 600 * s * 3)
        ctx.close_path()
        ctx.fill()
        ctx.restore()


def shot_heli(ctx, t, S):
    """Из окна: далеко над Гудзоном вертолёт с прожектором забирает людей с крыши."""
    cam = Cam(Keys((0, 1000), (5, 900)), 420, Keys((0, 0.85), (5, 0.95)))
    window_view(ctx, t, cam, "dusk", rosa_light=0.85)
    hx = lerp(1700, 300, t / 5)
    heli_far(ctx, hx, 230 + math.sin(t * 2) * 6, 0.35, t)
    fx.grade(ctx, "dusk", 0.3)


def shot_roof_empty(ctx, t, S):
    """У Liberty Mall есть крыша. Пустая. Камера уходит вверх."""
    cam = Cam(Keys((0, 900), (5, 960)), Keys((0, 560), (5, 300)), Keys((0, 1.2), (5, 0.62)))
    with layer(ctx, cam, t, 0.4):
        bg(ctx, "roofsky_dusk", (-1500, -1500, 5000, 2600), lambda c: (
            C.sky(c, -1500, -1500, 5000, 2600, "dusk"),
            C.skyline(c, -1500, 3500, 760, "dusk", depth=0, seed=121, esb_x=300, hmin=240, hmax=600)))
    with layer(ctx, cam, t):
        bg(ctx, "roof_dusk", (-1200, 0, 4400, 1400), lambda c: CITY.roof(c, -1200, 3200, 860, "dusk"))
        p = R.stand("front", t, 2)
        p.update(neck=-0.35, hturn=0.0, look=(0, -1))
        HERO.draw(ctx, 980, 900, 70, 1, p)
    heli_far(ctx, lerp(300, 1500, t / 5), 160, 0.25, t, light=False)
    fx.grade(ctx, "dusk", 0.35)


def shot_bed(ctx, t, S):
    """Ночь. Мебельный: на огромной кровати за $2999. Мысль: «как стать заметным с неба?»"""
    cam = Cam(Keys((0, 760), (6, 820)), Keys((0, 640), (6, 600)), Keys((0, 1.35), (6, 1.55)),
              r=Keys((0, -0.03), (6, 0.03)))
    with layer(ctx, cam, t):
        bg(ctx, "bedroom", (-400, -100, 2800, 1400), lambda c: ST.bedroom_store(c, 0.6))
        p = R.stand("side", t, 1)
        p.update(face="neutral", blink=1.0 if t > 4.5 else R.blink(t, 2), a1=(3.0, 2.4), a2=(2.9, 2.4), hturn=0.4)
        ctx.save()
        ctx.translate(1150, 690)
        ctx.rotate(-math.pi / 2 + 0.05)
        HERO.draw(ctx, 0, 0, 80, 1, p)
        ctx.restore()
        draw_dog(ctx, 1200, 700, 62, -1, dog_pose(t, "lie"))
        # мысль
        k = clamp((t - 1.5) / 0.5)
        if k > 0:
            for i, (dx, dy, r) in enumerate([(-60, -60, 10), (-90, -110, 16)]):
                D.circle(ctx, 770 + dx, 640 + dy, r * k, hexrgb("#fffaf0"), D.INK, 3)
            ctx.save()
            ctx.translate(560, 420)
            ctx.scale(k, k)
            D.blob(ctx, [(-150, 0), (-120, -80), (0, -110), (130, -80), (160, 0), (110, 70), (-20, 90), (-130, 60)],
                   hexrgb("#fffaf0"), D.INK, 4)
            heli_far(ctx, 0, -10, 0.6, t, light=False)
            ctx.restore()
    fx.darkness(ctx, 0.62, [fx.Light(*cam.to_screen(t, 900, 700), 600, power=0.6, glow="#ffd9a0", glow_a=0.15),
                            fx.Light(*cam.to_screen(t, 1165, 680), 300, power=0.6, glow_a=0.2)])
    fx.grade(ctx, "night", 0.5)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, bino_sign(["6 PM NEWS", "(RADIO)"])),
        Shot(c(1) - 0.1, bino_sign(["ARMY EVACUATING", "BY HELICOPTER", "FROM ROOFTOPS"])),
        Shot(c(1) + 2.2, shot_heli),
        Shot(c(2) - 0.1, bino_sign(["ONLY ROOFS", "WHERE THEY", "SEE PEOPLE!"])),
        Shot(c(3) - 0.1, shot_roof_empty),
        Shot(c(4) - 0.1, shot_bed, "black", 0.5),
    ]
    S.tods = [(0, "dusk"), (c(4), "night")]
