"""День 16: впервые на вышке. Весь аэропорт — три полосы, шестьсот акров. Тысячи зомби бродят по
рулёжкам, как потерянный багаж. А вдали, за забором, кольцо огней. Армия. Ждёт тридцатого дня."""
from scenes.kit import *
from scenes.shared import *


def shot_climb(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(AP.TOWER_X, Keys((0, 600), (d, 80)), Keys((0, 0.9), (d, 1.0)))
    apron_back(ctx, t, cam, "dusk", 0.0, sun=(4200, 400, 80), x0=1800, x1=4800)
    with layer(ctx, cam, t):
        prog = t * 2.4
        tx = AP.TOWER_X + 30
        draw_climber(ctx, DANNY_JACKET, tx, 720, 40, prog, 1, "back", "determined")
    pop_text(ctx, "ATC TOWER", W / 2 + 360, 230, t, 0.3, 90, "#ffe36a", dur=d, shake=False)
    D.rrect(ctx, 100, 110, 360, 120, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "%d FT" % int(min(200, t * 40)), 280, 196, 80, D.FONT_TITLE, hexrgb("#4cff8a"))


def tower_view(c, t, army=0.0):
    """Вид из окон вышки: небо и карта аэропорта в перспективе."""
    SEA.sky(c, -1400, -900, 5000, 1300, "dusk")
    c.save()
    c.translate(1000, 110)
    c.scale(0.55, 0.55 * 0.4)
    bg(c, "map_dusk_nol", (-4200, -2600, 8800, 5200), lambda cc: AP.airport_map(cc, "dusk", labels=False), 0.3)
    r = rng(16)
    for i in range(220):
        x, y = r.uniform(-3000, 3600), r.uniform(-200, 1500)
        D.circle(c, x + math.sin(t + i) * 30, y, 26, hexrgb(r.choice(R.ZOMBIE_SKIN)), D.INK, 4)
    c.restore()


def shot_view(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cam = Cam(Keys((0, 900), (d, 1100)), 120, 0.8)
    with layer(ctx, cam, t):
        RM.tower_cab(ctx, "dusk", 0.0, view=lambda c: tower_view(c, t))
        p = R.stand("side", t, 1)
        p.update(face="shock", h1=(0.5, -2.2), hturn=0.9, blink=0)
        DANNY_JACKET.draw(ctx, 300, 520, 115, 1, p)
    for i, txt in enumerate(("3 RUNWAYS", "600 ACRES")):
        pop_text(ctx, txt, 520 + i * 800, 230, t, 0.5 + i * 0.8, 80, "#ffe36a", dur=d, shake=False)


def shot_lost(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 1800), (d, 2200)), 600, Keys((0, 0.45), (d, 0.5)))
    apron_back(ctx, t, cam, "dusk", 0.0, sun=(4200, 450, 80), x0=-600, x1=5000)
    with layer(ctx, cam, t):
        r = rng(160)
        for i in range(40):
            y = AP.HZ + 200 + r.uniform(0, 500)
            x = r.uniform(-400, 4600) + math.sin(t * 0.5 + i) * 60
            s = floor_s(y, AP.GY, 70, 600)
            if s < 30:
                continue
            dragger(ctx, x, y, s, 1 if i % 2 else -1, t, 1600 + i)
    pop_text(ctx, "LOST LUGGAGE", W / 2, 230, t, 0.6, 90, "#9fc86a", dur=d, shake=False)


def shot_army(ctx, t, S):
    d = S.dur - S.cue(3)
    k = smooth(clamp(t / 1.5))
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0a1238"), (1, "#2c4a8c")])
    map_view(ctx, t, W / 2, H / 2 + 80, 0.14, "night", army=k, labels=False)
    if t > d * 0.5:
        k2 = ease_out_back(clamp((t - d * 0.5) / 0.35))
        ctx.save()
        ctx.translate(W / 2, 200)
        ctx.scale(k2, k2)
        D.rrect(ctx, -420, -80, 840, 160, 30, hexrgb("#3a4a2a"), D.INK, 6)
        D.text(ctx, "THE ARMY · DAY 30", 0, 26, 70, D.FONT_TITLE, hexrgb("#f2e6c8"))
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_climb, "fade", 0.3),
        Shot(c(1) - 0.1, shot_view, "fade", 0.3),
        Shot(c(2) - 0.1, shot_lost, "fade", 0.3),
        Shot(c(3) - 0.1, shot_army, "fade", 0.4),
    ]
    S.tods = [(0, "dusk"), (c(3), "night")]
    S.sfx += [(c(1), "wind", 0.8), (c(3) + 0.3, "drone", 0.9)]
    S.music = [(0, "wonder", 0.8), (c(3), "dread", 0.9)]
