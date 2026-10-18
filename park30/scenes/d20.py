"""День 20: шару нужно место со стенами — двор замка. Но это полмили, а весит он как машина. Правило два: включаешь
парадную музыку, и вся Главная улица идёт за платформами. Шар на последней платформе, ты сверху машешь, как
маскот, до самого замка."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
CASTLE_X = 9800
V = 150                       # скорость парада, px/с


def parade_float(ctx, x, gy, kind, t, tod="day", music=False):
    """Парадная платформа: юбка с фестонами, огни, украшение kind; music — динамик с нотами."""
    T = lambda c: tone(c, tod)
    w = 900
    D.rrect(ctx, x - w / 2, gy - 230, w, 190, 30, T("#fbfaf6"), D.INK, 5)
    for k in range(12):
        sx = x - w / 2 + k * w / 12
        ctx.arc(sx + w / 24, gy - 40, w / 24, 0, math.pi)
        D.col(ctx, T(PK.BRIGHT[k % 8]))
        ctx.fill()
    D.rect(ctx, x - w / 2, gy - 120, w, 80, T("#f05a8a"), D.INK, 4, wob=0)
    RD.bulbs(ctx, [(x - w / 2 + 30 + k * 60, gy - 220) for k in range(15)], True, t, r=8)
    for wx in (x - 300, x + 300):
        D.circle(ctx, wx, gy - 26, 26, T("#2b2f3a"), D.INK, 3)
    top = gy - 230
    if kind == "cake":
        for j, (ww, hh, c) in enumerate(((560, 160, "#ffd6e0"), (420, 140, "#fff1b8"), (280, 120, "#cfe8ff"))):
            y = top - sum(h for _, h, _ in ((560, 160, 0), (420, 140, 0), (280, 120, 0))[:j + 1])
            D.rrect(ctx, x - ww / 2, y, ww, hh, 20, T(c), D.INK, 4)
        star(ctx, x, top - 470, 50, T("#ffd23a"), 3)
    elif kind == "carousel":
        D.poly(ctx, [(x - 330, top - 380), (x, top - 520), (x + 330, top - 380)], T("#e8423c"), D.INK, 4, wob=0)
        for k in range(5):
            D.line(ctx, x - 260 + k * 130, top - 380, x - 260 + k * 130, top, T("#ffd23a"), 10)
        RD.horse(ctx, x - 120, top - 170 + 20 * math.sin(t * 3), 0.9, 1, "#fbfaf6", t, tod)
        RD.horse(ctx, x + 140, top - 170 + 20 * math.sin(t * 3 + 2), 0.9, 1, "#f2a0c0", t, tod)
    elif kind == "balloon":
        BL.folded(ctx, x, top + 10, 0.8, tod)
    if music:
        D.poly(ctx, [(x + 360, top - 40), (x + 480, top - 140), (x + 480, top + 60)], T("#2b2f3a"), D.INK, 3, wob=0)
        for j in range(3):
            ph = (t * 0.9 + j / 3) % 1
            RD.note(ctx, x + 520 + ph * 260, top - 80 - ph * 220, 1.2, PK.BRIGHT[j * 2], 1 - ph, j % 2 == 0)


def shot_safe(ctx, t, S):
    """Двор замка: стены кругом, одни ворота. Безопасно."""
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 600), (d, 1800, "io")), FL - 600, Keys((0, 0.42), (d, 0.46)), anchor=(1200, 520))
    sky_back(ctx, t, cam, "day", -4000, 7000, sun=(2600, -1600, 140))
    with layer(ctx, cam, t):
        CA.courtyard(ctx, "day", -1800, 4200, FL, t=t)
        p = R.stand("side", t, 1)
        p.update(look=(1, -0.5), hturn=0.5 * math.sin(t * 1.2))
        RASCAL_PATCH.draw(ctx, 1000, FL + 160, 112, 1, rascal_pose(p, "happy"))
        draw_raccoon(ctx, 760, FL + 170, 100, 1, raccoon_pose(t, "sit", look=0.4))
    pop_text(ctx, "WALLS", W / 2 - 420, 230, t, 0.5, 90, "#7ee04a", dur=d, shake=False)
    if t > d * 0.45:
        pop_text(ctx, "ONE GATE", W / 2 + 380, 230, t, d * 0.45, 90, "#7ee04a", dur=d, shake=False)


def shot_weight(ctx, t, S):
    """Раскал толкает свёрток с шаром — ни с места; весы: шар = машина; полмили."""
    d = S.cue(2) - S.cue(1)
    T_SCALE = d * 0.45
    if t < T_SCALE:
        cam = Cam(1500, FL - 300, 0.9)
        grass_back(ctx, t, cam, "day", -2000, 5000, sun=(3000, -900, 120))
        with layer(ctx, cam, t):
            BL.folded(ctx, 1700, FL + 60, 0.85, "day")
            BL.basket(ctx, 2400, FL + 60, 0.8, "day", 0.0, t, tanks=2)
            p = R.stand("side", t, 1)
            push = abs(math.sin(t * 4))
            p.update(lean=0.45 + 0.08 * push, h1=(0.85, -2.0), h2=(0.8, -1.9), f1=(0.15, 0), f2=(-0.7, 0))
            RASCAL_PATCH.draw(ctx, 1110, FL + 80, 112, 1, rascal_pose(p, "sweat"))
        pop_text(ctx, "HNNNG!", W / 2 + 330, 260, t, 0.3, 100, "#ff8a7a", dur=T_SCALE)
        return
    tt = t - T_SCALE
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    # весы-коромысло: слева шар, справа машина — ровно
    cx, cy = W / 2, 560
    tilt = 0.12 * math.exp(-tt * 2.5) * math.cos(tt * 9)
    D.poly(ctx, [(cx - 60, 900), (cx + 60, 900), (cx, cy)], hexrgb("#c9d0d6"), D.INK, 5, wob=0)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(tilt)
    D.rect(ctx, -620, -14, 1240, 28, hexrgb("#ffd23a"), D.INK, 5, wob=0)
    for sx in (-1, 1):
        D.line(ctx, sx * 560, 0, sx * 560, 120, D.INK, 5)
        D.rect(ctx, sx * 560 - 220, 120, 440, 20, hexrgb("#c9d0d6"), D.INK, 4, wob=0)
    ctx.restore()
    lx, ly = cx - 560 * math.cos(tilt), cy - 560 * math.sin(tilt) + 120
    rx, ry = cx + 560 * math.cos(tilt), cy + 560 * math.sin(tilt) + 120
    BL.folded(ctx, lx, ly, 0.36, "day")
    LK.car(ctx, rx, ry, 0.9, "#2f8fd8", -1, "day")
    D.text(ctx, "=", cx, cy - 120, 140, D.FONT_TITLE, hexrgb("#fff6d8"))
    pop_text(ctx, "WEIGHS AS MUCH AS A CAR", W / 2, 180, tt, 0.2, 70, "#ffd23a", dur=d, shake=False)
    if tt > 0.9:
        pop_text(ctx, "1/2 MILE AWAY", W / 2, 790, tt, 0.9, 70, "#fff6d8", dur=d, shake=False)


def shot_parade(ctx, t, S):
    """Пульт: «PARADE MUSIC — ON». Платформы катятся по Главной улице, вся улица бредёт за ними."""
    d = S.cue(3) - S.cue(2)
    T_ON = 0.8
    if t < T_ON + 0.5:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#3a4a6a"), (1, "#2b3040")])
        D.rrect(ctx, W / 2 - 420, 240, 840, 560, 40, hexrgb("#5a606c"), D.INK, 8)
        D.text(ctx, "PARADE MUSIC", W / 2, 360, 80, D.FONT_TITLE, hexrgb("#ffd23a"))
        on = t > T_ON
        D.rrect(ctx, W / 2 - 120, 440, 240, 300, 30, hexrgb("#2b2f3a"), D.INK, 6)
        D.rrect(ctx, W / 2 - 90, 470 if on else 590, 180, 120, 20, hexrgb("#4cff8a" if on else "#e8423c"), D.INK, 5)
        D.text(ctx, "ON" if on else "OFF", W / 2, 550 if on else 670, 60, D.FONT_TITLE, hexrgb("#1c2440"))
        # перчатка Раскала нажимает
        gy_ = lerp(900, 640, smooth(clamp(t / T_ON))) if not on else 650
        D.rrect(ctx, W / 2 - 70, gy_, 140, 260, 60, hexrgb("#fbfaf6"), D.INK, 6)
        if on:
            pop_text(ctx, "CLICK.", W / 2 + 430, 300, t, T_ON, 90, "#fff6d8", dur=0.6)
        return
    tt = t - T_ON - 0.5
    lead = 1600 + V * tt
    cam = Cam(lambda q: 1600 + V * (q - T_ON - 0.5) - 1500, FL - 500, 0.4, anchor=(1600, 520))
    street_back(ctx, t, cam, "day", -1400, 8000, shut=True, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        for k, kind in enumerate(("cake", "carousel")):
            parade_float(ctx, lead - k * 1300, FL + 120, kind, t, "day", music=True)
        # толпа идёт следом за музыкой, с той же скоростью
        crowd_floor(ctx, tt, 201, 90, -2400, lead - 2300 - V * tt, FL + 20, FL + 360, 96, 120, vx=(V, V))
    pop_text(ctx, "RULE #2: MUSIC", W / 2, 200, tt, 0.2, 80, "#ffd23a", dur=d, shake=False)


def ride_float(ctx, t, x):
    """Последняя платформа: свёрток шара, Раскал на нём машет, Бандит на краю."""
    parade_float(ctx, x, FL + 120, "balloon", t, "day")
    wv = 0.15 * math.sin(t * 9)
    p = R.stand("side", t, 1)
    p.update(h1=(1.2, -2.55 + wv), h2=(0.4, -1.7))
    RASCAL_PATCH.draw(ctx, x + 60, FL - 395, 112, 1, rascal_pose(p, "happy"))
    draw_raccoon(ctx, x - 380, FL - 108, 95, 1, raccoon_pose(t, "sit", look=0.5))


def shot_ride(ctx, t, S):
    """Последняя платформа с шаром едет позади толпы; Раскал сверху машет, как маскот. У замка толпа уходит за
    музыкой дальше, а платформа останавливается у открытых ворот."""
    d = S.dur - S.cue(3)
    T_CASTLE = d * 0.42
    if t < T_CASTLE:
        x = 4200 + V * t
        cam = Cam(lambda q: 4200 + V * q + 500, FL - 420, 0.55)
        street_back(ctx, t, cam, "day", -1400, 8000, shut=True, sun=(6000, -900, 110))
        with layer(ctx, cam, t):
            # толпа впереди, идёт за музыкой с той же скоростью
            crowd_floor(ctx, t, 203, 45, x + 650, x + 3600, FL + 180, FL + 420, 100, 120, vx=(V, V))
            ride_float(ctx, t, x)
        pop_text(ctx, "*WAVE*", W / 2 - 420, 260, t, 0.3, 90, "#ffd23a", dur=T_CASTLE, shake=False)
        return
    tt = t - T_CASTLE
    dd = d - T_CASTLE
    T_GATE = dd * 0.7
    x_last = lerp(CASTLE_X - 700, CASTLE_X, smooth(clamp(tt / T_GATE)))
    cam = Cam(CASTLE_X - 300, FL - 700, Keys((0, 0.42), (dd, 0.45)), anchor=(CASTLE_X, 520))
    street_back(ctx, t, cam, "day", -1400, 8000, shut=True, sun=(9000, -900, 120))
    with layer(ctx, cam, t):
        CA.castle(ctx, CASTLE_X, FL, 0.9, "day", t, gate_open=1.0)
        ride_float(ctx, t, x_last)
        crowd_floor(ctx, tt, 204, 55, CASTLE_X - 150, CASTLE_X + 2600, FL + 220, FL + 440, 100, 120, vx=(V, V))
        parade_float(ctx, CASTLE_X + 3300 + V * tt, FL + 440, "carousel", t, "day", music=True)
    if tt > T_GATE:
        pop_text(ctx, "SAFE INSIDE", W / 2, 200, tt, T_GATE, 100, "#7ee04a", dur=d, shake=False)
    else:
        pop_text(ctx, "BYE-BYE!", W / 2 + 330, 260, tt, 0.4, 80, "#fff6d8", dur=T_GATE, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_safe, "fade", 0.4),
        Shot(c(1) - 0.1, shot_weight, "fade", 0.3),
        Shot(c(2) - 0.1, shot_parade, "fade", 0.25),
        Shot(c(3) - 0.1, shot_ride, "fade", 0.3),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(c(1) + 0.3, "strain", 0.8), (c(1) + (c(2) - c(1)) * 0.45, "thud", 0.6), (c(2) + 0.8, "click", 1.0),
              (c(3) + (S.dur - c(3)) * 0.6, "gate", 0.7)]
    S.music = [(0, "hope", 0.7), (c(1), "comic", 0.8), (c(2) + 0.8, "carnival", 1.0)]
