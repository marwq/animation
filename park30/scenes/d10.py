"""День 10: Sky Balloon — огромный полосатый шар на тросе, десять лет сложен в сарае. Мыши съели верёвки, горелка
ржавая, в ткани 37 дыр. И он ни разу не летал без троса. Двадцать дней. Учись быстро."""
from scenes.kit import *
from scenes.shared import *

SHED_X = 1500
SHED_W, SHED_H = 1600, 1100
DOOR_W, DOOR_H = SHED_W * 0.7, SHED_H * 0.82


def mouse(ctx, x, y, s=1.0, f=1, t=0.0, run=0.0):
    """Мышка сбоку; run — фаза бега (ножки мелькают)."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(f * s, s)
    D.curve(ctx, [(-30, -10), (-60, -20), (-80, -4), (-100, -14)], D.INK, 3)
    for k in range(2):
        a = math.sin(run * TAU + k * math.pi) * 6
        D.line(ctx, -10 + k * 22 + a, -4, -12 + k * 22 - a, 4, D.INK, 3)
    D.ellipse(ctx, 0, -14, 32, 16, hexrgb("#9a9ea6"), D.INK, 3)
    D.circle(ctx, 30, -22, 12, hexrgb("#9a9ea6"), D.INK, 3)
    D.circle(ctx, 22, -34, 9, hexrgb("#f0b8c0"), D.INK, 2)
    D.circle(ctx, 36, -24, 2.5, D.INK, None, 0)
    D.circle(ctx, 42, -20, 3, hexrgb("#f05a8a"), None, 0)
    ctx.restore()


def rope_coil(ctx, x, y, s=1.0, bites=0):
    """Бухта верёвки с обгрызенными концами."""
    for k in range(6):
        ry = 60 * s - k * 6 * s
        yy = y - k * 26 * s
        D.ellipse(ctx, x, yy, 240 * s - k * 12 * s, ry, None, D.INK, 30 * s)
        D.ellipse(ctx, x, yy, 240 * s - k * 12 * s, ry, None, hexrgb("#d8b878"), 20 * s)
    # обгрызенные концы с распушёнными волокнами
    for (ex, ey, a) in ((x + 230 * s, y + 10 * s, 0.3), (x - 200 * s, y - 120 * s, 2.8)):
        D.line(ctx, ex, ey, ex + math.cos(a) * 80 * s, ey + math.sin(a) * 80 * s, D.INK, 30 * s)
        D.line(ctx, ex, ey, ex + math.cos(a) * 80 * s, ey + math.sin(a) * 80 * s, hexrgb("#d8b878"), 20 * s)
        fx_, fy_ = ex + math.cos(a) * 80 * s, ey + math.sin(a) * 80 * s
        for j in range(5):
            b = a + (j - 2) * 0.35
            D.line(ctx, fx_, fy_, fx_ + math.cos(b) * 30 * s, fy_ + math.sin(b) * 30 * s, hexrgb("#c8a868"), 4 * s)
    for j in range(bites):
        bx = x - 160 * s + j * 90 * s
        D.circle(ctx, bx, y + 50 * s - (j % 2) * 20 * s, 14 * s, hexrgb("#a8703a"), None, 0)


def shot_shed(ctx, t, S):
    """Раскал раздвигает ворота сарая: внутри — гора полосатой ткани в пыльном луче."""
    d = S.cue(1) - 0.1
    T0, T1 = d * 0.2, d * 0.7
    k = smooth(clamp((t - T0) / (T1 - T0)))
    cam = Cam(SHED_X + 150, 300, Keys((0, 0.55), (d, 0.58)))
    grass_back(ctx, t, cam, "day", -2000, 5000, sun=(3600, -1200, 120))
    with layer(ctx, cam, t):
        for i in range(3):
            zx = -200 + i * 700 + math.sin(t * 0.4 + i) * 80
            p = zombie_idle(t, i) if i % 2 else R.gait(t * 1.1 + i, "shamble", "side", i)
            R.Fig(R.park_zombie(1000 + i)).draw(ctx, zx, PK.FL - 20, 96, 1 if i % 2 else -1, p)
        BL.shed(ctx, SHED_X, PK.FL, SHED_W, SHED_H, "day", open_k=k)
        # внутри: открывшаяся щель, гора ткани и пыль в луче
        op = DOOR_W / 2 * k * 0.95
        if op > 2:
            ctx.save()
            ctx.rectangle(SHED_X - op, PK.FL - DOOR_H, 2 * op, DOOR_H)
            ctx.clip()
            D.rect(ctx, SHED_X - op, PK.FL - DOOR_H, 2 * op, DOOR_H, hexrgb("#4a2e1e"), None, 0, wob=0)
            for j in range(-8, 9):
                D.line(ctx, SHED_X + j * 70, PK.FL - DOOR_H, SHED_X + j * 70, PK.FL - 160, hexrgb("#3a2216"), 4)
            D.rect(ctx, SHED_X - op, PK.FL - 160, 2 * op, 160, hexrgb("#6a4a2a"), None, 0, wob=0)
            D.poly(ctx, [(SHED_X - op, PK.FL), (SHED_X + op, PK.FL), (SHED_X + op * 0.7, PK.FL - 150),
                         (SHED_X - op * 0.7, PK.FL - 150)], hexrgb("#ffe9a0"), None, 0, wob=0, alpha=0.3)
            BL.folded(ctx, SHED_X - 40, PK.FL - 20, 0.85, "dusk")
            r = rng(4)
            for j in range(16):
                px = SHED_X + r.uniform(-op, op) * 0.8
                py = PK.FL - 40 - ((r.uniform(0, 400) + t * r.uniform(10, 30)) % 400)
                D.circle(ctx, px, py, r.uniform(2, 4), hexrgb("#fff2c0"), None, 0, alpha=0.5)
            ctx.restore()
        # Раскал толкает правую створку за её левый край
        x = SHED_X + op - 80 if t > T0 else SHED_X - 80
        p = R.stand("side", t, 1)
        push = T0 < t < T1 + 0.2
        p.update(h1=(0.75, -2.6), h2=(0.7, -2.2), lean=0.25 if push else 0.0)
        if push:
            ph = (op / 112) / R.GAITS["walk"]["L"]
            g = R.gait(ph, "walk", "side", 1)
            p.update(f1=g["f1"], f2=g["f2"], hip=g.get("hip", p.get("hip")))
        RASCAL.draw(ctx, x, PK.FL + 40, 112, 1, rascal_pose(p, "calm"))
        draw_raccoon(ctx, SHED_X - 500, PK.FL + 60, 105, 1, raccoon_pose(t, "sit", look=0.3))
    if t > T1:
        pop_text(ctx, "10 YEARS IN A SHED", W - 370, 330, t, T1, 58, "#fff6d8", dur=d, shake=False)


def shot_damage(ctx, t, S):
    """Опись: верёвки (мышь!), горелка (ржавчина, кашляет), ткань (дыры — счётчик до 37)."""
    d = S.cue(2) - S.cue(1)
    A, B = d * 0.3, d * 0.58
    if t < A:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#6a3a20"), (1, "#8a4a2a")])
        for k in range(int(W / 90) + 1):
            D.line(ctx, k * 90, 0, k * 90, 640, hexrgb("#5a3018"), 4)
        D.rect(ctx, 0, 640, W, H - 640, hexrgb("#a8703a"), None, 0, wob=0)
        rope_coil(ctx, W / 2, 800, 1.3, 4)
        u = clamp((t - 0.4) / 0.9)
        if u > 0:
            mouse(ctx, lerp(W / 2 - 80, -100, u ** 1.4), 860 + 10 * abs(math.sin(u * 30)), 1.8, -1, t, u * 8)
        D.radial(ctx, W / 2, 700, 900, "#ffe9a0", 0.25, 0)
        pop_text(ctx, "ROPES: EATEN", W / 2, 240, t, 0.2, 90, "#ffd23a", dur=A, shake=False)
        if t > 0.5:
            pop_text(ctx, "SQUEAK!", 380, 520, t, 0.5, 70, "#fff6d8", dur=0.8)
        return
    if t < B:
        tt = t - A
        D.vgrad(ctx, 0, 0, W, H, [(0, "#6a3a20"), (1, "#8a4a2a")])
        D.rect(ctx, 0, 820, W, H - 820, hexrgb("#a8703a"), None, 0, wob=0)
        ctx.save()
        ctx.translate(W / 2, 470 + 720 * 2.2)
        ctx.scale(2.2, 2.2)
        sp = 0.3 if (tt % 0.7) < 0.18 else 0.0
        info = BL.basket(ctx, 0, 0, 1.0, "dusk", sp, t, tanks=2)
        fy = info["frame"]
        r = rng(6)
        for j in range(14):        # ржавчина на горелке
            D.circle(ctx, r.uniform(-75, 75), fy - 20 + r.uniform(-25, 25), r.uniform(5, 11), hexrgb("#a8502a"),
                     None, 0, alpha=0.85)
        for j in range(3):          # клубы копоти
            ph = ((tt % 0.7) / 0.7 + j * 0.2)
            if ph < 1 and (tt % 0.7) > 0.05:
                D.circle(ctx, -10 + j * 20, fy - 80 - ph * 220, 30 + ph * 50, hexrgb("#3a3a3a"), None, 0,
                         alpha=0.7 * (1 - ph))
        ctx.restore()
        # паутина между стойкой и горелкой
        wx, wy = W / 2 + 150, 300
        for j in range(6):
            a = math.pi * 0.5 + j * 0.3
            D.line(ctx, wx, wy, wx + math.cos(a) * 170, wy + math.sin(a) * 170, hexrgb("#e8e0d0"), 2, 0.7)
        for rr in (50, 95, 140):
            pts = [(wx + math.cos(math.pi * 0.5 + j * 0.3) * rr, wy + math.sin(math.pi * 0.5 + j * 0.3) * rr)
                   for j in range(6)]
            D.polyline(ctx, pts, hexrgb("#e8e0d0"), 2, 0.7)
        pop_text(ctx, "BURNER: RUSTY", W / 2, 140, tt, 0.1, 90, "#ffd23a", dur=B - A, shake=False)
        pop_text(ctx, "PFFT", W / 2 + 330, 420, tt, int(tt / 0.7) * 0.7, 70, "#c9d0d6", dur=0.5)
        return
    tt = t - B
    dd = d - B
    cam = Cam(1700, 760, 0.9)
    grass_back(ctx, t, cam, "day", -1000, 5000, sun=(3600, -1200, 120))
    holes = int(37 * clamp(tt / (dd * 0.8)))
    with layer(ctx, cam, t):
        BL.laid_out(ctx, 1000, PK.FL + 160, 0.8, "day", patches=0, t=t)
        r = rng(37)
        for j in range(holes):
            hx = 1150 + r.uniform(0, 1250)
            hy = PK.FL + 160 + r.uniform(-110, 110) * (1 - ((hx - 1700) / 800) ** 2) ** 0.5
            rr = r.uniform(16, 34)
            pts = [(hx + math.cos(a / 9 * TAU) * rr * r.uniform(0.6, 1.1),
                    hy + math.sin(a / 9 * TAU) * rr * 0.6 * r.uniform(0.6, 1.1)) for a in range(9)]
            D.poly(ctx, pts, hexrgb("#7cbf54"), D.INK, 3, wob=0)
            D.circle(ctx, hx, hy, rr + 14, None, hexrgb("#e8423c"), 4, alpha=0.8)
        p = R.stand("side", t, 1)
        p.update(face="worried", h1=(0.8, -2.4), h2=(0.3, -1.7), look=(1, 0.6), neck=0.2)
        x = lerp(1150, 2350, clamp(tt / (dd * 0.8)))
        RASCAL.draw(ctx, x, PK.FL - 70, 104, 1, rascal_pose(R.blend(p, R.gait(x / 104 / R.GAITS["walk"]["L"], "walk",
                                                                             "side", 1), 0.6), "scared"))
    counter_badge(ctx, "HOLES", max(1, holes), W - 300, 160, "#ff8a7a", 380)


def old_film(ctx, t):
    """Старая плёнка: сепия, мерцание, царапины, виньетка."""
    D.rect(ctx, 0, 0, W, H, hexrgb("#c89a5a"), None, 0, wob=0, alpha=0.32)
    r = rng(int(t * 12))
    for k in range(3):
        x = r.uniform(0, W)
        D.line(ctx, x, 0, x + r.uniform(-20, 20), H, hexrgb("#fff6e0"), 2, 0.5)
    for k in range(20):
        D.circle(ctx, r.uniform(0, W), r.uniform(0, H), r.uniform(1, 3), hexrgb("#2a1a0a"), None, 0, alpha=0.5)
    D.rect(ctx, 0, 0, W, H, hexrgb("#000000"), None, 0, wob=0, alpha=0.08 * r.random())
    memory_tint(ctx, 0.8)


def shot_tethered(ctx, t, S):
    """Хроника 1994: шар с туристами поднимается на тросе — дёрг — и висит. Всегда на привязи."""
    d = S.cue(3) - S.cue(2)
    T_TOP = d * 0.45
    h = 900 * ease_out(clamp(t / T_TOP))
    if t > T_TOP:
        h = 900 + 40 * math.sin((t - T_TOP) * 7) * math.exp(-(t - T_TOP) * 2)
    cam = Cam(1000, -220, 0.42)
    grass_back(ctx, t, cam, "day", -3000, 5000, sun=(2600, -1200, 120))
    with layer(ctx, cam, t):
        gy = PK.FL + 60
        by = gy - h
        e = BL.envelope(ctx, 1000, by - 300 * 0.6 - 420 * 0.6, 0.6, 1.0, "day", t=t, patches=0)

        def tourists(c, x, rim, s):
            for j in range(2):
                p = R.stand("side", t, j)
                p.update(face="laugh", h1=(0.4, -3.6 + 0.2 * math.sin(t * 8 + j)), h2=(0.3, -1.7))
                R.Fig(living_look(940 + j, ("mom", "dad")[j])).draw(c, x - 50 + j * 100, rim + 170 * s, 112 * s, 1, p)
        BL.basket(ctx, 1000, by, 0.6, "day", 0.5 if t < T_TOP else 0.0, t,
                  cables_to=(e["left"][0], e["left"][1], e["right"][0], e["right"][1]), inside=tourists)
        BL.tether(ctx, 1000, by, 1000, gy, 1.0 if t > T_TOP else 0.6, "day")
        PK.fence(ctx, 300, 1700, gy + 40, 140, "day")
    old_film(ctx, t)
    D.text(ctx, "SKY BALLOON · 1994", W - 330, H - 70, 50, D.FONT_HAND, hexrgb("#fff6e0"))
    if t > T_TOP:
        pop_text(ctx, "BOING", W / 2 + 300, 380, t, T_TOP, 80, "#fff6e0", dur=0.9)
        pop_text(ctx, "ALWAYS TIED.", W / 2, 200, t, T_TOP + 0.6, 90, "#ffd23a", dur=d, shake=False)


def shot_learn(ctx, t, S):
    """В сарае: Тео с толстой книгой «BALLOONS 101», Бандит грызёт конец верёвки; календарь — 20 дней."""
    d = S.dur - S.cue(3)
    cam = Cam(1000, 520, Keys((0, 0.92), (d, 0.98)))
    room_back(ctx, t, cam, "workshop_0", lambda c: IN.workshop(c, "day", patches_done=0), (-600, -900, 4200, 2700), 0.6)
    with layer(ctx, cam, t):
        BL.folded(ctx, 2450, IN.FL + 40, 0.9, "day")
        # календарь на стене
        D.rect(ctx, 30, 200, 420, 400, hexrgb("#fbfaf6"), D.INK, 5, wob=0)
        D.rect(ctx, 30, 200, 420, 70, hexrgb("#e8423c"), D.INK, 5, wob=0)
        D.text(ctx, "JULY", 240, 254, 44, D.FONT_TITLE, hexrgb("#fbfaf6"))
        for n in range(10, 31):
            i = n - 10
            cx, cy = 70 + (i % 6) * 68, 310 + (i // 6) * 70
            D.text(ctx, str(n), cx, cy + 14, 30, D.FONT_HAND, hexrgb("#2b2f3a"))
            if n == 30:
                D.circle(ctx, cx, cy + 4, 30, None, hexrgb("#e8423c"), 5)
            if n == 10 and t > d * 0.3:
                D.line(ctx, cx - 22, cy - 18, cx + 22, cy + 26, hexrgb("#e8423c"), 5)
                D.line(ctx, cx + 22, cy - 18, cx - 22, cy + 26, hexrgb("#e8423c"), 5)
        # ящик, Тео читает
        D.rect(ctx, 1360, IN.FL - 280, 300, 280, hexrgb("#c8903a"), D.INK, 5, wob=0)
        D.line(ctx, 1360, IN.FL - 140, 1660, IN.FL - 140, hexrgb("#8a5a24"), 6)
        p = sit_pose(t, 1, "worried")
        flip = int(t / 1.8) % 2
        p.update(h1=(0.8, -1.6), h2=(0.7, -1.5), look=(1, 0.8), neck=0.35)
        J = THEO_FUR.draw(ctx, 1510, IN.FL - 270, 112, 1, p)
        hx, hy = THEO_FUR.world(1510, IN.FL - 270, 112, 1, J["hand1"])
        ctx.save()
        ctx.translate(hx + 10, hy + 20)
        ctx.rotate(-0.15)
        D.rect(ctx, -70, -110, 140, 190, hexrgb("#2f6fd0"), D.INK, 5, wob=0)
        D.rect(ctx, -58, -98, 116, 166, None, hexrgb("#ffd23a"), 3, wob=0)
        D.text(ctx, "BALLOONS", 0, -40, 26, D.FONT_TITLE, hexrgb("#ffd23a"))
        D.text(ctx, "101", 0, 10, 46, D.FONT_TITLE, hexrgb("#fbfaf6"))
        if flip:
            D.poly(ctx, [(70, -110), (110, -90), (110, 90), (70, 80)], hexrgb("#fbfaf6"), D.INK, 3, wob=0)
        ctx.restore()
        # Бандит грызёт верёвку (тренируется — пригодится)

        def rope_end(c, x, y):
            D.line(c, x - 0.05, y + 0.02, x + 0.5, y + 0.12, D.INK, 0.075)
            D.line(c, x - 0.05, y + 0.02, x + 0.5, y + 0.12, hexrgb("#d8b878"), 0.05)
        draw_raccoon(ctx, 1920, IN.FL + 40, 105, -1, raccoon_pose(t, "eat", chew=math.sin(t * 16), hold=rope_end))
        D.curve(ctx, [(1870, IN.FL + 20), (2020, IN.FL + 60), (2220, IN.FL + 40), (2320, IN.FL)], D.INK, 14)
        D.curve(ctx, [(1870, IN.FL + 20), (2020, IN.FL + 60), (2220, IN.FL + 40), (2320, IN.FL)],
                hexrgb("#d8b878"), 8)
    pop_text(ctx, "20 DAYS", 260, 720, t, d * 0.3, 100, "#e8423c", dur=d, shake=False)
    if t > d * 0.6:
        pop_text(ctx, "LEARN FAST.", W / 2 + 380, 230, t, d * 0.6, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_shed, "fade", 0.4),
        Shot(c(1) - 0.1, shot_damage, "fade", 0.25),
        Shot(c(2) - 0.1, shot_tethered, "fade", 0.3),
        Shot(c(3) - 0.1, shot_learn, "fade", 0.3),
    ]
    S.tods = [(0, "day")]
    S.sfx += [((c(1) - 0.1) * 0.2, "door_slide", 0.8), (c(1) + 0.5, "squeak", 0.8), (c(1) + (c(2) - c(1)) * 0.3, "burner", 0.4),
              (c(2) + 0.2, "projector", 0.5), (c(2) + (c(3) - c(2)) * 0.45, "jump_boing", 0.6), (c(3) + 0.3, "chomp", 0.5)]
    S.music = [(0, "mystery", 0.8), (c(1), "comic", 0.8), (c(2), "warm", 0.7), (c(3), "hope", 0.8)]
