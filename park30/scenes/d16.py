"""День 16: сорок тяжёлых баллонов, а сарай — по ту сторону лагуны. Но бревенчатый спуск работает: баллоны в брёвна
и вниз с большой горки, одно за другим. Плюх, плюх, плюх. Сорок баллонов в лагуне у сарая. Ни одного не потеряно."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
WATER_Y = FL - 30
LAG_X0, LAG_X1 = 3350, 7000
SHED_X = 7700
PILE_X = -3100                # баллоны у нижней станции (левее причала жёлоба)
TRACK = RD.Track([(-1900, FL - 70), (-1350, FL - 70), (-300, FL - 1150), (0, FL - 1200), (600, FL - 1200),
                  (1400, FL - 1180), (1800, FL - 1100), (2300, FL - 600), (2600, FL - 230), (2950, FL - 180),
                  (3300, FL - 170)], 14)


def _arc_at_x(x):
    s = 0.0
    while s < TRACK.L and TRACK.at(s)[0][0] < x:
        s += 5.0
    return s


LIFT_END = _arc_at_x(-300)    # длина дуги до верха подъёмника
DROP_S = _arc_at_x(1800)      # начало большого спуска
GAP = 1.1                     # секунды между брёвнами


def _table():
    """Время → длина дуги: подъёмник и верх с постоянной скоростью, на спуске — разгон."""
    ts, ss = [0.0], [0.0]
    s, tt = 0.0, 0.0
    top_y = TRACK.at(LIFT_END)[0][1]
    while s < TRACK.L:
        (x, y), a = TRACK.at(s)
        v = 330.0 if s < LIFT_END else math.sqrt(420.0 ** 2 + 2 * 2600 * max(0.0, y - top_y))
        s += 10.0
        tt += 10.0 / v
        ts.append(tt)
        ss.append(min(s, TRACK.L))
    return ts, ss


TS, SS = _table()
T_END = TS[-1]
T_DROP_START = next(tt for tt, ss in zip(TS, SS) if ss >= DROP_S)


def log_at(tau):
    """Положение бревна через tau секунд после старта: (x, y, ang, in_water, t_hit)."""
    if tau <= T_END:
        i = max(0, min(len(TS) - 2, int(tau / T_END * (len(TS) - 1))))
        while i < len(TS) - 2 and TS[i + 1] < tau:
            i += 1
        while i > 0 and TS[i] > tau:
            i -= 1
        u = (tau - TS[i]) / max(1e-6, TS[i + 1] - TS[i])
        s = lerp(SS[i], SS[i + 1], clamp(u))
        (x, y), a = TRACK.at(s)
        return x, y, a, False, None
    (x0, y0), a0 = TRACK.at(TRACK.L)
    v = 900.0
    vx, vy = v * math.cos(a0), v * math.sin(a0)
    dt = tau - T_END
    # полёт до воды
    disc = vy * vy + 2 * 2600 * (WATER_Y - y0)
    t_hit = (-vy + math.sqrt(disc)) / 2600
    if dt < t_hit:
        return x0 + vx * dt, y0 + vy * dt + 1300 * dt * dt, a0 + 0.5 * dt, False, t_hit
    tw = dt - t_hit
    k = 0.35
    x = x0 + vx * t_hit + vx * (1 - math.exp(-k * tw)) / k
    x = min(x, LAG_X1 - 200)
    return x, WATER_Y + 6 * math.sin(tw * 2.5), 0.05 * math.sin(tw * 2), True, t_hit


def cargo(ctx):
    for k in (-1, 1):
        PK.propane_tank(ctx, k * 55, -40, 0.75, "day")


def scene_back(ctx, t, cam):
    grass_back(ctx, t, cam, "day", -4000, 10000, sun=(5000, -1500, 130))
    with layer(ctx, cam, t):
        LK.lagoon(ctx, t, LAG_X0, LAG_X1, WATER_Y, FL + 500, "day")
        BL.shed(ctx, SHED_X, FL - 30, 1400, 950, "day", open_k=0.6)
        # подъёмник: цепной транспортёр
        D.line(ctx, -1350, FL - 70, -300, FL - 1150, D.INK, 12)
        for k in range(14):
            u = ((k / 14) + t * 0.12) % 1
            D.circle(ctx, lerp(-1350, -300, u), lerp(FL - 70, FL - 1150, u) - 26, 7, hexrgb("#5a606c"), D.INK, 2)
        RD.flume(ctx, TRACK, FL, "day", t)
        D.rrect(ctx, 200, FL - 1480, 820, 140, 26, hexrgb("#7a4a24"), D.INK, 5)
        D.text(ctx, "LOG FLUME", 610, FL - 1385, 80, D.FONT_TITLE, hexrgb("#ffd23a"), stroke=D.INK, slw=5)


def draw_logs(ctx, t, t0, n, gap=GAP, until=None):
    """n брёвен с грузом, стартующих каждые gap секунд начиная с t0."""
    for i in range(n):
        tau = t - (t0 + i * gap)
        if tau < 0:
            continue
        x, y, a, water, th = log_at(tau)
        if water and x >= LAG_X1 - 200 - 1:
            x -= (i % 6) * 150            # собираются у берега, у сарая
        RD.log_boat(ctx, x, y, a, 0.9, "day", cargo)
        if water:
            tw = tau - T_END - th
            if tw < 0.8:
                RD.splash(ctx, x - 40, WATER_Y, tw / 0.8, 1.1, seed=i)


def shot_heavy(ctx, t, S):
    """Раскал пытается поднять баллон — ох; камера ведёт через лагуну к сараю на том берегу."""
    d = S.cue(1) - 0.1
    T_PAN = d * 0.5
    cam = Cam(Keys((0, PILE_X + 600), (T_PAN, PILE_X + 600), (d, SHED_X - 600, "io")), Keys((0, FL - 330), (d, FL - 450)),
              Keys((0, 1.0), (T_PAN, 1.0), (d, 0.36, "io")))
    scene_back(ctx, t, cam)
    with layer(ctx, cam, t):
        for row in range(3):
            for j in range(13):
                if row * 13 + j < 39:
                    PK.propane_tank(ctx, PILE_X - 300 + j * 72 + row * 30, FL - 20 - row * 8, 0.9, "day")
        lift = 0.35 * smooth(clamp((t - 0.4) / 1.0)) * (1 - smooth(clamp((t - 1.8) / 0.3)))
        p = R.stand("side", t, 1)
        p.update(lean=0.45 - lift * 0.6, h1=(0.75, -0.75 - lift * 2.2), h2=(0.65, -0.8 - lift * 2.2),
                 f1=(0.35, 0), f2=(-0.3, 0), hip=(0, 0.25))
        x = PILE_X + 850
        RASCAL_PATCH.draw(ctx, x, FL + 60, 112, 1, rascal_pose(p, "sweat"))
        PK.propane_tank(ctx, x + 0.8 * 112, FL + 60 - lift * 2.2 * 112 + math.sin(t * 30) * 3 * (lift > 0.05), 1.0,
                        "day")
    if t > 1.0 and t < T_PAN + 0.3:
        pop_text(ctx, "HEAVY!", W / 2 + 330, 260, t, 1.0, 100, "#ff8a7a", dur=T_PAN - 0.7)
    if t > T_PAN + 0.8:
        pop_text(ctx, "THE SHED IS OVER THERE", W / 2, 200, t, T_PAN + 0.8, 70, "#fff6d8", dur=d, shake=False)


def shot_flume(ctx, t, S):
    """Общий план: бревенчатый спуск работает — вода бежит, пустые брёвна идут по кругу."""
    d = S.cue(2) - S.cue(1)
    cam = Cam(Keys((0, 700), (d, 900)), FL - 650, Keys((0, 0.34), (d, 0.37)), anchor=(700, 520))
    scene_back(ctx, t, cam)
    with layer(ctx, cam, t):
        for i in range(4):
            tau = (t + i * 2.6) % (T_END + 0.01)
            x, y, a, w_, _ = log_at(tau)
            RD.log_boat(ctx, x, y, a, 0.9, "day")
        p = R.stand("side", t, 1)
        p.update(h1=(0.4, -3.9) if t > d * 0.5 else (0.3, -1.7), look=(1, -0.6))
        RASCAL_PATCH.draw(ctx, -1700, FL + 60, 112, 1, rascal_pose(p, "happy" if t > d * 0.5 else "calm"))
    if t > d * 0.35:
        pop_text(ctx, "IT STILL RUNS!", W / 2, 230, t, d * 0.35, 100, "#ffd23a", dur=d, shake=False)


def shot_load(ctx, t, S):
    """Погрузка у нижней станции, потом большой спуск: брёвна с баллонами одно за другим."""
    d = S.cue(3) - S.cue(2)
    T_DROP = d * 0.4
    if t < T_DROP:
        cam = Cam(-1800, FL - 260, 1.25)
        scene_back(ctx, t, cam)
        with layer(ctx, cam, t):
            u = (t % 1.6) / 1.6
            # бревно стоит у причала; Раскал ставит баллон
            RD.log_boat(ctx, -1700, FL - 70, 0.0, 0.9, "day",
                        (lambda c: PK.propane_tank(c, -55, -40, 0.75, "day")) if u < 0.55 else cargo)
            p = R.stand("side", t, 1)
            k = smooth(clamp(u / 0.5))
            p.update(lean=0.35, h1=(lerp(0.5, 1.45, k), lerp(-1.4, -1.85, k)), h2=(lerp(0.4, 1.35, k), lerp(-1.4, -1.85, k)))
            x = -2010
            RASCAL_PATCH.draw(ctx, x, FL + 60, 112, 1, rascal_pose(p, "calm"))
            if u < 0.55:
                hx = lerp(x + 0.6 * 112, -1700 - 0.9 * 55, k)
                PK.propane_tank(ctx, hx, lerp(FL + 60 - 1.0 * 112, FL - 70 - 40 * 0.9, k), 0.9 * 0.75 / 0.75 * 0.84,
                                "day")
            draw_raccoon(ctx, -2350, FL + 70, 100, 1, raccoon_pose(t, "sit", look=0.3))
        pop_text(ctx, "LOAD...", W / 2 + 330, 250, t, 0.3, 90, "#fff6d8", dur=T_DROP, shake=False)
        return
    tt = t - T_DROP
    cam = Cam(2300, FL - 650, 0.55, shake=0.03)
    scene_back(ctx, t, cam)
    with layer(ctx, cam, t):
        draw_logs(ctx, tt, -(T_DROP_START - 0.3), 12, 0.75)
    counter_badge(ctx, "SENT", min(40, 1 + int(tt / 0.75 * 3.2)), W - 300, 160, "#ffd23a", 380)
    pop_text(ctx, "WHEEE!", W / 2 - 330, 260, tt, 0.2, 90, "#fff6d8", dur=d, shake=True)


def shot_splash(ctx, t, S):
    """У конца жёлоба: плюх, плюх, плюх — брёвна в лагуне; отъезд — они у сарая. 40/40, ноль потерь."""
    d = S.dur - S.cue(3)
    T_OUT = d * 0.5
    cam = Cam(Keys((0, 3700), (T_OUT, 3800), (d, 6300, "io")), Keys((0, FL - 260), (d, FL - 420)),
              Keys((0, 0.75), (T_OUT, 0.75), (d, 0.45, "io")))
    scene_back(ctx, t, cam)
    with layer(ctx, cam, t):
        draw_logs(ctx, t, -T_END + 0.4, 12, 0.6)
    for j in range(3):
        if t > 0.4 + j * 0.6:
            pop_text(ctx, "SPLASH!", 420 + j * 520, 260 + (j % 2) * 70, t, 0.4 + j * 0.6, 80, "#9fe0ff", dur=0.9)
    if t > T_OUT:
        counter_badge(ctx, "TANKS", "40/40", W - 330, 160, "#7ee04a", 470)
        pop_text(ctx, "ZERO LOST", W / 2, 230, t, T_OUT + 0.3, 100, "#7ee04a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_heavy, "fade", 0.4),
        Shot(c(1) - 0.1, shot_flume, "fade", 0.3),
        Shot(c(2) - 0.1, shot_load, "fade", 0.3),
        Shot(c(3) - 0.1, shot_splash, "fade", 0.25),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(1.0, "strain", 0.8), (1.9, "thud", 0.7), (c(1), "water", 0.7), (c(2) + 0.2, "clank", 0.4),
              (c(2) + (c(3) - c(2)) * 0.4, "screams_fun", 0.0)]
    S.sfx += [(c(3) + 0.4 + j * 0.6, "splash", 0.9) for j in range(3)]
    S.music = [(0, "comic", 0.8), (c(1), "wonder", 0.8), (c(2), "fun", 1.0), (c(3) + (S.dur - c(3)) * 0.5, "happy_end", 0.7)]
