"""Звук: синтез музыки по настроению сегмента, звуковые эффекты, сведение с озвучкой.

python tools/audio.py            → build/audio/mix.wav (48 кГц, стерео)
Музыка и эффекты синтезируются здесь же (без сторонних сэмплов), озвучка берётся
из build/voice/timing.json.
"""
import json
import math
import os
import zlib
import subprocess
import sys

import numpy as np
import soundfile as sf
from scipy import signal

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
SR = 48000
OUT = os.path.join(ROOT, "build", "audio")
rng = np.random.default_rng(7)


# --- базовые генераторы ---------------------------------------------------------

def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env_adsr(n, a=0.01, d=0.1, s=0.7, r=0.2):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na)
    nd = min(nd, n - na)
    e[na:na + nd] = np.linspace(1, s, nd)
    nr = min(nr, n)
    e[n - nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, f, order=2):
    b, a = signal.butter(order, min(f / (SR / 2), 0.99), "low")
    return signal.lfilter(b, a, x)


def hp(x, f, order=2):
    b, a = signal.butter(order, min(f / (SR / 2), 0.99), "high")
    return signal.lfilter(b, a, x)


def bp(x, f0, f1, order=2):
    b, a = signal.butter(order, [f0 / (SR / 2), min(f1 / (SR / 2), 0.99)], "band")
    return signal.lfilter(b, a, x)


def saw(f, dur, phase=0.0):
    t = t_(dur)
    return 2 * ((t * f + phase) % 1.0) - 1


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8,
        "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def nm(s):
    """'A4' → midi."""
    name, octv = s[:-1], int(s[-1])
    return 12 * (octv + 1) + NOTE[name]


def chord(root, kind="m", octv=3):
    r = nm(root + str(octv))
    iv = {"m": [0, 3, 7], "M": [0, 4, 7], "m7": [0, 3, 7, 10], "M7": [0, 4, 7, 11], "sus": [0, 5, 7],
          "add9": [0, 4, 7, 14], "dim": [0, 3, 6]}[kind]
    return [r + i for i in iv]


# --- инструменты -----------------------------------------------------------------

def pad(notes, dur, bright=1200, amp=0.12):
    x = np.zeros(int(dur * SR))
    for n in notes:
        f = midi(n)
        for det in (-0.006, 0.0, 0.007):
            x += saw(f * (1 + det), dur, rng.random())
    x = lp(x, bright) * amp / max(1, len(notes))
    return x * env_adsr(len(x), a=min(1.5, dur * 0.3), d=0.5, s=0.9, r=min(1.5, dur * 0.3))


def piano(n, dur=2.0, amp=0.25):
    f = midi(n)
    t = t_(dur)
    x = np.zeros_like(t)
    for h, a in ((1, 1.0), (2, 0.5), (3, 0.25), (4, 0.12), (5, 0.06)):
        x += a * np.sin(2 * np.pi * f * h * (1 + 0.0004 * h * h) * t) * np.exp(-t * (2.2 + h * 0.9))
    x *= amp
    x[:200] *= np.linspace(0, 1, 200)
    return x


def pluck(n, dur=0.5, amp=0.25, bright=1.0):
    f = midi(n)
    t = t_(dur)
    x = np.sin(2 * np.pi * f * t) + 0.3 * bright * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t * 30)
    x *= np.exp(-t * 9) * amp
    x[:60] *= np.linspace(0, 1, 60)
    return x


def bass(n, dur=0.5, amp=0.35):
    f = midi(n)
    x = np.sin(2 * np.pi * f * t_(dur)) + 0.25 * saw(f, dur)
    x = lp(x, 400) * amp
    return x * env_adsr(len(x), 0.005, 0.1, 0.8, 0.08)


def strings(notes, dur, amp=0.08):
    x = np.zeros(int(dur * SR))
    t = t_(dur)
    for n in notes:
        f = midi(n)
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * t + rng.random() * 6)
        ph = np.cumsum(f * vib) / SR
        x += 2 * (ph % 1.0) - 1
    x = bp(x, 300, 4000) * amp / max(1, len(notes))
    return x * env_adsr(len(x), a=dur * 0.45, d=0.1, s=1.0, r=dur * 0.3)


def kick(amp=0.6, dur=0.4):
    t = t_(dur)
    f = 45 + 90 * np.exp(-t * 30)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9)
    return x * amp


def noise(dur, amp=1.0):
    return rng.standard_normal(int(dur * SR)) * amp


def shaker(amp=0.08):
    x = hp(noise(0.08), 6000) * np.exp(-t_(0.08) * 50)
    return x * amp


def tom(n=45, amp=0.4, dur=0.5):
    t = t_(dur)
    f = midi(n) * (1 + 0.5 * np.exp(-t * 20))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6) * amp


def heartbeat(amp=0.5):
    x = np.zeros(int(0.8 * SR))
    k = kick(amp, 0.3)
    x[:len(k)] += lp(k, 120)
    k2 = kick(amp * 0.7, 0.3)
    s = int(0.22 * SR)
    x[s:s + len(k2)] += lp(k2, 120)
    return x


def place(buf, x, t, gain=1.0):
    i = int(t * SR)
    if i >= len(buf) or i + len(x) <= 0:
        return
    a = max(0, -i)
    j = min(len(buf), i + len(x))
    buf[max(0, i):j] += x[a:a + (j - max(0, i))] * gain


def movavg(x, k):
    """Скользящее среднее (через накопленную сумму — быстро на длинных сигналах)."""
    k = max(1, int(k))
    c = np.cumsum(np.concatenate([np.zeros(1), x]))
    y = (c[k:] - c[:-k]) / k
    pad_l = (len(x) - len(y)) // 2
    return np.concatenate([np.full(pad_l, y[0]), y, np.full(len(x) - len(y) - pad_l, y[-1])])


def reverb(x, seconds=2.2, mix=0.25):
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR * (6.9 / seconds))
    ir = lp(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2)) + 1e-9
    wet = signal.oaconvolve(x, ir)[:len(x)]
    return x * (1 - mix) + wet * mix * 1.6


# --- музыка по настроениям ------------------------------------------------------------

PROG = {
    "lonely": [("A", "m"), ("F", "M"), ("C", "M"), ("G", "M")],
    "hope": [("F", "M"), ("C", "M"), ("D", "m"), ("Bb", "M")],
    "fun": [("C", "M"), ("A", "m"), ("F", "M"), ("G", "M")],
    "wonder": [("D", "M7"), ("B", "m7"), ("G", "M7"), ("A", "add9")],
    "tension": [("D", "m"), ("D", "m"), ("Bb", "M"), ("A", "M")],
    "mystery": [("C", "m"), ("Ab", "M"), ("C", "m"), ("G", "M")],
    "action": [("D", "m"), ("Bb", "M"), ("C", "M"), ("A", "M")],
    "storm": [("E", "m"), ("C", "M"), ("E", "m"), ("B", "M")],
    "tropical": [("C", "M"), ("F", "M"), ("G", "M"), ("C", "M")],
    "silence": [("A", "m"), ("F", "M"), ("A", "m"), ("E", "m")],
    "dread": [("C", "m"), ("C", "m"), ("Db", "M"), ("C", "m")],
    "flight": [("D", "M"), ("A", "M"), ("B", "m"), ("G", "M")],
}
TEMPO = {"lonely": 72, "hope": 80, "fun": 112, "wonder": 76, "tension": 100, "mystery": 66, "action": 138,
         "storm": 90, "tropical": 116, "silence": 60, "dread": 70,
         "flight": 118}


def steelpan(n, dur=0.9, amp=0.2):
    """Стальной барабан: металлические обертоны с быстрым затуханием."""
    t = t_(dur)
    f = midi(n)
    x = np.zeros_like(t)
    for r, a, dk in ((1.0, 0.6, 3.0), (2.0, 0.35, 4.5), (2.98, 0.16, 6.0), (4.1, 0.07, 8.0)):
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dk)
    x *= np.minimum(1, t / 0.004)
    return x * amp


def music(mood, dur, seed=0, intensity=1.0):
    """Кусок музыки заданного настроения (моно, без реверба)."""
    global rng
    rng = np.random.default_rng(seed)
    bpm = TEMPO[mood]
    beat = 60 / bpm
    bar = beat * 4
    x = np.zeros(int((dur + 3) * SR))
    prog = PROG[mood]
    nbars = int(dur / bar) + 2
    for b in range(nbars):
        root, kind = prog[b % len(prog)]
        ch = chord(root, kind, 3)
        t0 = b * bar
        if mood in ("lonely", "hope", "wonder"):
            place(x, pad([n + 12 for n in ch], bar + 0.6, 1400, 0.10), t0)
            arp = ch + [ch[0] + 12, ch[1] + 12]
            for k in range(8 if mood != "lonely" else 4):
                step = bar / (8 if mood != "lonely" else 4)
                n = arp[(k * 2 + b) % len(arp)] + 12
                place(x, piano(n, 2.2, 0.16 if mood != "wonder" else 0.11), t0 + k * step)
            place(x, bass(ch[0] - 12, bar * 0.9, 0.22), t0)
            if mood == "hope" and intensity > 0.6:
                place(x, strings([n + 12 for n in ch], bar + 0.4, 0.07 * intensity), t0)
            if mood == "wonder":
                for k in range(4):
                    place(x, pluck(ch[k % 3] + 24 + (5 if k == 3 else 0), 0.8, 0.07), t0 + k * beat + beat / 2)
        elif mood == "fun":
            place(x, pad([n + 12 for n in ch], bar, 900, 0.05), t0)
            for k in range(8):
                n = ch[[0, 1, 2, 1, 0, 2, 1, 2][k]] + 12 + (12 if k in (3, 7) else 0)
                place(x, pluck(n, 0.4, 0.17), t0 + k * beat / 2)
            for k in range(4):
                place(x, bass(ch[0] - 12 + (7 if k % 2 else 0), beat * 0.45, 0.28), t0 + k * beat)
                place(x, shaker(0.06), t0 + k * beat + beat / 2)
            place(x, kick(0.25), t0)
            place(x, kick(0.2), t0 + 2 * beat)
        elif mood in ("tension", "mystery", "storm"):
            place(x, pad([ch[0], ch[0] + 7, ch[0] + 13], bar + 0.8, 600, 0.10), t0)
            if mood == "tension":
                for k in range(8):
                    place(x, bass(ch[0] - 12, beat * 0.3, 0.22 * intensity), t0 + k * beat / 2)
                if b % 2 == 1:
                    place(x, heartbeat(0.35 * intensity), t0 + beat)
                place(x, strings([ch[0] + 24, ch[0] + 25], bar + 0.5, 0.035 * intensity), t0)
            elif mood == "mystery":
                for k in range(2):
                    n = ch[0] + 24 + [0, 6, 3, 10][(b + k) % 4]
                    place(x, piano(n, 3.0, 0.10), t0 + k * bar / 2 + beat * 0.5)
                place(x, bass(ch[0] - 12, bar * 0.9, 0.16), t0)
            else:
                place(x, tom(40, 0.35 * intensity, 1.0), t0)
                place(x, tom(40, 0.25 * intensity, 1.0), t0 + beat * 2.5)
                place(x, strings([ch[0] + 12, ch[1] + 12], bar + 0.5, 0.05), t0)
        elif mood == "action":
            place(x, pad([n + 12 for n in ch], bar, 1000, 0.06), t0)
            for k in range(8):
                place(x, bass(ch[0] - 12 + (12 if k % 4 == 3 else 0), beat * 0.4, 0.3), t0 + k * beat / 2)
            for k in range(4):
                place(x, kick(0.5 * intensity), t0 + k * beat)
                place(x, shaker(0.07), t0 + k * beat + beat / 2)
            if b % 2 == 1:
                for k in range(4):
                    place(x, tom(45 - k * 2, 0.3 * intensity, 0.4), t0 + 3 * beat + k * beat / 4)
            place(x, strings([ch[0] + 24, ch[2] + 12], bar, 0.06 * intensity), t0)
        elif mood == "tropical":
            place(x, pad([n + 12 for n in ch], bar, 1100, 0.04), t0)
            mel = [0, 2, 1, 2, 0, 1, 2, 1]
            for k in range(8):
                if (k + b) % 3 == 2 and k % 2:
                    continue
                n = ch[mel[k]] + 24 + (12 if (k == 6 and b % 2) else 0)
                place(x, steelpan(n, 0.8, 0.2 * intensity), t0 + k * beat / 2)
            for k in range(4):
                place(x, bass(ch[0] - 12 + (7 if k % 2 else 0), beat * 0.45, 0.26), t0 + k * beat)
                place(x, shaker(0.07), t0 + k * beat + beat / 2)
                place(x, shaker(0.04), t0 + k * beat + beat * 0.75)
            place(x, kick(0.25), t0)
            place(x, kick(0.2), t0 + 2 * beat)
            place(x, tom(52, 0.12, 0.3), t0 + 3.5 * beat)
        elif mood == "flight":
            place(x, pad([n + 12 for n in ch], bar + 0.4, 1600, 0.06), t0)
            place(x, strings([n + 12 for n in ch], bar + 0.4, 0.07 * intensity), t0)
            arp = ch + [ch[0] + 12]
            for k in range(8):
                place(x, pluck(arp[[0, 1, 2, 3, 2, 1, 2, 3][k]] + 12, 0.5, 0.15), t0 + k * beat / 2)
            mel = [7, 4, 2, 4] if b % 2 == 0 else [9, 7, 4, 2]
            for k in range(4):
                place(x, piano(ch[0] + 24 + mel[k], 1.2, 0.12 * intensity), t0 + k * beat)
            for k in range(4):
                place(x, bass(ch[0] - 12 + (7 if k == 2 else 0), beat * 0.6, 0.28), t0 + k * beat)
                place(x, kick(0.35 * intensity), t0 + k * beat)
                place(x, shaker(0.06), t0 + k * beat + beat / 2)
        elif mood == "silence":
            place(x, pad([n + 12 for n in ch], bar + 1.0, 700, 0.06), t0)
            if b % 2 == 0:
                place(x, piano(ch[2] + 24, 3.0, 0.06), t0 + beat)
        elif mood == "dread":
            place(x, pad([ch[0] - 12, ch[0] - 11, ch[0] + 7], bar + 0.8, 450, 0.12 * intensity), t0)
            place(x, heartbeat(0.3 * intensity), t0 + beat * 0.5)
            place(x, heartbeat(0.25 * intensity), t0 + beat * 2.5)
            place(x, strings([ch[0] + 24, ch[0] + 25], bar + 0.5, 0.03 * intensity), t0)
    x = x[:int(dur * SR)]
    return x


# имя настроения в сцене → (базовое настроение, интенсивность)
BASE = {"storm": ("storm", 1.0), "party": ("fun", 1.0), "sneak": ("mystery", 0.9), "comic": ("fun", 1.0),
        "chase": ("action", 1.0), "warm": ("hope", 0.8), "silence": ("silence", 1.0), "joy": ("flight", 1.0),
        "sad": ("lonely", 1.0), "tension": ("tension", 1.0), "lonely": ("lonely", 1.0), "routine": ("fun", 0.9),
        "dread": ("dread", 1.0), "wonder": ("wonder", 1.0), "plan": ("hope", 1.0), "hope": ("hope", 1.0),
        "happy_end": ("flight", 0.8), "fun": ("fun", 1.0), "mystery": ("mystery", 1.0)}


def scene_moods(S):
    """S.music: строка или [(t, имя, интенсивность)] → [(t, базовое, интенсивность)]."""
    m = getattr(S, "music", None) or "lonely"
    if isinstance(m, str):
        m = [(0.0, m, 1.0)]
    out = []
    for t, name, k in m:
        base, kk = BASE.get(name, (name if name in PROG else "lonely", 1.0))
        out.append((max(0.0, t), base, kk * k))
    return out


# сегмент → [(с секунды, настроение, интенсивность)]
MOODS = {
    "cold": [(0, "tension", 1.0)], "d01": [(0, "tension", 0.8), (17, "action", 0.9)], "d02": [(0, "wonder", 1)],
    "d03": [(0, "lonely", 1)], "d04": [(0, "tension", 0.6), (21, "mystery", 0.6)], "d05": [(0, "mystery", 0.5),
                                                                                         (12, "fun", 1)],
    "d06": [(0, "mystery", 1)], "d07": [(0, "fun", 1)], "d08": [(0, "fun", 1)], "d09": [(0, "fun", 0.8),
                                                                                   (11, "wonder", 1),
                                                                                   (18, "lonely", 1)],
    "d10": [(0, "hope", 0.6), (24, "tension", 0.7)], "d11": [(0, "lonely", 1), (20.5, "tension", 1.0)],
    "d12": [(0, "lonely", 0.8)], "d13": [(0, "tension", 0.9)], "d14": [(0, "mystery", 1)], "d15": [(0, "fun", 1)],
    "d16": [(0, "tension", 0.6), (11, "action", 0.8), (25, "fun", 0.8)], "d17": [(0, "hope", 0.7),
                                                                                 (14, "lonely", 1)],
    "d18": [(0, "wonder", 1)], "d19": [(0, "lonely", 1), (16, "hope", 0.8)], "d20": [(0, "tension", 0.5),
                                                                                       (10, "hope", 0.7)],
    "d21": [(0, "fun", 0.8)], "d22": [(0, "hope", 1.0)], "d23": [(0, "tension", 0.8), (18, "lonely", 1)],
    "d24": [(0, "lonely", 1), (17, "storm", 0.6)], "d25": [(0, "storm", 1)], "d26": [(0, "storm", 1),
                                                                                       (10, "tension", 1)],
    "d27": [(0, "tension", 0.6)], "d28": [(0, "tension", 1), (15, "action", 1)], "d29": [(0, "action", 1),
                                                                                         (21, "tension", 1)],
    "d30": [(0, "action", 1), (9, "hope", 1)], "epi": [(0, "hope", 1)], "end": [(0, "hope", 0.6)],
}


def segment_music(key, dur, seed, parts=None):
    parts = parts or MOODS.get(key, [(0, "lonely", 1)])
    out = np.zeros(int(dur * SR))
    for i, (t0, mood, inten) in enumerate(parts):
        t1 = parts[i + 1][0] if i + 1 < len(parts) else dur
        a, b = max(0, t0 - 0.8), min(dur, t1 + 0.8)
        m = music(mood, b - a, seed * 10 + i, inten)
        fade = int(0.8 * SR)
        e = np.ones(len(m))
        if i > 0:
            e[:fade] = np.linspace(0, 1, fade)
        if i + 1 < len(parts):
            e[-fade:] = np.linspace(1, 0, fade)
        place(out, m * e, a)
    return out


# --- эффекты -------------------------------------------------------------------------

# --- эффекты круиза --------------------------------------------------------------------

def _tone(f, d, amp=0.3, dk=8.0):
    t = t_(d)
    return np.sin(2 * np.pi * f * t) * np.exp(-t * dk) * amp


def _beeps(fs, gap=0.18, d=0.12, amp=0.25):
    x = np.zeros(int((len(fs) * gap + 0.4) * SR))
    for i, f in enumerate(fs):
        b = np.sin(2 * np.pi * f * t_(d)) * amp
        b[:200] *= np.linspace(0, 1, 200)
        b[-200:] *= np.linspace(1, 0, 200)
        place(x, b, i * gap)
    return x


def _voice(f0s, d=0.18, gap=0.22, form=(700, 1200), amp=0.3, breath=0.3):
    """Грубый «голос»: пилa через формантный фильтр (смех, мяу, мычание)."""
    x = np.zeros(int((len(f0s) * gap + d + 0.3) * SR))
    for i, f0 in enumerate(f0s):
        t = t_(d)
        f = f0 * (1 - 0.15 * t / d)
        ph = np.cumsum(f) / SR
        src = 2 * (ph % 1) - 1 + breath * noise(d) * 0.5
        v = bp(src, form[0] * 0.6, form[0] * 1.4) + 0.6 * bp(src, form[1] * 0.7, form[1] * 1.3)
        v *= np.sin(np.linspace(0, np.pi, len(v))) ** 0.7
        place(x, v * amp, i * gap)
    return x


def _horn(d=2.6, f=98.0, amp=0.5, cut=900):
    t = t_(d)
    vib = 1 + 0.004 * np.sin(2 * np.pi * 5 * t)
    x = saw(f, d) * 0 + 0
    ph1 = np.cumsum(f * vib) / SR
    ph2 = np.cumsum(f * 1.5 * vib) / SR
    x = (2 * (ph1 % 1) - 1) + 0.7 * (2 * (ph2 % 1) - 1)
    x = lp(x, cut, 4)
    env = np.minimum(1, t / 0.08) * np.where(t > d - 0.4, np.maximum(0, (d - t) / 0.4), 1)
    return x * env * amp


def _steps(n, d, amp=0.5, seed_spread=0.0):
    x = np.zeros(int(d * SR))
    for k in range(n):
        tt = k * d / n + rng.uniform(-seed_spread, seed_spread)
        place(x, mixl(kick(amp * rng.uniform(0.6, 1.0), 0.25), bp(noise(0.08), 300, 2000) * 0.15), max(0, tt))
    return x


def mixl(*xs):
    """Сложить сигналы разной длины."""
    out = np.zeros(max(len(x) for x in xs))
    for x in xs:
        out[:len(x)] += x
    return out


# --- эффекты аэропорта -----------------------------------------------------------------

def _bell(f, d=1.8, amp=0.3):
    t = t_(d)
    x = np.zeros_like(t)
    for r, a, dk in ((1.0, 1.0, 2.2), (2.0, 0.4, 3.5), (2.76, 0.25, 5.0), (5.4, 0.08, 9.0)):
        x += a * np.sin(2 * np.pi * f * r * t) * np.exp(-t * dk)
    return x * np.minimum(1, t / 0.003) * amp


def _echo(x, delay=0.28, fb=0.45, n=5):
    out = np.zeros(len(x) + int(delay * n * SR))
    for k in range(n):
        place(out, x * fb ** k, k * delay)
    return out


def _clacks(d, rate, amp=0.12, f=(1500, 5000)):
    x = np.zeros(int(d * SR))
    k = 0.0
    while k < d - 0.05:
        place(x, bp(noise(0.03), *f) * np.exp(-t_(0.03) * 120) * amp * rng.uniform(0.6, 1.0), k)
        k += 1.0 / rate * rng.uniform(0.85, 1.15)
    return x


def _fade(x, a=0.1, b=0.3):
    t = t_(len(x) / SR)
    d = len(x) / SR
    return x * np.minimum(1, t / a) * np.where(t > d - b, np.maximum(0, (d - t) / b), 1)


def airport_sfx(name):
    if name == "alarm":
        d = 1.8
        t = t_(d)
        f = np.where((t * 4) % 1 < 0.5, 880.0, 660.0)
        x = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.12
        return _fade(lp(x, 3000), 0.01, 0.2)
    if name in ("belt", "belt_loop"):
        d = 30.0 if name == "belt_loop" else 3.0
        x = lp(saw(55, d) + 0.5 * saw(110.5, d), 300) * 0.08 + lp(noise(d), 500) * 0.05
        x = x + _clacks(d, 6, 0.1, (800, 3000))
        return _fade(x, 0.4, 0.5) if name == "belt" else x
    if name == "cloth":
        d = 0.7
        x = bp(noise(d), 1200, 6000) * 0.25
        env = np.zeros(len(x))
        for k in range(3):
            env += np.exp(-((t_(d) - rng.uniform(0.05, 0.55)) ** 2) / 0.004)
        return x * env
    if name == "cough":
        x = np.zeros(int(1.0 * SR))
        for k in range(2):
            t = t_(0.22)
            place(x, bp(noise(0.22), 300, 2500) * np.exp(-t * 14) * 0.5, k * 0.32)
            place(x, _voice([140], 0.15, 0.2, (500, 1500), 0.2, 0.8), k * 0.32)
        return x
    if name == "crash":
        y = np.zeros(int(1.6 * SR))
        for k in range(10):
            place(y, _tone(rng.uniform(300, 1400), 0.6, 0.1, 6), rng.uniform(0.05, 0.6))
        return mixl(sfx("door_bang") * 0.9, sfx("bucket_crash") * 0.8, y)
    if name == "crash_sim":
        d = 2.0
        t = t_(d)
        f = 400 * np.exp(-t * 1.0) + 80
        buzz = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * 0.1 * np.exp(-t * 0.8)
        return mixl(lp(buzz, 2500), kick(0.9, 0.6), bp(noise(1.0), 200, 3000) * np.exp(-t_(1.0) * 4) * 0.4)
    if name in ("crickets", "night_air"):
        d = 30.0 if name == "night_air" else 6.0
        x = lp(noise(d), 250) * (0.03 if name == "night_air" else 0.0)
        for k in range(int(d * 1.4)):
            t = t_(0.25)
            ch = np.sin(2 * np.pi * rng.uniform(4200, 4800) * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 30 * t)))
            place(x, ch * np.sin(np.linspace(0, np.pi, len(t))) * 0.035, rng.uniform(0, d - 0.3))
        return x
    if name == "door_creak":
        d = 1.5
        t = t_(d)
        f = 140 + 120 * np.sin(np.pi * t / d) + 25 * np.sin(2 * np.pi * 9 * t)
        src = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
        return bp(src, 400, 2600) * 0.08 * np.sin(np.linspace(0, np.pi, len(t))) ** 0.5
    if name == "growl":
        d = 1.6
        t = t_(d)
        f = 95 + 10 * np.sin(2 * np.pi * 1.3 * t)
        src = (2 * ((np.cumsum(f) / SR) % 1) - 1) + 0.25 * noise(d)
        x = bp(src, 150, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 24 * t))
        return x * np.sin(np.linspace(0, np.pi, len(t))) ** 0.6 * 0.4
    if name == "heartbeat":
        x = np.zeros(int(1.8 * SR))
        place(x, heartbeat(0.6), 0)
        place(x, heartbeat(0.55), 0.85)
        return x
    if name == "hydraulic":
        d = 2.6
        t = t_(d)
        f = 70 + 60 * t / d
        motor = lp(2 * ((np.cumsum(f) / SR) % 1) - 1, 400) * 0.12
        hiss = bp(noise(d), 2500, 7000) * 0.07 * np.exp(-t * 1.5)
        clunk = np.zeros(len(t))
        place(clunk, sfx("door_bang") * 0.4, d - 0.6)
        return (motor + hiss) * np.minimum(1, t / 0.2) + clunk
    if name == "locker":
        t = t_(0.9)
        x = noise(0.9) * np.exp(-t * 40) * 0.4
        for f in (520, 890, 1460, 2210):
            x += np.sin(2 * np.pi * f * t) * np.exp(-t * (6 + f / 400)) * 0.15
        return x
    if name == "massage":
        d = 3.0
        t = t_(d)
        return _fade(lp(saw(48, d), 300) * 0.12 * (0.6 + 0.4 * np.sin(2 * np.pi * 6 * t)), 0.2, 0.3)
    if name == "nose_blow":
        x = np.zeros(int(1.2 * SR))
        for k in range(2):
            v = _voice([260 + 40 * k], 0.38, 0.4, (500, 1100), 0.35, 1.2)
            place(x, v, k * 0.5)
            place(x, bp(noise(0.38), 400, 1600) * 0.15, k * 0.5)
        return x
    if name == "pa_chime":
        x = np.zeros(int(2.4 * SR))
        for i, n in enumerate(("A5", "F5", "C5")):
            place(x, _bell(midi(nm(n)), 1.8, 0.22), i * 0.42)
        return x
    if name == "pa_echo":
        v = _voice([170, 190, 160, 180, 150, 175, 165, 185], 0.16, 0.19, (650, 1500), 0.25, 0.3)
        return _echo(bp(v, 300, 3200), 0.31, 0.5, 5)
    if name == "parrot":
        x = np.zeros(int(0.9 * SR))
        for k in range(2):
            t = t_(0.22)
            f = 1500 + 900 * np.sin(np.pi * t / 0.22) + 200 * np.sin(2 * np.pi * 60 * t)
            src = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) + 0.3 * noise(0.22)
            place(x, bp(src, 1200, 4500) * np.sin(np.linspace(0, np.pi, len(t))) * 0.18, k * 0.3)
        return x
    if name == "phone_ring":
        x = np.zeros(int(3.2 * SR))
        for k in range(2):
            t = t_(1.0)
            r = (_bell(1250, 1.0, 0.15) + _bell(1580, 1.0, 0.12)) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 20 * t)))
            place(x, r, k * 1.6)
        return x
    if name == "power_up":
        d = 1.8
        t = t_(d)
        f = 40 + 260 * (t / d) ** 1.5
        x = _fade(np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2, 0.1, 0.3)
        return mixl(sfx("door_bang") * 0.3, x)
    if name == "rc_buzz":
        d = 2.8
        t = t_(d)
        f = 210 * (1 + 0.06 * np.sin(2 * np.pi * 3 * t)) * (1 + 0.15 * (t / d - 0.5))
        src = 2 * ((np.cumsum(f) / SR) % 1) - 1
        return bp(src, 300, 3000) * 0.12 * np.sin(np.linspace(0, np.pi, len(t))) ** 0.5
    if name == "shuffle":
        x = np.zeros(int(2.4 * SR))
        for k in range(7):
            t = t_(0.3)
            place(x, bp(noise(0.3), 300, 2500) * np.sin(np.linspace(0, np.pi, len(t))) * 0.12, k * 0.32)
        return x
    if name == "sniff":
        x = np.zeros(int(0.8 * SR))
        for k in range(3):
            t = t_(0.09)
            place(x, bp(noise(0.09), 1500, 6000) * np.sin(np.linspace(0, np.pi, len(t))) * 0.3, k * 0.16)
        return x
    if name == "snore":
        d = 2.6
        t = t_(d)
        env = np.clip(np.sin(2 * np.pi * t / d), 0, 1)
        x = lp(saw(70, d), 400) * 0.15 * (0.6 + 0.4 * np.sin(2 * np.pi * 28 * t)) + lp(noise(d), 900) * 0.05
        return x * env
    if name == "strain":
        return _voice([150, 165], 0.45, 0.5, (600, 1300), 0.3, 0.6)
    if name == "tv_jingle":
        x = np.zeros(int(1.8 * SR))
        for i, n in enumerate(("C5", "E5", "G5", "C6")):
            d = 0.35 if i < 3 else 0.9
            place(x, lp(saw(midi(nm(n)), d), 2500) * 0.12 * np.exp(-t_(d) * 2), i * 0.16)
        place(x, kick(0.4, 0.4), 0.48)
        return x
    if name == "water":
        d = 2.2
        t = t_(d)
        return lp(noise(d), 700) * 0.25 * (0.5 + 0.5 * np.sin(2 * np.pi * 1.4 * t)) ** 2
    if name in ("wind", "wind_loop", "desert_wind"):
        d = 30.0 if name != "wind" else 4.0
        t = t_(d)
        sweep = 0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * t + 1.0) * np.sin(2 * np.pi * 0.07 * t)
        x = bp(noise(d), 200, 1400) * 0.07 * sweep
        if name == "wind":
            x *= np.sin(np.linspace(0, np.pi, len(t)))
        return x
    if name == "terminal_hum":
        d = 30.0
        t = t_(d)
        return lp(noise(d), 350) * 0.05 + np.sin(2 * np.pi * 60 * t) * 0.012 + np.sin(2 * np.pi * 120 * t) * 0.006
    if name == "basement":
        d = 30.0
        x = lp(noise(d), 200) * 0.05
        for k in range(14):
            t = t_(0.3)
            f = 900 + 600 * np.exp(-t * 40)
            place(x, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.15, rng.uniform(0, d - 0.4))
        return x
    return None


def cruise_sfx(name):
    if name in ("door_slam",):
        return sfx("door_bang")
    if name in ("bang_glass",):
        return sfx("glass_bang")
    if name == "rain":
        return sfx("rain_loop")
    if name == "chomp":
        x = np.zeros(int(0.9 * SR))
        for k in range(2):
            t = t_(0.18)
            place(x, (bp(noise(0.18), 300, 3500) * 0.6 + kick(0.3, 0.18)) * np.exp(-t * 18), k * 0.3)
        return x
    if name == "glass":
        d = 1.6
        x = hp(noise(d), 2500) * np.exp(-t_(d) * 6) * 0.35
        for k in range(18):
            place(x, _tone(rng.uniform(2500, 6000), 0.5, 0.08, 10), rng.uniform(0, 0.6))
        return x
    if name == "fanfare":
        x = np.zeros(int(2.6 * SR))
        for (n, t0, d) in ((nm("C5"), 0.0, 0.18), (nm("C5"), 0.2, 0.18), (nm("C5"), 0.4, 0.18),
                           (nm("G5"), 0.6, 1.4)):
            for r in (0, 4, 7):
                ph = np.cumsum(np.full(int(d * SR), midi(n + r))) / SR
                v = lp(2 * (ph % 1) - 1, 2400) * np.minimum(1, t_(d) / 0.02) * 0.12
                v[-400:] *= np.linspace(1, 0, 400)
                place(x, v, t0)
        return x
    if name == "meow":
        t = t_(0.7)
        f = 520 + 260 * np.sin(np.pi * np.clip(t / 0.7, 0, 1)) ** 0.8
        ph = np.cumsum(f) / SR
        src = 2 * (ph % 1) - 1
        v = bp(src, 600, 1500) + 0.7 * bp(src, 1800, 3200)
        return v * np.sin(np.linspace(0, np.pi, len(v))) ** 0.6 * 0.28
    if name == "static":
        d = 1.4
        x = bp(noise(d), 900, 5000) * 0.12
        for k in range(30):
            place(x, hp(noise(0.01), 3000) * 0.3, rng.uniform(0, d - 0.02))
        return x * np.sin(np.linspace(0, np.pi, len(x))) ** 0.3
    if name == "hiss_crowd":
        d = 1.8
        return mixl(hp(noise(d), 2500) * 0.25 * np.sin(np.linspace(0, np.pi, int(d * SR))), groans(3.0, 3)[:int(d * SR)] * 0.6)
    if name == "squeak":
        x = np.zeros(int(0.6 * SR))
        for k in range(2):
            t = t_(0.12)
            f = 2000 + 700 * t / 0.12
            place(x, np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.12 * np.sin(np.linspace(0, np.pi, len(t))), k * 0.2)
        return x
    if name == "stomach":
        d = 1.4
        t = t_(d)
        f = 70 + 25 * np.sin(2 * np.pi * 3 * t)
        x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.4 + lp(noise(d), 200) * 0.4
        return x * np.sin(np.linspace(0, np.pi, len(t))) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    if name == "button":
        x = hp(noise(0.02), 2000) * 0.3
        return np.concatenate([x, _beeps([880], 0.1, 0.12, 0.2)])
    if name == "horn":
        return _horn(2.8, 98.0, 0.55)
    if name == "horn_short":
        return _horn(0.7, 98.0, 0.45)
    if name == "ship_horn_far":
        return lp(_horn(3.0, 82.0, 0.3, 500), 400)
    if name == "pencil":
        d = 1.2
        t = t_(d)
        return bp(noise(d), 2000, 6000) * 0.12 * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 7 * t)))
    if name == "splash":
        d = 1.6
        t = t_(d)
        x = lp(noise(d), 3000) * np.exp(-t * 4) * 0.6 + kick(0.4, d) * 0.5
        for k in range(10):
            tt = rng.uniform(0.1, 1.0)
            tb = t_(0.08)
            fb = rng.uniform(400, 1200) * (1 + 3 * tb)
            place(x, np.sin(2 * np.pi * np.cumsum(fb) / SR) * 0.06 * np.exp(-tb * 30), tt)
        return x
    if name == "stampede":
        d = 3.5
        x = np.zeros(int(d * SR))
        for k in range(70):
            place(x, kick(rng.uniform(0.2, 0.45), 0.2), rng.uniform(0, d - 0.2))
        x = mixl(x, groans(d, 5) * 0.8)[:len(x)]
        return x * np.minimum(1, t_(d) / 0.3)
    if name == "stamp":
        return kick(0.7, 0.4) + bp(noise(0.4), 400, 3000) * np.exp(-t_(0.4) * 25) * 0.5
    if name == "party_horn":
        t = t_(0.9)
        f = 420 * (1 + 0.05 * np.sin(2 * np.pi * 9 * t) + 0.08 * t)
        ph = np.cumsum(f) / SR
        v = bp(2 * (ph % 1) - 1, 500, 3000)
        return v * np.minimum(1, t / 0.03) * np.exp(-np.maximum(0, t - 0.7) * 20) * 0.25
    if name == "jackpot":
        x = np.zeros(int(3.0 * SR))
        for i, n in enumerate([nm("C6"), nm("E6"), nm("G6"), nm("C7")] * 3):
            place(x, piano(n, 0.6, 0.18), i * 0.09)
        for k in range(40):
            place(x, _tone(rng.uniform(3000, 6000), 0.2, 0.05, 25), rng.uniform(0.2, 2.5))
        return x
    if name == "slot_spin":
        x = np.zeros(int(1.8 * SR))
        tt = 0.0
        gap = 0.03
        while tt < 1.6:
            place(x, hp(noise(0.006), 2000) * 0.3, tt)
            tt += gap
            gap *= 1.04
        return x
    if name == "sting":
        d = 2.2
        x = strings([nm("C3"), nm("Gb3"), nm("C4")], d, 0.12) + strings([nm("Db6")], d, 0.05)
        return x * np.exp(-t_(d) * 0.8) + kick(0.5, d) * 0.5
    if name == "zip":
        d = 2.0
        t = t_(d)
        x = np.zeros(int(d * SR))
        f = 700 + 1800 * t / d
        for k in range(0, len(x), 2400):
            x[k:k + 2400] = bp(noise(0.05)[:len(x[k:k + 2400])], f[k] * 0.7, f[k] * 1.3, 1)
        return x * 0.3 * np.minimum(1, t / 0.1) * np.where(t > d - 0.3, (d - t) / 0.3, 1)
    if name == "click":
        return mixl(hp(noise(0.015), 2500) * 0.4, _tone(1800, 0.05, 0.1, 80))
    if name == "engine_down":
        d = 3.0
        t = t_(d)
        f = 60 * np.exp(-t * 0.8) + 12
        x = lp(saw(1, d) * 0, 100)
        ph = np.cumsum(f) / SR
        x = lp(2 * (ph % 1) - 1, 400) * 0.35 + lp(noise(d), 200) * 0.2
        return x * np.exp(-t * 0.9)
    if name == "footsteps":
        return _steps(6, 3.0, 0.35, 0.02)
    if name == "waves":
        d = 12.0
        t = t_(d)
        return lp(noise(d), 700) * 0.18 * (0.55 + 0.45 * np.sin(2 * np.pi * t / 4.0) ** 2)
    if name == "wave_soft":
        d = 3.0
        return lp(noise(d), 900) * 0.25 * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2
    if name == "wave_crash":
        d = 3.0
        t = t_(d)
        sw = np.minimum(1, t / 0.6) ** 2 * np.exp(-np.maximum(0, t - 0.6) * 1.5)
        return lp(noise(d), 1800) * 0.6 * sw + kick(0.6, d) * 0.4
    if name == "door_slide":
        d = 1.2
        return bp(noise(d), 300, 1500) * 0.15 * np.sin(np.linspace(0, np.pi, int(d * SR))) + kick(0.2, d)
    if name in ("jetski", "engine"):
        d = 3.0
        t = t_(d)
        f = 85 + 40 * np.minimum(1, t / 0.8) + 6 * np.sin(2 * np.pi * 3 * t)
        ph = np.cumsum(f) / SR
        x = 2 * (ph % 1) - 1
        x = bp(x, 80, 1500) * 0.3 + bp(noise(d), 400, 3000) * 0.05
        return x * np.minimum(1, t / 0.2) * np.where(t > d - 0.6, (d - t) / 0.6, 1)
    if name == "hiss_cat":
        d = 0.9
        t = t_(d)
        return hp(noise(d), 2500) * 0.35 * np.minimum(1, t / 0.02) * np.exp(-t * 2.5)
    if name == "purr":
        d = 2.6
        t = t_(d)
        return lp(noise(d), 250) * 0.5 * (0.5 + 0.5 * np.sin(2 * np.pi * 24 * t)) * np.sin(
            np.linspace(0, np.pi, len(t)))
    if name == "climb":
        x = np.zeros(int(2.8 * SR))
        for k in range(7):
            place(x, _tone(rng.uniform(600, 900), 0.3, 0.15, 14) + kick(0.15, 0.3), k * 0.37)
        return x
    if name == "flies":
        d = 3.0
        t = t_(d)
        f = 220 + 30 * np.sin(2 * np.pi * 13 * t) + 20 * np.sin(2 * np.pi * 0.7 * t)
        ph = np.cumsum(f) / SR
        return bp(2 * (ph % 1) - 1, 300, 2500) * 0.06 * (0.6 + 0.4 * np.sin(2 * np.pi * 0.5 * t))
    if name == "morse":
        seq = "...---..."
        x = np.zeros(int(3.0 * SR))
        tt = 0.0
        for ch in seq:
            d = 0.1 if ch == "." else 0.3
            b = np.sin(2 * np.pi * 800 * t_(d)) * 0.15
            place(x, b, tt)
            tt += d + 0.1
        return x
    if name == "laugh_old":
        return _voice([300, 290, 280, 270, 260], 0.16, 0.2, (750, 1300), 0.3)
    if name == "laugh":
        return _voice([230, 220, 215, 205, 200, 190], 0.15, 0.19, (700, 1200), 0.3)
    if name == "humming":
        d = 4.0
        x = np.zeros(int(d * SR))
        mel = [nm("C4"), nm("C4"), nm("D4"), nm("C4"), nm("F4"), nm("E4")]
        for i, n in enumerate(mel):
            dd = 0.6 if i < 5 else 1.0
            t = t_(dd)
            f = midi(n) * (1 + 0.006 * np.sin(2 * np.pi * 5 * t))
            ph = np.cumsum(f) / SR
            v = (np.sin(2 * np.pi * ph) + 0.4 * np.sin(4 * np.pi * ph) + 0.2 * np.sin(6 * np.pi * ph)) * 0.12
            v *= np.sin(np.linspace(0, np.pi, len(v))) ** 0.4
            place(x, lp(v, 900), i * 0.6)
        return x
    if name == "knock":
        x = np.zeros(int(1.0 * SR))
        for k in range(3):
            t = t_(0.15)
            place(x, (bp(noise(0.15), 200, 1200) * 0.6 + np.sin(2 * np.pi * 180 * t) * 0.4) * np.exp(-t * 30),
                  k * 0.22)
        return x
    if name == "pipe_cough":
        x = np.zeros(int(1.8 * SR))
        for k in range(14):
            t = t_(0.12)
            f = rng.uniform(90, 260) * (1 + 2 * t)
            place(x, np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2 * np.exp(-t * 20), rng.uniform(0, 1.5))
        return x + lp(noise(1.8), 300) * 0.1
    if name == "can_open":
        return mixl(hp(noise(0.03), 2000) * 0.4, np.concatenate(
            [np.zeros(int(0.03 * SR)), hp(noise(0.4), 3000) * np.exp(-t_(0.4) * 8) * 0.15]))
    if name == "dial":
        x = np.zeros(int(2.0 * SR))
        rows, cols = (697, 770, 852, 941), (1209, 1336, 1477)
        for k in range(7):
            t = t_(0.12)
            v = (np.sin(2 * np.pi * rows[k % 4] * t) + np.sin(2 * np.pi * cols[(k * 2) % 3] * t)) * 0.08
            place(x, v, k * 0.2)
        return x
    if name == "cannon":
        d = 2.5
        t = t_(d)
        return kick(1.0, d) + lp(noise(d), 500) * np.exp(-t * 2.5) * 0.9
    if name == "tap":
        x = np.zeros(int(0.8 * SR))
        for k in range(2):
            place(x, mixl(_tone(2200, 0.06, 0.2, 60), hp(noise(0.01), 3000) * 0.2), k * 0.25)
        return x
    if name == "shimmer":
        x = np.zeros(int(2.0 * SR))
        for i, n in enumerate([nm("C6"), nm("E6"), nm("G6"), nm("B6"), nm("D7"), nm("G7")]):
            place(x, piano(n, 1.4, 0.1), i * 0.07)
        return x
    if name == "whistle":
        d = 1.0
        t = t_(d)
        f = 1300 + 900 * np.sin(np.pi * t / d) ** 2 - 500 * (t / d) ** 2
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 * np.sin(np.linspace(0, np.pi, len(t))) ** 0.5
    if name == "radio_beep":
        return _beeps([1000, 1500], 0.15, 0.1, 0.18)
    if name == "low_battery":
        return _beeps([1200, 900, 600], 0.22, 0.14, 0.2)
    if name == "stopwatch":
        x = np.zeros(int(4.0 * SR))
        for k in range(40):
            place(x, _tone(3000 if k % 2 else 2600, 0.02, 0.15, 120), k * 0.1)
        return x
    if name == "radar_ping":
        return _tone(1250, 1.4, 0.2, 3.0)
    if name == "snap":
        d = 0.8
        return mixl(hp(noise(d), 1000) * np.exp(-t_(d) * 30) * 0.8 + kick(0.6, d), sfx("metal_hit") * 0.4)
    if name == "spark":
        x = np.zeros(int(1.0 * SR))
        for k in range(8):
            place(x, hp(noise(0.03), 2500) * 0.4, rng.uniform(0, 0.8))
        t = t_(1.0)
        return x + np.sign(np.sin(2 * np.pi * 120 * t)) * 0.03 * np.exp(-t * 3)
    if name == "drone":
        d = 4.5
        t = t_(d)
        x = lp(saw(55, d) + saw(58.3, d), 300) * 0.25
        return x * np.minimum(1, t / 1.0) * np.where(t > d - 1.0, (d - t) / 1.0, 1)
    if name == "thud":
        return kick(0.9, 0.6) + lp(noise(0.6), 500) * np.exp(-t_(0.6) * 12) * 0.5
    if name == "scratch":
        d = 1.0
        x = np.zeros(int(d * SR))
        for k in range(5):
            dd = rng.uniform(0.08, 0.18)
            place(x, bp(noise(dd), 1500, 5000) * 0.3 * np.sin(np.linspace(0, np.pi, int(dd * SR))),
                  rng.uniform(0, d - dd))
        return x
    if name == "door_crash":
        return mixl(sfx("door_burst"), sfx("glass") * 0.6)
    if name == "grab":
        return mixl(sfx("whoosh") * 0.6, np.concatenate([np.zeros(int(0.12 * SR)), kick(0.5, 0.3) + bp(
            noise(0.3), 500, 3000) * np.exp(-t_(0.3) * 30) * 0.5]))
    if name == "punch":
        return kick(0.9, 0.4) + bp(noise(0.4), 300, 2500) * np.exp(-t_(0.4) * 30) * 0.6
    if name == "zombie_groan":
        return groans(3.0, 4)
    if name == "title_hit":
        d = 3.0
        t = t_(d)
        rev = hp(noise(0.8), 3000) * np.linspace(0, 1, int(0.8 * SR)) ** 3 * 0.3
        x = np.zeros(int(d * SR))
        place(x, rev, 0)
        place(x, kick(1.0, 2.0) + lp(noise(2.0), 300) * np.exp(-t_(2.0) * 2) * 0.6, 0.8)
        return x
    return None


def sfx(name):
    global rng
    rng = np.random.default_rng(zlib.crc32(name.encode()))
    y = airport_sfx(name)
    if y is None:
        rng = np.random.default_rng(zlib.crc32(name.encode()))
        y = cruise_sfx(name)
    if y is None:
        rng = np.random.default_rng(zlib.crc32(name.encode()))
        y = _sfx_base(name)
    pk = np.abs(y).max() if len(y) else 0
    if 0 < pk < 0.35 and len(y) < 8 * SR:
        return y * (0.35 / pk)
    return y * (0.9 / pk) if pk > 0.9 else y


def _sfx_base(name):
    global rng
    if name == "whoosh":
        d = 0.6
        x = noise(d)
        f = np.linspace(400, 3000, len(x))
        y = np.zeros_like(x)
        for k in range(0, len(x), 2400):
            seg = x[k:k + 2400]
            y[k:k + 2400] = bp(seg, f[k] * 0.6, f[k] * 1.4, 1)
        return y * np.sin(np.linspace(0, np.pi, len(y))) * 0.25
    if name in ("metal_hit", "hatch_bang", "gate_slam", "door_bang", "door_burst"):
        d = 1.2
        t = t_(d)
        x = noise(d) * np.exp(-t * 25) * 0.6
        for f in (180, 410, 730, 1130):
            x += np.sin(2 * np.pi * f * t) * np.exp(-t * (4 + f / 300)) * 0.25
        x += kick(0.8, d)
        if name == "gate_slam":
            for k in range(6):
                place(x, noise(0.05) * 0.2, 0.05 + k * 0.06)
        return lp(x, 6000) * 0.7
    if name in ("bucket_crash",):
        t = t_(0.9)
        x = noise(0.9) * np.exp(-t * 12) * 0.5 + np.sin(2 * np.pi * 320 * t) * np.exp(-t * 6) * 0.3
        x += lp(noise(0.9), 800) * np.exp(-((t - 0.25) ** 2) / 0.01) * 0.6
        return x * 0.8
    if name == "glass_bang":
        t = t_(1.5)
        x = kick(1.0, 1.5) + lp(noise(1.5), 2500) * np.exp(-t * 8) * 0.8
        for f in (1900, 2700, 3900):
            x += np.sin(2 * np.pi * f * t) * np.exp(-t * 7) * 0.08
        return x
    if name == "keys":
        x = np.zeros(int(1.0 * SR))
        for k in range(10):
            t = t_(0.3)
            f = rng.uniform(2500, 5000)
            place(x, np.sin(2 * np.pi * f * t) * np.exp(-t * 25) * 0.15, k * 0.06 + rng.uniform(0, 0.03))
        return x
    if name in ("notify", "ding"):
        x = np.zeros(int(1.4 * SR))
        notes = [nm("E6"), nm("B6")] if name == "notify" else [nm("C6")]
        for i, n in enumerate(notes):
            place(x, piano(n, 1.2, 0.35), i * 0.12)
        return x
    if name == "bark":
        x = np.zeros(int(0.6 * SR))
        for k in range(2):
            t = t_(0.14)
            f = 520 * (1 - 0.35 * t / 0.14)
            ph = np.cumsum(f) / SR
            s = (2 * (ph % 1) - 1) + 0.4 * noise(0.14)
            s = bp(s, 400, 2200) * np.sin(np.linspace(0, np.pi, len(s))) ** 0.5
            place(x, s * 0.5, k * 0.22)
        return x
    if name == "pop":
        t = t_(0.3)
        return hp(noise(0.3), 800) * np.exp(-t * 60) * 0.9 + kick(0.3, 0.3)
    if name == "drip":
        x = np.zeros(int(3.0 * SR))
        for k in range(3):
            t = t_(0.3)
            f = 900 + 600 * np.exp(-t * 40)
            place(x, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 30) * 0.25, k * 0.9)
        return x
    if name in ("chain_rattle", "metal_creak"):
        d = 1.6
        x = np.zeros(int(d * SR))
        for k in range(14):
            place(x, bp(noise(0.06), 2000, 7000) * 0.25, rng.uniform(0, d - 0.1))
        if name == "metal_creak":
            t = t_(d)
            f = 180 + 60 * np.sin(t * 3)
            x += bp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 2500) * 0.05 * np.sin(
                np.linspace(0, np.pi, len(t)))
        return x
    if name == "strike":
        x = np.zeros(int(2.0 * SR))
        place(x, kick(0.6, 0.5), 0)
        for k in range(16):
            t = t_(0.25)
            f = rng.uniform(600, 1600)
            place(x, (np.sin(2 * np.pi * f * t) * 0.3 + noise(0.25) * 0.2) * np.exp(-t * 18), rng.uniform(0, 0.5))
        return x * 0.8
    if name == "balls_thunder":
        d = 4.0
        x = lp(noise(d), 300) * 0.8
        for k in range(40):
            place(x, kick(0.25, 0.3), rng.uniform(0, d - 0.3))
        return x * np.minimum(1, np.linspace(0, 6, len(x))) * np.linspace(1, 0.3, len(x))
    if name in ("rain_loop", "storm_loop"):
        d = 30.0
        x = hp(noise(d), 1500) * 0.06 + lp(noise(d), 600) * (0.05 if name == "rain_loop" else 0.12)
        return x
    if name == "thunder":
        d = 4.0
        t = t_(d)
        return lp(noise(d), 200) * (np.exp(-t * 1.2) * 1.2) + lp(noise(d), 900) * np.exp(-t * 6) * 0.4
    if name == "power_down":
        d = 2.0
        t = t_(d)
        f = 120 * np.exp(-t * 1.5) + 20
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.2) * 0.4 + kick(0.6, d)
    if name == "pull_cord":
        t = t_(0.6)
        return bp(noise(0.6), 300, 2000) * np.exp(-t * 6) * 0.3
    if name == "generator":
        d = 8.0
        t = t_(d)
        f = 32
        x = (saw(f, d) + 0.5 * saw(f * 2.01, d) + 0.2 * lp(noise(d), 300)) * (0.5 + 0.5 * np.sin(2 * np.pi * 8 * t) ** 2)
        x = lp(x, 500) * 0.25
        x *= np.minimum(1, t / 0.3) * np.where(t > d - 1.5, (d - t) / 1.5, 1)
        return x
    if name == "helicopter":
        d = 22.0
        t = t_(d)
        chop = (0.5 + 0.5 * np.sin(2 * np.pi * 7 * t)) ** 3
        x = lp(noise(d), 260) * chop * 0.9 + lp(saw(28, d), 300) * 0.1
        x *= np.minimum(1, t / 2.5)
        return x
    if name == "scream":
        d = 1.4
        t = t_(d)
        f = 420 + 160 * np.sin(np.clip(t / 0.25, 0, 1) * np.pi / 2) + 18 * np.sin(2 * np.pi * 7 * t)
        ph = np.cumsum(f) / SR
        src = 2 * (ph % 1) - 1
        x = bp(src, 700, 1300) + 0.6 * bp(src, 1800, 2800) + 0.3 * noise(d) * 0.2
        x *= np.minimum(1, t / 0.05) * np.exp(-np.maximum(0, t - 0.9) * 6)
        return x * 0.35
    if name == "cart_roll":
        d = 3.0
        t = t_(d)
        return bp(noise(d), 200, 1200) * 0.12 * (0.7 + 0.3 * np.sin(2 * np.pi * 14 * t))
    if name == "sizzle":
        d = 6.0
        return hp(noise(d), 3000) * 0.05 * (0.8 + 0.2 * np.sin(2 * np.pi * 0.7 * t_(d)))
    if name == "music_phones":
        d = 8.0
        x = music("fun", d, 99, 1.0)
        return bp(x, 500, 4000) * 1.4 * np.minimum(1, t_(d) / 0.3)
    if name == "city_ambience":
        d = 10.0
        t = t_(d)
        f = 700 + 250 * np.sin(2 * np.pi * 0.5 * t)
        siren = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.03
        return siren + lp(noise(d), 400) * 0.08
    if name == "groans":
        return groans(10.0, 6)
    return np.zeros(int(0.1 * SR))


def groan(d=1.6, f0=None):
    f0 = f0 or rng.uniform(85, 140)
    t = t_(d)
    f = f0 * (1 + 0.12 * np.sin(2 * np.pi * rng.uniform(0.6, 1.4) * t) - 0.1 * t / d)
    ph = np.cumsum(f) / SR
    src = 2 * (ph % 1) - 1 + 0.3 * noise(d) * 0.3
    x = bp(src, 250, 700) + 0.5 * bp(src, 900, 1300)
    return x * np.sin(np.linspace(0, np.pi, len(x))) ** 1.5 * 0.25


def groans(d, n):
    x = np.zeros(int(d * SR))
    for k in range(n):
        place(x, groan(rng.uniform(1.0, 2.2)), rng.uniform(0, d - 2.2), rng.uniform(0.4, 1.0))
    return lp(x, 1800)


# сегмент → эмбиент: [(с, до, имя, громкость)]
AMB = {
    "cold": [(0, 10, "wind_loop", 0.8)], "d01": [(0, 30, "terminal_hum", 0.8), (12, 30, "groans", 0.5)],
    "d02": [(0, 30, "terminal_hum", 0.6)], "d03": [(0, 30, "belt_loop", 0.6)],
    "d04": [(0, 30, "terminal_hum", 0.7), (12, 30, "groans", 0.5)],
    "d05": [(0, 30, "terminal_hum", 0.6), (8, 30, "groans", 0.4)], "d06": [(0, 30, "night_air", 0.8)],
    "d07": [(0, 30, "terminal_hum", 0.5)], "d08": [(0, 30, "terminal_hum", 0.6), (8, 30, "groans", 0.35)],
    "d09": [(0, 30, "night_air", 0.8)], "d10": [(0, 30, "terminal_hum", 0.5)],
    "d11": [(0, 30, "wind_loop", 0.8), (0, 12, "groans", 0.3)], "d12": [(0, 30, "night_air", 0.5)],
    "d13": [(0, 30, "belt_loop", 0.6), (8, 30, "groans", 0.5)], "d14": [(0, 30, "terminal_hum", 0.6)],
    "d15": [(0, 30, "terminal_hum", 0.5)], "d16": [(0, 30, "night_air", 0.7), (0, 30, "groans", 0.4)],
    "d17": [(0, 30, "night_air", 0.8)], "d18": [(0, 30, "terminal_hum", 0.6)],
    "d19": [(0, 30, "night_air", 0.7)], "d20": [(0, 30, "night_air", 0.7), (0, 30, "groans", 0.3)],
    "d21": [(0, 30, "wind_loop", 0.7)], "d22": [(0, 30, "wind_loop", 0.6), (0, 30, "groans", 0.7)],
    "d23": [(0, 30, "night_air", 0.6)], "d24": [(0, 30, "storm_loop", 1.2)],
    "d25": [(0, 30, "basement", 1.0), (5, 22, "groans", 0.5)], "d26": [(0, 30, "night_air", 0.6)],
    "d27": [(0, 30, "terminal_hum", 0.4)], "d28": [(0, 30, "belt_loop", 0.5), (5, 30, "groans", 0.7)],
    "d29": [(0, 15, "rain_loop", 0.8), (13, 30, "night_air", 0.8)],
    "d30": [(0, 30, "wind_loop", 0.7), (6, 30, "groans", 0.6)], "epi": [(0, 12, "desert_wind", 0.8)],
}


def fit(x, d):
    n = int(d * SR)
    if len(x) >= n:
        y = x[:n].copy()
    else:
        reps = int(np.ceil(n / max(1, len(x))))
        y = np.tile(x, reps)[:n]
    f = min(int(0.4 * SR), n // 4)
    if f > 0:
        y[:f] *= np.linspace(0, 1, f)
        y[-f:] *= np.linspace(1, 0, f)
    return y


# --- сведение ----------------------------------------------------------------------

def load_voice(path, tempo):
    if abs(tempo - 1.0) > 1e-3:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-filter:a", f"atempo={tempo}", "-ar", str(SR),
                              "-ac", "1", "-f", "f32le", "-"], capture_output=True).stdout
    else:
        raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-ar", str(SR), "-ac", "1", "-f", "f32le", "-"],
                             capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def build(film_segments=None):
    from scenes import timing as TM
    from scenes import timeline
    os.makedirs(OUT, exist_ok=True)
    film = timeline.build()
    total = film.dur
    n = int(total * SR) + SR
    voice = np.zeros(n)
    mus = np.zeros(n)
    fxb = np.zeros(n)
    tim = json.load(open(os.path.join(ROOT, "build", "voice", "timing.json")))["segments"]
    for i, S in enumerate(film.segments):
        t0 = S.start
        # озвучка
        if S.key in tim:
            tempo = tim[S.key]["tempo"]
            for L in tim[S.key]["lines"]:
                v = load_voice(L["file"], tempo)
                place(voice, v, t0 + L["start"])
        # музыка
        m = segment_music(S.key, S.dur + 1.0, i, scene_moods(S))
        e = np.ones(len(m))
        f = int(0.5 * SR)
        e[:f] = np.linspace(0.3, 1, f)
        e[-int(1.0 * SR):] = np.linspace(1, 0, int(1.0 * SR))
        place(mus, m * e, t0)
        # смена дня — свист
        if i > 0 and S.key.startswith("d"):
            place(fxb, sfx("whoosh"), t0 - 0.15, 0.8)
        # эмбиент
        for a, b, name, g in AMB.get(S.key, []):
            place(fxb, fit(sfx(name), b - a), t0 + a, g)
        # события сцен
        for t, name, g in S.sfx:
            if name in ("rain_loop", "storm_loop"):
                continue
            place(fxb, sfx(name), t0 + t, g)
        print("audio", S.key, flush=True)
    # ducking: музыка тише под голосом
    env = movavg(np.abs(voice), 0.05 * SR)
    env = np.minimum(1, env / 0.02)
    env = movavg(env, 0.25 * SR)
    duck = 1 - 0.55 * env
    mus = reverb(mus, 2.4, 0.3) * duck
    fxb = reverb(fxb, 1.2, 0.15)
    # голос: лёгкая компрессия/выравнивание
    vpk = np.percentile(np.abs(voice[np.abs(voice) > 1e-4]), 99.5) if np.any(np.abs(voice) > 1e-4) else 1
    voice = voice / vpk * 0.5
    voice = hp(voice, 70)
    mix_l = voice * 1.0 + mus * 0.55 + fxb * 0.6
    mix_r = voice * 1.0 + np.roll(mus, int(0.012 * SR)) * 0.55 + np.roll(fxb, int(0.008 * SR)) * 0.6
    st = np.stack([mix_l, mix_r], 1)[:int(total * SR)]
    st /= max(1.0, np.abs(st).max() / 0.95)
    p = os.path.join(OUT, "mix.wav")
    sf.write(p, st.astype(np.float32), SR)
    print(p, "%.1f s" % (len(st) / SR))


if __name__ == "__main__":
    build()
