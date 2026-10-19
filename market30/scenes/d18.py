"""День 18: Рут проверяет каждую банку. Вздулась, течёт, шипит при вскрытии — в мусор. Ботулизму всё равно,
насколько ты голоден; хватит одной банки. Девять банок в мусор — и это больнее, чем должно быть."""
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


def small_can(ctx, x, y, s, ang=0.0, bulge=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s / 300, s / 300)
    if bulge > 0.5:
        CD.icon_can_bulge(ctx)
    else:
        CD.icon_can_big(ctx)
    ctx.restore()


def inspect(ctx, T, S):
    """Крупно: Рут в очках вертит банку у самого лица."""
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("base_camp", 1600, 900, 1.6)
    blur_plate(ctx, "base_camp", cam, 0, 0.7, darken=0.15)
    x, gy, r = 900, H + 640, 210
    cx, cy = 1240, 560
    p = pose(T, 5, face="think", look=(0.6, 0.0), h1=((cx - 60 - x) / r, (cy + 90 - gy) / r),
             h2=((cx + 40 - x) / r, (cy + 120 - gy) / r))
    figure(ctx, x, gy, r, 1, p, RUTH, tint=("#ffcf8a", 0.08))
    small_can(ctx, cx, cy, 260, 0.35 * math.sin(T * 1.6))


def checks(ctx, T, S):
    l0 = S.cue(2) - 0.3
    w = S.word
    times = [w("bulging", S.cue(2)) - l0, w("leaking", S.cue(2)) - l0, w("hisses", S.cue(2)) - l0]
    CD.cream(ctx)
    D.text(ctx, "THROW IT OUT IF IT'S…", W / 2, 260, 58, "Inter", hexrgb("#24252a"), bold=True,
           alpha=clamp((T - l0) / 0.3))
    for i, (ic, lab) in enumerate(((CD.icon_can_bulge, "Bulging"), (CD.icon_leak, "Leaking"),
                                   (CD.icon_hiss, "Hissing"))):
        x = W / 2 + (i - 1) * 470
        CD.icon_at(ctx, ic, x, 560, 0.75, T - l0, times[i])
        a = clamp((T - l0 - times[i]) / 0.3)
        D.text(ctx, lab, x, 820, 46, "Inter", hexrgb("#c8392f"), bold=True, alpha=a)


def rule4(ctx, T, S):
    l = T - (S.cue(3) - 0.3)
    CD.rule_card(ctx, l, CD.icon_can_bulge, "STORE RULE 4", "Botulism doesn't care how hungry you are.\nOne bad can is enough.")
    k = ease_out_back(clamp((l - 0.6) / 0.3))
    if k > 0:
        ctx.save()
        ctx.translate(W / 2, 400)
        ctx.scale(k, k)
        D.line(ctx, -150, -150, 150, 150, hexrgb("#c8392f"), 28)
        D.line(ctx, -150, 150, 150, -150, hexrgb("#c8392f"), 28)
        ctx.restore()


def bin_drop(ctx, T, S):
    """Крупно: банки одна за другой летят в мусорный бак; счётчик до 9."""
    l = T - (S.cue(4) - 0.3)
    cam = PlateCam("base_camp", 400, 1250, 2.2)
    blur_plate(ctx, "base_camp", cam, 0, 0.7, darken=0.2)
    bx, by = W / 2, 700
    D.poly(ctx, [(bx - 260, by - 150), (bx + 260, by - 150), (bx + 210, by + 380), (bx - 210, by + 380)],
           hexrgb("#6f8a8e"), INK, 9, wob=0)
    for k in range(4):
        D.line(ctx, bx - 160 + k * 105, by - 100, bx - 140 + k * 95, by + 340, hexrgb("#5a7276"), 6)
    D.rrect(ctx, bx - 280, by - 175, 560, 50, 14, hexrgb("#7d989c"), INK, 8)
    n = 0
    for i in range(9):
        t0 = 0.25 + i * 0.32
        u = (l - t0) / 0.35
        if u >= 1:
            n += 1
        elif u > 0:
            x = bx - 200 + (i % 3) * 200
            y = lerp(-120, by - 160, u * u)
            small_can(ctx, x, y, 150, u * 3 + i, bulge=1 if i % 2 else 0)
    if n > 0:
        D.text(ctx, str(n), bx + 470, 520, 190, "Inter", hexrgb("#c8392f"), bold=True, stroke=INK, slw=10)


def hurts(ctx, T, S):
    l = T - (S.cue(5) - 0.3)
    cam = PlateCam("base_camp", 1500, 1000, Keys((0, 1.3), (4, 1.36, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "base_camp")
        multiply(ctx, "#3a3046", 0.35)
        r = 118
        ph = seated(T, 3, face="sad", look=(0.2, 0.4), h1=(1.0, -2.3), h2=(0.8, -2.25), lean=0.2)
        figure(ctx, 1980, 1344, r, -1, ph, HERO, tint=("#ffcf8a", 0.12))
        pr = seated(T, 5, face="sad", look=(0.5, 0.1), h1=(1.6, -3.1), h2=(1.0, -2.6))
        figure(ctx, 1240, 1344, r, 1, pr, RUTH, tint=("#ffcf8a", 0.12))
        fx.glow(ctx, 1620, 870, 420, "#ffcf7a", 0.18 + 0.03 * math.sin(T * 5))


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(18)),
        shot(c(1) - 0.3, inspect),
        shot(c(2) - 0.3, checks),
        shot(c(3) - 0.3, rule4),
        shot(c(4) - 0.3, bin_drop),
        shot(c(5) - 0.3, hurts),
    ]
    S.sfx = [(0.0, "day_hit", 0.7), (c(3) - 0.3, "card", 0.5)]
    S.sfx += [(w(x, c(2)), "pop", 0.4) for x in ("bulging", "leaking", "hisses")]
    S.sfx += [(c(4) - 0.3 + 0.6 + i * 0.32, "can_bin", 0.55) for i in range(9)]
    S.music = [(c(1) - 0.3, S.dur, "lonely", 0.5)]
