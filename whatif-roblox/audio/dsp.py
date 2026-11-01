"""Small DSP toolkit shared by the SFX library builder, the music engine and the mixer.

All buffers are float32 numpy arrays at 48 kHz: mono = shape (n,), stereo = shape (n, 2).
"""
import os, subprocess, tempfile
import numpy as np
from scipy import signal

SR = 48000
SF2 = '/usr/share/sounds/sf2/FluidR3_GM.sf2'


# ---------- io ----------
def load(path, stereo=True):
    ch = '2' if stereo else '1'
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', ch, '-ar', str(SR), '-'],
                       capture_output=True, check=True)
    x = np.frombuffer(r.stdout, np.float32).copy()
    return x.reshape(-1, 2) if stereo else x


def save(path, x, fmt=None):
    x = st(x)
    os.makedirs(os.path.dirname(path) or '.', exist_ok=True)
    args = ['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-i', '-']
    if path.endswith('.ogg'):
        args += ['-c:a', 'libvorbis', '-q:a', '6']
    elif path.endswith('.wav'):
        args += ['-c:a', 'pcm_s16le' if fmt != 'f32' else 'pcm_f32le']
    elif path.endswith('.flac'):
        args += ['-c:a', 'flac']
    args.append(path)
    subprocess.run(args, input=np.ascontiguousarray(x, np.float32).tobytes(), check=True)


# ---------- shape helpers ----------
def st(x, pan=0.0):
    """mono -> stereo (constant-power pan), stereo passes through (pan applied as balance)."""
    if x.ndim == 1:
        a = (pan + 1) * np.pi / 4
        return np.stack([x * np.cos(a), x * np.sin(a)], 1) * np.sqrt(2)
    if pan:
        a = (pan + 1) * np.pi / 4
        return x * np.array([np.cos(a), np.sin(a)]) * np.sqrt(2)
    return x


def mono(x):
    return x.mean(1) if x.ndim == 2 else x


def t_(d):
    return np.arange(int(round(d * SR))) / SR


def silence(d, stereo=False):
    n = int(round(d * SR))
    return np.zeros((n, 2) if stereo else n, np.float32)


def fit(x, n):
    """pad / cut to n samples"""
    if len(x) >= n:
        return x[:n]
    pad = np.zeros((n - len(x),) + x.shape[1:], x.dtype)
    return np.concatenate([x, pad])


def mix(*parts):
    """mix (buffer, offset_seconds, gain) tuples or plain buffers; result is stereo if any input is."""
    items = [(p, 0.0, 1.0) if isinstance(p, np.ndarray) else (p + (1.0,))[:3] for p in parts]
    stereo = any(b.ndim == 2 for b, _, _ in items)
    n = max(int(round(o * SR)) + len(b) for b, o, _ in items)
    out = np.zeros((n, 2) if stereo else n, np.float32)
    for b, o, g in items:
        if stereo:
            b = st(b)
        i = int(round(o * SR))
        out[i:i + len(b)] += b * g
    return out


def cat(*parts):
    return mix(*[(p, sum(len(q) for q in parts[:i]) / SR, 1.0) for i, p in enumerate(parts)])


def norm(x, peak=0.89):
    m = np.abs(x).max()
    return x * (peak / m) if m > 1e-9 else x


def db(g):
    return 10 ** (g / 20)


def fade(x, fin=0.003, fout=0.01):
    x = x.copy()
    a, b = min(int(fin * SR), len(x) // 2), min(int(fout * SR), len(x) // 2)
    if a:
        ramp = np.linspace(0, 1, a)
        x[:a] *= ramp[:, None] if x.ndim == 2 else ramp
    if b:
        ramp = np.linspace(1, 0, b)
        x[-b:] *= ramp[:, None] if x.ndim == 2 else ramp
    return x


def trim(x, thresh=0.01, pre=0.004, post=0.05):
    m = np.abs(mono(x))
    idx = np.where(m > thresh * m.max())[0]
    if not len(idx):
        return x
    a = max(0, idx[0] - int(pre * SR))
    b = min(len(x), idx[-1] + int(post * SR))
    return fade(x[a:b], 0.002, min(0.03, (b - a) / SR / 3))


def env_exp(d, tau, attack=0.002):
    t = t_(d)
    e = np.exp(-t / tau)
    if attack > 0:
        e *= np.clip(t / attack, 0, 1)
    return e


def env_ar(d, a, r, curve=2.0):
    """attack to peak at a, release over r, sustain between"""
    t = t_(d)
    e = np.ones_like(t)
    e = np.where(t < a, (t / max(a, 1e-6)) ** curve, e)
    e = np.where(t > d - r, np.clip((d - t) / max(r, 1e-6), 0, 1) ** curve, e)
    return e


def env_pts(d, pts):
    """piecewise-linear envelope through (time, value) points"""
    t = t_(d)
    tt, vv = zip(*pts)
    return np.interp(t, tt, vv)


# ---------- oscillators ----------
def phase(freq, d):
    f = np.broadcast_to(np.asarray(freq, float), (int(round(d * SR)),)) if np.ndim(freq) == 0 else np.asarray(freq, float)
    return 2 * np.pi * np.cumsum(f) / SR


def sine(freq, d):
    return np.sin(phase(freq, d))


def tri(freq, d):
    return signal.sawtooth(phase(freq, d), 0.5)


def saw(freq, d):
    return signal.sawtooth(phase(freq, d))


def square(freq, d, duty=0.5):
    return signal.square(phase(freq, d), duty)


def noise(d, seed=0, color='white'):
    rng = np.random.default_rng(seed)
    x = rng.standard_normal(int(round(d * SR)))
    if color == 'pink':
        b, a = [0.049922035, -0.095993537, 0.050612699, -0.004408786], [1, -2.494956002, 2.017265875, -0.522189400]
        x = signal.lfilter(b, a, x) * 8
    elif color == 'brown':
        x = np.cumsum(x)
        x = signal.lfilter([1, -1], [1, -0.995], x) / 30
    return x / max(np.abs(x).max(), 1e-9)


def glide(f0, f1, d, curve='exp'):
    t = t_(d) / d
    return f0 * (f1 / f0) ** t if curve == 'exp' else f0 + (f1 - f0) * t


# ---------- filters ----------
def _sos(kind, f, order=2):
    f = np.atleast_1d(np.clip(np.asarray(f, float), 10, SR / 2 - 100))
    return signal.butter(order, f if len(f) > 1 else f[0], btype=kind, fs=SR, output='sos')


def lp(x, f, order=2):
    return signal.sosfilt(_sos('low', f, order), x, axis=0)


def hp(x, f, order=2):
    return signal.sosfilt(_sos('high', f, order), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(_sos('band', [lo, hi], order), x, axis=0)


def svf(x, fc, q=2.0, mode='bp'):
    """time-varying state-variable filter; fc can be an array (Hz per sample)"""
    n = len(x)
    fc = np.broadcast_to(np.asarray(fc, float), (n,))
    g = np.tan(np.pi * np.clip(fc, 20, SR * 0.45) / SR)
    k = 1.0 / q
    a1 = 1 / (1 + g * (g + k))
    a2 = g * a1
    a3 = g * a2
    ic1 = ic2 = 0.0
    out = np.empty(n)
    xs = np.asarray(x, float)
    sel = {'lp': 0, 'bp': 1, 'hp': 2}[mode]
    for i in range(n):
        v3 = xs[i] - ic2
        v1 = a1[i] * ic1 + a2[i] * v3
        v2 = ic2 + a2[i] * ic1 + a3[i] * v3
        ic1 = 2 * v1 - ic1
        ic2 = 2 * v2 - ic2
        out[i] = v2 if sel == 0 else (v1 if sel == 1 else xs[i] - k * v1 - v2)
    return out


def peq(x, f, gain_db, q=1.0):
    """peaking EQ (RBJ biquad)"""
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f / SR
    al = np.sin(w) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w), 1 - al * A]
    a = [1 + al / A, -2 * np.cos(w), 1 - al / A]
    return signal.lfilter(b, a, x, axis=0)


def shelf(x, f, gain_db, kind='high'):
    A = 10 ** (gain_db / 40)
    w = 2 * np.pi * f / SR
    al = np.sin(w) / 2 * np.sqrt(2)
    c = np.cos(w)
    sA = 2 * np.sqrt(A) * al
    if kind == 'high':
        b = [A * ((A + 1) + (A - 1) * c + sA), -2 * A * ((A - 1) + (A + 1) * c), A * ((A + 1) + (A - 1) * c - sA)]
        a = [(A + 1) - (A - 1) * c + sA, 2 * ((A - 1) - (A + 1) * c), (A + 1) - (A - 1) * c - sA]
    else:
        b = [A * ((A + 1) - (A - 1) * c + sA), 2 * A * ((A - 1) - (A + 1) * c), A * ((A + 1) - (A - 1) * c - sA)]
        a = [(A + 1) + (A - 1) * c + sA, -2 * ((A - 1) + (A + 1) * c), (A + 1) + (A - 1) * c - sA]
    return signal.lfilter(b, a, x, axis=0)


def drive(x, amt=2.0):
    return np.tanh(x * amt) / np.tanh(amt)


def crush(x, bits=6, down=4):
    y = np.round(x * 2 ** (bits - 1)) / 2 ** (bits - 1)
    if down > 1:
        y = np.repeat(y[::down], down, axis=0)[:len(x)]
    return y


# ---------- time / pitch ----------
def speed(x, ratio):
    """resample-based pitch+speed change (ratio > 1 = higher & shorter)"""
    n = int(len(x) / ratio)
    src = np.arange(n) * ratio
    if x.ndim == 2:
        return np.stack([np.interp(src, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    return np.interp(src, np.arange(len(x)), x)


def varispeed(x, rate):
    """play x with a time-varying playback rate array (can go negative); output len = len(rate)"""
    pos = np.cumsum(rate)
    pos = np.clip(pos, 0, len(x) - 1)
    if x.ndim == 2:
        return np.stack([np.interp(pos, np.arange(len(x)), x[:, c]) for c in range(2)], 1)
    return np.interp(pos, np.arange(len(x)), x)


# ---------- space ----------
_IR = {}


def _ir(rt, seed, bright):
    key = (rt, seed, bright)
    if key not in _IR:
        n = int(rt * SR)
        t = np.arange(n) / SR
        rng = np.random.default_rng(seed)
        e = np.exp(-6.9 * t / rt)
        L = rng.standard_normal(n) * e
        R = rng.standard_normal(n) * e
        if bright < 1:
            L = lp(L, 2000 + 9000 * bright)
            R = lp(R, 2000 + 9000 * bright)
        pre = int(0.012 * SR)
        ir = np.zeros((n + pre, 2))
        ir[pre:, 0], ir[pre:, 1] = L, R
        _IR[key] = ir / np.sqrt((ir ** 2).sum() / 2)
    return _IR[key]


def reverb(x, rt=1.2, wet=0.25, bright=0.6, seed=7):
    """convolution reverb with a synthetic stereo IR; returns stereo, tail included"""
    xs = st(x)
    ir = _ir(rt, seed, bright)
    L = signal.fftconvolve(xs[:, 0], ir[:, 0])
    R = signal.fftconvolve(xs[:, 1], ir[:, 1])
    w = np.stack([L, R], 1) * 0.35
    dry = np.zeros_like(w)
    dry[:len(xs)] = xs
    return dry * (1 - wet * 0.5) + w * wet


def reverb_wet(x, rt=1.8, bright=0.55, seed=7):
    """only the reverberated signal (no dry)"""
    xs = st(x)
    ir = _ir(rt, seed, bright)
    return np.stack([signal.fftconvolve(xs[:, 0], ir[:, 0]), signal.fftconvolve(xs[:, 1], ir[:, 1])], 1) * 0.35


def widen(x, amt=0.3, ms=0.012):
    """haas-ish stereo widening of a mono/stereo source"""
    m = mono(x)
    d = int(ms * SR)
    L = m
    R = np.concatenate([np.zeros(d), m[:-d]]) if d else m
    return np.stack([L * (1 - amt * 0.3) + R * amt * 0.3, R * (1 - amt * 0.3) + L * amt * 0.3], 1)


def autopan(x, rate=0.5, depth=0.8, start=-1.0):
    """sweep pan from start across, (rate in Hz of sin) — or linear if rate == 0"""
    m = mono(x)
    t = np.arange(len(m)) / SR
    if rate == 0:
        p = np.linspace(start, -start, len(m)) * depth
    else:
        p = np.sin(2 * np.pi * rate * t) * depth
    a = (p + 1) * np.pi / 4
    return np.stack([m * np.cos(a), m * np.sin(a)], 1) * np.sqrt(2)


# ---------- fluidsynth ----------
def render_midi(mid, gain=0.6, reverb_on=True):
    """render a mido.MidiFile with FluidR3 GM; returns stereo float buffer"""
    with tempfile.TemporaryDirectory() as d:
        mp, wp = os.path.join(d, 'x.mid'), os.path.join(d, 'x.wav')
        mid.save(mp)
        args = ['fluidsynth', '-ni', '-q', '-g', str(gain), '-r', str(SR), '-o', 'synth.polyphony=512']
        if not reverb_on:
            args += ['-R', '0', '-C', '0']
        subprocess.run(args + ['-F', wp, SF2, mp], check=True, capture_output=True)
        return load(wp)


def notes_midi(events, bpm=120, programs=None, tpb=480, bends=None):
    """events: list of (start_beats, dur_beats, midi_note, velocity, channel).
    programs: {channel: gm_program}; channel 9 = drums. bends: list of (beat, channel, value -8192..8191)."""
    import mido
    mid = mido.MidiFile(ticks_per_beat=tpb)
    tr = mido.MidiTrack()
    mid.tracks.append(tr)
    msgs = [(0, mido.MetaMessage('set_tempo', tempo=mido.bpm2tempo(bpm)))]
    for ch, prog in (programs or {}).items():
        if ch != 9:
            msgs.append((0, mido.Message('program_change', program=prog, channel=ch)))
    for (s, d, n, v, ch) in events:
        a = int(round(s * tpb))
        b = int(round((s + d) * tpb))
        msgs.append((a, mido.Message('note_on', note=int(n), velocity=int(v), channel=ch)))
        msgs.append((max(b, a + 1), mido.Message('note_off', note=int(n), velocity=0, channel=ch)))
    for (s, ch, val) in (bends or []):
        msgs.append((int(round(s * tpb)), mido.Message('pitchwheel', pitch=int(val), channel=ch)))
    # note_off before note_on at equal ticks
    msgs.sort(key=lambda m: (m[0], 0 if m[1].type in ('set_tempo', 'program_change') else (1 if m[1].type == 'note_off' else 2)))
    last = 0
    for tick, m in msgs:
        m.time = tick - last
        last = tick
        tr.append(m)
    return mid
