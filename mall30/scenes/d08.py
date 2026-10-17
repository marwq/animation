"""День 8: Galaxy Arcade без звука, все рекорды — твои. Боулинг: бросок №412 — страйк."""
from scenes.kit import *
from sets import stores as ST


def shot_arcade(ctx, t, S):
    """Проезд вдоль светящихся автоматов в темноте."""
    w = Walk(Keys((0, 100), (6, 1400, "lin")), 860, 88, "walk", t1=8)
    cam = Cam(lambda t: w.x(t) + 250, 560, 1.1)
    with layer(ctx, cam, t):
        bg(ctx, "arcade", (-400, -100, 2800, 1400), ST.arcade)
        w.draw(ctx, HERO, t, {"face": "happy", "a1": (0.6, 1.6)},
               props=lambda c, J, l: _keys(c, J) if l == "front" else None)
        draw_dog(ctx, w.x(t) - 140, 866, 80, 1, dog_pose(t, "trot", phase=w.dist(t)))
    lights = [fx.Light(*cam.to_screen(t, -120 + 110 + i * 330, 445), 300, glow=ST.SCREEN_C[i % 6], glow_a=0.3)
              for i in range(7)]
    fx.darkness(ctx, 0.6, lights)


def _keys(ctx, J):
    hx, hy = J["hand1"]
    D.circle(ctx, hx, hy + 0.1, 0.12, None, hexrgb("#b9b4a8"), 0.04)
    for k in range(4):
        D.line(ctx, hx - 0.05 + k * 0.04, hy + 0.2, hx - 0.06 + k * 0.05, hy + 0.42, hexrgb("#d6b24c"), 0.04)


def shot_play(ctx, t, S):
    """Играет у автомата: свет экрана на лице, из копилки сыплются монеты."""
    cam = Cam(Keys((0, 1010), (4, 980)), 560, Keys((0, 1.45), (4, 1.6)))
    with layer(ctx, cam, t):
        bg(ctx, "arcade", (-400, -100, 2800, 1400), ST.arcade)
        p = R.stand("side", t, 1)
        jx = math.sin(t * 9) * 0.06
        p.update(h1=(0.62 + jx, -2.08), h2=(0.75, -2.12 + 0.03 * math.sin(t * 20)), face="laugh" if t > 1.6 else "happy",
                 lean=0.1)
        HERO.draw(ctx, 790, 860, 88, 1, p)
        # монеты из открытой копилки
        for k in range(14):
            ph = (t * 1.1 + k / 14) % 1
            cx = 1090 + math.sin(k * 3) * 30 + ph * 40
            cy = 690 + ph * 170
            D.ellipse(ctx, cx, min(cy, 855), 9, 4 if cy >= 855 else 9, hexrgb("#d6b24c"), D.INK, 1.5)
    lights = [fx.Light(*cam.to_screen(t, 1090, 445), 500, glow="#7cff6a", glow_a=0.35)]
    fx.darkness(ctx, 0.55, lights)


def shot_score(ctx, t, S):
    """Экран: NEW HIGH SCORE — SAM."""
    D.col(ctx, hexrgb("#0e0e18"))
    ctx.paint()
    r = rng(2)
    for k in range(80):
        D.rect(ctx, r.uniform(0, W), r.uniform(0, H), 10, 10, hexrgb(r.choice(ST.SCREEN_C)), None, 0, wob=0, alpha=0.25)
    on = int(t * 4) % 2 == 0
    D.text(ctx, "NEW HIGH SCORE", W / 2, 380, 110, D.FONT_TITLE, hexrgb("#ffd34a") if on else hexrgb("#ff5ac8"))
    D.text(ctx, "1. SAM ....... 999,990", W / 2, 560, 72, D.FONT_DAY, hexrgb("#7cff6a"), bold=True)
    D.text(ctx, "2. SAM ....... 999,980", W / 2, 660, 72, D.FONT_DAY, hexrgb("#4ad0ff"), bold=True)
    D.text(ctx, "3. SAM ....... 999,970", W / 2, 760, 72, D.FONT_DAY, hexrgb("#4ad0ff"), bold=True)
    # скан-линии
    D.col(ctx, (0, 0, 0), 0.25)
    for y in range(0, H, 6):
        ctx.rectangle(0, y, W, 2)
    ctx.fill()


def bowler(ctx, t, x, y, s, throw_t, fail=False):
    """Герой со спины бросает шар (вид из-за дорожки)."""
    k = clamp((t - throw_t + 0.5) / 0.5)
    p = R.stand("back", t, 1)
    if k < 1:
        sw = math.sin(k * math.pi)
        p.update(a2=(0.1 + 1.3 * sw, 0.2), lean=0.2 * sw, hip=(0, 0.1 * sw), f1=(-0.3, 0), f2=(0.25, -0.1 * sw))
    elif fail:
        p.update(a1=(2.4, 0.9), a2=(2.4, 0.9), neck=0.3)   # руки за голову
    HERO.draw(ctx, x, y, s, 1, p)


def lane_ball(ctx, t, t0, dur=1.2, lane_u=0, gutter=False):
    """Шар катится по дорожке к точке схода."""
    if t < t0:
        return None
    k = clamp((t - t0) / dur)
    x0n = 960 + lane_u * 520
    x0f = 960 + lane_u * 150
    off = 0.0
    if gutter:
        off = 230 * smooth(k * 1.4)
    yy = lerp(1050, 440, k ** 0.6)
    f = (1050 - yy) / (1050 - 440)
    xx = lerp(x0n + off, x0f + off * 0.29, f)
    r = lerp(38, 9, f)
    ST.ball(ctx, xx, yy - r, r, "#2f3d5c" if not gutter else "#c23b33", rot=t * 8)
    return k


def shot_bowl_fails(ctx, t, S):
    """Броски №37, №158, №301 — мимо."""
    cam = Cam(960, 560, 1.0)
    seg = [(0.0, "#37"), (1.4, "#158"), (2.6, "#301")]
    with layer(ctx, cam, t):
        bg(ctx, "bowling", (-400, -100, 2800, 1400), ST.bowling)
        for p_ in ST.pin_spots(960, 440):
            ST.pin(ctx, *p_, 0.55)
        idx = max(i for i, (a, _) in enumerate(seg) if t >= a)
        t0 = seg[idx][0]
        lane_ball(ctx, t, t0 + 0.4, 1.0, 0, gutter=True)
        bowler(ctx, t, 960, 1180, 150, t0 + 0.4, fail=t > t0 + 0.9)
    fx.darkness(ctx, 0.35, [fx.Light(960, 300, 1200, power=0.8, glow="#ff9ad8", glow_a=0.1)])
    for i, (a, lab) in enumerate(seg):
        if a <= t < (seg[i + 1][0] if i + 1 < len(seg) else 99):
            D.text(ctx, "THROW " + lab, W - 90, 120, 70, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=10)


def shot_strike(ctx, t, S):
    """Бросок №412: камера летит за шаром, кегли разлетаются. СТРАЙК."""
    T0, DUR = 0.3, 1.5
    hit = T0 + DUR * 0.92
    cam = Cam(960, Keys((0, 560), (T0 + DUR * 0.9, 470, "in")), Keys((0, 1.0), (T0 + DUR * 0.9, 2.6, "in"), (hit + 1.2, 2.4)),
              shake=lambda t: shake_k(t, hit, 0.5, 0.7))
    with layer(ctx, cam, t):
        bg(ctx, "bowling", (-400, -100, 2800, 1400), ST.bowling)
        spots = ST.pin_spots(960, 440)
        r = rng(4)
        for i, (px, py) in enumerate(spots):
            if t < hit:
                ST.pin(ctx, px, py, 0.55)
            else:
                dt = t - hit
                vx = r.uniform(-260, 260)
                vy = r.uniform(-260, -120)
                ST.pin(ctx, px + vx * dt, py + vy * dt + 500 * dt * dt, 0.55, ang=r.uniform(-12, 12) * dt,
                       alpha=clamp(1.5 - dt))
        if t < hit + 0.1:
            lane_ball(ctx, t, T0, DUR, 0)
        bowler(ctx, t, 960, 1180, 150, T0)
    fx.darkness(ctx, 0.3, [fx.Light(960, 300, 1200, power=0.8, glow="#ff9ad8", glow_a=0.1)])
    D.text(ctx, "THROW #412", W - 90, 120, 70, D.FONT_TITLE, hexrgb("#f7eedb"), "right", stroke=D.INK, slw=10)
    if t > hit:
        k = clamp((t - hit) / 0.25)
        ctx.save()
        ctx.translate(W / 2, H / 2 - 40)
        sc = ease_out_back(k)
        ctx.scale(sc, sc)
        ctx.rotate(-0.06)
        D.text(ctx, "STRIKE!", 0, 0, 200, D.FONT_TITLE, hexrgb("#ffd34a"), stroke=D.INK, slw=16)
        ctx.restore()


def shot_witness(ctx, t, S):
    """Претцель зевает. На стойке — шестьдесят шаров (запомним)."""
    cam = Cam(Keys((0, 900), (4, 1150)), 640, Keys((0, 1.5), (4, 1.3)))
    with layer(ctx, cam, t):
        bg(ctx, "bowling", (-400, -100, 2800, 1400), ST.bowling)
        # стойка с шарами
        D.rect(ctx, 1200, 780, 700, 140, hexrgb("#4a4856"), D.INK, 3)
        cols = ["#2f3d5c", "#c23b33", "#3f8a84", "#e2a33b", "#7a6aa3", "#1f1f24"]
        for row in range(2):
            for k in range(9):
                ST.ball(ctx, 1240 + k * 75 + row * 36, 770 - row * 62, 34, cols[(k + row) % 6])
        y = 1000
        yawn = clamp(math.sin(clamp((t - 0.8) / 1.2) * math.pi) * 1.5)
        draw_dog(ctx, 760, y, 140, 1, dog_pose(t, "lie", bark=yawn * 0.6, wag=0.2))
    fx.darkness(ctx, 0.3, [fx.Light(960, 300, 1200, power=0.8, glow_a=0.0)])
    if t > 2.0:
        D.text(ctx, "60 BALLS", W / 2 + 330, 300, 70, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=10,
               alpha=clamp((t - 2.0) / 0.3))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_arcade),
        Shot(c(1) - 0.1, shot_play),
        Shot(c(2) - 0.1, shot_score),
        Shot(c(3) - 0.1, shot_bowl_fails, "whip", 0.3),
        Shot(c(4) - 0.4, shot_strike),
        Shot(c(5) - 0.1, shot_witness),
    ]
    S.sfx += [(c(4) - 0.4 + 0.3 + 1.38, "strike", 1.0)]
