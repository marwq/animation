"""День 18: корзине нужны крепкие тросы. Самый крепкий в парке — стальной трос зиплайна над лагуной. Последний спуск,
быстрее, чем когда-либо, с криком. Потом срезаешь: 800 футов троса и очень хороший день."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
ZX0, ZH = 0, 1300                 # высокая башня
ZX1, ZY1 = 5200, FL - 330         # нижняя опора на том берегу
CX0, CY0 = ZX0 + 160, FL - ZH - 130
LAG0, LAG1 = 700, 4700
SAG = 260


def cable_pt(u, slack=0.0):
    x = lerp(CX0, ZX1, u)
    y = lerp(CY0, ZY1, u) + (SAG + slack * 900) * math.sin(math.pi * u)
    return x, y


def zip_cable(ctx, slack=0.0, cut_k=0.0):
    pts = [cable_pt(k / 60, slack) for k in range(61)]
    if cut_k > 0:       # после разреза свободный конец падает к воде
        n = len(pts)
        pts = [(x, min(FL - 10, y + cut_k * 600 * (k / n) ** 2)) for k, (x, y) in enumerate(pts)]
    D.polyline(ctx, pts, D.INK, 9)
    D.polyline(ctx, pts, hexrgb("#c9d0d6"), 4)


def low_post(ctx, tod="day"):
    D.rect(ctx, ZX1 - 30, ZY1 - 20, 60, FL - ZY1 + 20, hexrgb("#a8743a"), D.INK, 4, wob=0)
    D.rect(ctx, ZX1 - 220, FL - 40, 300, 40, hexrgb("#8a5a34"), D.INK, 3, wob=0)
    D.circle(ctx, ZX1, ZY1, 18, hexrgb("#5a606c"), D.INK, 3)


def zip_scene(ctx, t, cam, tod="day", slack=0.0, cut_k=0.0, sun=(4200, -900, 120)):
    grass_back(ctx, t, cam, tod, -3000, 9000, sun=sun)
    with layer(ctx, cam, t):
        LK.lagoon(ctx, t, LAG0, LAG1, FL - 30, FL + 600, tod)
        RD.zip_tower(ctx, ZX0, FL, ZH, tod)
        low_post(ctx, tod)
        zip_cable(ctx, slack, cut_k)


def shot_rope(ctx, t, S):
    """Мастерская: Тео тянет старую верёвку — ТРЕСК. Бандит делает вид, что ни при чём."""
    d = S.cue(1) - 0.1
    T_SNAP = d * 0.45
    cam = Cam(1250, 560, Keys((0, 1.25), (d, 1.35)))
    room_back(ctx, t, cam, "workshop_31", lambda c: IN.workshop(c, "day", patches_done=31), (-600, -900, 4200, 2700),
              0.6)
    with layer(ctx, cam, t):
        snapped = t > T_SNAP
        pull = smooth(clamp(t / T_SNAP)) * 0.3
        p = R.stand("side", t, 1)
        p.update(face="worried" if not snapped else "shock", lean=-0.2 * pull if not snapped else -0.35,
                 h1=(0.9 - pull, -2.4), h2=(0.6 - pull, -2.35))
        x = 1050 - (60 if snapped else 0) * min(1, (t - T_SNAP) * 4)
        J = THEO_FUR_PATCH.draw(ctx, x, IN.FL + 60, 112, 1, p)
        hx, hy = THEO_FUR_PATCH.world(x, IN.FL + 60, 112, 1, J["hand1"])
        if not snapped:
            D.line(ctx, hx, hy, 1700, IN.FL - 250, D.INK, 14)
            D.line(ctx, hx, hy, 1700, IN.FL - 250, hexrgb("#d8b878"), 8)
        else:
            k = clamp((t - T_SNAP) / 0.4)
            mx = lerp(hx, 1700, 0.5)
            D.curve(ctx, [(hx, hy), (hx + 120, hy + 60 + 100 * k), (mx - 30, IN.FL - 40 * k)], hexrgb("#d8b878"), 8)
            D.curve(ctx, [(1700, IN.FL - 250), (1640, IN.FL - 150), (mx + 30, IN.FL - 40 * k)], hexrgb("#d8b878"), 8)
        D.rect(ctx, 1680, IN.FL - 290, 40, 120, hexrgb("#5a606c"), D.INK, 3, wob=0)       # крюк на стене
        draw_raccoon(ctx, 1450, IN.FL + 60, 100, -1 if not snapped else 1,
                     raccoon_pose(t, "sit", look=0.6 if snapped else -0.3))
    if snapped:
        pop_text(ctx, "SNAP!", W / 2, 260, t, T_SNAP, 130, "#ff8a7a", dur=1.0)
    if t > T_SNAP + 1.0:
        pop_text(ctx, "NEED STRONG ROPE", W / 2, 200, t, T_SNAP + 1.0, 80, "#fff6d8", dur=d, shake=False)


def shot_cable(ctx, t, S):
    """Зиплайн над лагуной; крупно: стальной трос, свитый из прядей."""
    d = S.cue(2) - S.cue(1)
    T_CLOSE = d * 0.55
    if t < T_CLOSE:
        cam = Cam(2600, FL - 700, Keys((0, 0.33), (T_CLOSE, 0.36)), anchor=(2600, 520))
        zip_scene(ctx, t, cam)
        pop_text(ctx, "THE ZIP LINE", W / 2, 200, t, 0.3, 90, "#ffd23a", dur=T_CLOSE, shake=False)
        return
    tt = t - T_CLOSE
    D.vgrad(ctx, 0, 0, W, H, [(0, "#6cc4f4"), (1, "#c8efff")])
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(0.12)
    D.rect(ctx, -1300, -70, 2600, 140, hexrgb("#8f99a3"), D.INK, 8, wob=0)
    for k in range(-30, 30):
        x = k * 60 + (tt * 40) % 60
        D.curve(ctx, [(x, -68), (x + 30, 0), (x + 60, 68)], hexrgb("#c9d0d6"), 16)
        D.curve(ctx, [(x, -68), (x + 30, 0), (x + 60, 68)], D.INK, 3)
    ctx.restore()
    pop_text(ctx, "STEEL CABLE", W / 2, 260, tt, 0.2, 110, "#fff6d8", dur=d, shake=False)


def rider(ctx, t, u, slack=0.0, scream=True):
    """Ролик на тросе и Раскал, висящий на ручке; Бандит вцепился в голову."""
    x, y = cable_pt(u, slack)
    x2, y2 = cable_pt(min(1, u + 0.01), slack)
    a = math.atan2(y2 - y, x2 - x)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    D.rrect(ctx, -60, -10, 120, 46, 14, hexrgb("#e8423c"), D.INK, 4)
    for k in (-1, 1):
        D.circle(ctx, k * 34, -4, 16, hexrgb("#5a606c"), D.INK, 3)
    ctx.restore()
    # обвязка: строп от ролика к поясу, руки держатся за строп
    hip_y = y + 390
    gy = hip_y + R.HIP_H * 112
    D.line(ctx, x, y + 36, x - 8, hip_y - 10, D.INK, 10)
    D.line(ctx, x, y + 36, x - 8, hip_y - 10, hexrgb("#2f6fd0"), 6)
    swing = 0.25 * math.sin(t * 3)
    p = R.stand("side", t, 1)
    p.update(h1=(0.1, -2.75), h2=(-0.02, -2.95), lean=-0.12 + 0.08 * swing, f1=(0.5, 0.12), f2=(0.32, 0.05))
    RASCAL_PATCH.draw(ctx, x, gy, 112, 1, rascal_pose(p, "happy" if scream else "calm"))
    D.rect(ctx, x - 70, hip_y - 26, 130, 30, hexrgb("#2f6fd0"), D.INK, 3, wob=0)
    draw_raccoon(ctx, x - 40, gy - 4.45 * 112, 80, 1, raccoon_pose(t, "sit", look=0.8))
    return x, y


def shot_ride(ctx, t, S):
    """Последний спуск: всё быстрее над водой, линии скорости, крик."""
    d = S.cue(3) - S.cue(2)
    u_of = lambda q: 0.04 + 0.92 * clamp(q / d) ** 1.6
    cam = Cam(lambda q: cable_pt(u_of(q))[0] + 300, lambda q: cable_pt(u_of(q))[1] + 320, Keys((0, 0.7), (d, 0.62)),
              shake=0.06, anchor=(2600, 520))
    zip_scene(ctx, t, cam)
    with layer(ctx, cam, t):
        rider(ctx, t, u_of(t))
    speed_lines(ctx, t, n=30, a=0.12 + 0.3 * clamp(t / d))
    pop_text(ctx, "AAAAAAAAH!", W / 2 + 200, 220, t, 0.3, 110 + 30 * clamp(t / d), "#fff6d8", dur=d, shake=True)


def shot_cut(ctx, t, S):
    """У нижней опоры: кусачки — ДЗЫНЬ, трос провисает и падает. Закат: огромная бухта троса — 800 футов."""
    d = S.dur - S.cue(3)
    T_CUT, T_COIL = d * 0.2, d * 0.45
    if t < T_COIL:
        cam = Cam(ZX1 - 500, FL - 400, 0.75, anchor=(ZX1, 520))
        cut_k = smooth(clamp((t - T_CUT) / 0.6)) if t > T_CUT else 0.0
        zip_scene(ctx, t, cam, "golden", slack=0.0, cut_k=cut_k, sun=(ZX1 + 600, 200, 140))
        with layer(ctx, cam, t):
            p = R.stand("side", t, 1)
            snip = t > T_CUT
            p.update(h1=(0.8, -3.3), h2=(0.7, -3.1), lean=-0.15 if snip else 0.0)
            J = RASCAL_PATCH.draw(ctx, ZX1 - 170, FL, 112, 1, rascal_pose(p, "calm"))
            hx, hy = RASCAL_PATCH.world(ZX1 - 170, FL, 112, 1, J["hand1"])
            op = 0.0 if snip else 0.4
            for k in (-1, 1):
                D.line(ctx, hx, hy, hx + 90, hy + k * (10 + 30 * op), D.INK, 10)
                D.line(ctx, hx, hy, hx - 70, hy + k * (20 + 40 * op), hexrgb("#e8423c"), 12)
        if t > T_CUT:
            pop_text(ctx, "TWANG!", W / 2 - 300, 260, t, T_CUT, 120, "#fff6d8", dur=1.0)
        return
    tt = t - T_COIL
    cam = Cam(ZX1 - 900, FL - 300, Keys((T_COIL, 1.0), (d, 1.08)), anchor=(ZX1, 520))
    grass_back(ctx, t, cam, "golden", -3000, 9000, sun=(ZX1 - 300, 300, 160))
    with layer(ctx, cam, t):
        cx, cy = ZX1 - 900, FL + 40
        for k in range(9):
            D.ellipse(ctx, cx, cy - k * 24, 300 - k * 6, 70 - k * 2, None, D.INK, 12)
            D.ellipse(ctx, cx, cy - k * 24, 300 - k * 6, 70 - k * 2, None, hexrgb("#c9d0d6"), 6)
        p = R.stand("side", tt, 1)
        p.update(h1=(0.62, -2.05), h2=(-0.2, -2.05))
        RASCAL_PATCH.draw(ctx, cx - 480, FL + 60, 112, 1, rascal_pose(p, "happy"))
        draw_raccoon(ctx, cx + 20, cy - 9 * 24 - 10, 90, -1, raccoon_pose(t, "sit", look=-0.3))
    counter_badge(ctx, "CABLE", "800 FT", W - 350, 160, "#ffd23a", 520)
    pop_text(ctx, "A VERY GOOD DAY", W / 2 - 150, 340, tt, 0.4, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_rope, "fade", 0.4),
        Shot(c(1) - 0.1, shot_cable, "fade", 0.3),
        Shot(c(2) - 0.1, shot_ride, "whip", 0.25),
        Shot(c(3) - 0.1, shot_cut, "fade", 0.3),
    ]
    S.tods = [(0, "day"), (c(3), "golden")]
    d3 = S.dur - c(3)
    S.sfx += [((c(1) - 0.1) * 0.45, "snap", 1.0), (c(2), "zip", 1.0), (c(2) + 0.3, "screams", 0.6),
              (c(3) + d3 * 0.2, "twang", 1.0), (c(3) + d3 * 0.2 + 0.6, "splash", 0.6)]
    S.music = [(0, "comic", 0.7), (c(1), "wonder", 0.8), (c(2), "chase", 1.0), (c(3) + d3 * 0.45, "happy_end", 0.8)]
