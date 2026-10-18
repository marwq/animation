"""День 3: голод, рассвет, ресторан. Зомби в халате всё ещё ждёт омлет. Тележка: бекон, блины,
сорок баночек джема. Скрип колеса — все халаты оборачиваются — самая быстрая тележка в истории."""
from scenes.kit import *
from scenes.shared import *

ROBES = [R.zombie_look(1300 + i, "robe") for i in range(8)]
TOD = "morning"


def buffet_bg(ctx, t, cam, scale=1.0):
    with layer(ctx, cam, t):
        bg(ctx, "buffet_m", (-500, -300, 3800, 1700), lambda c: IN.buffet(c, TOD, 1.0), scale)
        IN.chocolate_flow(ctx, t)
    # утренний свет из окон
    fx.glow(ctx, *cam.to_screen(t, 1300, 200), 900, "#fff0c8", 0.18)


def robe_crowd(ctx, t, turn=None, skip=()):
    """Зомби в халатах по залу; turn — момент, когда все оборачиваются."""
    spots = [(IN.OMELET_X + 40, 960, -1), (1700, 1000, 1), (2250, 950, -1), (2700, 1010, 1), (380, 1020, 1),
             (3000, 960, -1)]
    for i, (x, y, f) in enumerate(spots):
        if i in skip:
            continue
        p = zombie_idle(t, i)
        if i == 0:
            p.update(h1=(0.55, -1.9), h2=(0.5, -1.85))
        ht = 1.0
        if turn is not None:
            k = clamp((t - turn) / 0.25)
            ht = 1.0 - 2.0 * ease_out(k) if f < 0 else 1.0
            if k > 0:
                p.update(mouth=0.8, neck=0.1)
        p["hturn"] = ht
        R.Fig(ROBES[i]).draw(ctx, x, y, 110 * (1 + (y - 1000) / 900), f, p)
        if i == 0:
            # тарелка в руках
            D.ellipse(ctx, x - 40 * f, y - 210, 40, 8, hexrgb("#ffffff"), D.INK, 2)


def shot_hungry(ctx, t, S):
    cam = Cam(Keys((0, 1300), (3, 1240)), 560, Keys((0, 1.55), (3, 1.7)))
    bridge_back(ctx, t, cam, "dawn", 1.0, sun=(1700, 330, 60))
    with layer(ctx, cam, t):
        p = R.stand("side", t, 1)
        p.update(face="worried", h1=(0.3, -1.75), h2=(0.25, -1.7), lean=0.1, hturn=0.7)
        LEO_CAP.draw(ctx, 1250, BR.BF + 40, 120, 1, p)
        draw_cat(ctx, 1420, BR.BF - 20, 120, -1, cat_pose(t, "sit", hat=True, meow=1.0 if 1.4 < t < 1.8 else 0))
    pop_text(ctx, "GRRRUMBLE", 760, 760, t, 0.3, 90, "#fff6d8", rot=0.06, dur=1.4)


def shot_sneak(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    w = Walk(Keys((0, 150), (d, 1100, "lin")), 990, 110, "sneak", t1=12)
    cam = Cam(lambda tt: w.x(tt) + 380, 600, 1.05, drift=0.8)
    buffet_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        robe_crowd(ctx, t)
        w.draw(ctx, LEO_CAP, t, {"face": "worried", "look": (0.5, 0.0)})
    if t > 1.0:
        x, y = cam.to_screen(t, IN.OMELET_X + 40, 700)
        D.rrect(ctx, x - 150, y - 330, 300, 90, 40, hexrgb("#ffffff"), D.INK, 4)
        D.poly(ctx, [(x - 30, y - 242), (x, y - 242), (x - 50, y - 200)], hexrgb("#ffffff"), D.INK, 4, wob=0)
        D.text(ctx, "...omelet?", x, y - 272, 44, D.FONT_HAND, D.INK)


ITEMS = [("BACON", "#b8442a"), ("PANCAKES", "#e0a24a"), ("x40 JAM", "#e8423c")]


def shot_load(ctx, t, S):
    cam = Cam(1150, 720, Keys((0, 1.6), (4, 1.75)))
    buffet_bg(ctx, t, cam, 1.4)
    with layer(ctx, cam, t):
        IN.room_cart(ctx, 1150, 1000, 1.3, load=0)
        p = R.stand("side", t, 1)
        reach = (t * 1.6) % 1
        p.update(face="happy", h1=(0.7 + 0.2 * math.sin(reach * TAU), -2.1), h2=(0.6, -1.9))
        LEO_CAP.draw(ctx, 900, 1000, 120, 1, p)
        # стопки еды растут
        n = min(3, int(t / 1.1) + 1)
        for i in range(n):
            k = ease_out_back(clamp((t - i * 1.1) / 0.3))
            x = 1080 + i * 70
            if i == 0:
                for j in range(4):
                    D.curve(ctx, [(x - 50, 800 - j * 9), (x - 15, 790 - j * 9), (x + 15, 804 - j * 9), (x + 50, 796 - j * 9)],
                            hexrgb("#b8442a"), 11 * k)
            elif i == 1:
                for j in range(int(6 * k)):
                    D.ellipse(ctx, x, 802 - j * 13, 52, 10, hexrgb("#e0a24a"), D.INK, 2)
            else:
                for j in range(int(12 * k)):
                    D.rrect(ctx, x - 40 + (j % 4) * 22, 790 - (j // 4) * 22, 18, 20, 5,
                            hexrgb(["#e8423c", "#7a4fc2", "#f2c230"][j % 3]), D.INK, 1.5)
    for i, (name, c) in enumerate(ITEMS):
        tt = i * 1.1 + 0.15
        pop_text(ctx, name, 700 + i * 300, 260 + (i % 2) * 70, t, tt, 70, c, rot=-0.05 + 0.05 * i, dur=1.6, shake=False)


def shot_squeak(ctx, t, S):
    d = S.cue(4) - S.cue(3) + 0.2
    w = Walk(Keys((0, 900), (d + 1, 1400, "lin")), 1000, 120, "push", t1=6)
    cam = Cam(lambda tt: w.x(tt) + 150, 700, 1.4)
    buffet_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        robe_crowd(ctx, t, skip=(4,))
        x = w.x(t)
        IN.room_cart(ctx, x + 160, 1000, 1.2, load=1)
        w.draw(ctx, LEO_CAP, t, {"face": "worried", "h1": (0.75, -1.9), "h2": (0.7, -1.85)})
    for k in range(3):
        tt = 0.3 + k * 0.7
        if 0 < t - tt < 0.5:
            sx, sy = cam.to_screen(t, w.x(t) + 260, 990)
            pop_text(ctx, "squeak", sx, sy - 60, t, tt, 54, "#fff6d8", rot=0.1, dur=0.5)


def shot_turn(ctx, t, S):
    """Все халаты разом поворачиваются."""
    cam = Cam(Keys((0, 1500), (1.6, 1900)), 620, Keys((0, 0.8), (1.6, 0.95)), shake=lambda tt: shake_k(tt, 0.35, 0.4, 0.5))
    buffet_bg(ctx, t, cam)
    with layer(ctx, cam, t):
        robe_crowd(ctx, t, turn=0.3)
    if t > 0.3:
        for i in range(6):
            a = clamp((t - 0.35) / 0.1)
            x = 320 + i * 260
            D.text(ctx, "!", x, 330 + (i % 2) * 40, 120, D.FONT_TITLE, hexrgb("#e8423c"), alpha=a, stroke=D.INK, slw=10)


def shot_escape(ctx, t, S):
    """Гонка: Лео толкает тележку изо всех сил, потом запрыгивает на неё. Блины летят."""
    x = Keys((0, 200), (3.2, 3300, "in"))
    cam = Cam(lambda tt: x(tt) + 200, 650, 0.85, shake=0.15)
    deck_back(ctx, t, cam, "morning", 1.0, sun=(3000, 200, 60), clouds=True)
    with layer(ctx, cam, t):
        cx = x(t)
        ride = t > 1.4
        for i in range(5):
            zx = cx - 600 - i * 170 + math.sin(t * 3 + i) * 30
            p = R.gait(t * 2.2 + i * 0.3, "shamble", "side", i)
            p.update(a1=(1.5, -0.1), a2=(1.3, 0.0), mouth=0.9)
            R.Fig(ROBES[i]).draw(ctx, zx, 1000 + (i % 2) * 40, 100, 1, p)
        IN.room_cart(ctx, cx + 170, 1010, 1.15, load=1, wobble=math.sin(t * 25) * 0.04)
        if not ride:
            w = Walk(x, 1010, 115, "run", t1=4)
            w.draw(ctx, LEO_CAP, t, {"face": "scream", "blink": 0, "h1": (0.8, -1.9), "h2": (0.75, -1.85),
                                     "lean": 0.4})
        else:
            p = R.stand("side", t, 1)
            p.update(face="laugh", h1=(0.6, -2.0), h2=(0.55, -1.95), f1=(0.45, -0.95), f2=(-0.4, 0.0), lean=0.2)
            LEO_CAP.draw(ctx, cx + 60, 1010 - 60, 115, 1, p)
        # летящие блины
        for k in range(4):
            tt = t - 0.5 - k * 0.6
            if tt > 0:
                px = cx + 120 - tt * 500
                py = 780 - tt * 400 + 700 * tt * tt
                ctx.save()
                ctx.translate(px, py)
                ctx.rotate(tt * 8)
                D.ellipse(ctx, 0, 0, 40, 9, hexrgb("#e0a24a"), D.INK, 2)
                ctx.restore()
    speed_lines(ctx, t, n=36, a=0.45)
    if t > 1.4:
        pop_text(ctx, "WHEEE—", 1250, 280, t, 1.45, 110, "#fff6d8", dur=1.6)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_hungry),
        Shot(c(1) - 0.2, shot_sneak, "fade", 0.3),
        Shot(c(2) - 0.1, shot_load),
        Shot(c(3) - 0.1, shot_squeak),
        Shot(c(4) - 0.2, shot_turn),
        Shot(c(5) - 0.15, shot_escape, "whip", 0.3),
    ]
    S.sfx += [(0.3, "stomach", 1.0), (c(3) + 0.2, "squeak", 0.9), (c(3) + 0.9, "squeak", 0.9),
              (c(4) + 0.1, "hiss_crowd", 0.9)]
    S.music = "sneak"
