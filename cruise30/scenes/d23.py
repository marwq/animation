"""День 23: небо на юге зеленеет. Долорес впервые напугана: ураган «Айви», четвёртая категория, прямо на
вас. Всё привязано. Самый маленький спасжилет из детского клуба — на Анкор. Она в ярости.
«Ты выглядишь очень профессионально»."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import dolores_at_radio


def green_sky(ctx, x0, y0, w, h, k):
    """Небо: слева голубое, справа (юг) — зелёное, k — насколько захватило."""
    D.vgrad(ctx, x0, y0, w, h, [(0, "#4a90d0"), (1, "#bfe6f2")])
    g = cairo.LinearGradient(x0 + w, 0, x0 + w * (1 - k), 0)
    c1, c2 = hexrgb("#3f6a3a"), hexrgb("#9fc86a")
    g.add_color_stop_rgba(0, *c1, 0.95)
    g.add_color_stop_rgba(0.6, *c2, 0.75)
    g.add_color_stop_rgba(1, *c2, 0.0)
    ctx.set_source(g)
    ctx.rectangle(x0, y0, w, h)
    ctx.fill()


def shot_green(ctx, t, S):
    k = smooth(clamp(t / 3.5))
    cam = Cam(Keys((0, 300), (5, 600)), 360, Keys((0, 0.6), (5, 0.7)))
    with layer(ctx, cam, t, 0.3):
        green_sky(ctx, -3000, -1500, 7000, 2160, 0.3 + 0.7 * k)
        for i in range(6):
            SEA.cloud(ctx, 400 + i * 450, 200 + (i % 2) * 60, 1.3, "green" if i > 2 else "day", 70 + i,
                      alpha=0.9)
        SEA.ocean(ctx, t, -3000, 4000, 660, 2000, "green", rough=0.3, seed=4)
    ship_ext(ctx, t, cam, 0, 760, 0.8, "day", 0.0, wake=0.0, smoke=False)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        p.update(face="shock", hturn=0.9)
        LEO_CAP.draw(ctx, 0.8 * 1010, 760 - 0.8 * 620, 28, 1, p)
    if t > 2.6:
        pop_text(ctx, "GREEN.", W / 2 + 400, 260, t, 2.6, 140, "#9fc86a", dur=3, shake=False)


def radar_screen(ctx, t, x, y, r=230):
    D.circle(ctx, x, y, r + 20, hexrgb("#3a3f4a"), D.INK, 6)
    D.circle(ctx, x, y, r, hexrgb("#0e2a14"), D.INK, 3)
    for k in (0.33, 0.66):
        D.circle(ctx, x, y, r * k, None, hexrgb("#2a6a3a"), 2)
    a = t * 2.0
    D.line(ctx, x, y, x + math.cos(a) * r, y + math.sin(a) * r, hexrgb("#4cff8a"), 4, 0.8)
    # спираль урагана ползёт к кораблику
    hx, hy = x + r * 0.5 - t * 18, y + r * 0.35 - t * 10
    for k in range(3):
        pts = []
        for i in range(40):
            u = i / 39
            aa = u * TAU * 1.3 + k * TAU / 3 - t * 2
            rr = 10 + 80 * u
            pts.append((hx + math.cos(aa) * rr, hy + math.sin(aa) * rr))
        D.polyline(ctx, pts, hexrgb("#e8423c"), 5, 0.9)
    D.circle(ctx, x - r * 0.3, y - r * 0.2, 9, hexrgb("#ffffff"), None, 0)


def shot_ivy(ctx, t, S):
    cam = Cam(560, 560, Keys((0, 1.3), (5, 1.45)))
    dolores_at_radio(ctx, t, cam, 1.0, "scared")
    radar_screen(ctx, t, 1350, 480)
    D.rrect(ctx, 1080, 760, 560, 150, 24, hexrgb("#e8423c"), D.INK, 6)
    D.text(ctx, "HURRICANE IVY", 1360, 825, 56, D.FONT_TITLE, hexrgb("#fff6d8"))
    D.text(ctx, "CATEGORY 4", 1360, 885, 46, D.FONT_TITLE, hexrgb("#ffe36a"))


def shot_tie(ctx, t, S):
    cam = Cam(1100, 560, 1.15, shake=0.08)
    bridge_back(ctx, t, cam, "green", 0.0, battery=28, autopilot=False)
    with layer(ctx, cam, t):
        for i, (x0, y0, x1, y1) in enumerate(((BR.CHAIR_X - 120, 560, BR.CHAIR_X + 120, 720),
                                             (BR.RADIO_X - 140, 480, BR.RADIO_X + 140, 600),
                                             (BR.CHART_X - 150, 680, BR.CHART_X + 150, 700))):
            k = clamp((t - i * 0.6) / 0.5)
            if k > 0:
                D.line(ctx, x0, y0, lerp(x0, x1, k), lerp(y0, y1, k), hexrgb("#e9b949"), 10)
                D.line(ctx, x0, y1, lerp(x0, x1, k), lerp(y1, y0, k), hexrgb("#e9b949"), 10)
        p = R.stand("side", t, 1)
        pull = math.sin(t * 9)
        p.update(face="determined", h1=(0.7, -2.0 + 0.3 * pull), h2=(0.6, -1.8 - 0.3 * pull), lean=0.25)
        LEO_CAP.draw(ctx, 1300 + 200 * math.sin(t * 1.2), BR.BF + 40, 120, 1, p)
    pop_text(ctx, "TIE EVERYTHING DOWN", W / 2, 230, t, 0.2, 80, "#ffe36a", dur=3, shake=False)


def shot_kids(ctx, t, S):
    cam = Cam(Keys((0, 900), (4, 1500)), 470, Keys((0, 1.1), (4, 1.6)))
    with layer(ctx, cam, t):
        bg(ctx, "kids_club", (-500, -300, 3400, 1700), IN.kids_club)
        p = R.stand("side", t, 1)
        reach = clamp((t - 2.0) / 0.5)
        p.update(face="worried" if t < 2.0 else "happy", h1=(0.7, -2.6 - 0.4 * reach), hturn=0.7, look=(0.5, -0.3))
        x = lerp(500, 1450, smooth(clamp(t / 2.2)))
        LEO_CAP.draw(ctx, x, IN.FL, 115, 1, p)
    for i, (tt, txt) in enumerate(((0.3, "M"), (0.9, "S"), (1.5, "XS"), (2.1, "XXXS"))):
        pop_text(ctx, txt, 400 + i * 380, 330, t, tt, 70 + i * 10, "#e8423c" if i == 3 else "#2f8fd8", dur=3,
                 shake=False)


def shot_vest(ctx, t, S):
    cam = Cam(1180, 600, 1.45)
    bridge_back(ctx, t, cam, "green", 0.0, battery=28, autopilot=False)
    with layer(ctx, cam, t):
        draw_cat(ctx, 1050, BR.BF + 40, 140, 1, cat_pose(t, "sit" if t < 1.6 else "hiss", vest=True, meow=0.0))
        p = R.stand("side", t, 1)
        sal = smooth(clamp((t - 1.8) / 0.3))
        p.update(face="smile", h1=(0.32, -3.55) if sal > 0.5 else (0.6, -2.0), hturn=0.6)
        LEO_CAP.draw(ctx, 1350, BR.BF + 40, 125, -1, p)
    if t > 0.3:
        x, y = cam.to_screen(t, 1120, 700)
        D.text(ctx, "#", x, y, 70, D.FONT_TITLE, hexrgb("#e8423c"), stroke=D.INK, slw=6, rot=0.2)
    if t > 1.8:
        pop_text(ctx, "VERY PROFESSIONAL.", W / 2, 230, t, 1.8, 90, "#ffe36a", dur=3, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_green),
        Shot(c(1) - 0.1, shot_ivy, "fade", 0.3),
        Shot(c(2) - 0.1, shot_tie, "whip", 0.3),
        Shot(c(3) - 0.1, shot_kids, "whip", 0.3),
        Shot(c(4) - 0.1, shot_vest),
    ]
    S.tods = [(0, "day"), (c(1), "night"), (c(2), "day")]
    S.sfx += [(c(1) + 0.5, "radar_ping", 0.7), (c(4) + 1.6, "hiss_cat", 0.9)]
    S.music = "storm_coming"
