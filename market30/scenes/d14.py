"""День 14: Рут находит генератор в садовом отделе, ещё в коробке. Ты хочешь поставить его внутри, за запертой
дверью, чтобы не слышали. Рут против: угарный газ не видно и не слышно, в закрытой комнате убивает во сне.
Генератор — на крышу или никуда."""
import cairo

from scenes.kit import *

HERO = ST.HERO
RUTH = ST.RUTH
GC_HZ, GC_A = 650, 0.12
RF_HZ, RF_A = 480, 0.115


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


def gen_at(ctx, x, y, s):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    CD.icon_generator(ctx)
    ctx.restore()


def garden(ctx, T, S):
    """Садовый отдел: Рут откидывает клапан коробки — внутри генератор."""
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("garden_center", 1250, 1000, Keys((0, 1.15), (5, 1.22, "lin")))
    t_box = S.word("box", S.cue(1)) - 0.3
    with on(ctx, cam, l):
        paint(ctx, "garden_center")
        k = ease_out_back(clamp((T - t_box) / 0.4))
        if k > 0:
            gen_at(ctx, 980, 960 - 120 * k, 0.9)
            mask_bg(ctx, "garden_center", [(580, 1000), (1380, 1000), (1380, 1536), (580, 1536)])
        gy = 1480
        r = persp(gy, GC_A, GC_HZ)
        p = pose(T, 5, face="happy" if T > t_box else "neutral", look=(-0.4, -0.1),
                 h1=(1.3, -3.4) if T > t_box - 0.2 else (0.4, -2.5), h2=(0.0, -2.5))
        figure(ctx, 1640, gy, r, -1, p, RUTH, tint=("#f6e6c0", 0.06))


def inside_idea(ctx, T, S):
    """Лагерь: герой показывает на дверь — «поставим тут»; Рут качает головой."""
    l = T - (S.cue(2) - 0.3)
    t_no = S.word("no", S.cue(3)) - 0.15
    cam = PlateCam("base_camp", 1500, 1000, Keys((0, 1.12), (6, 1.18, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "base_camp")
        multiply(ctx, "#3a3046", 0.3)
        gen_at(ctx, 1630, 1395, 0.55)
        r = 118
        talk = S.cue(2) < T < S.cue(2, end=True)
        ph = pose(T, 3, face="talk" if talk else "neutral", look=(0.5, 0.0),
                  h1=(1.9, -5.4) if T < t_no else (0.4, -2.4), h2=(0.0, -2.4))
        figure(ctx, 2150, 1470, r, -1, ph, HERO, tint=("#ffcf8a", 0.1))
        shake = math.sin((T - t_no) * 14) * 0.45 * clamp(1 - (T - t_no) / 1.1) if T > t_no else 0.0
        pr = pose(T, 5, face="angry" if T > t_no else "neutral", look=(0.5 + shake, 0.0), head=(shake * 0.25, 0.0),
                  h1=(0.9, -3.0), h2=(0.6, -3.1))
        figure(ctx, 1150, 1470, r, 1, pr, RUTH, tint=("#ffcf8a", 0.1))


def co_card(ctx, T, S):
    l = T - (S.word("generators", S.cue(3)) - 0.3)
    CD.rule_card(ctx, l, CD.icon_co, "CARBON MONOXIDE", "You can't see it. You can't smell it.\nIn a closed room, it kills you in your sleep.")


def sleep_haze(ctx, T, S):
    """Закрытая комната ночью: оба спят, генератор тарахтит, серая дымка ползёт по полу."""
    l = T - (S.cue(4) - 0.3)
    cam = PlateCam("base_camp", 1400, 1180, Keys((0, 1.35), (4, 1.42, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "base_camp")
        multiply(ctx, "#20263a", 0.78)
        gen_at(ctx, 700, 1330, 0.6)
        p = pose(T, 3, face="sleep")
        lying(ctx, 2050, 1440, 70, p, HERO, tint=("#3a4868", 0.45), bag="#3a6aa8")
        p2 = pose(T, 5, face="sleep")
        lying(ctx, 1620, 1500, 70, p2, RUTH, tint=("#3a4868", 0.45), bag="#7a5a9a")
        for k in range(10):
            u = clamp(l / 3.0)
            x = 700 + k * 160 * u + 40 * math.sin(T + k)
            y = 1360 + 30 * math.sin(T * 0.8 + k * 1.3)
            D.ellipse(ctx, x, y, 170, 60, hexrgb("#9aa0aa"), None, 0, alpha=0.18 * u)


def roof_place(ctx, T, S):
    """Крыша на закате: генератор стоит на воздухе."""
    l = T - (S.cue(5) - 0.3)
    cam = PlateCam("roof", 1500, 900, Keys((0, 1.1), (4, 1.04, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "roof")
        gen_at(ctx, 1500, 1200, 0.9)
        for k in range(3):                                          # выхлоп уходит в небо
            u = (T * 0.4 + k / 3) % 1.0
            D.circle(ctx, 1680 + u * 120, 1060 - u * 380, 30 + u * 60, hexrgb("#b8bcc4"), None, 0,
                     alpha=0.35 * (1 - u))
        gy = 1420
        r = persp(gy, RF_A, RF_HZ)
        p = pose(T, 5, face="determined", look=(-0.4, 0.0), h1=(0.3, -2.4), h2=(-0.2, -2.45))
        figure(ctx, 2050, gy, r, -1, p, RUTH, tint=("#ffb27a", 0.1))
    D.rrect(ctx, W / 2 - 330, 80, 660, 110, 18, hexrgb("#f3f0e8"), INK, 5, alpha=clamp(l / 0.3))
    D.text(ctx, "STORE RULE 3", W / 2, 128, 40, "Inter", hexrgb("#24252a"), bold=True, alpha=clamp(l / 0.3))
    D.text(ctx, "Engines live outside.", W / 2, 172, 32, "Inter", hexrgb("#6d6e73"), alpha=clamp(l / 0.3))


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(14)),
        shot(c(1) - 0.3, garden),
        shot(c(2) - 0.3, inside_idea),
        shot(w("generators", c(3)) - 0.3, co_card, "fade", 0.25),
        shot(c(4) - 0.3, sleep_haze),
        shot(c(5) - 0.3, roof_place),
    ]
    S.amb = [(c(1) - 0.3, c(2) - 0.3, "store_hum", 0.15), (c(4) - 0.3, c(5) - 0.3, "generator", 0.45),
             (c(5) - 0.3, S.dur, "wind_loop", 0.45), (c(5) - 0.3, S.dur, "generator", 0.2)]
    S.sfx = [(0.0, "day_hit", 0.7), (w("box", c(1)) - 0.3, "cardboard", 0.5),
             (w("generators", c(3)) - 0.3, "card", 0.5)]
    S.music = [(c(1) - 0.3, w("generators", c(3)) - 0.3, "hope", 0.45),
               (w("generators", c(3)) - 0.3, c(5) - 0.3, "dread", 0.5), (c(5) - 0.3, S.dur, "wonder", 0.5)]
