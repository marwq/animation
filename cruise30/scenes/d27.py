"""День 27: батарея 4% — хватит на один последний вызов и один гудок. Рассказываешь Долорес всё:
план, 41 секунду, рацию Макса. «Если я не справлюсь…» — «Не надо, малыш. Справишься. Я хочу
познакомиться с этой кошкой». Ночью под крылом мостика — скрежет. И он поднимается выше."""
from scenes.kit import *
from scenes.shared import *
from scenes.d06 import dolores_at_radio, leo_mic
from scenes.cold import wing_scene

MOON = (2000, 150, 40)


def big_battery(ctx, x, y, s, pct, t):
    """Крупная батарейка: корпус, клемма, красная полоска заряда мигает."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.rrect(ctx, -300, -140, 600, 280, 40, hexrgb("#2b2f3a"), D.INK, 10)
    D.rrect(ctx, 300, -60, 50, 120, 14, hexrgb("#2b2f3a"), D.INK, 8)
    D.rrect(ctx, -270, -110, 540, 220, 26, hexrgb("#141820"), None, 0)
    on = 0.35 + 0.65 * (math.sin(t * 7) > -0.2)
    w = max(24, 540 * pct / 100)
    D.rrect(ctx, -270, -110, w, 220, 22, hexrgb("#ff4a3a"), None, 0, alpha=on)
    fx.glow(ctx, -270 + w / 2, 0, 160, "#ff4a3a", 0.35 * on)
    ctx.restore()


def shot_battery(ctx, t, S):
    d = S.cue(1) - 0.1
    cam = Cam(Keys((0, BR.RADIO_X - 300), (2.0, BR.RADIO_X - 225)), Keys((0, 640), (2.0, 705)),
              Keys((0, 1.3), (2.0, 3.6, "in")))
    bridge_back(ctx, t, cam, "night", 0.0, moon=MOON, battery=4, autopilot=False)
    with layer(ctx, cam, t):
        BR.radio_lit(ctx, t, 0.0)
        draw_cat(ctx, BR.RADIO_X + 200, 690, 70, -1, cat_pose(t, "sleep"))
    if t > 1.9:
        k = smooth(clamp((t - 1.9) / 0.4))
        D.rect(ctx, 0, 0, W, H, hexrgb("#0a0e20"), None, 0, wob=0, alpha=0.9 * k)
        big_battery(ctx, W / 2 - 80, 380, 0.9 * ease_out_back(k), 4, t)
        D.text(ctx, "4%", W / 2 - 80, 420, 130, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=8, alpha=k)
    # «1 вызов + 1 гудок»: две карточки
    for i, (t0, txt, c) in enumerate(((d * 0.62, "1 CALL", "#4cff8a"), (d * 0.8, "1 HORN", "#ffe36a"))):
        if t < t0:
            continue
        kk = ease_out_back(clamp((t - t0) / 0.35))
        ctx.save()
        ctx.translate(W / 2 - 360 + i * 560, 700)
        ctx.rotate(-0.05 + i * 0.1)
        ctx.scale(kk, kk)
        D.rrect(ctx, -230, -110, 460, 220, 30, hexrgb("#fff6d8"), D.INK, 8)
        if i == 0:
            D.rrect(ctx, -170, -60, 70, 110, 18, hexrgb("#2b2f3a"), D.INK, 5)
            D.circle(ctx, -135, -25, 14, hexrgb("#5a5f68"), None, 0)
        else:
            OD.horn(ctx, -120, 90, 0.4, "day")
        D.text(ctx, txt, 60, 30, 74, D.FONT_TITLE, hexrgb(c), stroke=D.INK, slw=7)
        ctx.restore()
    if t > d * 0.8:
        D.text(ctx, "+", W / 2 - 80, 735, 110, D.FONT_TITLE, hexrgb("#fff6d8"), stroke=D.INK, slw=8)


PLAN = [("HORN", "#e8423c"), ("ZIP LINE", "#f2c230"), ("JET SKI", "#2f8fd8"), ("0:41", "#4cff8a"),
        ("WALKIE", "#f05a8a")]


def plan_icon(ctx, i, x, y, k, t):
    name, c = PLAN[i]
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(math.sin(t * 2 + i) * 0.05)
    ctx.scale(k, k)
    D.circle(ctx, 0, 0, 95, hexrgb("#fff6d8"), D.INK, 7)
    D.circle(ctx, 0, 0, 80, hexrgb(c), None, 0, alpha=0.25)
    if i == 0:
        OD.horn(ctx, 40, 70, 0.3, "day")
    elif i == 1:
        D.line(ctx, -70, -40, 70, 30, D.INK, 6)
        D.circle(ctx, 0, -5, 16, hexrgb("#f2c230"), D.INK, 4)
        D.line(ctx, 0, 10, 0, 50, D.INK, 6)
    elif i == 2:
        IN.jetski(ctx, 0, 20, 0.45, "#e8423c", 1, 0.0, "day")
    elif i == 3:
        D.circle(ctx, 0, 8, 52, hexrgb("#ffffff"), D.INK, 6)
        D.rect(ctx, -10, -64, 20, 18, D.INK, None, 0, wob=0)
        a = -math.pi / 2 + t * 4
        D.line(ctx, 0, 8, math.cos(a) * 40, 8 + math.sin(a) * 40, hexrgb("#e8423c"), 6)
    else:
        IN.walkie(ctx, 0, 20, 0.85, 0.15, on=1.0, t=t)
    D.text(ctx, name, 0, 140, 46, D.FONT_TITLE, hexrgb(c), stroke=D.INK, slw=6)
    ctx.restore()


def shot_tell(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    camL = Cam(2240, 560, 1.4)
    camR = Cam(30, 650, 1.5)
    talkL = 1.0 if math.sin(t * 2.1) > -0.5 else 0.0
    diag_split(ctx, lambda c: leo_mic(c, t, camL, "determined", talkL),
               lambda c: dolores_at_radio(c, t, camR, 0.0, "worried"), clamp(t / 0.4))
    for i in range(len(PLAN)):
        t0 = 0.5 + i * (d - 1.0) / len(PLAN)
        if t > t0:
            plan_icon(ctx, i, 260 + i * 350, 220, ease_out_back(clamp((t - t0) / 0.35)), t)


def shot_dont(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    t1, t2 = d * 0.28, d * 0.64
    if t < t1:
        cam = Cam(1900, 520, Keys((0, 2.4), (t1, 2.7)))
        leo_mic(ctx, t, cam, "sad", 0.6)
        pop_text(ctx, "IF I DON'T MAKE IT...", W / 2, 200, t, 0.1, 80, "#cfe0ff", dur=t1, shake=False)
    elif t < t2:
        tt = t - t1
        cam = Cam(400, 600, Keys((0, 2.2), (t2 - t1, 2.5)))
        dolores_at_radio(ctx, t, cam, 1.0, "determined")
        pop_text(ctx, "DON'T, KID.", W / 2 + 300, 200, tt, 0.05, 110, "#ffe36a", dur=1.2, shake=False)
        pop_text(ctx, "YOU'LL MAKE IT.", W / 2 + 300, 200, tt, 1.25, 100, "#4cff8a", dur=t2 - t1, shake=False)
    else:
        tt = t - t2
        cam = Cam(BR.RADIO_X + 160, 600, Keys((0, 2.2), (d - t2, 2.4)))
        bridge_back(ctx, t, cam, "night", 0.0, moon=MOON, battery=4, autopilot=False)
        with layer(ctx, cam, t):
            BR.radio_lit(ctx, t, 1.0)
            draw_cat(ctx, BR.RADIO_X + 200, 690, 120, -1,
                     cat_pose(t, "sit", look=-0.6 * smooth(clamp(tt / 0.4)), blink=0.0))
        pop_text(ctx, "\"I WANT TO MEET", W / 2 - 300, 180, tt, 0.15, 74, "#fff6d8", dur=4, shake=False)
        pop_text(ctx, "THAT CAT.\"", W / 2 - 300, 270, tt, 0.6, 90, "#f05a8a", dur=4, shake=False)


def shot_night(ctx, t, S):
    T_OUT = (S.cue(3, True) - S.cue(3)) * 0.58
    if t < T_OUT:
        cam = Cam(Keys((0, 1500), (T_OUT, 2350)), Keys((0, 520), (T_OUT, 480)), Keys((0, 0.85), (T_OUT, 1.15)))
        bridge_back(ctx, t, cam, "deepnight", 0.0, moon=MOON, battery=4, autopilot=False)
        with layer(ctx, cam, t):
            wake = t > 1.2
            s = 115
            seat_y = BR.BF - 150
            p = sit_pose(t, 1, "scared" if wake else "sleep", seat=0.95)
            p.update(hturn=0.8 if wake else 0.0, blink=0 if wake else 1.0, neck=0.0 if wake else 0.35,
                     h1=(0.45, -1.15), h2=(0.35, -1.1))
            J = LEO_CAP.draw(ctx, BR.CHAIR_X + 10, seat_y + 0.95 * s, s, 1, p)
            draw_cat(ctx, BR.CHAIR_X + 70, seat_y - 0.95 * s * 0.0 - 10, 62, 1,
                     cat_pose(t, "sleep" if t < 1.6 else "sit", look=0.3))
        fx.darkness(ctx, 0.55, [fx.Light(*cam.to_screen(t, BR.RADIO_X - 225, 705), 260, power=0.5, glow_a=0.0)])
        # «скрр» снизу у двери на крыло, всё выше
        for i in range(6):
            t0 = 0.3 + i * 0.5
            if t < t0:
                continue
            x, y = cam.to_screen(t, BR.WING_X + 40 - (i % 2) * 160, 1000 - i * 95)
            pop_text(ctx, "scrrtch", x, y, t, t0, 46 + i * 6, "#9fc86a", rot=0.1 * (i % 2 * 2 - 1), dur=1.2)
    else:
        tt = t - T_OUT
        cam = Cam(1450, Keys((0, 520), (2, 480)), Keys((0, 0.75), (2, 0.85)))
        wing_scene(ctx, t, cam, Keys((0, 1150), (2.5, 780))(tt), leo_x=-3000, cat_mode=None, rain=0.0)
        pop_text(ctx, "HIGHER.", W / 2 + 200, 230, tt, 0.4, 120, "#9fc86a", dur=3, shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_battery),
        Shot(c(1) - 0.1, shot_tell, "fade", 0.3),
        Shot(c(2) - 0.1, shot_dont, "fade", 0.25),
        Shot(c(3) - 0.1, shot_night, "black", 0.4),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(1.9, "low_battery", 0.8), (c(1) + 0.5, "pop", 0.6), (c(3) + 0.3, "scratch", 0.8),
              (c(3) + 1.3, "scratch", 0.9), (c(3) + 2.3, "scratch", 1.0)]
    S.music = [(0, "tender", 1.0), (c(3), "dread", 0.8)]
