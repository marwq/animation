"""Сцены второго ролика: холодное начало, вступление, правила 1–3."""
import math

import skia

from engine import hud
from engine import house as HS
from engine import kit as K
from engine import picto as P
from engine import picto2 as Q
from engine.core import (AMBER, BG, BLUE, CX, CY, DARK, DIM, GREEN, GREY, H, PAPER, RED, SOFT, W, WHITE, blink,
                         clamp, color, dashed, draw_text, ease_in, ease_io, ease_out, fade, font, glow_circle,
                         hash01, layer, lerp, out_back, paint, pop, prog, rrect, spring, text_width, window, xf)

from . import script

NOCAP = {"g22"}
POSES = Q.poses()
POSES["phone"] = dict(armF=140, foreF=62, tilt=6)
HERO_S = 150
GROUND = skia.Rect.MakeLTRB(HS.X0 + 5, HS.U + 5, HS.X1 - 5, HS.G - 3)
UPPER = skia.Rect.MakeLTRB(HS.X0 + 5, HS.C + 5, HS.X1 - 5, HS.U - 3)


# ------------------------------------------------------------------ общие композиции
def card(n, subtitle):
    def build(S, sc):
        S.cue(sc.t0, "boom", amp=1.0 if n == 7 else 0.8)
        S.cue(sc.t0 - 0.6, "riser", dur=0.6)
        S.flash(sc.t0, 0.25, 0.12)

        def draw(c, t):
            hud.rule_card(c, t, sc.t0, n, subtitle, file_no=script.FILE_NO)
        return draw
    build.__name__ = f"card{n}"
    return build


def burglar_in(c, x, y, pose=None, facing=1, torch=1.0, ang=12, rect=GROUND, s=HERO_S, a=1.0, sack=True):
    """Грабитель в разрезе дома: луч фонаря обрезан стенами комнаты."""
    c.save()
    c.clipRect(rect)
    info = Q.burglar(c, x, y, s, pose, facing=facing, torch=torch, torch_ang=ang, a=a, sack=sack, torch_len=2.6)
    c.restore()
    return info


def sound_rings(c, x, y, t, t0, col=WHITE, n=3, r=60, a=1.0):
    if t < t0:
        return
    for k in range(n):
        ph = ((t - t0) * 0.9 + k / n) % 1
        c.drawCircle(x, y, 10 + ph * r, paint(col, a * (1 - ph) * 0.8, stroke=3))


def walk_x(t, keys):
    """Позиция по ключам [(t, x), ...] с плавностью; возвращает (x, идёт ли)."""
    if t <= keys[0][0]:
        return keys[0][1], False
    for (ta, xa), (tb, xb) in zip(keys, keys[1:]):
        if t <= tb:
            return lerp(xa, xb, ease_io(prog(t, ta, tb - ta))), abs(xb - xa) > 1
    return keys[-1][1], False


def bedroom_close(c, t, door_open=0.0, lock=0.0, chair=0.0, dresser=0.0, dust=0.0, handle=0.0, a=1.0):
    """Спальня крупно: кровать слева, дверь справа. chair/dresser 0..1 — насколько придвинуты."""
    K.floor(c, 820, 120, 1800, a)
    P.window(c, 520, 340, 170, a=a)
    P.bed(c, 560, 820, 640, sleeper=False, a=a)
    Q.door_front(c, 1480, 820, 560, lock=lock, handle_turn=handle, open_=door_open, a=a)
    if dust > 0:
        c.drawRect(skia.Rect.MakeXYWH(1010, 560, 220, 250), paint(GREY, 0.35 * dust * a, stroke=3))
        draw_text(c, "DUST", 1120, 700, font(22, "bold"), paint(GREY, 0.6 * dust * a), "center", tracking=6)
    Q.dresser(c, lerp(1120, 1380, ease_io(dresser)), 820, 250, a=a)
    if chair > 0:
        k = ease_out(chair)
        Q.chair_side(c, lerp(1800, 1610, k), 820, 360, tilt=lerp(0, -24, k), a=a)


def hero_close(c, x, y, pose=None, facing=1, s=360, a=1.0):
    return P.person_side(c, x, y, s, pose or {}, facing=facing, a=a)


# ------------------------------------------------------------------ холодное начало
def s_open(S, sc):
    t_hear = S.at("o1", "hear")
    t_down = S.at("o1", "downstairs")
    t_no = S.at("o2")
    S.cue(0.0, "clock", dur=t_no)
    S.cue(t_hear - 0.3, "steps", dur=1.8)
    S.cue(t_no, "hit")

    def cam(t):
        k = ease_io(prog(t, sc.t0, sc.t1 - sc.t0))
        return 1.0 + 0.08 * k, CX, lerp(CY, CY - 30, k)
    sc.cam = cam

    def draw(c, t):
        HS.draw(c, t, sleeper=True, stairs_hl=0.0)
        if t >= t_hear - 0.3:
            bx, _ = walk_x(t, [(t_hear - 0.3, 420), (t_down + 1.2, 640)])
            burglar_in(c, bx, HS.G, P.walk_pose(t * 6, 0.6), facing=1, torch=fade(t, t_hear, 0.4), ang=14)
            sound_rings(c, 1000, 520, t, t_hear, SOFT)
        if t >= t_no:
            k = ease_out(prog(t, t_no, 0.3))
            # лестница красная + крест
            (x0, y0), (x1, y1) = HS.STAIRS
            c.drawLine(x0, y0, x1, y1, paint(RED, 0.4 * k, stroke=26, blur=10))
            P.cross(c, (x0 + x1) / 2, (y0 + y1) / 2, 150, prog(t, t_no + 0.1, 0.3))
    return draw


def s_hello(S, sc):
    t_b = S.at("o3", "hello") - 0.15
    S.cue(t_b, "pop")
    S.cue(t_b + 0.55, "cross")

    def draw(c, t):
        K.floor(c, 860, 150, 1770)
        P.bed(c, 820, 860, 1000, sit=0.85, zz=0)
        hx, hy = 820 - 0.08 * 1000 + math.cos(math.radians(95)) * (0.2 + 0.085) * 1000, 860 - 0.29 * 1000 - math.sin(math.radians(95)) * 285
        K.text_bubble(c, hx + 300, hy - 150, "HELLO?", t, t_b, size=56, tail=(-0.4, 1))
        P.cross(c, hx + 300, hy - 150, 220, prog(t, t_b + 0.55, 0.3))
    return draw


def s_settle(S, sc):
    t_set = S.at("o5", "settle")
    S.cue(S.at("o4", "settling"), "creak", dur=1.0)
    S.cue(t_set, "creak", dur=0.8)

    def draw(c, t):
        wob = math.sin(t * 11) * 2.5 * window(t, S.at("o4", "settling"), S.end("o5"), 0.1, 0.3)
        with xf(c, CX, CY, r=wob * 0.3):
            with xf(c, -CX, -CY):
                P.house(c, 960, 760, 520)
        # «скрипы» у углов
        for (x, y) in ((700, 500), (1220, 500), (960, 300)):
            k = window(t, S.at("o4", "settling"), S.end("o5") + 0.3, 0.2, 0.3)
            for j in range(3):
                c.drawLine(x - 30 + j * 25, y - 40 - j * 8, x - 15 + j * 25, y - 60 - j * 8,
                           paint(SOFT, k * (0.4 + 0.6 * abs(math.sin(t * 7 + j))), stroke=4))
        if t >= t_set:
            K.label(c, 960, 840, "NORMAL: SETTLING", col=GREEN, size=24, a=fade(t, t_set))
    return draw


def s_fridge(S, sc):
    t_f = S.at("o6", "fridge") - 0.35
    S.cue(t_f, "fridge")
    S.glitch(S.end("o6") + 0.3, 0.12, 0.5)

    def draw(c, t):
        K.floor(c, 860, 400, 1520)
        o = ease_out(prog(t, t_f, 0.7))
        Q.fridge(c, 900, 860, 520, open_=o, light=o)
        if o > 0.2:
            K.label(c, 960, 230, "03:04", col=RED, size=34, a=fade(t, t_f + 0.3))
    return draw


def s_locks(S, sc):
    t_7 = S.at("o7", "seven")
    t_pol = S.at("o8", "police")
    t_bur = S.at("o9", "burglar")
    for i in range(7):
        S.cue(t_7 + i * 0.07, "pop", pitch=1 + i * 0.08)
    for i in range(6):
        S.cue(t_pol + i * 0.11, "tick")
    S.cue(t_bur, "hit")
    S.cue(t_bur + 0.1, "lock")
    S.shake(t_bur, 8, 0.3)
    gap = 190
    x0 = W / 2 - 3 * gap

    def padlock(c, x, y, s, open_=0.0, col=WHITE):
        arc = skia.Path()
        lift = 0.25 * s * open_
        arc.addArc(skia.Rect.MakeXYWH(x - 0.28 * s, y - 0.62 * s - lift, 0.56 * s, 0.56 * s), 180, 180)
        c.drawPath(arc, paint(col, stroke=0.1 * s))
        c.drawLine(x + 0.28 * s, y - 0.34 * s - lift, x + 0.28 * s, y - 0.15 * s - lift, paint(col, stroke=0.1 * s))
        if open_ < 0.5:
            c.drawLine(x - 0.28 * s, y - 0.34 * s, x - 0.28 * s, y - 0.15 * s, paint(col, stroke=0.1 * s))
        c.drawRRect(rrect(x - 0.42 * s, y - 0.2 * s, 0.84 * s, 0.7 * s, 0.1 * s), paint(col))
        c.drawCircle(x, y + 0.1 * s, 0.08 * s, paint(BG))

    def draw(c, t):
        for i in range(7):
            k = pop(t, t_7 + i * 0.07)
            if k <= 0:
                continue
            x = x0 + i * gap
            with xf(c, x, 470, s=k):
                red = i == 6 and t >= t_bur
                padlock(c, 0, 0, 130, open_=ease_out(prog(t, t_bur + 0.1, 0.3)) if red else 0.0,
                        col=RED if red else WHITE)
                if i < 6 and t >= t_pol + i * 0.11:
                    kk = pop(t, t_pol + i * 0.11)
                    with xf(c, 0, 120, s=kk):
                        c.drawPath(skia.Path().addRRect(rrect(-26, -22, 52, 50, 12)), paint(BLUE))
                        draw_text(c, "POLICE", 0, 52, font(14, "bold"), paint(SOFT), "center", tracking=2)
                if red:
                    draw_text(c, "BURGLAR", 0, 172, font(14, "bold"), paint(RED), "center", tracking=2)
    return draw


def s_title(S, sc):
    S.cue(sc.t0, "boom", amp=0.9)
    S.cue(sc.t0 + 0.7, "hit")
    S.cue(sc.t0, "theme")
    S.flash(sc.t0, 0.3, 0.15)

    def draw(c, t):
        hud.title_card(c, t, sc.t0, script.TITLE_TOP, script.TITLE_MAIN, script.FILE_NO, script.AGENCY,
                       lambda c, x, y, s, lt: P.logo(c, x, y, s, t=lt * 4) if s > 1 else None)
    return draw


# ------------------------------------------------------------------ вступление
def s_empty(S, sc):
    t_empty = S.at("i2", "empty")
    t_min = S.at("i2", "minutes")
    t_knock = S.at("i2b", "knock")
    t_nobody = S.at("i2b", "nobody")
    S.cue(t_knock + 0.1, "knock")
    S.cue(t_nobody, "tick")

    def draw(c, t):
        K.floor(c, 800, 150, 1770)
        P.house(c, 1150, 800, 520, light=0)
        bx, walking = walk_x(t, [(sc.t0, 300), (t_knock - 0.2, 830)])
        pose = P.walk_pose(t * 7, 0.8) if walking else (dict(armF=-80, foreF=-20) if t_knock < t < t_knock + 1.2 else None)
        Q.burglar(c, bx, 800, 300, pose, facing=1, torch=0)
        if t >= t_empty:
            K.label(c, 1150, 230, "EMPTY HOUSE", col=SOFT, size=22, a=fade(t, t_empty))
        if t >= t_min:
            k = fade(t, t_min)
            c.drawCircle(1500, 330, 60, paint(WHITE, k, stroke=6))
            ang = -math.pi / 2 + (t - t_min) * 2
            c.drawLine(1500, 330, 1500 + math.cos(ang) * 44, 330 + math.sin(ang) * 44, paint(RED, k, stroke=5))
        sound_rings(c, 1150, 700, t if t < t_knock + 1.3 else -1, t_knock + 0.1, WHITE)
        if t >= t_nobody:
            P.check(c, 1150, 500, 90, prog(t, t_nobody, 0.4))
    return draw


def grid_stat(c, t, t0, n_hl, hl_col, label, sub, base_col=DIM, t_hl=None, x0=560, y0=230, cell=58, icon="house",
              focus=None):
    for i in range(100):
        r, q = divmod(i, 10)
        x = x0 + q * cell
        y = y0 + r * cell
        k = pop(t, t0 + i * 0.006)
        if k <= 0:
            continue
        hl = t_hl is not None and t >= t_hl + (i % 10) * 0.01 and i < n_hl
        col = hl_col if hl else base_col
        with xf(c, x, y, s=k):
            if icon == "house":
                P.house(c, 0, 18, 40, col=col, door_=False, win=False)
            else:
                P.bust(c, 0, 20, 40, col=col)
        if focus is not None and i == focus:
            c.drawRect(skia.Rect.MakeXYWH(x - 28, y - 24, 56, 54), paint(GREEN, stroke=3))
    if label:
        draw_text(c, label, x0 + 10 * cell + 60, y0 + 230, font(110, "bold"), paint(hl_col), tracking=4)
        draw_text(c, sub, x0 + 10 * cell + 64, y0 + 290, font(22, "bold"), paint(SOFT), tracking=3)


def s_quarter(S, sc):
    t_home = S.at("i3", "home")
    t4 = S.at("i3", "four")
    S.cue(t4, "pop")
    S.cue(t_home, "hit")

    def draw(c, t):
        grid_stat(c, t, sc.t0, 28, AMBER, "28%" if t >= t_home else "", "SOMEONE WAS HOME", t_hl=t4, x0=330)
        draw_text(c, "U.S. BUREAU OF JUSTICE STATISTICS  •  2003–2007", 330, 870, font(16, "regular"),
                  paint(GREY), tracking=3)
    return draw


def s_hotprowl(S, sc):
    t_name = S.at("i5", "hot")
    S.cue(S.at("i4"), "radio", dur=1.2)
    S.cue(t_name, "stamp")
    S.shake(t_name, 10, 0.3)

    def draw(c, t):
        K.panel(c, 460, 230, 1000, 460, "POLICE RADIO  •  CH 4", ease_out(prog(t, sc.t0, 0.3)))
        K.waveform(c, 500, 420, 920, 120, t, sc.t0 + 0.2, col=GREEN, seed=2)
        if t >= t_name:
            K.stamp(c, 960, 560, "HOT PROWL", t, t_name, rot=-7, size=110)
    return draw


def s_seven(S, sc):
    t7 = S.at("i6", "seven")
    t_att = S.at("i6", "attacked")
    t93 = S.at("i7", "ninetythree")
    S.cue(t_att, "hit")
    S.cue(t93, "pop")

    def draw(c, t):
        n = 7 if t >= t_att else 0
        lab = "7%" if t < t93 else "93%"
        col = RED if t < t93 else GREEN
        for i in range(100):
            r, q = divmod(i, 10)
            x, y = 330 + q * 58, 230 + r * 58
            k = pop(t, sc.t0 + i * 0.006)
            if k <= 0:
                continue
            red = i in (3, 17, 26, 48, 55, 71, 89) and n
            safe = t >= t93 and not red
            with xf(c, x, y, s=k):
                P.bust(c, 0, 20, 40, col=RED if red else (GREEN if safe else DIM))
        if t >= t_att:
            draw_text(c, lab, 330 + 600 + 60, 460, font(120, "bold"), paint(col), tracking=4)
            draw_text(c, "ATTACKED OR THREATENED" if t < t93 else "THE OTHER NINETY-THREE", 994, 520,
                      font(22, "bold"), paint(SOFT), tracking=3)
    return draw


def s_once(S, sc):
    t_once = S.at("i8", "once")
    t_voice = S.at("i9", "voice")
    S.cue(t_voice, "tick")

    def draw(c, t):
        P.bust(c, 760, 760, 420, "agent")
        k = ease_out(prog(t, sc.t0 + 0.2, 0.3))
        K.panel(c, 1080, 330, 520, 300, "VOLUME", k)
        vol = 0.8 - 0.6 * ease_io(prog(t, t_voice, 1.2))
        for i in range(10):
            on = i / 10 < vol
            c.drawRRect(rrect(1120 + i * 46, 560 - i * 16, 30, 40 + i * 16, 6), paint(WHITE if on else DIM, k))
        if t >= t_once:
            K.label(c, 1340, 420, "SAID ONCE", bg=RED, size=22, a=fade(t, t_once))
    return draw


# ------------------------------------------------------------------ правило 1
def s_check(S, sc):
    t_ph = S.at("a2", "phone")
    t_fl = S.at("a2", "flashlight")
    t_op = S.at("a2", "opinion")
    t_x = S.at("a3", "plan")
    for tt in (t_ph, t_fl, t_op):
        S.cue(tt, "pop")
    S.cue(t_x, "cross")

    def draw(c, t):
        K.floor(c, 820, 200, 1720)
        hero_close(c, 760, 820, POSES["stand"], s=440)
        items = [(1150, 380, t_ph, "PHONE"), (1400, 380, t_fl, "FLASHLIGHT"), (1650, 380, t_op, "OPINION")]
        for x, y, tt, lab in items:
            k = pop(t, tt)
            if k <= 0:
                continue
            with xf(c, x, y, s=k):
                if lab == "PHONE":
                    P.phone(c, 0, 0, 80, 150)
                elif lab == "FLASHLIGHT":
                    c.drawRRect(rrect(-25, -60, 50, 120, 10), paint(WHITE))
                    c.drawPath(P.path_from([(-30, -60), (30, -60), (55, -100), (-55, -100)], True), paint(AMBER))
                else:
                    P.bubble(c, 0, 0, 120, 90, tail=(-0.3, 1))
                    draw_text(c, "!", 0, 22, font(64, "bold"), paint(WHITE), "center")
                draw_text(c, lab, 0, 130, font(18, "bold"), paint(SOFT), "center", tracking=3)
        if t >= t_x:
            P.cross(c, 1400, 420, 520, prog(t, t_x, 0.35))
            K.label(c, 1400, 640, "NOT A PLAN", bg=RED, size=26, a=fade(t, t_x + 0.2))
    return draw


def s_topstairs(S, sc):
    t_list = S.at("a3b", "listen")
    t_see = S.at("a3b", "see")
    S.cue(t_see, "hit")
    S.flash(t_see, 0.15, 0.12, (255, 240, 200))

    def cam(t):
        return 1.35, 1180, 640
    sc.cam = cam

    def draw(c, t):
        HS.draw(c, t)
        burglar_in(c, 1000, HS.G, None, facing=1, torch=1.0, ang=lerp(0, -38, ease_io(prog(t, t_see - 0.5, 0.6))),
                   rect=skia.Rect.MakeLTRB(HS.X0, HS.C, HS.X1, HS.G))
        with layer(c, 0.7):
            P.person_side(c, 1330, HS.U, HERO_S, POSES["listen"], facing=-1)
        if t >= t_see:
            K.cv_box(c, 1270, HS.U - 170, 120, 175, "SEEN", ease_out(prog(t, t_see, 0.3)), RED)
    return draw


def s_surprised(S, sc):
    t_sur = S.at("a4", "surprised")
    t_dec = S.at("a5", "decisions")
    S.cue(t_sur, "hit")
    S.shake(t_sur, 8, 0.3)

    def draw(c, t):
        K.floor(c, 820, 200, 1720)
        jump = 0.0
        if t >= t_sur:
            jump = -40 * math.exp(-(t - t_sur) * 6) * abs(math.sin((t - t_sur) * 14))
        jit = (hash01(int(t * 20), 4) - 0.5) * 8 if t >= t_dec else 0
        info = Q.burglar(c, 960 + jit, 820 + jump, 460, dict(armF=-70, foreF=-40, armB=-60, foreB=-30), facing=1,
                         torch=1.0, torch_ang=-5)
        if t >= t_sur:
            with xf(c, 960, 260, s=pop(t, t_sur)):
                draw_text(c, "!", 0, 40, font(150, "bold"), paint(RED), "center")
        if t >= t_dec:
            K.label(c, 1400, 320, "DECISIONS: POOR", col=RED, size=22, a=fade(t, t_dec))
    return draw


def s_bat(S, sc):
    t_bat = S.at("a6", "bat")
    t_down = S.at("a7", "down")
    t_ball = S.at("a7", "baseball")
    S.cue(t_bat, "pop")
    S.cue(t_down + 0.25, "bump")
    S.cue(t_down + 0.5, "bump")
    S.cue(t_ball, "tick")

    def draw(c, t):
        K.floor(c, 820, 200, 1720)
        holding = t < t_down + 0.1
        pose = POSES["carry_bat"] if holding else POSES["stand"]
        info = hero_close(c, 760, 820, pose, s=440)
        if t >= t_bat and holding:
            hx, hy = info["hand"]
            Q.bat(c, hx, hy, 260, ang=-120)
        elif not holding:
            k = prog(t, t_down + 0.1, 0.4)
            y = lerp(500, 800, ease_in(min(1, k * 1.4)))
            bounce = 0 if k < 0.7 else -20 * math.sin((k - 0.7) / 0.3 * math.pi)
            Q.bat(c, 880, y + bounce, 260, ang=lerp(-120, -8, ease_out(k)))
        if t >= t_ball:
            k = pop(t, t_ball)
            with xf(c, 1450, 760, s=k):
                c.drawCircle(0, 0, 40, paint(WHITE))
                arc = skia.Path()
                arc.addArc(skia.Rect.MakeXYWH(-60, -40, 80, 80), -50, 100)
                c.drawPath(arc, paint(RED, stroke=4))
            K.label(c, 1450, 650, "HITS: 0", col=SOFT, size=22, a=clamp(k))
    return draw


def s_replace(S, sc):
    t_tv = S.at("a8", "replaced")
    t_you = S.at("a9")
    S.cue(t_tv, "tick")
    S.cue(t_you, "hit")

    def draw(c, t):
        Q.tv(c, 640, 700, 320, on=1.0)
        if t >= t_tv:
            K.label(c, 640, 760, "REPLACEABLE", col=GREEN, size=24, a=fade(t, t_tv))
            P.check(c, 820, 370, 80, prog(t, t_tv, 0.3))
        if t >= t_you:
            k = pop(t, t_you)
            with xf(c, 1280, 700, s=k):
                P.person_front(c, 0, 0, 420)
            K.label(c, 1280, 760, "NOT REPLACEABLE", bg=RED, size=24, a=clamp(k))
    return draw


def s_prepare(S, sc):
    t_ph = S.at("a10", "phone")
    t_sh = S.at("a10", "shoes")
    t_move = S.at("a11", "move")
    t_lock = S.at("a11", "lock")
    S.cue(t_ph, "pop")
    S.cue(t_sh, "pop")
    S.cue(t_move, "steps", dur=2.0)
    S.cue(t_lock, "lock")

    def draw(c, t):
        K.floor(c, 820, 150, 1770)
        x, walking = walk_x(t, [(t_move, 520), (t_move + 2.4, 1250)])
        pose = P.walk_pose(t * 5, 0.5) if walking else POSES["phone" if t_ph <= t < t_move else "stand"]
        info = hero_close(c, x, 820, pose, s=400)
        if t >= t_ph:
            hx, hy = info["hand"]
            c.drawRRect(rrect(hx - 12, hy - 22, 24, 40, 5), paint(DIM))
            c.drawRRect(rrect(hx - 9, hy - 19, 18, 34, 4), paint((160, 200, 255), 0.7))
        if t >= t_sh:
            k = ease_out(prog(t, t_sh, 0.3))
            for dx in (-30, 30):
                c.drawRRect(rrect(x + dx - 30, 820 - 26, 70, 26, 10), paint(RED, k))
        if t >= t_move:
            K.label(c, 960, 260, "QUIETLY", col=SOFT, size=22, a=fade(t, t_move))
            Q.door_front(c, 1550, 820, 480, lock=0.0)
        if t >= t_lock:
            with xf(c, 1550, 220, s=pop(t, t_lock)):
                P.lock(c, 0, 0, 90, col=GREEN)
    return draw


# ------------------------------------------------------------------ правило 2
def s_lockdoor(S, sc):
    t_close = S.at("b2", "close")
    t_lock = S.at("b2", "lock")
    S.cue(t_close + 0.3, "door_close")
    S.cue(t_lock + 0.1, "lock")

    def draw(c, t):
        door = 1 - ease_io(prog(t, t_close, 0.5))
        bedroom_close(c, t, door_open=door, lock=ease_out(prog(t, t_lock + 0.1, 0.25)))
        hero_close(c, 1260, 820, POSES["reach"], s=420)
        if t >= t_lock + 0.1:
            with xf(c, 1480, 200, s=pop(t, t_lock + 0.1)):
                P.lock(c, 0, 0, 90, col=GREEN)
    return draw


def s_coin(S, sc):
    t_coin = S.at("b3", "coin")
    t_ch = S.at("b4", "children")
    t_ad = S.at("b4", "adults")
    S.cue(t_coin, "coin")
    S.cue(t_ad, "cross")

    def draw(c, t):
        # замок крупно, снаружи
        c.drawCircle(760, 480, 180, paint(WHITE))
        c.drawCircle(760, 480, 150, paint(SOFT, stroke=4))
        k = ease_out(prog(t, t_coin + 0.3, 0.5))
        with xf(c, 760, 480, r=90 * k):
            c.drawRRect(rrect(-60, -9, 120, 18, 6), paint(BG))
        cx = lerp(1100, 800, ease_out(prog(t, t_coin - 0.3, 0.5)))
        if t >= t_coin - 0.3:
            with xf(c, cx, 480, r=90 * k):
                Q.coin(c, 0, 0, 90)
        K.label(c, 760, 720, "UNLOCKED" if k > 0.8 else "LOCKED", bg=RED if k > 0.8 else GREEN, size=24)
        if t >= t_ch:
            kk = pop(t, t_ch)
            with xf(c, 1300, 640, s=kk):
                P.person_front(c, 0, 0, 200)
            P.check(c, 1300, 360, 70, prog(t, t_ch + 0.2, 0.3))
        if t >= t_ad:
            kk = pop(t, t_ad)
            with xf(c, 1560, 640, s=kk):
                P.person_front(c, 0, 0, 360)
            P.cross(c, 1560, 250, 120, prog(t, t_ad, 0.3))
    return draw


def s_chair(S, sc):
    t_w = S.at("b5", "wedge")
    S.cue(t_w, "scrape", dur=0.6)
    S.cue(t_w + 0.6, "bump")

    def draw(c, t):
        bedroom_close(c, t, lock=1.0, chair=prog(t, t_w, 0.65))
        if t >= t_w + 0.65:
            K.label(c, 1560, 230, "WEDGED", bg=WHITE, size=22, a=fade(t, t_w + 0.65))
    return draw


def s_dresser(S, sc):
    t_push = S.at("b6", "push")
    t_heavy = S.at("b7", "heavier")
    t_move = S.at("b7", "move")
    S.cue(t_push, "scrape", dur=2.2, pitch=0.6)
    S.cue(t_heavy, "tick")

    def draw(c, t):
        k = ease_io(prog(t, t_push, 2.4))
        bedroom_close(c, t, lock=1.0, chair=1.0, dresser=k, dust=fade(t, t_move, 0.4))
        px = lerp(1120, 1380, k) - 230
        hero_close(c, px, 820, POSES["push"], s=400)
        if t >= t_heavy:
            K.label(c, lerp(1120, 1380, k), 470, "84 KG", bg=AMBER, size=24, a=fade(t, t_heavy))
    return draw


def s_family(S, sc):
    t_anyone = S.at("b7b", "anyone")
    t_ch = S.at("b7b", "children")
    t_pa = S.at("b7b", "partner")
    t_pets = S.at("b7b", "pets")
    t_cat = S.at("b7c", "refuse")
    S.cue(t_ch, "steps", dur=1.4)
    S.cue(t_cat, "meow")

    def cam(t):
        return 1.5, 900, 470
    sc.cam = cam

    def draw(c, t):
        HS.draw(c, t, bed_door=0.0 if t > S.end("b7b") else 1.0)
        Q.person_sit_floor(c, 320, HS.U, HERO_S)
        for tt, x0, s, label in ((t_ch, 1200, 95, "CHILD"), (t_pa, 1300, HERO_S, "PARTNER")):
            if t < tt:
                continue
            x, walking = walk_x(t, [(tt, x0), (tt + 1.6, 500 + (s - 95) * 2)])
            P.person_side(c, x, HS.U, s, P.walk_pose(t * 6, 0.6) if walking else None, facing=-1)
        if t >= t_pets:
            Q.cat(c, 1000, HS.U, 70, tail=t * 3)
        if t >= t_cat:
            K.label(c, 1000, HS.U - 110, "REFUSED", bg=RED, size=18, a=fade(t, t_cat))
    return draw


def s_floor(S, sc):
    t_sit = S.at("b8", "sit")
    t_door = S.at("b8", "door")
    t_win = S.at("b8", "window")
    t_furn = S.at("b10", "furniture")
    S.cue(t_door, "tick")
    S.cue(t_win, "tick")
    S.cue(t_furn, "pop")

    def draw(c, t):
        bedroom_close(c, t, lock=1.0, chair=1.0, dresser=1.0)
        # опасные зоны
        for tt, x, y, r in ((t_door, 1480, 600, 260), (t_win, 520, 340, 200)):
            if t >= tt:
                k = ease_out(prog(t, tt, 0.4))
                c.drawCircle(x, y, r * k, paint(RED, 0.12))
                c.drawCircle(x, y, r * k, paint(RED, 0.6, stroke=3))
        k = ease_io(prog(t, t_sit - 0.2, 0.6))
        if k < 1:
            hero_close(c, lerp(900, 230, k), 820, P.walk_pose(t * 6, 0.6), facing=-1, s=380)
        else:
            Q.person_sit_floor(c, 230, 820, 380, col=GREY if t >= t_furn else WHITE)
        if t >= t_furn:
            with xf(c, 330, 520, s=pop(t, t_furn), r=-6):
                c.drawRRect(rrect(-90, -30, 180, 60, 8), paint(WHITE))
                draw_text(c, "FURNITURE", 0, 8, font(22, "bold"), paint(BG), "center", tracking=3)
                c.drawLine(-90, 0, -130, 40, paint(WHITE, stroke=2))
    return draw


# ------------------------------------------------------------------ правило 3
def phone_screen(c, x=960, y=460, w=380, h=700, a=1.0, title=None):
    sr = P.phone(c, x, y, w, h, screen=(14, 16, 19), a=a)
    if title:
        draw_text(c, title, sr.centerX(), sr.top() + 60, font(26, "bold"), paint(WHITE, a), "center", tracking=3)
    return sr


def chat(c, sr, items, t, a=1.0, size=22):
    """items: [(текст, время, свой ли)] — пузыри сообщений сверху вниз."""
    y = sr.top() + 110
    f = font(size, "bold")
    for txt, tt, mine in items:
        if t < tt:
            continue
        k = ease_out(prog(t, tt, 0.2))
        lines = txt.split("\n")
        w = max(text_width(l, f, 1) for l in lines) + 40
        h = len(lines) * size * 1.35 + 22
        x = sr.right() - 20 - w if mine else sr.left() + 20
        c.drawRRect(rrect(x, y, w, h, 16), paint(BLUE if mine else DIM, a * k))
        for i, l in enumerate(lines):
            draw_text(c, l, x + 20, y + 14 + size + i * size * 1.35, f, paint(WHITE, a * k), tracking=1)
        y += h + 14


def s_call(S, sc):
    t_call = S.at("c1", "call")
    t_wh = S.at("c1", "whisper")
    t_addr = S.at("c2", "address")
    t_else = S.at("c2", "everything")
    S.cue(t_call, "dtmf", key="9")
    S.cue(t_call + 0.15, "dtmf", key="1")
    S.cue(t_call + 0.3, "dtmf", key="1")
    S.cue(t_wh, "whisper", dur=1.2)
    lines = [("SOMEONE IS IN MY HOUSE.", S.at("c2b", "someone")), ("I AM UPSTAIRS.", S.at("c2b", "upstairs")),
             ("I AM LOCKED IN.", S.at("c2b", "locked"))]
    for _, tt in lines:
        S.cue(tt, "message")

    def draw(c, t):
        sr = phone_screen(c, 760, title="EMERGENCY CALL")
        secs = max(0, int(t - t_call))
        draw_text(c, f"00:{secs:02d}", sr.centerX(), sr.top() + 100, font(22, "regular"), paint(GREEN), "center")
        K.waveform(c, sr.left() + 30, sr.top() + 180, sr.width() - 60, 40 if t >= t_wh else 6, t, t_call, col=GREEN, seed=4)
        for i, (lab, tt) in enumerate((("1. YOUR ADDRESS", t_addr), ("2. EVERYTHING ELSE", t_else))):
            if t >= tt:
                K.label(c, 1380, 300 + i * 80, lab, bg=RED if i == 0 else None, col=WHITE, size=26, a=fade(t, tt))
        y = 520
        for txt, tt in lines:
            if t >= tt:
                k = ease_out(prog(t, tt, 0.2))
                draw_text(c, "“" + txt + "”", 1180, y, font(30, "bold"), paint(WHITE, k), tracking=2)
                y += 60
    return draw


def s_silent(S, sc):
    t9 = S.at("c4", "999")
    t5 = S.at("c5", "5")
    t_pol = S.at("c6", "police")
    t_tap = S.at("c6", "tap")
    for i in range(3):
        S.cue(t9 + 0.1 + i * 0.25, "dtmf", key="9")
    S.cue(t5 - 0.6, "radio", dur=0.6)
    for i in range(2):
        S.cue(t5 + 0.15 + i * 0.3, "dtmf", key="5")
    S.cue(t_pol, "pop")
    for i in range(2):
        S.cue(t_tap + i * 0.25, "tick")

    def draw(c, t):
        K.header(c, t, sc.t0, "UNITED KINGDOM  //  THE SILENT SOLUTION")
        sr = phone_screen(c, 700)
        typed = ""
        pressed = None
        for i in range(3):
            if t >= t9 + 0.1 + i * 0.25:
                typed += "9"
                if t < t9 + 0.3 + i * 0.25:
                    pressed = "9"
        for i in range(2):
            if t >= t5 + 0.15 + i * 0.3:
                typed += "5" if i else " 5"
                if t < t5 + 0.35 + i * 0.3:
                    pressed = "5"
        Q.dial_pad(c, sr.centerX(), sr.centerY() + 120, sr.width() * 0.9, pressed=pressed, typed=typed)
        if t >= t5 - 0.6:
            K.text_bubble(c, 1340, 320, "PRESS 55", t, t5 - 0.6, size=40, tail=(-0.4, 1))
        if t >= t_pol:
            k = pop(t, t_pol)
            with xf(c, 1340, 560, s=k):
                c.drawPath(P.path_from([(-70, -80), (70, -80), (60, 30), (0, 90), (-60, 30)], True), paint(BLUE))
                draw_text(c, "POLICE", 0, 0, font(24, "bold"), paint(WHITE), "center", tracking=2)
        if t >= t_tap:
            K.text_bubble(c, 1340, 780, "TAP TWICE FOR YES", t, t_tap - 0.2, size=26, tail=(-0.4, -1))
            for i in range(2):
                tt = t_tap + i * 0.25
                if t >= tt:
                    r = (t - tt) * 200
                    if r < 120:
                        c.drawCircle(sr.centerX(), sr.centerY(), 20 + r, paint(GREEN, 1 - r / 120, stroke=4))
    return draw


def s_text911(S, sc):
    t_text = S.at("c7", "text")
    t_adv = S.at("c8", "advice")
    S.cue(t_text, "message")
    S.cue(t_text + 1.2, "message")
    items = [("SOMEONE IS IN MY HOUSE.\n12 ELM ST. UPSTAIRS\nBEDROOM. DOOR LOCKED.", t_text, True),
             ("HELP IS ON THE WAY.\nARE YOU SAFE TO TEXT?", t_text + 1.2, False)]

    def draw(c, t):
        K.header(c, t, sc.t0, "UNITED STATES  //  TEXT-TO-911")
        sr = phone_screen(c, 700, title="911")
        chat(c, sr, items, t)
        if t >= t_adv:
            k = ease_out(prog(t, t_adv, 0.4))
            K.panel(c, 1080, 360, 640, 260, "OFFICIAL ADVICE", k)
            draw_text(c, "CALL IF YOU CAN.", 1120, 470, font(40, "bold"), paint(WHITE, k), tracking=2)
            draw_text(c, "TEXT IF YOU CAN'T.", 1120, 540, font(40, "bold"), paint(RED, k), tracking=2)
    return draw


def s_bright(S, sc):
    t_b = S.at("c9", "brightness")
    t_down = S.at("c11", "downstairs")
    t_bright = S.at("c11", "bright")
    S.cue(t_b, "scrape", dur=0.6, pitch=3)
    S.cue(t_down, "steps", dur=2.0)

    def draw(c, t):
        if t < t_down - 0.1:
            k = ease_io(prog(t, t_b, 1.2))
            sr = phone_screen(c, 760)
            c.drawRRect(skia.RRect.MakeRectXY(sr, 20, 20), paint((160, 200, 255), 0.65 * (1 - k) + 0.05))
            c.drawCircle(760, 460, 380, paint((160, 200, 255), 0.18 * (1 - k), blur=120))
            K.bar(c, 1150, 480, 420, 22, 1 - k, WHITE)
            P.sun(c, 1110, 491, 50, col=WHITE, rot=t * 20)
            draw_text(c, f"BRIGHTNESS {int((1 - k) * 100):3d}%", 1150, 450, font(22, "bold"), paint(SOFT), tracking=3)
            return
        HS.draw(c, t, bed_door=0.0, bed_locked=True, dresser_x=800, chair=True)
        Q.person_sit_floor(c, 300, HS.U, HERO_S, phone=True, glow=0.25)
        sweep = math.sin((t - t_down) * 1.4) * 22 - 6
        bx, walking = walk_x(t, [(t_down, 1250), (t_down + 3, 900)])
        burglar_in(c, bx, HS.G, P.walk_pose(t * 5, 0.5) if walking else None, facing=-1, torch=1.0, ang=sweep)
        if t >= t_bright:
            for i, (x, y) in enumerate(((790, HS.G - 70), (330, HS.G - 120), (560, HS.G - 95))):
                k = pop(t, t_bright + i * 0.2)
                if k > 0:
                    with xf(c, x, y, s=k, r=t * 40):
                        c.drawPath(P.path_from([(0, -20), (6, -6), (20, 0), (6, 6), (0, 20), (-6, 6), (-20, 0), (-6, -6)], True),
                                   paint(AMBER))
    return draw


def s_line(S, sc):
    t_stay = S.at("c12", "stay")
    t_door = S.at("c12", "door")
    t_rem = S.at("c13", "remember")
    S.cue(t_door, "message")
    S.cue(t_rem, "stamp")
    items = [("STAY ON THE LINE.", t_stay, False),
             ("I WILL TELL YOU\nWHEN OFFICERS ARE\nAT YOUR DOOR.", t_door - 0.6, False)]

    def draw(c, t):
        sr = phone_screen(c, 760, title="DISPATCH")
        secs = int(t - sc.t0) + 72
        draw_text(c, f"{secs // 60:02d}:{secs % 60:02d}", sr.centerX(), sr.top() + 96, font(20, "regular"),
                  paint(GREEN), "center")
        chat(c, sr, items, t, size=24)
        if t >= t_rem:
            K.stamp(c, 1360, 480, "REMEMBER", t, t_rem, rot=-8, size=80)
    return draw


def build(S):
    L = S.at
    S.add(0.0, s_open, trans="cut")
    S.add(L("o3") - 0.15, s_hello)
    S.add(L("o4") - 0.15, s_settle)
    S.add(L("o6") - 0.1, s_fridge, trans="hard")
    S.add(L("o7") - 0.25, s_locks, push=0.02)
    S.add(S.end("o9") + 0.55, s_title, trans="hard", captions=False, push=0.03)
    S.add(L("i1") - 0.2, s_empty, trans="hard")
    S.add(L("i3") - 0.2, s_quarter, push=0.02)
    S.add(L("i4") - 0.15, s_hotprowl)
    S.add(L("i6") - 0.2, s_seven, push=0.02)
    S.add(L("i8") - 0.2, s_once)
    S.add(L("r1") - 0.05, card(1, "STAY UPSTAIRS"), trans="hard", push=0.02)
    S.add(L("a1") - 0.2, s_check)
    S.add(L("a3b") - 0.15, s_topstairs, push=0)
    S.add(L("a4") - 0.15, s_surprised)
    S.add(L("a6") - 0.15, s_bat)
    S.add(L("a8") - 0.15, s_replace)
    S.add(L("a10") - 0.15, s_prepare, push=0.02)
    S.add(L("r2") - 0.05, card(2, "LOCK IN"), trans="hard", push=0.02)
    S.add(L("b1") - 0.2, s_lockdoor)
    S.add(L("b3") - 0.15, s_coin)
    S.add(L("b5") - 0.15, s_chair)
    S.add(L("b6") - 0.15, s_dresser, push=0.02)
    S.add(L("b7b") - 0.15, s_family, push=0)
    S.add(L("b8") - 0.15, s_floor)
    S.add(L("r3") - 0.05, card(3, "SILENT CALL"), trans="hard", push=0.02)
    S.add(L("c1") - 0.2, s_call)
    S.add(L("c3") - 0.15, s_silent, push=0.02)
    S.add(L("c7") - 0.15, s_text911)
    S.add(L("c9") - 0.15, s_bright, push=0.02)
    S.add(L("c12") - 0.15, s_line)
    from . import scenes2
    scenes2.build(S)
