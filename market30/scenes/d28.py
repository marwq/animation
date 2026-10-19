"""День 28, полночь. Трещина доходит до верха окна. Стекло уходит разом, как волна; тележки держат одиннадцать
минут. Вы с Рут бежите к морозильной камере — изолированная, стальная, открывается изнутри. Держишь ручку
и слушаешь, как они заполняют магазин."""
import cairo

from scenes.kit import *

HERO = ST.HERO
RUTH = ST.RUTH
FD_HZ, FD_A = 760, 0.2
STK_HZ, STK_A = 700, 0.188


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


def crack_up(ctx, T, S):
    l = T - (S.cue(1) - 0.3)
    cam = PlateCam("front_day", 1500, 700, 2.4)
    blur_plate(ctx, "front_day", cam, 0, 0.75, darken=0.55)
    glass_corner(ctx, T, crack=1.0, to_top=smooth(clamp(l / 2.6)))
    fx.flash(ctx, 0.15, "#0a1028")


def crowd_push(ctx, T, push=0.0, seed=60, n=16):
    """Толпа за стеклом/в проёме давит на тележки: push — насколько вошли (0..1)."""
    r_ = rng(seed)
    items = []
    for i in range(n):
        x = 1190 + (i + r_.uniform(-0.3, 0.3)) * (920 / n)
        row = r_.randrange(3)
        gy = 1005 + row * 22 + push * 70
        r = 50 * (1 + row * 0.05 + push * 0.25)
        items.append((row, x, gy, r, i))
    for row, x, gy, r, i in sorted(items):
        p = ST.front(T, i)
        sw = math.sin(T * 3 + i) * 0.15
        p.update(h1=(1.0 + sw, -5.4), h2=(-1.0 + sw, -5.3), mouth=0.8, blink=False, tilt=0.15 * math.sin(T * 2 + i))
        ST.draw(ctx, x + 8 * math.sin(T * 4 + i), gy, r, 1, p, zombie_look(seed + i, ("#1a2440", 0.35)))


def shards(ctx, T, t0, n=160, seed=3, region=(1100, 340, 1100, 680)):
    """Осколки-кубики разлетаются и падают (экранные координаты камеры кадра)."""
    u = T - t0
    if u < 0:
        return
    r_ = rng(seed)
    x0, y0, w, h = region
    for i in range(n):
        x = x0 + r_.random() * w + r_.uniform(-200, 200) * u
        y = y0 + r_.random() * h + r_.uniform(-60, 80) * u + 1300 * u * u
        if y > 1700:
            continue
        s = r_.uniform(6, 14)
        D.rect(ctx, x, y, s, s, hexrgb("#d4ecf6"), hexrgb("#6a8a9a"), 1.5, wob=0, alpha=0.9)


def shatter(ctx, T, S):
    """Витрина ночью: волна стекла, тележки дрожат под напором, счётчик 11 минут."""
    t_go = S.word("goes", S.cue(2)) - 0.1
    t_carts = S.word("carts", S.cue(2)) - 0.2
    l = T - (S.cue(2) - 0.3)
    sx, sy = shake(T, t_go, 26, 0.8)
    cam = PlateCam("front_day", 1600, 900, Keys((0, 1.12), (6, 1.2, "lin")))
    ctx.save()
    ctx.translate(sx, sy)
    with on(ctx, cam, l):
        paint(ctx, "front_day")
        if T > t_go:                                                    # стекла больше нет
            ctx.save()
            ctx.rectangle(355, 340, 1765, 660)
            ctx.clip()
            D.col(ctx, hexrgb("#4a5060"), 0.35)
            ctx.paint()
            ctx.restore()
        ctx.save()
        ctx.rectangle(0, 300, 2720, 800)
        ctx.clip()
        crowd_push(ctx, T, push=clamp((T - t_go) / 1.5) * 0.6)
        ctx.restore()
        front_day_fg(ctx)
        jit = 6 * math.sin(T * 40) if T > t_go else 0
        for row in range(3):
            gy = 1080 + row * 55
            s = 0.62 * persp(gy, FD_A, FD_HZ) * 4.2
            for i in range(6):
                cart(ctx, 1240 + i * 176 + (row % 2) * 40 + jit * (1 if (i + row) % 2 else -1), gy, s,
                     1 if row % 2 == 0 else -1, tilt=0.03 * math.sin(T * 30 + i) if T > t_go else 0)
            chain_line(ctx, 1180, gy - s * 0.75 + jit, 2140, gy - s * 0.75 - jit, 1.0, 14)
        shards(ctx, T, t_go, 220, region=(360, 340, 1760, 660))
        multiply(ctx, "#101838", 0.6)
    ctx.restore()
    if t_go <= T < t_go + 0.12:
        fx.flash(ctx, 0.6 * (1 - (T - t_go) / 0.12), "#ffffff")
    if T > t_carts:
        a = clamp((T - t_carts) / 0.25)
        D.rrect(ctx, W / 2 - 230, 70, 460, 150, 22, hexrgb("#f3f0e8"), INK, 6, alpha=a)
        left = max(0.0, 11 * 60 - (T - t_carts) * 95)
        D.text(ctx, "%02d:%02d" % (left // 60, left % 60), W / 2, 185, 100, "Inter", hexrgb("#c8392f"), bold=True,
               alpha=a)


def run(ctx, T, S):
    """Склад: бегут вдвоём к камере в глубине."""
    l = T - (S.cue(3) - 0.3)
    cam = PlateCam("stockroom", 1450, 950, 1.0)
    with on(ctx, cam, l):
        paint(ctx, "stockroom")
        multiply(ctx, "#1c2440", 0.6)
        for who, look, d0, seed in ((HERO, 0.0, 0.0, 3), (RUTH, 0.35, 0.3, 5)):
            k = clamp((l - d0) / 2.2)
            e = ease_in(k) * 0.3 + k * 0.7
            x = lerp(2600, 1700, e)
            gy = lerp(1480, 960, e)
            r = persp(gy, STK_A, STK_HZ)
            if k >= 1:
                continue
            p = pose(T, seed, face="scared", look=(0.5, 0.0))
            p.update(ST.gait(l * 2.4 + look, run=True))
            figure(ctx, x, gy, r, -1, p, who, tint=("#3a4868", 0.35))


def hold(ctx, T, S):
    """Внутри камеры: темно, холодно; герой держит ручку, Рут рядом; под дверью проходят тени."""
    l = T - (S.cue(3, end=True) - 1.6)
    cam = PlateCam("walkin_freezer", 1360, 900, Keys((0, 1.1), (6, 1.2, "lin")))
    with on(ctx, cam, l):
        paint(ctx, "walkin_freezer")
        multiply(ctx, "#18203a", 0.62)
        # полоска света под дверью и тени ног
        D.rect(ctx, 1030, 1395, 680, 14, hexrgb("#f4e6c0"), None, 0, wob=0, alpha=0.8)
        for k in range(4):
            u = ((T * 0.35 + k * 0.27) % 1.0)
            x = 1030 + u * 680
            D.rect(ctx, x, 1394, 40, 16, hexrgb("#101018"), None, 0, wob=0, alpha=0.9)
        gy = 1470
        r = 92
        p = pose(T, 3, face="scared", look=(0.6, -0.1), h1=(1.8, -4.1), h2=(1.6, -4.0), sweat=True,
                 f1=(0.4, 0.0), f2=(-0.6, 0.0), lean=-0.1)
        figure(ctx, 1450, gy, r, 1, p, HERO, tint=("#3a4868", 0.4))
        q = pose(T, 5, face="worried", look=(0.6, 0.0), h1=(0.5, -2.6), h2=(0.2, -2.7))
        figure(ctx, 1120, gy + 20, r, 1, q, RUTH, tint=("#3a4868", 0.4))
        for k in range(3):                                           # пар изо рта
            u = (T * 0.7 + k / 3) % 1.0
            D.circle(ctx, 1600 + u * 60, 820 - u * 80, 14 + u * 22, hexrgb("#dfe8f0"), None, 0, alpha=0.4 * (1 - u))


def build(S):
    c, w = S.cue, S.word
    t_go = w("goes", c(2)) - 0.1
    S.shots = [
        Shot(0, day_shot(28)),
        shot(c(1) - 0.3, crack_up),
        shot(c(2) - 0.3, shatter),
        shot(c(3) - 0.3, run),
        shot(c(3, end=True) - 1.6, hold),
    ]
    S.amb = [(c(1) - 0.3, S.dur, "groans", 0.55), (c(3, end=True) - 1.6, S.dur, "freezer_hum", 0.0)]
    S.sfx = [(0.0, "day_hit", 0.7), (c(1) + 0.1, "glass_crack", 0.6), (c(1) + 1.2, "glass_crack", 0.6),
             (t_go, "shatter", 1.0), (t_go + 0.3, "crowd_groan", 0.7), (t_go + 1.0, "chain", 0.5),
             (c(3) - 0.3, "running", 0.6), (c(3, end=True) - 1.6, "freezer_door", 0.8),
             (c(4), "heartbeat", 0.5), (c(4) + 1.4, "heartbeat", 0.5)]
    S.music = [(c(1) - 0.3, c(3) - 0.3, "tension", 0.6), (c(3) - 0.3, c(3, end=True) - 1.6, "action", 0.55),
               (c(3, end=True) - 1.6, S.dur, "dread", 0.55)]
