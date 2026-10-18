"""День 26: шторм унёс корабль на 200 миль к северу — новые координаты по секстанту. На закате у
скалодрома — гора тел, растущая с каждой минутой. Верхний касается последней зацепки.
Они не умеют лазить. Но учатся."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import caribbean_map
from scenes.d05 import sports_bg, WALL_MID
from scenes.d14 import horizon

TOD = "sunset"


def pile(ctx, t, top_y, x=WALL_MID - 40, s=95, seed=0):
    """Гора зомби у стены: ряды сужаются кверху, верхний тянется к зацепкам."""
    base = OD.OF + 30
    rows = max(1, int((base - top_y) / (s * 1.6)))
    lvl = (base - top_y) / rows
    for r in range(rows):
        n = max(1, rows - r + 1)
        gy = base - r * lvl
        for i in range(n):
            xx = x + (i - (n - 1) / 2) * s * 0.9 + math.sin(t * 2 + r + i) * 6
            p = zombie_reach(t, r * 7 + i)
            p.update(a1=(2.6 + 0.2 * math.sin(t * 4 + i), 0.2), a2=(2.4, 0.3), neck=-0.3, lean=-0.05)
            if r < rows - 1:
                p.update(h1=(0.3, -2.9), h2=(-0.2, -2.85))
            R.Fig(R.zombie_look(3000 + seed + r * 10 + i)).draw(ctx, xx, gy, s, 1 if (i + r) % 2 else -1, p)


def shot_fix(ctx, t, S):
    d = S.cue(1) - 0.1
    k = smooth(clamp(t / 2.0))
    caribbean_map(ctx, t, stamps=0.0, ship=(1500, lerp(260, 60, k)))
    D.line(ctx, 1500, 260, 1500, lerp(260, 80, k), hexrgb("#ffffff"), 6)
    D.text(ctx, "+200 MI", 1650, 170, 50, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=6, alpha=k)
    if t > d * 0.5:
        kk = ease_out_back(clamp((t - d * 0.5) / 0.4))
        ctx.save()
        ctx.translate(W / 2 - 200, 600)
        ctx.scale(kk, kk)
        D.rrect(ctx, -380, -130, 760, 260, 30, hexrgb("#fff6d8"), D.INK, 8)
        D.text(ctx, "NEW FIX", 0, -50, 60, D.FONT_TITLE, hexrgb("#4cff8a"), stroke=D.INK, slw=6)
        D.text(ctx, "29° N  76° W", 0, 60, 90, D.FONT_TITLE, hexrgb("#1c3f7c"))
        ctx.restore()
        IN.sextant(ctx, 1500, 700, 0.6, -0.3, "day")


def shot_watch(ctx, t, S):
    cam = Cam(Keys((0, 1150), (4, 1200)), Keys((0, 260), (4, 240)), Keys((0, 1.2), (4, 1.4)))
    sea_back(ctx, t, cam, TOD, sun=(-300, 700, 90), hy=1500, p=0.2)
    with layer(ctx, cam, t):
        bg(ctx, "wing_sunset", (-700, -600, 2900, 3000), lambda c: OD.wing(c, "sunset", 0.0))
        p = R.stand("side", t, 1)
        drop = t > 2.0
        p.update(face="shock" if drop else "neutral", h1=(0.45, -3.2), h2=(0.42, -3.15), hturn=-0.9, blink=0 if drop else 0)
        LEO_CAP.draw(ctx, 1200, OD.WING_Y, 105, -1, p)
    if t > 2.0:
        pop_text(ctx, "!", 700, 300, t, 2.0, 200, "#e8423c", dur=2)


def shot_pile(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    top = Keys((0, OD.OF - 200), (d + 1.0, OD.WALL_TOP + 140))(t)
    cam = Cam(WALL_MID - 100, Keys((0, 600), (d, 300)), Keys((0, 0.85), (d, 0.75)))
    sports_bg(ctx, t, cam, TOD)
    with layer(ctx, cam, t):
        pile(ctx, t, top)
    fx.grade(ctx, "dusk", 0.25)
    D.rrect(ctx, W - 470, 120, 380, 130, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "18:%02d" % min(59, int(5 + t * 6)), W - 280, 210, 90, D.FONT_TITLE, hexrgb("#ff4a3a"))


def shot_touch(ctx, t, S):
    hx, hy, _ = OD._holds()[-1]
    cam = Cam(hx - 40, hy + 120, 2.4, shake=lambda tt: shake_k(tt, 0.8, 0.4, 0.6))
    sports_bg(ctx, t, cam, TOD, scale=1.0)
    with layer(ctx, cam, t):
        reach = smooth(clamp(t / 0.8))
        p = zombie_reach(t, 5)
        p.update(h1=(0.35, -3.2 - 0.4 * reach), a2=(2.4, 0.3), neck=-0.4, mouth=0.9)
        R.Fig(R.zombie_look(3333, "hawaiian")).draw(ctx, hx - 80, hy + 3.7 * 95 - 0, 95, 1, p)
    if t > 0.8:
        impact(ctx, W / 2 + 60, H / 2 - 120, clamp((t - 0.8) / 0.3), 90, "#ffe36a")
    fx.grade(ctx, "dusk", 0.25)


def shot_learning(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3b2f86"), (1, "#e8588a")])
    z = 1 + 0.15 * t
    ctx.save()
    ctx.translate(W / 2, H / 2 + 80)
    ctx.scale(z, z)
    LEO_CAP.head_only(ctx, 0, 0, 420, 1, {"view": "front", "face": "scared", "blink": 0, "neck_line": False})
    ctx.restore()
    sweat(ctx, W / 2 - 150, H / 2 - 100, t, 2.0)
    if t > 1.0:
        pop_text(ctx, "THEY'RE LEARNING.", W / 2, 200, t, 1.0, 110, "#e8423c", dur=4, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_fix),
        Shot(c(1) - 0.1, shot_watch, "fade", 0.3),
        Shot(c(2) - 0.1, shot_pile, "whip", 0.3),
        Shot(c(3) - 0.1, shot_touch),
        Shot(c(4) - 0.1, shot_learning, "black", 0.3),
    ]
    S.tods = [(0, "day"), (c(1), "dusk")]
    S.sfx += [(c(1) + 2.0, "sting", 1.0), (c(3) + 0.8, "thud", 0.9), (c(4), "drone", 0.9)]
    S.music = "dread"
