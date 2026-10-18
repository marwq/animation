"""День 14: полночь, огни контейнеровоза в трёх милях. SOS фонариком снова и снова. Рация Макса —
две мили, только шум. Огни уходят. Долорес долго молчит: «Никто не останавливается у заражённых.
Пока»."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import dolores_at_radio, leo_mic

SOS = "...---..."


def sos_on(t, speed=1.0):
    """Мигание фонаря по азбуке Морзе: (горит ли, индекс символа)."""
    unit = 0.13 / speed
    seq = []
    for ch in SOS:
        seq.append((True, 1 if ch == "." else 3))
        seq.append((False, 1))
    seq[-1] = (False, 4)
    total = sum(n for _, n in seq) * unit
    tt = t % total
    acc = 0.0
    for i, (on, n) in enumerate(seq):
        acc += n * unit
        if tt < acc:
            return on, i // 2
    return False, 0


def horizon(ctx, t, cam, ship_x=1800, lit=1.0, s=0.5):
    sea_back(ctx, t, cam, "night", moon=(400, -100, 40), hy=640, p=0.3)
    with layer(ctx, cam, t, 0.3):
        SEA.cargo_ship(ctx, ship_x, 642, s, lit)


def shot_lights(ctx, t, S):
    cam = Cam(Keys((0, 1150), (5, 1200)), Keys((0, 250), (5, 230)), Keys((0, 1.0), (5, 1.15)))
    sea_back(ctx, t, cam, "night", moon=(-200, -400, 40), hy=1500, p=0.2)
    with layer(ctx, cam, t, 0.2):
        SEA.cargo_ship(ctx, 2200, 1502, 0.3, 1.0)
    with layer(ctx, cam, t):
        bg(ctx, "wing_night_lit0", (-700, -600, 2900, 3000), lambda c: OD.wing(c, "night", 0.0))
        p = R.stand("side", t, 1)
        p.update(face="shock", h1=(0.45, -3.2), h2=(0.42, -3.15), hturn=0.9)
        LEO_CAP.draw(ctx, 1200, OD.WING_Y, 105, 1, p)
        bx, by = 1200 + 105 * 0.48, OD.WING_Y - 105 * 3.25
        D.rrect(ctx, bx - 10, by - 18, 46, 36, 10, hexrgb("#2b2f3a"), D.INK, 3)
    if t > 1.2:
        # бинокль: круглые «окуляры» с кораблём
        k = ease_out(clamp((t - 1.2) / 0.4))
        ctx.save()
        D.col(ctx, (0, 0, 0), 0.85 * k)
        ctx.paint()
        for dx in (-210, 210):
            ctx.new_sub_path()
            ctx.arc(W / 2 + dx, H / 2, 330 * k, 0, TAU)
        ctx.clip()
        bcam = Cam(1800, 600, 2.6)
        horizon(ctx, t, bcam, 1800, 1.0, 0.6)
        ctx.restore()
        D.text(ctx, "3 MI", W / 2, 150, 90, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=10, alpha=k)


def shot_sos(ctx, t, S):
    on, idx = sos_on(t)
    cam = Cam(Keys((0, 1350), (5, 1400)), 300, 1.15)
    sea_back(ctx, t, cam, "night", moon=(-200, -400, 40), hy=1500, p=0.2)
    with layer(ctx, cam, t, 0.2):
        SEA.cargo_ship(ctx, 2300, 1502, 0.3, 1.0)
    with layer(ctx, cam, t):
        bg(ctx, "wing_night_lit0", (-700, -600, 2900, 3000), lambda c: OD.wing(c, "night", 0.0))
        p = R.stand("side", t, 1)
        p.update(face="determined", h1=(0.9, -2.75), hturn=0.9)
        J = LEO_CAP.draw(ctx, 1300, OD.WING_Y, 105, 1, p)
        hold_flashlight(J, ctx, "hand1", -0.15, on)
    hx, hy = cam.to_screen(t, 1300 + 0.9 * 105 + 30, OD.WING_Y - 2.8 * 105)
    fx.darkness(ctx, 0.35, [fx.Light(hx, hy, 900, kind="cone", ang=-0.15, spread=0.2, power=0.8 if on else 0.0,
                                     glow_a=0.2 if on else 0)])
    if on:
        flashlight_beam(ctx, hx, hy, -0.15, 1400, 0.16, 0.35)
    # азбука Морзе внизу
    marks = ["•", "•", "•", "—", "—", "—", "•", "•", "•"]
    for i, m in enumerate(marks):
        D.text(ctx, m, 520 + i * 110, 200, 90, D.FONT_TITLE, hexrgb("#ffe36a") if i == idx and on else
               hexrgb("#5a6678"), stroke=D.INK, slw=6)


def shot_walkie(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0e1430"), (1, "#1a2650")])
    IN.walkie(ctx, 620, 600, 3.0, -0.08, on=1.0, t=t)
    for k in range(5):
        y = 420 + k * 60
        pts = [(1000 + i * 20, y + noise1(i * 0.8 + t * 25, k) * 22) for i in range(38)]
        D.polyline(ctx, pts, hexrgb("#9fb0d0"), 4, 0.8 - k * 0.12)
    pop_text(ctx, "hello? HELLO?", 1350, 260, t, 0.3, 80, "#fff6d8", dur=2.0, shake=False)
    pop_text(ctx, "KSSSHHH", 1360, 860, t, 1.6, 100, "#9fb0d0", dur=2.5)
    # мини-схема: радиус 2 мили не достаёт до корабля в трёх
    ctx.save()
    ctx.translate(1580, 640)
    D.circle(ctx, 0, 0, 120, None, hexrgb("#4cff8a"), 4, 0.8)
    D.circle(ctx, 0, 0, 8, hexrgb("#ffffff"), None, 0)
    D.circle(ctx, 190, -40, 8, hexrgb("#ffd978"), None, 0)
    D.text(ctx, "2 MI", 0, 160, 34, D.FONT_TITLE, hexrgb("#4cff8a"))
    D.text(ctx, "3 MI", 200, -70, 34, D.FONT_TITLE, hexrgb("#ffd978"))
    ctx.restore()


def shot_gone(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    sx = Keys((0, 1500), (d, 2300, "lin"))(t)
    lit = clamp(1 - (t - d * 0.6) / (d * 0.4))
    cam = Cam(1100, 560, 1.0)
    horizon(ctx, t, cam, sx, lit, 0.5 * (1 - 0.4 * t / d))
    with layer(ctx, cam, t):
        OD.railing(ctx, -200, 2400, 1020, "night", h=130, glass=False)
        p = R.stand("back", t, 1)
        p.update(a1=(0.1, 0.2), a2=(0.1, 0.2))
        LEO_CAP.draw(ctx, 650, 1250, 150, 1, p)
    fx.darkness(ctx, 0.25, [fx.Light(*cam.to_screen(t, sx, 640), 500, power=0.5 * lit, glow="#ffd978", glow_a=0.2)])


def shot_quiet(ctx, t, S):
    camL = Cam(2240, 560, 1.4)
    camR = Cam(30, 650, 1.5)
    talk = 1.0 if t > 2.0 else 0.0
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "sad", 0.0),
               lambda c: dolores_at_radio(c, t, camR, talk, "sad"), 1.0)
    if t < 2.0:
        pop_text(ctx, "...", 1450, 300, t, 0.2, 140, "#fff6d8", dur=1.8, shake=False)
    t_ny = max(2.5, S.cue(4, True) - S.cue(4) - 0.5)
    if t > t_ny:
        pop_text(ctx, "NOT YET.", W / 2, 240, t, t_ny, 110, "#ffe36a", dur=3.0, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_lights),
        Shot(c(1) - 0.1, shot_sos),
        Shot(c(2) - 0.1, shot_walkie),
        Shot(c(3) - 0.1, shot_gone, "fade", 0.3),
        Shot(c(4) - 0.2, shot_quiet, "fade", 0.3),
    ]
    S.sfx += [(c(1), "morse", 0.6), (c(2) + 0.2, "static", 0.8), (c(3), "ship_horn_far", 0.5)]
    S.music = "lonely"
