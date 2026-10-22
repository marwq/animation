"""Помощники анимации: ключи поза‑на‑позу, прыжки шариков, ходьба без
скольжения, камера (тряска и наезд), вспышки.
"""
import math
import random

from fx import ease_in, ease_io, ease_out

EASE = {'io': ease_io, 'in': ease_in, 'out': ease_out, 'lin': lambda t: min(max(t, 0.0), 1.0)}


def clamp(v, a=0.0, b=1.0):
    return max(a, min(b, v))


def seg(f, a, b):
    """Доля пройденного отрезка [a, b] (0..1)."""
    return clamp((f - a) / float(b - a)) if b != a else float(f >= b)


def lerp(a, b, t):
    if isinstance(a, tuple):
        return tuple(lerp(x, y, t) for x, y in zip(a, b))
    if isinstance(a, dict) and isinstance(b, dict):
        out = dict(a)
        for k, v in b.items():
            if k in a:
                out[k] = lerp(a[k], v, t)
            else:
                out[k] = v
        return out
    if isinstance(a, (int, float)) and isinstance(b, (int, float)) and not isinstance(a, bool):
        return a + (b - a) * t
    # переключатели (рот, глаза) меняются ровно на ключе, без середины
    return b if t >= 1.0 else a


def key(f, keys):
    """Значение по ключам [(кадр, значение[, 'io'|'in'|'out'|'lin']), ...].
    Между ключами — плавный переход, на ключе — удержание."""
    if f <= keys[0][0]:
        return keys[0][1]
    for i in range(len(keys) - 1):
        k0, k1 = keys[i], keys[i + 1]
        if k0[0] <= f < k1[0]:
            e = EASE[k0[2] if len(k0) > 2 else 'io']
            return lerp(k0[1], k1[1], e(seg(f, k0[0], k1[0])))
    return keys[-1][1]


def pose_keys(f, keys):
    """Как key(), но значения — словари позы; отсутствующие поля держат прошлое значение."""
    full, cur = [], {}
    for k in keys:
        cur = dict(cur)
        cur.update(k[1])
        full.append((k[0], cur) + tuple(k[2:]))
    return key(f, full)


# ------------------------------------------------------------------ шарики
def hop(f, a, b, x0, x1, h):
    """Прыжок шарика: (x, подъём). Взлёт замедляется, падение ускоряется."""
    t = seg(f, a, b)
    x = x0 + (x1 - x0) * t
    lift = 4 * h * t * (1 - t)
    return x, lift


def ball_squash(f, a, b, prep=4, land=8):
    """Сквош шарика вокруг прыжка [a, b]: подготовка, отрыв, приземление."""
    if a - prep <= f < a:
        t = seg(f, a - prep, a)
        return lerp(1.0, 1.22, ease_out(t)), lerp(1.0, 0.8, ease_out(t))
    if a <= f < a + 3:
        return 0.85, 1.17
    if a + 3 <= f < b:
        t = seg(f, a + 3, b)
        return lerp(0.85, 0.97, t), lerp(1.17, 1.04, t)
    if b <= f < b + land:
        t = (f - b) / land
        if t < 0.35:
            return lerp(1.28, 0.94, t / 0.35), lerp(0.72, 1.06, t / 0.35)
        return lerp(0.94, 1.0, (t - 0.35) / 0.65), lerp(1.06, 1.0, (t - 0.35) / 0.65)
    return 1.0, 1.0


# ------------------------------------------------------------------ ходьба больших
def walk(f, start, x0, x1, steps, dur, rig, d, lift=0.07, bob=0.03, arm=7.0, first='F'):
    """Шаги без скольжения: опорная ступня стоит на месте, вторая переносится
    с подъёмом, тело ниже всего, когда ноги шире всего.
    Возвращает поля позы или None вне ходьбы."""
    k = rig.k
    S = (x1 - x0) / steps
    close = max(4, int(dur * 0.6))
    end = start + steps * dur + close
    if f < start or f >= end:
        return None
    plant = {'F': x0, 'N': x0}
    order = [first, 'N' if first == 'F' else 'F']
    # события шагов: (кадр начала, длительность, нога, откуда, куда, тело от, тело до)
    ev = []
    for i in range(steps):
        m = order[i % 2]
        to = x0 + (i + 1) * S + (S / 2 if i < steps - 1 else 0)
        ev.append((start + i * dur, dur, m, plant[m], to, x0 + i * S, x0 + (i + 1) * S))
        plant[m] = to
    m = order[steps % 2]
    ev.append((start + steps * dur, close, m, plant[m], x1, x1, x1))
    out = {}
    plants = {'F': x0, 'N': x0}
    for (fs, du, m, frm, to, b0, b1) in ev:
        if f >= fs + du:
            plants[m] = to
            continue
        t = seg(f, fs, fs + du)
        X = b0 + (b1 - b0) * (ease_io(t) if (fs == start or b0 == b1) else t)
        if fs == ev[-2][0] and steps > 1:
            X = b0 + (b1 - b0) * ease_out(t)
        cur = dict(plants)
        cur[m] = frm + (to - frm) * ease_io(t)
        lifts = {'F': 0.0, 'N': 0.0}
        lifts[m] = lift * math.sin(math.pi * t) * (0.6 if du == close else 1.0)
        for side in ('F', 'N'):
            out['foot' + side] = ((cur[side] - X) / (d * k), -lifts[side])
        out['x'] = X
        amp = 0.4 if du == close else 1.0
        out['hip'] = (0.0, bob * amp * (1 - math.sin(math.pi * t)) * 0.5 + bob * 0.5 * amp)
        sgn = 1 if m == 'F' else -1
        a = arm * math.cos(math.pi * t) * sgn * amp
        out['armF'] = (a, 6.0, 0.0)
        out['armN'] = (-a, 6.0, 0.0)
        return out
    return None


# ------------------------------------------------------------------ камера
class Camera:
    def __init__(self):
        self.shakes = []   # (кадр, длительность, амплитуда px)
        self.zooms = []    # (кадр, длительность, +доля, (x, y))
        self.flashes = []  # (кадр, длительность, непрозрачность)

    def shake(self, f0, dur, amp):
        self.shakes.append((f0, dur, amp))

    def punch(self, f0, dur, amount, at):
        self.zooms.append((f0, dur, amount, at))

    def flash(self, f0, dur, alpha):
        self.flashes.append((f0, dur, alpha))

    def offset(self, f):
        dx = dy = 0.0
        for f0, dur, amp in self.shakes:
            if f0 <= f < f0 + dur:
                a = amp * (1 - (f - f0) / dur)
                r = random.Random(f * 7919 + f0)
                dx += r.uniform(-a, a)
                dy += r.uniform(-a, a) * 0.8
        return dx, dy

    def zoom(self, f):
        best = (0.0, (960, 540))
        for f0, dur, amount, at in self.zooms:
            if f0 <= f < f0 + dur:
                t = f - f0
                z = amount * (t / 2 if t < 2 else 1 - ease_io((t - 2) / max(1, dur - 2)))
                if z > best[0]:
                    best = (z, at)
        return best

    def flash_alpha(self, f):
        a = 0.0
        for f0, dur, alpha in self.flashes:
            if f0 <= f < f0 + dur:
                a = max(a, alpha * (1 - (f - f0) / dur))
        return a

    def apply(self, ctx, f):
        z, (cx, cy) = self.zoom(f)
        if z:
            ctx.translate(cx, cy)
            ctx.scale(1 + z, 1 + z)
            ctx.translate(-cx, -cy)
        dx, dy = self.offset(f)
        ctx.translate(dx, dy)
