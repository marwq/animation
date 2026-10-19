"""День 25: Рут перебирает связку ключей Дейла. Один подходит к рефрижератору у погрузки — стоит там с нулевого
дня. Полбака дизеля, мёртвый аккумулятор. Генератор на крыше может его зарядить: четыре часа за ночь, кабель
через люк. Впервые за 25 дней есть выход."""
import cairo

from scenes.kit import *

HERO = ST.HERO
RUTH = ST.RUTH
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


def keys_close(ctx, T, S):
    """Крупно: Рут в очках перебирает ключи; связка покачивается, ключи щёлкают по одному."""
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("base_camp", 1600, 900, 1.6)
    blur_plate(ctx, "base_camp", cam, 0, 0.7, darken=0.1)
    x, gy, r = 820, H + 640, 210
    kx, ky = 1250, 600
    p = pose(T, 5, face="think", look=(0.6, 0.0), h1=((kx - 40 - x) / r, (ky + 40 - gy) / r),
             h2=((kx + 80 - x) / r, (ky + 180 - gy) / r))
    figure(ctx, x, gy, r, 1, p, RUTH, tint=("#ffcf8a", 0.08))
    keyring(ctx, kx, ky, 170, T * (1.0 + 0.6 * ((int(l / 0.6)) % 2)), 0.9)


def truck_key(ctx, T, S):
    """Погрузка ночью: герой у кабины рефрижератора вставляет ключ — подходит."""
    l = T - (S.cue(2) - 0.3)
    t_fit = S.word("fits", S.cue(2))
    cam = PlateCam("dock_truck", 1700, 950, Keys((0, 1.25), (6, 1.32, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "dock_truck")
        multiply(ctx, "#2a3048", 0.35)
        gy = 1330
        r = 54
        x = 2230
        p = pose(T, 3, face="happy" if T > t_fit + 0.3 else "neutral", look=(-0.5, -0.3),
                 h1=(1.3, -4.2), h2=(0.0, -2.4))
        J = figure(ctx, x, gy, r, -1, p, HERO, tint=("#5a6888", 0.2))
        hx, hy = at(J, x, gy, r, -1, "h1")
        keyring(ctx, hx, hy + 12, 22, T, 0.3)
        if T > t_fit:
            a = clamp((T - t_fit) / 0.2) * clamp((t_fit + 1.0 - T) / 0.3)
            for k in range(6):
                ang = k * math.pi / 3
                D.line(ctx, hx + math.cos(ang) * 22, hy + math.sin(ang) * 22, hx + math.cos(ang) * 46,
                       hy + math.sin(ang) * 46, hexrgb("#ffe27a"), 6, a)


def gauges(ctx, T, S):
    l0 = S.cue(3) - 0.3
    CD.bar_card(ctx, T - l0, "THE TRUCK",
                [("Diesel", 50, "half a tank", "#e2b33a"), ("Battery", 4, "dead", "#c8392f")], 100,
                "Parked at the dock since day zero")


def charge(ctx, T, S):
    """Крыша ночью: генератор, кабель уходит в люк; огонёк зарядки мигает."""
    l = T - (S.cue(4) - 0.3)
    cam = PlateCam("roof", 1250, 1050, Keys((0, 1.3), (5, 1.38, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "roof")
        multiply(ctx, "#1c2440", 0.72)
        ctx.save()
        ctx.translate(1500, 1200)
        ctx.scale(0.9, 0.9)
        CD.icon_generator(ctx)
        ctx.restore()
        D.curve(ctx, [(1640, 1290), (1450, 1360), (1200, 1330), (1060, 1270)], INK, 14)
        D.curve(ctx, [(1640, 1290), (1450, 1360), (1200, 1330), (1060, 1270)], hexrgb("#3a3c42"), 8)
        on_ = (T % 1.0) < 0.5
        D.circle(ctx, 1590, 1130, 16, hexrgb("#7cf09a") if on_ else hexrgb("#2a4a32"), INK, 4)
        if on_:
            fx.glow(ctx, 1590, 1130, 90, "#7cf09a", 0.4)
        for k in range(3):
            u = (T * 0.4 + k / 3) % 1.0
            D.circle(ctx, 1680 + u * 120, 1060 - u * 380, 30 + u * 60, hexrgb("#8a90a0"), None, 0, alpha=0.25 * (1 - u))
    D.rrect(ctx, W / 2 - 300, 70, 600, 100, 18, hexrgb("#f3f0e8"), INK, 5, alpha=clamp(l / 0.3))
    D.text(ctx, "4 HOURS A NIGHT", W / 2, 138, 50, "Inter", hexrgb("#24252a"), bold=True, alpha=clamp(l / 0.3))


def way_out(ctx, T, S):
    """Оба смотрят на грузовик у погрузки: впервые есть выход."""
    l = T - (S.cue(5) - 0.3)
    cam = PlateCam("dock_truck", 1450, 900, Keys((0, 1.0), (5, 1.08, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "dock_truck")
        multiply(ctx, "#2a3048", 0.3)
        fx.glow(ctx, 1500, 860, 700, "#ffd9a0", 0.12 + 0.05 * math.sin(T * 2))
        gy = 1440
        r = 60
        p = ST.front(T, 3)
        p.update(view="back", h1=(0.6, -2.4), h2=(-0.6, -2.4))
        figure(ctx, 1150, gy, r, 1, p, HERO, tint=("#5a6888", 0.2))
        q = ST.front(T, 5)
        q.update(view="back", h1=(0.6, -2.4), h2=(-0.6, -2.4))
        figure(ctx, 1010, gy + 10, r * 0.97, 1, q, RUTH, tint=("#5a6888", 0.2))


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(25)),
        shot(c(1) - 0.3, keys_close),
        shot(c(2) - 0.3, truck_key),
        shot(c(3) - 0.3, gauges),
        shot(c(4) - 0.3, charge),
        shot(c(5) - 0.3, way_out),
    ]
    S.amb = [(c(2) - 0.3, c(3) - 0.3, "crickets", 0.5), (c(4) - 0.3, c(5) - 0.3, "generator", 0.35),
             (c(5) - 0.3, S.dur, "crickets", 0.45)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(1) + 0.3, "keys", 0.5), (c(1) + 1.2, "keys", 0.4),
             (w("fits", c(2)), "lock_click", 0.7), (c(3) - 0.3, "card", 0.5)]
    S.music = [(c(1) - 0.3, c(5) - 0.3, "mystery", 0.45), (c(5) - 0.3, S.dur, "hope", 0.6)]
