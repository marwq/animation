"""Общее для сцен: импорты, фигуры на фоне, перспектива, реквизит."""
import math

from engine.core import W, H, FPS, TAU, Keys, clamp, lerp, smooth, ease_io, ease_out, ease_in, ease_out_back, \
    hexrgb, shade, mix, rng, noise1, fbm
from engine.film import Shot
from engine import draw as D
from engine import fx
from engine import stick as ST
from engine import cards as CD
from engine.plate import PlateCam, on, paint, kb, image

INK = ST.INK


def persp(y, a, hz):
    """Радиус головы фигуры, стоящей на полу в y: r = a·(y − горизонт)."""
    return max(8.0, a * (y - hz))


def pose(t, seed=0, **kw):
    """Стойка с дыханием и морганием + поля."""
    p = ST.stand(t, seed)
    p["blink"] = ST.blinking(t, seed)
    p["t"] = t
    p.update(kw)
    return p


def figure(ctx, x, gy, r, f, p, look, tint=None, alpha=1.0):
    lk = dict(look)
    if tint:
        lk["tint"] = tint
    return ST.draw(ctx, x, gy, r, f, p, lk, alpha)


def at(J, x, gy, r, f, key):
    return ST.world(x, gy, r, f, J[key])


def mask_bg(ctx, name, pts):
    """Перекрыть фигуру куском фона (стойка, прилавок): многоугольник в пикселях фона."""
    ctx.save()
    D.path(ctx, pts)
    ctx.clip()
    paint(ctx, name)
    ctx.restore()


def blur_plate(ctx, name, cam, t, amount=0.5, darken=0.0):
    """Фон «не в фокусе» для крупных планов: рисуем уменьшенную копию и растягиваем."""
    import cairo
    key = (name, "blur")
    if key not in _BLUR:
        src = image(name)
        w, h = src.get_width() // 8, src.get_height() // 8
        sm = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h)
        c = cairo.Context(sm)
        c.scale(w / src.get_width(), h / src.get_height())
        c.set_source_surface(src, 0, 0)
        c.get_source().set_filter(cairo.FILTER_BEST)
        c.paint()
        _BLUR[key] = sm
    sm = _BLUR[key]
    with on(ctx, cam, t):
        paint(ctx, name)
        ctx.save()
        ctx.scale(image(name).get_width() / sm.get_width(), image(name).get_height() / sm.get_height())
        ctx.set_source_surface(sm, 0, 0)
        ctx.get_source().set_filter(cairo.FILTER_BILINEAR)
        ctx.paint_with_alpha(amount)
        ctx.restore()
    if darken:
        fx.flash(ctx, darken, "#0b0c12")


_BLUR = {}


def shake(t, t0, amp=18, d=0.5):
    """Смещение кадра от удара в момент t0."""
    k = clamp((t - t0) / d)
    if t < t0 or k >= 1:
        return 0.0, 0.0
    e = (1 - k) ** 2
    return amp * e * math.sin((t - t0) * 70), amp * 0.6 * e * math.cos((t - t0) * 55)


# --- реквизит ---------------------------------------------------------------------------

def phone(ctx, x, y, s, ang=0.0, glow=0.0, screen="#c8392f"):
    """Телефон в руке: корпус, экран; glow — красное свечение тревоги."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    if glow > 0:
        fx.glow(ctx, 0, 0, s * 3.2, screen, 0.35 * glow)
    D.rrect(ctx, -s * 0.5, -s * 0.95, s, s * 1.9, s * 0.16, hexrgb("#24252b"), INK, max(2, s * 0.08))
    D.rrect(ctx, -s * 0.4, -s * 0.82, s * 0.8, s * 1.64, s * 0.1, mix(hexrgb("#1c1f2a"), hexrgb(screen), glow),
            None, 0)
    if glow > 0.2:
        warn(ctx, 0, -s * 0.15, s * 0.42, alpha=glow)
    ctx.restore()


def warn(ctx, x, y, s, alpha=1.0, fill="#ffffff", mark="#c8392f"):
    """Предупреждающий треугольник с «!»."""
    pts = [(x, y - s * 0.9), (x + s, y + s * 0.75), (x - s, y + s * 0.75)]
    ctx.save()
    D.path(ctx, pts)
    ctx.set_line_join(1)
    D.col(ctx, hexrgb(fill), alpha)
    ctx.fill_preserve()
    ctx.set_line_width(s * 0.12)
    ctx.stroke()
    D.line(ctx, x, y - s * 0.38, x, y + s * 0.22, hexrgb(mark), s * 0.2, alpha)
    D.circle(ctx, x, y + s * 0.5, s * 0.1, hexrgb(mark), None, 0, alpha=alpha)
    ctx.restore()


def keyring(ctx, x, y, s, t=0.0, swing=0.0):
    """Связка ключей на кольце; swing — покачивание."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(math.sin(t * 9) * 0.25 * swing)
    D.circle(ctx, 0, 0, s * 0.55, None, hexrgb("#c9c3b4"), s * 0.12)
    D.circle(ctx, 0, 0, s * 0.55, None, INK, s * 0.04)
    cols = ["#d9b54a", "#b9bcc2", "#d9b54a", "#9aa0a8", "#c58a3a"]
    for k, c in enumerate(cols):
        a = math.pi * 0.25 + k * 0.32 + math.sin(t * 7 + k) * 0.06 * swing
        ctx.save()
        ctx.translate(math.cos(a) * s * 0.55, math.sin(a) * s * 0.55)
        ctx.rotate(a - math.pi / 2)
        D.circle(ctx, 0, s * 0.18, s * 0.2, hexrgb(c), INK, s * 0.05)
        D.circle(ctx, 0, s * 0.18, s * 0.07, hexrgb("#f3efe6"), INK, s * 0.03)
        D.rect(ctx, -s * 0.07, s * 0.35, s * 0.14, s * 0.75, hexrgb(c), INK, s * 0.05, wob=0)
        for j in range(2):
            D.rect(ctx, s * 0.07, s * 0.6 + j * 0.2 * s, s * 0.1, s * 0.08, hexrgb(c), INK, s * 0.03, wob=0)
        ctx.restore()
    ctx.restore()


def note(ctx, x, y, s, alpha=1.0, double=False, fill="#fff3d6"):
    """Нота (радио играет): светлая с чернильным контуром — видна и на тёмном."""
    heads = [(x, y)] + ([(x + s * 0.8, y - s * 0.2)] if double else [])
    stems = [(x + s * 0.32, y - s * 0.08, x + s * 0.32, y - s * 1.1)]
    if double:
        stems += [(x + s * 1.12, y - s * 0.28, x + s * 1.12, y - s * 1.3),
                  (x + s * 0.32, y - s * 1.1, x + s * 1.12, y - s * 1.3)]
    else:
        stems += [(x + s * 0.32, y - s * 1.1, x + s * 0.62, y - s * 0.7)]
    for c, grow in ((INK, s * 0.09), (hexrgb(fill), 0.0)):
        for hx, hy in heads:
            D.ellipse(ctx, hx, hy, s * 0.36 + grow, s * 0.26 + grow, c, None, 0, alpha=alpha, rot=-0.4)
        for x0, y0, x1, y1 in stems:
            D.line(ctx, x0, y0, x1, y1, c, s * 0.12 + grow * 2, alpha)


def day_shot(n):
    """Чёрная карточка «DAY N» (план)."""
    return lambda ctx, t, S: CD.day_card(ctx, n, t)


def shamble(ph, seed=0):
    """Походка зомби: медленный шаг, руки вперёд, наклон, голова набок."""
    p = ST.gait(ph, run=False)
    a = ph * TAU
    p.update(lean=0.14, tilt=0.12 + 0.05 * math.sin(a + seed),
             h1=(1.9 + 0.12 * math.sin(a), -4.0 + 0.1 * math.cos(a)), h2=(1.6 + 0.12 * math.sin(a + 2), -3.75),
             mouth=0.6 + 0.3 * math.sin(a * 0.5 + seed))
    return p


def zombie_look(seed, tint=None):
    """Разные зомби: рубашка и волосы по seed."""
    r = rng(seed)
    shirts = ["#6f6a5c", "#5a6a7a", "#7a4f45", "#4f5f4a", "#8a7a5a", "#5c5470"]
    hair = ["#4a4a3a", "#3a3028", "#6b6050", None, "#2a2a2a"]
    lk = dict(ST.ZOMBIE, shirt=shirts[r.randrange(len(shirts))])
    h = hair[r.randrange(len(hair))]
    if h:
        lk["hair"] = h
    if tint:
        lk["tint"] = tint
    return lk


def clipboard(ctx, x, y, s, ang=0.0, lines=0):
    """Планшет с листом: lines — сколько строк уже записано."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    D.rrect(ctx, -s * 0.5, -s * 0.68, s, s * 1.36, s * 0.06, hexrgb("#b88a55"), INK, max(2, s * 0.04))
    D.rect(ctx, -s * 0.42, -s * 0.56, s * 0.84, s * 1.18, hexrgb("#f7f4ea"), INK, max(1.5, s * 0.025), wob=0)
    D.rrect(ctx, -s * 0.2, -s * 0.74, s * 0.4, s * 0.16, s * 0.04, hexrgb("#9aa0a8"), INK, max(1.5, s * 0.03))
    for k in range(lines):
        y0 = -s * 0.38 + k * s * 0.16
        D.line(ctx, -s * 0.32, y0, s * (0.05 + 0.2 * ((k * 7) % 3) / 2), y0, hexrgb("#3a3c44"), max(1.5, s * 0.03))
    ctx.restore()


def pencil(ctx, x, y, s, ang=-0.6):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    D.rect(ctx, -s * 0.06, -s * 0.9, s * 0.12, s * 0.75, hexrgb("#f2c94c"), INK, max(1.5, s * 0.03), wob=0)
    D.poly(ctx, [(-s * 0.06, -s * 0.15), (s * 0.06, -s * 0.15), (0, 0)], hexrgb("#e8c9a0"), INK, max(1.5, s * 0.03),
           wob=0)
    ctx.restore()


def sit(t=0.0, seed=0, **kw):
    """Сидит на полу, ноги вперёд, спиной к стене/витрине."""
    p = pose(t, seed)
    p.update(hip=(0.0, 0.45), f1=(2.45, 0.0), f2=(2.15, -0.05), lean=-0.12, h1=(1.3, -1.4), h2=(1.0, -1.2))
    p.update(kw)
    return p


def tub(ctx, x, y, s, open_=True, empty=False, flavor="#f4c7d9"):
    """Ведёрко мороженого: s — высота."""
    w = s * 1.1
    ink = INK
    D.poly(ctx, [(x - w / 2, y - s / 2), (x + w / 2, y - s / 2), (x + w * 0.42, y + s / 2), (x - w * 0.42, y + s / 2)],
           hexrgb("#f7f2e6"), ink, max(2, s * 0.05), wob=0)
    D.rect(ctx, x - w * 0.47, y - s * 0.15, w * 0.94, s * 0.3, hexrgb("#6fb6e8"), None, 0, wob=0)
    D.circle(ctx, x, y, s * 0.13, hexrgb("#f2c84b"), ink, max(1.5, s * 0.03))
    D.ellipse(ctx, x, y - s / 2, w / 2, s * 0.12, hexrgb(flavor) if (open_ and not empty) else hexrgb("#e9e2d0"),
              ink, max(2, s * 0.05))
    if open_ and not empty:
        D.ellipse(ctx, x - w * 0.12, y - s * 0.52, w * 0.18, s * 0.05, hexrgb("#ffffff"), None, 0, alpha=0.6)


def spoon(ctx, x, y, s, ang=0.0, scoop=None):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    D.line(ctx, 0, 0, 0, -s, hexrgb("#c9ccd2"), max(3, s * 0.07))
    D.line(ctx, 0, 0, 0, -s, INK, max(1, s * 0.02))
    D.ellipse(ctx, 0, -s - s * 0.12, s * 0.12, s * 0.18, hexrgb("#d9dce1"), INK, max(1.5, s * 0.03))
    if scoop:
        D.circle(ctx, 0, -s - s * 0.16, s * 0.13, hexrgb(scoop), INK, max(1.5, s * 0.025))
    ctx.restore()


def flies(ctx, T, x, y, n=6, spread=120, seed=0, alpha=1.0, s=1.0):
    r = rng(seed)
    for i in range(n):
        a = T * (2 + r.random() * 2) + r.random() * TAU
        fx_ = x + math.cos(a) * spread * (0.4 + r.random() * 0.6) + math.sin(a * 2.7) * 20 * s
        fy_ = y + math.sin(a * 1.3) * spread * 0.5 * (0.4 + r.random() * 0.6)
        D.circle(ctx, fx_, fy_, 4 * s, INK, None, 0, alpha=alpha)
        wing = 5 * s * (0.6 + 0.4 * abs(math.sin(T * 40 + i)))
        D.ellipse(ctx, fx_ - 3 * s, fy_ - 4 * s, wing, 2.5 * s, hexrgb("#e8eef2"), None, 0, alpha=0.7 * alpha)
        D.ellipse(ctx, fx_ + 3 * s, fy_ - 4 * s, wing, 2.5 * s, hexrgb("#e8eef2"), None, 0, alpha=0.7 * alpha)


def stink(ctx, T, x, y, h=160, n=3, color="#8dbb4e", alpha=0.8, s=1.0):
    """Волны запаха — зелёные волнистые линии вверх."""
    for k in range(n):
        u = (T * 0.35 + k / n) % 1.0
        a = alpha * math.sin(u * math.pi)
        x0 = x + (k - (n - 1) / 2) * 40 * s
        pts = [(x0 + math.sin(u * 6 + j) * 14 * s, y - u * h * 0.3 - j * h / 6) for j in range(6)]
        D.curve(ctx, pts, hexrgb(color), 7 * s, a)


def lock_close(ctx, T, t_turn, bg_draw=None):
    """Крупно: ключ в замке поворачивается в t_turn."""
    if bg_draw:
        bg_draw(ctx)
    cx, cy = W / 2 + 120, H / 2 + 20
    D.rrect(ctx, cx - 150, cy - 230, 300, 460, 40, hexrgb("#b9bdc4"), INK, 8)
    D.circle(ctx, cx, cy - 40, 70, hexrgb("#d8dbe0"), INK, 7)
    D.rrect(ctx, cx - 18, cy - 70, 36, 60, 10, hexrgb("#2b2c30"), None, 0)
    k = smooth(clamp((T - t_turn) / 0.25))
    ctx.save()
    ctx.translate(cx, cy - 40)
    ctx.rotate(k * math.pi / 2)
    D.rrect(ctx, -14, -10, 28, 160, 6, hexrgb("#d9b54a"), INK, 5)
    D.circle(ctx, 0, 190, 62, hexrgb("#d9b54a"), INK, 7)
    D.circle(ctx, 0, 190, 22, hexrgb("#b9bdc4"), INK, 5)
    ctx.restore()
    # рука героя держит ключ
    hx, hy = cx + (90 if k > 0.5 else 0), cy + 150 - (90 if k > 0.5 else 0)
    D.line(ctx, -40, H + 40, hx - 60, hy + 40, INK, 26)
    D.circle(ctx, hx - 50, hy + 30, 26, INK, None, 0)


def dogfood(ctx, x, y, w, h, seed=0):
    """Мешок собачьего корма: (x, y) — центр низа."""
    r = rng(seed)
    c = ["#c8813a", "#b8452f", "#3f7d4e", "#c99a3a"][r.randrange(4)]
    D.rrect(ctx, x - w / 2, y - h, w, h, h * 0.25, hexrgb(c), INK, max(2, h * 0.05))
    D.rect(ctx, x - w * 0.42, y - h * 0.62, w * 0.84, h * 0.34, hexrgb("#f4ede0"), None, 0, wob=0)
    px, py, ps = x - w * 0.18, y - h * 0.45, h * 0.09        # лапка
    D.circle(ctx, px, py + ps * 0.5, ps, hexrgb("#5a3a2a"), None, 0)
    for k in range(4):
        D.circle(ctx, px - ps * 1.1 + k * ps * 0.75, py - ps * 0.7 - (k in (1, 2)) * ps * 0.3, ps * 0.38,
                 hexrgb("#5a3a2a"), None, 0)
    D.rect(ctx, x + w * 0.05, y - h * 0.52, w * 0.3, h * 0.06, hexrgb("#5a3a2a"), None, 0, wob=0)
    D.rect(ctx, x + w * 0.05, y - h * 0.4, w * 0.22, h * 0.05, hexrgb("#8a6a5a"), None, 0, wob=0)


def crouch(t=0.0, seed=0, **kw):
    """Пригнулся: таз низко, корпус вперёд."""
    p = pose(t, seed)
    p.update(hip=(0.0, 1.55), f1=(0.6, 0.0), f2=(-0.7, 0.0), lean=0.75, h1=(1.5, -2.2), h2=(1.2, -1.6))
    p.update(kw)
    return p


def lying(ctx, x, y, r, p, look, tint=None, bag="#3a6aa8"):
    """Лежит на полу на спине: ноги в (x, y), голова влево, лицо вверх; bag — спальник до шеи (None — без)."""
    ctx.save()
    ctx.translate(x, y - r * 0.5)
    ctx.rotate(-math.pi / 2)
    q = dict(p)
    q.setdefault("h1", (0.15, -3.0))
    q.setdefault("h2", (-0.1, -3.0))
    lk = dict(look, shadow=False)
    if tint:
        lk["tint"] = tint
    ST.draw(ctx, 0, 0, r, 1, q, lk)
    ctx.restore()
    if bag:
        D.rrect(ctx, x - r * 5.0, y - r * 1.25, r * 5.4, r * 1.2, r * 0.5, hexrgb(bag), INK, max(2, r * 0.08))
        D.line(ctx, x - r * 4.6, y - r * 0.65, x + r * 0.2, y - r * 0.65, shade(hexrgb(bag), -0.2), max(2, r * 0.06))


def roll_shutter(ctx, x0, y0, x1, y1, shake=0.0):
    """Закрытая рулонная ставня (ламели) в прямоугольнике; shake — дрожь от стука (смещение px)."""
    ctx.save()
    ctx.translate(shake, 0)
    D.rect(ctx, x0, y0, x1 - x0, y1 - y0, hexrgb("#7d858e"), INK, 6, wob=0)
    y = y0 + 22
    while y < y1 - 10:
        D.line(ctx, x0 + 3, y, x1 - 3, y, hexrgb("#575e66"), 4)
        D.line(ctx, x0 + 3, y + 5, x1 - 3, y + 5, hexrgb("#a3abb3"), 3)
        y += 28
    D.rect(ctx, x0 - 4, y1 - 26, x1 - x0 + 8, 30, hexrgb("#5d646c"), INK, 5, wob=0)
    D.rrect(ctx, (x0 + x1) / 2 - 70, y1 - 20, 140, 14, 7, hexrgb("#2f3338"), None, 0)
    ctx.restore()


def ripple(ctx, x, y, t, s=1.0):
    """Кольца удара (стук): t — время с момента удара."""
    if t < 0 or t > 0.6:
        return
    for k in range(3):
        rr = (30 + t * 260 + k * 30) * s
        a = max(0.0, 0.8 - t * 1.4 - k * 0.2)
        if a > 0:
            ctx.arc(x, y, rr, -0.9, 0.9)
            D.col(ctx, hexrgb("#f4f1e8"), a)
            ctx.set_line_width(6 * s)
            ctx.stroke()
            ctx.arc(x, y, rr, math.pi - 0.9, math.pi + 0.9)
            ctx.stroke()


def flashlight(ctx, x, y, ang, length=900, spread=0.32, alpha=0.35):
    """Луч фонарика (экранные или мировые координаты) — мягкий конус."""
    import cairo as _c
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    g = _c.LinearGradient(0, 0, length, 0)
    g.add_color_stop_rgba(0, 1.0, 0.95, 0.8, alpha)
    g.add_color_stop_rgba(1, 1.0, 0.95, 0.8, 0.0)
    ctx.move_to(0, 0)
    ctx.line_to(length, -length * spread)
    ctx.line_to(length, length * spread)
    ctx.close_path()
    ctx.set_source(g)
    ctx.set_operator(_c.OPERATOR_ADD)
    ctx.fill()
    ctx.restore()


def seated(t=0.0, seed=0, seat=2.1, **kw):
    """Сидит на стуле: таз на высоте сиденья, колени вперёд, стопы на полу."""
    p = pose(t, seed)
    p.update(hip=(0.0, seat), f1=(1.25, 0.0), f2=(1.0, 0.0), lean=0.05, h1=(1.0, -2.6), h2=(0.8, -2.5))
    p.update(kw)
    return p
