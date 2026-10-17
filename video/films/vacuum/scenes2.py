"""Сцены: правила 2–7 и финал."""
import math

import skia

from engine import kit as K
from engine import mapplan as M
from engine import picto as P
from engine.core import (AMBER, BG, CX, CY, DARK, DIM, GREEN, GREY, H, PAPER, RED, SOFT, W, WHITE, blink, clamp,
                         color, dashed, draw_text, ease_in, ease_io, ease_out, fade, font, glow_circle, hash01,
                         layer, lerp, out_back, paint, pop, prog, rrect, spring, text_width, window, wobble, xf)
from .scenes import BED_HEAD, FL, SCAN, VAC_STOP, bedroom, card, ghost_sit, lidar_side


# ------------------------------------------------------------------ правило 2
def s_laser(S, sc):
    v = M.MapView(1770, 900, 2700)   # крупно спальня
    t_spin = S.at("b2", "laser")
    t_meas = S.at("b3", "distance")
    t_you = S.at("b4")
    S.cue(sc.t0, "dark")
    S.cue(t_spin, "scan", dur=t_you - t_spin + 0.3)
    hits = [((30, 2, 8, 6), "2.31 M", t_meas), ((21, 3, 4, 4), "0.84 M", t_meas + 0.35),
            ((40, 0, 0, 28), "3.02 M", t_meas + 0.7)]
    for _, _, tt in hits:
        S.cue(tt, "ping")
    S.cue(t_you, "hit")
    robot = (31, 21)
    target = (12, 9)

    def draw(c, t):
        M.draw_plan(c, v, a=0.35 + 0.1 * fade(t, t_spin), labels=0, doors=0.5)
        # спящий сверху: голова и одеяло
        bx, by = v.p(4.5, 9.5)
        c.drawCircle(bx + 0.7 * v.k, by, 1.5 * v.k, paint(WHITE, 0.5))
        c.drawRRect(rrect(bx + 2.6 * v.k, by - 4.6 * v.k, 13 * v.k, 9.2 * v.k, 1.2 * v.k), paint(WHITE, 0.32))
        rx, ry = v.p(*robot)
        if t >= t_spin:
            if t < t_you:
                ang = (t - t_spin) * 7.0
            else:
                tx, ty = v.p(*target)
                ang_t = math.atan2(ty - ry, tx - rx)
                ang = ang_t
            L = 30 * v.k
            ex, ey = rx + math.cos(ang) * L, ry + math.sin(ang) * L
            sh = skia.GradientShader.MakeLinear([skia.Point(rx, ry), skia.Point(ex, ey)],
                                                [color(RED, 0.9), color(RED, 0.0)])
            p = paint(RED, 1, stroke=4)
            p.setShader(sh)
            c.drawLine(rx, ry, ex, ey, p)
        for (fx, fy, fw, fh), lab, tt in hits:
            k = pop(t, tt)
            if k > 0:
                hx, hy = v.p(fx + fw / 2, fy + fh / 2)
                K.laser(c, rx, ry, hx, hy, 0.5 * clamp(1 - (t - tt) / 1.2) + 0.15, w=1.5)
                with xf(c, hx, hy - 40, s=k):
                    K.label(c, 0, 0, lab, bg=WHITE, size=20)
        if t >= t_you:
            tx, ty = v.p(*target)
            K.laser(c, rx, ry, tx, ty, 1.0, w=3)
            K.cv_box(c, tx - 90, ty - 80, 220, 160, "YOU • 1.42 M", ease_out(prog(t, t_you, 0.3)), RED)
        P.vacuum_top(c, rx, ry, 9 * v.k, rot=200, turret=t * 400, led=GREEN)
    return draw


def s_see(S, sc):
    t_on = S.at("b5", "turn")
    t_see = S.at("b5", "see")
    t_it = S.at("b6", "see")
    t_off = S.at("b7")
    t_both = S.at("b7", "both")
    S.cue(t_on + 0.2, "click")
    S.cue(t_it, "ping")
    S.cue(t_off, "click")
    S.cue(t_off + 0.02, "drop")
    S.glitch(t_both, 0.25, 0.7)
    S.cue(t_both, "hit")

    def draw(c, t):
        lit = t_on + 0.2 <= t < t_off
        if lit:
            c.drawRect(skia.Rect.MakeWH(W, H), paint((40, 34, 24), 1))
        bedroom(c, t, lamp_on=1.0 if lit else 0.0, zz=False)
        led = RED if t >= t_it else GREEN
        v = P.vacuum_side(c, VAC_STOP, FL, 220, led=led, led_a=1.0)
        if lit and t >= t_see:
            K.cv_box(c, VAC_STOP - 130, FL - 110, 260, 125, "", ease_out(prog(t, t_see, 0.3)), AMBER)
        if t >= t_it:
            k = ease_out(prog(t, t_it, 0.4))
            hx, hy = BED_HEAD
            e1 = (hx + 10, hy - 110)
            e2 = (VAC_STOP + 60, FL - 180)
            P.eye(c, *e1, 90, open_=k, look=(1, 0.3))
            P.eye(c, *e2, 90, open_=k, look=(-1, -0.3), iris=RED)
            c.drawLine(e1[0] + 50, e1[1], lerp(e1[0] + 50, e2[0] - 50, k), lerp(e1[1], e2[1], k),
                       dashed(paint(WHITE, 0.7, stroke=3), 10, 10, -t * 40))
    return draw


# ------------------------------------------------------------------ правило 3
def s_mic(S, sc):
    t_x = S.at("c1", "microphone")
    t_need = S.at("c1", "need")
    S.cue(t_x, "cross")
    S.cue(t_need, "scan", dur=1.2)

    def draw(c, t):
        k = ease_io(prog(t, t_need - 0.2, 0.6))
        with xf(c, lerp(960, 640, k), 470, s=lerp(1.0, 0.8, k)):
            P.mic(c, 0, 0, 320)
            P.cross(c, 0, 0, 300, prog(t, t_x, 0.3))
        if k > 0:
            with layer(c, k):
                P.vacuum_top(c, 1300, 470, 230, rot=180, turret=t * 300)
                ang = t * 7
                K.laser(c, 1300, 470, 1300 + math.cos(ang) * 300, 470 + math.sin(ang) * 300, k, w=2.5, dot=False)
    return draw


def s_lidarphone(S, sc):
    t_bin = S.at("c2", "bin")
    t_spoke = S.at("c3", "spoke")
    t_shook = S.at("c3", "shook")
    t_slight = S.at("c3", "slightly")
    t_read = S.at("c4", "read")
    t_num = S.at("c5", "numbers")
    t_nine = S.at("c5", "nine")
    t_name = S.at("c6", "lidarphone")
    S.cue(sc.t0, "type", dur=1.0)
    S.cue(t_bin - 0.3, "laser_on")
    S.cue(t_spoke, "murmur", dur=2.8)
    S.cue(t_read, "data", dur=1.5)
    for i in range(10):
        S.cue(t_num + 0.2 + i * 0.12, "tick", pitch=1 + (i % 3) * 0.1)
    S.cue(t_nine, "hit")
    S.cue(t_name, "stamp")
    S.shake(t_name, 10, 0.3)
    digits = "4719386250"

    def draw(c, t):
        K.header(c, t, sc.t0, "RESEARCH  //  UNIV. OF MARYLAND + NUS  //  2020")
        K.floor(c, 760, 150, 1770)
        v = P.vacuum_side(c, 480, 760, 240, led=GREEN)
        shake = clamp((t - t_shook) / 0.3) if t_spoke <= t < t_name else 0.0
        P.trash_bin(c, 1150, 760, 230, shake=shake * 0.6, t=t)
        if t >= t_bin - 0.3:
            fl = 0.7 + 0.3 * math.sin(t * 40)
            K.laser(c, v["lidar"][0], v["lidar"][1], 1072, v["lidar"][1], fl, w=2.5)
        # говорящий человек
        P.person_front(c, 1600, 760, 380)
        if t >= t_spoke:
            for k in range(3):
                ph = ((t - t_spoke) * 1.4 + k / 3) % 1
                arc = skia.Path()
                r = 30 + ph * 170
                arc.addArc(skia.Rect.MakeXYWH(1600 - 20 - r, 760 - 0.93 * 380 - r, 2 * r, 2 * r), 160, 60)
                c.drawPath(arc, paint(WHITE, (1 - ph) * 0.8, stroke=4))
        # «очень слегка» — лупа
        if t_slight <= t < t_num:
            k = ease_out(prog(t, t_slight, 0.35)) * (1 - ease_in(prog(t, t_num - 0.3, 0.3)))
            with xf(c, 1150, 330, s=k):
                c.drawCircle(0, 0, 150, paint(DARK))
                c.drawCircle(0, 0, 150, paint(WHITE, stroke=5))
                c.save()
                c.clipPath(skia.Path().addCircle(0, 0, 145))
                for i in range(7):
                    xx = -110 + i * 36 + math.sin(t * 70 + i) * 3
                    c.drawLine(xx, -150, xx, 150, paint(SOFT, 0.6, stroke=6))
                c.restore()
                K.label(c, 0, 120, "0.000 01 MM", bg=RED, size=18)
            c.drawLine(1150, 480, 1150, 560, paint(WHITE, 0.6 * k, stroke=3))
        # осциллограмма
        if t_read <= t < t_num:
            k = ease_out(prog(t, t_read, 0.3)) * (1 - ease_in(prog(t, t_num - 0.3, 0.3)))
            K.panel(c, 160, 230, 700, 200, "LIDAR RETURN", k, SOFT)
            K.waveform(c, 190, 350, 640, 110, t, t_read + 0.1, a=k, speed=1.0, seed=1)
        # распознанные цифры
        if t >= t_num:
            for i, d in enumerate(digits):
                tt = t_num + 0.2 + i * 0.12
                k = pop(t, tt)
                if k <= 0:
                    continue
                x = 960 - 5 * 96 + i * 96 + 48
                with xf(c, x, 300, s=k):
                    bad = i == 6
                    c.drawRRect(rrect(-36, -44, 72, 88, 10), paint(RED if bad else WHITE, stroke=4))
                    draw_text(c, d, 0, 18, font(50, "bold"), paint(RED if bad else WHITE), "center")
                    if t >= tt + 0.25:
                        if bad:
                            P.cross(c, 0, 66, 30, 1)
                        else:
                            P.check(c, 0, 66, 34, prog(t, tt + 0.25, 0.25))
        if t >= t_nine:
            if t < t_name:
                with xf(c, 960, 470, s=pop(t, t_nine)):
                    draw_text(c, "9 / 10", 0, 30, font(84, "bold"), paint(RED), "center", tracking=6)
        if t >= t_name:
            K.stamp(c, 960, 520, "LIDARPHONE", t, t_name, rot=-6, size=100)
    return draw


def s_whisper(S, sc):
    t_w = S.at("c7", "whisper")
    t_x = S.at("c7", "next")
    t_say = S.at("c8", "say")
    t_x2 = S.end("c8") - 0.1
    t_doing = S.at("c9")
    S.cue(t_w, "pop")
    S.cue(t_x, "cross")
    S.cue(t_say + 0.2, "pop")
    S.cue(t_x2, "cross")
    S.cue(t_doing, "scan", dur=1.4)
    words8 = [(w["w"].upper().strip("“”,."), w["t0"]) for w in S.lines["c8"]["words"][3:]]

    def cam(t):
        k = ease_io(prog(t, t_doing - 0.1, 0.9))
        return 1.0 + 0.7 * k, lerp(CX, 1500, k), lerp(CY, 800, k)
    sc.cam = cam

    def draw(c, t):
        K.floor(c, 900, 100, 1820)
        info = P.bed(c, 900, 900, 1100, second=True)
        hx, hy = info["head"]
        P.vacuum_side(c, 1590, 900, 300, led=RED if t >= t_doing else GREEN, led_a=0.5 + 0.5 * blink(t, 2))
        if t >= t_doing:
            lidar_side(c, t, (1590 + 0.15 * 300, 900 - 0.29 * 300), 1450, 1.0)
        if t < t_say:
            K.text_bubble(c, hx + 160, hy - 200, "psst…", t, t_w, size=40, tail=(-0.35, 1))
            P.cross(c, hx + 160, hy - 200, 160, prog(t, t_x, 0.3))
        else:
            K.text_bubble(c, hx + 420, hy - 220, "IT'S DOING THE THING AGAIN", t, t_say + 0.2, size=34,
                          tail=(-0.42, 1), words=words8)
            P.cross(c, hx + 420, hy - 220, 220, prog(t, t_x2, 0.3))
    return draw


def s_office(S, sc):
    t_v = S.at("c10") - 0.9
    t_wait = S.at("c11")
    t_stop = S.at("c12") - 0.9
    t_ty = S.at("c12")
    S.cue(t_v, "office_vac", dur=t_stop - t_v)
    bumps = [t_v + 1.2 + k * 1.15 for k in range(5)]
    for b in bumps:
        if b < t_stop:
            S.cue(b, "bump")

    def draw(c, t):
        # стол
        c.drawRect(skia.Rect.MakeLTRB(560, 640, 1360, 668), paint(WHITE))
        c.drawRect(skia.Rect.MakeLTRB(600, 668, 628, 800), paint(WHITE))
        c.drawRect(skia.Rect.MakeLTRB(1292, 668, 1320, 800), paint(WHITE))
        K.floor(c, 800, 300, 1620)
        # пылесос под столом катается туда-сюда
        if t_v <= t < t_stop + 1.0:
            ph = (t - t_v) / 1.15
            x = 660 + 600 * (0.5 - 0.5 * math.cos(ph * math.pi))
            if t > t_stop:
                x += (t - t_stop) * 900
            P.vacuum_side(c, x, 800, 150, led=GREEN)
        look = 0.0
        if t_v + 0.5 < t < t_stop:
            look = -1.0 + 2 * (0.5 - 0.5 * math.cos((t - t_v) / 1.15 * math.pi))
        P.bust(c, 960, 640, 360, "agent", look=look * 0.8)
        # «ждём»
        if t_wait + 0.6 <= t < t_ty:
            n = int((t - t_wait) * 2) % 4
            draw_text(c, "." * n, 960, 260, font(60, "bold"), paint(SOFT), "center", tracking=10)
    return draw


# ------------------------------------------------------------------ правило 4
NAMES = ["DUSTY", "ROSIE", "KEVIN", "R2"]


def name_tag(c, x, y, s, text, a=1.0, col=WHITE, strike=0.0, glitch=False, t=0.0):
    f = font(0.32 * s, "bold")
    tw = max(text_width(text, f, 3), 0.8 * s)
    w, h = tw + 0.5 * s, 0.6 * s
    c.drawLine(x, y - h / 2 - 0.5 * s, x, y - h / 2, paint(SOFT, a, stroke=3))
    c.drawRRect(rrect(x - w / 2, y - h / 2, w, h, 0.12 * s), paint(col, a))
    c.drawCircle(x - w / 2 + 0.18 * s, y, 0.06 * s, paint(BG, a))
    if glitch:
        chars = "█▓▒░#@%&ABCDEFGHJKLMNPQRSTVWXZ"
        text = "".join(chars[int(hash01(i, int(t * 14)) * len(chars))] for i in range(len(text)))
    draw_text(c, text, x + 0.08 * s, y + 0.11 * s, f, paint(BG, a), "center", tracking=3)
    if strike > 0:
        c.drawLine(x - w / 2 - 10, y, x - w / 2 - 10 + (w + 20) * strike, y, paint(RED, a, stroke=0.08 * s))


def s_names(S, sc):
    t_name = S.at("d1", "name")
    t_most = S.at("d1", "most")
    t_ga = S.at("d2")
    t_30 = S.at("d2", "thirty")
    t_21 = S.at("d2", "twentyone")
    S.cue(t_name, "pop")
    for i in range(len(NAMES)):
        S.cue(t_most + i * 0.12, "pop", pitch=1 + i * 0.07)
    S.cue(t_ga, "type", dur=0.8)
    t_grid = t_ga + 0.3
    for i in range(30):
        if i % 3 == 0:
            S.cue(t_grid + i * 0.04, "tick", pitch=1.2)
    S.cue(t_21, "hit")

    def draw(c, t):
        if t < t_ga - 0.1:
            K.floor(c, 760, 150, 1770)
            P.vacuum_side(c, 960, 760, 420, led=GREEN)
            if t >= t_name:
                with xf(c, 960, 520, s=pop(t, t_name)):
                    name_tag(c, 0, 0, 110, "ROBBIE")
            for i, nm in enumerate(NAMES):
                k = pop(t, t_most + i * 0.12)
                if k <= 0:
                    continue
                x = [230, 480, 1440, 1690][i]
                with xf(c, x, 760, s=k):
                    P.vacuum_side(c, 0, 0, 170, led=GREEN)
                    name_tag(c, 0, -180, 60, nm)
            return
        K.header(c, t, t_ga, "GEORGIA TECH  //  2007  //  30 OWNERS")
        for i in range(30):
            col, row = i % 10, i // 10
            x, y = 330 + col * 120, 360 + row * 170
            k = pop(t, t_grid + i * 0.04)
            if k <= 0:
                continue
            named = i < 21 and t >= t_21 + (i % 7) * 0.03
            with xf(c, x, y, s=k):
                P.bust(c, 0, 50, 100, col=WHITE if named else GREY, a=1.0 if named else 0.6)
                if named:
                    c.drawRRect(rrect(-32, 60, 64, 22, 6), paint(RED))
        if t >= t_21:
            with xf(c, 960, 260, s=pop(t, t_21)):
                draw_text(c, "21 / 30 NAMED IT", 0, 18, font(52, "bold"), paint(RED), "center", tracking=4)
    return draw


def s_tidy(S, sc):
    t0 = S.at("d3")
    t_any = S.at("d4", "anyone")
    items = [(560, "sock"), (800, "cable"), (1040, "sock"), (1260, "cable")]
    for i in range(4):
        S.cue(t0 + 0.6 + i * 0.75, "pop", pitch=1.2)
    S.cue(S.at("d4") - 0.1, "whoosh", dur=0.4)
    S.cue(t_any, "cross")

    def draw(c, t):
        if t < S.at("d4") - 0.1:
            K.label(c, 960, 240, "PRE-CLEANING", col=SOFT, size=24)
            K.floor(c, 760, 150, 1770)
            P.dock(c, 1600, 760, 230)
            P.vacuum_side(c, 1530, 760, 190, led=AMBER, led_a=0.6 + 0.4 * blink(t, 1))
            # человек идёт и подбирает
            px = lerp(380, 1340, ease_io(prog(t, t0 + 0.2, 3.3)))
            phase = (t - t0) * 7
            for i, (ix, kind) in enumerate(items):
                tp = t0 + 0.6 + i * 0.75
                if t < tp:
                    with xf(c, ix, 760):
                        (P.sock if kind == "sock" else P.cable)(c, 0, 0, 100)
                else:
                    k = prog(t, tp, 0.4)
                    if k < 1:
                        with xf(c, lerp(ix, px + 40, k), 760 - math.sin(k * math.pi) * 200 - k * 160, s=1 - k):
                            (P.sock if kind == "sock" else P.cable)(c, 0, 0, 100)
            bend = any(t0 + 0.4 + i * 0.75 < t < t0 + 0.8 + i * 0.75 for i in range(4))
            pose = P.walk_pose(phase, 0.7)
            if bend:
                pose.update(lean=40, armF=-30, foreF=10)
            P.person_side(c, px, 760, 330, pose)
            return
        # сравнение
        for i, (title, ok) in enumerate((("FOR THE VACUUM", True), ("FOR ANYONE ELSE", False))):
            x = 560 + i * 800
            K.panel(c, x - 330, 220, 660, 520, title, 1.0)
            if ok:
                P.vacuum_side(c, x, 560, 300, led=GREEN)
                P.check(c, x, 660, 90, prog(t, S.at("d4") + 0.1, 0.35))
            else:
                P.house(c, x, 600, 240)
                for j in range(5):
                    P.sock(c, x - 220 + j * 100, 690, 60, col=GREY)
                P.cross(c, x, 450, 200, prog(t, t_any, 0.3))
    return draw


def s_newname(S, sc):
    t_not = S.at("d5", "not")
    t_new = S.at("d6", "new")
    t_yours = S.at("d7")
    S.cue(t_not + 0.3, "cross")
    S.cue(t_new, "glitch_long", dur=1.2)
    S.glitch(t_new, 0.2, 0.6, sound=False)
    S.cue(t_yours, "data", dur=1.8)

    def draw(c, t):
        flip = 1.0
        if t_new - 0.15 <= t < t_new + 0.15:
            flip = abs(math.cos(prog(t, t_new - 0.15, 0.3) * math.pi))
        with xf(c, 960, 380, sx=flip, sy=1.0):
            if t < t_new:
                name_tag(c, 0, 0, 200, "ROBBIE", strike=ease_out(prog(t, t_not + 0.3, 0.4)))
            else:
                name_tag(c, 0, 0, 200, "ROBBIE", glitch=True, t=t, col=RED)
        if t >= t_yours:
            k = ease_out(prog(t, t_yours, 0.3))
            K.panel(c, 560, 600, 800, 190, "LEARNING SUBJECT NAME", k, RED)
            frac = 0.38 + 0.25 * ease_out(prog(t, t_yours, 2.5))
            K.bar(c, 600, 690, 720, 20, frac, RED, k)
            draw_text(c, f"{int(frac * 100)}%", 1320, 760, font(30, "bold"), paint(RED, k), "right")
            draw_text(c, "YOUR NAME: " + "█" * int(frac * 8) + ("_" if blink(t, 2) else ""), 600, 760,
                      font(30, "bold"), paint(WHITE, k), tracking=3)
    return draw


# ------------------------------------------------------------------ правило 5
def s_app(S, sc):
    t_tap = S.at("e1", "check")
    t_k = S.at("e2", "kitchen")
    t_h = S.at("e2", "hall")
    t_b = S.at("e2", "bedroom")
    t_shape = S.at("e3", "shape")
    t_400 = S.at("e3", "four")
    t_lab = S.at("e4", "label")
    t_no = S.at("e5")
    S.cue(t_tap, "click")
    for tt in (t_k, t_h, t_b):
        S.cue(tt, "tick")
    S.cue(t_shape, "scan", dur=1.6)
    S.cue(t_lab, "pop")
    S.cue(t_no - 0.12, "glitch", amp=0.8, dur=0.08)
    S.cue(t_no, "stamp")
    S.glitch(t_no - 0.12, 0.08, 0.8, sound=False)
    pw, ph = 470, 820
    v = M.MapView(960, 470, pw - 70)

    def cam(t):
        k = ease_io(prog(t, t_shape - 0.6, 1.2))
        fx, fy = v.p(*M.SHAPE)
        return 1.0 + 3.2 * k, lerp(CX, fx + 20, k), lerp(CY, fy + 10, k)
    sc.cam = cam

    def draw(c, t):
        kz = ease_io(prog(t, t_shape - 0.6, 1.2))
        sr = P.phone(c, 960, 470, pw, ph, screen=(14, 16, 19), a=1 - 0.85 * kz)
        c.drawRRect(skia.RRect.MakeRectXY(sr, pw * 0.06, pw * 0.06), paint((14, 16, 19)))
        draw_text(c, "MY HOME", sr.left() + 24, sr.top() + 54, font(26, "bold"), paint(WHITE), tracking=3)
        draw_text(c, "● CLEANING", sr.right() - 24, sr.top() + 52, font(16, "bold"), paint(GREEN), "right")
        hl = None
        hl_a = 0.0
        for name, tt in (("KITCHEN", t_k), ("HALL", t_h), ("BEDROOM", t_b)):
            if t >= tt:
                hl, hl_a = name, ease_out(prog(t, tt, 0.25))
        labels = {"KITCHEN": fade(t, t_k), "HALL": fade(t, t_h), "BEDROOM": fade(t, t_b),
                  "BATH": 0.35, "LIVING ROOM": 0.35, "GARAGE": 0.35}
        M.draw_plan(c, v, labels=1.0, label_set=labels, highlight=hl, hl_a=hl_a, fill_rooms=(DARK, 1.0))
        # фигура у кровати + 400 кругов уборки
        sx, sy = v.p(*M.SHAPE)
        if t >= t_shape:
            k = ease_out(prog(t, t_shape, 0.5))
            for j in range(14):
                rr = (3.4 + j * 0.35) * v.k
                c.drawOval(skia.Rect.MakeXYWH(sx - rr * 1.35, sy - rr, rr * 2.7, rr * 2), paint(WHITE, 0.12 * k, stroke=1))
            # силуэт лежащего человека сверху
            pth = skia.Path()
            pth.addCircle(sx - 4.0 * v.k, sy, 1.15 * v.k)
            pth.addRRect(rrect(sx - 2.6 * v.k, sy - 1.3 * v.k, 5.6 * v.k, 2.6 * v.k, 1.0 * v.k))
            c.drawPath(pth, dashed(paint(WHITE, k, stroke=1.6), 4, 3))
        if t >= t_400:
            n = int(400 * ease_out(prog(t, t_400, 0.9)))
            draw_text(c, f"×{n}", sx + 4 * v.k, sy - 2.2 * v.k, font(1.6 * v.k, "bold"), paint(RED), tracking=1)
        if t >= t_lab:
            k = pop(t, t_lab)
            with xf(c, sx, sy + 3.0 * v.k, s=k):
                c.drawRRect(rrect(-3.2 * v.k, -0.8 * v.k, 6.4 * v.k, 1.6 * v.k, 0.4 * v.k), paint(WHITE))
                txt = "RESERVED"
                f = font(1.1 * v.k, "bold")
                if t_no - 0.12 <= t < t_no - 0.04:
                    draw_text(c, txt, 0, 0.4 * v.k, f, paint(BG), "center", tracking=2)
                else:
                    p = paint(BG, 0.85, blur=0.35 * v.k)
                    draw_text(c, txt, 0, 0.4 * v.k, f, p, "center", tracking=2)
                if t >= t_no:
                    kk = ease_out(prog(t, t_no, 0.2))
                    c.drawRect(skia.Rect.MakeXYWH(-3.4 * v.k, -0.9 * v.k, 6.8 * v.k * kk, 1.8 * v.k), paint(BG))
                    draw_text(c, "DO NOT READ", 0, 2.4 * v.k, font(0.9 * v.k, "bold"), paint(RED, kk), "center", tracking=2)
    return draw


def s_camera(S, sc):
    t_cam = S.at("e6", "camera")
    t_photos = S.at("e7", "photos")
    t_toilet = S.at("e8", "toilet")
    t_shared = S.at("e9", "shared")
    t_fb = S.at("e9", "facebook")
    S.cue(t_cam, "shutter")
    for i in range(3):
        S.cue(t_photos + i * 0.55, "shutter")
    S.cue(t_toilet, "hit")
    S.cue(t_toilet + 0.1, "stamp")
    for i in range(6):
        S.cue(t_shared + 0.3 + i * 0.22, "pop", pitch=1.3 + i * 0.05)

    def snap(c, kind, t):
        if kind == 0:
            K.floor(c, 120, -300, 300, 0.6)
            for x in (-180, -40, 120, 230):
                c.drawRect(skia.Rect.MakeLTRB(x, -200, x + 22, 120), paint(WHITE))
            c.drawRect(skia.Rect.MakeLTRB(-220, -200, 280, -170), paint(WHITE))
        elif kind == 1:
            K.floor(c, 120, -300, 300, 0.6)
            P.door(c, -40, 120, 320, open_=0.5)
            P.dog_side(c, 140, 120, 150)
        else:
            K.floor(c, 120, -300, 300, 0.6)
            P.sofa(c, 0, 120, 420)

    def draw(c, t):
        if t < t_photos - 0.1:
            # камера спереди
            k = ease_out(prog(t, t_cam, 0.5))
            c.drawRRect(rrect(560, 420, 800, 170, 70), paint(WHITE))
            c.drawRRect(rrect(780, 360, 360, 70, 20), paint(WHITE))
            c.drawLine(560, 505, 1360, 505, paint(BG, 0.6, stroke=4))
            c.drawCircle(960, 500, 62, paint(BG))
            c.drawCircle(960, 500, 26 + 22 * k, paint(DIM))
            c.drawCircle(960, 500, 14 + 6 * k, paint(BG))
            glow_circle(c, 990, 476, 7, WHITE, 0.8 * k)
            if t >= t_cam:
                c.drawCircle(1250, 470, 12, paint(RED, blink(t, 1.5)))
                draw_text(c, "REC", 1275, 480, font(24, "bold"), paint(RED), tracking=3)
            K.floor(c, 600, 400, 1520)
            return
        if t < t_toilet - 0.05:
            for i in range(3):
                tt = t_photos + i * 0.55
                k = ease_out(prog(t, tt, 0.25))
                if k <= 0:
                    continue
                x = 520 + i * 440
                with xf(c, x, 470 + (1 - k) * 60, r=(-5 + i * 5) * k):
                    c.drawRect(skia.Rect.MakeXYWH(-200, -160, 400, 320), paint(PAPER))
                    c.drawRect(skia.Rect.MakeXYWH(-186, -146, 372, 260), paint((30, 30, 32)))
                    c.save()
                    c.clipRect(skia.Rect.MakeXYWH(-186, -146, 372, 260))
                    with xf(c, 0, -10, s=0.55):
                        snap(c, i, t)
                    c.restore()
                    draw_text(c, f"IMG_{2041 + i * 17:04d}", -180, 145, font(16, "bold"), paint((60, 55, 50)), tracking=2)
            return
        # фото из туалета — под цензурой
        k = ease_out(prog(t, t_toilet, 0.3))
        shrink = ease_io(prog(t, t_shared, 0.6))
        x = lerp(960, 760, shrink)
        y = lerp(470, 430, shrink)
        s = lerp(1.0, 0.42, shrink)
        with xf(c, x, y, s=s):
            c.drawRect(skia.Rect.MakeXYWH(-330, -260, 660, 520), paint(PAPER, k))
            c.drawRect(skia.Rect.MakeXYWH(-310, -240, 620, 440), paint((30, 30, 32), k))
            # мозаика
            for i in range(10):
                for j in range(7):
                    g = 40 + int(hash01(i, j, 3) * 70)
                    c.drawRect(skia.Rect.MakeXYWH(-300 + i * 60, -230 + j * 60, 58, 58), paint((g, g, g), k))
            c.drawRect(skia.Rect.MakeXYWH(-320, -50, 640, 110), paint(BG, k))
            draw_text(c, "CENSORED", 0, 30, font(70, "bold"), paint(RED, k), "center", tracking=10)
        if t >= t_shared:
            kk = ease_out(prog(t, t_shared, 0.4))
            with layer(c, kk):
                sr = P.phone(c, 1300, 470, 420, 760, screen=(14, 16, 19))
                P.lock(c, sr.left() + 40, sr.top() + 44, 30)
                draw_text(c, "PRIVATE GROUP", sr.left() + 70, sr.top() + 54, font(22, "bold"), paint(WHITE), tracking=2)
                for i in range(6):
                    tt = t_shared + 0.3 + i * 0.22
                    if t < tt:
                        continue
                    yy = sr.top() + 110 + i * 100
                    xx = sr.left() + (30 if i % 2 == 0 else 120)
                    c.drawRRect(rrect(xx, yy, 220, 82, 14), paint(DIM))
                    c.drawRect(skia.Rect.MakeXYWH(xx + 12, yy + 12, 80, 58), paint((70, 70, 72)))
                    c.drawRect(skia.Rect.MakeXYWH(xx + 12, yy + 32, 80, 16), paint(BG))
                    c.drawRect(skia.Rect.MakeXYWH(xx + 104, yy + 22, 90, 10), paint(GREY))
                    c.drawRect(skia.Rect.MakeXYWH(xx + 104, yy + 44, 60, 10), paint(GREY))
                if t >= t_fb:
                    draw_text(c, "SHARED × " + str(int(12 + 140 * ease_out(prog(t, t_fb, 1.2)))),
                              sr.centerX(), sr.bottom() - 30, font(24, "bold"), paint(RED), "center", tracking=2)
    return draw


def s_sticker(S, sc):
    t_agree = S.at("e10", "agreed")
    t_stick = S.at("e10", "sticker")
    t_vid = S.at("e11")
    t_yours = S.at("e12")
    for i in range(3):
        S.cue(t_agree - 0.2 + i * 0.15, "paper")
    S.cue(t_stick, "pop")
    S.cue(t_yours, "hit")

    def cam(t):
        k = ease_io(prog(t, t_vid - 0.3, 0.8)) * (1 - ease_io(prog(t, t_yours - 0.2, 0.3)))
        return 1.0 + 1.5 * k, lerp(CX, 960 - 0.21 * 520, k), lerp(CY, 700 - 0.19 * 520, k)
    sc.cam = cam

    def draw(c, t):
        if t < t_yours - 0.05:
            for i in range(3):
                k = ease_out(prog(t, t_agree - 0.2 + i * 0.15, 0.3))
                if k <= 0:
                    continue
                with xf(c, 330 + i * 30, 400 + i * 16, r=-8 + i * 6):
                    c.drawRect(skia.Rect.MakeXYWH(-120, -160, 240, 320), paint(PAPER, k))
                    for j in range(6):
                        c.drawRect(skia.Rect.MakeXYWH(-90, -120 + j * 30, 180 - (j % 2) * 50, 8), paint((150, 140, 120), k))
                    p = skia.Path()
                    p.moveTo(-80, 110)
                    p.cubicTo(-40, 70, -20, 140, 20, 100)
                    p.cubicTo(40, 80, 60, 120, 90, 100)
                    c.drawPath(p, paint((40, 40, 120), k, stroke=4))
            if t >= t_stick - 0.3:
                k = ease_out(prog(t, t_stick - 0.3, 0.4))
                K.floor(c, 700, 600, 1500, k)
                with layer(c, k):
                    P.vacuum_side(c, 960, 700, 520, sticker=True, led=GREEN)
                    K.label(c, 960, 480, "TEST UNIT", col=SOFT, size=20)
            return
        K.floor(c, 700, 600, 1500)
        P.vacuum_side(c, 960, 700, 520, led=RED, lens=True)
        x0, y0 = 960 - 0.4 * 520, 700 - 0.225 * 520
        c.drawRRect(rrect(x0, y0, 0.38 * 520, 0.07 * 520, 4), dashed(paint(RED, 0.9, stroke=3), 10, 8))
        draw_text(c, "?", x0 + 0.19 * 520, y0 + 30, font(30, "bold"), paint(RED), "center")
        c.drawCircle(1180, 470, 12, paint(RED, blink(t, 1.6)))
        draw_text(c, "REC", 1205, 480, font(24, "bold"), paint(RED), tracking=3)
    return draw


# ------------------------------------------------------------------ правило 6
def s_speaker(S, sc):
    t_cc = S.at("f1", "cleaning")
    t_mv = S.at("f2")
    S.cue(t_cc, "chime")
    S.cue(t_mv, "chime", pitch=0.84)

    def draw(c, t):
        K.floor(c, 760, 300, 1620)
        P.vacuum_side(c, 960, 760, 460, speaker=True, led=GREEN)
        talking = (t_cc <= t < t_cc + 1.0) or (t_mv <= t < t_mv + 1.6)
        P.speaker_icon(c, 700, 560, 80, waves=(t * 2) % 1 if talking else 0)
        if t_cc <= t < t_mv:
            K.text_bubble(c, 1000, 400, "CLEANING COMPLETE.", t, t_cc, size=40, tail=(-0.3, 1), col=GREEN)
        if t >= t_mv:
            K.text_bubble(c, 1000, 400, "PLEASE MOVE ME TO A NEW LOCATION.", t, t_mv, size=36, tail=(-0.35, 1))
    return draw


def s_hacked(S, sc):
    t_c = S.at("f3", "cities")
    t_sh = S.at("f4")
    t_dog = S.at("f5")
    S.cue(S.at("f3", "2024"), "type", dur=0.4)
    for i in range(5):
        S.cue(t_c + i * 0.18, "alarm_blip", pitch=1 + i * 0.05)
    S.cue(t_sh + 0.1, "shout", dur=1.2)
    S.shake(t_sh + 0.1, 16, 1.2)
    S.glitch(t_sh + 0.1, 0.18, 0.7, sound=False)
    S.cue(t_dog, "chase", dur=sc.t1 - t_dog)

    def draw(c, t):
        if t < t_sh:
            K.floor(c, 700, 150, 1770)
            for i in range(5):
                x = 330 + i * 315
                P.house(c, x, 700, 220, light=blink(t + i * 0.37, 0.7, 0.6))
                k = pop(t, t_c + i * 0.18)
                if k > 0:
                    with xf(c, x, 380, s=k):
                        P.warn(c, 0, 0, 90, col=RED)
            draw_text(c, "USA  //  2024", 960, 250, font(30, "bold"), paint(SOFT), "center", tracking=6)
            return
        if t < t_dog:
            K.floor(c, 760, 300, 1620)
            jx = (hash01(int(t * 30), 1) - 0.5) * 10
            P.vacuum_side(c, 960 + jx, 760, 460, speaker=True, led=RED)
            k = pop(t, t_sh + 0.1)
            with xf(c, 960 + jx * 2, 360, s=k, r=math.sin(t * 40) * 3):
                P.bubble(c, 0, 0, 520, 170, tail=(-0.2, 1), col=RED, stroke=7)
                draw_text(c, "#@%&!!", 0, 30, font(90, "bold"), paint(RED), "center", tracking=8)
            return
        # погоня за собакой
        K.floor(c, 760, 0, 1920)
        lt = t - t_dog
        dx = 2100 - lt * 1300
        P.dog_side(c, dx, 760, 260, run=lt * 16, facing=-1)
        vx = dx + 520
        P.vacuum_side(c, vx, 760, 260, led=RED)
        for j in range(5):
            yy = 690 + j * 14
            c.drawLine(vx + 150, yy, vx + 260 + j * 30, yy, paint(SOFT, 0.5, stroke=3))
    return draw


def s_garage(S, sc):
    t_close = S.at("f7", "garage") + 0.4
    t_do = S.at("f8")
    t_back = S.at("f8", "back")
    t_map = S.at("f9", "map")
    S.cue(S.at("f7") + 0.2, "steps", dur=t_close - S.at("f7") - 0.2)
    S.cue(t_close, "door_roll", dur=0.9)
    S.cue(t_back, "scan", dur=1.5)
    S.cue(t_map, "hit")
    v = M.MapView(960, 470, 1150)
    route = [(85, 45), (84, 31), (60, 31), (33, 31), (33, 24), (26, 18), (22, 12)]

    def draw(c, t):
        if t < t_do - 0.1:
            K.floor(c, 760, 100, 1820)
            P.garage(c, 1460, 760, 520, door_open=1 - ease_io(prog(t, t_close, 0.9)))
            lt = t - sc.t0
            px = lerp(300, 1420, ease_io(prog(t, sc.t0 + 0.1, t_close - sc.t0 - 0.1)))
            if t < t_close + 0.2:
                info = P.person_side(c, px, 760, 340, P.walk_pose(lt * 8, carry=True))
                hx, hy = info["hand"]
                P.vacuum_side(c, hx + 20, hy + 26, 150, led_a=0.0)
            # дверь гаража поверх человека, когда он внутри
            if t >= t_close:
                P.garage(c, 1460, 760, 520, door_open=1 - ease_io(prog(t, t_close, 0.9)))
            return
        M.draw_plan(c, v, labels=0.8, fill_rooms=(DARK, 1.0), highlight="GARAGE", hl_a=1.0)
        k = ease_io(prog(t, t_back, 1.6))
        pts = [v.p(*q) for q in route]
        total = sum(math.dist(a, b) for a, b in zip(pts, pts[1:]))
        need = total * k
        p = skia.Path()
        p.moveTo(*pts[0])
        cur = pts[0]
        for a, b in zip(pts, pts[1:]):
            d = math.dist(a, b)
            if need <= 0:
                break
            u = min(1, need / d)
            cur = (lerp(a[0], b[0], u), lerp(a[1], b[1], u))
            p.lineTo(*cur)
            need -= d
        c.drawPath(p, dashed(paint(RED, 1, stroke=5), 14, 10, -t * 60))
        c.drawPath(p, paint(RED, 0.3, stroke=14, blur=6))
        P.vacuum_top(c, cur[0], cur[1], 5 * v.k, rot=0, led=RED, turret=t * 300)
        bx, by = v.p(12, 9)
        if t >= t_map:
            kk = ease_out(prog(t, t_map, 0.4))
            c.drawCircle(bx, by, 4 * v.k * (1 + 0.1 * math.sin(t * 6)), paint(RED, 0.3 * kk, blur=2 * v.k))
            K.label(c, bx + 8 * v.k, by - 6 * v.k, "YOU", bg=RED, size=22, a=kk)
    return draw


# ------------------------------------------------------------------ правило 7
def s_dust(S, sc):
    t_myth = S.at("g1", "skin")
    t_not = S.at("g2", "not")
    t_some = S.at("g2", "some")
    t_you = S.at("g3", "you")
    S.cue(t_myth, "pop")
    S.cue(t_not, "whoosh", dur=0.8)
    S.cue(t_some, "pop")
    S.cue(t_you, "hit")

    def draw(c, t):
        draw_text(c, "HOUSEHOLD DUST", 960, 180, font(30, "bold"), paint(SOFT), "center", tracking=8)
        k = ease_out(prog(t, sc.t0, 0.5))
        skin = lerp(0.8, 0.14, ease_io(prog(t, t_not, 0.9)))
        segs = [("SKIN", skin, WHITE), ("OUTDOORS", (1 - skin) * 0.62, GREY), ("FIBRES, OTHER", (1 - skin) * 0.38, DIM)]
        ang = -30.0
        cx, cy, r = 960, 530, 250 * k
        for i, (name, frac, col) in enumerate(segs):
            sw = 360 * frac
            pop_out = 0.0
            if i == 0 and t >= t_some:
                pop_out = 40 * ease_out(prog(t, t_some, 0.4))
            mid = math.radians(ang + sw / 2)
            ox, oy = math.cos(mid) * pop_out, math.sin(mid) * pop_out
            p = skia.Path()
            p.moveTo(cx + ox, cy + oy)
            p.arcTo(skia.Rect.MakeXYWH(cx + ox - r, cy + oy - r, 2 * r, 2 * r), ang, sw, False)
            p.close()
            colr = RED if (i == 0 and t >= t_you) else col
            c.drawPath(p, paint(colr))
            c.drawPath(p, paint(BG, stroke=6))
            lx = cx + math.cos(mid) * (r + 90) + ox
            ly = cy + math.sin(mid) * (r + 90) + oy
            label_txt = "YOU" if (i == 0 and t >= t_you) else name
            if k > 0.9:
                draw_text(c, label_txt, lx, ly, font(30 if label_txt == "YOU" else 22, "bold"),
                          paint(RED if label_txt == "YOU" else SOFT), "center", tracking=3)
            ang += sw
        if t_myth <= t < t_not + 0.9:
            with xf(c, 1420, 340, s=pop(t, t_myth)):
                K.label(c, 0, 0, "MOSTLY SKIN?", bg=AMBER, size=24)
        if t >= t_not + 0.5:
            K.stamp(c, 1420, 340, "MYTH", t, t_not + 0.5, rot=-10, size=60)
    return draw


def s_collect(S, sc):
    t_hair = S.at("g4", "hair")
    t_skin = S.at("g4", "skin")
    t_nail = S.at("g4", "fingernail")
    t_bed = S.at("g4", "bed")
    t_night = S.at("g5")
    t_dock = S.at("g5", "dock")
    for tt in (t_hair, t_skin, t_nail):
        S.cue(tt, "pop")
    S.cue(t_night, "vac_drive", dur=sc.t1 - t_night)
    S.cue(t_night + 0.6, "suck", dur=1.0)

    def draw(c, t):
        K.floor(c, 760, 150, 1770)
        if t >= t_bed - 0.2:
            with layer(c, ease_out(prog(t, t_bed - 0.2, 0.5))):
                P.bed(c, 760, 760, 900, sleeper=True, zz=((t * 0.45) % 1 + 1e-3))
                P.window(c, 640, 300, 140)
        if t >= t_night - 0.1:
            P.dock(c, 1580, 760, 230)
        # вещи под кроватью
        vx = lerp(-200, 1000, ease_io(prog(t, t_night, 1.0)))
        if t > t_night + 1.0:
            vx = lerp(1000, 1450, ease_io(prog(t, t_night + 1.2, 1.2)))
        items_on = [(560, t_hair, "hair"), (760, t_skin, "skin"), (960, t_nail, "nail")]
        for ix, tt, kind in items_on:
            if t < tt:
                continue
            gone = t >= t_night and vx > ix - 40
            if gone:
                continue
            with xf(c, ix, 735, s=pop(t, tt) * 2.2):
                if kind == "hair":
                    P.hair_strand(c, -60, 0, 120, wave=math.sin(t * 2) * 6)
                elif kind == "skin":
                    for j in range(9):
                        c.drawCircle((hash01(j, 1) - 0.5) * 70, (hash01(j, 2) - 0.5) * 20, 3 + hash01(j, 3) * 3, paint(SOFT))
                else:
                    P.fingernail(c, 0, 0, 40)
        if t >= t_night:
            P.vacuum_side(c, vx, 760, 200, led=GREEN)
            if t >= t_dock:
                K.particles(c, t, (vx + 60, 720), (1580, 600), n=30, col=WHITE, speed=1.1, spread=20, size=3, curve=60)
    return draw


def s_bag(S, sc):
    t_full = S.at("g6", "full")
    t_lift = S.at("g7")
    t_light = S.at("g8", "light")
    t_some = S.at("g9", "somewhere")
    S.cue(t_lift, "creak", dur=0.8)
    S.cue(t_light, "sting")
    S.cue(S.at("g9"), "drop")
    S.cue(S.at("g9"), "drain", dur=2.4)

    def cam(t):
        k = ease_io(prog(t, S.at("g9") - 0.1, 1.6))
        return 1.0 + 0.1 * k, CX, lerp(CY, CY + 520, k)
    sc.cam = cam

    def draw(c, t):
        K.floor(c, 840, 300, 1620)
        lift = 0.0
        if t >= t_lift:
            lift = -90 * ease_out(prog(t, t_lift, 0.8))
        if t >= t_light:
            lift += -110 * ease_out(prog(t, t_light, 0.5)) + math.sin(t * 3) * 8
        info = P.dock(c, 960, 840, 540, cut=True, fill=0.06, bag_dy=lift)
        bx, by = info["bag"]
        if t >= t_full:
            k = ease_out(prog(t, t_full, 0.3))
            yl = 840 - 0.5 * 540 - 0.24 * 540 + 4
            c.drawLine(bx - 130, yl, bx + 130, yl, dashed(paint(AMBER, k, stroke=3), 10, 8))
            K.label(c, bx + 330, yl, "EXPECTED: FULL", col=AMBER, size=20, a=k)
        if t >= t_lift:
            k = ease_out(prog(t, t_lift, 0.3))
            kg = "0.00 KG"
            K.label(c, bx - 340, by + lift, kg, bg=RED if t >= t_light else WHITE, size=26, a=k)
        # трубка вниз сквозь пол
        if t >= S.at("g9") - 0.2:
            k = ease_out(prog(t, S.at("g9") - 0.2, 0.5))
            c.drawRect(skia.Rect.MakeLTRB(1150, 810, 1185, 1500), paint(WHITE, k))
            for j in range(26):
                ph = (t * 0.8 + hash01(j, 4)) % 1
                c.drawCircle(1167 + (hash01(j, 5) - 0.5) * 12, 820 + ph * 740, 3, paint(RED, k * (1 - ph)))
            draw_text(c, "↓", 1167, 1560, font(80, "bold"), paint(RED, k * blink(t, 1.5, 0.7)), "center")
    return draw


def s_agency(S, sc):
    t_q = S.at("g10", "wondering")
    t_ag = S.at("g11", "agency")
    t_homes = S.at("g12", "homes")
    t_in = S.at("g13")
    t_low = S.at("g14")
    for i in range(3):
        S.cue(t_q + i * 0.2, "pop", pitch=1 + i * 0.1)
    S.cue(t_ag, "theme_hit")
    S.cue(t_homes, "cross")
    S.cue(t_in, "whoosh", dur=0.6)
    S.cue(t_low - 0.05, "boom", amp=1.0)
    S.glitch(t_low - 0.05, 0.3, 0.9, sound=True)
    S.shake(t_low, 18, 0.6)

    def draw(c, t):
        if t < t_homes - 0.15:
            ax = lerp(960, 700, ease_io(prog(t, t_ag - 0.2, 0.5)))
            P.bust(c, ax, 720, 420, "agent")
            for i in range(3):
                k = pop(t, t_q + i * 0.2)
                if k > 0:
                    pos = [(-260, -470), (-170, -560), (220, -500)][i]
                    with xf(c, ax + pos[0], 720 + pos[1], s=k):
                        draw_text(c, "?", 0, 30, font(90, "bold"), paint(WHITE), "center")
            if t >= t_ag - 0.2:
                k = out_back(prog(t, t_ag - 0.2, 0.5))
                P.logo(c, 1260, 470, 360 * k, t=t * 3) if k > 0.05 else None
            return
        if t < t_low:
            k = ease_io(prog(t, t_in, 0.9))
            with xf(c, 960, 470, s=1 + 2.2 * k), xf(c, -960, -470):
                P.house(c, 960, 700, 520)
                P.bust(c, 1420, 700, 200, "agent")
                c.drawCircle(960, 620, 70, paint(RED, 1, stroke=10))
                c.drawLine(910, 670, 1010, 570, paint(RED, 1, stroke=10))
            return
        # «низко над полом»: агент сплющивается в пылесос
        k = ease_in(prog(t, t_low, 0.35))
        if k < 1:
            with xf(c, 960, 760, sx=1 + 0.6 * k, sy=1 - 0.85 * k):
                P.bust(c, 0, 0, 420, "agent")
        else:
            K.floor(c, 760, 300, 1620)
            P.vacuum_side(c, 960, 760, 560, led=RED)
            kk = ease_out(prog(t, t_low + 0.4, 0.6))
            P.logo(c, 960, 330, 260, t=t * 3, reveal=kk)
    return draw


def s_wehave(S, sc):
    t_map = S.at("g15", "map")
    t_voice = S.at("g15", "voice")
    t_nine = S.at("g15", "nine")
    t_you = S.at("g16", "you")
    t_almost = S.at("g16", "almost")
    S.cue(t_map, "pop")
    S.cue(t_voice, "pop")
    S.cue(t_nine, "tick")
    S.cue(t_almost - 0.3, "data", dur=1.8)
    S.cue(t_you, "hit")
    v = M.MapView(0, 0, 420)

    def draw(c, t):
        big = ease_io(prog(t, t_almost - 0.4, 0.7))
        for i, (title, tt) in enumerate((("MAP", t_map), ("VOICE", t_voice), ("YOU", t_almost - 0.4))):
            k = ease_out(prog(t, tt, 0.35))
            if k <= 0:
                continue
            x = 160 + i * 560
            if i < 2:
                with layer(c, k * (1 - 0.7 * big)):
                    K.panel(c, x, 260, 480, 420, title, 1.0)
                    if i == 0:
                        vv = M.MapView(x + 240, 480, 400)
                        M.draw_plan(c, vv, a=0.9, labels=0)
                        P.check(c, x + 430, 300, 50, prog(t, tt + 0.2, 0.3))
                    else:
                        K.waveform(c, x + 30, 470, 420, 140, t, tt, seed=3)
                        if t >= t_nine:
                            draw_text(c, "9 / 10", x + 240, 640, font(40, "bold"), paint(RED), "center", tracking=4)
                        P.check(c, x + 430, 300, 50, prog(t, tt + 0.2, 0.3))
        if t >= t_almost - 0.4:
            k = ease_out(prog(t, t_almost - 0.4, 0.35))
            px = lerp(1360, 960, big)
            s = lerp(1.0, 1.35, big)
            with xf(c, px, 470, s=s):
                K.panel(c, -240, -210, 480, 420 + 40 * big, "YOU", k, RED)
                frac = 0.9 * ease_out(prog(t, t_almost, 1.6)) + 0.07 * ease_out(prog(t, t_you, 0.6))
                # силуэт из точек, заполняется снизу
                for yy in range(-160, 170, 12):
                    for xx in range(-100, 104, 12):
                        inside = False
                        if (xx ** 2 + (yy + 120) ** 2) < 34 ** 2:
                            inside = True
                        elif -60 < xx < 60 and -80 < yy < 40:
                            inside = True
                        elif -90 < xx < -60 and -70 < yy < 20 or 60 < xx < 90 and -70 < yy < 20:
                            inside = True
                        elif (-50 < xx < -12 or 12 < xx < 50) and 40 <= yy < 170:
                            inside = True
                        if not inside:
                            continue
                        filled = (170 - yy) / 340 < frac
                        c.drawCircle(xx, yy, 4, paint(RED if filled else DIM, k))
                draw_text(c, f"{int(frac * 100)}%", 0, 240 + 40 * big, font(54, "bold"), paint(RED, k), "center")
    return draw


def s_final(S, sc):
    t_no = S.at("g17", "do")
    t_fin = S.at("g18", "finish")
    t_almost = S.at("g19", "almost")
    S.cue(t_no, "hit")
    S.cue(t_fin, "scan", dur=2.5)
    S.cue(t_fin, "heartbeat", dur=sc.t1 - t_fin)

    def cam(t):
        k = ease_in(prog(t, t_almost - 0.4, 2.2))
        return 1.0 + 1.8 * k, lerp(CX, VAC_STOP + 79, k), lerp(CY, FL - 37, k)
    sc.cam = cam

    def draw(c, t):
        bedroom(c, t, zz=True)
        v = P.vacuum_side(c, VAC_STOP, FL, 220, led=RED, led_a=0.7 + 0.3 * math.sin(t * 3))
        if t >= t_no:
            k = ease_out(prog(t, t_no, 0.35))
            if t < t_fin - 0.2:
                hd = ghost_sit(c, k, a=0.8)
                P.cross(c, hd[0] + 10, hd[1] + 60, 190, prog(t, t_no + 0.12, 0.3))
        if t >= t_fin:
            # сканирующая полоса по кровати
            ph = ((t - t_fin) * 0.6) % 1
            x = lerp(1120, 560, ph)
            c.drawLine(x, FL - 330, x, FL - 100, paint(RED, 0.9, stroke=3))
            c.drawLine(x, FL - 330, x, FL - 100, paint(RED, 0.4, stroke=16, blur=8))
            K.laser(c, v["lidar"][0], v["lidar"][1], x, FL - 220, 0.6, w=1.5, dot=False)
            frac = 0.96 + 0.03 * ease_out(prog(t, t_fin, 3.0))
            K.bar(c, VAC_STOP - 110, FL - 130, 220, 12, frac, RED)
            draw_text(c, f"{int(frac * 100)}%", VAC_STOP, FL - 150, font(24, "bold"), paint(RED), "center")
    return draw


def s_outro(S, sc):
    t_hold = S.at("g21")
    S.cue(sc.t0, "theme_end")
    S.cue(t_hold, "boom", amp=1.0)
    S.cue(t_hold, "cut_silence")

    def draw(c, t):
        if t < t_hold - 0.05:
            k = ease_out(prog(t, sc.t0, 0.6))
            P.logo(c, 960, 430, 380 * k, t=t * 3, reveal=1.0) if k > 0.02 else None
            return
        lt = t - t_hold
        draw_text(c, "HOLD STILL.", 960, 520, font(170, "bold"), paint(WHITE), "center", tracking=10)
        if lt > 1.4:
            draw_text(c, "NEXT FILE: 018", 960, 620, font(22, "bold"), paint(GREY, fade(t, t_hold + 1.4, 0.4)),
                      "center", tracking=8)
        glow_circle(c, 960, 760, 8, RED, blink(t, 0.8, 0.5))
        end = S.duration
        if t > end - 1.2:
            c.drawRect(skia.Rect.MakeWH(W, H), paint(BG, ease_in(prog(t, end - 1.2, 1.1))))
    return draw


# ------------------------------------------------------------------ сборка
def build(S):
    L = S.at
    S.add(L("r2") - 0.05, card(2, "NO LIGHTS"), trans="hard", push=0.02)
    S.add(L("b1") - 0.25, s_laser, push=0.04)
    S.add(L("b5") - 0.2, s_see, push=0.04)
    S.add(L("r3") - 0.05, card(3, "SILENCE"), trans="hard", push=0.02)
    S.add(L("c1") - 0.2, s_mic)
    S.add(L("c2") - 0.2, s_lidarphone, push=0.02)
    S.add(L("c7") - 0.2, s_whisper)
    S.add(L("c10") - 1.0, s_office, push=0.05)
    S.add(L("r4") - 0.05, card(4, "NO NAMES"), trans="hard", push=0.02)
    S.add(L("d1") - 0.2, s_names, push=0.02)
    S.add(L("d3") - 0.2, s_tidy, push=0.02)
    S.add(L("d5") - 0.2, s_newname)
    S.add(L("r5") - 0.05, card(5, "NO APP"), trans="hard", push=0.02)
    S.add(L("e1") - 0.2, s_app)
    S.add(L("e6") - 0.2, s_camera, push=0.02)
    S.add(L("e10") - 0.2, s_sticker)
    S.add(L("r6") - 0.05, card(6, "DO NOT ARGUE"), trans="hard", push=0.02)
    S.add(L("f1") - 0.2, s_speaker)
    S.add(L("f3") - 0.2, s_hacked, push=0.02)
    S.add(L("f7") - 0.2, s_garage, push=0.02)
    S.add(L("r7") - 0.05, card(7, ""), trans="hard", push=0.03)
    S.add(L("g1") - 0.25, s_dust)
    S.add(L("g4") - 0.2, s_collect, push=0.02)
    S.add(L("g6") - 0.2, s_bag, push=0)
    S.add(L("g10") - 0.3, s_agency, trans="hard", push=0.02)
    S.add(L("g15") - 0.25, s_wehave, push=0.02)
    S.add(L("g17") - 0.2, s_final, trans="hard")
    S.add(L("g20") - 0.3, s_outro, trans="fade", push=0.03)
