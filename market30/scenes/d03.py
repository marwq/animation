"""День 3: в четыре часа гул смолкает — света больше не будет. Тишина, и теперь слышно их снаружи. Холодильник
держит еду около 4 часов, полная морозилка — около двух суток. Мороженое на завтрак, обед и ужин."""
import cairo

from scenes.kit import *

HERO = ST.HERO
FRZ_HZ, FRZ_A = 600, 0.156
FD_HZ, FD_A = 760, 0.2                       # front_day: пол магазина


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


def power_k(T, S):
    """Три шага темноты на «every freezer / every light / every fan»."""
    ws = [S.word("every", S.cue(1)), S.word("every", S.word("every", S.cue(1)) + 0.2),
          S.word("fan", S.cue(1)) - 0.2]
    t_stop = S.word("stops", S.cue(1))
    k = [smooth(clamp((T - t_stop) / 0.25)) * 0.35]
    for w in ws:
        k.append(clamp((T - w) / 0.12))
    return k


def dark_freezers(ctx, T, S, k):
    """Морозильный ряд гаснет ступенями: витрины, потолок, общий полумрак."""
    multiply(ctx, "#2a3044", 0.95 * k[1], (980, 0, 1740, 1536))
    multiply(ctx, "#2a3044", 0.95 * k[2], (0, 0, 980, 1536))
    multiply(ctx, "#3a4258", 0.75 * max(k[0], k[3]))


def power_off(ctx, T, S):
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("freezer_aisle", 1450, 860, Keys((0, 1.05), (7, 1.12, "lin")))
    k = power_k(T, S)
    with on(ctx, cam, l):
        paint(ctx, "freezer_aisle")
        dark_freezers(ctx, T, S, k)
        x, gy = 1180, 1360
        r = persp(gy, FRZ_A, FRZ_HZ)
        t_stop = S.word("stops", S.cue(1))
        look = (0.6, 0.1) if T < t_stop else (0.2, -0.7)
        p = pose(T, 3, face="neutral" if T < t_stop else "worried", look=look, h1=(0.3, -2.35), h2=(-0.1, -2.4))
        figure(ctx, x, gy, r, 1, p, HERO, tint=("#bcd6ee", 0.12) if T < t_stop else ("#4a5878", 0.42))


def zombie_outside(ctx, T, x, gy, r, f, seed, t0, alpha_dark=0.25):
    """Силуэт за стеклом: появляется в t0 и медленно бредёт вдоль витрины."""
    a = clamp((T - t0) / 0.8)
    if a <= 0:
        return
    dx = (T - t0) * 12 * f
    p = shamble((T - t0) * 0.45, seed)
    p["blink"] = False
    ST.draw(ctx, x + dx, gy, r, f, p, zombie_look(seed, ("#2a3040", alpha_dark)), alpha=a)


def quiet(ctx, T, S):
    l = T - (S.cue(2) - 0.3)
    t_out = S.word("outside", S.cue(2)) - 0.9
    cam = PlateCam("front_day", 1600, 820, Keys((0, 1.0), (5, 1.06, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "front_day")
        ctx.save()
        ctx.rectangle(0, 340, 2720, 660)
        ctx.clip()
        for i, (x, gy, r, f) in enumerate(((600, 1010, 60, 1), (2030, 1000, 56, -1), (2330, 1015, 62, -1))):
            zombie_outside(ctx, T, x, gy, r, f, 20 + i, t_out + i * 0.35)
        ctx.restore()
        multiply(ctx, "#3a4258", 0.35)
        x, gy = 1650, 1400
        r = persp(gy, FD_A, FD_HZ)
        p = ST.front(T, 3)
        p.update(view="back", h1=(0.6, -2.4), h2=(-0.6, -2.4))
        figure(ctx, x, gy, r, 1, p, HERO, tint=("#6a7590", 0.3))


def safe_card(ctx, T, S):
    l = T - (S.cue(3) - 0.3)
    CD.bar_card(ctx, l, "POWER OFF  ·  FOOD STAYS SAFE",
                [("Fridge, door shut", 4, "4 hours", "#6fb6e8"), ("Full freezer, door shut", 48, "2 days", "#3f7fc4")],
                48, "Every time you open the door, the clock runs faster.")


def ice_cream(ctx, T, S):
    """Крупно: ложка за ложкой; на «завтрак / обед / ужин» рядом растёт стопка пустых вёдер."""
    l = T - (S.cue(4) - 0.3)
    cam = PlateCam("freezer_aisle", 1500, 820, 1.6)
    blur_plate(ctx, "freezer_aisle", cam, 0, 0.8)
    multiply(ctx, "#3a4258", 0.75)
    marks = [S.word("breakfast", S.cue(4)), S.word("lunch", S.cue(4)), S.word("dinner", S.cue(4))]
    n_empty = sum(1 for m in marks if T > m)
    for i in range(n_empty):
        k = ease_out_back(clamp((T - marks[i]) / 0.25))
        tub(ctx, 330 + (i % 2) * 40, H - 120 - i * 150, 150 * k, open_=True, empty=True)
    x, gy, r = 1000, H + 650, 215
    cyc = (l * 1.1) % 1.0
    up = math.sin(cyc * math.pi) ** 2
    tx, ty = 1290, 860
    sx, sy = lerp(tx - 20, 1080, up), lerp(ty - 80, 520, up)
    p = pose(T, 3, face="happy" if up > 0.6 else "neutral", look=(0.6, 0.5 - up), mouth=1.0,
             h1=((tx - 60 - x) / r, (ty + 40 - gy) / r), h2=((sx - x) / r, (sy + 30 - gy) / r))
    figure(ctx, x, gy, r, 1, p, HERO, tint=("#5a6a8a", 0.32))
    tub(ctx, tx, ty, 220, flavor="#f4c7d9")
    spoon(ctx, sx, sy + 30, 150, -0.6 + 0.5 * up, scoop="#f4c7d9" if up > 0.3 else None)


def best_worst(ctx, T, S):
    """Сидит у морозилки среди пустых вёдер: «лучший и худший день»."""
    l = T - (S.cue(5) - 0.3)
    t_worst = S.word("worst", S.cue(5))
    cam = PlateCam("freezer_aisle", 1200, 980, Keys((0, 1.3), (5, 1.36, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "freezer_aisle")
        multiply(ctx, "#3a4258", 0.75)
        gy = 1400
        r = persp(gy, FRZ_A, FRZ_HZ)
        for i, (dx, dy, s) in enumerate(((-260, 10, 90), (330, 20, 95), (470, -10, 80), (-120, 40, 85), (560, 35, 90))):
            tub(ctx, 900 + dx, gy + dy - s / 2, s, empty=True)
        worst = T > t_worst
        p = sit(T, 3, face="sad" if worst else "happy", look=(0.4, 0.2), h1=(1.0, -1.3), h2=(0.8, -1.1),
                sweat=worst)
        figure(ctx, 900, gy, r, 1, p, HERO, tint=("#4a5878", 0.4))


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(3)),
        shot(c(1) - 0.3, power_off),
        shot(c(2) - 0.3, quiet),
        shot(c(3) - 0.3, safe_card),
        shot(c(4) - 0.3, ice_cream),
        shot(c(5) - 0.3, best_worst),
    ]
    t_stop = w("stops", c(1))
    S.amb = [(c(1) - 0.3, t_stop, "freezer_hum", 0.7), (c(1) - 0.3, t_stop, "store_hum", 0.5),
             (w("outside", c(2)) - 1.0, c(3) - 0.3, "groans", 0.5)]
    S.sfx = [(0.0, "day_hit", 0.7), (t_stop - 0.05, "power_down", 0.8), (c(3) - 0.3, "card", 0.5)]
    S.sfx += [(w(x, c(4)), "spoon", 0.5) for x in ("breakfast", "lunch", "dinner")]
    S.music = [(t_stop + 0.8, c(4) - 0.3, "silence", 0.6), (c(4) - 0.3, S.dur, "lonely", 0.5)]
