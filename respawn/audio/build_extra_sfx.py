#!/usr/bin/env python3
"""Extra SFX for the Respawn video, written into the shared library (whatif-roblox/assets/sfx).

- giggle / kids_laugh / crowd_laugh: built from "Group giggling" by Nocturnal_Vanguard (OpenGameArt, CC0),
  layered with pitch/time offsets into a classroom laugh and a big hall laugh.
- crowd_gasp: synthesized (band-passed breathy noise swell of many people inhaling).
- whistle: synthesized referee pea whistle (two short blasts + one long).
- skate_roll: synthesized skateboard wheels rolling on concrete (rumble + seam clicks), ~2 s.
usage: python3 -I audio/build_extra_sfx.py <path to group_giggling.ogg>
"""
import os, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from dsp import *  # noqa

LIB = os.path.join(os.path.dirname(os.path.dirname(HERE)), 'whatif-roblox', 'assets', 'sfx')


def out(name, x, peak=0.85):
    x = fade(norm(x, peak), 0.004, 0.08)
    p = os.path.join(LIB, name + '.ogg')
    save(p, x)
    print('wrote', p, f'{len(x) / SR:.2f}s')


def layer(src, specs, dur):
    """specs: [(t0, ratio, gain, pan)] -> stereo buffer"""
    o = silence(dur, True)
    for t0, ratio, g, pan in specs:
        y = st(speed(src, ratio) * g, pan)
        i = int(t0 * SR)
        n = min(len(y), len(o) - i)
        if n > 0:
            o[i:i + n] += y[:n]
    return o


if __name__ == '__main__':
    g = mono(load(sys.argv[1]))
    g = trim(g, 0.005)
    out('giggle', st(g, 0))
    kids = layer(g, [(0, 1.0, 1.0, -0.2), (0.22, 1.12, 0.8, 0.35), (0.55, 0.93, 0.75, -0.5), (0.9, 1.2, 0.6, 0.55)], 6.6)
    out('kids_laugh', reverb(kids, 0.7, 0.18))
    specs = [(0.0, 0.86, 0.9, -0.6), (0.1, 0.95, 1.0, 0.1), (0.2, 1.07, 0.85, 0.6), (0.35, 0.9, 0.8, -0.2),
             (0.5, 1.15, 0.7, 0.4), (0.7, 1.0, 0.75, -0.45), (0.95, 0.82, 0.7, 0.25), (1.2, 1.1, 0.6, -0.7)]
    hall = layer(g, specs, 7.2)
    rum = st(bp(noise(7.2, 3, 'pink'), 250, 1600) * 0.12, 0) * env_pts(7.2, [(0, 0), (0.4, 1), (4.5, 0.8), (7.2, 0)])[:, None]
    out('crowd_laugh', reverb(hall + rum, 1.6, 0.3))
    # gasp: many people inhaling — breathy band-passed noise, fast swell, quick hold, cut
    d = 1.1
    n = noise(d, 11, 'pink')
    gasp = bp(n, 900, 4200) * env_pts(d, [(0, 0), (0.18, 1.0), (0.55, 0.7), (1.1, 0)])
    gasp = gasp + 0.5 * bp(noise(d, 12, 'white'), 2500, 7000) * env_pts(d, [(0, 0), (0.12, 1), (0.4, 0.3), (1.1, 0)])
    out('crowd_gasp', reverb(widen(st(gasp, 0), 0.6), 1.4, 0.35), 0.7)
    # skateboard roll: low rumble + periodic seam clicks (every ~0.28 s)
    d = 2.2
    rum = lp(noise(d, 21, 'brown'), 300) * 2.0 + bp(noise(d, 22, 'pink'), 600, 2400) * 0.25
    clicks = np.zeros(int(d * SR))
    for k, t0 in enumerate(np.arange(0.05, d, 0.28)):
        i = int(t0 * SR)
        c = bp(noise(0.05, 30 + k, 'white'), 1500, 6000) * env_exp(0.05, 0.008)
        clicks[i:i + len(c)] += c[:len(clicks) - i] * 0.8
        j = i + int(0.045 * SR)
        clicks[j:j + len(c)] += c[:max(0, len(clicks) - j)] * 0.55
    roll = (rum + clicks) * env_pts(d, [(0, 0), (0.15, 1), (1.9, 1), (2.2, 0)])
    out('skate_roll', st(roll, 0), 0.7)
    # referee pea whistle: ~2.9 kHz tone, pea trill (FM + AM ~ 34 Hz), breath noise; blasts .18 .18 .7 s
    def blast(d, seed):
        tt = np.arange(int(d * SR)) / SR
        f = 2900 + 140 * np.sin(2 * np.pi * 34 * tt) + 60 * np.sin(2 * np.pi * 7 * tt)
        ph = 2 * np.pi * np.cumsum(f) / SR
        tone = np.sin(ph) * (0.75 + 0.25 * np.sin(2 * np.pi * 34 * tt + 1.0)) + 0.15 * np.sin(2 * ph)
        br = bp(noise(d, seed, 'white'), 2000, 6000) * 0.12
        return (tone + br) * env_pts(d, [(0, 0), (0.015, 1), (d - 0.03, 0.9), (d, 0)])
    w = np.concatenate([blast(0.18, 41), np.zeros(int(0.09 * SR)), blast(0.18, 42), np.zeros(int(0.09 * SR)), blast(0.7, 43)])
    out('whistle', reverb(st(w, 0), 0.9, 0.2), 0.6)
