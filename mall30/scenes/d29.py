"""День 29: СТРАЙК по эскалатору. Манекены играют музыку, орда уходит. Крыша, полночь, петли гнутся."""
from scenes.kit import *
from scenes.d27 import mannequin, mq_pose, phone_in_hand
from scenes.d21 import RED
from sets import stores as ST
from engine.core import bounce_out

COLS = ["#2f3d5c", "#c23b33", "#3f8a84", "#e2a33b", "#7a6aa3", "#1f1f24"]


def falling_zombie(ctx, look, x, gy, s, t, t_hit, seed):
    """Зомби на ступенях: до удара идёт, после — падает назад как кегля."""
    fig = R.Fig(look)
    if t < t_hit:
        fig.draw(ctx, x, gy, s, 1, R.gait(t * 1.6 + seed * 0.3, "shamble", "side", seed))
        return
    dt = t - t_hit
    k = clamp(dt / 0.45)
    ctx.save()
    ctx.translate(x - 60 * k - dt * 60, gy + 40 * k + dt * 30)
    ctx.rotate(-1.6 * ease_out(k))
    p = zombie_idle(t, seed)
    p.update(a1=(2.6, 0.3), a2=(2.4, 0.4), mouth=1.0)
    fig.draw(ctx, 0, 0, s, 1, p)
    ctx.restore()


def shot_strike(ctx, t, S):
    """Он толкает весь ряд — шары грохочут вниз, первые ряды падают как кегли."""
    T0 = 0.6
    cam = Cam(Keys((0, 1500), (T0, 1450), (3.5, 900)), Keys((0, 330), (T0, 360), (3.5, 650)),
              Keys((0, 1.4), (T0, 1.3), (3.5, 0.95)), shake=lambda t: 0.5 if t > T0 + 0.3 else 0.0)
    with layer(ctx, cam, t):
        bg(ctx, "esc_big_n", (-400, -400, 2800, 1700), ST.escalator_big)
        # зомби на эскалаторе
        for k in range(10):
            f = 0.62 - k * 0.07
            x, y = ST.esc_point(f) if f > 0 else (ST.ESC_LOW[0] + f * 1200, ST.ESC_LOW[1])
            hit = T0 + 0.4 + k * 0.16
            falling_zombie(ctx, R.zombie_look(2900 + k), x, y, 82, t, hit, k)
        # шары
        r = rng(29)
        for k in range(36):
            st = T0 + r.uniform(0, 1.2)
            if t < st:
                if k < 30:
                    ST.ball(ctx, 1570 + (k % 30) * 34, 278, 18, COLS[k % 6])
                continue
            dt = t - st
            f = 1.0 - dt * 0.55
            if f < -0.6:
                continue
            x, y = ST.esc_point(clamp(f, 0, 1)) if f > 0 else (ST.ESC_LOW[0] + f * 1500, ST.ESC_LOW[1])
            bounce = abs(math.sin(dt * 12 + k)) * 40
            ST.ball(ctx, x + r.uniform(-20, 20), y - 20 - bounce, 18, COLS[k % 6], rot=dt * 10)
        p = R.stand("side", t, 1)
        push = smooth(clamp((t - 0.2) / 0.4))
        p.update(lean=0.5 * push, h1=(0.7 + 0.3 * push, -0.7), h2=(0.6 + 0.3 * push, -0.65), face="determined")
        HERO.draw(ctx, 1640 + 30 * push, 300, 82, -1, p)
    fx.darkness(ctx, 0.5, [fx.Light(W / 2, 200, 1100, power=0.6, glow_a=0)])
    fx.grade(ctx, "night", 0.4)
    if t > T0 + 0.7:
        k = clamp((t - T0 - 0.7) / 0.2)
        ctx.save()
        ctx.translate(W / 2, 300)
        sc = ease_out_back(k)
        ctx.scale(sc, sc)
        ctx.rotate(-0.06)
        D.text(ctx, "STRIKE!", 0, 0, 220, D.FONT_TITLE, hexrgb("#ffd34a"), stroke=D.INK, slw=18)
        ctx.restore()


def fourth_floor(c):
    M.gallery(c, -400, 3600, "night", 0.1, {n: 1.0 for n, _, _ in M.STORES}, start=4)


def shot_play(ctx, t, S):
    """Он жмёт «play»: по всему этажу загораются телефоны в руках манекенов, ноты."""
    T = 0.5
    on = clamp((t - T) / 0.3)
    cam = Cam(Keys((0, 900), (5, 1600)), 560, 0.9)
    with layer(ctx, cam, t):
        bg(ctx, "fourth_n", (-400, -50, 4000, 1250), fourth_floor)
        for i in range(7):
            x = 200 + i * 430
            dance = math.sin(t * 6 + i) * 0.06 * on
            p = mq_pose(t, i)
            p["htilt"] = dance
            mannequin(i).draw(ctx, x, M.GAL_FLOOR + 30, 88, 1, p,
                              extra=lambda c, J, l, on=on: phone_in_hand(c, J, on) if l == "front" else None)
        from scenes.d01 import music_notes
        if on > 0:
            for i in range(7):
                music_notes(ctx, 230 + i * 430, M.GAL_FLOOR - 330, t + i * 0.3, 1.2, on)
    lights = [fx.Light(*cam.to_screen(t, 230 + i * 430, M.GAL_FLOOR - 210), 260 * cam.at(t)[2] + 1, power=0.9 * on,
                       glow="#9fe0ff", glow_a=0.35 * on) for i in range(7)]
    fx.darkness(ctx, 0.75, lights)
    fx.grade(ctx, "night", 0.4)


AWAY = None


def shot_turn_away(ctx, t, S):
    """Орда разворачивается на шум. Герой с Претцелем крадутся к лестнице на крышу и запирают дверь."""
    global AWAY
    cam = Cam(960, 600, 1.0)
    if AWAY is None:
        AWAY = make_crowd(2950, 24, -200, 2200, 880, 990, 60, 72, face=1)
    crowd = AWAY
    with layer(ctx, cam, t):
        bg(ctx, "fourth_n2", (-400, -50, 2800, 1250), lambda c: M.gallery(c, -400, 2400, "night", 0.1, {}, start=6))
        for m in crowd:
            m.vx = -45
            m.f = -1
        draw_crowd(ctx, crowd, t)
        w = Walk(Keys((0, 1700), (4, 2300, "lin")), 1000, 80, "sneak", t1=6)
        w.draw(ctx, HERO, t, {"face": "worried"})
        draw_dog(ctx, w.x(t) - 110, 1004, 64, 1, dog_pose(t, "trot", phase=w.dist(t) * 1.2, wag=0))
    fx.darkness(ctx, 0.62, [fx.Light(-100, 500, 900, power=0.7, glow="#9fe0ff", glow_a=0.2)])
    fx.grade(ctx, "night", 0.4)


def roof_night(c):
    C.sky(c, -1200, -1400, 4400, 2400, "deepnight", moon=(400, 200, 40))
    C.skyline(c, -1200, 3200, 720, "deepnight", depth=0, seed=171, esb_x=1300, hmin=220, hmax=520)
    CITY.roof(c, -1200, 3200, 860, "night", door=False)


def shot_midnight(ctx, t, S):
    """Полночь. Музыка смолкает: батарейки садятся — значки гаснут."""
    D.col(ctx, hexrgb("#14121a"))
    ctx.paint()
    D.text(ctx, "12:00 AM", W / 2, 220, 90, D.FONT_DAY, hexrgb("#f7eedb"), bold=True)
    for i in range(10):
        x = 300 + (i % 5) * 330
        y = 480 + (i // 5) * 260
        k = clamp((t - 0.3 - i * 0.12) / 0.2)
        lvl = 0.15 * (1 - k)
        D.rect(ctx, x - 60, y - 30, 120, 60, None, hexrgb("#f7eedb"), 5, wob=0)
        D.rect(ctx, x + 60, y - 12, 10, 24, hexrgb("#f7eedb"), None, 0, wob=0)
        D.rect(ctx, x - 52, y - 22, 104 * max(lvl, 0.0), 44, hexrgb("#d9483b"), None, 0, wob=0)
        if k >= 1:
            D.text(ctx, "0%", x, y + 80, 36, D.FONT_DAY, hexrgb("#d9483b"), bold=True)


def roof_dawn(c):
    C.sky(c, -1200, -1400, 4400, 2400, "dawn", sun=(300, 650, 70))
    C.skyline(c, -1200, 3200, 720, "dawn", depth=0, seed=171, esb_x=1300, hmin=220, hmax=520)
    CITY.roof(c, -1200, 3200, 860, "dawn", door=False)


ROOF_BG = {"deepnight": roof_night, "dawn": roof_dawn}


def roof_bg29(ctx, tod):
    bg(ctx, "roof_n29_" + tod, (-1200, -1400, 4400, 2800), ROOF_BG[tod])


def door_scene(ctx, t, bulge=0.0, cam=None, hero_brace=True, open_=0.0, tod="deepnight", crowd_out=0.0):
    with layer(ctx, cam, t):
        roof_bg29(ctx, tod)
        sh = math.sin(t * 30) * 8 * bulge
        ctx.save()
        ctx.translate(sh, 0)
        CITY.roof_door(ctx, 1450, 860, open_, tod)
        ctx.restore()
        if bulge > 0:
            D.col(ctx, D.INK)
            for k in range(3):
                D.circle(ctx, 1562 + sh, 680 + k * 70, 6, hexrgb("#d6b24c"), D.INK, 2)
        if hero_brace:
            p = R.stand("side", t, 1)
            push = math.sin(t * 9) * 0.04 * bulge
            p.update(lean=-0.35 + push, f1=(0.45, 0), f2=(0.15, 0), a1=(2.0, 1.4), a2=(1.8, 1.3), face="scared",
                     hturn=0.0, blink=0)
            HERO.draw(ctx, 1500 + sh, 885, 95, -1, p)
            draw_dog(ctx, 1290, 890, 80, 1, dog_pose(t, "lie", wag=0.0))


def shot_door(ctx, t, S):
    """Они у двери. Петли гнутся. Вертолёта нет."""
    cam = Cam(Keys((0, 1400), (6, 1300)), Keys((0, 640), (6, 600)), Keys((0, 1.3), (6, 1.0)),
              shake=lambda t: 0.2 + 0.3 * abs(math.sin(t * 2)))
    door_scene(ctx, t, 0.5 + 0.5 * abs(math.sin(t * 2.1)), cam)
    fx.darkness(ctx, 0.45, [fx.Light(*cam.to_screen(t, 400, 200), 1200, power=0.6, glow="#bcd2ff", glow_a=0.1)])
    fx.grade(ctx, "night", 0.6)
    for k in range(3):
        ph = (t * 1.5 + k / 3) % 1
        D.text(ctx, "BANG", 1500 + k * 90, 380 - ph * 100, 64, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=8,
               alpha=1 - ph, rot=-0.15 + k * 0.1)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_strike),
        Shot(c(2) - 0.1, shot_play),
        Shot(c(3) - 0.1, shot_turn_away),
        Shot(c(4) - 0.1, shot_midnight, "black", 0.3),
        Shot(c(5) - 0.1, shot_door),
    ]
    S.sfx += [(0.9, "balls_thunder", 1.2), (c(2) + 0.4, "music_phones", 0.8), (c(5), "door_bang", 1.0)]
