#!/usr/bin/env python3
"""Звуковые эффекты для роликов (без музыки): синтез на numpy.

  python3 tools/sfx.py cues.json out.wav     # свести звук ролика по меткам сцены
  python3 tools/sfx.py --demo out.wav        # все звуки подряд, чтобы послушать

cues.json (его пишет tools/render_anim.js из window.SCENE.audio()):
  {"duration": 25,
   "cues": [{"t": 6.5, "kind": "punch", "gain": 1, "pan": -0.3, "dur": 1.2, "pitch": 1.2}, ...]}
pan: -1 слева … 1 справа. dur — для звуков, длина которых зависит от сцены (звёздочки, ветер).
pitch — выше/ниже (голос маленького выше, большого ниже).
kind 'ref:имя' — готовый звук из sounds/ref/имя.wav (музыка превращения, дыхание и пение Лорда и др.).
"""
import json
import os
import sys
import wave

import numpy as np

SR = 48000
TAU = 2 * np.pi


# ---------------------------------------------------------------- кирпичики
def nsamp(d):
    return max(1, int(round(d * SR)))


def tt(d):
    return np.arange(nsamp(d)) / SR


def noise(d, seed=0):
    return np.random.default_rng(seed).uniform(-1, 1, nsamp(d))


def osc(freq, d, kind='sine', duty=0.5):
    n = nsamp(d)
    f = np.full(n, float(freq)) if np.ndim(freq) == 0 else np.resize(np.asarray(freq, float), n)
    ph = np.cumsum(f) / SR
    if kind == 'sine':
        return np.sin(TAU * ph)
    if kind == 'square':
        return np.where(ph % 1 < duty, 1.0, -1.0)
    if kind == 'tri':
        return 4 * np.abs(ph % 1 - 0.5) - 1
    if kind == 'saw':
        return 2 * (ph % 1) - 1
    raise ValueError(kind)


def glide(f0, f1, d, curve='exp'):
    u = np.linspace(0, 1, nsamp(d))
    return f0 * (f1 / f0) ** u if curve == 'exp' else f0 + (f1 - f0) * u


def decay(d, tau, attack=0.002):
    t = tt(d)
    e = np.exp(-t / tau)
    if attack > 0:
        e = e * np.minimum(1, t / attack)
    return e


def bell(d, peak=0.5):
    """Плавный подъём до peak (доля длины) и спад до нуля."""
    u = np.linspace(0, 1, nsamp(d))
    up = np.sin(np.pi / 2 * np.clip(u / peak, 0, 1))
    down = np.cos(np.pi / 2 * np.clip((u - peak) / (1 - peak), 0, 1))
    return np.where(u < peak, up, down) ** 2


def bandpass(x, lo, hi):
    """Полоса через спектр, края мягкие (~24 дБ/окт)."""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = 1 / (1 + (lo / np.maximum(f, 1)) ** 4) / (1 + (f / hi) ** 4)
    return np.fft.irfft(X * m, len(x))


def lowpass(x, fc):
    """Однополюсный ФНЧ; fc может меняться во времени."""
    fc = np.resize(np.asarray(fc, float), len(x))
    a = 1 - np.exp(-TAU * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y


def lowpass2(x, fc):
    """Два однополюсных подряд: 12 дБ/окт, шум звучит «воздухом», а не шипением."""
    return lowpass(lowpass(x, fc), fc)


def norm(x, peak=1.0):
    m = np.max(np.abs(x))
    return x * (peak / m) if m > 0 else x


def put(dst, src, t):
    i = int(round(t * SR))
    if i >= len(dst) or i + len(src) <= 0:
        return
    s0 = max(0, -i)
    j = min(len(dst), i + len(src))
    dst[max(0, i):j] += src[s0:s0 + j - max(0, i)]


def repitch(x, k):
    """Чуть выше/ниже (k > 1 — выше и короче)."""
    if abs(k - 1) < 1e-3:
        return x
    n = int(len(x) / k)
    return np.interp(np.arange(n) * k, np.arange(len(x)), x)


# ---------------------------------------------------------------- удары
def s_punch(seed=1, **_):
    d = 0.35
    body = osc(glide(150, 45, d), d) * decay(d, 0.07)
    knock = bandpass(noise(d, seed), 250, 1400) * decay(d, 0.025)
    crack = bandpass(noise(d, seed + 1), 1800, 7000) * decay(d, 0.01)
    return norm(np.tanh(1.6 * (body + 0.9 * knock + 0.5 * crack)), 0.95)


def s_kick(seed=2, **_):
    d = 0.45
    body = osc(glide(130, 38, d), d) * decay(d, 0.09)
    knock = bandpass(noise(d, seed), 200, 1200) * decay(d, 0.035)
    crack = bandpass(noise(d, seed + 1), 1800, 7000) * decay(d, 0.012)
    return norm(np.tanh(1.8 * (body + 0.8 * knock + 0.4 * crack)), 0.98)


def s_slap(seed=3, **_):
    d = 0.25
    crack = bandpass(noise(d, seed), 1500, 9000) * decay(d, 0.022, 0.001)
    smack = bandpass(noise(d, seed + 1), 500, 2500) * decay(d, 0.04)
    tone = osc(glide(420, 260, d), d) * decay(d, 0.03)
    return norm(np.tanh(1.4 * (crack + 0.7 * smack + 0.3 * tone)), 0.9)


def s_bonk(seed=4, **_):
    """Удар головой: деревянный «бонк»."""
    d = 0.4
    f = glide(620, 430, d)
    tone = (osc(f, d) + 0.5 * osc(f * 2.01, d) + 0.25 * osc(f * 3.3, d)) * decay(d, 0.09)
    click = bandpass(noise(d, seed), 2000, 8000) * decay(d, 0.006)
    thud = osc(glide(160, 70, d), d) * decay(d, 0.05)
    return norm(tone + 0.6 * click + 0.7 * thud, 0.9)


def s_land(seed=5, **_):
    d = 0.22
    thud = osc(glide(170, 60, d), d) * decay(d, 0.04)
    scuff = bandpass(noise(d, seed), 150, 1500) * decay(d, 0.03)
    return norm(thud + 0.5 * scuff, 0.8)


def s_slam(seed=6, **_):
    """Тяжёлое падение о землю."""
    d = 1.2
    boom = osc(glide(95, 28, d), d) * decay(d, 0.25)
    rumble = bandpass(noise(d, seed), 30, 350) * decay(d, 0.35, 0.005)
    crack = bandpass(noise(d, seed + 1), 1200, 6000) * decay(d, 0.02)
    return norm(np.tanh(2 * (boom + 0.9 * rumble + 0.4 * crack)), 0.98)


def s_step(seed=12, **_):
    d = 0.12
    tap = bandpass(noise(d, seed), 120, 1200) * decay(d, 0.012)
    thud = osc(glide(130, 80, d), d) * decay(d, 0.02)
    return norm(tap + 0.6 * thud, 0.45)


def s_fall(seed=14, **_):
    """Упал на землю после отлёта: глухой удар телом и шорох травы."""
    d = 0.7
    thud = osc(glide(120, 40, d), d) * decay(d, 0.12)
    body = bandpass(noise(d, seed), 80, 900) * decay(d, 0.09, 0.003)
    grass = bandpass(noise(d, seed + 1), 1500, 6000) * decay(d, 0.05)
    return norm(np.tanh(1.8 * (thud + 0.8 * body + 0.25 * grass)), 0.9)


def s_swing(seed=15, **_):
    """Взмах рукой или ногой перед ударом: короткий «вжух» с подъёмом."""
    d = 0.24
    u = np.linspace(0, 1, nsamp(d))
    x = noise(d, seed)
    fc = 500 + 3500 * u ** 1.5
    y = lowpass2(x, fc) - lowpass2(x, fc * 0.3)
    return norm(y * bell(d, 0.8), 0.6)


def s_hurt(**_):
    """Получил урон: мультяшное «ой!» (голос: пила через форманты «о-а», высота вверх-вниз)."""
    d = 0.42
    t = tt(d)
    f0 = np.interp(t, [0, 0.06, 0.16, d], [380, 520, 430, 260])
    src = osc(f0 * (1 + 0.015 * np.sin(TAU * 30 * t)), d, 'saw')
    def vowel(bands):
        return sum(g * bandpass(src, lo, hi) for lo, hi, g in bands)
    o = vowel([(400, 800, 1.0), (750, 1200, 0.6), (2300, 3100, 0.2)])
    a = vowel([(650, 1100, 1.0), (1050, 1600, 0.7), (2400, 3300, 0.25)])
    u = np.clip(t / 0.2, 0, 1)                                         # «о» -> «а»
    return norm((o * (1 - u) + a * u) * bell(d, 0.12), 0.75)


# ---------------------------------------------------------------- пружины, прыжки
def s_boing(**_):
    """Живот-батут, пружина."""
    d = 0.75
    t = tt(d)
    f = glide(320, 140, d) * (1 + 0.35 * np.sin(TAU * 14 * t) * np.exp(-t / 0.3))
    x = 0.7 * osc(f, d, 'tri') + 0.3 * osc(f * 2, d)
    return norm(x * decay(d, 0.22, 0.004), 0.85)


def s_bounce(**_):
    d = 0.3
    x = osc(glide(300, 180, d), d, 'tri') * decay(d, 0.1, 0.003)
    return norm(x, 0.5)


def s_jump(**_):
    d = 0.16
    f = glide(260, 820, d)
    x = (osc(f, d) + 0.25 * osc(f, d, 'square')) * bell(d, 0.15)
    return norm(lowpass(x, 3000), 0.55)


def s_grow(**_):
    """Большая версия «выпрыгивает» из дыма."""
    d = 0.5
    t = tt(d)
    f = glide(130, 420, d) * (1 + 0.12 * np.sin(TAU * 16 * t))
    x = 0.6 * osc(f, d, 'tri') + 0.4 * osc(f * 0.5, d)
    return norm(x * bell(d, 0.25), 0.7)


# ---------------------------------------------------------------- воздух, дым
def s_whoosh(seed=7, dur=0.4, **_):
    d = max(0.15, dur)
    x = noise(d, seed)
    u = np.linspace(0, 1, nsamp(d))
    fc = 400 + 3200 * np.sin(np.pi * u) ** 2
    y = lowpass2(x, fc) - lowpass2(x, fc * 0.3)
    return norm(y * bell(d, 0.45), 0.7)


def s_gust(seed=8, dur=1.6, pulses=3, **_):
    """Ветер от взмахов крыльев: порывы и низкий «вух» на каждый взмах."""
    d = max(0.6, dur)
    t = tt(d)
    amp = np.zeros_like(t)
    whump = np.zeros_like(t)
    for i in range(pulses):
        c = (i + 0.5) / pulses * d
        amp += np.exp(-((t - c) / (0.22 * d / pulses + 0.05)) ** 2)
        put(whump, osc(glide(90, 45, 0.3), 0.3) * decay(0.3, 0.08), c - 0.12)
    fc = 250 + 650 * amp
    w = noise(d, seed)
    y = lowpass2(w, fc) - lowpass2(w, 90)
    return norm(norm(y * (0.25 + amp)) + 0.6 * whump, 0.75)


def s_poof(seed=9, **_):
    d = 0.9
    y = lowpass2(noise(d, seed), glide(3500, 400, d)) * decay(d, 0.22, 0.008)
    low = osc(glide(110, 50, d), d) * decay(d, 0.12)
    return norm(y + 0.5 * low, 0.85)


def s_whirr(seed=16, dur=1.0, **_):
    """Пропеллер: жужжание лопастей, разгоняется в начале и стихает в конце."""
    d = max(0.3, dur)
    t = tt(d)
    up = np.clip(t / 0.35, 0, 1)
    rate = 9 + 23 * up                                      # взмахов лопастей в секунду
    chop = 0.5 + 0.5 * np.sign(np.sin(TAU * np.cumsum(rate) / SR))
    air = lowpass2(noise(d, seed), 1400) - lowpass2(noise(d, seed), 150)
    hum = osc(110 + 140 * up, d, 'tri')
    env = np.clip(t / 0.08, 0, 1) * np.clip((d - t) / 0.15, 0, 1)
    return norm((norm(air) * (0.4 + 0.6 * chop) + 0.35 * hum) * env, 0.55)


def s_buzz(seed=27, dur=1.0, **_):
    """Пчёлы: рой жужжит — несколько чуть расстроенных пил с дрожью громкости."""
    d = max(0.3, dur)
    t = tt(d)
    out = np.zeros_like(t)
    rng = np.random.default_rng(seed)
    for i in range(5):
        f0 = 190 + 45 * i + rng.uniform(-8, 8)
        wob = 1 + 0.035 * np.sin(TAU * (5 + 2 * i) * t + rng.uniform(0, TAU))
        ph = TAU * np.cumsum(f0 * wob) / SR
        saw = 2 * ((ph / TAU) % 1) - 1
        out += saw * (0.6 + 0.4 * np.sin(TAU * (23 + 3 * i) * t + i))
    out = lowpass2(out, 2600)
    env = np.clip(t / 0.12, 0, 1) * np.clip((d - t) / 0.2, 0, 1)
    return norm(out * env, 0.45)


def s_chomp(seed=17, **_):
    """Кусь: зубы щёлкнули и сжали."""
    d = 0.3
    x = np.zeros(nsamp(d))
    for t0, g in [(0, 1.0), (0.07, 0.7)]:
        put(x, g * bandpass(noise(0.05, seed), 1200, 6000) * decay(0.05, 0.006, 0.0005), t0)
        put(x, g * osc(glide(300, 120, 0.08), 0.08) * decay(0.08, 0.02), t0)
    return norm(x, 0.7)


def s_flick(seed=18, **_):
    """Щелчок пальцем по пропеллеру."""
    d = 0.15
    x = bandpass(noise(d, seed), 2000, 9000) * decay(d, 0.008, 0.0005) + 0.5 * osc(glide(1800, 900, d), d) * decay(d, 0.03)
    return norm(x, 0.6)


def s_spring(**_):
    """Пружина выстрелила: «бдыщ-ыщ-ыщ» — вибрирующий металлический тон."""
    d = 0.7
    t = tt(d)
    f = 520 * (1 + 0.25 * np.sin(TAU * 22 * t) * np.exp(-t / 0.25))
    x = 0.6 * osc(f, d, 'tri') + 0.4 * osc(f * 1.51, d) * np.exp(-t / 0.1)
    return norm(x * decay(d, 0.22, 0.002), 0.7)


def s_suck(seed=19, dur=2.0, **_):
    """Огромный вдох: нарастающий рёв воздуха и низкий гул."""
    d = max(0.5, dur)
    t = tt(d)
    up = np.clip(t / (0.35 * d), 0, 1)
    env = up * np.clip((d - t) / 0.12, 0, 1)
    w = noise(d, seed)
    air = lowpass2(w, 300 + 1500 * up) - lowpass2(w, 80)
    hum = osc(70 + 40 * up, d, 'saw')
    return norm((norm(air) + 0.35 * norm(lowpass(hum, 300))) * env, 0.7)


def s_gulp(**_):
    """Глоток: «гульп» — булькающий тон вниз."""
    d = 0.35
    t = tt(d)
    f = np.interp(t, [0, 0.08, 0.2, d], [300, 520, 160, 90])
    x = osc(f, d) * bell(d, 0.2) + 0.4 * osc(f * 2.02, d) * decay(d, 0.06)
    return norm(lowpass(x, 2500), 0.75)


def s_spit(seed=20, **_):
    """Выплюнул: «тьфу» — короткий взрыв воздуха и брызги."""
    d = 0.45
    puff_ = lowpass2(noise(d, seed), 1800) * decay(d, 0.05, 0.002)
    spray = bandpass(noise(d, seed + 1), 3000, 9000) * decay(d, 0.12, 0.01)
    pop = osc(glide(240, 90, d), d) * decay(d, 0.04)
    return norm(norm(puff_) + 0.4 * norm(spray) + 0.6 * pop, 0.85)


def s_inflate(dur=1.0, **_):
    """Надувает пузырь: резиновый писк, растущий вверх."""
    d = max(0.3, dur)
    t = tt(d)
    f = glide(160, 520, d) * (1 + 0.04 * np.sin(TAU * 11 * t))
    x = lowpass(osc(f, d, 'saw'), 900 + 1500 * t / d) + 0.3 * osc(f * 2, d)
    return norm(x * bell(d, 0.85), 0.5)


def s_burst(seed=21, **_):
    """Пузырь лопнул: резкий хлопок и мокрый шлепок."""
    d = 0.5
    crack = bandpass(noise(d, seed), 1500, 9000) * decay(d, 0.012, 0.0005)
    wet = lowpass2(noise(d, seed + 1), 1500) * decay(d, 0.08, 0.004)
    thump = osc(glide(260, 80, d), d) * decay(d, 0.05)
    return norm(norm(crack) + 0.7 * norm(wet) + 0.5 * thump, 0.9)


def s_rain(seed=22, dur=2.0, **_):
    """Дождь: ровный шум и редкие капли."""
    d = max(0.5, dur)
    t = tt(d)
    hiss = bandpass(noise(d, seed), 1200, 7000)
    drops = np.zeros(nsamp(d))
    rr = np.random.default_rng(seed)
    for t0 in rr.uniform(0, d - 0.05, int(d * 14)):
        put(drops, osc(glide(1800 + rr.random() * 900, 700, 0.04), 0.04) * decay(0.04, 0.01), t0)
    env = np.clip(t / 0.25, 0, 1) * np.clip((d - t) / 0.3, 0, 1)
    return norm((0.6 * norm(hiss) + 0.5 * norm(drops)) * env, 0.45)


def s_zap(seed=23, **_):
    """Молния: электрический треск и раскат грома."""
    d = 1.6
    t = tt(d)
    crackle = bandpass(noise(d, seed), 2000, 10000) * (np.random.default_rng(seed).random(nsamp(d)) > 0.7) * decay(d, 0.18, 0.001)
    buzz = osc(120, d, 'square') * decay(d, 0.25) * (0.5 + 0.5 * np.sign(np.sin(TAU * 30 * t)))
    boom = lowpass2(noise(d, seed + 1), 200) * decay(d, 0.6, 0.04)
    return norm(0.8 * norm(crackle) + 0.25 * lowpass(buzz, 1500) + norm(boom), 0.95)


def s_splash(seed=24, **_):
    """Шлёпнулся в грязь: тяжёлый мокрый шлепок и бульканье."""
    d = 0.9
    thud = osc(glide(110, 45, d), d) * decay(d, 0.12)
    wet = lowpass2(noise(d, seed), glide(2500, 300, d)) * decay(d, 0.18, 0.003)
    x = np.zeros(nsamp(d))
    for i, t0 in enumerate([0.12, 0.22, 0.35, 0.5]):
        put(x, 0.5 * osc(glide(300 + 80 * i, 700, 0.06), 0.06) * bell(0.06, 0.3), t0)
    return norm(norm(thud) + 0.9 * norm(wet) + 0.6 * x, 0.9)


def s_creak(dur=1.0, **_):
    """Натянутая верёвка: скрип."""
    d = max(0.3, dur)
    t = tt(d)
    f = 240 * (1 + 0.15 * np.sin(TAU * 3 * t))
    chop = 0.5 + 0.5 * np.sign(np.sin(TAU * 35 * t))
    x = lowpass(osc(f, d, 'saw'), 1800) * chop
    return norm(x * bell(d, 0.5), 0.35)


def s_sob(dur=1.0, **_):
    """Плач: «уа-а» волнами."""
    d = max(0.4, dur)
    t = tt(d)
    f0 = 520 + 120 * np.sin(TAU * 2.2 * t) * np.sin(TAU * 0.5 * t / d)
    src = osc(f0, d, 'saw')
    v = bandpass(src, 700, 1500) + 0.6 * bandpass(src, 1500, 2600)
    env = (0.55 + 0.45 * np.sin(TAU * 2.2 * t - 1.2)) * np.clip(t / 0.06, 0, 1) * np.clip((d - t) / 0.15, 0, 1)
    return norm(v * env, 0.55)


def s_lick(seed=25, **_):
    """Лизнул: мокрое «шлюп»."""
    d = 0.22
    x = lowpass2(noise(d, seed), glide(2500, 700, d)) * bell(d, 0.3)
    return norm(x + 0.3 * osc(glide(500, 900, d), d) * bell(d, 0.4), 0.45)


# ---------------------------------------------------------------- злость, сила
def s_anger(seed=10, dur=1.0, **_):
    """Жилка и пар: шипение и рычание."""
    d = max(0.3, dur)
    t = tt(d)
    hiss = bandpass(noise(d, seed), 3000, 11000) * bell(d, 0.3) * (0.7 + 0.3 * np.sin(TAU * 9 * t))
    growl = lowpass(osc(70 * (1 + 0.05 * np.sin(TAU * 6 * t)), d, 'saw'), 420)
    growl = growl * bell(d, 0.5) * (0.6 + 0.4 * np.sin(TAU * 24 * t))
    return norm(0.5 * norm(hiss) + 0.8 * norm(growl), 0.6)


def s_powerup(dur=0.7, **_):
    """Золотые лучи перед превращением: восходящий 8-битный свип."""
    d = max(0.3, dur)
    f = glide(180, 1100, d)
    x = 0.5 * osc(f, d, 'square', 0.25) + 0.5 * osc(f * 1.5, d, 'tri')
    x = x * (0.75 + 0.25 * np.sin(TAU * 20 * tt(d)))
    return norm(lowpass(x, 3500) * bell(d, 0.85), 0.5)


def s_pop(seed=11, **_):
    d = 0.3
    tone = osc(glide(520, 130, d), d) * decay(d, 0.08)
    click = bandpass(noise(d, seed), 1500, 6000) * decay(d, 0.005)
    return norm(tone + 0.4 * click, 0.75)


# ---------------------------------------------------------------- блеск, звёздочки, пот
def s_twinkle(**_):
    d = 0.9
    x = np.zeros(nsamp(d))
    for i, f in enumerate([2093, 2637, 3136]):
        put(x, (osc(f, 0.6) + 0.3 * osc(f * 2, 0.6)) * decay(0.6, 0.18), i * 0.07)
    return norm(x, 0.45)


def s_sparkle(**_):
    d = 0.4
    x = osc(3520, d) * decay(d, 0.1) + 0.4 * osc(5274, d) * decay(d, 0.06)
    return norm(x, 0.28)


def s_dizzy(dur=1.5, **_):
    """Птички над головой: короткие «чик-чирик»."""
    d = max(0.4, dur)
    x = np.zeros(nsamp(d))
    for i, t0 in enumerate(np.arange(0.05, d - 0.12, 0.3)):
        a, b = (2300, 3300) if i % 2 == 0 else (2700, 3700)
        put(x, osc(glide(a, b, 0.09), 0.09) * bell(0.09, 0.3), t0)
        put(x, osc(glide(a, b, 0.07), 0.07) * bell(0.07, 0.3) * 0.7, t0 + 0.11)
    return norm(x, 0.3)


def s_drip(**_):
    d = 0.12
    return norm(osc(glide(1300, 500, d), d) * decay(d, 0.035), 0.45)


def s_scared(**_):
    """Свисток вниз: «ой-ой»."""
    d = 0.6
    f = glide(1150, 480, d) * (1 + 0.03 * np.sin(TAU * 7 * tt(d)))
    return norm(osc(f, d) * bell(d, 0.1), 0.4)


# ---------------------------------------------------------------- любовь
def s_heart(**_):
    d = 0.25
    x = osc(glide(700, 1400, d), d) * decay(d, 0.07) + 0.3 * osc(glide(1400, 2800, d), d) * decay(d, 0.05)
    return norm(x, 0.45)


def s_kiss(seed=13, **_):
    """«Чмок»: щелчок губ и короткое «муа»."""
    d = 0.5
    smack = bandpass(noise(0.05, seed), 800, 4000) * decay(0.05, 0.008, 0.0005)
    t = tt(0.4)
    f = np.interp(t, [0, 0.12, 0.4], [240, 420, 260])
    voice = lowpass(osc(f, 0.4, 'saw'), np.interp(t, [0, 0.1, 0.4], [400, 2200, 600])) * bell(0.4, 0.3)
    x = np.zeros(nsamp(d))
    put(x, norm(smack), 0)
    put(x, 0.7 * norm(voice), 0.04)
    return norm(x, 0.6)


def s_love(**_):
    """Мечтательная арфа вверх."""
    notes = [523, 587, 659, 784, 880, 1047, 1175, 1319]
    x = np.zeros(nsamp(1.4))
    for i, f in enumerate(notes):
        put(x, (osc(f, 0.8) + 0.35 * osc(f * 2, 0.8)) * decay(0.8, 0.3, 0.004), i * 0.055)
    return norm(x, 0.42)




# ---------------------------------------------------------------- сведение
# ---------------------------------------------------------------- сэмплы
# 'ref:имя' — запись из sounds/ref/имя.wav (вырезана из присланного образца; см. sounds/README.md)
REF_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'sounds', 'ref')
_samples = {}


def sample(name):
    if name not in _samples:
        with wave.open(os.path.join(REF_DIR, name + '.wav')) as w:
            sr, ch = w.getframerate(), w.getnchannels()
            x = np.frombuffer(w.readframes(w.getnframes()), '<i2').reshape(-1, ch) / 32768
        if sr != SR:                                              # к частоте сведения
            n = int(round(len(x) * SR / sr))
            src = np.arange(n) * sr / SR
            x = np.stack([np.interp(src, np.arange(len(x)), x[:, i]) for i in range(ch)], 1)
        _samples[name] = x
    return _samples[name]


def render_sample(c):
    x = sample(c['kind'][4:])
    k = c.get('pitch') or 1
    if k != 1:
        x = np.stack([repitch(x[:, i], k) for i in range(x.shape[1])], 1)
    if c.get('dur'):                                              # обрезать с затуханием (у длинной музыки — подольше)
        n = min(len(x), nsamp(c['dur']))
        f = min(n, nsamp(min(0.8, max(0.05, c['dur'] * 0.12))))
        x = x[:n] * np.concatenate([np.ones(n - f), np.linspace(1, 0, f)])[:, None]
    return x[:, 0] if x.shape[1] == 1 else x


def s_sneeze(seed=29, **_):
    """Чих «а-а-апчхи!»: вдох с подъёмом тона, пауза и резкий шумный выдох."""
    d1, d2 = 0.55, 0.32
    t = tt(d1)
    f = 330 * (1 + 0.55 * t / d1)
    ah = osc(f, d1, 'saw') * 0.5 + osc(f * 2, d1, 'sine') * 0.25
    ah = bandpass(ah, 300, 2600) * np.clip(t / 0.05, 0, 1) * np.clip((d1 - t) / 0.06, 0, 1) * (0.4 + 0.6 * t / d1)
    t2 = tt(d2)
    chu = bandpass(noise(d2, seed), 1800, 9000) * decay(d2, 0.09, 0.004)
    tone = osc(260 * (1 - 0.4 * t2 / d2), d2, 'saw') * decay(d2, 0.07) * 0.5
    gap = np.zeros(nsamp(0.07))
    return norm(np.concatenate([norm(ah, 0.45), gap, norm(chu + tone, 1.0)]), 0.95)


def s_crunch(seed=30, **_):
    """Хруст снега: несколько коротких шорохов подряд."""
    d = 0.32
    out = np.zeros(nsamp(d))
    rng = np.random.default_rng(seed)
    for k in range(5):
        g = bandpass(noise(0.05, seed + k), 900, 6000) * decay(0.05, 0.012, 0.002)
        put(out, g * (0.6 + 0.4 * rng.random()), k * 0.055 + rng.random() * 0.02)
    return norm(out, 0.7)


def s_snowhit(seed=31, **_):
    """Снежок попал: мягкий глухой шлепок и рассыпчатый хруст."""
    d = 0.35
    t = tt(d)
    thud = osc(110 * np.exp(-t * 6), d, 'sine') * decay(d, 0.05, 0.002)
    crunch = bandpass(noise(d, seed), 700, 7000) * decay(d, 0.09, 0.002)
    return norm(0.9 * thud + 0.8 * crunch, 0.9)


def s_chatter(seed=32, dur=1.0, **_):
    """Зубы стучат от холода: частые сухие щелчки."""
    d = max(0.3, dur)
    out = np.zeros(nsamp(d))
    t = 0.0
    rng = np.random.default_rng(seed)
    while t < d - 0.03:
        c = bandpass(noise(0.02, seed + int(t * 100)), 1800, 6000) * decay(0.02, 0.004, 0.0005)
        put(out, c * (0.7 + 0.3 * rng.random()), t)
        t += 0.045 + rng.random() * 0.015
    return norm(out, 0.55)


def s_squish(seed=33, **_):
    """Слизь: влажный «чвак» с бульком вниз."""
    d = 0.3
    t = tt(d)
    blub = osc(380 * np.exp(-t * 7) + 90, d, 'sine') * decay(d, 0.09, 0.004)
    wet = bandpass(noise(d, seed), 300, 2500) * decay(d, 0.05, 0.002)
    return norm(blub + 0.5 * wet, 0.85)


def s_burp(seed=34, **_):
    """Громкая отрыжка: низкий хриплый «бу-у-урп» с дрожью."""
    d = 0.75
    t = tt(d)
    f0 = 95 * (1 + 0.25 * np.sin(TAU * 7 * t)) * (1.1 - 0.3 * t / d)
    ph = TAU * np.cumsum(f0) / SR
    buzz = np.sign(np.sin(ph)) * 0.6 + np.sin(ph * 2) * 0.3
    buzz = bandpass(buzz, 60, 1200) * (0.7 + 0.3 * np.abs(np.sin(TAU * 23 * t)))
    rasp = bandpass(noise(d, seed), 200, 900) * 0.25
    env = np.clip(t / 0.04, 0, 1) * np.clip((d - t) / 0.2, 0, 1)
    return norm((buzz + rasp) * env, 0.95)


def s_slide(seed=28, **_):
    """Свисток вверх: превращение «щёлк» — тон 600 → 3200 Гц и воздух."""
    d = 0.3
    t = tt(d)
    f = 600 * (3200 / 600) ** (t / d) ** 1.4
    tone = np.sin(TAU * np.cumsum(f) / SR)
    air = bandpass(noise(d, seed), 1500, 7000) * 0.25
    env = np.clip(t / 0.02, 0, 1) * np.clip((d - t) / 0.08, 0, 1)
    return norm((tone + air) * env, 0.6)


SOUNDS = {k[2:]: v for k, v in globals().items() if k.startswith('s_') and callable(v)}


def render_cue(c):
    if c['kind'].startswith('ref:'):
        return render_sample(c)
    fn = SOUNDS[c['kind']]
    seed = int(c.get('seed', round(c['t'] * 97)))
    x = fn(seed=seed, dur=c.get('dur', 0) or None) if c.get('dur') else fn(seed=seed)
    k = c.get('pitch')
    if k is None and c['kind'] in ('step', 'punch', 'land', 'jump', 'slap', 'drip'):
        k = 1 + (np.random.default_rng(seed).random() - 0.5) * 0.1     # чуть разные повторы
    return repitch(x, k or 1)


def mix(spec):
    n = nsamp(spec['duration'])
    left = np.zeros(n)
    right = np.zeros(n)
    for c in spec['cues']:
        x = render_cue(c) * c.get('gain', 1.0)
        if x.ndim == 2:                                           # стерео-сэмпл (музыка) — как есть
            put(left, x[:, 0], c['t'])
            put(right, x[:, 1], c['t'])
            continue
        p = float(np.clip(c.get('pan', 0), -1, 1))
        a = (p + 1) * np.pi / 4
        put(left, x * np.cos(a) * np.sqrt(2), c['t'])
        put(right, x * np.sin(a) * np.sqrt(2), c['t'])
    st = np.stack([left, right], 1)
    st = 0.9 * np.tanh(st / 0.9)                               # мягкий ограничитель
    return st


def write_wav(path, st):
    data = (np.clip(st, -1, 1) * 32767).astype('<i2')
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


def demo():
    cues, t = [], 0.3
    for k in SOUNDS:
        cues.append({'t': t, 'kind': k, 'dur': 1.2 if k in ('dizzy', 'gust', 'anger', 'whirr', 'suck', 'inflate', 'rain', 'creak', 'sob', 'buzz', 'chatter') else 0})
        t += 1.8 if k in ('dizzy', 'gust', 'slam', 'love') else 1.0
    return {'duration': t + 0.5, 'cues': cues}


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == '--demo':
        write_wav(sys.argv[2], mix(demo()))
    elif len(sys.argv) == 3:
        with open(sys.argv[1]) as f:
            write_wav(sys.argv[2], mix(json.load(f)))
    else:
        sys.exit(__doc__)
