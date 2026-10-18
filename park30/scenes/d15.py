"""День 15: баллоны горелки пусты, а за фуд-кортом 40 полных — на Главной улице, где живут четыреста зомби.
Костюм — и катишь баллоны по одному сквозь толпу. Один звякает, все головы к тебе. Замер. Раскал машет.
Отворачиваются."""
from scenes.kit import *
from scenes.shared import *

COURT_X = 6300               # фуд-корт за Главной улицей (магазины кончаются на x = 5160)
TANK_R = 34


def gauge(ctx, x, y, r, k):
    """Манометр: k 1 — полный (F), 0 — пустой (E)."""
    D.circle(ctx, x, y, r, hexrgb("#fbfaf6"), D.INK, 4)
    for j in range(5):
        a = math.pi * (1.15 + 0.7 * j / 4)
        D.line(ctx, x + math.cos(a) * r * 0.7, y + math.sin(a) * r * 0.7, x + math.cos(a) * r * 0.9,
               y + math.sin(a) * r * 0.9, D.INK, 3)
    D.text(ctx, "E", x - r * 0.55, y + r * 0.2, r * 0.45, D.FONT_TITLE, hexrgb("#e8423c"))
    D.text(ctx, "F", x + r * 0.55, y + r * 0.2, r * 0.45, D.FONT_TITLE, hexrgb("#3fbf6a"))
    a = math.pi * (1.15 + 0.7 * k)
    D.line(ctx, x, y, x + math.cos(a) * r * 0.75, y + math.sin(a) * r * 0.75, hexrgb("#e8423c"), 5)
    D.circle(ctx, x, y, 6, D.INK, None, 0)


def food_court(ctx, x, gy, tod="day", n_tanks=40):
    """Фуд-корт: зонтики над столиками, грили и клетка с баллонами (4 ряда по 10)."""
    for k in range(3):
        ux = x - 900 + k * 420
        D.line(ctx, ux, gy - 40, ux, gy - 520, D.INK, 8)
        D.poly(ctx, [(ux - 200, gy - 480), (ux, gy - 580), (ux + 200, gy - 480)],
               hexrgb(("#e8423c", "#ffd23a", "#2f8fd8")[k]), D.INK, 4, wob=0)
        D.rect(ctx, ux - 130, gy - 290, 260, 24, hexrgb("#fbfaf6"), D.INK, 3, wob=0)
        D.line(ctx, ux, gy - 266, ux, gy - 40, D.INK, 6)
    for k in range(2):
        PK.grill(ctx, x + 300 + k * 300, gy - 30, 1.0, tod)
    cx0 = x + 900
    D.rect(ctx, cx0 - 20, gy - 560, 1060, 520, hexrgb("#c9d0d6"), None, 0, wob=0, alpha=0.25)
    for row in range(4):
        for j in range(10):
            if row * 10 + j >= n_tanks:
                continue
            PK.propane_tank(ctx, cx0 + 50 + j * 100 + (row % 2) * 30, gy - 50 - (3 - row) * 120, 0.85, tod)
    for j in range(23):      # сетка-рабица
        xx = cx0 - 20 + j * 46
        D.line(ctx, xx, gy - 560, xx + 46, gy - 40, hexrgb("#8f99a3"), 2, 0.7)
        D.line(ctx, xx + 46, gy - 560, xx, gy - 40, hexrgb("#8f99a3"), 2, 0.7)
    D.rect(ctx, cx0 - 20, gy - 560, 1060, 520, None, D.INK, 6, wob=0)
    D.rrect(ctx, cx0 + 270, gy - 660, 480, 90, 16, hexrgb("#e8423c"), D.INK, 4)
    D.text(ctx, "PROPANE", cx0 + 510, gy - 596, 60, D.FONT_TITLE, hexrgb("#fbfaf6"))


def shot_empty(ctx, t, S):
    """У корзины: Тео стучит по баллону — «тонк», стрелка манометра падает на E."""
    d = S.cue(1) - 0.1
    cam = Cam(1230, IN.FL - 280, Keys((0, 1.65), (d, 1.75)))
    room_back(ctx, t, cam, "workshop_25", lambda c: IN.workshop(c, "day", patches_done=25), (-600, -900, 4200, 2700),
              0.6)
    with layer(ctx, cam, t):
        for k in range(2):
            PK.propane_tank(ctx, 1180 + k * 160, IN.FL - 20, 1.0, "day")
        k = 1 - smooth(clamp((t - 0.6) / 0.8))
        gauge(ctx, 1340, IN.FL - 185, 34, 0.02 + 0.3 * k * (0.5 + 0.5 * math.sin(t * 9)) * (t < 1.4))
        knock = abs(math.sin(t * 6)) if t < 1.2 else 0.0
        p = R.stand("side", t, 1)
        p.update(h1=(0.85 + 0.12 * knock, -1.0), h2=(0.3, -1.6), lean=0.35, face="worried", look=(1, 0.6))
        THEO_FUR_PATCH.draw(ctx, 1080, IN.FL + 40, 112, 1, p)
    if t < 1.2:
        pop_text(ctx, "TONK", W / 2 - 300, 300, t, int(t / 0.52) * 0.52, 80, "#c9d0d6", dur=0.4)
    if t > 1.4:
        pop_text(ctx, "EMPTY", W / 2 + 330, 300, t, 1.4, 110, "#e8423c", dur=d, shake=False)


def shot_court(ctx, t, S):
    """Клетка с 40 полными баллонами за фуд-кортом; отъезд — вся Главная улица забита ими."""
    d = S.cue(2) - S.cue(1)
    T_OUT = d * 0.4
    cam = Cam(Keys((0, COURT_X + 1400), (T_OUT, COURT_X + 1400), (d, COURT_X - 800, "io")), Keys((0, 580), (d, 420)),
              Keys((0, 0.75), (T_OUT, 0.8), (d, 0.36, "io")))
    street_back(ctx, t, cam, "day", -1400, 9000, shut=True, sun=(4000, -900, 110))
    with layer(ctx, cam, t):
        food_court(ctx, COURT_X, PK.FL + 20)
        crowd_floor(ctx, t, 151, 110, -1400, COURT_X + 400, PK.FL + 20, PK.FL + 360, 96, 128, vx=(-25, 25))
    if t < T_OUT:
        pop_text(ctx, "40 FULL TANKS", W / 2, 200, t, 0.3, 90, "#ffd23a", dur=T_OUT, shake=False)
    else:
        counter_badge(ctx, "ZOMBIES", 400, W - 300, 160, "#9fc86a", 420)


def roll_pose(t, x, s=112):
    """Пригнулся, толкает катящийся баллон обеими руками у земли."""
    g = R.gait(x / s / R.GAITS["walk"]["L"], "walk", "side", 1)
    p = R.stand("side", t, 1)
    p.update(f1=g["f1"], f2=g["f2"], lean=0.55, h1=(1.05, -1.0), h2=(0.95, -1.05), neck=0.2)
    if "hip" in g:
        p["hip"] = g["hip"]
    return p


def shot_roll(ctx, t, S):
    """Медленно, по одному: Раскал катит баллон сквозь толпу. Счётчик баллонов растёт."""
    d = S.cue(3) - S.cue(2)
    P = d / 2.0
    u = (t % P) / P
    n = 1 + min(38, int(t / d * 39))
    x0, x1 = 900, 2600
    x = lerp(x0, x1, u)
    cam = Cam(1750, 620, 0.8)
    street_back(ctx, t, cam, "day", -1400, 6000, shut=True, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        crowd_floor(ctx, t, 152, 40, -400, 4200, PK.FL - 10, PK.FL + 200, 96, 110, vx=(-20, 20))
        tx = x + 1.05 * 112 + TANK_R
        PK.propane_tank(ctx, tx, PK.FL + 300, 1.0, "day", ang=tx / TANK_R, lying=True)
        RASCAL_PATCH.draw(ctx, x, PK.FL + 300, 112, 1, rascal_pose(roll_pose(t, x), "calm"))
        crowd_floor(ctx, t, 153, 4, -300, 650, PK.FL + 420, PK.FL + 460, 122, 126, vx=(-10, 10))
        crowd_floor(ctx, t, 156, 4, 3000, 4000, PK.FL + 420, PK.FL + 460, 122, 126, vx=(-10, 10))
    counter_badge(ctx, "TANKS", "%d/40" % n, W - 320, 160, "#ffd23a", 440)
    if t > 0.4:
        pop_text(ctx, "SLOWLY...", 420, 250, t, 0.4, 80, "#fff6d8", dur=d, shake=False)


def shot_clank(ctx, t, S):
    """Баллон звякает об урну: все головы к тебе. Замер. Раскал машет. Отворачиваются."""
    d = S.dur - S.cue(3)
    T_CL, T_WAVE, T_BACK = 0.6, d * 0.5, d * 0.72
    BIN_X = 1800
    x = min(lerp(1400, 2000, t / 1.2), BIN_X - 1.05 * 112 - 2 * TANK_R - 10)
    turn = smooth(clamp((t - T_CL - 0.1) / 0.35)) * (1 - smooth(clamp((t - T_BACK) / 0.5)))
    cam = Cam(1650, Keys((0, 640), (T_CL, 640), (T_WAVE, 700, "io")), Keys((0, 0.82), (T_CL, 0.82), (T_WAVE, 1.0, "io")))
    street_back(ctx, t, cam, "day", -1400, 6000, shut=True, sun=(3000, -900, 110))

    def pose(m, tt):
        q = zombie_idle(tt, m.seed % 97)
        q["hturn"] = turn
        if turn > 0.5:
            q.update(mouth=0.5, neck=0.0)
        return q
    with layer(ctx, cam, t):
        crowd_floor(ctx, t, 154, 34, 200, 3200, PK.FL - 10, PK.FL + 200, 96, 110, pose_fn=pose)
        PK.trash_bin(ctx, BIN_X, PK.FL + 300, 1.0, "day")
        tx = x + 1.05 * 112 + TANK_R
        wob = 6 * math.sin((t - T_CL) * 30) * math.exp(-(t - T_CL) * 4) if t > T_CL else 0.0
        PK.propane_tank(ctx, tx + wob, PK.FL + 300, 1.0, "day", ang=tx / TANK_R, lying=True)
        if t < T_CL:
            p = roll_pose(t, x)
            inner = "calm"
        elif t < T_WAVE:
            p = R.stand("side", t, 1)
            p.update(lean=0.3, h1=(1.0, -1.1), h2=(0.9, -1.1), breathe=0)
            inner = "sweat"
        else:
            p = R.stand("side", t, 1)
            wv = 0.12 * math.sin((t - T_WAVE) * 10)
            p.update(h1=(1.2, -2.55 + wv), h2=(0.4, -1.7))
            inner = "sweat" if t < T_BACK + 0.4 else "calm"
        RASCAL_PATCH.draw(ctx, x, PK.FL + 300, 112, 1, rascal_pose(p, inner))
        crowd_floor(ctx, t, 155, 3, 300, 1000, PK.FL + 420, PK.FL + 460, 122, 126, pose_fn=pose)
        crowd_floor(ctx, t, 157, 3, 2300, 3100, PK.FL + 420, PK.FL + 460, 122, 126, pose_fn=pose)
    if t > T_CL:
        pop_text(ctx, "CLANK!", W / 2 + 300, 300, t, T_CL, 120, "#fff6d8", dur=0.9)
    if T_CL + 0.6 < t < T_WAVE:
        pop_text(ctx, "FREEZE.", W / 2 - 360, 250, t, T_CL + 0.6, 90, "#9fe0ff", dur=T_WAVE, shake=False)
    if t > T_WAVE:
        pop_text(ctx, "*WAVE*", W / 2 - 360, 250, t, T_WAVE, 90, "#ffd23a", dur=T_BACK - T_WAVE + 0.4, shake=False)
    if t > T_BACK + 0.5:
        pop_text(ctx, "PHEW.", W / 2 - 360, 250, t, T_BACK + 0.5, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_empty, "fade", 0.4),
        Shot(c(1) - 0.1, shot_court, "fade", 0.3),
        Shot(c(2) - 0.1, shot_roll, "fade", 0.3),
        Shot(c(3) - 0.1, shot_clank, "fade", 0.25),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(0.0, "tonk", 0.8), (0.52, "tonk", 0.8), (1.04, "tonk", 0.7), (c(2) + 0.3, "roll", 0.6),
              (c(3) + 0.6, "clank", 1.0), (c(3) + 0.75, "zombie_groan", 0.6), (c(3) + (S.dur - c(3)) * 0.72, "shuffle", 0.6)]
    S.music = [(0, "comic", 0.7), (c(1), "tension", 0.8), (c(2), "sneak", 1.0), (c(3) + 0.6, "tension", 1.0),
               (c(3) + (S.dur - c(3)) * 0.75, "comic", 0.8)]
