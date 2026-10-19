"""День 9: считаешь их у стекла. Второй день — три, пятый — одиннадцать, девятый — двадцать шесть. Не уходят,
не спят — стоят, будто витрина передумает. Двадцать шесть — и одно стекло. Днём к фасаду больше не ходишь."""
import cairo

from scenes.kit import *

HERO = ST.HERO
FD_HZ, FD_A = 760, 0.2
EXT_HZ, EXT_A = 786, 0.1
GLASS_Y = (340, 1000)                         # front_day: стекло витрины по высоте


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


def crowd_glass(ctx, T, n=14, near=False, seed=50):
    """Зомби вплотную к витрине (за стеклом): ряды, кто-то прижал ладони."""
    r_ = rng(seed)
    ctx.save()
    ctx.rectangle(0, GLASS_Y[0], 2720, GLASS_Y[1] - GLASS_Y[0])
    ctx.clip()
    items = []
    for i in range(n):
        x = 120 + (i + r_.uniform(-0.3, 0.3)) * (2500 / n)
        row = r_.randrange(2)
        gy = 1000 + row * 25 + r_.uniform(-6, 6)
        r = (70 if near else 52) * (1 - row * 0.12) * r_.uniform(0.92, 1.08)
        items.append((row, x, gy, r, i))
    for row, x, gy, r, i in sorted(items, key=lambda a: -a[0]):
        p = ST.front(T, i)
        sw = math.sin(T * (0.9 + 0.1 * (i % 3)) + i) * 0.1
        if (i % 3) == 0:
            p.update(h1=(0.95 + sw, -6.2), h2=(-0.95 + sw, -6.0))
        else:
            p.update(h1=(0.7 + sw, -2.6), h2=(-0.7 + sw, -2.7))
        p.update(face="neutral", mouth=0.5 + 0.4 * math.sin(T * 2 + i), tilt=0.15 * math.sin(T * 0.7 + i),
                 blink=False)
        ST.draw(ctx, x + 6 * math.sin(T * 0.8 + i), gy, r, 1 if i % 2 else -1, p,
                zombie_look(seed + i, ("#3a4256", 0.18)))
    ctx.restore()
    front_day_fg(ctx)
    # блики стекла поверх
    for j in range(6):
        xx = 250 + j * 430
        D.poly(ctx, [(xx, GLASS_Y[0]), (xx + 50, GLASS_Y[0]), (xx - 220, GLASS_Y[1]), (xx - 270, GLASS_Y[1])],
               hexrgb("#e9eef3"), None, 0, wob=0, alpha=0.12)


def peek_count(ctx, T, S):
    """Пригнувшись у кассы, герой считает силуэты у витрины."""
    l = T - (S.word("you", S.cue(0)) - 0.2)
    cam = PlateCam("front_day", 1500, 880, Keys((0, 1.05), (3, 1.1, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "front_day")
        crowd_glass(ctx, T, 12)
        multiply(ctx, "#3a4258", 0.3)
        x, gy = 1560, 1420
        r = persp(gy, FD_A, FD_HZ)
        p = crouch(T, 3, face="worried", look=(0.5, -0.4), h1=(1.3, -3.6), h2=(1.0, -3.0), lean=0.3,
                   hip=(0.0, 2.1), f1=(0.45, 0.0), f2=(-0.45, 0.0))
        J = figure(ctx, x, gy, r, -1, p, HERO, tint=("#6a7590", 0.25))
        hx, hy = at(J, x, gy, r, -1, "h2")
        clipboard(ctx, hx, hy - 10, 0.9 * r, -0.2, lines=4)


def chart(ctx, T, S):
    l0 = S.cue(1) - 0.3
    w = S.word
    t3, t11, t26 = w("three", S.cue(1)), w("eleven", S.cue(1)), w("twenty-six", S.cue(1))
    CD.count_card(ctx, T - l0, "AT THE GLASS",
                  [("Day 2", 3, t3 - l0 - 0.1), ("Day 5", 11, t11 - l0 - 0.1), ("Day 9", 26, t26 - l0 - 0.1)],
                  "Outside the front window")


def they_stand(ctx, T, S):
    """Снаружи: двадцать шесть у фасада, покачиваются и ждут."""
    l = T - (S.cue(2) - 0.3)
    cam = PlateCam("exterior_day", 1420, 900, Keys((0, 1.75), (6, 1.9, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "exterior_day")
        r_ = rng(9)
        items = []
        for i in range(26):
            x = 1220 + r_.uniform(0, 520)
            gy = 990 + r_.uniform(0, 60)
            items.append((gy, x, i))
        for gy, x, i in sorted(items):
            r = persp(gy, EXT_A, EXT_HZ)
            p = ST.stand(T, i)
            p.update(view="back" if i % 4 else "side", h1=(0.9, -3.6), h2=(0.6, -3.4), lean=0.1,
                     tilt=0.12 * math.sin(T * 0.8 + i), blink=False)
            ST.draw(ctx, x + 4 * math.sin(T * 0.7 + i), gy, r, 1 if i % 2 else -1, p,
                    zombie_look(70 + i, ("#4a5060", 0.12)))


def one_glass(ctx, T, S):
    """Изнутри крупно: лица и ладони вплотную к стеклу."""
    l = T - (S.cue(3) - 0.3)
    cam = PlateCam("front_day", 1300, 640, Keys((0, 1.7), (3, 1.82, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "front_day")
        crowd_glass(ctx, T, 11, near=True, seed=80)
        multiply(ctx, "#3a4258", 0.3)


def retreat(ctx, T, S):
    """Пригнувшись, уходит от витрины вглубь магазина."""
    l = T - (S.cue(4) - 0.3)
    cam = PlateCam("front_day", 1400, 900, 1.0)
    with on(ctx, cam, l):
        paint(ctx, "front_day")
        crowd_glass(ctx, T, 14, seed=50)
        multiply(ctx, "#3a4258", 0.35)
        gy = 1420
        r = persp(gy, FD_A, FD_HZ)
        x = 1900 - l * 230
        ph = (1900 - x) / (ST.WALK_STRIDE * r * 0.8)
        g = ST.gait(ph)
        p = crouch(T, 3, face="scared", look=(0.5, -0.2), lean=0.35, hip=(0.0, 2.05), h1=(0.9, -2.9),
                   h2=(0.5, -2.8))
        p.update(f1=(g["f1"][0] * 0.8, g["f1"][1]), f2=(g["f2"][0] * 0.8, g["f2"][1]))
        figure(ctx, x, gy, r, -1, p, HERO, tint=("#6a7590", 0.28))


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(9)),
        shot(w("you", c(0)) - 0.2, peek_count),
        shot(c(1) - 0.3, chart),
        shot(c(2) - 0.3, they_stand),
        shot(c(3) - 0.3, one_glass),
        shot(c(4) - 0.3, retreat),
    ]
    S.amb = [(w("you", c(0)) - 0.2, S.dur, "groans", 0.45), (c(2) - 0.3, c(3) - 0.3, "wind_loop", 0.4)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(1) - 0.3, "card", 0.5), (c(3) + 0.2, "glass_tap", 0.6),
             (c(3) + 1.1, "glass_tap", 0.45)]
    S.sfx += [(w(x, c(1)), "pop", 0.45) for x in ("three", "eleven", "twenty-six")]
    S.music = [(w("you", c(0)) - 0.2, S.dur, "dread", 0.55)]
