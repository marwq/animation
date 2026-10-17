"""Сцены ролика. Каждая привязана к репликам из script.py и словам в них.

Строитель сцены получает Stage (S) и саму сцену (sc), регистрирует звуковые метки
и возвращает функцию draw(c, t), рисующую кадр в момент t (секунды от начала ролика).
"""
import math

import skia

import script
from engine import hud
from engine import kit as K
from engine import mapplan as M
from engine import picto as P
from engine.core import (AMBER, BG, CX, CY, DARK, DIM, dashed, GREEN, GREY, H, PAPER, RED, SOFT, W, WHITE, blink,
                         clamp, color, draw_text, ease_in, ease_io, ease_out, fade, font, glow_circle, hash01,
                         layer, lerp, out_back, paint, pop, prog, rrect, spring, text_width, window, wobble, xf)

FL = 770          # линия пола в «спальне»
NOCAP = {"g21"}   # реплики без субтитров (текст уже крупно на экране)
SCAN = M.Scan()   # лидарная съёмка квартиры (общая для нескольких сцен)


# ------------------------------------------------------------------ общие композиции
def bedroom(c, t, sit=0.0, lamp_on=0.0, zz=True, a=1.0, second=False, moon_glow=0.0):
    K.floor(c, FL, 230, 1690, a)
    P.window(c, 800, 330, 170, a=a, glow=moon_glow)
    P.lamp(c, 450, FL, 210, on=lamp_on, a=a)
    return P.bed(c, 840, FL, 560, sit=sit, zz=((t * 0.45) % 1 + 1e-3) if zz else 0, a=a, second=second)


BED_HEAD = (840 - 0.36 * 560, FL - 0.37 * 560)
VAC_STOP = 1262


def ghost_sit(c, k, a=1.0, x=840, y=FL, s=560):
    """Полупрозрачный «призрак» человека, который садится в кровати."""
    hip = (x - 0.08 * s, y - 0.29 * s)
    th = math.radians(lerp(180, 95, ease_out(k)))
    tl = 0.2 * s
    sh = (hip[0] + math.cos(th) * tl, hip[1] - math.sin(th) * tl)
    hd = (hip[0] + math.cos(th) * (tl + 0.085 * s), hip[1] - math.sin(th) * (tl + 0.085 * s))
    c.drawLine(hip[0], hip[1], sh[0], sh[1], paint(WHITE, 0.55 * a, stroke=0.09 * s))
    c.drawCircle(hd[0], hd[1], 0.06 * s, paint(WHITE, 0.55 * a))
    return hd


def lidar_side(c, t, src, x_hit, a=1.0):
    """Лидар сбоку: мигающий луч по горизонтали до препятствия."""
    fl = 0.55 + 0.45 * math.sin(t * 31)
    K.laser(c, src[0], src[1], x_hit, src[1], a * fl, w=2.5)


def card(n, subtitle):
    def build(S, sc):
        S.cue(sc.t0, "boom", amp=1.0 if n == 7 else 0.8)
        S.cue(sc.t0 - 0.6, "riser", dur=0.6)
        S.flash(sc.t0, 0.25, 0.12)

        def draw(c, t):
            hud.rule_card(c, t, sc.t0, n, subtitle)
        return draw
    build.__name__ = f"card{n}"
    return build


# ------------------------------------------------------------------ холодное начало
def s_open(S, sc):
    t_in = S.at("o1", "robot") - 0.25
    t_stop = S.at("o1", "stops") + 0.45
    t_no = S.at("o2")
    S.cue(t_in, "vac_drive", dur=t_stop - t_in)
    S.cue(t_stop, "vac_stop")
    S.cue(t_no, "hit")
    S.cue(0.0, "ambience_start")

    def draw(c, t):
        bedroom(c, t)
        k = ease_out(prog(t, t_in, t_stop - t_in))
        vx = lerp(2050, VAC_STOP, k)
        v = P.vacuum_side(c, vx, FL, 220, led=GREEN, led_a=0.45 + 0.55 * blink(t, 0.9, 0.7))
        if t > t_stop:
            lidar_side(c, t, v["lidar"], 1122, fade(t, t_stop, 0.4))
        if t >= t_no:
            k2 = ease_out(prog(t, t_no, 0.35))
            hd = ghost_sit(c, k2, a=0.8)
            P.cross(c, hd[0] + 10, hd[1] + 60, 190, prog(t, t_no + 0.12, 0.3))
    return draw


def s_light(S, sc):
    t_on = S.at("o3", "turn")
    t_x = S.at("o3", "light")
    S.cue(t_on, "click")
    S.cue(t_x + 0.18, "click")

    def draw(c, t):
        on = 0.0
        if t_on <= t < t_x + 0.18:
            on = 1.0 if hash01(int(t * 24), 3) > 0.3 else 0.25
        K.floor(c, 860, 500, 1420)
        P.lamp(c, 960, 860, 560, on=on)
        P.cross(c, 960, 520, 380, prog(t, t_x + 0.18, 0.3))
    return draw


def s_ask(S, sc):
    t_b = S.at("o4", "ask") - 0.1
    t_x = S.wend("o4", "doing") - 0.05
    S.cue(t_b, "pop")
    S.cue(t_x, "cross")
    words = [(w["w"].upper(), w["t0"]) for w in S.lines["o4"]["words"][3:]]

    def draw(c, t):
        K.floor(c, 900, 200, 1720)
        info = P.bed(c, 1000, 900, 1300, zz=0)
        hx, hy = info["head"]
        P.vacuum_side(c, 1720, 900, 300, led=GREEN, led_a=0.4 + 0.6 * blink(t, 1.3, 0.6))
        txt = "WHAT ARE YOU DOING?"
        K.text_bubble(c, hx + 330, hy - 210, txt, t, t_b, size=40, tail=(-0.38, 1))
        P.cross(c, hx + 330, hy - 210, 200, prog(t, t_x, 0.3))
    return draw


def s_cleaning(S, sc):
    t1 = S.at("o5", "cleaning")
    t2 = S.at("o6", "always")
    S.cue(sc.t0, "vac_idle", dur=sc.t1 - sc.t0)
    S.cue(t1, "pop")
    S.cue(t2, "type", dur=0.4)
    S.glitch(t2, 0.12, 0.4)

    def draw(c, t):
        K.floor(c, 720, 260, 1660)
        v = P.vacuum_side(c, 960, 720, 680, led=GREEN, led_a=0.5 + 0.5 * math.sin(t * 4) ** 2)
        K.particles(c, t, (300, 712), (v["nozzle"][0] - 40, 714), n=46, col=SOFT, speed=0.7, spread=14, size=3)
        k1 = pop(t, t1)
        if k1 > 0:
            with xf(c, 960, 330, s=k1):
                K.label(c, 0, 0, "STATUS:  CLEANING", col=GREEN, size=26, pad=18)
        if t >= t2:
            s = K.typed("SINCE:  ALWAYS", t, t2, 30)
            with xf(c, 960, 400):
                draw_text(c, s, 0, 12, font(30, "bold"), paint(RED), "center", tracking=4)
    return draw


def s_seven(S, sc):
    t_seven = S.at("o7", "seven")
    t_six = S.at("o8", "six")
    t_morn = S.at("o8", "morning")
    t_7 = S.at("o9", "seventh")
    t_col = S.at("o9", "collecting")
    for i in range(7):
        S.cue(t_seven + i * 0.07, "pop", pitch=1 + i * 0.08)
    for i in range(6):
        S.cue(t_six + i * 0.13, "tick")
    S.cue(t_7, "hit")
    S.shake(t_7, 8, 0.3)
    S.cue(t_col, "whoosh", dur=1.2)
    box, gap = 124, 28
    x0 = W / 2 - (7 * box + 6 * gap) / 2
    b7 = (x0 + 6 * (box + gap) + box / 2, 470)

    def cam(t):
        if t < t_col:
            return 1.0 + 0.02 * prog(t, sc.t0, 4), CX, CY
        k = ease_in(prog(t, t_col, 1.6))
        return 1.0 + 2.6 * k, lerp(CX, b7[0], ease_out(prog(t, t_col, 0.6))), lerp(CY, b7[1], ease_out(prog(t, t_col, 0.6)))
    sc.cam = cam

    def draw(c, t):
        if t >= t_morn:
            k = ease_out(prog(t, t_morn, 1.0))
            P.sun(c, x0 + 3 * (box + gap) + box / 2, lerp(330, 250, k), 110, a=k * 0.9, rot=t * 10)
        f = font(58, "bold")
        for i in range(7):
            k = pop(t, t_seven + i * 0.07)
            if k <= 0:
                continue
            x = x0 + i * (box + gap) + box / 2
            with xf(c, x, 470, s=k):
                done = i < 6 and t >= t_six + i * 0.13
                red = i == 6 and t >= t_7
                if red:
                    pulse = 0.75 + 0.25 * math.sin((t - t_7) * 9)
                    c.drawRRect(rrect(-box / 2 - 10, -box / 2 - 10, box + 20, box + 20, 22), paint(RED, 0.5 * pulse, blur=18))
                    c.drawRRect(rrect(-box / 2, -box / 2, box, box, 16), paint(RED))
                elif done:
                    c.drawRRect(rrect(-box / 2, -box / 2, box, box, 16), paint(WHITE))
                else:
                    c.drawRRect(rrect(-box / 2, -box / 2, box, box, 16), paint(WHITE, stroke=5))
                if done:
                    P.check(c, 0, 0, 74, prog(t, t_six + i * 0.13, 0.3), ring=False, col=BG)
                elif red and t >= t_col:
                    for j in range(26):
                        ph = (t * 0.9 + hash01(j, 7)) % 1
                        ang = hash01(j, 8) * 6.28 + ph * 3
                        rr = (1 - ph) * 52
                        c.drawCircle(math.cos(ang) * rr, math.sin(ang) * rr, 2.5, paint(WHITE, ph))
                else:
                    draw_text(c, str(i + 1), 0, 21, f, paint(BG if done or red else WHITE), "center")
    return draw


def s_title(S, sc):
    S.cue(sc.t0, "boom", amp=0.9)
    S.cue(sc.t0 + 0.7, "hit")
    S.cue(sc.t0, "theme")
    S.flash(sc.t0, 0.3, 0.15)

    def draw(c, t):
        hud.title_card(c, t, sc.t0, "IF YOUR ROBOT VACUUM EVER STOPS NEXT TO YOUR BED", "DO NOT GET UP",
                       script.FILE_NO, script.AGENCY,
                       lambda c, x, y, s, lt: P.logo(c, x, y, s, t=lt * 4) if s > 1 else None)
    return draw


# ------------------------------------------------------------------ вступление
def s_exhibit(S, sc):
    t_year = S.at("i1", "2002")
    S.cue(sc.t0 + 0.05, "shutter")
    S.cue(t_year, "type", dur=0.4)
    S.cue(t_year + 0.6, "type", dur=0.6)

    def inner(c):
        for r in range(9):
            for k in range(12):
                c.drawCircle(-250 + k * 46 + (r % 2) * 23, -190 + r * 46, 3, paint(PAPER, 0.18))
        P.vacuum_top(c, 0, 10, 230, rot=-25 + math.sin(sc_t[0] * 0.8) * 4, turret=sc_t[0] * 60,
                     brush=sc_t[0] * 2, col=(222, 212, 192), led_a=0.6)

    sc_t = [0.0]

    def draw(c, t):
        sc_t[0] = t
        K.exhibit(c, 700, 470, 520, 420, t, sc.t0, "EXHIBIT A",
                  [("UNIT: FIRST GENERATION", sc.t0 + 0.6, SOFT),
                   ("ON SALE: 2002", t_year, WHITE),
                   ("STATUS: STILL CLEANING", t_year + 0.6, RED)], inner)
    return draw


def s_everywhere(S, sc):
    v = M.MapView(960, 480, 1080)
    S.cue(sc.t0, "vac_drive", dur=sc.t1 - sc.t0)
    dur = sc.t1 - sc.t0

    def draw(c, t):
        M.draw_plan(c, v, a=0.9, labels=0.6, fill_rooms=(DARK, 1.0))
        tt = prog(t, sc.t0, dur) * SCAN.duration * 0.55
        pts = [v.p(*SCAN.pos(u)) for u in [tt * k / 80 for k in range(81)]]
        p = skia.Path()
        p.moveTo(*pts[0])
        for q in pts[1:]:
            p.lineTo(*q)
        c.drawPath(p, paint(WHITE, 0.12, stroke=6 * v.k))
        c.drawPath(p, paint(WHITE, 0.55, stroke=2))
        x, y = v.p(*SCAN.pos(tt))
        P.vacuum_top(c, x, y, 5.5 * v.k, rot=SCAN.heading(tt), turret=t * 400, brush=t * 3)
    return draw


def s_underbed(S, sc):
    S.cue(sc.t0, "whoosh", dur=0.4)

    def draw(c, t):
        K.floor(c, 820, 150, 1770)
        P.bed(c, 900, 820, 1000, zz=((t * 0.45) % 1 + 1e-3))
        c.drawRect(skia.Rect.MakeLTRB(450, 726, 1350, 816), paint(BG, 0.5))
        x = lerp(1900, 1010, ease_out(prog(t, sc.t0, 0.75)))
        P.vacuum_side(c, x, 820, 240, led_a=0.5 + 0.5 * blink(t, 1.2))
    return draw


def s_sofa(S, sc):
    S.cue(sc.t0, "whoosh", dur=0.4)

    def draw(c, t):
        x = lerp(900, 1500, ease_out(prog(t, sc.t0 + 0.1, 0.8)))
        P.vacuum_side(c, x, 760, 210, led_a=1.0)
        K.floor(c, 800, 250, 1670)
        P.sofa(c, 960, 800, 900)
    return draw


def s_feet(S, sc):
    S.cue(sc.t0 + 0.1, "whoosh", dur=0.6)

    def draw(c, t):
        x = lerp(-250, 2150, ease_io(prog(t, sc.t0 + 0.05, 1.1)))
        P.vacuum_side(c, x, 880, 230)
        P.person_front(c, 960, 880, 1500, legs=(13, 13), arms=(10, 10))
        K.floor(c, 882, 100, 1820, 0.5)
    return draw


def s_angle(S, sc):
    t0 = S.at("i6", "angle") - 0.3
    S.cue(t0, "scan", dur=0.8)

    def draw(c, t):
        K.floor(c, 790, 250, 1670)
        P.person_front(c, 700, 790, 520)
        v = P.vacuum_side(c, 1240, 790, 200, lens=True, led_a=0.8)
        k = ease_out(prog(t, t0, 0.8))
        if k > 0:
            hx, hy = 700, 790 - 0.935 * 520
            sx, sy = v["led"][0], v["led"][1] - 10
            ex, ey = lerp(sx, hx + 40, k), lerp(sy, hy, k)
            c.drawLine(sx, sy, ex, ey, dashed(paint(RED, 0.9, stroke=3), 12, 10, -t * 60))
            P.eye(c, 1240, 590, 110, open_=k, look=(-0.6, -0.4), iris=RED)
            K.label(c, 1240, 500, "VIEW HEIGHT: 9 CM", col=SOFT, a=k, size=18)
    return draw


def s_pov(S, sc):
    S.cue(sc.t0, "hit")

    def draw(c, t):
        lt = t - sc.t0
        with xf(c, CX, CY, r=-5 + lt * 0.8, s=1.0 + lt * 0.03):
            with xf(c, -CX, -CY):
                vp = (960, 330)
                p = paint(SOFT, 0.5, stroke=2)
                for k in range(-14, 15):
                    c.drawLine(vp[0], vp[1], vp[0] + k * 260, 1400, p)
                for k in range(1, 16):
                    y = vp[1] + 18 * (1.32 ** k)
                    if y < 1300:
                        c.drawLine(-400, y, 2300, y, paint(SOFT, 0.15 + 0.03 * k, stroke=2))
                # ноги, уходящие вверх, и ножка стола
                for x0, w in ((470, 150), (700, 140)):
                    c.drawRRect(rrect(x0, -300, w, 920, w / 2), paint(WHITE))
                    c.drawRRect(rrect(x0 - 30, 560, w + 90, 90, 40), paint(WHITE))
                c.drawRect(skia.Rect.MakeLTRB(1460, -200, 1530, 520), paint(WHITE))
                c.drawRect(skia.Rect.MakeLTRB(1700, -200, 1760, 470), paint(WHITE, 0.8))
        # видоискатель
        f = font(20, "bold")
        c.drawRRect(rrect(130, 140, 380, 44, 8), paint(BG, 0.85))
        draw_text(c, "CAM 01  //  FLOOR LEVEL", 150, 170, f, paint(WHITE), tracking=3)
        c.drawRRect(rrect(1680, 140, 110, 44, 8), paint(BG, 0.85))
        c.drawCircle(1700, 162, 9, paint(RED, blink(t, 1.5)))
        draw_text(c, "REC", 1720, 170, f, paint(WHITE), tracking=3)
        c.drawLine(CX - 30, CY, CX + 30, CY, paint(WHITE, 0.6, stroke=2))
        c.drawLine(CX, CY - 30, CX, CY + 30, paint(WHITE, 0.6, stroke=2))
    return draw


def s_map(S, sc):
    v = M.MapView(960, 470, 1180)
    t0 = S.at("i8")
    t_end = S.end("i9") - 0.3
    speed = SCAN.duration / (t_end - t0)
    t_wall = S.at("i9", "wall")
    t_door = S.at("i9", "door")
    t_place = S.at("i10", "place")
    t_long = S.at("i10", "long")
    S.cue(t0, "scan", dur=t_end - t0)
    S.cue(t_wall, "tick")
    S.cue(t_door, "tick")
    for i in range(len(M.HEAT)):
        S.cue(t_place + i * 0.22, "ping", pitch=0.8 + i * 0.1)
    S.cue(t_long, "hit")

    def draw(c, t):
        tt = (t - t0) * speed
        M.draw_scan(c, v, SCAN, tt, rays=tt < SCAN.duration)
        if t >= t_wall:
            M.draw_plan(c, v, a=ease_out(prog(t, t_wall, 0.4)), doors=0, furniture=0)
        if t >= t_door:
            kd = ease_out(prog(t, t_door, 0.4))
            M.draw_plan(c, v, a=kd, walls=0, furniture=0)
        for i, (hx, hy, hw) in enumerate(M.HEAT):
            k = ease_out(prog(t, t_place + i * 0.22, 0.5))
            if k > 0:
                boost = 1.0 + (0.6 if (i == 0 and t > t_long) else 0)
                x, y = v.p(hx, hy)
                r = (2.2 + 2.6 * hw) * v.k * boost
                pul = 0.75 + 0.25 * math.sin(t * 5 + i)
                c.drawCircle(x, y, r * 1.7, paint(RED, 0.25 * k * pul, blur=r * 0.9))
                c.drawCircle(x, y, r * 0.5, paint(RED, 0.8 * k * pul, blur=r * 0.25))
        if tt < SCAN.duration + 0.5:
            x, y = v.p(*SCAN.pos(tt))
            P.vacuum_top(c, x, y, 4.2 * v.k, rot=SCAN.heading(tt), turret=t * 500, brush=t * 3)
        else:
            x, y = v.p(*M.DOCK)
            P.vacuum_top(c, x, y, 4.2 * v.k, rot=180, led=GREEN)
    return draw


def s_shared(S, sc):
    v = M.MapView(520, 470, 560)
    t_sh = S.at("i11", "shared")
    t_cons = S.at("i12")
    t_click = S.at("i13", "clicked")
    t_alw = S.at("i13", "always")
    S.cue(S.at("i11", "2017"), "type", dur=0.4)
    S.cue(t_sh, "whoosh", dur=0.8)
    S.cue(t_cons, "pop")
    S.cue(t_click + 0.05, "click")
    for i in range(7):
        S.cue(t_alw + 0.25 + i * 0.16, "click", pitch=1 + i * 0.05)
    blds = [(1350, 380, "CO. A"), (1560, 520, "CO. B"), (1350, 660, "CO. C")]

    def draw(c, t):
        dim = 1 - 0.65 * ease_out(prog(t, t_cons, 0.3))
        with layer(c, dim):
            M.draw_plan(c, v, a=0.95, labels=0.0)
            K.label(c, 520, 160, "HOME_MAP.DAT", col=SOFT, size=20)
            y17 = S.at("i11", "2017")
            if t >= y17:
                K.label(c, 520, 790, "2017", col=RED, size=26, a=fade(t, y17))
            for i, (bx, by, name) in enumerate(blds):
                k = pop(t, t_sh + i * 0.15)
                if k > 0:
                    with xf(c, bx, by + 70, s=k):
                        P.building(c, 0, 0, 140, label=name)
                    sx, sy = 820, 470
                    ex, ey = bx - 60, by
                    c.drawLine(sx, sy, ex, ey, dashed(paint(SOFT, 0.7 * k, stroke=3), 10, 10, -t * 50))
                    for j in range(3):
                        ph = (t * 0.7 + j / 3 + i * 0.1) % 1
                        c.drawRect(skia.Rect.MakeXYWH(lerp(sx, ex, ph) - 7, lerp(sy, ey, ph) - 7, 14, 14),
                                   paint(WHITE, k * math.sin(ph * math.pi)))
        # окна согласия
        n_stack = 1 + int(clamp((t - t_alw - 0.25) / 0.16, 0, 7)) if t >= t_alw + 0.25 else 1
        for j in range(n_stack - 1, -1, -1):
            off = j * 34
            t_open = t_cons if j == 0 else t_alw + 0.25 + (j - 1) * 0.16
            press = t_click + 0.05 if j == 0 else t_open + 0.08
            yes = K.dialog(c, 960 + off, 470 - off * 0.6, 760, 300, "SHARE MAP DATA?",
                           "We may share your home map with our partners.", t, t_open, yes_press=press)
            if j == 0 and yes and t < t_alw:
                k = ease_io(prog(t, t_click - 0.6, 0.6))
                K.cursor(c, lerp(1500, yes[0], k), lerp(800, yes[1], k), press=1.0 if t_click < t < t_click + 0.15 else 0)
    return draw


def s_bankrupt(S, sc):
    t_b = S.at("i14", "bankrupt")
    t_rob = S.at("i15")
    S.cue(t_b, "stamp")
    S.shake(t_b, 14, 0.4)
    S.cue(t_rob, "vac_drive", dur=sc.t1 - t_rob)

    def cam(t):
        k = ease_io(prog(t, t_rob - 0.2, 1.4))
        return 1.0, CX, lerp(CY, CY + 440, k)
    sc.cam = cam

    def draw(c, t):
        P.building(c, 960, 640, 440, label="ROBOT CO.")
        # падающий график
        k = ease_out(prog(t, sc.t0 + 0.2, 1.8))
        pts = [(560, 250), (660, 230), (760, 280), (860, 300), (960, 380), (1060, 360), (1160, 470), (1300, 600)]
        n = 1 + int(k * (len(pts) - 1))
        p = skia.Path()
        p.moveTo(*pts[0])
        for q in pts[1:n]:
            p.lineTo(*q)
        c.drawPath(p, paint(RED, 0.4, stroke=14, blur=6))
        c.drawPath(p, paint(RED, 1, stroke=6))
        K.stamp(c, 960, 430, "BANKRUPT", t, t_b, rot=-11, size=110, sub="2025")
        K.floor(c, 1180, 100, 1820)
        for i in range(5):
            x = (300 + i * 380 + (t - t_rob) * 120) % 2100 - 150
            P.vacuum_side(c, x, 1180, 200, led=GREEN, led_a=0.6 + 0.4 * blink(t + i * 0.3, 1))
            K.particles(c, t, (x - 300, 1176), (x + 20, 1178), n=10, spread=6, size=2.2, seed=i * 5, speed=1.2)
    return draw


# ------------------------------------------------------------------ правило 1
def s_standup(S, sc):
    t_up = S.at("a1", "stand")
    t_no = S.at("a1", "do")
    S.cue(t_up, "creak", dur=0.8)
    S.cue(t_no, "hit")
    S.flash(t_no, 0.12, 0.15, (255, 40, 40))
    S.shake(t_no, 10, 0.3)

    def draw(c, t):
        if t < t_no:
            sit = 0.85 * ease_io(prog(t, t_up - 0.3, 1.0))
        else:
            sit = 0.85 * (1 - spring(t - t_no, 1.6, 7))
            sit = max(0.0, sit)
        bedroom(c, t, sit=sit, zz=t > t_no + 1.0)
        aware = t_up < t < t_no + 0.6
        P.vacuum_side(c, VAC_STOP, FL, 220, led=RED if aware else GREEN, led_a=1.0 if aware else 0.6)
        if t >= t_no:
            P.cross(c, 1000, 330, 160, prog(t, t_no, 0.25))
    return draw


def s_avoid(S, sc):
    t_cab = S.at("a3", "cables")
    t_sock = S.at("a3", "socks")
    t_poo = S.at("a3", "mistakes")
    FY = 700
    obs = [(540, t_cab, "CABLE \u2022 AVOID"), (960, t_sock, "SOCK \u2022 AVOID"), (1380, t_poo, "PET WASTE \u2022 AVOID")]
    keys = [(sc.t0, 60), (t_cab + 0.7, 520), (t_sock + 0.7, 940), (t_poo + 0.75, 1360), (sc.t1, 1900)]
    S.cue(sc.t0, "vac_drive", dur=sc.t1 - sc.t0)
    for x, tt, _ in obs:
        S.cue(tt, "pop")
        S.cue(tt + 0.45, "scanbeep")

    def vx(t):
        for (ta, xa), (tb, xb) in zip(keys, keys[1:]):
            if t <= tb:
                return lerp(xa, xb, ease_io(prog(t, ta, tb - ta)))
        return keys[-1][1]

    def draw(c, t):
        K.header(c, t, sc.t0, "OBSTACLE AVOIDANCE  //  ON-BOARD CAMERA", y=200)
        K.floor(c, FY, 80, 1840)
        x = vx(t)
        depth = 0.0
        for ox, tt, _ in obs:
            if t > tt:
                depth = max(depth, clamp(1 - abs(x - ox) / 260))
        depth = ease_io(depth)

        def vac():
            with xf(c, x, FY - 60 * depth, s=1 - 0.22 * depth):
                v = P.vacuum_side(c, 0, 0, 330, led=GREEN)
                lidar_side(c, t, (v["lidar"][0], v["lidar"][1]), 240, 0.6)
        if depth > 0.02:
            vac()
        for ox, tt, lab in obs:
            k = pop(t, tt)
            if k <= 0:
                continue
            with xf(c, ox, FY, s=k):
                if "CABLE" in lab:
                    P.cable(c, 0, 0, 210)
                elif "SOCK" in lab:
                    P.sock(c, 0, 0, 200)
                else:
                    P.poop(c, 0, 0, 160)
                    for j in range(3):
                        ang = t * 5 + j * 2.1
                        c.drawCircle(math.cos(ang) * 70, -190 + math.sin(ang * 1.3) * 22, 5, paint(SOFT))
            kb = ease_out(prog(t, tt + 0.45, 0.3))
            if kb > 0:
                K.cv_box(c, ox - 140, FY - 200, 280, 215, lab, kb, GREEN)
        if depth <= 0.02:
            vac()
    return draw


def s_poop(S, sc):
    t_new = S.at("a4", "new")
    words = S.lines["a5"]["words"]
    t_pet = S.at("a5", "pet")
    t_end = S.end("a5") + 0.1
    t_agent = S.at("a6")
    S.cue(sc.t0, "paper")
    S.cue(t_new, "pop")
    for i in range(4):
        S.cue(t_end + 0.15 + i * 0.18, "tick", pitch=1.0 + i * 0.12)
    S.cue(t_agent, "whoosh", dur=0.4)
    title = ["PET", "OWNER", "OFFICIAL", "PROMISE"]
    tw_times = [S.at("a5", w) for w in title]

    def draw(c, t):
        k = ease_out(prog(t, sc.t0, 0.5))
        with xf(c, 960, 460 + (1 - k) * 700, r=-2 * k), xf(c, -960, -460):
            c.drawRect(skia.Rect.MakeXYWH(560, 140, 800, 640), paint(PAPER))
            c.drawRect(skia.Rect.MakeXYWH(580, 160, 760, 600), paint((120, 110, 90), stroke=3))
            draw_text(c, "OFFICIAL GUARANTEE", 960, 225, font(26, "bold"), paint((80, 70, 55)), "center", tracking=6)
            # заголовок по словам
            f = font(38, "bold")
            xx = 960 - text_width(" ".join(title), f, 2) / 2
            for wd, wt in zip(title, tw_times):
                if t >= wt:
                    al = ease_out(prog(t, wt, 0.15))
                    first = wd[0]
                    rest = wd[1:]
                    hl = ease_out(prog(t, t_end + 0.15 + title.index(wd) * 0.18, 0.2))
                    draw_text(c, first, xx, 310, f, paint(RED if hl > 0.5 else (40, 36, 30), al), tracking=2)
                    draw_text(c, rest, xx + text_width(first, f, 2) + 2, 310, f, paint((40, 36, 30), al * (1 - 0.6 * hl)), tracking=2)
                xx += text_width(wd + " ", f, 2)
            for i in range(5):
                c.drawRect(skia.Rect.MakeXYWH(640, 370 + i * 38, 520 - (i % 2) * 120, 12), paint((150, 140, 120)))
            if t >= t_new:
                kk = pop(t, t_new)
                with xf(c, 1180, 470, s=kk, r=-8):
                    K.label(c, 0, 0, "FREE NEW ROBOT", bg=RED, size=24, pad=16)
            P.vacuum_side(c, 760, 690, 180, col=(60, 55, 45))
            P.poop(c, 900, 690, 60, col=(120, 90, 60))
            P.cross(c, 900, 655, 90, 1.0, col=(60, 55, 45))
            c.drawCircle(1240, 660, 62, paint(RED, 0.85))
            c.drawCircle(1240, 660, 50, paint(PAPER, stroke=3))
        # P.O.O.P.
        if t >= t_end + 0.15:
            f2 = font(130, "bold")
            letters = "P.O.O.P."
            ka = ease_out(prog(t, t_end + 0.15, 0.6))
            draw_text(c, letters[:2 * int(clamp((t - t_end - 0.15) / 0.18 + 1, 0, 4))], 960, 900 - 40 * ka, f2,
                      paint(RED), "center", tracking=12)
        if t >= t_agent:
            ka = ease_out(prog(t, t_agent, 0.4))
            P.bust(c, 1950 - 300 * ka, 860, 260, "agent")
    return draw


def s_checklist(S, sc):
    t_all = S.at("a7", "all")
    t_you = S.at("a7", "you")
    items = ["CABLES", "SOCKS", "PET WASTE", "YOU"]
    for i in range(3):
        S.cue(t_all + i * 0.2, "tick")
    S.cue(t_you, "hit")
    S.shake(t_you, 8, 0.3)

    def draw(c, t):
        K.panel(c, 560, 170, 800, 600, "OBSTACLE AVOIDANCE • TRAINED", ease_out(prog(t, sc.t0, 0.3)))
        f = font(46, "bold")
        for i, it in enumerate(items):
            k = ease_out(prog(t, sc.t0 + 0.15 + i * 0.1, 0.3))
            y = 300 + i * 120
            red = i == 3 and t >= t_you
            with layer(c, k):
                box = rrect(620, y - 40, 72, 72, 12)
                if red:
                    c.drawRRect(box, paint(RED, 0.4 + 0.6 * blink(t, 3), stroke=5))
                    c.drawRRect(rrect(600, y - 58, 720, 108, 16), paint(RED, 0.15))
                else:
                    c.drawRRect(box, paint(WHITE, stroke=5))
                if i < 3 and t >= t_all + i * 0.2:
                    P.check(c, 656, y - 4, 76, prog(t, t_all + i * 0.2, 0.3), ring=False, col=GREEN)
                draw_text(c, it, 730, y + 16, f, paint(RED if red else WHITE), tracking=4)
                if i == 3:
                    P.bust(c, 1230, y + 46, 100, col=RED if red else WHITE)
    return draw


def s_korea(S, sc):
    t_nap = S.at("a8", "nap")
    t_vac = S.at("a9")
    t_hair = S.at("a10", "hair")
    t_let = S.at("a11", "let")
    t_fire = S.at("a12")
    t_dust = S.at("a13", "dust")
    t_box = S.at("a13", "officials")
    S.cue(sc.t0, "type", dur=1.0)
    S.cue(t_vac, "vac_drive", dur=t_hair - t_vac)
    S.cue(t_hair, "suck", dur=t_fire - t_hair + 0.6)
    S.cue(t_let, "hit")
    S.shake(t_let, 10, 0.6)
    S.cue(t_fire, "siren", dur=sc.t1 - t_fire)
    S.cue(t_box, "scanbeep")
    S.cue(t_dust, "hit")
    head = (560, 712)

    def draw(c, t):
        K.header(c, t, sc.t0, "CASE FILE  //  CHANGWON, SOUTH KOREA  //  2015")
        K.floor(c, 760, 120, 1800)
        # волосы на полу
        stuck = t >= t_hair
        tug = clamp((t - t_hair) / 0.6) if stuck else 0
        vx = lerp(-260, 300, ease_out(prog(t, t_vac, t_hair - t_vac)))
        if t >= t_let:
            vx += math.sin(t * 50) * 3
        for j in range(9):
            sx, sy = head[0] - 30, head[1] + (j - 4) * 4
            if stuck:
                ex, ey = lerp(head[0] - 150 - j * 10, vx + 116, tug), lerp(756, 752, tug)
                cx1 = lerp(sx - 60, (sx + ex) / 2, tug)
                p = skia.Path()
                p.moveTo(sx, sy)
                p.quadTo(cx1, sy + 30 - 20 * tug + math.sin(t * 40 + j) * 4 * tug, ex, ey)
            else:
                p = skia.Path()
                p.moveTo(sx, sy)
                p.quadTo(sx - 70, sy + 40, head[0] - 150 - j * 10, 756)
            c.drawPath(p, paint(SOFT, stroke=4))
        # лежащая женщина (лицом вверх, голова слева)
        P.person_lying(c, head[0] - 46, 760, 540)
        if t >= t_nap:
            ph = (t * 0.45) % 1
            draw_text(c, "z", head[0] + 30 + ph * 50, head[1] - 50 - ph * 70, font(30 + ph * 20, "bold"),
                      paint(SOFT, math.sin(ph * math.pi)))
        if t >= t_vac:
            P.vacuum_side(c, vx, 760, 240, led=RED if stuck else GREEN, led_a=1)
        if t >= t_let:
            r = ((t - t_let) * 260) % 260
            c.drawCircle(vx + 60, 700, r, paint(RED, (1 - r / 260) * 0.8, stroke=4))
        if t >= t_fire:
            k = ease_out(prog(t, t_fire, 1.0))
            P.fire_truck(c, lerp(2200, 1480, k), 760, 420, t=t)
            # мигалки на весь кадр
            on = (t * 4) % 1 < 0.5
            c.drawRect(skia.Rect.MakeWH(W, H), paint(RED if on else (60, 120, 255), 0.045))
        kb = ease_out(prog(t, t_box, 0.3))
        if kb > 0:
            lab = "DUST • 97%" if t >= t_dust - 0.1 else "ANALYZING…"
            K.cv_box(c, head[0] - 300, 690, 280, 90, lab, kb, RED)
    return draw


def s_zone(S, sc):
    t_keep = S.at("a14", "keep")
    S.cue(t_keep, "pop")

    def draw(c, t):
        # опасный пол — штриховка
        k = ease_out(prog(t, sc.t0, 0.5))
        c.save()
        c.clipRect(skia.Rect.MakeLTRB(230, FL, 1690, FL + 90))
        for i in range(-10, 60):
            x = 230 + i * 34 + (t * 30) % 34
            c.drawLine(x, FL + 90, x + 90, FL, paint(RED, 0.5 * k, stroke=12))
        c.restore()
        bedroom(c, t, zz=True)
        K.label(c, 1500, FL + 45, "FLOOR", bg=RED, size=24, a=k)
        P.vacuum_side(c, VAC_STOP + 120, FL, 200, led=RED, led_a=0.8)
        kk = pop(t, t_keep)
        if kk > 0:
            with xf(c, 1060, 420, s=kk):
                P.check(c, 0, 0, 110, prog(t, t_keep, 0.4))
            K.label(c, 1060, 515, "STAY HERE", col=GREEN, size=22, a=clamp(kk))
    return draw


# ------------------------------------------------------------------ сборка
def build(S):
    L = S.at
    S.add(0.0, s_open, trans="cut", push=0.06)
    S.add(L("o3") - 0.2, s_light)
    S.add(L("o4") - 0.15, s_ask)
    S.add(L("o5") - 0.2, s_cleaning)
    S.add(L("o7") - 0.25, s_seven, push=0)
    S.add(S.end("o9") + 0.55, s_title, trans="hard", captions=False, push=0.03)
    S.add(L("i1") - 0.2, s_exhibit, trans="hard")
    S.add(L("i2") - 0.15, s_everywhere)
    S.add(L("i3") - 0.08, s_underbed, trans="cut")
    S.add(L("i4") - 0.05, s_sofa, trans="cut")
    S.add(L("i5") - 0.05, s_feet, trans="cut")
    S.add(L("i6") - 0.2, s_angle)
    S.add(L("i7") - 0.08, s_pov, trans="hard")
    S.add(L("i8") - 0.3, s_map, push=0.05)
    S.add(L("i11") - 0.2, s_shared, push=0.02)
    S.add(L("i14") - 0.2, s_bankrupt, push=0)
    S.add(L("r1") - 0.05, card(1, "STAY IN BED"), trans="hard", push=0.02)
    S.add(L("a1") - 0.25, s_standup)
    S.add(L("a2") - 0.2, s_avoid, push=0.02)
    S.add(L("a4") - 0.2, s_poop, push=0.02)
    S.add(L("a7") - 0.2, s_checklist)
    S.add(L("a8") - 0.25, s_korea, push=0.03)
    S.add(L("a14") - 0.2, s_zone)
    import os
    if os.path.exists(os.path.join(os.path.dirname(os.path.abspath(__file__)), "scenes2.py")):
        import scenes2
        scenes2.build(S)
