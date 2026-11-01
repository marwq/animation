#!/usr/bin/env python3
"""Mix the soundtrack from the cue sheets: music (audio/music.py) + SFX/footsteps/ambience (assets/sfx).

usage:
  python3 audio/mix.py                     # whole video -> out/audio/{music,sfx,amb,mix}.wav
  python3 audio/mix.py --from 0 --to 61    # a range (preview)
  python3 audio/mix.py --vo vo.wav         # later: duck music/ambience under the voiceover and add it
  python3 audio/mix.py --mux               # also mux into out/whatif_full_sound.mp4 (video stream copied)
"""
import argparse, glob, json, os, subprocess, sys, zlib
import numpy as np
from scipy import signal, ndimage
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from dsp import *  # noqa
import music

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
LIB = os.path.join(ROOT, 'assets', 'sfx')
OUTD = os.path.join(ROOT, 'out', 'audio')
VIDEO_LEN = 771.0
VO_TIMING = os.path.join(ROOT, 'scenes', 'vo_timing.json')
PLACEMENT = os.path.join(ROOT, 'voice', 'placement.json')
VO_TAKES = os.path.join(OUTD, 'vo_takes')
VO_LUFS = -10.0          # voice level inside the mix (before the final loudness normalisation): +6 dB over v1

AMB_REF_DB = -22.0      # ambience gain_db 0 -> this RMS level
MUSIC_BUS_DB = 2.0
SFX_BUS_DB = 2.5
AMB_BUS_DB = 0.0

_cache = {}


def lib(name):
    if name not in _cache:
        fs = sorted(glob.glob(os.path.join(LIB, f'{name}.ogg')) + glob.glob(os.path.join(LIB, f'{name}.[0-9]*.ogg')))
        if not fs:
            raise KeyError(name)
        _cache[name] = [load(f) for f in fs]
    return _cache[name]


def amb_lib(name):
    k = 'amb:' + name
    if k not in _cache:
        _cache[k] = load(os.path.join(LIB, 'amb', f'{name}.ogg'))
    return _cache[k]


def add(buf, x, t, a0):
    """add stereo x into buf at absolute time t (buf starts at a0)"""
    i = int(round((t - a0) * SR))
    if i >= len(buf) or i + len(x) <= 0:
        return
    s0 = max(0, -i)
    n = min(len(x) - s0, len(buf) - (i + s0))
    if n > 0:
        buf[i + s0:i + s0 + n] += x[s0:s0 + n]


def pick(name, t):
    vs = lib(name)
    return vs[zlib.crc32(f'{name}{t:.3f}'.encode()) % len(vs)]


def balance(x, pan):
    if not pan:
        return x
    a = (pan + 1) * np.pi / 4
    return x * np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)


# ---------------------------------------------------------------- music
def tape_stop(x, d):
    n = min(len(x), int(d * SR))
    head, tail = x[:-n], x[-n:]
    rate = np.linspace(1, 0, n) ** 1.6
    pos = np.cumsum(rate)
    y = np.stack([np.interp(pos, np.arange(n), tail[:, c]) for c in range(2)], 1)
    y *= np.linspace(1, 0.0, n)[:, None] ** 0.5
    return np.concatenate([head, y])


def scratch_out(x, d=0.32):
    n = min(len(x), int(d * SR))
    src = x[-n - int(0.4 * SR):-n] if len(x) > n + int(0.4 * SR) else x[:max(1, len(x) - n)]
    t = np.arange(n) / SR
    rate = np.interp(t, [0, d * 0.3, d * 0.6, d], [1, -3, 2.5, -5])
    y = varispeed(src, rate)
    y = fit(y, n) * np.linspace(1, 0, n)[:, None]
    return np.concatenate([x[:-n], y])


def _prerender(args):
    mood, dur, energy, sting, seed = args
    music.render_segment(mood, dur, energy, sting=sting, seed=seed)
    return mood


def prerender(segs, a0, a1, workers=4):
    from concurrent.futures import ProcessPoolExecutor
    jobs = [(s['mood'], s['end'] - s['start'], s.get('energy', 0.6), s.get('out', 'cut') == 'sting', int(s['start'] * 10))
            for s in segs if s['mood'] != 'silence' and s['end'] > a0 and s['start'] < a1]
    with ProcessPoolExecutor(workers) as ex:
        for i, _ in enumerate(ex.map(_prerender, jobs)):
            if i % 20 == 0:
                print(f'music {i}/{len(jobs)}', flush=True)


def music_track(segs, a0, a1):
    buf = np.zeros((int((a1 - a0 + 6) * SR), 2), np.float32)
    for i, s in enumerate(segs):
        if s['end'] <= a0 or s['start'] >= a1 or s['mood'] == 'silence':
            continue
        dur = s['end'] - s['start']
        out, inn = s.get('out', 'cut'), s.get('in', 'cut')
        x = music.render_segment(s['mood'], dur, s.get('energy', 0.6), sting=(out == 'sting'), seed=int(s['start'] * 10))
        x = x.copy()
        n_main = int(round(dur * SR))
        fin = {'cut': 0.012, 'fade': min(1.0, dur / 3), 'swell': min(2.0, dur / 2)}[inn]
        k = int(fin * SR)
        if k:
            x[:k] *= (np.linspace(0, 1, k) ** (2 if inn == 'swell' else 1))[:, None]
        if out == 'cut':
            x = x[:n_main]
            x = fade(x, 0, min(0.03, dur / 4))
        elif out == 'fade':
            x = x[:n_main]
            x = fade(x, 0, min(1.6, dur / 2.5))
        elif out == 'tapestop':
            x = tape_stop(x[:n_main], min(0.9, dur / 2))
        elif out == 'scratch':
            x = scratch_out(x[:n_main], min(0.32, dur / 3))
        elif out == 'sting':
            x = fade(x, 0, 0.6)
        add(buf, x * db(MUSIC_BUS_DB), s['start'], a0)
    return buf


# ---------------------------------------------------------------- ambience / footsteps / sfx
def amb_track(beds, a0, a1):
    buf = np.zeros((int((a1 - a0 + 6) * SR), 2), np.float32)
    for b in beds:
        if b['end'] <= a0 or b['start'] >= a1:
            continue
        src = amb_lib(b['name'])
        d = b['end'] - b['start']
        n = int(d * SR)
        # loop with 1 s crossfades, random start offset
        off = zlib.crc32(f"{b['name']}{b['start']}".encode()) % max(1, len(src) - SR)
        y = np.zeros((n, 2), np.float32)
        pos, w = 0, 0
        xf = SR
        cur = off
        while pos < n:
            take = min(len(src) - cur, n - pos)
            chunk = src[cur:cur + take].copy()
            if pos > 0:
                k = min(xf, len(chunk))
                chunk[:k] *= np.linspace(0, 1, k)[:, None]
                y[pos - k:pos] *= 1  # previous tail already faded below
            y[pos:pos + take] += chunk
            pos += take
            cur = 0
            if pos < n:
                k = min(xf, take)
                y[pos - k:pos] *= np.linspace(1, 0, k)[:, None]
                pos -= k  # overlap
        g = db(AMB_REF_DB + 30 + b.get('gain_db', 0))   # files are stored at -30 dBFS RMS
        y = fade(y * g, min(0.8, d / 3), min(0.8, d / 3))
        add(buf, y * db(AMB_BUS_DB), b['start'], a0)
    return buf


SURF = {'hard': 'step', 'soft': 'step_soft', 'wood': 'step_wood'}


def sfx_track(sfx, steps, a0, a1):
    buf = np.zeros((int((a1 - a0 + 8) * SR), 2), np.float32)
    r = np.random.default_rng(99)
    for f in steps:
        if f['end'] <= a0 or f['start'] >= a1:
            continue
        name = SURF.get(f.get('surface', 'hard'), 'step')
        vs = lib(name)
        times = f.get('times')
        if times is None:
            times, t = [], f['start']
            while t < f['end'] - 1e-6:
                times.append(t)
                t += f['interval']
        for i, t in enumerate(times):
            x = vs[i % len(vs)]
            x = speed(x, r.uniform(0.94, 1.06))
            g = db(f.get('gain_db', -8) + r.uniform(-2, 1))
            add(buf, balance(x * g, f.get('pan', 0) + (0.05 if i % 2 else -0.05)), t + r.uniform(-0.008, 0.008), a0)
    for e in sfx:
        t, name = e[0], e[1]
        if t >= a1 or t < a0 - 8:
            continue
        g = e[2] if len(e) > 2 else 0
        pan = e[3] if len(e) > 3 else 0
        x = pick(name, t)
        add(buf, balance(x * db(g), pan) * db(SFX_BUS_DB), t, a0)
    return buf


# ---------------------------------------------------------------- dynamics
def envelope_follow(x, att=0.005, rel=0.12):
    m = np.abs(mono(x))
    a = np.exp(-1 / (att * SR))
    r_ = np.exp(-1 / (rel * SR))
    # fast peak follower via max filter + one-pole release
    pk = ndimage.maximum_filter1d(m, int(att * SR) + 1)
    return signal.lfilter([1 - r_], [1, -r_], pk)


def duck(music_bus, key, depth_db=-9, thresh_db=-34, att=0.08, rel=0.45):
    """sidechain ducking of music_bus by key (e.g. voiceover)"""
    k = np.abs(mono(key))
    w = int(0.03 * SR)
    lvl = np.sqrt(np.convolve(k ** 2, np.ones(w) / w, 'same') + 1e-12)
    on = (20 * np.log10(lvl) > thresh_db).astype(float)
    on = ndimage.maximum_filter1d(on, int(0.25 * SR))  # bridge small gaps between words
    a, r_ = np.exp(-1 / (att * SR)), np.exp(-1 / (rel * SR))
    g = np.empty_like(on)
    s_ = 0.0
    for i in range(0, len(on), 64):
        tgt = on[i]
        c = a if tgt > s_ else r_
        s_ = tgt + (s_ - tgt) * c ** 64
        g[i:i + 64] = s_
    gain = db(depth_db * g)
    return music_bus * gain[:len(music_bus), None]


def compress(x, thresh_db=-30.0, ratio=2.6, att=0.006, rel=0.18):
    """feed-forward RMS compressor (evens out quiet words vs shouts)"""
    m = mono(x)
    w = int(0.01 * SR)
    lvl = 10 * np.log10(np.convolve(m ** 2, np.ones(w) / w, 'same') + 1e-12)
    gr = np.maximum(0.0, lvl - thresh_db) * (1 - 1 / ratio)
    a, r_ = np.exp(-64 / (att * SR)), np.exp(-64 / (rel * SR))
    g = np.empty_like(gr)
    s_ = 0.0
    for i in range(0, len(gr), 64):
        tgt = gr[i:i + 64].max()
        s_ = tgt + (s_ - tgt) * (a if tgt > s_ else r_)
        g[i:i + 64] = s_
    return x * db(-g)[:, None] if x.ndim == 2 else x * db(-g)


def limiter(x, ceiling_db=-1.0, look=0.004, rel=0.08):
    c = db(ceiling_db)
    pk = ndimage.maximum_filter1d(np.abs(x).max(1), int(2 * look * SR) + 1)
    g = np.minimum(1.0, c / np.maximum(pk, 1e-9))
    # smooth: instant attack (min filter), exponential release
    g = ndimage.minimum_filter1d(g, int(look * SR) + 1)
    r_ = np.exp(-1 / (rel * SR))
    gs = signal.lfilter([1 - r_], [1, -r_], g - 1) + 1
    gs = np.minimum(gs, g)
    d = int(look * SR)
    y = np.concatenate([x[d:], np.zeros((d, 2))]) * gs[:, None]
    return np.concatenate([np.zeros((d, 2)), y[:-d]]) if d else y


def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
    lines = [l for l in r.stderr.splitlines() if l.strip().startswith('I:')]
    return float(lines[-1].split()[1])


# ---------------------------------------------------------------- main
def warp():
    """old (animation) time -> new (voice-fitted) time; identity when there is no voiceover fit"""
    if os.environ.get('NO_VO') or not os.path.exists(VO_TIMING):
        return None
    kn = np.array(json.load(open(VO_TIMING))['knots'])
    def f(t):
        t = np.asarray(t, float)
        return np.where(t > kn[-1, 1], kn[-1, 0] + (t - kn[-1, 1]), np.interp(t, kn[:, 1], kn[:, 0]))
    return f


def load_cues(W=None):
    parts = [json.load(open(p)) for p in sorted(glob.glob(os.path.join(HERE, 'cues', 'part*.json')))]
    segs, beds, steps, sfx = [], [], [], []
    for p in parts:
        segs += [dict(x) for x in p['music']]
        beds += [dict(x) for x in p.get('ambience', [])]
        steps += [dict(x) for x in p.get('footsteps', [])]
        sfx += [list(x) for x in p.get('sfx', [])]
    if W is not None:
        m = lambda t: float(W(t))
        for x in segs + beds:
            x['start'], x['end'] = round(m(x['start']), 4), round(m(x['end']), 4)
        for f in steps:
            ts, t = [], f['start']
            while t < f['end'] - 1e-6:
                ts.append(m(t))
                t += f['interval']
            f['times'] = ts
            f['start'], f['end'] = m(f['start']), m(f['end'])
        for e in sfx:
            e[0] = m(e[0])
        for p in parts:
            p['start'], p['end'] = m(p['start']), m(p['end'])
    segs.sort(key=lambda s: s['start'])
    return parts, segs, beds, steps, sfx


def vo_track(n, a0, W):
    """the voiceover on the new timeline (mono centre), with the chat-filter bleeps; returns (stereo, bleep spans)"""
    place = json.load(open(PLACEMENT))
    timing = json.load(open(VO_TIMING))
    takes = {}
    by_take = {}
    for p in place:
        by_take.setdefault(p['take'], []).append(p)
    for v in by_take.values():
        v.sort(key=lambda p: p['in'])
    buf = np.zeros(n + SR * 2, np.float32)
    for p in place:
        tk = p['take']
        if tk not in takes:
            takes[tk] = load(os.path.join(VO_TAKES, tk + '.wav'), stereo=False)
        x = takes[tk]
        seq = by_take[tk]
        k = seq.index(p)
        pre, post = 0.05, 0.18
        if k + 1 < len(seq) and seq[k + 1]['in'] > p['out'] - 0.02:
            post = max(0.02, min(post, seq[k + 1]['in'] - p['out'] - 0.04))
        if k > 0 and seq[k - 1]['out'] < p['in'] + 0.02:
            pre = max(0.01, min(pre, p['in'] - seq[k - 1]['out'] - 0.03))
        i0, i1 = int((p['in'] - pre) * SR), int((p['out'] + post) * SR)
        clip = fade(x[max(0, i0):i1].copy(), 0.008, 0.03)
        j = int(round((p['start'] - pre - a0) * SR))
        if j < 0:
            clip, j = clip[-j:], 0
        m = min(len(clip), len(buf) - j)
        if m > 0:
            buf[j:j + m] += clip[:m]
    # bleeps over the filtered word ("#####" in the captions)
    bleeps = []
    kn = np.array(timing['knots'])
    for key, o in timing['lines'].items():
        toks_ = o['key'].split('|', 2)[2].split()
        for j, w in enumerate(toks_):
            if '#' in w and j < len(o['wordsJS']):
                t0, t1 = [float(W(v)) for v in o['wordsJS'][j]]
                bleeps.append((t0 - 0.03, t1 + 0.05))
    for t0, t1 in bleeps:
        i0, i1 = int((t0 - a0) * SR), int((t1 - a0) * SR)
        if i1 <= 0 or i0 >= len(buf):
            continue
        i0, i1 = max(0, i0), min(len(buf), i1)
        seg = buf[i0:i1]
        lvl = np.sqrt((seg ** 2).mean() + 1e-12)
        buf[i0:i1] = 0
        L = i1 - i0
        tone = np.sin(2 * np.pi * 1000 * np.arange(L) / SR) * max(lvl * 1.2, 0.05)
        buf[i0:i1] = fade(tone.astype(np.float32), 0.004, 0.006)
    vo = hp(buf[:n], 70)
    vo = compress(vo)
    vo = peq(vo, 3200, 2.5, 0.8)          # a little presence so the voice cuts through
    return st(vo), bleeps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--from', dest='a0', type=float, default=0.0)
    ap.add_argument('--to', dest='a1', type=float, default=1e9)
    ap.add_argument('--vo', default=None)
    ap.add_argument('--mux', action='store_true')
    ap.add_argument('--target', type=float, default=-13.3, help='integrated LUFS of the final mix')
    ap.add_argument('--name', default=None)
    ap.add_argument('--video', default=None, help='video to mux with (default out/whatif_full.mp4)')
    ap.add_argument('--out', default=None)
    a = ap.parse_args()
    os.makedirs(OUTD, exist_ok=True)
    W = warp()
    parts, segs, beds, steps, sfx = load_cues(W)
    total_len = float(W(VIDEO_LEN)) if W is not None else VIDEO_LEN
    a0, a1 = a.a0, min(a.a1, total_len)
    print(f'timeline {total_len:.2f}s ({"voice-fitted" if W is not None else "original"}), mixing {a0}-{a1}')
    n = int(round((a1 - a0) * SR))
    vo = None
    if W is not None:
        vo, bleeps = vo_track(n, a0, W)
        # the bleeps now come from the voice itself: drop the cue-sheet censor tones near them
        sfx = [e for e in sfx if not (e[1] == 'censor_bleep' and any(abs(e[0] - b0) < 2.5 for b0, _ in bleeps))]
        tmpv = os.path.join(OUTD, 'vo_tmp.wav')
        save(tmpv, vo, 'f32')
        vo = vo * db(VO_LUFS - lufs(tmpv))
        os.remove(tmpv)
    prerender(segs, a0, a1)
    mus = music_track(segs, a0, a1)[:n]
    amb = amb_track(beds, a0, a1)[:n]
    fx = sfx_track(sfx, steps, a0, a1)[:n]
    if vo is not None:
        mus = duck(mus, vo, -9, thresh_db=-40)
        amb = duck(amb, vo, -5, thresh_db=-40)
        fx = duck(fx * db(-4), vo, -3, thresh_db=-40)
        total = mus + amb + fx + vo
    else:
        total = mus + amb + fx
    tag = a.name or ('full' if (a0 == 0 and a1 >= total_len - 1e-6) else f'{a0:g}-{a1:g}')
    tmp = os.path.join(OUTD, f'pre_{tag}.wav')
    save(tmp, np.clip(total, -4, 4), 'f32')
    L = lufs(tmp)
    g = db(a.target - L)
    out = limiter(total * g, -1.8)
    path = os.path.join(OUTD, f'mix_{tag}.wav')
    save(path, out)
    for nm, b in (('music', mus), ('sfx', fx), ('amb', amb)) + ((('vo', vo),) if vo is not None else ()):
        save(os.path.join(OUTD, f'stem_{nm}_{tag}.wav'), np.clip(b * g, -1, 1))
    os.remove(tmp)
    print(f'mix {path}: pre-gain LUFS {L:.1f} -> target {a.target}, final LUFS {lufs(path):.1f}')
    if a.mux:
        vid = a.video or os.path.join(ROOT, 'out', 'whatif_full.mp4')
        mp4 = a.out or os.path.join(ROOT, 'out', 'whatif_full_sound.mp4' if tag == 'full' else f'preview_{tag}.mp4')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a0), '-t', str(a1 - a0), '-i', vid, '-i', path,
                        '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy' if a0 == 0 else 'libx264',
                        *([] if a0 == 0 else ['-crf', '18', '-preset', 'fast']),
                        '-c:a', 'aac', '-b:a', '256k', '-shortest', '-movflags', '+faststart', mp4], check=True)
        print('muxed', mp4)


if __name__ == '__main__':
    main()
