"""Помещения Starfall Park: костюмерная, пультовая с компьютером салюта, аркада с кольцебросом,
зеркальный лабиринт, сарай аэростата изнутри (мастерская), маяк Гаса; реквизит: рация,
единорог, костюмы на вешалках. Пол — FL = 900."""
import math
import cairo
from engine.core import hexrgb, mix, shade, rng, clamp, lerp, TAU
from engine import draw as D
from sets.base import tone, NIGHT
from sets.park import star, BRIGHT, PASTEL

INK = D.INK
FL = 900


def Tf(tod):
    return lambda c: tone(c, tod)


def _room(ctx, x0, x1, T, wall="#f2d6a8", floor="#b8865a", top=-900, trim="#e8423c", panel=None):
    """Стена, панели снизу (wainscot), плинтус, пол в перспективе. В кадре при zoom 1 и cy≈500
    видно y ∈ [-40, 1040]: детали стен держим в полосе y ∈ [-150, 860]."""
    D.rect(ctx, x0, top, x1 - x0, FL - top, T(wall), None, 0, wob=0)
    pc = panel or shade(hexrgb(wall) if isinstance(wall, str) else wall, -0.1)
    D.rect(ctx, x0, FL - 300, x1 - x0, 260, T(pc), None, 0, wob=0)
    for k in range(int((x1 - x0) / 240) + 1):
        D.rect(ctx, x0 + 30 + k * 240, FL - 270, 180, 190, None, T(shade(hexrgb(pc) if isinstance(pc, str) else pc,
                                                                            -0.12)), 3, wob=0)
    D.rect(ctx, x0, FL - 310, x1 - x0, 16, T(trim), None, 0, wob=0)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T(floor), None, 0, wob=0)
    for k in range(int((x1 - x0) / 160) + 1):
        D.line(ctx, x0 + k * 160, FL - 40, x0 + k * 160 + (k * 160 - (x1 - x0) / 2) * 0.4, FL + 800,
               T(shade(hexrgb(floor), -0.12)), 3)
    for k in range(5):
        yy = FL - 40 + 40 * (k + 1) ** 1.5
        D.line(ctx, x0, yy, x1, yy, T(shade(hexrgb(floor), -0.08)), 2)
    D.rect(ctx, x0, FL - 50, x1 - x0, 14, T(shade(hexrgb(floor), -0.3)), None, 0, wob=0)


def ceiling_lamp(ctx, x, y, on, T, cone=True):
    D.line(ctx, x, y - 400, x, y, INK, 4)
    D.poly(ctx, [(x - 60, y + 36), (x + 60, y + 36), (x + 26, y), (x - 26, y)], T("#2f6fd0"), INK, 3, wob=0)
    if on:
        if cone:
            D.poly(ctx, [(x - 60, y + 36), (x + 60, y + 36), (x + 300, y + 900), (x - 300, y + 900)],
                   hexrgb("#fff2c0"), None, 0, wob=0, alpha=0.1)
        D.ellipse(ctx, x, y + 40, 44, 10, hexrgb("#fff2c0"), None, 0)


def poster(ctx, x, y, w, h, T, kind="rascal", seed=0):
    """Плакат на стене: rascal / coaster / wheel / balloon."""
    D.rect(ctx, x, y, w, h, T("#fbf3dc"), INK, 3, wob=0)
    D.rect(ctx, x + 12, y + 12, w - 24, h - 70, T(["#8fd0f2", "#ffd6e0", "#d8f5d0", "#fff1b8"][seed % 4]), None, 0,
           wob=0)
    cx, cy = x + w / 2, y + 12 + (h - 70) / 2
    if kind == "rascal":
        D.circle(ctx, cx, cy, w * 0.26, T("#9a9ea6"), INK, 2)
        D.ellipse(ctx, cx, cy - w * 0.02, w * 0.2, w * 0.07, T("#2b2c31"), None, 0)
        D.circle(ctx, cx - w * 0.2, cy - w * 0.22, w * 0.08, T("#9a9ea6"), INK, 2)
        D.circle(ctx, cx + w * 0.2, cy - w * 0.22, w * 0.08, T("#9a9ea6"), INK, 2)
        txt = "MEET RASCAL!"
    elif kind == "coaster":
        D.curve(ctx, [(x + 20, cy + h * 0.2), (cx - w * 0.2, cy - h * 0.25), (cx, cy + h * 0.1), (x + w - 20, cy - h * 0.1)],
                T("#e8423c"), 6)
        txt = "THUNDERBOLT"
    elif kind == "wheel":
        D.circle(ctx, cx, cy, w * 0.3, None, T("#2f6fd0"), 5)
        for k in range(8):
            a = k * TAU / 8
            D.line(ctx, cx, cy, cx + math.cos(a) * w * 0.3, cy + math.sin(a) * w * 0.3, T("#2f6fd0"), 2)
        txt = "BIG WHEEL"
    else:
        D.ellipse(ctx, cx, cy - h * 0.05, w * 0.22, h * 0.25, T("#e8423c"), INK, 2)
        D.rect(ctx, cx - w * 0.06, cy + h * 0.22, w * 0.12, h * 0.08, T("#c8903a"), INK, 2, wob=0)
        txt = "SKY BALLOON"
    D.text(ctx, txt, cx, y + h - 22, min(30, w / len(txt) * 1.7), D.FONT_TITLE, T("#2b2f3a"))


# --- реквизит --------------------------------------------------------------------

def radio(ctx, x, y, s=1.0, on=True, tod="day", ch=9, t=0.0, talk=0.0):
    """Рация операторов: (x, y) — низ."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.line(ctx, 30, -200, 34, -300, INK, 10)
    D.circle(ctx, 34, -304, 9, T("#2b2f3a"), INK, 2)
    D.rrect(ctx, -50, -210, 100, 210, 18, T("#2b2f3a"), INK, 4)
    D.rect(ctx, -36, -190, 72, 50, hexrgb("#9fe870") if on else T("#3a4a3a"), INK, 2, wob=0)
    if on:
        D.text(ctx, "CH %d" % ch, 0, -156, 26, D.FONT_TITLE, hexrgb("#1c3a1c"))
    for k in range(5):
        D.line(ctx, -30, -120 + k * 14, 30, -120 + k * 14, T("#5a606c"), 4)
    D.circle(ctx, 30, -30, 12, hexrgb("#ff4a3a") if talk > 0 and (t * 3) % 1 < 0.6 else T("#5a2020"), INK, 2)
    D.rrect(ctx, -60, -170, 14, 60, 6, T("#e8423c"), INK, 2)
    ctx.restore()


def unicorn(ctx, x, gy, s=1.0, tod="day", f=1, t=0.0):
    """Гигантский плюшевый радужный единорог: (x, gy) — низ. s = 1 → ~800 px ростом."""
    T = Tf(tod)
    ctx.save()
    ctx.translate(x, gy)
    ctx.scale(f * s, s)
    body = T("#fbf6ff")
    # ноги-тумбы
    for lx in (-150, -60, 70, 160):
        D.rrect(ctx, lx - 42, -260, 84, 260, 40, body if lx > 0 else shade(body, -0.08), INK, 5)
        D.rrect(ctx, lx - 44, -50, 88, 50, 22, T("#c8a0f2"), INK, 4)
    # хвост-радуга
    cols = ["#e8423c", "#f2a03a", "#ffd23a", "#3fbf6a", "#2f8fd8", "#7a4fc2"]
    for k, c in enumerate(cols):
        D.curve(ctx, [(-210, -420 + k * 8), (-330, -420 + k * 22), (-360, -250 + k * 16), (-300, -160 + k * 6)],
                INK, 38)
    for k, c in enumerate(cols):
        D.curve(ctx, [(-210, -420 + k * 8), (-330, -420 + k * 22), (-360, -250 + k * 16), (-300, -160 + k * 6)],
                T(c), 26)
    # тело
    D.ellipse(ctx, 0, -360, 250, 170, body, INK, 5)
    D.ellipse(ctx, 30, -300, 170, 90, shade(body, -0.05), None, 0)
    # шея и голова
    D.poly(ctx, [(110, -430), (180, -640), (300, -620), (260, -380)], body, INK, 5, wob=0)
    D.ellipse(ctx, 280, -660, 150, 110, body, INK, 5, rot=0.2)
    D.ellipse(ctx, 380, -620, 70, 56, T("#ffd6e8"), INK, 4)
    D.circle(ctx, 360, -630, 8, INK, None, 0)
    D.circle(ctx, 400, -612, 8, INK, None, 0)
    # глаз с ресницами
    D.ellipse(ctx, 270, -690, 22, 28, INK, None, 0)
    D.circle(ctx, 276, -700, 8, hexrgb("#ffffff"), None, 0)
    for k in range(3):
        D.line(ctx, 250 + k * 12, -716, 244 + k * 14, -736, INK, 4)
    D.ellipse(ctx, 300, -640, 26, 14, T("#ffb0c8"), None, 0, alpha=0.8)
    # ухо и рог
    D.poly(ctx, [(200, -740), (220, -830), (260, -740)], body, INK, 4, wob=0)
    D.poly(ctx, [(270, -760), (330, -940), (330, -750)], T("#ffd23a"), INK, 4, wob=0)
    for k in range(4):
        D.line(ctx, 280 + k * 12, -780 - k * 40, 330 - k * 2, -770 - k * 40, T("#e8b020"), 4)
    # грива-радуга
    for k, c in enumerate(cols):
        D.circle(ctx, 170 - k * 18, -700 + k * 50, 48, T(c), INK, 4)
    ctx.restore()


def costume_rack(ctx, x, gy, kinds=("dragon", "cow", "hotdog"), tod="day", cut=0):
    """Вешалка с костюмами-«кукольными» шкурами. cut — сколько уже порезано (без кусков)."""
    T = Tf(tod)
    D.line(ctx, x - 360, gy - 900, x + 360, gy - 900, INK, 14)
    D.line(ctx, x - 360, gy - 900, x + 360, gy - 900, T("#c9d0d6"), 8)
    for lx in (-360, 360):
        D.line(ctx, x + lx, gy - 900, x + lx, gy, INK, 12)
        D.line(ctx, x + lx, gy - 900, x + lx, gy, T("#c9d0d6"), 6)
        D.line(ctx, x + lx - 60, gy, x + lx + 60, gy, INK, 10)
    cols = {"dragon": ("#3fbf6a", "#2a8a4a"), "cow": ("#fbfaf6", "#2b2c31"), "hotdog": ("#c8503a", "#f2c230"),
            "rascal": ("#9a9ea6", "#2b2c31")}
    for i, k in enumerate(kinds):
        cx = x - 230 + i * 230
        D.curve(ctx, [(cx - 20, gy - 880), (cx, gy - 910), (cx + 20, gy - 880)], INK, 5)
        c1, c2 = cols.get(k, cols["cow"])
        body = [(cx - 110, gy - 860), (cx + 110, gy - 860), (cx + 150, gy - 520), (cx + 90, gy - 220),
                (cx - 90, gy - 220), (cx - 150, gy - 520)]
        D.poly(ctx, body, T(c1), INK, 4, wob=0)
        if i < cut:
            D.poly(ctx, [(cx - 60, gy - 700), (cx + 40, gy - 720), (cx + 70, gy - 520), (cx - 30, gy - 480)],
                   T("#e8dcc4"), INK, 3, wob=0)
        elif k == "dragon":
            for j in range(4):
                D.poly(ctx, [(cx - 10, gy - 860 + j * 140), (cx + 30, gy - 900 + j * 140), (cx + 20, gy - 820 + j * 140)],
                       T("#f2c230"), INK, 2, wob=0)
        elif k == "cow":
            for (sx, sy, r) in ((-50, -700, 40), (40, -560, 50), (-40, -380, 36)):
                D.ellipse(ctx, cx + sx, gy + sy, r, r * 0.75, T(c2), None, 0)
        elif k == "hotdog":
            D.curve(ctx, [(cx - 90, gy - 640), (cx - 30, gy - 600), (cx + 30, gy - 650), (cx + 90, gy - 600)], T(c2), 14)
        D.poly(ctx, body, None, INK, 4, wob=0)


# --- костюмерная ----------------------------------------------------------------------

def costume_room(ctx, tod="day", x0=-600, x1=3600, lit=True, t=0.0, rascal_hook=True):
    """Костюмерная. Ключевые x: зеркало x0+1150, шкафчики x0+1800…, полка с головами x1-900."""
    T = Tf(tod)
    _room(ctx, x0, x1, T, wall="#d8eaf6", floor="#c89a6a", trim="#2f8fd8", panel="#bcd6ea")
    # окошко-иллюминатор
    D.circle(ctx, x0 + 450, 140, 130, T("#bfe6f5") if tod not in NIGHT else T("#2a3a78"), INK, 6)
    D.circle(ctx, x0 + 450, 140, 112, None, T("#2f8fd8"), 10)
    D.line(ctx, x0 + 340, 140, x0 + 560, 140, INK, 5)
    D.line(ctx, x0 + 450, 30, x0 + 450, 250, INK, 5)
    poster(ctx, x0 + 700, -20, 220, 300, T, "rascal", 0)
    # трюмо с лампочками
    mx = x0 + 1150
    D.rrect(ctx, mx - 200, 140, 400, 440, 26, T("#e8f4ff"), INK, 6)
    D.poly(ctx, [(mx - 170, 170), (mx - 70, 170), (mx - 170, 330)], hexrgb("#ffffff"), None, 0, wob=0, alpha=0.6)
    for k in range(9):
        a = k / 8
        on = lit and (tod not in ("deepnight",))
        D.circle(ctx, mx - 200 + a * 400, 128, 15, hexrgb("#fff2a0") if on else T("#c9d0d6"), INK, 2)
        if on:
            D.radial(ctx, mx - 200 + a * 400, 128, 50, "#fff2a0", 0.4, 0)
    D.rect(ctx, mx - 260, FL - 280, 520, 44, T("#a8743a"), INK, 4, wob=0)
    for lx in (mx - 240, mx + 200):
        D.rect(ctx, lx, FL - 236, 40, 236 - 40, T("#8a5a34"), INK, 3, wob=0)
    for k, c in enumerate(("#f05a8a", "#2f8fd8", "#ffd23a")):     # баночки грима
        D.rrect(ctx, mx - 200 + k * 70, FL - 330, 50, 50, 10, T(c), INK, 2)
    D.rect(ctx, mx + 60, FL - 320, 120, 40, T("#fbfaf6"), INK, 2, wob=0)                  # расчёска
    # шкафчики
    for k in range(4):
        lx = x0 + 1600 + k * 200
        D.rect(ctx, lx, 340, 190, FL - 380, T(PASTEL[k]), INK, 4, wob=0)
        D.rect(ctx, lx + 25, 380, 140, 44, T("#fbfaf6"), INK, 2, wob=0)
        D.text(ctx, ["RASCAL", "DRAGON", "COW", "HOT DOG"][k], lx + 95, 412, 24, D.FONT_TITLE, T("#2b2f3a"))
        for j in range(4):
            D.line(ctx, lx + 40, 460 + j * 22, lx + 150, 460 + j * 22, T(shade(hexrgb(PASTEL[k]), -0.2)), 4)
        D.circle(ctx, lx + 160, 640, 10, T("#c9d0d6"), INK, 2)
    # полка с головами костюмов
    sx = x1 - 900
    D.rect(ctx, sx - 420, 300, 840, 26, T("#a8743a"), INK, 4, wob=0)
    for kx in (sx - 380, sx + 340):
        D.poly(ctx, [(kx, 326), (kx + 40, 326), (kx, 380)], T("#8a5a34"), INK, 2, wob=0)
    for k, c in enumerate(("#3fbf6a", "#fbfaf6", "#c8503a")):
        hx = sx - 280 + k * 280
        D.circle(ctx, hx, 210, 90, T(c), INK, 4)
        if k == 0:
            for j in range(3):
                D.poly(ctx, [(hx - 40 + j * 40, 125), (hx - 20 + j * 40, 90), (hx + j * 40, 125)], T("#f2c230"),
                       INK, 2, wob=0)
        elif k == 1:
            D.ellipse(ctx, hx - 40, 180, 26, 20, T("#2b2c31"), None, 0)
            D.ellipse(ctx, hx, 260, 40, 26, T("#ffc0d0"), INK, 2)
        for ex in (-30, 30):
            D.circle(ctx, hx + ex, 200, 14, T("#fbfaf6"), INK, 2)
            D.circle(ctx, hx + ex, 200, 6, INK, None, 0)
        D.curve(ctx, [(hx - 34, 250), (hx, 268), (hx + 34, 250)], INK, 4)
    # крючок для костюма Раскала
    if rascal_hook:
        D.line(ctx, sx + 250, 360, sx + 250, 420, INK, 6)
        D.curve(ctx, [(sx + 250, 420), (sx + 236, 446), (sx + 262, 450)], INK, 6)
    # корзина для белья
    D.poly(ctx, [(x1 - 400, FL - 200), (x1 - 160, FL - 200), (x1 - 180, FL - 40), (x1 - 380, FL - 40)],
           T("#d8a85a"), INK, 4, wob=0)
    for k in range(5):
        D.line(ctx, x1 - 390 + k * 50, FL - 200, x1 - 375 + k * 45, FL - 40, T("#a8783a"), 3)
    D.ellipse(ctx, x1 - 280, FL - 210, 110, 30, T("#e8423c"), INK, 3)
    D.rrect(ctx, x0 + 1520, -130, 760, 120, 24, T("#e8423c"), INK, 5)
    D.text(ctx, "CAST MEMBERS ONLY", x0 + 1900, -50, 56, D.FONT_TITLE, T("#fbfaf6"))
    for lxx in (x0 + 900, x0 + 2700, x0 + 3850):
        ceiling_lamp(ctx, lxx, -120, lit and tod not in ("deepnight",), T)


# --- пультовая ------------------------------------------------------------------------

def countdown_text(sec):
    sec = max(0, int(sec))
    d, r = divmod(sec, 86400)
    h, r = divmod(r, 3600)
    m, s = divmod(r, 60)
    return "%02d:%02d:%02d:%02d" % (d, h, m, s)


def control_room(ctx, tod="day", x0=-600, x1=3600, power=1.0, countdown=None, battery=False, t=0.0,
                 window_view=None):
    """Пультовая: окно на парк (x0+200…x0+1000), стена мониторов (x0+1200…), компьютер салюта
    (центр x1-700), пульт (x0+150…x0+1650, верх FL-280)."""
    T = Tf(tod if power > 0 else "deepnight")
    _room(ctx, x0, x1, T, wall="#3a4a6a", floor="#2b3040", trim="#ffd23a", panel="#2f3d5a")
    # окно на парк
    wx0, wy0, ww, wh = x0 + 180, -40, 860, 520
    ctx.save()
    ctx.rectangle(wx0, wy0, ww, wh)
    ctx.clip()
    if window_view:
        window_view(ctx, wx0, wy0, ww, wh)
    else:
        D.vgrad(ctx, wx0, wy0, ww, wh, [(0, "#0a1238"), (1, "#2c4a8c")] if tod in NIGHT else
                [(0, "#2f9be6"), (1, "#c8efff")])
        ctx.arc(wx0 + ww * 0.7, wy0 + wh * 0.55, 180, 0, TAU)
        D.col(ctx, T("#fbfaf6"))
        ctx.set_line_width(8)
        ctx.stroke()
        for k in range(8):
            a = k * TAU / 8
            D.line(ctx, wx0 + ww * 0.7, wy0 + wh * 0.55, wx0 + ww * 0.7 + math.cos(a) * 180,
                   wy0 + wh * 0.55 + math.sin(a) * 180, T("#fbfaf6"), 3)
        D.poly(ctx, [(wx0, wy0 + wh), (wx0, wy0 + wh * 0.75), (wx0 + 200, wy0 + wh * 0.6), (wx0 + 380, wy0 + wh * 0.7),
                     (wx0 + ww, wy0 + wh * 0.8), (wx0 + ww, wy0 + wh)], T("#2a3a5a"), None, 0, wob=0)
    ctx.restore()
    D.rect(ctx, wx0, wy0, ww, wh, None, INK, 8, wob=0)
    D.line(ctx, wx0 + ww / 2, wy0, wx0 + ww / 2, wy0 + wh, INK, 8)
    # стена мониторов
    for row in range(3):
        for col in range(4):
            mx = x0 + 1200 + col * 230
            my = -30 + row * 170
            on = power > 0 and not battery
            D.rect(ctx, mx, my, 210, 150, T("#1c2440"), INK, 4, wob=0)
            if on:
                D.rect(ctx, mx + 10, my + 10, 190, 130, hexrgb("#7fb0a0"), None, 0, wob=0)
                r = rng(row * 4 + col)
                for k in range(5):
                    zx = mx + 30 + r.uniform(0, 150) + math.sin(t * 0.7 + k) * 6
                    D.circle(ctx, zx, my + 112 - r.uniform(0, 30), 9, hexrgb("#3f7a30"), None, 0)
                    D.line(ctx, zx, my + 120, zx, my + 134, hexrgb("#3f7a30"), 6)
                D.text(ctx, "CAM %d" % (row * 4 + col + 1), mx + 52, my + 34, 20, D.FONT_TITLE, hexrgb("#e8fff0"))
    # компьютер салюта
    cx = x1 - 700
    D.rect(ctx, cx - 260, 20, 520, FL - 60, T("#5a606c"), INK, 5, wob=0)
    D.rrect(ctx, cx - 230, 50, 460, 90, 14, T("#e8423c"), INK, 4)
    D.text(ctx, "SHOWTIME 3000", cx, 112, 42, D.FONT_TITLE, T("#fbfaf6"))
    D.rect(ctx, cx - 220, 165, 440, 190, hexrgb("#0e1410"), INK, 4, wob=0)
    if countdown is not None:
        D.text(ctx, countdown_text(countdown), cx, 275, 58, D.FONT_TITLE, hexrgb("#ff4a3a"))
        D.text(ctx, "DAY 30 · 00:00 · GRAND FINALE", cx, 330, 20, D.FONT_TITLE, hexrgb("#ff9a8a"))
    for k in range(8):
        on = (power > 0 or battery) and (k + int(t * 3)) % 3
        D.circle(ctx, cx - 190 + k * 54, 400, 16, hexrgb("#4cff8a") if on else T("#2b3a2b"), INK, 2)
    D.rect(ctx, cx - 200, 450, 400, 220, T("#3a3f4a"), INK, 3, wob=0)
    if battery:
        D.rrect(ctx, cx - 110, 490, 220, 110, 14, T("#2b2f3a"), INK, 4)
        D.rect(ctx, cx + 110, 525, 20, 40, T("#2b2f3a"), INK, 3, wob=0)
        D.rect(ctx, cx - 95, 505, 140, 80, hexrgb("#4cff8a"), None, 0, wob=0)
        D.text(ctx, "BATTERY", cx, 650, 30, D.FONT_TITLE, hexrgb("#4cff8a"))
    else:
        for k in range(6):
            D.line(ctx, cx - 170, 480 + k * 30, cx + 170, 480 + k * 30, T("#2b2f3a"), 6)
    # кабели к пульту
    D.curve(ctx, [(cx - 260, 700), (cx - 600, 820), (x0 + 1650, 760)], INK, 10)
    # пульт
    D.poly(ctx, [(x0 + 150, FL - 280), (x0 + 1650, FL - 280), (x0 + 1720, FL - 60), (x0 + 80, FL - 60)],
           T("#5a606c"), INK, 5, wob=0)
    D.rect(ctx, x0 + 150, FL - 300, 1500, 24, T("#3a3f4a"), INK, 3, wob=0)
    for k in range(16):
        bx = x0 + 230 + k * 72
        D.circle(ctx, bx, FL - 230 + (k % 2) * 60, 18, T(BRIGHT[k % 8]) if power > 0 else T("#3a3f4a"), INK, 2)
    for k in range(3):
        D.rect(ctx, x0 + 300 + k * 120, FL - 140, 30, 60, T("#c9d0d6"), INK, 2, wob=0)
    D.rrect(ctx, x0 + 1380, FL - 260, 200, 66, 14, T("#e8423c"), INK, 3)
    D.text(ctx, "MUSIC", x0 + 1480, FL - 214, 30, D.FONT_TITLE, T("#fbfaf6"))
    # кресло оператора
    D.rrect(ctx, x0 + 1900, FL - 380, 180, 220, 30, T("#2f6fd0"), INK, 4)
    D.rect(ctx, x0 + 1880, FL - 170, 220, 40, T("#2f6fd0"), INK, 4, wob=0)
    D.line(ctx, x0 + 1990, FL - 130, x0 + 1990, FL - 60, INK, 12)
    D.line(ctx, x0 + 1920, FL - 50, x0 + 2060, FL - 50, INK, 10)
    ceiling_lamp(ctx, x0 + 1600, -120, power > 0, T)


# --- аркада ---------------------------------------------------------------------------

def arcade(ctx, tod="day", x0=-600, x1=3600, lit=True, t=0.0, prize=True, pegs=(0.0,) * 9, unicorn_s=0.62):
    """Аркада: автоматы (x0+150…), кольцеброс (стойка x0+1500…x0+2800, верх FL-300, бутылки на ней),
    единорог на крючке справа (x1-500)."""
    T = Tf(tod)
    _room(ctx, x0, x1, T, wall="#3a2a6a", floor="#5a3a8a", trim="#ff4a9a", panel="#30245a")
    # гирлянда лампочек и неон
    for k in range(int((x1 - x0) / 120)):
        c = BRIGHT[k % 8]
        on = lit and (k + int(t * 6)) % 4 != 0
        D.circle(ctx, x0 + 60 + k * 120, -110 + 18 * math.sin(k * 0.9), 13, hexrgb(c) if on else T("#4a3a6a"), INK, 2)
    for (txt, c, xx) in (("ARCADE", "#ff4a9a", x0 + 600), ("PRIZES", "#4ad8ff", x1 - 600)):
        if lit:
            D.radial(ctx, xx, -10, 380, c, 0.25, 0)
        D.text(ctx, txt, xx, 30, 120, D.FONT_TITLE, hexrgb(c) if lit else T("#5a4a7a"), stroke=INK, slw=5)
    # автоматы
    for k in range(3):
        ax = x0 + 120 + k * 330
        c = BRIGHT[(k * 3) % 8]
        D.poly(ctx, [(ax, FL - 40), (ax, 300), (ax + 40, 240), (ax + 260, 240), (ax + 300, 300), (ax + 300, FL - 40)],
               T(c), INK, 5, wob=0)
        D.rect(ctx, ax + 40, 320, 220, 170, hexrgb("#1c2440"), INK, 4, wob=0)
        if lit:
            px = ax + 60 + (int(t * 5 + k) % 5) * 36
            D.rect(ctx, px, 400, 28, 28, hexrgb("#4cff8a"), None, 0, wob=0)
            D.circle(ctx, ax + 200, 360, 14, hexrgb("#ff4a3a"), None, 0)
        D.poly(ctx, [(ax + 20, 560), (ax + 280, 560), (ax + 300, 620), (ax, 620)], T(shade(hexrgb(c), -0.2)), INK, 3,
               wob=0)
        D.line(ctx, ax + 90, 560, ax + 90, 530, INK, 8)
        D.circle(ctx, ax + 90, 524, 14, T("#e8423c"), INK, 2)
        D.circle(ctx, ax + 190, 585, 16, T("#ffd23a"), INK, 2)
        D.rect(ctx, ax + 120, 700, 60, 40, T("#1c2440"), INK, 2, wob=0)
    # кольцеброс
    bx0, bx1 = x0 + 1450, x0 + 2850
    D.rect(ctx, bx0 - 60, -40, bx1 - bx0 + 120, 120, T("#fbfaf6"), INK, 5, wob=0)
    D.text(ctx, "RING TOSS · 3 RINGS $5", (bx0 + bx1) / 2, 40, 54, D.FONT_TITLE, T("#e8423c"))
    for k in range(13):     # полосатый навес
        ax = bx0 - 60 + k * (bx1 - bx0 + 120) / 13
        D.poly(ctx, [(ax, 80), (ax + (bx1 - bx0 + 120) / 13, 80), (ax + (bx1 - bx0 + 120) / 13 - 10, 150),
                     (ax + 10, 150)], T("#e8423c") if k % 2 == 0 else T("#fbfaf6"), INK, 2, wob=0)
    # призы-плюшки на задней стенке
    for k in range(10):
        px = bx0 + 70 + k * 130
        py = 250 + (k % 2) * 80
        c = T(BRIGHT[(k * 5) % 8])
        D.circle(ctx, px, py, 40, c, INK, 3)
        D.circle(ctx, px - 28, py - 34, 14, c, INK, 2)
        D.circle(ctx, px + 28, py - 34, 14, c, INK, 2)
        D.circle(ctx, px - 12, py - 4, 5, INK, None, 0)
        D.circle(ctx, px + 12, py - 4, 5, INK, None, 0)
        D.ellipse(ctx, px, py + 14, 10, 6, INK, None, 0)
    D.rect(ctx, bx0, FL - 300, bx1 - bx0, 30, T("#e8423c"), INK, 5, wob=0)
    D.rect(ctx, bx0, FL - 270, bx1 - bx0, 230, T("#ffd23a"), INK, 5, wob=0)
    for k in range(int((bx1 - bx0) / 80)):
        D.rect(ctx, bx0 + k * 80 + 20, FL - 250, 40, 190, T("#ffe36a"), None, 0, wob=0)
    for k in range(9):
        px = bx0 + 160 + (k % 3) * 120 + (k // 3) * 420
        py = FL - 300
        D.poly(ctx, [(px - 20, py), (px + 20, py), (px + 20, py - 80), (px + 8, py - 116), (px + 8, py - 144),
                     (px - 8, py - 144), (px - 8, py - 116), (px - 20, py - 80)], T("#7fd0a0"), INK, 3, wob=0)
        D.rect(ctx, px - 20, py - 60, 40, 24, T("#fbfaf6"), None, 0, wob=0)
        if pegs[k] > 0:
            ry = py - 140 + 60 * pegs[k]
            D.ellipse(ctx, px, ry, 34, 10, None, INK, 9)
            D.ellipse(ctx, px, ry, 34, 10, None, T(BRIGHT[k % 8]), 5)
    if prize:
        ux = x1 - 520
        D.line(ctx, ux + 120, 120, ux + 120, 190, INK, 6)
        D.curve(ctx, [(ux + 120, 190), (ux + 104, 214), (ux + 132, 220)], INK, 6)
        unicorn(ctx, ux, FL - 50, unicorn_s, tod, -1, t)
    if lit:
        D.radial(ctx, (bx0 + bx1) / 2, 300, 900, "#ffe9a0", 0.12, 0)


# --- зеркальный лабиринт ----------------------------------------------------------------

def mirror_maze(ctx, tod="day", x0=-600, x1=3600, t=0.0, reflections=None, lit=True, w=400):
    """Зал зеркал: панели в золотых рамах от y=-60 до пола; reflections(ctx, i, cx, rect) рисует
    отражения внутри зеркала i (клип по стеклу)."""
    T = Tf(tod)
    _room(ctx, x0, x1, T, wall="#2a2448", floor="#3a3060", trim="#ff4a9a", panel="#241e40")
    for i in range(int((x1 - x0) / w) + 1):
        mx = x0 + i * w
        rect = (mx + 22, -40, w - 44, FL - 80 + 40)
        D.rect(ctx, mx, -70, w, FL - 30 + 70, T("#ffd23a"), INK, 5, wob=0)
        D.rect(ctx, mx + 8, -62, w - 16, FL - 46 + 62, None, T("#e8b020"), 4, wob=0)
        D.rect(ctx, *rect, T("#bcd8ec"), INK, 3, wob=0)
        if reflections:
            ctx.save()
            ctx.rectangle(*rect)
            ctx.clip()
            reflections(ctx, i, mx + w / 2, rect)
            ctx.restore()
        D.poly(ctx, [(mx + 40, -40), (mx + 130, -40), (mx + 40, 260)], hexrgb("#ffffff"), None, 0, wob=0, alpha=0.3)
        D.rect(ctx, *rect, None, INK, 3, wob=0)
        star(ctx, mx + w / 2, -100, 22, T("#ffd23a"), 2)
    for k in range(int((x1 - x0) / 140)):
        D.circle(ctx, x0 + 70 + k * 140, -150, 10, hexrgb("#ff8ac8") if lit else T("#4a3a6a"), None, 0)


# --- мастерская в сарае ------------------------------------------------------------------

def workshop(ctx, tod="day", x0=-600, x1=3600, lit=True, t=0.0, patches_done=0, total=37):
    """Сарай аэростата изнутри: доски, балки, доска-счётчик дыр (x0+1100…), верстак со швейной
    машинкой (x0+2300…x0+3300, верх FL-280), ящик инструментов (x0+200)."""
    T = Tf(tod)
    _room(ctx, x0, x1, T, wall="#c8784a", floor="#8a6a4a", trim="#5a3a1e", panel="#b0683e")
    for k in range(int((x1 - x0) / 90)):
        D.line(ctx, x0 + k * 90, -900, x0 + k * 90, FL - 310, T("#a85a34"), 3)
    for xx in (x0 + 900, x1 - 900):
        D.rect(ctx, xx - 30, -900, 60, FL + 860, T("#6a4428"), INK, 4, wob=0)
    D.rect(ctx, x0, -160, x1 - x0, 50, T("#6a4428"), INK, 4, wob=0)
    # доска-счётчик
    bx = x0 + 1100
    D.rect(ctx, bx, 0, 820, 440, T("#2a3a2a"), INK, 6, wob=0)
    D.rect(ctx, bx - 10, 440, 840, 20, T("#8a5a34"), INK, 3, wob=0)
    D.text(ctx, "HOLES: %d / %d" % (patches_done, total), bx + 410, 80, 52, D.FONT_HAND, T("#fbfaf6"))
    for k in range(total):
        cx = bx + 60 + (k % 13) * 58
        cy = 150 + (k // 13) * 100
        D.circle(ctx, cx, cy, 20, None, T("#fbfaf6"), 3)
        if k < patches_done:
            D.line(ctx, cx - 18, cy - 18, cx + 18, cy + 18, hexrgb("#ffd23a"), 5)
            D.line(ctx, cx + 18, cy - 18, cx - 18, cy + 18, hexrgb("#ffd23a"), 5)
    # верстак со швейной машинкой
    wx0, wx1 = x0 + 2300, x0 + 3300
    D.rect(ctx, wx0, FL - 280, wx1 - wx0, 44, T("#a8743a"), INK, 4, wob=0)
    for lx in (wx0 + 30, wx1 - 70):
        D.rect(ctx, lx, FL - 236, 40, 196, T("#8a5a34"), INK, 3, wob=0)
    sx = wx0 + 420
    D.poly(ctx, [(sx - 150, FL - 280), (sx - 150, FL - 430), (sx + 130, FL - 430), (sx + 130, FL - 390),
                 (sx - 90, FL - 390), (sx - 90, FL - 280)], T("#2b2f3a"), INK, 4, wob=0)
    D.rect(ctx, sx + 100, FL - 390, 30, 70, T("#2b2f3a"), INK, 3, wob=0)
    D.line(ctx, sx + 115, FL - 320, sx + 115, FL - 290, T("#c9d0d6"), 3)
    D.circle(ctx, sx - 150, FL - 370, 44, T("#c9d0d6"), INK, 4)
    D.text(ctx, "SEW", sx - 10, FL - 398, 24, D.FONT_TITLE, T("#ffd23a"))
    for k in range(4):
        D.rect(ctx, wx0 + 720 + k * 60, FL - 340, 40, 60, T(BRIGHT[k * 2]), INK, 3, wob=0)
        D.line(ctx, wx0 + 740 + k * 60, FL - 350, wx0 + 740 + k * 60, FL - 340, INK, 4)
    D.poly(ctx, [(wx0 + 560, FL - 300), (wx0 + 660, FL - 296), (wx0 + 640, FL - 284)], T("#c9d0d6"), INK, 2,
           wob=0)                                            # ножницы
    # ящик инструментов
    D.rect(ctx, x0 + 200, FL - 340, 420, 300, T("#e8423c"), INK, 5, wob=0)
    D.rect(ctx, x0 + 330, FL - 380, 160, 40, None, INK, 8, wob=0)
    D.text(ctx, "TOOLS", x0 + 410, FL - 170, 56, D.FONT_TITLE, T("#fbfaf6"))
    # мотки верёвки на стене
    for k in range(2):
        cx = x0 + 400 + k * 300
        for j in range(3):
            D.circle(ctx, cx, 200, 90 - j * 22, None, T("#d8b878"), 12)
        D.circle(ctx, cx, 200, 90, None, INK, 3)
    D.line(ctx, x0 + 350, 90, x0 + 750, 90, INK, 8)
    if lit:
        for k in range(3):
            ceiling_lamp(ctx, x0 + 600 + k * 1300, -110, True, T)


# --- маяк Гаса ---------------------------------------------------------------------------

def lighthouse_room(ctx, tod="night", x0=-600, x1=3600, t=0.0, beam=0.0, park_lights=1.0):
    """Комната смотрителя маяка: круглое окно (центр x0+800, y 260, r 300) на озеро и далёкий
    остров-парк, прожектор, стол с рацией (центр GUS_RADIO_X, верх FL-280), кресло-качалка."""
    T = Tf(tod)
    D.rect(ctx, x0, -900, x1 - x0, FL + 900, T("#f2e6c8"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 140)):
        D.line(ctx, x0 + k * 140, -900, x0 + k * 140, FL, T("#e2d4b0"), 3)
    D.rect(ctx, x0, FL - 300, x1 - x0, 260, T("#2b3550"), None, 0, wob=0)
    D.rect(ctx, x0, FL - 310, x1 - x0, 16, T("#e8423c"), None, 0, wob=0)
    # окно на озеро
    wx, wy, wr = x0 + 800, 260, 300
    ctx.save()
    ctx.arc(wx, wy, wr, 0, TAU)
    ctx.clip()
    from sets import sea as SEA
    SEA.sky(ctx, wx - wr, wy - wr, wr * 2, wr * 1.2, tod)
    if tod in NIGHT:
        SEA.stars(ctx, wx - wr, wy - wr, wr * 2, wr, t, 3, 1.6)
    far = SEA.SEA.get(tod, SEA.SEA["day"])
    D.vgrad(ctx, wx - wr, wy + 20, wr * 2, wr, [(0, far[0]), (1, far[1])])
    for k in range(10):
        lx_ = wx - wr + ((k * 97 + t * 15) % (wr * 2))
        D.line(ctx, lx_, wy + 60 + k * 22, lx_ + 30, wy + 60 + k * 22, hexrgb("#e6f8ff"), 2, 0.5)
    px, py = wx + 40, wy + 22
    D.poly(ctx, [(px - 200, py), (px - 150, py - 18), (px + 170, py - 20), (px + 230, py)], T("#2a3a2a"), None, 0, wob=0)
    ctx.arc(px + 90, py - 60, 44, 0, TAU)
    D.col(ctx, hexrgb("#fff2a0") if park_lights > 0 and tod in NIGHT else T("#c9d0d6"), 0.9)
    ctx.set_line_width(3)
    ctx.stroke()
    D.line(ctx, px + 70, py - 18, px + 90, py - 60, T("#c9d0d6"), 3)
    D.line(ctx, px + 110, py - 18, px + 90, py - 60, T("#c9d0d6"), 3)
    for k in range(4):
        D.poly(ctx, [(px - 150 + k * 50, py - 18), (px - 140 + k * 50, py - 60 - (k % 2) * 20),
                     (px - 125 + k * 50, py - 18)], T("#2f6fd0"), None, 0, wob=0)
    D.line(ctx, px - 30, py - 18, px - 30, py - 110, T("#7a4fc2"), 6)
    if park_lights > 0 and tod in NIGHT:
        for k in range(12):
            D.circle(ctx, px - 170 + k * 30, py - 12 - (k % 3) * 5, 2.5, hexrgb("#fff2a0"), None, 0)
    ctx.restore()
    D.circle(ctx, wx, wy, wr, None, INK, 16)
    D.circle(ctx, wx, wy, wr, None, T("#2b3550"), 10)
    D.line(ctx, wx - wr, wy, wx + wr, wy, T("#2b3550"), 8)
    D.line(ctx, wx, wy - wr, wx, wy + wr, T("#2b3550"), 8)
    D.rect(ctx, wx - wr - 30, wy + wr - 10, wr * 2 + 60, 30, T("#8a5a34"), INK, 3, wob=0)
    # прожектор
    lx = x0 + 1350
    D.rect(ctx, lx - 22, 380, 44, FL - 420, T("#5a606c"), INK, 4, wob=0)
    D.line(ctx, lx - 120, FL - 40, lx + 120, FL - 40, INK, 14)
    ctx.save()
    ctx.translate(lx, 330)
    D.rrect(ctx, -90, -80, 180, 160, 36, T("#2b3550"), INK, 5)
    D.circle(ctx, -90, 0, 72, hexrgb("#fff2a0") if beam > 0 else T("#c9d0d6"), INK, 5)
    ctx.restore()
    if beam > 0:
        D.radial(ctx, lx - 90, 330, 360, "#fff2a0", 0.7 * beam, 0)
    # стол с рацией
    rx = GUS_RADIO_X
    D.rect(ctx, rx - 280, FL - 280, 560, 40, T("#8a5a34"), INK, 4, wob=0)
    for k in (-1, 1):
        D.rect(ctx, rx + k * 240 - 15, FL - 240, 30, 200, T("#6a4428"), INK, 3, wob=0)
    radio(ctx, rx + 140, FL - 280, 1.0, True, tod, 9, t)
    D.rrect(ctx, rx - 220, FL - 360, 80, 80, 14, T("#e8f0f4"), INK, 3)
    D.rect(ctx, rx - 210, FL - 380, 60, 24, T("#2f8fd8"), INK, 2, wob=0)
    D.rect(ctx, rx - 80, FL - 300, 160, 20, T("#fbf3dc"), INK, 2, wob=0)        # бортовой журнал
    # спасательный круг и карта озера
    cx, cy = x1 - 500, 140
    D.circle(ctx, cx, cy, 130, T("#e8423c"), INK, 5)
    D.circle(ctx, cx, cy, 70, T("#f2e6c8"), INK, 5)
    for k in range(4):
        a = k * math.pi / 2 + math.pi / 4
        D.line(ctx, cx + math.cos(a) * 72, cy + math.sin(a) * 72, cx + math.cos(a) * 128, cy + math.sin(a) * 128,
               T("#fbfaf6"), 26)
    mx = x0 + 2300
    D.rect(ctx, mx - 300, -30, 600, 380, T("#fbf3dc"), INK, 4, wob=0)
    D.ellipse(ctx, mx, 180, 250, 130, T("#9fd0ec"), None, 0)
    D.ellipse(ctx, mx + 120, 190, 54, 36, T("#7cc464"), INK, 2)
    star(ctx, mx + 120, 186, 14, T("#e8423c"))
    D.circle(ctx, mx - 200, 160, 10, T("#e8423c"), INK, 2)
    D.curve(ctx, [(mx + 120, 186), (mx - 40, 120), (mx - 200, 160)], T("#2a3a7a"), 3)
    D.text(ctx, "SILVER LAKE", mx, 30, 32, D.FONT_HAND, T("#2a3a7a"))
    # кресло-качалка
    kx = x1 - 900
    D.rrect(ctx, kx - 20, FL - 520, 40, 300, 14, T("#a8865a"), INK, 3)
    D.rect(ctx, kx - 20, FL - 250, 220, 30, T("#a8865a"), INK, 3, wob=0)
    D.curve(ctx, [(kx - 80, FL - 50), (kx + 80, FL - 20), (kx + 240, FL - 50)], INK, 8)
    for xx in (kx, kx + 180):
        D.line(ctx, xx, FL - 220, xx, FL - 40, INK, 8)
    D.rect(ctx, x0, FL - 40, x1 - x0, 900, T("#a8743a"), None, 0, wob=0)
    for k in range(int((x1 - x0) / 160) + 1):
        D.line(ctx, x0 + k * 160, FL - 40, x0 + k * 160 + (k * 160 - (x1 - x0) / 2) * 0.4, FL + 800, T("#8a5a34"), 3)
    D.rect(ctx, x0, FL - 50, x1 - x0, 14, T("#6a4428"), None, 0, wob=0)


GUS_RADIO_X = 1800    # центр стола рации (мировой x)
