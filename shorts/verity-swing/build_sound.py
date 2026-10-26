#!/usr/bin/env python3
"""Звук для шортса «La Peace раскручивает Verity на качелях».

Музыка пишется как MIDI и рендерится FluidSynth с банком FluidR3_GM, все шумовые
эффекты синтезируются здесь же, озвучка — готовые дубли из vo/ (клон голоса).
Ничего чужого (сэмплов, треков) в звуке нет.

    python3 build_sound.py <папка-для-сборки>            # с озвучкой
    python3 build_sound.py <папка-для-сборки> --no-vo    # только музыка и эффекты

Результат: <папка>/mix.wav или mix_no_vo.wav — 48 кГц, стерео, 5.88 с, −14 LUFS.

Сетка: 107.14 BPM, доля 0.56 с, нулевая доля на 0.24 с. Быстрые круги качелей
(низ в 3.04, 3.32, 3.60, 3.88, 4.16) — ровно восьмые, запуск — 7-я доля (4.16).
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import mido
import numpy as np
import pyloudnorm as pyln
import soundfile as sf
from scipy import ndimage, signal

HERE = Path(__file__).resolve().parent
SR = 48000
LEN = 5.88                     # длина видео
N = int(round(LEN * SR))
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'
BEAT, T0 = 0.56, 0.24
LUFS = -14.0

rng = np.random.default_rng(7)


def b(x):
    """Время доли x в секундах."""
    return T0 + x * BEAT


def db(x):
    return 10 ** (x / 20)


# ------------------------------------------------------------------ шины
class Bus:
    def __init__(self):
        self.x = np.zeros((N, 2))

    def add(self, y, t, gain=1.0, pan=0.0):
        """Моно y в момент t; pan от −1 (лево) до 1, или пара (от, до)."""
        y = np.asarray(y, float)
        i = int(round(t * SR))
        if i < 0:
            y, i = y[-i:], 0
        n = min(len(y), N - i)
        if n <= 0:
            return
        y = y[:n] * gain
        p = np.linspace(*pan, n) if isinstance(pan, tuple) else np.full(n, pan)
        th = (p + 1) * np.pi / 4
        self.x[i:i + n, 0] += y * np.cos(th)
        self.x[i:i + n, 1] += y * np.sin(th)

    def add_stereo(self, y, t=0.0, gain=1.0):
        i = int(round(t * SR))
        n = min(len(y), N - i)
        self.x[i:i + n] += y[:n] * gain


def fit(y):
    """Обрезать или дополнить до длины видео, сделать стерео."""
    y = np.asarray(y, float)
    if y.ndim == 1:
        y = np.stack([y, y], 1)
    out = np.zeros((N, 2))
    out[:min(N, len(y))] = y[:N]
    return out


def fade(x, t0, t1):
    """Громкость линейно в ноль от t0 до t1 и тишина после."""
    g = np.ones(N)
    i0, i1 = int(t0 * SR), int(t1 * SR)
    g[i0:i1] = np.linspace(1, 0, i1 - i0)
    g[i1:] = 0
    return x * g[:, None]


# ------------------------------------------------------------------ фильтры
def hp(y, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'hp', fs=SR, output='sos'), y, axis=0)


def lp(y, f, order=2):
    return signal.sosfilt(signal.butter(order, f, 'lp', fs=SR, output='sos'), y, axis=0)


def bp(y, f0, f1, order=2):
    return signal.sosfilt(signal.butter(order, [f0, f1], 'bp', fs=SR, output='sos'), y, axis=0)


def peak_eq(y, f, gain_db, q=1.0):
    """Колокол RBJ."""
    a = 10 ** (gain_db / 40)
    w = 2 * np.pi * f / SR
    al = np.sin(w) / (2 * q)
    bb = [1 + al * a, -2 * np.cos(w), 1 - al * a]
    aa = [1 + al / a, -2 * np.cos(w), 1 - al / a]
    return signal.lfilter(bb, aa, y, axis=0)


def band_sweep(x, fc, q=1.4):
    """Полосовой фильтр с центром, который меняется во времени (fc — функция 0..1)."""
    f, tt, z = signal.stft(x, SR, nperseg=1024)
    c = fc(np.clip(tt / (len(x) / SR), 0, 1))
    mask = np.exp(-0.5 * ((f[:, None] - c[None]) / (c[None] / q)) ** 2)
    _, y = signal.istft(z * mask, SR, nperseg=1024)
    return y[:len(x)]


def norm(y):
    return y / (np.max(np.abs(y)) + 1e-12)


def reverb(x, rt60, wet, pre=0.012, seed=1):
    """Свёртка с синтетическим залом: шум с экспоненциальным спадом, хвост темнее."""
    r = np.random.default_rng(seed)
    n = int(rt60 * 1.3 * SR)
    t = np.arange(n) / SR
    ir = r.standard_normal((n, 2)) * np.exp(-6.91 * t / rt60)[:, None]
    ir = lp(ir, 5000, 1)
    ir = np.vstack([np.zeros((int(pre * SR), 2)), ir])
    ir /= np.sqrt(np.sum(ir ** 2, axis=0))
    wetx = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], 1)
    return (1 - wet) * x + wet * wetx


# ------------------------------------------------------------------ музыка
PIZZ, BSN, TREM, HARP, TUBA, XYL, STR, HIT, DRUM, TIMP, CHOIR, PAD, CEL = range(13)
PROGRAMS = {PIZZ: 45, BSN: 70, TREM: 44, HARP: 46, TUBA: 58, XYL: 13, STR: 48, HIT: 55,
            TIMP: 47, CHOIR: 52, PAD: 89, CEL: 8}
# канал 9 в GM — ударные, поэтому DRUM = 8 переназначается на 9
CH = {k: (9 if k == DRUM else (k if k < 9 else k + 1)) for k in range(13)}
KICK, SNARE, HAT, CRASH = 36, 38, 42, 49


def render(name, notes, out_dir, expr=None):
    """notes: (начало с, длина с, нота, сила, инструмент) → стерео-массив."""
    mid = mido.MidiFile(ticks_per_beat=480)   # 120 BPM по умолчанию: 1 с = 960 тиков
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    ev = []
    for inst in {n[4] for n in notes}:
        ch = CH[inst]
        if inst in PROGRAMS:
            ev.append((0, 0, mido.Message('program_change', channel=ch, program=PROGRAMS[inst])))
        ev.append((0, 0, mido.Message('control_change', channel=ch, control=7, value=110)))
    for t, d, p, v, inst in notes:
        ch = CH[inst]
        ev.append((int(t * 960), 1, mido.Message('note_on', channel=ch, note=p, velocity=v)))
        ev.append((int((t + d) * 960), 0, mido.Message('note_off', channel=ch, note=p)))
    for t, inst, val in expr or []:               # CC11 — нарастание внутри нот
        ev.append((int(t * 960), 0, mido.Message('control_change', channel=CH[inst],
                                                 control=11, value=val)))
    ev.sort(key=lambda e: (e[0], e[1]))
    last = 0
    for tick, _, msg in ev:
        tr.append(msg.copy(time=tick - last))
        last = tick
    tr.append(mido.MetaMessage('end_of_track', time=960))
    mpath, wpath = out_dir / f'{name}.mid', out_dir / f'{name}.wav'
    mid.save(mpath)
    subprocess.run(['fluidsynth', '-ni', '-q', '-R', '0', '-C', '0', '-g', '0.6', '-r', str(SR),
                    '-F', str(wpath), SF2, str(mpath)], check=True, capture_output=True)
    y, sr = sf.read(wpath, always_2d=True)
    assert sr == SR
    return fit(y)


def music_main():
    """A: «на цыпочках» пиццикато, качели взлетают и зависают. B: галоп до запуска."""
    st = 0.09
    n = [(b(-0.25), st, 57, 62, PIZZ)]                              # затакт A3
    for beat, root, chord in [(0, 38, (50, 53, 57)), (1, 33, (49, 52, 55)),
                              (2, 38, (50, 53, 57))]:
        n += [(b(beat), 0.16, root, 90, PIZZ), (b(beat), st, root + 12, 72, BSN)]
        n += [(b(beat + .5), st, p, 56, PIZZ) for p in chord]
    n += [(b(x), st, p, 76, PIZZ) for x, p in [(0, 62), (.5, 65), (1, 69), (1.5, 68)]]
    # доля 2: качели пошли вверх — пробежка шестнадцатыми
    n += [(b(2 + i / 4), st, p, 70 + 6 * i, PIZZ) for i, p in enumerate([69, 70, 72, 73])]
    # доля 3: зависли наверху
    n += [(b(3), 0.40, p, 72, TREM) for p in (69, 74, 76)]
    # падение вниз: глиссандо арфы
    gl = [86, 84, 82, 81, 79, 77, 76, 74, 72, 70, 69, 67, 65, 64, 62]
    n += [(2.20 + i * 0.0175, 0.3, p, 84, HARP) for i, p in enumerate(gl)]
    # доля 4: «Speed?»
    n += [(b(4), 0.6, 38, 104, TIMP), (b(4), 0.16, 38, 92, PIZZ), (b(4), st, 50, 72, BSN)]
    # доли 5–7: галоп, аккорд на каждую восьмую (= круг качелей)
    harmony = [(38, (62, 65, 69)), (34, (62, 65, 70)), (36, (64, 67, 72)), (33, (64, 67, 73))]
    for i, (root, chord) in enumerate(harmony):
        t = b(5 + i / 2)
        n += [(t, 0.2, root, 100, TUBA)]
        n += [(t, 0.27, p, 84 + 8 * i, STR) for p in chord]
    xy = [74, 76, 77, 79, 81, 82, 85, 88]
    n += [(b(5 + i / 4), 0.12, p, 84 + 5 * i, XYL) for i, p in enumerate(xy)]
    # доля 7: удар — запуск
    n += [(b(7), 0.16, p, 124, HIT) for p in (50, 62, 74)]
    n += [(b(7), 0.16, 38, 124, TUBA), (b(7), 0.12, 86, 116, XYL)]
    n += [(b(7), 0.16, p, 118, STR) for p in (62, 69, 74)]
    expr = [(0, STR, 70)] + [(b(5) + i * 0.035, STR, min(127, 70 + 2 * i)) for i in range(32)]
    return n, expr


def music_drums():
    n = [(2.76 + i * 0.07, 0.05, SNARE, 44 + 18 * i, DRUM) for i in range(4)]   # заход
    for i in range(4):
        n += [(b(5 + i / 2), 0.1, KICK if i % 2 == 0 else SNARE, 108, DRUM)]
    n += [(b(5 + i / 4), 0.05, HAT, 62 + 4 * i, DRUM) for i in range(8)]
    n += [(b(6.5) + i * 0.07, 0.05, SNARE, 62 + 14 * i, DRUM) for i in range(1, 4)]
    n += [(b(7), 0.8, CRASH, 122, DRUM), (b(7), 0.1, KICK, 127, DRUM)]
    return n


def music_space():
    """Космос: хор и пэд Dm(add9), челеста мерцает."""
    n = [(4.86, 1.2, p, 76, CHOIR) for p in (62, 65, 69, 76)]
    n += [(4.86, 1.2, p, 72, PAD) for p in (38, 50, 57)]
    tw = [(4.92, 81), (5.06, 88), (5.28, 86), (5.42, 89), (5.56, 88), (5.70, 81)]
    n += [(t, 0.5, p, 66, CEL) for t, p in tw]
    return n


# ------------------------------------------------------------------ эффекты
def tvec(dur):
    return np.arange(int(dur * SR)) / SR


def clink(f0):
    """Удар звена цепи: неоднородные моды с быстрым спадом и щелчок."""
    t = tvec(0.22)
    y = np.zeros_like(t)
    for k, r in enumerate([1.0, 1.59, 2.33, 2.98, 3.85, 4.93]):
        y += (rng.uniform(0.3, 1.0) / (k + 1) ** 0.5
              * np.sin(2 * np.pi * f0 * r * t + rng.uniform(0, 6.3))
              * np.exp(-t * rng.uniform(28, 55) * (1 + 0.35 * k)))
    nc = int(0.004 * SR)
    y[:nc] += 0.7 * rng.standard_normal(nc) * np.linspace(1, 0, nc)
    return y


def rattle(spread=0.16, hits=(5, 10)):
    """Цепь звякает: несколько ударов звеньев и шорох."""
    out = np.zeros(int((spread + 0.25) * SR))
    for t in np.sort(rng.uniform(0, spread, rng.integers(*hits))):
        c = clink(rng.uniform(1500, 3600)) * rng.uniform(0.3, 1.0)
        i = int(t * SR)
        out[i:i + len(c)] += c[:len(out) - i]
    sh = bp(rng.standard_normal(len(out)), 3000, 9000) * 0.25
    sh *= np.exp(-np.linspace(0, 6, len(out)))
    return norm(hp(out + sh, 700))


def clack():
    """Защёлкнули цепь: тяжёлый щелчок + звон."""
    y = 0.8 * clink(900) + 0.6 * clink(1350)
    nc = int(0.012 * SR)
    y[:nc] += 1.2 * lp(rng.standard_normal(nc), 2500) * np.linspace(1, 0, nc)
    return norm(hp(y, 200))


def sparkle():
    """«Блик» — хитрый взгляд La Peace."""
    out = np.zeros(int(0.5 * SR))
    for i, f in enumerate([2637, 3136, 3951, 5274]):
        t = tvec(0.3)
        y = np.sin(2 * np.pi * f * t) * np.exp(-t * 16) * (1 + 0.3 * np.sin(2 * np.pi * 23 * t))
        k = int(i * 0.028 * SR)
        out[k:k + len(y)] += y * (0.9 ** i)
    return norm(out)


def whoosh(dur, f=(400, 1800, 600), peak=0.5, q=1.3):
    """Свист воздуха: шум через плавающую полосу, громкость с пиком в доле peak."""
    x = rng.standard_normal(int(dur * SR))
    f0, fp, f1 = f

    def fc(u):
        return np.where(u < peak, f0 * (fp / f0) ** (u / peak),
                        fp * (f1 / fp) ** ((u - peak) / (1 - peak)))
    y = band_sweep(x, fc, q)
    u = np.linspace(0, 1, len(y))
    e = np.where(u < peak, (u / peak) ** 2.2, ((1 - u) / (1 - peak)) ** 1.6)
    return norm(y * e)


def creak(dur, f0, f1):
    """Скрип: прерывистое трение (импульсы с дрожащим шагом) через резонансы."""
    n = int(dur * SR)
    imp = np.zeros(n)
    t = 0.0
    while t < dur:
        imp[int(t * SR)] += rng.uniform(0.5, 1.0)
        t += 1 / (f0 + (f1 - f0) * t / dur) * rng.uniform(0.9, 1.1)
    out = np.zeros(n)
    for fr, g in [(950, 1.0), (1750, 0.7), (2700, 0.5), (4100, 0.25)]:
        bb, aa = signal.iirpeak(fr, 9, SR)
        out += g * signal.lfilter(bb, aa, imp)
    return norm(out * np.sin(np.pi * np.linspace(0, 1, n)) ** 0.6)


def tone(dur, f, harm=(1.0,), decay=0.0, att=0.003):
    t = tvec(dur)
    fv = np.broadcast_to(f(t) if callable(f) else f, t.shape)
    ph = 2 * np.pi * np.cumsum(fv) / SR
    y = sum(a * np.sin((k + 1) * ph) for k, a in enumerate(harm))
    e = np.minimum(1, t / att) * np.exp(-t * decay)
    e[-int(0.004 * SR):] *= np.linspace(1, 0, int(0.004 * SR))
    return y * e


def ui_pop():
    """Телефон: короткий «тык» интерфейса."""
    a = tone(0.05, lambda t: 1500 + 9000 * t, decay=60)
    out = np.zeros(int(0.12 * SR))
    out[:len(a)] += a
    c = tone(0.06, 2300, decay=70)
    out[int(0.05 * SR):int(0.05 * SR) + len(c)] += 0.7 * c
    return norm(out)


def speed_beeps():
    """Ползунок скорости до максимума: четыре писка вверх."""
    out = np.zeros(int(0.25 * SR))
    for i, f in enumerate([880, 1175, 1568, 2093]):
        y = tone(0.04, f, harm=(1, 0, 0.3), decay=20)
        k = int(i * 0.05 * SR)
        out[k:k + len(y)] += y
    return norm(out)


def riser(dur):
    """Нарастание к запуску: шумовая полоса и тон ползут вверх."""
    x = rng.standard_normal(int(dur * SR))
    y = band_sweep(x, lambda u: 500 * (12 ** u), q=2.0)
    s = tone(dur, lambda t: 180 * (5 ** (t / dur)), harm=(1, 0.3, 0.15))
    u = np.linspace(0, 1, len(y))
    return norm((norm(y) + 0.35 * s[:len(y)]) * u ** 2)


def boing():
    """Пружинный «бо-о-инг» на запуске."""
    def f(t):
        return (160 + 150 * (1 - np.exp(-t * 40))) * (1 + 0.25 * np.exp(-t * 7)
                                                      * np.sin(2 * np.pi * 14 * t))
    return norm(tone(0.55, f, harm=(1, 0.5, 0.25), decay=6, att=0.002))


def slide_whistle(dur=0.5, f0=700, f1=2600):
    """Мультяшная свистулька вверх: летит!"""
    def f(t):
        return f0 * (f1 / f0) ** ((t / dur) ** 1.3) * (1 + 0.015 * np.sin(2 * np.pi * 6 * t))
    y = tone(dur, f, harm=(1, 0.08), att=0.02)
    ff = f(tvec(dur))
    breath = band_sweep(rng.standard_normal(len(y)), lambda u: np.interp(u, [0, 1], [ff[0], ff[-1]]),
                        q=6)
    y = y + 0.15 * norm(breath)
    y[-int(0.08 * SR):] *= np.linspace(1, 0, int(0.08 * SR))
    return norm(y)


def wind(dur):
    x = rng.standard_normal(int(dur * SR))
    y = band_sweep(x, lambda u: 350 + 500 * np.sin(np.pi * u), q=0.9)
    return norm(y * np.sin(np.pi * np.linspace(0, 1, len(y))) ** 1.5)


def thump():
    """Глухой удар: переход в космос."""
    y = tone(0.7, lambda t: 48 + 50 * np.exp(-t * 18), decay=5, att=0.002)
    return norm(hp(np.tanh(2 * y), 40))


def drone(dur):
    t = tvec(dur)
    y = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 82.7 * t)
         + 0.3 * np.sin(2 * np.pi * 110.4 * t)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t))
    y += 0.3 * lp(rng.standard_normal(len(t)), 300)
    return norm(y * np.minimum(1, t / 0.3))


def radio_beep():
    return norm(bp(np.tanh(3 * tone(0.07, 1000, decay=8)), 300, 3200))


def static(dur):
    """Сигнал потерян: радиошум с треском."""
    n = int(dur * SR)
    y = bp(rng.standard_normal(n), 900, 4500) * (0.6 + 0.4 * rng.random(n // 480 + 1).repeat(480)[:n])
    crack = np.zeros(n)
    crack[rng.integers(0, n, 40)] = rng.uniform(1, 3, 40)
    y += bp(crack, 1500, 6000)
    return norm(y * np.minimum(1, np.linspace(0, dur, n) / 0.03))


def boom():
    """Низкий «бум» на панчлайн."""
    y = tone(1.0, lambda t: 52 + 120 * np.exp(-t * 11), decay=3.0, att=0.001)
    y = np.tanh(2.8 * y)
    nc = int(0.03 * SR)
    y[:nc] += 0.8 * lp(rng.standard_normal(nc), 1200) * np.linspace(1, 0, nc)
    return norm(hp(y, 45))


def sfx():
    dry, wet = Bus(), Bus()
    # 0.0–1.3 La Peace обматывает Verity цепью
    for t in (0.04, 0.26, 0.50, 0.72, 0.95, 1.14):
        dry.add(rattle(), t, db(-6), pan=float(rng.uniform(-0.35, 0.35)))
    dry.add(clack(), 1.26, db(-5))
    dry.add(sparkle(), 1.06, db(-15), pan=0.25)               # хитрый прищур
    dry.add(whoosh(0.12, (1500, 5000, 3000), 0.4), 1.14, db(-15))   # телефон из кармана
    dry.add(ui_pop(), 1.36, db(-13))
    # качели: подъём, зависание наверху, падение
    dry.add(whoosh(0.34, (300, 1300, 900), 0.7), 1.30, db(-10))
    dry.add(creak(0.30, 420, 340), 1.62, db(-15), pan=-0.2)
    dry.add(creak(0.24, 380, 300), 1.88, db(-16), pan=0.2)
    dry.add(whoosh(0.56, (250, 1600, 500), 0.75), 2.00, db(-8))     # низ в 2.42
    dry.add(whoosh(0.32, (500, 1200, 400), 0.4), 2.44, db(-12))
    # быстрые круги: свист на каждом проходе низа, скрип наверху
    for i, tp in enumerate((3.04, 3.32, 3.60, 3.88, 4.16)):
        dry.add(whoosh(0.28, (400, 1700 + 250 * i, 600), 0.5), tp - 0.14, db(-9 + i),
                pan=(-0.3, 0.3) if i % 2 else (0.3, -0.3))
    for t in (2.70, 3.18, 3.46, 3.74, 4.02):
        dry.add(creak(0.10, 520, 600), t, db(-19))
    # разгон
    dry.add(speed_beeps(), 2.82, db(-13))
    dry.add(riser(1.12), 3.04, db(-17))
    # запуск
    dry.add(boing(), 4.16, db(-8))
    for k in range(3):
        dry.add(clink(rng.uniform(1200, 2400)), 4.17 + 0.03 * k, db(-10))
    dry.add(whoosh(0.5, (300, 2500, 1500), 0.3), 4.16, db(-9))
    dry.add(slide_whistle(), 4.22, db(-9))
    # небо: ветер и пролёт мимо камеры
    dry.add(wind(0.5), 4.38, db(-11))
    dry.add(whoosh(0.22, (700, 3500, 350), 0.5, q=1.1), 4.71, db(-5), pan=(-0.6, 0.6))
    # космос
    dry.add(thump(), 4.86, db(-6))
    dry.add(drone(1.02), 4.86, db(-25))
    wet.add(radio_beep(), 5.27, db(-17))
    dry.add(static(0.48), 5.36, db(-24))
    wet.add(boom(), 5.37, db(-4))
    return dry.x + reverb(wet.x, 1.8, 0.35)


# ------------------------------------------------------------------ озвучка
def load_mono(path):
    y, sr = sf.read(path, always_2d=True)
    y = y.mean(1)
    if sr != SR:
        g = np.gcd(sr, SR)
        y = signal.resample_poly(y, SR // g, sr // g)
    return y


def rms_env(y, win=0.01):
    k = max(1, int(win * SR))
    return np.sqrt(np.convolve(y ** 2, np.ones(k) / k, 'same'))


def words(y, gap=0.06, thr_db=-32):
    """Границы слов (паузы длиннее gap) — список (начало, конец) в отсчётах, запас 15 мс."""
    e = 20 * np.log10(rms_env(y) / (np.max(np.abs(y)) + 1e-12) + 1e-9)
    on = ndimage.binary_closing(e > thr_db, np.ones(int(gap * SR)))
    lab, _ = ndimage.label(on)
    pad = int(0.015 * SR)
    spans = [(max(0, s[0].start - pad), min(len(y), s[0].stop + pad))
             for s in ndimage.find_objects(lab)]
    return [(i0, i1) for i0, i1 in spans if i1 - i0 > 0.05 * SR]


def cut(y, i0, i1):
    seg = y[i0:i1].copy()
    r = int(0.006 * SR)
    seg[:r] *= np.linspace(0, 1, r)
    seg[-r:] *= np.linspace(1, 0, r)
    return seg


def compress(y, thr_db=-20, ratio=3.0, att=0.004, rel=0.09):
    env = np.abs(y)
    a, r = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    s = np.zeros_like(env)
    cur = 0.0
    for i, v in enumerate(env):
        cur = a * cur + (1 - a) * v if v > cur else r * cur + (1 - r) * v
        s[i] = cur
    lvl = 20 * np.log10(s + 1e-9)
    over = np.maximum(0, lvl - thr_db)
    return y * db(-over * (1 - 1 / ratio))


def voice_chain(y):
    y = hp(y, 90)
    y = compress(y)
    y = peak_eq(y, 3500, 3.0, 0.9)
    v = rms_env(y, 0.03)
    loud = v[v > 0.25 * v.max()]
    return y * (db(-17) / (np.sqrt(np.mean(loud ** 2)) + 1e-9))


def sox(y, *effect):
    """Прогнать моно через эффект sox: ('pitch', 250), ('tempo', '-s', 1.1)."""
    with tempfile.TemporaryDirectory() as tmp:
        src, dst = Path(tmp) / 'in.wav', Path(tmp) / 'out.wav'
        sf.write(src, y * 0.5, SR, subtype='FLOAT')   # запас, чтобы sox не клиповал
        subprocess.run(['sox', '-V1', str(src), str(dst), *map(str, effect)], check=True)
        out, _ = sf.read(dst)
    return out * 2


# файл в vo/, кусок дубля в секундах (None — от первого слова до последнего),
# начало в ролике, ускорение
LINES = [
    ('l1.wav', None, 0.02, 1.0),           # La Peace pushed Verity on the swing.
    ('l3.wav', (0.10, 0.66), 2.30, 1.0),   # Speed?
    ('l3.wav', (0.74, 1.34), 3.05, 1.0),   # Max.  — на первый быстрый круг
    ('l4.wav', (0.12, 0.70), 4.87, 1.12),  # Signal?  — склейка в космос
    ('l4.wav', (1.10, 1.58), 5.40, 1.12),  # Lost.  — наезд на испуганное лицо
]
# Verity: «NOOO!» — от запуска до пролёта мимо камеры
YELL = [('yell.wav', None, 4.21)]
SPACE = 4.86                         # в космосе крик обрывается


def phrase(name, span, tempo=1.0):
    y = load_mono(HERE / 'vo' / name)
    if span is None:
        w = words(y)
        y = cut(y, w[0][0], w[-1][1])
    else:
        y = cut(y, int(span[0] * SR), int(span[1] * SR))
    return y if tempo == 1.0 else sox(y, 'tempo', '-s', tempo)


def voice(with_narration):
    vo = Bus()
    if with_narration:
        for name, span, t, tempo in LINES:
            vo.add(voice_chain(phrase(name, span, tempo)), t)
    # крик выше по тону (это персонаж, а не рассказчик); улетает — тише, у камеры — громче
    yell = Bus()
    for name, span, t in YELL:
        yell.add(sox(voice_chain(phrase(name, span)), 'pitch', 300), t)
    tt = np.arange(N) / SR
    g = db(np.interp(tt, [4.21, 4.50, 4.66, 4.80, SPACE - 0.01, SPACE], [0, -8, -8, 1, 1, -90]))
    y = yell.x.mean(1) * g
    y = 0.6 * y + 0.4 * lp(y, 1800)
    vo.x += reverb(np.stack([y, y], 1), 0.8, 0.22) * db(-1)
    return vo.x


# ------------------------------------------------------------------ мастер
def duck_gain(vo, depth_db):
    act = (rms_env(vo.mean(1), 0.02) > db(-42)).astype(float)
    act = ndimage.maximum_filter1d(act, int(0.08 * SR))
    act = ndimage.uniform_filter1d(act, int(0.05 * SR))
    return (1 - (1 - db(depth_db)) * act)[:, None]


def limiter(x, ceiling_db=-1.5, rel=0.06):
    c = db(ceiling_db)
    pk = np.max(np.abs(signal.resample_poly(x, 4, 1, axis=0)), axis=1).reshape(-1, 4).max(1)
    g = np.minimum(1, c / np.maximum(pk, 1e-9))
    g = ndimage.minimum_filter1d(g, int(0.004 * SR))
    r = np.exp(-1 / (rel * SR))
    out = np.empty_like(g)
    cur = 1.0
    for i, v in enumerate(g):
        cur = v if v < cur else r * cur + (1 - r) * v
        out[i] = cur
    out = np.roll(out, -int(0.002 * SR))
    return x * out[:, None]


def main(out_dir, with_narration=True):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    notes, expr = music_main()
    main_mus = fade(render('music_main', notes, out_dir, expr), 4.28, 4.34)
    drums = fade(render('music_drums', music_drums(), out_dir), 4.30, 4.62)
    space = render('music_space', music_space(), out_dir)
    music = reverb(main_mus + drums, 0.7, 0.12) + reverb(space, 2.6, 0.45) * db(-2)
    music = hp(music, 35)
    effects = sfx()
    vo = voice(with_narration)

    duck = duck_gain(vo, -5 if with_narration else 0)
    mix = music * db(-3) * duck + effects * db(-4) * np.sqrt(duck) + vo
    mix = limiter(hp(mix, 30), -3)
    meter = pyln.Meter(SR)
    mix *= db(LUFS - meter.integrated_loudness(mix))
    mix = limiter(mix, -1.5)
    end = int(0.03 * SR)
    mix[:int(0.005 * SR)] *= np.linspace(0, 1, int(0.005 * SR))[:, None]
    mix[-end:] *= np.linspace(1, 0, end)[:, None]
    name = 'mix.wav' if with_narration else 'mix_no_vo.wav'
    sf.write(out_dir / name, mix, SR, subtype='PCM_24')
    for stem, x in [('stem_music', music), ('stem_sfx', effects), ('stem_vo', vo)]:
        sf.write(out_dir / f'{stem}.wav', x, SR, subtype='FLOAT')
    print(out_dir / name, f'{meter.integrated_loudness(mix):.1f} LUFS',
          f'peak {20 * np.log10(np.max(np.abs(mix))):.1f} dBFS')


if __name__ == '__main__':
    main(sys.argv[1], '--no-vo' not in sys.argv)
