#!/usr/bin/env python3
"""Fit the animation to the real voiceover.

inputs : voice/anim_lines.json   (node voice/export_lines.js — every caption line of the animation, old timeline)
         voice/segments/takeXX.json (ElevenLabs Text-to-Dialogue: start/end of each script line inside the take)
         voice/takes/takeXX.txt  (script text per line) ; voice/words/takeXX.json (whisper word times)
outputs: scenes/vo_timing.json   (time warp new->old + per-line caption/viseme timing in OLD coordinates)
         voice/placement.json    (every voice clip: take, clip in/out, new start) for the mixer

The new timeline keeps every action beat at its original length and only slows the picture down where the
voice needs more room than the animation gave it.
"""
import difflib, glob, json, os, re, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
TAKES = ['take01', 'take02', 'take03', 'take04', 'take05', 'take06', 'take07', 'take08', 'take09', 'take10a', 'take10b',
         'take11a', 'take11b', 'take12', 'take13', 'take14']
OLD_END = 771.0

import subprocess
sys.path.insert(0, os.path.join(ROOT, 'audio'))
SR = 48000
TEMPO = float(os.environ.get('VO_TEMPO', '1.08'))     # global speech speed-up (pitch preserved, rubberband)
PAUSE = float(os.environ.get('VO_PAUSE', '0.30'))     # long silences inside takes are shortened to this
GAPCAP = 0.4
VO_DIR = os.path.join(ROOT, 'out', 'audio', 'vo_takes')
_maps = {}


def take_audio(tk):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'takes', tk + '.mp3'), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'],
                       capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy()


def silence_map(tk):
    """piecewise-linear map original take time -> tightened time (long silences shortened to PAUSE)"""
    if tk in _maps:
        return _maps[tk]
    x = take_audio(tk)
    hop = int(0.01 * SR)
    n = len(x) // hop
    rms = np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1) + 1e-12)
    db = 20 * np.log10(rms)
    thr = max(-52.0, db.max() - 42.0)
    quiet = db < thr
    keep = []          # (orig_start, orig_end) kept spans
    i, last = 0, 0
    while i < n:
        if quiet[i]:
            j = i
            while j < n and quiet[j]:
                j += 1
            L = (j - i) * 0.01
            if L > PAUSE + 0.12:
                cut0 = i * 0.01 + PAUSE / 2
                cut1 = j * 0.01 - PAUSE / 2
                keep.append((last, cut0))
                last = cut1
            i = j
        else:
            i += 1
    keep.append((last, len(x) / SR))
    xs, ys, acc = [], [], 0.0
    for a, b in keep:
        xs += [a, b]
        ys += [acc, acc + (b - a)]
        acc += b - a
    m = (np.array(xs), np.array(ys) / TEMPO, keep, x)
    _maps[tk] = m
    return m


def tmap(tk, t):
    xs, ys, _, _ = silence_map(tk)
    return float(np.interp(t, xs, ys))


def write_takes():
    """tight + tempo-stretched takes for the mixer"""
    os.makedirs(VO_DIR, exist_ok=True)
    for tk in TAKES:
        _, _, keep, x = silence_map(tk)
        parts = []
        xf = int(0.006 * SR)
        for a, b in keep:
            seg = x[int(a * SR):int(b * SR)].copy()
            if len(seg) > 2 * xf:
                seg[:xf] *= np.linspace(0, 1, xf)
                seg[-xf:] *= np.linspace(1, 0, xf)
            parts.append(seg)
        y = np.concatenate(parts).astype(np.float32)
        tmp = os.path.join(VO_DIR, tk + '_tight.f32')
        y.tofile(tmp)
        out = os.path.join(VO_DIR, tk + '.wav')
        flt = f'rubberband=tempo={TEMPO}:transients=mixed:pitchq=quality' if abs(TEMPO - 1) > 1e-3 else 'anull'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-i', tmp, '-af', flt,
                        '-c:a', 'pcm_f32le', out], check=True)
        os.remove(tmp)
        print('vo take', tk, f'{len(x) / SR:.1f}s -> {len(y) / SR / TEMPO:.1f}s')


NUM = {'0': 'zero', '1': 'one', '2': 'two', '3': 'three', '4': 'four', '5': 'five', '6': 'six', '7': 'seven', '8': 'eight', '9': 'nine'}


def norm(w):
    if '#' in w:
        return 'honey'          # the chat-filtered word (#####) is "honey" in the voiceover
    w = w.lower().replace('’', "'")
    w = re.sub(r"[^a-z0-9']", '', w)
    w = w.replace("'", '')
    return w


def toks(text):
    text = re.sub(r'\[[^\]]*\]', ' ', text)          # drop [tags]
    text = text.replace('—', ' ').replace('-', ' ').replace('…', ' ')
    return [t for t in (norm(x) for x in text.split()) if t]


# ---------------------------------------------------------------- 1. script lines with take timing
def load_script():
    lines = []
    for tk in TAKES:
        segs = json.load(open(os.path.join(HERE, 'segments', tk + '.json')))
        txt = [l for l in open(os.path.join(HERE, 'takes', tk + '.txt'), encoding='utf-8').read().splitlines() if re.match(r'^\d+:\d', l)]
        assert len(txt) == len(segs), (tk, len(txt), len(segs))
        for s, l in zip(segs, txt):
            m = re.match(r'^[\d:.]+\s*-\s*[\d:.]+\s+([A-Z]+):\s*(.*)$', l)
            sp, text = m.group(1), m.group(2)
            lines.append({'take': tk, 's0': tmap(tk, s['start_time_seconds']), 's1': tmap(tk, s['end_time_seconds']), 'sp': sp, 'text': text, 'toks': toks(text)})
    return lines


# ---------------------------------------------------------------- 2. word times for script tokens (whisper alignment)
def word_times(script):
    by_take = {}
    for i, L in enumerate(script):
        by_take.setdefault(L['take'], []).append(i)
    for tk, idxs in by_take.items():
        W = json.load(open(os.path.join(HERE, 'words', tk + '.json')))
        wt = []
        for (a, b, w, p) in W:
            a, b = tmap(tk, a), tmap(tk, b)
            for k, piece in enumerate(toks(w) or ['']):
                if piece:
                    wt.append((a, b, piece))
        stoks = [(i, j, t) for i in idxs for j, t in enumerate(script[i]['toks'])]
        sm = difflib.SequenceMatcher(None, [t for _, _, t in stoks], [t for _, _, t in wt], autojunk=False)
        match = {}
        for blk in sm.get_matching_blocks():
            for k in range(blk.size):
                match[blk.a + k] = blk.b + k
        # assign times; unmatched tokens interpolate within the line's segment bounds
        for i in idxs:
            L = script[i]
            n = len(L['toks'])
            L['wt'] = [None] * n
        for k, (i, j, t) in enumerate(stoks):
            if k in match:
                a, b, _ = wt[match[k]]
                L = script[i]
                # keep whisper times inside the dialogue segment (small tolerance)
                if L['s0'] - 0.35 <= a <= L['s1'] + 0.35:
                    L['wt'][j] = [max(a, L['s0'] - 0.05), min(b, L['s1'] + 0.05)]
        for i in idxs:
            L = script[i]
            n = len(L['toks'])
            if n == 0:
                continue
            w = np.array([max(2, len(t) + 1) for t in L['toks']], float)
            # anchors: known word starts; ends of segment
            known = [j for j in range(n) if L['wt'][j]]
            for j in range(n):
                if L['wt'][j]:
                    continue
                prev = max([k for k in known if k < j], default=None)
                nxt = min([k for k in known if k > j], default=None)
                t0 = L['wt'][prev][1] if prev is not None else L['s0']
                t1 = L['wt'][nxt][0] if nxt is not None else L['s1']
                lo = prev + 1 if prev is not None else 0
                hi = nxt if nxt is not None else n
                seg = w[lo:hi]
                c0 = seg[:j - lo].sum() / seg.sum()
                c1 = seg[:j - lo + 1].sum() / seg.sum()
                L['wt'][j] = [t0 + (t1 - t0) * c0, t0 + (t1 - t0) * c1]
            L['matched'] = len(known) / n
    return script


# ---------------------------------------------------------------- 3. animation lines -> script tokens
def map_anim(anim, script):
    stoks = [(i, j, t) for i, L in enumerate(script) for j, t in enumerate(L['toks'])]
    atoks = [(k, j, t) for k, A in enumerate(anim) for j, t in enumerate(toks(A['text']))]
    for A in anim:
        A['toks'] = toks(A['text'])
    sm = difflib.SequenceMatcher(None, [t for _, _, t in atoks], [t for _, _, t in stoks], autojunk=False)
    amap = {}
    for blk in sm.get_matching_blocks():
        for q in range(blk.size):
            amap[blk.a + q] = blk.b + q
    for k, A in enumerate(anim):
        A['src'] = [None] * len(A['toks'])
    for q, (k, j, t) in enumerate(atoks):
        if q in amap:
            anim[k]['src'][j] = stoks[amap[q]][:2]
    for A in anim:
        got = [s for s in A['src'] if s]
        A['cov'] = len(got) / max(1, len(A['toks']))
        if not got or A['cov'] < 0.34:
            A['vo'] = None
            continue
        i0, j0 = got[0]
        i1, j1 = got[-1]
        if script[i0]['take'] != script[i1]['take']:
            i1, j1 = i0, max(j for (ii, jj) in got if ii == i0)
        L0, L1 = script[i0], script[i1]
        t0, t1 = L0['wt'][j0][0], L1['wt'][j1][1]
        # word times for every anim token (interpolate the unmatched ones)
        wts = []
        for s in A['src']:
            wts.append(script[s[0]]['wt'][s[1]] if s and script[s[0]]['take'] == L0['take'] else None)
        n = len(wts)
        for j in range(n):
            if wts[j] is None:
                prev = max([k for k in range(j) if wts[k]], default=None)
                nxt = min([k for k in range(j + 1, n) if wts[k]], default=None)
                a = wts[prev][1] if prev is not None else t0
                b = wts[nxt][0] if nxt is not None else t1
                wts[j] = [a, max(a + 0.05, b)]
        A['vo'] = {'take': L0['take'], 't0': t0, 't1': t1, 'words': wts, 'sp': L0['sp']}
    return anim


# ---------------------------------------------------------------- 4. new timeline (warp)
def build_warp(anim):
    voiced = [A for A in anim if A['vo']]
    knots = [(0.0, 0.0)]
    S_prev, a_prev, end_prev, take_prev, t1_prev = 0.0, 0.0, 0.0, None, None
    place = []
    for A in voiced:
        v = A['vo']
        d = v['t1'] - v['t0']
        a = A['a']
        if take_prev == v['take'] and t1_prev is not None and v['t0'] >= t1_prev - 0.05:
            nat_gap = min(max(v['t0'] - t1_prev, 0.08), GAPCAP)
        else:
            nat_gap = 0.18
        S = max(S_prev + max(0.0, a - a_prev), end_prev + nat_gap)
        if a > knots[-1][1] + 0.01:
            knots.append((S, a))
        place.append({'mod': A['mod'], 'idx': A['idx'], 'sp': v['sp'], 'take': v['take'], 'in': v['t0'], 'out': v['t1'], 'start': S})
        A['S'] = S
        S_prev, a_prev, end_prev, take_prev, t1_prev = S, a, S + d, v['take'], v['t1']
    # tail: remaining animation after the last line plays at normal speed (make sure the last line fits)
    last_new, last_old = knots[-1]
    tail_old = OLD_END - last_old
    new_end = max(last_new + tail_old, end_prev + 1.0)
    knots.append((new_end, OLD_END))
    return knots, place


def warp_fn(knots):
    kn = np.array(knots)
    return (lambda t: np.interp(t, kn[:, 0], kn[:, 1])), (lambda t: np.interp(t, kn[:, 1], kn[:, 0]))


def main():
    script = word_times(load_script())
    anim = json.load(open(os.path.join(HERE, 'anim_lines.json')))
    anim = map_anim(anim, script)
    knots, place = build_warp(anim)
    w, wi = warp_fn(knots)
    lines = {}
    for A in anim:
        key = f"{A['mod']}:{A['idx']}"
        if A['vo']:
            S = A['S']
            off = S - A['vo']['t0']
            words = [[float(w(a + off)), float(w(b + off))] for a, b in A['vo']['words']]
            # per whitespace-token times, matching scenes/common.js words()
            raw = A['text'].split()
            wj, pos = [], 0
            for r in raw:
                c = len(toks(r.replace('*', '')))
                wj.append([words[pos][0], words[pos + c - 1][1]] if c else None)
                pos += c
            for j in range(len(wj)):
                if wj[j] is None:
                    prev = next((wj[k] for k in range(j - 1, -1, -1) if wj[k]), None)
                    nxt = next((wj[k] for k in range(j + 1, len(wj)) if wj[k]), None)
                    a0 = prev[1] if prev else float(w(S))
                    b0 = nxt[0] if nxt else a0 + 0.1
                    wj[j] = [a0, max(a0 + 0.02, b0)]
            lines[key] = {'a': float(w(S)), 'b': float(w(S + A['vo']['t1'] - A['vo']['t0'])), 'words': words, 'wordsJS': wj,
                          'key': f"{A['a']:.3f}|{A['sp']}|{A['text']}"}
    out = {'knots': [[round(a, 4), round(b, 4)] for a, b in knots], 'lines': lines, 'newEnd': knots[-1][0]}
    json.dump(out, open(os.path.join(ROOT, 'scenes', 'vo_timing.json'), 'w'))
    json.dump(place, open(os.path.join(HERE, 'placement.json'), 'w'), indent=1)
    # report
    kn = np.array(knots)
    slope = np.diff(kn[:, 1]) / np.maximum(np.diff(kn[:, 0]), 1e-6)
    dur_new = np.diff(kn[:, 0])
    print(f'new length {knots[-1][0]:.1f}s (old {OLD_END}s), voiced anim lines {sum(1 for A in anim if A["vo"])}/{len(anim)}')
    for lo, hi in [(0.95, 1.01), (0.8, 0.95), (0.6, 0.8), (0.4, 0.6), (0, 0.4)]:
        m = (slope >= lo) & (slope < hi)
        print(f'  picture speed {lo:.2f}-{hi:.2f}: {dur_new[m].sum():6.1f}s of new time')
    unv = [A for A in anim if not A['vo']]
    print('unvoiced anim lines:', len(unv))
    for A in unv[:40]:
        print('   ', A['mod'], A['a'], A['sp'], A['text'][:60], f"cov={A.get('cov', 0):.2f}")
    used = {(p['take'], round(p['in'], 2)) for p in place}
    low = [L for L in script if L.get('matched', 1) < 0.5]
    print('script lines with weak whisper match:', len(low))
    for L in low[:15]:
        print('   ', L['take'], L['sp'], L['text'][:70], f"{L.get('matched', 0):.2f}")


if __name__ == '__main__':
    main()
    if '--write' in sys.argv:
        write_takes()
