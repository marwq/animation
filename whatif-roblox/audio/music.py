"""Original score engine: mood styles -> MIDI -> FluidSynth (FluidR3 GM) audio.

Every segment of the music map (audio/cues/partNN.json) is rendered on its own with a tempo fitted so the
segment holds a whole number of bars, so phrase starts and endings land on the picture cuts.
All melodies here are original: a main theme (THEME) and Nova's motif (NOVA) reused across moods.
"""
import os, sys, math, hashlib
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import *  # noqa

SCALES = {'major': [0, 2, 4, 5, 7, 9, 11], 'minor': [0, 2, 3, 5, 7, 8, 10], 'dorian': [0, 2, 3, 5, 7, 9, 10],
          'mixolydian': [0, 2, 4, 5, 7, 9, 10], 'harmonic': [0, 2, 3, 5, 7, 8, 11]}


def deg(root, mode, d):
    sc = SCALES[mode]
    o, i = divmod(d, 7)
    return root + 12 * o + sc[i]


def chord_notes(root, mode, d, seven=False, inv=0):
    ns = [deg(root, mode, d + k) for k in ((0, 2, 4, 6) if seven else (0, 2, 4))]
    for _ in range(inv):
        ns = ns[1:] + [ns[0] + 12]
    return ns


# main theme: (degree, beats); degree 0 = tonic in the lead octave; None = rest. 8 bars over I V vi IV I V IV V
THEME = [
    [(2, .5), (4, .5), (7, .75), (6, .25), (5, .5), (4, .5), (2, 1)],
    [(1, .5), (2, .5), (4, .5), (1, .5), (-1, 1), (None, 1)],
    [(0, .5), (2, .5), (5, .75), (4, .25), (2, .5), (0, .5), (-2, 1)],
    [(3, .5), (2, .5), (0, .5), (1, .5), (2, 1), (None, 1)],
    [(2, .5), (4, .5), (7, .75), (6, .25), (5, .5), (4, .5), (7, 1)],
    [(8, .5), (7, .5), (6, .5), (4, .5), (4, 1), (None, 1)],
    [(5, .5), (4, .5), (3, .5), (2, .5), (1, .5), (0, .5), (1, 1)],
    [(4, 1.5), (2, .5), (1, 1), (None, 1)],
]
THEME_PROG = [0, 4, 5, 3, 0, 4, 3, 4]
# Nova's motif (dorian), 4 bars over i7 IV9 i7 IV9
NOVA = [
    [(0, .75), (2, .75), (3, .5), (4, .5), (6, .25), (4, .25), (3, 1)],
    [(None, .5), (4, .5), (3, .5), (2, .5), (0, 1.5), (None, .5)],
    [(0, .75), (2, .75), (3, .5), (4, .5), (6, .25), (7, .25), (6, .5), (4, .5)],
    [(3, .5), (2, .5), (0, 1), (None, 2)],
]


class Seq:
    def __init__(self):
        self.ev = []
        self.bends = []

    def n(self, s, d, note, vel, ch):
        if 0 <= note <= 127 and d > 0:
            self.ev.append((s, d, int(note), int(max(1, min(127, vel))), ch))

    def drums(self, bar, pat, note, vel=100, swing=0.0, steps=16):
        """pat string of `steps` chars: X strong, x normal, o soft, . rest"""
        for i, c in enumerate(pat):
            if c == '.':
                continue
            v = {'X': 1.15, 'x': 0.9, 'o': 0.55}.get(c, 0.9) * vel
            b = bar * 4 + i * 4 / steps
            if swing and i % 2 == 1:
                b += swing
            self.n(b, 0.1, note, v, 9)


def melody(seq, phrases, bar0, nbars, root, mode, ch, vel, octave_shift=0, stacc=0.9, humanize=0.0, seed=0):
    r = np.random.default_rng(seed)
    for b in range(nbars):
        ph = phrases[b % len(phrases)]
        up = 12 if (b // len(phrases)) % 2 == 1 and octave_shift == 'alt' else 0
        t = (bar0 + b) * 4
        for d, L in ph:
            if d is not None:
                v = vel * (1.0 if t % 1 == 0 else 0.88) + r.normal(0, humanize)
                seq.n(t, L * stacc, deg(root, mode, d) + (octave_shift if isinstance(octave_shift, int) else 0) + up, v, ch)
            t += L


def theme_bar(b):
    return THEME[b % 8]


# ---------------------------------------------------------------- styles
# each style: fn(seq, nbars, e, rng) -> programs dict; plus nominal bpm. Bars are 4/4.
STYLES = {}


def style(name, bpm):
    def deco(fn):
        STYLES[name] = (fn, bpm)
        return fn
    return deco


def prog_loop(prog, nbars):
    return [prog[b % len(prog)] for b in range(nbars)]


def pad_chords(s, nbars, prog, root, mode, ch, vel, octave=0, seven=False):
    for b, d in enumerate(prog_loop(prog, nbars)):
        for nn in chord_notes(root + octave, mode, d, seven, inv=1 if d >= 4 else 0):
            s.n(b * 4, 4, nn, vel, ch)


def crash_phrases(s, nbars, every=8, vel=90):
    for b in range(0, nbars, every):
        s.n(b * 4, 2, 49, vel, 9)


@style('hook', 122)
def _(s, nb, e, r):
    root, mode = 60, 'major'  # C
    prog = THEME_PROG
    for b, d in enumerate(prog_loop(prog, nb)):
        bass = deg(36, mode, d)
        for i in range(8):
            s.n(b * 4 + i * 0.5, 0.4, bass + (12 if i % 4 == 3 else 0), 92 if i % 2 == 0 else 78, 2)
        # piano offbeat stabs
        for i in (0.5, 1.5, 2.5, 3.5) if e > 0.5 else (0, 2):
            for nn in chord_notes(60, mode, d, inv=1):
                s.n(b * 4 + i, 0.35, nn, 70 + 15 * e, 1)
        if e < 0.6:
            for nn in chord_notes(48, mode, d):
                s.n(b * 4, 4, nn, 55, 3)
        s.drums(b, 'X...x...X...x...' if e > 0.45 else 'x.......x.......', 36, 100)
        if e > 0.35:
            s.drums(b, '....x.......x...', 39 if e > 0.7 else 38, 95)
            s.drums(b, 'x.x.x.x.x.x.x.x.' if e > 0.6 else 'x...x...x...x...', 42, 70)
        if e > 0.8:
            s.drums(b, '..o...o...o...o.', 46, 60)
        if e > 0.65:
            for d2, L in []:
                pass
    if e > 0.62:
        melody(s, THEME, 0, nb, 72, mode, 0, 92, 0, 0.92, 4, 1)
        melody(s, THEME, 0, nb, 84, mode, 5, 50, 0, 0.6, 3, 2)
    else:
        # sparse glockenspiel answer at phrase ends
        for b in range(3, nb, 4):
            for i, d in enumerate((4, 5, 7)):
                s.n(b * 4 + 2 + i * 0.5, 0.5, deg(84, mode, d), 60, 5)
    if e > 0.5:
        crash_phrases(s, nb, 8, 85)
    return {0: 80, 1: 0, 2: 38, 3: 89, 5: 9}


@style('outro', 122)
def _(s, nb, e, r):
    p = STYLES['hook'][0](s, nb, max(e, 0.66), r)
    return p


@style('action', 146)
def _(s, nb, e, r):
    root, mode = 57, 'minor'  # A minor
    prog = [0, 5, 2, 6]
    for b, d in enumerate(prog_loop(prog, nb)):
        bass = deg(33, mode, d)
        for i in range(16):
            if i % 4 != 3 or e > 0.6:
                s.n(b * 4 + i * 0.25, 0.2, bass + (12 if i in (6, 14) else 0), 95 if i % 4 == 0 else 72, 2)
        for i in range(8):
            for nn in chord_notes(57, mode, d):
                s.n(b * 4 + i * 0.5, 0.25, nn, 62 + 10 * (i % 2 == 0), 1)
        s.drums(b, 'X..x..X...X..x..' if e > 0.5 else 'X.......X.......', 36, 105)
        s.drums(b, '....X.......X...', 38, 100)
        s.drums(b, 'xxxxxxxxxxxxxxxx' if e > 0.6 else 'x.x.x.x.x.x.x.x.', 42, 62)
        if b % 2 == 1 and e > 0.55:
            for i, nn in enumerate(chord_notes(69, mode, d)):
                s.n(b * 4 + 3 + i * 0.25, 0.3, nn, 100, 0)
    crash_phrases(s, nb, 4, 95)
    return {0: 61, 1: 48, 2: 39, 9: 0}


@style('mystery', 80)
def _(s, nb, e, r):
    root, mode = 62, 'minor'  # D minor
    prog = [0, 5, 3, 4]
    arp = [0, 2, 4, 7, 4, 2]
    for b, d in enumerate(prog_loop(prog, nb)):
        for nn in chord_notes(50, mode, d, seven=True):
            s.n(b * 4, 4, nn, 48 + 15 * e, 3)
        s.n(b * 4, 1.5, deg(38, mode, d), 70, 2)
        s.n(b * 4 + 2, 1.5, deg(38, mode, d) + 7, 60, 2)
        for i in range(6 if e > 0.3 else 3):
            dd = d + arp[i % len(arp)]
            s.n(b * 4 + i * (4 / 6 if e > 0.3 else 4 / 3), 1.0, deg(74, mode, dd), 62 + 10 * (i == 0), 0)
        if e > 0.55:
            s.drums(b, 'o...o...o...o.o.', 70, 55)
        if b % 2 == 1:
            s.n(b * 4 + 3, 1.0, deg(86, mode, d + 4), 50, 5)
    return {0: 10, 2: 45, 3: 95, 5: 8}


@style('glitch_build', 120)
def _(s, nb, e, r):
    root, mode = 53, 'minor'  # F minor pedal
    for b in range(nb):
        k = (b + 1) / nb
        for i in range(16):
            s.n(b * 4 + i * 0.25, 0.2, 29 + (12 if i % 8 == 7 else 0), 70 + 40 * k, 2)
        for i in range(8):
            dd = [0, 2, 4, 7][i % 4] + (2 if b % 4 >= 2 else 0)
            s.n(b * 4 + i * 0.5, 0.4, deg(65, mode, dd), 45 + 50 * k, 4)
        s.drums(b, 'X...X...X...X...', 36, 80 + 40 * k)
        if k > 0.5:
            s.drums(b, '....x.......x...', 38, 80)
        if b == nb - 1:
            s.drums(b, 'xxxxxxxxxxxxxxxx', 38, 70)
            for i in range(16):
                s.n(b * 4 + i * 0.25, 0.2, 38, 50 + 4 * i, 9)
        for nn in (53, 56, 60):
            s.n(b * 4, 4, nn, 40 + 40 * k, 3)
    return {2: 38, 3: 95, 4: 81}


@style('playful', 112)
def _(s, nb, e, r):
    root, mode = 65, 'major'  # F
    prog = [0, 5, 1, 4]
    for b, d in enumerate(prog_loop(prog, nb)):
        s.n(b * 4, 0.45, deg(41, mode, d), 90, 2)
        s.n(b * 4 + 1, 0.4, deg(41, mode, d) + 7, 70, 2)
        s.n(b * 4 + 2, 0.45, deg(41, mode, d) + (12 if b % 2 else 0), 85, 2)
        s.n(b * 4 + 3, 0.4, deg(41, mode, d) + 7, 70, 2)
        for i in (1, 3):
            for nn in chord_notes(65, mode, d):
                s.n(b * 4 + i, 0.3, nn, 62, 1)
        s.drums(b, '..o...o...o...o.', 76, 70)
        if e > 0.5:
            s.drums(b, 'x...o...x...o...', 70, 55)
            s.drums(b, '....x.......x...', 39, 60)
    # staccato pizzicato melody from the theme, transposed
    if e > 0.4:
        melody(s, THEME, 0, nb, 77, mode, 0, 88, 0, 0.45, 4, 3)
    return {0: 45, 1: 12, 2: 70}


@style('adventure', 126)
def _(s, nb, e, r):
    root, mode = 62, 'major'  # D
    prog = THEME_PROG
    for b, d in enumerate(prog_loop(prog, nb)):
        for nn in chord_notes(62, mode, d, inv=1):
            s.n(b * 4, 4, nn, 60 + 15 * e, 3)
        for i in range(8):
            for nn in chord_notes(62, mode, d):
                s.n(b * 4 + i * 0.5, 0.3, nn, 55 + 15 * (i % 2 == 0), 1)
        s.n(b * 4, 1.8, deg(38, mode, d), 90, 2)
        s.n(b * 4 + 2, 1.8, deg(38, mode, d), 80, 2)
        s.n(b * 4, 0.9, deg(38, mode, d), 90, 6)
        if e > 0.4:
            s.drums(b, 'X.....x.X.......', 36, 95)
            s.drums(b, '....x.......x...', 38, 90)
            s.drums(b, 'x.x.x.x.x.x.x.x.', 42 if e < 0.75 else 51, 65)
    if e > 0.58:
        melody(s, THEME, 0, nb, 74, mode, 0, 95, 0, 0.95, 4, 5)
        melody(s, THEME, 0, nb, 86, mode, 5, 55, 0, 0.5, 3, 6)
    crash_phrases(s, nb, 8, 90)
    return {0: 61, 1: 48, 2: 58, 3: 49, 5: 9, 6: 47}


@style('commentator', 156)
def _(s, nb, e, r):
    root, mode = 67, 'major'  # G
    prog = [0, 3, 4, 0, 5, 3, 1, 4]
    for b, d in enumerate(prog_loop(prog, nb)):
        for i in range(8):
            s.n(b * 4 + i * 0.5, 0.4, deg(43, mode, d) + (7 if i % 2 else 0), 92 if i % 2 == 0 else 75, 2)
        for i in (0.5, 1.5, 2.5, 3.5):
            for nn in chord_notes(67, mode, d):
                s.n(b * 4 + i, 0.25, nn, 82, 1)
        s.drums(b, 'X...x...X...x...', 36, 100)
        s.drums(b, '....X.......X..x', 38, 95)
        s.drums(b, 'xxxxxxxxxxxxxxxx', 42, 60)
    if e > 0.5:
        melody(s, THEME, 0, nb, 79, mode, 0, 95, 0, 0.6, 4, 7)
    crash_phrases(s, nb, 4, 90)
    return {0: 56, 1: 61, 2: 33}


@style('epic', 96)
def _(s, nb, e, r):
    root, mode = 60, 'minor'  # C minor
    prog = [0, 5, 2, 6]
    for b, d in enumerate(prog_loop(prog, nb)):
        k = 0.6 + 0.4 * (b + 1) / nb
        for i in range(8):
            s.n(b * 4 + i * 0.5, 0.45, deg(48, mode, d) + (12 if i % 2 else 0), (60 + 30 * e) * k, 1)
        for nn in chord_notes(60, mode, d):
            s.n(b * 4, 4, nn, (55 + 25 * e) * k, 3)
        s.n(b * 4, 4, deg(36, mode, d), 85 * k, 2)
        s.n(b * 4, 1, deg(36, mode, d), 100 * k, 6)
        if e > 0.5:
            s.drums(b, 'X.....X...X.....', 41, 100 * k)
            s.drums(b, '....x.......x..x', 43, 85 * k)
        if b % 4 == 3:
            for i in range(8):
                s.n(b * 4 + 2 + i * 0.25, 0.2, deg(36, mode, d), 60 + 6 * i, 6)
    if e > 0.65:
        melody(s, THEME, 0, nb, 72, mode, 0, 98, 0, 0.98, 3, 8)
    crash_phrases(s, nb, 4, 80)
    return {0: 60, 1: 48, 2: 58, 3: 52, 6: 47}


@style('game', 136)
def _(s, nb, e, r):
    root, mode = 60, 'major'
    prog = [0, 5, 3, 4]
    for b, d in enumerate(prog_loop(prog, nb)):
        for i in range(8):
            s.n(b * 4 + i * 0.5, 0.3, deg(36, mode, d) + (12 if i % 2 else 0), 90, 2)
        for i in range(16):
            dd = d + [0, 2, 4, 7][i % 4]
            s.n(b * 4 + i * 0.25, 0.2, deg(72, mode, dd), 42 + 15 * e, 4)
        s.drums(b, 'X.......X.x.....', 36, 95)
        s.drums(b, '....x.......x...', 38, 85)
        if e > 0.4:
            s.drums(b, 'x.x.x.x.x.x.x.x.', 42, 55)
    if e > 0.5:
        melody(s, THEME, 0, nb, 72, mode, 0, 85, 'alt', 0.8, 3, 9)
    return {0: 80, 2: 38, 4: 81}


@style('sad', 68)
def _(s, nb, e, r):
    root, mode = 60, 'major'  # Am F C G in C
    prog = [5, 3, 0, 4]
    for b, d in enumerate(prog_loop(prog, nb)):
        bass = deg(36, mode, d)
        s.n(b * 4, 4, bass, 70, 1)
        arp = chord_notes(60, mode, d)
        for i, nn in enumerate([bass + 12, arp[0], arp[1], arp[2], arp[1], arp[0], arp[1], arp[2]]):
            s.n(b * 4 + i * 0.5, 1.2, nn, 55 + 8 * (i == 0), 1)
        if e > 0.35:
            for nn in chord_notes(60, mode, d, inv=1):
                s.n(b * 4, 4, nn, 40 + 25 * e, 3)
    if e > 0.45:
        sad = [[(4, 1.5), (2, .5), (1, 1), (0, 1)], [(-1, 2), (None, 2)], [(2, 1.5), (1, .5), (0, 1), (-1, 1)], [(-2, 3), (None, 1)]]
        melody(s, sad, 0, nb, 72, mode, 0, 70, 0, 0.98, 2, 10)
    return {0: 0, 1: 0, 3: 49}


@style('chase', 166)
def _(s, nb, e, r):
    root, mode = 64, 'minor'  # E minor
    prog = [0, 0, 5, 4]
    for b, d in enumerate(prog_loop(prog, nb)):
        for i in range(4):
            s.n(b * 4 + i, 0.4, deg(28, mode, d) + (7 if i % 2 else 0), 95, 2)
        for i in range(8):
            for nn in chord_notes(64, mode, d):
                s.n(b * 4 + i * 0.5 + 0.25, 0.2, nn, 70, 1)
        s.drums(b, 'X...x...X...x...', 36, 95)
        s.drums(b, '....X.......X...', 38, 90)
        s.drums(b, 'x.x.x.x.x.x.x.x.', 42, 60)
        # xylophone chromatic runs every other bar
        if b % 2 == 1:
            for i in range(8):
                s.n(b * 4 + 2 + i * 0.25, 0.2, deg(76, mode, d) + i, 85, 0)
        else:
            for i, dd in enumerate((0, 2, 4, 2, 0, -1, 0, 4)):
                s.n(b * 4 + i * 0.5, 0.3, deg(76, mode, d + dd), 88, 0)
    crash_phrases(s, nb, 4, 85)
    return {0: 13, 1: 45, 2: 58}


@style('cool', 88)
def _(s, nb, e, r):
    root, mode = 57, 'dorian'  # A dorian
    prog = [0, 3, 0, 3]
    sw = 0.08
    for b, d in enumerate(prog_loop(prog, nb)):
        for nn in chord_notes(57, mode, d, seven=True):
            s.n(b * 4, 1.4, nn, 64, 1)
            s.n(b * 4 + 2.5, 1.0, nn, 56, 1)
        bl = deg(33, mode, d)
        for (t, dur, dn) in [(0, 0.7, 0), (0.75, 0.25, 0), (1.5, 0.5, 7), (2.5, 0.5, 0), (3.25, 0.5, 10 if d == 0 else 5)]:
            s.n(b * 4 + t, dur, bl + dn, 92, 2)
        s.drums(b, 'X......x..X.....', 36, 100, sw)
        s.drums(b, '....X.......X...', 40, 92, sw)
        s.drums(b, 'x.xox.xox.xox.xo' if e > 0.45 else 'x...x...x...x...', 42, 60, sw)
        if e > 0.6:
            s.drums(b, '....x.......x...', 39, 55, sw)
    if e > 0.45:
        melody(s, NOVA, 0, nb, 69, mode, 0, 78, 0, 0.85, 3, 11)
    return {0: 11, 1: 4, 2: 33}


@style('montage', 128)
def _(s, nb, e, r):
    root, mode = 67, 'major'  # Em C G D in G
    prog = [5, 3, 0, 4]
    for b, d in enumerate(prog_loop(prog, nb)):
        for i in range(8):
            s.n(b * 4 + i * 0.5 + 0.0, 0.4, deg(43, mode, d) + (12 if i % 2 else 0), 70 if i % 2 == 0 else 95, 2)
        for nn in chord_notes(67, mode, d, inv=1):
            for i in range(4):
                s.n(b * 4 + i + 0.5, 0.45, nn, 70 + 15 * e, 1)
            s.n(b * 4, 4, nn - 12, 50, 3)
        for i in range(16):
            dd = d + [0, 4, 2, 7][i % 4]
            s.n(b * 4 + i * 0.25, 0.18, deg(79, mode, dd), 50 + 20 * e, 4)
        s.drums(b, 'X...X...X...X...', 36, 105)
        s.drums(b, '....X.......X...', 39, 95)
        s.drums(b, '..x...x...x...x.', 46, 65)
        s.drums(b, 'x.x.x.x.x.x.x.x.', 42, 50)
    if e > 0.7:
        melody(s, THEME, 0, nb, 79, mode, 0, 88, 0, 0.9, 3, 12)
    crash_phrases(s, nb, 8, 95)
    return {0: 81, 1: 90, 2: 38, 3: 89, 4: 84}


@style('warm', 94)
def _(s, nb, e, r):
    root, mode = 67, 'major'  # G
    prog = [0, 4, 5, 3]
    pick = [0, 2, 1, 2, 0, 2, 1, 2]
    for b, d in enumerate(prog_loop(prog, nb)):
        ch = chord_notes(55, mode, d)
        s.n(b * 4, 2, deg(43, mode, d), 80, 2)
        s.n(b * 4 + 2, 2, deg(43, mode, d) + 7, 70, 2)
        for i, k in enumerate(pick):
            s.n(b * 4 + i * 0.5, 0.9, ch[k] + (12 if i % 4 == 1 else 0), 66 + 8 * (i % 2 == 0), 1)
        for nn in chord_notes(67, mode, d, inv=1):
            s.n(b * 4, 4, nn, 40 + 25 * e, 3)
        if e > 0.45:
            s.drums(b, 'x...o...x...o...', 70, 50)
    if e > 0.55:
        warm = [[(4, 1), (2, 1), (4, 1), (5, 1)], [(4, 2), (1, 2)], [(2, 1), (0, 1), (2, 1), (4, 1)], [(3, 3), (None, 1)]]
        melody(s, warm, 0, nb, 79, mode, 0, 66, 0, 0.95, 2, 13)
    return {0: 0, 1: 25, 2: 32, 3: 49}


@style('heist', 112)
def _(s, nb, e, r):
    root, mode = 64, 'minor'  # E minor
    walk = [0, 3, 4, 5, 7, 5, 4, 3]
    for b in range(nb):
        d = 0 if b % 4 < 2 else (5 if b % 4 == 2 else 4)
        for i in range(8):
            s.n(b * 4 + i * 0.5, 0.35, deg(40, mode, d) + [0, 3, 7, 10, 12, 10, 7, 3][i] - (0 if d == 0 else 0), 88 if i % 2 == 0 else 70, 2)
        if b % 2 == 0:
            for nn in (64, 67, 71):
                s.n(b * 4 + 3.5, 0.2, nn + (deg(0, mode, d) if False else 0), 85, 1)
        s.drums(b, 'x.x.x.x.x.x.x.x.', 42, 55)
        s.drums(b, '....x.......x...', 37, 70)
        if e > 0.55:
            s.drums(b, 'x.......x..x....', 36, 85)
        if b % 4 == 3:
            for i, nn in enumerate((76, 75, 74, 73)):
                s.n(b * 4 + i * 0.5, 0.4, nn, 80, 0)
        s.n(b * 4, 4, 59 + (1 if b % 2 else 0), 45, 3)
    return {0: 59, 1: 45, 2: 32, 3: 11}


@style('climax', 154)
def _(s, nb, e, r):
    root, mode = 62, 'minor'  # D minor
    prog = [0, 5, 6, 0, 0, 5, 2, 6]
    for b, d in enumerate(prog_loop(prog, nb)):
        for i in range(16):
            s.n(b * 4 + i * 0.25, 0.2, deg(50, mode, d) + [0, 12, 7, 12][i % 4], 72 + 10 * (i % 4 == 0), 1)
        for nn in chord_notes(62, mode, d):
            s.n(b * 4, 4, nn, 70, 3)
        s.n(b * 4, 2, deg(38, mode, d), 100, 2)
        s.n(b * 4 + 2, 2, deg(38, mode, d), 95, 2)
        s.n(b * 4, 0.5, deg(38, mode, d), 110, 6)
        s.n(b * 4 + 2.5, 0.5, deg(38, mode, d), 95, 6)
        s.drums(b, 'X..X..X...X..X..', 36, 110)
        s.drums(b, '....X.......X...', 38, 105)
        s.drums(b, 'x.x.x.x.x.x.x.x.', 42, 70)
    melody(s, THEME, 0, nb, 74, mode, 0, 105, 0, 0.98, 3, 14)
    crash_phrases(s, nb, 4, 100)
    return {0: 61, 1: 48, 2: 58, 3: 52, 6: 47}


@style('wonder', 78)
def _(s, nb, e, r):
    root, mode = 64, 'major'  # E
    prog = [0, 2, 3, 3]
    for b, d in enumerate(prog_loop(prog, nb)):
        minor_iv = (b % 4 == 3)
        ch = chord_notes(64, mode, d)
        if minor_iv:
            ch = [ch[0], ch[1] - 1, ch[2]]
        for nn in ch:
            s.n(b * 4, 4, nn, 55 + 20 * e, 3)
            s.n(b * 4, 4, nn + 12, 40 + 20 * e, 4)
        s.n(b * 4, 4, deg(40, mode, d), 65, 2)
        for i in range(8):
            s.n(b * 4 + i * 0.5, 1.0, ch[i % 3] + 24 + (12 if i == 7 else 0), 60, 0)
    if e > 0.5:
        melody(s, [[(4, 2), (7, 2)], [(6, 3), (None, 1)], [(5, 2), (4, 2)], [(2, 3), (None, 1)]], 0, nb, 76, mode, 5, 70, 0, 0.98, 2, 15)
    return {0: 8, 2: 46, 3: 52, 4: 49, 5: 9}


@style('romance', 80)
def _(s, nb, e, r):
    root, mode = 65, 'major'  # F
    prog = [0, 2, 3, 4]
    for b, d in enumerate(prog_loop(prog, nb)):
        ch = chord_notes(53, mode, d)
        arp = [ch[0], ch[1], ch[2], ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[0] + 24, ch[2] + 12]
        for i, nn in enumerate(arp):
            s.n(b * 4 + i * 0.5, 1.5, nn, 62, 1)
        for nn in chord_notes(65, mode, d, inv=1):
            s.n(b * 4, 4, nn, 42 + 20 * e, 3)
        s.n(b * 4, 2, deg(41, mode, d), 62, 2)
        s.n(b * 4 + 2, 2, deg(41, mode, d) + 7, 55, 2)
    if e > 0.4:
        rom = [(2, 1.5), (1, .5), (2, 1), (4, 1)], [(3, 2), (2, 1), (None, 1)], [(5, 1.5), (4, .5), (3, 1), (2, 1)], [(1, 3), (None, 1)]
        melody(s, list(rom), 0, nb, 77, mode, 0, 70, 0, 0.98, 2, 16)
        melody(s, list(rom), 0, nb, 89, mode, 5, 42, 0, 0.5, 2, 17)
    return {0: 73, 1: 46, 2: 45, 3: 49, 5: 9}


# ---------------------------------------------------------------- render a segment
STING_PROGS = {}


def fit_bars(dur, bpm):
    bar = 4 * 60 / bpm
    nb = max(1, round(dur / bar))
    fitted = nb * 4 * 60 / dur
    if abs(fitted / bpm - 1) > 0.14:
        # very short or awkward: keep nominal tempo, render enough bars, cut later
        return math.ceil(dur / bar), bpm, False
    return nb, fitted, True


# role per MIDI channel: (pan, reverb send, gain)
ROLE = {0: (0.0, 0.20, 1.0), 1: (-0.28, 0.22, 0.85), 2: (0.0, 0.03, 1.0), 3: (0.3, 0.40, 0.75),
        4: (0.35, 0.28, 0.7), 5: (-0.35, 0.35, 0.8), 6: (0.0, 0.25, 0.9), 9: (0.0, 0.10, 0.9)}


def render_parts(ev, bpm, progs):
    """render each MIDI channel on its own, fix FluidR3's out-of-phase stereo samples, then pan/reverb ourselves"""
    chans = sorted({e[4] for e in ev})
    dry, wet = None, None
    for ch in chans:
        sub = [e for e in ev if e[4] == ch]
        x = render_midi(notes_midi(sub, bpm, {ch: progs.get(ch, 0)} if ch != 9 else {}), 0.55, reverb_on=False)
        L, R = x[:, 0], x[:, 1]
        if ch == 9:
            c = np.corrcoef(L, R)[0, 1] if L.std() > 0 and R.std() > 0 else 1
            y = np.stack([L, -R if c < 0 else R], 1)
        else:
            m1, m2 = L + R, L - R
            m = m1 if (m1 ** 2).sum() >= (m2 ** 2).sum() else m2
            pan, _, _ = ROLE.get(ch, (0, 0.2, 1))
            y = st(m * 0.5, pan)
            if ch == 3:
                y = widen(mono(y), 0.8)
        _, send, g = ROLE.get(ch, (0, 0.2, 1))
        y = y * g
        if dry is None:
            dry, wet = np.zeros((0, 2)), np.zeros((0, 2))
        n = max(len(dry), len(y))
        dry, wet = fit(dry, n), fit(wet, n)
        dry[:len(y)] += y
        wet[:len(y)] += y * send
    out = mix((dry, 0, 1.0), (reverb_wet(wet, 1.8, 0.55), 0, 0.9))
    return out


CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'out', 'audio', 'music_cache')


def render_segment(mood, dur, energy=0.6, sting=False, seed=0):
    """returns stereo buffer of exactly `dur` seconds (+ sting tail if sting)."""
    if mood == 'silence' or dur <= 0.05:
        return silence(dur, True)
    key = hashlib.md5(f'{mood}|{dur:.4f}|{energy:.3f}|{sting}|{seed}|v4'.encode()).hexdigest()[:16]
    os.makedirs(CACHE, exist_ok=True)
    cp = os.path.join(CACHE, key + '.wav')
    if os.path.exists(cp):
        return load(cp)
    fn, bpm = STYLES[mood]
    nb, bpm2, exact = fit_bars(dur, bpm)
    s = Seq()
    r = np.random.default_rng(seed)
    progs = fn(s, nb, energy, r)
    end_beat = dur * bpm2 / 60
    # drop notes that start after the end; clip lengths so everything stops by the cut
    ev = []
    for (st0, d, n, v, ch) in s.ev:
        if st0 >= end_beat - 1e-6:
            continue
        ev.append((st0, min(d, end_beat - st0), n, v, ch))
    tail = 0.0
    if sting:
        # final button: tonic chord stab on lead+chords+bass + crash, on the segment end
        lastprog = progs
        mode_root = {'cool': (57, 'dorian'), 'mystery': (62, 'minor'), 'epic': (60, 'minor'), 'heist': (64, 'minor'),
                     'climax': (62, 'minor'), 'action': (57, 'minor'), 'chase': (64, 'minor'), 'glitch_build': (53, 'minor'),
                     'playful': (65, 'major'), 'romance': (65, 'major'), 'adventure': (62, 'major'), 'commentator': (67, 'major'),
                     'montage': (67, 'major'), 'warm': (67, 'major'), 'wonder': (64, 'major'), 'sad': (60, 'major')}.get(mood, (60, 'major'))
        rt, md = mode_root
        b = end_beat
        for chn in [c for c in lastprog if c != 9][:3]:
            for nn in chord_notes(rt, md, 0):
                ev.append((b, 1.5, nn, 110, chn))
        ev.append((b, 1.5, rt - 24, 115, 2 if 2 in lastprog else 0))
        ev.append((b, 2, 49, 115, 9))
        ev.append((b, 0.5, 36, 120, 9))
        tail = 2.5
    x = render_parts(ev, bpm2, progs)
    n = int(round((dur + tail) * SR))
    x = fit(x, n)
    # loudness-normalise per segment (energy sets the level)
    m = mono(x[:int(dur * SR)])
    rms = np.sqrt((m ** 2).mean()) + 1e-9
    target = db(-21 + 5 * (energy - 0.6))
    x = x * min(target / rms, 8.0)
    save(cp, x, 'f32')
    return x


if __name__ == '__main__':
    # audition: python3 audio/music.py mood seconds energy out.wav
    mood, d, e = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
    out = sys.argv[4] if len(sys.argv) > 4 else f'/tmp/{mood}.wav'
    y = render_segment(mood, d, e, sting=True)
    save(out, np.clip(y, -1, 1))
    print('wrote', out, len(y) / SR)
