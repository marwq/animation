"""Звук ролика «What If Earth Spun Faster and Faster?». Всё синтезируется: ветер на вершине, дыхание героя,
часы, которые тикают всё чаще (каждые 1/12 оборота Земли), гул вращения (высота тона растёт со скоростью),
колокольчики на рассветах, музыка. Без чужих записей и без голоса.

Моменты (рассветы, полдни, закаты, разгон) берутся из spin/story.py, поэтому звук совпадает с картинкой.
Ролик длинный, звук считается окнами: каждое с запасом по краям (хвосты реверберации и фильтров), источники
зависят только от абсолютного времени, соседние окна стыкуются перекрёстком 2·XF.

    python3 spin/audio.py 0 60           -> spin/out/audio/seg_0_60.wav (окно с запасом ±XF)
    python3 spin/audio.py --cut 0 60     -> spin/out/min/audio_0_60.wav (кусок из готовых окон)
"""
import json
import re
import sys
import wave
import zlib
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sosfilt_zi

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import story  # noqa: E402

SR = 48000
DUR = story.DUR
MARGIN = 6.0
XF = 0.25
BREATH = 3.4  # с: период дыхания (как облачка пара в main.js)

# --- время истории: те же интегралы, что в story.py / timeline.js ------------------------------------------------
_table, _ = story.integrate()
_T = np.array([r[0] for r in _table])
_TAU = np.array([r[1] for r in _table])
_TURNS = np.array([r[2] for r in _table])
_P = np.array([r[3] for r in _table])
_K = np.array([story.k_at(t) for t in _T])
# гул вращения: частота растёт как корень из скорости вращения; фаза — интеграл от начала ролика
_HUM_F = 34.0 * np.sqrt(story.SPIN['P0'] / _P)
_HUM_PH = np.concatenate([[0.0], np.cumsum(_HUM_F[:-1] * np.diff(_T))])


def at(arr, tt):
    return np.interp(tt, _T, arr)


def events_named(name):
    out = []
    prev = None
    for t, tau, turns, P in _table[::4]:
        sol = (story.TAU0 + 24 * turns) % 24
        h = {'sunrise': 6.0, 'noon': 12.0, 'sunset': 18.0}[name]
        if prev is not None and prev < h <= sol:
            out.append(t)
        prev = sol
    return out


SUNRISES = events_named('sunrise')
NOONS = events_named('noon')
SUNSETS = events_named('sunset')
# тиканье: каждые 1/12 оборота относительно Солнца («два часа» местного времени), с 29-й секунды
TICKS = []
_q = np.floor(_TURNS * 12)
for i in np.nonzero(np.diff(_q) > 0)[0]:
    if _T[i] > 29:
        TICKS.append((float(_T[i + 1]), int(_q[i + 1])))


# --- фильтры и шум ----------------------------------------------------------------------------------------------
def _sos(kind, f, order=2):
    return butter(order, f, btype=kind, fs=SR, output='sos')


def lp(x, f, order=2):
    return sosfilt(_sos('low', min(f, SR * 0.45), order), x)


def hp(x, f, order=2):
    return sosfilt(_sos('high', f, order), x)


def bp(x, lo, hi, order=2):
    return sosfilt(_sos('band', [lo, min(hi, SR * 0.45)], order), x)


def vlp(x, cutoff, order=2, block=256):
    y = np.empty_like(x)
    zi = None
    for i in range(0, len(x), block):
        sos = _sos('low', float(np.clip(cutoff[min(i, len(cutoff) - 1)], 30, SR * 0.45)), order)
        if zi is None:
            zi = sosfilt_zi(sos) * x[0]
        y[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return y


def vbp(x, center, q=1.2, block=256):
    """Полоса с плавающим центром (для свиста ветра и подъёма)."""
    y = np.empty_like(x)
    zi = None
    for i in range(0, len(x), block):
        c = float(np.clip(center[min(i, len(center) - 1)], 60, SR * 0.4))
        sos = _sos('band', [c / (1 + 0.5 / q), c * (1 + 0.5 / q)])
        if zi is None:
            zi = np.zeros((sos.shape[0], 2))
        y[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return y


def rng_for(name, a=0.0):
    return np.random.default_rng(zlib.crc32(f'{name}:{round(a, 3)}'.encode()))


def pink(r, n):
    w = np.fft.rfft(r.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    w[1:] /= np.sqrt(f[1:])
    w[0] = 0
    x = np.fft.irfft(w, n)
    return x / np.std(x)


def slow(r, n, hz):
    """Медленный случайный сигнал ~N(0,1) с полосой до hz."""
    x = lp(r.standard_normal(n), hz, 2)
    return x / (np.std(x) + 1e-12)


def smooth(x):
    x = np.clip(x, 0, 1)
    return x * x * (3 - 2 * x)


def env(points, tt):
    xs, ys = zip(*points)
    return np.interp(tt, xs, ys)


def make_ir(rt60, length, bright, dark, seed):
    r = np.random.default_rng(seed)
    n = int(length * SR)
    tl = np.arange(n) / SR
    decay = 10 ** (-3 * tl / rt60)
    out = []
    for _ in range(2):
        x = r.standard_normal(n) * decay
        mix = np.exp(-tl / (rt60 * 0.25))
        out.append(lp(x, bright) * mix + lp(x, dark) * (1 - mix))
    ir = np.stack(out)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


IR_HALL = make_ir(4.8, 6.0, 6500, 1800, 21)


def reverb(x, ir, wet):
    if x.ndim == 1:
        x = np.vstack([x, x])
    n = x.shape[1]
    return np.stack([fftconvolve(x[c], ir[c])[:n] for c in range(2)]) * wet


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


SAW = np.zeros(4096)
for _k in range(1, 20):
    SAW += np.sin(2 * np.pi * _k * np.arange(4096) / 4096) / _k
SAW /= np.max(np.abs(SAW))


def osc(freq, tt, table=SAW, phase0=0.0):
    ph = (phase0 + freq * tt) % 1.0
    idx = ph * len(table)
    i0 = idx.astype(int)
    k = idx - i0
    return table[i0 % len(table)] * (1 - k) + table[(i0 + 1) % len(table)] * k


def place(out, tt, sig, start, gain=1.0, pan=0.0):
    i0 = int(round((start - tt[0]) * SR))
    a, b = max(0, i0), min(len(tt), i0 + len(sig))
    if b <= a:
        return
    piece = sig[a - i0:b - i0] * gain
    out[0, a:b] += piece * np.cos((pan + 1) * np.pi / 4)
    out[1, a:b] += piece * np.sin((pan + 1) * np.pi / 4)


def lapse(tt):
    """0 — реальное время, 1 — 1 с = 30 мин (логарифмически)."""
    return np.clip(np.log10(np.maximum(at(_K, tt) * 3600, 1)) / np.log10(1800), 0, 1)


def spin_amount(tt):
    """0 — обычные сутки, 1 — предел (2,2 ч)."""
    P = at(_P, tt)
    return np.clip(np.log(story.SPIN['P0'] / P) / np.log(story.SPIN['P0'] / story.SPIN['P_min']), 0, 1)


# --- музыка ----------------------------------------------------------------------------------------------------
def cycle(t0, t1, chords, period):
    out, t, i = [], t0, 0
    while t < t1 - 0.5:
        out.append((t, min(t1, t + period + 0.8), chords[i % len(chords)]))
        t += period
        i += 1
    return out


# ми минор, воздух и простор: сначала один долгий аккорд (реальное время), с ускорением — движение
CHORDS = [(-1.0, 25.0, [40, 52, 59, 66, 71])]
CHORDS += [(23.5, 37.0, [36, 48, 55, 62, 64, 71])]
CHORDS += cycle(36.0, 120.5, [[40, 52, 59, 62, 66, 71], [36, 48, 55, 59, 64, 67], [43, 50, 55, 59, 62, 66], [38, 50, 57, 62, 64, 69]], 6.0)
# потоп: светлее и шире, но с тревогой (минорная субдоминанта)
CHORDS += cycle(120.0, 168.5, [[33, 45, 52, 57, 60, 64], [36, 48, 55, 60, 62, 67], [31, 43, 50, 55, 59, 62], [38, 50, 57, 60, 62, 66]], 6.0)
# напряжение перед землетрясением и сами толчки: низкие кластеры
CHORDS += [(168.0, 180.5, [28, 40, 47, 52, 53, 59])]
CHORDS += cycle(180.0, 240.5, [[28, 40, 47, 52, 55, 59], [29, 41, 48, 53, 56, 60], [31, 43, 50, 55, 58, 62], [26, 38, 45, 50, 53, 57]], 7.0)
# легче: вес уходит
CHORDS += cycle(240.0, 300.5, [[45, 57, 64, 68, 71, 76], [42, 54, 61, 66, 69, 73], [38, 50, 57, 62, 66, 69], [40, 52, 59, 64, 68, 71]], 7.0)
# «запомните это число»: загадка
CHORDS += cycle(300.0, 360.5, [[37, 49, 56, 61, 64, 68], [42, 54, 61, 64, 66, 69], [35, 47, 54, 59, 63, 66], [40, 52, 59, 62, 64, 71]], 7.0)
# прыжки, напряжение растёт
CHORDS += cycle(360.0, 420.5, [[38, 50, 57, 62, 65, 69], [41, 53, 60, 65, 69, 72], [36, 48, 55, 60, 64, 67], [43, 55, 62, 65, 67, 74]], 6.0)
CHORDS += cycle(420.0, 452.5, [[40, 52, 59, 64, 67, 71], [36, 48, 55, 60, 64, 67], [38, 50, 57, 62, 66, 69], [43, 50, 55, 59, 62, 67]], 5.0)
CHORDS += [(452.0, 462.5, [52, 59, 64, 66, 71, 76]), (461.5, 481.0, [28, 40, 47, 52, 59, 64, 68, 71, 76])]
# подъём: простор
CHORDS += cycle(480.0, 540.5, [[33, 45, 52, 57, 61, 64, 69], [38, 50, 57, 61, 64, 66, 73], [35, 47, 54, 59, 62, 66, 71], [40, 52, 59, 64, 66, 68, 71]], 8.0)
# кольцо: лидийское мерцание
CHORDS += cycle(540.0, 600.5, [[36, 48, 55, 59, 62, 66, 71], [38, 50, 57, 62, 66, 69, 74], [31, 43, 50, 55, 59, 62, 66], [33, 45, 52, 57, 60, 64, 71]], 9.0)
# предел Роша: загадка
CHORDS += cycle(600.0, 660.5, [[32, 44, 51, 56, 59, 63], [37, 49, 56, 61, 63, 68], [30, 42, 49, 54, 58, 61], [35, 47, 54, 59, 62, 66]], 9.0)
# комки растут
CHORDS += cycle(660.0, 720.5, [[40, 52, 59, 64, 67, 71], [43, 55, 62, 67, 71, 74], [38, 50, 57, 62, 65, 69], [45, 52, 57, 61, 64, 69]], 7.0)
# рождение луны
CHORDS += cycle(720.0, 780.5, [[41, 53, 60, 65, 69, 72], [45, 57, 64, 69, 72, 76], [43, 55, 62, 67, 71, 74], [38, 50, 57, 62, 65, 69]], 8.0)
CHORDS += [(780.0, 804.0, [36, 48, 55, 62, 67])]
# на луне
CHORDS += cycle(803.0, 840.5, [[33, 45, 52, 57, 64, 69], [29, 41, 48, 53, 60, 65], [31, 43, 50, 55, 62, 67], [36, 48, 55, 60, 64, 67]], 9.0)
# разгадка
CHORDS += cycle(840.0, 893.5, [[38, 50, 57, 62, 65, 69], [34, 46, 53, 58, 62, 65], [41, 53, 60, 65, 69, 72], [36, 48, 55, 60, 64, 67]], 7.5)
CHORDS += [(893.0, 901.0, [43, 50, 55, 60, 62, 67]), (900.0, 909.0, [40, 52, 59, 64, 68, 71, 76])]
# финал
CHORDS += cycle(908.0, 956.5, [[40, 52, 59, 64, 68, 71], [37, 49, 56, 61, 64, 68], [33, 45, 52, 57, 61, 64], [35, 47, 54, 59, 63, 66]], 8.0)
CHORDS += [(956.0, 970.0, [28, 40, 47, 52, 56, 59, 64, 71])]
# мотив рассвета: на каждом рассвете — восходящая фраза колокольчиков (дальше — короче, когда дни сжимаются)
MOTIF = [(0.0, 76), (0.32, 79), (0.64, 83), (1.1, 81), (1.55, 78), (2.1, 76)]
OPENING = [(1.6, 71), (2.6, 74), (3.5, 76), (5.2, 74), (6.6, 71), (8.4, 69), (9.4, 71), (11.4, 74), (12.4, 79), (13.6, 78), (15.4, 76)]


def bells_list():
    out = [(t, n, 0.8) for t, n in OPENING]
    for s in SUNRISES:
        if s > DUR - 8:
            continue
        P = float(at(_P, s))
        scale = np.clip(P / 12, 0.35, 1.0)  # фраза сжимается вместе с сутками
        for dt, n in MOTIF:
            out.append((s - 0.2 + dt * scale, n, 1.0))
    for s in NOONS:
        out.append((s, 88, 0.45))
        out.append((s + 0.18, 83, 0.35))
    for s in SUNSETS:
        out.append((s, 71, 0.6))
        out.append((s + 0.5, 64, 0.6))
    # разгадка: отметка на шкале открывается — мотив рассвета; в титрах — мотив начала ролика
    for dt, n in MOTIF:
        out.append((900.0 + dt, n, 1.1))
    out += [(956.5 + t * 1.15, n, 0.9) for t, n in OPENING]
    return sorted(out)


BELLS = bells_list()


def music(tt):
    a, b = tt[0], tt[-1]
    n = len(tt)
    pad = np.zeros((2, n))
    for c0, c1, notes in CHORDS:
        if c1 + 2 < a or c0 > b:
            continue
        e = np.clip((tt - c0) / 2.2, 0, 1) * np.clip((c1 + 2.0 - tt) / 2.0, 0, 1)
        if not e.any():
            continue
        for note in notes:
            f = midi(note)
            for det, p in [(-0.005, -0.7), (0.0, 0.0), (0.005, 0.7)]:
                v = osc(f * (1 + det), tt, phase0=(note * 0.137 + det * 50) % 1) * e * (0.1 if note < 45 else 0.065 if note < 64 else 0.042)
                pad[0] += v * np.cos((p + 1) * np.pi / 4)
                pad[1] += v * np.sin((p + 1) * np.pi / 4)
    # реальное время — тёмный тихий фон; с ускорением раскрывается
    cut = 650 + 1700 * lapse(tt) + 600 * spin_amount(tt)
    pad = np.stack([vlp(pad[c], cut) for c in range(2)]) * (1 + 0.07 * np.sin(2 * np.pi * 0.09 * tt))
    bell = np.zeros(n)
    partials = [(1.0, 1.0, 1.9), (2.0, 0.34, 1.0), (3.01, 0.15, 0.55), (4.17, 0.07, 0.32), (5.43, 0.04, 0.2)]
    for start, note, g in BELLS:
        if start > b or start + 3.5 < a:
            continue
        local = tt - start
        m = (local >= 0) & (local < 3.5)
        if not m.any():
            continue
        lt = local[m]
        f = midi(note)
        bell[m] += sum(am * np.sin(2 * np.pi * f * rr * lt) * np.exp(-lt / dc) for rr, am, dc in partials) * np.minimum(1, lt / 0.004) * 0.075 * g
    dry = pad + np.vstack([bell * 0.85, bell])
    return dry + reverb(pad[0] * 0.5 + pad[1] * 0.5 + bell * 1.7, IR_HALL, 0.6)


# --- после отрыва: сколько воздуха вокруг (1 — у вершины, 0 — космос) ------------------------------------------------
def air_at(tt):
    keys = SC.get('hero_alt', [[1e9, 0]])
    xs = np.array([k[0] for k in keys])
    ys = np.log(np.array([k[1] for k in keys]) + 1)
    alt = np.exp(np.interp(tt, xs, ys)) - 1
    alt = np.where(tt <= SC.get('float_at', 1e9), 0, alt)
    alt = np.where(tt >= xs[-1], 1e7, alt)
    return 1 - smooth((alt - 12000) / 50000)


# --- вершина: ветер, дыхание, снег --------------------------------------------------------------------------
def wind(tt, r):
    n = len(tt)
    L = lapse(tt)
    S = spin_amount(tt)
    # порывы: в реальном времени — медленные, в ускоренном — сливаются в ровный шум
    g_slow = slow(r, n, 0.35)
    g_fast = slow(r, n, 2.5)
    gust = 0.6 + 0.4 * np.tanh(g_slow * (1 - L) + g_fast * L * 0.6)
    base = bp(pink(r, n), 160, 2600)
    base2 = bp(pink(r, n), 160, 2600)
    whistle_c = 820 + 260 * g_slow + 500 * S
    whistle = vbp(r.standard_normal(n), whistle_c, q=6) * np.clip(gust - 0.55, 0, None) ** 1.5 * 2.2
    # ночью тише (ветер стихает), с ускорением и разгоном — сильнее
    level = (0.11 + 0.05 * L + 0.25 * S) * gust
    pan = 0.25 * np.sin(2 * np.pi * 0.031 * tt)
    left = (base * (0.6 - pan) + whistle * 0.25) * level
    right = (base2 * (0.6 + pan) + np.roll(whistle, 701) * 0.25) * level
    return np.vstack([left, right]) * air_at(tt)


def breathing(tt, r):
    """Выдох — с облачком пара (каждые 3,4 с с t = 0), вдох — через 1,75 с после."""
    out = np.zeros((2, len(tt)))
    a, b = tt[0], tt[-1]
    k0 = int(np.floor(a / BREATH)) - 1
    k1 = int(np.ceil(b / BREATH)) + 1
    for k in range(k0, k1 + 1):
        t0 = k * BREATH
        br = rng_for('breath', k)
        n = int(1.4 * SR)
        tl = np.arange(n) / SR
        ex = bp(br.standard_normal(n), 250, 1600) * np.sin(np.pi * np.clip(tl / 1.25, 0, 1)) ** 1.6
        hel = 1 + 0.6 * float(1 - air_at(np.array([t0]))[0])  # в космосе дыхание слышно ближе (шлем)
        place(out, tt, ex * 0.05 * br.uniform(0.85, 1.1) * hel, t0 + 0.05)
        m = int(1.15 * SR)
        tm = np.arange(m) / SR
        inh = bp(br.standard_normal(m), 600, 3200) * np.sin(np.pi * np.clip(tm / 1.1, 0, 1)) ** 2.2
        place(out, tt, inh * 0.03 * br.uniform(0.85, 1.1) * hel, t0 + 1.75)
    return out


def crunch(t0, r, dur=0.35):
    n = int(dur * SR)
    tl = np.arange(n) / SR
    x = np.zeros(n)
    for i in np.nonzero(r.random(n) < 0.012)[0]:
        m = min(n - i, 240)
        x[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / 30) * r.uniform(0.3, 1)
    return bp(x, 700, 6000) * np.sin(np.pi * tl / dur) ** 0.7


# переступания на снегу (кошки): небольшие сдвиги веса при поворотах головы
STEPS = [4.4, 8.3, 13.0, 17.2, 38.8, 45.9]


def snow(tt, r):
    out = np.zeros((2, len(tt)))
    for s in STEPS:
        if s + 0.5 < tt[0] or s > tt[-1]:
            continue
        cr = rng_for('crunch', s)
        place(out, tt, crunch(s, cr), s, 0.32, pan=cr.uniform(-0.3, 0.3))
        place(out, tt, crunch(s + 0.28, cr, 0.25), s + 0.28, 0.2, pan=cr.uniform(-0.3, 0.3))
    return out


# --- время и вращение ---------------------------------------------------------------------------------------
def riser(tt, r):
    """24–36 с: время разгоняется — шорох с поднимающейся полосой; 36 с — Земля начинает раскручиваться."""
    out = np.zeros((2, len(tt)))
    if tt[0] < 37.5 and tt[-1] > 23.5:
        n = len(tt)
        u = np.clip((tt - 24) / 12, 0, 1)
        sweep = vbp(pink(r, n), 180 + 2400 * u ** 2, q=1.5) * (u ** 2.2) * (tt < 36.3) * np.clip((36.3 - tt) / 0.3, 0, 1)
        out += np.vstack([sweep, np.roll(sweep, 389)]) * 0.16
    if tt[0] < 40 and tt[-1] > 35:
        br = rng_for('engage')
        n = int(3.2 * SR)
        tl = np.arange(n) / SR
        boom = np.sin(2 * np.pi * (38 * tl + 4 * tl ** 2)) * np.exp(-tl / 1.1) * smooth(tl / 0.05) + lp(br.standard_normal(n), 160) * np.exp(-tl / 0.5) * 0.5
        place(out, tt, boom, 36.0, 0.32)
    return out


def hum(tt):
    """Гул вращения: появляется с разгоном, высота растёт со скоростью Земли."""
    ph = 2 * np.pi * at(_HUM_PH, tt)
    S = spin_amount(tt)
    on = smooth((tt - 36) / 14)
    lvl = on * (0.02 + 0.08 * S)
    lvl = lvl * (1 - 0.85 * smooth((tt - 495) / 40))  # в космосе гул вращения уходит на дальний план
    x = np.sin(ph) + 0.55 * np.sin(2 * ph + 0.3) + 0.3 * np.sin(3 * ph + 1.1) + 0.12 * np.sin(5 * ph + 0.4)
    beat = 1 + 0.25 * np.sin(2 * np.pi * 0.37 * tt)
    return np.vstack([x * lvl * beat, x * lvl * (2 - beat)])


def ticks(tt, r):
    """Тиканье часов: каждые 1/12 оборота — всё чаще; тик-так чередуются."""
    out = np.zeros((2, len(tt)))
    a, b = tt[0], tt[-1]
    n = int(0.09 * SR)
    tl = np.arange(n) / SR
    for t0, q in TICKS:
        if t0 > b or t0 + 0.1 < a:
            continue
        tr = rng_for('tick', q)
        f = 1850 if q % 2 == 0 else 1390
        click = hp(tr.standard_normal(n), 2500) * np.exp(-tl / 0.0025)
        wood = np.sin(2 * np.pi * f * tl) * np.exp(-tl / 0.022) + 0.4 * np.sin(2 * np.pi * f * 2.3 * tl) * np.exp(-tl / 0.012)
        fade = float(smooth((t0 - 29) / 10))
        place(out, tt, (click * 0.4 + wood) * 0.05 * fade, t0, pan=0.15 if q % 2 == 0 else -0.15)
    return out


# --- катастрофы: землетрясения, лавины, извержения, молнии (моменты — из story.py, как в spin/fx.js) -------------
SC = json.loads((HERE / 'scene.json').read_text())
SHAKE_T = np.array([k[0] for k in SC.get('shake', [[0, 0]])])
SHAKE_V = np.array([k[1] for k in SC.get('shake', [[0, 0]])])


def _spring_track(keys, omega, rate=240):
    xs = np.array([k[0] for k in keys], float)
    ys = np.array([k[1] for k in keys], float)
    t0 = xs[0] - 1
    grid = np.arange(t0, xs[-1] + 1, 1 / rate)
    target = np.interp(grid, xs, ys)
    out = np.empty_like(grid)
    x, v, dt = target[0], 0.0, 1 / rate
    for i, tg in enumerate(target):
        v += (omega * omega * (tg - x) - 2 * omega * v) * dt
        x += v * dt
        out[i] = x
    return grid, out


_HG, _HV = _spring_track(SC['head_yaw'], 5.5)


def heading(tt):
    """Куда смотрит голова: азимут от севера по часовой, рад (корпус смотрит на восток, поворот головы + влево)."""
    return np.radians(90 - np.interp(tt, _HG, _HV))


def pan_az(sig, az_deg, tt):
    """Источник на азимуте az (от севера по часовой) → стерео с учётом поворота головы; сзади глуше."""
    rel = np.radians(az_deg) - heading(tt)
    p = np.clip(np.sin(rel), -1, 1) * 0.85
    back = np.clip(-np.cos(rel), 0, 1)
    sig = sig * (1 - 0.35 * back)
    return np.vstack([sig * np.cos((p + 1) * np.pi / 4), sig * np.sin((p + 1) * np.pi / 4)])


def place_az(out, tt, sig, start, gain, az):
    i0 = int(round((start - tt[0]) * SR))
    a, b = max(0, i0), min(len(tt), i0 + len(sig))
    if b > a:
        out[:, a:b] += pan_az(sig[a - i0:b - i0] * gain, az, tt[a:b])


PEAK_AZ = {'Tungurahua': (90, 41.7), 'Sangay': (138, 80), 'Cotopaxi': (26, 97), 'El Altar': (118, 50), 'Carihuairazo': (44, 10.7)}


def _hash(n):
    x = np.sin(n * 127.1 + 311.7) * 43758.5453
    return x - np.floor(x)


def quakes(tt, r):
    """Гул землетрясения по силе тряски; треск породы и осыпи."""
    n = len(tt)
    sh = np.interp(tt, SHAKE_T, SHAKE_V)
    if sh.max() < 0.005:
        return np.zeros((2, n))
    rumble = lp(r.standard_normal(n), 70, 4)
    rumble = rumble / (np.std(rumble) + 1e-9)
    mid = bp(pink(r, n), 90, 600) * (0.5 + 0.5 * slow(r, n, 3))
    crack = np.zeros(n)
    for i in np.nonzero(r.random(n) < 0.0006 * sh)[0]:
        m = min(n - i, 1600)
        crack[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / 220) * r.uniform(0.3, 1)
    crack = bp(crack, 200, 3500)
    x = rumble * sh * 0.55 + mid * sh ** 1.5 * 0.12 + crack * 0.35
    return np.vstack([x, np.roll(x, 211)])


def avalanches(tt, r):
    out = np.zeros((2, len(tt)))
    for start, az_rel, dist in SC.get('avalanches', []):
        if start + 15 < tt[0] or start > tt[-1]:
            continue
        ar = rng_for('aval', start)
        n = int(14 * SR)
        tl = np.arange(n) / SR
        envl = smooth(tl / 1.6) * np.exp(-np.maximum(tl - 1.6, 0) / 4.0)
        roar = bp(pink(ar, n), 80, 1800) * envl + lp(ar.standard_normal(n), 120) * envl * 0.6
        place_az(out, tt, roar, start, 0.22, az_rel)
    return out


def eruptions(tt, r):
    out = np.zeros((2, len(tt)))
    a, b = tt[0], tt[-1]
    for name, start, power in SC.get('eruptions', []):
        az, dist = PEAK_AZ[name]
        near = 42.0 / dist
        if start > b:
            continue
        er = rng_for('erupt', start)
        # взрыв: низкий удар и раскат
        n = int(6 * SR)
        tl = np.arange(n) / SR
        boom = (np.sin(2 * np.pi * (26 * tl + 3 * tl ** 2)) * np.exp(-tl / 1.4) * smooth(tl / 0.03)
                + lp(er.standard_normal(n), 220) * np.exp(-tl / 0.9) * 0.9 + bp(er.standard_normal(n), 300, 2500) * np.exp(-tl / 0.35) * 0.3)
        if start + 6 > a:
            place_az(out, tt, boom, start, 0.75 * power * near ** 0.5, az)
        # непрерывный гул извержения (затихает за ~40 с)
        seg = (tt > start)
        if seg.any():
            age = np.maximum(tt - start, 0)
            envl = smooth(age / 1.2) * (0.35 + 0.65 * np.exp(-age / 18)) * seg
            g = lp(r.standard_normal(len(tt)), 160) * 2.2 * (0.7 + 0.3 * slow(r, len(tt), 1.5))
            out += pan_az(g * envl * 0.09 * power * near ** 0.5, az, tt)
        # молнии в пепле: те же вспышки, что в fx.js (слоты по 0,07 с)
        s0 = int(np.floor(max(a, start + 1.2) / 0.07))
        s1 = int(np.ceil(b / 0.07))
        for slot in range(s0, s1 + 1):
            age = slot * 0.07 - start
            p0 = 0.14 * np.exp(-age / 25) + 0.03
            if _hash(slot + start * 13) < p0:
                lr = rng_for('bolt', slot)
                m = int(1.6 * SR)
                tm = np.arange(m) / SR
                crack = hp(lr.standard_normal(m), 1200) * np.exp(-tm / 0.05) * 0.5 + lp(lr.standard_normal(m), 300) * np.exp(-tm / 0.5) * smooth(tm / 0.05)
                place_az(out, tt, crack, slot * 0.07 + 0.05, 0.16 * power * near ** 0.4, az + lr.uniform(-4, 4))
    return out


def space(tt, r):
    """Космос: тихий низкий фон и вентилятор скафандра; искры льда рядом (как в space.js — когда обломков много)."""
    n = len(tt)
    vac = 1 - air_at(tt)
    if vac.max() < 0.01:
        return np.zeros((2, n))
    room = lp(r.standard_normal(n), 90, 2)
    room = room / (np.std(room) + 1e-9)
    fan = bp(pink(r, n), 900, 5000)
    out = np.vstack([room * 0.05 + fan * 0.012, np.roll(room, 997) * 0.05 + np.roll(fan, 313) * 0.012]) * vac
    dens = smooth((tt - 466) / 10) * (1 - smooth((tt - 600) / 40)) + 0.8 * smooth((tt - 670) / 20) * (1 - smooth((tt - 770) / 15))
    if dens.max() > 0.01:
        sp = np.zeros((2, n))
        a0, b0 = tt[0], tt[-1]
        pr = rng_for('sparks', a0)
        tcur = a0
        while tcur < b0:
            d = float(np.interp(tcur, tt, dens))
            tcur += pr.exponential(0.12 / max(d, 0.05))
            if d < 0.02:
                continue
            m = int(0.4 * SR)
            tl = np.arange(m) / SR
            f = pr.uniform(3000, 7500)
            ping = (np.sin(2 * np.pi * f * tl) + 0.3 * np.sin(2 * np.pi * f * 2.7 * tl)) * np.exp(-tl / 0.06)
            place(sp, tt, ping * pr.uniform(0.004, 0.02) * d, tcur, pan=pr.uniform(-0.9, 0.9))
        out += sp
    return out


def actions(tt, r):
    """Действия героя: сигнал весов, прыжки (хруст наста), отрыв от льда, крупа, посадка на луну."""
    out = np.zeros((2, len(tt)))
    a, b = tt[0], tt[-1]
    for c0, c1 in [(248.8, 253.2), (331.0, 335.0), (385.6, 389.6), (414.8, 419.4), (424.6, 428.8), (449.6, 454.0)]:
        if c0 + 1.5 < a or c0 > b:
            continue
        n1 = int(0.08 * SR)
        tl = np.arange(n1) / SR
        beep = np.concatenate([np.sin(2 * np.pi * 1760 * tl) * np.exp(-tl / 0.05), np.zeros(int(0.025 * SR)), np.sin(2 * np.pi * 2637 * np.arange(int(0.1 * SR)) / SR) * np.exp(-np.arange(int(0.1 * SR)) / SR / 0.06)])
        place(out, tt, beep * 0.12, c0 + 0.7)
    for t0, g in SC.get('jumps', []):
        T = 2 * 2.6 / g
        for tj, gain in ((t0 - 0.05, 0.35), (t0 + T, 0.5)):
            if tj + 0.6 < a or tj > b:
                continue
            cr = rng_for('jump', tj)
            place(out, tt, crunch(tj, cr, 0.4), tj, gain)
            m = int(0.5 * SR)
            tl = np.arange(m) / SR
            place(out, tt, lp(cr.standard_normal(m), 140) * np.exp(-tl / 0.12) * 0.6, tj, gain)
    fa = SC.get('float_at', 1e9)
    if fa - 0.5 < b and fa + 6 > a:
        fr = rng_for('float')
        m = int(0.5 * SR)
        tl = np.arange(m) / SR
        clink = (np.sin(2 * np.pi * 2350 * tl) + 0.5 * np.sin(2 * np.pi * 3710 * tl)) * np.exp(-tl / 0.08)
        place(out, tt, clink * 0.08, fa - 0.2, pan=-0.2)
        place(out, tt, clink * 0.06, fa + 0.1, pan=0.25)
        m = int(5 * SR)
        tl = np.arange(m) / SR
        whoosh = vbp(fr.standard_normal(m), 200 + 900 * smooth(tl / 3), q=1.2) * np.sin(np.pi * np.clip(tl / 5, 0, 1)) ** 2
        place(out, tt, whoosh * 0.09, fa)
    # крупа поднимается: тихое шуршание (вес < 32 кг, примерно 428–462 с)
    if a < 463 and b > 426:
        n = len(tt)
        hiss = hp(r.standard_normal(n), 3000) * smooth((tt - 426) / 6) * (1 - smooth((tt - 461) / 3)) * 0.02
        out += np.vstack([hiss, np.roll(hiss, 401)])
    land = SC.get('land_at', 1e9)
    if land - 0.5 < b and land + 3 > a:
        lr = rng_for('land')
        m = int(2.0 * SR)
        tl = np.arange(m) / SR
        thud = np.sin(2 * np.pi * (55 * tl - 8 * tl ** 2)) * np.exp(-tl / 0.18) + lp(lr.standard_normal(m), 400) * np.exp(-tl / 0.12) * 0.7
        place(out, tt, thud * 0.45, land)
        place(out, tt, crunch(land, lr, 0.6), land + 0.02, 0.5)
        dust = bp(lr.standard_normal(m), 1500, 7000) * np.exp(-tl / 0.5) * 0.04
        place(out, tt, dust, land + 0.05)
    return out


def compress(x, threshold_db=-18, ratio=2.2, attack=0.01, release=0.2):
    level = np.sqrt(lp(np.mean(x ** 2, axis=0), 30) + 1e-12)
    db = 20 * np.log10(level)
    over = np.maximum(0, db - threshold_db)
    gr = over - over / ratio
    g = np.empty_like(gr)
    ac, rc = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    state = 0.0
    for i in range(0, len(gr), 32):
        tg = gr[i]
        state = tg + (state - tg) * (ac ** 32 if tg > state else rc ** 32)
        g[i:i + 32] = state
    return x * 10 ** (-g / 20)


GAINS = {'music': 0.42, 'wind': 1.9, 'breath': 3.0, 'snow': 1.4, 'riser': 1.3, 'hum': 1.3, 'ticks': 2.6, 'quake': 0.55, 'aval': 1.0, 'erupt': 0.8, 'space': 1.0, 'actions': 1.0}
DRIVE = 1.3
MASTER = 1.2  # постоянное усиление (не по окну), подбирается по громкости первой минуты: −14 LUFS


def render(a, b):
    t0, t1 = a - MARGIN, b + 1.0
    tt = np.arange(int(round((t1 - t0) * SR))) / SR + t0
    r = rng_for('win', a)
    stems = {
        'music': music(tt),
        'wind': wind(tt, r),
        'breath': breathing(tt, r),
        'snow': snow(tt, r),
        'riser': riser(tt, r),
        'hum': hum(tt),
        'ticks': ticks(tt, r),
        'quake': quakes(tt, r),
        'aval': avalanches(tt, r),
        'erupt': eruptions(tt, r),
        'space': space(tt, r),
        'actions': actions(tt, r),
    }
    stems['erupt'] = stems['erupt'] + reverb(stems['erupt'][0] * 0.5 + stems['erupt'][1] * 0.5, IR_HALL, 0.25)
    mix = sum(GAINS[k] * v for k, v in stems.items())
    mix = hp(mix, 26)
    mix = compress(mix)
    mix = np.tanh(mix * DRIVE) / np.tanh(DRIVE) * MASTER
    # потолок: выше 0,9 — мягкое колено, громкие места (землетрясения) не клиппируют
    a_ = np.abs(mix)
    mix = np.where(a_ > 0.9, np.sign(mix) * (0.9 + 0.09 * np.tanh((a_ - 0.9) / 0.09)), mix)
    keep = (tt >= a - XF) & (tt < b + XF)
    return mix[:, keep], {k: round(float(20 * np.log10(np.sqrt(np.mean(v[:, keep] ** 2)) + 1e-12)), 1) for k, v in stems.items()}


def write(path, x):
    x = np.clip(x, -1, 1)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x.T * 32767).astype('<i2').tobytes())


def load(path):
    with wave.open(str(path)) as w:
        return np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, 2).T / 32767.0


def cut(a, b):
    """Кусок [a, b] из окон: равномощные перекрёстки на стыках; начало — из тишины, конец — вместе с титром."""
    n = int(round((b - a) * SR))
    tt = a + np.arange(n) / SR
    mix = np.zeros((2, n))
    weight = np.zeros(n)
    segs = []
    for p in (HERE / 'out' / 'audio').glob('seg_*_*.wav'):
        m = re.match(r'seg_(\d+)_(\d+)\.wav', p.name)
        segs.append((int(m[1]), int(m[2]), p))
    for s0, s1, path in sorted(segs):
        if s1 + XF <= a or s0 - XF >= b:
            continue
        x = load(path)
        i0 = int(round((s0 - XF - a) * SR))
        lo, hi = max(0, i0), min(n, i0 + x.shape[1])
        if hi <= lo:
            continue
        t = tt[lo:hi]
        kin = np.ones_like(t) if s0 == 0 else np.clip((t - (s0 - XF)) / (2 * XF), 0, 1)
        kout = np.ones_like(t) if s1 >= DUR else 1 - np.clip((t - (s1 - XF)) / (2 * XF), 0, 1)
        g = np.sin(kin * np.pi / 2) * np.sin(kout * np.pi / 2)
        mix[:, lo:hi] += x[:, lo - i0:hi - i0] * g
        weight[lo:hi] += g ** 2
    mix *= smooth(tt / 0.7)
    mix *= 1 - np.clip((tt - (DUR - 2.5)) / 2.5, 0, 1) ** 2
    gaps = np.mean(weight < 0.5)
    if gaps > 0:
        print(f'warning: {gaps * 100:.1f}% of [{a}, {b}] has no audio window')
    return mix


if __name__ == '__main__':
    if sys.argv[1] == '--cut':
        a, b = float(sys.argv[2]), float(sys.argv[3])
        out = HERE / 'out' / 'min' / f'audio_{int(a)}_{int(b)}.wav'
        mix = cut(a, b)
        write(out, mix)
        print(out.relative_to(HERE.parent), 'peak', round(float(np.max(np.abs(mix))), 3))
    else:
        a, b = float(sys.argv[1]), float(sys.argv[2])
        mix, levels = render(a, b)
        path = HERE / 'out' / 'audio' / f'seg_{int(a)}_{int(b)}.wav'
        write(path, mix)
        print(path.relative_to(HERE.parent), levels, 'peak', round(float(np.max(np.abs(mix))), 3))
