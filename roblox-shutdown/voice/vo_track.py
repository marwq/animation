#!/usr/bin/env python3
"""Assemble the full voice track from scenes/timeline.json: each line's slice of its take, placed at its global start.
-> out/audio/vo.wav (48 kHz mono), takes sped up by timeline['speed'] with atempo (pitch kept)"""
import json, os, subprocess
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SR = 48000


def load(path, speed=1.0):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-af', f'atempo={speed}', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32)


def main():
    tl = json.load(open(os.path.join(ROOT, 'scenes', 'timeline.json')))
    out = np.zeros(int((tl['duration'] + 1) * SR), np.float32)
    cache = {}
    for l in tl['lines']:
        tk = l['take']
        if tk not in cache:
            cache[tk] = load(os.path.join(HERE, 'takes', f'take{tk}.mp3'), tl.get('speed', 1.0))
        x = cache[tk]
        a, b = l['clip']
        seg = x[int(a * SR):int(b * SR)].copy()
        n = min(len(seg), int(0.004 * SR))
        if n:
            seg[:n] *= np.linspace(0, 1, n); seg[-n:] *= np.linspace(1, 0, n)
        i = int(round(l['start'] * SR))
        out[i:i + len(seg)] += seg[:len(out) - i]
    os.makedirs(os.path.join(ROOT, 'out', 'audio'), exist_ok=True)
    p = os.path.join(ROOT, 'out', 'audio', 'vo.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-i', '-', '-c:a', 'pcm_s16le', p], input=out[:int(tl['duration'] * SR)].tobytes(), check=True)
    print('wrote', p, f'{tl["duration"]:.2f}s')


if __name__ == '__main__':
    main()
