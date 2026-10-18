"""День 11: урок первый. «Шар — это просто большой мешок горячего воздуха и немного смелости». Модель из мусорного
пакета и свечки: поднимается, летит над парком и садится зомби на голову. Урок первый: работает. Урок второй:
рулить нельзя."""
from scenes.kit import *
from scenes.shared import *

BENCH_X = 1700 + 130          # свободный край верстака мастерской слева от машинки (верх FL-280)
BAG_S = 0.8


def chalk(ctx, pts, a=1.0, w=7):
    D.polyline(ctx, pts, hexrgb("#f4f4ec"), w, 0.9 * a)


def shot_lesson(ctx, t, S):
    """Гас по рации днём → меловая схема: пламя, тёплый воздух вверх, «+ немного смелости»."""
    d = S.cue(1) - 0.1
    T_BOARD = d * 0.42
    if t < T_BOARD:
        cam = Cam(IN.GUS_RADIO_X - 820, 520, Keys((0, 1.0), (T_BOARD, 1.08)))
        gus_radio(ctx, t, cam, 1.0, "smile", "day")
        place_tag(ctx, "LESSON 1", t, 70, 210, "#fff6d8", "#2f8fd8")
        return
    tt = t - T_BOARD
    D.rect(ctx, 0, 0, W, H, hexrgb("#8a5a34"), None, 0, wob=0)
    D.rect(ctx, 60, 50, W - 120, H - 100, hexrgb("#2a4a3a"), D.INK, 8, wob=0)
    r = rng(3)
    for k in range(40):
        D.circle(ctx, r.uniform(80, W - 80), r.uniform(70, H - 70), r.uniform(20, 70), hexrgb("#3a5a4a"), None, 0,
                 alpha=0.25)
    cx, cy = 640, 560
    k1 = clamp(tt / 0.6)
    outline = []
    for i in range(41):
        a = math.pi * 0.62 + i / 40 * math.pi * 1.76
        outline.append((cx + math.cos(a) * 260, cy - 60 + math.sin(a) * 300))
    chalk(ctx, outline[:max(2, int(len(outline) * k1))], 1.0, 8)
    if tt > 0.6:
        chalk(ctx, [(cx - 110, cy + 230), (cx - 60, cy + 330), (cx + 60, cy + 330), (cx + 110, cy + 230)], 1.0)
        chalk(ctx, [(cx - 70, cy + 330), (cx - 70, cy + 400), (cx + 70, cy + 400), (cx + 70, cy + 330)], 1.0)
        fl = 1 + 0.12 * math.sin(tt * 14)
        D.poly(ctx, [(cx - 26, cy + 330), (cx, cy + 330 - 70 * fl), (cx + 26, cy + 330)], hexrgb("#ffb070"), None, 0,
               wob=0, alpha=0.9)
    if tt > 0.9:
        for j in range(3):
            ph = (tt * 0.6 + j / 3) % 1
            x = cx - 120 + j * 120
            y = cy + 200 - ph * 380
            chalk(ctx, [(x, y + 60), (x, y)], 1 - ph, 6)
            chalk(ctx, [(x - 20, y + 22), (x, y), (x + 20, y + 22)], 1 - ph, 6)
        D.text(ctx, "HOT AIR", cx, cy - 400, 70, D.FONT_HAND, hexrgb("#ffd6a0"))
    if tt > 1.6:
        D.text(ctx, "+ a little", 1340, 430, 80, D.FONT_HAND, hexrgb("#f4f4ec"))
        D.text(ctx, "COURAGE", 1340, 560, 110, D.FONT_TITLE, hexrgb("#ffd23a"))
        heart(ctx, 1340, 700, 50)


def shot_build(ctx, t, S):
    """Верстак: мусорный пакет на рамке, свечка с цифрой; спичка — пакет надувается."""
    d = S.cue(2) - S.cue(1)
    T_LIGHT = d * 0.45
    cam = Cam(BENCH_X + 150, IN.FL - 420, Keys((0, 1.45), (d, 1.6)))
    room_back(ctx, t, cam, "workshop_13", lambda c: IN.workshop(c, "day", patches_done=0), (-600, -900, 4200, 2700),
              0.6)
    with layer(ctx, cam, t):
        top = IN.FL - 280
        fill = 0.25 + 0.75 * smooth(clamp((t - T_LIGHT - 0.3) / 1.6))
        bx, by = BENCH_X, top - 72 * BAG_S
        lift = 30 * smooth(clamp((t - T_LIGHT - 1.7) / 0.6))
        # пакет на рамке; до спички — висит мятый
        BL.trash_balloon(ctx, bx, by - lift, BAG_S, t, "day", fill, lit=t > T_LIGHT)
        p = R.stand("side", t, 1)
        near = smooth(clamp((t - T_LIGHT + 0.6) / 0.5)) * (1 - smooth(clamp((t - T_LIGHT - 0.4) / 0.4)))
        p.update(face="happy" if t > T_LIGHT + 1.0 else "neutral", look=(1, 0.5), neck=0.2,
                 h1=(lerp(0.7, 1.35, near), lerp(-2.1, -2.35, near)), h2=(0.6, -2.4))
        J = THEO_FUR.draw(ctx, BENCH_X - 190, IN.FL + 40, 112, 1, p)
        mx, my = THEO_FUR.world(BENCH_X - 190, IN.FL + 40, 112, 1, J["hand1"])
        if near > 0.05:      # спичка
            D.line(ctx, mx, my, mx + 40, my - 20, hexrgb("#e8c890"), 5)
            D.circle(ctx, mx + 42, my - 22, 6, hexrgb("#c8503a"), None, 0)
            BL.flame(ctx, mx + 44, my - 26, 0.1, 0.5, t)
        draw_raccoon(ctx, BENCH_X + 760, top, 95, -1, raccoon_pose(t, "sit", look=-0.5 + 0.8 * clamp(fill - 0.3)))
    if t > T_LIGHT + 1.2:
        pop_text(ctx, "IT'S ALIVE!", W / 2 + 330, 230, t, T_LIGHT + 1.2, 80, "#fff6d8", dur=d, shake=False)
    else:
        pop_text(ctx, "TRASH BAG + CANDLE", W / 2, 200, t, 0.3, 70, "#ffd23a", dur=T_LIGHT + 1.0, shake=False)


def bag_path(q, d):
    """Полёт модели: (x, y) мира как функция времени кадра."""
    u = clamp(q / d)
    x = lerp(200, 5200, smooth(u))
    up = math.sin(clamp(u / 0.85) * math.pi * 0.5)
    y = lerp(PK.FL - 380, PK.FL - 1300, up) if u < 0.6 else lerp(PK.FL - 1300, ZOMB_HEAD_Y, smooth((u - 0.6) / 0.4))
    return x + 30 * math.sin(q * 1.3), y + 18 * math.sin(q * 2.1)


ZOMB_X = 5200
ZOMB_HEAD_Y = PK.FL + 60 - 3.9 * 112 - 20


def shot_flight(ctx, t, S):
    """Раскал отпускает модель у сарая → она плывёт над Главной улицей → садится зомби на голову."""
    d = S.cue(3) - S.cue(2)
    fly = d - 0.4
    landed = t > fly
    cam = Cam(lambda q: lerp(700, ZOMB_X, smooth(clamp(q / fly))),
              lambda q: lerp(PK.FL - 520, PK.FL - 700, math.sin(clamp(q / fly) * math.pi)) if q < fly else PK.FL - 520,
              Keys((0, 0.75), (fly * 0.5, 0.55, "io"), (fly, 0.8, "io")), anchor=(700, PK.FL - 520))
    street_back(ctx, t, cam, "day", -1400, 7000, shut=True, sun=(3000, -900, 110))
    with layer(ctx, cam, t):
        for i in range(10):
            zx = 800 + i * 520 + math.sin(t * 0.4 + i) * 60
            if abs(zx - ZOMB_X) < 200:
                continue
            p = R.gait(t * 1.1 + i, "shamble", "side", i) if i % 2 else zombie_idle(t, i)
            if t > fly * 0.4:
                p.update(neck=-0.4, look=(0, -1))
            R.Fig(R.park_zombie(1100 + i)).draw(ctx, zx, PK.FL + 30 + (i % 3) * 40, 104, 1 if i % 3 else -1, p)
        # Раскал на старте, рука вверх — отпустил
        p = R.stand("side", t, 1)
        p.update(h1=(0.5, -3.9) if t > 0.3 else (0.7, -3.0), h2=(0.3, -1.7), look=(1, -0.8))
        RASCAL.draw(ctx, 260, PK.FL + 60, 112, 1, rascal_pose(p, "happy"))
        # зомби-«посадочная площадка»
        p = zombie_idle(t, 3)
        if landed:
            p.update(neck=0.0, look=(0, -1), face="neutral", mouth=0.5)
        J = R.Fig(R.park_zombie(1199, "dad")).draw(ctx, ZOMB_X, PK.FL + 60, 112, -1, p)
        hx, hy = R.Fig(R.park_zombie(1199, "dad")).world(ZOMB_X, PK.FL + 60, 112, -1, J["head"])
        if not landed:
            x, y = bag_path(t, fly)
            if t > fly - 0.6:      # снижение в точку макушки
                k = smooth((t - (fly - 0.6)) / 0.6)
                x, y = lerp(x, hx, k), lerp(y, hy - 118, k)
            BL.trash_balloon(ctx, x, y, BAG_S, t, "day", 1.0)
        else:
            BL.trash_balloon(ctx, hx, hy - 118 + 8 * math.exp(-(t - fly) * 6), BAG_S, t, "day",
                             1.0 - 0.3 * clamp((t - fly) / 1.0))
    if t > 0.6 and t < fly * 0.5:
        pop_text(ctx, "IT FLIES!", W / 2, 220, t, 0.6, 90, "#fff6d8", dur=fly * 0.5, shake=False)
    if landed:
        pop_text(ctx, "PLOP.", W / 2 + 260, 300, t, fly, 100, "#9fc86a", dur=1.2)


def shot_lessons(ctx, t, S):
    """Зомби в «шляпе» из пакета бредёт и врезается в фонарь; карточки уроков."""
    d = S.dur - S.cue(3)
    LAMP_X = ZOMB_X - 700
    w = Walk(Keys((0, ZOMB_X), (d * 0.55, LAMP_X + 90, "lin")), PK.FL + 60, 112, "shamble", t1=d + 1)
    cam = Cam(ZOMB_X - 400, PK.FL - 520, 0.8)
    street_back(ctx, t, cam, "day", -1400, 7000, shut=True, sun=(3000, -900, 110), lamps=False)
    with layer(ctx, cam, t):
        PK.lamp_post(ctx, LAMP_X, PK.FL + 30, 1.0, "day")
        bonk = t > d * 0.55
        x = w.x(t)
        if bonk:
            x = LAMP_X + 90 + 30 * math.exp(-(t - d * 0.55) * 5)
            p = zombie_idle(t, 3)
            p.update(lean=-0.15, face="neutral")
        else:
            p = w.pose(t)
        Z = R.Fig(R.park_zombie(1199, "dad"))
        J = Z.draw(ctx, x, PK.FL + 60, 112, -1, p)
        hx, hy = Z.world(x, PK.FL + 60, 112, -1, J["head"])
        BL.trash_balloon(ctx, hx, hy - 118, BAG_S, t, "day", 0.7)
        if bonk:
            for j in range(3):
                a = t * 4 + j * TAU / 3
                star(ctx, hx + math.cos(a) * 90, hy - 170 + math.sin(a) * 24, 18, hexrgb("#ffd23a"), 2)
    st = S.cue(3) - 0.1
    l1 = S.word("lesson", S.cue(3) - 0.2, st + 0.3) - st
    l2 = S.word("lesson", st + l1 + 0.5, st + d * 0.45) - st
    for i, (txt, ok, t0) in enumerate((("LESSON 1: IT WORKS", True, l1), ("LESSON 2: YOU CAN'T STEER", False, l2))):
        if t < t0:
            continue
        k = ease_out_back(clamp((t - t0) / 0.3))
        ctx.save()
        ctx.translate(W / 2 + 360, 190 + i * 160)
        ctx.rotate(-0.03 + i * 0.05)
        ctx.scale(k, k)
        D.rrect(ctx, -500, -62, 1000, 124, 24, hexrgb("#fbf3dc"), D.INK, 6)
        D.text(ctx, txt, -460, 18, 46, D.FONT_TITLE, hexrgb("#2b2f3a"), "left")
        cxk = 440
        D.circle(ctx, cxk, 0, 42, hexrgb("#3fbf6a" if ok else "#e8423c"), D.INK, 4)
        if ok:
            D.polyline(ctx, [(cxk - 20, 0), (cxk - 4, 18), (cxk + 22, -16)], hexrgb("#fbfaf6"), 9)
        else:
            D.line(ctx, cxk - 16, -16, cxk + 16, 16, hexrgb("#fbfaf6"), 9)
            D.line(ctx, cxk + 16, -16, cxk - 16, 16, hexrgb("#fbfaf6"), 9)
        ctx.restore()
    if t > d * 0.55:
        pop_text(ctx, "BONK", 520, 520, t, d * 0.55, 100, "#fff6d8", dur=0.9)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_lesson, "fade", 0.4),
        Shot(c(1) - 0.1, shot_build, "fade", 0.3),
        Shot(c(2) - 0.1, shot_flight, "fade", 0.3),
        Shot(c(3) - 0.1, shot_lessons, "fade", 0.25),
    ]
    S.tods = [(0, "day")]
    S.sfx += [(0.2, "radio_beep", 0.6), (c(1) + (c(2) - c(1)) * 0.45, "match", 0.8),
              (c(2) + 0.4, "wind", 0.5), (c(3) - 0.4, "pop", 0.7), (c(3) + (S.dur - c(3)) * 0.55, "bonk", 0.9)]
    S.music = [(0, "warm", 0.8), (c(1), "wonder", 0.8), (c(2), "wonder", 1.0), (c(3), "comic", 0.9)]
