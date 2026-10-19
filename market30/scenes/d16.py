"""День 16: лестница на складе, люк на крышу. Внизу весь город: парковка полна, шоссе полно, над больницей дым.
Здесь тебя не видно, здесь можно дышать. Генератор поднимаешь по частям."""
import cairo

from scenes.kit import *

HERO = ST.HERO
RUTH = ST.RUTH
RF_HZ, RF_A = 480, 0.115
HATCH = (1020, 1250)                          # центр проёма люка


def shot(start, fn, trans="cut", tlen=0.3):
    return Shot(start, lambda ctx, t, S, f=fn, s0=start: f(ctx, s0 + t, S), trans, tlen)


def dots(ctx, T, pts, seed=0, s=6):
    """Крошечные зелёные силуэты (толпа вдали)."""
    r_ = rng(seed)
    for (x0, y0, x1, y1, n) in pts:
        for i in range(n):
            x = r_.uniform(x0, x1) + math.sin(T * 0.6 + i) * 3
            y = r_.uniform(y0, y1)
            D.line(ctx, x, y, x, y - s * 2.2, hexrgb("#4f5f46"), s * 0.6)
            D.circle(ctx, x, y - s * 2.8, s * 0.8, hexrgb("#8fa07a"), None, 0)


def smoke(ctx, T, x, y, n=7, scale=1.0):
    for k in range(n):
        u = (T * 0.12 + k / n) % 1.0
        D.circle(ctx, x + u * 260 * scale + math.sin(T + k) * 15, y - u * 420 * scale, (30 + u * 110) * scale,
                 hexrgb("#3a3a40"), None, 0, alpha=0.45 * (1 - u))


def climb(ctx, T, S):
    """Из люка поднимается голова героя: щурится от света."""
    l = T - (S.cue(1) - 0.3)
    t_push = S.word("push", S.cue(1)) - 0.1
    cam = PlateCam("roof", 1100, 1050, Keys((0, 1.7), (5, 1.6, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "roof")
        hx, hy = HATCH
        k = smooth(clamp((T - t_push) / 1.4))
        r = 52
        gy = hy + 4.6 * r - k * 3.6 * r
        ctx.save()
        ctx.rectangle(0, 0, 2720, hy + 20)
        ctx.clip()
        p = pose(T, 3, face="happy" if k > 0.8 else "neutral", look=(0.4, -0.3), h1=(0.9, -6.0 + 0.4 * k),
                 h2=(-0.9, -6.0 + 0.4 * k), view="front")
        p.update(ST.front(T, 3))
        p.update(face="happy" if k > 0.8 else "neutral", h1=(0.9, -5.6 + 1.2 * k), h2=(-0.9, -5.6 + 1.2 * k))
        figure(ctx, hx, gy, r, 1, p, HERO, tint=("#ffb27a", 0.08))
        ctx.restore()


def town(ctx, T, S):
    """Панорама: парковка, шоссе — всё полно; дымит больница."""
    l = T - (S.cue(2) - 0.3)
    d = S.cue(3) - S.cue(2)
    cam = PlateCam("roof", Keys((0, 900), (d, 1700, "io")), 520, 2.0)
    with on(ctx, cam, l):
        paint(ctx, "roof")
        dots(ctx, T, [(800, 560, 2400, 640, 90), (1700, 480, 2700, 540, 50)], seed=3, s=5)
    for txt, w_, y in (("THE PARKING LOT", "parking", 140), ("THE HIGHWAY", "highway", 140)):
        tw = S.word(w_, S.cue(2)) - 0.1
        if tw <= T < tw + 1.6:
            a = clamp((T - tw) / 0.2) * clamp((tw + 1.6 - T) / 0.2)
            D.text(ctx, txt, W / 2, y, 64, "Inter", hexrgb("#f7f3ea"), bold=True, stroke=INK, slw=7, alpha=a)


def hospital(ctx, T, S):
    l = T - (S.cue(3) - 0.3)
    cam = PlateCam("roof", 2150, 340, Keys((0, 2.6), (4, 2.85, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "roof")


def breathe(ctx, T, S):
    """Сидит у парапета, закат, ветер; глубокий вдох."""
    l = T - (S.cue(4) - 0.3)
    t_breathe = S.word("breathe", S.cue(4)) - 0.2
    cam = PlateCam("roof", 2000, 640, Keys((0, 2.0), (5, 2.1, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "roof")
        gy = 805
        r = persp(gy, RF_A, RF_HZ)
        big = math.sin(clamp((T - t_breathe) / 1.4) * math.pi) if T > t_breathe else 0.0
        p = sit(T, 3, face="sleep" if big > 0.3 else "happy", look=(0.3, -0.3), h1=(1.0, -1.6), h2=(0.8, -1.4),
                lean=-0.12 - 0.1 * big)
        figure(ctx, 1980, gy, r, 1, p, HERO, tint=("#ffb27a", 0.1))


def carry(ctx, T, S):
    """Носит генератор по частям: из люка к кондиционеру, туда-обратно."""
    l = T - (S.cue(5) - 0.3)
    cam = PlateCam("roof", 1500, 1000, Keys((0, 1.05), (4, 1.1, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "roof")
        n_done = int(l / 1.6)
        for i in range(min(n_done, 3)):                              # уже принесённые части
            D.rrect(ctx, 1720 + i * 120, 1400 - i * 12, 110, 80, 10, hexrgb(["#e2b33a", "#3a3c42", "#c8392f"][i]),
                    INK, 5)
        gy = 1480
        r = persp(gy, RF_A, RF_HZ)
        u = (l / 1.6) % 1.0
        go = u < 0.5
        k = smooth(u / 0.5) if go else smooth((1 - u) / 0.5)
        x = lerp(1330, 1620, k)
        f = 1 if go else -1
        p = pose(T, 3, face="determined", look=(0.5, 0.0))
        p.update(ST.gait(l * 1.6))
        if go:
            p.update(h1=(0.9, -3.4), h2=(0.6, -3.5))
        J = figure(ctx, x, gy, r, f, p, HERO, tint=("#ffb27a", 0.1))
        if go:
            hx, hy = at(J, x, gy, r, f, "h1")
            D.rrect(ctx, hx - 40, hy - 20, 110, 80, 10, hexrgb(["#e2b33a", "#3a3c42", "#c8392f"][n_done % 3]), INK, 5)


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(16)),
        shot(c(1) - 0.3, climb),
        shot(c(2) - 0.3, town),
        shot(c(3) - 0.3, hospital),
        shot(c(4) - 0.3, breathe),
        shot(c(5) - 0.3, carry),
    ]
    S.amb = [(c(1) - 0.3, S.dur, "wind_loop", 0.5), (c(2) - 0.3, c(4) - 0.3, "groans", 0.35)]
    S.sfx = [(0.0, "day_hit", 0.7), (w("push", c(1)) - 0.1, "hatch_bang", 0.5), (c(1) - 0.2, "ladder", 0.5)]
    S.music = [(c(1) - 0.3, S.dur, "wonder", 0.55)]
