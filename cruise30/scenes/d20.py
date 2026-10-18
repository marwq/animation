"""День 20: Долорес говорит медленно. На 30-й день флот очищает морские пути: дрейфующие заражённые
корабли топят. Если только на борту нет живого — и известно, где корабль. GPS умер. Десять дней дрейфа.
Никто не знает, где ты."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import dolores_at_radio, leo_mic, caribbean_map

MOON = (2000, 150, 40)


def warship(ctx, x, wl, s, f=1, tod="night", flash=0.0):
    from sets.deck import tone
    T = lambda c: tone(c, tod)
    ctx.save()
    ctx.translate(x, wl)
    ctx.scale(f * s, s)
    D.poly(ctx, [(-420, -60), (380, -60), (470, -95), (430, 0), (-400, 0)], T("#7d8894"), D.INK, 4, wob=0)
    D.poly(ctx, [(-200, -60), (120, -60), (90, -150), (-160, -150)], T("#8e99a5"), D.INK, 4, wob=0)
    D.poly(ctx, [(-120, -150), (60, -150), (40, -220), (-100, -220)], T("#8e99a5"), D.INK, 4, wob=0)
    D.line(ctx, -30, -220, -30, -320, D.INK, 6)
    D.line(ctx, -70, -290, 10, -290, D.INK, 4)
    D.rect(ctx, 220, -95, 70, 35, T("#6d7884"), D.INK, 3, wob=0)
    D.line(ctx, 290, -80, 380, -100, D.INK, 8)
    D.text(ctx, "99", -330, -18, 40, D.FONT_TITLE, T("#f4f4f0"))
    if flash > 0:
        fx.glow(ctx, 390, -100, 120, "#ffd978", 0.8 * flash)
        D.circle(ctx, 395, -100, 26 * flash, hexrgb("#fff2b0"), None, 0)
    ctx.restore()


def shot_slowly(ctx, t, S):
    camL = Cam(2240, 560, 1.4)
    camR = Cam(30, 620, Keys((0, 1.5), (4, 1.85)))
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "worried", 0.0),
               lambda c: dolores_at_radio(c, t, camR, 0.6, "worried"), 1.0)


def shot_navy(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cam = Cam(Keys((0, 200), (d, 380)), 420, Keys((0, 0.8), (d, 0.9)))
    sea_back(ctx, t, cam, "night", moon=(600, -150, 45), hy=600, p=0.3)
    with layer(ctx, cam, t):
        tf = d * 0.45
        warship(ctx, -250, 640, 1.2, 1, flash=clamp(1 - abs(t - tf) / 0.25))
        sink = smooth(clamp((t - tf - 0.4) / (d * 0.5)))
        ctx.save()
        ctx.translate(900, 640 + sink * 260)
        ctx.rotate(0.25 * sink)
        bg(ctx, "ship_night_small", (-760, -500, 1520, 560), lambda c: SH.ship_side(c, 0, 0, 0.5, "night", 0.0))
        ctx.restore()
        D.rect(ctx, -2000, 642, 5000, 600, hexrgb(SEA.SEA["night"][1]), None, 0, wob=0, alpha=0.75)
        if t > tf:
            SEA.splash(ctx, 900, 640, (t - tf - 0.2) / 1.0, 2.0, seed=3, c="#cfe0ff")
    D.rrect(ctx, W / 2 - 180, 120, 360, 120, 20, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "DAY 30", W / 2, 205, 80, D.FONT_TITLE, hexrgb("#ff4a3a"))
    if t > d * 0.6:
        pop_text(ctx, "NO EXCEPTIONS.", W / 2, 360, t, d * 0.6, 100, "#e8423c", dur=d, shake=False)


def shot_unless(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c3f7c"), (1, "#0f2a5a")])
    D.text(ctx, "UNLESS:", W / 2, 260, 120, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=12)
    rows = [("SOMEONE ABOARD IS ALIVE", True, 0.5), ("THEY KNOW EXACTLY WHERE IT IS", False, 1.6)]
    for i, (txt, ok, t0) in enumerate(rows):
        k = ease_out_back(clamp((t - t0) / 0.3))
        if k <= 0:
            continue
        y = 470 + i * 200
        ctx.save()
        ctx.translate(W / 2, y)
        ctx.scale(k, k)
        D.rrect(ctx, -700, -70, 1400, 140, 30, hexrgb("#fff6d8"), D.INK, 6)
        D.text(ctx, txt, -600, 24, 58, D.FONT_TITLE, D.INK, "left")
        D.circle(ctx, 610, 0, 46, hexrgb("#3fbf6a") if ok else hexrgb("#e8423c"), D.INK, 5)
        if ok:
            D.polyline(ctx, [(585, 2), (605, 22), (640, -22)], hexrgb("#fff6d8"), 12)
        else:
            D.text(ctx, "?", 610, 26, 70, D.FONT_TITLE, hexrgb("#fff6d8"))
        ctx.restore()


def shot_gps(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    if t < d * 0.45:
        cam = Cam(1100, 520, 2.4)
        bridge_back(ctx, t, cam, "night", 0.0, moon=MOON, battery=37, autopilot=False)
        with layer(ctx, cam, t):
            D.rrect(ctx, 980, 520, 220, 34, 6, hexrgb("#0a0c12"), D.INK, 3)
            D.text(ctx, "GPS: NO SIGNAL", 1090, 546, 20, D.FONT_TITLE, hexrgb("#ff4a3a"), alpha=0.5 + 0.5 * math.sin(t * 8))
            k = abs(math.sin(t * 9))
            D.circle(ctx, 1090 + 40 * k, 500 - 20 * k, 18, D.INK, None, 0)
            D.line(ctx, 1090 + 40 * k, 500 - 20 * k, 1200, 380, D.INK, 30)
        pop_text(ctx, "tap tap", 1350, 280, t, 0.3, 70, "#fff6d8", dur=1.5)
    else:
        tt = t - d * 0.45
        caribbean_map(ctx, t, stamps=0.0, ship=(1500 + 60 * math.sin(tt), 260))
        pts = []
        for i in range(40):
            u = i / 39
            pts.append((1250 + u * 300 + math.sin(u * 9) * 60, 520 - u * 260 + math.cos(u * 7) * 40))
        n = int(clamp(tt / 1.4) * 40)
        for i in range(max(0, n - 1)):
            if i % 2 == 0:
                D.line(ctx, *pts[i], *pts[i + 1], hexrgb("#ffffff"), 5)
        D.text(ctx, "10 DAYS ADRIFT", 1500, 640, 50, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=6)


def shot_nobody(ctx, t, S):
    z = Keys((0, 0.9), (5, 0.18))(t)
    cam = Cam(0, 0, z)
    with layer(ctx, cam, t):
        D.vgrad(ctx, -9000, -6000, 18000, 12000, [(0, "#0e2a5a"), (1, "#081a3a")])
        r = rng(9)
        for i in range(300):
            x, y = r.uniform(-8000, 8000), r.uniform(-5000, 5000)
            D.curve(ctx, [(x - 40, y), (x, y - 10), (x + 40, y)], hexrgb("#4a6aa0"), 6, 0.5)
        SH.ship_top(ctx, 0, 0, 0.35, t, tod="night")
    D.text(ctx, "?", W / 2 + 260, H / 2 - 100, 200, D.FONT_TITLE, hexrgb("#ffe36a"), stroke=D.INK, slw=14,
           alpha=clamp((t - 0.8) / 0.4))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_slowly),
        Shot(c(1) - 0.1, shot_navy, "fade", 0.3),
        Shot(c(2) - 0.1, shot_unless, "fade", 0.25),
        Shot(c(3) - 0.1, shot_gps, "fade", 0.25),
        Shot(c(4) - 0.1, shot_nobody, "fade", 0.3),
    ]
    S.sfx += [(c(1) + (c(2) - c(1)) * 0.45, "cannon", 1.0), (c(3) + 0.3, "tap", 0.7)]
    S.music = "dread"
