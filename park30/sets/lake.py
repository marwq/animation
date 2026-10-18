"""Озеро и остров: вода вблизи, мост с затором машин, маяк вблизи (эпилог), лагуна парка,
карта острова (вид сверху), фейерверки, гроза."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU
from engine import draw as D
from sets import sea as SEA
from sets.base import tone, NIGHT
from sets.park import star, BRIGHT

INK = D.INK


def Tf(tod):
    return lambda c: tone(c, tod)


# --- вода -------------------------------------------------------------------------

def water(ctx, t, x0, x1, y0, y1, tod="day", rough=0.0, seed=1, glitter=1.0):
    SEA.ocean(ctx, t, x0, x1, y0, y1, tod, rough=rough, seed=seed, glitter=glitter)


def lagoon(ctx, t, x0, x1, y0, y1, tod="day", seed=2):
    """Лагуна парка: бирюзовая вода с кувшинками и бликами, бетонный бортик."""
    T = Tf(tod)
    D.vgrad(ctx, x0, y0, x1 - x0, y1 - y0, [(0, T("#3fc3d8")), (1, T("#0f8fb8"))])
    r = rng(seed)
    for k in range(int((x1 - x0) / 70)):
        wx = x0 + (k * 70 + t * 25 + r.uniform(0, 70)) % (x1 - x0)
        wy = y0 + 40 + r.uniform(0, y1 - y0 - 60)
        D.line(ctx, wx, wy, wx + 34, wy, hexrgb("#e6f8ff"), 3, 0.6)
    for k in range(6):
        lx = x0 + r.uniform(100, x1 - x0 - 100)
        ly = y0 + r.uniform(60, y1 - y0 - 40)
        D.ellipse(ctx, lx, ly, 40, 14, T("#3a9a4a"), INK, 2)
        if k % 2:
            D.circle(ctx, lx + 10, ly - 8, 9, T("#ff8ac8"), INK, 1.5)
    D.rect(ctx, x0, y0 - 16, x1 - x0, 20, T("#c9d0d6"), INK, 3, wob=0)


# --- мост и машины ------------------------------------------------------------------

CAR_COLS = ["#e8423c", "#2f8fd8", "#f2c230", "#fbfaf6", "#3fbf6a", "#7a4fc2", "#2b2f3a", "#f2783a"]


def car(ctx, x, gy, s=1.0, c="#e8423c", f=1, tod="day", door=0.0, kind="sedan", lights=False):
    """Машина сбоку (x — центр, gy — земля)."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    cc = T(c)
    if kind == "van":
        D.rrect(ctx, -170, -190, 340, 150, 26, cc, INK, 4)
        D.rect(ctx, 60, -170, 90, 60, T("#bfe6f5"), INK, 3, wob=0)
        D.rect(ctx, -120, -170, 150, 60, T("#bfe6f5"), INK, 3, wob=0)
    else:
        D.rrect(ctx, -170, -110, 340, 80, 26, cc, INK, 4)
        D.poly(ctx, [(-100, -110), (-60, -170), (70, -170), (110, -110)], cc, INK, 4, wob=0)
        D.poly(ctx, [(-86, -112), (-54, -160), (0, -160), (0, -112)], T("#bfe6f5"), INK, 3, wob=0)
        D.poly(ctx, [(10, -112), (10, -160), (64, -160), (96, -112)], T("#bfe6f5"), INK, 3, wob=0)
    for wx in (-100, 100):
        D.circle(ctx, wx, -30, 32, T("#2b2f3a"), INK, 3)
        D.circle(ctx, wx, -30, 12, T("#c9d0d6"), INK, 2)
    if lights:
        D.circle(ctx, 165, -80, 10, hexrgb("#fff2a0"), INK, 2)
        D.radial(ctx, 200, -80, 140, "#fff2a0", 0.5, 0)
    if door > 0:
        D.poly(ctx, [(0, -112), (0, -30), (-60 * door, -40), (-60 * door, -120)], cc, INK, 3, wob=0)
    ctx.restore()


def bridge(ctx, x0, x1, deck_y, tod="day", t=0.0, cars=True, seed=3, jam=1.0, crowd=None):
    """Мост через озеро: пролёты на опорах, перила, фонари; на нём затор из машин.
    crowd(ctx, x0, x1, deck_y) — дорисовать толпу на мосту."""
    T = Tf(tod)
    # опоры и арки
    for k in range(int((x1 - x0) / 600) + 1):
        px = x0 + 300 + k * 600
        D.rect(ctx, px - 40, deck_y, 80, 700, T("#9aa3ac"), INK, 4, wob=0)
        ctx.arc(px + 300, deck_y + 300, 260, math.pi, 0)
        D.col(ctx, INK)
        ctx.set_line_width(14)
        ctx.stroke()
        ctx.arc(px + 300, deck_y + 300, 260, math.pi, 0)
        D.col(ctx, T("#c9d0d6"))
        ctx.set_line_width(8)
        ctx.stroke()
    D.rect(ctx, x0, deck_y, x1 - x0, 50, T("#8f99a3"), INK, 4, wob=0)
    D.rect(ctx, x0, deck_y - 10, x1 - x0, 14, T("#5a606c"), None, 0, wob=0)
    if cars:
        r = rng(seed)
        x = x0 + 80
        k = 0
        while x < x1 - 100:
            c = CAR_COLS[r.randrange(len(CAR_COLS))]
            kind = "van" if r.random() < 0.25 else "sedan"
            ang = r.uniform(-0.06, 0.06) * jam
            ctx.save()
            ctx.translate(x, deck_y - 10)
            ctx.rotate(ang)
            car(ctx, 0, 0, 0.9, c, 1 if r.random() < 0.5 else -1, tod, door=r.random() * jam if r.random() < 0.3 else 0,
                kind=kind, lights=tod in NIGHT and r.random() < 0.3)
            ctx.restore()
            x += r.uniform(300, 380) * (1.2 - 0.3 * jam)
            k += 1
    if crowd:
        crowd(ctx, x0, x1, deck_y)
    # перила
    D.rect(ctx, x0, deck_y - 70, x1 - x0, 12, T("#c9d0d6"), INK, 3, wob=0)
    for k in range(int((x1 - x0) / 60) + 1):
        D.line(ctx, x0 + k * 60, deck_y - 60, x0 + k * 60, deck_y - 8, T("#c9d0d6"), 4)
    for k in range(int((x1 - x0) / 900) + 1):
        lx = x0 + 450 + k * 900
        D.line(ctx, lx, deck_y - 60, lx, deck_y - 360, INK, 10)
        D.line(ctx, lx, deck_y - 60, lx, deck_y - 360, T("#5a606c"), 5)
        D.rrect(ctx, lx - 30, deck_y - 380, 60, 30, 10, hexrgb("#fff2a0") if tod in NIGHT else T("#e9e2c8"), INK, 2)
        if tod in NIGHT:
            D.radial(ctx, lx, deck_y - 360, 160, "#ffe9a0", 0.45, 0)


def town(ctx, x0, x1, base, tod="day", lit=0.0, seed=4):
    """Городок на берегу: дома с крышами, водонапорная башня, церковь."""
    T = Tf(tod)
    r = rng(seed)
    x = x0
    while x < x1:
        w = r.uniform(160, 300)
        h = r.uniform(140, 320)
        c = T(r.choice(["#e8d0a0", "#c8a0a0", "#a0b8d8", "#d8d8c0", "#b8a0c8"]))
        D.rect(ctx, x, base - h, w, h, c, INK, 3, wob=0)
        D.poly(ctx, [(x - 14, base - h), (x + w / 2, base - h - w * 0.35), (x + w + 14, base - h)],
               T(r.choice(["#8a3a2a", "#3a4a6a", "#5a3a2a"])), INK, 3, wob=0)
        for j in range(int(w / 70)):
            for i in range(int(h / 90)):
                on = lit > 0 and r.random() < 0.5
                D.rect(ctx, x + 22 + j * 70, base - h + 30 + i * 90, 34, 44, hexrgb("#ffe08a") if on else T("#5a6a8a"),
                       INK, 2, wob=0)
        x += w + r.uniform(10, 60)
    wx = x0 + (x1 - x0) * 0.7
    D.line(ctx, wx - 60, base, wx - 40, base - 420, INK, 8)
    D.line(ctx, wx + 60, base, wx + 40, base - 420, INK, 8)
    D.rrect(ctx, wx - 110, base - 560, 220, 150, 50, T("#c9d0d6"), INK, 4)
    D.text(ctx, "SILVER LAKE", wx, base - 470, 28, D.FONT_TITLE, T("#2f6fd0"))


# --- маяк вблизи ------------------------------------------------------------------------

def lighthouse(ctx, x, gy, s=1.0, tod="day", beam=0.0, ang=0.0, t=0.0):
    """Маяк Гаса вблизи: скалистый мыс, бело-красная башня, галерея, фонарь; луч вращается."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    # скалы
    r = rng(8)
    for k in range(7):
        rx = -500 + k * 170 + r.uniform(-30, 30)
        D.blob(ctx, [(rx - 120, 60), (rx - 90, -60 - r.uniform(0, 60)), (rx, -110 - r.uniform(0, 60)),
                     (rx + 110, -50), (rx + 130, 60)], T(r.choice(["#8a8f9a", "#7a7f8a", "#9aa0aa"])), INK, 3)
    D.rect(ctx, -460, -40, 920, 60, T("#6f8a6a"), None, 0, wob=0)
    # домик смотрителя
    D.rect(ctx, 160, -300, 320, 260, T("#fbfaf6"), INK, 4, wob=0)
    D.poly(ctx, [(140, -300), (320, -420), (500, -300)], T("#c23b33"), INK, 4, wob=0)
    D.rect(ctx, 200, -230, 70, 80, hexrgb("#ffe08a") if tod in NIGHT else T("#bfe6f5"), INK, 3, wob=0)
    D.rect(ctx, 380, -200, 70, 160, T("#2f6fd0"), INK, 3, wob=0)
    # башня
    D.poly(ctx, [(-120, -40), (120, -40), (80, -1200), (-80, -1200)], T("#fbfaf6"), INK, 5, wob=0)
    for k in range(3):
        y0 = -200 - k * 330
        D.poly(ctx, [(-112 + k * 11, y0), (112 - k * 11, y0), (108 - k * 11 - 6, y0 - 150),
                     (-108 + k * 11 + 6, y0 - 150)], T("#e8423c"), INK, 3, wob=0)
    for k in range(3):
        D.rrect(ctx, -22, -360 - k * 280, 44, 70, 20, hexrgb("#ffe08a") if tod in NIGHT else T("#3a4a7a"), INK, 3)
    # галерея и фонарь
    D.rect(ctx, -140, -1230, 280, 36, T("#2b2f3a"), INK, 4, wob=0)
    for k in range(8):
        D.line(ctx, -130 + k * 37, -1230, -130 + k * 37, -1290, INK, 4)
    D.line(ctx, -140, -1290, 140, -1290, INK, 6)
    D.rect(ctx, -80, -1390, 160, 160, hexrgb("#fff2a0") if (beam > 0 or tod in NIGHT) else T("#bfe6f5"), INK, 4,
           wob=0)
    D.line(ctx, 0, -1390, 0, -1230, INK, 3)
    D.poly(ctx, [(-100, -1390), (0, -1480), (100, -1390)], T("#c23b33"), INK, 4, wob=0)
    D.line(ctx, 0, -1480, 0, -1540, INK, 6)
    ctx.restore()
    if beam > 0:
        bx, by = x, gy - 1310 * s
        for side in (-1, 1):
            a = ang + (0 if side > 0 else math.pi)
            L = 2400 * s
            ca = math.cos(a)
            if abs(ca) < 0.05:
                continue
            spread = 0.08
            D.poly(ctx, [(bx, by), (bx + math.cos(a - spread) * L, by + math.sin(a - spread) * L * 0.25),
                         (bx + math.cos(a + spread) * L, by + math.sin(a + spread) * L * 0.25)], hexrgb("#fff2a0"),
                   None, 0, wob=0, alpha=0.25 * beam * abs(ca))
        D.radial(ctx, bx, by, 260 * s, "#fff2a0", 0.8 * beam, 0)


def dock(ctx, x0, x1, y, tod="day"):
    T = Tf(tod)
    D.rect(ctx, x0, y - 30, x1 - x0, 40, T("#a8743a"), INK, 4, wob=0)
    for k in range(int((x1 - x0) / 120) + 1):
        D.rect(ctx, x0 + k * 120, y + 10, 26, 220, T("#8a5a34"), INK, 3, wob=0)
    for k in range(int((x1 - x0) / 40)):
        D.line(ctx, x0 + k * 40, y - 30, x0 + k * 40, y + 10, T("#8a5a34"), 2)


# --- карта острова -------------------------------------------------------------------------

# ключевые точки карты (x, y), остров ~ 3000 x 2000 с центром (0, 0)
MAP = {"gate": (-1250, 300), "main": (-800, 200), "castle": (-150, 0), "carousel": (600, 450), "wheel": (900, -350),
       "coaster": (300, -650), "drop": (-600, -600), "swing": (1100, 250), "flume": (-200, 650), "lagoon": (150, 750),
       "shed": (600, 820), "arcade": (-500, 450), "kiddie": (1300, 650), "control": (-900, -250),
       "bridge0": (-1550, 300), "bridge1": (-3600, 300), "lighthouse": (4200, -100), "maze": (-150, -450),
       "costume": (-1000, 500)}


def island_map(ctx, cx, cy, s=1.0, tod="day", t=0.0, labels=True, horde=0.0, route=None, sky_ride=True):
    """Карта: озеро, остров с аттракционами-значками, мост к городу (слева), маяк (справа)."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(s, s)
    D.rect(ctx, -5200, -2400, 10400, 4800, T("#4fb8e8"), None, 0, wob=0)
    for k in range(60):
        r = rng(k)
        wx, wy = r.uniform(-5000, 5000), r.uniform(-2300, 2300)
        D.curve(ctx, [(wx, wy), (wx + 30, wy - 12), (wx + 60, wy)], T("#8ad8f8"), 6)
    # дальний берег слева с городом
    D.blob(ctx, [(-5200, -2400), (-3700, -2400), (-3500, -800), (-3800, 400), (-3500, 1500), (-3900, 2400),
                 (-5200, 2400)], T("#8fcf6a"), INK, 6)
    r = rng(3)
    for k in range(26):
        hx, hy = r.uniform(-5000, -3900), r.uniform(-2000, 2000)
        D.rect(ctx, hx, hy, 90, 70, T(r.choice(["#e8d0a0", "#c8a0a0", "#a0b8d8"])), INK, 3, wob=0)
        D.poly(ctx, [(hx - 8, hy), (hx + 45, hy - 40), (hx + 98, hy)], T("#8a3a2a"), INK, 3, wob=0)
    # мыс с маяком справа
    D.blob(ctx, [(5200, -800), (4400, -500), (3950, -120), (4300, 200), (5200, 300)], T("#8fcf6a"), INK, 6)
    lx, ly = MAP["lighthouse"]
    D.circle(ctx, lx, ly, 70, T("#fbfaf6"), INK, 5)
    D.circle(ctx, lx, ly, 34, T("#e8423c"), INK, 3)
    # остров
    D.blob(ctx, [(-1500, -300), (-1300, -900), (-300, -1150), (900, -1050), (1600, -500), (1700, 400), (1200, 1100),
                 (0, 1200), (-1100, 1000), (-1600, 500)], T("#a8e070"), INK, 8)
    D.blob(ctx, [(-1350, -250), (-1150, -800), (-300, -1000), (800, -900), (1450, -450), (1550, 350), (1100, 950),
                 (0, 1050), (-1000, 880), (-1450, 450)], T("#c8f090"), None, 0)
    # мост
    bx0, by0 = MAP["bridge1"]
    bx1, by1 = MAP["bridge0"]
    D.line(ctx, bx0, by0, bx1, by1, INK, 110)
    D.line(ctx, bx0, by0, bx1, by1, T("#c9d0d6"), 90)
    D.line(ctx, bx0, by0, bx1, by1, T("#fbfaf6"), 6)
    # дорожки
    for a, b in (("gate", "main"), ("main", "castle"), ("castle", "carousel"), ("castle", "wheel"),
                 ("castle", "coaster"), ("castle", "drop"), ("carousel", "swing"), ("castle", "flume"),
                 ("flume", "shed"), ("carousel", "kiddie"), ("main", "arcade"), ("main", "control"),
                 ("castle", "maze")):
        D.line(ctx, *MAP[a], *MAP[b], T("#f2dca0"), 60)
    # лагуна
    D.blob(ctx, [(-250, 560), (150, 520), (520, 640), (430, 880), (0, 920), (-300, 800)], T("#4fb8e8"), INK, 5)
    # значки
    def icon(key, draw):
        x, y = MAP[key]
        ctx.save()
        ctx.translate(x, y)
        draw()
        ctx.restore()
    icon("castle", lambda: (D.rect(ctx, -140, -100, 280, 160, T("#f6eee0"), INK, 5, wob=0),
                            D.poly(ctx, [(-160, -100), (0, -260), (160, -100)], T("#2f6fd0"), INK, 5, wob=0)))
    icon("wheel", lambda: (D.circle(ctx, 0, 0, 160, None, INK, 14), D.circle(ctx, 0, 0, 160, None, T("#fbfaf6"), 8),
                           D.circle(ctx, 0, 0, 30, T("#f2c230"), INK, 4)))
    icon("carousel", lambda: (D.circle(ctx, 0, 0, 130, T("#e8423c"), INK, 5), D.circle(ctx, 0, 0, 50, T("#fbfaf6"), INK, 3)))
    icon("coaster", lambda: D.curve(ctx, [(-400, 120), (-250, -120), (-60, 100), (120, -150), (380, 80)], T("#e8423c"), 30))
    icon("drop", lambda: D.rect(ctx, -40, -260, 80, 300, T("#7a4fc2"), INK, 5, wob=0))
    icon("swing", lambda: D.circle(ctx, 0, 0, 110, T("#16a39a"), INK, 5))
    icon("shed", lambda: (D.rect(ctx, -110, -60, 220, 120, T("#c8603a"), INK, 5, wob=0),))
    icon("arcade", lambda: D.rect(ctx, -110, -70, 220, 140, T("#7a4fc2"), INK, 5, wob=0))
    icon("kiddie", lambda: D.circle(ctx, 0, 0, 90, T("#ffd23a"), INK, 5))
    icon("control", lambda: D.rect(ctx, -90, -70, 180, 140, T("#3a4a6a"), INK, 5, wob=0))
    icon("maze", lambda: D.rect(ctx, -100, -70, 200, 140, T("#ff4a9a"), INK, 5, wob=0))
    icon("gate", lambda: D.rect(ctx, -60, -140, 120, 280, T("#2f8fd8"), INK, 5, wob=0))
    if sky_ride:
        D.line(ctx, -1100, -700, 1300, 700, INK, 10)
        D.line(ctx, -1100, -700, 1300, 700, T("#5a606c"), 4)
    if labels:
        for key, txt in (("castle", "CASTLE"), ("wheel", "BIG WHEEL"), ("coaster", "THUNDERBOLT"),
                         ("carousel", "CAROUSEL"), ("shed", "BALLOON SHED"), ("gate", "GATE")):
            x, y = MAP[key]
            D.text(ctx, txt, x, y + 230, 90, D.FONT_TITLE, T("#1c3f7c"), stroke=hexrgb("#ffffff"), slw=10)
        D.text(ctx, "SILVER LAKE", 2600, 1700, 150, D.FONT_TITLE, T("#fbfaf6"), stroke=INK, slw=10)
        D.text(ctx, "TOWN", -4500, -2000, 120, D.FONT_TITLE, T("#1c3f7c"), stroke=hexrgb("#ffffff"), slw=10)
    if horde > 0:
        r = rng(9)
        n = int(500 * horde)
        for k in range(n):
            u = r.random()
            if k % 3 == 0:     # на мосту / в городе
                x = lerp(-4600, -1500, u * horde)
                y = 300 + r.uniform(-60, 60)
            else:
                x = r.uniform(-1400, 1500)
                y = r.uniform(-900, 1000)
                if (x / 1500) ** 2 + (y / 1000) ** 2 > 1:
                    continue
            D.circle(ctx, x, y, 22, T("#7ee04a"), INK, 3)
    if route:
        D.polyline(ctx, route, T("#e8423c"), 24)
    ctx.restore()


# --- салют -------------------------------------------------------------------------------

FW_COLS = ["#ff4a6a", "#ffd23a", "#4ad8ff", "#7ee04a", "#ff8ac8", "#ffffff", "#c88aff"]


def firework(ctx, x, y, k, s=1.0, c="#ffd23a", seed=0, n=28, kind="peony"):
    """Разрыв: k 0..1 фаза (0 — вспышка, 1 — погасло)."""
    if k <= 0 or k >= 1:
        return
    r = rng(seed)
    R = 360 * s * (1 - (1 - k) ** 2.2)
    fall = 120 * s * k * k
    a0 = r.random() * TAU
    for i in range(n):
        a = a0 + i * TAU / n + r.uniform(-0.05, 0.05)
        rr = R * r.uniform(0.85, 1.05)
        x1, y1 = x + math.cos(a) * rr, y + math.sin(a) * rr + fall
        x0, y0 = x + math.cos(a) * rr * 0.7, y + math.sin(a) * rr * 0.7 + fall * 0.7
        cc = c if kind != "mix" else FW_COLS[i % len(FW_COLS)]
        D.line(ctx, x0, y0, x1, y1, hexrgb(cc), 16 * s * (1 - k * 0.6), (1 - k) * 0.35)
        D.line(ctx, x0, y0, x1, y1, hexrgb(cc), 8 * s * (1 - k * 0.6), 1 - k)
        D.circle(ctx, x1, y1, 9 * s * (1 - k * 0.5), hexrgb("#ffffff"), None, 0, alpha=(1 - k) * 0.9)
        if kind == "willow" and k > 0.3:
            D.line(ctx, x1, y1, x1, y1 + 120 * s * (k - 0.3), hexrgb(cc), 3 * s, (1 - k) * 0.7)
    D.radial(ctx, x, y + fall * 0.5, R * 1.3 + 60 * s, c, 0.28 * (1 - k), 0)
    if k < 0.15:
        D.radial(ctx, x, y, 240 * s, "#ffffff", 0.9 * (1 - k / 0.15), 0)


def rocket(ctx, x0, y0, x1, y1, k, c="#ffd23a"):
    """Взлёт ракеты: k 0..1 по пути, со следом искр."""
    if k <= 0 or k >= 1:
        return
    x, y = lerp(x0, x1, k), lerp(y0, y1, ease_out_q(k))
    for j in range(8):
        kk = max(0.0, k - j * 0.02)
        px, py = lerp(x0, x1, kk), lerp(y0, y1, ease_out_q(kk))
        D.circle(ctx, px, py, 6 - j * 0.6, hexrgb(c), None, 0, alpha=1 - j / 8)
    D.circle(ctx, x, y, 8, hexrgb("#ffffff"), None, 0)


def ease_out_q(k):
    return 1 - (1 - k) ** 2


def show(ctx, t, x0, x1, y0, y1, intensity=1.0, seed=1, period=1.6):
    """Салют над парком: ракеты взлетают от y1 и рвутся в полосе [y0, y0 + (y1-y0)*0.4]."""
    r = rng(seed)
    n = int(14 * intensity)
    for i in range(n):
        off = r.random() * period
        ph = ((t + off) % period) / period
        bx = r.uniform(x0, x1)
        by = r.uniform(y0, y0 + (y1 - y0) * 0.4)
        c = r.choice(FW_COLS)
        lift = 0.35
        cycle = int((t + off) / period)
        rs = rng(seed * 1000 + i * 37 + cycle)
        bx += rs.uniform(-200, 200)
        if ph < lift:
            rocket(ctx, bx + 40, y1, bx, by, ph / lift, c)
        else:
            firework(ctx, bx, by, (ph - lift) / (1 - lift), rs.uniform(0.7, 1.3), c, i + cycle * 13,
                     kind=rs.choice(["peony", "mix", "willow"]))
