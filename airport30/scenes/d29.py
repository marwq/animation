"""День 29: последняя ночь. Кабина Рози, фонарик, чек-лист. Пиклз на правом кресле в огромных наушниках.
Дождь стихает, над полосой звёзды. Уолт проходит всё дважды: «Поспи, капитан». Не спишь."""
from scenes.kit import *
from scenes.shared import *
from scenes.d11 import hangar_bg, ROSIE_X

ITEMS = ["FUEL ........ FULL", "MASTER ...... ON", "MIXTURE ..... RICH", "MAGNETOS .... BOTH",
         "FLAPS ....... 10°", "THROTTLE .... FULL", "ROTATE ...... 55 KT"]


def interior(ctx, t, glow=1.0):
    """Кабина Рози изнутри, ночь: окно на тёмный ангар, приборка светится."""
    D.vgrad(ctx, 0, 0, W, H, [(0, "#1a2036"), (1, "#0e1120")])
    D.rrect(ctx, 120, 60, W - 240, 520, 60, hexrgb("#24304f"), D.INK, 10)
    for k in range(5):
        D.radial(ctx, 300 + k * 360, 140, 120, "#ffe9a0", 0.12, 0)
    D.line(ctx, W / 2, 60, W / 2, 580, D.INK, 18)
    D.rect(ctx, 0, 560, W, 80, hexrgb("#e3e7eb"), D.INK, 8, wob=0)
    D.rect(ctx, 0, 620, W, H - 620, hexrgb("#2b2f3a"), D.INK, 8, wob=0)
    RM.rosie_panel(ctx, W / 2, 760, 0.62, t, glow, rpm=0.0, fuel=1.0)


def seat(ctx, x, c="#8a5a3a"):
    D.rrect(ctx, x - 230, 380, 460, 760, 80, hexrgb(c), D.INK, 8)
    D.rrect(ctx, x - 170, 430, 340, 160, 50, shade(hexrgb(c), 0.12), D.INK, 5)


def checklist(ctx, t, n, x=W / 2, y=H / 2 + 20, s=1.0, rot=-0.03):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(s, s)
    D.rrect(ctx, -420, -430, 840, 880, 24, hexrgb("#8a5a3a"), D.INK, 8)
    D.rect(ctx, -380, -380, 760, 800, hexrgb("#fbf6ee"), D.INK, 5, wob=0)
    D.rrect(ctx, -120, -460, 240, 70, 14, hexrgb("#c9d0d6"), D.INK, 5)
    D.text(ctx, "TAKEOFF CHECKLIST", 0, -300, 50, D.FONT_TITLE, hexrgb("#1c3f7c"))
    for i, it in enumerate(ITEMS):
        yy = -200 + i * 82
        D.text(ctx, it, -330, yy, 40, D.FONT_HAND, hexrgb("#22252c"), "left")
        if i < n:
            D.polyline(ctx, [(270, yy - 14), (290, yy + 6), (330, yy - 34)], hexrgb("#2e9e4a"), 9)
    ctx.restore()


def shot_cockpit(ctx, t, S):
    d = S.cue(1) - 0.1
    T_CL = d * 0.4
    if t < T_CL:
        cam = Cam(Keys((0, ROSIE_X + 200), (T_CL, ROSIE_X + 120)), 560, Keys((0, 1.0), (T_CL, 1.25)))
        hangar_bg(ctx, t, cam, "night", 0.0)
        with layer(ctx, cam, t):
            PL.rosie(ctx, ROSIE_X, RM.FL + 40, 1.1, 1, "night")
        lx, ly = cam.to_screen(t, ROSIE_X + 1.1 * 120, RM.FL + 40 - 1.1 * 230)
        fx.darkness(ctx, 0.7, [fx.Light(lx, ly, 360, power=1.0, glow="#ffe9a0", glow_a=0.4)])
        return
    tt = t - T_CL
    D.vgrad(ctx, 0, 0, W, H, [(0, "#141830"), (1, "#0a0c18")])
    n = min(len(ITEMS), int(tt / ((d - T_CL) * 0.9) * len(ITEMS)))
    checklist(ctx, tt, n)
    fy = 540 - 200 + min(n, len(ITEMS) - 1) * 82 - 40
    fx.darkness(ctx, 0.75, [fx.Light(W / 2 + math.sin(tt * 2) * 60, fy, 520, power=1.0, glow="#ffe9a0",
                                     glow_a=0.15)])


def shot_copilot(ctx, t, S):
    d = S.cue(2) - S.cue(1)
    interior(ctx, t)
    seat(ctx, 520)
    seat(ctx, 1400, "#7a4a32")
    DANNY_PILOT.head_only(ctx, 540, 520, 330, 1, {"view": "front", "face": "laugh" if t > d * 0.5 else "smile",
                                                   "neck_line": False})
    D.rrect(ctx, 380, 700, 320, 500, 60, DANNY_PILOT.look.body, D.INK, 8)
    ph = (t % 2.2) / 2.2
    slip = 0.16 * smooth(clamp((ph - 0.35) / 0.15)) * (1 - smooth(clamp((ph - 0.85) / 0.1)))
    draw_lab(ctx, 1400, 1000, 300, -1, dog_pose(t, "sit", headset=1.9, headset_slip=slip, wag=0.6))
    fx.darkness(ctx, 0.35, [fx.Light(W / 2, 700, 900, power=0.6, glow="#ffe9a0", glow_a=0.1)])
    pop_text(ctx, "CO-PILOT", 1400, 230, t, 0.3, 80, "#ffd23a", dur=d * 0.5, shake=False)
    if t > d * 0.45:
        pop_text(ctx, "(TOO BIG.)", 1400, 230, t, d * 0.45, 80, "#fff6d8", dur=d, shake=False)


def shot_stars(ctx, t, S):
    d = S.cue(3) - S.cue(2)
    k = smooth(clamp((t - 0.3) / (d * 0.7)))
    HY = 600
    SEA.sky(ctx, 0, 0, W, HY + 10, "night")
    SEA.stars(ctx, 0, 0, W, HY - 40, t, 29, 1.6, alpha=k)
    ctx.push_group()
    SEA.moon(ctx, 1460, 200, 60)
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(clamp((k - 0.3) / 0.4))
    for i in range(4):
        cx = 300 + i * 480 + t * 160 * (1 + i * 0.3) * (0.3 + k)
        SEA.cloud(ctx, cx, 120 + (i % 2) * 120, 2.0, "storm", seed=40 + i, alpha=1 - k * 0.9)
    AP.runway_persp(ctx, t, "night", run=0.0, hy=HY, lights=1.0)
    fx.glow(ctx, W / 2, HY, 500, "#4f8fff", 0.2 * k)
    # проём ворот ангара
    D.rect(ctx, 0, 0, 220, H, hexrgb("#141824"), D.INK, 8, wob=0)
    D.rect(ctx, W - 220, 0, 220, H, hexrgb("#141824"), D.INK, 8, wob=0)
    D.rect(ctx, 0, 0, W, 60, hexrgb("#141824"), D.INK, 8, wob=0)
    SEA.rain_streaks(ctx, t, 0, 0, W, H, 1.2 * (1 - k), 0.4, alpha=0.4 * (1 - k), speed=1.4)
    p = R.stand("back", t, 1)
    p.update(h1=(0.3, -1.8), h2=(0.3, -1.8))
    DANNY_PILOT.draw(ctx, 760, H + 120, 170, 1, p)
    draw_lab(ctx, 1060, H + 10, 120, -1, dog_pose(t, "sit", headset=1.9, look=-0.4))
    if t > d * 0.6:
        pop_text(ctx, "RUNWAY K", W / 2, HY - 80, t, d * 0.6, 60, "#9fd8ec", dur=d, shake=False)


def shot_twice(ctx, t, S):
    d = S.cue(4) - S.cue(3)
    T_SLEEP = d * 0.6

    def left(c):
        interior(c, t)
        seat(c, 640)
        mo = 0.4 * abs(math.sin(t * 8)) if math.sin(t * 2.4) > 0 else 0.0
        DANNY_PILOT.head_only(c, 620, 540, 300, 1, {"view": "front", "face": "determined", "mouth": mo,
                                                     "neck_line": False})
        D.rrect(c, 480, 700, 290, 500, 60, DANNY_PILOT.look.body, D.INK, 8)
        checklist(c, t, len(ITEMS) if t > d * 0.3 else int(t / (d * 0.3) * len(ITEMS)), 420, 860, 0.42, 0.1)
    camR = Cam(OS.RADIO_X - 120, 560, 1.25)
    diag_split(ctx, left, lambda c: walt_radio(c, t, camR, 1.0 if t < T_SLEEP + 0.8 else 0.0, "smile"), 1.0)
    rounds = 1 if t < d * 0.3 else 2
    counter_badge(ctx, "ROUND", "%d / 2" % rounds, 360, 160, "#4cff8a", 420)
    if t > T_SLEEP:
        speech(ctx, 1380, 220, "GET SOME SLEEP, CAPTAIN.", t, T_SLEEP, 46, tail=(-1, 1))


def shot_awake(ctx, t, S):
    d = S.dur - S.cue(4)
    interior(ctx, t, 0.6)
    seat(ctx, 640)
    seat(ctx, 1400, "#7a4a32")
    z = 1 + 0.06 * t / max(d, 0.1)
    ctx.save()
    ctx.translate(640, 560)
    ctx.scale(z, z)
    DANNY_PILOT.head_only(ctx, 0, 0, 330, 1, {"view": "front", "face": "neutral", "blink": 0, "mouth": 0.0,
                                              "neck_line": False})
    ctx.restore()
    D.rrect(ctx, 480, 730, 320, 480, 60, DANNY_PILOT.look.body, D.INK, 8)
    draw_lab(ctx, 1400, 1000, 280, -1, dog_pose(t, "lie", headset=1.9, headset_slip=0.12, wag=0.0))
    fx.darkness(ctx, 0.45, [fx.Light(W / 2, 760, 800, power=0.6, glow="#9fd8ec", glow_a=0.1)])
    times = ["01:12", "02:47", "04:05", "05:31"]
    i = min(len(times) - 1, int(t / (d / len(times))))
    clock_badge(ctx, times[i], t, W - 260, 150, "#ff4a3a")
    for k in range(3):
        cyc = t - (t // 1.8) * 1.8
        pop_text(ctx, "z", 1560 + k * 50, 520 - k * 70, cyc, 0.2 + k * 0.4, 50 + k * 16, "#9fd8ec", dur=1.4,
                 shake=False)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_cockpit, "fade", 0.4),
        Shot(c(1) - 0.1, shot_copilot, "fade", 0.25),
        Shot(c(2) - 0.1, shot_stars, "fade", 0.4),
        Shot(c(3) - 0.1, shot_twice, "fade", 0.3),
        Shot(c(4) - 0.1, shot_awake, "fade", 0.3),
    ]
    S.tods = [(0, "night")]
    S.sfx += [(0.3, "click", 0.7), (c(0) + (c(1) - c(0)) * 0.4, "pencil", 0.6), (c(1) + 0.3, "cloth", 0.6),
              (c(2), "rain", 0.6), (c(2) + 1.5, "crickets", 0.6), (c(3) + (c(4) - c(3)) * 0.6, "pa_chime", 0.4),
              (c(4) + 0.2, "snore", 0.6)]
    S.music = [(0, "lonely", 0.7), (c(2), "wonder", 0.8), (c(4), "sad", 0.6)]
