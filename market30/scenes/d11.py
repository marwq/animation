"""День 11: три часа ночи, стук — не снаружи, изнутри. Из-за ставни аптеки, запертой с нулевого дня.
Тук. Тук-тук. Час с черенком швабры — и стучишь в ответ. Тук. Тук-тук. Там всё это время кто-то был."""
import cairo

from scenes.kit import *

HERO = ST.HERO
SH = (520, 440, 2130, 1032)                   # окно аптеки под ставней
PH_HZ, PH_A = 800, 0.12


def shot(start, fn, trans="cut", tlen=0.3):
    return Shot(start, lambda ctx, t, S, f=fn, s0=start: f(ctx, s0 + t, S), trans, tlen)


def multiply(ctx, color, alpha, rect=None):
    if alpha <= 0:
        return
    ctx.save()
    if rect:
        ctx.rectangle(*rect)
        ctx.clip()
    ctx.set_operator(cairo.OPERATOR_MULTIPLY)
    D.col(ctx, hexrgb(color), alpha)
    ctx.paint()
    ctx.restore()


def taps(S):
    """Моменты стуков из-за ставни: «Tap. Tap tap.» в репликах 3 и 5 + тихий стук в реплике 1."""
    w = S.word
    out = [w("tapping", S.cue(1)) - 0.05]
    for i in (3, 5):
        a = w("tap", S.cue(i))
        b = w("tap", a + 0.2)
        out += [a, b, b + 0.22]
    return out


def tap_shake(T, S):
    for t in taps(S):
        u = T - t
        if 0 <= u < 0.25:
            return 4 * math.exp(-u * 20) * math.sin(u * 80)
    return 0.0


def wake(ctx, T, S):
    """Лагерь на складе, ночь: герой спит; на стук открывает глаза, приподнимается."""
    l = T - (S.cue(1) - 0.3)
    t_tap = taps(S)[0]
    t_inside = S.word("inside", S.cue(1)) - 0.3
    cam = PlateCam("base_camp", 1500, 1080, Keys((0, 1.3), (6, 1.38, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "base_camp")
        multiply(ctx, "#20263a", 0.82)
        awake = T > t_tap
        p = pose(T, 3, face="scared" if T > t_inside else ("worried" if awake else "sleep"), look=(0.5, 0.0),
                 blink=not awake, sweat=T > t_inside)
        lying(ctx, 2000, 1420, 90, p, HERO, tint=("#3a4868", 0.45), bag="#3a6aa8")
    if T > t_tap:
        fx.flash(ctx, 0.0)


def approach(ctx, T, S):
    """С фонариком к аптеке: ставня закрыта, за ней тихо."""
    l = T - (S.cue(2) - 0.3)
    cam = PlateCam("pharmacy_shutter", 1360, 900, Keys((0, 1.0), (5, 1.08, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "pharmacy_shutter")
        roll_shutter(ctx, *SH, shake=tap_shake(T, S))
        multiply(ctx, "#20263a", 0.75)
        gy = 1480
        r = persp(gy, PH_A, PH_HZ)
        k = clamp(l / 2.6)
        x = lerp(2500, 1700, smooth(k))
        p = pose(T, 3, face="scared", look=(0.5, -0.2), h1=(1.4, -3.9), h2=(0.2, -2.4), sweat=True)
        if k < 1:
            p.update(ST.gait((2500 - x) / (ST.WALK_STRIDE * r)))
            p.update(h1=(1.4, -3.9), h2=(0.2, -2.4))
        J = figure(ctx, x, gy, r, -1, p, HERO, tint=("#3a4868", 0.35))
        hx, hy = at(J, x, gy, r, -1, "h1")
    sx, sy = cam.to_screen(l, hx, hy)
    flashlight(ctx, sx, sy, math.pi + 0.18, 1300, 0.28, 0.4)
    D.rrect(ctx, sx - 34, sy - 12, 50, 24, 8, hexrgb("#3b3f44"), INK, 4)


def tap_close(ctx, T, S):
    """Крупно на ставню: на каждый стук — кольца и дрожь ламелей."""
    l = T - (S.cue(3) - 0.3)
    cam = PlateCam("pharmacy_shutter", 1320, 760, 2.0)
    with on(ctx, cam, l):
        paint(ctx, "pharmacy_shutter")
        roll_shutter(ctx, *SH, shake=tap_shake(T, S))
        multiply(ctx, "#20263a", 0.7)
        for t in taps(S):
            ripple(ctx, 1320, 760, T - t, 1.4)
    flashlight(ctx, W + 40, H * 0.7, math.pi + 0.25, 1500, 0.3, 0.35)


def broom(ctx, T, S):
    """Час с черенком наготове — и стук в ответ."""
    l = T - (S.cue(4) - 0.3)
    t_back = S.word("back", S.cue(4)) - 0.25
    cam = PlateCam("pharmacy_shutter", 1500, 960, Keys((0, 1.35), (5, 1.42, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "pharmacy_shutter")
        roll_shutter(ctx, *SH, shake=tap_shake(T, S) + (3 * math.sin((T - t_back) * 70) * math.exp(-(T - t_back) * 15)
                                                       if T > t_back else 0))
        multiply(ctx, "#20263a", 0.72)
        gy = 1500
        r = persp(gy, PH_A, PH_HZ) * 1.05
        x = 1720
        hit = 0.0
        for d in (0.0, 0.32, 0.55):
            u = T - (t_back + d)
            if 0 <= u < 0.2:
                hit = math.sin(u / 0.2 * math.pi)
        p = pose(T, 3, face="determined" if T > t_back else "worried", look=(0.6, -0.1),
                 h1=(1.0 + 0.6 * hit, -4.2), h2=(0.6 + 0.6 * hit, -3.4), sweat=T < t_back)
        J = figure(ctx, x, gy, r, -1, p, HERO, tint=("#3a4868", 0.35))
        a = at(J, x, gy, r, -1, "h1")
        b = at(J, x, gy, r, -1, "h2")
        dx, dy = a[0] - b[0], a[1] - b[1]
        L = math.hypot(dx, dy) or 1
        tip = (a[0] + dx / L * 2.3 * r, a[1] + dy / L * 2.3 * r)
        tail = (b[0] - dx / L * 1.6 * r, b[1] - dy / L * 1.6 * r)
        D.line(ctx, tail[0], tail[1], tip[0], tip[1], INK, 14)
        D.line(ctx, tail[0], tail[1], tip[0], tip[1], hexrgb("#c9a26a"), 8)
        if T > t_back:
            for d in (0.0, 0.32, 0.55):
                ripple(ctx, tip[0], tip[1], T - (t_back + d), 1.0)
        # «час спустя»: свечка стала короче
        cx, cy = 2300, 1460
        h = lerp(150, 50, clamp(l / 3.5))
        D.rect(ctx, cx - 18, cy - h, 36, h, hexrgb("#f3ead2"), INK, 4, wob=0)
        D.ellipse(ctx, cx, cy - h - 22, 9, 18, hexrgb("#ffcf5a"), None, 0)
        fx.glow(ctx, cx, cy - h - 22, 120, "#ffcf7a", 0.25)


def answer(ctx, T, S):
    """Крупно: ответный стук — лицо героя."""
    l = T - (S.cue(5) - 0.3)
    t_some = S.word("somebody", S.cue(5)) - 0.2
    cam = PlateCam("pharmacy_shutter", 1300, 760, 1.8)
    blur_plate(ctx, "pharmacy_shutter", cam, 0, 0.0)
    with on(ctx, cam, 0):
        roll_shutter(ctx, *SH, shake=tap_shake(T, S))
        multiply(ctx, "#20263a", 0.72)
    for t in taps(S)[4:]:
        ripple(ctx, 640, 520, T - t, 1.6)
    x, gy, r = 1240, H + 640, 210
    p = pose(T, 3, face="shock" if T > t_some else "scared", look=(-0.6, -0.1), sweat=True, h1=(0.3, -2.3),
             h2=(-0.1, -2.4))
    figure(ctx, x, gy, r, -1, p, HERO, tint=("#3a4868", 0.3))


def build(S):
    c, w = S.cue, S.word
    S.shots = [
        Shot(0, day_shot(11)),
        shot(c(1) - 0.3, wake),
        shot(c(2) - 0.3, approach),
        shot(c(3) - 0.3, tap_close),
        shot(c(4) - 0.3, broom),
        shot(c(5) - 0.3, answer),
    ]
    S.amb = [(c(1) - 0.3, S.dur, "store_hum", 0.0)]
    S.sfx = [(0.0, "day_hit", 0.7)] + [(t, "tap", 0.8) for t in taps(S)]
    t_back = w("back", c(4)) - 0.25
    S.sfx += [(t_back + d, "tap", 0.6) for d in (0.0, 0.32, 0.55)]
    S.music = [(c(1) - 0.3, S.dur, "dread", 0.5)]
