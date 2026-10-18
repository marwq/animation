"""Аэродром снаружи: перрон перед терминалом (вид сбоку), вышка, ангар №9, топливный склад,
забор и армейские огни; карта аэропорта сверху; полоса в перспективе для взлёта."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1, W, H
from engine import draw as D
from . import sea as SEA
from . import common as C
from .base import tone, logo, NAVY, TEAL, SUNC, WHITE, INK, NIGHT

HZ = 600          # линия горизонта (трава у дальнего края лётного поля)
GY = 900          # «передний» край перрона, где стоят герои
TERM_X = (-1400, 2700)
GATES = [-1000, -300, 400, 1100, 1800]          # телетрапы у фасада
TOWER_X = 3300
FUEL_X = 4700
HANGAR_X = 6300   # центр ангара №9
HANGAR_W = 900
X0, X1 = -2600, 8200


def sky(ctx, t, tod="day", x0=X0 - 2000, x1=X1 + 2000, sun=None, moon=None, clouds=True, seed=4, hz=HZ):
    """Небо над аэродромом (рисовать с параллаксом)."""
    sky_tod = "sunset" if tod == "golden" else tod
    SEA.sky(ctx, x0, -1800, x1 - x0, hz + 1800 + 40, sky_tod)
    if tod in NIGHT:
        SEA.stars(ctx, x0, -1800, x1 - x0, hz + 1500, t, 7, 1.0)
    if sun:
        SEA.sun(ctx, *sun, tod)
    if moon:
        SEA.moon(ctx, *moon)
    if clouds:
        SEA.cloudbank(ctx, x0, x1, hz - 420, tod, seed=seed, n=14, s0=0.8, s1=1.5)


def skyline(ctx, tod="day", x0=X0, x1=X1, base=HZ, lit=0.0):
    """Город вдали за озером."""
    far = tone("#9fb6cc", tod) if tod not in NIGHT else tone("#2a3a68", tod)
    r = rng(12)
    x = x0
    while x < x1:
        w = r.uniform(70, 160)
        h = r.uniform(80, 260) * (1.6 if r.random() < 0.12 else 1.0)
        D.rect(ctx, x, base - h, w, h, far, None, 0, wob=0)
        if lit > 0:
            for k in range(int(h / 30)):
                for j in range(int(w / 26)):
                    if r.random() < 0.35:
                        D.rect(ctx, x + 6 + j * 26, base - h + 10 + k * 30, 10, 12, hexrgb("#ffd978"), None, 0,
                               wob=0, alpha=0.8 * lit)
        x += w + r.uniform(0, 40)


def _jet_bridge(ctx, x, T):
    """Телетрап: идёт от фасада вперёд-вниз к двери самолёта."""
    D.poly(ctx, [(x - 40, 380), (x + 90, 380), (x + 140, 470), (x + 10, 470)], T("#c9d0d6"), INK, 4, wob=0)
    D.rect(ctx, x + 40, 470, 40, 300, T("#8f99a3"), INK, 4, wob=0)
    D.rect(ctx, x - 10, 760, 140, 20, T("#5a6370"), INK, 3, wob=0)
    for k in range(3):
        D.rect(ctx, x - 26 + k * 40, 396 + k * 20, 26, 22, T("#9fd8ec"), INK, 2, wob=0)


def field(ctx, tod="day", power=1.0, x0=X0, x1=X1):
    """Статичный аэродром (кэшировать): дальний край поля, терминал, вышка, склад, ангар, перрон."""
    T = lambda c: tone(c, tod)
    night = tod in NIGHT
    lit = power > 0 and night
    # озеро у горизонта и город
    D.rect(ctx, x0, HZ - 60, x1 - x0, 60, T("#3fa8d8") if not night else T("#1c3266"), None, 0, wob=0)
    skyline(ctx, tod, x0, x1, HZ - 50, lit=1.0 if lit else 0.0)
    # трава лётного поля
    D.rect(ctx, x0, HZ - 10, x1 - x0, 160, T("#7cc464"), None, 0, wob=0)
    r = rng(5)
    for k in range(40):
        xx = r.uniform(x0, x1)
        if TERM_X[0] - 100 < xx < TERM_X[1] + 100:
            continue
        D.circle(ctx, xx, HZ - 6 + r.uniform(-6, 6), r.uniform(26, 50), T("#4f9a4a"), None, 0)

    D.rect(ctx, x0, HZ + 40, x1 - x0, 24, T("#5a6370"), None, 0, wob=0)           # дальняя полоса
    for k in range(int((x1 - x0) / 140)):
        D.rect(ctx, x0 + k * 140, HZ + 50, 70, 4, T("#f4f4f0"), None, 0, wob=0)
    D.rect(ctx, x0, HZ + 150, x1 - x0, 2600, T("#7d868f"), None, 0, wob=0)         # бетон перрона
    D.col(ctx, T("#6e777f"))
    ctx.set_line_width(3)
    for k in range(int((x1 - x0) / 260) + 1):
        ctx.move_to(x0 + k * 260, HZ + 150)
        ctx.line_to(x0 + k * 260 - 360, HZ + 2700)
    for k in range(5):
        ctx.move_to(x0, HZ + 200 + k * k * 30)
        ctx.line_to(x1, HZ + 200 + k * k * 30)
    ctx.stroke()
    # жёлтая разметка рулёжки и красная граница
    D.rect(ctx, x0, GY - 40, x1 - x0, 8, T("#f2c230"), None, 0, wob=0)
    D.rect(ctx, x0, GY + 120, x1 - x0, 6, T("#e8423c"), None, 0, wob=0, alpha=0.7)
    # терминал
    a, b = TERM_X
    D.rect(ctx, a, 300, b - a, 450, T("#e9edf0"), INK, 5, wob=0)
    D.poly(ctx, [(a - 40, 300), (a + 200, 230), (b - 200, 230), (b + 40, 300)], T("#c9d0d6"), INK, 5, wob=0)
    D.rect(ctx, a, 330, b - a, 290, T("#9fd8ec") if not night else (hexrgb("#ffd978") if lit else T("#2a3a5a")),
           INK, 4, wob=0)
    for k in range(int((b - a) / 120)):
        D.line(ctx, a + k * 120, 330, a + k * 120, 620, T("#5a6370"), 5)
    D.line(ctx, a, 470, b, 470, T("#5a6370"), 4)
    D.rect(ctx, a, 620, b - a, 130, T("#c9d0d6"), INK, 4, wob=0)
    D.text(ctx, "LAKESHORE INTERNATIONAL", (a + b) / 2, 284, 54, D.FONT_TITLE, T(NAVY))
    logo(ctx, a + 140, 268, 40, tod)
    for i, g in enumerate(GATES):
        _jet_bridge(ctx, g, T)
        D.rect(ctx, g + 20, 640, 90, 44, T("#1c1f28"), INK, 3, wob=0)
        D.text(ctx, "ABBBC"[i] + str(i + 1), g + 65, 676, 32, D.FONT_TITLE, T("#ffd23a"))
    # вышка
    tx = TOWER_X
    D.poly(ctx, [(tx - 60, 750), (tx - 36, 120), (tx + 36, 120), (tx + 60, 750)], T("#e9edf0"), INK, 5, wob=0)
    D.rect(ctx, tx - 30, 160, 60, 560, T("#d8dee2"), None, 0, wob=0)
    D.poly(ctx, [(tx - 120, 20), (tx + 120, 20), (tx + 100, 120), (tx - 100, 120)],
           T("#2a3a5a") if not lit else hexrgb("#7fe0c8"), INK, 5, wob=0)
    D.poly(ctx, [(tx - 140, 0), (tx + 140, 0), (tx + 120, 20), (tx - 120, 20)], T("#c9d0d6"), INK, 4, wob=0)
    D.line(ctx, tx, 0, tx, -90, INK, 6)
    D.circle(ctx, tx, -94, 9, hexrgb("#e8423c"), None, 0)
    for k in range(4):
        D.line(ctx, tx - 100 + k * 66, 24, tx - 92 + k * 62, 116, INK, 3)
    # топливный склад
    fx = FUEL_X
    D.rect(ctx, fx - 330, 720, 660, 30, T("#9aa3ac"), INK, 3, wob=0)
    for i, (dx, c, lab) in enumerate(((-180, "#2f6fd0", "AVGAS"), (150, "#f4f4f0", "JET A"))):
        D.rect(ctx, fx + dx - 120, 520, 240, 210, T(c), INK, 5, wob=0)
        D.ellipse(ctx, fx + dx, 520, 120, 24, shade(T(c), 0.1), INK, 5)
        D.text(ctx, lab, fx + dx, 640, 40, D.FONT_TITLE, T("#fff6d8") if i == 0 else T(NAVY))
        if i == 0:
            D.text(ctx, "100LL", fx + dx, 690, 30, D.FONT_TITLE, T("#fff6d8"))
    for k in range(9):
        D.line(ctx, fx - 330 + k * 82, 690, fx - 330 + k * 82, 750, INK, 3)
    D.line(ctx, fx - 330, 700, fx + 330, 700, INK, 3)
    # ангар №9
    hx, hw = HANGAR_X, HANGAR_W
    D.poly(ctx, [(hx - hw / 2 - 30, 760), (hx - hw / 2 - 30, 420), (hx, 300), (hx + hw / 2 + 30, 420),
                 (hx + hw / 2 + 30, 760)], T("#d8dee2"), INK, 5, wob=0)
    for k in range(9):
        D.line(ctx, hx - hw / 2 + k * hw / 8, 430, hx - hw / 2 + k * hw / 8, 760, T("#bcc4ca"), 4)
    D.rect(ctx, hx - 70, 330, 140, 90, T("#e8423c"), INK, 4, wob=0)
    D.text(ctx, "9", hx, 404, 80, D.FONT_TITLE, T("#fff6d8"))
    D.text(ctx, "LAKESHORE FLIGHT SCHOOL", hx, 470, 34, D.FONT_TITLE, T(NAVY))
    # дальние ангары и деревья
    for k, hx2 in enumerate((5300, 7400, 7900)):
        D.poly(ctx, [(hx2 - 200, 750), (hx2 - 200, 560), (hx2, 500), (hx2 + 200, 560), (hx2 + 200, 750)],
               T("#c9d0d6"), INK, 4, wob=0)
    # конусы и разметка стоянок
    for g in GATES:
        D.rect(ctx, g + 60, GY - 36, 10, 140, T("#f4f4f0"), None, 0, wob=0, alpha=0.8)


def windsock(ctx, x, y, t, tod="day", wind=1.0):
    T = lambda c: tone(c, tod)
    D.line(ctx, x, y, x, y - 220, INK, 7)
    ang = 0.15 + 0.1 * math.sin(t * 2.0)
    for k in range(5):
        u = k / 5
        xx = x + 10 + u * 160 * wind
        yy = y - 210 + u * 40 * (1.2 - wind) + math.sin(t * 6 + k) * 4
        D.poly(ctx, [(xx, yy - 22 + u * 6), (xx + 34 * wind, yy - 20 + u * 6), (xx + 34 * wind, yy + 20 - u * 6),
                     (xx, yy + 22 - u * 6)], T("#ff7a1c" if k % 2 == 0 else "#f4f4f0"), INK, 3, wob=0)


def army_lights(ctx, t, x0, x1, y, a=1.0, seed=3):
    """Цепь прожекторов армейского кордона далеко у горизонта."""
    r = rng(seed)
    x = x0
    while x < x1:
        fl = 0.7 + 0.3 * math.sin(t * 3 + x)
        D.radial(ctx, x, y, 40, "#ffe9a0", 0.7 * a * fl, 0)
        D.circle(ctx, x, y, 4, hexrgb("#fff6d8"), None, 0, alpha=a)
        if r.random() < 0.2:
            D.radial(ctx, x, y, 22, "#ff4a3a", 0.6 * a * (0.5 + 0.5 * math.sin(t * 5 + x)), 0)
        x += r.uniform(60, 140)


def hangar_inside_door(ctx, x, w, top, bot, open_k, tod="day"):
    """Сдвижные ворота ангара: две створки уезжают в стороны."""
    T = lambda c: tone(c, tod)
    half = w / 2 * (1 - open_k)
    for side in (-1, 1):
        x0 = x - w / 2 if side < 0 else x + w / 2 - half
        D.rect(ctx, x0, top, half, bot - top, T("#c9d0d6"), INK, 5, wob=0)
        for k in range(int(half / 90) + 1):
            D.line(ctx, x0 + k * 90, top, x0 + k * 90, bot, T("#aeb6bc"), 4)


# --- карта аэропорта сверху ----------------------------------------------------------------
# Координаты карты: терминал в (0, 0), озеро сверху, полосы снизу. Хвост «K» — рулёжка Кило.

MAP_HANGAR = (3150, 640)
MAP_FUEL = (2250, 380)
MAP_TOWER = (1450, -260)
MAP_A1 = (-900, 300)
KILO = ((900, 760), (3000, 760))


def airport_map(ctx, tod="day", lake=True, labels=True, fence=True, t=0.0, army=0.0):
    T = lambda c: tone(c, tod)
    night = tod in NIGHT
    D.rect(ctx, -4200, -2600, 8800, 5200, T("#86c46a") if not night else T("#28402c"), None, 0, wob=0)
    if lake:
        D.blob(ctx, [(-4200, -2600), (4400, -2600), (4400, -1050), (2400, -900), (600, -1000), (-1600, -880),
                     (-4200, -1000)], T("#3fa8d8") if not night else T("#16295a"), INK, 6)
    # полосы
    for (cx, cy, L, ang) in ((0, 1150, 6400, 0.0), (-200, -620, 5200, 0.0), (-2300, 300, 3000, 1.15)):
        ctx.save()
        ctx.translate(cx, cy)
        ctx.rotate(ang)
        D.rect(ctx, -L / 2, -70, L, 140, T("#4a525c"), INK, 5, wob=0)
        for k in range(int(L / 220)):
            D.rect(ctx, -L / 2 + 120 + k * 220, -6, 110, 12, T("#f4f4f0"), None, 0, wob=0)
        for k in range(8):
            D.rect(ctx, -L / 2 + 30, -60 + k * 16, 70, 8, T("#f4f4f0"), None, 0, wob=0)
            D.rect(ctx, L / 2 - 100, -60 + k * 16, 70, 8, T("#f4f4f0"), None, 0, wob=0)
        ctx.restore()
    # рулёжки
    (kx0, ky), (kx1, _) = KILO
    D.rect(ctx, -2600, 760 - 40, 6000, 80, T("#5a636e"), INK, 3, wob=0)
    D.line(ctx, -2600, 760, 3400, 760, T("#f2c230"), 6)
    for xx in (-1800, -400, 1000, 2400):
        D.rect(ctx, xx - 40, 760, 80, 400, T("#5a636e"), None, 0, wob=0)
    # перрон и терминал
    D.rect(ctx, -2400, -260, 4600, 980, T("#7d868f"), INK, 4, wob=0)
    D.rrect(ctx, -700, -200, 1400, 330, 60, T("#e9edf0"), INK, 6)
    for i, (fx, fl) in enumerate(((-1700, 900), (-150, 0), (1400, 900))):
        D.rrect(ctx, fx - 110, -40, 220, 640, 50, T("#e9edf0"), INK, 6)
        D.rect(ctx, fx - 700 if i == 0 else fx - 110, 110, 810 if i != 1 else 0, 120, T("#e9edf0"), INK, 0,
               wob=0)
    D.rect(ctx, -1800, 100, 3300, 120, T("#e9edf0"), None, 0, wob=0)
    D.rect(ctx, -1810, 90, 3320, 140, None, INK, 6, wob=0)
    # вышка, склад, ангар
    D.circle(ctx, *MAP_TOWER, 70, T("#e9edf0"), INK, 5)
    D.circle(ctx, *MAP_TOWER, 34, T("#2a3a5a"), INK, 3)
    for dx in (-80, 80):
        D.circle(ctx, MAP_FUEL[0] + dx, MAP_FUEL[1], 60, T("#2f6fd0") if dx < 0 else T("#f4f4f0"), INK, 5)
    hx, hy = MAP_HANGAR
    D.rect(ctx, hx - 220, hy - 170, 440, 230, T("#d8dee2"), INK, 5, wob=0)
    D.rect(ctx, hx - 220, hy + 40, 440, 20, T("#e8423c"), None, 0, wob=0)
    for k in range(3):
        D.rect(ctx, -2300 + k * 200, 560, 160, 100, T("#c9d0d6"), INK, 3, wob=0)
    if fence:
        D.rrect(ctx, -3900, -900, 7900, 2600, 300, None, T("#f4f4f0") if not night else T("#8090a8"), 6)
        if army > 0:
            per = 2 * (7900 + 2600)
            n = 70
            for i in range(n):
                u = i / n * per
                if u < 7900:
                    px, py = -3900 + u, -900
                elif u < 7900 + 2600:
                    px, py = 4000, -900 + (u - 7900)
                elif u < 2 * 7900 + 2600:
                    px, py = 4000 - (u - 7900 - 2600), 1700
                else:
                    px, py = -3900, 1700 - (u - 2 * 7900 - 2600)
                if py < -880 and lake:
                    continue
                fl = 0.6 + 0.4 * math.sin(t * 3 + i)
                D.radial(ctx, px, py, 120, "#ffe9a0", 0.55 * army * fl, 0)
                D.circle(ctx, px, py, 14, hexrgb("#fff6d8"), None, 0, alpha=army)
    if labels:
        for (txt, x, y, sz) in (("TERMINAL", 0, -30, 90), ("A", -1700, 520, 90), ("B", -150, 520, 90),
                                ("C", 1400, 520, 90), ("TOWER", MAP_TOWER[0], MAP_TOWER[1] - 110, 60),
                                ("FUEL", MAP_FUEL[0], MAP_FUEL[1] - 90, 60), ("HANGAR 9", hx, hy - 50, 64),
                                ("TAXIWAY K", 2000, 860, 60), ("LAKE", -2000, -1500, 120)):
            D.text(ctx, txt, x, y, sz, D.FONT_TITLE, T(NAVY) if txt != "LAKE" else T("#fff6d8"))


# --- полоса в перспективе (экранные координаты) --------------------------------------------

def runway_persp(ctx, t, tod="day", run=0.0, hy=520, vx=W / 2, w_near=2600, lights=1.0, grass=True):
    """Вид из кабины/с земли вдоль рулёжки: run — пройденное расстояние (для бегущих полос)."""
    T = lambda c: tone(c, tod)
    if grass:
        D.rect(ctx, 0, hy, W, H - hy, T("#7cc464"), None, 0, wob=0)
        for k in range(14):
            yy = hy + (H - hy) * (k / 14) ** 1.6
            D.line(ctx, 0, yy, W, yy, T("#6db456"), 2)
    D.poly(ctx, [(vx - 8, hy), (vx + 8, hy), (vx + w_near / 2, H + 40), (vx - w_near / 2, H + 40)], T("#5a636e"),
           None, 0, wob=0)
    # разметка: осевая бежит к зрителю
    n = 14
    for k in range(n):
        u = ((k + run * 0.08) % n) / n
        d0, d1 = u ** 2.2, min(1.0, (u + 0.035)) ** 2.2
        y0, y1 = hy + (H + 40 - hy) * d0, hy + (H + 40 - hy) * d1
        w0, w1 = 6 + 26 * d0, 6 + 26 * d1
        D.poly(ctx, [(vx - w0 / 2, y0), (vx + w0 / 2, y0), (vx + w1 / 2, y1), (vx - w1 / 2, y1)], T("#f2c230"), None,
               0, wob=0)
        for side in (-1, 1):
            ex0 = vx + side * (8 + (w_near / 2 - 8) * d0)
            if lights > 0:
                D.circle(ctx, ex0 + side * 10, y0, 3 + 12 * d0, hexrgb("#4f8fff") if tod in NIGHT else T("#dfe6ee"),
                         INK, 1 + 2 * d0, alpha=0.9)
    for side in (-1, 1):
        D.line(ctx, vx + side * 8, hy, vx + side * w_near / 2, H + 40, T("#f4f4f0"), 6)
