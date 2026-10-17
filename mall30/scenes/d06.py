"""День 6: супермаркет в подвале, решётка старого перехода в метро, капли. Четыре тележки еды."""
from scenes.kit import *
from sets import stores as ST


def shot_down(ctx, t, S):
    """Вниз по стоящему эскалатору: герой и Претцель, камера опускается вместе с ними."""
    d = S.cue(1) - 0.1
    f = Keys((0, 0.95), (d, 0.02, "lin"))
    cam = Cam(lambda t: ST.esc_point(f(t))[0] + 60, lambda t: ST.esc_point(f(t))[1] - 140, 1.35)
    with layer(ctx, cam, t):
        bg(ctx, "esc_big", (-400, -400, 2800, 1700), ST.escalator_big)
        x, y = ST.esc_point(f(t))
        # шаги по ступеням: фаза от пройденного пути
        dist = (0.95 - f(t)) * 1350 / 85
        p = R.gait(dist / 1.4, "walk", "side")
        HERO.draw(ctx, x, y, 85, -1, p)
        x2, y2 = ST.esc_point(min(0.99, f(t) + 0.09))
        draw_dog(ctx, x2, y2, 80, -1, dog_pose(t, "trot", phase=dist * 1.4))
    k = smooth((0.95 - f(t)) / 0.95)
    fx.darkness(ctx, 0.25 + 0.4 * k, [fx.Light(*cam.to_screen(t, x, y - 200), 900, power=0.7, glow_a=0.05)])
    fx.grade(ctx, "warm", 0.1)


def shot_gate(ctx, t, S):
    """Решётка в метро. За ней темнота, капли падают в свет лампы."""
    cam = Cam(Keys((0, 1300), (4, 1460)), Keys((0, 560), (4, 580)), Keys((0, 1.1), (4, 1.45)))
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 1.0))
        ST.gate_bars(ctx, padlock=True)
        for k in range(3):
            ph = (t * 0.8 + k * 0.33) % 1.0
            dx = 1300 + k * 140
            D.ellipse(ctx, dx, 330 + ph * 540, 5, 9, hexrgb("#a9c6d6"), D.INK, 1.5, alpha=0.9)
            if ph > 0.92:
                D.ellipse(ctx, dx, 878, 30 * (ph - 0.92) * 12, 5, hexrgb("#a9c6d6"), None, 0, alpha=0.6)
    fx.darkness(ctx, 0.62, [fx.Light(*cam.to_screen(t, 900, 200), 900, power=0.9, glow="#ffe2a0", glow_a=0.2)])
    fx.grade(ctx, "dark", 0.3)


def shot_padlock(ctx, t, S):
    cam = Cam(1460, 630, 3.0, shake=lambda t: shake_k(t, 0.4, 0.2, 0.25) + shake_k(t, 1.1, 0.2, 0.25))
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 1.0))
        jig = (3 if 0.4 < t < 0.6 or 1.1 < t < 1.3 else 0) * math.sin(t * 80)
        ctx.save()
        ctx.translate(0, jig)
        ST.gate_bars(ctx, padlock=True)
        ctx.restore()
        hx = 1460 + 60
        D.line(ctx, hx + 400, 900, hx + 20, 640 + jig, D.INK, 28)
        D.circle(ctx, hx + 10, 640 + jig, 22, D.INK, None, 0)
    fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 900, 200), 1200, power=0.9, glow_a=0.1)])
    fx.grade(ctx, "dark", 0.3)


def shot_aisle(ctx, t, S):
    """Ряд супермаркета: герой идёт на камеру, толкая тележку, Претцель в корзине."""
    yk = Keys((0, 640), (4.2, 1000, "lin"))
    cam = Cam(960, Keys((0, 520), (4.2, 560)), Keys((0, 1.0), (4.2, 1.06)))
    with layer(ctx, cam, t):
        bg(ctx, "aisle4", (-200, -200, 2320, 1480), lambda c: ST.aisle(c))
        y = yk(t)
        s = ST.aisle_scale(y)
        dist = (y - 640) / 40
        p = R.gait(dist / 1.4, "walk", "front")
        p.update(h1=(-0.3, -1.45), h2=(0.3, -1.45), face="smile")
        HERO.draw(ctx, 960, y, s, 1, p)
        # тележка перед ним (вид спереди)
        cw = 2.1 * s
        cy = y + 0.25 * s
        D.rect(ctx, 960 - cw / 2, cy - 1.7 * s, cw, 1.1 * s, None, hexrgb("#9aa3a8"), max(2, 0.06 * s), wob=0)
        r = rng(4)
        for k in range(min(12, int(t * 4))):
            bx = 960 - cw / 2 + 0.1 * s + (k % 6) * cw / 6.5
            by = cy - 1.7 * s - (k // 6) * 0.35 * s
            D.rect(ctx, bx, by - 0.35 * s, cw / 7, 0.4 * s, hexrgb(r.choice(ST.PROD)), D.INK, 1.5, wob=0)
        D.col(ctx, hexrgb("#9aa3a8"))
        ctx.set_line_width(max(2, 0.05 * s))
        for k in range(8):
            xx = 960 - cw / 2 + k * cw / 7
            ctx.move_to(xx, cy - 1.7 * s)
            ctx.line_to(xx, cy - 0.6 * s)
        ctx.stroke()
        D.line(ctx, 960 - cw / 2, cy - 0.6 * s, 960 + cw / 2, cy - 0.6 * s, D.INK, max(2, 0.06 * s))
        draw_dog(ctx, 960 + 0.3 * s, cy - 1.75 * s, s * 0.8, -1, dog_pose(t, "sit", wag=1.0))
        for wx in (-0.8, 0.8):
            D.circle(ctx, 960 + wx * s, cy - 0.05 * s, 0.13 * s, hexrgb("#2c2a2a"), D.INK, 2)
    fx.grade(ctx, "warm", 0.12)


def shot_carts(ctx, t, S):
    """Вдоль полок: поезд из четырёх тележек."""
    xk = Keys((0, -200), (5, 1700, "lin"))
    cam = Cam(lambda t: xk(t) - 100, 560, 1.0)
    with layer(ctx, cam, t):
        bg(ctx, "shelves_a", (-1500, -50, 5000, 1300), lambda c: ST.shelves_side(c, -1500, 3500, 880, seed=11))
        w = Walk(xk, 920, 85, "brisk", t1=7)
        p = w.pose(t, {"h1": (0.7, -1.55), "h2": (0.65, -1.5), "lean": 0.25, "face": "determined"})
        HERO.draw(ctx, xk(t), 920, 85, 1, p)
        for k in range(4):
            ST.cart(ctx, xk(t) + 190 + k * 215, 920, 1.05, 1, items=14, seed=k)
        draw_dog(ctx, xk(t) + 190 + 3 * 215, 920 - 165, 60, 1, dog_pose(t, "sit"))
    fx.grade(ctx, "warm", 0.12)


def shot_eyes(ctx, t, S):
    """Камера медленно отъезжает от решётки. В темноте на миг блестят глаза."""
    cam = Cam(1460, Keys((0, 600), (4, 580)), Keys((0, 1.9), (4, 1.2)))
    with layer(ctx, cam, t):
        bg(ctx, "basement", (-400, -100, 2800, 1400), lambda c: ST.basement(c, 1.0))
        ST.gate_bars(ctx, padlock=True)
    fx.darkness(ctx, 0.7, [fx.Light(*cam.to_screen(t, 900, 200), 900, power=0.9, glow="#ffe2a0", glow_a=0.15)])
    blink_on = 1.6 < t < 2.4 and not (1.95 < t < 2.05)
    if blink_on:
        for ex in (-18, 18):
            x, y = cam.to_screen(t, 1500 + ex, 560)
            fx.glow(ctx, x, y, 22, "#e8ffd0", 0.8)
            D.circle(ctx, x, y, 5, hexrgb("#f0ffe0"), None, 0)
    fx.grade(ctx, "dark", 0.3)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_down),
        Shot(c(1) - 0.1, shot_gate),
        Shot(c(2) - 0.15, shot_padlock),
        Shot(c(3) - 0.1, shot_aisle),
        Shot(c(3) + 2.2, shot_carts),
        Shot(c(4) - 0.1, shot_eyes, "fade", 0.4),
    ]
    S.sfx += [(c(1) + 0.5, "drip", 0.6), (c(2) + 0.4, "chain_rattle", 0.8)]
