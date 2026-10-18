"""День 21: Долорес была штурманом. В каюте капитана под стеклом латунный секстант. Всю ночь:
горизонт, Полярная звезда, углы, таблицы. С пятой попытки: 26° с. ш., 74° з. д. «Флотский уровень, капитан»."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import dolores_at_radio, leo_mic


def shot_navigator(ctx, t, S):
    """Долорес молодая на фото — штурман; переход к ней сейчас у рации."""
    cam = Cam(Keys((0, 210), (4, 300)), Keys((0, 130), (4, 400)), Keys((0, 2.6), (4, 1.3)))
    dolores_at_radio(ctx, t, cam, 1.0, "smile", cup=True)
    k = ease_out_back(clamp((t - 0.4) / 0.4))
    if k > 0:
        ctx.save()
        ctx.translate(1500, 300)
        ctx.scale(k, k)
        ctx.rotate(0.06)
        D.rect(ctx, -200, -170, 400, 330, hexrgb("#ffffff"), D.INK, 5, wob=0)
        D.rect(ctx, -180, -150, 360, 250, hexrgb("#d8c8a8"), None, 0, wob=0)
        young = R.Look(**{**R.DOLORES.__dict__, "hair": "bun", "hair_col": "#3a2a24", "hat": "cap",
                          "hat_col": "#1c3f7c", "details": ("blush",), "body": "#1c3f7c"})
        R.Fig(young).head_only(ctx, 0, -40, 130, 1, {"view": "front", "face": "smile", "neck_line": False})
        D.text(ctx, "NAVIGATOR · 1978", 0, 140, 34, D.FONT_HAND, D.INK)
        ctx.restore()


def shot_case(ctx, t, S):
    cam = Cam(IN.SEXTANT_X, Keys((0, 520), (3, 480)), Keys((0, 1.2), (3, 1.9)))
    with layer(ctx, cam, t):
        bg(ctx, "cabin_night", (-500, -300, 3400, 1700), lambda c: IN.cabin(c, "night", 0.0))
        IN.sextant(ctx, IN.SEXTANT_X, 480, 0.75, 0.0)
        D.rect(ctx, IN.SEXTANT_X - 190, 360, 380, 220, (1, 1, 1), None, 0, wob=0, alpha=0.15)
    fx.darkness(ctx, 0.6, [fx.Light(*cam.to_screen(t, IN.SEXTANT_X, 480), 700, power=0.95, glow="#ffd978",
                                    glow_a=0.25)])
    for i in range(6):
        a = t * 2 + i
        x, y = cam.to_screen(t, IN.SEXTANT_X - 120 + i * 50, 400 + math.sin(a) * 40)
        D.text(ctx, "✦", x, y, 30, D.FONT_TITLE, hexrgb("#fff2b0"), alpha=0.5 + 0.5 * math.sin(a * 2))


def shot_stars(ctx, t, S):
    """Ночь на крыле: Лео наводит секстант, линии между звёздами, углы и таблицы."""
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 1100), (d, 1200)), Keys((0, 80), (d, 0)), Keys((0, 1.0), (d, 0.85)))
    sea_back(ctx, t, cam, "deepnight", hy=1500, p=0.2)
    with layer(ctx, cam, t, 0.2):
        SEA.stars(ctx, -1500, -1500, 5000, 2600, t, 21, 1.6)
        nx, ny = 1650, -600
        D.text(ctx, "✦", nx, ny + 30, 90, D.FONT_TITLE, hexrgb("#fff6c8"))
        fx.glow(ctx, nx, ny, 120, "#fff6c8", 0.6)
        D.text(ctx, "NORTH STAR", nx, ny - 60, 40, D.FONT_TITLE, hexrgb("#ffe36a"))
        # Ковш
        dip = [(1100, -500), (1200, -420), (1320, -400), (1430, -450), (1460, -330), (1600, -320), (1590, -440)]
        n = int(clamp(t / 1.5) * len(dip))
        for i in range(max(0, n - 1)):
            D.line(ctx, *dip[i], *dip[i + 1], hexrgb("#9fc0ff"), 3, 0.8)
        for p_ in dip:
            D.circle(ctx, *p_, 6, hexrgb("#fff6dc"), None, 0)
    with layer(ctx, cam, t):
        bg(ctx, "wing_night_lit0", (-700, -600, 2900, 3000), lambda c: OD.wing(c, "night", 0.0))
        p = R.stand("side", t, 1)
        p.update(face="determined", h1=(0.5, -3.2), h2=(0.45, -2.8), neck=-0.3, look=(0.6, -0.8), hturn=0.9)
        J = LEO_CAP.draw(ctx, 1150, OD.WING_Y, 105, 1, p)
        hx, hy = LEO_CAP.world(1150, OD.WING_Y, 105, 1, J["hand1"])
        IN.sextant(ctx, hx + 20, hy - 10, 0.28, -0.6, "night")
    # угол и цифры
    ax, ay = cam.to_screen(t, 1250, OD.WING_Y - 330)
    a1 = -0.9
    D.line(ctx, ax, ay, ax + 700, ay, hexrgb("#ffe36a"), 3, 0.8)
    D.line(ctx, ax, ay, ax + 700 * math.cos(a1), ay + 700 * math.sin(a1), hexrgb("#ffe36a"), 3, 0.8)
    ctx.arc(ax, ay, 160, a1, 0)
    D.col(ctx, hexrgb("#ffe36a"), 0.8)
    ctx.set_line_width(4)
    ctx.stroke()
    D.text(ctx, "%.1f°" % (20 + 6 * clamp(t / d)), ax + 230, ay - 60, 50, D.FONT_TITLE, hexrgb("#ffe36a"),
           stroke=D.INK, slw=6)
    # «таблицы»
    if t > d * 0.5:
        D.rrect(ctx, 80, 640, 560, 330, 20, hexrgb("#fbf3dc"), D.INK, 5)
        for i in range(6):
            D.text(ctx, "%02d  %5.2f  %5.2f" % (i + 22, 0.37 * i + 1.2, 2.1 - 0.13 * i), 360, 700 + i * 46, 34,
                   D.FONT_HAND, D.INK)


def shot_fix(ctx, t, S):
    """Пятая попытка: зачёркнутые расчёты, затем — координаты."""
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1a2650"), (1, "#0e1430")])
    tries = ["31°N 70°W", "24°N 79°W", "29°N 77°W", "22°N 72°W"]
    for i, tr in enumerate(tries):
        k = clamp((t - i * 0.25) / 0.2)
        if k > 0:
            y = 260 + i * 110
            D.text(ctx, tr, 520, y, 64, D.FONT_HAND, hexrgb("#9fb0d0"), alpha=k)
            D.line(ctx, 330, y - 22, 710, y - 22, hexrgb("#e8423c"), 6, k)
    k = ease_out_back(clamp((t - 1.3) / 0.4))
    if k > 0:
        ctx.save()
        ctx.translate(1300, 520)
        ctx.scale(k, k)
        D.rrect(ctx, -420, -150, 840, 300, 40, hexrgb("#fff6d8"), D.INK, 8)
        D.text(ctx, "26° N", 0, -20, 120, D.FONT_TITLE, hexrgb("#1c3f7c"))
        D.text(ctx, "74° W", 0, 110, 120, D.FONT_TITLE, hexrgb("#1c3f7c"))
        ctx.restore()
        D.text(ctx, "TRY #5", 1300, 300, 60, D.FONT_TITLE, hexrgb("#4cff8a"), stroke=D.INK, slw=6)


def shot_navy_grade(ctx, t, S):
    camL = Cam(2240, 560, 1.4)
    camR = Cam(30, 650, 1.5)
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "laugh", 0.0),
               lambda c: dolores_at_radio(c, t, camR, 1.0, "laugh"), 1.0)
    pop_text(ctx, "NAVY GRADE, CAPTAIN.", W / 2, 240, t, 0.5, 90, "#ffe36a", dur=4, shake=False)
    if t > 0.3:
        for i in range(3):
            ph = (t * 1.2 + i / 3) % 1
            D.text(ctx, "~", 1500 + i * 30, 500 - ph * 80, 60, D.FONT_HAND, hexrgb("#fff6d8"), alpha=1 - ph)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_navigator),
        Shot(c(1) - 0.1, shot_case, "fade", 0.3),
        Shot(c(2) - 0.1, shot_stars, "fade", 0.3),
        Shot(c(3) - 0.1, shot_fix, "fade", 0.25),
        Shot(c(4) - 0.1, shot_navy_grade, "fade", 0.25),
    ]
    S.sfx += [(c(1) + 0.3, "shimmer", 0.6), (c(3) + 1.3, "ding", 0.9), (c(4), "whistle", 0.8)]
    S.music = "wonder"
