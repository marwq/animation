"""День 6: девять вечера, рация оживает. Долорес из Ки-Уэста: 71 год, радистка ВМС на пенсии,
больное бедро, бигль Бисквит. Порты закрыты, никто не придёт. «Говори со мной каждый вечер в девять»."""
from scenes.kit import *
from scenes.shared import *

MOON = (2000, 150, 40)


def leo_mic(ctx, t, cam, face="shock", talk=0.0, x=1880):
    bridge_back(ctx, t, cam, "night", 1.0, moon=MOON)
    with layer(ctx, cam, t):
        BR.radio_lit(ctx, t, talk)
        p = R.stand("side", t, 1)
        p.update(face=face, h1=(0.62, -3.05), h2=(0.55, -2.2), hturn=0.5, blink=0 if face == "shock" else p["blink"])
        J = LEO_CAP.draw(ctx, x, BR.BF + 30, 120, 1, p)
        mx, my = LEO_CAP.world(x, BR.BF + 30, 120, 1, J["hand1"])
        BR.mic(ctx, mx, my)
    fx.glow(ctx, *cam.to_screen(t, BR.RADIO_X, 520), 300, "#4cff8a", 0.12)


def dolores_at_radio(ctx, t, cam, talk=1.0, face="smile", cup=False, stand=False):
    with layer(ctx, cam, t):
        bg(ctx, "dolores_night", (-500, -300, 3400, 1800), lambda c: IN.dolores_room(c, "night"))
        IN.fan(ctx, t)
        p = R.stand("side", t, 5)
        mo = 0.4 + 0.4 * abs(math.sin(t * 9)) if talk > 0 and math.sin(t * 2.3) > -0.6 else 0.0
        if stand:
            p.update(face=face, mouth=mo, h1=(0.75, -1.3), lean=0.08)
        else:
            p = sit_pose(t, 5, face)
            p.update(mouth=mo, h1=(0.75, -2.35 if not cup else -2.6), h2=(0.8, -1.9), hturn=0.6)
        x = 360
        if not stand:
            D.rrect(ctx, x - 90, 760, 170, 40, 10, hexrgb("#7a4a2a"), D.INK, 3)
            D.line(ctx, x - 70, 800, x - 70, 900, D.INK, 6)
            D.line(ctx, x + 60, 800, x + 60, 900, D.INK, 6)
        J = DOLORES.draw(ctx, x, 900, 110, 1, p)
        if cup:
            hx, hy = DOLORES.world(x, 900, 110, 1, J["hand1"])
            D.rrect(ctx, hx - 20, hy - 40, 40, 46, 8, hexrgb("#ffffff"), D.INK, 3)
        if stand:
            hx, hy = DOLORES.world(x, 900, 110, 1, J["hand1"])
            D.line(ctx, hx, hy, hx + 20, 900, hexrgb("#7a4a2a"), 10)
        draw_beagle(ctx, 1700, 940, 105, -1, dog_pose(t, "lie" if not stand else "sit", wag=0.5))


def shot_static(ctx, t, S):
    T_WAKE = S.cue(1) - 0.6
    cam = Cam(Keys((0, 1300), (T_WAKE, 1500)), 560, Keys((0, 1.0), (T_WAKE, 1.25)))
    bridge_back(ctx, t, cam, "night", 1.0, moon=MOON)
    with layer(ctx, cam, t):
        BR.radio_lit(ctx, t, 0.3 if t > 1.2 else 0.0)
        p = sit_pose(t, 1, "sleep" if t < T_WAKE else "shock", seat=1.4)
        if t > T_WAKE:
            p.update(blink=0, lean=-0.1, hturn=0.6)
        LEO_CAP.draw(ctx, BR.CHAIR_X + 30, BR.BF - 10, 115, 1, p)
        draw_cat(ctx, BR.CHAIR_X + 80, BR.BF - 260, 100, 1, cat_pose(t, "sleep" if t < T_WAKE else "sit", hat=True))
    if t < T_WAKE:
        for i in range(3):
            ph = (t * 0.8 + i / 3) % 1
            x, y = cam.to_screen(t, BR.CHAIR_X + 40, 420)
            D.text(ctx, "z", x + ph * 50, y - ph * 80, 40 + 30 * ph, D.FONT_HAND, hexrgb("#fff6d8"), alpha=1 - ph)
    if t > 1.2:
        pop_text(ctx, "KSSHH... kssh...", 1350, 250, t, 1.2, 70, "#d8dee2", dur=T_WAKE - 1.0, shake=True)
    # часы 21:00
    D.rrect(ctx, 1580, 820, 280, 110, 16, hexrgb("#0e1410"), D.INK, 5)
    D.text(ctx, "21:00", 1720, 900, 72, D.FONT_TITLE, hexrgb("#ff4a3a"))


def shot_split(ctx, t, S):
    k = clamp(t / 0.5)
    camL = Cam(2240, 560, 1.4)
    camR = Cam(30, 650, 1.5)
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "shock"),
               lambda c: dolores_at_radio(c, t, camR, 1.0, "smile"), k)
    if t > 0.6:
        D.rrect(ctx, 1200, 820, 660, 100, 30, hexrgb("#fff6d8"), D.INK, 5)
        D.text(ctx, "DOLORES · KEY WEST", 1530, 890, 50, D.FONT_TITLE, D.INK)


def shot_room(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    cam = Cam(Keys((0, 100), (d * 0.45, 400), (d, 1500)), Keys((0, 260), (d * 0.45, 560), (d, 760)),
              Keys((0, 1.6), (d * 0.45, 1.05), (d, 1.5)))
    dolores_at_radio(ctx, t, cam, 1.0, "laugh", cup=True)
    labels = [(0.2, "71", 130), (d * 0.35, "NAVY RADIO OPERATOR", 70), (d * 0.62, "BAD HIP", 70),
              (d * 0.82, "BISCUIT", 80)]
    for i, (tt, txt, size) in enumerate(labels):
        pop_text(ctx, txt, 560 + (i % 2) * 800, 220 + (i % 2) * 60, t, tt, size, "#ffe36a", dur=1.6, shake=False)


PORTS = [("MIAMI", 760, 330), ("KEY WEST", 610, 560), ("NASSAU", 1180, 420), ("HAVANA", 520, 700),
         ("SAN JUAN", 1720, 690)]


def caribbean_map(ctx, t, stamps=0.0, zoom=0.0, ship=(1500, 260)):
    D.vgrad(ctx, 0, 0, W, H, [(0, "#3fb3e0"), (1, "#1a7fb8")])
    for i in range(60):
        x, y = (i * 173) % W, (i * 97) % H
        D.curve(ctx, [(x - 20, y), (x, y - 6), (x + 20, y)], hexrgb("#ffffff"), 3, 0.25)
    land = hexrgb("#f2dca0")
    D.blob(ctx, [(560, -40), (900, -40), (860, 200), (800, 360), (720, 470), (640, 430), (620, 300), (520, 120)],
           land, D.INK, 5)
    D.blob(ctx, [(380, 640), (700, 600), (980, 660), (1150, 720), (900, 760), (600, 740), (420, 700)], land, D.INK, 5)
    D.blob(ctx, [(1500, 690), (1640, 660), (1820, 700), (1700, 740), (1540, 730)], land, D.INK, 4)
    for (x, y, r) in ((1100, 350, 30), (1180, 430, 24), (1260, 380, 20), (1060, 470, 18)):
        D.circle(ctx, x, y, r, land, D.INK, 3)
    for i, (name, x, y) in enumerate(PORTS):
        D.circle(ctx, x, y, 12, hexrgb("#e8423c"), D.INK, 3)
        D.text(ctx, name, x, y - 24, 30, D.FONT_TITLE, D.INK)
        k = clamp((stamps - i * 0.35) / 0.25)
        if k > 0:
            sc = 1.6 - 0.6 * ease_out(k)
            ctx.save()
            ctx.translate(x, y + 40)
            ctx.rotate(-0.2)
            ctx.scale(sc, sc)
            D.rrect(ctx, -90, -30, 180, 60, 8, None, hexrgb("#c23b33"), 7, alpha=k)
            D.text(ctx, "CLOSED", 0, 16, 42, D.FONT_TITLE, hexrgb("#c23b33"), alpha=k)
            ctx.restore()
    sx, sy = ship
    D.ellipse(ctx, sx, sy, 34, 12, hexrgb("#ffffff"), D.INK, 3)
    D.rect(ctx, sx - 18, sy - 22, 30, 12, hexrgb("#ffffff"), D.INK, 2, wob=0)
    ring = (t * 1.3) % 1
    D.circle(ctx, sx, sy, 20 + 60 * ring, None, hexrgb("#ffffff"), 4, 1 - ring)


def shot_map(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    z = Keys((0, 1.0), (d * 0.55, 1.0), (d * 0.8, 2.2, "io"))(t)
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.scale(z, z)
    ctx.translate(-lerp(W / 2, 1500, clamp((z - 1) / 1.2)), -lerp(H / 2, 260, clamp((z - 1) / 1.2)))
    caribbean_map(ctx, t, stamps=t * 1.6)
    ctx.restore()
    if t > d * 0.62:
        pop_text(ctx, "NOBODY'S COMING", W / 2, 230, t, d * 0.62, 90, "#fff6d8", dur=d, shake=False)


def shot_promise(ctx, t, S):
    camL = Cam(2240, 560, Keys((0, 1.4), (4, 1.5)))
    camR = Cam(30, 660, Keys((0, 1.5), (4, 1.6)))
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "smile", 0.0),
               lambda c: dolores_at_radio(c, t, camR, 1.0, "smile", cup=True), 1.0)
    D.rrect(ctx, W / 2 - 300, 150, 600, 110, 30, hexrgb("#0e1410"), D.INK, 5)
    D.text(ctx, "EVERY NIGHT · 21:00", W / 2, 225, 56, D.FONT_TITLE, hexrgb("#4cff8a"))


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_static),
        Shot(c(1) - 0.3, shot_split),
        Shot(c(2) - 0.1, shot_room, "fade", 0.3),
        Shot(c(3) - 0.1, shot_map, "fade", 0.3),
        Shot(c(4) - 0.2, shot_promise, "fade", 0.3),
    ]
    S.sfx += [(1.2, "static", 0.8), (c(3) + 0.3, "stamp", 0.7), (c(3) + 0.65, "stamp", 0.7), (c(3) + 1.0, "stamp", 0.7),
              (c(3) + 1.35, "stamp", 0.7), (c(3) + 1.7, "stamp", 0.7)]
    S.music = "warm"
