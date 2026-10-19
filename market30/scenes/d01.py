"""День 1: на рассвете в щель задней двери — машина Дейла, водительская дверь настежь. Остаётся одно — считать.
Вода: 340 галлонов, почти год. Еда — всё. Но морозильники пока гудят."""
from scenes.kit import *

HERO = ST.HERO
STK_HZ, STK_A = 700, 0.188
AIS_HZ, AIS_A = 750, 0.21
FRZ_HZ, FRZ_A = 600, 0.156


def shot(start, fn, trans="cut", tlen=0.3):
    return Shot(start, lambda ctx, t, S, f=fn, s0=start: f(ctx, s0 + t, S), trans, tlen)


# --- щель задней двери ------------------------------------------------------------

def peek(ctx, T, S):
    """Склад, утро: в щели между створками — полоска рассвета; герой со спины прильнул к ней."""
    l = T - (S.cue(1) - 0.25)
    cam = PlateCam("stockroom", 1640, 720, Keys((0, 2.0), (3, 2.12, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "stockroom")
        gap = 4 + 2.5 * smooth(clamp(l / 1.2))
        D.rect(ctx, 1676 - gap, 478, gap * 2, 462, hexrgb("#e9d6e6"), None, 0, wob=0)
        fx.glow(ctx, 1676, 700, 260, "#f3d9ea", 0.25)
        x, gy = 1625, 948
        r = persp(gy, STK_A, STK_HZ) * 1.15
        p = ST.front(T, 3)
        p.update(view="back", h1=(1.25, -5.4), h2=(-0.6, -2.4), lean=0.06, head=(0.18, 0.0),
                 breath=0.0)
        figure(ctx, x, gy, r, 1, p, HERO, tint=("#b9c3d6", 0.12))
    # утренний холод
    fx.flash(ctx, 0.12, "#1a2236")


def crack_pov(ctx, T, S):
    """Взгляд в щель: машина Дейла на рассвете, дверь открыта."""
    l = T - (S.word("dale's", S.cue(1)) - 0.35)
    cam = PlateCam("backlot_dawn", Keys((0, 1380), (3.2, 1310, "lin")), 960, Keys((0, 1.25), (3.2, 1.42, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "backlot_dawn")
        # салонный свет мерцает
        a = 0.25 + 0.1 * math.sin(T * 7) * (math.sin(T * 1.3) > 0.6)
        fx.glow(ctx, 1210, 940, 140, "#ffe9a8", a)
    # створки двери по бокам (экранные координаты): щель «дышит»
    half = 330 + 12 * math.sin(T * 1.7)
    cx = W / 2 + 20
    for side in (-1, 1):
        x0 = cx + side * half
        if side < 0:
            pts = [(x0, -20), (x0 - 4, H * 0.5), (x0 + 3, H + 20), (-40, H + 20), (-40, -20)]
        else:
            pts = [(x0, -20), (x0 + 4, H * 0.5), (x0 - 3, H + 20), (W + 40, H + 20), (W + 40, -20)]
        D.poly(ctx, pts, hexrgb("#2b2e35"), INK, 10, wob=0)
        # блик рассвета на кромке
        D.line(ctx, x0 - side * 10, -20, x0 - side * 12, H + 20, hexrgb("#d9c6d8"), 8, 0.55)
        # рёбра жёсткости створки
        for k in range(3):
            xx = x0 + side * (120 + k * 160)
            D.line(ctx, xx, -20, xx, H + 20, hexrgb("#24272d"), 6, 0.8)
    fx.flash(ctx, 0.08, "#101420")


# --- считать --------------------------------------------------------------------------

def count_close(ctx, T, S):
    """Крупно: герой берёт планшет и карандаш. «Ты считаешь»."""
    l = T - (S.cue(2) - 0.35)
    t_count = S.word("count", S.cue(2))
    cam = PlateCam("overhead2", 1420, 1050, Keys((0, 1.7), (4, 1.78, "lin")))
    blur_plate(ctx, "overhead2", cam, l, 0.75)
    x, gy, r = 860, H + 650, 215
    lift = smooth(clamp((T - (t_count - 0.6)) / 0.4))
    cbx, cby = 1180, lerp(1150, 720, smooth(clamp(l / 0.6)))
    p = pose(T, 3, face="determined" if T > t_count - 0.3 else "worried", look=(0.6, 0.4),
             h1=((cbx - 70 - x) / r, (cby + 80 - gy) / r), h2=((cbx + 60 - x) / r, (cby - 40 - 40 * lift - gy) / r))
    figure(ctx, x, gy, r, 1, p, HERO, tint=("#efe2c0", 0.05))
    clipboard(ctx, cbx, cby, 230, 0.12, lines=0)
    pencil(ctx, cbx + 75, cby - 30 - 40 * lift, 150, -0.5 - 0.4 * lift)


def water(ctx, T, S):
    """Проход с водой: герой задрал голову и записывает."""
    l = T - (S.cue(3) - 0.3)
    cam = PlateCam("water_aisle", 1450, 900, Keys((0, 1.0), (4, 1.06, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "water_aisle")
        x, gy = 1500, 1330
        r = persp(gy, AIS_A, AIS_HZ)
        w = math.sin(T * 9) * 0.05
        p = pose(T, 3, face="think", look=(0.45, -0.75), h1=(0.75, -3.7), h2=(0.95 + w, -3.95 + w))
        J = figure(ctx, x, gy, r, 1, p, HERO, tint=("#e8eef5", 0.06))
        hx, hy = at(J, x, gy, r, 1, "h1")
        clipboard(ctx, hx + 20, hy - 30, 1.1 * r, 0.25, lines=min(5, int(l / 0.6)))
        px, py = at(J, x, gy, r, 1, "h2")
        pencil(ctx, px, py, 0.8 * r, -0.4)


def water_card(ctx, T, S):
    l = T - (S.cue(4) - 0.3)
    CD.supplies_card(ctx, l, "SUPPLIES  ·  DAY 1",
                     [("Water", "340 gal", CD.icon_water, 10, 10), ("Food", "everything", CD.icon_can, 10, 10)],
                     "One person needs about 1 gallon a day")


def store_wide(ctx, T, S):
    """«Еда — всё»: весь магазин сверху, герой крошечный посреди."""
    l = T - (S.cue(5) - 0.3)
    cam = PlateCam("overhead2", 1400, 900, Keys((0, 1.12), (2, 1.08, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "overhead2")
        p = pose(T, 3, face="neutral", look=(0.3, -0.5))
        J = figure(ctx, 1405, 1290, 34, 1, p, HERO, tint=("#efe2c0", 0.05))


def freezers(ctx, T, S):
    """Морозильники гудят; на «не надолго» свет мигает, герой поднимает глаза."""
    t_last = S.word("won't", S.cue(5)) - 0.15
    l = T - (S.word("but", S.cue(5)) - 0.3)
    cam = PlateCam("freezer_aisle", 1500, 880, Keys((0, 1.0), (6, 1.08, "lin")))
    flick = 0.0
    for a, d in ((t_last, 0.08), (t_last + 0.16, 0.05), (t_last + 0.3, 0.12)):
        if a <= T < a + d:
            flick = 0.55
    with on(ctx, cam, l):
        paint(ctx, "freezer_aisle")
        x, gy = 1180, 1360
        r = persp(gy, FRZ_A, FRZ_HZ)
        worried = T > t_last
        p = pose(T, 3, face="worried" if worried else "neutral", look=(0.4, -0.7) if worried else (0.6, 0.1),
                 h1=(0.3, -2.35), h2=(-0.1, -2.4))
        figure(ctx, x, gy, r, 1, p, HERO, tint=("#bcd6ee", 0.12))
    fx.flash(ctx, flick, "#0a0d16")


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(1)),
        shot(c(1) - 0.25, peek),
        shot(w("dale's", c(1)) - 0.35, crack_pov),
        shot(c(2) - 0.35, count_close),
        shot(c(3) - 0.3, water),
        shot(c(4) - 0.3, water_card),
        shot(c(5) - 0.3, store_wide),
        shot(w("but", c(5)) - 0.3, freezers),
    ]
    S.amb = [(c(1) - 0.25, w("dale's", c(1)) - 0.35, "store_hum", 0.35),
             (w("dale's", c(1)) - 0.35, c(2) - 0.35, "birds", 0.35),
             (c(2) - 0.35, S.dur, "store_hum", 0.5),
             (w("but", c(5)) - 0.3, S.dur, "freezer_hum", 0.6)]
    S.sfx = [(0.0, "day_hit", 0.7), (w("dale's", c(1)) - 0.3, "door_creak", 0.35),
             (w("count", c(2)) - 0.05, "click", 0.6),
             (c(3) + 0.6, "pencil", 0.5), (c(3) + 1.8, "pencil", 0.45),
             (c(4) - 0.3, "card", 0.5), (w("won't", c(5)) - 0.15, "flicker", 0.6)]
    S.music = [(c(1) - 0.25, c(4) - 0.3, "lonely", 0.55), (c(4) - 0.3, S.dur, "mystery", 0.5)]
