"""День 21: Бандит пропала. Она на вершине подъёма «Тандерболта», 200 футов, плачет. Лезешь по служебной лестнице —
они не могут следом. Наверху — три енотёнка. Бандит — мама. Вся семья едет вниз в голове Раскала."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
TRACK = RD.Track(RD.thunderbolt_track(0, FL, 2600))
CREST_X = 2350
CREST_Y = TRACK.at(next(s for s in range(0, int(TRACK.L), 10) if TRACK.at(s)[0][0] >= CREST_X))[0][1]
LAD_X = CREST_X - 260
LAD_TOP = CREST_Y + 40


def nest(ctx, x, y, t, babies=3, mom=True, s=1.0):
    """Гнездо из пакетов попкорна на площадке подъёма: Бандит и енотята."""
    for k, c in enumerate(("#e8423c", "#2f8fd8", "#f05a8a", "#ffd23a")):
        bx = x - 130 * s + k * 80 * s
        D.poly(ctx, [(bx - 34 * s, y), (bx + 34 * s, y), (bx + 40 * s, y - 70 * s), (bx - 40 * s, y - 70 * s)],
               hexrgb(c), D.INK, 3, wob=0)
    for k in range(babies):        # енотята выглядывают из пакетов 2–4
        bob = 6 * s * math.sin(t * 5 + k * 2)
        draw_raccoon(ctx, x + (-50 + k * 80) * s, y - 62 * s + bob, 70 * s, -1 if k % 2 else 1,
                     raccoon_pose(t + k, "peek", baby=True, look=0.3 * math.sin(t * 2 + k)))
    if mom:
        draw_raccoon(ctx, x - 150 * s, y, 100 * s, 1, raccoon_pose(t, "sit", look=0.6))


def tear(ctx, x, y, t, s=1.0):
    for k in range(2):
        ph = (t * 1.4 + k * 0.5) % 1
        D.ellipse(ctx, x + k * 18 * s, y + ph * 70 * s, 6 * s, 9 * s, hexrgb("#8ad8ff"), D.INK, 1.5, alpha=1 - ph)


def lift_scene(ctx, t, cam, tod="day"):
    grass_back(ctx, t, cam, tod, -3000, 9000, sun=(5200, -2400, 140))
    with layer(ctx, cam, t):
        RD.coaster_track(ctx, TRACK, FL, tod, lattice_until=4300)
        for side in (-1, 1):
            D.line(ctx, LAD_X + side * 45, FL, LAD_X + side * 45, LAD_TOP, D.INK, 12)
            D.line(ctx, LAD_X + side * 45, FL, LAD_X + side * 45, LAD_TOP, hexrgb("#8f99a3"), 6)
        y = FL - RUNG * 112
        while y > LAD_TOP:
            D.line(ctx, LAD_X - 45, y, LAD_X + 45, y, D.INK, 9)
            D.line(ctx, LAD_X - 45, y, LAD_X + 45, y, hexrgb("#8f99a3"), 4)
            y -= RUNG * 112
        D.rect(ctx, LAD_X - 120, LAD_TOP - 14, 380, 22, hexrgb("#8f99a3"), D.INK, 4, wob=0)       # площадка
        for k in range(5):
            D.line(ctx, LAD_X - 110 + k * 90, LAD_TOP - 14, LAD_X - 110 + k * 90, LAD_TOP - 110, D.INK, 4)
        D.line(ctx, LAD_X - 120, LAD_TOP - 110, LAD_X + 260, LAD_TOP - 110, D.INK, 6)


def head_bucket(ctx, x, y, r, t):
    """Голова костюма за спиной горловиной вверх (видна сзади): из горловины выглядывает семья."""
    for k in (-1, 1):          # уши смотрят вниз
        D.poly(ctx, [(x + k * r * 0.45, y + r * 0.75), (x + k * r * 0.8, y + r * 1.15), (x + k * r * 0.85, y + r * 0.45)],
               hexrgb("#9a9ea6"), D.INK, 4, wob=0)
    D.circle(ctx, x, y, r, hexrgb("#9a9ea6"), D.INK, 5)
    D.ellipse(ctx, x, y + r * 0.1, r * 0.5, r * 0.75, hexrgb("#7a7e86"), None, 0)
    D.ellipse(ctx, x, y - r * 0.78, r * 0.62, r * 0.2, hexrgb("#2b2c31"), D.INK, 4)
    for k in range(4):
        bob = 5 * math.sin(t * 5 + k * 1.7)
        draw_raccoon(ctx, x - r * 0.45 + k * r * 0.3, y - r * 0.95 + bob, 105 if k == 0 else 80, 1 if k % 2 else -1,
                     raccoon_pose(t + k, "peek", baby=k > 0, look=0.4 * math.sin(t + k)))


def shot_missing(ctx, t, S):
    """Утро в башне: на ногах никого. Тео ищет — под подушками, за ящиком."""
    d = S.cue(1) - 0.1
    bx = IN.TOWER_BED_X
    cam = Cam(bx - 300, 560, Keys((0, 1.0), (d, 1.08)))
    room_back(ctx, t, cam, "tower_morning", lambda c: IN.tower_room(c, "morning", lit=False),
              (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        D.ellipse(ctx, bx + 120, IN.FL - 172, 90, 18, hexrgb("#c83a3a"), None, 0, alpha=0.6)     # вмятина
        look = math.sin(t * 2.2)
        p = R.stand("side", t, 1)
        p.update(face="worried", hturn=0.6 * look, h1=(0.7, -3.0), h2=(0.3, -1.7), mouth=0.5)
        THEO_FUR_PATCH.draw(ctx, bx - 600, IN.FL + 40, 112, 1 if look > 0 else -1, p)
    speech(ctx, 700, 230, "BANDIT?", t, 0.3, 70, tail=(1, 1))
    if t > d * 0.5:
        pop_text(ctx, "MISSING", W / 2 + 380, 300, t, d * 0.5, 100, "#ff8a7a", dur=d, shake=False)


def shot_found(ctx, t, S):
    """Подъём «Тандерболта»: наезд на самый верх — там крошечный Бандит, плачет. 200 футов."""
    d = S.cue(2) - S.cue(1)
    cam = Cam(Keys((0, 1800), (d * 0.6, CREST_X, "io")), Keys((0, FL - 1300), (d * 0.6, CREST_Y - 30, "io")),
              Keys((0, 0.3), (d * 0.6, 1.6, "io"), (d, 1.7)), anchor=(1800, 520))
    lift_scene(ctx, t, cam)
    with layer(ctx, cam, t):
        nest(ctx, CREST_X + 40, LAD_TOP - 14, t, babies=0, mom=False)
        draw_raccoon(ctx, CREST_X - 30, LAD_TOP - 14, 100, 1, raccoon_pose(t, "sit", look=-0.4))
        tear(ctx, CREST_X + 10, LAD_TOP - 120, t, 0.8)
    if t < d * 0.5:
        counter_badge(ctx, "HEIGHT", "200 FT", W - 350, 160, "#ffd23a", 520)
    else:
        pop_text(ctx, "SNIFF...", W / 2 + 360, 300, t, d * 0.5, 80, "#9fe0ff", dur=d, shake=False)


def shot_climb(ctx, t, S):
    """Служебная лестница: Раскал лезет, внизу тянут руки и не могут следом. Наверху — сюрприз."""
    d = S.cue(3) - S.cue(2)
    T_TOP = d * 0.75
    total = (FL - LAD_TOP) / 112
    prog = total * smooth(clamp(t / T_TOP))
    yb = FL - prog * 112
    cam = Cam(LAD_X + 150, lambda q: FL - total * 112 * smooth(clamp(q / T_TOP)) - 250,
              Keys((0, 0.62), (T_TOP, 0.75)), anchor=(LAD_X, 520))
    lift_scene(ctx, t, cam)
    with layer(ctx, cam, t):
        nest(ctx, CREST_X + 40, LAD_TOP - 14, t, babies=0, mom=False)
        draw_raccoon(ctx, CREST_X - 30, LAD_TOP - 14, 100, 1, raccoon_pose(t, "sit", look=-0.6))
        draw_climber(ctx, RASCAL_PATCH, LAD_X, FL, 112, prog, 1, "back")
        for i, dx in enumerate((-640, -460, -280, 260, 440)):
            q = zombie_reach(t, i)
            q.update(a1=(2.4, -0.2), a2=(2.2, -0.1), neck=-0.4)
            R.Fig(R.park_zombie(2100 + i)).draw(ctx, LAD_X + dx, FL + 40 + (i % 2) * 30, 106, 1 if dx < 0 else -1, q)
    if t > 0.5 and t < T_TOP:
        pop_text(ctx, "THEY CAN'T CLIMB", W / 2, 220, t, 0.5, 80, "#7ee04a", dur=T_TOP, shake=False)
    if t > T_TOP:
        pop_text(ctx, "...WHY?", W / 2 + 330, 260, t, T_TOP, 90, "#fff6d8", dur=d, shake=False)


def shot_family(ctx, t, S):
    """Три енотёнка — Бандит мама. Спуск: семья выглядывает из головы Раскала за спиной у Тео."""
    d = S.dur - S.cue(3)
    T_DOWN = d * 0.45
    if t < T_DOWN:
        cam = Cam(CREST_X - 60, LAD_TOP - 250, Keys((0, 1.4), (T_DOWN, 1.5)), anchor=(CREST_X, 520))
        lift_scene(ctx, t, cam)
        with layer(ctx, cam, t):
            nest(ctx, CREST_X + 40, LAD_TOP - 14, t, babies=3)
            p = R.stand("side", t, 1)
            p.update(h1=(0.6, -2.2), h2=(0.4, -2.0), lean=0.15)
            RASCAL_PATCH.draw(ctx, LAD_X - 40, LAD_TOP - 14, 112, 1, rascal_pose(p, "happy"))
            for k in range(3):
                ph = (t * 0.7 + k / 3) % 1
                heart(ctx, CREST_X + 60 + k * 50, LAD_TOP - 200 - ph * 120, 22, 1 - ph)
        if t > 0.5:
            counter_badge(ctx, "BABIES", 3, W - 300, 160, "#ffd23a", 380)
        if t > 1.2:
            pop_text(ctx, "BANDIT IS A MOM!", W / 2 + 330, 360, t, 1.2, 90, "#ff8ac8", dur=d, shake=False)
        return
    tt = t - T_DOWN
    dd = d - T_DOWN
    total = (FL - LAD_TOP) / 112
    prog = total * (1 - smooth(clamp(tt / dd)) * 0.55)
    cam = Cam(LAD_X + 120, lambda q: FL - total * 112 * (1 - smooth(clamp((q - T_DOWN) / dd)) * 0.55) - 300,
              0.85, anchor=(LAD_X, 520))
    lift_scene(ctx, t, cam)
    with layer(ctx, cam, t):
        J = draw_climber(ctx, THEO_FUR_PATCH, LAD_X, FL, 112, prog, 1, "back", face="happy")
        # голова костюма за спиной горловиной вверх, из неё выглядывает семья
        bx, by = LAD_X + 90, FL - prog * 112 - 2.05 * 112
        head_bucket(ctx, bx, by, 95, t)
    pop_text(ctx, "FAMILY TRIP", W / 2 + 330, 230, tt, 0.3, 80, "#ffd23a", dur=dd, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_missing, "fade", 0.4),
        Shot(c(1) - 0.1, shot_found, "fade", 0.3),
        Shot(c(2) - 0.1, shot_climb, "fade", 0.3),
        Shot(c(3) - 0.1, shot_family, "fade", 0.3),
    ]
    S.tods = [(0, "morning"), (c(1), "day")]
    S.sfx += [(0.3, "birds", 0.4), (c(1) + 1.0, "wind", 0.6), (c(1) + (c(2) - c(1)) * 0.5, "squeak", 0.6),
              (c(2) + 0.2, "ladder", 0.8), (c(2) + 0.6, "zombie_groan", 0.6), (c(3) + 0.4, "squeak", 0.8),
              (c(3) + 0.9, "kids_laugh", 0.3)]
    S.music = [(0, "mystery", 0.7), (c(1), "tension", 0.7), (c(3), "warm", 1.0)]
