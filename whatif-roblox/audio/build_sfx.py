#!/usr/bin/env python3
"""Build the named SFX library (assets/sfx/*.ogg) from CC0 sources + synthesis + FluidSynth stings.

usage: python3 audio/build_sfx.py [name ...]     (sources: audio/fetch_sources.sh -> $SFX_SRC)
Each vocabulary name in audio/vocab.json gets one or more variants: name.ogg, name.2.ogg, ...
"""
import json, os, sys, glob
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import *  # noqa

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(ROOT, 'assets', 'sfx')
SRC = os.environ.get('SFX_SRC', '/tmp/sfxlib')
VOCAB = json.load(open(os.path.join(HERE, 'vocab.json')))


def src(rel, **kw):
    p = os.path.join(SRC, rel)
    if not os.path.exists(p):
        hits = glob.glob(os.path.join(SRC, '**', os.path.basename(rel)), recursive=True)
        if not hits:
            raise FileNotFoundError(rel)
        p = hits[0]
    return trim(load(p, stereo=kw.get('stereo', False)), kw.get('thresh', 0.01))


rng = np.random.default_rng(1234)


# ---------------------------------------------------------------- synthesized building blocks
def whoosh_syn(d=0.45, f0=300, fpk=2500, f1=600, peak=0.6, q=1.4, seed=0, pan=(-0.6, 0.6)):
    n = noise(d, seed, 'pink')
    t = t_(d) / d
    fc = np.where(t < peak, f0 * (fpk / f0) ** (t / peak), fpk * (f1 / fpk) ** ((t - peak) / (1 - peak)))
    y = svf(n, fc, q, 'bp') * 0.8 + svf(n, fc * 2.2, q * 0.8, 'bp') * 0.3
    e = np.where(t < peak, (t / peak) ** 2.2, ((1 - t) / (1 - peak)) ** 1.6)
    y = y * e
    a = (np.linspace(pan[0], pan[1], len(y)) + 1) * np.pi / 4
    return np.stack([y * np.cos(a), y * np.sin(a)], 1) * np.sqrt(2)


def ping(f, d=0.5, tau=0.15, harm=(1, 0.25, 0.08)):
    t = t_(d)
    y = sum(a * np.sin(2 * np.pi * f * (i + 1) * t) for i, a in enumerate(harm))
    return y * env_exp(d, tau, 0.002)


def mallet(f, d=0.6, tau=0.18):
    """marimba-ish note"""
    t = t_(d)
    y = np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * 4 * t) * np.exp(-t / 0.03) + 0.2 * np.sin(2 * np.pi * f * 10 * t) * np.exp(-t / 0.008)
    return y * env_exp(d, tau, 0.001)


def sparkle_syn(d=0.9, n=14, lo=2500, hi=7000, seed=3, rise=False):
    r = np.random.default_rng(seed)
    out = silence(d + 0.6, True)
    for i in range(n):
        o = (i / n) * d * 0.85 + r.uniform(0, 0.05)
        f = r.uniform(lo, hi) if not rise else lo * (hi / lo) ** (i / n) * r.uniform(0.95, 1.05)
        p = ping(f, 0.5, r.uniform(0.06, 0.18), (1, 0.15)) * r.uniform(0.4, 1.0)
        b = st(p, r.uniform(-0.8, 0.8))
        k = int(o * SR)
        out[k:k + len(b)] += b[:len(out) - k]
    return reverb(out, 1.0, 0.35, 0.9)


def slide_whistle(f0, f1, d, vib=6.0, depth=0.012):
    t = t_(d)
    f = glide(f0, f1, d) * (1 + depth * np.sin(2 * np.pi * vib * t))
    y = sine(f, d) + 0.12 * sine(f * 2, d) + 0.04 * bp(noise(d, 5), 800, 4000)
    return y * env_pts(d, [(0, 0), (0.03, 1), (d - 0.06, 0.9), (d, 0)])


def thump(f0=110, f1=45, d=0.35, tau=0.09):
    return sine(glide(f0, f1, d), d) * env_exp(d, tau, 0.001)


def clicky(d=0.012, f=3000, seed=0):
    return bp(noise(d, seed), f * 0.6, min(f * 1.6, 20000)) * env_exp(d, d / 3, 0.0005)


def chirp_bird(seed):
    r = np.random.default_rng(seed)
    out = []
    for k in range(r.integers(2, 6)):
        d = r.uniform(0.04, 0.12)
        f0, f1 = r.uniform(2500, 5000), r.uniform(2500, 6500)
        t = t_(d)
        f = glide(f0, f1, d) * (1 + 0.05 * np.sin(2 * np.pi * r.uniform(20, 60) * t))
        out.append(sine(f, d) * np.sin(np.pi * t / d) ** 2)
        out.append(silence(r.uniform(0.02, 0.08)))
    return np.concatenate(out)


def gm(events, bpm, programs, gain=0.7, tail=1.5, bends=None):
    mid = notes_midi(events, bpm, programs, bends=bends)
    x = render_midi(mid, gain)
    return trim(x, 0.002, 0.0, tail)


def place(*items, d=None):
    return mix(*items)


# ---------------------------------------------------------------- builders: name -> list of buffers
B = {}


def sfx(name):
    def deco(fn):
        B[name] = fn
        return fn
    return deco


@sfx('whoosh')
def _():
    return [whoosh_syn(0.42, 280, 2600, 700, 0.62, 1.5, s, (-0.7, 0.7) if s % 2 else (0.7, -0.7)) for s in range(4)]


@sfx('whoosh_long')
def _():
    return [whoosh_syn(0.95, 180, 1900, 380, 0.55, 1.2, 10 + s, (-0.8, 0.8)) for s in range(2)]


@sfx('whoosh_up')
def _():
    return [whoosh_syn(0.6, 300, 4500, 3500, 0.82, 1.6, 20 + s, (0, 0)) for s in range(2)]


@sfx('whoosh_down')
def _():
    return [whoosh_syn(0.6, 4200, 4500, 260, 0.12, 1.5, 30 + s, (0, 0)) for s in range(2)]


@sfx('swish')
def _():
    return [hp(src(f'swishes/swishes/swish-{i}.wav'), 300) for i in (3, 5, 7, 9)]


@sfx('pixel_wipe')
def _():
    d = 0.62
    out = []
    steps = 14
    for i in range(steps):
        f = 220 * 2 ** (i * 2 / 12 * 1.4)
        out.append(square(f, d / steps) * 0.35 * (0.6 + 0.4 * i / steps))
    y = crush(np.concatenate(out), 5, 3)
    y = y + whoosh_syn(len(y) / SR, 400, 5000, 3000, 0.85, 1.5, 41, (-0.8, 0.8)).mean(1) * 0.7
    return [lp(fade(y, 0.005, 0.08), 9000)]


@sfx('zoom_in')
def _():
    d = 0.3
    y = sine(glide(180, 1400, 0.12), 0.12) * env_pts(0.12, [(0, 0), (0.01, 1), (0.12, 0.6)])
    w = whoosh_syn(0.3, 500, 3500, 2500, 0.4, 1.5, 51, (0, 0))
    return [mix(st(y * 0.6), w)]


def riser(d, seed):
    t = t_(d) / d
    n = noise(d, seed, 'white')
    fc = 250 * (7000 / 250) ** (t ** 1.4)
    y = svf(n, fc, 3, 'bp') * 0.9
    tone = saw(glide(110, 440, d) * (1 + 0.004 * np.sin(2 * np.pi * 5 * t_(d))), d) + saw(glide(110, 440, d) * 1.007, d)
    tone = lp(tone, 3000) * 0.18
    trem = 1 - 0.35 * (0.5 + 0.5 * np.sin(2 * np.pi * (4 + 14 * t ** 2) * t_(d)))
    y = (y + tone) * (t ** 2.2) * trem
    return reverb(fade(y, 0.01, 0.02), 1.0, 0.25)[:int(d * SR) + int(0.25 * SR)]


@sfx('riser')
def _():
    return [riser(2.0, 61)]


@sfx('riser_long')
def _():
    return [riser(4.0, 62)]


@sfx('reverse_swell')
def _():
    d = 1.5
    n = hp(noise(d, 71), 3000) * env_exp(d, 0.45, 0.001)
    sw = n[::-1] * 0.9
    return [reverb(sw, 0.8, 0.2, 0.9)[:int(d * SR) + 2400]]


@sfx('impact')
def _():
    d = 2.2
    sub = sine(glide(70, 32, d), d) * env_exp(d, 0.55, 0.002)
    body = lp(noise(0.4, 81, 'brown'), 400) * env_exp(0.4, 0.08)
    crack = hp(noise(0.12, 82), 2500) * env_exp(0.12, 0.025)
    y = mix((drive(sub, 1.6), 0, 1.0), (body, 0, 0.9), (crack, 0, 0.35))
    return [reverb(y, 2.2, 0.35, 0.4)]


@sfx('boom')
def _():
    d = 1.6
    f = glide(130, 42, 0.25)
    f = np.concatenate([f, np.full(int(d * SR) - len(f), 42.0)])
    y = drive(np.sin(phase(f, d)) * env_exp(d, 0.42, 0.003), 2.5)
    y = y + 0.25 * lp(noise(0.15, 91, 'brown'), 300) * env_exp(0.15, 0.04)[:] if False else y
    return [reverb(y, 1.6, 0.3, 0.3)]


@sfx('sub_drop')
def _():
    d = 1.6
    y = sine(glide(90, 28, d), d) * env_pts(d, [(0, 0), (0.01, 1), (1.0, 0.6), (d, 0)])
    return [drive(y, 1.3)]


@sfx('rewind')
def _():
    # a little piano phrase played backwards at accelerating chipmunk speed + whirr
    ev = [(i * 0.25, 0.3, n, 100, 0) for i, n in enumerate([72, 76, 79, 84, 79, 76, 72, 67, 72, 76, 79, 84, 88, 84, 79, 76])]
    x = mono(gm(ev, 120, {0: 0}, tail=0.2))
    x = x[::-1]
    d = 1.25
    rate = np.linspace(2.0, 6.0, int(d * SR)) * (1 + 0.15 * np.sin(2 * np.pi * 11 * t_(d)))
    y = varispeed(np.tile(x, 4), rate)
    wh = lp(saw(glide(300, 900, d) * (1 + 0.03 * np.sin(2 * np.pi * 18 * t_(d))), d), 2500) * 0.08
    y = (y + wh) * env_pts(d, [(0, 0), (0.05, 1), (d - 0.1, 1), (d, 0)])
    return [st(hp(y, 200))]


@sfx('record_scratch')
def _():
    ev = [(0, 2.0, n, 105, 0) for n in (60, 64, 67, 72)] + [(0, 2.0, n, 90, 1) for n in (48, 55)]
    x = mono(gm(ev, 120, {0: 0, 1: 48}, tail=0.1))
    d = 0.62
    t = t_(d)
    # hand motion: back-forth strokes then a fast pull back
    rate = np.interp(t, [0, 0.05, 0.12, 0.2, 0.26, 0.34, 0.42, 0.5, 0.62], [1, 3.5, -3.8, 3.2, -4.0, 4.5, -2.0, -6.0, 0])
    y = varispeed(np.concatenate([np.zeros(SR), x]), rate + 0) if False else varispeed(x, rate)
    y = y + 0.08 * hp(noise(d, 101), 3000) * np.abs(rate) / 6
    return [st(drive(hp(y, 150), 1.4))]


def glitch_syn(d, seed):
    r = np.random.default_rng(seed)
    out = []
    while sum(len(o) for o in out) < d * SR:
        kind = r.integers(0, 4)
        seg = r.uniform(0.015, 0.07)
        if kind == 0:
            b = square(r.choice([220, 440, 880, 1760, 3520]) * r.uniform(0.9, 1.1), seg)
        elif kind == 1:
            b = crush(noise(seg, int(r.integers(1e6))), 3, 6)
        elif kind == 2:
            b = saw(r.uniform(60, 400), seg) * 0.8
        else:
            b = np.zeros(int(seg * SR))
        rep = r.integers(1, 4)
        out.extend([b * r.uniform(0.3, 1.0)] * rep)
    y = np.concatenate(out)[:int(d * SR)]
    return st(crush(y, 6, 2) * 0.7, r.uniform(-0.4, 0.4))


@sfx('glitch')
def _():
    return [glitch_syn(0.5, s) for s in (111, 112, 113)]


@sfx('glitch_long')
def _():
    return [glitch_syn(1.5, 121)]


@sfx('static')
def _():
    d = 1.0
    n = bp(noise(d, 131), 400, 9000)
    crackle = (np.random.default_rng(132).random(int(d * SR)) > 0.9985) * 3.0
    y = (n * 0.5 + bp(crackle, 1000, 8000)) * env_pts(d, [(0, 0), (0.02, 1), (0.8, 0.9), (d, 0)])
    return [st(y)]


@sfx('tv_on')
def _():
    d = 0.5
    y = mix((thump(90, 50, 0.25, 0.06), 0, 0.8), (sine(15000, 0.3) * env_exp(0.3, 0.1) * 0.15, 0.02, 1), (bp(noise(0.3, 141), 500, 8000) * env_exp(0.3, 0.1) * 0.5, 0.03, 1))
    return [st(y)]


@sfx('tv_off')
def _():
    d = 0.45
    y = sine(glide(2400, 80, d), d) * env_pts(d, [(0, 1), (d, 0)]) * 0.6
    return [st(mix((y, 0, 1), (clicky(0.01, 2000), 0, 0.6)))]


@sfx('camera_flash')
def _():
    sh = src('kenney_interfaceSounds/Audio/click_002.ogg')
    whine = sine(glide(2000, 9000, 0.5), 0.5) * env_pts(0.5, [(0, 0), (0.4, 0.15), (0.5, 0)])
    return [mix((sh, 0, 1), (hp(noise(0.08, 151), 3000) * env_exp(0.08, 0.02), 0.03, 0.6), (whine, 0.05, 1))]


@sfx('click')
def _():
    return [src('kenney_interfaceSounds/Audio/click_001.ogg'), src('kenney_interfaceSounds/Audio/click_003.ogg'), src('UI_SFX_Set/click1.wav')]


@sfx('tap')
def _():
    return [speed(src('kenney_interfaceSounds/Audio/tick_002.ogg'), 1.0), src('kenney_interfaceSounds/Audio/tick_001.ogg')]


@sfx('toggle')
def _():
    return [src('kenney_interfaceSounds/Audio/switch_002.ogg'), src('kenney_interfaceSounds/Audio/toggle_001.ogg')]


@sfx('ui_pop')
def _():
    out = []
    for i, p in enumerate(['3pops/3pops/pop1.ogg', '3pops/3pops/pop3.ogg']):
        blip = sine(glide(700, 1500, 0.07), 0.07) * env_pts(0.07, [(0, 0), (0.005, 1), (0.07, 0)])
        out.append(mix((src(p), 0, 1.0), (blip * 0.35, 0.01, 1)))
    return out


@sfx('ui_close')
def _():
    blip = sine(glide(1300, 600, 0.08), 0.08) * env_pts(0.08, [(0, 0), (0.005, 1), (0.08, 0)])
    return [mix((src('kenney_interfaceSounds/Audio/minimize_003.ogg'), 0, 0.8), (blip * 0.4, 0, 1))]


@sfx('notify')
def _():
    return [mix((mallet(1318.5, 0.5, 0.12), 0, 0.8), (mallet(1760, 0.8, 0.2), 0.11, 0.9))]


@sfx('confirm')
def _():
    return [src('kenney_interfaceSounds/Audio/confirmation_002.ogg'), src('kenney_interfaceSounds/Audio/confirmation_004.ogg')]


@sfx('error')
def _():
    return [src('kenney_interfaceSounds/Audio/error_006.ogg'), src('kenney_interfaceSounds/Audio/error_005.ogg')]


@sfx('buzzer_wrong')
def _():
    d = 0.75
    y = (square(110, d) + square(116.5, d) + 0.5 * saw(55, d)) * env_pts(d, [(0, 0), (0.01, 1), (d - 0.08, 0.9), (d, 0)])
    return [st(lp(drive(y * 0.5, 2), 3500))]


@sfx('typing')
def _():
    srcs = [src(f'UI_SFX_Set/click{i}.wav') for i in range(1, 6)] + [src(f'kenney_interfaceSounds/Audio/click_00{i}.ogg') for i in (1, 2, 4, 5)]
    out = []
    for v in range(2):
        r = np.random.default_rng(160 + v)
        t, items = 0.0, []
        while t < 1.0:
            c = srcs[r.integers(len(srcs))]
            items.append((speed(c, r.uniform(0.9, 1.25)), t, r.uniform(0.4, 0.9)))
            t += r.uniform(0.055, 0.13)
        out.append(st(mix(*items) * 0.9))
    return out


@sfx('chat_pop')
def _():
    d = 0.18
    y = sine(glide(380, 1100, d), d) * env_pts(d, [(0, 0), (0.01, 1), (0.1, 0.7), (d, 0)])
    return [mix((y * 0.5, 0, 1), (src('3pops/3pops/pop3.ogg'), 0.0, 0.8))]


@sfx('coin')
def _():
    a = square(987.8, 0.07) * 0.25
    b = square(1318.5, 0.42) * env_exp(0.42, 0.12) * 0.25
    retro = lp(np.concatenate([a, b]), 7000)
    return [mix((retro, 0, 0.8), (src('80-CC0-RPG-SFX_0/item_coins_01.ogg'), 0, 0.5))]


@sfx('coins')
def _():
    return [src('80-CC0-RPG-SFX_0/item_coins_02.ogg'), src('80-CC0-RPG-SFX_0/item_coins_03.ogg'), src('RPGsounds_Kenney/OGG/handleCoins.ogg')]


@sfx('ka_ching')
def _():
    chunk = src('sfx_100_v2/sfx100v2_wood_hit_01.ogg')
    bell = src('100-CC0-SFX_0/bell_02.ogg')
    coins = src('80-CC0-RPG-SFX_0/item_coins_03.ogg')
    ding = mallet(2093, 1.0, 0.35) + 0.5 * mallet(2637, 1.0, 0.3)
    return [mix((chunk, 0, 0.6), (bell, 0.04, 0.8), (ding * 0.5, 0.05, 1), (coins, 0.12, 0.9))]


@sfx('money_counter')
def _():
    d, rate = 1.0, 18
    items = []
    for i in range(int(d * rate)):
        f = 1600 + 600 * (i / (d * rate))
        items.append((square(f, 0.025) * env_exp(0.025, 0.008) * 0.3, i / rate, 1))
        items.append((clicky(0.006, 5000, i), i / rate, 0.3))
    return [st(lp(mix(*items), 8000))]


@sfx('robux')
def _():
    d = 0.7
    t = t_(d)
    y = (ping(1318.5, d, 0.25) + ping(1975.5, d, 0.25)) * (1 + 0.25 * np.sin(2 * np.pi * 14 * t))
    y2 = np.concatenate([np.zeros(int(0.07 * SR)), (ping(2637, d, 0.2))])[:len(y)]
    return [reverb(st(y * 0.5 + y2 * 0.4), 0.8, 0.3, 0.9)]


@sfx('level_up')
def _():
    notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]
    items = [(tri(f, 0.12) * env_exp(0.12, 0.06) * 0.6 + square(f, 0.12) * env_exp(0.12, 0.04) * 0.15, i * 0.07, 1) for i, f in enumerate(notes)]
    items.append((tri(1568, 0.6) * env_exp(0.6, 0.25) * 0.6, len(notes) * 0.07, 1))
    return [reverb(mix(*items, (sparkle_syn(0.6, 8, 3000, 8000, 171), 0.3, 0.4)), 0.9, 0.25, 0.8)]


@sfx('achievement')
def _():
    ev = [(0, 0.16, 67, 110, 0), (0.17, 0.16, 72, 110, 0), (0.34, 0.16, 76, 110, 0), (0.5, 1.4, 79, 120, 0),
          (0.5, 1.4, 72, 100, 1), (0.5, 1.4, 76, 100, 1), (0.5, 1.2, 84, 90, 2)]
    return [gm(ev, 120, {0: 56, 1: 61, 2: 9}, 0.8, 1.2)]


@sfx('equip')
def _():
    return [mix((src('RPGsounds_Kenney/OGG/metalClick.ogg'), 0, 0.8), (sparkle_syn(0.35, 6, 3500, 7500, 181, True), 0.03, 0.5))]


@sfx('upgrade')
def _():
    d = 0.8
    f = glide(300, 1500, d)
    y = (square(f, d) * 0.2 + tri(f * 2, d) * 0.3) * (1 + 0.5 * np.sin(2 * np.pi * 20 * t_(d))) * env_pts(d, [(0, 0), (0.02, 1), (d - 0.1, 0.8), (d, 0)])
    return [reverb(st(lp(y, 6000)), 0.6, 0.2)]


@sfx('powerdown')
def _():
    d = 0.85
    y = saw(glide(900, 70, d), d) * env_pts(d, [(0, 1), (d, 0)])
    return [st(lp(y, glide(5000, 300, d).mean()) * 0.6)]


@sfx('beep')
def _():
    d = 0.13
    y = (sine(1000, d) + 0.2 * square(1000, d)) * env_pts(d, [(0, 0), (0.004, 1), (d - 0.01, 1), (d, 0)])
    return [st(y * 0.6)]


@sfx('alarm_beep')
def _():
    items = []
    for g in range(2):
        for i in range(4):
            items.append((square(2050, 0.06) * 0.35, g * 0.5 + i * 0.1, 1))
    return [st(lp(mix(*items), 7000))]


@sfx('countdown_tick')
def _():
    wood = mix(sine(glide(1900, 1500, 0.05), 0.05) * env_exp(0.05, 0.012), (clicky(0.01, 4000, 3), 0, 0.5))
    return [st(wood), st(speed(wood, 0.85))]


@sfx('countdown_final')
def _():
    d = 1.1
    y = (saw(440, d) + saw(554.4, d) + saw(659.3, d) * 0.7) * env_pts(d, [(0, 0), (0.02, 1), (d - 0.2, 0.9), (d, 0)])
    return [reverb(st(lp(y * 0.25, 3500)), 0.8, 0.2)]


@sfx('loading')
def _():
    items = [(ping(f, 0.12, 0.05, (1, 0.1)) * 0.5, i * 0.16, 1) for i, f in enumerate([880, 1108.7, 1318.5, 880, 1108.7, 1318.5])]
    return [st(mix(*items))]


@sfx('teleport')
def _():
    d = 0.8
    f = glide(400, 2400, d)
    y = sine(f * (1 + 0.05 * np.sin(2 * np.pi * 30 * t_(d))), d) * env_pts(d, [(0, 0), (0.05, 1), (d, 0)]) * 0.35
    return [mix(st(y), (sparkle_syn(0.6, 10, 2500, 8000, 191, True), 0.15, 0.6), (whoosh_syn(0.5, 400, 4000, 3000, 0.7, 1.5, 192), 0, 0.5))]


@sfx('respawn')
def _():
    items = [(tri(f, 0.1) * env_exp(0.1, 0.05) * 0.6, i * 0.05, 1) for i, f in enumerate([392, 523.25, 659.25, 783.99, 1046.5])]
    return [reverb(st(mix(*items)), 0.6, 0.2)]


@sfx('jump_game')
def _():
    d = 0.16
    y = square(glide(330, 760, d), d, 0.25) * env_pts(d, [(0, 0), (0.005, 1), (d, 0)]) * 0.3
    return [st(lp(y, 5000))]


@sfx('step')
def _():
    return [src(f'Fantozzi-footsteps/Fantozzi-footsteps/ogg/Fantozzi-Stone{s}{i}.ogg') for s in 'LR' for i in (1, 2, 3)]


@sfx('step_soft')
def _():
    return [src(f'Fantozzi-footsteps/Fantozzi-footsteps/ogg/Fantozzi-Sand{s}{i}.ogg') for s in 'LR' for i in (1, 2, 3)]


@sfx('step_wood')
def _():
    return [src(f'RPGsounds_Kenney/OGG/footstep0{i}.ogg') for i in range(8)]


@sfx('jump')
def _():
    cl = src('RPGsounds_Kenney/OGG/cloth2.ogg')
    return [mix((cl, 0, 0.8), (whoosh_syn(0.3, 400, 2600, 2000, 0.6, 1.5, 201), 0, 0.6))]


@sfx('land')
def _():
    return [mix((src('RPGsounds_Kenney/OGG/footstep03.ogg'), 0, 0.9), (thump(120, 50, 0.25, 0.06), 0, 0.7), (src('RPGsounds_Kenney/OGG/cloth1.ogg'), 0.01, 0.4))]


@sfx('thud')
def _():
    return [mix((src('sfx_100_v2/sfx100v2_hit_01.ogg'), 0, 0.8), (thump(100, 40, 0.4, 0.1), 0, 0.9)),
            mix((src('100-CC0-SFX_0/hit_03.ogg'), 0, 0.8), (thump(90, 38, 0.4, 0.1), 0, 0.9))]


@sfx('bonk')
def _():
    d = 0.35
    tone = (sine(glide(720, 520, d), d) + 0.4 * sine(glide(1900, 1400, d), d)) * env_exp(d, 0.07, 0.001)
    return [mix((src('sfx_100_v2/sfx100v2_wood_hit_01.ogg'), 0, 0.7), (tone * 0.6, 0, 1)),
            mix((src('sfx_100_v2/sfx100v2_wood_hit_02.ogg'), 0, 0.7), (speed(tone, 1.15) * 0.6, 0, 1))]


@sfx('punch')
def _():
    return [mix((src(f'independent_nu_ljudbank-hits_and_punches/hits/hit{i:02d}.mp3.flac'), 0, 1), (thump(140, 60, 0.15, 0.04), 0, 0.5)) for i in (7, 9, 19)]


@sfx('slap')
def _():
    d = 0.25
    y = hp(noise(d, 211), 1500) * env_exp(d, 0.018, 0.0005)
    return [reverb(st(y), 0.4, 0.2, 0.9)]


@sfx('body_fall')
def _():
    t1 = mix((src('sfx_100_v2/sfx100v2_hit_01.ogg'), 0, 0.9), (thump(110, 40, 0.4, 0.1), 0, 1.0))
    return [mix((t1, 0, 1), (speed(t1, 1.2), 0.27, 0.45), (src('RPGsounds_Kenney/OGG/cloth3.ogg'), 0.02, 0.6))]


@sfx('cloth')
def _():
    return [src(f'RPGsounds_Kenney/OGG/cloth{i}.ogg') for i in (1, 2, 3, 4)]


@sfx('slip')
def _():
    return [mix((src('sound_effects/sound_effects/squeak2.wav'), 0, 0.7), (slide_whistle(500, 1800, 0.35), 0.03, 0.45), (whoosh_syn(0.35, 500, 3500, 2500, 0.6, 1.5, 221), 0.05, 0.6))]


@sfx('squeak')
def _():
    return [src('sound_effects/sound_effects/squeak2.wav'), src('sound_effects/sound_effects/squeak.wav')]


@sfx('skid')
def _():
    d = 0.5
    t = t_(d)
    sq = sine(1700 * (1 + 0.04 * np.sin(2 * np.pi * 37 * t)), d) * 0.3
    n = bp(noise(d, 231), 1800, 4500) * 0.6
    return [st((sq + n) * env_pts(d, [(0, 0), (0.02, 1), (0.35, 0.7), (d, 0)]))]


@sfx('boing')
def _():
    a = src('loose/boing.ogg')
    a = fade(a[:int(1.1 * SR)], 0.001, 0.25)
    d = 0.9
    t = t_(d)
    f = 180 * (1 + 0.6 * np.sin(2 * np.pi * 9 * t) * np.exp(-t * 3.5)) * glide(1.0, 1.4, d)
    syn = (sine(f, d) + 0.3 * tri(f * 2, d)) * env_exp(d, 0.3, 0.003)
    return [a, st(syn * 0.6)]


@sfx('slide_up')
def _():
    return [st(slide_whistle(420, 1700, 0.6))]


@sfx('slide_down')
def _():
    return [st(slide_whistle(1700, 380, 0.6))]


@sfx('fall_whistle')
def _():
    return [reverb(st(slide_whistle(2300, 300, 1.6, 5.0, 0.008) * 0.8), 0.8, 0.15)]


@sfx('gulp')
def _():
    d1, d2 = 0.09, 0.16
    a = sine(glide(420, 180, d1), d1) * env_pts(d1, [(0, 0), (0.01, 1), (d1, 0.3)])
    b = (sine(glide(160, 90, d2), d2) + 0.3 * sine(glide(480, 260, d2), d2)) * env_pts(d2, [(0, 0), (0.015, 1), (d2, 0)])
    return [st(lp(np.concatenate([a, b]), 2500) * 0.8)]


@sfx('blink')
def _():
    d = 0.05
    return [st(sine(glide(2600, 3400, d), d) * env_exp(d, 0.012) * 0.4)]


@sfx('pop')
def _():
    return [src('3pops/3pops/pop1.ogg'), src('3pops/3pops/pop3.ogg'), src('loose/bung_01.mp3')]


@sfx('poof')
def _():
    d = 0.5
    y = lp(noise(d, 241, 'pink'), 1800) * env_exp(d, 0.12, 0.004)
    return [mix(reverb(y, 0.7, 0.3), (src('3pops/3pops/pop1.ogg'), 0, 0.5))]


@sfx('splat')
def _():
    return [mix((src('water-splash-slime-sfx/slime_05.ogg'), 0, 1), (thump(130, 60, 0.2, 0.05), 0, 0.6)),
            mix((src('water-splash-slime-sfx/slime_10.ogg'), 0, 1), (thump(120, 55, 0.2, 0.05), 0, 0.6))]


@sfx('splash')
def _():
    return [src('water-splash-slime-sfx/splash_03.ogg'), src('water-splash-slime-sfx/splash_05.ogg')]


@sfx('big_splash')
def _():
    return [mix((src('water-splash-slime-sfx/splash_10.ogg'), 0, 1), (src('water-splash-slime-sfx/splash_12.ogg'), 0.08, 0.7), (thump(90, 40, 0.5, 0.15), 0, 0.8))]


@sfx('bubbles')
def _():
    return [fade(src('water-splash-slime-sfx/loop_bubbles_1.ogg', stereo=True)[:int(1.6 * SR)], 0.05, 0.4)]


@sfx('sizzle')
def _():
    d = 2.2
    n = hp(noise(d, 251), 2500) * 0.25
    r = np.random.default_rng(252)
    cr = (r.random(int(d * SR)) > 0.997) * r.uniform(0.3, 1.0, int(d * SR))
    cr = bp(cr, 2000, 9000) * 2
    y = (n * (0.7 + 0.3 * np.sin(2 * np.pi * 0.8 * t_(d))) + cr) * env_pts(d, [(0, 0), (0.15, 1), (d - 0.4, 1), (d, 0)])
    return [widen(y, 0.6)]


@sfx('pan_clang')
def _():
    return [src('100-CC0-SFX_0/pot_01.ogg'), src('sfx_100_v2/sfx100v2_metal_hit_01.ogg')]


@sfx('dishes')
def _():
    return [src('100-CC0-SFX_0/dishes_01.ogg'), src('100-CC0-SFX_0/dishes_02.ogg')]


@sfx('door_open')
def _():
    return [src('RPGsounds_Kenney/OGG/doorOpen_1.ogg'), src('RPGsounds_Kenney/OGG/doorOpen_2.ogg')]


@sfx('door_close')
def _():
    return [src('RPGsounds_Kenney/OGG/doorClose_1.ogg'), src('RPGsounds_Kenney/OGG/doorClose_2.ogg')]


@sfx('door_knock')
def _():
    k = src('sfx_100_v2/sfx100v2_wood_hit_02.ogg')
    return [mix((k, 0, 1), (speed(k, 1.05), 0.18, 0.9), (k, 0.36, 1))]


@sfx('toilet_flush')
def _():
    return [src('100-CC0-SFX_0/toilet_01.ogg')]


@sfx('paper')
def _():
    return [src('100-CC0-SFX_0/paper_01.ogg'), src('100-CC0-SFX_0/paper_02.ogg')]


@sfx('snore')
def _():
    d1, d2 = 0.9, 0.7
    inh = lp(noise(d1, 261, 'pink'), 700) * env_pts(d1, [(0, 0), (0.6, 1), (d1, 0)]) * (1 + 0.6 * square(38, d1))
    exh = bp(noise(d2, 262), 900, 3500) * 0.3 * env_pts(d2, [(0, 0), (0.1, 1), (d2, 0)]) + sine(glide(900, 600, d2), d2) * 0.08 * env_pts(d2, [(0, 0), (0.1, 1), (d2, 0)])
    return [st(np.concatenate([inh * 0.8, exh]))]


@sfx('heartbeat')
def _():
    b = thump(70, 40, 0.18, 0.05)
    return [st(lp(mix((b, 0, 1), (b * 0.7, 0.24, 1)), 400))]


@sfx('heart_pop')
def _():
    items = [(src('3pops/3pops/pop3.ogg'), 0, 0.7)]
    items += [(mallet(f, 0.5, 0.15) * 0.4, 0.04 + i * 0.07, 1) for i, f in enumerate([1046.5, 1318.5, 1568])]
    return [reverb(mix(*items), 0.8, 0.25)]


@sfx('blush')
def _():
    d = 0.55
    f = glide(320, 720, d) * (1 + 0.02 * np.sin(2 * np.pi * 7 * t_(d)))
    y = (sine(f, d) + 0.2 * sine(f * 2, d)) * env_pts(d, [(0, 0), (0.05, 1), (0.4, 0.8), (d, 0)]) * 0.5
    return [mix(reverb(st(y), 0.7, 0.2), (sparkle_syn(0.4, 5, 3000, 6000, 271), 0.2, 0.25))]


@sfx('sparkle')
def _():
    return [sparkle_syn(0.8, 14, 2500, 7500, 281), sparkle_syn(0.8, 12, 3000, 8000, 282)]


@sfx('shine')
def _():
    d = 0.9
    y = (ping(3520, d, 0.25, (1,)) + 0.5 * ping(5274, d, 0.18, (1,))) * (1 + 0.3 * np.sin(2 * np.pi * 9 * t_(d)))
    return [reverb(st(y * 0.5), 0.9, 0.3, 0.9)]


@sfx('magic')
def _():
    d = 1.5
    pad = sum(sine(f * (1 + 0.003 * np.sin(2 * np.pi * 4 * t_(d) + i)), d) for i, f in enumerate([523.25, 659.25, 783.99, 1046.5])) * env_pts(d, [(0, 0), (0.4, 0.25), (d, 0)])
    return [mix(reverb(st(pad * 0.3), 1.2, 0.3), (sparkle_syn(1.2, 20, 1500, 8000, 291, True), 0, 0.8))]


@sfx('chime')
def _():
    return [gm([(0, 1.5, 84, 100, 0)], 120, {0: 14}, 0.8, 1.2), gm([(0, 1.5, 88, 100, 0)], 120, {0: 8}, 0.8, 1.2)]


@sfx('bell')
def _():
    return [src('100-CC0-SFX_0/bell_03.ogg'), src('100-CC0-SFX_0/bell_01.ogg')]


@sfx('gong')
def _():
    return [src('100-CC0-SFX_0/gong_01.ogg')]


@sfx('angel')
def _():
    ev = [(0, 5, n, 90, 0) for n in (60, 64, 67, 72, 76)] + [(0, 5, n, 70, 1) for n in (72, 79, 84)]
    x = gm(ev, 120, {0: 52, 1: 91}, 0.8, 1.5)
    x = x[:int(3.2 * SR)]
    x = x * env_pts(len(x) / SR, [(0, 0), (0.6, 1), (2.2, 0.9), (len(x) / SR, 0)])[:, None]
    return [reverb(x, 2.0, 0.3)]


@sfx('tada')
def _():
    ev = [(0, 0.2, n, 115, 0) for n in (60, 64, 67)] + [(0.25, 1.8, n, 125, 0) for n in (60, 64, 67, 72)] + [(0.25, 1.6, 84, 100, 1)] + \
         [(0.25, 0.4, 47, 120, 9), (0.25, 1.0, 49, 110, 9), (0, 0.2, 45, 100, 9)]
    return [gm(ev, 120, {0: 61, 1: 56}, 0.8, 1.2)]


@sfx('sad_trombone')
def _():
    ev = [(0, 0.55, 58, 100, 0), (0.6, 0.55, 57, 100, 0), (1.2, 0.55, 56, 100, 0), (1.8, 2.2, 55, 105, 0)]
    bends = [(1.8 + i * 0.06, 0, int(600 * np.sin(i * 0.9))) for i in range(36)] + [(4.1, 0, 0)]
    return [gm(ev, 120, {0: 57}, 0.9, 0.8, bends)]


@sfx('dramatic')
def _():
    ev = []
    for s, root, d in [(0, 43, 0.3), (0.45, 43, 0.3), (1.0, 40, 2.0)]:
        ev += [(s, d, root, 120, 0), (s, d, root + 12, 115, 0), (s, d, root + 3 + 12, 105, 1), (s, d, root + 12, 110, 1), (s, d, root - 12 + 12, 120, 2)]
        ev += [(s, 0.3, 41, 120, 9)]
    ev += [(1.0, 1.5, 49, 110, 9)]
    return [gm(ev, 120, {0: 48, 1: 61, 2: 47}, 0.8, 1.5)]


@sfx('orch_hit')
def _():
    return [gm([(0, 0.6, n, 125, 0) for n in (48, 60, 64, 67)], 120, {0: 55}, 0.8, 0.8)]


@sfx('rimshot')
def _():
    return [gm([(0, 0.2, 38, 110, 9), (0.3, 0.2, 38, 110, 9), (0.55, 0.2, 36, 110, 9), (0.55, 1.2, 49, 115, 9)], 120, {}, 0.9, 1.0)]


@sfx('drumroll')
def _():
    ev = [(i * 0.0625, 0.05, 38, int(50 + 70 * (i / 64)), 9) for i in range(64)]
    ev += [(4.0, 1.5, 49, 125, 9), (4.0, 0.4, 36, 125, 9), (4.0, 1.5, 57, 110, 9)]
    return [gm(ev, 120, {}, 0.9, 1.5)]


@sfx('cymbal')
def _():
    return [gm([(0, 2, 49, 120, 9)], 120, {}, 0.9, 1.5), gm([(0, 2, 57, 120, 9)], 120, {}, 0.9, 1.5)]


@sfx('harp_up')
def _():
    sc = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91]
    return [gm([(i * 0.07, 1.4, n, 90 + i, 0) for i, n in enumerate(sc)], 120, {0: 46}, 0.9, 1.0)]


@sfx('harp_down')
def _():
    sc = [60, 62, 64, 67, 69, 72, 74, 76, 79, 81, 84, 86, 88, 91][::-1]
    return [gm([(i * 0.07, 1.4, n, 100 - i, 0) for i, n in enumerate(sc)], 120, {0: 46}, 0.9, 1.0)]


@sfx('music_box')
def _():
    mel = [84, 88, 91, 96, 91, 88, 93, 91]
    return [gm([(i * 0.18, 0.8, n, 90, 0) for i, n in enumerate(mel)], 120, {0: 10}, 0.8, 1.2)]


@sfx('cricket')
def _():
    items = []
    for g in range(3):
        for p in range(3):
            items.append((sine(4400, 0.025) * np.sin(np.pi * t_(0.025) / 0.025), g * 0.33 + p * 0.04, 0.4))
    return [reverb(st(mix(*items)), 0.6, 0.25)]


@sfx('crowd_cheer')
def _():
    ap = load(os.path.join(SRC, 'loose/applause-clapping-church-crowd-immersive.wav'))
    cr = load(os.path.join(SRC, 'loose/crowd_shouting.ogg'))
    a = ap[int(6 * SR):int(9.5 * SR)]
    c = hp(cr[int(3 * SR):int(6.5 * SR)], 250)
    y = mix((a, 0, 0.8), (c, 0, 1.0))
    return [fade(y * env_pts(len(y) / SR, [(0, 0.3), (0.2, 1), (2.6, 0.8), (len(y) / SR, 0)])[:, None], 0.01, 0.3)]


@sfx('applause')
def _():
    ap = load(os.path.join(SRC, 'loose/applause-clapping-church-crowd-immersive.wav'))
    y = ap[int(12 * SR):int(15.5 * SR)]
    return [fade(y, 0.2, 0.8)]


@sfx('laser_zap')
def _():
    out = []
    for i, f in enumerate(['sci-fi_sounds/Audio/laserSmall_000.ogg', 'sci-fi_sounds/Audio/laserSmall_002.ogg']):
        cr = bp(noise(0.25, 300 + i), 2000, 9000) * env_exp(0.25, 0.06) * (np.random.default_rng(i).random(int(0.25 * SR)) > 0.6)
        out.append(mix((src(f), 0, 1), (cr * 0.5, 0.02, 1)))
    return out


@sfx('laser_shot')
def _():
    return [src('sci-fi_sounds/Audio/laserRetro_000.ogg'), src('sci-fi_sounds/Audio/laserRetro_002.ogg')]


@sfx('laser_sweep')
def _():
    d = 1.5
    t = t_(d)
    f = 140 * (1 + 0.08 * np.sin(2 * np.pi * 1.3 * t))
    y = (saw(f, d) + saw(f * 1.01, d)) * 0.3
    y = svf(y, 900 + 700 * np.sin(2 * np.pi * 0.67 * t), 4, 'bp') * env_pts(d, [(0, 0), (0.2, 1), (d - 0.3, 1), (d, 0)])
    return [autopan(y * 1.5, 0, 0.7, -1)]


@sfx('electric')
def _():
    d = 0.6
    t = t_(d)
    gate = (square(50, d) > 0) * 1.0
    y = saw(100, d) * gate * 0.5 + bp(noise(d, 311), 1500, 7000) * (np.random.default_rng(312).random(int(d * SR)) > 0.7) * 0.6
    return [st(drive(y, 2.5) * env_pts(d, [(0, 0), (0.01, 1), (d - 0.1, 0.9), (d, 0)]) * 0.7)]


@sfx('shock')
def _():
    e = B['electric']()[0]
    z = src('sci-fi_sounds/Audio/laserSmall_001.ogg')
    return [mix((z, 0, 0.9), (e, 0.02, 1), (speed(e, 1.3), 0.4, 0.6))]


@sfx('forcefield')
def _():
    return [src('sci-fi_sounds/Audio/forceField_000.ogg'), src('sci-fi_sounds/Audio/forceField_002.ogg')]


@sfx('portal_open')
def _():
    d = 1.6
    t = t_(d)
    parts = [sine(glide(110 * k, 220 * k, d) * (1 + 0.02 * np.sin(2 * np.pi * (3 + k) * t)), d) / k for k in (1, 1.5, 2, 3)]
    y = sum(parts) * env_pts(d, [(0, 0), (0.6, 0.8), (d - 0.3, 1), (d, 0)]) * 0.35
    sw = svf(noise(d, 321, 'pink'), 600 + 500 * np.sin(2 * np.pi * 2.2 * t) + 800 * t / d, 4, 'bp') * 0.6 * env_pts(d, [(0, 0), (0.5, 1), (d, 0)])
    return [reverb(autopan(y + sw, 2.2, 0.7), 1.4, 0.35)]


@sfx('portal_enter')
def _():
    return [mix(whoosh_syn(0.6, 300, 3500, 1500, 0.5, 1.4, 331), (src('Digital_SFX_Set/phaserUp3.mp3'), 0.05, 0.5), (sparkle_syn(0.6, 10, 2500, 8000, 332, True), 0.15, 0.6))]


@sfx('vault_door')
def _():
    air = src('sfx_100_v2/sfx100v2_air_01.ogg')
    clank = src('sci-fi_sounds/Audio/impactMetal_000.ogg')
    door = src('sci-fi_sounds/Audio/doorOpen_000.ogg')
    d = 2.4
    rumble = lp(noise(d, 341, 'brown'), 150) * env_pts(d, [(0, 0), (0.3, 1), (d - 0.5, 0.8), (d, 0)]) * 0.8
    return [mix((clank, 0, 1), (rumble, 0.1, 1), (door, 0.3, 1), (air, 0.5, 0.8), (speed(clank, 0.7), 2.0, 0.8))]


@sfx('metal_clank')
def _():
    return [src('sci-fi_sounds/Audio/impactMetal_000.ogg'), src('sci-fi_sounds/Audio/impactMetal_002.ogg')]


@sfx('metal_hit')
def _():
    return [src('sfx_100_v2/sfx100v2_metal_hit_01.ogg'), src('sfx_100_v2/sfx100v2_metal_hit_02.ogg')]


@sfx('glass')
def _():
    return [src('sfx_100_v2/sfx100v2_glass_01.ogg'), src('sfx_100_v2/sfx100v2_glass_03.ogg')]


@sfx('explosion')
def _():
    return [mix((src('sci-fi_sounds/Audio/explosionCrunch_000.ogg'), 0, 1), (src('sci-fi_sounds/Audio/lowFrequency_explosion_000.ogg'), 0, 1))]


@sfx('explosion_small')
def _():
    return [src('100-CC0-SFX_0/explosion.ogg'), src('sci-fi_sounds/Audio/explosionCrunch_002.ogg')]


@sfx('jetpack')
def _():
    a = src('sci-fi_sounds/Audio/thrusterFire_000.ogg')
    return [fade(a, 0.05, 0.3)]


@sfx('engine')
def _():
    d = 1.6
    t = t_(d)
    dop = 1 + 0.12 * np.tanh((0.8 - t) * 4)
    f = 85 * dop
    y = (saw(f, d) + 0.6 * saw(f * 2.01, d) + 0.3 * square(f * 0.5, d)) * 0.3
    y = lp(y, 1200) + lp(noise(d, 351, 'pink'), 2500) * 0.3
    e = np.exp(-((t - 0.8) / 0.45) ** 2)
    return [autopan(y * e, 0, 0.8, -1)]


@sfx('car_horn')
def _():
    def honk(d):
        return lp(square(349.2, d) + square(440, d) * 0.8, 2200) * env_pts(d, [(0, 0), (0.01, 1), (d - 0.03, 1), (d, 0)]) * 0.3
    return [st(mix((honk(0.18), 0, 1), (honk(0.4), 0.25, 1)))]


@sfx('siren')
def _():
    d = 2.0
    t = t_(d)
    f = np.where((t % 1.0) < 0.5, 960.0, 770.0)
    f = lp(f, 30)
    y = lp(square(f, d) * 0.3 + sine(f, d) * 0.4, 3000)
    return [reverb(st(y * env_pts(d, [(0, 0), (0.05, 1), (d - 0.15, 1), (d, 0)])), 0.8, 0.2)]


@sfx('alarm')
def _():
    a = src('sfx_loops/alarm_01.ogg', stereo=True)
    return [fade(np.tile(a, (int(np.ceil(2.0 * SR / len(a))), 1))[:int(2.0 * SR)], 0.01, 0.15)]


def crack(seed, n=3, spread=0.12):
    r = np.random.default_rng(seed)
    items = []
    for i in range(n):
        d = r.uniform(0.006, 0.02)
        b = hp(noise(d, int(r.integers(1e6))), 1800) * env_exp(d, d / 2.5, 0.0003)
        items.append((b, i * spread / n + r.uniform(0, 0.02), r.uniform(0.6, 1.0)))
    items.append((speed(src('sfx_100_v2/sfx100v2_glass_02.ogg'), 1.4) * 0.25, 0, 1))
    return mix(*items)


@sfx('egg_crack')
def _():
    return [st(crack(361)), st(crack(362, 4, 0.18))]


@sfx('egg_hatch')
def _():
    return [mix((st(crack(371, 4, 0.2)), 0, 1), (st(crack(372, 3, 0.1)), 0.35, 1), (src('3pops/3pops/pop1.ogg'), 0.6, 1.0),
                (whoosh_syn(0.5, 400, 4000, 3000, 0.7, 1.5, 373), 0.55, 0.5), (sparkle_syn(0.8, 14, 2500, 8000, 374, True), 0.62, 0.8))]


@sfx('chomp')
def _():
    k = speed(src('sfx_100_v2/sfx100v2_wood_hit_02.ogg'), 1.6)
    wet = src('water-splash-slime-sfx/slime_02.ogg')
    return [mix((k, 0, 0.9), (wet[:int(0.15 * SR)], 0.01, 0.4), (thump(160, 70, 0.12, 0.03), 0, 0.6)),
            mix((k, 0, 0.9), (k, 0.12, 0.8), (thump(160, 70, 0.12, 0.03), 0.12, 0.6))]


@sfx('stone')
def _():
    return [src('80-CC0-RPG-SFX_0/stones_01.ogg'), src('80-CC0-RPG-SFX_0/item_stone_01.ogg'), src('80-CC0-RPG-SFX_0/stones_02.ogg')]


@sfx('rock_drop')
def _():
    return [mix((src('80-CC0-RPG-SFX_0/item_stone_02.ogg'), 0, 1), (thump(100, 45, 0.3, 0.07), 0, 0.8))]


@sfx('chicken')
def _():
    def bawk(f0, f1, d, seed):
        t = t_(d)
        f = glide(f0, f1, d) * (1 + 0.06 * np.sin(2 * np.pi * 28 * t))
        y = saw(f, d) * 0.5 + bp(noise(d, seed), 1000, 3000) * 0.2
        y = bp(y, 700, 3200) * env_pts(d, [(0, 0), (0.01, 1), (d * 0.6, 0.8), (d, 0)])
        return y
    return [st(np.concatenate([bawk(500, 760, 0.07, 1), silence(0.03), bawk(780, 560, 0.17, 2)]) * 1.6)]


@sfx('monster_roar')
def _():
    return [src('80-CC0-RPG-SFX_0/creature_roar_01.ogg'), src('80-CC0-RPG-SFX_0/creature_roar_02.ogg')]


@sfx('monster_growl')
def _():
    return [src('80-CC0-RPG-SFX_0/creature_monster_01.ogg'), src('80-CC0-RPG-SFX_0/creature_monster_02.ogg')]


@sfx('rumble')
def _():
    d = 2.2
    y = lp(noise(d, 381, 'brown'), 120) * (0.7 + 0.3 * np.sin(2 * np.pi * 7 * t_(d))) * env_pts(d, [(0, 0), (0.3, 1), (d - 0.5, 0.9), (d, 0)])
    return [mix(st(y * 1.4), (src('80-CC0-RPG-SFX_0/stones_03.ogg'), 0.4, 0.4))]


@sfx('thunder')
def _():
    return [src('sfx_100_v2/sfx100v2_thunder_01.ogg', stereo=True)]


@sfx('wind_gust')
def _():
    d = 2.0
    t = t_(d)
    fc = 300 + 700 * np.sin(np.pi * t / d)
    y = svf(noise(d, 391, 'pink'), fc, 1.2, 'bp') * np.sin(np.pi * t / d) ** 1.5
    return [autopan(y, 0, 0.6, -1)]


# ---------------------------------------------------------------- ambience beds (30 s, loopable via crossfade in the mixer)
AMB = {}


def amb(name):
    def deco(fn):
        AMB[name] = fn
        return fn
    return deco


def birdsong(d, density, seed):
    r = np.random.default_rng(seed)
    out = silence(d + 1, True)
    t = 0.0
    while t < d:
        c = chirp_bird(int(r.integers(1e6))) * r.uniform(0.15, 0.5)
        b = st(c, r.uniform(-0.8, 0.8))
        k = int(t * SR)
        out[k:k + len(b)] += b[:len(out) - k]
        t += r.exponential(1 / density)
    return reverb(out[:int(d * SR)], 1.2, 0.35, 0.7)[:int(d * SR)]


@amb('birds')
def _():
    d = 30
    wind = lp(noise(d, 401, 'pink'), 700) * 0.06
    return birdsong(d, 1.4, 402) + st(wind)


@amb('town')
def _():
    d = 30
    hw = load(os.path.join(SRC, 'sfx_100_v2/sfx100v2_loop_highway.ogg'))
    hw = np.tile(hw, (int(np.ceil(d * SR / len(hw))), 1))[:int(d * SR)]
    return lp(hw, 1800) * 0.35 + birdsong(d, 0.8, 411) * 0.7


@amb('night')
def _():
    d = 30
    r = np.random.default_rng(421)
    out = silence(d, True)
    for c in range(3):
        pan = [-0.6, 0.1, 0.7][c]
        f = [4300, 4700, 5100][c]
        t = r.uniform(0, 1)
        while t < d - 1:
            for p in range(3):
                b = st(sine(f, 0.022) * np.sin(np.pi * t_(0.022) / 0.022) * 0.07, pan)
                k = int((t + p * 0.04) * SR)
                out[k:k + len(b)] += b
            t += r.uniform(0.5, 1.4)
    room = lp(noise(d, 422, 'pink'), 400) * 0.04
    return reverb(out, 0.8, 0.3)[:int(d * SR)] + st(room)


@amb('room')
def _():
    d = 30
    return st(lp(noise(d, 431, 'pink'), 500) * 0.05)


@amb('kitchen')
def _():
    d = 30
    hum = (sine(60, d) * 0.5 + sine(120, d) * 0.3 + sine(180, d) * 0.15) * 0.04
    return st(lp(noise(d, 441, 'pink'), 500) * 0.05 + hum)


@amb('crowd')
def _():
    cr = load(os.path.join(SRC, 'loose/crowd_shouting.ogg'))
    return lp(hp(cr, 200), 3500) * 0.6


@amb('wind')
def _():
    d = 30
    t = t_(d)
    fc = 350 + 250 * np.sin(2 * np.pi * 0.07 * t) + 120 * np.sin(2 * np.pi * 0.19 * t)
    y = svf(noise(d, 451, 'pink'), fc, 1.0, 'bp') * (0.7 + 0.3 * np.sin(2 * np.pi * 0.11 * t))
    return widen(y * 0.5, 0.8)


@amb('rain')
def _():
    return load(os.path.join(SRC, 'Rain OGG/1.ogg')) * 0.8


@amb('ocean')
def _():
    d = 30
    t = t_(d)
    waves = 0.5 + 0.5 * np.sin(2 * np.pi * t / 6.5) ** 2
    y = svf(noise(d, 461, 'pink'), 900 + 1500 * waves, 0.7, 'lp') * waves
    return widen(y * 0.5, 0.8)


@amb('portal_hum')
def _():
    d = 30
    t = t_(d)
    y = sum(sine(f * (1 + 0.004 * np.sin(2 * np.pi * (0.1 + 0.05 * i) * t + i)), d) * a for i, (f, a) in enumerate([(55, 0.5), (82.4, 0.3), (110, 0.25), (164.8, 0.12), (220.6, 0.08)]))
    sw = svf(noise(d, 471, 'pink'), 700 + 400 * np.sin(2 * np.pi * 0.3 * t), 3, 'bp') * 0.25
    return autopan((y + sw) * 0.35, 0.05, 0.5)


@amb('vault_hum')
def _():
    d = 30
    t = t_(d)
    y = (sine(50, d) * 0.5 + sine(100, d) * 0.25 + saw(150, d) * 0.03) * (1 + 0.1 * np.sin(2 * np.pi * 0.2 * t))
    vent = bp(noise(d, 481, 'pink'), 200, 1200) * 0.12
    return widen((y + vent) * 0.4, 0.5)


@amb('laser_hum')
def _():
    d = 30
    t = t_(d)
    y = (saw(120, d) + saw(120.7, d) + saw(240.3, d) * 0.4)
    y = bp(y, 200, 1800) * (1 + 0.15 * np.sin(2 * np.pi * 0.5 * t)) * 0.12
    return widen(y, 0.6)


@amb('static')
def _():
    d = 30
    return st(bp(noise(d, 491), 500, 8000) * 0.12)


@sfx('censor_bleep')
def _():
    d = 0.38
    return [st(sine(1000, d) * env_pts(d, [(0, 0), (0.005, 1), (d - 0.01, 1), (d, 0)]) * 0.5)]


@sfx('stamp')
def _():
    return [mix((src('sfx_100_v2/sfx100v2_hit_01.ogg'), 0, 0.8), (thump(140, 60, 0.18, 0.04), 0, 0.8), (src('100-CC0-SFX_0/paper_02.ogg')[:int(0.12 * SR)], 0, 0.5))]


@sfx('steam_hiss')
def _():
    d = 1.1
    y = hp(noise(d, 501), 2500) * env_pts(d, [(0, 0), (0.04, 1), (0.3, 0.7), (d, 0)])
    wh = sine(glide(2200, 2600, 0.35), 0.35) * env_pts(0.35, [(0, 0), (0.05, 0.25), (0.35, 0)])
    return [mix(widen(y * 0.6, 0.5), (wh, 0.05, 1))]


@sfx('vhs_clunk')
def _():
    k = src('sfx_100_v2/sfx100v2_switch_01.ogg')
    return [mix((k, 0, 1), (thump(160, 80, 0.12, 0.03), 0, 0.6), (src('RPGsounds_Kenney/OGG/metalClick.ogg'), 0.06, 0.6))]


@sfx('chick_peep')
def _():
    def peep(f0, d):
        return sine(glide(f0, f0 * 1.35, d) * (1 + 0.03 * np.sin(2 * np.pi * 40 * t_(d))), d) * np.sin(np.pi * t_(d) / d) ** 1.5
    return [st(mix((peep(3000, 0.09), 0, 0.5), (peep(3300, 0.11), 0.16, 0.5)))]


@sfx('dog_bark')
def _():
    def arf(d, seed):
        f = glide(520, 330, d)
        y = saw(f, d) * 0.6 + bp(noise(d, seed), 500, 3000) * 0.5
        return bp(y, 350, 2800) * env_pts(d, [(0, 0), (0.008, 1), (d * 0.5, 0.7), (d, 0)])
    return [st(mix((arf(0.13, 1), 0, 1), (arf(0.15, 2), 0.22, 1)) * 1.4)]


@sfx('dizzy')
def _():
    items = []
    for i in range(6):
        d = 0.12
        items.append((st(sine(glide(3800, 2600, d), d) * np.sin(np.pi * t_(d) / d) * 0.4, np.sin(i * 1.3) * 0.8), i * 0.22, 1))
        items.append((st(sine(glide(2600, 3600, 0.08), 0.08) * 0.3, np.sin(i * 1.3) * 0.8), i * 0.22 + 0.12, 1))
    return [reverb(mix(*items), 0.6, 0.2)]


@sfx('confetti')
def _():
    r = np.random.default_rng(511)
    items = [(src('3pops/3pops/pop1.ogg'), 0, 1.0), (whoosh_syn(0.4, 600, 5000, 3000, 0.4, 1.5, 512), 0.01, 0.4)]
    for i in range(18):
        items.append((st(hp(noise(0.03, 520 + i), 3000) * env_exp(0.03, 0.01) * r.uniform(0.1, 0.3), r.uniform(-0.8, 0.8)), 0.1 + r.uniform(0, 1.0), 1))
    return [mix(*items)]


@amb('conveyor')
def _():
    d = 30
    t = t_(d)
    hum = (saw(55, d) * 0.2 + sine(110, d) * 0.3) * (1 + 0.05 * np.sin(2 * np.pi * 2 * t))
    hum = lp(hum, 600)
    r = np.random.default_rng(531)
    rattle = np.zeros(int(d * SR))
    for k in np.arange(0, d, 0.25):
        i = int((k + r.uniform(0, 0.02)) * SR)
        c = clicky(0.012, 1800, int(r.integers(1e6))) * r.uniform(0.2, 0.5)
        rattle[i:i + len(c)] += c[:len(rattle) - i]
    return widen(hum * 0.5 + rattle * 0.5, 0.4)


# ---------------------------------------------------------------- levelling + output
def loudness(x):
    """peak short-term (50 ms) RMS of a lightly weighted mono signal, in dBFS"""
    m = hp(mono(x), 120)
    w = int(0.05 * SR)
    if len(m) < w:
        m = np.pad(m, (0, w - len(m)))
    e = np.convolve(m ** 2, np.ones(w) / w, 'valid')
    return 10 * np.log10(e.max() + 1e-12)


# per-name level offsets (dB) relative to the common target: quiet-by-nature sounds sit lower
LEVEL = {
    'blink': -10, 'tap': -6, 'click': -4, 'toggle': -5, 'countdown_tick': -2, 'cloth': -8, 'step': -6, 'step_soft': -8,
    'step_wood': -6, 'swish': -4, 'typing': -6, 'paper': -6, 'cricket': -6, 'heartbeat': -2, 'sparkle': -4, 'shine': -3,
    'chat_pop': -3, 'ui_pop': -3, 'ui_close': -4, 'pop': -2, 'notify': -4, 'beep': -4, 'loading': -6, 'gulp': -3,
    'riser': -2, 'riser_long': -2, 'reverse_swell': -4, 'whoosh': -1, 'whoosh_long': -2, 'boom': -2, 'impact': -2,
    'sub_drop': 0, 'censor_bleep': -2, 'chick_peep': -5, 'dizzy': -5, 'confetti': -4, 'steam_hiss': -5, 'angel': -3, 'magic': -3, 'music_box': -4, 'chime': -4, 'harp_up': -3, 'harp_down': -3,
    'crowd_cheer': -3, 'applause': -4, 'snore': -5, 'sizzle': -6, 'bubbles': -6, 'laser_sweep': -6, 'static': -6,
    'money_counter': -6, 'blush': -4, 'heart_pop': -3, 'stone': -4, 'skid': -5, 'jetpack': -4, 'engine': -5, 'wind_gust': -6,
}
TARGET = -13.0


def finish(name, x):
    x = st(x)
    x = x - x.mean(0)
    g = TARGET + LEVEL.get(name, 0) - loudness(x)
    x = x * db(g)
    pk = np.abs(x).max()
    if pk > 0.95:
        x = x * 0.95 / pk
    return fade(x, 0.001, 0.01)


def main(only):
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(os.path.join(OUT, 'amb'), exist_ok=True)
    names = only or list(VOCAB['sfx'])
    missing = [n for n in VOCAB['sfx'] if n not in B]
    if missing:
        print('NO BUILDER for', missing)
    for n in names:
        if n in B:
            vs = B[n]()
            for f in glob.glob(os.path.join(OUT, f'{n}.ogg')) + glob.glob(os.path.join(OUT, f'{n}.[0-9]*.ogg')):
                os.remove(f)
            for i, v in enumerate(vs):
                save(os.path.join(OUT, f'{n}.ogg' if i == 0 else f'{n}.{i + 1}.ogg'), finish(n, v))
            print(f'{n:16s} x{len(vs)}  {len(vs[0]) / SR:.2f}s')
    for a in (only or list(VOCAB['ambience'])):
        if a in AMB:
            y = st(AMB[a]())
            y = y - y.mean(0)
            rms = np.sqrt((mono(y) ** 2).mean())
            y = y * (db(-30) / max(rms, 1e-9))
            save(os.path.join(OUT, 'amb', f'{a}.ogg'), np.clip(y, -0.95, 0.95))
            print(f'amb {a:12s} {len(y) / SR:.1f}s')


if __name__ == '__main__':
    main(sys.argv[1:])
