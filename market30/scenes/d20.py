"""День 20: крысы. Пришли на запах и теперь живут в проходе с хлопьями. Картон и пластик — теперь их, металл и
стекло — твоё. Моешь холодильные контейнеры и запечатываешь в них рис. Рут делает ловушку из ведра и банки —
к утру в ней четыре."""
import cairo

from scenes.kit import *

HERO = ST.HERO
RUTH = ST.RUTH
CE_HZ, CE_A = 330, 0.1


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


def rat(ctx, x, y, s, f, T, run=True):
    """Крыса сбоку: f — направление; лапки семенят."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(f * s / 300, s / 300)
    ctx.scale(-1, 1)                           # значок смотрит влево
    if run:
        ctx.translate(0, -abs(math.sin(T * 22)) * 12)
    CD.icon_rat(ctx)
    ctx.restore()


def aisle(ctx, T, S):
    """Проход с хлопьями: крысы шмыгают по полу; герой отшатывается."""
    l = T - (S.cue(1) - 0.3)
    t_rats = S.word("rats", S.cue(1)) - 0.1
    cam = PlateCam("cereal_aisle", 1400, 950, Keys((0, 1.05), (6, 1.1, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "cereal_aisle")
        multiply(ctx, "#3a4050", 0.3)
        for i, (y, sp, d0, s) in enumerate(((1100, 700, 0.0, 130), (1250, 900, 0.7, 160), (900, 520, 1.3, 100),
                                            (1380, 800, 2.1, 180), (1000, 600, 2.9, 115))):
            u = T - t_rats - d0
            if u > 0:
                f = 1 if i % 2 else -1
                x = (600 if f > 0 else 2200) + f * ((u * sp) % 2200)
                rat(ctx, x, y, s, f, T)
        gy = 1480
        r = persp(gy, CE_A, CE_HZ)
        scared = T > t_rats
        p = pose(T, 3, face="scared" if scared else "neutral", look=(-0.3, 0.6), sweat=scared)
        if scared:
            p.update(h1=(0.9, -4.6), h2=(0.5, -4.4), lean=-0.15, f1=(0.6, 0.0), f2=(-0.45, 0.0))
        figure(ctx, 2050, gy - (0.3 * r * math.sin(clamp((T - t_rats) / 0.3) * math.pi) if scared else 0), r, -1,
               p, HERO, tint=("#9aa6bc", 0.15))


def theirs_yours(ctx, T, S):
    l0 = S.cue(2) - 0.3
    t_r = S.word("anything", S.word("theirs", S.cue(2))) - l0
    CD.split_card(ctx, T - l0, "WHO OWNS THE FOOD",
                  ("THEIRS", "#c8392f", [CD.icon_box, CD.icon_bag]), ("YOURS", "#3f7d4e", [CD.icon_can_big, CD.icon_jar]),
                  "Rats chew through cardboard and plastic.", t_right=t_r)


def bins(ctx, T, S):
    """Лагерь: герой засыпает рис из мешка в контейнер; крышка защёлкивается."""
    l = T - (S.cue(3) - 0.3)
    t_seal = S.word("seal", S.cue(3)) - 0.1
    cam = PlateCam("base_camp", 1500, 1100, Keys((0, 1.4), (4, 1.46, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "base_camp")
        multiply(ctx, "#3a3046", 0.3)
        bx, by = 1420, 1430
        D.rrect(ctx, bx - 190, by - 220, 380, 220, 26, hexrgb("#3f8fd0"), INK, 7)
        D.rect(ctx, bx - 175, by - 205, 350, 60, hexrgb("#f1e6c4"), None, 0, wob=0, alpha=clamp(l / 2.0))
        lid = smooth(clamp((T - t_seal) / 0.3))
        ly = lerp(by - 420, by - 232, lid)
        D.rrect(ctx, bx - 205, ly, 410, 46, 16, hexrgb("#f4f6f8"), INK, 7)
        x, gy, r = 1880, 1500, 120
        pouring = T < t_seal - 0.2
        p = pose(T, 3, face="determined", look=(0.6, 0.4),
                 h1=(2.6, -4.2) if pouring else (0.4, -2.4), h2=(2.2, -3.4) if pouring else (0.0, -2.4), lean=0.15)
        J = figure(ctx, x, gy, r, -1, p, HERO, tint=("#ffcf8a", 0.1))
        if pouring:
            hx, hy = at(J, x, gy, r, -1, "h1")
            ctx.save()
            ctx.translate(hx - 40, hy - 10)
            ctx.rotate(-1.9)
            ctx.scale(0.45, 0.45)
            CD.icon_sack(ctx)
            ctx.restore()
            for k in range(14):
                u = (T * 2.0 + k / 14) % 1.0
                D.ellipse(ctx, hx - 150 + math.sin(k) * 14, hy + 20 + u * (by - 200 - hy - 20), 6, 4,
                          hexrgb("#f7f0dc"), INK, 1.5)


def trap(ctx, T, S):
    """Ловушка: ведро, банка на проволоке; утро — счётчик крыс до 4."""
    l = T - (S.cue(4) - 0.3)
    t_four = S.word("four", S.cue(4)) - 0.1
    cam = PlateCam("base_camp", 400, 1250, 2.2)
    blur_plate(ctx, "base_camp", cam, 0, 0.7, darken=0.1)
    bx, by = W / 2 - 160, 620
    D.poly(ctx, [(bx - 230, by - 150), (bx + 230, by - 150), (bx + 180, by + 330), (bx - 180, by + 330)],
           hexrgb("#d9534a"), INK, 9, wob=0)
    D.ellipse(ctx, bx, by - 150, 230, 50, hexrgb("#3a2a2a"), INK, 9)
    D.line(ctx, bx - 280, by - 160, bx + 280, by - 160, hexrgb("#9aa0a8"), 7)
    rot = T * 6 if T < t_four - 1.0 else 0
    ctx.save()
    ctx.translate(bx, by - 165)
    ctx.scale(0.32 * max(0.25, abs(math.cos(rot))), 0.32)
    CD.icon_can_big(ctx)
    ctx.restore()
    D.line(ctx, bx - 520, by + 330, bx - 210, by - 150, INK, 30)                 # дощечка-трап
    D.line(ctx, bx - 520, by + 330, bx - 210, by - 150, hexrgb("#c9a26a"), 20)
    if T > t_four - 1.0:
        n = min(4, int((T - (t_four - 1.0)) / 0.25) + 1)
        for i in range(n):
            ctx.save()
            ctx.translate(W / 2 + 420 + (i % 2) * 260, 380 + (i // 2) * 230)
            ctx.scale(0.55, 0.55)
            CD.icon_rat(ctx)
            ctx.restore()
        if T > t_four:
            D.text(ctx, "4", W / 2 + 560, 900, 170, "Inter", hexrgb("#c8392f"), bold=True, stroke=INK, slw=10)


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(20)),
        shot(c(1) - 0.3, aisle),
        shot(c(2) - 0.3, theirs_yours),
        shot(c(3) - 0.3, bins),
        shot(c(4) - 0.3, trap),
    ]
    S.amb = [(c(1) - 0.3, c(2) - 0.3, "rats", 0.7)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(2) - 0.3, "card", 0.5), (w("seal", c(3)) + 0.1, "lock_click", 0.5),
             (w("four", c(4)) - 1.0, "pop", 0.4), (w("four", c(4)), "pop", 0.5)]
    S.music = [(c(1) - 0.3, c(2) - 0.3, "tension", 0.45), (c(2) - 0.3, S.dur, "fun", 0.35)]
