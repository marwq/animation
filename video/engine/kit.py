"""Готовые элементы для сцен: пол, карточки-улики, рамки распознавания, штампы, окна, шкалы."""
import math

import skia

from .core import (AMBER, BG, DARK, DIM, GREEN, GREY, PAPER, RED, SOFT, WHITE, clamp, color, draw_text,
                   ease_in, ease_out, font, hash01, lerp, out_back, paint, pop, prog, rrect, text_width, xf)


def floor(c, y, x0=150, x1=1770, a=1.0, w=5):
    c.drawLine(x0, y, x1, y, paint(WHITE, a, stroke=w, cap="round"))


def typed(s, t, t0, cps=28):
    n = int(clamp((t - t0) * cps, 0, len(s)))
    return s[:n]


def header(c, t, t0, text, x=150, y=170, size=22, col=SOFT):
    """Строка «дела» сверху слева: печатается, с красной меткой."""
    k = ease_out(prog(t, t0, 0.25))
    if k <= 0:
        return
    f = font(size, "bold")
    c.drawRect(skia.Rect.MakeXYWH(x, y - size * 0.95, 6, size * 1.2), paint(RED, k))
    draw_text(c, typed(text, t, t0, 40), x + 20, y, f, paint(col, k), tracking=3)


def label(c, x, y, text, col=WHITE, a=1.0, size=20, bg=None, align="center", pad=10, weight="bold"):
    """Плашка с текстом. Возвращает ширину."""
    f = font(size, weight)
    tw = text_width(text, f, 2)
    w = tw + pad * 2
    h = size * 1.55
    x0 = x - w / 2 if align == "center" else x if align == "left" else x - w
    if bg is not None:
        c.drawRRect(rrect(x0, y - h / 2, w, h, 6), paint(bg, a))
    else:
        c.drawRRect(rrect(x0, y - h / 2, w, h, 6), paint(col, a, stroke=2))
    draw_text(c, text, x0 + pad, y + size * 0.36, f, paint(BG if bg is not None and bg != BG else col, a),
              tracking=2)
    return w


def cv_box(c, x, y, w, h, text, k=1.0, col=GREEN, t=0.0):
    """Рамка «распознано»: уголки + подпись."""
    if k <= 0:
        return
    grow = lerp(1.25, 1.0, ease_out(k))
    cx, cy = x + w / 2, y + h / 2
    w2, h2 = w * grow / 2, h * grow / 2
    L = min(w, h) * 0.28
    p = paint(col, k, stroke=4, cap="square")
    for sx, sy in ((-1, -1), (1, -1), (-1, 1), (1, 1)):
        px, py = cx + sx * w2, cy + sy * h2
        c.drawLine(px, py, px - sx * L, py, p)
        c.drawLine(px, py, px, py - sy * L, p)
    c.drawRect(skia.Rect.MakeXYWH(cx - w2, cy - h2, 2 * w2, 2 * h2), paint(col, 0.07 * k))
    if text:
        f = font(18, "bold")
        tw = text_width(text, f, 2) + 16
        c.drawRect(skia.Rect.MakeXYWH(cx - w2, cy - h2 - 30, tw, 28), paint(col, k))
        draw_text(c, text, cx - w2 + 8, cy - h2 - 9, f, paint(BG, k), tracking=2)


def stamp(c, x, y, text, t, t0, rot=-12, size=96, col=RED, sub=None):
    """Штамп: влетает с увеличения и «ударяет»."""
    if t < t0:
        return
    lt = t - t0
    s = lerp(2.2, 1.0, ease_in(prog(lt, 0, 0.16))) if lt < 0.16 else 1.0 + 0.04 * math.exp(-lt * 12)
    a = clamp(lt / 0.08)
    f = font(size, "bold")
    tw = text_width(text, f, 6)
    with xf(c, x, y, s=s, r=rot):
        c.drawRRect(rrect(-tw / 2 - 30, -size * 0.85, tw + 60, size * 1.2 + (size * 0.45 if sub else 0), 12),
                    paint(col, a, stroke=size * 0.08))
        draw_text(c, text, 0, size * 0.1, f, paint(col, a), "center", tracking=6)
        if sub:
            draw_text(c, sub, 0, size * 0.62, font(size * 0.32, "bold"), paint(col, a), "center", tracking=6)
        # «потёртости» штампа
        for i in range(40):
            hx = (hash01(i, 3) - 0.5) * (tw + 40)
            hy = (hash01(i, 4) - 0.5) * size
            c.drawCircle(hx, hy, 2 + hash01(i, 5) * 4, paint(BG, 0.55 * a))


def exhibit(c, x, y, w, h, t, t0, title, lines, draw_inner, rot=-3.0, letter="A"):
    """Карточка-улика: фото в рамке и подписи справа. (x, y) — центр фото."""
    k = ease_out(prog(t, t0, 0.5))
    if k <= 0:
        return
    with xf(c, x + (1 - k) * -120, y, r=rot * k):
        c.drawRect(skia.Rect.MakeXYWH(-w / 2 - 14, -h / 2 - 14, w + 28, h + 70), paint(PAPER, k))
        c.save()
        c.clipRect(skia.Rect.MakeXYWH(-w / 2, -h / 2, w, h))
        c.drawRect(skia.Rect.MakeXYWH(-w / 2, -h / 2, w, h), paint((38, 37, 35), k))
        draw_inner(c)
        # «зерно» старого фото
        for i in range(260):
            hx = (hash01(i, 11) - 0.5) * w
            hy = (hash01(i, 12) - 0.5) * h
            c.drawCircle(hx, hy, 1.2, paint(WHITE, 0.12 * k))
        c.restore()
    # подписи
    tx = x + w / 2 + 70
    ty = y - h / 2 + 30
    kk = ease_out(prog(t, t0 + 0.3, 0.3))
    c.drawRect(skia.Rect.MakeXYWH(tx, ty - 26, 7, 34), paint(RED, kk))
    draw_text(c, title, tx + 20, ty, font(30, "bold"), paint(WHITE, kk), tracking=3)
    for i, (txt, t_on, col) in enumerate(lines):
        if t >= t_on:
            draw_text(c, typed(txt, t, t_on, 34), tx + 20, ty + 52 + i * 38, font(20, "regular"),
                      paint(col, 1.0), tracking=2)


def dialog(c, x, y, w, h, title, body, t, t0, yes_press=None, a=1.0):
    """Окно согласия с кнопками NO / YES."""
    k = out_back(prog(t, t0, 0.35))
    if k <= 0:
        return None
    with xf(c, x, y, s=lerp(0.8, 1.0, k)):
        al = clamp(k) * a
        c.drawRRect(rrect(-w / 2, -h / 2, w, h, 18), paint(DARK, al))
        c.drawRRect(rrect(-w / 2, -h / 2, w, h, 18), paint(SOFT, al, stroke=2.5))
        draw_text(c, title, -w / 2 + 34, -h / 2 + 62, font(32, "bold"), paint(WHITE, al), tracking=2)
        draw_text(c, body, -w / 2 + 34, -h / 2 + 108, font(21, "regular"), paint(SOFT, al))
        by = h / 2 - 78
        bw, bh = 170, 56
        c.drawRRect(rrect(w / 2 - 34 - bw * 2 - 20, by, bw, bh, 10), paint(GREY, al, stroke=2))
        draw_text(c, "NO", w / 2 - 34 - bw * 1.5 - 20, by + 37, font(22, "bold"), paint(GREY, al), "center", tracking=3)
        pressed = yes_press is not None and t >= yes_press
        flash = 1 - clamp((t - yes_press) / 0.3) if pressed else 0
        c.drawRRect(rrect(w / 2 - 34 - bw, by, bw, bh, 10), paint(GREEN if pressed else WHITE, al))
        if flash > 0:
            c.drawRRect(rrect(w / 2 - 34 - bw - 8, by - 8, bw + 16, bh + 16, 14), paint(GREEN, al * flash, stroke=4))
        draw_text(c, "YES", w / 2 - 34 - bw / 2, by + 37, font(22, "bold"), paint(BG, al), "center", tracking=3)
    return (x + w / 2 - 34 - 85, y + h / 2 - 50)


def cursor(c, x, y, a=1.0, press=0.0):
    s = 1 - 0.15 * press
    with xf(c, x, y, s=s):
        p = skia.Path()
        for px, py in ((0, 0), (0, 40), (10, 31), (17, 47), (24, 44), (17, 28), (30, 28)):
            p.lineTo(px, py) if p.countPoints() else p.moveTo(px, py)
        p.close()
        c.drawPath(p, paint(WHITE, a))
        c.drawPath(p, paint(BG, a, stroke=2.5))


def bar(c, x, y, w, h, frac, col=WHITE, a=1.0, back=DIM):
    c.drawRRect(rrect(x, y, w, h, h / 2), paint(back, a))
    if frac > 0:
        c.drawRRect(rrect(x, y, max(h, w * clamp(frac)), h, h / 2), paint(col, a))


def text_bubble(c, x, y, text, t, t0, size=34, col=WHITE, tail=(-0.3, 1), words=None, a=1.0, fill=False):
    """Облачко с текстом; words — список (слово, время) для появления по словам."""
    from .picto import bubble
    k = out_back(prog(t, t0, 0.3))
    if k <= 0:
        return
    f = font(size, "bold")
    tw = text_width(text, f, 2)
    w, h = tw + 70, size * 2.2
    with xf(c, x, y, s=k):
        bubble(c, 0, 0, w, h, tail=tail, col=col, a=a, fill=fill)
        if words:
            xx = -tw / 2
            for wd, wt in words:
                if t >= wt:
                    draw_text(c, wd, xx, size * 0.36, f, paint(BG if fill else col, a * ease_out(prog(t, wt, 0.12))),
                              tracking=2)
                xx += text_width(wd + " ", f, 2)
        else:
            draw_text(c, text, 0, size * 0.36, f, paint(BG if fill else col, a), "center", tracking=2)
    return w, h


def particles(c, t, src, dst, n=40, col=SOFT, a=1.0, speed=0.8, seed=0, size=3.0, spread=30, curve=0.0):
    """Поток частиц от src к dst (зациклен)."""
    for i in range(n):
        ph = (t * speed + hash01(i, seed)) % 1.0
        ox = (hash01(i, seed + 1) - 0.5) * spread * (1 - ph)
        oy = (hash01(i, seed + 2) - 0.5) * spread * (1 - ph)
        x = lerp(src[0], dst[0], ph) + ox
        y = lerp(src[1], dst[1], ph) + oy - math.sin(ph * math.pi) * curve
        c.drawCircle(x, y, size * (0.6 + 0.6 * hash01(i, seed + 3)), paint(col, a * math.sin(ph * math.pi)))


def laser(c, x1, y1, x2, y2, a=1.0, w=3.0, dot=True):
    c.drawLine(x1, y1, x2, y2, paint(RED, 0.45 * a, stroke=w * 4, blur=w * 2))
    c.drawLine(x1, y1, x2, y2, paint(RED, a, stroke=w))
    if dot:
        c.drawCircle(x2, y2, w * 2.4, paint(RED, 0.6 * a, blur=w * 2))
        c.drawCircle(x2, y2, w * 1.2, paint((255, 200, 190), a))


def waveform(c, x, y, w, h, t, t0, amp=1.0, col=RED, a=1.0, speed=1.0, seed=0):
    """Осциллограмма, прорисовывается слева направо от t0."""
    k = clamp((t - t0) * speed / 1.2)
    if k <= 0:
        return
    p = skia.Path()
    n = int(240 * k)
    for i in range(n + 1):
        u = i / 240
        env = 0.25 + 0.75 * abs(math.sin(u * 7 + seed)) * (0.5 + 0.5 * math.sin(u * 23 + seed * 2))
        v = math.sin(u * 140 + t * 6) * 0.6 + math.sin(u * 63 + seed) * 0.4
        px, py = x + u * w, y + v * env * h / 2 * amp
        p.moveTo(px, py) if i == 0 else p.lineTo(px, py)
    c.drawPath(p, paint(col, 0.5 * a, stroke=6, blur=4))
    c.drawPath(p, paint(col, a, stroke=2.5))


def panel(c, x, y, w, h, title, k=1.0, col=SOFT):
    """Рамка-панель с заголовком сверху."""
    if k <= 0:
        return
    c.drawRRect(rrect(x, y, w, h, 14), paint(DARK, 0.9 * k))
    c.drawRRect(rrect(x, y, w, h, 14), paint(col, k * 0.8, stroke=2))
    draw_text(c, title, x + 22, y + 38, font(20, "bold"), paint(col, k), tracking=3)
