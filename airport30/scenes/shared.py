"""Общие фоны и помощники аэропорта: кэшированные декорации, толпы с чемоданами, позы."""
from scenes.kit import *


def floor_s(y, base=900, s=110, k=900.0):
    """Масштаб фигуры по глубине пола: на линии base — s, ближе к зрителю — крупнее."""
    return s * (1 + (y - base) / k)


def back(ctx, t, cam, key, fn, rect, scale=1.0, p=1.0):
    with layer(ctx, cam, t, p):
        bg(ctx, key, rect, fn, scale)


# --- снаружи ---------------------------------------------------------------------------------

def apron_back(ctx, t, cam, tod="day", power=1.0, sun=None, moon=None, clouds=True, x0=AP.X0, x1=AP.X1,
               scale=0.6, army=0.0):
    with layer(ctx, cam, t, 0.3):
        AP.sky(ctx, t, tod, sun=sun, moon=moon, clouds=clouds)
    with layer(ctx, cam, t):
        bg(ctx, "field_%s_%s_%d_%d" % (tod, power, x0, x1), (x0, -200, x1 - x0, 3000),
           lambda c: AP.field(c, tod, power, x0, x1), scale)
        if army > 0:
            AP.army_lights(ctx, t, x0, x1, AP.HZ - 70, army)


def map_view(ctx, t, x, y, s, tod="day", army=0.0, labels=True, ang=0.0, squash=1.0):
    """Карта аэропорта в кадре: центр карты (0, 0) в экранной точке (x, y)."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s * squash)
    ctx.rotate(ang)
    bg(ctx, "map_%s_%s" % (tod, labels), (-4200, -2600, 8800, 5200),
       lambda c: AP.airport_map(c, tod, labels=labels, army=0.0), 0.35)
    if army > 0:
        _army_ring(ctx, t, army)
    ctx.restore()


def _army_ring(ctx, t, a):
    per = 2 * (7900 + 2600)
    n = 70
    for i in range(n):
        u = i / n * per
        if u < 7900:
            px, py = -3900 + u, -900
            continue
        elif u < 7900 + 2600:
            px, py = 4000, -900 + (u - 7900)
        elif u < 2 * 7900 + 2600:
            px, py = 4000 - (u - 7900 - 2600), 1700
        else:
            px, py = -3900, 1700 - (u - 2 * 7900 - 2600)
        fl = 0.6 + 0.4 * math.sin(t * 3 + i)
        D.radial(ctx, px, py, 140, "#ffe9a0", 0.6 * a * fl, 0)
        D.circle(ctx, px, py, 16, hexrgb("#fff6d8"), None, 0, alpha=a)


# --- терминал ------------------------------------------------------------------------------

def term_back(ctx, t, cam, tod="day", power=1.0, letter="A", x0=-1400, x1=5200, scale=0.8, shops=None):
    k = "conc_%s_%s_%s_%d_%d_%s" % (tod, power, letter, x0, x1, sorted(shops.items()) if shops else "d")
    back(ctx, t, cam, k, lambda c: TM.concourse(c, tod, power, letter, x0, x1, shops), (x0, -700, x1 - x0, 2300),
         scale)


def hall_back(ctx, t, cam, tod="day", power=1.0, scale=0.7):
    back(ctx, t, cam, "hall_%s_%s" % (tod, power), lambda c: TM.main_hall(c, tod, power),
         (-1400, -1500, 6000, 3200), scale)


def room_back(ctx, t, cam, name, fn, rect=(-1400, -1500, 6200, 3200), scale=0.8):
    back(ctx, t, cam, name, fn, rect, scale)


# --- зомби аэропорта ------------------------------------------------------------------------

def dragger(ctx, x, gy, s, f, t, seed, kind=None, walk=True, bag_c=None, speed=60.0):
    """Зомби, волочащий чемодан на колёсиках."""
    look = R.zombie_look(seed, kind)
    fig = R.Fig(look)
    if walk:
        p = R.gait((t * speed / s) / R.GAITS["shamble"]["L"] + (seed % 7) * 0.13, "shamble", "side", seed)
    else:
        p = zombie_idle(t, seed % 97)
    p.update(h2=(-0.55, -1.75), mouth=0.4 + 0.3 * math.sin(t * 3 + seed))
    J = fig.draw(ctx, x, gy, s, f, p)
    hx, hy = fig.world(x, gy, s, f, J["hand2"])
    r = rng(seed)
    c = bag_c or r.choice(RM.BAG_COLS)
    ang = -0.35 * f
    suitcase(ctx, hx - f * s * 0.32, gy, s / 120 * 1.1, c, ang, handle=False)
    D.line(ctx, hx, hy, hx - f * s * 0.32 + f * s * 0.05, gy - s * 1.05, D.INK, max(3, s * 0.05))


def reach_pose(t, seed, k=1.0):
    p = zombie_reach(t, seed)
    p.update(a1=(1.35 + 0.15 * math.sin(t * 3 + seed), -0.2), a2=(1.2, -0.1), lean=0.22 * k)
    return p


def crowd_floor(ctx, t, seed, n, x0, x1, y0, y1, s0, s1, vx=(0.0, 0.0), face=None, kinds=None, pose_fn=None,
                filt=None, lod=24.0):
    key = (seed, n, x0, x1, y0, y1, s0, s1, vx, face, tuple(kinds) if kinds else None)
    m = _CROWDS.get(key)
    if m is None:
        m = make_crowd(seed, n, x0, x1, y0, y1, s0, s1, vx, face, kinds)
        _CROWDS[key] = m
    draw_crowd(ctx, m, t, pose_fn, lod=lod, filt=filt)
    return m


_CROWDS = {}


# --- позы и мелочи ---------------------------------------------------------------------------

def ride_pose(t, seed=1, face="happy"):
    """Сидит на ленте, колени вверх, руки на коленях."""
    p = floor_sit_pose(t, seed, face, hug=True)
    p["hip"] = (p["hip"][0], p["hip"][1] + 0.04 * math.sin(t * 9))
    return p


def tray(ctx, x, y, s=1.0, c="#7d868f"):
    """Серый пластиковый лоток досмотра."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    D.poly(ctx, [(-120, -60), (120, -60), (100, 0), (-100, 0)], hexrgb(c), D.INK, 5, wob=0)
    D.line(ctx, -110, -46, 110, -46, shade(hexrgb(c), -0.2), 4)
    ctx.restore()


def headset_on(ctx, x, y, s=1.0):
    """Наушники пилота поверх головы (для крупных планов)."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    ctx.arc(0, -10, 62, math.pi * 1.05, math.pi * 1.95)
    D.col(ctx, D.INK)
    ctx.set_line_width(16)
    ctx.stroke()
    for k in (-1, 1):
        D.ellipse(ctx, k * 60, 0, 20, 30, hexrgb("#2b2f3a"), D.INK, 4)
    ctx.restore()


def speech(ctx, x, y, txt, t, t0, size=60, w=None, c="#1c3f7c", tail=(-1, 1), dur=99.0, typed=True):
    """Облачко реплики с печатающимся текстом."""
    k = t - t0
    if k < 0 or k > dur:
        return
    sc = ease_out_back(clamp(k / 0.25))
    n = int(clamp(k / max(0.4, len(txt) * 0.04)) * len(txt)) if typed else len(txt)
    w = w or D.text_width(ctx, txt, size, D.FONT_TITLE) + 70
    h = size * 1.7
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(sc, sc)
    D.rrect(ctx, -w / 2, -h / 2, w, h, h * 0.4, hexrgb("#fff6d8"), D.INK, 6)
    tx, ty = tail
    D.poly(ctx, [(tx * w * 0.2 - 24, h / 2 - 4), (tx * w * 0.2 + 24, h / 2 - 4), (tx * w * 0.32, h / 2 + 50)],
           hexrgb("#fff6d8"), D.INK, 6, wob=0)
    D.rect(ctx, tx * w * 0.2 - 30, h / 2 - 12, 60, 12, hexrgb("#fff6d8"), None, 0, wob=0)
    D.text(ctx, txt[:n], 0, size * 0.35, size, D.FONT_TITLE, hexrgb(c))
    ctx.restore()


def clock_badge(ctx, txt, t, x=W - 260, y=150, c="#ff4a3a"):
    D.rrect(ctx, x - 170, y - 60, 340, 120, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, txt, x, y + 32, 84, D.FONT_TITLE, hexrgb(c))


def counter_badge(ctx, label, val, x, y, c="#ffe36a", w=420):
    D.rrect(ctx, x - w / 2, y - 60, w, 120, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, label, x - w / 2 + 24, y + 14, 40, D.FONT_TITLE, hexrgb("#cfd8e0"), "left")
    D.text(ctx, str(val), x + w / 2 - 24, y + 28, 80, D.FONT_TITLE, hexrgb(c), "right")


def walt_radio(ctx, t, cam, talk=1.0, face="smile", tod="night", parrot_talk=0.0, sit=True):
    """Уолт у рации на веранде, попугай на жердочке."""
    with layer(ctx, cam, t):
        bg(ctx, "walt_%s" % tod, (-1400, -1400, 5000, 3300), lambda c: OS.walt_place(c, tod), 0.6)
        mo = 0.4 + 0.4 * abs(math.sin(t * 9)) if talk > 0 and math.sin(t * 2.1) > -0.6 else 0.0
        if sit:
            p = sit_pose(t, 3, face)
            p.update(mouth=mo, h1=(0.62, -2.95), h2=(0.75, -1.95), hturn=0.6)
            WALT.draw(ctx, OS.RADIO_X - 260, OS.FL - 40, 115, 1, p)
        else:
            p = R.stand("side", t, 3)
            p.update(mouth=mo, face=face, h1=(0.62, -2.95), hturn=0.6)
            WALT.draw(ctx, OS.RADIO_X - 260, OS.FL - 40, 115, 1, p)
        draw_parrot(ctx, OS.PERCH_X, OS.FL - 336, 110, -1, t, talk=parrot_talk)
        if talk > 0:
            D.circle(ctx, OS.RADIO_X - 60, OS.FL - 290, 8, hexrgb("#ff4a3a"), None, 0)


def danny_radio(ctx, t, cam, talk=0.0, face="neutral", fig=None, tod="night", power=1.0):
    """Дэнни в кабине лайнера у выхода B4 с наушниками, в правой руке тангента."""
    fig = fig or DANNY
    cockpit_scene(ctx, t, cam, tod, power)
    with layer(ctx, cam, t):
        mo = 0.4 + 0.4 * abs(math.sin(t * 9)) if talk > 0 and math.sin(t * 2.3) > -0.6 else 0.0
        fig.head_only(ctx, -420, 520, 250, 1, {"view": "front", "face": face, "mouth": mo, "neck_line": True,
                                               "hturn": 0.25})
        headset_on(ctx, -420, 520, 2.2)
        D.rect(ctx, -560, 640, 280, 400, fig.look.body, D.INK, 6, wob=0)
        if "hivis" in fig.look.details:
            D.rect(ctx, -560, 640, 110, 400, hexrgb("#ff8a1c"), D.INK, 4, wob=0)
            D.rect(ctx, -390, 640, 110, 400, hexrgb("#ff8a1c"), D.INK, 4, wob=0)
            for yy in (760, 860):
                D.rect(ctx, -560, yy, 110, 22, hexrgb("#e9eef2"), None, 0, wob=0)
                D.rect(ctx, -390, yy, 110, 22, hexrgb("#e9eef2"), None, 0, wob=0)


def cockpit_scene(ctx, t, cam, tod="night", power=1.0, view=None):
    def default_view(c):
        SEA.sky(c, -1200, -400, 2400, 700, tod)
        if tod in ("night", "deepnight"):
            SEA.stars(c, -1200, -400, 2400, 400, t, 3, 1.0)
        D.rect(c, -1200, 60, 2400, 200, tone("#5a636e", tod), None, 0, wob=0)
        D.poly(c, [(-300, -40), (300, -40), (380, 60), (-380, 60)], tone("#c9d0d6", tod), D.INK, 4, wob=0)
    with layer(ctx, cam, t):
        RM.cockpit(ctx, tod, power, view or default_view, t)


SKINS = ["#f3dcc4", "#e9c7a6", "#c98d63", "#8d5a3c", "#f6e2cc", "#d9b08c", "#b07a52"]


def living_look(seed, kind=None):
    """Живой пассажир/сотрудник: тот же гардероб, что у зомби, но нормальная кожа и без пятен."""
    L = R.zombie_look(seed, kind)
    r = rng(seed + 77)
    L.zombie = False
    L.head = hexrgb(r.choice(SKINS))
    L.head_shade = shade(L.head, -0.13)
    L.details = tuple(d for d in L.details if d not in ("stains", "torn"))
    return L


def rule_card(ctx, t, num, lines, t0=0.0, x=W / 2, y=H / 2 - 20, rot=-0.04):
    """Страница блокнота: «RULE #N» и надпись от руки, строки появляются по очереди."""
    k = ease_out_back(clamp((t - t0) / 0.35))
    if k <= 0:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.scale(k, k)
    D.rect(ctx, -520, -300, 1040, 600, hexrgb("#fbf3dc"), D.INK, 6, wob=0)
    for j in range(7):
        D.line(ctx, -500, -170 + j * 72, 500, -170 + j * 72, hexrgb("#a8c8e8"), 2)
    D.line(ctx, -420, -300, -420, 300, hexrgb("#e8a0a0"), 3)
    for j in range(5):
        D.circle(ctx, -480, -230 + j * 110, 14, hexrgb("#2b2f3a"), None, 0)
    D.text(ctx, "RULE #%d" % num, -380, -190, 90, D.FONT_TITLE, hexrgb("#e8423c"), "left")
    for i, ln in enumerate(lines):
        n = int(clamp((t - t0 - 0.5 - i * 0.8) / 0.8) * len(ln))
        D.text(ctx, ln[:n], -380, -60 + i * 110, 84, D.FONT_HAND, hexrgb("#2a3a7a"), "left")
    ctx.restore()


def mannequin_look(seed, c="#e8423c", dress=False):
    kw = dict(R.MANNEQUIN)
    kw.update(body=c, seed=seed)
    if dress:
        kw.update(style="dress", length=0.4)
    return R.Look(**kw)


def speakers(ctx, t, pts, k=1.0, c="#fff6d8"):
    """Потолочные динамики с расходящимися волнами звука (экранные точки)."""
    for i, (x, y) in enumerate(pts):
        D.rrect(ctx, x - 40, y - 24, 80, 48, 10, hexrgb("#2b2f3a"), D.INK, 4)
        D.circle(ctx, x, y, 16, hexrgb("#5a606c"), None, 0)
        if k > 0:
            for j in range(3):
                r = 50 + ((t * 120 + j * 40 + i * 20) % 120)
                ctx.arc(x, y + 10, r, math.pi * 0.2, math.pi * 0.8)
                D.col(ctx, hexrgb(c), k * (1 - (r - 50) / 120))
                ctx.set_line_width(6)
                ctx.stroke()
