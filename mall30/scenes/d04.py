"""День 4: ведро падает в 7 утра — все головы снаружи поворачиваются разом. Правило тишины."""
from scenes.kit import *
from scenes.shared import gallery_bg, gallery_rail, gs, GF
from scenes.d01 import entrance_scene, es, out_crowd
from sets import stores as ST


def bucket(ctx, x, gy, s, ang=0.0, water=1.0):
    """Ведро уборщика на колёсиках с отжимом. s — масштаб героя (px/u)."""
    k = s / 80
    ctx.save()
    ctx.translate(x, gy)
    ctx.rotate(ang)
    ctx.scale(k, k)
    D.poly(ctx, [(-50, -10), (50, -10), (60, -90), (-60, -90)], hexrgb("#e2b83b"), D.INK, 3, wob=0.4)
    D.rect(ctx, -20, -130, 60, 40, hexrgb("#8f8a80"), D.INK, 3, wob=0)
    D.line(ctx, 30, -130, 30, -200, D.INK, 6)
    if water:
        D.rect(ctx, -56, -86, 112, 12, hexrgb("#9fc3d0"), None, 0, wob=0)
    for wx in (-38, 38):
        D.circle(ctx, wx, -4, 9, hexrgb("#2c2a2a"), D.INK, 2)
    ctx.restore()


def splash(ctx, x, y, dt, s=1.0):
    r = rng(9)
    for i in range(22):
        a = -math.pi * r.uniform(0.05, 0.95)
        sp = r.uniform(150, 420) * s
        px = x + math.cos(a) * sp * dt
        py = y + math.sin(a) * sp * dt + 900 * dt * dt * s
        if py > y + 10:
            continue
        D.circle(ctx, px, py, r.uniform(4, 9) * s, hexrgb("#9fc3d0"), D.INK, 1.5, alpha=clamp(1 - dt / 0.6))
    D.ellipse(ctx, x, y + 6, 160 * s * min(1, dt * 3), 18 * s, hexrgb("#9fc3d0"), None, 0, alpha=0.6)


def shot_bucket(ctx, t, S):
    T_FALL = S.cue(1) + 0.25
    hy = 900
    s = es(hy)
    bx = Keys((0, 1150), (T_FALL - 0.35, 1640, "lin"))
    cam = Cam(Keys((0, 1300), (T_FALL, 1580), (T_FALL + 1.5, 1600)), Keys((0, 600), (T_FALL, 660)),
              Keys((0, 1.4), (T_FALL, 1.7), (T_FALL + 1.5, 1.85)), shake=lambda t: shake_k(t, T_FALL, 0.5, 1.0))
    entrance_scene(ctx, t, cam, crowd_k=0.5, sensor=0.0, tod="morning", barr=1.0)
    with layer(ctx, cam, t):
        k = clamp((t - (T_FALL - 0.35)) / 0.35)
        ang = -1.57 * (k ** 2)
        x_b = bx(t) + (40 * k)
        bucket(ctx, x_b, hy + 6, s, ang, 1.0 - k)
        if t > T_FALL:
            splash(ctx, x_b - 40, hy + 4, t - T_FALL, 1.2)
        w = Walk(lambda tt: bx(tt) - 120, hy, s, "walk", t1=12)
        if t < T_FALL - 0.35:
            w.draw(ctx, HERO, t, {"h1": (0.75, -1.5), "h2": (0.7, -1.45)})
        else:
            p = R.stand("side", t, 1)
            p.update(face="scared", h1=(0.6, -1.6), h2=(0.55, -1.7), lean=-0.1, hturn=0.4, blink=0)
            HERO.draw(ctx, bx(T_FALL - 0.35) - 120, hy, s, 1, p)
    fx.grade(ctx, "warm", 0.15)


def heads_turn_fn(t0):
    def fn(m, t):
        p = zombie_idle(t, m.seed % 97, "side")
        k = smooth((t - t0 - (m.x % 60) / 600.0) / 0.12)
        if k > 0:
            p = dict(p)
            p["view"] = "front" if k > 0.5 else "side"
            p["hturn"] = 0.0
            p["neck"] = 0.05
            p["mouth"] = 0.7
            p["look"] = (0.0, 0.0)
        return p
    return fn


def shot_heads(ctx, t, S):
    """За стеклом: все головы разом поворачиваются к витрине."""
    T0 = 0.35
    cam = Cam(Keys((0, 700), (3, 1250)), 600, 1.7, drift=0.4)
    crowd = out_crowd()
    with layer(ctx, cam, t):
        bg(ctx, "ent_out_morning", (-600, -200, 3120, 1000), lambda c: M.entrance_outside(c, "morning", lit=0.0))
        draw_crowd(ctx, crowd, t, heads_turn_fn(T0))
        M.entrance_glass(ctx, 0.0, sensor=0.0, tint=0.28)
        bg(ctx, "ent_in_1.0", (-600, -100, 3120, 1700), lambda c: M.entrance_interior(c, "morning", 1.0))
    fx.grade(ctx, "warm", 0.1)
    fx.flash(ctx, (1 - clamp(t / 0.15)) * 0.4, "#ffffff")


def shot_frozen(ctx, t, S):
    """Герой замер. Снаружи — неподвижные взгляды в тонированное стекло."""
    cam = Cam(960, Keys((0, 600), (3, 620)), Keys((0, 1.05), (3, 1.2)))
    with layer(ctx, cam, t):
        bg(ctx, "ent_out_morning", (-600, -200, 3120, 1000), lambda c: M.entrance_outside(c, "morning", lit=0.0))
        draw_crowd(ctx, out_crowd(), t + 3, heads_turn_fn(-5))
        M.entrance_glass(ctx, 0.0, sensor=0.0, tint=0.55)
        bg(ctx, "ent_in_1.0", (-600, -100, 3120, 1700), lambda c: M.entrance_interior(c, "morning", 1.0))
        from scenes.cold import barricade
        barricade(ctx)
        p = R.stand("front", t, 1)
        p.update(face="scared", blink=0, a1=(0.35, 0.2), a2=(0.35, 0.2), hip=(0, 0.04))
        HERO.draw(ctx, 1320, 1010, es(1010), 1, p)
    fx.grade(ctx, "warm", 0.15)


def shot_socks(ctx, t, S):
    """Ноги крупно: на цыпочках, в носках."""
    w = Walk(Keys((0, 500), (3, 800, "lin")), GF + 40, gs(), "sneak", t1=5)
    cam = Cam(lambda t: w.x(t) + 30, GF - 40, 2.5)
    with layer(ctx, cam, t):
        gallery_bg("d04", "day", 0.9, {n: 1.0 for n, _, _ in M.STORES})(ctx)
        w.draw(ctx, HERO, t)
    fx.grade(ctx, "warm", 0.15)
    D.text(ctx, "SOFT SHOES", W / 2, 230, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp(t / 0.2))


def shot_gate_gentle(ctx, t, S):
    """Решётку опускают медленно, двумя руками."""
    frac = clamp(t / 1.6) * 0.92 + 0.04
    cam = Cam(700, 560, 1.45)
    gates = {"NOVA TECH": 1.0, "BELLA SHOES": 1.0}
    with layer(ctx, cam, t):
        bg(ctx, "d04_gal2", (200, -50, 2000, 1250), lambda c: M.gallery(c, 200, 2200, "day", 0.9, gates, start=3))
        x, w = 260 + 120, 560
        C.shutter(ctx, x, GF - 470, w, 470, frac, seed=3)
        p = R.stand("side", t, 1)
        hy = GF - 470 + 470 * frac
        p.update(h1=(0.45, -(GF + 40 - hy) / gs() - 0.1), h2=(0.4, -(GF + 40 - hy) / gs()), face="determined",
                 lean=0.05)
        HERO.draw(ctx, x + w * 0.5 - 50, GF + 40, gs(), 1, p)
    fx.grade(ctx, "warm", 0.15)
    D.text(ctx, "NO SLAMMING", W / 2, 230, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp(t / 0.2))


def shot_oil(ctx, t, S):
    cam = Cam(900, 640, 1.35)
    with layer(ctx, cam, t):
        bg(ctx, "esc_big", (-400, -400, 2800, 1700), ST.escalator_big)
        x, y = ST.esc_point(0.3)
        p = R.stand("side", t, 1)
        p.update(k1=(1.9, 2.3), k2=(1.2, 2.0), hip=(0, 0.95), lean=0.45, h1=(0.85, -0.95), h2=(0.6, -1.0),
                 face="determined", neck=0.3)
        J = HERO.draw(ctx, x - 160, y + 70, 78, 1, p)
        hx, hy = HERO.world(x - 160, y + 70, 78, 1, J["hand1"])
        D.poly(ctx, [(hx - 10, hy - 30), (hx + 30, hy - 30), (hx + 40, hy + 10), (hx - 20, hy + 10)],
               hexrgb("#c23b33"), D.INK, 3, wob=0)
        D.line(ctx, hx + 35, hy - 20, hx + 90, hy + 10, D.INK, 4)
        for k in range(3):
            ph = (t * 1.6 + k / 3) % 1
            D.circle(ctx, hx + 92, hy + 14 + ph * 70, 6, hexrgb("#a8862a"), D.INK, 1.5, alpha=1 - ph)
    fx.grade(ctx, "warm", 0.15)
    D.text(ctx, "OIL THE ESCALATORS", W / 2, 230, 80, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
           alpha=clamp(t / 0.2))


def shot_breathe(ctx, t, S):
    """Тишина: герой крадётся через пустую галерею, камера медленно ведёт."""
    w = Walk(Keys((0, 200), (8, 1500, "lin")), GF + 40, gs(), "sneak", t1=10)
    cam = Cam(lambda t: w.x(t) + 200, 560, Keys((0, 1.0), (8, 1.1)))
    with layer(ctx, cam, t):
        gallery_bg("d04", "day", 0.9, {n: 1.0 for n, _, _ in M.STORES})(ctx)
        w.draw(ctx, HERO, t)
        x, y = w.x(t), GF + 40 - gs() * 3.35
        ph = (t % 2.2) / 2.2
        if ph < 0.5:
            D.circle(ctx, x + 70 + ph * 80, y - ph * 20, 10 + ph * 30, hexrgb("#ffffff"), None, 0, alpha=0.35 * (1 - ph * 2))
    with layer(ctx, cam, t, 1.3):
        gallery_rail(ctx)
    fx.grade(ctx, "warm", 0.2)


def build(S):
    c = S.cue
    m = (c(3, True) - c(3)) / 3
    S.shots = [
        Shot(0, shot_bucket),
        Shot(c(1) + 1.2, shot_heads),
        Shot(c(2) - 0.1, shot_frozen),
        Shot(c(3) - 0.1, shot_socks),
        Shot(c(3) + m * 1.3, shot_gate_gentle),
        Shot(c(3) + m * 2.3, shot_oil),
        Shot(c(4) - 0.2, shot_breathe, "fade", 0.4),
    ]
    S.sfx += [(c(1) + 0.25, "bucket_crash", 1.0)]
