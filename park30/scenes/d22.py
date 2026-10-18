"""День 22 (ночь): Гас считает. Шар поднимет тебя, горелку, четыре баллона — и почти ничего больше. А у тебя енот,
трое малышей, единорог и сорок фунтов костюма. «Что-то останется, малыш». Смотришь на единорога. На Бандит. На
Раскала — долго."""
from scenes.kit import *
from scenes.shared import *

MATH = [("YOU", 130), ("BURNER", 60), ("4 TANKS", 160)]
EXTRA = [("BANDIT", 15), ("3 BABIES", 6), ("UNICORN", 25), ("RASCAL SUIT", 40)]
MAX_LB = 360


def notepad(ctx, x, y, w, h, rot=-0.03):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    D.rect(ctx, -w / 2, -h / 2, w, h, hexrgb("#fff8d8"), D.INK, 6, wob=0)
    for k in range(int(h / 70)):
        D.line(ctx, -w / 2 + 20, -h / 2 + 110 + k * 70, w / 2 - 20, -h / 2 + 110 + k * 70, hexrgb("#a8c8e8"), 3)
    D.line(ctx, -w / 2 + 110, -h / 2, -w / 2 + 110, h / 2, hexrgb("#f0a0a0"), 3)
    ctx.restore()


def shot_math(ctx, t, S):
    """Гас считает на блокноте под лампой; столбик: ты, горелка, четыре баллона."""
    d = S.cue(1) - 0.1
    T_PAD = d * 0.3
    if t < T_PAD:
        cam = Cam(IN.GUS_RADIO_X - 820, 520, Keys((0, 1.0), (T_PAD, 1.06)))
        gus_radio(ctx, t, cam, 1.0, "worried", "night")
        speech(ctx, 1420, 230, "LET ME DO THE MATH...", t, 0.3, 54, tail=(-1, 1))
        return
    tt = t - T_PAD
    D.rect(ctx, 0, 0, W, H, hexrgb("#8a5a34"), None, 0, wob=0)
    notepad(ctx, W / 2, H / 2 + 20, 1100, 900)
    D.text(ctx, "BALLOON LIFT:", W / 2 - 360, 210, 64, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
    D.text(ctx, "%d LB" % MAX_LB, W / 2 + 330, 210, 64, D.FONT_HAND, hexrgb("#e8423c"), "right")
    total = 0
    for i, (lab, lb) in enumerate(MATH):
        t0 = 0.3 + i * 0.5
        if tt < t0:
            break
        total += lb
        n = int(clamp((tt - t0) / 0.4) * len(lab))
        D.text(ctx, lab[:n], W / 2 - 360, 330 + i * 90, 60, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
        if tt > t0 + 0.4:
            D.text(ctx, "%d" % lb, W / 2 + 330, 330 + i * 90, 60, D.FONT_HAND, hexrgb("#2a3a7a"), "right")
    if tt > 2.0:
        D.line(ctx, W / 2 - 380, 600, W / 2 + 350, 600, hexrgb("#2a3a7a"), 5)
        D.text(ctx, "LEFT:", W / 2 - 360, 680, 64, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
        D.text(ctx, "%d" % (MAX_LB - total), W / 2 + 330, 680, 64, D.FONT_HAND, hexrgb("#e8423c"), "right")
    # карандаш скользит по строкам
    py = 330 + min(2, int(max(0, tt - 0.3) / 0.5)) * 90
    px = W / 2 - 200 + 200 * ((tt * 1.5) % 1)
    ctx.save()
    ctx.translate(px, py - 10)
    ctx.rotate(-0.6)
    D.rect(ctx, 0, -10, 240, 20, hexrgb("#ffd23a"), D.INK, 3, wob=0)
    D.poly(ctx, [(0, -10), (-34, 0), (0, 10)], hexrgb("#e8c08a"), D.INK, 2, wob=0)
    D.rect(ctx, 240, -10, 30, 20, hexrgb("#f0a0b0"), D.INK, 2, wob=0)
    ctx.restore()


def shot_pile(ctx, t, S):
    """Шкала веса растёт: по строке на каждого — Бандит, малыши, единорог, костюм; стрелка уходит за MAX."""
    d = S.cue(2) - S.cue(1)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    bx, by, bw, bh = 220, 170, 200, 800
    lo, hi = 300.0, 420.0                       # шкала показывает только верх: 300…420 фунтов
    yv = lambda lb: by + bh - (clamp(lb, lo, hi) - lo) / (hi - lo) * bh
    total = sum(lb for _, lb in MATH)
    shown = []
    for i, (lab, lb) in enumerate(EXTRA):
        t0 = 0.3 + i * d * 0.2
        if t < t0:
            break
        k = ease_out_back(clamp((t - t0) / 0.35))
        total += lb * clamp((t - t0) / 0.35)
        shown.append((i, lab, lb, k))
    D.rrect(ctx, bx, by, bw, bh, 30, hexrgb("#1c1830"), D.INK, 6)
    over = total > MAX_LB
    D.rect(ctx, bx + 12, yv(total), bw - 24, by + bh - 12 - yv(total), hexrgb("#ff6a5a" if over else "#ffd23a"),
           None, 0, wob=0)
    ym = yv(MAX_LB)
    D.line(ctx, bx - 30, ym, bx + bw + 30, ym, hexrgb("#e8423c"), 8)
    D.text(ctx, "MAX", bx - 40, ym + 14, 44, D.FONT_TITLE, hexrgb("#e8423c"), "right")
    D.text(ctx, "%d LB" % int(total), bx + bw / 2, by + bh + 70, 50, D.FONT_TITLE, hexrgb("#fff6d8"))
    for i, lab, lb, k in shown:
        y = 260 + i * 190
        ctx.save()
        ctx.translate(640, y)
        ctx.scale(k, k)
        if lab == "BANDIT":
            draw_raccoon(ctx, 0, 50, 90, 1, raccoon_pose(t, "sit"))
        elif lab == "3 BABIES":
            for b in range(3):
                draw_raccoon(ctx, -70 + b * 70, 10, 80, 1, raccoon_pose(t + b, "peek", baby=True))
        elif lab == "UNICORN":
            IN.unicorn(ctx, 0, 80, 0.17, "day", 1, t)
        else:
            RASCAL.head_only(ctx, 0, 0, 70, 1, {"view": "front", "neck_line": False, "inner": None})
        ctx.restore()
        heavy = sum(l2 for _, l2 in EXTRA[:i + 1]) + sum(l2 for _, l2 in MATH) > MAX_LB
        D.text(ctx, "+ %d LB  %s" % (lb, lab), 780, y + 20, 60, D.FONT_TITLE,
               hexrgb("#ff8a7a" if heavy else "#fff6d8"), "left")
    if over:
        pop_text(ctx, "TOO HEAVY", W - 380, 180, t, 0.3 + d * 0.2, 90, "#ff6a5a", dur=d, shake=True)


def shot_stays(ctx, t, S):
    """Гас крупно, тихо: «Что-то останется, малыш»."""
    d = S.cue(3) - S.cue(2)
    cam = Cam(IN.GUS_RADIO_X - 620, 420, Keys((0, 1.35), (d, 1.5)))
    gus_radio(ctx, t, cam, 1.0 if t < d * 0.8 else 0.0, "sad", "night")
    speech(ctx, 1380, 220, "SOMETHING STAYS, KID.", t, 0.2, 64, tail=(-1, 1))


def shot_look(ctx, t, S):
    """Башня ночью: Тео сидит и смотрит — на единорога, на Бандит с малышами, на голову Раскала. Долго."""
    d = S.dur - S.cue(3)
    L = S.cue(3, True) - S.cue(3) + 0.1        # «на единорога… на Бандит… на Раскала, долго»
    A, B = L * 0.3, L * 0.52
    bx = IN.TOWER_BED_X
    TX = 1600
    UNI_X = 200
    HEAD_X = IN.TOWER_CRATE_X - 40
    stage = 0 if t < A else (1 if t < B else 2)
    tx = (UNI_X, bx + 150, HEAD_X)[stage]
    if stage < 2:
        cam = Cam((TX + tx) / 2, 470, 0.8)
    else:
        cam = Cam(Keys((B, (TX + HEAD_X) / 2), (d, 1000, "io")), Keys((B, 470), (d, 500)),
                  Keys((B, 0.8), (d, 1.2, "io")))
    room_back(ctx, t, cam, "tower_night_0", lambda c: IN.tower_room(c, "night", beam=0.0),
              (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        IN.unicorn(ctx, UNI_X, IN.FL + 20, 0.7, "night", 1, t)
        draw_raccoon(ctx, bx + 120, IN.FL - 165, 95, -1, raccoon_pose(t, "sleep"))
        for b in range(3):
            draw_raccoon(ctx, bx + 230 + b * 55, IN.FL - 175, 60, -1, raccoon_pose(t + b, "sleep", baby=True))
        RASCAL.head_only(ctx, HEAD_X, IN.FL - 385, 112 * 1.15, 1, {"view": "front", "neck_line": False, "inner": None})
        p = floor_sit_pose(t, 1, "sad", hug=True)
        p.update(look=(1, -0.15))
        THEO_FUR_PATCH.draw(ctx, TX, IN.FL - 20, 112, 1 if tx > TX else -1, p)
    fx.darkness(ctx, 0.35, [fx.Light(*cam.to_screen(t, tx, 420), 700, power=0.5, glow_a=0.0),
                            fx.Light(*cam.to_screen(t, TX, 650), 400, power=0.3, glow_a=0.0)])
    if stage == 2 and t > B + 1.0:
        pop_text(ctx, "...", W / 2 + 360, 260, t, B + 1.0, 120, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_math, "fade", 0.4),
        Shot(c(1) - 0.1, shot_pile, "fade", 0.3),
        Shot(c(2) - 0.1, shot_stays, "fade", 0.3),
        Shot(c(3) - 0.1, shot_look, "fade", 0.5),
    ]
    S.tods = [(0, "night")]
    d1 = c(2) - c(1)
    S.sfx += [(0.2, "radio_beep", 0.7), (c(0) + (c(1) - c(0)) * 0.3, "pencil", 0.7)]
    S.sfx += [(c(1) + 0.3 + i * d1 * 0.2, "thud", 0.6) for i in range(4)]
    S.sfx += [(c(1) + 0.3 + 3 * d1 * 0.2, "buzzer", 0.8), (c(3) + 0.5, "crickets", 0.5)]
    S.music = [(0, "mystery", 0.7), (c(1), "tension", 0.8), (c(2), "lonely", 0.9)]
