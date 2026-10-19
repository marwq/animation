"""День 22: трещина в витрине — нижний левый угол, длиной с палец. Закалённое стекло крепкое в середине и слабое
по краям; когда оно лопается, то не трескается, а осыпается всё сразу. Стена из тележек, на цепях, в три ряда."""
import cairo

from scenes.kit import *

HERO = ST.HERO
RUTH = ST.RUTH
FD_HZ, FD_A = 760, 0.2


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


def crowd_far(ctx, T, n=12, seed=50, alpha=1.0):
    r_ = rng(seed)
    ctx.save()
    ctx.rectangle(0, 340, 2720, 660)
    ctx.clip()
    for i in range(n):
        x = 1190 + (i + r_.uniform(-0.3, 0.3)) * (920 / n)
        gy = 1005 + r_.uniform(-6, 6)
        r = 50 * r_.uniform(0.92, 1.08)
        p = ST.front(T, i)
        sw = math.sin(T * 0.9 + i) * 0.1
        p.update(h1=(0.95 + sw, -6.1), h2=(-0.95 + sw, -6.0), mouth=0.6, blink=False, tilt=0.12 * math.sin(T + i))
        ST.draw(ctx, x, gy, r, 1, p, zombie_look(seed + i, ("#3a4256", 0.2)), alpha=alpha)
    ctx.restore()
    front_day_fg(ctx)


def crack_close(ctx, T, S):
    """Крупно: угол витрины, трещина растёт; палец рядом для масштаба."""
    l = T - (S.cue(1) - 0.3)
    t_finger = S.word("finger", S.cue(1)) - 0.3
    cam = PlateCam("front_day", 1500, 700, 2.4)
    blur_plate(ctx, "front_day", cam, 0, 0.75, darken=0.2)
    glass_corner(ctx, T, crack=0.35 + 0.65 * smooth(clamp(l / 2.0)))
    k = smooth(clamp((T - t_finger) / 0.4))
    if k > 0:
        fx_, fy_ = lerp(W + 100, 520, k), 760
        D.line(ctx, W + 200, fy_ + 260, fx_ + 40, fy_ + 30, INK, 34)
        D.rrect(ctx, fx_ - 20, fy_ - 4, 300, 64, 32, hexrgb("#f6f3ec"), INK, 8)
        D.ellipse(ctx, fx_ + 22, fy_ + 28, 30, 22, hexrgb("#efe6dc"), INK, 4)


def tempered(ctx, T, S):
    """Схема закалённого стекла: середина крепкая (зелёная), края слабые (красные)."""
    l = T - (S.cue(2) - 0.3)
    t_mid = S.word("strong", S.cue(2)) - 0.2
    t_edge = S.word("weak", S.cue(2)) - 0.2
    CD.cream(ctx)
    D.text(ctx, "TEMPERED GLASS", W / 2, 230, 58, "Inter", hexrgb("#24252a"), bold=True, alpha=clamp(l / 0.3))
    x0, y0, w, h = W / 2 - 420, 300, 840, 560
    D.rect(ctx, x0, y0, w, h, hexrgb("#d6eaf4"), INK, 9, wob=0)
    km = clamp((T - t_mid) / 0.3)
    if km > 0:
        D.rrect(ctx, x0 + 150, y0 + 110, w - 300, h - 220, 40, hexrgb("#7cc28a"), None, 0, alpha=0.75 * km)
        D.text(ctx, "STRONG", W / 2, y0 + h / 2 + 22, 64, "Inter", hexrgb("#1f5a33"), bold=True, alpha=km)
    ke = clamp((T - t_edge) / 0.3)
    if ke > 0:
        ctx.save()
        ctx.rectangle(x0, y0, w, h)
        ctx.rectangle(x0 + w - 70, y0 + 70, -(w - 140), h - 140)
        ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
        D.col(ctx, hexrgb("#e05a4a"), 0.8 * ke)
        ctx.fill()
        ctx.restore()
        D.text(ctx, "WEAK EDGES", W / 2, y0 + h + 90, 50, "Inter", hexrgb("#c8392f"), bold=True, alpha=ke)
    D.rect(ctx, x0, y0, w, h, None, INK, 9, wob=0)


def all_at_once(ctx, T, S):
    """Стекло рассыпается в мелкие кубики — всё разом."""
    l = T - (S.cue(3) - 0.3)
    t_go = S.word("goes", S.cue(3)) - 0.05
    CD.cream(ctx)
    D.text(ctx, "IT DOESN'T CRACK. IT CRUMBLES.", W / 2, 200, 54, "Inter", hexrgb("#24252a"), bold=True,
           alpha=clamp(l / 0.3))
    x0, y0, w, h = W / 2 - 360, 290, 720, 520
    u = T - t_go
    if u < 0:
        D.rect(ctx, x0, y0, w, h, hexrgb("#d6eaf4"), INK, 9, wob=0)
        return
    r_ = rng(4)
    cw = w / 24
    cols, rows = 24, int(h / cw)
    hold = 0.35                                   # сначала покрывается сеткой трещин, потом осыпается
    for i in range(cols):
        for j in range(rows):
            vy = r_.uniform(0, 60)
            vx = r_.uniform(-60, 60)
            d = hold + (rows - j) * 0.012 + r_.uniform(0, 0.08)
            uu = max(0.0, u - d)
            x = x0 + i * cw + vx * uu
            y = y0 + j * cw + vy * uu + 650 * uu * uu
            if y > H + 40:
                continue
            D.rect(ctx, x, y, cw * 0.92, cw * 0.92, hexrgb("#c9e2ef"), hexrgb("#7a9aaa"), 1.5, wob=0)
    if u < hold + 0.3:
        D.rect(ctx, x0, y0, w, h, None, INK, 9, wob=0, alpha=clamp(1 - (u - hold) / 0.3))


def carts_wall(ctx, T, S, rows_k, hero=True):
    """Стена из тележек вдоль стекла (front_day): rows_k — сколько рядов (0..3)."""
    for row in range(3):
        k = clamp(rows_k - row)
        if k <= 0:
            continue
        gy = 1080 + row * 55
        s = 4.4 * persp(gy, FD_A, FD_HZ)
        n = 6
        for i in range(n):
            if i / n > k:
                break
            x = 1240 + i * (880 / (n - 1)) + (row % 2) * 40
            cart(ctx, x, gy, s, 1 if row % 2 == 0 else -1)
        if k >= 1:
            chain_line(ctx, 1180, gy - s * 0.75, 2140, gy - s * 0.75, 1.0, 14)


def barricade(ctx, T, S):
    """Вдвоём: герой катит тележку к стене, Рут натягивает цепь; ряды растут под «three rows deep»."""
    l = T - (S.cue(4) - 0.3)
    t_chain = S.word("chained", S.cue(4))
    t_three = S.word("three", S.cue(4))
    rows_k = 1.0 + clamp((T - t_chain) / 0.8) + clamp((T - t_three) / 0.6)
    cam = PlateCam("front_day", 1500, 950, Keys((0, 1.12), (5, 1.06, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "front_day")
        crowd_far(ctx, T, 12)
        carts_wall(ctx, T, S, rows_k)
        multiply(ctx, "#3a4258", 0.25)
        gy = 1430
        r = persp(gy, FD_A, FD_HZ)
        u = (l / 2.2) % 1.0
        k = smooth(clamp(u / 0.7))
        x = lerp(2300, 1880, k)
        cs = 4.4 * r
        cart(ctx, x - 1.7 * r - cs * 0.3, gy, cs, -1)
        p = pose(T, 3, face="determined", look=(-0.5, 0.0))
        if u < 0.7:
            p.update(ST.gait((2300 - x) / (ST.WALK_STRIDE * r)))
        p.update(h1=(1.6, -3.4), h2=(1.4, -3.3), lean=0.25)
        figure(ctx, x, gy, r, -1, p, HERO, tint=("#9aa6bc", 0.15))
        pr = pose(T, 5, face="determined", look=(0.5, -0.2), h1=(1.0, -3.9 + 0.3 * math.sin(T * 6)),
                  h2=(0.6, -3.7 - 0.3 * math.sin(T * 6)))
        figure(ctx, 1020, 1400, persp(1400, FD_A, FD_HZ), 1, pr, RUTH, tint=("#9aa6bc", 0.15))


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(22)),
        shot(c(1) - 0.3, crack_close),
        shot(c(2) - 0.3, tempered),
        shot(c(3) - 0.3, all_at_once),
        shot(c(4) - 0.3, barricade),
    ]
    S.amb = [(c(1) - 0.3, S.dur, "groans", 0.35)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(1) + 0.2, "glass_crack", 0.4), (c(2) - 0.3, "card", 0.5),
             (w("goes", c(3)) - 0.05, "shatter", 0.55), (w("chained", c(4)), "chain", 0.6),
             (c(4) - 0.1, "cart_roll", 0.5)]
    S.music = [(c(1) - 0.3, S.dur, "tension", 0.5)]
