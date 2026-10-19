"""День 5: молоко скисает первым, потом мясо; запах расползается по магазину — и наружу. Сортируешь по тому,
что портится раньше. Рис и сушёная фасоль — годы, мёд не портится вовсе. Всё — на склад, под замок."""
import cairo

from scenes.kit import *

HERO = ST.HERO
STK_HZ, STK_A = 700, 0.188
EXT_HZ, EXT_A = 786, 0.1                     # exterior_day: парковка


def shot(start, fn, trans="cut", tlen=0.3):
    return Shot(start, lambda ctx, t, S, f=fn, s0=start: f(ctx, s0 + t, S), trans, tlen)


def multiply(ctx, color, alpha, rect=None):
    if alpha <= 0:
        return
    ctx.save()
    if rect:
        ctx.rectangle(*rect)
        ctx.clip()
    ctx.set_operator(cairo.OPERATOR_MULTIPLY)
    D.col(ctx, hexrgb(color), alpha)
    ctx.paint()
    ctx.restore()


def dairy(ctx, T, S):
    """Молочный и мясной отдел: мухи, волны запаха; герой входит, зажимая нос."""
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("dairy_dark", 1360, 860, Keys((0, 1.0), (6, 1.06, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "dairy_dark")
        for (x, y, sd) in ((560, 520, 1), (1100, 600, 2), (1600, 480, 3), (2300, 700, 4), (2500, 380, 5)):
            flies(ctx, T, x, y, 5, 160, sd, s=2.0)
        t_meat = S.word("meat", S.cue(1)) - 0.2
        for i, (x, y) in enumerate(((700, 1000), (1350, 980), (2250, 1050), (2550, 900))):
            if T > (S.cue(1) + 0.2 if i < 2 else t_meat):
                stink(ctx, T + i * 0.7, x, y, 360, 3, alpha=0.75, s=1.8)
        # герой входит слева и останавливается, зажав нос
        T_WALK = 1.6
        k = clamp(l / T_WALK)
        x = lerp(380, 900, k)
        gy = 1500
        r = 150
        p = pose(T, 3, face="sad", look=(0.5, -0.2), h1=(0.55, -6.0), h2=(-0.1, -2.4))
        if k < 1:
            p.update(ST.gait((x - 380) / (ST.WALK_STRIDE * r)))
            p["h1"] = (0.55, -6.0)
        J = figure(ctx, x, gy, r, 1, p, HERO, tint=("#a9b89a", 0.15))
        # «прищепка» пальцев на носу
        hx, hy = at(J, x, gy, r, 1, "head")
        D.circle(ctx, hx + 0.62 * r, hy + 0.12 * r, 0.16 * r, INK, None, 0)
        D.line(ctx, hx + 0.9 * r, hy - 0.35 * r, hx + 1.2 * r, hy - 0.55 * r, INK, 6)
        D.line(ctx, hx + 0.95 * r, hy - 0.15 * r, hx + 1.3 * r, hy - 0.2 * r, INK, 6)


def outside_smell(ctx, T, S):
    """Запах тянется наружу; на парковке поднимают головы и поворачивают к магазину."""
    l = T - (S.cue(2) - 0.3)
    cam = PlateCam("exterior_day", 1360, 900, Keys((0, 1.08), (3.5, 1.0, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "exterior_day")
        for i, x in enumerate((820, 1220, 1650, 1950)):
            stink(ctx, T + i * 0.5, x, 900, 420, 2, alpha=0.6, s=2.2)
        walkers = ((300, 1210, 1, 40), (2350, 1150, -1, 41), (1120, 1420, 1, 42), (2050, 1380, -1, 43),
                   (700, 1050, 1, 44))
        for x, gy, f, sd in walkers:
            r = persp(gy, EXT_A, EXT_HZ)
            dx = l * 22 * f
            p = shamble(l * 0.5 + sd, sd)
            p["tilt"] = -0.25 + 0.05 * math.sin(T * 2 + sd)        # голова задрана — нюхает
            p["blink"] = False
            ST.draw(ctx, x + dx, gy, r, f, p, zombie_look(sd, ("#5a6070", 0.12)))


def spoil_card(ctx, T, S):
    l0 = S.cue(3) - 0.3
    w = S.word
    times = [w("fresh", S.cue(3)), w("bread", S.cue(3)), w("cans", S.cue(3)), w("rice", S.cue(3))]
    CD.timeline_card(ctx, T - l0, "WHAT SPOILS FIRST",
                     [(CD.icon_milk, "Milk, meat", "days"), (CD.icon_bread, "Bread", "about a week"),
                      (CD.icon_can_big, "Cans", "years"), (CD.icon_sack, "Rice, beans", "years")],
                     "Eat the fresh food first. Save the rest.", [t - l0 for t in times])


def flatbed(ctx, x, gy, s, f):
    """Платформенная тележка с мешками риса и банками мёда."""
    w, h = s * 2.6, s * 0.18
    x0 = x - w / 2
    for wx in (x0 + s * 0.3, x0 + w - s * 0.3):
        D.circle(ctx, wx, gy - s * 0.14, s * 0.14, hexrgb("#3a3b40"), INK, 3)
    D.rect(ctx, x0, gy - s * 0.32, w, h, hexrgb("#7a8590"), INK, 4, wob=0)
    hxp = x0 + (w if f < 0 else 0)
    for dx in (0, -f * s * 0.22):                    # П-образная ручка
        D.line(ctx, hxp + dx, gy - s * 0.3, hxp + dx, gy - s * 1.25, INK, 12)
        D.line(ctx, hxp + dx, gy - s * 0.3, hxp + dx, gy - s * 1.25, hexrgb("#9aa3ad"), 6)
    D.line(ctx, hxp, gy - s * 1.25, hxp - f * s * 0.22, gy - s * 1.25, INK, 12)
    D.line(ctx, hxp, gy - s * 1.25, hxp - f * s * 0.22, gy - s * 1.25, hexrgb("#9aa3ad"), 6)
    for k in range(3):
        cx = x0 + s * 0.45 + k * s * 0.62
        ctx.save()
        ctx.translate(cx, gy - s * 0.32 - s * 0.42)
        ctx.scale(s / 500, s / 500)
        CD.icon_sack(ctx)
        ctx.restore()
    ctx.save()
    ctx.translate(x0 + s * 0.9, gy - s * 1.2)
    ctx.scale(s / 650, s / 650)
    CD.icon_honey(ctx)
    ctx.restore()
    return hxp, gy - s * 1.2


def honey_close(ctx, T, S):
    l = T - (S.word("honey", S.cue(4)) - 0.25)
    cam = PlateCam("stockroom", 1500, 900, 1.5)
    blur_plate(ctx, "stockroom", cam, 0, 0.75)
    x, gy, r = 820, H + 640, 215
    jx, jy = 1230, lerp(820, 690, ease_out(clamp(l / 0.5)))
    p = pose(T, 3, face="happy", look=(0.65, 0.2),
             h1=((jx - 90 - x) / r, (jy + 40 - gy) / r), h2=((jx + 90 - x) / r, (jy + 50 - gy) / r))
    figure(ctx, x, gy, r, 1, p, HERO, tint=("#efe2c0", 0.05))
    ctx.save()
    ctx.translate(jx, jy)
    ctx.scale(0.95, 0.95)
    CD.icon_honey(ctx)
    ctx.restore()
    for i in range(3):                              # блёстки
        a = math.sin(clamp((l - 0.3 - i * 0.2) / 0.6) * math.pi)
        if a > 0:
            sx, sy = jx - 160 + i * 150, jy - 200 + (i % 2) * 40
            D.line(ctx, sx - 22, sy, sx + 22, sy, hexrgb("#ffe27a"), 7, a)
            D.line(ctx, sx, sy - 22, sx, sy + 22, hexrgb("#ffe27a"), 7, a)


def to_stockroom(ctx, T, S):
    """Герой катит тележку с запасами через склад."""
    l = T - (S.cue(5) - 0.3)
    cam = PlateCam("stockroom", 1450, 950, Keys((0, 1.0), (3, 1.04, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "stockroom")
        gy = 1330
        r = persp(gy, STK_A, STK_HZ)
        dist = l * 1.5 * r * ST.WALK_STRIDE * 0.9
        x = 2350 - dist
        cx = x - 3.75 * r
        hxp, hyp = flatbed(ctx, cx, gy, r * 2.2, -1)
        p = pose(T, 3, face="determined", look=(0.6, 0.0))
        p.update(ST.gait(l * 1.5 * 0.9))
        p.update(h1=((x - hxp) / r, -(gy - hyp) / r), h2=((x - hxp) / r - 0.1, -(gy - hyp) / r + 0.15), lean=0.15)
        figure(ctx, x, gy, r, -1, p, HERO, tint=("#c7cdd8", 0.1))


def lock(ctx, T, S):
    t_turn = S.word("lock", S.cue(5)) + 0.05
    cam = PlateCam("stockroom", 1680, 700, 2.6)

    def bg(c):
        blur_plate(c, "stockroom", cam, 0, 0.6, darken=0.15)
    lock_close(ctx, T, t_turn, bg)


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(5)),
        shot(c(1) - 0.3, dairy),
        shot(c(2) - 0.3, outside_smell),
        shot(c(3) - 0.3, spoil_card),
        shot(w("honey", c(4)) - 0.25, honey_close),
        shot(c(5) - 0.3, to_stockroom),
        shot(w("lock", c(5)) - 0.5, lock),
    ]
    S.amb = [(c(1) - 0.3, c(2) - 0.3, "flies", 0.6), (c(2) - 0.3, c(3) - 0.3, "wind_loop", 0.4),
             (c(2) - 0.1, c(3) - 0.3, "groans", 0.55), (c(5) - 0.3, S.dur, "store_hum", 0.2)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(3) - 0.3, "card", 0.5), (w("honey", c(4)) - 0.1, "notify", 0.35),
             (c(5) - 0.2, "cart_roll", 0.5), (w("lock", c(5)) + 0.05, "lock_click", 0.8)]
    S.music = [(c(1) - 0.3, c(3) - 0.3, "mystery", 0.55), (c(3) - 0.3, S.dur, "hope", 0.45)]
