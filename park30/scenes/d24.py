"""День 24: буря сорвала шар с тележки и сбросила в ров замка. 300 фунтов мокрой ткани — не высохнет. Если не
повесить её на волнолёт и не включить на полную. Самая большая сушилка в мире. Сухо к обеду."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
MOAT_Y = FL - 60
SWING_X = 1500


def wet_fabric(ctx, x0, x1, y, t, seed=3):
    """Ткань шара плавает в воде: полосатые складки, пузыри."""
    r = rng(seed)
    x = x0
    k = 0
    while x < x1:
        w = r.uniform(140, 260)
        c = BL.GORES[k % 4]
        yy = y + 8 * math.sin(t * 1.6 + k)
        D.poly(ctx, [(x, yy + 10), (x + w * 0.3, yy - 26), (x + w * 0.7, yy - 18), (x + w, yy + 10)],
               shade(hexrgb(c), -0.15), D.INK, 3, wob=0)
        x += w * 0.8
        k += 1
    for j in range(6):
        ph = (t * 0.6 + j / 6) % 1
        D.circle(ctx, x0 + (j * 197) % (x1 - x0), y - ph * 40, 8 * (1 - ph) + 2, hexrgb("#e6f8ff"), D.INK, 1.5,
                 alpha=1 - ph)


def shot_moat(ctx, t, S):
    """После бури: тележка опрокинута, шар в рву замка. Раскал хватается за голову."""
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, -200), (d, 200)), FL - 500, Keys((0, 0.42), (d, 0.48)), anchor=(0, 520))
    sky_back(ctx, t, cam, "morning", -5000, 5000, sun=(1800, -200, 120))
    with layer(ctx, cam, t):
        PK.plaza(ctx, "morning", -5000, 5000, c="#a8d878")
        CA.castle(ctx, 0, MOAT_Y - 20, 0.8, "morning", t, gate_open=0.0)
        CA.moat(ctx, -3000, 3000, MOAT_Y, "morning", t, depth=240, bridge=(0, 520))
        wet_fabric(ctx, -2300, -400, MOAT_Y + 50, t)
        BL.basket(ctx, 700, MOAT_Y + 210, 0.8, "morning", 0.0, t, tanks=0)
        D.rect(ctx, 600, MOAT_Y + 120, 300, 130, hexrgb("#3fa8d8"), None, 0, wob=0, alpha=0.6)   # вода поверх
        # опрокинутая тележка на берегу
        ctx.save()
        ctx.translate(-1300, FL + 300)
        ctx.rotate(-0.5)
        D.rect(ctx, -300, -120, 600, 90, hexrgb("#8a5a34"), D.INK, 4, wob=0)
        for wx in (-200, 200):
            D.circle(ctx, wx, -20, 46, hexrgb("#2b2f3a"), D.INK, 4)
        ctx.restore()
        p = R.stand("side", t, 1)
        p.update(h1=(0.15, -4.1), h2=(-0.1, -4.0), lean=-0.1)
        RASCAL_PATCH.draw(ctx, -600, FL + 330, 112, 1, rascal_pose(p, "scared"))
        draw_raccoon(ctx, -900, FL + 340, 95, 1, raccoon_pose(t, "sit", look=0.4))
    if t > 0.8:
        pop_text(ctx, "NOOOO!", W / 2 + 330, 260, t, 0.8, 110, "#ff8a7a", dur=d, shake=True)


def shot_wet(ctx, t, S):
    """Вытаскиваешь мокрую ткань — с неё льёт; шкала: высохнет через 2 недели, а осталось 6 дней."""
    d = S.cue(2) - S.cue(1)
    T_CARD = d * 0.5
    if t < T_CARD:
        cam = Cam(-1200, FL - 200, 0.9, anchor=(0, 520))
        sky_back(ctx, t, cam, "morning", -5000, 5000, sun=(1800, -200, 120))
        with layer(ctx, cam, t):
            PK.plaza(ctx, "morning", -5000, 5000, c="#a8d878")
            CA.moat(ctx, -3000, 3000, MOAT_Y, "morning", t, depth=240, bridge=(0, 520))
            pull = smooth(clamp(t / T_CARD))
            # полотнище от воды до рук
            p = R.stand("side", t, 1)
            p.update(lean=-0.3, h1=(0.7, -2.2), h2=(0.6, -2.1), f1=(0.3, 0), f2=(-0.35, 0))
            x = -1500 - 120 * pull
            J = RASCAL_PATCH.draw(ctx, x, FL + 330, 112, 1, rascal_pose(p, "sweat"))
            hx, hy = RASCAL_PATCH.world(x, FL + 330, 112, 1, J["hand1"])
            pts = [(hx, hy), (hx + 160, hy + 40), (hx + 300, MOAT_Y + 10), (-600, MOAT_Y + 40)]
            for k, c in enumerate(BL.GORES[:4]):
                D.curve(ctx, [(px, py + k * 14) for px, py in pts], D.INK, 24)
                D.curve(ctx, [(px, py + k * 14) for px, py in pts], shade(hexrgb(c), -0.15), 18)
            r = rng(int(t * 12))
            for j in range(14):           # капает
                px = hx + r.uniform(0, 300)
                ph = (t * 2 + j / 14) % 1
                D.ellipse(ctx, px, hy + 40 + ph * 260, 5, 9, hexrgb("#8ad8ff"), D.INK, 1, alpha=1 - ph)
        counter_badge(ctx, "WET", "300 LB", W - 330, 160, "#8ad8ff", 460)
        return
    tt = t - T_CARD
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    for i, (lab, val, c, ok) in enumerate((("DRY TIME", "2 WEEKS", "#8ad8ff", False), ("DAYS LEFT", "6", "#ffd23a", True))):
        k = ease_out_back(clamp((tt - 0.2 - i * 0.5) / 0.35))
        if k <= 0:
            continue
        ctx.save()
        ctx.translate(W / 2 + (i * 2 - 1) * 420, 520)
        ctx.scale(k, k)
        D.rrect(ctx, -330, -200, 660, 400, 30, hexrgb("#fbf3dc"), D.INK, 6)
        D.text(ctx, lab, 0, -90, 60, D.FONT_TITLE, hexrgb("#2b2f3a"))
        D.text(ctx, val, 0, 80, 100, D.FONT_TITLE, hexrgb(c), stroke=D.INK, slw=6)
        ctx.restore()
    if tt > 1.3:
        pop_text(ctx, "NEVER IN TIME", W / 2, 180, tt, 1.3, 90, "#ff6a5a", dur=d, shake=True)


def swing_with_balloon(ctx, t, ang, spin, wet, tod="day", n=16):
    """Волнолёт, на цепи которого наброшена вся оболочка шара — сплошной полосатой «юбкой»."""
    x, gy = SWING_X, FL
    top = gy - 1500
    rx, ry, L = 520, 110, 700
    th = 0.15 + 0.85 * clamp(spin) * 0.9
    pts = []
    for i in range(n + 1):
        a = ang + i * TAU / n
        depth = math.sin(a)
        out = math.sin(th) * L
        pts.append(((x + math.cos(a) * rx, top + depth * ry),
                    (x + math.cos(a) * (rx + out), top + math.cos(th) * L + depth * (ry + out * 0.2)), depth))
    quads = []
    for i in range(n):
        (a0, s0, d0), (a1, s1, d1) = pts[i], pts[i + 1]
        quads.append(((d0 + d1) / 2, i, [a0, a1, s1, s0]))
    quads.sort()

    def quad(i, q):
        c = shade(tone(BL.GORES[i % 4], tod), -0.15 * wet)
        D.poly(ctx, q, c, D.INK, 3, wob=0)
        if i % 3 == 1:           # заплатки из костюмов
            cx = sum(p_[0] for p_ in q) / 4
            cy = sum(p_[1] for p_ in q) / 4
            ctx.save()
            ctx.translate(cx, cy)
            ctx.scale(34, 34)
            ctx.rectangle(-1, -1, 2, 2)
            ctx.clip()
            BL.patch_shape(ctx, ("dragon", "cow", "hotdog", "rainbow")[(i // 3) % 4], lambda c_: tone(c_, tod))
            ctx.restore()
            D.rect(ctx, cx - 34, cy - 34, 68, 68, None, D.INK, 2, wob=0)

    for dep, i, q in quads:
        if dep <= 0:
            quad(i, q)
    RD.swing_ride(ctx, x, gy, ang, spin, tod, t=t, cloth=lambda *a_: None, n=n)
    for dep, i, q in quads:
        if dep > 0:
            quad(i, q)
    if wet > 0.05:       # брызги срываются с нижнего края
        r = rng(int(t * 10))
        for i in range(n):
            (ax, ay), (sx, sy), dep = pts[i]
            if dep < -0.2:
                continue
            for j in range(2):
                ph = r.random()
                D.circle(ctx, sx + (sx - x) * ph * 0.6, sy + ph * 160, 9 * (1 - ph) * wet, hexrgb("#8ad8ff"), None,
                         0, alpha=(1 - ph) * wet)


def shot_hang(ctx, t, S):
    """Волнолёт: полотнища висят на цепях; Раскал тянет рычаг на полную."""
    d = S.cue(3) - S.cue(2)
    T_LEVER = d * 0.55
    spin = smooth(clamp((t - T_LEVER) / 1.5)) * 0.6
    ang = 0.0 if t < T_LEVER else 0.6 * (t - T_LEVER) ** 2
    cam = Cam(SWING_X + 200, FL - 750, Keys((0, 0.5), (d, 0.48)), anchor=(SWING_X, 520))
    grass_back(ctx, t, cam, "day", -3000, 6000, sun=(3200, -1800, 120))
    with layer(ctx, cam, t):
        swing_with_balloon(ctx, t, ang, spin, 1.0)
        # пульт с рычагом
        D.rect(ctx, SWING_X + 900, FL - 260, 180, 260, hexrgb("#5a606c"), D.INK, 4, wob=0)
        lev = -0.6 + 1.2 * smooth(clamp((t - T_LEVER + 0.3) / 0.3))
        D.line(ctx, SWING_X + 990, FL - 260, SWING_X + 990 + math.sin(lev) * 140, FL - 260 - math.cos(lev) * 140,
               D.INK, 12)
        D.circle(ctx, SWING_X + 990 + math.sin(lev) * 140, FL - 260 - math.cos(lev) * 140, 22, hexrgb("#e8423c"),
                 D.INK, 3)
        p = R.stand("side", t, 1)
        p.update(h1=(0.8 + 0.5 * (lev + 0.6) / 1.2, -3.0), h2=(0.3, -1.7), lean=0.1)
        RASCAL_PATCH.draw(ctx, SWING_X + 760, FL + 40, 112, 1, rascal_pose(p, "calm"))
    if t > T_LEVER:
        pop_text(ctx, "FULL SPEED", W / 2 + 330, 230, t, T_LEVER, 90, "#ffd23a", dur=d, shake=False)


def shot_dryer(ctx, t, S):
    """Самая большая сушилка в мире: полотнища летят по кругу, вода срывается брызгами; к обеду — сухо."""
    d = S.dur - S.cue(3)
    T_DRY = d * 0.55
    wet = 1 - smooth(clamp(t / T_DRY))
    ang = 0.6 * 2.25 + t * 2.6
    hour = 9 + int(3 * clamp(t / T_DRY))
    cam = Cam(SWING_X, FL - 800, Keys((0, 0.46), (d, 0.5)), shake=0.04, anchor=(SWING_X, 520))
    grass_back(ctx, t, cam, "day", -3000, 6000, sun=(3200, -1800, 120))
    with layer(ctx, cam, t):
        swing_with_balloon(ctx, t, ang, 1.0, wet)
    speed_lines(ctx, t, n=24, a=0.15)
    clock_badge(ctx, "%d %s" % (hour if hour <= 12 else hour - 12, "PM" if hour >= 12 else "AM"), t, W - 260, 150,
                "#ffd23a")
    pop_text(ctx, "WORLD'S BIGGEST DRYER", W / 2 - 160, 230, t, 0.3, 76, "#fff6d8", dur=T_DRY, shake=False)
    if t > T_DRY:
        pop_text(ctx, "DRY BY LUNCH!", W / 2 - 160, 230, t, T_DRY, 100, "#7ee04a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_moat, "fade", 0.4),
        Shot(c(1) - 0.1, shot_wet, "fade", 0.3),
        Shot(c(2) - 0.1, shot_hang, "fade", 0.3),
        Shot(c(3) - 0.1, shot_dryer, "fade", 0.25),
    ]
    S.tods = [(0, "morning"), (c(2), "day")]
    S.sfx += [(0.3, "water", 0.6), (c(1) + 0.3, "drip", 0.7), (c(2) + (c(3) - c(2)) * 0.55, "click", 0.9),
              (c(2) + (c(3) - c(2)) * 0.55 + 0.2, "machine", 0.8), (c(3), "wind", 0.8),
              (c(3) + (S.dur - c(3)) * 0.55, "ding", 0.8)]
    S.music = [(0, "lonely", 0.7), (c(2), "hope", 0.8), (c(3), "fun", 1.0)]
