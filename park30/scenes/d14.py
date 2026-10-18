"""День 14: половина. Распорядок: канатка к сараю на рассвете, шитьё до полудня, горелка днём, в восемь — Гас и
фонарик через озеро, ночь в башне замка с енотом на ногах. Заплаток: 25 из 37."""
from scenes.kit import *
from scenes.shared import *

CABLE = RD.sky_ride_cable(-400, PK.FL - 1500, 6000, PK.FL - 1400, 240)


def progress_bar(ctx, x, y, w, k, day):
    D.rrect(ctx, x - w / 2, y - 40, w, 80, 40, hexrgb("#0e1410"), D.INK, 6)
    D.rrect(ctx, x - w / 2 + 12, y - 28, (w - 24) * k, 56, 28, hexrgb("#ffd23a"), None, 0)
    for j in range(1, 30):
        xx = x - w / 2 + 12 + (w - 24) * j / 30
        D.line(ctx, xx, y - 28, xx, y + 28, hexrgb("#0e1410"), 2, 0.5)
    D.text(ctx, "DAY %d / 30" % day, x + w / 2 + 30, y + 20, 54, D.FONT_TITLE, hexrgb("#fff6d8"), "left",
           stroke=D.INK, slw=6)


def shot_halfway(ctx, t, S):
    """Рассвет над замком; шкала дней доползает до середины."""
    d = S.cue(1) - 0.1
    cam = Cam(0, PK.FL - 1000, Keys((0, 0.38), (d, 0.4)), anchor=(0, 520))
    sky_back(ctx, t, cam, "morning", -5000, 5000, sun=(900, 300 - 160 * clamp(t / d), 150))
    with layer(ctx, cam, t):
        PK.plaza(ctx, "morning", -5000, 5000, c="#a8d878")
        CA.castle(ctx, 0, PK.FL, 0.65, "morning", t)
    k = lerp(13 / 30, 14 / 30, smooth(clamp((t - 0.4) / 0.8)))
    progress_bar(ctx, W / 2 - 160, 150, 1100, k, 13 if t < 0.8 else 14)
    if t > 1.2:
        pop_text(ctx, "HALFWAY", W / 2, 470, t, 1.2, 130, "#ffd23a", dur=d, shake=False, rot=0.0)


def panel_clip(ctx, i, n, k):
    """Прямоугольник i-й панели триптиха с выездом k (0..1)."""
    pw = W / n
    x0 = i * pw
    off = (1 - ease_out(k)) * H
    ctx.rectangle(x0 + 6, 6 + off, pw - 12, H - 12)
    return x0, pw, off


def shot_routine(ctx, t, S):
    """Триптих: 6:00 канатка на рассвете · 9:00 шитьё · 15:00 горелка у сарая."""
    d = S.cue(2) - S.cue(1)
    D.rect(ctx, 0, 0, W, H, hexrgb("#1c1830"), None, 0, wob=0)
    labels = ("6 AM", "9 AM", "3 PM")
    for i in range(3):
        t0 = i * d * 0.3
        k = clamp((t - t0) / 0.35)
        if k <= 0:
            continue
        ctx.save()
        x0, pw, off = panel_clip(ctx, i, 3, k)
        ctx.clip()
        ctx.translate(x0 + pw / 2 - W / 2, off)
        tt = t - t0
        if i == 0:
            u0 = 0.25
            cam = Cam(lambda q: CABLE(u0 + 0.02 * q)[0], lambda q: CABLE(u0 + 0.02 * q)[1] + 200, 0.75)
            with layer(ctx, cam, t, 0.3):
                PK.sky(ctx, t, "morning", -3000, 9000, sun=(1400, -900, 140))
            with layer(ctx, cam, t, 0.6):
                PK.far_lake(ctx, t, "morning", -3000, 9000)
            with layer(ctx, cam, t):
                RD.cable(ctx, CABLE, tod="morning")
                x, y = CABLE(u0 + 0.02 * t)

                def riders(c, bx, by):
                    p = sit_pose(t, 1, "neutral")
                    p.update(h1=(0.6, -1.9), h2=(0.5, -1.9))
                    RASCAL_PATCH.draw(c, -40, by + 55, 60, 1, rascal_pose(p, "calm"))
                    draw_raccoon(c, 50, by - 30, 50, 1, raccoon_pose(t, "sit", look=0.3))
                RD.sky_bucket(ctx, x, y, 1.4, "#e8423c", "morning", riders, sway=0.05 * math.sin(t * 1.3))
        elif i == 1:
            cam = Cam(1700 + 230, IN.FL - 380, 1.0)
            room_back(ctx, t, cam, "workshop_19", lambda c: IN.workshop(c, "day", patches_done=19),
                      (-600, -900, 4200, 2700), 0.6)
            with layer(ctx, cam, t):
                sx = 1700 + 420
                D.rect(ctx, sx - 470, IN.FL - 168, 120, 24, hexrgb("#8a5a34"), D.INK, 3, wob=0)
                for lx in (sx - 460, sx - 370):
                    D.line(ctx, lx, IN.FL - 148, lx, IN.FL + 20, D.INK, 8)
                p = sit_pose(t, 1, "neutral", seat=1.5)
                push = math.sin(t * 7) * 0.06
                p.update(h1=(1.25 + push, -2.35), h2=(1.0 + push, -2.3), look=(1, 0.5), neck=0.2)
                THEO_FUR_PATCH.draw(ctx, sx - 410, IN.FL + 20, 112, 1, p)
                off2 = (t * 60) % 120
                D.rect(ctx, sx + 40 - off2, IN.FL - 292, 420, 14, hexrgb("#f05a8a"), D.INK, 3, wob=0)
        else:
            cam = Cam(1350, PK.FL - 520, 0.6)
            grass_back(ctx, t, cam, "day", -1500, 4000, sun=(2000, -800, 120))
            with layer(ctx, cam, t):
                BL.shed(ctx, 1100, PK.FL - 60, 1600, 1100, "day", open_k=1.0)
                BL.folded(ctx, 1060, PK.FL - 80, 0.85, "dusk")
                fire = 1.0 if (tt % 1.4) < 0.5 else 0.15
                BL.basket(ctx, 1700, PK.FL + 60, 1.0, "day", fire, t, tanks=2)
                p = R.stand("side", t, 1)
                p.update(h1=(0.8, -3.4), h2=(0.4, -1.8), lean=-0.1 if fire > 0.5 else 0.0)
                RASCAL_PATCH.draw(ctx, 1380, PK.FL + 70, 112, 1, rascal_pose(p, "scared" if fire > 0.5 else "happy"))
                draw_raccoon(ctx, 2050, PK.FL + 80, 100, -1, raccoon_pose(t, "sit", look=-0.3))
            if (tt % 1.4) < 0.5:
                pop_text(ctx, "WHOOSH", W / 2, 360, tt, int(tt / 1.4) * 1.4, 70, "#ffd23a", dur=0.5)
        ctx.restore()
        D.rrect(ctx, x0 + pw / 2 - 120, H - 170 + off, 240, 90, 20, hexrgb("#0e1410"), D.INK, 5)
        D.text(ctx, labels[i], x0 + pw / 2, H - 103 + off, 60, D.FONT_TITLE, hexrgb("#ffd23a"))


def shot_signal(ctx, t, S):
    """20:00 — у окна башни: Тео мигает фонариком через озеро, маяк мигает в ответ; рация на подоконнике."""
    d = S.cue(3) - S.cue(2)
    T_REPLY = d * 0.5
    on = (t % 0.5) < 0.25 and t < T_REPLY
    beam = 1.0 if (t > T_REPLY and ((t - T_REPLY) % 0.5) < 0.25) else 0.0
    cam = Cam(IN.TOWER_WIN_X + 60, 420, Keys((0, 1.0), (d, 1.12)))
    room_back(ctx, t, cam, "tower_night_torch_%d" % int(beam),
              lambda c: IN.tower_room(c, "night", beam=beam, torch=False), (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        IN.radio(ctx, IN.TOWER_WIN_X + 230, IN.FL - 300 + 2, 0.9, True, "night", 9, t, 1.0 if t > T_REPLY else 0.0)
        p = R.stand("back", t, 1)
        p.update(h2=(0.5, -3.3), h1=(-0.3, -1.7))
        J = THEO_FUR_PATCH.draw(ctx, IN.TOWER_WIN_X - 60, IN.FL + 60, 112, 1, p)
        fx_, fy_ = THEO_FUR_PATCH.world(IN.TOWER_WIN_X - 60, IN.FL + 60, 112, 1, J["hand2"])
        D.rrect(ctx, fx_ - 20, fy_ - 50, 40, 80, 12, hexrgb("#ffd23a"), D.INK, 3)
        if on:       # луч в окно, на маяк
            tx, ty = IN.TOWER_WIN_X + 120, 330
            ax, ay = tx - fx_, ty - (fy_ - 50)
            L = math.hypot(ax, ay)
            nx, ny = -ay / L, ax / L
            D.radial(ctx, fx_, fy_ - 60, 200, "#fff2a0", 0.6, 0)
            D.poly(ctx, [(fx_ - 16 * nx, fy_ - 50 - 16 * ny), (fx_ + 16 * nx, fy_ - 50 + 16 * ny),
                         (tx + 90 * nx, ty + 90 * ny), (tx - 90 * nx, ty - 90 * ny)],
                   hexrgb("#fff2a0"), None, 0, wob=0, alpha=0.25)
        draw_raccoon(ctx, IN.TOWER_WIN_X - 190, 580, 95, 1, raccoon_pose(t, "sit", look=0.5))
    fx.darkness(ctx, 0.3, [fx.Light(*cam.to_screen(t, IN.TOWER_WIN_X, 200), 600, power=0.5, glow_a=0.0)])
    clock_badge(ctx, "8 PM", t, W - 260, 150, "#ffd23a")
    if on:
        pop_text(ctx, "BLINK", W / 2 - 420, 330, t, int(t / 0.5) * 0.5, 70, "#fff2a0", dur=0.3, shake=False)
    if t > T_REPLY:
        pop_text(ctx, "BLINK BLINK", W / 2 + 330, 520, t, T_REPLY, 70, "#fff2a0", dur=d, shake=False)


def shot_sleep(ctx, t, S):
    """Лежанка в башне: Тео спит, Бандит клубком у него на ногах; мелом на стене — 25 из 37."""
    d = S.dur - S.cue(3)
    bx = IN.TOWER_BED_X
    cam = Cam(bx - 100, 600, Keys((0, 1.05), (d, 1.15)))
    room_back(ctx, t, cam, "tower_night_0", lambda c: IN.tower_room(c, "night", beam=0.0),
              (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        # мелом по камню: палочки 5-ками
        for g in range(5):
            for j in range(5):
                x = bx - 520 + g * 120 + j * 18
                if g * 5 + j >= 25:
                    break
                if j == 4:
                    D.line(ctx, x - 80, 300, x + 6, 260, hexrgb("#fbfaf6"), 6, 0.9)
                else:
                    D.line(ctx, x, 250, x + 4, 330, hexrgb("#fbfaf6"), 6, 0.9)
        D.text(ctx, "/37", bx + 200, 320, 70, D.FONT_HAND, hexrgb("#fbfaf6"), alpha=0.9)
        p = R.stand("side", t, 1)
        p.update(face="sleep", blink=1)
        draw_lying(ctx, THEO_FUR_PATCH, bx - 150, IN.FL - 160, 100, 1, p, 0.0, t)
        draw_raccoon(ctx, bx + 120, IN.FL - 165, 90, -1, raccoon_pose(t, "sleep"))
        for j in range(3):
            ph = (t * 0.45 + j / 3) % 1
            D.text(ctx, "Z", bx - 330 + ph * 90, IN.FL - 330 - ph * 140, 40 + 26 * ph, D.FONT_TITLE,
                   hexrgb("#9fb0e0"), alpha=min(1.0, (1 - ph) * 2))
    fx.darkness(ctx, 0.35, [fx.Light(*cam.to_screen(t, bx - 100, IN.FL - 250), 700, power=0.5, glow_a=0.0)])
    counter_badge(ctx, "PATCHES", "25/37", W - 360, 160, "#7ee04a", 540)


def build(S):
    c = S.cue
    S.shots = [
        Shot(0, shot_halfway, "fade", 0.4),
        Shot(c(1) - 0.1, shot_routine, "fade", 0.3),
        Shot(c(2) - 0.1, shot_signal, "fade", 0.3),
        Shot(c(3) - 0.1, shot_sleep, "fade", 0.4),
    ]
    S.tods = [(0, "morning"), (c(1), "day"), (c(2), "night")]
    S.sfx += [(1.2, "ding", 0.7), (c(1) + 0.2, "cable_hum", 0.5), (c(1) + (c(2) - c(1)) * 0.3, "sewing", 0.6),
              (c(1) + (c(2) - c(1)) * 0.6, "burner", 0.9), (c(2) + 0.3, "click", 0.5),
              (c(2) + (c(3) - c(2)) * 0.5, "radio_beep", 0.6), (c(3) + 0.5, "snore", 0.5), (c(3) + 0.6, "crickets", 0.5)]
    S.music = [(0, "hope", 0.8), (c(1), "fun", 0.8), (c(2), "warm", 0.8), (c(3), "lonely", 0.6)]
