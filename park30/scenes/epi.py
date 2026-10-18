"""Эпилог: шар садится в озеро в десяти футах от маяка, Гас ждёт с пледом. Через неделю Лили получает единорога выше
себя. И семью енотов на заднем дворе."""
from scenes.kit import *
from scenes.shared import *

LH_X = 2200
WATER_Y = 760


def shot_landing(ctx, t, S):
    """Рассвет у маяка: шар опускается на воду — плюх; Гас на причале с пледом; Тео в пледе, еноты на голове."""
    d = S.cue(1) - 0.1
    T_SPLASH = d * 0.4
    T_WRAP = d * 0.62
    cam = Cam(Keys((0, 1300), (d, 1500)), 360, Keys((0, 0.5), (d, 0.56)))
    sky_back(ctx, t, cam, "morning", -3000, 6000, sun=(600, 380, 150))
    with layer(ctx, cam, t):
        LK.water(ctx, t, -3000, 6000, WATER_Y, WATER_Y + 1600, "morning")
        LK.lighthouse(ctx, LH_X, WATER_Y + 20, 1.0, "morning", beam=0.0, t=t)
        LK.dock(ctx, LH_X - 1400, LH_X - 300, WATER_Y + 30, "morning")
        k = smooth(clamp(t / T_SPLASH))
        bx = lerp(-200, LH_X - 1800, k)
        by = lerp(WATER_Y - 900, WATER_Y + 90, k)
        if t < T_WRAP:
            e = BL.envelope(ctx, bx, by - 0.6 * (300 + 420), 0.6, 1.0 - 0.2 * clamp((t - T_SPLASH) / 1.0), "morning",
                            t=t, glow=0.2 * (1 - k))
            BL.basket(ctx, bx, by, 0.6, "morning", 0.3 * (1 - k), t,
                      cables_to=(e["left"][0], e["left"][1], e["right"][0], e["right"][1]))
            if t > T_SPLASH:
                RD.splash(ctx, bx, WATER_Y + 40, clamp((t - T_SPLASH) / 0.8), 1.2, seed=9)
        else:
            BL.laid_out(ctx, LH_X - 2700, WATER_Y + 60, 0.6, "morning", None, t, lift=0.0)
            BL.basket(ctx, LH_X - 1800, WATER_Y + 110, 0.6, "morning", 0.0, t)
        # Гас на причале, с пледом
        p = R.stand("side", t, 3)
        p.update(face="laugh" if t > T_SPLASH else "smile", h1=(0.9, -2.6), h2=(0.8, -2.5))
        J = GUS.draw(ctx, LH_X - 520, WATER_Y + 30, 112, -1, p)
        hx, hy = GUS.world(LH_X - 520, WATER_Y + 30, 112, -1, J["hand1"])
        if t < T_WRAP:
            D.poly(ctx, [(hx, hy - 10), (hx - 160, hy), (hx - 140, hy + 180), (hx + 10, hy + 160)],
                   hexrgb("#e8423c"), D.INK, 4, wob=0)
            for j in range(4):
                D.line(ctx, hx - 150 + j * 40, hy + 4, hx - 130 + j * 40, hy + 170, hexrgb("#ffd23a"), 4)
        else:
            # Тео стоит на причале, укутан в плед; на голове Бандит, рядом малыши, единорог мокрый
            x = LH_X - 820
            D.poly(ctx, [(x - 70, WATER_Y + 30), (x + 70, WATER_Y + 30), (x + 60, WATER_Y - 300), (x - 60, WATER_Y - 300)],
                   hexrgb("#e8423c"), D.INK, 4, wob=0)
            for j in range(3):
                D.line(ctx, x - 50 + j * 50, WATER_Y - 290, x - 50 + j * 50, WATER_Y + 20, hexrgb("#ffd23a"), 4)
            THEO.head_only(ctx, x, WATER_Y - 360, 112, 1, {"view": "front", "face": "laugh", "neck_line": False})
            draw_raccoon(ctx, x, WATER_Y - 430, 80, 1, raccoon_pose(t, "sit", look=0.3))
            for b in range(3):
                draw_raccoon(ctx, x - 220 + b * 60, WATER_Y + 20, 55, 1, raccoon_pose(t + b, "sit", baby=True))
            IN.unicorn(ctx, x - 460, WATER_Y + 30, 0.5, "morning", 1, t)
            for j in range(5):
                ph = (t * 1.5 + j / 5) % 1
                D.ellipse(ctx, x - 460 + j * 40 - 100, WATER_Y - 200 + ph * 200, 5, 9, hexrgb("#8ad8ff"), D.INK, 1,
                          alpha=1 - ph)
    place_tag(ctx, "THE LIGHTHOUSE", t, 70, 210, "#fff6d8", "#1c3f7c")
    if t > T_SPLASH:
        pop_text(ctx, "SPLASH!", W / 2 - 300, 300, t, T_SPLASH, 100, "#9fe0ff", dur=1.0)


def backyard(ctx, tod="day"):
    T = lambda c: tone(c, tod)
    D.rect(ctx, -2000, -1400, 6000, 1400 + 760, T("#8fd0f0"), None, 0, wob=0)
    D.rect(ctx, -400, -300, 1800, 1060, T("#f2e0c0"), D.INK, 6, wob=0)            # дом
    D.poly(ctx, [(-500, -300), (500, -800), (1500, -300)], T("#c8503a"), D.INK, 6, wob=0)
    for wx in (0, 700):
        D.rect(ctx, wx, -100, 300, 260, T("#bfe6f5"), D.INK, 5, wob=0)
        D.line(ctx, wx + 150, -100, wx + 150, 160, D.INK, 5)
    D.rect(ctx, 1080, 260, 260, 500, T("#8a5a34"), D.INK, 5, wob=0)
    for k in range(40):              # деревянный забор
        fx_ = -2000 + k * 150
        if -400 < fx_ < 1400:
            continue
        D.poly(ctx, [(fx_, 760), (fx_, 380), (fx_ + 60, 340), (fx_ + 120, 380), (fx_ + 120, 760)], T("#e8c890"), D.INK, 3,
               wob=0)
    D.rect(ctx, -2000, 760, 6000, 1400, T("#7cc860"), None, 0, wob=0)
    # дерево с домиком для енотов
    D.rect(ctx, 2300, 0, 120, 760, T("#8a5a34"), D.INK, 5, wob=0)
    for (cx, cy, r) in ((2360, -120, 320), (2120, 40, 240), (2600, 40, 240)):
        D.circle(ctx, cx, cy, r, T("#4aa84a"), D.INK, 5)
    D.rect(ctx, 2240, 280, 240, 200, T("#c8603a"), D.INK, 4, wob=0)
    D.poly(ctx, [(2220, 280), (2360, 190), (2500, 280)], T("#8a3a2a"), D.INK, 4, wob=0)
    D.circle(ctx, 2360, 390, 50, T("#2b2420"), D.INK, 3)


def shot_backyard(ctx, t, S):
    """Через неделю: задний двор; Лили обнимает единорога выше себя; Тео рядом; из домика на дереве — еноты."""
    d = S.dur - S.cue(1)
    cam = Cam(Keys((0, 900), (d, 1300)), 380, Keys((0, 0.62), (d, 0.66)))
    sky_back(ctx, t, cam, "day", -3000, 6000, sun=(-600, -600, 130))
    with layer(ctx, cam, t):
        backyard(ctx)
        IN.unicorn(ctx, 900, 900, 0.7, "day", 1, t)
        p = R.stand("side", t, 3)
        p.update(face="laugh", h1=(0.9, -2.6), h2=(0.8, -2.4), lean=0.15)
        LILY.draw(ctx, 1020, 920, 112, -1, p)
        q = R.stand("side", t, 1)
        q.update(face="laugh", h1=(0.62, -2.05), h2=(-0.2, -2.05))
        THEO.draw(ctx, 1500, 930, 112, -1, q)
        draw_raccoon(ctx, 1800, 905, 120, -1, raccoon_pose(t, "sit", look=-0.4))
        for b in range(3):
            draw_raccoon(ctx, 1950 + b * 150, 900, 95, -1 if b % 2 else 1,
                         raccoon_pose(t + b, "sit", baby=True, look=0.3 * math.sin(t * 2 + b)))
        for k in range(3):
            ph = (t * 0.6 + k / 3) % 1
            heart(ctx, 1010 + k * 50, 420 - ph * 160, 24, 1 - ph)
    place_tag(ctx, "ONE WEEK LATER", t, 70, 210, "#fff6d8", "#f05a8a")


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_landing, "fade", 0.5),
        Shot(c(1) - 0.1, shot_backyard, "fade", 0.5),
    ]
    S.tods = [(0, "morning"), (c(1), "day")]
    S.sfx += [(c(1) * 0.4 + 0.2, "splash", 1.0), (0.2, "birds", 0.6), (c(1) + 0.3, "kids_laugh", 0.6)]
    S.music = "happy_end"
    S.show_day = False
