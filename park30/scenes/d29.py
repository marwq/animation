"""День 29 (ночь): последняя ночь. Последний раз включаешь огни колеса и поднимаешься наверх с Бандит и малышами.
Внизу десять тысяч лиц в темноте. Через озеро мигает Гас: «Поспи, малыш». Не спишь."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
WX, WR = 1500, 1300
WCY = FL - WR - 300


def big_cabin(ctx, x, y, s, t, inside, c="#e8423c", lit=True):
    """Кабинка колеса крупно: (x, y) — точка подвеса; inside(ctx, wx, wy, ww, wh) — кто в окне."""
    D.line(ctx, x, y - 400, x, y, D.INK, 14)
    D.line(ctx, x, y - 400, x, y, hexrgb("#fbfaf6"), 8)
    D.line(ctx, x, y, x, y + 60 * s, D.INK, 10)
    gx, gy = x, y + 60 * s
    D.poly(ctx, [(gx - 110 * s, gy + 40 * s), (gx, gy - 6 * s), (gx + 110 * s, gy + 40 * s)], hexrgb(c), D.INK, 5,
           wob=0)
    D.rrect(ctx, gx - 100 * s, gy + 36 * s, 200 * s, 190 * s, 26 * s, hexrgb("#e8e4dc"), D.INK, 5)
    wx, wy, ww, wh = gx - 84 * s, gy + 56 * s, 168 * s, 92 * s
    D.rect(ctx, wx, wy, ww, wh, hexrgb("#1a2240"), D.INK, 4, wob=0)
    ctx.save()
    ctx.rectangle(wx, wy, ww, wh)
    ctx.clip()
    if lit:
        D.radial(ctx, gx, wy + wh, ww * 0.7, "#ffe9a0", 0.35, 0)
    inside(ctx, wx, wy, ww, wh)
    ctx.restore()
    D.rect(ctx, wx, wy, ww, wh, None, D.INK, 4, wob=0)
    D.rect(ctx, gx - 100 * s, gy + 148 * s, 200 * s, 78 * s, hexrgb(c), D.INK, 4, wob=0)
    star(ctx, gx, gy + 188 * s, 22 * s, hexrgb("#ffd23a"))
    RD.bulbs(ctx, [(gx - 100 * s + k * 25 * s, gy + 36 * s) for k in range(9)], lit, t, r=6)


def family(t, awake=True, sleepy=False, radio=0.0):
    def fn(c, wx, wy, ww, wh):
        p = R.stand("front", t, 1)
        p.update(face="neutral" if awake else "sleep", look=(0.6, -0.1), h1=(-0.35, -2.3), h2=(0.35, -2.3))
        if radio > 0:
            p.update(h1=(-0.45, -3.0))
        J = THEO.draw(c, wx + ww * 0.42, wy + wh + 1.9 * 110, 110, 1, p)
        if radio > 0:
            hx, hy = THEO.world(wx + ww * 0.42, wy + wh + 1.9 * 110, 110, 1, J["hand1"])
            D.rrect(c, hx - 16, hy - 46, 32, 64, 8, hexrgb("#2b2f3a"), D.INK, 3)
            D.line(c, hx + 8, hy - 46, hx + 8, hy - 76, D.INK, 4)
            D.rect(c, hx - 10, hy - 36, 20, 12, hexrgb("#9fe870"), None, 0, wob=0)
        draw_raccoon(c, wx + ww * 0.7, wy + wh + 10, 80, -1, raccoon_pose(t, "sleep" if sleepy else "sit",
                                                                       look=0.4))
        for b in range(3):
            draw_raccoon(c, wx + ww * 0.42 - 40 + b * 40, wy + wh - 10, 52, 1,
                         raccoon_pose(t + b, "sleep" if sleepy else "peek", baby=True))
    return fn


def shot_last(ctx, t, S):
    """Тихий парк в последнюю ночь: тёмное колесо под луной."""
    d = S.cue(1) - 0.1
    cam = Cam(WX + 300, WCY - 200, Keys((0, 0.32), (d, 0.36)), anchor=(WX, 520))
    sky_back(ctx, t, cam, "night", -4000, 7000, moon=(2800, -900, 140))
    with layer(ctx, cam, t):
        PK.plaza(ctx, "night", -4000, 7000, c="#2a3a2a")
        RD.big_wheel(ctx, WX, WCY, WR, -math.pi / 2, "night", lights=False, t=t, gy=FL)
    fx.darkness(ctx, 0.25)
    if t > 0.3:
        pop_text(ctx, "THE LAST NIGHT", W / 2, 220, t, 0.3, 90, "#fff6d8", dur=d, shake=False, rot=0.0)


def shot_lights(ctx, t, S):
    """Огни колеса вспыхивают по кругу; колесо трогается. Крупно: кабинка с Тео и семьёй енотов уходит вверх."""
    d = S.cue(2) - S.cue(1)
    T_CLOSE = d * 0.45
    if t < T_CLOSE:
        on = t > 0.4
        cam = Cam(WX, WCY, Keys((0, 0.36), (T_CLOSE, 0.4)), anchor=(WX, 520))
        sky_back(ctx, t, cam, "night", -4000, 7000, moon=(2800, -900, 140))
        with layer(ctx, cam, t):
            PK.plaza(ctx, "night", -4000, 7000, c="#2a3a2a")
            ang = -math.pi / 2 + 0.08 * max(0.0, t - 0.8) ** 2
            RD.big_wheel(ctx, WX, WCY, WR, ang, "night", lights=on, t=t, gy=FL)
        fx.darkness(ctx, 0.25 if not on else 0.1, [fx.Light(W / 2, H / 2, 900, power=0.6 if on else 0.0, glow_a=0.2)])
        if on:
            pop_text(ctx, "ONE LAST TIME", W / 2, 200, t, 0.4, 80, "#ffd23a", dur=T_CLOSE, shake=False)
        return
    tt = t - T_CLOSE
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0a1238"), (1, "#26306a")])
    SEA.stars(ctx, 0, 0, W, H, t, 3, 1.2)
    # огни парка внизу уходят вниз — кабинка поднимается
    for k in range(40):
        r = rng(k)
        y = (r.uniform(0, H * 2) + tt * 160) % (H * 1.6) + H * 0.2
        D.circle(ctx, r.uniform(0, W), y, r.uniform(3, 7), hexrgb(PK.BRIGHT[k % 8]), None, 0, alpha=0.7)
    big_cabin(ctx, W / 2, 360, 2.3, t, family(t))


def shot_faces(ctx, t, S):
    """Взгляд вниз: десять тысяч лиц в темноте, глаза светятся."""
    d = S.cue(3) - S.cue(2)
    D.rect(ctx, 0, 0, W, H, hexrgb("#06080e"), None, 0, wob=0)
    heads_sea(ctx, t, -100, W + 100, 80, 1180, 130, seed=29, s0=30, s1=120, up=1.0, arms=0.15, glow=1.0)
    fx.darkness(ctx, 0.35)
    for k in range(10):
        D.radial(ctx, (k * 223) % W, (k * 137) % H, 260, PK.BRIGHT[k % 8], 0.08, 0)
    counter_badge(ctx, "FACES", "10,000", W - 340, 160, "#e8ff6a", 500)


def shot_sleep(ctx, t, S):
    """Наверху: через озеро мигает маяк; рация: «Поспи, малыш». Енотята спят. Ты — нет."""
    d = S.dur - S.cue(3)
    L = S.cue(3, True) - S.cue(3)
    blink = 1.0 if (t % 1.2) < 0.3 and t < L * 0.6 else 0.0
    D.vgrad(ctx, 0, 0, W, H, [(0, "#0a1238"), (1, "#1c2a5c")])
    SEA.stars(ctx, 0, 0, W, H * 0.6, t, 4, 1.4)
    D.rect(ctx, 0, 640, W, H - 640, hexrgb("#16224a"), None, 0, wob=0)
    for k in range(30):
        wx = (k * 97 + t * 15) % W
        D.line(ctx, wx, 680 + (k * 23) % 300, wx + 30, 680 + (k * 23) % 300, hexrgb("#4a6aa8"), 2, 0.6)
    LK.lighthouse(ctx, 1650, 645, 0.12, "night", beam=blink, ang=2.6, t=t)
    if blink:
        D.radial(ctx, 1650, 645 - 0.12 * 640, 110, "#fff2a0", 0.8, 0)
    big_cabin(ctx, 640, 300, 2.3, t, family(t, awake=True, sleepy=True, radio=1.0))
    if t > L * 0.4:
        speech(ctx, 1150, 300, "GET SOME SLEEP, KID.", t, L * 0.4, 60, tail=(-1, 1), dur=L * 0.45)
    if t > L * 0.82:
        pop_text(ctx, "YOU DON'T.", W / 2 + 330, 420, t, L * 0.82, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_last, "fade", 0.5),
        Shot(c(1) - 0.1, shot_lights, "fade", 0.3),
        Shot(c(2) - 0.1, shot_faces, "fade", 0.4),
        Shot(c(3) - 0.1, shot_sleep, "fade", 0.4),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(0.3, "crickets", 0.6), (c(1) + 0.4, "power_up", 0.9), (c(1) + 0.9, "machine", 0.5),
              (c(2) + 0.3, "crowd_groan", 0.7), (c(3) + (c(3, True) - c(3)) * 0.4, "radio_beep", 0.6)]
    S.music = [(0, "lonely", 0.7), (c(1) + 0.4, "wonder", 0.9), (c(2), "tension", 0.6), (c(3), "warm", 0.7)]
