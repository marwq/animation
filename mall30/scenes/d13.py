"""День 13: 14:00 — свет гаснет волной по этажам. Подвал, генератор, и шаг за решёткой."""
from scenes.kit import *
from scenes.shared import atrium_bg, gallery_bg, gs, GF
from sets import stores as ST


def shot_wave(ctx, t, S):
    """Атриум: этажи гаснут сверху вниз."""
    T0 = 1.0
    cam = Cam(960, Keys((0, 1500), (4, 1700)), Keys((0, 0.55), (4, 0.62)))
    with layer(ctx, cam, t):
        atrium_bg("day", 0.9, {})(ctx)
        M.fountain_water(ctx, t, clamp(1 - (t - T0 - 1.6) / 0.5))
        p = R.stand("front", t, 2)
        p.update(neck=-0.3, look=(0, -1), face="worried" if t > T0 else "neutral")
        HERO.draw(ctx, 1240, M.AT_LEVELS[0] + 120, 52, 1, p)
    # темнота опускается по этажам
    for i, fy in enumerate(reversed(M.AT_LEVELS)):
        k = clamp((t - T0 - i * 0.35) / 0.15)
        if k <= 0:
            continue
        y0 = cam.to_screen(t, 0, fy - 470)[1]
        y1 = cam.to_screen(t, 0, fy + 40)[1]
        D.col(ctx, hexrgb("#14121c"), 0.55 * k)
        ctx.rectangle(0, y0, W, y1 - y0)
        ctx.fill()
    fx.grade(ctx, "warm", 0.1)
    D.text(ctx, "2:00 PM", W - 90, 120, 70, D.FONT_DAY, hexrgb("#f7eedb"), "right", True, stroke=D.INK, slw=8)


def shot_stop(ctx, t, S):
    """Эскалатор замирает на полушаге, морозильники гаснут."""
    cam = Cam(960, 560, 1.1)
    with layer(ctx, cam, t):
        run = t * 1.2 if t < 0.8 else 0.8 * 1.2 + (1 - math.exp(-(t - 0.8) * 6)) * 0.15
        ST.escalator_big(ctx, run=run)
    k = clamp((t - 0.8) / 0.2)
    fx.darkness(ctx, 0.6 * k, [fx.Light(960, 100, 1200, power=0.7, glow_a=0.0)])
    fx.grade(ctx, "warm", 0.1)


def shot_corridor(ctx, t, S):
    """Подвал во тьме: фонарик и хоккейная клюшка. Камера через плечо."""
    w = Walk(Keys((0, 1300), (5, 500, "lin")), 900, 100, "sneak", t1=7)
    cam = Cam(lambda t: w.x(t) - 250, 560, 1.3, drift=1)
    with layer(ctx, cam, t):
        bg(ctx, "basement_dark", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 0.0))
        ST.gate_bars(ctx)
        J = w.draw(ctx, HERO, t, {"a1": (1.45, 0.05), "a2": (0.6, 1.4), "face": "worried"},
                   props=lambda c, J, l: (hold_flashlight(J, c, "hand1", -0.12) if l == "front" else
                                          _stick(c, J) if l == "far_hand" else None))
        x, y = w.x(t), 900
        hx, hy = HERO.world(x, y, 100, -1, J["hand1"])
    fx.darkness(ctx, 0.88, [fx.Light(*cam.to_screen(t, hx, hy), 900, kind="cone", ang=math.pi + 0.1, spread=0.3,
                                     power=0.9, glow_a=0.05)])
    flashlight_beam(ctx, *cam.to_screen(t, hx, hy), math.pi + 0.1, 900, 0.3, 0.06)


def _stick(ctx, J):
    hx, hy = J["hand2"]
    D.line(ctx, hx, hy - 0.7, hx + 0.1, hy + 0.9, hexrgb("#8a6a52"), 0.07)
    D.line(ctx, hx + 0.1, hy + 0.9, hx + 0.45, hy + 0.98, hexrgb("#2a2a2e"), 0.1)


def shot_pull(ctx, t, S):
    """Рывок шнура: раз — кашель; два — рёв, свет."""
    P1, P2 = 0.4, 1.4
    on = t > P2 + 0.15
    cam = Cam(560, 600, 1.6, shake=lambda t: (0.5 if on else 0.0) + shake_k(t, P1, 0.3, 0.4))
    with layer(ctx, cam, t):
        bg(ctx, "basement_dark", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 0.0, gen=False))
        ST.generator(ctx, 260, 880, 1.0 if on else 0.0, t)
        pull = 0.0
        for a in (P1, P2):
            if a <= t < a + 0.35:
                pull = math.sin((t - a) / 0.35 * math.pi)
        p = R.stand("side", t, 1)
        p.update(h1=(0.6 - 0.5 * pull, -1.6 + 0.2 * pull), h2=(0.3, -1.4), lean=0.2 - 0.35 * pull, f1=(0.35, 0),
                 f2=(-0.3, 0), face="determined")
        J = HERO.draw(ctx, 860, 900, 100, -1, p)
        hx, hy = HERO.world(860, 900, 100, -1, J["hand1"])
        D.curve(ctx, [(560, 760), ((560 + hx) / 2, (760 + hy) / 2 + 20 * (1 - pull)), (hx, hy)], D.INK, 3)
    if on:
        fx.darkness(ctx, 0.25, [fx.Light(*cam.to_screen(t, 900, 190), 1200, power=0.9, glow="#ffe2a0", glow_a=0.25)])
    else:
        fx.darkness(ctx, 0.8, [fx.Light(*cam.to_screen(t, 820, 700), 500, power=0.8, glow_a=0.05)])
    if P2 + 0.15 < t < P2 + 0.3:
        fx.flash(ctx, 0.4, "#fff6d0")
    if t > P1 and t < P1 + 0.8:
        D.text(ctx, "PUFF...", W / 2 - 300, 300, 70, D.FONT_HAND, hexrgb("#f7eedb"), stroke=D.INK, slw=8)
    if on:
        D.text(ctx, "VRRRRRM!", W / 2 + 100, 300, 120, D.FONT_TITLE, hexrgb("#ffd34a"), stroke=D.INK, slw=12,
               alpha=clamp(2.6 - (t - P2)))


def shot_step(ctx, t, S):
    """Наезд на решётку: в темноте за ней — шаркающий силуэт делает шаг."""
    cam = Cam(1460, Keys((0, 600), (5, 620)), Keys((0, 1.2), (5, 2.1, "in")))
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 1.0))
        zx = Keys((0, 1520), (2.2, 1520), (3.2, 1470))
        p = zombie_idle(t, 21)
        if t > 2.2:
            p = R.gait((t - 2.2) * 0.6, "shamble", "side")
        fig = R.Fig(R.zombie_look(777))
        fig.draw(ctx, zx(t), 800, 74, -1, p, alpha=0.6)
        ST.gate_bars(ctx)
    fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 900, 200), 1100, power=0.9, glow="#ffe2a0", glow_a=0.15)])
    fx.grade(ctx, "dark", 0.25)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_wave),
        Shot(c(1) - 0.1, shot_stop),
        Shot(c(2) - 0.1, shot_corridor),
        Shot(c(4) - 0.2, shot_pull),
        Shot(c(5) - 0.2, shot_step),
    ]
    S.sfx += [(1.0, "power_down", 1.0), (c(4) - 0.2 + 0.4, "pull_cord", 0.8), (c(4) - 0.2 + 1.55, "generator", 1.0)]
