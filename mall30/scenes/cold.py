"""Холодный старт: день 28, 3 часа ночи — они приходят снизу. Этот же момент повторяется в дне 28."""
from scenes.kit import *

HORIZON = 300.0


def fs(y):
    """Масштаб фигуры на фудкорте по глубине."""
    return depth_s(y, HORIZON, 720, 78)


HATCH = [(1560, 905), (1880, 1010), (640, 960)]   # люки (центр, y передней кромки ~ y+20)
HERO_X, HERO_Y = 1130, 985
TABLE_X, TABLE_Y = 930, 1000


def _fc(ctx):
    # фудкорт без люков (люки рисуются отдельно, они двигаются)
    saved = M.HATCHES[:]
    M.HATCHES.clear()
    M.food_court(ctx, "night", lights=0.12)
    M.HATCHES.extend(saved)
    for k, (x, y) in enumerate([(300, 820), (2150, 860)]):
        M.table_set(ctx, x, y, fs(y) / 62, seed=k)


def camp_table(ctx, t, x=TABLE_X, y=TABLE_Y, s=None, flame=True):
    """Стол с походной плиткой, кастрюлькой и фонарём. Возвращает точку фонаря."""
    s = s or fs(y) / 62
    M.table_set(ctx, x, y, s, seed=7)
    top = y - 105 * s
    sx = x + 45 * s
    D.rect(ctx, sx - 40 * s, top - 22 * s, 80 * s, 22 * s, hexrgb("#4a4e5a"), D.INK, 3, wob=0)
    if flame:
        for k in range(3):
            fl = 8 * s * (1 + 0.3 * math.sin(t * 20 + k))
            D.col(ctx, "#6ab0ff", 0.9)
            ctx.move_to(sx - 24 * s + k * 16 * s, top - 22 * s)
            ctx.line_to(sx - 19 * s + k * 16 * s, top - 22 * s - fl)
            ctx.line_to(sx - 14 * s + k * 16 * s, top - 22 * s)
            ctx.fill()
    D.rect(ctx, sx - 34 * s, top - 58 * s, 68 * s, 34 * s, hexrgb("#b9b6ae"), D.INK, 3, wob=0)
    D.line(ctx, sx + 34 * s, top - 50 * s, sx + 60 * s, top - 56 * s, D.INK, 4 * s)
    # фонарь
    lx = x - 60 * s
    D.rect(ctx, lx - 15 * s, top - 56 * s, 30 * s, 56 * s, hexrgb("#3f8a84"), D.INK, 3, wob=0)
    D.rect(ctx, lx - 10 * s, top - 48 * s, 20 * s, 34 * s, hexrgb("#fff2c0"), D.INK, 2, wob=0)
    return (lx, top - 30 * s)


def hatch_draw(ctx, t, i, open_k, shake=0.0):
    x, y = HATCH[i]
    s = fs(y) / 110
    dx = math.sin(t * 60) * 6 * shake
    M.hatch(ctx, x + dx, y, open_k, s)


def emerging(ctx, t, i, k, seed, look=None):
    """Зомби вылезает из люка i: k=0 — внутри, k=1 — стоит на полу."""
    x, y = HATCH[i]
    s = fs(y)
    hole_front = y + 22 * s / 110
    gy = y + 4.0 * s * (1 - smooth(k)) + 4
    fig = R.Fig(look or R.zombie_look(seed))
    ctx.save()
    if k < 1:
        ctx.rectangle(x - 600, -2000, 1200, hole_front + 2000)
        ctx.clip()
    p = zombie_reach(t, seed) if k > 0.3 else zombie_idle(t, seed, "side")
    if k < 0.6:
        p = dict(p)
        p.update(a1=(2.6, -0.3), a2=(2.4, -0.2), lean=0.0, neck=0.1)   # руки вверх — цепляется за край
    fig.draw(ctx, x, gy, s, -1, p)
    ctx.restore()


def shot_stove(ctx, t, S):
    """Герой греет молоко, рядом Претцель. Медленный проезд камеры."""
    cam = Cam(Keys((0, 1000), (6, 1090)), 690, Keys((0, 1.35), (6, 1.5)), drift=1)
    with layer(ctx, cam, t):
        bg(ctx, "fc_night", (-400, 0, 2800, 1300), _fc)
        for i in range(3):
            hatch_draw(ctx, t, i, 0.0)
        lamp = camp_table(ctx, t)
        p = R.stand("side", t, 3)
        stir = math.sin(t * 4)
        p.update(h1=(0.95 + 0.06 * stir, -1.95 + 0.04 * math.cos(t * 4)), neck=0.25, lean=0.2, look=(0.3, 0.4))
        HERO.draw(ctx, HERO_X, HERO_Y, fs(HERO_Y), -1, p)
        draw_dog(ctx, HERO_X + 150, HERO_Y + 20, fs(HERO_Y) * 0.95, -1, dog_pose(t, "sit", wag=0.6))
    lx, ly = cam.to_screen(t, *lamp)
    fx.darkness(ctx, 0.78, [fx.Light(lx, ly, 620, glow="#ffcf80", glow_a=0.3),
                            fx.Light(*cam.to_screen(t, 1100, 60), 380, power=0.45, glow="#9fb0e0", glow_a=0.1)])
    fx.grade(ctx, "night", 0.6)


def _entrance_night(ctx, t, crowd, press):
    M.entrance_outside(ctx, "night", lit=0.0)
    draw_crowd(ctx, crowd, t)
    for k, (x, y, sd) in enumerate(press):
        p = zombie_reach(t, sd)
        p.update(a1=(1.55 + 0.05 * math.sin(t * 3 + k), -0.35), a2=(1.45, -0.25))
        R.Fig(R.zombie_look(sd)).draw(ctx, x, y, 66, 1 if k % 2 else -1, p)
    M.entrance_glass(ctx, 0.0, sensor=0.0, tint=0.36)
    M.entrance_interior(ctx, "night", lights=0.0)


CROWD_N = None


def _crowd():
    global CROWD_N
    if CROWD_N is None:
        CROWD_N = make_crowd(281, 60, -300, 2200, 645, 735, 18, 48)
    return CROWD_N


def barricade(ctx, t=0.0, k=1.0):
    """Баррикада у дверей (k — сколько предметов уже стоит)."""
    if k > 0.0:
        C.bench(ctx, 700, 830, 260, 1.15)
    if k > 0.33:
        M.massage_chair(ctx, 1090, 840, 1.0, tilt=0.05)
    if k > 0.66:
        M.gumball(ctx, 900, 850, 1.0, tilt=-0.04)


def shot_doors_locked(ctx, t, S):
    cam = Cam(Keys((0, 960), (3, 940)), Keys((0, 600), (3, 610)), Keys((0, 1.55), (3, 1.75)))
    with layer(ctx, cam, t):
        _entrance_night(ctx, t, _crowd(), [(820, 745, 11), (1080, 750, 12), (1240, 742, 13), (600, 748, 14)])
        barricade(ctx)
    fx.darkness(ctx, 0.5, [fx.Light(*cam.to_screen(t, 960, 520), 1000, power=0.6, glow="#9fb0e0", glow_a=0.05)])
    fx.grade(ctx, "night", 0.55)


def shot_window(ctx, t, S):
    """Окно держит: Статуя Свободы прижалась к стеклу."""
    cam = Cam(1500, 520, Keys((0, 2.4), (3, 2.7)), anchor=(1500, 520))
    with layer(ctx, cam, t):
        M.entrance_outside(ctx, "night")
        p = zombie_reach(t, 5)
        p.update(a1=(1.6, -0.5), a2=(1.5, -0.4), lean=0.05, face=None)
        LIBERTY.draw(ctx, 1520, 762, 74, -1, p)
        M.entrance_glass(ctx, tint=0.22)
        M.entrance_interior(ctx, "night", lights=0.0)
    fx.darkness(ctx, 0.45, [fx.Light(W / 2, H / 2 - 100, 900, power=0.6, glow_a=0.0)])
    fx.grade(ctx, "night", 0.5)


def shot_hatch(ctx, t, S):
    """Крупно: люк в полу дёргается, крышка приподнимается, пальцы."""
    x, y = HATCH[0]
    cam = Cam(x, Keys((0, y - 80), (2, y - 40)), Keys((0, 2.0), (2, 2.6)), shake=lambda t: shake_k(t, 0.45, 0.4, 0.8)
              + shake_k(t, 1.1, 0.4, 0.6))
    with layer(ctx, cam, t):
        bg(ctx, "fc_night", (-400, 0, 2800, 1300), _fc)
        k = 0.0 if t < 1.1 else 0.18 * smooth((t - 1.1) / 0.3)
        sh = 1.0 if 0.45 < t < 0.7 else 0.0
        hatch_draw(ctx, t, 0, k, sh)
        if k > 0.05:
            s = fs(y) / 110
            for j in range(4):
                fx_ = x - 50 * s + j * 30 * s
                D.line(ctx, fx_, y - 30 * s, fx_ + 4, y - 30 * s - 22 * s * smooth((t - 1.2) / 0.3), hexrgb("#a8b29c"),
                       9 * s)
    lx, ly = cam.to_screen(t, TABLE_X + 77, TABLE_Y - 145)
    fx.darkness(ctx, 0.8, [fx.Light(lx, ly, 900, glow_a=0.15), fx.Light(W / 2, H / 2, 600, power=0.4, glow_a=0)])
    fx.grade(ctx, "night", 0.6)


def shot_turn(ctx, t, S, full=False):
    """Герой оборачивается — за спиной толпа из люков. Резкий наезд на лицо, крик."""
    zt = 0.55
    cam = Cam(Keys((0, 1350), (zt, 1350), (zt + 0.35, HERO_X - 10, "out")),
              Keys((0, 640), (zt, 640), (zt + 0.35, HERO_Y - fs(HERO_Y) * 3.6, "out")),
              Keys((0, 1.05), (zt, 1.05), (zt + 0.35, 3.1, "out")),
              shake=lambda t: 0.9 if t > zt + 0.3 else 0.0)
    with layer(ctx, cam, t):
        bg(ctx, "fc_night", (-400, 0, 2800, 1300), _fc)
        for i in range(3):
            hatch_draw(ctx, t, i, 1.0)
        for i, sd in enumerate((31, 32, 33)):
            emerging(ctx, t, i, clamp(0.5 + t * 0.5), sd)
        for j, (zx, zy, sd) in enumerate([(1420, 880, 41), (1700, 860, 42), (1980, 940, 43), (1330, 820, 44)]):
            p = zombie_reach(t, sd)
            R.Fig(R.zombie_look(sd)).draw(ctx, zx - 30 * t, zy, fs(zy), -1, p)
        lamp = camp_table(ctx, t)
        if t < 0.25:
            p = R.stand("side", t, 3)
            p.update(neck=0.1, hturn=1 - t * 4)
            f = -1
        else:
            p = R.stand("front", t, 3)
            p.update(face="scream" if t > zt else "scared", hturn=0.55, look=(0.8, -0.2),
                     a1=(0.5, 1.4), a2=(0.9, 1.2), lean=-0.06, blink=0)
            f = 1
        J = HERO.draw(ctx, HERO_X, HERO_Y, fs(HERO_Y), f, p,
                      extra=lambda c, J, layer_: hold_flashlight(J, c, "hand2", -0.2) if layer_ == "front" else None)
        draw_dog(ctx, HERO_X + 150, HERO_Y + 20, fs(HERO_Y) * 0.95, 1, dog_pose(t, "stand", bark=1.0 if t > 0.3 else 0))
    hx, hy = cam.to_screen(t, HERO_X + 70, HERO_Y - fs(HERO_Y) * 2.3)
    lx, ly = cam.to_screen(t, *lamp)
    fx.darkness(ctx, 0.8, [fx.Light(lx, ly, 450, glow_a=0.2),
                           fx.Light(hx, hy, 1300, kind="cone", ang=-0.12, spread=0.33, power=0.85, glow_a=0.04)])
    flashlight_beam(ctx, hx, hy, -0.12, 1300, 0.33, 0.05)
    fx.grade(ctx, "night", 0.5)


def shot_title(ctx, t, S):
    D.col(ctx, hexrgb("#120f14"))
    ctx.paint()
    O.title_card(ctx, t)


def build(S):
    c = S.cue
    t1 = c(1) - 0.15
    t2 = c(2) - 0.15
    S.shots = [
        Shot(0, shot_stove),
        Shot(t1, shot_doors_locked),
        Shot(t1 + (t2 - t1) * 0.55, shot_window),
        Shot(t2, shot_hatch),
        Shot(max(t2 + 1.7, c(2, True) - 0.2), shot_turn),
        Shot(8.35, shot_title, trans="black", tlen=0.15),
    ]
    S.shots[-1].hide_day = True
    S.shots[-1].hide_caps = True
