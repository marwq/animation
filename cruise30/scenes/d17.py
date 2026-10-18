"""День 17: краны пересохли, в бассейнах морская вода. В полдень ливень: перевёрнутые зонты, вёдра,
холодильники, открытый рот. 200 галлонов. Смех под дождём — и на тебя оборачивается вся палуба."""
from scenes.kit import *
from scenes.shared import *

UMBR = [900, 1150, 1400, 2700, 2950, 3200]


def rain_layer(ctx, t, k=1.0):
    SEA.rain_streaks(ctx, t, 0, 0, W, H, 1.4 * k, 0.25, alpha=0.55 * k, speed=1.2)


def shot_taps(ctx, t, S):
    d = S.cue(1) - 0.1
    T_POOL = d * 0.5
    if t < T_POOL:
        cam = Cam(700, 640, 1.7)
        deck_back(ctx, t, cam, "day", 0.0, sun=(2400, 0, 60))
        with layer(ctx, cam, t):
            D.rect(ctx, 560, 600, 260, 30, hexrgb("#c9d0d4"), D.INK, 3, wob=0)
            D.curve(ctx, [(680, 600), (680, 540), (740, 530), (740, 560)], D.INK, 14)
            D.curve(ctx, [(680, 600), (680, 540), (740, 530), (740, 560)], hexrgb("#c9d0d4"), 8)
            if 0.8 < t < 1.1:
                D.ellipse(ctx, 740, 575 + (t - 0.8) * 200, 6, 9, hexrgb("#7fd0ff"), D.INK, 2)
            p = R.stand("side", t, 1)
            p.update(face="shock" if t > 1.1 else "neutral", h1=(0.55, -2.4), hturn=0.7)
            LEO_CAP.draw(ctx, 520, 900, 120, 1, p)
        pop_text(ctx, "khh... khh...", 1300, 300, t, 0.3, 80, "#fff6d8", dur=1.4)
    else:
        tt = t - T_POOL
        cam = Cam(1700, 760, 1.6)
        deck_back(ctx, tt, cam, "day", 0.0, sun=(2400, 0, 60))
        with layer(ctx, cam, tt):
            p = R.stand("side", tt, 1)
            p.update(face="eat" if tt < 0.8 else "sad", mouth=0.6, lean=0.4 if tt < 0.8 else -0.1, hturn=0.6)
            p["hip"] = (0, 0.45)
            LEO_CAP.draw(ctx, 1560, DK.GF + 20, 120, 1, p)
            DK.water(ctx, tt, *DK.POOL, DK.GF + 14, tod="day")
        if tt > 0.8:
            pop_text(ctx, "BLEH!", 1250, 280, tt, 0.8, 130, "#9bd666", dur=1.4)
            pop_text(ctx, "SEAWATER", 700, 860, tt, 1.0, 70, "#7fd0ff", dur=2, shake=False)


def shot_storm(ctx, t, S):
    k = smooth(clamp(t / 1.6))
    cam = Cam(1900, 560, Keys((0, 0.7), (3, 0.8)))
    deck_back(ctx, t, cam, "day", 0.0, sun=(2400, 0, 60))
    ctx.save()
    D.col(ctx, hexrgb("#3a4656"), 0.55 * k)
    ctx.paint()
    ctx.restore()
    with layer(ctx, cam, t, 0.3):
        for i in range(6):
            SEA.cloud(ctx, 800 + i * 520 - (1 - k) * 600, -250 + (i % 2) * 70, 1.8, "storm", 50 + i, alpha=k)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        p.update(face="shock", look=(0, -1), neck=-0.4, hturn=0.6)
        LEO_CAP.draw(ctx, 1900, 1020, 105, 1, p)
    if t > 1.4:
        rain_layer(ctx, t, clamp((t - 1.4) / 0.6))
        fx.flash(ctx, 0.4 * clamp(1 - abs(t - 1.5) / 0.15), "#e8f0ff")


def shot_umbrellas(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    run = Keys((0, 700), (d * 0.75, 3300, "lin"))
    cam = Cam(lambda tt: run(tt) + 150, 680, 0.95, shake=0.1)
    deck_back(ctx, t, cam, "storm", 0.0, chairs=True, clouds=False)
    D.col(ctx, hexrgb("#3a4656"), 0.25)
    ctx.paint()
    with layer(ctx, cam, t):
        x = run(t)
        for i, ux in enumerate(UMBR):
            flipped = x > ux + 40
            k = clamp((x - ux - 40) / 160)
            DK.umbrella(ctx, ux, DK.GF + 40 if flipped else DK.GF - 10, hexrgb(["#e8423c", "#f2c230", "#2f8fd8"][i % 3]),
                        "storm", open_=1.0, h=230 if not flipped else 0, rot=math.pi * ease_out(k) if flipped else 0)
        for i, bx in enumerate((1700, 2100, 2450, 3500)):
            if x > bx:
                D.poly(ctx, [(bx - 40, DK.GF + 60), (bx + 40, DK.GF + 60), (bx + 32, DK.GF + 140), (bx - 32, DK.GF + 140)],
                       hexrgb(["#2f8fd8", "#e8423c", "#f2c230", "#3fbf6a"][i]), D.INK, 3, wob=0)
        if t < d * 0.75:
            w = Walk(run, 1050, 110, "run", t1=8)
            w.draw(ctx, LEO_CAP, t, {"face": "laugh", "a1": (2.4, 0.3)})
        else:
            p = R.stand("front", t, 1)
            p.update(face="eat", mouth=1.0, look=(0, -1), neck=-0.5, a1=(2.4, 0.3), a2=(2.4, 0.3))
            LEO_CAP.draw(ctx, x, 1050, 110, 1, p)
    rain_layer(ctx, t)
    labels = [(0.9, "UMBRELLAS"), (d * 0.42, "BUCKETS"), (d * 0.58, "COOLERS"), (d * 0.76, "YOUR MOUTH")]
    for i, (tt, txt) in enumerate(labels):
        pop_text(ctx, txt, 360 + i * 400, 220 + (i % 2) * 70, t, tt, 64, "#ffe36a", dur=1.6, shake=False)


def shot_gallons(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#4a5a6a"), (1, "#2a3646")])
    lvl = smooth(clamp(t / 1.6))
    for i in range(5):
        x = 360 + i * 300
        D.poly(ctx, [(x - 100, 520), (x + 100, 520), (x + 80, 820), (x - 80, 820)], hexrgb("#f4f2ec"), D.INK, 6, wob=0)
        ctx.save()
        D.path(ctx, [(x - 100, 520), (x + 100, 520), (x + 80, 820), (x - 80, 820)])
        ctx.clip()
        y = 820 - 290 * lvl * (0.85 + 0.15 * math.sin(i))
        D.rect(ctx, x - 120, y + math.sin(t * 4 + i) * 4, 240, 400, hexrgb("#7fd0ff"), None, 0, wob=0)
        ctx.restore()
    D.text(ctx, "%d GAL" % int(200 * lvl), W / 2, 360, 150, D.FONT_TITLE, hexrgb("#7fd0ff"), stroke=D.INK, slw=12)
    rain_layer(ctx, t, 0.8)


def shot_laugh(ctx, t, S):
    T_TURN = S.cue(4, True) - S.cue(4) - 1.4
    T_TURN = max(T_TURN, 1.8)
    cam = Cam(Keys((0, 1900), (T_TURN, 1900), (T_TURN + 1.2, 2100)), Keys((0, 760), (T_TURN, 780), (T_TURN + 1.2, 1050)),
              Keys((0, 1.35), (T_TURN, 1.3), (T_TURN + 1.2, 0.55)))
    deck_back(ctx, t, cam, "storm", 0.0, clouds=False, mess=0.4)
    D.col(ctx, hexrgb("#3a4656"), 0.25)
    ctx.paint()
    with layer(ctx, cam, t):
        D.rect(ctx, -1000, 1230, 6500, 1200, hexrgb("#6a7280"), None, 0, wob=0)
        D.rect(ctx, -1000, 1210, 6500, 40, hexrgb("#d8dee2"), D.INK, 4, wob=0)
        r = rng(17)
        for i in range(40):
            x = r.uniform(300, 3900)
            y = 1560 + r.uniform(0, 280)
            p = zombie_idle(t, i)
            turn = clamp((t - T_TURN - r.uniform(0, 0.4)) / 0.2)
            p.update(hturn=-1.0 + 2.0 * turn * (1 if x < 1900 else -1) if True else 0, mouth=0.4 + 0.5 * turn)
            p.update(neck=-0.5 * turn, look=(0, -1))
            R.Fig(R.zombie_look(2400 + i)).draw(ctx, x, y, 110 * (1 + (y - 1600) / 900), 1 if x < 1900 else -1, p)
        OD.railing(ctx, -1000, 5500, 1210, "storm", h=110, glass=True)
        p = R.stand("front", t, 1)
        stop = t > T_TURN + 0.6
        sp = math.sin(t * 6)
        p.update(face="laugh" if not stop else "scared", blink=0 if stop else p["blink"],
                 a1=(2.6 + 0.3 * sp, 0.4) if not stop else (0.3, 0.6), a2=(2.6 - 0.3 * sp, 0.4) if not stop else (0.3, 0.6),
                 hip=(0.1 * sp if not stop else 0, 0))
        LEO_CAP.draw(ctx, 1900, 1050, 110, 1, p)
    rain_layer(ctx, t)
    if not t > T_TURN + 0.6:
        pop_text(ctx, "HA HA HA!", 1250, 300, t, 0.3, 100, "#fff6d8", dur=T_TURN, shake=True)
    else:
        pop_text(ctx, "...oh.", 1200, 280, t, T_TURN + 0.8, 100, "#fff6d8", dur=2.5, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_taps),
        Shot(c(1) - 0.1, shot_storm, "fade", 0.3),
        Shot(c(2) - 0.1, shot_umbrellas),
        Shot(c(3) - 0.1, shot_gallons, "fade", 0.25),
        Shot(c(4) - 0.1, shot_laugh, "fade", 0.25),
    ]
    S.tods = [(0, "day"), (c(1), "storm")]
    S.sfx += [(0.3, "pipe_cough", 0.8), (c(1) + 1.4, "thunder", 1.0), (c(1) + 1.6, "rain", 1.0)]
    S.music = "rain_joy"
