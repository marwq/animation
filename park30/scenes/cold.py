"""Крючок (день 30, полночь): салют над замком, двор забит зелёными лицами, светящийся шар в
заплатках, Тео без костюма в поту, Бандит и енотята, единорог. Рука хватает корзину; трос
натянут, узел. Затем название."""
from scenes.kit import *
from scenes.shared import *

BX = 1200          # центр корзины во дворе (мир)
GY = 900
STAKE = (BX - 560, GY + 70)
COURT = (-1800, -1600, 6000, 3800)


def court_bg(ctx, t, cam):
    with layer(ctx, cam, t, 0.35):
        PK.sky(ctx, t, "night", -3000, 7000, clouds=False)
    with layer(ctx, cam, t, 0.55):
        LK.show(ctx, t + 3.0, -1800, 4200, -1900, 0, 1.0, seed=31, period=1.5)
    with layer(ctx, cam, t):
        bg(ctx, "court_night", COURT, lambda c: CA.courtyard(c, "night", -1800, 4200, GY, clock=(0, 0)), 0.6)


def balloon_rig(ctx, t, x, gy, s=1.0, tod="night", burner=1.0, inside_fn=None, tether_to=None, taut=1.0,
                glow=1.0, spin=0.0, vib=0.0):
    """Шар + корзина (+ трос): (x, gy) — низ корзины."""
    by = gy - (300 + 420 + 160) * s
    e = BL.envelope(ctx, x, by, 0.85 * s, 1.0, tod, spin=spin, glow=glow, t=t)
    BL.basket(ctx, x, gy, s, tod, burner, t, cables_to=(e["left"][0], e["left"][1], e["right"][0], e["right"][1]),
              inside=inside_fn)
    if tether_to:
        BL.tether(ctx, x - 130 * s, gy - 40 * s + vib, tether_to[0], tether_to[1], taut, tod)
    return e


def crew(ctx, x, rim, s, t, face="scared", grab=0.0):
    """Кто в корзине: Тео (без костюма, в поту, держит клапан горелки), единорог, Бандит с малышами."""
    IN.unicorn(ctx, x + 110 * s, rim + 250 * s, 0.45 * s, "night", -1, t)
    pull = 0.5 + 0.5 * math.sin(t * 9)
    p = R.stand("front", t, 1)
    p.update(face=face, sweat=1.0, blink=0, h2=(0.62, -3.85 + 0.18 * pull), h1=(-0.55, -2.0),
             look=(0.6 * grab, -0.4))
    J = THEO.draw(ctx, x - 60 * s, rim + 190 * s, 112 * s, 1, p)      # стоит на баллоне — по пояс над бортом
    hx, hy = THEO.world(x - 60 * s, rim + 190 * s, 112 * s, 1, J["hand2"])
    D.curve(ctx, [(hx, hy), (hx + 20 * s, hy - 80 * s), (x - 20 * s, rim - 400 * s)], D.INK, 4 * s)   # шнур клапана
    draw_raccoon(ctx, x - 150 * s, rim + 6 * s, 80 * s, 1, raccoon_pose(t, "sit", look=0.3 * grab))
    for k in range(3):
        draw_raccoon(ctx, x + 10 * s + k * 40 * s, rim + 8 * s, 70 * s, -1 if k % 2 else 1,
                     raccoon_pose(t + k, "peek", baby=True, look=-0.2))


def grabber(ctx, t, x, gy, s, target, seed, k):
    """Зомби у корзины: правая рука по IK тянется к точке target и хватает (k 0..1)."""
    fig = R.Fig(R.park_zombie(seed))
    f = -1 if target[0] < x else 1
    p = zombie_reach(t, seed)
    tx, ty = (target[0] - x) / (f * s), (target[1] - gy) / s
    rest = (1.2, -2.9)
    p.update(h1=(lerp(rest[0], tx, k), lerp(rest[1], ty, k)), a2=(1.7, -0.2), mouth=1.0, lean=0.25)
    J = fig.draw(ctx, x, gy, s, f, p)
    if k > 0.95:
        hx, hy = fig.world(x, gy, s, f, J["hand1"])
        for j in range(4):
            D.line(ctx, hx - 14 + j * 9, hy - 4, hx - 16 + j * 9, hy + 22, D.INK, 9)
            D.line(ctx, hx - 14 + j * 9, hy - 4, hx - 16 + j * 9, hy + 22, fig.look.head, 5)
    return fig, J


def shot_sky(ctx, t, S):
    """Салют над замком, кадр опускается к морю зелёных лиц."""
    d = S.cue(1) - 0.15
    k = ease_io(clamp(t / d))
    off = lerp(-260, 60, k)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#060a24"), (0.6, "#16296a"), (1, "#2c4a8c")])
    ctx.save()
    ctx.translate(0, -off * 0.3)
    SEA.stars(ctx, 0, -300, W, 900, t, 4, 1.4)
    LK.show(ctx, t + 1.0, -100, W + 100, -200, 900, 1.6, seed=30, period=1.3)
    ctx.restore()
    ctx.save()
    ctx.translate(0, -off)
    ctx.save()
    ctx.translate(W / 2, 860)
    ctx.scale(0.42, 0.42)
    CA.castle(ctx, 0, 0, 1.0, "night", t, lit=0.9)
    ctx.restore()
    heads_sea(ctx, t, -100, W + 100, 820, 1180, 110, 30, 34, 170, up=1.0, arms=0.65, glow=0.8)
    ctx.restore()
    # отсветы салюта на лицах
    fl = max(0.0, math.sin(t * 5.3)) ** 3
    fx.tint(ctx, hexrgb(["#ff4a6a", "#4ad8ff", "#ffd23a"][int(t * 1.6) % 3]), 0.12 * fl, cairo.OPERATOR_SCREEN)
    pop_text(ctx, "MIDNIGHT", W / 2, 190, t, 0.3, 120, "#ffd23a", dur=d, shake=False)


def shot_balloon(ctx, t, S, t_title):
    d = t_title - (S.cue(1) - 0.15)
    T1, T2 = d * 0.36, d * 0.7               # общий план → корзина крупно → трос
    if t < T1:
        cam = Cam(BX + 40, Keys((0, -260), (T1, -200)), Keys((0, 0.4), (T1, 0.44)), shake=0.05)
        court_bg(ctx, t, cam)
        with layer(ctx, cam, t):
            balloon_rig(ctx, t, BX, GY - 10, 1.0, burner=0.9 + 0.1 * math.sin(t * 20),
                        inside_fn=lambda c, x, rim, s: crew(c, x, rim, s, t), tether_to=STAKE)
            for i in range(9):
                zx = BX + (-1 if i % 2 else 1) * (420 + (i // 2) * 210)
                p = zombie_reach(t, i)
                p.update(a1=(1.8, -0.3), a2=(1.6, -0.2), mouth=1.0)
                R.Fig(R.park_zombie(3000 + i)).draw(ctx, zx, GY + 10 + (i % 3) * 30, 112, 1 if zx < BX else -1, p)
        with layer(ctx, cam, t, 1.15):
            heads_sea(ctx, t, -200, 2700, GY + 160, GY + 420, 40, 33, 120, 170, up=0.6, arms=0.5, glow=0.5)
        fx.darkness(ctx, 0.2, [fx.Light(*cam.to_screen(t, BX, GY - 900), 900, power=0.7, glow_a=0.0)])
        return
    if t < T2:
        tt = t - T1
        dd = T2 - T1
        T_GRAB = dd * 0.45
        cam = Cam(BX + 60, GY - 400, Keys((0, 1.4), (dd, 1.55)), shake=lambda q: 0.15 + shake_k(q, T_GRAB, 0.35, 1.2))
        court_bg(ctx, tt, cam)
        with layer(ctx, cam, tt):
            rim = GY - 10 - 300
            g = smooth(clamp((tt - T_GRAB + 0.25) / 0.25))
            balloon_rig(ctx, tt, BX, GY - 10, 1.0, burner=1.0,
                        inside_fn=lambda c, x, rm, s: crew(c, x, rm, s, tt, "scream" if g > 0.9 else "scared", g))
            grabber(ctx, tt, BX + 330, GY + 40, 118, (BX + 170, rim - 6), 3007, g)
            grabber(ctx, tt, BX - 360, GY + 60, 112, (BX - 175, rim - 4), 3011, smooth(clamp((tt - T_GRAB) / 0.3)))
        fx.darkness(ctx, 0.15, [fx.Light(W / 2, H / 2 - 100, 800, power=0.5, glow_a=0.0)])
        if tt > T_GRAB:
            pop_text(ctx, "GRAB!", W / 2 + 470, 260, tt, T_GRAB, 110, "#9fc86a", dur=1.0)
        return
    tt = t - T2
    mx, my = (BX - 130 + STAKE[0]) / 2, (GY - 50 + STAKE[1]) / 2
    cam = Cam(mx - 40, my - 60, Keys((0, 1.7), (d - T2, 1.95)), shake=lambda q: 0.2)
    court_bg(ctx, tt, cam)
    with layer(ctx, cam, tt):
        vib = math.sin(tt * 70) * 4
        balloon_rig(ctx, tt, BX, GY - 10, 1.0, burner=1.0,
                    inside_fn=lambda c, x, rm, s: crew(c, x, rm, s, tt, "scream", 1.0), tether_to=STAKE, vib=vib)
        ox, oy = STAKE
        D.circle(ctx, ox, oy - 8, 34, None, hexrgb("#ff4a3a"), 6, alpha=0.6 + 0.4 * math.sin(tt * 12))
    fx.darkness(ctx, 0.25, [fx.Light(*cam.to_screen(tt, *STAKE), 600, power=0.7, glow_a=0.0)])
    pop_text(ctx, "STILL TIED.", W / 2 - 300, 200, tt, 0.1, 120, "#ff4a3a", dur=4, shake=True)


def shot_title(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0a1238"), (0.7, "#16296a"), (1, "#2c4a8c")])
    SEA.stars(ctx, 0, 0, W, 700, t, 4, 1.4)
    LK.show(ctx, t + 2.0, 0, W, 60, 1000, 0.9, seed=32, period=1.5)
    ctx.save()
    ctx.translate(300 + t * 120, 1000 - t * 40)
    ctx.scale(0.3, 0.3)
    balloon_rig(ctx, t, 0, 0, 1.0, burner=0.6, glow=1.0, inside_fn=lambda c, x, rim, s: crew(c, x, rim, s, t, "smile"))
    ctx.restore()
    O.title_card(ctx, t)


def build(S):
    c = S.cue
    t_title = min(8.7, max(c(1, True) + 0.4, 7.2))
    S.shots = [
        Shot(0, shot_sky),
        Shot(c(1) - 0.15, lambda ctx, t, SS: shot_balloon(ctx, t, SS, t_title), "whip", 0.25),
        Shot(t_title, shot_title, "white", 0.35),
    ]
    S.show_day = True
    d = t_title - c(1)
    S.sfx += [(0.1, "firework", 1.0), (0.9, "firework", 0.9), (1.8, "firework", 1.0), (2.9, "firework", 0.9),
              (0.3, "crowd_groan", 0.8), (c(1), "burner", 1.0), (c(1) + d * 0.36 + (d * 0.34) * 0.45, "grab", 1.0),
              (c(1) + d * 0.7, "rope_creak", 1.0), (t_title, "title_hit", 1.0)]
    S.music = "tension"
