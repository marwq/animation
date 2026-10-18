"""За пределами аэропорта: ранчо Уолта в Аризоне (трейлер, кактусы, грунтовая полоса, жёлтый
старый самолёт, антенна, рация на веранде) и Канзас бабушки Джун (кухня с телефоном на шнуре,
пшеница, красный амбар, ветряк). Пол — FL."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1, W, H
from engine import draw as D
from . import sea as SEA
from .base import tone, logo, NAVY, TEAL, SUNC, WHITE, INK, NIGHT

FL = 900
HZ = 560
RADIO_X = 900         # стол с рацией на веранде Уолта
PERCH_X = 1180        # жердочка попугая
PHONE_X = 1500        # телефон на стене кухни Джун


def saguaro(ctx, x, gy, s=1.0, T=lambda c: c):
    c = T("#3f9a4a")
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rrect(ctx, -26, -320, 52, 320, 26, c, INK, 4)
    D.rrect(ctx, -90, -220, 40, 120, 20, c, INK, 4)
    D.rrect(ctx, -90, -120, 80, 36, 18, c, INK, 4)
    D.rrect(ctx, 50, -260, 40, 140, 20, c, INK, 4)
    D.rrect(ctx, 10, -150, 80, 36, 18, c, INK, 4)
    for k in range(5):
        D.line(ctx, -10 + k * 5, -300, -10 + k * 5, -20, shade(c, -0.15), 2)
    ctx.restore()


def mesa(ctx, x, base, w, h, c, T):
    D.poly(ctx, [(x - w / 2 - h * 0.4, base), (x - w / 2, base - h), (x + w / 2, base - h),
                 (x + w / 2 + h * 0.4, base)], T(c), None, 0, wob=0)
    D.rect(ctx, x - w / 2, base - h, w, h * 0.12, T(shade(hexrgb(c), 0.12)), None, 0, wob=0)
    for k in range(3):
        D.line(ctx, x - w / 2 + 10, base - h + h * (0.35 + k * 0.2), x + w / 2 - 10, base - h + h * (0.35 + k * 0.2),
               T(shade(hexrgb(c), -0.1)), 4)


def taildragger(ctx, x, gy, s=1.0, T=lambda c: c, f=1):
    """Старый жёлтый самолёт Уолта с хвостовым колесом."""
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    D.line(ctx, 160, -150, 140, -30, INK, 10)
    D.circle(ctx, 140, -30, 30, T("#2b2f3a"), INK, 4)
    D.circle(ctx, -330, -14, 14, T("#2b2f3a"), INK, 3)
    body = [(-340, -120), (-200, -150), (120, -200), (300, -190), (330, -150), (300, -100), (120, -80),
            (-200, -90)]
    D.poly(ctx, body, T("#f2c230"), INK, 5, wob=0)
    D.poly(ctx, [(-340, -120), (-300, -260), (-250, -260), (-220, -140)], T("#f2c230"), INK, 5, wob=0)
    D.rrect(ctx, -80, -250, 380, 26, 12, T("#f2c230"), INK, 5)
    D.poly(ctx, [(60, -224), (180, -224), (200, -180), (60, -180)], T("#9fd8ec"), INK, 4, wob=0)
    D.line(ctx, -100, -130, 300, -170, T("#e8423c"), 10)
    D.line(ctx, 336, -230, 336, -70, INK, 10)
    ctx.restore()


def trailer(ctx, x, gy, T, lit=0.0):
    D.rrect(ctx, x, gy - 330, 760, 290, 120, T("#d8dee4"), INK, 6)
    for k in range(6):
        D.line(ctx, x + 60 + k * 120, gy - 320, x + 60 + k * 120, gy - 50, T("#c4ccd2"), 4)
    D.rrect(ctx, x + 520, gy - 270, 140, 90, 20, hexrgb("#ffd978") if lit > 0 else T("#9fd8ec"), INK, 4)
    D.rect(ctx, x + 120, gy - 280, 100, 220, T("#b8c0c8"), INK, 4, wob=0)
    for wx in (180, 560):
        D.circle(ctx, x + wx, gy - 30, 34, T("#2b2f3a"), INK, 4)


def walt_place(ctx, tod="day", x0=-1400, x1=3600, lit=None):
    """Ранчо Уолта: красные столовые горы, сагуаро, грунтовая полоса, трейлер с верандой."""
    T = lambda c: tone(c, tod)
    night = tod in NIGHT
    lit = (1.0 if night else 0.0) if lit is None else lit
    sky_tod = "sunset" if tod == "golden" else tod
    SEA.sky(ctx, x0, -1400, x1 - x0, HZ + 1440, sky_tod)
    if night:
        SEA.stars(ctx, x0, -1400, x1 - x0, HZ + 1200, 0.0, 9, 1.4)
        SEA.moon(ctx, x1 - 600, -200, 60)
    else:
        SEA.sun(ctx, x0 + 600, -100, 90, tod)
    mesa(ctx, x0 + 700, HZ, 900, 260, "#c8643a", T)
    mesa(ctx, x0 + 2200, HZ, 600, 180, "#d97a46", T)
    mesa(ctx, x1 - 600, HZ, 1100, 300, "#b85a34", T)
    D.rect(ctx, x0, HZ - 4, x1 - x0, FL + 1000 - HZ, T("#e8b07a"), None, 0, wob=0)
    # грунтовая полоса
    D.poly(ctx, [(x0, HZ + 120), (x1, HZ + 90), (x1, HZ + 180), (x0, HZ + 230)], T("#d49a62"), None, 0, wob=0)
    for k in range(10):
        bx = x0 + 200 + k * 520
        D.rect(ctx, bx, HZ + 100 - k * 3, 40, 14, T("#fbfaf6"), INK, 2, wob=0)
    r = rng(3)
    for k in range(30):
        D.circle(ctx, r.uniform(x0, x1), r.uniform(HZ + 260, FL + 300), r.uniform(8, 22), T("#c49464"), None, 0)
    for (sx, sc) in ((x0 + 200, 1.0), (x0 + 2500, 0.7), (x1 - 300, 1.2), (x0 + 3000, 0.5)):
        saguaro(ctx, sx, HZ + 180 + sc * 100, sc, T)
    # навес с самолётом
    D.poly(ctx, [(2100, FL - 40), (2100, 380), (2400, 300), (3200, 300), (3200, FL - 40)], T("#a8865a"), INK, 5,
           wob=0)
    D.rect(ctx, 2140, 400, 1020, FL - 440, T("#5a4632"), None, 0, wob=0)
    taildragger(ctx, 2650, FL - 40, 1.0, T, -1)
    # антенна
    D.line(ctx, 1450, FL - 40, 1450, -300, INK, 8)
    for k in range(5):
        D.line(ctx, 1380, -260 + k * 60, 1520, -260 + k * 60, INK, 4)
    D.circle(ctx, 1450, -306, 10, hexrgb("#e8423c"), None, 0)
    # трейлер и веранда
    trailer(ctx, -500, FL - 40, T, lit)
    D.rect(ctx, 300, 200, 1000, 30, T("#8a5a34"), INK, 4, wob=0)
    for px in (320, 1270):
        D.rect(ctx, px, 230, 22, FL - 270, T("#6a4428"), INK, 3, wob=0)
    if lit > 0:
        for k in range(12):
            lx = 330 + k * 80
            ly = 260 + math.sin(k / 11 * math.pi) * 40
            D.radial(ctx, lx, ly, 40, "#ffd978", 0.6, 0)
            D.circle(ctx, lx, ly, 8, hexrgb("#ffe9a0"), INK, 2)
    # стол с рацией
    D.rect(ctx, RADIO_X - 160, FL - 220, 320, 26, T("#8a5a34"), INK, 4, wob=0)
    D.rect(ctx, RADIO_X - 140, FL - 194, 18, 154, T("#6a4428"), INK, 3, wob=0)
    D.rect(ctx, RADIO_X + 120, FL - 194, 18, 154, T("#6a4428"), INK, 3, wob=0)
    D.rrect(ctx, RADIO_X - 130, FL - 330, 240, 110, 12, T("#5a606c"), INK, 4)
    D.rect(ctx, RADIO_X - 110, FL - 310, 120, 40, hexrgb("#ffb03c") if lit > 0 or not night else T("#3a2a14"), INK,
           3, wob=0)
    D.circle(ctx, RADIO_X + 60, FL - 290, 18, T("#c9d0d6"), INK, 3)
    D.line(ctx, RADIO_X + 80, FL - 330, RADIO_X + 120, FL - 430, INK, 4)
    # жердочка
    D.line(ctx, PERCH_X, FL - 40, PERCH_X, FL - 330, INK, 8)
    D.line(ctx, PERCH_X - 70, FL - 330, PERCH_X + 70, FL - 330, INK, 10)
    D.line(ctx, PERCH_X - 70, FL - 330, PERCH_X + 70, FL - 330, T("#a8865a"), 5)
    # кресло-качалка
    D.rrect(ctx, 560, FL - 330, 40, 200, 14, T("#a8865a"), INK, 3)
    D.rect(ctx, 560, FL - 150, 160, 24, T("#a8865a"), INK, 3, wob=0)
    D.curve(ctx, [(520, FL - 50), (640, FL - 30), (760, FL - 50)], INK, 6)
    D.rect(ctx, x0, FL - 40, x1 - x0, 1000, T("#d8a470"), None, 0, wob=0, alpha=0.4)


# --- Канзас ---------------------------------------------------------------------------------

def barn(ctx, x, gy, s, T):
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.poly(ctx, [(-200, 0), (-200, -220), (-120, -320), (120, -320), (200, -220), (200, 0)], T("#c23b33"), INK, 5,
           wob=0)
    D.poly(ctx, [(-220, -220), (-130, -340), (130, -340), (220, -220)], None, T("#fbfaf6"), 10, wob=0)
    D.rect(ctx, -80, -160, 160, 160, T("#a8302a"), INK, 4, wob=0)
    D.line(ctx, -80, -160, 80, 0, T("#fbfaf6"), 8)
    D.line(ctx, 80, -160, -80, 0, T("#fbfaf6"), 8)
    ctx.restore()


def windmill(ctx, x, gy, t, s, T):
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.poly(ctx, [(-50, 0), (-12, -420), (12, -420), (50, 0)], None, INK, 6, wob=0)
    for k in range(4):
        D.line(ctx, -40 + k * 6, -100 * k, 40 - k * 6, -100 * (k + 1), INK, 3)
    ctx.translate(0, -430)
    ctx.rotate(t * 1.5)
    for k in range(12):
        a = k * TAU / 12
        D.line(ctx, 0, 0, math.cos(a) * 110, math.sin(a) * 110, T("#c9d0d6"), 10)
    D.circle(ctx, 0, 0, 18, T("#8f99a3"), INK, 3)
    ctx.restore()


def wheat(ctx, x0, x1, y0, y1, t, T, seed=1):
    D.rect(ctx, x0, y0, x1 - x0, y1 - y0, T("#e8b84a"), None, 0, wob=0)
    r = rng(seed)
    n = int((x1 - x0) / 18)
    for row in range(5):
        yy = y0 + (y1 - y0) * (row + 1) / 6
        for k in range(n):
            xx = x0 + k * 18 + r.uniform(-6, 6)
            sw = math.sin(t * 1.5 + xx * 0.01 + row) * 6
            D.line(ctx, xx, yy, xx + sw, yy - 40 - row * 6, T("#d9a23a"), 3)


def kansas(ctx, t=0.0, tod="day", x0=-1400, x1=3800, strip=True):
    """Ферма Джун: пшеница до горизонта, амбар, дом, ветряк; травяная полоса для посадки."""
    T = lambda c: tone(c, tod)
    SEA.sky(ctx, x0, -1400, x1 - x0, HZ + 1440, "sunset" if tod == "golden" else tod)
    if tod not in NIGHT:
        SEA.sun(ctx, x1 - 500, -150, 90, tod)
        for k in range(5):
            SEA.cloud(ctx, x0 + 400 + k * 1000, -300 + (k % 2) * 120, 1.1, tod, k + 20)
    wheat(ctx, x0, x1, HZ, FL - 40, t, T)
    if strip:
        D.poly(ctx, [(x0, FL - 120), (x1, FL - 160), (x1, FL - 60), (x0, FL - 20)], T("#7cc464"), None, 0, wob=0)
    D.rect(ctx, x0, FL - 40, x1 - x0, 1000, T("#8fcf6a"), None, 0, wob=0)
    barn(ctx, x0 + 600, HZ + 60, 1.0, T)
    # дом
    hx = x0 + 1500
    D.rect(ctx, hx, HZ - 180, 420, 240, T("#fbfaf6"), INK, 5, wob=0)
    D.poly(ctx, [(hx - 30, HZ - 180), (hx + 210, HZ - 320), (hx + 450, HZ - 180)], T("#5a6370"), INK, 5, wob=0)
    for k in range(2):
        D.rect(ctx, hx + 50 + k * 220, HZ - 120, 100, 90, T("#9fd8ec"), INK, 4, wob=0)
    windmill(ctx, x0 + 2400, HZ + 80, t, 0.8, T)
    # почтовый ящик
    D.line(ctx, x0 + 2900, FL - 40, x0 + 2900, FL - 200, INK, 8)
    D.rrect(ctx, x0 + 2850, FL - 260, 120, 66, 30, T("#c9d0d6"), INK, 4)
    D.text(ctx, "JUNE", x0 + 2910, FL - 214, 30, D.FONT_TITLE, T(NAVY))


def june_kitchen(ctx, t=0.0, tod="day", x0=-600, x1=3200):
    """Кухня Джун: окно на поле, телефон со шнуром на стене, холодильник с рисунками, пирог."""
    T = lambda c: tone(c, "day")
    D.rect(ctx, x0, -1500, x1 - x0, FL + 1500, T("#f6e3a8"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 120)):
        D.line(ctx, x0 + k * 120, -1500, x0 + k * 120, FL, T("#efd894"), 6)
    # окно
    wx, wy, ww, wh = 300, 300, 560, 300
    ctx.save()
    ctx.rectangle(wx, wy, ww, wh)
    ctx.clip()
    ctx.translate(wx + ww / 2, wy + wh / 2)
    ctx.scale(0.35, 0.35)
    ctx.translate(-1200, -500)
    kansas(ctx, t, tod, -1400, 3800, strip=False)
    ctx.restore()
    D.rect(ctx, wx, wy, ww, wh, None, T("#fbfaf6"), 20, wob=0)
    D.rect(ctx, wx, wy, ww, wh, None, INK, 4, wob=0)
    D.line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, T("#fbfaf6"), 12)
    for k in range(7):
        D.poly(ctx, [(wx - 30 + k * 90, wy - 26), (wx + 26 + k * 90, wy - 26), (wx - 2 + k * 90, wy + 24)],
               T("#e8423c" if k % 2 else "#fbfaf6"), INK, 2, wob=0)
    # мойка и шкафы
    D.rect(ctx, x0 + 100, FL - 250, 1300, 30, T("#e9edf0"), INK, 4, wob=0)
    D.rect(ctx, x0 + 100, FL - 220, 1300, 180, T("#7fbfb0"), INK, 4, wob=0)
    for k in range(4):
        D.rect(ctx, x0 + 130 + k * 320, FL - 200, 280, 140, T("#8fcfc0"), INK, 3, wob=0)
    for k in range(3):
        D.rect(ctx, x0 + 150 + k * 420, 60, 360, 180, T("#8fcfc0"), INK, 3, wob=0)
    D.rrect(ctx, 760, FL - 300, 130, 50, 16, T("#d9a23a"), INK, 4)              # пирог
    D.ellipse(ctx, 825, FL - 300, 65, 16, T("#e8b84a"), INK, 3)
    # телефон со шнуром
    D.rrect(ctx, PHONE_X - 50, 380, 100, 170, 20, T("#e8423c"), INK, 5)
    D.rrect(ctx, PHONE_X - 36, 400, 72, 44, 12, T("#fbfaf6"), INK, 3)
    for k in range(9):
        D.circle(ctx, PHONE_X - 26 + (k % 3) * 26, 466 + (k // 3) * 24, 7, T("#fbfaf6"), INK, 2)
    pts = [(PHONE_X + 50, 540 + k * 10 + math.sin(k * 1.4) * 8) for k in range(16)]
    D.catmull(ctx, pts)
    D.col(ctx, INK)
    ctx.set_line_width(5)
    ctx.stroke()
    # холодильник
    D.rrect(ctx, 2000, FL - 470, 300, 430, 24, T("#fbfaf6"), INK, 5)
    D.line(ctx, 2000, FL - 320, 2300, FL - 320, INK, 4)
    for k, c in enumerate(("#2f8fd8", "#3fbf6a", "#f2c230")):
        D.rect(ctx, 2030 + k * 85, FL - 440 + (k % 2) * 30, 70, 90, T("#fbfaf6"), INK, 2, wob=0)
        D.circle(ctx, 2065 + k * 85, FL - 400 + (k % 2) * 30, 18, T(c), INK, 2)
    D.rect(ctx, x0, FL - 40, x1 - x0, 1000, T("#c99a62"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 140)):
        D.line(ctx, x0 + k * 140, FL - 40, x0 + k * 140 - 200, FL + 600, T("#b8864a"), 3)
