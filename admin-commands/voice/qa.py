#!/usr/bin/env python3
"""QA a generated take: transcribe with faster-whisper and compare each line with the script.
usage: python3 voice/qa.py take01 [take02 ...]   -> prints per-line match ratio, flags < 0.75"""
import difflib, json, os, re, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel
HERE = os.path.dirname(os.path.abspath(__file__))
model = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=4)


ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'zero ten twenty thirty forty fifty sixty seventy eighty ninety'.split()


def num2words(n):
    if n < 20:
        return ONES[n]
    if n < 100:
        return TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    for div, word in ((10 ** 9, 'billion'), (10 ** 6, 'million'), (1000, 'thousand'), (100, 'hundred')):
        if n >= div:
            q, r = divmod(n, div)
            return num2words(q) + ' ' + word + ('' if r == 0 else ' ' + num2words(r))


def numwords(m):
    n = m.group(0).replace(',', '')
    try:
        return ' ' + num2words(int(n)).replace('-', ' ').replace(',', '') + ' '
    except Exception:
        return ' ' + n + ' '


def toks(t):
    t = re.sub(r'\[[^\]]*\]', ' ', t).replace('%', ' percent').replace('$', ' ')
    t = re.sub(r'\d[\d,]*', numwords, t)
    t = t.replace('—', ' ').replace('-', ' ').replace(' and ', ' and ')
    return [w for w in (re.sub(r"[^a-z0-9]", '', x.lower()) for x in t.split()) if w]


for name in sys.argv[1:]:
    meta = json.load(open(os.path.join(HERE, 'takes', name + '.json')))
    pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(HERE, 'takes', name + '.mp3'), '-f', 'f32le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    audio = np.frombuffer(pcm, np.float32)
    segs, _ = model.transcribe(audio, language='en', word_timestamps=True, beam_size=5, condition_on_previous_text=False)
    words = [(w.start, w.end, w.word) for s in segs for w in s.words]
    json.dump(words, open(os.path.join(HERE, 'takes', name + '.words.json'), 'w'))
    print(f'== {name}  ({len(audio) / 16000:.1f}s)')
    bad = []
    for i, (ln, vs) in enumerate(zip(meta['lines'], meta['voice_segments'] or [])):
        a, b = vs['start_time_seconds'], vs['end_time_seconds']
        heard = [w for (s, e, w) in words if s >= a - 0.25 and s < b + 0.1]
        want = toks(ln['text'])
        got = toks(' '.join(heard))
        r = difflib.SequenceMatcher(None, want, got).ratio() if want else 1.0
        flag = '  <-- CHECK' if r < 0.75 else ''
        if flag:
            bad.append(i)
        print(f'  {i:2d} {ln["speaker"]:8s} {a:6.2f}-{b:6.2f} match {r:.2f}{flag}  | {" ".join(got)[:70]}')
    print('  flagged:', bad)
