"""День 24: гроза с озера, молния в вышку — свет гаснет во всём аэропорту, насовсем. Нет энергии — нет
динамиков — нет объявления. Дождь всю ночь. Уолт: «В каждом аэропорту есть генератор, сынок. Найди его»."""
from scenes.kit import *
from scenes.shared import *
from scenes.d11 import hangar_bg, ROSIE_X


def bolt(t, times):
    a = 0.0
    for t0 in times:
        k = t - t0
        if 0 <= k < 0.35:
            a = max(a, (1 - k / 0.35) * (1.0 if k > 0.06 or k < 0.03 else 0.4))
    return a


def bolt_line(ctx, x, y0, y1, seed, a, w=7):
    if a <= 0:
        return
    r = rng(seed)
    pts = [(x, y0)]
    y = y0
    while y < y1:
        y += r.uniform(40, 90)
        pts.append((pts[-1][0] + r.uniform(-60, 60), y))
    pts[-1] = (x + r.uniform(-20, 20), y1)
    D.polyline(ctx, pts, hexrgb("#ffffff"), w, a)
    D.polyline(ctx, pts, hexrgb("#bfe0ff"), w * 2.3, a * 0.4)


def shot_storm(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 2600), (d, 3000)), 500, 0.5, shake=0.1)
    apron_back(ctx, t, cam, "storm", 1.0, clouds=True, x0=-400, x1=6000)
    with layer(ctx, cam, t, 0.3):
        SEA.cloudbank(ctx, -2000, 8000, AP.HZ - 500, "storm", seed=24, n=14, s0=1.6, s1=2.4)
        bolt_line(ctx, 5200, -1200, AP.HZ - 60, 3, bolt(t, (0.8, 2.6)))
    fx.flash(ctx, bolt(t, (0.8, 2.6)) * 0.5, "#e8f0ff")
    SEA.rain_streaks(ctx, t, 0, 0, W, H, 1.2, 0.5, alpha=0.4, speed=1.4)


def shot_strike(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_HIT = 0.6
    T_OFF = T_HIT + 0.6
    cam = Cam(AP.TOWER_X, 300, Keys((0, 0.75), (T_HIT, 0.8)), shake=lambda q: shake_k(q, T_HIT, 0.8, 2.2))
    power = 1.0 if t < T_OFF else 0.0
    apron_back(ctx, t, cam, "night", power, clouds=False, x0=1400, x1=5200)
    with layer(ctx, cam, t, 0.3):
        SEA.cloudbank(ctx, -2000, 8000, -300, "storm", seed=25, n=12, s0=1.4, s1=2.2)
    with layer(ctx, cam, t):
        a = bolt(t, (T_HIT,))
        bolt_line(ctx, AP.TOWER_X, -1400, -90, 8, a, 12)
        if T_HIT < t < T_HIT + 1.5:
            for k in range(8):
                ang = k * TAU / 8 + t * 3
                D.line(ctx, AP.TOWER_X, -94, AP.TOWER_X + math.cos(ang) * 120, -94 + math.sin(ang) * 120,
                       hexrgb("#ffe36a"), 6, 1 - (t - T_HIT) / 1.5)
    fx.flash(ctx, bolt(t, (T_HIT,)) * 0.8, "#e8f0ff")
    SEA.rain_streaks(ctx, t, 0, 0, W, H, 1.2, 0.5, alpha=0.4, speed=1.4)
    if t > T_HIT:
        pop_text(ctx, "KRAKOOM!", W / 2 + 300, 250, t, T_HIT, 150, "#fff6d8", dur=1.4)
    if t > T_OFF:
        pop_text(ctx, "LIGHTS OUT.", W / 2 - 400, 420, t, T_OFF + 0.4, 90, "#cfd8e0", dur=d, shake=False)


def shot_dead(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0a0f2a"), (1, "#1a2650")])
    for i, (txt, icon) in enumerate((("NO POWER", 0), ("NO SPEAKERS", 1), ("NO BOARDING CALL", 2))):
        t0 = i * d * 0.25
        if t < t0:
            continue
        k = ease_out_back(clamp((t - t0) / 0.3))
        x = 360 + i * 600
        ctx.save()
        ctx.translate(x, 460)
        ctx.scale(k, k)
        D.circle(ctx, 0, 0, 180, hexrgb("#fff6d8"), D.INK, 8)
        if icon == 0:
            D.poly(ctx, [(-20, -110), (60, -110), (10, -10), (70, -10), (-40, 120), (0, 10), (-60, 10)],
                   hexrgb("#f2c230"), D.INK, 5, wob=0)
        elif icon == 1:
            D.rrect(ctx, -90, -60, 80, 120, 14, hexrgb("#2b2f3a"), D.INK, 5)
            D.poly(ctx, [(-10, -60), (80, -120), (80, 120), (-10, 60)], hexrgb("#2b2f3a"), D.INK, 5, wob=0)
        else:
            D.line(ctx, 0, 100, 0, -40, D.INK, 10)
            D.ellipse(ctx, 0, -60, 30, 44, hexrgb("#2b2f3a"), D.INK, 5)
        D.line(ctx, -130, -130, 130, 130, hexrgb("#e8423c"), 24)
        D.line(ctx, 130, -130, -130, 130, hexrgb("#e8423c"), 24)
        ctx.restore()
        D.text(ctx, txt, x, 720, 50, D.FONT_TITLE, hexrgb("#fff6d8"), alpha=k)


def shot_rain(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(1300, 620, 0.85)
    hangar_bg(ctx, t, cam, "deepnight", 0.0)
    with layer(ctx, cam, t):
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "night")
        p = floor_sit_pose(t, 1, "sad", hug=True)
        DANNY_JACKET.draw(ctx, 1750, RM.FL + 60, 112, 1, p)
        draw_lab(ctx, 1980, RM.FL + 60, 100, -1, dog_pose(t, "lie"))
    fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, 1850, RM.FL - 200), 420, power=0.5, glow_a=0.0)])
    SEA.rain_streaks(ctx, t, 0, 0, W, 400, 1.6, 0.3, alpha=0.4, speed=1.6)
    for k in range(4):
        pop_text(ctx, "drum", 300 + k * 420, 160 + (k % 2) * 60, t, k * 0.5, 50, "#9fb0d0", dur=0.8, shake=False)
    fx.flash(ctx, bolt(t, (1.5,)) * 0.4, "#e8f0ff")


def shot_walt(ctx, t, S):
    d = S.dur - S.cue(4)
    end = S.cue(4, True) - S.cue(4)
    T_TALK = max(0.5, end - 3.3)
    T_GO = max(T_TALK + 1.2, end - 1.0)
    cam = Cam(OS.RADIO_X - 240, 520, Keys((0, 1.6), (d, 1.9)))
    walt_radio(ctx, t, cam, 1.0 if T_TALK < t < end + 0.3 else 0.0, "determined", "night")
    if t > T_TALK:
        speech(ctx, W / 2 + 380, 220, "EVERY AIRPORT HAS A GENERATOR.", t, T_TALK, 44, tail=(-1, 1),
               dur=T_GO - T_TALK)
        speech(ctx, W / 2 + 380, 220, "GO FIND IT.", t, T_GO, 70, tail=(-1, 1))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_storm, "fade", 0.3),
        Shot(c(1) - 0.1, shot_strike),
        Shot(c(2) - 0.1, shot_dead, "black", 0.3),
        Shot(c(3) - 0.1, shot_rain, "fade", 0.3),
        Shot(c(4) - 0.1, shot_walt, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(0.8, "thunder", 0.9), (c(1) + 0.6, "thunder", 1.0), (c(1) + 1.2, "power_down", 1.0),
              (c(3) + 1.5, "thunder", 0.7)]
    S.music = [(0, "storm", 1.0), (c(4), "hope", 0.7)]
