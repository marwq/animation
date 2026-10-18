"""День 7: неделя жизни — праздник. Сладкая вата размером с голову, мороженое на завтрак, все аттракционы без
очереди. Одиннадцать раз подряд на «Тандерболте». Бандит съедает три фанел-кейка и засыпает в чашке.
Список гостей: один енот."""
from scenes.kit import *
from scenes.shared import *

TRACK = RD.Track(RD.thunderbolt_track(0, PK.FL, 2600))


def party_hat(ctx, x, y, s=1.0, c="#f05a8a", ang=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    D.poly(ctx, [(-30, 0), (30, 0), (0, -80)], hexrgb(c), D.INK, 3, wob=0)
    for k in range(3):
        D.circle(ctx, -14 + k * 14, -18 - k * 18, 5, hexrgb("#ffd23a"), None, 0)
    D.circle(ctx, 0, -84, 10, hexrgb("#ffd23a"), D.INK, 2)
    ctx.restore()


def confetti(ctx, t, n=80, seed=1, rect=(0, 0, W, H)):
    r = rng(seed)
    x0, y0, w, h = rect
    for i in range(n):
        x = x0 + (r.uniform(0, w) + math.sin(t * 2 + i) * 30) % w
        y = y0 + (r.uniform(0, h) + t * r.uniform(120, 260)) % h
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(t * r.uniform(2, 6) + i)
        D.rect(ctx, -9, -5, 18, 10, hexrgb(PK.BRIGHT[i % 8]), None, 0, wob=0)
        ctx.restore()


def cake(ctx, x, y, s=1.0, t=0.0, lit=True):
    """Торт на тарелке со свечкой-семёркой; (x, y) — низ тарелки."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.ellipse(ctx, 0, -6, 120, 18, hexrgb("#fbfaf6"), D.INK, 3)
    D.rrect(ctx, -95, -120, 190, 110, 18, hexrgb("#ffd6e0"), D.INK, 4)
    D.rrect(ctx, -95, -120, 190, 34, 14, hexrgb("#fbfaf6"), D.INK, 3)
    for k in range(6):
        D.circle(ctx, -75 + k * 30, -84, 9, hexrgb("#fbfaf6"), D.INK, 2)
    for k in range(5):
        D.circle(ctx, -60 + k * 30, -122, 7, hexrgb("#e8423c"), D.INK, 2)
    D.text(ctx, "7", 0, -128, 110, D.FONT_TITLE, hexrgb("#2f8fd8"), stroke=D.INK, slw=5)
    if lit:
        fl = 1 + 0.15 * math.sin(t * 17)
        D.line(ctx, 18, -214, 18, -230, D.INK, 3)
        D.ellipse(ctx, 18, -246, 9, 16 * fl, hexrgb("#ffd23a"), D.INK, 2)
        D.ellipse(ctx, 18, -242, 4, 8 * fl, hexrgb("#fff6d8"), None, 0)
    ctx.restore()


def party_table(ctx, x0, x1, gy):
    """Стол с розовой скатертью: столешница на высоте 280 px над полом."""
    top = gy - 280
    for lx in (x0 + 40, x1 - 40):
        D.rect(ctx, lx - 12, top, 24, 280, hexrgb("#8a5a34"), D.INK, 3, wob=0)
    D.rect(ctx, x0, top - 16, x1 - x0, 24, hexrgb("#b07a4a"), D.INK, 4, wob=0)
    pts = [(x0 - 10, top - 18), (x1 + 10, top - 18)]
    n = int((x1 - x0) / 60)
    for k in range(n, -1, -1):
        pts.append((x0 + k * (x1 - x0) / n, top + 80 + (18 if k % 2 else 0)))
    D.poly(ctx, pts, hexrgb("#f7a8c4"), D.INK, 4, wob=0)
    return top - 18


def shot_party(ctx, t, S):
    """Праздник на площади: баннер на шестах, стол с тортом «7», колпаки, дудка, конфетти."""
    d = S.cue(1) - 0.1
    T_POP = d * 0.45
    GY = PK.FL + 150
    cam = Cam(1250, 600, Keys((0, 1.0), (d, 1.1)))
    street_back(ctx, t, cam, "day", -1400, 6000, shut=True, sun=(3200, -900, 120))
    with layer(ctx, cam, t):
        for px in (520, 1980):
            D.rect(ctx, px - 14, 180, 28, GY - 140 - 180, hexrgb("#e8f0f4"), D.INK, 4, wob=0)
            D.circle(ctx, px, 176, 20, hexrgb("#ffd23a"), D.INK, 3)
        D.line(ctx, 520, 200, 820, 250, D.INK, 4)
        D.line(ctx, 1980, 200, 1680, 250, D.INK, 4)
        D.rrect(ctx, 820, 220, 860, 150, 26, hexrgb("#fbf3dc"), D.INK, 6)
        D.text(ctx, "1 WEEK ALIVE!", 1250, 322, 84, D.FONT_TITLE, hexrgb("#e8423c"))
        PK.bunting(ctx, 540, 1960, 420, 70, tod="day", seed=3, t=t)
        PK.balloon_bunch(ctx, 1740, GY - 300, t, 5, 1.0, seed=7, string_len=220)
        top = party_table(ctx, 1230, 1760, GY - 10)
        cake(ctx, 1360, top + 4, 1.0, t)
        # Бандит сидит на столе в колпаке и косится на торт
        draw_raccoon(ctx, 1630, top + 4, 105, -1, raccoon_pose(t, "sit", look=-0.4 + 0.15 * math.sin(t * 2)))
        party_hat(ctx, 1630 - 0.12 * 105, top + 4 - 0.98 * 105, 0.8, "#ffd23a", -0.2)
        # Тео в меховом костюме, без головы костюма: колпак и дудка-язычок
        blow = t > T_POP
        p = R.stand("side", t, 1)
        p.update(face="laugh" if blow else "happy", h1=(0.6, -3.15), h2=(0.35, -1.75), mouth=0.2,
                 lean=-0.06 if blow else 0.0)
        J = THEO_FUR.draw(ctx, 950, GY, 112, 1, p)
        hx, hy = THEO_FUR.world(950, GY, 112, 1, J["head"])
        party_hat(ctx, hx - 6, hy - 50, 1.0, "#2f8fd8", -0.15)
        mx, my = hx + 52, hy + 26
        L = 40 + 110 * abs(math.sin((t - T_POP) * 5)) if blow else 26
        D.line(ctx, mx, my, mx + 30, my, hexrgb("#ffd23a"), 14)
        D.line(ctx, mx + 30, my, mx + 30 + L, my - 6, hexrgb("#f05a8a"), 12)
        D.circle(ctx, mx + 30 + L, my - 6, 8, hexrgb("#f05a8a"), D.INK, 2)
    if t > T_POP:
        confetti(ctx, t - T_POP, 90, 1)
        pop_text(ctx, "PARTY!", W - 330, 470, t, T_POP, 130, "#ffd23a", dur=d)


def shot_menu(ctx, t, S):
    """Три карточки: вата больше головы, мороженое на завтрак, «NO LINE»."""
    d = S.cue(2) - S.cue(1)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#ffd6e0"), (1, "#cfe8ff")])
    confetti(ctx, t, 40, 2)

    def cotton(c, x, y):
        # вата на палочке рядом с головой — и она больше головы
        p = R.stand("front", t, 1)
        p.update(face="laugh", h1=(1.25, -2.85), h2=(-0.35, -1.6), mouth=0.5)
        J = THEO_FUR.draw(c, x - 140, y + 260, 70, 1, p)
        hx, hy = THEO_FUR.world(x - 140, y + 260, 70, 1, J["hand1"])
        D.line(c, hx, hy + 10, hx + 30, hy - 80, hexrgb("#fbfaf6"), 8)
        for k, (dx, dy, rr) in enumerate(((40, -170, 100), (-20, -200, 50), (100, -210, 46), (60, -110, 50))):
            D.circle(c, hx + dx, hy + dy, rr, hexrgb("#ffb6d8"), D.INK if k == 0 else None, 4)
        D.circle(c, hx + 10, hy - 210, 26, hexrgb("#ffd6e8"), None, 0)
        D.circle(c, hx - 30, hy - 140, 34, hexrgb("#ffd6e8"), None, 0)

    def icecream(c, x, y):
        D.poly(c, [(x - 50, y + 60), (x + 50, y + 60), (x, y + 230)], hexrgb("#d8a058"), D.INK, 4, wob=0)
        for k in range(5):
            D.circle(c, x + math.sin(k) * 10, y + 30 - k * 60, 58, hexrgb(["#ffb6c8", "#fff3c4", "#8a5a34", "#b8f0c8",
                                                                         "#c8b0ff"][k]), D.INK, 4)
        D.circle(c, x + 10, y - 290, 14, hexrgb("#e8423c"), D.INK, 3)
        D.text(c, "7:00 AM", x, y + 300, 44, D.FONT_TITLE, hexrgb("#2b2f3a"))

    def noline(c, x, y):
        # пустой зигзаг очереди: столбики с провисающими канатами, Тео сразу у входа
        D.rrect(c, x - 200, y - 330, 400, 80, 16, hexrgb("#1c2440"), D.INK, 4)
        D.text(c, "THUNDERBOLT", x, y - 276, 40, D.FONT_TITLE, hexrgb("#ffd23a"))
        for row in range(3):
            yy = y - 150 + row * 110
            for j in range(5):
                px = x - 220 + j * 110
                D.line(c, px, yy, px, yy + 70, D.INK, 9)
                D.line(c, px, yy, px, yy + 70, hexrgb("#c9a040"), 5)
                D.circle(c, px, yy, 9, hexrgb("#ffd23a"), D.INK, 2)
                if j < 4:
                    D.curve(c, [(px, yy + 6), (px + 55, yy + 30), (px + 110, yy + 6)], hexrgb("#e8423c"), 6)
        p = R.stand("front", t, 2)
        p.update(face="laugh", h1=(0.7, -3.3), h2=(-0.4, -1.6))
        THEO_FUR.draw(c, x + 120, y + 200, 52, 1, p)
        D.rrect(c, x - 230, y + 130, 230, 70, 14, hexrgb("#3fbf6a"), D.INK, 4)
        D.text(c, "WAIT: 0", x - 115, y + 180, 40, D.FONT_TITLE, hexrgb("#fbfaf6"))

    for i, (fn, lab, c) in enumerate(((cotton, "BIGGER THAN YOUR HEAD", "#f05a8a"),
                                      (icecream, "BREAKFAST", "#2f8fd8"), (noline, "NO LINE", "#3fbf6a"))):
        t0 = i * d * 0.3
        k = ease_out_back(clamp((t - t0) / 0.3))
        if k <= 0:
            continue
        x = 340 + i * 620
        ctx.save()
        ctx.translate(x, 500)
        ctx.rotate((-0.04, 0.03, -0.02)[i])
        ctx.scale(k, k)
        D.rrect(ctx, -280, -380, 560, 760, 30, hexrgb("#fbfaf6"), D.INK, 6)
        ctx.save()
        D.rrect_path(ctx, -260, -360, 520, 620, 22)
        ctx.clip()
        fn(ctx, 0, -40)
        ctx.restore()
        D.text(ctx, lab, 0, 330, 34 if len(lab) > 12 else 56, D.FONT_TITLE, hexrgb(c))
        ctx.restore()


def theo_rider(t):
    def fn(ctx, i):
        if i != 0:
            return
        p = sit_pose(t, 1, "laugh")
        p.update(h1=(0.3, -3.4), h2=(0.0, -3.3), mouth=0.9)
        THEO_FUR.draw(ctx, -10, -40, 40, 1, p)
    return fn


def car_close(ctx, t, lap_k):
    """Крупно: Тео один в переднем вагоне, руки вверх; небо и облака несутся, кадр кренится."""
    tilt = 0.10 * math.sin(t * 1.9) + 0.05 * math.sin(t * 4.3)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#6cc4f4"), (1, "#c8efff")])
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.rotate(tilt)
    ctx.translate(-W / 2, -H / 2)
    r = rng(9)
    for k in range(7):
        cy = (r.uniform(-200, H) + t * r.uniform(900, 1500)) % (H + 600) - 300
        SEA.cloudbank(ctx, r.uniform(-200, W - 400), r.uniform(-200, W - 400) + 500, cy, "day", seed=k, n=2,
                      s0=0.7, s1=1.0)
    ctx.restore()
    speed_lines(ctx, t, n=26, a=0.28)
    ctx.save()
    ctx.translate(W / 2, 1010)
    ctx.rotate(tilt * 0.3)
    s = 250
    D.rrect(ctx, -620, -650, 1240, 520, 60, hexrgb("#2b2f3a"), D.INK, 6)
    D.rrect(ctx, -590, -620, 1180, 440, 40, hexrgb("#3a3f4a"), None, 0)
    p = sit_pose(t, 2, "laugh", view="front")
    wv = 0.15 * math.sin(t * 9)
    p.update(mouth=0.95, h1=(-0.8, -4.1 + wv), h2=(0.8, -4.1 - wv), blink=0)
    J = THEO_FUR.draw(ctx, 0, 0, s, 1, p)
    hx, hy = THEO_FUR.world(0, 0, s, 1, J["head"])
    # колпак сдувает назад, но резинка держит
    party_hat(ctx, hx - 40, hy - 120, 2.2, "#2f8fd8", -0.9 + 0.12 * math.sin(t * 13))
    D.rrect(ctx, -660, -200, 1320, 260, 50, hexrgb("#ffd23a"), D.INK, 6)
    D.rect(ctx, -660, -100, 1320, 40, hexrgb("#2b2f3a"), D.INK, 3, wob=0)
    RD.bolt_icon(ctx, 0, -150, 0.9, hexrgb("#e8423c"))
    D.rrect(ctx, -560, -290, 1120, 36, 18, hexrgb("#e8423c"), D.INK, 4)
    for k in (-1, 1):
        D.line(ctx, k * 540, -258, k * 540, -190, D.INK, 16)
    ctx.restore()


def shot_coaster(ctx, t, S):
    """Общий план: поезд с вершины в спуск и петлю; потом крупно Тео — счётчик кругов до 11."""
    d = S.cue(3) - S.cue(2)
    T_CLOSE = d * 0.5
    if t < T_CLOSE:
        def head(q):
            return lerp(4300, 12600, clamp(q / T_CLOSE) ** 1.15)
        cam = Cam(lambda q: TRACK.at(head(q))[0][0] + 150, lambda q: TRACK.at(head(q))[0][1] - 80, 0.55, shake=0.05,
                  anchor=(TRACK.at(4300)[0][0] + 150, 520))
        grass_back(ctx, t, cam, "day", -3000, 11000, sun=(5000, -1800, 140))
        with layer(ctx, cam, t):
            RD.coaster_track(ctx, TRACK, PK.FL, "day", lattice_until=4400)
            RD.coaster_train(ctx, TRACK, head(t), 4, 240, "day", theo_rider(t))
            crowd_floor(ctx, t, 71, 30, -1500, 9000, PK.FL + 80, PK.FL + 260, 90, 105,
                        pose_fn=lambda m, tt: dict(zombie_idle(tt, m.seed % 97), neck=-0.45, a1=(1.8, -0.2)))
        speed_lines(ctx, t, n=16, a=0.15)
        lap = 1
    else:
        tt = t - T_CLOSE
        lap = 2 + min(9, int(tt / (d - T_CLOSE - 0.4) * 10))
        car_close(ctx, t, 0)
        if lap >= 2:
            t_lap = T_CLOSE + (lap - 2) * (d - T_CLOSE - 0.4) / 10
            k = clamp((t - t_lap) / 0.12)
            D.rect(ctx, 0, 0, W, H, hexrgb("#ffffff"), None, 0, wob=0, alpha=0.25 * (1 - k))
    counter_badge(ctx, "RIDE", "#%d" % lap, W - 300, 160, "#ffd23a", 380)
    pop_text(ctx, "WOOO!", 420, 240, t, int(t / 1.6) * 1.6, 90, "#fff6d8", dur=1.0, shake=True)


def shot_teacup(ctx, t, S):
    """Чашки: Бандит спит клубком в розовой чашке рядом со стопкой из трёх пустых тарелок; карточка «список гостей»."""
    d = S.dur - S.cue(3)
    T_CARD = d * 0.55
    CUP_X, CUP_Y = 1300, PK.FL + 100
    cam = Cam(CUP_X, 640, Keys((0, 1.25), (d, 1.38)))
    grass_back(ctx, t, cam, "day", -2000, 5000, c="#d8f5d0")
    with layer(ctx, cam, t):
        # вращающийся круг аттракциона: полосы бегут по кругу
        D.ellipse(ctx, CUP_X, PK.FL + 30, 1500, 190, hexrgb("#c9d0d6"), D.INK, 5)
        for k in range(16):
            a = k / 16 * TAU + t * 0.5
            D.line(ctx, CUP_X + math.cos(a) * 300, PK.FL + 30 + math.sin(a) * 38,
                   CUP_X + math.cos(a) * 1450, PK.FL + 30 + math.sin(a) * 182, hexrgb("#b4bcc4"), 6)
        cups = []
        for k, c in enumerate(("#2f8fd8", "#ffd23a", "#3fbf6a", "#7a4fc2")):
            a = k / 4 * TAU + t * 0.5
            cups.append((PK.FL - 40 + math.sin(a) * 50, CUP_X + math.cos(a) * 1050, c, a))
        for y, x, c, a in sorted(cups):
            RD.teacup(ctx, x, y, 0.75 + 0.06 * math.sin(a), c, t * 2.2 + a)

        def inside(c, x, rim, s):
            # стопка из трёх пустых тарелок торчит из чашки
            for j in range(3):
                D.ellipse(c, x + 110, rim + 6 - j * 16, 70, 15, hexrgb("#fbfaf6"), D.INK, 3)
            for j in range(6):
                D.circle(c, x + 80 + j * 12, rim - 40 - (j % 2) * 6, 4, hexrgb("#e8b070"), None, 0)
            # сидит, привалившись к стенке, глаза закрыты, пузо круглое; колпак съехал набок
            bx, by, bs = x - 60, rim + 60, 150
            draw_raccoon(c, bx, by, bs, 1, raccoon_pose(t, "sit", look=0.0, blink=1.0))
            D.ellipse(c, bx + 0.02 * bs, by - 0.42 * bs, 0.2 * bs, 0.2 * bs * (1 + 0.04 * math.sin(t * 2.6)),
                      hexrgb("#c9ccd2"), D.INK, 3)
            party_hat(c, bx + 0.12 * bs + 20, by - 0.98 * bs, 0.8, "#ffd23a", 0.7)
        RD.teacup(ctx, CUP_X + math.sin(t * 0.9) * 20, CUP_Y, 1.25, "#f05a8a", t * 1.5, inside=inside)
        for k in range(3):
            ph = (t * 0.45 + k / 3) % 1
            D.text(ctx, "Z", CUP_X + 20 + ph * 120, CUP_Y - 380 - ph * 160, 40 + 30 * ph, D.FONT_TITLE,
                   hexrgb("#2a3a7a"), alpha=min(1.0, (1 - ph) * 2))
    if t > T_CARD:
        k = ease_out_back(clamp((t - T_CARD) / 0.35))
        ctx.save()
        ctx.translate(W / 2 + 500, 280)
        ctx.rotate(0.05)
        ctx.scale(k, k)
        D.rect(ctx, -300, -170, 600, 340, hexrgb("#fbf3dc"), D.INK, 6, wob=0)
        D.text(ctx, "GUEST LIST", 0, -90, 60, D.FONT_TITLE, hexrgb("#e8423c"))
        D.text(ctx, "1. raccoon", -230, 40, 70, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
        ctx.restore()
    else:
        pop_text(ctx, "x3", W / 2 + 330, 460, t, 0.3, 120, "#e8b070", dur=T_CARD, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_party, "fade", 0.4),
        Shot(c(1) - 0.1, shot_menu, "fade", 0.25),
        Shot(c(2) - 0.1, shot_coaster, "whip", 0.25),
        Shot(c(3) - 0.1, shot_teacup, "fade", 0.3),
    ]
    S.tods = [(0, "day")]
    S.sfx += [((c(1) - 0.1) * 0.45, "party_horn", 1.0), ((c(1) - 0.1) * 0.45 + 0.1, "pop", 0.8), (c(1), "pop", 0.6),
              (c(2), "coaster", 1.0), (c(2) + 0.5, "screams_fun", 0.5), (c(3) + 0.3, "snore", 0.6)]
    S.music = [(0, "party", 1.0), (c(3), "happy_end", 0.7)]
