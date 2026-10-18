"""День 10: урок первый. Тренажёр в центре подготовки пилотов трясётся, наклоняется и кричит при
крушении. Падаешь снова и снова. Уолт по рации: тангаж, газ, дыши. К полуночи — 23 крушения.
Пиклз больше не смотрит."""
from scenes.kit import *
from scenes.shared import *

POD_X = 2900


def sim_bg(ctx, t, cam, power=1.0):
    room_back(ctx, t, cam, "simroom_%s" % power, lambda c: RM.sim_room(c, power), (-1400, -1800, 6000, 3600), 0.7)


def sim_view(c, t, bank=0.0, pitch=0.0, run=0.0, tod="day", crash=0.0):
    """Картинка тренажёра за стёклами кабины (координаты кабины, окно ~ x ±1000, y -260..160)."""
    c.save()
    c.translate(0, -40 + pitch * 300)
    c.rotate(bank)
    SEA.sky(c, -2400, -1600, 4800, 1600, tod)
    D.rect(c, -2400, 0, 4800, 1600, tone("#7cc464", tod), None, 0, wob=0)
    D.poly(c, [(-30, 0), (30, 0), (900, 900), (-900, 900)], tone("#5a636e", tod), None, 0, wob=0)
    for k in range(8):
        u = ((k + run) % 8) / 8
        y0, y1 = 900 * u ** 2, 900 * min(1, u + 0.05) ** 2
        D.rect(c, -6 - 30 * u, y0, 12 + 60 * u, y1 - y0, tone("#f4f4f0", tod), None, 0, wob=0)
    c.restore()
    if crash > 0:
        D.rect(c, -1400, -400, 2800, 800, hexrgb("#e8423c"), None, 0, wob=0, alpha=0.6 * crash)
        r = rng(int(t * 20))
        for k in range(10):
            y = r.uniform(-300, 200)
            D.rect(c, -1200, y, 2400, r.uniform(6, 20), hexrgb("#ffffff"), None, 0, wob=0, alpha=0.5 * crash)


def shot_lesson(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 1900), (d, 2100)), 360, 0.8)
    sim_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        RM.sim_pod(ctx, POD_X, RM.FL, 0.9, 0.0)
        w = Walk(Keys((0, 1300), (d + 0.5, 2100, "lin")), RM.FL, 115, "walk", t1=d + 2)
        w.draw(ctx, DANNY_JACKET, t, {"face": "determined"})
    k = ease_out_back(clamp(t / 0.35))
    ctx.save()
    ctx.translate(W / 2 - 300, 250)
    ctx.rotate(-0.05)
    ctx.scale(k, k)
    D.rrect(ctx, -300, -90, 600, 180, 24, hexrgb("#1f4a3a"), hexrgb("#8a5a34"), 14)
    D.text(ctx, "LESSON 1", 0, 30, 96, D.FONT_HAND, hexrgb("#fbfaf6"))
    ctx.restore()


def shot_shake(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    T_IN = d * 0.45
    if t < T_IN:
        cam = Cam(POD_X - 300, 100, 0.55, shake=0.15)
        sim_bg(ctx, t, cam)
        with layer(ctx, cam, t):
            RM.sim_pod(ctx, POD_X, RM.FL, 0.9, 0.12 * math.sin(t * 4), heave=40 * math.sin(t * 6))
        for i, (txt, t0) in enumerate((("SHAKES", 0.3), ("TILTS", 1.2), ("SCREAMS", 2.1))):
            pop_text(ctx, txt, 360 + i * 600, 260 + (i % 2) * 80, t, t0, 90, "#ffe36a", dur=2.0)
        return
    tt = t - T_IN
    bank = 0.6 * math.sin(tt * 2.2)
    cam = Cam(0, 120, 0.85, -bank * 0.15, shake=0.3)
    cockpit_scene(ctx, tt, cam, "day", 1.0, view=lambda c: sim_view(c, tt, bank, 0.3 * math.sin(tt * 3), tt * 4))
    with layer(ctx, cam, tt):
        RM.yoke(ctx, -620, 560, 0.85, bank * 0.6)
        RM.yoke(ctx, 620, 560, 0.85, bank * 0.6)
    if (tt * 3) % 1 < 0.6:
        D.rrect(ctx, W / 2 - 260, 140, 520, 120, 20, hexrgb("#e8423c"), D.INK, 6)
        D.text(ctx, "PULL UP!", W / 2, 226, 80, D.FONT_TITLE, hexrgb("#fff6d8"))


def shot_crash(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    n = 1 + int(t / (d / 3))
    tt = t % (d / 3)
    cam = Cam(0, 120, 0.85, shake=lambda q: shake_k(tt, 0.0, 0.4, 2.0))
    cockpit_scene(ctx, t, cam, "day", 1.0, view=lambda c: sim_view(c, t, -0.9, 0.6, 0.0, crash=clamp(1 - tt * 2)))
    pop_text(ctx, "CRASH!", W / 2, 300, tt, 0.0, 150, "#ffe36a", dur=d / 3)
    counter_badge(ctx, "CRASHES", n, W - 300, 160, "#ff4a3a", 460)


def shot_walt(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    camL = Cam(0, 300, 0.95)
    camR = Cam(OS.RADIO_X - 120, 560, 1.25)
    diag_split(ctx, lambda c: danny_radio(c, t, camL, 0.0, "determined", DANNY_JACKET, "day"),
               lambda c: walt_radio(c, t, camR, 1.0, "smile", "dusk"), 1.0)
    for i, w in enumerate(("PITCH.", "POWER.", "BREATHE.")):
        t0 = d * 0.3 + i * d * 0.2
        pop_text(ctx, w, 1450, 250 + i * 120, t, t0, 90, ["#ffe36a", "#ff9a3c", "#9fd8ec"][i], dur=d, shake=False)


def shot_midnight(ctx, t, S):
    d = S.dur - S.cue(4)
    cam = Cam(Keys((0, 2300), (d, 2400)), 500, Keys((0, 0.75), (d, 0.85)))
    sim_bg(ctx, t, cam, 1.0)
    with layer(ctx, cam, t):
        RM.sim_pod(ctx, POD_X, RM.FL, 0.9, 0.08 * math.sin(t * 5), heave=20 * math.sin(t * 7))
        draw_lab(ctx, 1700, RM.FL, 105, -1, dog_pose(t, "lie", wag=0.0))
    fx.darkness(ctx, 0.35, [fx.Light(*cam.to_screen(t, POD_X, 200), 700, power=0.6, glow_a=0.0)])
    n = min(23, 4 + int(t * 5))
    counter_badge(ctx, "CRASHES", n, 380, 180, "#ff4a3a", 520)
    clock_badge(ctx, "00:00", t, 380, 330)
    for k in range(3):
        pop_text(ctx, "z", 640 + k * 50, 700 - k * 50, t, 0.8 + k * 0.4, 50 + k * 10, "#fff6d8", dur=1.4, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_lesson),
        Shot(c(1) - 0.1, shot_shake, "whip", 0.25),
        Shot(c(2) - 0.1, shot_crash),
        Shot(c(3) - 0.1, shot_walt, "fade", 0.25),
        Shot(c(4) - 0.1, shot_midnight, "fade", 0.3),
    ]
    S.tods = [(0, "day"), (c(4), "night")]
    S.sfx += [(c(1) + 0.3, "hydraulic", 0.8), (c(1) + (c(2) - c(1)) * 0.45, "alarm", 0.8), (c(2), "crash_sim", 1.0),
              (c(2) + (c(3) - c(2)) / 3, "crash_sim", 0.9), (c(2) + 2 * (c(3) - c(2)) / 3, "crash_sim", 0.8)]
    S.music = [(0, "comic", 0.9), (c(3), "hope", 0.7)]
