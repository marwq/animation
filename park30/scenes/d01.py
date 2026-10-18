"""День 1: Starfall Park, жара, Тео — енот Раскал. В полдень «Тандерболт» привозит пассажира, который
больше не кричит; он кусает соседа. Через десять минут бежит весь парк, а в енотьих лапах не побегаешь.
Они догоняют — и проходят мимо."""
from scenes.kit import *
from scenes.shared import *

TB_X = 0           # начало пути «Тандерболта»
TRACK = RD.Track(RD.thunderbolt_track(TB_X, PK.FL, 2600))


def visitor(ctx, t, x, gy, s, f, seed, mode="walk", face="happy", speed=1.0, extra=None, kind=None):
    """Живой посетитель: walk / run / stand / wave."""
    L = living_look(seed, kind)
    if mode == "run":
        p = R.gait(t * 2.6 * speed + seed * 0.37, "run", "side", seed)
        p.update(face="scream", mouth=0.9)
    elif mode == "walk":
        p = R.gait(t * 1.5 * speed + seed * 0.37, "walk", "side", seed)
        p["face"] = face
    else:
        p = R.stand("side", t, seed)
        p["face"] = face
        if mode == "wave":
            p.update(h1=(0.5, -3.3 - 0.25 * math.sin(t * 9 + seed)), mouth=0.5)
    if extra:
        p.update(extra)
    return R.Fig(L).draw(ctx, x, gy, s, f, p)


def shot_fly(ctx, t, S):
    """Облёт: колесо, горки, замок, карусель, канатка; табличка STARFALL PARK."""
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 2600), (d, 5200, "lin")), Keys((0, -400), (d, -250)), Keys((0, 0.3), (d, 0.33)))
    with layer(ctx, cam, t, 0.3):
        PK.sky(ctx, t, "day", -3000, 14000, sun=(9000, -1800, 160))
    with layer(ctx, cam, t, 0.5):
        PK.far_lake(ctx, t, "day", -3000, 14000, lighthouse_x=9800, town=False)
    with layer(ctx, cam, t):
        PK.plaza(ctx, "day", -3000, 14000, c="#a8d878")
        RD.coaster_track(ctx, TRACK, PK.FL, "day", lattice_until=2600)
        RD.coaster_train(ctx, TRACK, 2500 + t * 650, 5, 240, "day")
        RD.station(ctx, TB_X - 1300, PK.FL, "day")
        RD.drop_tower(ctx, 8200, PK.FL, 3000, 0.5 + 0.45 * math.sin(t * 0.9), "day", t=t)
        ctx.save()
        ctx.translate(9900, PK.FL)
        ctx.scale(0.65, 0.65)
        ctx.translate(-9900, -PK.FL)
        CA.castle(ctx, 9900, PK.FL, 1.0, "day", t)
        ctx.restore()
        RD.big_wheel(ctx, 6200, -900, 1250, t * 0.25, "day", t=t, gy=PK.FL)
        RD.carousel(ctx, 4200, PK.FL + 500, 0.9, t * 0.7, t, "day", music=0.6)
        RD.swing_ride(ctx, 11700, PK.FL + 500, t * 1.8, 1.0, "day", t=t)
        f = RD.sky_ride_cable(1500, -300, 13000, -150, 220)
        RD.cable(ctx, f, tod="day")
        for k in range(6):
            x, y = f((k / 6 + t * 0.02) % 1)
            RD.sky_bucket(ctx, x, y, 0.9, PK.BRIGHT[k], "day", sway=0.05 * math.sin(t + k))
        for i in range(16):
            vx = 2600 + i * 600 + math.sin(i) * 200
            visitor(ctx, t, vx + t * (60 if i % 2 else -60), PK.FL + 560 + (i % 3) * 40, 70, 1 if i % 2 else -1,
                    50 + i)
    place_tag(ctx, "STARFALL PARK", t, 70, 210, "#ffd23a", "#2f8fd8")


def shot_rascal(ctx, t, S):
    """Раскал на Главной улице машет детям; жара 90°F, пот."""
    d = S.cue(2) - S.cue(1)
    cam = Cam(Keys((0, 1350), (d, 1550)), 560, Keys((0, 0.95), (d, 1.05)))
    street_back(ctx, t, cam, "day", -1400, 6000, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        PK.cart(ctx, 600, PK.FL + 120, 0.9, "cotton", "day")
        PK.balloon_bunch(ctx, 2300, PK.FL + 40, t, 6, 1.0, 2, "day")
        # дети в очереди обниматься
        for i, (kx, f) in enumerate(((1850, -1), (2020, -1), (2300, -1))):
            visitor(ctx, t, kx, PK.FL + 120 + i * 6, 110 if i != 2 else 112, f, [54, 51, 55][i],
                    "wave" if i != 2 else "stand", "laugh", kind="kid" if i != 2 else "mom")
        wv = math.sin(t * 7)
        p = R.stand("side", t, 1)
        # машет рукой вперёд на уровне плеча (голова костюма огромная — выше руку не поднять)
        p.update(h1=(1.2, -2.55 - 0.28 * wv), h2=(0.5, -1.7), hturn=0.4, look=(0.3, 0))
        p = rascal_pose(p, sweat=True)
        RASCAL.draw(ctx, 1500, PK.FL + 130, 112, 1, p)
        # волны жара
        for k in range(5):
            hx = 900 + k * 260
            ph = (t * 0.8 + k * 0.2) % 1
            D.curve(ctx, [(hx, PK.FL - 100 - ph * 300), (hx + 20, PK.FL - 140 - ph * 300), (hx, PK.FL - 180 - ph * 300)],
                    hexrgb("#ffffff"), 4, 0.5 * (1 - ph))
    # градусник
    D.rrect(ctx, W - 300, 90, 210, 120, 24, hexrgb("#e8423c"), D.INK, 6)
    D.text(ctx, "90°F", W - 195, 175, 76, D.FONT_TITLE, hexrgb("#fff6d8"))
    if t > d * 0.45:
        pop_text(ctx, "SO. HOT.", 420, 260, t, d * 0.45, 100, "#ffd23a", dur=d, shake=False)


def riders(t=0.0):
    """Пассажиры вагонов на общем плане: все кричат, руки вверх; в среднем вагоне один — зелёный."""
    def fn(ctx, i):
        for j, sx in enumerate((-50, 45)):
            zomb = (i == 2 and j == 0)
            L = R.park_zombie(701, "dad") if zomb else living_look(700 + i * 2 + j, "dad" if j else "teen")
            p = sit_pose(t, i * 2 + j, "scream")
            if zomb:
                p.update(face="neutral", mouth=0.2, a1=(0.6, 0.4), a2=(0.4, 0.4))
            else:
                p.update(mouth=0.9, h1=(0.25, -3.4), h2=(-0.1, -3.3))
            R.Fig(L).draw(ctx, sx, -40, 40, 1, p)
    return fn


def closeup_car(ctx, t, bite, scream_k):
    """Крупно: открытый вагон, двое на сиденье — зомби (слева) и сосед. bite 0..1."""
    D.vgrad(ctx, 0, 0, W, H, [(0, "#6cc4f4"), (1, "#c8efff")])
    SEA.cloudbank(ctx, -200, W + 200, 300, "day", seed=6, n=5, s0=0.9, s1=1.3)
    ctx.save()
    ctx.translate(W / 2, 1010)
    s = 250
    # спинка сиденья
    D.rrect(ctx, -620, -650, 1240, 520, 60, hexrgb("#2b2f3a"), D.INK, 6)
    D.rrect(ctx, -590, -620, 560, 440, 40, hexrgb("#3a3f4a"), None, 0)
    D.rrect(ctx, 30, -620, 560, 440, 40, hexrgb("#3a3f4a"), None, 0)
    zl = R.park_zombie(701, "dad")
    nl = living_look(740, "dad")
    # сосед: кричит от восторга, руки вверх; после укуса — шок
    pn = sit_pose(t, 4, "laugh", view="front")
    wv = 0.12 * math.sin(t * 8)
    pn.update(mouth=0.9, face="shock" if bite > 0.6 else "laugh", h1=(-0.55, -3.55 + wv), h2=(0.55, -3.55 - wv),
              blink=0, look=(-0.8, 0.0) if bite > 0.6 else (0.0, 0.0))
    if bite > 0.6:
        pn.update(h1=(-0.45, -2.6), h2=(0.5, -2.4))
    R.Fig(nl).draw(ctx, 250, 0, s, 1, pn)
    # зомби: сидит прямо и молча смотрит перед собой; потом поворачивается и кусает соседа в плечо
    if bite <= 0:
        pz = sit_pose(t, 3, "neutral", view="front")
        pz.update(mouth=0.15, blink=0, a1=(0.15, 0.3), a2=(0.15, 0.3), look=(0.0, 0.1))
        R.Fig(zl).draw(ctx, -250, 0, s, 1, pz)
    else:
        pz = sit_pose(t, 3, "neutral")
        pz.update(mouth=0.15 + 0.85 * bite, lean=0.55 * bite, neck=0.3 * bite, a1=(0.9, 0.3), a2=(0.7, 0.3),
                  blink=0, hturn=1.0)
        R.Fig(zl).draw(ctx, -250 + 50 * bite, 0, s, 1, pz)
    # передний борт, лап-бар, колёса
    D.rrect(ctx, -660, -200, 1320, 260, 50, hexrgb("#e8423c"), D.INK, 6)
    D.rect(ctx, -660, -100, 1320, 40, hexrgb("#2b2f3a"), D.INK, 3, wob=0)
    RD.bolt_icon(ctx, 0, -150, 0.9, hexrgb("#ffd23a"))
    D.rrect(ctx, -560, -290, 1120, 36, 18, hexrgb("#ffd23a"), D.INK, 4)
    for k in (-1, 1):
        D.line(ctx, k * 540, -258, k * 540, -190, D.INK, 16)
    ctx.restore()


def shot_coaster(ctx, t, S):
    """Поезд возвращается: все кричат, руки вверх; один — зелёный и молчит. Он кусает соседа."""
    d = S.cue(3) - S.cue(2)
    T_STOP = d * 0.3
    T_BITE = max(T_STOP + 1.4, S.cue(2, True) - S.cue(2) - d * 0.12)
    if t < T_STOP:
        u = smooth(clamp(t / T_STOP))
        head = lerp(TRACK.L - 1800, TRACK.L - 300, u)
        cam = Cam(lambda q: TRACK.at(lerp(TRACK.L - 1800, TRACK.L - 300, smooth(clamp(q / T_STOP))))[0][0] - 250,
                  PK.FL - 520, 0.9, shake=0.06)
        grass_back(ctx, t, cam, "day", -2000, 12000, sun=(6000, -1200, 120))
        with layer(ctx, cam, t):
            RD.coaster_track(ctx, TRACK, PK.FL, "day")
            RD.coaster_train(ctx, TRACK, head, 5, 240, "day", riders(t))
        speed_lines(ctx, t, n=16, a=0.18)
        pop_text(ctx, "AAAAAH!", W / 2 - 300, 230, t, 0.1, 110, "#fff6d8", dur=T_STOP, shake=True)
        clock_badge(ctx, "12:00", t, W - 260, 150, "#ffd23a")
        return
    bite = smooth(clamp((t - T_BITE) / 0.3))
    closeup_car(ctx, t, bite, 0.0)
    if t > T_BITE + 0.15:
        pop_text(ctx, "CHOMP!", W / 2 + 520, 200, t, T_BITE + 0.15, 150, "#e8423c", dur=1.4)
    elif t > T_STOP + 0.3:
        pop_text(ctx, "WHEEE!", W / 2 + 560, 200, t, T_STOP + 0.3, 90, "#2f8fd8", dur=T_BITE - T_STOP - 0.3, shake=False)
        pop_text(ctx, "...", W / 2 - 250, 110, t, T_STOP + 0.6, 120, "#2b2f3a", dur=T_BITE - T_STOP - 0.6, shake=False)


def runner_crowd(ctx, t, x0, x1, gy0, gy1, n, seed, speed=520, s=100, f=-1):
    r = rng(seed)
    items = []
    for i in range(n):
        y = r.uniform(gy0, gy1)
        items.append((y, r.uniform(x0, x1), i, r.uniform(0.8, 1.15)))
    items.sort()
    for y, x, i, sp in items:
        xx = x + f * speed * sp * t
        visitor(ctx, t, xx, y, floor_s(y, PK.FL, s), f, 900 + seed + i, "run", speed=sp)


def shot_panic(ctx, t, S):
    """Главная улица: все бегут, шарики улетают, тележка падает; Раскал ковыляет, спотыкается."""
    d = S.cue(4) - S.cue(3)
    T_TRIP = d * 0.62
    cam = Cam(Keys((0, 2600), (d, 2350)), 520, 0.82, shake=0.08)
    street_back(ctx, t, cam, "day", -1400, 6000, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        # улетающие шарики
        for k in range(5):
            PK.free_balloon(ctx, 1700 + k * 160 + math.sin(t * 2 + k) * 30, PK.FL - 300 - t * (240 + k * 40) - k * 60,
                            1.0, PK.BRIGHT[k + 1], t)
        tip = smooth(clamp((t - 0.4) / 0.6))
        PK.cart(ctx, 3300, PK.FL + 100, 0.9, "popcorn", "day", tipped=tip)
        if tip > 0.5:
            r = rng(5)
            for k in range(30):
                D.circle(ctx, 3300 - 300 * tip + r.uniform(-260, 200), PK.FL + 80 + r.uniform(-20, 40), 11,
                         hexrgb("#fff3c4"), D.INK, 1.2)
        runner_crowd(ctx, t, 2600, 5600, PK.FL + 40, PK.FL + 260, 14, 1, 560, 100, -1)
        # Раскал ковыляет за толпой
        trip = t > T_TRIP
        x = 2950 - 140 * min(t, T_TRIP) - (40 if trip else 0)
        if not trip:
            p = R.gait(t * 2.4, "walk", "side", 1)
            p.update(lean=0.18 + 0.08 * math.sin(t * 12), hip=(0, 0.04 * abs(math.sin(t * 12))))
            p = rascal_pose(p, "scared", True)
            RASCAL.draw(ctx, x, PK.FL + 150, 112, -1, p)
        else:
            k = smooth(clamp((t - T_TRIP) / 0.35))
            p = R.stand("side", t, 1)
            p.update(lean=1.25 * k, hip=(0.0, 1.35 * k), f1=(0.6, -0.4 * k), f2=(-0.2, 0.0), h1=(1.9, -0.6),
                     h2=(1.7, -0.4))
            p = rascal_pose(p, "scared", True)
            RASCAL.draw(ctx, x, PK.FL + 150, 112, -1, p)
    clock_badge(ctx, "+10 MIN", t, W - 260, 150, "#ffd23a")
    pop_text(ctx, "WADDLE", 520, 330, t, 0.3, 80, "#fff6d8", dur=T_TRIP, shake=False)
    if t > T_TRIP:
        pop_text(ctx, "FLOP!", W / 2 + 100, 300, t, T_TRIP + 0.2, 120, "#ffd23a", dur=1.2)


def shot_past(ctx, t, S):
    """Догнали: обнюхивают — и проходят мимо. Глаза в сетке рта мечутся."""
    d = S.dur - S.cue(4)
    T_PASS = d * 0.45
    cam = Cam(1600, 560, Keys((0, 1.0), (d, 1.12)))
    street_back(ctx, t, cam, "day", -1400, 6000, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        # Раскал сидит на земле, где упал, замер
        p = floor_sit_pose(t, 1, "scared", hug=True)
        p.update(blink=0, lean=0.05 + 0.02 * math.sin(t * 40))
        RASCAL.draw(ctx, 1600, PK.FL + 150, 112, -1, rascal_pose(p, "scared", True))
        for i in range(5):
            zx0 = 2800 + i * 220
            zy = PK.FL + 60 + (i % 3) * 60
            if t < T_PASS:
                zx = lerp(zx0, 1850 + i * 140, smooth(clamp(t / T_PASS)))
                p = sniff_pose(t, i) if t > T_PASS * 0.5 else R.gait(t * 1.4 + i, "shamble", "side", i)
            else:
                zx = 1850 + i * 140 - (t - T_PASS) * 260
                p = R.gait(t * 1.4 + i, "shamble", "side", i)
            fig = R.Fig(R.park_zombie(1500 + i))
            J = fig.draw(ctx, zx, zy, floor_s(zy, PK.FL, 108), -1, p)
            if T_PASS * 0.5 < t < T_PASS + 0.3:
                hx, hy = fig.world(zx, zy, floor_s(zy, PK.FL, 108), -1, J["head"])
                sniff_lines(ctx, hx, hy, t, 0.8)
    if T_PASS * 0.5 < t < T_PASS + 0.3:
        pop_text(ctx, "SNIFF... SNIFF...", W / 2 + 300, 220, t, T_PASS * 0.5, 70, "#9fc86a", dur=1.6, shake=False)
    if t > T_PASS + 0.5:
        pop_text(ctx, "...HUH?", W / 2 - 360, 260, t, T_PASS + 0.5, 100, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_fly, "fade", 0.4),
        Shot(c(1) - 0.1, shot_rascal, "fade", 0.3),
        Shot(c(2) - 0.1, shot_coaster, "whip", 0.25),
        Shot(c(3) - 0.1, shot_panic, "whip", 0.25),
        Shot(c(4) - 0.1, shot_past, "fade", 0.25),
    ]
    S.tods = [(0, "day")]
    d2 = c(3) - c(2)
    d3 = c(4) - c(3)
    t_bite = c(2) + max(d2 * 0.3 + 1.4, c(2, True) - c(2) - d2 * 0.12)
    S.sfx += [(0.2, "crowd_happy", 0.6), (c(1), "kids_laugh", 0.6), (c(2), "coaster", 1.0),
              (c(2) + 0.3, "screams_fun", 0.8), (t_bite + 0.15, "chomp", 1.0), (c(3), "screams", 1.0),
              (c(3) + 0.5, "crash", 0.6), (c(3) + d3 * 0.62 + 0.2, "thud", 1.0), (c(4) + 0.8, "sniff", 0.9),
              (c(4) + 1.6, "zombie_groan", 0.8)]
    S.music = [(0, "fun", 1.0), (t_bite, "chase", 1.0), (c(4), "sneak", 0.8)]
