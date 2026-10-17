"""День 3: сеть умирает, сорок сообщений маме, одно сообщение от Лили, батарея садится."""
from scenes.kit import *
from scenes.shared import atrium_bg, hand_phone, GF
from sets import stores as ST

MINE = ["Mom?", "Are you ok??", "Mom please call me", "I'm at work. I'm safe", "Mom", "MOM", "Where are you",
        "Please answer"]


def shot_bench(ctx, t, S):
    """Ночь, атриум, лунный свет. Герой на скамейке у фонтана, лицо в свете телефона."""
    cam = Cam(Keys((0, 1100), (5, 1050)), Keys((0, 2200), (5, 2330)), Keys((0, 0.9), (5, 1.45)))
    fy = M.AT_LEVELS[0]
    with layer(ctx, cam, t):
        atrium_bg("night", 0.0, {})(ctx)
        C.bench(ctx, 1150, fy + 110, 240, 0.8)
        p = R.stand("front", t, 2)
        p.update(f1=(-0.24, 0), f2=(0.24, 0), hip=(0, 0.62), neck=0.35, h1=(0.05, -1.55), h2=(-0.05, -1.55),
                 face="sad")
        HERO.draw(ctx, 1270, fy + 112, 62, 1, p)
        draw_dog(ctx, 1160, fy + 112, 55, 1, dog_pose(t, "lie"))
    px, py = cam.to_screen(t, 1270, fy + 112 - 62 * 1.6)
    fx.darkness(ctx, 0.7, [fx.Light(px, py, 260 * cam.at(t)[2], glow="#bcd2ff", glow_a=0.35),
                           fx.Light(*cam.to_screen(t, 960, 400), 1400, power=0.55, glow_a=0.0)])
    fx.grade(ctx, "night", 0.6)


def screen_mine(n, sending=True, extra=None):
    def fn(ctx, x, y, w, h):
        D.rect(ctx, x, y + 70, w, 80, hexrgb("#f4f5f7"), None, 0, wob=0)
        D.text(ctx, "Mom ♥", x + w / 2, y + 122, 34, D.FONT_DAY, hexrgb("#1c1c22"), bold=True)
        yy = y + h - 30
        items = []
        for i in range(n):
            items.append((MINE[i % len(MINE)], True))
        if extra:
            items = items + extra
        for txt, mine in reversed(items[-6:]):
            hh = 30 + 30 * 1.25 * max(1, len(txt) // 18 + 1)
            yy -= hh + 46
            ST.bubble(ctx, x + (w - 330 if mine else 20), yy, 310, txt, mine, 28,
                      status="Sending…" if (mine and sending) else None)
    return fn


def shot_texts(ctx, t, S):
    n = 3 + int(t * 2.2)
    hand_phone(ctx, t, screen_mine(n), bars=0, battery=0.35)
    k = clamp((t - 0.6) / 0.3)
    if k > 0:
        # счётчик
        D.text(ctx, "40", W / 2 + 420, 300, 150, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=12, alpha=k)
        D.text(ctx, "UNSENT", W / 2 + 420, 370, 54, D.FONT_TITLE, hexrgb("#d9483b"), stroke=D.INK, slw=8, alpha=k)


LILY_MSG = "Mom says stay where you are. We're okay. Don't come home. ♥ Lily"


def shot_bar(ctx, t, S):
    """4 утра: одна палочка — приходит сообщение от Лили."""
    bars = 1 if t > 0.5 else 0
    typed = clamp((t - 1.2) / 2.2)
    extra = [(LILY_MSG[:int(len(LILY_MSG) * typed)] or "…", False)] if t > 1.1 else None

    def fn(ctx, x, y, w, h):
        screen_mine(6, True, extra)(ctx, x, y, w, h)
        if t > 1.1:
            D.text(ctx, "Lily", x + 30, y + h - 30 - 210, 22, D.FONT_DAY, hexrgb("#8a8d96"), "left")
    hand_phone(ctx, t, fn, bars=bars, battery=0.22)
    if 0.5 < t < 1.1:
        fx.glow(ctx, W / 2 - 150, H / 2 - 360, 120, "#fff6c8", 0.6 * (1 - (t - 0.5) / 0.6))
    D.text(ctx, "4:02 AM", W / 2, 120, 50, D.FONT_DAY, hexrgb("#f7eedb"), bold=True, alpha=0.8)


def shot_face(ctx, t, S):
    """Крупно лицо в свете экрана: глаза блестят."""
    cam = Cam(960, 520, Keys((0, 1.0), (3, 1.08)))
    with layer(ctx, cam, t):
        D.col(ctx, hexrgb("#121019"))
        ctx.paint()
        p = {"view": "front", "face": "cry" if t > 1.0 else "sad", "tears_t": t * 0.6, "neck_line": True,
             "hturn": 0.0, "look": (0, 0.6), "blink": R.blink(t, 2)}
        HERO.head_only(ctx, 960, 470, 420, 1, p)
    fx.darkness(ctx, 0.55, [fx.Light(960, 1000, 900, glow="#bcd2ff", glow_a=0.35)])
    fx.grade(ctx, "night", 0.4)


def shot_battery(ctx, t, S):
    sc = clamp(1 - (t - 1.4) / 0.25)
    hand_phone(ctx, t, screen_mine(6, True, [(LILY_MSG, False)]), screen=sc, bars=0, battery=0.04)
    if 0.4 < t < 1.4 and int(t * 4) % 2 == 0:
        D.text(ctx, "1%", W / 2 + 420, 300, 150, D.FONT_TITLE, hexrgb("#d9483b"), stroke=D.INK, slw=12)
        D.text(ctx, "BATTERY", W / 2 + 420, 370, 54, D.FONT_TITLE, hexrgb("#f7eedb"), stroke=D.INK, slw=8)


def shot_charge(ctx, t, S):
    """Магазин электроники: стена телевизоров светится, телефон на зарядке, он читает снова."""
    cam = Cam(Keys((0, 960), (4, 1000)), Keys((0, 560), (4, 600)), Keys((0, 1.25), (4, 1.0)))
    with layer(ctx, cam, t):
        ST.electronics(ctx, t, 1.0)
        p = R.stand("side", t, 2)
        p.update(k1=(2.2, 1.9), k2=(2.05, 1.75), hip=(0, 1.5), lean=0.15, neck=0.35, h1=(0.75, -1.05),
                 h2=(0.7, -1.0), face="smile")
        HERO.draw(ctx, 820, 900, 95, 1, p)
        D.rect(ctx, 870, 760, 22, 40, hexrgb("#1c1c22"), D.INK, 2, wob=0)
        D.curve(ctx, [(880, 800), (900, 860), (980, 870), (1080, 840), (1120, 780)], D.INK, 3)
        draw_dog(ctx, 1050, 905, 85, -1, dog_pose(t, "lie"))
    fx.darkness(ctx, 0.5, [fx.Light(960, 300, 1200, power=0.7, glow="#bcd2ff", glow_a=0.2),
                           fx.Light(*cam.to_screen(t, 900, 780), 300, glow="#cfe0ff", glow_a=0.3)])
    fx.grade(ctx, "night", 0.35)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_bench),
        Shot(c(0) + 1.8, shot_texts),
        Shot(c(2) - 0.1, shot_bar),
        Shot(c(4) + 0.4, shot_face),
        Shot(c(5) - 0.1, shot_battery),
        Shot(c(6) - 0.2, shot_charge, "black", 0.4),
    ]
    S.sfx += [(c(2) + 0.5, "notify", 0.8)]
