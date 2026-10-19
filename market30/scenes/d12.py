"""День 12: её зовут Рут, 68 лет, фармацевт. Заперлась с ящиком воды, коробкой крекеров и стулом и молчала
одиннадцать дней — слышала, как ты считаешь банки. Двое — всё кончается вдвое быстрее. Но Рут кое-что знает."""
import cairo

from scenes.kit import *

HERO = ST.HERO
RUTH = ST.RUTH


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


ITEMS = {"water": (840, 1330, 210), "crackers": (1350, 1190, 170), "chair": (1060, 1000, 260)}


def meet(ctx, T, S):
    """Аптека изнутри: Рут у стула с пледом, смотрит на героя (за кадром слева)."""
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("pharmacy_inside", 1500, 900, Keys((0, 1.12), (5, 1.18, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "pharmacy_inside")
        x, gy, r = 1660, 1460, 92
        p = pose(T, 5, face="neutral", look=(0.5, 0.0), h1=(0.5, -2.6), h2=(0.0, -2.5))
        figure(ctx, x, gy, r, -1, p, RUTH, tint=("#f0dcb0", 0.08))


def items(ctx, T, S):
    """Вода, крекеры, стул — подсвечиваются по словам."""
    l = T - (S.cue(2) - 0.3)
    cam = PlateCam("pharmacy_inside", 1250, 1000, Keys((0, 1.35), (6, 1.42, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "pharmacy_inside")
        for name, (x, y, rr) in ITEMS.items():
            t0 = S.word(name, S.cue(2)) - 0.1
            k = clamp((T - t0) / 0.25)
            if k > 0:
                ctx.save()
                ctx.arc(x, y, rr * (0.9 + 0.1 * ease_out_back(k)), 0, TAU)
                D.col(ctx, hexrgb("#ffe27a"), 0.9 * k)
                ctx.set_line_width(10)
                ctx.stroke()
                ctx.restore()
        x, gy, r = 1760, 1470, 92
        p = pose(T, 5, face="talk" if (S.cue(2) < T < S.cue(2, end=True)) else "neutral", look=(-0.3, 0.1),
                 h1=(1.2, -3.2), h2=(0.0, -2.5))
        figure(ctx, x, gy, r, -1, p, RUTH, tint=("#f0dcb0", 0.08))


def profile(ctx, T, S):
    l = T - (S.cue(3) - 0.3)
    CD.profile_card(ctx, l, CD.icon_ruth, "THE PHARMACY", "One survivor. Eleven days of silence.")


def two_people(ctx, T, S):
    l = T - (S.cue(4) - 0.3)
    CD.supplies_card(ctx, l, "SUPPLIES  ·  DAY 12  ·  TWO PEOPLE",
                     [("Water", "164 days", CD.icon_water, 10, 5), ("Food", "half as long", CD.icon_can, 10, 5)],
                     "Two mouths. Everything runs out twice as fast.")


def knows(ctx, T, S):
    """Лагерь при свечах: Рут что-то объясняет, герой слушает."""
    l = T - (S.cue(5) - 0.3)
    cam = PlateCam("base_camp", 1620, 1000, Keys((0, 1.25), (4, 1.3, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "base_camp")
        multiply(ctx, "#3a3046", 0.35)
        r = 118
        pr = seated(T, 5, face="talk", look=(0.5, 0.0), h1=(1.4, -3.6), h2=(1.1, -3.3))
        figure(ctx, 1240, 1344, r, 1, pr, RUTH, tint=("#ffcf8a", 0.12))
        ph = seated(T, 3, face="neutral", look=(0.5, 0.0), h1=(1.3, -3.35), h2=(1.0, -3.3))
        figure(ctx, 1980, 1344, r, -1, ph, HERO, tint=("#ffcf8a", 0.12))
        fx.glow(ctx, 1620, 870, 420, "#ffcf7a", 0.18 + 0.03 * math.sin(T * 5))


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(12)),
        shot(c(1) - 0.3, meet),
        shot(c(2) - 0.3, items),
        shot(c(3) - 0.3, profile, "fade", 0.25),
        shot(c(4) - 0.3, two_people),
        shot(c(5) - 0.3, knows),
    ]
    S.amb = [(c(1) - 0.3, c(3) - 0.3, "store_hum", 0.2)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(3) - 0.3, "card", 0.5), (c(4) - 0.3, "card", 0.4)]
    S.sfx += [(w(n, c(2)) - 0.1, "pop", 0.35) for n in ("water", "crackers", "chair")]
    S.music = [(c(1) - 0.3, S.dur, "hope", 0.45)]
