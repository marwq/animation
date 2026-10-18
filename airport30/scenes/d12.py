"""День 12: в шкафчике — открытка от бабушки Джун из Канзаса: «Береги себя в полёте». Сама ни разу
не летала. Телефоны мертвы — Уолт звонит ей из Аризоны по телефону со шнуром. Она велит есть овощи.
И возвращаться домой. Ты долго обнимаешь Пиклз."""
from scenes.kit import *
from scenes.shared import *


def postcard(ctx, x, y, s, t, side=0, rot=-0.04):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    D.rect(ctx, -360, -230, 720, 460, hexrgb("#fbf3dc"), D.INK, 6, wob=0)
    if side == 0:
        ctx.save()
        ctx.rectangle(-330, -200, 660, 400)
        ctx.clip()
        ctx.translate(0, 0)
        ctx.scale(0.3, 0.3)
        ctx.translate(-1000, -400)
        OS.kansas(ctx, t, "golden", -1400, 3800, strip=False)
        ctx.restore()
        D.rect(ctx, -330, -200, 660, 400, None, D.INK, 4, wob=0)
        D.text(ctx, "GREETINGS FROM KANSAS", 0, 170, 46, D.FONT_TITLE, hexrgb("#e8423c"), stroke=D.INK, slw=6)
    else:
        D.line(ctx, 40, -200, 40, 200, hexrgb("#c9b89a"), 3)
        D.text(ctx, "Fly safe,", -320, -90, 70, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
        D.text(ctx, "Danny!", -320, 0, 70, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
        D.text(ctx, "Love,", -320, 100, 56, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
        D.text(ctx, "Grandma June", -320, 170, 56, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
        D.rect(ctx, 220, -190, 110, 130, hexrgb("#f2c230"), D.INK, 3, wob=0)
        JUNE.head_only(ctx, 275, -125, 80, 1, {"view": "front", "face": "smile", "neck_line": False})
    ctx.restore()


def shot_locker(ctx, t, S):
    d = S.cue(1) - 0.1
    T_CARD = d * 0.45
    if t < T_CARD:
        cam = Cam(1180, 520, 1.4)
        room_back(ctx, t, cam, "lockers_off", lambda c: RM.lockers(c, 0.0), (-600, -1500, 4000, 3300))
        with layer(ctx, cam, t):
            D.rect(ctx, 1220, 160, 150, RM.FL - 200, hexrgb("#2a3448"), D.INK, 4, wob=0)
            p = R.stand("side", t, 1)
            p.update(face="sad", h1=(0.8, -2.6), hturn=0.7)
            DANNY_JACKET.draw(ctx, 1060, RM.FL, 118, 1, p)
        fx.darkness(ctx, 0.4, [fx.Light(W / 2 + 100, H / 2, 500, power=0.6, glow_a=0.0)])
        return
    tt = t - T_CARD
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    postcard(ctx, W / 2, H / 2 - 20, ease_out_back(clamp(tt / 0.4)), t, 0)


def shot_back(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    D.vgrad(ctx, 0, 0, W, H, [(0, "#2a2448"), (1, "#141030")])
    flip = clamp(t / 0.3)
    ctx.save()
    ctx.translate(W / 2, H / 2 - 20)
    ctx.scale(max(0.02, abs(1 - 2 * flip)), 1)
    ctx.translate(-W / 2, -(H / 2 - 20))
    postcard(ctx, W / 2, H / 2 - 20, 1.0, t, 0 if flip < 0.5 else 1, 0.03)
    ctx.restore()
    if t > d * 0.45:
        pop_text(ctx, "NEVER FLOWN.", W / 2, 140, t, d * 0.45, 90, "#ffe36a", dur=d, shake=False)


def phone_walt(ctx, t, cam):
    walt_radio(ctx, t, cam, 1.0, "smile", "night")
    with layer(ctx, cam, t):
        hx, hy = OS.RADIO_X - 260 + 0.62 * 115, OS.FL - 40 - 2.95 * 115
        D.rrect(ctx, hx - 50, hy - 30, 100, 40, 16, hexrgb("#2b2f3a"), D.INK, 3)
        D.curve(ctx, [(hx, hy), (hx + 60, hy + 160), (hx + 120, hy + 220)], D.INK, 4)


def june_phone(ctx, t, cam, talk=0.0, face="smile"):
    with layer(ctx, cam, t):
        bg(ctx, "kitchen", (-600, -1500, 3800, 3300), lambda c: OS.june_kitchen(c, 0.0), 0.7)
        mo = 0.4 + 0.4 * abs(math.sin(t * 9)) if talk > 0 and math.sin(t * 2.1) > -0.6 else 0.0
        p = R.stand("side", t, 3)
        p.update(face=face, mouth=mo, h1=(0.62, -2.95), hturn=0.6)
        J = JUNE.draw(ctx, OS.PHONE_X - 200, OS.FL - 40, 118, 1, p)
        hx, hy = JUNE.world(OS.PHONE_X - 200, OS.FL - 40, 118, 1, J["hand1"])
        D.rrect(ctx, hx - 50, hy - 30, 100, 40, 16, hexrgb("#e8423c"), D.INK, 3)
        pts = [(hx, hy)] + [(lerp(hx, OS.PHONE_X + 50, k / 10) + math.sin(k * 2) * 12,
                             lerp(hy, 560, k / 10) + 60 * math.sin(math.pi * k / 10)) for k in range(1, 11)]
        D.catmull(ctx, pts)
        D.col(ctx, D.INK)
        ctx.set_line_width(4)
        ctx.stroke()


def shot_call(ctx, t, S):
    camL = Cam(OS.RADIO_X - 120, 560, 1.25)
    camR = Cam(OS.PHONE_X - 300, 560, 1.25)
    diag_split(ctx, lambda c: phone_walt(c, t, camL), lambda c: june_phone(c, t, camR, 0.0, "shock"), clamp(t / 0.4))
    D.rrect(ctx, W / 2 - 260, 110, 520, 110, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, "ARIZONA → KANSAS", W / 2, 186, 52, D.FONT_TITLE, hexrgb("#ffe36a"))


def shot_june(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    cam = Cam(OS.PHONE_X - 150, 520, Keys((0, 1.7), (d, 1.9)))
    june_phone(ctx, t, cam, 1.0, "smile")
    speech(ctx, W / 2 + 380, 200, "EAT A VEGETABLE.", t, 0.1, 60, tail=(-1, 1), dur=d * 0.5 - 0.15)
    speech(ctx, W / 2 + 380, 200, "AND COME HOME.", t, d * 0.5, 66, tail=(-1, 1))


def shot_hug(ctx, t, S):
    d = S.dur - S.cue(4)
    cam = Cam(700, 640, Keys((0, 1.7), (d, 2.0)))
    room_back(ctx, t, cam, "baghall_off", lambda c: RM.baggage_hall(c, 0.0), (-1400, -1600, 7400, 3400), 0.7)
    with layer(ctx, cam, t):
        p = floor_sit_pose(t, 1, "cry", hug=True)
        p.update(h1=(0.95, -1.3), h2=(0.85, -1.2), tears=1.0)
        DANNY_JACKET.draw(ctx, 560, RM.FL, 118, 1, p)
        draw_lab(ctx, 790, RM.FL, 110, -1, dog_pose(t, "sit", wag=0.3, look=-0.4))
        for k in range(3):
            ph = (t * 0.5 + k / 3) % 1
            star(ctx, 700 + k * 60, 360 - ph * 160, 18, "#f05a8a", 3)
    fx.darkness(ctx, 0.35, [fx.Light(W / 2, H / 2, 600, power=0.6, glow_a=0.0)])


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_locker, "fade", 0.4),
        Shot(c(1) - 0.1, shot_back),
        Shot(c(2) - 0.1, shot_call, "fade", 0.3),
        Shot(c(3) - 0.1, shot_june),
        Shot(c(4) - 0.1, shot_hug, "fade", 0.4),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(0.6, "locker", 0.8), (c(2) + 0.3, "dial", 0.8), (c(2) + 2.0, "phone_ring", 0.8)]
    S.music = "sad"
