"""День 26: подвал затапливает. Хлопья плывут по супермаркету. У решётки — руки. Замки держат. Пока."""
from scenes.kit import *
from sets import stores as ST


def shot_esc(ctx, t, S):
    """Сверху эскалатора: внизу поднимается мутная вода."""
    cam = Cam(Keys((0, 1300), (4, 900)), Keys((0, 330), (4, 600)), 1.15)
    with layer(ctx, cam, t):
        bg(ctx, "esc_big", (-400, -400, 2800, 1700), ST.escalator_big)
        ST.water(ctx, -400, 2400, 930 - t * 15, t, depth=500, c="#6e5f47", alpha=0.85)
        p = R.stand("side", t, 1)
        p.update(face="scared", neck=0.35, look=(0, 1), a1=(1.3, 0.1))
        x, y = ST.esc_point(1.0)
        HERO.draw(ctx, x + 60, y, 85, -1, p,
                  extra=lambda c, J, l: hold_flashlight(J, c, "hand1", 0.5) if l == "front" else None)
    fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 1300, 700), 900, kind="cone", ang=2.4, spread=0.35, power=0.8,
                                     glow_a=0.05), fx.Light(W / 2, 100, 900, power=0.4, glow_a=0)])
    fx.grade(ctx, "storm", 0.3)


def cereal(ctx, x, y, ang, c="#e2a33b", label="CORN"):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    D.rect(ctx, -40, -60, 80, 110, hexrgb(c), D.INK, 3, wob=0.4)
    D.circle(ctx, 0, -10, 24, hexrgb("#f4efe0"), D.INK, 2)
    D.text(ctx, label, 0, 36, 18, D.FONT_TITLE, D.INK)
    ctx.restore()


def shot_aisle_flood(ctx, t, S):
    cam = Cam(960, Keys((0, 560), (5, 600)), Keys((0, 1.0), (5, 1.12)))
    with layer(ctx, cam, t):
        bg(ctx, "aisle4", (-200, -200, 2320, 1480), lambda c: ST.aisle(c))
        lvl = 820
        ST.water(ctx, -200, 2120, lvl, t, depth=600)
        r = rng(26)
        for k in range(7):
            u = (r.random() + t * 0.08) % 1.0
            y = lerp(lvl + 10, 1060, u)
            x = 960 + (r.random() - 0.5) * 900 * (0.3 + u)
            sc = 0.3 + u
            ctx.save()
            ctx.translate(x, y + math.sin(t * 2 + k) * 6)
            ctx.scale(sc, sc)
            cereal(ctx, 0, -40, math.sin(t * 1.5 + k) * 0.3, r.choice(["#e2a33b", "#c23b33", "#3f8a84"]),
                   r.choice(["CORN", "OATS", "LOOPS"]))
            ctx.restore()
        ST.water(ctx, -200, 2120, lvl + 30, t + 2, depth=600, alpha=0.4)
    fx.darkness(ctx, 0.45, [fx.Light(W / 2, 300, 1100, power=0.7, glow_a=0.0)])
    fx.grade(ctx, "storm", 0.3)


def arm(ctx, x, y, L, ang, t, seed, c="#a8b29c"):
    """Серая рука сквозь прутья."""
    a = ang + math.sin(t * 3 + seed) * 0.15
    ex, ey = x + math.cos(a) * L * 0.5, y + math.sin(a) * L * 0.5
    hx, hy = ex + math.cos(a - 0.3) * L * 0.5, ey + math.sin(a - 0.3) * L * 0.5
    D.polyline(ctx, [(x, y), (ex, ey), (hx, hy)], hexrgb(c), 16)
    D.polyline(ctx, [(x, y), (ex, ey), (hx, hy)], D.INK, 3)
    for f in range(4):
        fa = a - 0.6 + f * 0.35
        D.line(ctx, hx, hy, hx + math.cos(fa) * 22, hy + math.sin(fa) * 22, hexrgb(c), 7)


def shot_hands(ctx, t, S):
    """У решётки вода по пояс, сквозь прутья — руки. Десятки. Сотни."""
    d = S.cue(3) - S.cue(2)
    n = int(lerp(4, 46, clamp(t / (d * 0.8))))
    cam = Cam(1460, Keys((0, 620), (d, 600)), Keys((0, 1.35), (d, 1.0)))
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 0.6))
        r = rng(9)
        for k in range(n):
            x = 1200 + r.random() * 520
            y = 420 + r.random() * 330
            arm(ctx, x, y, r.uniform(120, 200), math.pi + r.uniform(-0.5, 0.4), t, k)
        ST.gate_bars(ctx, locks=22, bend=0.2 * clamp(t / d), t=t, shake=0.3)
        ST.water(ctx, -400, 2400, 700, t, depth=500)
    fx.darkness(ctx, 0.5, [fx.Light(*cam.to_screen(t, 900, 200), 1100, power=0.8, glow_a=0.1),
                           fx.Light(*cam.to_screen(t, 1000, 600), 600, kind="cone", ang=-0.1, spread=0.4, power=0.8,
                                    glow_a=0.05)])
    fx.grade(ctx, "storm", 0.3)


def shot_locks(ctx, t, S):
    cam = Cam(1460, 560, 2.2, shake=lambda t: 0.35)
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 0.6))
        ST.gate_bars(ctx, locks=22, bend=0.35 + 0.05 * math.sin(t * 9), t=t, shake=1.0)
        ST.water(ctx, -400, 2400, 700, t, depth=500)
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, 900, 200), 1100, power=0.8, glow_a=0.1)])
    fx.grade(ctx, "storm", 0.3)
    D.text(ctx, "22 LOCKS", W - 120, 200, 90, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=10)
    D.text(ctx, "HOLDING...", W - 120, 290, 60, D.FONT_TITLE, hexrgb("#d9483b"), "right", stroke=D.INK, slw=8)


def shot_seal(ctx, t, S):
    """Таскает коробки наверх; запечатывает дверь в подвал и слушает."""
    d = S.dur - (S.cue(4) - 0.1)
    if t < d * 0.45:
        f = Keys((0, 0.05), (d * 0.45, 0.95, "lin"))
        cam = Cam(lambda tt: ST.esc_point(f(tt))[0], lambda tt: ST.esc_point(f(tt))[1] - 150, 1.3)
        with layer(ctx, cam, t):
            bg(ctx, "esc_big", (-400, -400, 2800, 1700), ST.escalator_big)
            ST.water(ctx, -400, 2400, 960, t, depth=500)
            x, y = ST.esc_point(f(t))
            dist = f(t) * 1350 / 85
            p = R.gait(dist / 1.4, "brisk", "side")
            p.update(h1=(0.55, -2.0), h2=(0.5, -1.95))
            HERO.draw(ctx, x, y, 85, 1, p)
            D.rect(ctx, x + 10, y - 230, 90, 70, hexrgb("#c9a678"), D.INK, 3, wob=0.5)
        fx.darkness(ctx, 0.4, [fx.Light(W / 2, 200, 1000, power=0.7, glow_a=0)])
    else:
        tt = t - d * 0.45
        cam = Cam(960, 560, Keys((0, 1.2), (d, 1.4)))
        with layer(ctx, cam, tt):
            D.col(ctx, M.WALL)
            ctx.paint()
            vib = math.sin(tt * 40) * 2 * (0.5 + 0.5 * math.sin(tt * 3))
            D.rect(ctx, 760 + vib, 300, 400, 580, hexrgb("#6b7280"), D.INK, 4)
            D.rect(ctx, 820 + vib, 360, 280, 60, hexrgb("#f6f1e6"), D.INK, 3)
            D.text(ctx, "BASEMENT", 960 + vib, 402, 40, D.FONT_TITLE, D.INK)
            for k in range(3):
                D.line(ctx, 740, 520 + k * 110, 1180, 500 + k * 120, hexrgb("#c9b48a"), 26)
            D.rect(ctx, -400, 880, 2800, 400, M.FLOOR, None, 0, wob=0)
            D.line(ctx, -400, 880, 2400, 880, D.INK, 3)
            p = R.stand("side", tt, 1)
            p.update(face="scared", lean=0.25, h1=(0.4, -2.4), neck=0.1, hturn=0.7, blink=0)
            HERO.draw(ctx, 690, 920, 110, 1, p)
            draw_dog(ctx, 500, 924, 90, 1, dog_pose(tt, "lie", wag=0.0))
        fx.grade(ctx, "storm", 0.25)
        for k in range(3):
            ph = (tt * 1.1 + k / 3) % 1
            D.text(ctx, "CREAK", 1300 + k * 60, 500 - ph * 90, 50, D.FONT_HAND, hexrgb("#f7eedb"), stroke=D.INK,
                   slw=6, alpha=1 - ph, rot=0.15)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_esc),
        Shot(c(1) - 0.1, shot_aisle_flood),
        Shot(c(2) - 0.1, shot_hands),
        Shot(c(3) - 0.1, shot_locks),
        Shot(c(4) - 0.1, shot_seal),
    ]
    S.sfx += [(c(3), "metal_creak", 0.8)]
