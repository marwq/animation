"""День 14: замок цел, решётка цела — но за ней мокрые следы босых ног. 22 велозамка."""
from scenes.kit import *
from scenes.shared import gallery_bg, gs, GF
from sets import stores as ST


def shot_check(ctx, t, S):
    cam = Cam(Keys((0, 1250), (4, 1350)), 580, Keys((0, 1.15), (4, 1.3)))
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 0.7))
        ST.gate_bars(ctx)
        w = Walk(Keys((0, 700), (1.6, 1300, "out")), 905, 100, "walk", t1=5)
        extra = {"h1": (0.62, -1.75 + 0.05 * math.sin(t * 12))} if t > 2.0 else None
        w.draw(ctx, HERO, t, extra)
    fx.darkness(ctx, 0.5, [fx.Light(*cam.to_screen(t, 900, 190), 1100, power=0.9, glow="#ffe2a0", glow_a=0.15)])
    fx.grade(ctx, "dark", 0.2)


def shot_prints(ctx, t, S):
    """Луч фонаря скользит по мокрому полу за прутьями: следы."""
    cam = Cam(Keys((0, 1300), (4.5, 1600)), 780, 2.0)
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 0.7))
        D.col(ctx, "#5a5e66", 0.5)
        ctx.rectangle(1180, 820, 560, 60)
        ctx.fill()
        ST.footprints(ctx, 1180, 800, n=30, reveal=clamp(t / 3.5), alpha=0.85)
        ST.gate_bars(ctx)
    bx, by = cam.to_screen(t, Keys((0, 1250), (4.5, 1650))(t), 840)
    fx.darkness(ctx, 0.72, [fx.Light(bx, by, 560, power=0.95, glow="#fff2d0", glow_a=0.2)])


def shot_map(ctx, t, S):
    """Схема сверху: следы поднимаются из туннеля, упираются в решётку и уходят назад."""
    D.col(ctx, hexrgb("#f3e7d0"))
    ctx.paint()
    D.text(ctx, "WET FOOTPRINTS", W / 2, 140, 64, D.FONT_TITLE, D.INK)
    D.rect(ctx, 260, 300, 600, 500, hexrgb("#2a2830"), D.INK, 4)
    D.text(ctx, "SUBWAY TUNNEL", 560, 860, 40, D.FONT_TITLE, hexrgb("#6a6862"))
    D.line(ctx, 1000, 260, 1000, 840, hexrgb("#6a6862"), 14)
    D.text(ctx, "GATE", 1000, 900, 40, D.FONT_TITLE, hexrgb("#6a6862"))
    D.rect(ctx, 1040, 300, 600, 500, hexrgb("#d9cdb5"), D.INK, 4)
    D.text(ctx, "YOUR SIDE", 1340, 560, 50, D.FONT_TITLE, hexrgb("#8a7a62"))
    n = 16
    for i in range(n):
        k = clamp(t * 6 - i)
        if k <= 0:
            break
        f = i / n
        if f < 0.55:
            x = lerp(400, 960, f / 0.55)
            y = 450 + math.sin(i) * 20
        else:
            x = lerp(960, 420, (f - 0.55) / 0.45)
            y = 640 + math.sin(i) * 20
        D.ellipse(ctx, x, y + (14 if i % 2 else -14), 16, 9, hexrgb("#c9b997"), None, 0, alpha=k)


def shot_face(ctx, t, S):
    cam = Cam(960, 520, Keys((0, 1.0), (3, 1.12)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#141218"))
        ctx.paint()
        p = {"view": "front", "face": "worried", "hturn": 0.2, "neck_line": True, "look": (0.5, 0.3),
             "blink": R.blink(t, 3)}
        HERO.head_only(ctx, 960, 480, 380, 1, p)
    fx.darkness(ctx, 0.5, [fx.Light(1200, 900, 900, power=0.85, glow="#fff2d0", glow_a=0.2)])


def shot_locks(ctx, t, S):
    """Велозамки на решётке — один за другим, счётчик до 22."""
    d = S.dur - (S.cue(4) - 0.1)
    n = int(clamp(t / (d - 1.0)) * 22)
    cam = Cam(Keys((0, 1460), (d, 1460)), Keys((0, 600), (d, 580)), Keys((0, 1.7), (d, 1.25)))
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 0.7))
        ST.gate_bars(ctx, locks=n)
        p = R.stand("back", t, 1)
        reach = math.sin(t * 7)
        p.update(h1=(-0.4 + 0.2 * reach, -2.9 + 0.4 * reach), h2=(0.4, -2.6 - 0.3 * reach))
        HERO.draw(ctx, 1460 + math.sin(t * 1.3) * 120, 1080, 150, 1, p)
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, 900, 190), 1200, power=0.9, glow="#ffe2a0", glow_a=0.15)])
    fx.grade(ctx, "dark", 0.2)
    D.text(ctx, "%d" % n, W - 120, 160, 120, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=12)
    D.text(ctx, "BIKE LOCKS", W - 120, 230, 50, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=8)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_check),
        Shot(c(1) - 0.1, shot_prints),
        Shot(c(2) - 0.1, shot_map),
        Shot(c(3) - 0.1, shot_face),
        Shot(c(4) - 0.1, shot_locks),
    ]
