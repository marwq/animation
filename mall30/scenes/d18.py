"""День 18: краны пересохли. Фонтан в атриуме — 15 тысяч литров и монетки. Желание."""
from scenes.kit import *
from scenes.shared import atrium_bg
from scenes.d17 import roof_bg


def shot_tap(ctx, t, S):
    """Кран кашляет и замолкает."""
    D.col(ctx, hexrgb("#d6dde0"))
    ctx.paint()
    D.col(ctx, hexrgb("#c6ced2"))
    ctx.set_line_width(3)
    for x in range(0, W, 120):
        ctx.move_to(x, 0)
        ctx.line_to(x, H)
    for y in range(0, H, 120):
        ctx.move_to(0, y)
        ctx.line_to(W, y)
    ctx.stroke()
    D.ellipse(ctx, 960, 900, 520, 120, hexrgb("#f4f6f6"), D.INK, 5)
    D.ellipse(ctx, 960, 900, 420, 80, hexrgb("#e2e8ea"), D.INK, 3)
    D.polyline(ctx, [(960, 760), (960, 420), (1180, 420), (1180, 520)], hexrgb("#b9bcc0"), 40)
    D.polyline(ctx, [(960, 760), (960, 420), (1180, 420), (1180, 520)], D.INK, 4)
    cough = t < 1.6
    jig = math.sin(t * 50) * 4 if cough else 0
    D.rect(ctx, 1160 + jig, 520, 40, 30, hexrgb("#9a9da2"), D.INK, 3, wob=0)
    if cough:
        for k in range(3):
            ph = (t * 3 + k / 3) % 1
            if (int(t * 6) % 3) != 0:
                D.ellipse(ctx, 1180, 560 + ph * 300, 8, 12, hexrgb("#9fc3d0"), D.INK, 1.5)
        D.text(ctx, "*cough*", 1400, 480, 60, D.FONT_HAND, D.INK, rot=-0.2, alpha=0.8)
    else:
        D.ellipse(ctx, 1180, 575, 8, 12, hexrgb("#9fc3d0"), D.INK, 1.5, alpha=clamp(1 - (t - 1.6)))
    D.text(ctx, "NO WATER", W / 2, 200, 90, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp((t - 1.8) / 0.3))


def shot_atrium(ctx, t, S):
    cam = Cam(960, Keys((0, 1700), (4, 2400)), Keys((0, 0.6), (4, 1.1)))
    with layer(ctx, cam, t):
        atrium_bg("day", 0.0, {})(ctx)
        fx.glow(ctx, 960, M.AT_LEVELS[0] + 40, 380, "#cfe8f2", 0.35)
    fx.grade(ctx, "warm", 0.1)


def shot_coins(ctx, t, S):
    """Фонтан крупно: монеты блестят. 4,000 галлонов, $300."""
    cam = Cam(960, 540, Keys((0, 1.0), (4, 1.15)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#a9a297"))
        ctx.paint()
        D.ellipse(ctx, 960, 560, 900, 420, hexrgb("#6c9fae"), D.INK, 8)
        r = rng(18)
        for k in range(160):
            a, rr = r.random() * TAU, r.random() ** 0.5
            x, y = 960 + math.cos(a) * rr * 820, 560 + math.sin(a) * rr * 370
            D.ellipse(ctx, x, y, 16, 10, hexrgb("#d6b24c") if k % 4 else hexrgb("#b9b4a8"), D.INK, 1.5,
                      rot=r.uniform(-1, 1))
            if (k * 7 + int(t * 6)) % 23 == 0:
                fx.glow(ctx, x, y, 30, "#fff6c8", 0.8)
        D.col(ctx, hexrgb("#d9eef4"), 0.25)
        for k in range(6):
            ctx.set_line_width(4)
            ph = (t * 0.3 + k / 6) % 1
            ctx.arc(960, 560, 200 + ph * 600, 0, TAU)
            ctx.stroke()
    fx.grade(ctx, "warm", 0.1)
    D.text(ctx, "4,000 GALLONS", W / 2, 230, 90, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp((t - 0.2) / 0.3))
    D.text(ctx, "+ $300 IN COINS", W / 2, 340, 70, D.FONT_TITLE, hexrgb("#ffd34a"), stroke=D.INK, slw=10,
           alpha=clamp((t - 1.4) / 0.3))


def pot(ctx, x, y, t, s=1.0):
    D.rect(ctx, x - 90 * s, y - 40 * s, 180 * s, 40 * s, hexrgb("#4a4e5a"), D.INK, 3, wob=0)
    D.rect(ctx, x - 80 * s, y - 150 * s, 160 * s, 110 * s, hexrgb("#b9b6ae"), D.INK, 4, wob=0)
    D.line(ctx, x - 100 * s, y - 140 * s, x + 100 * s, y - 140 * s, D.INK, 6 * s)
    for k in range(5):
        ph = (t * 0.8 + k / 5) % 1
        D.circle(ctx, x - 40 * s + k * 20 * s + math.sin(ph * 7 + k) * 20 * s, y - 170 * s - ph * 200 * s,
                 (18 + ph * 30) * s, hexrgb("#ecebe6"), None, 0, alpha=0.6 * (1 - ph))


def shot_boil(ctx, t, S):
    cam = Cam(Keys((0, 960), (4, 1000)), 600, 1.3)
    with layer(ctx, cam, t):
        roof_bg("day")(ctx)
        pot(ctx, 1000, 980, t, 1.3)
        w = Walk(Keys((0, 300), (2.5, 700, "out")), 990, 100, "walk", t1=5)
        w.draw(ctx, HERO, t, {"h1": (0.2, -1.0), "h2": (0.25, -0.95)})
        x = w.x(t)
        for dx in (-1, 1):
            D.poly(ctx, [(x + 20 * dx - 25, 890), (x + 20 * dx + 25, 890), (x + 20 * dx + 20, 950),
                         (x + 20 * dx - 20, 950)], hexrgb("#3f8ae0"), D.INK, 3, wob=0)
    fx.grade(ctx, "warm", 0.15)


def shot_taste(ctx, t, S):
    cam = Cam(960, 520, 1.0)
    with layer(ctx, cam, t):
        roof_bg("golden")(ctx)
        sip = t < 1.0
        p = {"view": "front", "face": "eat" if sip else "sad", "mouth": 0.3, "hturn": 0.1, "neck_line": True,
             "hang": -0.15 if sip else 0.0, "blink": 0}
        if not sip:
            p["face"] = "worried"
        HERO.head_only(ctx, 900, 500, 330, 1, p)
        cx, cy = (1060, 640) if sip else (1180, 760)
        D.poly(ctx, [(cx - 50, cy - 80), (cx + 50, cy - 80), (cx + 40, cy + 40), (cx - 40, cy + 40)],
               hexrgb("#e9eef2"), D.INK, 4, wob=0)
    fx.grade(ctx, "golden", 0.35)
    if not sip:
        for k, s in enumerate(("PENNIES", "+ WISHES")):
            D.text(ctx, s, 1500, 300 + k * 110, 70, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
                   alpha=clamp((t - 1.1 - k * 0.6) / 0.3))


def shot_wish(ctx, t, S):
    """Монетка в фонтан (замедление), закрытые глаза. Потом пьёт."""
    T = 0.5
    cam = Cam(Keys((0, 1080), (3, 1040)), Keys((0, 2400), (3, 2410)), Keys((0, 1.6), (3, 1.8)))
    fy = M.AT_LEVELS[0]
    with layer(ctx, cam, t):
        atrium_bg("golden", 0.0, {})(ctx)
        p = R.stand("side", t, 1)
        throw = smooth(t / T)
        p.update(a1=(0.4 + 1.6 * throw, 0.4), face="sleep" if t > T + 0.2 else "smile", neck=0.15)
        if t > 2.2:
            p.update(h1=(0.5, -3.1), face="smile")
        J = HERO.draw(ctx, 1240, fy + 120, 100, -1, p)
        if t > T:
            k = clamp((t - T) / 1.2)
            x = lerp(1140, 980, k)
            y = lerp(fy - 150, fy + 50, k) - math.sin(math.pi * k) * 160
            D.ellipse(ctx, x, y, 12, 12 * abs(math.cos(t * 12)) + 2, hexrgb("#d6b24c"), D.INK, 2)
            fx.glow(ctx, x, y, 40, "#fff6c8", 0.7)
            if k >= 1:
                for j in range(3):
                    ph = clamp((t - T - 1.2) / 0.8)
                    D.ellipse(ctx, 980, fy + 50, 20 + ph * 80 * (j + 1) / 3, 6 + ph * 20 * (j + 1) / 3, None,
                              hexrgb("#e9f4f8"), 3, alpha=1 - ph)
    fx.grade(ctx, "golden", 0.35)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_tap),
        Shot(c(1) - 0.1, shot_atrium),
        Shot(c(2) - 0.1, shot_coins),
        Shot(c(3) - 0.1, shot_boil),
        Shot(c(4) - 0.1, shot_taste),
        Shot(c(5) - 0.1, shot_wish, "fade", 0.3),
    ]
    S.tods = [(0, "day"), (c(4), "golden")]
