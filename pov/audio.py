"""Звук для POV-теста: оригинальная эмбиент-музыка и объёмные шумовые эффекты. Всё синтезируется
с нуля (осцилляторы, шум, фильтры, свёрточная реверберация) — без чужих записей и без голоса.

Каждый источник стоит в пространстве сцены: громкость падает с расстоянием, у движущихся есть
эффект Доплера, панорама следует за поворотами головы, сзади звук глуше. Пока крышка люка уходит
вниз, город слышен всё глуше через отверстие над головой, шахта звенит частым эхом, коллектор —
длинным мокрым; у тоннеля метро своя гулкая акустика. Время и движения — из scene.json.

Запуск из корня:  python3 pov/audio.py   ->  pov/out/audio.wav (48 кГц, стерео)
"""
import json
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt, sosfilt_zi

HERE = Path(__file__).resolve().parent
SCENE = json.loads((HERE / 'scene.json').read_text())
SR = 48000
DUR = float(SCENE['duration'])
N = int(SR * DUR)
t = np.arange(N) / SR
rng = np.random.default_rng(7)
C = 343.0  # скорость звука, м/с

# --- основа: фильтры, огибающие, ревербераторы ----------------------------


def _sos(kind, f, order=2):
    return butter(order, f, btype=kind, fs=SR, output='sos')


def lp(x, f, order=2):
    return sosfilt(_sos('low', min(f, SR * 0.45), order), x)


def hp(x, f, order=2):
    return sosfilt(_sos('high', f, order), x)


def bp(x, lo, hi, order=2):
    return sosfilt(_sos('band', [lo, min(hi, SR * 0.45)], order), x)


def vlp(x, cutoff, order=2, block=256):
    """Фильтр НЧ с плавно меняющейся частотой среза (по блокам, с сохранением состояния)."""
    y = np.empty_like(x)
    zi = None
    for i in range(0, len(x), block):
        sos = _sos('low', float(np.clip(cutoff[min(i, len(cutoff) - 1)], 30, SR * 0.45)), order)
        if zi is None:
            zi = sosfilt_zi(sos) * x[0]
        y[i:i + block], zi = sosfilt(sos, x[i:i + block], zi=zi)
    return y


def env(points, tt=t):
    xs, ys = zip(*points)
    return np.interp(tt, xs, ys)


def noise(n=N):
    return rng.standard_normal(n)


def pink(n=N):
    """Розовый шум (спад 3 дБ/окт) через спектральное взвешивание."""
    w = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    w[1:] /= np.sqrt(f[1:])
    w[0] = 0
    x = np.fft.irfft(w, n)
    return x / np.std(x)


def brown(n=N):
    x = np.cumsum(rng.standard_normal(n))
    x = hp(x, 15)
    return x / np.std(x)


def make_ir(rt60, length, bright=6000, dark=1500, early=(), width=1.0):
    """Импульсный отклик: ранние отражения + экспоненциальный хвост, к концу темнее; стерео-декорреляция."""
    n = int(length * SR)
    tt = np.arange(n) / SR
    decay = 10 ** (-3 * tt / rt60)
    out = []
    for ch in range(2):
        x = rng.standard_normal(n) * decay
        xb, xd = lp(x, bright), lp(x, dark)
        mix = np.exp(-tt / (rt60 * 0.25))
        y = xb * mix + xd * (1 - mix)
        for delay, gain in early:
            i = int((delay + rng.uniform(-0.002, 0.002) * width) * SR)
            if i < n:
                y[i] += gain * (1 if ch == 0 else rng.uniform(0.6, 1.0))
        out.append(y)
    ir = np.stack(out)
    return ir / np.sqrt(np.sum(ir ** 2) / 2)


def reverb(mono_or_stereo, ir, wet):
    x = np.atleast_2d(mono_or_stereo)
    if x.shape[0] == 1:
        x = np.vstack([x, x])
    y = np.stack([fftconvolve(x[c], ir[c])[:N] for c in range(2)])
    return y * wet


IR_CANYON = make_ir(1.7, 2.6, 5500, 1400, early=[(0.019, 0.5), (0.031, 0.38), (0.047, 0.3), (0.071, 0.22), (0.104, 0.16)])
IR_HALL = make_ir(4.2, 5.0, 7000, 2200, early=[(0.023, 0.3), (0.041, 0.22)])
IR_EARTH = make_ir(0.55, 1.0, 2500, 600, early=[(0.006, 0.4), (0.011, 0.3)])
IR_TUNNEL = make_ir(2.4, 3.2, 8000, 3000, early=[(0.008, 0.6), (0.016, 0.45), (0.027, 0.35), (0.039, 0.3), (0.055, 0.22)])
IR_SHAFT = make_ir(0.7, 1.0, 5000, 1800, early=[(0.0044, 0.7), (0.0088, 0.5), (0.0132, 0.38), (0.0176, 0.3), (0.022, 0.24), (0.0264, 0.2)])
IR_SEWER = make_ir(2.6, 3.2, 6000, 1600, early=[(0.0075, 0.55), (0.015, 0.4), (0.023, 0.3), (0.034, 0.25), (0.05, 0.2), (0.071, 0.15)])

# --- слушатель: те же сплайн и «пружина», что у камеры в timeline.js -------


def monotone(points):
    xs = np.array([p[0] for p in points], float)
    ys = np.array([p[1] for p in points], float)
    d = np.diff(ys) / np.diff(xs)
    m = np.zeros(len(xs))
    m[0], m[-1] = d[0], d[-1]
    for i in range(1, len(xs) - 1):
        m[i] = 0 if d[i - 1] * d[i] <= 0 else (d[i - 1] + d[i]) / 2
    for i in range(len(d)):
        if d[i] == 0:
            m[i] = m[i + 1] = 0
            continue
        a, b = m[i] / d[i], m[i + 1] / d[i]
        s = a * a + b * b
        if s > 9:
            k = 3 / np.sqrt(s)
            m[i], m[i + 1] = k * a * d[i], k * b * d[i]

    def f(x):
        x = np.atleast_1d(np.asarray(x, float))
        i = np.clip(np.searchsorted(xs, x) - 1, 0, len(xs) - 2)
        h = xs[i + 1] - xs[i]
        u = np.clip((x - xs[i]) / h, 0, 1)
        y = ((2 * u ** 3 - 3 * u ** 2 + 1) * ys[i] + (u ** 3 - 2 * u ** 2 + u) * h * m[i]
             + (-2 * u ** 3 + 3 * u ** 2) * ys[i + 1] + (u ** 3 - u ** 2) * h * m[i + 1])
        return np.where(x <= xs[0], ys[0], np.where(x >= xs[-1], ys[-1] + m[-1] * (x - xs[-1]), y))

    return f


def track(keys, omega, rate=240):
    f = monotone(keys)
    t0 = keys[0][0] - 1
    grid = np.arange(t0, keys[-1][0] + 1, 1 / rate)
    target = f(grid)
    out = np.empty_like(grid)
    x, v, dt = target[0], 0.0, 1 / rate
    for i, tg in enumerate(target):
        v += (omega * omega * (tg - x) - 2 * omega * v) * dt
        x += v * dt
        out[i] = x
    return np.interp(t, grid, out)


heading = np.radians(track(SCENE['head_yaw'], 5.5) + track(SCENE['body_yaw'], 4))  # влево — плюс
depth = monotone(SCENE['depth'])(t)
eye_y = SCENE['plaza'] - depth + 1.66
UNDER = SCENE['under']
CRACK = SCENE['crack']
TR = SCENE['train']
TITLE = SCENE['title'][0]
MH = SCENE['manhole']
SOIL = SCENE['soil_top']  # верх грунта под коллектором: трубы и тоннель — ниже на столько же
T_STREET = float(t[np.argmax(eye_y < SCENE['plaza'])])  # глаза уходят ниже площади
T_SEWER = float(t[np.argmax(eye_y < MH['crown'])])  # глаза проходят свод коллектора
T_WATER = float(t[np.argmax(SCENE['plaza'] - depth < MH['water'])])  # крышка и подошвы касаются воды
TUNNEL_TOP, TUNNEL_BOTTOM = SOIL - 5.3, SOIL - 9.9
in_tunnel = (eye_y < TUNNEL_TOP + 0.1) & (eye_y > TUNNEL_BOTTOM - 0.1)

# --- пространство: расстояние, Доплер, панорама от головы, «тень» головы ----

_DULL_CACHE = {}


def spatial(sig, sx, sy, sz, start=0, ref=4.0, doppler=True):
    """Моно-сигнал источника (в его собственном времени) → стерео у слушателя."""
    n = len(sig)
    sl = slice(start, start + n)
    tt = t[sl]
    dx = np.asarray(sx) - 0.0
    dy = np.asarray(sy) - eye_y[sl]
    dz = np.asarray(sz) - 0.0
    d = np.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6
    x = np.interp(tt - d / C, tt, sig, left=0, right=0) if doppler else sig
    hd = heading[sl]
    hn = np.sqrt(dx * dx + dz * dz) + 1e-6
    pan = (dx * np.cos(hd) - dz * np.sin(hd)) / hn * (hn / d) * 0.75  # без жёсткого края: в наушниках не утомляет
    front = (-dx * np.sin(hd) - dz * np.cos(hd)) / hn
    dull = np.clip(0.55 * np.maximum(0, -front) + np.clip((d - 25) / 250, 0, 0.6), 0, 0.85)
    x = x * (1 - dull) + lp(x, 1800) * dull
    x = x * ref / np.maximum(d, ref)
    out = np.zeros((2, N))
    out[0, sl] = x * np.cos((pan + 1) * np.pi / 4)
    out[1, sl] = x * np.sin((pan + 1) * np.pi / 4)
    return out


def through_soil(sig, y, width=1.6):
    """Источник в грунте: громко и звонко, только пока проходим рядом, дальше — глухо и тихо."""
    g = np.exp(-(((eye_y - y) / width) ** 2))
    return sig * g + lp(sig, 400) * (1 - g) * 0.2


def grain(length, decay, lo, hi):
    n = int(length * SR)
    g = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / decay)
    return bp(g, lo, hi)


def at(sig, start):
    out = np.zeros(N)
    i = int(start * SR)
    if i >= N:
        return out
    k = min(len(sig), N - i)
    out[i:i + k] = sig[:k]
    return out


def tone(f, length, attack=0.005, decay=0.2, harmonics=((1, 1.0),)):
    n = int(length * SR)
    tt = np.arange(n) / SR
    y = sum(a * np.sin(2 * np.pi * f * k * tt) for k, a in harmonics)
    return y * np.minimum(1, tt / attack) * np.exp(-tt / decay)


# --- музыка ---------------------------------------------------------------

def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


SAW = np.zeros(4096)
for k in range(1, 24):
    SAW += np.sin(2 * np.pi * k * np.arange(4096) / 4096) / k * (1 if k < 12 else 0.5)
SAW /= np.max(np.abs(SAW))


def osc(freq, n, table=SAW, phase0=0.0):
    ph = (phase0 + np.cumsum(np.full(n, freq / SR))) % 1.0
    idx = ph * len(table)
    i0 = idx.astype(int)
    k = idx - i0
    return table[i0] * (1 - k) + table[(i0 + 1) % len(table)] * k


def music():
    # Оригинальная гармония: Cmaj9 → Am9 → Fmaj7(#11) → Dm9 (шахта) → Bbmaj9 (коллектор)
    # → (под землёй) Dm(add9) низко → Cadd9
    chords = [
        (0.0, 6.0, [48, 55, 59, 62, 64]),
        (5.4, 11.6, [40, 57, 59, 60, 64]),
        (11.0, 15.2, [41, 48, 52, 57, 59]),
        (14.6, 19.6, [38, 50, 53, 60, 64]),
        (19.0, UNDER + 0.85, [34, 46, 53, 57, 60, 62]),
        (UNDER + 0.05, UNDER + 5.85, [26, 38, 45, 53, 64]),
        (TITLE - 0.3, DUR, [36, 43, 50, 52, 55, 60]),
    ]
    pad = np.zeros((2, N))
    for a, b, notes in chords:
        i0, i1 = int(a * SR), min(N, int((b + 1.6) * SR))
        n = i1 - i0
        tt = np.arange(n) / SR
        e = np.minimum(1, tt / 1.4) * np.clip((b + 1.6 - a - tt) / 1.6, 0, 1)
        for note in notes:
            f = midi(note)
            for det, pan in [(-0.006, -0.6), (0.0, 0.0), (0.006, 0.6)]:
                v = osc(f * (1 + det), n, phase0=rng.uniform()) * e * (0.11 if note < 45 else 0.07)
                pad[0, i0:i1] += v * np.cos((pan + 1) * np.pi / 4)
                pad[1, i0:i1] += v * np.sin((pan + 1) * np.pi / 4)
    # фильтр «дышит»: над землёй светлее, перед провалом темнеет, под землёй глухо, на титре раскрывается
    cut = env([(0, 900), (3, 1900), (10, 2600), (12.4, 2000), (16.8, 1500), (19.5, 1200), (UNDER - 0.15, 1100), (UNDER + 0.15, 520),
               (UNDER + 5.05, 650), (TITLE, 2800), (DUR, 3200)])
    pad = np.stack([vlp(pad[c], cut) for c in range(2)])
    pad *= 1 + 0.06 * np.sin(2 * np.pi * 0.11 * t)

    # Мелодия: мягкий «колокольчик», свой мотив в пентатонике
    motif = [(1.4, 76), (2.3, 79), (3.1, 81), (4.6, 79), (5.9, 76), (6.8, 74), (7.6, 76), (8.9, 79), (9.7, 84), (10.6, 83),
             (11.6, 81), (13.2, 76), (14.6, 74), (17.7, 81), (18.5, 76), (20.5, 74), (21.5, 69),
             (UNDER + 0.75, 69), (UNDER + 1.95, 64), (UNDER + 4.25, 62)]
    motif += [(TITLE + dt, note) for dt, note in [(-0.05, 72), (0.2, 76), (0.45, 79), (0.7, 84), (1.15, 86)]]
    bell = np.zeros(N)
    partials = [(1.0, 1.0, 1.7), (2.0, 0.36, 0.9), (3.01, 0.17, 0.5), (4.2, 0.08, 0.3), (5.43, 0.05, 0.2)]
    for start, note in motif:
        f = midi(note)
        n = int(3.2 * SR)
        tt = np.arange(n) / SR
        y = sum(a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt / dcy) for r, a, dcy in partials)
        y *= np.minimum(1, tt / 0.004) * (0.7 if T_STREET < start < TITLE - 0.2 else 1.0)
        bell += at(y * 0.09, start)
    bell_st = np.vstack([bell * 0.9, bell * 1.0])

    # Пульс под землёй — как сердцебиение, сгущается к поезду; на титре — низкая нота
    pulse = np.zeros(N)
    beat = UNDER + 0.25
    while beat < TITLE - 0.6:
        pulse += at(tone(48, 0.5, 0.004, 0.13, ((1, 1), (2, 0.25))), beat) * 0.45
        pulse += at(tone(44, 0.4, 0.004, 0.11), beat + 0.22) * 0.25
        beat += 0.83 if beat < UNDER + 1.65 else 0.62
    pulse += at(tone(32.7, 3.0, 0.3, 1.6, ((1, 1), (2, 0.3))), TITLE - 0.05) * 0.8
    # Подъём перед титром
    riser = bp(noise(), 300, 6000) * env([(0, 0), (TITLE - 1.1, 0), (TITLE - 0.08, 1), (TITLE - 0.04, 0), (DUR, 0)]) ** 2 * 0.07
    glide = np.sin(2 * np.pi * np.cumsum(env([(0, 200), (TITLE - 1.1, 200), (TITLE - 0.05, 900), (DUR, 900)])) / SR)
    riser += glide * env([(0, 0), (TITLE - 1.1, 0), (TITLE - 0.1, 0.05), (TITLE - 0.04, 0), (DUR, 0)])

    dry = pad + bell_st + np.vstack([pulse, pulse]) + np.vstack([riser, riser])
    wet = reverb(pad[0] * 0.5 + pad[1] * 0.5 + bell * 1.6, IR_HALL, 0.55)
    return dry + wet


# --- город над головой -----------------------------------------------------

def surface():
    out = np.zeros((2, N))
    win = int((T_SEWER + 3) * SR)

    # Гул улицы: низкий фон + шум потока со стороны авеню (слева, на востоке)
    bed = lp(brown(), 140) * 0.5 + bp(pink(), 180, 1600) * 0.35
    bed *= 1 + 0.25 * np.sin(2 * np.pi * 0.07 * t + 1)
    out += spatial(bed, -20, 1.0, -8, ref=20, doppler=False) * 0.42
    out += np.vstack([bed, bed]) * 0.05  # рассеянный фон со всех сторон

    # Машины 7-й авеню: мотор (гармоники частоты вспышек) + шины, с Доплером и расстоянием
    for car in SCENE['traffic']:
        tc = car['z0'] / car['v']
        if not (-4 < tc < T_SEWER + 2.5):
            continue
        a, b = max(0.0, tc - 6), min(DUR, tc + 6)
        i0, i1 = int(a * SR), int(b * SR)
        n = i1 - i0
        tt = t[i0:i1]
        bus = car['kind'] == 'bus'
        fe = (26 if bus else rng.uniform(38, 52)) * (1 + 0.04 * np.sin(2 * np.pi * rng.uniform(0.1, 0.3) * tt))
        ph = np.cumsum(fe / SR)
        eng = sum(np.sin(2 * np.pi * k * ph) / k ** 0.9 for k in range(1, 11))
        eng = lp(eng + 0.6 * lp(rng.standard_normal(n), 900) * (0.5 + 0.5 * np.sin(2 * np.pi * ph)), 1100 if not bus else 700)
        tyre = bp(rng.standard_normal(n), 350, 2600) * car['v'] / 10
        sig = (eng * (0.55 if bus else 0.32) + tyre * 0.55) * 0.5
        z = car['z0'] - car['v'] * tt
        out += spatial(sig, car['x'], 0.6, z, start=i0, ref=5)

    # Клаксоны такси: короткие, двойные, нетерпеливые — эхо от стен каньона
    def horn(dur, f1=415, f2=523):
        n = int(dur * SR)
        tt = np.arange(n) / SR
        sq = np.sign(np.sin(2 * np.pi * f1 * tt)) * 0.6 + np.sign(np.sin(2 * np.pi * f2 * tt)) * 0.5
        e = np.minimum(1, tt / 0.01) * np.clip((dur - tt) / 0.03, 0, 1)
        return lp(sq * e, 2600)

    horns = np.zeros(N)
    honks = [(2.6, [(0.0, 0.14), (0.2, 0.18)], -16, -20), (5.1, [(0.0, 0.55)], -22, -60), (6.3, [(0.0, 0.1), (0.16, 0.1), (0.32, 0.22)], -13, -5),
             (9.4, [(0.0, 0.3)], -24, -90), (11.1, [(0.0, 0.16), (0.24, 0.2)], -19, -30), (14.2, [(0.0, 0.4)], -14, -70),
             (18.2, [(0.0, 0.2), (0.27, 0.32)], -15, -12)]
    for start, pattern, hx, hz in honks:
        sig = np.zeros(N)
        f1 = rng.uniform(380, 440)
        for off, dur in pattern:
            sig += at(horn(dur, f1, f1 * 1.26), start + off)
        horns += 0  # (накопление для реверберации ниже)
        out += spatial(sig * 0.22, hx, 1.0, hz, ref=8)
        horns += sig * 0.22
    # Далёкая сирена скорой: вой туда-обратно, сзади справа, тонет в эхе
    f = 1050 + 420 * np.sin(2 * np.pi * t / 3.4)
    siren = lp(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR), 3000)
    siren *= env([(0, 0), (5.8, 0), (7.5, 1), (11.5, 1), (13.5, 0), (DUR, 0)])
    out += spatial(siren * 0.06, 220 - 18 * t, 8, 240, ref=40)

    # Толпа: десятки голосов-формант с разных сторон, без слов
    crowd = np.zeros((2, N))
    for k in range(22):
        sig = np.zeros(win)
        pos = 0.0
        while pos < T_SEWER + 2.5:
            ln = rng.uniform(0.08, 0.26)
            if rng.uniform() < 0.25:
                pos += rng.uniform(0.2, 0.9)
                continue
            n = int(ln * SR)
            burst = rng.standard_normal(n) * np.sin(np.pi * np.arange(n) / n) ** 1.5
            f1, f2 = rng.uniform(320, 820), rng.uniform(950, 2400)
            v = bp(burst, f1 * 0.85, f1 * 1.15) + 0.6 * bp(burst, f2 * 0.9, f2 * 1.1)
            i = int(pos * SR)
            if i + n < win:
                sig[i:i + n] += v
            pos += ln * rng.uniform(0.9, 1.3)
        sig = np.concatenate([sig, np.zeros(N - win)])
        ang = rng.uniform(0, 2 * np.pi)
        dist = rng.uniform(4, 22)
        crowd += spatial(sig * 0.05, np.sin(ang) * dist, 1.5, np.cos(ang) * dist, ref=4, doppler=False)
    out += crowd

    # Шаги прохожих рядом (камень, твёрдая подошва)
    for k in range(12):
        x0 = rng.choice([-1, 1]) * rng.uniform(2.6, 6)
        z_start, speed = rng.uniform(-14, 14), rng.choice([-1, 1]) * rng.uniform(1.1, 1.5)
        steps = np.zeros(N)
        st = rng.uniform(0, 14)
        for j in range(16):
            ts = st + j * 0.55
            if ts > T_STREET:
                break
            step = lp(grain(0.04, 0.012, 60, 400), 300) * 1.4
            step[:int(0.012 * SR)] += grain(0.012, 0.004, 1800, 6500) * 0.6
            steps += at(step, ts)
        zpath = z_start + speed * (t - st)
        out += spatial(steps * 0.18, x0, 0.05, zpath, ref=3)

    # Голуби: воркуют у ног, на треске плитки взлетают — хлопки крыльев уходят вверх
    for k in range(5):
        ts = rng.uniform(0.5, 11.5)
        coo = np.zeros(int(1.1 * SR))
        for j, (off, dur, f) in enumerate([(0, 0.18, 380), (0.24, 0.32, 420), (0.62, 0.22, 360)]):
            n = int(dur * SR)
            tt = np.arange(n) / SR
            ff = f * (1 + 0.02 * np.sin(2 * np.pi * 24 * tt))
            v = lp(np.sin(2 * np.pi * np.cumsum(ff) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(ff) / SR), 900) * np.sin(np.pi * tt / dur) ** 2
            i = int(off * SR)
            coo[i:i + n] += v
        out += spatial(at(coo * 0.12, ts), rng.uniform(0.8, 3.4), 0.2, -rng.uniform(2.6, 5.6), ref=3, doppler=False)
    flaps = np.zeros(N)
    for k in range(7):
        start = CRACK + 0.15 + rng.uniform(0, 0.25)
        rate = rng.uniform(11, 15)
        for j in range(int(rate * 1.6)):
            ts = start + j / rate
            flaps += at(grain(0.03, 0.009, 500, 4500) * np.exp(-j / (rate * 0.8)), ts)
    fly = np.clip((t - CRACK - 0.15) / 2.0, 0, 1)
    out += spatial(flaps * 0.3, 2.0 + 6 * fly, 0.3 + 9 * fly, -3.5 - 10 * fly, ref=3, doppler=False)

    # Пар из полосатой трубы на авеню; шкворчит тележка с хот-догами
    hiss = (hp(noise(), 1500) * 0.6 + bp(noise(), 350, 900) * 0.4) * (1 + 0.35 * lp(noise(), 3) * 3)
    out += spatial(hiss * 0.13, -15.5, 2.5, -24, ref=6, doppler=False)
    sizzle = np.zeros(N)
    for ts in rng.uniform(0, T_SEWER, int(260 * T_SEWER / 17.55)):
        sizzle += at(grain(0.006, 0.002, 3000, 9000), ts)
    out += spatial(sizzle * 0.12 + hp(noise(), 4000) * 0.01, -7.2, 1.0, -9, ref=3, doppler=False)

    # Поезд метро проходит под площадью — пол чуть дрожит (предвестник)
    rumble = lp(brown(), 70) * env([(0, 0), (6.0, 0), (7.6, 1), (8.8, 1), (10.2, 0), (DUR, 0)])
    rattle = bp(noise(), 1500, 5000) * env([(0, 0), (6.6, 0), (7.8, 0.4), (8.6, 0.4), (9.6, 0), (DUR, 0)])
    out += spatial(rumble * 0.55 + rattle * 0.03, 7.2, -3, -12, ref=6, doppler=False)

    # Эхо улицы-каньона
    out += reverb(out[0] * 0.5 + out[1] * 0.5, IR_CANYON, 0.32)
    # Уходим под землю: из шахты город слышен через отверстие над головой — глуше, тише и с эхом трубы;
    # из коллектора — едва; под водой и в грунте — почти ничего
    cut = env([(0, 18000), (T_STREET - 0.5, 18000), (T_STREET + 0.3, 5000), (T_SEWER - 0.3, 2200), (T_SEWER + 0.4, 900),
               (UNDER - 0.1, 700), (UNDER + 0.05, 300), (UNDER + 0.5, 200), (DUR, 160)])
    gain = env([(0, 1), (T_STREET - 0.5, 1), (T_STREET + 0.4, 0.55), (T_SEWER - 0.2, 0.35), (T_SEWER + 0.5, 0.14),
                (UNDER - 0.1, 0.1), (UNDER + 0.4, 0.05), (DUR, 0.03)])
    out = np.stack([vlp(out[c], cut) for c in range(2)]) * gain
    tube = env([(0, 0), (T_STREET - 0.3, 0), (T_STREET + 0.4, 1), (T_SEWER, 1), (T_SEWER + 0.6, 0), (DUR, 0)])
    out += reverb((out[0] + out[1]) * 0.5 * tube, IR_SHAFT, 0.5)
    hall = env([(0, 0), (T_SEWER - 0.2, 0), (T_SEWER + 0.4, 1), (UNDER, 1), (UNDER + 0.3, 0), (DUR, 0)])
    return out + reverb((out[0] + out[1]) * 0.5 * hall, IR_SEWER, 0.6)


# --- люк и шахта ------------------------------------------------------------

def iron_hit(scale=1.0, f0=1.0, length=1.6):
    """Удар чугунной крышки о раму: неравномерные моды диска, щелчок и глухой удар."""
    n = int(length * SR)
    tt = np.arange(n) / SR
    modes = [(96, 0.55, 1.0), (233, 0.4, 0.7), (412, 0.32, 0.55), (689, 0.24, 0.45), (1023, 0.17, 0.35),
             (1530, 0.11, 0.25), (2210, 0.07, 0.18), (3170, 0.05, 0.1)]
    y = sum(a * np.sin(2 * np.pi * f * f0 * tt + rng.uniform(0, 6.3)) * np.exp(-tt / d) for f, d, a in modes)
    y += np.sin(2 * np.pi * (58 * tt - 10 * tt ** 2)) * np.exp(-tt / 0.18) * 1.4
    y[:int(0.03 * SR)] += grain(0.03, 0.005, 1800, 9000) * 1.2
    return y * scale


def manhole():
    out = np.zeros((2, N))
    feet = (0.0, 0.15, 0.0)
    cover_y = SCENE['plaza'] - depth  # крышка у подошв

    # Лязг: крышка проседает в раме и дважды «качается»; пар со свистом вырывается из-под обода
    hit = at(iron_hit(1.0), CRACK) + at(iron_hit(0.38, 1.03, 1.0), CRACK + 0.11) + at(iron_hit(0.2, 0.98, 0.8), CRACK + 0.19)
    out += spatial(hit * 0.5, *feet, ref=2, doppler=False)
    puff = (hp(noise(), 1400) * 0.7 + bp(noise(), 300, 900) * 0.5) * env([(0, 0), (CRACK, 0), (CRACK + 0.04, 1), (CRACK + 0.5, 0.35), (13.6, 0.12), (15.4, 0.05), (16.2, 0), (DUR, 0)])
    puff *= 1 + 0.4 * lp(noise(), 6) * 3
    out += spatial(puff * 0.16, 0.3, 0.3, -0.1, ref=1.5, doppler=False)

    # Крышка срывается и ползёт вниз по чугунному вороту: скрежет рывками, звон металла
    v = np.gradient(depth) * SR
    contact = np.clip(v / 0.5, 0, 1) * (depth < 0.52) * (t > 13.9)
    stick = np.clip(lp(noise(), 14) * 6, 0, None)  # рывки «прилипания»
    scrape = bp(noise(), 700, 3200) * (0.4 + stick) + lp(brown(), 220) * 0.8
    ring = sum(bp(noise(), f * 0.985, f * 1.015, 2) * 6 for f in (412, 689, 1023, 1530))
    out += spatial((scrape * 0.5 + ring * 0.35 * stick) * contact * 0.85, 0.4, cover_y, 0.0, ref=1.5, doppler=False)
    out += spatial(at(iron_hit(0.45, 0.92, 1.0), 13.95) * 0.5, *feet, ref=2, doppler=False)  # сорвалась
    # ниже ворота крышка уже не трётся о стены: только поскрипывает и шуршит воздух
    creaks = np.zeros(N)
    pos = 15.6
    while pos < UNDER - 0.4:
        ln = int(rng.uniform(0.12, 0.3) * SR)
        f = rng.uniform(260, 520)
        tt = np.arange(ln) / SR
        c = np.sin(2 * np.pi * np.cumsum(f * (1 + 0.25 * tt / tt[-1]) * (1 + 0.04 * rng.standard_normal(ln))) / SR)
        creaks += at(bp(c * np.sin(np.pi * tt / tt[-1]) ** 2, f * 0.7, f * 3) * rng.uniform(0.3, 0.8), pos)
        pos += rng.uniform(0.7, 1.5)
    air = lp(noise(), 500) * np.clip(v / 1.2, 0, 1) * (t > 15.0) * (t < UNDER)
    out += np.vstack([creaks * 0.13 + air * 0.07] * 2)

    # Браслет: сигнал, когда подносим к глазам, и тихие тики каждые 10 см глубины
    ui = np.zeros(N)
    c0 = SCENE['check'][1][0] + 0.3
    chirp = np.concatenate([tone(1760, 0.08, 0.003, 0.05), np.zeros(int(0.025 * SR)), tone(2637, 0.1, 0.003, 0.06)])
    ui += at(chirp * 0.5, c0)
    last = None
    for i in range(int(c0 * SR), int((c0 + 1.1) * SR), int(0.005 * SR)):
        step = int(depth[i] * 10)
        if last is not None and step != last:
            ui += at(tone(3200, 0.02, 0.001, 0.006) * 0.25, i / SR)
        last = step
    out += np.vstack([ui * 0.8, ui * 0.55])

    # Крышка входит в воду: шлепок, всплеск, брызги; дальше вода плещется вокруг тела
    n = int(0.25 * SR)
    tt = np.arange(n) / SR
    plop = np.sin(2 * np.pi * np.cumsum(170 * np.exp(-tt / 0.08) + 55) / SR) * np.exp(-tt / 0.09)
    splash = bp(rng.standard_normal(int(0.9 * SR)), 300, 6000) * np.exp(-np.arange(int(0.9 * SR)) / SR / 0.22)
    drops = np.zeros(int(1.2 * SR))
    for k in range(18):
        i = int(rng.uniform(0.05, 1.0) * SR)
        d = tone(rng.uniform(1300, 2600), 0.06, 0.001, 0.02)
        drops[i:i + len(d)] += d[:len(drops) - i] * rng.uniform(0.1, 0.35)
    wet = at(plop * 0.9, T_WATER) + at(splash * 0.7, T_WATER + 0.01) + at(drops * 0.5, T_WATER + 0.05)
    out += spatial(wet * 0.55, 0.0, MH['water'], -0.2, ref=1.5, doppler=False)
    slosh = bp(noise(), 250, 2600) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.8 * t)) * (1 + lp(noise(), 3) * 3)
    slosh *= env([(0, 0), (T_WATER, 0), (T_WATER + 0.3, 1), (UNDER - 0.1, 1.3), (UNDER + 0.05, 0), (DUR, 0)])
    out += np.vstack([slosh * 0.07, slosh * 0.065])

    # Вода смыкается над головой: пузыри, глухо; потом сквозь дно — «ух» и звон в ушах
    bub = np.zeros(N)
    for k in range(16):
        ts = UNDER - 0.08 + rng.uniform(0, 0.45)
        n = int(0.05 * SR)
        tt = np.arange(n) / SR
        f = rng.uniform(260, 520) * (1 + 2.0 * tt / tt[-1])
        bub += at(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.02) * rng.uniform(0.3, 1), ts)
    out += np.vstack([lp(bub, 1800) * 0.3] * 2)
    n = int(1.4 * SR)
    tt = np.arange(n) / SR
    whoomp = (np.sin(2 * np.pi * (52 * tt - 8 * tt ** 2)) * np.exp(-tt / 0.35) + lp(rng.standard_normal(n), 220) * np.exp(-tt / 0.2) * 0.8)
    ringing = np.sin(2 * np.pi * 4200 * tt) * np.exp(-tt / 0.9) * 0.012
    through = at(whoomp * 0.9, UNDER - 0.04) + at(ringing, UNDER)
    out += np.vstack([through, through])

    # Внутри шахты всё близкое звенит трубой: частое эхо от кирпичных стен
    shaft = env([(0, 0), (14.5, 0), (T_STREET - 0.2, 1), (T_SEWER, 1), (T_SEWER + 0.5, 0), (DUR, 0)])
    return out + reverb((out[0] + out[1]) * 0.5 * shaft, IR_SHAFT, 0.45)


# --- коллектор ----------------------------------------------------------------

def sewer():
    out = np.zeros((2, N))
    W = MH['water']
    # Поток в лотке: шум воды, бульканье, низкий гул — три источника вдоль тоннеля
    for z in (0.0, -9.0, 8.0):
        flow = bp(pink(), 160, 3500) * (1 + 0.5 * lp(noise(), 5) * 3) + lp(brown(), 180) * 0.6
        gurgle = bp(noise(), 280, 900) * np.clip(lp(noise(), 9) * 5, 0, None)
        out += spatial((flow * 0.5 + gurgle * 0.4) * 0.3, 0.0, W, z, ref=2.5, doppler=False)
    # Струя из трубы в стене бьёт в воду
    ix, iy, iz = MH['inlet']
    pour = bp(noise(), 400, 7000) * (0.6 + np.clip(lp(noise(), 30) * 4, 0, None)) + lp(noise(), 300) * 0.5
    out += spatial(pour * 0.22, ix + 0.73, W, iz, ref=1.5, doppler=False)
    # Капли со свода — в тех же местах и в те же моменты, что в кадре
    def plink(on_water):
        n = int(0.12 * SR)
        tt = np.arange(n) / SR
        if on_water:
            f = rng.uniform(1100, 1700) * (1 + 1.2 * (1 - np.exp(-tt / 0.012)))
            return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.04)
        return hp(rng.standard_normal(n), 2500) * np.exp(-tt / 0.006)
    for x, z, period, phase in MH['drips']:
        sig = np.zeros(N)
        ts = phase
        while ts < UNDER:
            if ts > 0:
                sig += at(plink(abs(x) < 0.62) * rng.uniform(0.6, 1.0), ts)
            ts += period
        out += spatial(sig * 0.2, x, W if abs(x) < 0.62 else -4.45, z, ref=1.5, doppler=False)
    # Капля из патрубка в шахте долетает до воды внизу
    px, py, pz = MH['shaft_pipe']
    sig = np.zeros(N)
    fall = np.sqrt(2 * (py - 0.09 - W) / 9.81)
    ts = 0.0
    while ts < UNDER:
        sig += at(plink(True), ts + fall)
        ts += MH['stub_drip']
    out += spatial(sig * 0.12, px - 0.15, W, pz, ref=1.5, doppler=False)
    # Крыса: пискнула, сорвалась и убежала вперёд по полке — частый топот коготков
    R = MH['rat']
    run = np.maximum(0, t - R['run'])
    rz = R['z0'] - R['speed'] * (run - 0.12 * (1 - np.exp(-run / 0.12)))

    def squeak(length):
        n = int(length * SR)
        tt = np.arange(n) / SR
        f = 5600 + 1500 * np.sin(2 * np.pi * 26 * tt) - 900 * tt / length
        y = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR)
        return y * np.sin(np.pi * tt / length) ** 1.5
    rat = at(squeak(0.07), R['run'] - 0.75) + at(squeak(0.05), R['run'] - 0.02) + at(squeak(0.09), R['run'] + 0.18) + at(squeak(0.06), R['run'] + 0.42)
    pos = R['run']
    while pos < R['run'] + 1.6:
        rat += at(grain(0.006, 0.0015, 3500, 9000) * rng.uniform(0.3, 1), pos) * 0.5
        pos += rng.uniform(0.03, 0.06)
    out += spatial(rat * 0.1, R['x'], -4.4, rz, ref=1.2, doppler=False)
    # Где-то за стеной идёт поезд метро — гул сквозь кирпич (предвестник)
    rumble = lp(brown(), 60) * env([(0, 0), (T_SEWER, 0), (T_SEWER + 1.2, 1), (UNDER, 0.8), (DUR, 0.8)])
    out += spatial(rumble * 0.4, -6, SOIL - 7, -14, ref=6, doppler=False)
    # Гулкий коллектор: длинное мокрое эхо
    out += reverb((out[0] + out[1]) * 0.5, IR_SEWER, 0.55)
    # Слышно: из-под крышки — едва, из шахты — всё яснее, в коллекторе — в полную силу, под водой — глухо
    heard = env([(0, 0), (CRACK, 0), (CRACK + 0.05, 0.05), (14.0, 0.06), (15.5, 0.18), (T_STREET, 0.4),
                 (T_SEWER - 0.4, 0.8), (T_SEWER + 0.2, 1), (UNDER - 0.05, 1), (UNDER + 0.15, 0.12), (UNDER + 1.2, 0), (DUR, 0)])
    cut = env([(0, 700), (T_STREET, 1500), (T_SEWER - 0.3, 5000), (T_SEWER + 0.2, 16000), (UNDER - 0.06, 16000), (UNDER + 0.04, 350), (DUR, 200)])
    return np.stack([vlp(out[c], cut) for c in range(2)]) * heard


# --- под землёй -----------------------------------------------------------

def underground():
    out = np.zeros((2, N))
    below = env([(0, 0), (UNDER - 0.1, 0), (UNDER + 0.25, 1), (DUR, 1)])
    # Толща земли: низкий гул, шорох грунта, редкие скрипы породы
    earth = lp(brown(), 90) * 0.9 + lp(pink(), 1600) * 0.12 * (1 + 0.5 * np.sin(2 * np.pi * 0.37 * t))
    creaks = np.zeros(N)
    pos = UNDER + 0.6
    while pos < DUR - 0.5:
        n = int(rng.uniform(0.25, 0.6) * SR)
        f0 = rng.uniform(140, 380)
        tt = np.arange(n) / SR
        creak = np.sin(2 * np.pi * np.cumsum(f0 * (1 + 0.3 * tt)) / SR) * (1 + 0.6 * rng.standard_normal(n)) * np.sin(np.pi * tt / tt[-1]) ** 2
        creaks += at(bp(creak, f0 * 0.6, f0 * 3) * rng.uniform(0.3, 1), pos)
        pos += rng.uniform(0.7, 1.6)
    out += np.vstack([earth, earth]) * below * 0.22
    out += spatial(creaks * 0.18, rng.uniform(-3, 3), SOIL - 6, rng.uniform(-3, 3), ref=4, doppler=False) * below

    # Трубы: вода в водопроводе, пар, гудение кабелей — громче, когда проезжаем мимо.
    # С площади их не слышно: всё это начинается, только когда уши уходят под плитку.
    pipes = np.zeros((2, N))
    water = bp(pink(), 160, 800) * (1 + 0.8 * lp(noise(), 6) * 4)
    pipes += spatial(through_soil(water * 0.45, SOIL - 1.7), 1.4, SOIL - 1.7, 0, ref=1.5, doppler=False)
    steam = hp(noise(), 2200) * (1 + 0.4 * lp(noise(), 4) * 4)
    pipes += spatial(through_soil(steam * 0.22, SOIL - 2.6), 0, SOIL - 2.6, -1.3, ref=1.5, doppler=False)
    hum_ph = 2 * np.pi * 60 * t
    hum = np.sin(hum_ph) + 0.6 * np.sin(2 * hum_ph) + 0.35 * np.sin(3 * hum_ph) + 0.2 * np.sin(4 * hum_ph)
    hum = np.clip(hum * 1.4, -1, 1) * 0.5
    pipes += spatial(through_soil(hum * 0.18, SOIL - 3.3), -1.3, SOIL - 3.3, 0, ref=1.5, doppler=False)
    # Капли воды
    drops = np.zeros(N)
    for ts in rng.uniform(UNDER + 0.3, UNDER + 2.45, 14):
        n = int(0.12 * SR)
        tt = np.arange(n) / SR
        f = rng.uniform(1500, 2600) * (1 + 0.6 * np.exp(-tt / 0.01))
        drops += at(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.035), ts)
    pipes += spatial(drops * 0.12, rng.uniform(-2, 2), SOIL - 3, rng.uniform(-2, 2), ref=2, doppler=False)
    out += pipes * below

    # Скала: тяжёлый скрежет и глубокие трещины
    rock = (t > TUNNEL_BOTTOM_T).astype(float)
    grindr = lp(brown(), 180) * env([(0, 0), (TUNNEL_BOTTOM_T, 0), (UNDER + 4.05, 1), (DUR, 1)])
    deep = np.zeros(N)
    for ts in [UNDER + 3.75, UNDER + 4.5, UNDER + 5.15]:
        deep += at(lp(grain(0.9, 0.25, 40, 400), 300) * 2.5, ts)
    out += np.vstack([hp(grindr, 30) * 0.16 + deep * 0.3] * 2) * rock
    return out + reverb(out[0] * 0.5 + out[1] * 0.5, IR_EARTH, 0.35)


TUNNEL_BOTTOM_T = float(t[np.argmax(eye_y < TUNNEL_BOTTOM)])


def train():
    """Поезд метро: тележки стучат на стыках, колёса и моторы, свист реборд, гудок, порыв воздуха."""
    out = np.zeros((2, N))
    front0 = lambda tt: -7.5 + TR['speed'] * (tt - TR['pass'])  # noqa: E731 — x передней кромки
    a, b = TR['pass'] - 2.4, min(DUR, TR['pass'] + 2.8)
    i0, i1 = int(a * SR), int(b * SR)
    tt = t[i0:i1]
    n = i1 - i0
    bogies = [-2.5, -12.5, -18.1, -28.1, -33.7, -43.7]
    for off in bogies:
        xs = front0(tt) + off
        clacks = np.zeros(n)
        joints = np.floor(xs / 18.3)
        cross = np.nonzero(np.diff(joints) != 0)[0]
        for c in cross:
            for axle in (0, int(2.5 / TR['speed'] * SR)):
                g = lp(grain(0.05, 0.015, 60, 600), 400)
                g[:int(0.03 * SR)] += grain(0.03, 0.006, 600, 5000) * 1.5
                j = c + axle
                k = min(len(g), n - j)
                if k > 0:
                    clacks[j:j + k] += g[:k]
        roll = bp(rng.standard_normal(n), 250, 3200) * 0.55 + lp(rng.standard_normal(n), 120) * 0.8
        out += spatial(np.concatenate([np.zeros(i0), clacks * 0.6 + roll * 0.35, np.zeros(N - i1)])[i0:i1], xs, SOIL - 9.4, TR['track'], start=i0, ref=3)
    # Моторы: тональный вой на каждом вагоне
    for car in range(3):
        xs = front0(tt) - 7.5 - car * 15.6
        fw = 760 + 120 * (tt - a) / (b - a)
        ph = np.cumsum(fw / SR)
        whine = np.sin(2 * np.pi * ph) + 0.45 * np.sin(4 * np.pi * ph) + 0.2 * np.sin(2 * np.pi * 3.02 * ph)
        out += spatial(whine * 0.05, xs, SOIL - 8.6, TR['track'], start=i0, ref=3)
    # Гудок на подходе и свист реборд на проходе
    hn = int(0.65 * SR)
    ht = np.arange(hn) / SR
    horn = lp(np.sign(np.sin(2 * np.pi * 330 * ht)) * 0.6 + np.sign(np.sin(2 * np.pi * 415 * ht)) * 0.5, 2200) * np.minimum(1, ht / 0.02) * np.clip((0.65 - ht) / 0.06, 0, 1)
    hs = int((TR['pass'] - 0.55) * SR) - i0
    horn_sig = np.zeros(n)
    horn_sig[hs:hs + hn] = horn
    out += spatial(horn_sig * 0.35, front0(tt), SOIL - 7.8, TR['track'], start=i0, ref=4)
    sq = np.zeros(n)
    s0 = int((TR['pass'] + 0.1 - a) * SR)
    sn = int(0.55 * SR)
    st_ = np.arange(sn) / SR
    sq[s0:s0 + sn] = np.sin(2 * np.pi * 2850 * st_ + 3 * np.sin(2 * np.pi * 7 * st_)) * np.sin(np.pi * st_ / st_[-1]) ** 2
    out += spatial(sq * 0.06, front0(tt) - 20, SOIL - 9.4, TR['track'], start=i0, ref=3)
    # Порыв воздуха, пока вагоны проносятся в двух метрах
    blast = (bp(noise(), 120, 5000) * 0.8 + lp(brown(), 90) * 1.2) * env([(0, 0), (TR['pass'] - 0.3, 0), (TR['pass'] + 0.05, 1), (TR['pass'] + 0.9, 0.8), (TR['pass'] + 1.4, 0), (DUR, 0)])
    out += np.vstack([blast, blast]) * 0.22
    # Пока мы в грунте — поезд слышен глухо сквозь землю; в тоннеле — открыто и гулко
    open_ = env([(0, 0), (UNDER + 2.0, 0), (UNDER + 2.17, 1), (UNDER + 3.3, 1), (UNDER + 3.5, 0.0), (DUR, 0)])
    cut = 250 + 17000 * open_
    dry = np.stack([vlp(out[c], cut) for c in range(2)])
    wet = reverb(out[0] * 0.5 + out[1] * 0.5, IR_TUNNEL, 0.5) * open_
    return dry * (0.45 + 0.55 * open_) + wet


# --- сведение ---------------------------------------------------------------

def compress(x, threshold_db=-16, ratio=2.4, attack=0.01, release=0.18):
    level = np.sqrt(lp(np.mean(x ** 2, axis=0), 30) + 1e-12)
    db = 20 * np.log10(level)
    over = np.maximum(0, db - threshold_db)
    gr_db = over - over / ratio
    # сглаживание усиления: быстрое нарастание, медленный отпуск
    g = np.empty_like(gr_db)
    a_coef, r_coef = np.exp(-1 / (attack * SR)), np.exp(-1 / (release * SR))
    state = 0.0
    for i in range(0, len(gr_db), 32):
        target = gr_db[i]
        coef = a_coef ** 32 if target > state else r_coef ** 32
        state = target + (state - target) * coef
        g[i:i + 32] = state
    return x * 10 ** (-g / 20)


def lufs(x):
    """Интегральная громкость по ITU-R BS.1770 (K-фильтр, блоки 400 мс, абсолютный и относительный пороги)."""
    from scipy.signal import lfilter
    k = lfilter([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585], x, axis=1)
    k = lfilter([1, -2, 1], [1, -1.99004745483398, 0.99007225036621], k, axis=1)
    blk, hop = int(0.4 * SR), int(0.1 * SR)
    ms = np.array([np.sum(np.mean(k[:, i:i + blk] ** 2, axis=1)) for i in range(0, k.shape[1] - blk, hop)])
    loud = -0.691 + 10 * np.log10(ms + 1e-12)
    ms = ms[loud > -70]
    rel = -0.691 + 10 * np.log10(np.mean(ms)) - 10
    ms = ms[-0.691 + 10 * np.log10(ms) > rel]
    return -0.691 + 10 * np.log10(np.mean(ms))


def stem(fn, seed):
    """Каждая дорожка со своим зерном: правка одной не меняет случайные детали других."""
    global rng
    rng = np.random.default_rng(seed)
    return fn()


def main():
    stems = {
        'music': stem(music, 1) * 0.7,  # музыка под шумами: город и поезд должны быть слышны первыми
        'surface': stem(surface, 2) * 1.35,
        'manhole': stem(manhole, 3) * 1.3,
        'sewer': stem(sewer, 4) * 1.0,
        'underground': stem(underground, 5) * 1.0,
        'train': stem(train, 6) * 1.3,
    }
    mix = sum(stems.values())
    # титр: шумы уходят, остаётся музыка
    sfx_fade = env([(0, 1), (TITLE - 0.2, 1), (TITLE + 1.0, 0.25), (DUR, 0.1)])
    mix = stems['music'] + (mix - stems['music']) * sfx_fade
    mix *= env([(0, 0), (0.6, 1), (DUR - 0.6, 1), (DUR, 0)])
    mix = hp(mix, 28)  # инфразвук не слышен, но съедает запас по громкости
    mix = compress(mix)
    mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6) / np.tanh(1.6)
    mix *= 0.89 / np.max(np.abs(mix))
    # громкость как у роликов на YouTube (-14 LUFS), но без превышения пика
    mix *= min(1.0, 10 ** ((-14 - lufs(mix)) / 20))
    out = HERE / 'out' / 'audio.wav'
    out.parent.mkdir(exist_ok=True)
    with wave.open(str(out), 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix.T * 32767).astype('<i2').tobytes())
    rms = {k: round(20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-12), 1) for k, v in stems.items()}
    print(out.relative_to(HERE.parent), f'{lufs(mix):.1f} LUFS, stem RMS dB:', rms)


if __name__ == '__main__':
    main()
