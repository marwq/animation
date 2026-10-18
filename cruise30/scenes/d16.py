"""День 16: восемь вечера, стук в дверь мостика. В окошке белый китель — капитан. Двадцать лет он
заступал на вахту в восемь и помнит до сих пор. Анкор мурлычет у двери — не понимает.
Ты не открываешь. С тех пор она каждую ночь спит у этой двери."""
from scenes.kit import *
from scenes.shared import *

KNOCKS = (0.8, 1.15, 1.5)


def dusk_bridge(ctx, t, cam):
    bridge_back(ctx, t, cam, "dusk", 0.0, sun=(2300, 560, 60), battery=55, autopilot=False)


def door_knock(t):
    for t0 in KNOCKS:
        if 0 <= t - t0 < 0.12:
            return math.sin((t - t0) * 80) * 6
    return 0.0


def shot_knock(ctx, t, S):
    cam = Cam(Keys((0, 700), (3.5, 500)), 560, Keys((0, 0.95), (3.5, 1.2)))
    dusk_bridge(ctx, t, cam)
    with layer(ctx, cam, t):
        ctx.save()
        ctx.translate(door_knock(t), 0)
        BR.door(ctx, BR.DOOR_X, lambda c: c if not isinstance(c, str) else hexrgb(c), glass=True)
        ctx.restore()
        p = R.stand("side", t, 1)
        frozen = t > KNOCKS[0]
        p.update(face="shock" if frozen else "neutral", blink=0 if frozen else p["blink"], hturn=-0.8 if frozen else 0.8)
        LEO_CAP.draw(ctx, 900, BR.BF + 40, 120, 1, p)
        draw_cat(ctx, 1120, BR.BF + 40, 95, -1, cat_pose(t, "sit", look=-0.5 if frozen else 0.0))
    for t0 in KNOCKS:
        pop_text(ctx, "KNOCK", 420 + (t0 - KNOCKS[0]) * 500, 330 - (t0 - KNOCKS[0]) * 120, t, t0, 90, "#fff6d8",
                 dur=0.9)
    D.rrect(ctx, 1580, 820, 280, 110, 16, hexrgb("#0e1410"), D.INK, 5)
    D.text(ctx, "20:00", 1720, 900, 72, D.FONT_TITLE, hexrgb("#ff4a3a"))


def captain_window(ctx, t, cam, tilt=0.0, hand=False, down=0.0):
    with layer(ctx, cam, t):
        ctx.save()
        ctx.rectangle(BR.DOOR_X - 50, 360, 100, 120)
        ctx.clip()
        D.rect(ctx, BR.DOOR_X - 50, 360, 100, 120, hexrgb("#2a2a40"), None, 0, wob=0)
        p = zombie_idle(t, 2, "front")
        p.update(hturn=0.0, htilt=tilt, look=(0, down), mouth=0.3, lean=0.0, neck=0.0)
        CAPTAIN_Z.draw(ctx, BR.DOOR_X, 405 + 3.39 * 62 * 1.05, 62, 1, p)
        if hand:
            D.circle(ctx, BR.DOOR_X - 20, 440, 16, R.CAPTAIN_Z.head, D.INK, 3)
        ctx.restore()
        D.rect(ctx, BR.DOOR_X - 50, 360, 100, 120, (1, 1, 1), None, 0, wob=0, alpha=0.12)


def shot_window(ctx, t, S):
    cam = Cam(BR.DOOR_X, Keys((0, 440), (4, 420)), Keys((0, 2.2), (4, 3.2)))
    dusk_bridge(ctx, t, cam)
    captain_window(ctx, t, cam)
    labels = [(0.6, "WHITE UNIFORM"), (1.6, "GOLD STRIPES")]
    for i, (tt, txt) in enumerate(labels):
        pop_text(ctx, txt, 1450, 300 + i * 120, t, tt, 64, "#ffe36a", dur=4, shake=False)
    if t > 2.6:
        pop_text(ctx, "THE CAPTAIN.", 520, 230, t, 2.6, 90, "#fff6d8", dur=3, shake=False)


def shot_memory(ctx, t, S):
    """Воспоминание: живой капитан с кошкой на плече заступает на вахту. Годы листаются."""
    cam = Cam(1300, 560, Keys((0, 1.1), (5, 1.25)))
    bridge_back(ctx, t, cam, "night", 1.0, moon=(2000, 150, 40), autopilot=True)
    with layer(ctx, cam, t):
        p = R.stand("side", t, 2)
        sal = smooth(clamp((t - 0.6) / 0.4))
        p.update(face="smile", h1=(0.32, -3.55) if sal > 0.5 else (0.4, -2.0), h2=(0.5, -2.1), hturn=0.8)
        J = CAPTAIN.draw(ctx, 1250, BR.BF + 40, 125, 1, p)
        draw_cat(ctx, 1235, BR.BF + 40 - 3.0 * 125 * 1.05, 75, 1, cat_pose(t, "lie"))
    fx.grade(ctx, "memory", 0.65)
    yrs = ["2006", "2011", "2016", "2021", "2026"]
    i = min(len(yrs) - 1, int(t / 0.7))
    D.rrect(ctx, 120, 820, 360, 130, 24, hexrgb("#fff6d8"), D.INK, 6)
    D.text(ctx, yrs[i], 300, 912, 90, D.FONT_TITLE, D.INK)
    D.rrect(ctx, 1440, 820, 360, 130, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "20:00", 1620, 912, 90, D.FONT_TITLE, hexrgb("#ff4a3a"))
    D.col(ctx, hexrgb("#ffffff"), 0.35)
    ctx.set_line_width(80)
    ctx.rectangle(0, 0, W, H)
    ctx.stroke()


def shot_purr(ctx, t, S):
    cam = Cam(Keys((0, 380), (4, 300)), Keys((0, 640), (4, 600)), Keys((0, 1.4), (4, 1.6)))
    dusk_bridge(ctx, t, cam)
    captain_window(ctx, t, cam, tilt=0.3 * clamp((t - 1.0) / 1.0), hand=t > 1.5, down=1.0)
    with layer(ctx, cam, t):
        k = clamp(t / 0.8)
        cx = lerp(900, BR.DOOR_X + 150, ease_out(k))
        if k < 1:
            draw_cat(ctx, cx, BR.BF + 40, 100, -1, cat_pose(t, "run", phase=t * 3))
        else:
            rub = math.sin(t * 3) * 10
            draw_cat(ctx, cx + rub, BR.BF + 40, 100, -1, cat_pose(t, "stand", tail=1.5, look=-0.6))
            for i in range(3):
                ph = (t * 0.7 + i / 3) % 1
                D.text(ctx, "♥", cx - 40 + i * 30, BR.BF - 120 - ph * 90, 40, D.FONT_HAND, hexrgb("#f05a8a"),
                       alpha=1 - ph)
    if t > 1.0:
        pop_text(ctx, "prrrr...", 1250, 300, t, 1.0, 80, "#fff6d8", dur=2.5, shake=False)


def shot_sleep(ctx, t, S):
    cam = Cam(Keys((0, 500), (6, 560)), Keys((0, 640), (6, 660)), Keys((0, 1.2), (6, 1.3)))
    bridge_back(ctx, t, cam, "night", 0.0, moon=(2000, 150, 40), battery=52, autopilot=False)
    with layer(ctx, cam, t):
        draw_cat(ctx, BR.DOOR_X + 150, BR.BF + 40, 100, -1, cat_pose(t, "sleep"))
        p = floor_sit_pose(t, 1, "sad", hug=True)
        p.update(htilt=0.15, blink=1.0 if t > 2.5 else 0.0)
        LEO_CAP.draw(ctx, 700, BR.BF + 40, 115, -1, p)
    fx.darkness(ctx, 0.4, [fx.Light(*cam.to_screen(t, 1460, 200), 900, power=0.5, glow="#cfe0ff", glow_a=0.1)])
    nights = ["NIGHT 16", "NIGHT 17", "NIGHT 18", "NIGHT 19"]
    i = min(3, int(t / 1.3))
    D.text(ctx, nights[i], W - 300, 160, 64, D.FONT_TITLE, hexrgb("#cfe0ff"), stroke=D.INK, slw=8)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_knock),
        Shot(c(1) - 0.1, shot_window),
        Shot(c(2) - 0.1, shot_memory, "white", 0.4),
        Shot(c(3) - 0.1, shot_purr, "fade", 0.3),
        Shot(c(4) - 0.1, shot_sleep, "fade", 0.4),
    ]
    S.sfx += [(KNOCKS[0], "knock", 0.9), (KNOCKS[1], "knock", 0.9), (KNOCKS[2], "knock", 0.9),
              (c(3) + 1.0, "purr", 0.9)]
    S.music = "sad"
