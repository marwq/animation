"""День 29: верхушка трубы — самая высокая точка корабля, внизу кишат все палубы. Ни рации, ни еды.
Полбутылки воды — пополам с кошкой. Рядом старый латунный гудок: без электричества, только цепь.
У скалодрома они снова строят гору. Выше. Сидишь, держа руку на цепи, и ждёшь солнца."""
from scenes.kit import *
from scenes.shared import *
from scenes.d15 import clock_badge
from scenes.d26 import pile
from scenes.d05 import sports_bg, WALL_MID

SUN = (1700, 120, 70)
CHAIN = (1370, 515)       # ручка цепи гудка в мире funnel_top


def funnel_bg(ctx, t, cam, tod="day", sun=SUN, moon=None, hy=900):
    sea_back(ctx, t, cam, tod, sun=sun, moon=moon, hy=hy, p=0.2)
    with layer(ctx, cam, t):
        bg(ctx, "funnel_" + tod, (-500, 0, 3000, 1300), lambda c: OD.funnel_top(c, tod))


def shot_top(ctx, t, S):
    d = S.cue(1) - 0.1
    T_POV = d * 0.6
    if t < T_POV:
        fx_, fy_ = -180 * 0.85, 760 - 832 * 0.85
        cam = Cam(Keys((0, 0), (T_POV, fx_ + 20)), Keys((0, 420), (T_POV, fy_ + 20)),
                  Keys((0, 0.55), (T_POV, 2.6, "in")))
        sea_back(ctx, t, cam, "morning", sun=(1400, 200, 70), hy=640, p=0.3)
        with layer(ctx, cam, t, 0.3):
            SEA.gulls(ctx, t, -800, 1600, 100, 300, n=5)
        ship_ext(ctx, t, cam, 0, 760, 0.85, "morning", 0.0, wake=0.0, smoke=False, antenna=False)
        with layer(ctx, cam, t):
            p = sit_pose(t, 1, "sad", seat=0.0)
            p.update(f1=(0.8, 0.0), f2=(0.7, 0.0))
            LEO_CAP.draw(ctx, fx_ - 6, fy_, 9, 1, p)
            draw_cat(ctx, fx_ - 20, fy_, 7, 1, cat_pose(t, "lie"))
        if t > 1.2:
            x, y = cam.to_screen(t, fx_, fy_ - 10)
            k = ease_out_back(clamp((t - 1.2) / 0.3))
            D.circle(ctx, x, y, 110 * k, None, hexrgb("#e8423c"), 7)
            pop_text(ctx, "HIGHEST POINT", W / 2, 220, t, 1.2, 90, "#ffe36a", dur=T_POV, shake=False)
        return
    # взгляд вниз: палуба кишит, сверху болтаются ноги Лео
    tt = t - T_POV
    cam = Cam(900, Keys((0, 560), (3, 480)), Keys((0, 0.75), (3, 0.9)))
    with layer(ctx, cam, tt):
        r = rng(29)
        crowd = []
        for i in range(520):
            x, y = r.uniform(-1200, 3000), r.uniform(60, 1300)
            if 280 < x < 1220 and 280 < y < 580 or 1480 < x < 1900 and 240 < y < 580:
                continue
            crowd.append((x + math.sin(tt * 0.7 + i) * 20, y, hexrgb(r.choice(R.ZOMBIE_SKIN))))
        D.rect(ctx, -2500, -2000, 7000, 2010, hexrgb("#b07e4c"), None, 0, wob=0)
        OD.deck_far_below(ctx, tt, "morning", crowd)
    fx.grade(ctx, "dusk", 0.08)
    # ноги в кадре сверху
    for i, dx in enumerate((-70, 60)):
        sw = math.sin(tt * 2 + i) * 14
        D.line(ctx, W / 2 + dx, -20, W / 2 + dx + sw, 300, D.INK, 46)
        D.line(ctx, W / 2 + dx, -20, W / 2 + dx + sw, 300, hexrgb("#2b2f3a"), 36)
        D.ellipse(ctx, W / 2 + dx + sw + 12, 320, 40, 26, hexrgb("#1a1a1a"), D.INK, 4)
    pop_text(ctx, "EVERY DECK.", W / 2, 520, tt, 0.6, 110, "#9fc86a", dur=4, shake=False)


def shot_nothing(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_POUR = d * 0.55
    cam = Cam(Keys((0, 820), (d, 760)), Keys((0, 430), (d, 470)), Keys((0, 1.7), (d, 2.0)))
    funnel_bg(ctx, t, cam, "day")
    with layer(ctx, cam, t):
        s = 105
        x0 = 800
        p = sit_pose(t, 1, "sad" if t < T_POUR else "smile", seat=0.0)
        pour = smooth(clamp((t - T_POUR) / 0.4))
        p.update(f1=(0.8, 0.0), f2=(0.7, 0.0), h1=(0.75 + 0.2 * pour, -1.6 + 0.6 * pour), hturn=0.7)
        J = LEO_CAP.draw(ctx, x0, OD.FTOP - 20, s, 1, p)
        hx, hy = LEO_CAP.world(x0, OD.FTOP - 20, s, 1, J["hand1"])
        ang = 1.9 * pour
        IN.bottle(ctx, hx + 10, hy - 30, 0.75, ang, letter=False)
        # уровень воды — половина
        ctx.save()
        ctx.translate(hx + 10, hy - 30)
        ctx.rotate(ang)
        ctx.scale(0.75, 0.75)
        D.rect(ctx, -26, 5, 52, 50, hexrgb("#7fd0ff"), None, 0, wob=0, alpha=0.8)
        ctx.restore()
        # крышечка и кошка
        capx = x0 + 230
        D.ellipse(ctx, capx, OD.FTOP - 28, 22, 8, hexrgb("#e8423c"), D.INK, 3)
        if pour > 0.5:
            for k in range(5):
                u = ((t * 3 + k / 5) % 1.0)
                D.circle(ctx, lerp(hx + 60, capx, u), lerp(hy, OD.FTOP - 36, u * u), 5, hexrgb("#7fd0ff"), None, 0)
        drink = t > T_POUR + 0.5
        draw_cat(ctx, capx + 110, OD.FTOP - 20, 75, -1,
                 cat_pose(t, "stand" if drink else "lie", look=1.4 if drink else 0.0))
    fx.glow(ctx, *cam.to_screen(t, SUN[0], SUN[1]), 900, "#fff3b0", 0.25)
    for i, (txt, t0) in enumerate((("NO RADIO", 0.1), ("NO FOOD", 0.8))):
        if t < t0:
            continue
        k = ease_out_back(clamp((t - t0) / 0.3))
        ctx.save()
        ctx.translate(360 + i * 520, 200)
        ctx.rotate(-0.05)
        ctx.scale(k, k)
        D.rrect(ctx, -220, -60, 440, 120, 24, hexrgb("#fff6d8"), D.INK, 6)
        D.text(ctx, txt, 0, 22, 62, D.FONT_TITLE, hexrgb("#1c3f7c"))
        kx = clamp((t - t0 - 0.3) / 0.2)
        D.line(ctx, -200, -40, -200 + 400 * kx, 40, hexrgb("#e8423c"), 14)
        ctx.restore()
    if t > T_POUR - 0.3:
        x, y = cam.to_screen(t, x0 + 140, OD.FTOP - 330)
        pop_text(ctx, "1/2", x, y, t, T_POUR - 0.3, 90, "#7fd0ff", dur=1.5, shake=False)


def shot_horn(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_HAND = d * 0.62
    cam = Cam(Keys((0, 1180), (d, 1300)), Keys((0, 360), (d, 420)), Keys((0, 1.9), (d, 2.2)))
    funnel_bg(ctx, t, cam, "day")
    with layer(ctx, cam, t):
        OD.horn(ctx, 1300, OD.FTOP - 20, 1.0, "day", chain_pull=0.05 * math.sin(t * 2))
        reach = smooth(clamp((t - T_HAND) / 0.6))
        p = sit_pose(t, 1, "neutral", seat=0.0)
        p.update(f1=(0.8, 0.0), f2=(0.7, 0.0), hturn=0.6, look=(-0.2, 0.4))
        p["h1"] = (lerp(0.4, 1.05, reach), lerp(-1.0, -0.62, reach))
        LEO_CAP.draw(ctx, 1480, OD.FTOP - 20, 105, -1, p)
        fx.glow(ctx, 1150, OD.FTOP - 340, 120, "#ffe9a0", 0.35 + 0.15 * math.sin(t * 3))
    if t > 0.5:
        x, y = cam.to_screen(t, 1300, OD.FTOP - 20)
        k = ease_out_back(clamp((t - 0.5) / 0.35))
        ctx.save()
        ctx.translate(620, 220)
        ctx.scale(k, k)
        D.rrect(ctx, -380, -70, 760, 140, 26, hexrgb("#fff6d8"), D.INK, 6)
        D.text(ctx, "NO POWER NEEDED", 0, 22, 58, D.FONT_TITLE, hexrgb("#c23b33"))
        ctx.restore()
    if t > T_HAND - 0.4:
        x, y = cam.to_screen(t, *CHAIN)
        pop_text(ctx, "JUST A CHAIN", x - 380, y - 120, t, T_HAND - 0.4, 70, "#ffe36a", dur=3, shake=False)


def shot_stack(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    top = Keys((0, OD.WALL_TOP + 420), (d, OD.WALL_TOP + 90))(t)
    cam = Cam(WALL_MID + 60, Keys((0, 220), (d, 120)), Keys((0, 0.58), (d, 0.64)))
    sports_bg(ctx, t, cam, "sunset")
    with layer(ctx, cam, t):
        hx, hy, _ = OD._holds()[-1]
        D.line(ctx, hx - 260, hy, hx + 260, hy, hexrgb("#e8423c"), 8)
        pile(ctx, t, top, seed=29)
    fx.grade(ctx, "dusk", 0.3)
    x, y = cam.to_screen(t, OD._holds()[-1][0] - 300, OD._holds()[-1][1])
    D.text(ctx, "LAST HOLD", x - 20, y + 18, 50, D.FONT_TITLE, hexrgb("#ff8a7a"), "right", stroke=D.INK, slw=6)
    if t > d * 0.55:
        pop_text(ctx, "HIGHER.", W / 2 + 350, 300, t, d * 0.55, 140, "#9fc86a", dur=3, shake=False)


def shot_wait(ctx, t, S):
    d = S.dur - S.cue(4)
    k = clamp(t / d)
    cam = Cam(Keys((0, 1050), (d, 1000)), Keys((0, 420), (d, 300)), Keys((0, 1.45), (d, 0.95)))
    moon = (lerp(200, 2300, k), lerp(-200, 300, k), 40)
    funnel_bg(ctx, t, cam, "night", sun=None, moon=moon)
    # рассвет подкрадывается к горизонту
    dawn = smooth(clamp((k - 0.55) / 0.45))
    if dawn > 0:
        g = cairo.LinearGradient(0, H, 0, 0)
        g.add_color_stop_rgba(0, 1.0, 0.62, 0.42, 0.55 * dawn)
        g.add_color_stop_rgba(0.6, 0.9, 0.5, 0.6, 0.0)
        ctx.set_source(g)
        ctx.rectangle(0, 0, W, H)
        ctx.fill()
    with layer(ctx, cam, t):
        OD.horn(ctx, 1300, OD.FTOP - 20, 1.0, "night")
        p = sit_pose(t, 1, "neutral", seat=0.0)
        p.update(f1=(0.8, 0.0), f2=(0.7, 0.0), h1=(1.05, -0.62), hturn=0.4,
                 blink=1.0 if 0.35 < k < 0.5 else p.get("blink", 0.0))
        LEO_CAP.draw(ctx, 1480, OD.FTOP - 20, 105, -1, p)
        draw_cat(ctx, 1600, OD.FTOP - 20, 70, -1, cat_pose(t, "sleep"))
    clock_badge(ctx, "%02d:%02d" % ((23 + int(k * 6.5 * 60) // 60) % 24, int(k * 6.5 * 60) % 60), t)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_top),
        Shot(c(1) - 0.1, shot_nothing, "fade", 0.3),
        Shot(c(2) - 0.1, shot_horn, "fade", 0.3),
        Shot(c(3) - 0.1, shot_stack, "whip", 0.3),
        Shot(c(4) - 0.1, shot_wait, "black", 0.5),
    ]
    S.tods = [(0, "day"), (c(3), "dusk"), (c(4), "night")]
    S.sfx += [(c(1) + 0.1, "pop", 0.6), (c(1) + 0.8, "pop", 0.6), (c(3), "zombie_groan", 0.8)]
    S.music = "lonely"
