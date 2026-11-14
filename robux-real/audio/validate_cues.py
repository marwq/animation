#!/usr/bin/env python3
"""Validate a sound cue sheet (audio/cues/partNN.json) against audio/vocab.json.

usage: python3 audio/validate_cues.py audio/cues/part05.json [...]
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
V = json.load(open(os.path.join(HERE, 'vocab.json')))
MUSIC_OUT = {'cut', 'fade', 'sting', 'scratch', 'tapestop'}
MUSIC_IN = {'cut', 'fade', 'swell'}
SURF = {'hard', 'soft', 'wood'}


def check(path):
    errs, warn = [], []
    d = json.load(open(path))
    a, b = d['start'], d['end']
    # music must tile [start, end] exactly
    m = sorted(d.get('music', []), key=lambda s: s['start'])
    if not m:
        errs.append('no music segments')
    else:
        if abs(m[0]['start'] - a) > 1e-6: errs.append(f'music starts at {m[0]["start"]} not {a}')
        if abs(m[-1]['end'] - b) > 1e-6: errs.append(f'music ends at {m[-1]["end"]} not {b}')
        for s0, s1 in zip(m, m[1:]):
            if abs(s0['end'] - s1['start']) > 1e-6: errs.append(f'music gap/overlap {s0["end"]} -> {s1["start"]}')
        for s in m:
            if s['mood'] not in V['moods']: errs.append(f'unknown mood {s["mood"]}')
            if s['end'] <= s['start']: errs.append(f'empty music segment {s}')
            if s.get('in', 'cut') not in MUSIC_IN: errs.append(f'bad music in {s}')
            if s.get('out', 'cut') not in MUSIC_OUT: errs.append(f'bad music out {s}')
            if not 0 <= s.get('energy', 0.6) <= 1: errs.append(f'energy out of range {s}')
    for e in d.get('sfx', []):
        t, name = e[0], e[1]
        if name not in V['sfx']: errs.append(f'unknown sfx {name} @ {t}')
        if not (a - 4.0 <= t < b): errs.append(f'sfx {name} time {t} outside part')
        if len(e) > 2 and not -40 <= e[2] <= 6: errs.append(f'gain out of range {e}')
        if len(e) > 3 and not -1 <= e[3] <= 1: errs.append(f'pan out of range {e}')
    for f in d.get('footsteps', []):
        if f.get('surface', 'hard') not in SURF: errs.append(f'bad surface {f}')
        if not (a <= f['start'] < f['end'] <= b): errs.append(f'footsteps outside part {f}')
        if not 0.08 <= f['interval'] <= 1.5: errs.append(f'odd interval {f}')
    for s in d.get('ambience', []):
        if s['name'] not in V['ambience']: errs.append(f'unknown ambience {s["name"]}')
        if not (a <= s['start'] < s['end'] <= b): errs.append(f'ambience outside part {s}')
    n = len(d.get('sfx', []))
    dur = b - a
    if n / dur < 0.5: warn.append(f'only {n} sfx for {dur:.1f}s — probably too sparse')
    return errs, warn


if __name__ == '__main__':
    bad = 0
    for p in sys.argv[1:]:
        errs, warn = check(p)
        for w in warn: print(f'{p}: WARN {w}')
        for e in errs: print(f'{p}: ERROR {e}')
        if not errs: print(f'{p}: OK')
        bad += len(errs)
    sys.exit(1 if bad else 0)
