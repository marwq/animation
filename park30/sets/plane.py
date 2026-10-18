"""Самолёты и техника: лайнер Lakeshore Air (сбоку и сверху), «Рози» — маленький белый
четырёхместный самолёт с красной полосой, вертолёт новостей, игрушечный самолётик,
багажный тягач с тележками."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU, noise1
from engine import draw as D
from .base import tone, logo, NAVY, TEAL, SUNC, WHITE, INK, NIGHT

def _ftext(ctx, f, txt, x, y, size, family, c):
    """Надпись, которая не зеркалится при f = -1."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(f, 1)
    D.text(ctx, txt, 0, 0, size, family, c)
    ctx.restore()


# --- лайнер сбоку -------------------------------------------------------------------------
# Локальные координаты: нос справа (x ≈ +1000), хвост слева, земля y = 0. Масштаб s.

def _fuselage_path(ctx):
    ctx.move_to(-1010, -300)
    ctx.line_to(-930, -300)
    ctx.curve_to(-700, -296, 600, -296, 820, -292)
    ctx.curve_to(930, -288, 1010, -250, 1030, -190)
    ctx.curve_to(1040, -150, 1000, -112, 920, -104)
    ctx.curve_to(600, -94, -500, -94, -700, -104)
    ctx.curve_to(-860, -116, -960, -170, -1010, -230)
    ctx.close_path()


def jet(ctx, x, gy, s=1.0, f=1, tod="day", lit=0.0, door=0.0, gear=True, shadow=True, tail_logo=True):
    T = lambda c: tone(c, tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    lw = max(4, 3.0 / max(s, 0.1))
    if shadow:
        D.ellipse(ctx, 40, 4, 900, 26, (0, 0, 0), None, 0, alpha=0.18)
    # дальнее крыло и двигатель
    D.poly(ctx, [(-120, -150), (160, -150), (-260, -40), (-330, -40)], T("#c9d2da"), INK, lw, wob=0)
    # шасси
    if gear:
        for gx, h in ((820, 104), (-250, 100), (-180, 100)):
            D.line(ctx, gx, -h, gx, -24, INK, 16)
            D.line(ctx, gx, -h, gx, -24, T("#8f99a3"), 9)
            D.circle(ctx, gx, -24, 24, T("#2b2f3a"), INK, lw)
            D.circle(ctx, gx, -24, 9, T("#9aa3ac"), None, 0)
    # фюзеляж
    _fuselage_path(ctx)
    D.col(ctx, T(WHITE))
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    D.rect(ctx, -1100, -150, 2200, 80, T("#d7dde3"), None, 0, wob=0)       # брюхо
    D.rect(ctx, -1100, -178, 2200, 16, T(TEAL), None, 0, wob=0)          # полоса
    D.rect(ctx, -1100, -160, 2200, 7, T(SUNC), None, 0, wob=0)
    ctx.restore()
    _fuselage_path(ctx)
    D.col(ctx, INK)
    ctx.set_line_width(lw)
    ctx.stroke()
    # окна
    wc = mix(hexrgb("#ffd978"), hexrgb("#fff3c8"), 0.3) if lit > 0 else T("#2a3a52")
    for k in range(40):
        wx = -760 + k * 36
        if -40 < wx < 20 or 640 < wx < 690:
            continue
        D.rrect(ctx, wx, -238, 18, 26, 8, wc, None, 0)
    # кабина пилотов
    D.poly(ctx, [(900, -250), (968, -244), (996, -214), (918, -216)], T("#22324a"), INK, lw * 0.8, wob=0)
    D.line(ctx, 950, -247, 952, -215, INK, lw * 0.6)
    # двери
    for dx in (-10, 660, -880):
        D.rrect(ctx, dx, -268, 42, 140, 10, None, INK, lw * 0.6)
    if door > 0:
        D.rrect(ctx, 660, -268, 42, 140, 10, T("#2a3040"), INK, lw * 0.6)
    # надпись
    _ftext(ctx, f, "LAKESHORE", 380, -186, 44, D.FONT_TITLE, T(NAVY))
    # ближнее крыло (тонкое, стреловидное)
    D.poly(ctx, [(-160, -128), (190, -128), (220, -112), (-420, -86), (-470, -92)], T("#e2e8ee"), INK, lw, wob=0)
    # двигатель под крылом
    D.rrect(ctx, -110, -110, 300, 92, 44, T("#e9edf1"), INK, lw)
    D.rrect(ctx, 150, -104, 40, 80, 20, T("#2b2f3a"), INK, lw * 0.8)
    D.rect(ctx, -60, -110, 120, 18, T(NAVY), None, 0, wob=0)
    D.line(ctx, -110, -64, -150, -64, INK, lw)
    # хвост
    D.poly(ctx, [(-930, -298), (-780, -298), (-930, -600), (-1030, -600), (-1010, -300)], T(NAVY), INK, lw, wob=0)
    if tail_logo:
        logo(ctx, -935, -470, 62, tod)
    D.poly(ctx, [(-1010, -250), (-860, -250), (-1060, -200), (-1110, -210)], T("#e2e8ee"), INK, lw * 0.9,
           wob=0)
    ctx.restore()


def jet_top(ctx, x, y, s=1.0, ang=0.0, tod="day"):
    """Лайнер сверху (для карты аэропорта): нос по направлению ang."""
    T = lambda c: tone(c, tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    D.poly(ctx, [(-40, 0), (40, -210), (90, -210), (80, 0)], T("#dfe5ea"), INK, 4, wob=0)
    D.poly(ctx, [(-40, 0), (40, 210), (90, 210), (80, 0)], T("#dfe5ea"), INK, 4, wob=0)
    D.poly(ctx, [(-230, 0), (-200, -80), (-175, -80), (-180, 0)], T("#dfe5ea"), INK, 3, wob=0)
    D.poly(ctx, [(-230, 0), (-200, 80), (-175, 80), (-180, 0)], T("#dfe5ea"), INK, 3, wob=0)
    D.rrect(ctx, -250, -22, 500, 44, 22, T(WHITE), INK, 4)
    D.rect(ctx, -250, -4, 60, 8, T(NAVY), None, 0, wob=0)
    ctx.restore()


# --- «Рози» ---------------------------------------------------------------------------------
# Нос справа, земля y = 0. Длина ~800 при s = 1.

def _prop(ctx, x, y, h, ang, spin, tod):
    """Пропеллер сбоку: лопасть видна как вертикальная палка; на оборотах — размытый диск."""
    if spin > 0.15:
        D.ellipse(ctx, x + 6, y, 14, h, hexrgb("#d8dee4"), None, 0, alpha=0.35 * min(1, spin))
        D.ellipse(ctx, x + 6, y, 14, h, None, INK, 2.5, alpha=0.5 * min(1, spin))
    if spin < 0.9:
        a = 1 - max(0.0, (spin - 0.4) / 0.5)
        L = h * math.cos(ang)
        D.line(ctx, x + 4, y - L, x + 4, y + L, INK, 18, a)
        D.line(ctx, x + 4, y - L, x + 4, y + L, tone("#3a3f48", tod), 10, a)
        D.line(ctx, x + 4, y - L * 0.92, x + 4, y - L, tone("#f2c230", tod), 10, a)


def rosie(ctx, x, gy, s=1.0, f=1, tod="day", prop=0.0, spin=0.0, door=0.0, cover=0.0, dirt=0.0, cabin=None,
          shadow=True, roll=0.0):
    """cabin(ctx) — дорисовка внутри кабины (пилот, собака) в локальных координатах."""
    T = lambda c: tone(c, tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    ctx.rotate(roll)
    lw = max(4.0, 2.5 / max(s, 0.1))
    if shadow:
        D.ellipse(ctx, 0, 4, 420, 16, (0, 0, 0), None, 0, alpha=0.2)
    # шасси
    for gx, gh in ((-10, 74), (300, 70)):
        D.line(ctx, gx, -gh, gx + (16 if gx < 0 else 0), -22, INK, 12)
        D.line(ctx, gx, -gh, gx + (16 if gx < 0 else 0), -22, T("#b8c0c8"), 6)
        D.ellipse(ctx, gx + (16 if gx < 0 else 0), -22, 28, 22, T("#e8423c"), INK, lw * 0.8)
        D.circle(ctx, gx + (16 if gx < 0 else 0), -22, 12, T("#2b2f3a"), None, 0)
    # фюзеляж
    body = [(-420, -150), (-330, -150), (-150, -176), (60, -246), (220, -246), (290, -204), (360, -194),
            (392, -170), (392, -102), (330, -78), (40, -70), (-150, -86), (-420, -136)]
    D.poly(ctx, body, T(WHITE), None, 0, wob=0)
    ctx.save()
    D.path(ctx, body)
    ctx.clip()
    D.poly(ctx, [(-430, -128), (400, -142), (400, -118), (-430, -110)], T("#e8423c"), None, 0, wob=0)
    D.poly(ctx, [(-430, -104), (400, -112), (400, -104), (-430, -98)], T(NAVY), None, 0, wob=0)
    D.rect(ctx, -440, -90, 900, 40, T("#e3e7eb"), None, 0, wob=0)
    if dirt > 0:
        r = rng(7)
        for k in range(18):
            D.circle(ctx, r.uniform(-400, 380), r.uniform(-230, -80), r.uniform(6, 16), T("#a89a80"), None, 0,
                     alpha=0.5 * dirt)
    ctx.restore()
    D.poly(ctx, body, None, INK, lw, wob=0)
    # окна кабины
    win = [(70, -236), (210, -236), (276, -200), (276, -150), (70, -150)]
    D.poly(ctx, win, T("#9fd8ec") if tod not in NIGHT else T("#3a5a7a"), INK, lw * 0.8, wob=0)
    if cabin:
        ctx.save()
        D.path(ctx, win)
        ctx.clip()
        cabin(ctx)
        ctx.restore()
        D.poly(ctx, win, None, INK, lw * 0.8, wob=0)
    D.line(ctx, 180, -236, 180, -150, INK, lw * 0.7)
    D.line(ctx, 90, -228, 150, -170, (1, 1, 1), 6, 0.45)
    # дверь
    if door > 0:
        ctx.save()
        ctx.translate(180, -236)
        ctx.scale(1 - 0.85 * door, 1)
        D.rect(ctx, -110, 0, 110, 140, T("#e9edf1"), INK, lw * 0.8, wob=0)
        ctx.restore()
    D.rect(ctx, 140, -150, 30, 8, T("#9aa3ac"), None, 0, wob=0)
    # капот и имя
    _ftext(ctx, f, "Rosie", 330, -132, 40, D.FONT_HAND, T("#e8423c"))
    for k in range(3):
        D.line(ctx, 300 + k * 16, -184, 304 + k * 16, -160, T("#8f99a3"), 3)
    # кок и винт
    D.poly(ctx, [(392, -170), (420, -152), (424, -136), (392, -102)], T("#e8423c"), INK, lw * 0.8, wob=0)
    _prop(ctx, 420, -136, 120, prop, spin, tod)
    # крыло сверху (видно торцом) и подкос
    D.rrect(ctx, -150, -268, 440, 26, 12, T(WHITE), INK, lw)
    D.rect(ctx, 200, -266, 80, 10, T("#e8423c"), None, 0, wob=0)
    D.line(ctx, -60, -250, 40, -84, INK, 9)
    D.line(ctx, -60, -250, 40, -84, T("#c9d0d6"), 4)
    # хвост
    D.poly(ctx, [(-420, -150), (-350, -150), (-300, -176), (-380, -330), (-440, -330)], T(WHITE), INK, lw, wob=0)
    D.poly(ctx, [(-430, -300), (-384, -300), (-372, -276), (-424, -276)], T("#e8423c"), None, 0, wob=0)
    D.poly(ctx, [(-470, -150), (-300, -150), (-310, -138), (-470, -138)], T("#e9edf1"), INK, lw * 0.8, wob=0)
    _ftext(ctx, f, "N1730R", -240, -100, 26, D.FONT_TITLE, T(NAVY))
    # чехол
    if cover > 0:
        ctx.save()
        cv = [(-470, -60), (-440, -340), (-300, -200), (60, -290), (300, -300), (440, -200), (440, -40)]
        D.blob(ctx, cv, T("#9a9488"), INK, lw, alpha=cover)
        r = rng(3)
        for k in range(10):
            xx = r.uniform(-400, 400)
            D.line(ctx, xx, -260 + r.uniform(0, 60), xx + r.uniform(-30, 30), -60, T("#7f796e"), 4, 0.6 * cover)
        ctx.restore()
    ctx.restore()


def rosie_front(ctx, x, gy, s=1.0, tod="day", spin=0.0, prop=0.0, cabin=None):
    """«Рози» спереди: винт на нас, крыло во весь кадр (для крючка и финала)."""
    T = lambda c: tone(c, tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(s, s)
    lw = 5
    D.ellipse(ctx, 0, 6, 520, 20, (0, 0, 0), None, 0, alpha=0.2)
    for gx in (-150, 150):
        D.line(ctx, gx * 0.5, -110, gx, -30, INK, 12)
        D.ellipse(ctx, gx, -24, 22, 26, T("#2b2f3a"), INK, lw)
    D.line(ctx, 0, -100, 0, -30, INK, 10)
    D.ellipse(ctx, 0, -24, 16, 22, T("#2b2f3a"), INK, lw)
    # крыло
    D.rrect(ctx, -560, -330, 1120, 30, 14, T(WHITE), INK, lw)
    D.rect(ctx, -560, -326, 90, 22, T("#e8423c"), None, 0, wob=0)
    D.rect(ctx, 470, -326, 90, 22, T("#e8423c"), None, 0, wob=0)
    for k in (-1, 1):
        D.line(ctx, k * 330, -306, k * 90, -150, INK, 9)
    # кабина
    D.rrect(ctx, -110, -300, 220, 200, 40, T(WHITE), INK, lw)
    D.rrect(ctx, -90, -290, 180, 90, 24, T("#9fd8ec") if tod not in NIGHT else T("#3a5a7a"), INK, lw * 0.8)
    if cabin:
        ctx.save()
        D.rrect_path(ctx, -90, -290, 180, 90, 24)
        ctx.clip()
        cabin(ctx)
        ctx.restore()
        D.rrect(ctx, -90, -290, 180, 90, 24, None, INK, lw * 0.8)
    D.line(ctx, 0, -290, 0, -200, INK, 4)
    # мотор и винт
    D.circle(ctx, 0, -150, 66, T("#e3e7eb"), INK, lw)
    D.circle(ctx, 0, -150, 26, T("#e8423c"), INK, lw)
    if spin > 0.15:
        D.circle(ctx, 0, -150, 150, hexrgb("#d8dee4"), None, 0, alpha=0.3 * min(1, spin))
        D.circle(ctx, 0, -150, 150, None, INK, 2.5, alpha=0.4 * min(1, spin))
    if spin < 0.9:
        a = 1 - max(0.0, (spin - 0.4) / 0.5)
        dx, dy = math.cos(prop) * 150, math.sin(prop) * 150
        D.line(ctx, -dx, -150 - dy, dx, -150 + dy, INK, 20, a)
        D.line(ctx, -dx, -150 - dy, dx, -150 + dy, T("#3a3f48"), 12, a)
    ctx.restore()


# --- вертолёт новостей, игрушка, тягач -----------------------------------------------------

def helicopter(ctx, x, y, s=1.0, f=1, t=0.0, tod="day"):
    T = lambda c: tone(c, tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(f * s, s)
    D.line(ctx, -40, 70, 120, 70, INK, 8)
    D.line(ctx, -10, 40, -20, 70, INK, 6)
    D.line(ctx, 90, 40, 100, 70, INK, 6)
    D.poly(ctx, [(-60, -10), (-300, -20), (-300, 0), (-60, 30)], T("#e8423c"), INK, 4, wob=0)
    D.poly(ctx, [(-300, -50), (-270, -50), (-280, 0), (-310, 0)], T("#e8423c"), INK, 4, wob=0)
    D.circle(ctx, -292, -14, 26 + 4 * math.sin(t * 40), T("#d8dee4"), None, 0, alpha=0.5)
    D.ellipse(ctx, 40, 10, 110, 56, T("#f7f7f2"), INK, 5)
    D.ellipse(ctx, 88, 0, 56, 42, T("#9fd8ec"), INK, 4)
    _ftext(ctx, f, "CH 7", -10, 34, 34, D.FONT_TITLE, T(NAVY))
    _ftext(ctx, f, "NEWS", -10, 2, 22, D.FONT_TITLE, T("#e8423c"))
    D.line(ctx, 40, -46, 40, -66, INK, 8)
    w = 260 * abs(math.cos(t * 30))
    D.line(ctx, 40 - w, -68, 40 + w, -68, INK, 6)
    D.ellipse(ctx, 40, -68, 260, 10, (1, 1, 1), None, 0, alpha=0.25)
    ctx.restore()


def rc_plane(ctx, x, y, s=1.0, f=1, t=0.0, bank=0.0):
    """Игрушечный радиоуправляемый самолётик: жёлтый, красные крылья."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(bank)
    ctx.scale(f * s, s)
    D.poly(ctx, [(-60, -4), (-80, -36), (-66, -36), (-40, -6)], hexrgb("#e8423c"), INK, 3, wob=0)
    D.rrect(ctx, -70, -12, 130, 24, 12, hexrgb("#f2c230"), INK, 3)
    D.ellipse(ctx, 18, -14, 18, 10, hexrgb("#9fd8ec"), INK, 2.5)
    D.poly(ctx, [(-20, 0), (30, 0), (40, 10), (-30, 10)], hexrgb("#e8423c"), INK, 3, wob=0)
    D.ellipse(ctx, 64, 0, 4, 26, hexrgb("#d8dee4"), None, 0, alpha=0.6)
    D.line(ctx, 64, -26 * math.cos(t * 50), 64, 26 * math.cos(t * 50), INK, 3)
    ctx.restore()


def rc_controller(ctx, x, y, s=1.0, bars=3, ang=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    D.line(ctx, 40, -40, 70, -150, INK, 6)
    D.circle(ctx, 70, -152, 6, hexrgb("#e8423c"), None, 0)
    D.rrect(ctx, -80, -50, 160, 100, 22, hexrgb("#2b2f3a"), INK, 4)
    for k in (-1, 1):
        D.circle(ctx, k * 45, 8, 22, hexrgb("#5a5f68"), INK, 3)
        D.circle(ctx, k * 45, 8, 8, INK, None, 0)
    D.rect(ctx, -26, -40, 52, 16, hexrgb("#141820"), None, 0, wob=0)
    for b in range(3):
        D.rect(ctx, -22 + b * 16, -37, 12, 10,
               hexrgb("#4cff8a" if b < bars and bars > 1 else ("#ff4a3a" if b < bars else "#2a3038")), None, 0,
               wob=0)
    ctx.restore()


def tug(ctx, x, gy, s=1.0, f=1, tod="day", beacon=0.0, carts=0, load=1.0, seed=0):
    """Багажный тягач (жёлтый, с мигалкой) и вереница тележек позади."""
    T = lambda c: tone(c, tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    for i in range(carts):
        cx = -330 - i * 300
        D.line(ctx, cx + 130, -40, cx + 180, -40, INK, 6)
        D.rect(ctx, cx - 120, -120, 250, 80, T("#c9d0d6"), INK, 4, wob=0)
        D.rect(ctx, cx - 120, -150, 10, 110, T("#8f99a3"), INK, 3, wob=0)
        D.rect(ctx, cx + 120, -150, 10, 110, T("#8f99a3"), INK, 3, wob=0)
        r = rng(seed * 10 + i)
        n = int(4 * load)
        for k in range(n):
            bx = cx - 100 + k * 58
            c = r.choice(["#e8423c", "#2f8fd8", "#3fbf6a", "#f2c230", "#7a4fc2", "#2b2f3a"])
            h = r.uniform(60, 90)
            D.rrect(ctx, bx, -120 - h, 52, h, 8, T(c), INK, 3)
        for wx in (-90, 100):
            D.circle(ctx, cx + wx, -18, 18, T("#2b2f3a"), INK, 3)
    D.rect(ctx, -140, -100, 280, 70, T("#f2c230"), INK, 5, wob=0)
    D.poly(ctx, [(-60, -100), (-40, -200), (70, -200), (90, -100)], None, INK, 6, wob=0)
    D.rect(ctx, -46, -196, 120, 10, T("#f2c230"), INK, 3, wob=0)
    D.rect(ctx, 80, -130, 60, 30, T("#2b2f3a"), INK, 3, wob=0)
    _ftext(ctx, f, "TUG 7", 0, -50, 30, D.FONT_TITLE, T(NAVY))
    for wx in (-90, 90):
        D.circle(ctx, wx, -24, 30, T("#2b2f3a"), INK, 4)
        D.circle(ctx, wx, -24, 12, T("#9aa3ac"), None, 0)
    D.rect(ctx, 0, -214, 22, 14, T("#ff9a3c"), INK, 3, wob=0)
    if beacon > 0:
        D.radial(ctx, 11, -208, 90, "#ffb03c", 0.6 * beacon, 0)
    ctx.restore()
