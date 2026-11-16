#!/usr/bin/env python3
"""Provisional voice timeline, BEFORE the real voiceover exists.

Writes scenes/timeline.json in exactly the format voice/timeline.py produces from the real ElevenLabs takes
(same take ids, line ids `take.index`, speakers, word lists), but with word times ESTIMATED from the text:
speech rate measured on our previous ElevenLabs videos (~0.0925 s per character incl. small in-line pauses),
plus [pause] / "..." / punctuation pauses, the gaps timeline.py uses, and the script's ⏱ beats.

Scenes are timed with L(id) / .word(), so when the real voice arrives, `python3 voice/timeline.py` simply
replaces this file and every scene re-times itself to the real words.

usage: python3 voice/provisional.py
"""
import json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import timeline as TL  # noqa: E402  (TAKES, SCENE_OF, script_beats, clean, gaps)

SEC_PER_CHAR = 0.0925 * 0.86   # speech part of a word (the rest of the measured rate is in the pauses below)
WORD_GAP = 0.045
PAUSE_TAG = 0.55               # [pause]
ELLIPSIS = 0.32                # "..." after a word
DASH = 0.22                    # "—"
SENTENCE = 0.28                # . ! ? inside a line
COMMA = 0.14
LINE_GAP_SAME = 0.22           # measured: same speaker, next line in the take
LINE_GAP_SWITCH = 0.18         # measured: speaker change
TAG = re.compile(r'\[[^\]]*\]')
SCALE = 0.82                   # calibrated on the real takes of our last two videos (est/real 0.86 and 0.77)


def takes():
    t = open(os.path.join(ROOT, 'script', 'VOICEOVER_eleven_v4.txt'), encoding='utf-8').read()
    out = []
    for m in re.finditer(r'^=== TAKE (\S+) · (.*?) ===\n\n(.*?)(?=\n=== )', t, re.S | re.M):
        lines = []
        for l in m.group(3).strip().splitlines():
            sp, text = l.split(': ', 1)
            lines.append((sp.strip(), text.strip()))
        out.append((m.group(1), lines))
    return out


def estimate_words(raw, t0):
    """[[word, start, end], ...] for the spoken words of one line starting at t0; returns (words, t_end)"""
    words, t = [], t0
    # split into tokens keeping [tags] as pause markers
    for tok in re.split(r'(\[[^\]]*\])|\s+', raw):
        if not tok:
            continue
        if tok.startswith('['):
            if tok in ('[pause]', '[long pause]'):
                t += PAUSE_TAG * (2 if 'long' in tok else 1)
            continue
        for w in re.split(r'(?<=—)(?=\w)', tok):
            if not re.search(r'[A-Za-z0-9#]', w):
                continue
            d = SEC_PER_CHAR * max(2, len(re.sub(r'[^A-Za-z0-9]', '', w)) + 1)
            if w.isupper() and len(w) > 2:
                d *= 1.15                         # shouted / stressed words are longer
            words.append([w, round(t, 3), round(t + d, 3)])
            t += d + WORD_GAP
            if w.endswith('...') or w.endswith('…'):
                t += ELLIPSIS
            elif w.endswith('—'):
                t += DASH
            elif re.search(r'[.!?]["”]?$', w):
                t += SENTENCE
            elif w.endswith(',') or w.endswith(';'):
                t += COMMA
    sc = lambda x: round(t0 + (x - t0) * SCALE, 3)
    return [[w, sc(a), sc(b)] for w, a, b in words], sc(t)


def main():
    beats = TL.script_beats()
    lines, tk_out, scenes = [], [], {}
    t = TL.LEAD_IN
    scene_line, prev_scene = {}, None
    for k, (tk, tl) in enumerate(takes()):
        sc = TL.SCENE_OF[tk]
        if k > 0:
            t += TL.SAME_SCENE_GAP if sc == prev_scene else TL.TAKE_GAP
        take_start = t
        prev_sp = None
        for i, (sp, raw) in enumerate(tl):
            if i > 0:
                t += LINE_GAP_SAME if sp == prev_sp else LINE_GAP_SWITCH
            idx = scene_line.get(sc, -1) + 1
            scene_line[sc] = idx
            words, t_end = estimate_words(raw, t)
            a = words[0][1] if words else t
            b = words[-1][2] if words else t_end
            line = {
                'id': f'{tk}.{i}', 'take': tk, 'scene': sc, 'idx': idx, 'speaker': sp, 'raw': raw, 'text': TL.clean(raw),
                'clip': [round(a - take_start, 3), round(b - take_start, 3)], 'start': round(a, 3), 'end': round(b, 3),
                'speechStart': round(a, 3), 'speechEnd': round(b, 3), 'words': words,
            }
            t = b
            extra = beats.get((sc, idx), 0) + TL.AFTER.get(line['id'], 0)
            if extra:
                line['beatAfter'] = extra
                t += extra
            lines.append(line)
            prev_sp = sp
        tk_out.append({'id': tk, 'scene': sc, 'start': round(take_start, 3), 'end': round(t, 3), 'file': None})
        s = scenes.setdefault(sc, {'start': round(take_start, 3)})
        s['end'] = round(t, 3)
        prev_scene = sc
    total = t + TL.TAIL
    out = {'duration': round(total, 3), 'provisional': True, 'lines': lines, 'takes': tk_out, 'scenes': scenes}
    json.dump(out, open(os.path.join(ROOT, 'scenes', 'timeline.json'), 'w'), indent=1)
    mm = lambda x: f'{int(x // 60)}:{x % 60:05.2f}'
    print(f'PROVISIONAL duration {mm(total)} · {len(lines)} lines · beats {sum(beats.values()):.1f}s')
    for sc, s in scenes.items():
        print(f'  {sc:7s} {mm(s["start"])} – {mm(s["end"])}')


if __name__ == '__main__':
    main()
