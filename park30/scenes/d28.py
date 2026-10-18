"""День 28 (ночь → утро): в полночь компьютер пускает одну пробную ракету. Город за мостом её слышит. К утру мост
движется: тысячи, на два дня раньше. Парк заполняется."""
from scenes.kit import *
from scenes.shared import *

FL = PK.FL


def shot_rocket(ctx, t, S):
    """Полночь: из-за замка взлетает одна ракета — БАХ."""
    d = S.cue(1) - 0.1
    T_BANG = min(S.cue(0, True) - 0.35, d - 0.6)          # «…одну пробную ракету. Бах.»
    T_UP = T_BANG - 1.0
    cam = Cam(0, FL - 900, 0.36, anchor=(0, 520))
    sky_back(ctx, t, cam, "night", -5000, 5000, moon=(-1600, -900, 100))
    with layer(ctx, cam, t):
        PK.plaza(ctx, "night", -5000, 5000, c="#3a5a3a")
        CA.castle(ctx, 0, FL, 0.9, "night", t, lit=0.2, gate_open=0.0)
        k = clamp((t - T_UP) / (T_BANG - T_UP))
        LK.rocket(ctx, 650, FL - 1100, 500, -1150, k, "#ffd23a")
        if t > T_BANG:
            LK.firework(ctx, 500, -1150, clamp((t - T_BANG) / 2.2), 2.0, "#ff4a6a", seed=28, n=36)
    fx.darkness(ctx, 0.2)
    if T_BANG <= t < T_BANG + 0.12:
        fx.flash(ctx, 0.35)
    clock_badge(ctx, "12:00", t, W - 260, 150, "#ff3a2a")
    if t > T_UP:
        pop_text(ctx, "TEST", W / 2 - 420, 300, t, T_UP, 80, "#fff6d8", dur=T_BANG - T_UP + 0.3, shake=False)
    if t > T_BANG:
        pop_text(ctx, "BANG!", W / 2 - 430, 430, t, T_BANG, 150, "#ff6a5a", dur=d)


def shot_town(ctx, t, S):
    """Город за мостом ночью: эхо докатывается — и тысячи голов на улицах поворачиваются к острову."""
    d = S.cue(2) - S.cue(1)
    T_TURN = 0.6
    D.vgrad(ctx, 0, 0, W, H, [(0, "#060a1a"), (1, "#141a3a")])
    ctx.save()
    ctx.translate(-200, 600)
    ctx.scale(0.55, 0.55)
    LK.town(ctx, 0, 4400, 0, "night", lit=0.1, seed=11)
    ctx.restore()
    D.rect(ctx, 0, 600, W, H - 600, hexrgb("#1e2436"), None, 0, wob=0)
    # звуковая волна приходит справа (от острова)
    for k in range(3):
        ph = clamp((t - k * 0.25) / 1.2)
        if 0 < ph < 1:
            D.circle(ctx, W + 600, 500, 300 + ph * 1600, None, hexrgb("#ffd23a"), 8 * (1 - ph), alpha=1 - ph)
    turn = smooth(clamp((t - T_TURN) / 0.6))
    r = rng(28)
    rows = sorted((r.uniform(620, 1060), r.uniform(-50, W + 50), i) for i in range(70))
    for y, x, i in rows:
        s = lerp(36, 110, (y - 620) / 440)
        L = R.park_zombie(2800 + i)
        R.Fig(L).head_only(ctx, x, y, s * 1.6, 1, {"view": "side", "hturn": lerp(0.9, 0.0, turn), "mouth": 0.3,
                                                 "neck_line": False, "blink": 0})
        if turn > 0.6:
            D.circle(ctx, x + s * 0.3, y - s * 0.1, 3 + s * 0.03, hexrgb("#e8ff6a"), None, 0, alpha=0.8)
    if t > T_TURN:
        pop_text(ctx, "THE TOWN HEARS IT", W / 2, 200, t, T_TURN, 80, "#ffd23a", dur=d, shake=False)


def shot_bridge(ctx, t, S):
    """Утро: мост движется — тысячи бредут на остров. На два дня раньше."""
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 1800), (d, 2600)), FL - 300, 0.5, anchor=(2000, 520))
    sky_back(ctx, t, cam, "morning", -3000, 9000, sun=(-800, 200, 120))
    with layer(ctx, cam, t):
        LK.water(ctx, t, -3000, 9000, FL - 120, FL + 1600, "morning")

        def crowd(c, x0, x1, deck_y):
            rr = rng(7)
            for k in range(120):
                zx = x0 + (rr.uniform(0, x1 - x0) + t * 70) % (x1 - x0)
                g = R.gait(rr.random() + 70 * t / 92 / R.GAITS["shamble"]["L"], "shamble", "side", k)
                R.Fig(R.park_zombie(2900 + k)).draw(c, zx, deck_y - 10 - rr.uniform(0, 30), 92, 1, g)
        LK.bridge(ctx, -1000, 7000, FL - 160, "morning", t, cars=True, jam=1.0, crowd=crowd)
    counter_badge(ctx, "BRIDGE", "1000s", W - 330, 160, "#9fc86a", 460)
    if t > d * 0.45:
        pop_text(ctx, "2 DAYS EARLY", W / 2 - 300, 240, t, d * 0.45, 100, "#ff6a5a", dur=d, shake=True)


def shot_filling(ctx, t, S):
    """Главная улица заполняется — от редкой толпы до сплошной стены."""
    d = S.dur - S.cue(3)
    cam = Cam(2000, FL - 350, Keys((0, 0.55), (d, 0.42)))
    street_back(ctx, t, cam, "morning", -1400, 6000, shut=True, sun=(-800, 200, 120))
    k = smooth(clamp(t / (d * 0.7)))
    with layer(ctx, cam, t):
        # каждый идёт слева к своему месту и там останавливается — улица заполняется
        if not hasattr(shot_filling, "crowd"):
            shot_filling.crowd = make_crowd(281, 200, -400, 4400, FL + 20, FL + 600, 100, 130)
        for m in shot_filling.crowd:
            i = m.seed - 281000
            v = 120 + (i * 37) % 60
            start = m.x - 2600 - (i * 113) % 5200
            x = min(m.x, start + v * (t + 6.0))
            if x < m.x:
                p = R.gait(m.ph0 + (x - start) / m.s / R.GAITS["shamble"]["L"], "shamble", "side", m.seed)
                f = 1
            else:
                p = zombie_idle(t, m.seed % 97)
                f = m.f
            m.fig.draw(ctx, x, m.y, m.s, f, p)
    counter_badge(ctx, "IN THE PARK", "{:,}".format(int(lerp(4000, 9000, k))), W - 380, 160, "#9fc86a", 600)
    pop_text(ctx, "FILLING UP", W / 2 - 300, 240, t, 0.4, 90, "#fff6d8", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_rocket, "fade", 0.4),
        Shot(c(1) - 0.1, shot_town, "fade", 0.3),
        Shot(c(2) - 0.1, shot_bridge, "white", 0.4),
        Shot(c(3) - 0.1, shot_filling, "fade", 0.3),
    ]
    S.tods = [(0, "night"), (c(2), "morning")]
    t_bang = min(c(0, True) - 0.35, c(1) - 0.1 - 0.6)
    S.sfx += [(t_bang - 1.0, "rocket", 0.8), (t_bang, "firework", 1.0), (c(1) + 0.6, "zombie_groan", 0.8),
              (c(2) + 0.3, "shuffle", 1.0), (c(2) + 0.6, "crowd_groan", 0.8), (c(3) + 0.3, "shuffle", 1.0)]
    S.music = [(0, "mystery", 0.6), (c(1), "tension", 0.8), (c(2), "chase", 0.9)]
