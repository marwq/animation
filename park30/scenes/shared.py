"""Общие фоны и помощники Starfall Park: кэшированные декорации парка, комнаты, рация Гаса,
толпы, позы костюма, енот на плече, плашки и облачка."""
from scenes.kit import *


def floor_s(y, base=900, s=110, k=900.0):
    """Масштаб фигуры по глубине пола: на линии base — s, ближе к зрителю — крупнее."""
    return s * (1 + (y - base) / k)


def back(ctx, t, cam, key, fn, rect, scale=1.0, p=1.0):
    with layer(ctx, cam, t, p):
        bg(ctx, key, rect, fn, scale)


def room_back(ctx, t, cam, name, fn, rect=(-600, -900, 4200, 2700), scale=0.8):
    back(ctx, t, cam, name, fn, rect, scale)


# --- парк снаружи --------------------------------------------------------------------------

def sky_back(ctx, t, cam, tod="day", x0=-3000, x1=9000, sun=None, moon=None, clouds=True, lighthouse=None,
             beam=0.0, town=False, p=0.3):
    """Небо (параллакс p) и дальнее озеро с маяком (параллакс 0.5)."""
    D.rect(ctx, 0, 0, W, H, tone("#9fd27a", tod), None, 0, wob=0)
    with layer(ctx, cam, t, p):
        PK.sky(ctx, t, tod, x0, x1, sun=sun, moon=moon, clouds=clouds)
    with layer(ctx, cam, t, 0.5):
        PK.far_lake(ctx, t, tod, x0, x1, lighthouse_x=lighthouse, beam=beam, town=town)


def street_back(ctx, t, cam, tod="day", x0=-1400, x1=6000, shut=False, seed=0, sun=None, moon=None, beam=0.0,
                lamps=True, bunting=True):
    """Главная улица: витрины (кэш), площадь, фонари, гирлянды флажков."""
    sky_back(ctx, t, cam, tod, x0 - 2000, x1 + 2000, sun, moon, lighthouse=None)
    with layer(ctx, cam, t):
        bg(ctx, "street_%s_%s_%d_%d_%d" % (tod, shut, x0, x1, seed), (x0, -500, x1 - x0, 2400),
           lambda c: (PK.main_street(c, tod, x0, x1, shut=shut, seed=seed), PK.plaza(c, tod, x0, x1)), 0.6)
        if lamps:
            lx = math.ceil(x0 / 1500) * 1500 + 300
            while lx < x1:
                PK.lamp_post(ctx, lx, PK.FL + 30, 1.0, tod)
                if bunting and lx + 1500 < x1:
                    PK.bunting(ctx, lx + 70, lx + 1430, PK.FL - 360, tod=tod, seed=int(lx) % 5, t=t)
                lx += 1500


def grass_back(ctx, t, cam, tod="day", x0=-3000, x1=9000, c="#a8d878", sun=None, moon=None, beam=0.0,
               lighthouse=None):
    sky_back(ctx, t, cam, tod, x0, x1, sun, moon, lighthouse=lighthouse, beam=beam)
    with layer(ctx, cam, t):
        bg(ctx, "grass_%s_%d_%d_%s" % (tod, x0, x1, c), (x0, PK.FL - 80, x1 - x0, 1200),
           lambda cc: PK.plaza(cc, tod, x0, x1, c=c), 0.5)


# --- рация ----------------------------------------------------------------------------------

def talk_mouth(t, talk, seed=0.0):
    if talk <= 0:
        return 0.0
    return 0.4 + 0.4 * abs(math.sin(t * 9 + seed)) if math.sin(t * 2.1 + seed) > -0.6 else 0.05


def gus_radio(ctx, t, cam, talk=1.0, face="smile", tod="night", beam=0.0, stand=False):
    """Гас в комнате маяка за столом с рацией (сидит, держит тангенту у рта)."""
    room_back(ctx, t, cam, "lighthouse_%s_%.1f" % (tod, beam), lambda c: IN.lighthouse_room(c, tod, beam=beam),
              (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        x = IN.GUS_RADIO_X - 420
        mo = talk_mouth(t, talk, 1.0)
        if stand:
            p = R.stand("side", t, 3)
            p.update(face=face, mouth=mo, h1=(0.6, -3.0), hturn=0.6)
        else:
            p = sit_pose(t, 3, face)
            p.update(mouth=mo, h1=(0.6, -2.95), h2=(0.8, -1.9), hturn=0.6)
            D.rrect(ctx, x - 120, IN.FL - 330, 60, 300, 20, tone("#8a5a34", tod), D.INK, 4)
            D.rect(ctx, x - 120, IN.FL - 180, 220, 30, tone("#8a5a34", tod), D.INK, 3, wob=0)
        J = GUS.draw(ctx, x, IN.FL - 40, 112, 1, p)
        hx, hy = GUS.world(x, IN.FL - 40, 112, 1, J["hand1"])
        D.rrect(ctx, hx - 16, hy - 30, 32, 52, 10, tone("#2b2f3a", tod), D.INK, 3)
        D.curve(ctx, [(hx, hy + 20), (hx + 120, hy + 140), (IN.GUS_RADIO_X + 140, IN.FL - 300)], D.INK, 3)


def theo_radio(ctx, t, cam, talk=0.0, face="neutral", tod="night", fig=None, beam=0.0, bandit=True):
    """Тео в комнате башни у ящика с рацией (сидит на полу), Бандит рядом."""
    fig = fig or THEO_FUR
    room_back(ctx, t, cam, "tower_%s_%.1f" % (tod, beam), lambda c: IN.tower_room(c, tod, beam=beam),
              (-600, -900, 4200, 2700), 0.7)
    with layer(ctx, cam, t):
        x = IN.TOWER_CRATE_X + 420
        p = floor_sit_pose(t, 1, face)
        p.update(mouth=talk_mouth(t, talk), h1=(0.62, -1.72), hturn=-0.7)
        J = fig.draw(ctx, x, IN.FL - 40, 112, -1, p)
        hx, hy = fig.world(x, IN.FL - 40, 112, -1, J["hand1"])
        D.rrect(ctx, hx - 16, hy - 30, 32, 52, 10, tone("#2b2f3a", tod), D.INK, 3)
        if bandit:
            draw_raccoon(ctx, x + 330, IN.FL - 40, 112, -1, raccoon_pose(t, "sit", look=-0.2))


# --- костюм и енот ---------------------------------------------------------------------------

def rascal_pose(p, inner="calm", sweat=False):
    p = dict(p)
    p["inner"] = "sweat" if sweat else inner
    return p


def bandit_on_shoulder(ctx, fig, x, gy, s, f, J, t, look=0.0):
    """Бандит сидит на плече (позади головы) — рисовать ПОСЛЕ фигуры."""
    sx, sy = fig.world(x, gy, s, f, J["sh2"])
    draw_raccoon(ctx, sx - f * s * 0.15, sy + s * 0.15, s * 0.7, f, raccoon_pose(t, "sit", look=look))


# --- толпы -----------------------------------------------------------------------------------

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

SKINS = ["#f3dcc4", "#e9c7a6", "#c98d63", "#8d5a3c", "#f6e2cc", "#d9b08c", "#b07a52"]


def living_look(seed, kind=None):
    """Живой посетитель: тот же гардероб, что у зомби, но нормальная кожа и без пятен."""
    L = R.park_zombie(seed, kind)
    r = rng(seed + 77)
    L.zombie = False
    L.head = hexrgb(r.choice(SKINS))
    L.head_shade = shade(L.head, -0.13)
    L.details = tuple(d for d in L.details if d not in ("stains", "torn"))
    return L


def sniff_pose(t, seed=0):
    """Зомби принюхивается: голова вверх-вбок, покачивание."""
    p = zombie_idle(t, seed)
    p.update(neck=-0.35 + 0.1 * math.sin(t * 6 + seed), htilt=0.2 * math.sin(t * 3 + seed), mouth=0.2,
             a1=(0.3, -0.1), a2=(0.2, -0.1), lean=0.05)
    return p


def sniff_lines(ctx, x, y, t, s=1.0, a=1.0):
    """Значок «нюх»: три волнистые линии к носу."""
    for k in range(3):
        ph = (t * 1.5 + k / 3) % 1
        xx = x - 60 * s - ph * 80 * s
        D.curve(ctx, [(xx, y - 20 * s + k * 18 * s), (xx + 20 * s, y - 30 * s + k * 18 * s),
                      (xx + 40 * s, y - 20 * s + k * 18 * s)], hexrgb("#9fc86a"), 5 * s, a * (1 - ph))


# --- плашки и облачка --------------------------------------------------------------------------

def speech(ctx, x, y, txt, t, t0, size=60, w=None, c="#1c3f7c", tail=(-1, 1), dur=99.0, typed=True):
    """Облачко реплики с печатающимся текстом; '\n' — перенос строки."""
    k = t - t0
    if k < 0 or k > dur:
        return
    sc = ease_out_back(clamp(k / 0.25))
    lines = txt.split("\n")
    total = sum(len(L) for L in lines)
    n = int(clamp(k / max(0.4, total * 0.04)) * total) if typed else total
    w = w or max(D.text_width(ctx, L, size, D.FONT_TITLE) for L in lines) + 70
    lh = size * 1.15
    h = size * 1.7 + lh * (len(lines) - 1)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(sc, sc)
    D.rrect(ctx, -w / 2, -h / 2, w, h, min(h, size * 1.7) * 0.4, hexrgb("#fff6d8"), D.INK, 6)
    tx, ty = tail
    D.poly(ctx, [(tx * w * 0.2 - 24, h / 2 - 4), (tx * w * 0.2 + 24, h / 2 - 4), (tx * w * 0.32, h / 2 + 50)],
           hexrgb("#fff6d8"), D.INK, 6, wob=0)
    D.rect(ctx, tx * w * 0.2 - 30, h / 2 - 12, 60, 12, hexrgb("#fff6d8"), None, 0, wob=0)
    y0 = -lh * (len(lines) - 1) / 2 + size * 0.35
    for i, L in enumerate(lines):
        D.text(ctx, L[:max(0, n)], 0, y0 + i * lh, size, D.FONT_TITLE, hexrgb(c))
        n -= len(L)
    ctx.restore()


def clock_badge(ctx, txt, t, x=W - 260, y=150, c="#ff4a3a"):
    D.rrect(ctx, x - 170, y - 60, 340, 120, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, txt, x, y + 32, 84, D.FONT_TITLE, hexrgb(c))


def counter_badge(ctx, label, val, x, y, c="#ffe36a", w=420):
    D.rrect(ctx, x - w / 2, y - 60, w, 120, 24, hexrgb("#0e1410"), D.INK, 6)
    D.text(ctx, label, x - w / 2 + 24, y + 14, 40, D.FONT_TITLE, hexrgb("#cfd8e0"), "left")
    D.text(ctx, str(val), x + w / 2 - 24, y + 28, 80, D.FONT_TITLE, hexrgb(c), "right")


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


def speakers(ctx, t, pts, k=1.0, c="#fff6d8"):
    """Динамики-рупоры с расходящимися волнами звука (экранные точки)."""
    for i, (x, y) in enumerate(pts):
        D.poly(ctx, [(x - 20, y - 24), (x + 50, y - 50), (x + 50, y + 50), (x - 20, y + 24)], hexrgb("#c9d0d6"),
               D.INK, 4, wob=0)
        D.rect(ctx, x - 50, y - 24, 30, 48, hexrgb("#5a606c"), D.INK, 4, wob=0)
        if k > 0:
            for j in range(3):
                r = 50 + ((t * 120 + j * 40 + i * 20) % 120)
                ctx.arc(x + 50, y, r, -math.pi * 0.3, math.pi * 0.3)
                D.col(ctx, hexrgb(c), k * (1 - (r - 50) / 120))
                ctx.set_line_width(6)
                ctx.stroke()


def place_tag(ctx, txt, t, x=70, y=210, c="#fff6d8", bgc="#1c3f7c"):
    k = ease_out_back(clamp(t / 0.35))
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(k, k)
    D.rrect(ctx, 0, -50, 40 + 34 * len(txt), 100, 24, hexrgb(bgc), D.INK, 6)
    D.text(ctx, txt, 20 + 17 * len(txt), 22, 62, D.FONT_TITLE, hexrgb(c))
    ctx.restore()


def heads_sea(ctx, t, x0, x1, y0, y1, n=60, seed=1, s0=40, s1=110, up=1.0, arms=0.6, glow=0.0, kinds=None,
              side=0.0):
    """Море голов (вид спереди): ряды от дальнего y0 (масштаб s0) к ближнему y1 (s1); up — смотрят
    вверх; arms — доля тянущих руки; glow — светящиеся глаза в темноте."""
    r = rng(seed)
    rows = []
    for i in range(n):
        y = r.uniform(y0, y1)
        rows.append((y, r.uniform(x0, x1), i))
    rows.sort()
    for y, x, i in rows:
        k = (y - y0) / max(1, y1 - y0)
        s = lerp(s0, s1, k)
        L = R.park_zombie(seed * 1000 + i, r.choice(kinds) if kinds else None)
        sw = math.sin(t * 2 + i) * 0.06 * s
        if r.random() < arms:
            for side in (-1, 1):
                ax = x + side * s * 0.45
                D.line(ctx, ax, y + s * 0.6, ax + side * s * 0.15 + sw, y - s * (0.7 + 0.3 * up), D.INK, max(3, s * 0.12))
                D.circle(ctx, ax + side * s * 0.15 + sw, y - s * (0.75 + 0.3 * up), s * 0.1, L.head, D.INK, 2)
        D.rect(ctx, x - s * 0.42, y + s * 0.45, s * 0.84, s * 0.9, L.body, D.INK, max(2, s * 0.04), wob=0)
        R.Fig(L).head_only(ctx, x + sw * 0.3, y, s, 1 if side >= 0 else -1,
                           {"view": "front", "mouth": 0.6 + 0.3 * math.sin(t * 4 + i), "hturn": abs(side) * 0.7,
                            "look": (abs(side), -up * (1 - abs(side))), "neck_line": False, "blink": 0})
        if glow > 0:
            zombie_glow_eyes(ctx, x + sw * 0.3 + side * s * 0.15, y - s * 0.05, s * 0.32, glow)


def heart(ctx, x, y, r, a=1.0):
    pts = []
    for i in range(40):
        u = i / 40 * TAU
        pts.append((x + r * 0.06 * 16 * math.sin(u) ** 3,
                    y - r * 0.06 * (13 * math.cos(u) - 5 * math.cos(2 * u) - 2 * math.cos(3 * u) - math.cos(4 * u))))
    D.poly(ctx, pts, hexrgb("#f05a8a"), D.INK, 3, wob=0, alpha=a)


def memory_tint(ctx, a=1.0):
    """Флешбэк: тёплая сепия и тёмные края."""
    D.rect(ctx, 0, 0, W, H, hexrgb("#d8a860"), None, 0, wob=0, alpha=0.22 * a)
    g = cairo.RadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62)
    g.add_color_stop_rgba(0, 0.1, 0.06, 0.02, 0.0)
    g.add_color_stop_rgba(1, 0.1, 0.06, 0.02, 0.6 * a)
    ctx.set_source(g)
    ctx.paint()


def draw_lying(ctx, fig, x, gy, s, f, p, k_up, t=0.0):
    """Лежит на спине, ноги вытянуты (k_up=0) → садится (k_up=1).
    Лёжа: стойка, повёрнутая на 90° вокруг таза; садясь — поза «сидя на полу» с поворотом корпуса."""
    if k_up <= 0:
        q = R.stand("side", t, 1)
        q.update({k: v for k, v in p.items() if k in ("face", "blink", "look", "mouth")})
        q.update(a1=(0.1, 0.2), a2=(-0.1, 0.2))
        hip_y = gy - 0.12 * s
        ctx.save()
        ctx.translate(x, hip_y)
        ctx.rotate(-f * math.pi / 2)
        ctx.translate(-x, -(gy - R.HIP_H * s))
        J = fig.draw(ctx, x, gy, s, f, q)
        ctx.restore()
        return J
    ang = -1.3 * (1 - k_up)
    hip_y = gy - 0.12 * s
    ctx.save()
    ctx.translate(x, hip_y)
    ctx.rotate(f * ang)
    ctx.translate(-x, -hip_y)
    J = fig.draw(ctx, x, gy, s, f, p)
    ctx.restore()
    return J


def stink(ctx, x, y, t, s=1.0, a=1.0, c="#b8c860"):
    """Волны запаха: зелёно-жёлтые завитки поднимаются вверх."""
    for k in range(5):
        ph = (t * 0.7 + k / 5) % 1
        xx = x + math.sin(k * 2.3) * 60 * s
        yy = y - ph * 260 * s
        D.curve(ctx, [(xx, yy), (xx + 30 * s, yy - 30 * s), (xx - 10 * s, yy - 60 * s), (xx + 20 * s, yy - 90 * s)],
                hexrgb(c), 9 * s, a * (1 - ph) * 0.9)
