"""День 23: гроза с озера. Молния в башню свободного падения — полпарка гаснет. Компьютер салюта переходит на батарею,
отсчёт даже не моргнул: 7 дней 12 часов 6 минут."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL
DROP_X = 2600
LEFT = 7 * 86400 + 12 * 3600 + 6 * 60 + 40     # до полуночи в конце 30-го дня (в начале последней реплики)
COMP_X = 3600 - 700


def bolt(ctx, x0, y0, x1, y1, seed=1, a=1.0):
    """Ломаная молнии с ответвлением и свечением."""
    r = rng(seed)
    pts = [(x0, y0)]
    n = 9
    for k in range(1, n):
        u = k / n
        pts.append((lerp(x0, x1, u) + r.uniform(-90, 90), lerp(y0, y1, u)))
    pts.append((x1, y1))
    br = [pts[4], (pts[4][0] + 160, pts[4][1] + 120), (pts[4][0] + 260, pts[4][1] + 300)]
    for w, c, al in ((46, "#8ab0ff", 0.25), (18, "#dfe8ff", 0.8), (7, "#ffffff", 1.0)):
        D.polyline(ctx, pts, hexrgb(c), w, al * a)
        D.polyline(ctx, br, hexrgb(c), w * 0.6, al * a)


def skyline(ctx, t, cam, lit_from=-1e9, strike=0.0):
    """Парк в грозу: колесо, горка, башня падения; огни горят только правее lit_from."""
    sky_back(ctx, t, cam, "storm", -5000, 9000)
    with layer(ctx, cam, t):
        PK.plaza(ctx, "storm", -5000, 9000, c="#3a5a4a")
        RD.big_wheel(ctx, 400, FL - 1600, 1300, t * 0.05, "storm", lights=400 > lit_from, t=t, gy=FL)
        tr = RD.Track(RD.thunderbolt_track(3400, FL, 2200))
        RD.coaster_track(ctx, tr, FL, "storm", lights=3400 > lit_from, t=t)
        RD.drop_tower(ctx, DROP_X, FL, 3000, 0.1, "storm", lights=DROP_X > lit_from and strike < 0.5, t=t)
        for k in range(18):          # фонари вдоль дорожек
            lx = -2400 + k * 620
            on = lx > lit_from
            D.line(ctx, lx, FL + 40, lx, FL - 260, D.INK, 8)
            D.circle(ctx, lx, FL - 280, 22, hexrgb("#fff2a0") if on else hexrgb("#4a4a5a"), D.INK, 3)
            if on:
                D.radial(ctx, lx, FL - 280, 180, "#ffe9a0", 0.5, 0)


def shot_storm(ctx, t, S):
    """Над озером катится гроза: тучи, косой дождь, далёкие вспышки."""
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 2200), (d, 1600)), FL - 1200, 0.3, anchor=(2000, 520))
    skyline(ctx, t, cam)
    for k in range(6):
        x = (k * 420 - t * 120) % (W + 600) - 300
        D.circle(ctx, x, 110 + (k % 3) * 40, 260, hexrgb("#2a2e3e"), None, 0, alpha=0.85)
    fl = 1.0 if (t % 2.3) < 0.08 else 0.0
    fx.rain(ctx, t, 1.0, 0.35)
    fx.lightning(ctx, fl * 0.6)
    pop_text(ctx, "STORM", W / 2 + 380, 260, t, 0.4, 110, "#c9d6e8", dur=d, shake=False)


def shot_strike(ctx, t, S):
    """Молния бьёт в башню падения — искры; огни гаснут волной от башни: полпарка во тьме."""
    d = S.cue(2) - S.cue(1)
    T_HIT = 1.2
    k_dark = smooth(clamp((t - T_HIT - 0.3) / 1.4))
    lit_from = -1e9 if t < T_HIT + 0.3 else lerp(-3000, DROP_X + 600, k_dark)
    cam = Cam(1900, FL - 1900, Keys((0, 0.28), (d, 0.27)), shake=0.25 if T_HIT < t < T_HIT + 0.4 else 0.0,
              anchor=(2000, 520))
    skyline(ctx, t, cam, lit_from, strike=1.0 if t > T_HIT else 0.0)
    with layer(ctx, cam, t):
        if T_HIT <= t < T_HIT + 0.35:
            bolt(ctx, DROP_X - 500, -3200, DROP_X, FL - 3270, seed=int(t * 20), a=1.0)
        if t > T_HIT:
            r = rng(int(t * 10))
            for j in range(10):
                ph = ((t - T_HIT) * 1.5 + j / 10) % 1
                D.circle(ctx, DROP_X + r.uniform(-120, 120) * ph * 3, FL - 3270 + ph * 600 + r.uniform(-30, 30),
                         10 * (1 - ph), hexrgb("#ffd23a"), None, 0, alpha=1 - ph)
    fx.rain(ctx, t, 1.0, 0.35)
    fx.lightning(ctx, 1.0 if T_HIT <= t < T_HIT + 0.15 else 0.0)
    fx.darkness(ctx, 0.25 * k_dark)
    if t > T_HIT:
        pop_text(ctx, "KRAKOOM!", W / 2 + 330, 250, t, T_HIT, 120, "#fff6d8", dur=1.2)
    if t > T_HIT + 1.6:
        pop_text(ctx, "HALF THE PARK: DARK", W / 2, 200, t, T_HIT + 1.6, 80, "#c9d6e8", dur=d, shake=False)


def shot_battery(ctx, t, S):
    """Пультовая без света: мониторы погасли, компьютер салюта — на батарее; Тео с фонариком."""
    d = S.cue(3) - S.cue(2)
    T_BAT = d * 0.3
    left = LEFT - ((S.cue(2) - 0.1 + t) - S.cue(3))
    cam = Cam(Keys((0, 1900), (d, COMP_X - 120, "io")), 430, Keys((0, 0.62), (d, 1.0, "io")))
    bat = t > T_BAT
    room_back(ctx, t, cam, "control_storm_%d_%d" % (bat, int(t)),
              lambda c: IN.control_room(c, "storm", power=0.0 if bat else 1.0, countdown=left, battery=bat,
                                        t=int(t)), (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        p.update(h1=(0.9, -2.7), h2=(0.3, -1.7), face="shock" if bat else "worried")
        J = THEO_FUR_PATCH.draw(ctx, COMP_X - 650, IN.FL + 60, 112, 1, p)
        hx, hy = THEO_FUR_PATCH.world(COMP_X - 650, IN.FL + 60, 112, 1, J["hand1"])
        D.rrect(ctx, hx - 16, hy - 20, 50, 30, 10, hexrgb("#ffd23a"), D.INK, 2)
    lights = [fx.Light(*cam.to_screen(t, COMP_X, 260), 520, power=0.7, glow_a=0.1),
              fx.Light(*cam.to_screen(t, COMP_X - 300, 300), 600, power=0.5, glow_a=0.0)]
    fx.darkness(ctx, 0.25 if not bat else 0.6, lights)
    if (t % 2.6) < 0.1:
        fx.lightning(ctx, 0.4)
    if bat:
        pop_text(ctx, "BATTERY", W / 2 - 420, 240, t, T_BAT, 90, "#4cff8a", dur=d, shake=False)
    if t > T_BAT + 1.2:
        pop_text(ctx, "DIDN'T EVEN BLINK", W / 2 + 250, 330, t, T_BAT + 1.2, 70, "#fff6d8", dur=d, shake=False)


def shot_count(ctx, t, S):
    """Крупно: табло отсчёта 07:12:06:… — секунды бегут; по стеклу текут капли."""
    d = S.dur - S.cue(3)
    left = LEFT - (t - 0.1)
    D.rect(ctx, 0, 0, W, H, hexrgb("#141824"), None, 0, wob=0)
    D.rrect(ctx, 160, 260, W - 320, 520, 40, hexrgb("#0e1410"), D.INK, 10)
    dd, r_ = divmod(int(left), 86400)
    hh, r_ = divmod(r_, 3600)
    mm, ss = divmod(r_, 60)
    parts = [("%02d" % dd, "DAYS"), ("%02d" % hh, "HOURS"), ("%02d" % mm, "MIN"), ("%02d" % ss, "SEC")]
    L = S.cue(3, True) - S.cue(3)
    show = [t > 0.15, t > 0.1 + L * 0.36, t > 0.1 + L * 0.68, True]
    for i, (num, lab) in enumerate(parts):
        x = 380 + i * 390
        if not show[i]:
            continue
        D.text(ctx, num, x, 600, 230, D.FONT_TITLE, hexrgb("#ff3a2a"))
        D.text(ctx, lab, x, 700, 46, D.FONT_TITLE, hexrgb("#ff9a8a"))
        if i < 3:
            D.text(ctx, ":", x + 195, 580, 160, D.FONT_TITLE, hexrgb("#ff3a2a"))
    D.radial(ctx, W / 2, 520, 900, "#ff3a2a", 0.12, 0)
    fx.drops_on_glass(ctx, t, (0, 0, W, H), seed=3, n=50, alpha=0.4)
    D.rrect(ctx, W / 2 - 160, 820, 320, 70, 14, hexrgb("#4cff8a"), D.INK, 3)
    D.text(ctx, "BATTERY", W / 2, 872, 44, D.FONT_TITLE, hexrgb("#0e1410"))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_storm, "fade", 0.4),
        Shot(c(1) - 0.1, shot_strike, "fade", 0.2),
        Shot(c(2) - 0.1, shot_battery, "fade", 0.3),
        Shot(c(3) - 0.1, shot_count, "fade", 0.3),
    ]
    S.tods = [(0, "storm")]
    S.sfx += [(0.0, "rain", 0.9), (1.0, "thunder", 0.5), (c(1) + 0.5, "thunder", 1.0), (c(1) + 0.8, "power_down", 0.8),
              (c(2) + (c(3) - c(2)) * 0.3, "click", 0.7), (c(3) + 0.2, "beep", 0.5), (c(3) + 0.9, "beep", 0.5),
              (c(3) + 1.6, "beep", 0.5)]
    S.music = [(0, "tension", 0.8), (c(2), "mystery", 0.8), (c(3), "tension", 0.9)]
