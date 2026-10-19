"""День 7: что-то стучит в ворота погрузки. Не сильно — ровно, всю ночь. Сталь проводит звук: слышишь их ты —
слышат и тебя. Стена из мешков собачьего корма в шесть рядов; по складу — только в носках."""
import cairo

from scenes.kit import *

HERO = ST.HERO
DK_HZ, DK_A = 760, 0.185                      # dock_door
DOOR = (900, 300, 1822, 1146)
STK_HZ, STK_A = 700, 0.188


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


KNOCK = 0.95


def knocks(S, t0, t1):
    out, t = [], t0
    while t < t1:
        out.append(t)
        t += KNOCK
    return out


def door_shake(T, S):
    """Сдвиг створки от последнего стука."""
    t0 = S.cue(1) + 0.4
    if T < t0:
        return 0.0
    u = (T - t0) % KNOCK
    return 5 * math.exp(-u * 18) * math.sin(u * 90)


def dock(ctx, T, S, cam, l, bags=0.0, hero=None):
    with on(ctx, cam, l):
        paint(ctx, "dock_door")
        dx = door_shake(T, S)
        if abs(dx) > 0.2:
            x0, y0, x1, y1 = DOOR
            ctx.save()
            ctx.rectangle(x0, y0, x1 - x0, y1 - y0)
            ctx.clip()
            ctx.translate(dx, 0)
            paint(ctx, "dock_door")
            ctx.restore()
        # пыль сыплется с короба ворот после каждого стука
        t0 = S.cue(1) + 0.4
        if T > t0:
            u = (T - t0) % KNOCK
            for k in range(9):
                px = 980 + k * 95 + 20 * math.sin(k * 3.1)
                py = 330 + u * (300 + 60 * (k % 3)) + 0.5 * 900 * u * u
                D.circle(ctx, px, py, 4 + (k % 3), hexrgb("#cfc6b4"), None, 0,
                         alpha=0.7 * (1 - u / KNOCK))
        # стена из мешков: ряды появляются по очереди
        rows = int(bags * 6 + 0.999)
        for row in range(rows):
            k = clamp(bags * 6 - row)
            n = 4 if row % 2 == 0 else 3
            for i in range(n):
                bx = 1360 + (i - (n - 1) / 2) * 235
                by = 1215 - row * 112 - (1 - ease_out(k)) * 60
                if k > 0:
                    dogfood(ctx, bx, by, 225, 112, seed=row * 7 + i)
        if hero:
            hero(ctx)
        multiply(ctx, "#3a4258", 0.45)


def knocking(ctx, T, S):
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("dock_door", 1360, 760, Keys((0, 1.0), (5, 1.12, "lin")))
    dock(ctx, T, S, cam, l)


def awake(ctx, T, S):
    """Всю ночь: лежит в спальнике на складе, глаза открыты; стук отдаётся в стенах."""
    l = T - (S.word("all", S.cue(1)) - 0.25)
    cam = PlateCam("stockroom", 1300, 1150, Keys((0, 1.7), (3, 1.78, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "stockroom")
        multiply(ctx, "#2e3448", 0.8)
        p = pose(T, 3, face="worried", look=(0.6, 0.0), blink=False, sweat=True)
        lying(ctx, 1650, 1380, 95, p, HERO, tint=("#4a5878", 0.4))
    u = (T - (S.cue(1) + 0.4)) % KNOCK
    if u < 0.12:
        fx.flash(ctx, 0.06, "#000000")


def rule2(ctx, T, S):
    l = T - (S.cue(2) - 0.3)
    CD.rule_card(ctx, l, CD.icon_ear, "STORE RULE 2", "If you can hear them,\nthey can hear you.")


def barricade(ctx, T, S):
    l = T - (S.cue(3) - 0.3)
    dur = S.cue(3, end=True) - S.cue(3) + 0.6
    bags = clamp(l / dur)
    cam = PlateCam("dock_door", 1360, 820, Keys((0, 1.12), (6, 1.05, "lin")))
    gy = 1440
    r = persp(gy, DK_A, DK_HZ)

    def hero(c):
        # носит мешок: ходит вдоль стены туда-обратно
        u = (l / 1.6) % 2.0
        k = u if u < 1 else 2 - u
        x = lerp(2060, 1840, smooth(k))
        f = -1 if u < 1 else 1
        p = pose(T, 3, face="determined", look=(0.4, 0.0))
        p.update(ST.gait(l * 1.2))
        p.update(h1=(0.75, -3.6), h2=(0.35, -3.7), lean=0.12)
        J = figure(c, x, gy, r, f, p, HERO, tint=("#4a5878", 0.3))
        hx, hy = at(J, x, gy, r, f, "h1")
        dogfood(c, hx + f * 10, hy + 45, 190, 100, seed=99)
    dock(ctx, T, S, cam, l, bags, hero)


def socks(ctx, T, S):
    """Крупно: ноги в носках крадутся по бетону; кеды остались в стороне."""
    l = T - (S.cue(4) - 0.3)
    cam = PlateCam("stockroom", 1400, 1380, 2.2)
    blur_plate(ctx, "stockroom", cam, 0, 0.55, darken=0.3)
    floor_y = 900
    # кеды
    for i, x in enumerate((330, 470)):
        D.rrect(ctx, x - 70, floor_y - 60, 150, 60, 26, hexrgb("#f2f2ee"), INK, 6)
        D.rect(ctx, x - 70, floor_y - 18, 150, 18, hexrgb("#c8392f"), INK, 5, wob=0)
        D.line(ctx, x - 20, floor_y - 58, x + 30, floor_y - 40, INK, 4)
    # шаги на цыпочках
    for k in (0, 1):
        ph = l * 1.1 + k * 0.5
        u = ph % 1.0
        lift = max(0.0, math.sin(u * math.pi * 2)) * 70
        x = 1000 + k * 260 + ((ph // 1) * 0) + 60 * math.sin(u * math.pi * 2 - 1.2)
        top = (x - 40, -40)
        foot = (x, floor_y - 30 - lift)
        D.line(ctx, top[0], top[1], foot[0], foot[1], INK, 22)
        D.rrect(ctx, foot[0] - 40, foot[1] - 30, 140, 62, 30, hexrgb("#9aa0aa"), INK, 6)
        D.line(ctx, foot[0] - 30, foot[1] - 22, foot[0] - 30, foot[1] + 25, hexrgb("#6a707a"), 6)
    D.ellipse(ctx, 1130, floor_y + 10, 300, 18, hexrgb("#000000"), None, 0, alpha=0.2)


def build(S):
    c, w = S.cue, S.word
    t_all = w("all", c(1)) - 0.25
    S.shots = [
        Shot(0, day_shot(7)),
        shot(c(1) - 0.3, knocking),
        shot(t_all, awake),
        shot(c(2) - 0.3, rule2, "fade", 0.25),
        shot(c(3) - 0.3, barricade),
        shot(c(4) - 0.3, socks),
    ]
    S.amb = [(c(1) - 0.3, c(3) - 0.3, "store_hum", 0.0)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(2) - 0.3, "card", 0.5), (c(4) - 0.3, "tiptoe", 0.6)]
    S.sfx += [(t, "knock", 0.7 if t < t_all else 0.4) for t in knocks(S, c(1) + 0.4, c(2) - 0.3)]
    S.sfx += [(t, "knock", 0.25) for t in knocks(S, c(3) - 0.3 + 0.2, c(3, end=True))]
    S.sfx += [(c(3) - 0.3 + 0.3 + k * 0.9, "bag_drop", 0.5) for k in range(6)]
    S.music = [(c(1) - 0.3, c(3) - 0.3, "dread", 0.6), (c(3) - 0.3, S.dur, "tension", 0.45)]
