"""Сцены второго ролика: правила 4–7 и финал."""
import math

import skia

from engine import house as HS
from engine import kit as K
from engine import picto as P
from engine import picto2 as Q
from engine.core import (AMBER, BG, BLUE, CX, CY, DARK, DIM, GREEN, GREY, H, PAPER, RED, SOFT, W, WHITE, blink,
                         clamp, color, dashed, draw_text, ease_in, ease_io, ease_out, fade, font, glow_circle,
                         hash01, layer, lerp, out_back, paint, pop, prog, rrect, spring, text_width, window, xf)

from . import script
from .scenes import (GROUND, HERO_S, POSES, UPPER, bedroom_close, burglar_in, card, chat, hero_close,
                     phone_screen, sound_rings, walk_x)


def closet_inside(t, coats=1.0, box=1.0, shelf_eyes=False, beam=None):
    def inner(c):
        x, y, s = 960, 860, 620
        # штанга и вешалки с пальто
        c.drawLine(x - 0.33 * s, y - 0.66 * s, x + 0.33 * s, y - 0.66 * s, paint(GREY, stroke=6))
        for k in range(4):
            hx = x - 0.24 * s + k * 0.16 * s
            sway = math.sin(t * 1.5 + k) * 2
            c.drawPath(P.path_from([(hx - 50 + sway, y - 0.6 * s), (hx + sway, y - 0.65 * s), (hx + 50 + sway, y - 0.6 * s)]),
                       paint(SOFT, coats, stroke=5))
            c.drawRRect(rrect(hx - 46 + sway, y - 0.6 * s, 92, 0.38 * s, 18), paint((70, 72, 78), coats))
        # обувь и коробка
        for k in range(3):
            c.drawRRect(rrect(x - 0.3 * s + k * 90, y - 40, 70, 30, 12), paint(GREY, coats))
        c.drawRect(skia.Rect.MakeXYWH(x + 0.1 * s, y - 130, 150, 110), paint((150, 120, 80), box))
        c.drawLine(x + 0.1 * s, y - 100, x + 0.1 * s + 150, y - 100, paint(BG, box, stroke=3))
        # верхняя полка — темнота
        c.drawRect(skia.Rect.MakeLTRB(x - 0.355 * s, y - s + 14, x + 0.355 * s, y - 0.76 * s), paint((5, 5, 6)))
        if shelf_eyes:
            Q.eyes_peek(c, x + 60, y - 0.87 * s, 18)
        if beam is not None:
            bx, by = beam
            c.drawCircle(bx, by, 130, paint((255, 240, 200), 0.25, blur=40))
    return inner


# ------------------------------------------------------------------ правило 4
def s_films(S, sc):
    t_look = S.at("d2", "looks")
    S.cue(t_look, "hit")

    def draw(c, t):
        Q.closet(c, 800, 820, 520)
        # хлопушка
        with xf(c, 1360, 360, r=-8):
            c.drawRect(skia.Rect.MakeXYWH(-160, -40, 320, 200), paint(WHITE))
            ang = -20 * (1 - ease_out(prog(t, sc.t0 + 0.3, 0.3)))
            with xf(c, -160, -40, r=ang):
                c.drawRect(skia.Rect.MakeXYWH(0, -50, 320, 50), paint(WHITE))
                for k in range(5):
                    c.drawPath(P.path_from([(20 + k * 64, -50), (52 + k * 64, -50), (32 + k * 64, 0), (0 + k * 64, 0)], True),
                               paint(BG))
            draw_text(c, "HIDE HERE", 0, 80, font(36, "bold"), paint(BG), "center", tracking=3)
        if t >= t_look:
            k = ease_out(prog(t, t_look, 0.3))
            Q.burglar(c, 1360, 820, 330, None, facing=-1, torch=k, torch_ang=6, torch_len=1.7)
            K.cv_box(c, 590, 290, 420, 540, "CHECKED FIRST", k, RED)
    return draw


def s_closetcheck(S, sc):
    t_check = S.at("d3", "check")
    t_coats = S.at("d4b", "coats")
    t_dark = S.at("d4c", "dark")
    t_yet = S.at("d4c", "yet")
    S.cue(t_check, "creak", dur=1.4)
    S.cue(t_dark, "drop")
    S.glitch(t_yet + 0.1, 0.07, 0.6)

    def draw(c, t):
        o = ease_io(prog(t, t_check, 1.6))
        eyes = t_yet + 0.1 <= t < t_yet + 0.17
        Q.closet(c, 960, 860, 620, open_=o, inside=closet_inside(t, shelf_eyes=eyes,
                                                                    beam=(960, 520) if o > 0.3 else None))
        for tt, lab, x, y in ((t_coats, "COATS", 760, 360), (S.at("d4b", "shoes"), "SHOES", 760, 860),
                              (S.at("d4b", "box"), "BOX", 1230, 760)):
            if t >= tt:
                K.label(c, x, y - 0 if lab != "SHOES" else y - 70, lab, col=SOFT, size=18, a=fade(t, tt))
        if t >= t_dark:
            k = ease_out(prog(t, t_dark, 0.3))
            c.drawRect(skia.Rect.MakeLTRB(960 - 0.37 * 620, 860 - 620, 960 + 0.37 * 620, 860 - 0.75 * 620),
                       paint(RED, 0.8 * k, stroke=4))
            K.label(c, 1380, 300, "TOP SHELF", bg=RED, size=22, a=k)
    return draw


def s_japan(S, sc):
    t_food = S.at("d5", "food")
    t_not = S.at("d6", "not")
    t_cam = S.at("d7", "cameras")
    t_ph = S.at("d7", "phone")
    t_pic = S.at("d8", "someone")
    S.cue(sc.t0, "type", dur=1.2)
    S.cue(t_cam, "pop")
    S.cue(t_ph, "vibrate")
    S.cue(t_pic, "hit")
    items = ["RICE", "JUICE", "BREAD", "TEA", "SOUP"]

    def draw(c, t):
        K.header(c, t, sc.t0, "CASE FILE  //  KASUYA, FUKUOKA, JAPAN  //  2008")
        if t < t_cam - 0.1:
            K.panel(c, 560, 260, 800, 480, "KITCHEN INVENTORY", ease_out(prog(t, sc.t0, 0.3)))
            for i, it in enumerate(items):
                y = 360 + i * 70
                gone = t >= t_food + 0.3 + i * 0.5
                draw_text(c, it, 620, y, font(34, "bold"), paint(GREY if gone else WHITE), tracking=3)
                if gone:
                    c.drawLine(610, y - 12, 620 + text_width(it, font(34, "bold"), 3) + 10, y - 12, paint(RED, stroke=4))
                    draw_text(c, "− a little", 1000, y, font(24, "regular"), paint(RED), tracking=2)
            return
        # камера и телефон
        k = ease_out(prog(t, t_cam, 0.4))
        with xf(c, 520, 360, s=k):
            c.drawRRect(rrect(-110, -45, 200, 90, 18), paint(WHITE))
            c.drawCircle(70, 0, 34, paint(BG))
            c.drawCircle(70, 0, 18, paint(DIM))
            c.drawLine(-110, 0, -170, 60, paint(WHITE, stroke=12))
            glow_circle(c, -80, -20, 7, RED, blink(t, 1.5))
        if t >= t_ph:
            sr = phone_screen(c, 1250, 460, 400, 700, title="CAMERA 1")
            fr = skia.Rect.MakeXYWH(sr.left() + 20, sr.top() + 120, sr.width() - 40, 300)
            c.drawRect(fr, paint((40, 42, 45)))
            c.save()
            c.clipRect(fr)
            K.floor(c, fr.bottom() - 30, fr.left(), fr.right(), 0.7)
            Q.fridge(c, fr.left() + 70, fr.bottom() - 30, 180, col=(150, 150, 150))
            if t >= t_pic:
                P.person_side(c, fr.left() + 230, fr.bottom() - 30, 200, P.walk_pose(1.2, 0.5), col=(30, 30, 32))
            for i in range(160):
                c.drawCircle(fr.left() + hash01(i, int(t * 12)) * fr.width(), fr.top() + hash01(i, 3, int(t * 12)) * fr.height(),
                             1.3, paint(WHITE, 0.25))
            c.restore()
            draw_text(c, "● REC  14:22:07", fr.left() + 12, fr.top() + 26, font(18, "bold"), paint(RED), tracking=2)
            if t >= t_pic:
                K.cv_box(c, fr.left() + 160, fr.top() + 40, 150, 240, "UNKNOWN", ease_out(prog(t, t_pic, 0.3)), RED)
    return draw


def s_shelf(S, sc):
    t_found = S.at("d9", "found")
    t_shelf = S.at("d9", "shelf")
    t_year = S.at("d10", "year")
    t_mat = S.at("d11", "mattress")
    t_show = S.at("d11", "showers")
    S.cue(S.at("d9", "searched"), "boots", dur=1.6)
    S.cue(t_found, "hit")
    S.cue(t_year, "paper")
    S.cue(t_show, "water", dur=1.2)

    def draw(c, t):
        Q.closet(c, 760, 860, 620, open_=1.0, inside=closet_inside(t, coats=0.6, box=0.6))
        # фигура на верхней полке
        if t >= t_found:
            k = ease_out(prog(t, t_found, 0.4))
            x0, y0 = 760 - 0.35 * 620 + 10, 860 - 0.77 * 620
            if t >= t_mat:
                c.drawRRect(rrect(x0, y0 - 30, 0.7 * 620 - 20, 28, 10), paint(SOFT, k))
            with xf(c, x0 + 40, y0 - 30):
                P.person_lying(c, 0, 0, 330, col=WHITE, a=k)
            c.drawCircle(x0 + 200, y0 - 80, 200, paint((255, 240, 200), 0.15 * k, blur=60))
        if t >= t_year:
            k = ease_out(prog(t, t_year, 0.3))
            K.panel(c, 1180, 300, 480, 300, "DURATION", k)
            days = int(365 * ease_out(prog(t, t_year, 1.4)))
            draw_text(c, f"{days} DAYS", 1420, 480, font(70, "bold"), paint(RED, k), "center", tracking=3)
        if t >= t_show:
            k = ease_out(prog(t, t_show, 0.3))
            with xf(c, 1420, 760, s=k):
                c.drawLine(-40, -80, 40, -80, paint(WHITE, stroke=8))
                c.drawLine(40, -80, 40, -110, paint(WHITE, stroke=8))
                for j in range(9):
                    ph = (t * 2 + j / 9) % 1
                    c.drawCircle(-40 + j * 10, -70 + ph * 90, 3, paint(BLUE, 1 - ph))
    return draw


def s_phrog(S, sc):
    t_w = S.at("d12", "phrogging")
    S.cue(t_w, "stamp")

    def draw(c, t):
        k = ease_out(prog(t, sc.t0, 0.4))
        c.drawRect(skia.Rect.MakeXYWH(460, 250, 1000, 440), paint(PAPER, k))
        draw_text(c, "DICTIONARY  \u2022  NEW ENTRY", 520, 300, font(20, "bold"), paint((110, 100, 80), k), tracking=4)
        if t < t_w:
            draw_text(c, "_" if blink(t, 2) else "", 520, 380, font(80, "bold"), paint(BG, k))
        if t >= t_w:
            draw_text(c, "phrog·ging", 520, 380, font(80, "bold"), paint(BG), tracking=2)
            draw_text(c, "/ˈfrɒɡɪŋ/  noun", 520, 440, font(28, "regular"), paint((90, 80, 60)))
            draw_text(c, "Secretly living in someone else's home", 520, 530, font(32, "regular"), paint(BG))
            draw_text(c, "while they are still living in it.", 520, 580, font(32, "regular"), paint(BG))
    return draw


def s_alone(S, sc):
    t_alone = S.at("d13", "alone")
    t_prob = S.at("d14")
    S.cue(t_prob, "creak", dur=0.8)
    S.glitch(t_prob + 0.2, 0.1, 0.5)

    def draw(c, t):
        hatch = 0.0
        if t >= t_prob:
            hatch = 0.12 * math.sin(clamp((t - t_prob) / 1.2) * math.pi)
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True, hatch=hatch)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        if t >= t_alone:
            n = "1" if t < t_prob else ("1?" if blink(t, 4, 0.7) else "1")
            K.panel(c, 1350, 150, 300, 120, "OCCUPANTS", fade(t, t_alone))
            draw_text(c, n, 1500, 245, font(56, "bold"), paint(RED if t >= t_prob else WHITE), "center")
    return draw


# ------------------------------------------------------------------ правило 5
def s_listen(S, sc):
    t_fs = S.at("e2", "footsteps")
    t_dr = S.at("e2", "drawers")
    t_lap = S.at("e2", "laptop")
    t_go = S.at("e3", "go")
    t_slow = S.at("e3", "slow")
    S.cue(t_fs, "steps", dur=1.4)
    S.cue(t_dr, "drawer")
    S.cue(t_lap, "click")
    S.cue(t_go, "whoosh", dur=0.5)

    def cam(t):
        return 1.25, 960, 640
    sc.cam = cam

    def draw(c, t):
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True, tv_on=0.0)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        bx, walking = walk_x(t, [(sc.t0, 1200), (t_dr - 0.3, 900), (t_lap - 0.2, 820)])
        burglar_in(c, bx, HS.G, P.walk_pose(t * 5, 0.5) if walking else POSES["reach"], facing=-1, torch=1.0, ang=12)
        for tt, lab, x in ((t_fs, "STEPS", 1050), (t_dr, "DRAWER", 900), (t_lap, "LAPTOP", 790)):
            if t >= tt:
                sound_rings(c, x, HS.G - 120, t, tt, SOFT, r=50)
                K.label(c, x, HS.U + 50, lab, col=SOFT, size=16, a=fade(t, tt) * (1 - fade(t, tt + 2.0)))
        if t >= t_go:
            k = prog(t, t_go, 0.6)
            if k < 1:
                Q.laptop(c, lerp(790, bx - 40, k), lerp(HS.G - 140, HS.G - 120, k) - math.sin(k * math.pi) * 60, 60)
        if t >= t_slow:
            K.label(c, 790, HS.G - 210, "IT WAS SLOW ANYWAY", bg=WHITE, size=18, a=fade(t, t_slow))
    return draw


def s_notes(S, sc):
    t_v = S.at("e3b", "voices")
    t_n = S.at("e3b", "names")
    t_h = S.at("e3b", "many")
    t_p = S.at("e3b", "police")
    rows = [("VOICES:", "1, LOW", t_v), ("NAMES:", "NONE", t_n), ("HOW MANY:", "1", t_h)]
    for _, _, tt in rows:
        S.cue(tt, "type", dur=0.5)

    def draw(c, t):
        k = ease_out(prog(t, sc.t0, 0.4))
        with xf(c, 960, 480, r=-2):
            c.drawRect(skia.Rect.MakeXYWH(-360, -280, 720, 560), paint(PAPER, k))
            for i in range(9):
                c.drawLine(-330, -180 + i * 52, 330, -180 + i * 52, paint((160, 150, 130), k, stroke=2))
            draw_text(c, "WHAT I HEARD", -320, -210, font(34, "bold"), paint(BG, k), tracking=3)
            for i, (a_, b_, tt) in enumerate(rows):
                y = -110 + i * 104
                if t >= tt:
                    draw_text(c, a_, -320, y, font(32, "bold"), paint(BG), tracking=2)
                    draw_text(c, K.typed(b_, t, tt + 0.2, 16), 0, y, font(32, "regular"), paint(RED), tracking=2)
        if t >= t_p:
            with xf(c, 1430, 300, s=pop(t, t_p)):
                c.drawPath(P.path_from([(-60, -70), (60, -70), (50, 25), (0, 80), (-50, 25)], True), paint(BLUE))
    return draw


def s_unc(S, sc):
    t_422 = S.at("e4", "four")
    t_alarm = S.at("e5", "alarm")
    S.cue(sc.t0, "type", dur=1.0)
    S.cue(t_alarm, "house_alarm", dur=1.2)

    def draw(c, t):
        K.header(c, t, sc.t0, "UNC CHARLOTTE  //  2012  //  422 BURGLARS IN PRISON")
        for i in range(100):
            r, q = divmod(i, 10)
            x, y = 330 + q * 58, 260 + r * 58
            k = pop(t, t_422 + i * 0.006)
            if k <= 0:
                continue
            away = i < 60 and t >= t_alarm + (i % 10) * 0.02
            with xf(c, x + (18 if away else 0), y, s=k):
                col = DIM if away else SOFT
                P.bust(c, 0, 20, 42, col=col)
                cap = skia.Path()
                cap.addArc(skia.Rect.MakeXYWH(-11, -24, 22, 20), 180, 180)
                cap.close()
                c.drawPath(cap, paint(Q.BEANIE))
                c.drawRect(skia.Rect.MakeXYWH(-11, -11, 22, 4), paint(BG))
                if away:
                    c.drawLine(14, 4, 26, 4, paint(GREY, stroke=2))
        if t >= t_alarm:
            k = pop(t, t_alarm)
            with xf(c, 1260, 330, s=k):
                c.drawRRect(rrect(-80, -60, 160, 120, 16), paint(WHITE))
                glow_circle(c, 0, 0, 26, RED, blink(t, 4))
            draw_text(c, "60%", 1200, 560, font(120, "bold"), paint(RED), tracking=4)
            draw_text(c, "WOULD GO ELSEWHERE", 1204, 620, font(22, "bold"), paint(SOFT), tracking=3)
    return draw


def s_panic(S, sc):
    t_press = S.at("e6", "press")
    t_shout = S.at("e6", "shout")
    t_keys = S.at("e6b", "keys")
    t_press2 = S.at("e6b", "press")
    t_loud = S.at("e6b", "loud")
    S.cue(t_press, "click")
    S.cue(t_press + 0.1, "house_alarm", dur=t_keys - t_press - 0.2)
    S.cue(t_press2, "click")
    S.cue(t_press2 + 0.1, "horn", dur=2.4)

    def draw(c, t):
        if t < t_keys - 0.1:
            on = t >= t_press + 0.1
            HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True,
                    light={r: (0.5 if on and blink(t, 3) else 0) for r in HS.ROOMS})
            Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
            if on:
                for x in (420, 1500):
                    sound_rings(c, x, HS.U - 140, t, t_press, RED, r=110)
                if t >= t_shout:
                    K.label(c, 960, 160, "THE HOUSE IS SHOUTING", bg=RED, size=24, a=fade(t, t_shout))
            with xf(c, 1580, 280, s=pop(t, sc.t0 + 0.2)):
                c.drawRRect(rrect(-80, -60, 160, 120, 12), paint(WHITE))
                c.drawCircle(0, 0, 32 * (0.85 if on else 1), paint(RED))
                draw_text(c, "PANIC", 0, 50, font(16, "bold"), paint(BG), "center", tracking=2)
            return
        K.floor(c, 820, 150, 1770)
        Q.keyfob(c, 520, 520, 260, press=1.0 if t >= t_press2 else 0.0)
        on = t >= t_press2 + 0.1 and blink(t, 2.2, 0.55)
        x = 1250
        # машина: силуэт сбоку
        body = P.path_from([(x - 300, 800), (x - 300, 720), (x - 200, 710), (x - 120, 640), (x + 120, 640), (x + 200, 710),
                            (x + 300, 720), (x + 300, 800)], True)
        c.drawPath(body, paint(WHITE))
        for wx in (-190, 190):
            c.drawCircle(x + wx, 800, 52, paint(BG))
            c.drawCircle(x + wx, 800, 40, paint(WHITE))
        if on:
            glow_circle(c, x + 290, 735, 14, AMBER, 1, spread=4)
            glow_circle(c, x - 290, 735, 14, AMBER, 1, spread=4)
            K.label(c, x, 560, "HONK", bg=AMBER, size=40, a=1)
        if t >= t_loud:
            K.label(c, x, 470, "LOUD ✓   SMART ✗", col=SOFT, size=22, a=fade(t, t_loud))
    return draw


def s_most(S, sc):
    t_leave = S.at("e7", "leave")
    t_most = S.at("e8")
    S.cue(t_leave, "steps", dur=1.2)
    S.cue(t_most, "rewind", dur=1.0)
    S.glitch(t_most, 0.9, 0.35, sound=False)

    def draw(c, t):
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        if t < t_most:
            bx, walking = walk_x(t, [(t_leave - 0.3, 1000), (t_most - 0.1, 1640)])
        else:
            bx, walking = walk_x(t, [(t_most, 1640), (t_most + 0.9, 1000)])
        burglar_in(c, bx, HS.G, P.walk_pose(t * (8 if t < t_most else -14), 0.7) if walking else None, facing=1,
                   torch=1.0, ang=10)
        if t >= t_most:
            draw_text(c, "◀◀ REWIND", 160, 200, font(36, "bold"), paint(WHITE, blink(t, 3)), tracking=4)
    return draw


def s_fridge2(S, sc):
    t_kit = S.at("e10", "kitchen")
    t_fr = S.at("e10", "fridge")
    S.cue(t_kit - 0.6, "steps", dur=1.4)
    S.cue(t_fr, "fridge")

    def cam(t):
        k = ease_io(prog(t, t_fr - 0.3, 1.0))
        return 1.0 + 0.6 * k, lerp(960, 520, k), lerp(CY, 720, k)
    sc.cam = cam

    def draw(c, t):
        o = ease_out(prog(t, t_fr, 0.6))
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True, fridge_open=o)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        bx, walking = walk_x(t, [(sc.t0, 1000), (t_fr - 0.2, 470)])
        burglar_in(c, bx, HS.G, P.walk_pose(t * 6, 0.6) if walking else POSES["reach"], facing=-1, torch=1 - o, ang=10)
    return draw


def s_wv(S, sc):
    t_door = S.at("e12", "door")
    t_bed = S.at("e12", "bed")
    t_called = S.at("e13", "called")
    t_arr = S.at("e14", "arrived")
    t_still = S.at("e14", "still")
    S.cue(sc.t0, "type", dur=1.0)
    S.cue(t_door, "hit")
    S.cue(t_called, "dtmf", key="9")
    S.cue(t_arr, "siren_far", dur=2.5)

    def draw(c, t):
        K.header(c, t, sc.t0, "CASE FILE  //  RED HOUSE, WEST VIRGINIA")
        K.floor(c, 820, 150, 1770)
        # разбитая дверь
        Q.door_front(c, 420, 820, 420)
        if t >= t_door:
            k = ease_out(prog(t, t_door, 0.3))
            for j in range(7):
                ang = j * 0.9
                c.drawLine(420, 560, 420 + math.cos(ang) * 120 * k, 560 + math.sin(ang) * 120 * k,
                           paint(BG, stroke=4))
        # незнакомец спит в кровати
        if t >= t_bed:
            info = P.bed(c, 1000, 820, 620, zz=((t * 0.45) % 1 + 1e-3))
            hx, hy = info["head"]
            cap = skia.Path()
            cap.addArc(skia.Rect.MakeXYWH(hx - 37, hy - 37, 74, 74), 180, 180)
            cap.close()
            with xf(c, hx, hy, r=-90), xf(c, -hx, -hy):
                c.drawPath(cap, paint(Q.BEANIE))
            K.label(c, 1000, 470, "STRANGER", bg=RED, size=20, a=fade(t, t_bed))
        if t >= t_called:
            P.person_side(c, 1560, 820, 340, POSES["phone"], facing=-1)
        if t >= t_arr:
            Q.police_car(c, lerp(2200, 1700, ease_out(prog(t, t_arr, 1.0))), 820, 330, t=t)
        if t >= t_still:
            K.label(c, 1000, 400, "STILL ASLEEP", col=SOFT, size=22, a=fade(t, t_still))
    return draw


def s_notyours(S, sc):
    t_bed = S.at("e16", "bed")
    t_not = S.at("e16", "not")
    S.cue(t_not, "tick")

    def draw(c, t):
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        if t >= t_bed:
            K.cv_box(c, 330, HS.U - 140, 290, 140, "BED: EMPTY", ease_out(prog(t, t_bed, 0.3)), GREEN)
        if t >= t_not:
            K.cv_box(c, 240, HS.U - 170, 130, 175, "YOU", ease_out(prog(t, t_not, 0.3)), GREEN)
    return draw


# ------------------------------------------------------------------ правило 6
def s_police(S, sc):
    t_sir = S.at("f2", "sirens")
    t_car = S.at("f2", "car")
    t_boots = S.at("f2", "boots")
    S.cue(S.at("f1"), "siren_far", dur=t_boots - S.at("f1"))
    S.cue(t_car + 0.1, "car_door")
    S.cue(t_car + 0.45, "car_door")
    S.cue(t_boots, "boots", dur=1.8)

    def cam(t):
        return 0.92, CX, CY
    sc.cam = cam

    def draw(c, t):
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        k = ease_out(prog(t, t_sir, 1.4))
        Q.police_car(c, lerp(2300, 1880, k), HS.G, 300, t=t)
        if t >= t_sir:
            on = (t * 3) % 1 < 0.5
            c.drawRect(skia.Rect.MakeWH(W, H), paint(RED if on else BLUE, 0.05))
        if t >= t_boots:
            pts = [(1630, HS.G), (1300, HS.G), (1080, HS.G), (1300, HS.U), (1180, HS.U)]
            HS.footprints(c, [(1630, HS.G - 2), (1080, HS.G - 2)], t, t_boots, step=0.08, col=WHITE)
            steps_pts = [(1080 + k * 23, HS.G - k * 24) for k in range(11)]
            for i, (x, y) in enumerate(steps_pts):
                if t >= t_boots + 0.9 + i * 0.08:
                    c.drawOval(skia.Rect.MakeXYWH(x - 9, y - 8, 18, 8), paint(WHITE, 0.8))
    return draw


def s_knock(S, sc):
    t_kn = S.at("f3", "knock")
    t_say = S.at("f4", "police")
    t_no = S.at("f5", "not")
    S.cue(t_kn, "knock")
    S.cue(t_no, "cross")

    def draw(c, t):
        bedroom_close(c, t, lock=1.0, chair=1.0, dresser=1.0)
        Q.person_sit_floor(c, 260, 820, 360)
        if t >= t_kn:
            sound_rings(c, 1480, 540, t if t < t_kn + 1.3 else -1, t_kn, WHITE, r=120)
        if t >= t_say:
            K.text_bubble(c, 1380, 230, "POLICE. YOU CAN COME OUT NOW.", t, t_say, size=30, tail=(0.3, 1))
        if t >= t_no:
            P.cross(c, 1480, 520, 300, prog(t, t_no, 0.3))
    return draw


def s_dispatch(S, sc):
    t_ask = S.at("f6", "ask")
    t_any = S.at("f7", "anyone")
    t_only = S.at("f7", "only")
    t_real = S.at("f7b", "real")
    S.cue(t_ask, "message")
    items = [("ARE YOUR OFFICERS\nAT MY DOOR?", t_ask, True)]

    def draw(c, t):
        sr = phone_screen(c, 640, title="DISPATCH")
        chat(c, sr, items, t, size=24)
        if t >= t_any:
            for i in range(3):
                k = pop(t, t_any + i * 0.15)
                if k > 0:
                    with xf(c, 1180 + i * 170, 520, s=k):
                        P.person_front(c, 0, 0, 260, col=GREY)
                        draw_text(c, "?", 0, -270, font(60, "bold"), paint(RED), "center")
        if t >= t_only:
            k = ease_out(prog(t, t_only, 0.4))
            K.panel(c, 1080, 620, 640, 200, "OFFICER LOCATION", k)
            c.drawCircle(1200 + 300 * k, 740, 12, paint(BLUE, k))
            c.drawCircle(1200 + 300 * k, 740, 24, paint(BLUE, 0.3 * k * blink(t, 2)))
        if t >= t_real:
            K.label(c, 1400, 200, "REAL OFFICERS WAIT", bg=GREEN, size=22, a=fade(t, t_real))
    return draw


def s_fourmin(S, sc):
    t_quiet = S.at("f8", "quiet")
    t_says = S.at("f9", "our")
    t_min = S.at("f9", "minutes")
    S.cue(t_says, "message")
    S.cue(t_min, "hit")
    items_a = [("ARE YOUR OFFICERS\nAT MY DOOR?", sc.t0 - 10, True)]

    def draw(c, t):
        sr = phone_screen(c, 760, title="DISPATCH")
        items = list(items_a)
        if t >= t_says:
            items.append(("OUR OFFICERS ARE\nSTILL 4 MINUTES AWAY.", t_says, False))
        chat(c, sr, items, t, size=24)
        if t_quiet - 0.3 <= t < t_says:
            for i in range(3):
                c.drawCircle(sr.left() + 50 + i * 26, sr.top() + 250, 8, paint(SOFT, 0.3 + 0.7 * ((t * 3 - i * 0.3) % 1 < 0.5)))
        if t >= t_min:
            k = pop(t, t_min)
            with xf(c, 1400, 480, s=k):
                draw_text(c, "4:00", 0, 40, font(150, "bold"), paint(RED), "center", tracking=4)
            secs = max(0, 240 - int(t - t_min))
            draw_text(c, f"ETA {secs // 60}:{secs % 60:02d}", 1400, 600, font(28, "bold"), paint(SOFT), "center", tracking=3)
    return draw


def s_polite(S, sc):
    t_no = S.at("f10")
    t_kn = S.at("f11", "knocks")
    t_pol = S.at("f12")
    S.cue(t_kn + 0.2, "knock", soft=True)
    S.cue(t_pol + 0.1, "knock", n=2, soft=True)
    S.cue(t_pol, "drop")

    def draw(c, t):
        bedroom_close(c, t, lock=1.0, chair=1.0, dresser=1.0)
        Q.person_sit_floor(c, 260, 820, 360)
        if t >= t_no:
            k = ease_out(prog(t, t_no, 0.3))
            c.drawRect(skia.Rect.MakeLTRB(1250, 254, 1710, 820), paint(RED, 0.5 * k, stroke=6))
        if t >= t_kn + 0.2:
            sound_rings(c, 1480, 540, t if t < t_pol + 1.5 else -1, t_kn + 0.2, SOFT, r=50)
        if t >= t_pol:
            # тень двух ног в щели под дверью
            k = ease_out(prog(t, t_pol + 0.3, 1.0))
            for dx in (-40, 40):
                c.drawRect(skia.Rect.MakeXYWH(1480 + dx - 25, 808, 50, 12), paint(BG, k))
            c.drawLine(1260, 814, 1700, 814, paint((255, 230, 180), 0.5 * (1 - 0.5 * k), stroke=4))
            K.label(c, 1480, 200, "POLITELY", col=SOFT, size=22, a=fade(t, t_pol))
    return draw


# ------------------------------------------------------------------ правило 7
def s_secondcall(S, sc):
    t_sec = S.at("g2", "second")
    t_kit = S.at("g3", "kitchen")
    t_wh = S.at("g3", "whispering")
    S.cue(t_sec, "radio", dur=0.8)
    S.cue(t_wh, "whisper", dur=1.4)

    def draw(c, t):
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        if t >= t_kit:
            Q.burglar(c, 470, HS.G, HERO_S, POSES["phone"], facing=1, torch=0)
            sound_rings(c, 470, HS.G - 150, t, t_wh, GREEN, r=40)
        K.panel(c, 1180, 130, 470, 170, "DISPATCH  •  03:07", ease_out(prog(t, sc.t0, 0.3)), GREEN)
        if t >= t_sec:
            draw_text(c, "CALL 2  •  SAME ADDRESS", 1205, 210, font(24, "bold"), paint(WHITE), tracking=2)
            draw_text(c, "CALLER: NOT THE OWNER", 1205, 260, font(20, "bold"), paint(RED, blink(t, 2, 0.7)), tracking=2)
    return draw


def s_burglar_call(S, sc):
    t_arr = S.at("g4", "arrested")
    t_q = S.at("g4", "quickly")
    t_rule = S.at("g5", "rule")
    S.cue(t_rule, "paper")

    def draw(c, t):
        K.floor(c, 820, 200, 1720)
        Q.burglar(c, 620, 820, 460, POSES["phone"], facing=1, torch=0)
        if t >= t_arr:
            K.text_bubble(c, 900, 260, "PLEASE ARREST ME." if t < t_q else "PLEASE ARREST ME. QUICKLY.", t, t_arr,
                          size=30, tail=(-0.35, 1))
        if t >= t_rule:
            k = ease_out(prog(t, t_rule, 0.4))
            with xf(c, 1360, 560, r=4 - 6 * k, s=lerp(0.6, 1.0, k)):
                c.drawRect(skia.Rect.MakeXYWH(-230, -160, 460, 320), paint(PAPER, k))
                draw_text(c, "BURGLAR RULE 1", -200, -100, font(30, "bold"), paint(BG, k), tracking=2)
                draw_text(c, "IF SOMEONE IS HOME,", -200, -10, font(30, "regular"), paint(BG, k), tracking=1)
                draw_text(c, "LEAVE.", -200, 50, font(48, "bold"), paint(RED, k), tracking=3)
    return draw


def s_backdoor(S, sc):
    t_lock = S.at("g6", "locked")
    t_in = S.at("g6", "inside")
    t_not = S.at("g7", "not")
    S.cue(t_lock - 0.6, "drawer")
    S.cue(t_lock, "lock")
    S.cue(t_not, "drop")

    def draw(c, t):
        K.floor(c, 820, 200, 1720)
        lk = ease_out(prog(t, t_lock, 0.3))
        Q.door_front(c, 760, 820, 600, lock=lk, handle_turn=abs(math.sin(t * 9)) if t_lock - 0.8 < t < t_lock else 0)
        Q.burglar(c, 1160, 820, 440, POSES["reach"], facing=-1, torch=0)
        if t >= t_lock:
            with xf(c, 760, 240, s=pop(t, t_lock)):
                P.lock(c, 0, 0, 100, col=RED)
        if t >= t_in:
            K.label(c, 760, 900 - 90, "LOCKED FROM INSIDE", bg=RED, size=22, a=fade(t, t_in))
        if t >= t_not:
            K.text_bubble(c, 1250, 300, "WASN'T ME", t, t_not, size=30, tail=(-0.2, 1))
    return draw


def s_attic(S, sc):
    t_att = S.at("g8", "attic")
    t_eat = S.at("g8", "eat")
    t_say = S.at("g8b", "anything")
    t_wash = S.at("g8c", "washed")
    S.cue(t_att - 0.3, "creak", dur=1.2)
    S.cue(t_wash, "water", dur=1.6)

    def cam(t):
        k = ease_io(prog(t, t_eat - 0.5, 1.0))
        return 1.0 + 0.35 * k, lerp(CX, 700, k), lerp(CY, 640, k)
    sc.cam = cam

    def draw(c, t):
        hatch = ease_out(prog(t, t_att - 0.3, 0.8))
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True, hatch=hatch,
                light={"attic": 0.4 * hatch})
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        # грабитель ест за столом
        Q.burglar(c, 600, HS.G, HERO_S, dict(armF=-80, foreF=-60, lean=8), facing=-1, torch=0, sack=False)
        if t < t_wash:
            Q.plate(c, 560, HS.G - 88, 50)
        # тёмная фигура в дверях кухни
        if t >= t_att:
            k = ease_out(prog(t, t_att, 0.8))
            x, _ = walk_x(t, [(t_att, 1150), (t_eat - 0.3, 760)])
            fig = P.person_front(c, x, HS.G, 175, col=(22, 22, 25), a=k)
            c.drawRRect(rrect(x - 18, HS.G - 0.95 * 175 - 3, 36, 8, 3), paint(RED, k))
            c.drawCircle(x, HS.G - 0.935 * 175, 0.088 * 175 + 2, paint(SOFT, 0.5 * k, stroke=2))
        if t >= t_wash:
            k = ease_out(prog(t, t_wash, 0.6))
            with xf(c, 690, HS.G - 100):
                Q.plate(c, 0, 0, 50)
                for j in range(5):
                    ang = t * 3 + j * 1.25
                    c.drawCircle(math.cos(ang) * 40, -30 + math.sin(ang) * 14, 4, paint(WHITE, k))
    return draw


def s_owner(S, sc):
    t_up = S.at("g10", "upstairs")
    t_rules = S.at("g10", "rules")
    t_good = S.at("g11", "good")
    S.cue(t_good, "chime")

    def draw(c, t):
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.2)
        if t >= t_up:
            K.cv_box(c, 230, HS.U - 180, 150, 185, "OWNER", ease_out(prog(t, t_up, 0.3)), GREEN)
        if t >= t_rules:
            for i in range(6):
                k = pop(t, t_rules + i * 0.08)
                with xf(c, 470 + i * 60, HS.C + 40, s=k):
                    c.drawRRect(rrect(-22, -22, 44, 44, 8), paint(GREEN))
                    P.check(c, 0, 0, 36, 1.0, ring=False, col=WHITE)
        if t >= t_good:
            K.label(c, 300, HS.U + 60, "GOOD", bg=GREEN, size=26, a=fade(t, t_good))
    return draw


def s_morning(S, sc):
    t_door = S.at("g11b", "door")
    t_fr = S.at("g11b", "frightened")
    t_kit = S.at("g11b", "kitchen")
    S.cue(sc.t0, "chime", pitch=1.2)

    def draw(c, t):
        k = ease_out(prog(t, sc.t0, 1.5))
        c.drawRect(skia.Rect.MakeWH(W, H), paint((40, 34, 24), 0.6 * k))
        P.sun(c, 1750, 200, 160, a=k, rot=t * 6)
        HS.draw(c, t, bed_door=0.0, dresser_x=800, chair=True, moon=False,
                light={r: 0.6 for r in HS.ROOMS})
        Q.police_car(c, 1830, HS.G, 280, t=t, lights=False)
        for tt, lab, x, y, col in ((t_door, "BROKEN DOOR", HS.X0 + 90, HS.G - 220, SOFT),
                                   (t_fr, "FRIGHTENED BURGLAR", 1560, HS.G - 230, SOFT),
                                   (t_kit, "VERY CLEAN KITCHEN", 480, HS.U + 60, GREEN)):
            if t >= tt:
                K.label(c, x, y, lab, bg=col, size=20, a=fade(t, tt))
        if t >= t_kit:
            for j in range(6):
                ph = (t * 1.2 + j / 6) % 1
                c.drawCircle(400 + j * 50, HS.G - 120 - ph * 40, 4, paint(WHITE, 1 - ph))
    return draw


def s_agency(S, sc):
    t_q = S.at("g12", "wondering")
    t_ag = S.at("g13", "agency")
    t_br = S.at("g14", "break")
    t_out = S.at("g15", "out")
    S.cue(t_ag, "theme_hit")
    S.cue(t_br, "cross")
    S.cue(t_out, "boom", amp=1.0)
    S.glitch(t_out - 0.05, 0.3, 0.9)
    S.shake(t_out, 16, 0.6)

    def draw(c, t):
        if t < t_out - 0.05:
            P.bust(c, 700, 740, 420, "agent")
            for i in range(3):
                k = pop(t, t_q + i * 0.2)
                if k > 0:
                    pos = [(-260, -470), (-170, -560), (220, -500)][i]
                    with xf(c, 700 + pos[0], 740 + pos[1], s=k):
                        draw_text(c, "?", 0, 30, font(90, "bold"), paint(WHITE), "center")
            if t >= t_ag:
                k = out_back(prog(t, t_ag, 0.5))
                P.logo(c, 1260, 470, 360 * k, t=t * 3) if k > 0.05 else None
            if t >= t_br:
                P.cross(c, 1260, 470, 300, prog(t, t_br, 0.3))
            return
        # чердак: агент живёт тут
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True, hatch=0.3, light={"attic": 0.6})
        Q.person_sit_floor(c, 300, HS.U, HERO_S)
        c.drawRRect(rrect(780, HS.C - 30, 260, 26, 10), paint(SOFT))
        P.bust(c, 1100, HS.C - 4, 150, "agent")
        glow_circle(c, 1260, HS.C - 60, 10, AMBER, 1, spread=6)
        K.label(c, 960, HS.PEAK - 40, "WE WERE NEVER OUT", bg=RED, size=24, a=fade(t, t_out))
    return draw


def s_milk(S, sc):
    t_rent = S.at("g16", "rent")
    t_dish = S.at("g16", "dishes")
    t_milk = S.at("g17", "milk")
    t_more = S.at("g17b", "more")
    S.cue(t_dish, "water", dur=1.0)
    S.cue(t_milk, "fridge")
    S.cue(t_more, "pop")

    def draw(c, t):
        if t >= t_rent:
            K.label(c, 480, 250, "RENT: $0", bg=WHITE, size=28, a=fade(t, t_rent))
        if t >= t_dish:
            with xf(c, 480, 450):
                for j in range(5):
                    Q.plate(c, 0, -j * 16, 220)
                for j in range(6):
                    ph = (t * 1.2 + j / 6) % 1
                    c.drawCircle(-100 + j * 40, -100 - ph * 60, 6, paint(WHITE, 1 - ph))
        o = ease_out(prog(t, t_milk - 0.3, 0.6))
        Q.fridge(c, 1250, 860, 600, open_=o, light=o)
        if o > 0.5:
            if t >= t_more:
                k = pop(t, t_more)
                with xf(c, 1250, 560, s=k):
                    Q.milk(c, 0, 0, 120)
                    Q.milk(c, 90, 0, 120)
            else:
                K.label(c, 1250, 520, "NO MILK", bg=RED, size=22)
    return draw


def s_us(S, sc):
    t_burg = S.at("g19", "burglar")
    t_us = S.at("g20", "us")
    S.cue(S.at("g18"), "steps", dur=2.0)
    S.cue(t_us, "boom", amp=0.9)
    S.glitch(t_us, 0.25, 0.8)

    def draw(c, t):
        HS.draw(c, t, sleeper=True)
        bx, walking = walk_x(t, [(sc.t0, 400), (t_burg, 800)])
        if t < t_us:
            burglar_in(c, bx, HS.G, P.walk_pose(t * 5, 0.5) if walking else None, facing=1, torch=1.0, ang=10,
                       a=1 - fade(t, t_burg, 0.6))
        else:
            k = ease_out(prog(t, t_us, 0.4))
            x = 1040
            P.person_front(c, x, HS.G, 175, col=(22, 22, 25), a=k)
            c.drawCircle(x, HS.G - 0.935 * 175, 0.088 * 175 + 2, paint(SOFT, 0.5 * k, stroke=2))
            c.drawRRect(rrect(x - 18, HS.G - 0.95 * 175 - 3, 36, 8, 3), paint(RED, k))
            c.drawRRect(rrect(x - 30, HS.G - 0.95 * 175 - 8, 60, 18, 6), paint(RED, 0.4 * k, blur=6))
    return draw


def s_outro(S, sc):
    t_g = S.at("g22")
    S.cue(sc.t0, "theme_end")
    S.cue(t_g, "boom", amp=1.0)
    S.cue(t_g, "cut_silence")

    def draw(c, t):
        if t < t_g - 0.05:
            k = ease_out(prog(t, sc.t0, 0.6))
            P.logo(c, 960, 430, 380 * k, t=t * 3, reveal=1.0) if k > 0.02 else None
            return
        draw_text(c, "GOODNIGHT.", 960, 520, font(170, "bold"), paint(WHITE), "center", tracking=10)
        if t - t_g > 1.4:
            draw_text(c, f"NEXT FILE: {script.NEXT_FILE}", 960, 620, font(22, "bold"),
                      paint(GREY, fade(t, t_g + 1.4, 0.4)), "center", tracking=8)
        # полоска света под дверью
        c.drawLine(800, 780, 1120, 780, paint((255, 230, 180), 0.5 * blink(t, 0.6, 0.8), stroke=4))
        end = S.duration
        if t > end - 1.2:
            c.drawRect(skia.Rect.MakeWH(W, H), paint(BG, ease_in(prog(t, end - 1.2, 1.1))))
    return draw


def build(S):
    L = S.at
    S.add(L("r4") - 0.05, card(4, "NOT THE CLOSET"), trans="hard", push=0.02)
    S.add(L("d1") - 0.2, s_films)
    S.add(L("d3") - 0.15, s_closetcheck, push=0.06)
    S.add(L("d5") - 0.2, s_japan, trans="hard", push=0.02)
    S.add(L("d9") - 0.15, s_shelf, push=0.02)
    S.add(L("d12") - 0.15, s_phrog)
    S.add(L("d13") - 0.15, s_alone, push=0.04)
    S.add(L("r5") - 0.05, card(5, "LET IT GO"), trans="hard", push=0.02)
    S.add(L("e1") - 0.2, s_listen, push=0)
    S.add(L("e3b") - 0.15, s_notes)
    S.add(L("e4") - 0.15, s_unc, push=0.02)
    S.add(L("e6") - 0.15, s_panic, push=0.02)
    S.add(L("e7") - 0.15, s_most)
    S.add(L("e9") - 0.15, s_fridge2, push=0)
    S.add(L("e11") - 0.15, s_wv, trans="hard", push=0.02)
    S.add(L("e15") - 0.15, s_notyours)
    S.add(L("r6") - 0.05, card(6, "NO VOICES"), trans="hard", push=0.02)
    S.add(L("f1") - 0.2, s_police, push=0)
    S.add(L("f3") - 0.15, s_knock)
    S.add(L("f6") - 0.15, s_dispatch)
    S.add(L("f8") - 0.15, s_fourmin)
    S.add(L("f10") - 0.15, s_polite, push=0.06)
    S.add(L("r7") - 0.05, card(7, ""), trans="hard", push=0.03)
    S.add(L("g1") - 0.25, s_secondcall)
    S.add(L("g4") - 0.15, s_burglar_call)
    S.add(L("g6") - 0.15, s_backdoor)
    S.add(L("g8") - 0.15, s_attic, push=0)
    S.add(L("g9") - 0.15, s_owner)
    S.add(L("g11b") - 0.2, s_morning, trans="fade")
    S.add(L("g12") - 0.2, s_agency, trans="hard", push=0.02)
    S.add(L("g16") - 0.15, s_milk)
    S.add(L("g18") - 0.2, s_us, trans="hard")
    S.add(L("g21") - 0.3, s_outro, trans="fade", push=0.03)
