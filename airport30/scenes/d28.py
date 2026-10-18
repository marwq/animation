"""День 28: полночь. Пиклз рычит на огнеупорную дверь. Чемоданы шевелятся. Они прорвались — в туннели,
в багажный зал, во всё, что было твоим. Наушники, пульт, собака — последняя поездка по ленте сквозь
темноту до ангара №9. Назад дороги нет."""
from scenes.kit import *
from scenes.shared import *
from scenes.d03 import LINES, STOPS
from scenes.d11 import hangar_bg, ROSIE_X
from scenes.d13 import tunnel_bg, DOOR_X

CHUTE_X = -700          # где лента выходит в ангар


def stack(ctx, t, jig=0.0, fly=None):
    """Баррикада из 14 чемоданов за дверью; jig — дрожь, fly — время после прорыва."""
    r = rng(13)
    for i in range(14):
        row, col = i // 3, i % 3
        c = hexrgb(r.choice(RM.BAG_COLS))
        x = DOOR_X + 160 + col * 95 - row * 6 + 46
        y = RM.FL - 8 - row * 75
        ang = 0.0
        if jig > 0:
            x += math.sin(t * 31 + i * 1.7) * 10 * jig
            y += math.sin(t * 27 + i * 2.3) * 6 * jig
            ang = math.sin(t * 19 + i) * 0.08 * jig
        if fly is not None:
            k = fly
            vx = r.uniform(500, 1300)
            vy = r.uniform(-900, -300)
            x += vx * k
            y = min(RM.FL, y + vy * k + 1600 * k * k)
            ang += r.uniform(-6, 6) * k * (1 if y < RM.FL else 0.3)
        ctx.save()
        ctx.translate(x, y - 36)
        ctx.rotate(ang)
        D.rrect(ctx, -46, -36, 92, 72, 10, c, D.INK, 3)
        D.line(ctx, -18, -30, -18, 30, shade(c, -0.2), 3)
        D.line(ctx, 18, -30, 18, 30, shade(c, -0.2), 3)
        ctx.restore()


def shot_growl(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, DOOR_X + 700), (d, DOOR_X + 560)), 560, Keys((0, 1.1), (d, 1.3)))
    tunnel_bg(ctx, t, cam, 0.0)
    T = lambda c: tone(c, "day")
    with layer(ctx, cam, t):
        RM.belt(ctx, -1400, 7000, RM.BELT_Y, 0, 0)
        RM.fire_door(ctx, DOOR_X, T)
        stack(ctx, t)
        g = 0.5 + 0.5 * math.sin(t * 14)
        draw_lab(ctx, DOOR_X + 820, RM.FL, 105, -1, dog_pose(t, "stand", bark=0.25 * g, wag=0.0, look=0.1))
        p = R.stand("side", t, 1)
        p.update(face="scared", h1=(0.55, -2.6), blink=0, hturn=-0.3)
        J = DANNY_JACKET.draw(ctx, DOOR_X + 1180, RM.FL, 116, -1, p)
        hx, hy = DANNY_JACKET.world(DOOR_X + 1180, RM.FL, 116, -1, J["hand1"])
        D.rrect(ctx, hx - 44, hy - 12, 50, 24, 8, hexrgb("#2b2f3a"), D.INK, 3)
        D.circle(ctx, hx - 46, hy, 13, hexrgb("#ffe9a0"), D.INK, 3)
    fx.darkness(ctx, 0.72, [fx.Light(*cam.to_screen(t, DOOR_X + 1080, RM.FL - 290), 700, kind="cone",
                                     ang=math.pi, spread=0.35, power=1.0, glow="#ffe9a0")])
    clock_badge(ctx, "00:00", t)
    gx, gy = cam.to_screen(t, DOOR_X + 760, RM.FL - 200)
    for k in range(3):
        pop_text(ctx, "grrr", gx - 40 + k * 60, gy - 40 - k * 50, t, 0.5 + k * 0.6, 54, "#ffd23a", dur=1.0,
                 shake=False)


def shot_moving(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    jig = clamp(t / (d * 0.6))
    thumps = [d * 0.25, d * 0.5, d * 0.7, d * 0.85]
    sh = sum(shake_k(t, a, 0.25, 1.0) for a in thumps)
    cam = Cam(DOOR_X + 260, RM.FL - 260, Keys((0, 1.8), (d, 2.2)), shake=lambda q: 0.3 * sh)
    tunnel_bg(ctx, t, cam, 0.0)
    T = lambda c: tone(c, "day")
    with layer(ctx, cam, t):
        RM.belt(ctx, -1400, 7000, RM.BELT_Y, 0, 0)
        ctx.save()
        ctx.translate(DOOR_X, RM.FL)
        ctx.scale(1 + 0.03 * sh, 1)
        ctx.translate(-DOOR_X, -RM.FL)
        RM.fire_door(ctx, DOOR_X, T)
        ctx.restore()
        stack(ctx, t, jig + sh * 0.6)
    fx.darkness(ctx, 0.6, [fx.Light(W / 2 + 100, H / 2 + 60, 700, power=0.9, glow="#ffe9a0", glow_a=0.15)])
    for i, a in enumerate(thumps):
        pop_text(ctx, "THUD", 380 + (i % 2) * 260, 260 + i * 120, t, a, 90 + i * 12, "#fff6d8", dur=0.7)


def partial(pts, k):
    L = sum(math.hypot(b[0] - a[0], b[1] - a[1]) for a, b in zip(pts, pts[1:]))
    acc, out = 0, [pts[0]]
    for a, b in zip(pts, pts[1:]):
        seg = math.hypot(b[0] - a[0], b[1] - a[1])
        if acc + seg <= k * L:
            out.append(b)
        else:
            u = (k * L - acc) / seg if seg else 0
            out.append((lerp(a[0], b[0], u), lerp(a[1], b[1], u)))
            break
        acc += seg
    return out


def shot_through(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    T_BURST = 0.25
    T_MAP = d * 0.42
    if t < T_MAP:
        cam = Cam(DOOR_X + 500, 560, 1.0, shake=lambda q: shake_k(q, T_BURST, 0.6, 2.4))
        tunnel_bg(ctx, t, cam, 0.0)
        T = lambda c: tone(c, "day")
        with layer(ctx, cam, t):
            RM.belt(ctx, -1400, 7000, RM.BELT_Y, 0, 0)
            D.rect(ctx, DOOR_X - 150, 330, 300, RM.FL - 330, hexrgb("#141824"), D.INK, 6, wob=0)
            k = clamp((t - T_BURST) / 0.3)
            ctx.save()
            ctx.translate(DOOR_X + 150, RM.FL)
            ctx.rotate(-1.3 * ease_out(k))
            ctx.translate(-(DOOR_X + 150), -RM.FL)
            RM.fire_door(ctx, DOOR_X, T)
            ctx.restore()
            stack(ctx, t, fly=max(0.0, t - T_BURST) if t > T_BURST else None)
            if t > T_BURST:
                for i in range(12):
                    x = DOOR_X - 200 + (t - T_BURST) * (520 + i * 25) - i * 160
                    if x < DOOR_X - 220:
                        continue
                    y = RM.FL + (i % 3) * 30
                    p = R.gait((t - T_BURST) * 2.6 + i * 0.3, "run", "side", i)
                    p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
                    R.Fig(R.zombie_look(2800 + i, ["ramp", "business", "tsa", None][i % 4])).draw(
                        ctx, x, y, 116, 1, p)
        fx.darkness(ctx, 0.55, [fx.Light(W / 2, H / 2, 800, power=0.6, glow_a=0.0)])
        if t > T_BURST:
            pop_text(ctx, "KRASH!", W / 2 - 250, 280, t, T_BURST, 160, "#fff6d8", dur=1.2)
        return
    tt = t - T_MAP
    dm = d - T_MAP
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1c2440"), (1, "#0e1428")])
    s = 0.34
    cx, cy = W / 2 - 60, H / 2 + 20
    map_view(ctx, tt, cx, cy, s, "night", labels=False)
    D.rect(ctx, 0, 0, W, H, hexrgb("#0e1428"), None, 0, wob=0, alpha=0.5)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(s, s)
    for li, (c, pts) in enumerate(LINES):
        D.polyline(ctx, pts, hexrgb(c), 30)
        k = clamp((tt - li * 0.3) / (dm * 0.6))
        if k > 0:
            out = partial(pts, k)
            D.polyline(ctx, out, hexrgb("#7ee04a"), 70, 0.35)
            D.polyline(ctx, out, hexrgb("#7ee04a"), 34)
            hx, hy = out[-1]
            zombie_glow_eyes(ctx, hx, hy, 40, 1.0)
    ctx.restore()
    labs = [("TUNNELS", 420, 300), ("BAG HALL", W / 2, 300), ("YOUR STUFF", W - 420, 300)]
    for i, (lab, x, y) in enumerate(labs):
        t0 = dm * (0.15 + i * 0.25)
        if tt < t0:
            continue
        kk = ease_out_back(clamp((tt - t0) / 0.3))
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(-0.05 + i * 0.04)
        ctx.scale(kk, kk)
        D.rrect(ctx, -230, -60, 460, 120, 20, hexrgb("#fff6d8"), D.INK, 6)
        D.text(ctx, lab, 0, 22, 62, D.FONT_TITLE, hexrgb("#1c3f7c"))
        if tt > t0 + 0.35:
            D.line(ctx, -200, 0, -200 + 400 * clamp((tt - t0 - 0.35) / 0.2), 0, hexrgb("#7ee04a"), 16)
        ctx.restore()


def item_icon(ctx, i, t):
    if i == 0:
        ctx.save()
        ctx.translate(0, 20)
        ctx.scale(1.6, 1.6)
        ctx.arc(0, -10, 62, math.pi * 1.05, math.pi * 1.95)
        D.col(ctx, D.INK)
        ctx.set_line_width(16)
        ctx.stroke()
        for k in (-1, 1):
            D.ellipse(ctx, k * 60, 0, 22, 34, hexrgb("#2b2f3a"), D.INK, 4)
            D.ellipse(ctx, k * 60, 0, 12, 20, hexrgb("#4cff8a"), None, 0)
        ctx.restore()
    elif i == 1:
        PL.rc_controller(ctx, 0, 10, 1.7, 3, -0.1)
    else:
        draw_lab(ctx, 30, 140, 150, -1, dog_pose(t, "sit", headset=True))


def shot_ride(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    T_RIDE = d * 0.28
    T_ARR = d * 0.8
    if t < T_RIDE:
        D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
        for i, lab in enumerate(("HEADSETS", "CONTROLLER", "PICKLES")):
            t0 = i * T_RIDE * 0.28
            if t < t0:
                continue
            k = ease_out_back(clamp((t - t0) / 0.25))
            x = 380 + i * 580
            ctx.save()
            ctx.translate(x, 470)
            ctx.scale(k, k)
            D.circle(ctx, 0, 0, 210, hexrgb("#fff6d8"), D.INK, 8)
            item_icon(ctx, i, t)
            ctx.restore()
            D.text(ctx, lab, x, 790, 56, D.FONT_TITLE, hexrgb("#fff6d8"), alpha=k)
            if t > t0 + 0.2:
                kc = ease_out_back(clamp((t - t0 - 0.2) / 0.2))
                D.circle(ctx, x + 150, 320, 52 * kc, hexrgb("#4cff8a"), D.INK, 5)
                D.polyline(ctx, [(x + 125, 322), (x + 145, 344), (x + 178, 300)], D.INK, 10, kc)
        return
    if t < T_ARR:
        tt = t - T_RIDE
        v = 900
        x = 600 + tt * v
        cam = Cam(lambda q: 600 + q * v + 150, 560, 1.0, shake=0.06)
        tunnel_bg(ctx, tt, cam, 0.0)
        with layer(ctx, cam, tt):
            RM.belt(ctx, -1400, 9000, RM.BELT_Y, tt * 2.6, 2.0)
            p = ride_pose(tt, 1, "determined")
            J = DANNY_JACKET.draw(ctx, x, RM.BELT_Y - 10, 110, 1, p)
            hx, hy = DANNY_JACKET.world(x, RM.BELT_Y - 10, 110, 1, J["hand1"])
            PL.rc_controller(ctx, hx + 10, hy - 6, 0.55, 3, 0.2)
            tray(ctx, x - 320, RM.BELT_Y - 8, 1.0)
            draw_lab(ctx, x - 320, RM.BELT_Y - 30, 70, 1, dog_pose(tt, "sit", look=0.2, headset=True))
            # погоня сзади — отстаёт
            for i in range(5):
                zx = 600 - 700 + tt * (520 + i * 30) - i * 140
                p = R.gait(tt * 2.6 + i * 0.4, "run", "side", i)
                p.update(a1=(1.4, -0.1), a2=(1.2, 0.0), mouth=0.9, lean=0.35)
                R.Fig(R.zombie_look(2900 + i)).draw(ctx, zx, RM.FL + 10 + (i % 2) * 20, 112, 1, p)
        sx, sy = cam.to_screen(tt, x + 60, RM.BELT_Y - 260)
        fx.darkness(ctx, 0.8, [fx.Light(sx, sy, 900, kind="cone", ang=0.0, spread=0.35, power=1.0, glow="#ffe9a0")])
        for k in range(3):
            zx, zy = cam.to_screen(tt, 600 - 700 + tt * (520 + k * 30) - k * 140 + 20, RM.FL - 380)
            zombie_glow_eyes(ctx, zx, zy, 12, 0.8)
        counter_badge(ctx, "LAST RIDE", "→ H9", W - 300, 160, "#ffd23a", 440)
        return
    tt = t - T_ARR
    cam = Cam(Keys((0, CHUTE_X + 700), (2, CHUTE_X + 900)), 540, 0.8)
    hangar_bg(ctx, tt, cam, "night", 0.0)
    with layer(ctx, cam, tt):
        PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "night")
        RM.belt(ctx, CHUTE_X - 800, CHUTE_X + 120, RM.BELT_Y, tt * 2.6, 2.0)
        D.rect(ctx, CHUTE_X - 900, RM.BELT_Y - 330, 600, 300, hexrgb("#0b0d14"), D.INK, 6, wob=0)
        RM.curtain(ctx, CHUTE_X - 400, RM.BELT_Y - 330, 220, 290, tt, clamp(1 - tt / 0.6))
        k = clamp(tt / 0.6)
        x = lerp(CHUTE_X - 300, CHUTE_X + 300, ease_out(k))
        y = RM.BELT_Y - 10 + (RM.FL - RM.BELT_Y + 10) * ease_in(k)
        DANNY_JACKET.draw(ctx, x, y, 112, 1, ride_pose(tt, 1, "shock") if k < 1 else R.stand("side", tt, 1))
        draw_lab(ctx, x - 260 + 120 * k, RM.FL if k >= 1 else lerp(RM.BELT_Y - 30, RM.FL, k), 90, 1,
                 dog_pose(tt, "sit", headset=True))
    fx.darkness(ctx, 0.5, [fx.Light(W / 2, H / 2, 800, power=0.6, glow_a=0.0)])
    if tt > 0.3:
        pop_text(ctx, "HANGAR 9", W / 2 + 300, 230, tt, 0.3, 100, "#ffd23a", dur=d, shake=False)


def shot_noback(ctx, t, S):
    d = S.dur - S.cue(4)
    T_SHOVE = d * 0.35
    cam = Cam(CHUTE_X + 300, 520, Keys((0, 1.2), (d, 1.3)))
    hangar_bg(ctx, t, cam, "night", 0.0)
    with layer(ctx, cam, t):
        RM.belt(ctx, CHUTE_X - 800, CHUTE_X + 120, RM.BELT_Y, 0, 0)
        D.rect(ctx, CHUTE_X - 900, RM.BELT_Y - 330, 600, 300, hexrgb("#0b0d14"), D.INK, 6, wob=0)
        RM.curtain(ctx, CHUTE_X - 400, RM.BELT_Y - 330, 220, 290, t, 0.4 + 0.3 * math.sin(t * 9))
        for i in range(3):
            hx = CHUTE_X - 300 + i * 40
            hy = RM.BELT_Y - 240 + i * 60 + math.sin(t * 7 + i) * 15
            D.line(ctx, hx - 80, hy, hx + 30, hy - 10, hexrgb("#7ec850"), 22)
            D.circle(ctx, hx + 36, hy - 10, 18, hexrgb("#7ec850"), D.INK, 3)
        k = smooth(clamp((t - T_SHOVE) / 0.6))
        cx = lerp(CHUTE_X + 650, CHUTE_X + 180, k)
        D.rrect(ctx, cx - 160, RM.FL - 320, 320, 320, 14, hexrgb("#d8443c"), D.INK, 6)
        for j in range(4):
            D.line(ctx, cx - 140, RM.FL - 260 + j * 70, cx + 140, RM.FL - 260 + j * 70, D.INK, 4)
        D.text(ctx, "TOOLS", cx, RM.FL - 140, 44, D.FONT_TITLE, hexrgb("#fff6d8"))
        p = R.stand("side", t, 1)
        p.update(face="determined" if t > T_SHOVE else "scared", h1=(0.8, -2.0), h2=(0.75, -1.9), lean=-0.25 * k)
        DANNY_JACKET.draw(ctx, cx + 300, RM.FL, 116, -1, p)
        draw_lab(ctx, cx + 620, RM.FL, 100, -1, dog_pose(t, "sit", headset=True, look=0.2))
    fx.darkness(ctx, 0.45, [fx.Light(W / 2, H / 2, 800, power=0.6, glow_a=0.0)])
    if t > T_SHOVE + 0.6:
        pop_text(ctx, "NO WAY BACK.", W / 2 + 200, 220, t, T_SHOVE + 0.6, 100, "#ff4a3a", dur=d, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_growl, "fade", 0.4),
        Shot(c(1) - 0.1, shot_moving),
        Shot(c(2) - 0.1, shot_through),
        Shot(c(3) - 0.1, shot_ride, "whip", 0.25),
        Shot(c(4) - 0.1, shot_noback, "fade", 0.25),
    ]
    S.tods = [(0, "night")]
    d2, d3, d4 = c(2) - c(1), c(3) - c(2), c(4) - c(3)
    S.sfx += [(0.5, "growl", 0.8), (c(1) + d2 * 0.25, "thud", 1.0), (c(1) + d2 * 0.5, "thud", 1.0),
              (c(1) + d2 * 0.7, "thud", 1.0), (c(1) + d2 * 0.85, "thud", 1.0), (c(2) + 0.25, "crash", 1.0),
              (c(2) + 0.4, "stampede", 0.9), (c(3) + 0.1, "ding", 0.6), (c(3) + d4 * 0.28, "belt", 0.9),
              (c(4) + (S.dur - c(4)) * 0.35, "thud", 0.9)]
    S.music = [(0, "dread", 0.8), (c(2), "chase", 1.0), (c(4), "tension", 0.7)]
