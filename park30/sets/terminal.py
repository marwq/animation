"""Терминал изнутри: галерея с выходами (стеклянная стена на перрон с лайнерами), главный зал
со скелетом динозавра, дьюти-фри, лаунж первого класса, закусочная, паспортный контроль,
выдача багажа, магазин игрушек. Пол — линия FL, мир по x от -1200 до 6400."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1, W, H
from engine import draw as D
from . import sea as SEA
from .base import tone, logo, NAVY, TEAL, SUNC, WHITE, INK, NIGHT
from . import plane as PL

FL = 900                 # пол (ноги героев)
WIN = (40, 700)          # стеклянная стена: верх и низ
X0, X1 = -1400, 6600
GATE_STEP = 1500


def gate_xs(letter="A"):
    return [100 + i * GATE_STEP for i in range(4)]


def carpet(ctx, x0, x1, y0, y1, T, base="#1f8c94", seed=1):
    """Узнаваемый ковёр аэропорта: бирюза с цветными точками и чёрточками."""
    D.rect(ctx, x0, y0, x1 - x0, y1 - y0, T(base), None, 0, wob=0)
    r = rng(seed)
    cols = ["#f2c230", "#e8423c", "#f4f4f0", "#7a4fc2", "#ff9a3c", "#3fbf6a"]
    n = int((x1 - x0) * (y1 - y0) / 9000)
    for k in range(n):
        x, y = r.uniform(x0, x1), r.uniform(y0, y1)
        c = T(r.choice(cols))
        if r.random() < 0.5:
            D.circle(ctx, x, y, r.uniform(4, 8), c, None, 0)
        else:
            a = r.uniform(0, TAU)
            D.line(ctx, x, y, x + math.cos(a) * 16, y + math.sin(a) * 6, c, 5)
    for k in range(6):
        yy = y0 + (y1 - y0) * (k / 6) ** 1.4
        D.line(ctx, x0, yy, x1, yy, T(shade(hexrgb(base), -0.08)), 2)


def outside_view(ctx, x0, x1, y0, y1, tod, power=1.0, seed=0, jets=True):
    """Вид за стеклом: небо, полоса, лайнеры у телетрапов."""
    T = lambda c: tone(c, tod)
    sky_tod = "sunset" if tod == "golden" else tod
    ctx.save()
    ctx.rectangle(x0, y0, x1 - x0, y1 - y0)
    ctx.clip()
    SEA.sky(ctx, x0, y0, x1 - x0, y1 - y0 - 140, sky_tod)
    if tod in NIGHT:
        SEA.stars(ctx, x0, y0, x1 - x0, 300, 0, seed + 3, 0.8)
    else:
        for k in range(int((x1 - x0) / 900) + 1):
            SEA.cloud(ctx, x0 + 300 + k * 900, y0 + 120 + (k % 2) * 60, 0.8, tod, seed + k, alpha=0.95)
    D.rect(ctx, x0, y1 - 160, x1 - x0, 30, T("#7cc464"), None, 0, wob=0)
    D.rect(ctx, x0, y1 - 130, x1 - x0, 130, T("#7d868f"), None, 0, wob=0)
    D.rect(ctx, x0, y1 - 70, x1 - x0, 6, T("#f2c230"), None, 0, wob=0)
    if jets:
        for k in range(int((x1 - x0) / GATE_STEP) + 1):
            jx = x0 + 650 + k * GATE_STEP
            PL.jet(ctx, jx, y1 - 20, 0.34, 1 if k % 2 else -1, tod, lit=1.0 if power > 0 and tod in NIGHT else 0.0,
                   shadow=False)
    ctx.restore()


def gate_sign(ctx, x, y, txt, T, s=1.0):
    D.line(ctx, x, -150, x, y - 40 * s, INK, 5)
    D.rrect(ctx, x - 90 * s, y - 40 * s, 180 * s, 80 * s, 10, T("#15181f"), INK, 4)
    D.text(ctx, txt, x, y + 26 * s, 66 * s, D.FONT_TITLE, T("#ffd23a"))


def flight_board(ctx, x, y, w, h, T, rows=None, power=1.0, title="DEPARTURES"):
    D.rrect(ctx, x, y, w, h, 12, T("#15181f"), INK, 5)
    D.text(ctx, title, x + 16, y + 44, 36 if w > 500 else 30, D.FONT_TITLE, T("#fff6d8"), "left")
    rows = rows or [("902", "LONDON", "LANDED"), ("118", "DENVER", "CANCELLED"), ("455", "MIAMI", "CANCELLED"),
                    ("731", "TOKYO", "CANCELLED"), ("260", "BOSTON", "CANCELLED")]
    for i, (fn, city, st) in enumerate(rows[:int((h - 70) / 44)]):
        yy = y + 90 + i * 44
        if power <= 0:
            continue
        fs = 28 if w > 500 else 20
        D.text(ctx, fn, x + 16, yy, fs, D.FONT_TITLE, T("#ffd23a"), "left")
        D.text(ctx, city, x + 16 + fs * 2.6, yy, fs, D.FONT_TITLE, T("#f4f4f0"), "left")
        D.text(ctx, st, x + w - 16, yy, fs, D.FONT_TITLE, T("#ff4a3a" if st != "LANDED" else "#4cff8a"), "right")


def seats(ctx, x, n, T, c="#2f6fd0", y=FL - 10):
    """Ряд кресел зала ожидания (сбоку: спинки и сиденья)."""
    for k in range(n):
        sx = x + k * 70
        D.rrect(ctx, sx, y - 120, 56, 70, 12, T(c), INK, 3)
        D.rect(ctx, sx - 4, y - 56, 66, 16, T(shade(hexrgb(c), -0.15)), INK, 3, wob=0)
    D.line(ctx, x - 10, y - 40, x + n * 70, y - 40, INK, 6)
    for k in (0, n - 1):
        D.line(ctx, x + k * 70 + 28, y - 40, x + k * 70 + 28, y, INK, 6)


def storefront(ctx, x, w, name, c, T, goods="shop", lit=1.0, seed=0):
    """Магазин в задней стене: вывеска, витрина, товары."""
    D.rect(ctx, x, WIN[0] + 60, w, FL - WIN[0] - 70, T("#f4f1ea"), INK, 4, wob=0)
    D.rect(ctx, x, WIN[0] + 60, w, 110, T(c), INK, 4, wob=0)
    D.text(ctx, name, x + w / 2, WIN[0] + 140, 58, D.FONT_TITLE, T("#fff6d8"))
    gx0, gy0, gw, gh = x + 30, WIN[0] + 200, w - 60, FL - WIN[0] - 260
    D.rect(ctx, gx0, gy0, gw, gh, T("#fff8e8") if lit else T("#3a4050"), INK, 3, wob=0)
    r = rng(seed)
    if goods == "toys":
        for k in range(int(gw / 120)):
            for j in range(3):
                bx, by = gx0 + 20 + k * 120, gy0 + 30 + j * (gh - 40) / 3
                D.rect(ctx, bx, by + 70, 100, 8, T("#c9b89a"), None, 0, wob=0)
                kind = r.randint(0, 2)
                cc = T(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#3fbf6a", "#f08cb0"]))
                if kind == 0:
                    PL.rc_plane(ctx, bx + 50, by + 40, 0.55, 1, 0.0, 0.0)
                elif kind == 1:
                    D.circle(ctx, bx + 50, by + 40, 28, cc, INK, 3)
                    D.circle(ctx, bx + 32, by + 16, 10, cc, INK, 3)
                    D.circle(ctx, bx + 68, by + 16, 10, cc, INK, 3)
                else:
                    D.rect(ctx, bx + 18, by + 10, 64, 60, cc, INK, 3, wob=0)
    elif goods == "coffee":
        for k in range(int(gw / 90)):
            D.rrect(ctx, gx0 + 20 + k * 90, gy0 + gh - 110, 50, 70, 8, T(r.choice(["#f4f4f0", "#7a4a30"])), INK, 3)
        D.rrect(ctx, gx0 + 20, gy0 + 20, gw - 40, 90, 10, T("#2b2f3a"), INK, 3)
        D.text(ctx, "LATTE · MOCHA · TEA", gx0 + gw / 2, gy0 + 76, 30, D.FONT_TITLE, T("#fff6d8"))
    else:
        for k in range(int(gw / 60)):
            for j in range(4):
                D.rect(ctx, gx0 + 14 + k * 60, gy0 + 20 + j * 70, 44, 54,
                       T(r.choice(["#e8423c", "#f2c230", "#2f8fd8", "#3fbf6a", "#7a4fc2", "#f4f4f0"])), INK, 2, wob=0)


def concourse(ctx, tod="day", power=1.0, letter="A", x0=X0, x1=X1, shops=None):
    """Галерея с выходами. shops: {номер промежутка: (имя, цвет, товары)} вместо окна."""
    T = lambda c: tone(c, "day" if power > 0 and tod not in NIGHT else tod)
    night = tod in NIGHT
    shops = shops if shops is not None else {1: ("SKY TOYS", "#e8423c", "toys"), 2: ("LAKE BREW", "#7a4a30", "coffee")}
    # вид за стеклом
    outside_view(ctx, x0, x1, WIN[0], WIN[1], tod, power)
    # каркас стеклянной стены
    for k in range(int((x1 - x0) / 250) + 1):
        xx = x0 + k * 250
        D.rect(ctx, xx - 8, WIN[0], 16, WIN[1] - WIN[0], T("#dfe5ea"), INK, 2, wob=0)
    D.rect(ctx, x0, 360, x1 - x0, 12, T("#dfe5ea"), INK, 2, wob=0)
    ctx.save()
    ctx.rectangle(x0, WIN[0], x1 - x0, WIN[1] - WIN[0])
    ctx.clip()
    for k in range(int((x1 - x0) / 500) + 1):
        xx = x0 + k * 500
        D.poly(ctx, [(xx, WIN[0]), (xx + 90, WIN[0]), (xx - 160, WIN[1]), (xx - 250, WIN[1])], (1, 1, 1), None, 0,
               wob=0, alpha=0.12)
    ctx.restore()
    # потолок: фермы и световые полосы
    wall = T("#f2efe8")
    D.rect(ctx, x0, -600, x1 - x0, WIN[0] + 600, wall, None, 0, wob=0)
    for k in range(int((x1 - x0) / 400) + 1):
        xx = x0 + k * 400
        D.poly(ctx, [(xx, -600), (xx + 200, WIN[0]), (xx + 400, -600)], None, T("#d8d2c4"), 6, wob=0)
    D.rect(ctx, x0, WIN[0] - 30, x1 - x0, 30, T("#d8d2c4"), INK, 3, wob=0)
    for k in range(int((x1 - x0) / 300) + 1):
        D.rrect(ctx, x0 + k * 300 + 60, -120, 180, 26, 12, hexrgb("#fff8e0") if power > 0 else T("#8a8a90"), INK, 2)
    # магазины в стене
    for idx, (name, c, goods) in shops.items():
        sx = 100 + idx * GATE_STEP - GATE_STEP / 2 - 300
        storefront(ctx, sx, 600, name, c, T, goods, lit=power, seed=idx)
    # нижняя стенка под окнами
    D.rect(ctx, x0, WIN[1], x1 - x0, FL - WIN[1] - 70, T("#d8d2c4"), INK, 3, wob=0)
    for k in range(int((x1 - x0) / 120)):
        D.line(ctx, x0 + k * 120, WIN[1] + 20, x0 + k * 120, FL - 90, T("#c4beb0"), 3)
    # ковёр
    carpet(ctx, x0, x1, FL - 70, FL + 900, T, seed=ord(letter))
    # выходы: стойки, табло, кресла
    for i, gx in enumerate(gate_xs(letter)):
        name = "%s%d" % (letter, i + 1)
        gate_sign(ctx, gx, 140, name, T)
        flight_board(ctx, gx + 160, 120, 330, 210, T, power=power, title=name)
        D.rect(ctx, gx - 110, FL - 170, 220, 110, T("#2b3550"), INK, 4, wob=0)
        D.rect(ctx, gx - 120, FL - 184, 240, 20, T("#e9edf0"), INK, 3, wob=0)
        logo(ctx, gx, FL - 115, 34, tod if power <= 0 else "day")
        D.line(ctx, gx + 70, FL - 184, gx + 90, FL - 250, INK, 4)          # микрофон на стойке
        D.ellipse(ctx, gx + 92, FL - 256, 10, 14, T("#2b2f3a"), INK, 2)
        seats(ctx, gx + 260, 6, T)
        seats(ctx, gx - 720, 6, T, "#e8423c")
    # урны, растения
    for k in range(int((x1 - x0) / 750)):
        px = x0 + 380 + k * 750
        D.rrect(ctx, px, FL - 140, 70, 100, 14, T("#e2e8ee"), INK, 3)
        D.circle(ctx, px + 35, FL - 170, 40, T("#3fbf6a"), INK, 3)
        D.circle(ctx, px + 10, FL - 150, 26, T("#2f9a4a"), INK, 3)
    if night and power <= 0:
        pass


def walkway(ctx, x0, x1, y, t=0.0, tod="day", run=1.0):
    """Движущаяся дорожка перед камерой: чёрная лента с бегущими рёбрами и стеклянные бортики."""
    T = lambda c: tone(c, tod)
    D.rect(ctx, x0, y, x1 - x0, 40, T("#2b2f3a"), INK, 4, wob=0)
    off = (t * 120 * run) % 40
    for k in range(int((x1 - x0) / 40) + 1):
        D.line(ctx, x0 + k * 40 + off, y + 4, x0 + k * 40 + off, y + 36, T("#4a505c"), 3)
    D.rect(ctx, x0, y - 120, x1 - x0, 110, T("#9fd8ec"), INK, 3, wob=0, alpha=0.35)
    D.rect(ctx, x0, y - 128, x1 - x0, 14, T("#2b2f3a"), INK, 3, wob=0)
    D.rrect(ctx, x0 - 60, y - 128, 80, 168, 30, T("#c9d0d6"), INK, 4)
    D.rrect(ctx, x1 - 20, y - 128, 80, 168, 30, T("#c9d0d6"), INK, 4)


# --- главный зал со скелетом ------------------------------------------------------------------

def dino(ctx, x, gy, s=1.0, tod="day"):
    """Скелет зауропода на подставке: длинная шея вверх, хвост назад."""
    T = lambda c: tone(c, tod)
    bone = T("#f2e6c8")
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    D.rect(ctx, -520, -40, 1040, 40, T("#6b4a33"), INK, 4, wob=0)
    # хребет
    spine = [(-760, -330), (-560, -400), (-300, -470), (-60, -500), (160, -520), (300, -640), (380, -820),
             (430, -1000), (500, -1080)]
    D.catmull(ctx, spine)
    D.col(ctx, INK)
    ctx.set_line_width(30)
    ctx.stroke()
    D.catmull(ctx, spine)
    D.col(ctx, bone)
    ctx.set_line_width(20)
    ctx.stroke()
    for k in range(1, len(spine) - 1):
        px, py = spine[k]
        D.ellipse(ctx, px, py - 20, 18, 26, bone, INK, 3)
    # рёбра
    for k in range(9):
        rx = -360 + k * 60
        ry = -470 - k * 4
        ctx.move_to(rx, ry)
        ctx.curve_to(rx - 20, ry + 80, rx - 10, ry + 170, rx + 30, ry + 200)
        D.col(ctx, INK)
        ctx.set_line_width(14)
        ctx.stroke_preserve()
        D.col(ctx, bone)
        ctx.set_line_width(8)
        ctx.stroke()
    # ноги
    for (lx, ln) in ((-420, -440), (-300, -450), (40, -500), (160, -510)):
        D.polyline(ctx, [(lx, ln), (lx - 20, -220), (lx + 10, -40)], INK, 30)
        D.polyline(ctx, [(lx, ln), (lx - 20, -220), (lx + 10, -40)], bone, 20)
        D.ellipse(ctx, lx + 20, -40, 40, 14, bone, INK, 3)
    # череп
    D.ellipse(ctx, 540, -1090, 60, 34, bone, INK, 4, rot=0.2)
    D.circle(ctx, 556, -1100, 10, INK, None, 0)
    D.line(ctx, 520, -1066, 590, -1060, INK, 4)
    ctx.restore()


def main_hall(ctx, tod="day", power=1.0, x0=-1400, x1=4600):
    T = lambda c: tone(c, "day" if power > 0 and tod not in NIGHT else tod)
    # огромные окна под сводом
    SEA.sky(ctx, x0, -1400, x1 - x0, 2000, "sunset" if tod == "golden" else tod)
    if tod not in NIGHT:
        for k in range(5):
            SEA.cloud(ctx, x0 + 500 + k * 1200, -500 + (k % 2) * 140, 1.2, tod, k)
    for k in range(int((x1 - x0) / 300) + 1):
        D.line(ctx, x0 + k * 300, -900, x0 + k * 300, 600, T("#dfe5ea"), 14)
    for yy in (-500, -100, 300):
        D.line(ctx, x0, yy, x1, yy, T("#dfe5ea"), 10)
    # свод
    ctx.move_to(x0, -900)
    for k in range(13):
        u = k / 12
        ctx.line_to(lerp(x0, x1, u), -900 - 160 * math.sin(math.pi * u))
    ctx.line_to(x1, -1400)
    ctx.line_to(x0, -1400)
    ctx.close_path()
    D.col(ctx, T("#e9e4d8"))
    ctx.fill()
    # стена и стойки регистрации
    D.rect(ctx, x0, 600, x1 - x0, FL - 600, T("#e9e4d8"), INK, 4, wob=0)
    D.rect(ctx, x0, 600, x1 - x0, 70, T(NAVY), INK, 4, wob=0)
    D.text(ctx, "LAKESHORE INTERNATIONAL · WELCOME", (x0 + x1) / 2, 654, 48, D.FONT_TITLE, T("#fff6d8"))
    for k in range(int((x1 - x0) / 360)):
        cx = x0 + 150 + k * 360
        D.rect(ctx, cx, FL - 170, 260, 130, T("#f4f4f0"), INK, 4, wob=0)
        D.rect(ctx, cx, FL - 170, 260, 24, T(TEAL), INK, 3, wob=0)
        D.rect(ctx, cx + 80, 700, 100, 60, T("#15181f"), INK, 3, wob=0)
        D.text(ctx, str(k + 1), cx + 130, 746, 40, D.FONT_TITLE, T("#ffd23a"))
    flight_board(ctx, 2600, -40, 900, 420, T, power=power)
    D.rect(ctx, x0, FL - 40, x1 - x0, 1200, T("#d8d2c4"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 200)):
        D.line(ctx, x0 + k * 200, FL - 40, x0 + k * 200 - 300, FL + 600, T("#c8c0b0"), 3)
    dino(ctx, 1100, FL - 20, 1.35, tod if power <= 0 else "day")
    # флаги
    r = rng(2)
    for k in range(12):
        fx = x0 + 400 + k * 450
        D.line(ctx, fx, -700, fx, -560, INK, 3)
        D.rect(ctx, fx - 40, -560, 80, 120, T(r.choice(["#e8423c", "#2f8fd8", "#f2c230", "#3fbf6a", "#7a4fc2"])), INK,
               3, wob=0)


# --- комнаты терминала -----------------------------------------------------------------------

def duty_free(ctx, power=1.0, x0=-600, x1=3800):
    T = lambda c: tone(c, "day" if power > 0 else "night")
    D.rect(ctx, x0, -1500, x1 - x0, FL + 1500, T("#fbf6ee"), None, 0, wob=0)
    D.rect(ctx, x0, -500, x1 - x0, 440, T("#efe4f6"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 260) + 1):
        D.radial(ctx, x0 + 130 + k * 260, -20, 120, "#fff3c8", 0.8 if power > 0 else 0.0, 0)
        D.ellipse(ctx, x0 + 130 + k * 260, -40, 60, 14, T("#fff8e0") if power > 0 else T("#8a8a90"), INK, 2)
    D.rect(ctx, x0, 40, x1 - x0, 120, T("#7a4fc2"), INK, 4, wob=0)
    D.text(ctx, "DUTY FREE", (x0 + x1) / 2, 128, 90, D.FONT_TITLE, T("#fff6d8"))
    for k, txt in enumerate(("SALE -30%", "TAX FREE!", "NEW!")):
        px = x0 + 1750 + k * 520
        D.rrect(ctx, px - 150, 260, 300, 110, 20, T(["#e8423c", "#f2c230", "#3fbf6a"][k]), INK, 4)
        D.text(ctx, txt, px, 334, 48, D.FONT_TITLE, T("#fff6d8"))
    r = rng(5)
    # стеллажи духов
    for k in range(3):
        sx = x0 + 100 + k * 500
        D.rect(ctx, sx, 220, 420, 520, T("#f2e9d8"), INK, 4, wob=0)
        for j in range(5):
            D.rect(ctx, sx, 300 + j * 90, 420, 10, T("#c9b89a"), None, 0, wob=0)
            for b in range(8):
                bc = T(r.choice(["#f08cb0", "#9a6ad0", "#f2c230", "#7fd0ff", "#3fbf6a", "#e8423c"]))
                bx = sx + 20 + b * 50
                D.rrect(ctx, bx, 300 + j * 90 - 54, 30, 50, 6, bc, INK, 2, alpha=0.9)
                D.rect(ctx, bx + 10, 300 + j * 90 - 66, 10, 12, T("#e3b84a"), INK, 1.5, wob=0)
    # пирамиды шоколада
    for k in range(3):
        px = x0 + 1800 + k * 520
        D.rect(ctx, px - 180, FL - 160, 360, 120, T("#6b3a24"), INK, 4, wob=0)
        for row in range(5):
            for b in range(5 - row):
                bx = px - 150 + row * 30 + b * 60
                by = FL - 200 - row * 46
                D.poly(ctx, [(bx, by + 40), (bx + 28, by), (bx + 56, by + 40)],
                       T(r.choice(["#e8423c", "#f2c230", "#7a4a30", "#2f8fd8"])), INK, 3, wob=0)
        D.text(ctx, "CHOCOLATE", px, FL - 100, 34, D.FONT_TITLE, T("#fff6d8"))
    # очки на вращающейся стойке
    sx = x1 - 300
    D.line(ctx, sx, FL - 40, sx, 320, INK, 10)
    for j in range(6):
        D.ellipse(ctx, sx - 30, 360 + j * 70, 22, 16, T("#1e2230"), INK, 3)
        D.ellipse(ctx, sx + 30, 360 + j * 70, 22, 16, T("#1e2230"), INK, 3)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#efe6d6"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 160)):
        D.line(ctx, x0 + k * 160, FL - 40, x0 + k * 160 - 220, FL + 500, T("#e0d4be"), 3)


def lounge(ctx, tod="day", x0=-600, x1=3800):
    T = lambda c: tone(c, "day")
    D.rect(ctx, x0, -1500, x1 - x0, FL + 1500, T("#5a3a26"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 80)):
        D.line(ctx, x0 + k * 80, -500, x0 + k * 80, FL, T("#4e3220"), 3)
    # окно
    outside_view(ctx, x0 + 1300, x0 + 3300, 120, 640, tod, 1.0, seed=4)
    D.rect(ctx, x0 + 1300, 120, 2000, 520, None, INK, 10, wob=0)
    D.rect(ctx, x0 + 200, 90, 900, 110, T("#2b2015"), INK, 4, wob=0)
    D.text(ctx, "FIRST CLASS LOUNGE", x0 + 650, 168, 54, D.FONT_TITLE, T("#e3b84a"))
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#c9a46a"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 140)):
        D.line(ctx, x0 + k * 140, FL - 40, x0 + k * 140 - 200, FL + 600, T("#b8925a"), 3)
    # буфет
    bx = x0 + 120
    D.rect(ctx, bx, FL - 200, 800, 160, T("#f4f1ea"), INK, 4, wob=0)
    r = rng(8)
    for k in range(7):
        D.ellipse(ctx, bx + 60 + k * 110, FL - 214, 44, 14, T("#ffffff"), INK, 3)
        D.circle(ctx, bx + 60 + k * 110, FL - 232, 18, T(r.choice(["#f2c230", "#e8423c", "#3fbf6a", "#f08cb0"])), INK,
                 2.5)
    # массажные кресла
    for k in range(2):
        mx = x0 + 3500 - k * 260
        D.rrect(ctx, mx - 70, FL - 300, 140, 260, 50, T("#2b2f3a"), INK, 4)
        D.rrect(ctx, mx - 60, FL - 150, 160, 70, 26, T("#3a3f4a"), INK, 4)


def sofa(ctx, x, gy, w=520, c="#7a4a2a", T=lambda c: c):
    D.rrect(ctx, x, gy - 210, w, 120, 30, T(c), INK, 4)
    D.rrect(ctx, x - 30, gy - 130, w + 60, 90, 24, T(shade(hexrgb(c), 0.08)), INK, 4)
    D.rrect(ctx, x - 50, gy - 170, 60, 140, 24, T(c), INK, 4)
    D.rrect(ctx, x + w - 10, gy - 170, 60, 140, 24, T(c), INK, 4)
    D.line(ctx, x, gy - 40, x, gy, INK, 6)
    D.line(ctx, x + w, gy - 40, x + w, gy, INK, 6)


def diner(ctx, power=1.0, x0=-600, x1=3400):
    T = lambda c: tone(c, "day" if power > 0 else "night")
    D.rect(ctx, x0, -1500, x1 - x0, FL + 1500, T("#f6e3c4"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 60)):
        D.rect(ctx, x0 + k * 60, 520, 30, 30, T("#e8423c" if k % 2 else "#f4f4f0"), None, 0, wob=0)
    D.rrect(ctx, x0 + 600, 80, 1300, 150, 40, T("#2f8fd8"), INK, 5)
    D.text(ctx, "RUNWAY DINER", x0 + 1250, 180, 80, D.FONT_TITLE, T("#fff6d8"))
    if power > 0:
        D.rrect(ctx, x0 + 600, 80, 1300, 150, 40, None, hexrgb("#ff6ad0"), 6, alpha=0.6)
    # меню и раздача
    D.rect(ctx, x0 + 300, 280, 1800, 200, T("#2b2f3a"), INK, 4, wob=0)
    for k, txt in enumerate(("PANCAKES 5.99", "BURGER 8.99", "SHAKE 4.49", "FRIES 2.99")):
        D.text(ctx, txt, x0 + 520 + k * 450, 400, 34, D.FONT_TITLE, T("#ffd23a"))
    D.rect(ctx, x0, 560, x1 - x0, FL - 600, T("#d8d2c4"), INK, 3, wob=0)
    D.rect(ctx, x0 + 200, FL - 220, 2400, 70, T("#e8423c"), INK, 4, wob=0)
    D.rect(ctx, x0 + 220, FL - 150, 2360, 110, T("#c9d0d6"), INK, 4, wob=0)
    for k in range(10):
        sx = x0 + 300 + k * 230
        D.line(ctx, sx, FL - 30, sx, FL - 110, INK, 8)
        D.ellipse(ctx, sx, FL - 120, 44, 14, T("#e8423c"), INK, 3)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#f4f4f0"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 90)):
        for j in range(12):
            if (k + j) % 2:
                D.rect(ctx, x0 + k * 90, FL - 40 + j * 70, 90, 70, T("#2b2f3a"), None, 0, wob=0)


def passport(ctx, x0=-600, x1=4200, tod="day"):
    T = lambda c: tone(c, "day")
    D.rect(ctx, x0, -1500, x1 - x0, FL + 1500, T("#eef1f3"), None, 0, wob=0)
    D.rect(ctx, x0, 60, x1 - x0, 110, T(NAVY), INK, 4, wob=0)
    D.text(ctx, "PASSPORT CONTROL · ARRIVALS", (x0 + x1) / 2, 136, 60, D.FONT_TITLE, T("#fff6d8"))
    for k in range(5):
        bx = x0 + 300 + k * 800
        D.rect(ctx, bx, 330, 420, FL - 370, T("#c9d0d6"), INK, 4, wob=0)
        D.rect(ctx, bx + 20, 350, 380, 240, T("#9fd8ec"), INK, 3, wob=0, alpha=0.6)
        D.rect(ctx, bx - 10, 590, 440, 30, T("#e9edf0"), INK, 3, wob=0)
        D.rect(ctx, bx + 150, 270, 120, 50, T("#15181f"), INK, 3, wob=0)
        D.text(ctx, str(k + 1), bx + 210, 310, 40, D.FONT_TITLE, T("#4cff8a"))
    for k in range(int((x1 - x0) / 300)):
        px = x0 + 150 + k * 300
        D.line(ctx, px, FL - 20, px, FL - 140, INK, 8)
        D.circle(ctx, px, FL - 140, 10, T("#c9d0d6"), INK, 3)
        if k < int((x1 - x0) / 300) - 1:
            D.curve(ctx, [(px, FL - 130), (px + 150, FL - 100), (px + 300, FL - 130)], T("#e8423c"), 8)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#d8dee2"), None, 0, wob=0)


def baggage_claim(ctx, t=0.0, x0=-800, x1=3600, power=1.0, tod="day", run=1.0):
    """Публичная выдача багажа: овальная карусель с пластинами (вид сбоку), табло «BAGGAGE CLAIM 3»."""
    T = lambda c: tone(c, "day" if power > 0 else tod)
    D.rect(ctx, x0, -1500, x1 - x0, FL + 1500, T("#eceae4"), None, 0, wob=0)
    D.rect(ctx, x0, 80, x1 - x0, 110, T(TEAL), INK, 4, wob=0)
    D.text(ctx, "BAGGAGE CLAIM 3", (x0 + x1) / 2, 160, 70, D.FONT_TITLE, T("#fff6d8"))
    flight_board(ctx, 400, 240, 520, 260, T, rows=[("902", "LONDON", "BELT 3")], power=power, title="ARRIVALS")
    D.rect(ctx, 1500, 260, 380, 380, T("#2b2f3a"), INK, 4, wob=0)
    for k in range(6):
        D.line(ctx, 1500, 290 + k * 60, 1880, 290 + k * 60, T("#4a505c"), 10)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#d8d2c4"), None, 0, wob=0)
    cx, cw = 1300, 2000
    D.rect(ctx, cx - cw / 2, FL - 140, cw, 100, T("#9aa3ac"), INK, 5, wob=0)
    D.rect(ctx, cx - cw / 2, FL - 170, cw, 34, T("#2b2f3a"), INK, 4, wob=0)
    off = (t * 140 * run) % 80
    for k in range(int(cw / 80) + 1):
        xx = cx - cw / 2 + k * 80 + off
        if xx < cx + cw / 2:
            D.line(ctx, xx, FL - 168, xx - 20, FL - 138, T("#5a606c"), 4)
