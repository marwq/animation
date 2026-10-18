"""День 13: свет мигает, ленты встают. В тишине — шарканье: один из них нашёл путь в туннели. Ленты
задним ходом, огнеупорная дверь, баррикада из чемоданов. Твоё метро стало меньше."""
from scenes.kit import *
from scenes.shared import *
from scenes.d03 import LINES

DOOR_X = 2500


def tunnel_bg(ctx, t, cam, power):
    room_back(ctx, t, cam, "tunnel_%s" % power, lambda c: RM.tunnel(c, power), (-1400, -500, 7400, 2400), 0.7)


def flicker(t):
    return 1.0 if (math.sin(t * 23) + math.sin(t * 7.3)) > -0.6 else 0.0


def shot_stop(ctx, t, S):
    d = S.cue(1) - 0.1
    T_STOP = d * 0.5
    on = flicker(t) if t < T_STOP else 0.0
    cam = Cam(lambda q: 1200 + min(q, T_STOP) * 300, 560, 1.15, shake=lambda q: shake_k(q, T_STOP, 0.4, 1.0))
    tunnel_bg(ctx, t, cam, 1.0)
    x = 1200 + min(t, T_STOP) * 300
    with layer(ctx, cam, t):
        RM.belt(ctx, -1400, 7000, RM.BELT_Y, t if t < T_STOP else T_STOP, 2.0)
        DANNY_JACKET.draw(ctx, x, RM.BELT_Y - 10, 110, 1, ride_pose(t if t < T_STOP else 0, 1,
                                                                    "happy" if t < T_STOP else "shock"))
        tray(ctx, x - 320, RM.BELT_Y - 8, 1.0)
        draw_lab(ctx, x - 320, RM.BELT_Y - 30, 70, 1, dog_pose(t, "sit", look=-0.2))
    fx.darkness(ctx, 0.8 * (1 - on), [fx.Light(W / 2, H / 2, 300, power=0.2, glow_a=0.0)])
    if t > T_STOP:
        pop_text(ctx, "CLUNK.", W / 2 + 300, 280, t, T_STOP, 120, "#fff6d8", dur=1.5)


def shot_listen(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    cam = Cam(2100, 480, Keys((0, 1.6), (d, 2.0)))
    tunnel_bg(ctx, t, cam, 1.0)
    with layer(ctx, cam, t):
        RM.belt(ctx, -1400, 7000, RM.BELT_Y, 0, 0)
        p = ride_pose(0, 1, "scared")
        p.update(hturn=-0.8, blink=0)
        DANNY_JACKET.draw(ctx, 2100, RM.BELT_Y - 10, 110, 1, p)
        draw_lab(ctx, 1780, RM.BELT_Y - 30, 70, -1, dog_pose(t, "sit", look=0.3))
    fx.darkness(ctx, 0.75, [fx.Light(*cam.to_screen(t, 2140, RM.BELT_Y - 300), 360, kind="cone", ang=math.pi,
                                     spread=0.4, power=0.9, glow="#ffe9a0")])
    for k in range(5):
        pop_text(ctx, "shff", 160 + k * 90, 560 - (k % 2) * 60, t, 0.4 + k * d * 0.15, 50 + k * 8, "#9fc86a", dur=1.2,
                 shake=False)


def shot_eyes(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(900, 420, Keys((0, 1.6), (d, 2.0)), shake=0.15)
    tunnel_bg(ctx, t, cam, 0.0)
    with layer(ctx, cam, t):
        RM.belt(ctx, -1400, 7000, RM.BELT_Y, 0, 0)
        p = zombie_reach(t, 3)
        p.update(mouth=1.0)
        R.Fig(R.zombie_look(1313, "ramp")).draw(ctx, 900 + t * 60, RM.FL, 120, 1, p)
    fx.darkness(ctx, 0.8, [fx.Light(W / 2 + 500, H / 2, 900, kind="cone", ang=math.pi, spread=0.3, power=1.0,
                                    glow="#ffe9a0")])
    zombie_glow_eyes(ctx, *cam.to_screen(t, 900 + t * 60 + 15, RM.FL - 3.4 * 120), 14, 1.0)


def shot_barricade(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    T_SLAM, T_STACK = d * 0.3, d * 0.42
    cam = Cam(Keys((0, 1700), (T_SLAM, DOOR_X + 300)), 520, Keys((0, 0.9), (T_SLAM, 1.1)),
              shake=lambda q: shake_k(q, T_SLAM, 0.5, 1.6))
    tunnel_bg(ctx, t, cam, 1.0)
    T = lambda c: tone(c, "day")
    with layer(ctx, cam, t):
        RM.belt(ctx, -1400, 7000, RM.BELT_Y, -t, 2.0)
        if t > T_SLAM - 0.1:
            RM.fire_door(ctx, DOOR_X, T)
        else:
            D.rect(ctx, DOOR_X - 150, 330, 300, RM.FL - 330, hexrgb("#141824"), D.INK, 6, wob=0)
            ctx.save()
            ctx.translate(DOOR_X + 150, 330)
            ctx.scale(0.25, 1)
            D.rect(ctx, 0, 0, 300, RM.FL - 330, T("#d8443c"), D.INK, 6, wob=0)
            ctx.restore()
        if t < T_SLAM:
            x = Keys((0, 1500), (T_SLAM, DOOR_X + 300, "in"))(t)
            w = Walk(Keys((0, 1500), (T_SLAM, DOOR_X + 300, "in")), RM.FL, 118, "run", t1=T_SLAM + 1)
            w.draw(ctx, DANNY_JACKET, t, {"face": "scream"})
            draw_lab(ctx, x - 200, RM.FL, 105, 1, dog_pose(t, "run", phase=t * 3))
        else:
            n = int(clamp((t - T_STACK) / (d - T_STACK - 0.4)) * 14)
            r = rng(13)
            for i in range(n):
                row, col = i // 3, i % 3
                D.rrect(ctx, DOOR_X + 160 + col * 95 - row * 6, RM.FL - 80 - row * 75, 92, 72, 10,
                        hexrgb(r.choice(RM.BAG_COLS)), D.INK, 3)
            p = R.stand("side", t, 1)
            sh = math.sin(t * 50) * 0.04
            p.update(face="determined", h1=(0.7 + sh, -2.4), h2=(0.6 - sh, -2.3), lean=0.15)
            DANNY_JACKET.draw(ctx, DOOR_X + 620, RM.FL, 118, -1, p)
            draw_lab(ctx, DOOR_X + 900, RM.FL, 105, -1, dog_pose(t, "sit"))
    if t > T_SLAM:
        pop_text(ctx, "SLAM!", W / 2 - 300, 280, t, T_SLAM, 150, "#fff6d8", dur=1.0)
    if t > T_STACK:
        n = int(clamp((t - T_STACK) / (d - T_STACK - 0.4)) * 14)
        counter_badge(ctx, "SUITCASES", n, W - 300, 160, "#ffe36a", 480)


def shot_smaller(ctx, t, S):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c2440"), (1, "#0e1428")])
    s = 0.34
    cx, cy = W / 2 - 60, H / 2 + 20
    map_view(ctx, t, cx, cy, s, "night", labels=False)
    D.rect(ctx, 0, 0, W, H, hexrgb("#0e1428"), None, 0, wob=0, alpha=0.5)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(s, s)
    for li, (c, pts) in enumerate(LINES):
        cut = li == 1 and t > 0.6
        D.polyline(ctx, pts, hexrgb("#4a5060") if cut else hexrgb(c), 30)
    ctx.restore()
    if t > 0.6:
        k = ease_out_back(clamp((t - 0.6) / 0.3))
        ctx.save()
        ctx.translate(cx + s * -500, cy + s * 430)
        ctx.rotate(-0.1)
        ctx.scale(k, k)
        D.rrect(ctx, -200, -60, 400, 120, 20, hexrgb("#e8423c"), D.INK, 6)
        D.text(ctx, "CLOSED", 0, 24, 70, D.FONT_TITLE, hexrgb("#fff6d8"))
        ctx.restore()


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_stop, "fade", 0.3),
        Shot(c(1) - 0.1, shot_listen),
        Shot(c(2) - 0.1, shot_eyes),
        Shot(c(3) - 0.1, shot_barricade, "whip", 0.25),
        Shot(c(4) - 0.1, shot_smaller, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(c(1) * 0.5, "power_down", 0.8), (c(1) + 0.5, "shuffle", 0.9), (c(2), "zombie_groan", 1.0),
              (c(3) + (c(4) - c(3)) * 0.3, "door_slam", 1.0), (c(4) + 0.6, "stamp", 0.9)]
    S.music = [(0, "tension", 0.8), (c(2), "chase", 1.0), (c(4), "lonely", 0.6)]
