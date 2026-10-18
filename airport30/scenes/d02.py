"""День 2: кто-то нюхает ботинок — палевый лабрадор в жилетке K-9, на жетоне «Пиклз». Ищет фрукты
в чемоданах и находит тебе сэндвич. Наверху все табло: рейсы отменены, аэропорт закрыт."""
from scenes.kit import *
from scenes.shared import *


def hall(ctx, t, cam, power=0.0):
    room_back(ctx, t, cam, "baghall_%s" % power, lambda c: RM.baggage_hall(c, power), (-1400, -1600, 7400, 3400),
              0.7)


def shot_sniff(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 760), (d, 720)), Keys((0, 760), (d, 740)), Keys((0, 2.6), (d, 2.2)))
    hall(ctx, t, cam)
    with layer(ctx, cam, t):
        p = floor_sit_pose(t, 1, "sleep")
        p.update(blink=1.0, neck=0.4, f1=(1.1, 0.0), f2=(1.0, 0.0))
        DANNY.draw(ctx, 520, RM.FL, 110, 1, p)
        sn = math.sin(t * 14)
        draw_lab(ctx, 860, RM.FL, 110, -1, dog_pose(t, "stand", look=0.6 + 0.1 * sn, wag=1.0))
    fx.darkness(ctx, 0.35, [fx.Light(W / 2, H / 2, 700, power=0.6, glow_a=0.0)])
    for k in range(3):
        pop_text(ctx, "sniff", 1150 + k * 140, 520 - k * 70, t, 0.3 + k * 0.45, 60, "#fff6d8", rot=0.1, dur=0.8)


def shot_pickles(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_TAG = d * 0.62
    if t < T_TAG:
        cam = Cam(Keys((0, 760), (T_TAG, 820)), 640, Keys((0, 1.5), (T_TAG, 1.8)))
        hall(ctx, t, cam)
        with layer(ctx, cam, t):
            p = floor_sit_pose(t, 1, "shock")
            p.update(blink=0, hturn=0.8)
            DANNY.draw(ctx, 520, RM.FL, 110, 1, p)
            draw_lab(ctx, 880, RM.FL, 120, -1, dog_pose(t, "sit", wag=1.0))
        fx.darkness(ctx, 0.3, [fx.Light(W / 2, H / 2, 800, power=0.6, glow_a=0.0)])
        pop_text(ctx, "K-9 CUSTOMS", W / 2 + 330, 250, t, 0.4, 80, "#2f6fd0", dur=T_TAG, shake=False)
        return
    tt = t - T_TAG
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2f6fd0"), (1, "#1c3f7c")])
    k = ease_out_back(clamp(tt / 0.4))
    ctx.save()
    ctx.translate(W / 2, H / 2 + 40)
    ctx.rotate(math.sin(tt * 3) * 0.08)
    ctx.scale(k, k)
    D.line(ctx, 0, -360, 0, -200, D.INK, 10)
    D.circle(ctx, 0, 0, 200, hexrgb("#e3b84a"), D.INK, 10)
    D.circle(ctx, 0, 0, 170, None, hexrgb("#c99a2a"), 6)
    D.circle(ctx, 0, -170, 18, hexrgb("#1c3f7c"), D.INK, 4)
    D.text(ctx, "PICKLES", 0, 30, 68, D.FONT_TITLE, hexrgb("#1c3f7c"))
    D.text(ctx, "K-9 · CUSTOMS", 0, 90, 34, D.FONT_TITLE, hexrgb("#6a4a1a"))
    ctx.restore()
    draw_lab(ctx, 330, 1000, 200, 1, dog_pose(tt, "sit", wag=1.0, look=-0.2))


def shot_fruit(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_POP, T_SAND = d * 0.25, d * 0.55
    cam = Cam(Keys((0, 1300), (T_SAND, 1100), (d, 900)), 620, Keys((0, 1.2), (d, 1.4)))
    hall(ctx, t, cam)
    with layer(ctx, cam, t):
        RM.belt(ctx, 700, 2400, 690, t, 0.0)
        r = rng(5)
        for k in range(6):
            bx = 820 + k * 260
            if k == 3 and t > T_POP:
                D.rrect(ctx, bx - 55, 610, 110, 70, 10, hexrgb("#7a4fc2"), D.INK, 3)
                D.poly(ctx, [(bx - 55, 610), (bx + 55, 610), (bx + 40, 540), (bx - 70, 560)], hexrgb("#8f62d6"),
                       D.INK, 3, wob=0)
                for j in range(7):
                    kk = clamp((t - T_POP) / 0.8)
                    a = -math.pi / 2 + (j - 3) * 0.35
                    fx_ = bx + math.cos(a) * 260 * kk
                    fy_ = 590 + math.sin(a) * 260 * kk + 400 * kk * kk
                    c = ["#e8423c", "#f2c230", "#3fbf6a", "#ff9a3c"][j % 4]
                    D.circle(ctx, fx_, fy_, 20, hexrgb(c), D.INK, 3)
            else:
                D.rrect(ctx, bx - 55, 610, 110, 70, 10, hexrgb(r.choice(RM.BAG_COLS)), D.INK, 3)
        if t < T_SAND:
            draw_lab(ctx, 1550, RM.FL, 110, -1, dog_pose(t, "stand", look=-0.3, bark=1.0 if t > T_POP - 0.3 else 0))
        else:
            k = clamp((t - T_SAND) / 1.0)
            x = lerp(1550, 900, smooth(k))
            draw_lab(ctx, x, RM.FL, 110, -1, dog_pose(t, "trot" if k < 1 else "sit", phase=t * 3, wag=1.0))
            D.rrect(ctx, x - 140, RM.FL - 120, 70, 36, 10, hexrgb("#f2d28a"), D.INK, 3)
            D.rect(ctx, x - 136, RM.FL - 108, 62, 8, hexrgb("#3fbf6a"), None, 0, wob=0)
        p = R.stand("side", t, 1)
        happy = t > T_SAND + 1.0
        p.update(face="laugh" if happy else "shock", hturn=0.8, blink=0)
        DANNY.draw(ctx, 650, RM.FL, 110, 1, p)
    if t > T_POP:
        pop_text(ctx, "FRUIT!", W / 2 + 200, 250, t, T_POP, 110, "#3fbf6a", dur=1.6)
    if t > T_SAND + 0.5:
        pop_text(ctx, "SANDWICH!", W / 2 - 300, 250, t, T_SAND + 0.5, 110, "#ffe36a", dur=3)


def shot_screens(ctx, t, S):
    d = S.dur - S.cue(3)
    msgs = [("ALL FLIGHTS", "CANCELLED"), ("AIRPORT", "CLOSED"), ("STAY WHERE", "YOU ARE")]
    i = min(2, int(t / (d * 0.28)))
    cam = Cam(Keys((0, 900), (d, 1300)), 380, Keys((0, 0.75), (d, 0.85)))
    term_back(ctx, t, cam, "day", 1.0, "B")
    with layer(ctx, cam, t):
        crowd_floor(ctx, t, 21, 12, -400, 3000, TM.FL + 20, TM.FL + 260, 105, 135, vx=(-30, 30))
    # большое табло
    ctx.save()
    ctx.translate(W / 2, 360)
    ctx.rotate(-0.02)
    D.rrect(ctx, -560, -190, 1120, 380, 26, hexrgb("#15181f"), D.INK, 10)
    a, b = msgs[i]
    blink = 1.0 if (t * 2) % 1 < 0.8 else 0.4
    D.text(ctx, a, 0, -30, 110, D.FONT_TITLE, hexrgb("#ff4a3a"), alpha=blink)
    D.text(ctx, b, 0, 110, 110, D.FONT_TITLE, hexrgb("#ff4a3a"), alpha=blink)
    ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_sniff, "fade", 0.4),
        Shot(c(1) - 0.1, shot_pickles),
        Shot(c(2) - 0.1, shot_fruit, "whip", 0.25),
        Shot(c(3) - 0.1, shot_screens, "fade", 0.3),
    ]
    S.sfx += [(0.3, "sniff", 0.8), (c(1) + 0.4, "bark", 0.7), (c(2) + (c(3) - c(2)) * 0.25, "pop", 0.8),
              (c(3), "alarm", 0.6)]
    S.music = [(0, "wonder", 0.8), (c(3), "dread", 0.8)]
