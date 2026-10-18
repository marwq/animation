"""Небо и океан: яркие тропические градиенты, пушистые облака, живые волны, блики,
чайки, дельфины, брызги, дальние корабли."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1, W, H
from engine import draw as D

INK = D.INK

# небо: верх → середина → горизонт
SKY = {
    "day": ("#2f9be6", "#6cc4f4", "#c8efff"),
    "morning": ("#4aa6e8", "#8fd0f2", "#fde8c4"),
    "dawn": ("#3a5aa8", "#e88aa0", "#ffd49a"),
    "golden": ("#3f6fc4", "#f2a07a", "#ffd27a"),
    "sunset": ("#3b2f86", "#e8588a", "#ffb03c"),
    "dusk": ("#1f2466", "#7a3f8f", "#f0785a"),
    "night": ("#0a1238", "#16296a", "#2c4a8c"),
    "deepnight": ("#060a24", "#0e1a48", "#1a2c62"),
    "storm": ("#2a323e", "#46525e", "#6b7884"),
    "green": ("#2f4a3a", "#5f8a5a", "#c8d88a"),
    "overcast": ("#7f95a8", "#a9bccb", "#d8e2e8"),
}
# океан: у горизонта → вблизи
SEA = {
    "day": ("#3fc3d8", "#0f7fb8"),
    "morning": ("#56c8d6", "#1287b6"),
    "dawn": ("#7fa8c8", "#2a5f9a"),
    "golden": ("#e8a07a", "#2f6a9a"),
    "sunset": ("#f08a6a", "#3a3f8a"),
    "dusk": ("#8a5a8a", "#232a6a"),
    "night": ("#1c3266", "#0a1640"),
    "deepnight": ("#122454", "#060e2c"),
    "storm": ("#4a5a64", "#1f2e3a"),
    "green": ("#6f8a6a", "#2a4a44"),
    "overcast": ("#7fa6b8", "#2f6a88"),
}
NIGHTS = ("night", "deepnight", "dusk", "storm")


def sky(ctx, x, y, w, h, tod="day"):
    a, b, c = SKY.get(tod, SKY["day"])
    D.vgrad(ctx, x, y, w, h, [(0, a), (0.55, b), (1, c)])


def stars(ctx, x, y, w, h, t=0.0, seed=1, density=1.0, alpha=1.0):
    r = rng(seed)
    n = int(w * h / 5000 * density)
    for i in range(n):
        sx, sy = x + r.random() * w, y + r.random() * h
        tw = 0.55 + 0.45 * math.sin(t * (1.5 + r.random() * 2) + i)
        big = r.random() < 0.08
        D.col(ctx, "#fff8dc", alpha * tw * (0.5 + r.random() * 0.5))
        rr = (2.6 if big else 1.0 + r.random() * 1.3)
        ctx.arc(sx, sy, rr, 0, TAU)
        ctx.fill()
        if big:
            ctx.set_line_width(1.2)
            ctx.move_to(sx - rr * 3, sy)
            ctx.line_to(sx + rr * 3, sy)
            ctx.move_to(sx, sy - rr * 3)
            ctx.line_to(sx, sy + rr * 3)
            ctx.stroke()


def sun(ctx, x, y, r, tod="day"):
    c = {"sunset": "#ffcf5a", "golden": "#ffe28a", "dawn": "#ffd27a", "dusk": "#ff9a5a"}.get(tod, "#fff6c8")
    D.radial(ctx, x, y, r * 6, c, 0.35, 0)
    D.radial(ctx, x, y, r * 2.4, "#ffffff", 0.35, 0)
    D.circle(ctx, x, y, r, hexrgb(c), None, 0)


def moon(ctx, x, y, r):
    D.radial(ctx, x, y, r * 5, "#cfe0ff", 0.25, 0)
    D.circle(ctx, x, y, r, hexrgb("#f4f1e0"), INK, 3)
    for dx, dy, rr in ((-0.3, -0.2, 0.18), (0.25, 0.3, 0.13), (0.3, -0.3, 0.08)):
        D.circle(ctx, x + dx * r, y + dy * r, rr * r, hexrgb("#dedac4"), None, 0)


def cloud(ctx, x, y, s, tod="day", seed=0, alpha=1.0):
    """Пушистое кучевое облако с плоским низом и тенью снизу."""
    r = rng(seed)
    light = {"day": "#ffffff", "morning": "#fff8ee", "dawn": "#ffd8c8", "golden": "#ffe4c0", "sunset": "#ffc0a8",
             "dusk": "#c890b8", "night": "#3a4a7a", "deepnight": "#24305a", "storm": "#5a6470",
             "green": "#8aa080", "overcast": "#e2e8ec"}.get(tod, "#ffffff")
    dark = shade(hexrgb(light), -0.16 if tod not in NIGHTS else -0.25)
    puffs = []
    n = 6 + r.randint(0, 3)
    for i in range(n):
        u = i / (n - 1) - 0.5
        rr = (0.55 + 0.45 * math.cos(u * math.pi)) * (60 + r.random() * 30)
        puffs.append((u * 300 + r.uniform(-20, 20), -rr * 0.55 - r.random() * 20, rr))
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    ctx.push_group()
    for (px, py, rr) in puffs:
        ctx.arc(px, py + 8, rr, 0, TAU)
        D.col(ctx, dark)
        ctx.fill()
    for (px, py, rr) in puffs:
        ctx.arc(px - rr * 0.08, py - rr * 0.08, rr * 0.92, 0, TAU)
        D.col(ctx, light)
        ctx.fill()
    # плоский низ
    ctx.set_operator(cairo.OPERATOR_CLEAR)
    ctx.rectangle(-400, 18, 800, 300)
    ctx.fill()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(alpha)
    ctx.restore()


def cloudbank(ctx, x0, x1, y, tod="day", seed=3, n=6, s0=0.6, s1=1.1, alpha=1.0):
    r = rng(seed)
    for i in range(n):
        cloud(ctx, lerp(x0, x1, (i + r.random() * 0.6) / n), y + r.uniform(-60, 40), r.uniform(s0, s1), tod,
              seed * 10 + i, alpha)


def ocean(ctx, t, x0, x1, hy, y1, tod="day", rough=0.0, seed=1, speed=1.0, sun_x=None, glitter=1.0):
    """Океан от линии горизонта hy до y1. Волны движутся; rough 0..1 — шторм."""
    far, near = SEA.get(tod, SEA["day"])
    D.vgrad(ctx, x0, hy, x1 - x0, y1 - hy, [(0, far), (0.35, mix(hexrgb(far), hexrgb(near), 0.6)), (1, near)])
    r = rng(seed)
    night = tod in NIGHTS
    hl = "#ffffff" if not night else "#8fb0e8"
    dk = shade(hexrgb(near), -0.25)
    rows = 26
    for j in range(rows):
        u = (j + 1) / rows
        y = hy + (y1 - hy) * (u ** 1.7)
        sc = 0.15 + u * 1.5
        n = int(10 + 22 * (1 - u))
        step = (x1 - x0) / n
        drift = (t * (14 + 30 * u) * speed + r.random() * 500) % step
        for i in range(-1, n + 1):
            x = x0 + i * step + drift + noise1(i * 0.7 + j, seed) * step * 0.4
            w = (30 + 40 * rough) * sc
            amp = (5 + 14 * rough) * sc
            ph = math.sin(t * 2.0 + i * 1.7 + j * 0.9)
            a = 0.25 + 0.25 * ph
            D.col(ctx, hl, (0.35 + 0.35 * rough) * a * (0.5 + 0.5 * u))
            ctx.set_line_width(max(1.0, 2.6 * sc))
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.move_to(x - w, y)
            ctx.curve_to(x - w * 0.5, y - amp, x + w * 0.5, y - amp, x + w, y)
            ctx.stroke()
            if j % 3 == 0:
                D.col(ctx, dk, 0.18)
                ctx.move_to(x - w * 0.8, y + amp * 0.8)
                ctx.curve_to(x, y + amp * 1.4, x + w * 0.4, y + amp * 1.2, x + w * 0.9, y + amp * 0.9)
                ctx.stroke()
            if rough > 0.4 and (i + j) % 4 == 0:
                # барашки
                D.col(ctx, "#f4f8fa", 0.6 * rough)
                ctx.arc(x, y - amp * 0.6, 4 * sc * (1 + rough), 0, TAU)
                ctx.fill()
    if sun_x is not None and glitter > 0:
        # дорожка бликов под солнцем / луной
        c = "#fff3c4" if not night else "#e8f0ff"
        for k in range(70):
            u = (k + 0.5) / 70
            y = hy + (y1 - hy) * (u ** 1.5)
            wspread = 40 + 380 * u
            x = sun_x + noise1(k * 1.3 + t * 0.8, seed + 5) * wspread
            a = clamp(0.5 + 0.5 * math.sin(t * 6 + k * 2.1)) * glitter
            D.col(ctx, c, a * 0.85)
            ww = 6 + 26 * u
            ctx.rectangle(x - ww / 2, y, ww, 1.5 + 3 * u)
            ctx.fill()


def horizon_haze(ctx, x0, x1, hy, tod="day", h=60):
    c = SKY.get(tod, SKY["day"])[2]
    D.vgrad(ctx, x0, hy - h, x1 - x0, h * 2, [(0, c, 0.0), (0.5, c, 0.55), (1, c, 0.0)])


def gull(ctx, x, y, s, t, seed=0):
    f = math.sin(t * 7 + seed * 1.9)
    D.col(ctx, INK)
    ctx.set_line_width(max(1.5, 0.12 * s))
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(x - s, y - f * s * 0.35)
    ctx.curve_to(x - s * 0.6, y - s * 0.5 - f * s * 0.3, x - s * 0.2, y - s * 0.4, x, y)
    ctx.curve_to(x + s * 0.2, y - s * 0.4, x + s * 0.6, y - s * 0.5 - f * s * 0.3, x + s, y - f * s * 0.35)
    ctx.stroke()


def gulls(ctx, t, x0, x1, y0, y1, n=5, seed=2, s=14, speed=40):
    r = rng(seed)
    for i in range(n):
        x = x0 + ((r.random() * (x1 - x0) + t * speed * (0.7 + r.random() * 0.6)) % (x1 - x0))
        y = r.uniform(y0, y1) + math.sin(t * 0.8 + i) * 12
        gull(ctx, x, y, s * r.uniform(0.7, 1.3), t, i)


def dolphin(ctx, x, y, s, k, f=1):
    """Дельфин в прыжке; k 0..1 — фаза дуги (0 — выныривает, 1 — ныряет)."""
    if not 0 <= k <= 1:
        return
    a = (k - 0.5) * 2.2
    px = x + f * (k - 0.5) * 6 * s
    py = y - math.sin(math.pi * k) * 2.2 * s
    ctx.save()
    ctx.translate(px, py)
    ctx.scale(f, 1)
    ctx.rotate(a * 0.6)
    body = hexrgb("#7f9fb8")
    ctx.move_to(-1.6 * s, 0.1 * s)
    ctx.curve_to(-0.8 * s, -0.55 * s, 0.9 * s, -0.6 * s, 1.5 * s, 0.0)
    ctx.line_to(1.9 * s, 0.05 * s)
    ctx.curve_to(1.5 * s, 0.18 * s, 0.6 * s, 0.4 * s, -0.4 * s, 0.32 * s)
    ctx.curve_to(-1.0 * s, 0.28 * s, -1.4 * s, 0.2 * s, -1.6 * s, 0.1 * s)
    ctx.close_path()
    D.col(ctx, body)
    ctx.fill_preserve()
    D.col(ctx, INK)
    ctx.set_line_width(0.09 * s)
    ctx.stroke()
    D.poly(ctx, [(-0.1 * s, -0.42 * s), (-0.45 * s, -0.95 * s), (0.35 * s, -0.48 * s)], body, INK, 0.08 * s, wob=0)
    D.poly(ctx, [(-1.5 * s, 0.1 * s), (-2.1 * s, -0.35 * s), (-1.95 * s, 0.1 * s), (-2.1 * s, 0.5 * s)], body, INK,
           0.08 * s, wob=0)
    D.ellipse(ctx, 0.2 * s, 0.18 * s, 0.7 * s, 0.12 * s, hexrgb("#e8eef2"), None, 0)
    D.circle(ctx, 1.05 * s, -0.12 * s, 0.07 * s, INK, None, 0)
    ctx.restore()


def splash(ctx, x, y, k, s=1.0, seed=0, c="#ffffff"):
    """Брызги: k 0..1 от удара до опадания."""
    if not 0 <= k <= 1:
        return
    r = rng(seed)
    for i in range(16):
        a = -math.pi / 2 + r.uniform(-1.2, 1.2)
        v = r.uniform(120, 300) * s
        px = x + math.cos(a) * v * k
        py = y + math.sin(a) * v * k + 420 * s * k * k
        rr = r.uniform(5, 11) * s * (1 - k * 0.6)
        D.circle(ctx, px, py, rr, hexrgb(c), INK, 1.5, alpha=1 - k * 0.7)
    # кольцо
    D.ellipse(ctx, x, y, (40 + 160 * k) * s, (8 + 18 * k) * s, None, hexrgb(c), 4 * (1 - k), alpha=1 - k)


def foam_line(ctx, x0, x1, y, t, seed=0, a=0.8):
    """Пена у ватерлинии."""
    r = rng(seed)
    D.col(ctx, "#ffffff", a)
    x = x0
    while x < x1:
        w = r.uniform(20, 60)
        yy = y + math.sin(t * 3 + x * 0.05) * 4
        ctx.arc(x, yy, w * 0.3, math.pi, TAU)
        ctx.fill()
        x += w * 0.7


def cargo_ship(ctx, x, wl, s, lit=1.0, night=True):
    """Контейнеровоз силуэтом (вдали)."""
    hull = hexrgb("#2a2f3e") if night else hexrgb("#7a3a3a")
    D.poly(ctx, [(x - 200 * s, wl - 40 * s), (x + 230 * s, wl - 40 * s), (x + 200 * s, wl), (x - 190 * s, wl)],
           hull, INK, 2, wob=0)
    cols = ["#c8423a", "#2f8fd8", "#f2c230", "#3fbf6a", "#f2783a"]
    for i in range(12):
        for j in range(2):
            c = hexrgb(cols[(i * 3 + j) % 5])
            if night:
                c = shade(c, -0.6)
            D.rect(ctx, x - 160 * s + i * 26 * s, wl - 62 * s - j * 22 * s, 24 * s, 20 * s, c, None, 0, wob=0)
    D.rect(ctx, x - 190 * s, wl - 110 * s, 40 * s, 70 * s, shade(hull, 0.2), INK, 2, wob=0)
    if lit > 0:
        for (lx, ly) in ((x - 170 * s, wl - 100 * s), (x + 220 * s, wl - 45 * s), (x - 190 * s, wl - 42 * s)):
            D.radial(ctx, lx, ly, 22 * s, "#fff2b0", 0.8 * lit, 0)
            D.circle(ctx, lx, ly, 3 * s, hexrgb("#fff6d0"), None, 0)


def cutter(ctx, x, wl, s, f=-1):
    """Катер береговой охраны: белый корпус, красная диагональ."""
    ctx.save()
    ctx.translate(x, wl)
    ctx.scale(f * s, s)
    D.poly(ctx, [(-260, -60), (250, -60), (300, -95), (330, -95), (280, 0), (-250, 0)], hexrgb("#f7f7f2"), INK, 4,
           wob=0)
    D.poly(ctx, [(120, -60), (170, -60), (100, 0), (50, 0)], hexrgb("#e8423c"), None, 0, wob=0)
    D.poly(ctx, [(185, -60), (205, -60), (135, 0), (115, 0)], hexrgb("#2f6fb3"), None, 0, wob=0)
    D.rect(ctx, -160, -130, 230, 70, hexrgb("#f7f7f2"), INK, 4, wob=0)
    for i in range(5):
        D.rect(ctx, -145 + i * 42, -115, 30, 22, hexrgb("#24324a"), INK, 2, wob=0)
    D.rect(ctx, -90, -200, 70, 70, hexrgb("#f7f7f2"), INK, 4, wob=0)
    D.line(ctx, -55, -200, -55, -270, INK, 5)
    D.line(ctx, -85, -245, -25, -245, INK, 4)
    D.rect(ctx, -250, -6, 530, 8, hexrgb("#e8423c"), None, 0, wob=0)
    ctx.restore()
    D.text(ctx, "COAST GUARD", x + f * s * 0 - s * 0, wl - 20 * s, 30 * s, D.FONT_TITLE, hexrgb("#24324a"))


def rain_streaks(ctx, t, x0, y0, w, h, amount=1.0, wind=0.35, seed=1, alpha=0.5, speed=1.0, c="#dfe8f4"):
    r = rng(seed)
    n = int(220 * amount)
    D.col(ctx, c, alpha)
    ctx.set_line_width(2)
    for i in range(n):
        x = x0 + r.random() * w
        L = r.uniform(30, 70)
        y = y0 + ((r.random() * h + t * 1500 * speed * r.uniform(0.8, 1.2)) % h)
        ctx.move_to(x + y * wind * 0.2, y)
        ctx.line_to(x + y * wind * 0.2 + L * wind, y + L)
    ctx.stroke()
