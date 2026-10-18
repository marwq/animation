"""День 3: у аэропорта есть секрет — 12 миль багажных лент за стенами. Двери открываются только
бейджем, а бейдж у тебя. Катаешься по лентам везде; Пиклз — в сером лотке. Твоё личное метро."""
from scenes.kit import *
from scenes.shared import *

LINES = [("#e8423c", [(-1700, 600), (-1700, 200), (0, 200), (1400, 200), (1400, 600)]),
         ("#2f8fd8", [(-2300, 560), (-900, 560), (-900, 300), (-150, 300), (-150, 600)]),
         ("#f2c230", [(-150, -100), (900, -100), (2250, 380), (3150, 640)])]
STOPS = [("GATE A1", -1700, 600), ("FOOD COURT", 0, 200), ("DUTY FREE", 1400, 200), ("BAG HALL", -900, 560),
         ("LOUNGE", -150, 600), ("HANGAR 9", 3150, 640)]


def shot_secret(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, 5000), (d, 5120)), 520, Keys((0, 1.3), (d, 1.5)))
    room_back(ctx, t, cam, "baghall_on", lambda c: RM.baggage_hall(c, 1.0), (-1400, -1600, 7400, 3400), 0.7)
    with layer(ctx, cam, t):
        RM.curtain(ctx, 5300, RM.FL - 330, 220, 260, t)
        RM.belt(ctx, 4200, 5300, RM.FL - 70, t, 0.0)
        p = R.stand("side", t, 1)
        p.update(face="shock", hturn=0.8, h1=(0.5, -2.9), blink=0)
        DANNY.draw(ctx, 4900, RM.FL, 115, 1, p)
        draw_lab(ctx, 4700, RM.FL, 105, 1, dog_pose(t, "sit", look=-0.4))
    pop_text(ctx, "?", W / 2 + 260, 300, t, 0.6, 220, "#ffe36a", dur=d)


def shot_network(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c2440"), (1, "#0e1428")])
    s = 0.34
    cx, cy = W / 2 - 60, H / 2 + 20
    map_view(ctx, t, cx, cy, s, "night", labels=False)
    D.rect(ctx, 0, 0, W, H, hexrgb("#0e1428"), None, 0, wob=0, alpha=0.45)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(s, s)
    for li, (c, pts) in enumerate(LINES):
        k = clamp((t - li * 0.5) / (d * 0.55))
        L = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))
        acc, out = 0, [pts[0]]
        for a, b in zip(pts, pts[1:]):
            seg = math.hypot(b[0] - a[0], b[1] - a[1])
            if acc + seg <= k * L:
                out.append(b)
            else:
                u = (k * L - acc) / seg
                out.append((lerp(a[0], b[0], u), lerp(a[1], b[1], u)))
                break
            acc += seg
        D.polyline(ctx, out, hexrgb(c), 70, 0.35)
        D.polyline(ctx, out, hexrgb(c), 30)
        for j in range(6):
            u = (t * 0.25 + j / 6) % 1.0
            ix = min(len(out) - 2, int(u * (len(out) - 1))) if len(out) > 1 else 0
            if len(out) > 1:
                a, b = out[ix], out[ix + 1]
                fu = u * (len(out) - 1) - ix
                D.rrect(ctx, lerp(a[0], b[0], fu) - 30, lerp(a[1], b[1], fu) - 22, 60, 44, 8,
                        hexrgb(["#fff6d8", "#ffe36a"][j % 2]), D.INK, 4)
    ctx.restore()
    D.rrect(ctx, W / 2 - 460, 110, 920, 150, 30, hexrgb("#fff6d8"), D.INK, 6)
    miles = 12 * clamp(t / (d * 0.7))
    D.text(ctx, "%d MILES OF BELTS" % int(miles + 0.5), W / 2, 210, 72, D.FONT_TITLE, hexrgb("#1c3f7c"))


def shot_badge(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_TAP = d * 0.45
    cam = Cam(Keys((0, 2400), (d, 2460)), 560, Keys((0, 1.35), (d, 1.5)))
    T = lambda c: tone(c, "day")
    room_back(ctx, t, cam, "tunnel_on", lambda c: RM.tunnel(c, 1.0), (-1400, -500, 7400, 2400), 0.7)
    with layer(ctx, cam, t):
        RM.badge_door(ctx, 2600, T, "green" if t > T_TAP else "red")
        # зомби за окошком двери
        ctx.save()
        ctx.rectangle(2540, 420, 120, 90)
        ctx.clip()
        for k in range(2):
            R.Fig(R.zombie_look(330 + k)).head_only(ctx, 2570 + k * 60 + math.sin(t * 3 + k) * 8, 470, 70, 1,
                                                    {"view": "front", "mouth": 0.9, "neck_line": False})
        ctx.restore()
        tap = smooth(clamp((t - T_TAP + 0.4) / 0.4))
        p = R.stand("side", t, 1)
        p.update(face="smile" if t > T_TAP else "neutral", h1=(0.6 + 0.35 * tap, -2.5 - 0.3 * tap), hturn=0.8)
        J = DANNY.draw(ctx, 2380, RM.FL, 115, 1, p)
        hx, hy = DANNY.world(2380, RM.FL, 115, 1, J["hand1"])
        D.rrect(ctx, hx - 20, hy - 30, 46, 64, 6, hexrgb("#fbfaf6"), D.INK, 3)
        D.rect(ctx, hx - 14, hy - 22, 34, 20, hexrgb("#2f6fd0"), None, 0, wob=0)
        draw_lab(ctx, 2160, RM.FL, 105, 1, dog_pose(t, "sit"))
    if t > T_TAP:
        pop_text(ctx, "BEEP", W / 2 + 330, 360, t, T_TAP, 100, "#4cff8a", dur=1.2)
    for k in range(2):
        pop_text(ctx, "bang", 1450 + k * 120, 300 + k * 80, t, 0.3 + k * 0.6, 60, "#9fc86a", rot=0.15, dur=0.6)


def shot_subway(ctx, t, S):
    d = S.dur - S.cue(3)
    cam = Cam(lambda q: 900 + q * 420, 560, 1.2)
    room_back(ctx, t, cam, "tunnel_long", lambda c: RM.tunnel(c, 1.0, x1=9600), (-1400, -500, 11000, 2400), 0.6)
    with layer(ctx, cam, t):
        RM.belt(ctx, max(-1400, 900 + t * 420 - 1700), 900 + t * 420 + 1700, RM.BELT_Y, t, 2.6)
        x = 900 + t * 420
        DANNY.draw(ctx, x, RM.BELT_Y - 10, 110, 1, ride_pose(t, 1, "laugh"))
        tray(ctx, x - 320, RM.BELT_Y - 8, 1.0)
        draw_lab(ctx, x - 320, RM.BELT_Y - 30, 70, 1, dog_pose(t, "sit", wag=1.0, look=-0.2))
    motion_lines(ctx, 300, 640, -1, 6, 200, 40, a=0.5)
    # схема «метро»
    k = ease_out_back(clamp((t - d * 0.45) / 0.4))
    if k > 0:
        ctx.save()
        ctx.translate(W - 420, 280)
        ctx.scale(k, k)
        D.rrect(ctx, -330, -170, 660, 340, 30, hexrgb("#fbfaf6"), D.INK, 6)
        D.text(ctx, "DANNY'S SUBWAY", 0, -110, 44, D.FONT_TITLE, hexrgb("#1c3f7c"))
        for i, (c, y) in enumerate((("#e8423c", -40), ("#2f8fd8", 40), ("#f2c230", 120))):
            D.line(ctx, -270, y, 270, y, hexrgb(c), 14)
            for j in range(4):
                D.circle(ctx, -240 + j * 160, y, 16, hexrgb("#fbfaf6"), D.INK, 4)
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_secret),
        Shot(c(1) - 0.1, shot_network, "fade", 0.3),
        Shot(c(2) - 0.1, shot_badge, "fade", 0.3),
        Shot(c(3) - 0.1, shot_subway, "whip", 0.25),
    ]
    S.sfx += [(c(2) + (c(3) - c(2)) * 0.45, "radio_beep", 0.8), (c(3), "belt", 0.8)]
    S.music = "fun"
