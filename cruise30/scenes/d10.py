"""День 10: 4 утра, двигатели встают. Свет гаснет палуба за палубой. Впервые слышно океан —
и пять тысяч шагов. Аварийный аккумулятор: рация и гудок. 100%. Каждый вечер с Долорес — минус три."""
from scenes.kit import *
from scenes.shared import *

MOON = (2100, 140, 40)


def shot_engines(ctx, t, S):
    T_OFF = 1.0
    cam = Cam(Keys((0, 1100), (3, 1150)), 560, Keys((0, 1.05), (3, 1.2)), shake=lambda tt: 0.15 if tt < T_OFF else 0)
    power = 1.0 if t < T_OFF or (T_OFF + 0.2 < t < T_OFF + 0.35) else 0.0
    bridge_back(ctx, t, cam, "night", power, moon=MOON, autopilot=power > 0,
                wheel_ang=0.1 * min(t, T_OFF))
    with layer(ctx, cam, t):
        p = sit_pose(t, 1, "sleep" if t < T_OFF + 0.4 else "shock", seat=1.4)
        if t > T_OFF + 0.4:
            p.update(blink=0, hturn=0.6)
        LEO_CAP.draw(ctx, BR.CHAIR_X + 30, BR.BF - 10, 115, 1, p)
        draw_cat(ctx, BR.CHAIR_X - 140, BR.BF - 10, 90, 1, cat_pose(t, "sleep" if t < T_OFF + 0.6 else "stand"))
    if power == 0:
        fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 1460, 200), 900, power=0.6, glow_a=0.05)])
    D.rrect(ctx, 1580, 820, 280, 110, 16, hexrgb("#0e1410"), D.INK, 5)
    D.text(ctx, "04:00", 1720, 900, 72, D.FONT_TITLE, hexrgb("#ff4a3a"), alpha=1.0 if power > 0 else 0.25)
    if t > T_OFF:
        pop_text(ctx, "...vrrrm... rr...", W / 2, 240, t, T_OFF - 0.3, 80, "#d8dee2", dur=1.0, shake=False)


def shot_lights_out(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cut = Keys((0, 800), (d - 0.4, -900, "lin"))(t)        # всё ниже линии cut уже тёмное
    cam = Cam(0, 330, Keys((0, 0.7), (d, 0.62)))
    sea_back(ctx, t, cam, "night", moon=(900, -100, 45), hy=760, p=0.3)
    with layer(ctx, cam, t):
        k_dark = "ship_night_dark"
        ctx.save()
        bg(ctx, k_dark, (-1500, -330, 3000, 1100), lambda c: SH.ship_side(c, 0, 760, 0.8, "night", 0.0))
        ctx.rectangle(-2000, -2000, 4000, cut + 2000)
        ctx.clip()
        bg(ctx, "ship_night_lit", (-1500, -330, 3000, 1100), lambda c: SH.ship_side(c, 0, 760, 0.8, "night", 1.0))
        ctx.restore()
        SEA.foam_line(ctx, -950, 950, 762, t, 3, 0.5)
        r = rng(6)
        for k in range(10):
            yy = 760 - 80 * k
            if abs(cut - yy) < 50:
                D.text(ctx, "click", r.uniform(-700, 700), yy, 40, D.FONT_HAND, hexrgb("#fff6d8"), alpha=0.8)


def shot_listen(ctx, t, S):
    """Тишина: Лео на крыле слушает океан, потом камера опускается к тёмной палубе — шаги."""
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 1200), (d, 1300)), Keys((0, 250), (d * 0.45, 250), (d, 1250, "io")),
              Keys((0, 1.1), (d * 0.45, 1.1), (d, 0.75)))
    sea_back(ctx, t, cam, "night", moon=(1700, -300, 45), hy=1500, p=0.2)
    with layer(ctx, cam, t):
        bg(ctx, "wing_dark", (-700, -600, 2900, 3000), lambda c: OD.wing(c, "night", 0.0))
        p = R.stand("side", t, 1)
        p.update(face="worried", h1=(-0.2, -3.25), hturn=0.9, look=(0.6, 0.6))
        LEO_CAP.draw(ctx, 1150, OD.WING_Y, 100, 1, p)
        # тёмная палуба далеко внизу с силуэтами
        r = rng(13)
        for i in range(40):
            x = r.uniform(-400, 2600)
            y = 1650 + r.uniform(0, 300)
            ph = t * 0.6 + i
            look = R.zombie_look(2000 + i)
            fast_zombie(ctx, x + math.sin(ph) * 30, y, 38, 1 if i % 2 else -1, look, t, i, True)
    fx.darkness(ctx, 0.5, [fx.Light(*cam.to_screen(t, 1700, -300), 1300, power=0.6, glow_a=0.08, glow="#cfe0ff")])
    if t > d * 0.55:
        for k in range(6):
            ph = (t * 1.4 + k / 6) % 1
            D.text(ctx, "shff", 200 + k * 290, 700 + math.sin(k) * 80 - ph * 40, 46, D.FONT_HAND, hexrgb("#cfe0ff"),
                   alpha=(1 - ph) * 0.8)
    else:
        for k in range(3):
            ph = (t * 0.6 + k / 3) % 1
            D.text(ctx, "shhhhh", 300 + k * 500, 900 - ph * 30, 50, D.FONT_HAND, hexrgb("#9fd0f0"), alpha=(1 - ph) * 0.7)


def shot_battery(ctx, t, S):
    cam = Cam(Keys((0, 1700), (3, 1900)), 600, Keys((0, 1.4), (3, 1.75)))
    bridge_back(ctx, t, cam, "night", 0.0, moon=MOON, battery=100, autopilot=False)
    with layer(ctx, cam, t):
        BR.radio_lit(ctx, t, 0.0)
        p = R.stand("side", t, 1)
        p.update(face="worried", hturn=0.8, look=(0.6, 0.4))
        LEO_CAP.draw(ctx, 1500, BR.BF + 40, 120, 1, p)
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, BR.RADIO_X - 120, 600), 600, power=0.85, glow="#ff6a5a",
                                     glow_a=0.15),
                            fx.Light(*cam.to_screen(t, BR.HORN_X, 580), 300, power=0.7, glow="#ff4a3a", glow_a=0.2)])
    labels = [(0.3, "RADIO"), (1.4, "HORN")]
    for i, (tt, txt) in enumerate(labels):
        x, y = cam.to_screen(t, BR.RADIO_X if i == 0 else BR.HORN_X, 430)
        pop_text(ctx, txt, x, y - 60, t, tt, 70, "#ffe36a", dur=4.0, shake=False)


def shot_meter(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0e1430"), (1, "#1a2650")])
    lvl = 100 if t < 1.6 else 97
    ctx.save()
    ctx.translate(W / 2 - 80, H / 2 + 20)
    D.rrect(ctx, -380, -170, 760, 340, 40, hexrgb("#2b2f3a"), D.INK, 10)
    D.rrect(ctx, 380, -70, 50, 140, 12, hexrgb("#2b2f3a"), D.INK, 8)
    k = lvl / 100
    c = "#4cff8a"
    D.rrect(ctx, -350, -140, 700 * k, 280, 26, hexrgb(c), None, 0)
    D.text(ctx, "%d%%" % lvl, 0, 60, 170, D.FONT_TITLE, hexrgb("#0e1430"))
    ctx.restore()
    if t > 1.0:
        k = ease_out_back(clamp((t - 1.0) / 0.3))
        ctx.save()
        ctx.translate(W / 2 + 560, 330)
        ctx.scale(k, k)
        ctx.rotate(0.1)
        D.text(ctx, "-3%", 0, 0, 150, D.FONT_TITLE, hexrgb("#ff4a3a"), stroke=D.INK, slw=12)
        D.text(ctx, "/ NIGHT", 0, 90, 60, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=8)
        ctx.restore()
        DOLORES.head_only(ctx, 420, 300, 170, 1, {"view": "front", "face": "smile", "neck_line": False})


def shot_quiet(ctx, t, S):
    """Тёмный лайнер под луной, медленный отъезд."""
    cam = Cam(0, Keys((0, 380), (8, 300)), Keys((0, 0.75), (8, 0.55)))
    sea_back(ctx, t, cam, "night", moon=(500, -150, 50), hy=760, p=0.3)
    ship_ext(ctx, t, cam, 0, 760, 0.8, "night", 0.0, wake=0.0, smoke=False)
    with layer(ctx, cam, t):
        BR_x = 0.8 * 830
        D.circle(ctx, BR_x, 760 - 0.8 * 600, 6, hexrgb("#ff4a3a"), None, 0)
        fx.glow(ctx, BR_x, 760 - 0.8 * 600, 60, "#ff4a3a", 0.4 + 0.2 * math.sin(t * 3))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_engines),
        Shot(c(1) - 0.1, shot_lights_out, "fade", 0.3),
        Shot(c(2) - 0.1, shot_listen, "fade", 0.3),
        Shot(c(3) - 0.1, shot_battery, "fade", 0.3),
        Shot(c(4) - 0.1, shot_meter, "fade", 0.25),
        Shot(max(c(4, True) + 0.8, c(4) + 2.5), shot_quiet, "fade", 0.6),
    ]
    S.sfx += [(0.7, "engine_down", 1.0), (c(1) + 0.3, "click", 0.5), (c(1) + 1.0, "click", 0.5),
              (c(1) + 1.7, "click", 0.5), (c(2), "waves", 0.8), (c(2) + 2.5, "footsteps", 0.9)]
    S.music = "silence"
