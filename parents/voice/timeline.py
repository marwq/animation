#!/usr/bin/env python3
"""Build the master timeline of the video from the generated voice takes.

The voice comes first: every line keeps its natural timing inside its take, takes follow each other with a
short scene gap, and the silent visual beats marked in the script (⏱ +Xs) are inserted after their line.
Extra pauses for animation can be added in GAPS / AFTER below without touching the audio takes.

outputs: scenes/timeline.json  — lines (global start/end, words with times, clean text), scenes, takes
"""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
_VO = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'script', 'VOICEOVER_eleven_v4.txt'), encoding='utf-8').read()
TAKES = re.findall(r'^=== TAKE (\S+) · ', _VO, re.M)                                   # take ids in order, from the VO file
SCENE_OF = {m[0]: m[1] for m in re.findall(r'^=== TAKE (\S+) · (SC \d+[a-z]?) ', _VO, re.M)}
LEAD_IN = 0.35          # silence before the first line
TAKE_GAP = 1.1          # pause between takes (scene transitions)
SPEED = 1.0             # >1 plays the voice faster (pitch kept, atempo in vo_track.py)
SAME_SCENE_GAP = 0.35   # 08a -> 08b continue the same scene
TAIL = 1.6              # after the last line
# extra animation room: {line_id: seconds} added AFTER that line (on top of the script's ⏱ beats)
AFTER = {   # Parents: room for action beats (montages, fights, the obby, the raid) and the end screen
    '01.2': 0.8, '01.4': 0.8, '01.6': 1.0, '01.7': 0.6,
    '02.0': 1.2, '02.3': 1.0, '02.6': 0.8, '02.9': 1.0, '02.13': 0.6, '02.20': 1.0,
    '03.0': 1.2, '03.7': 2.0, '03.10': 0.6, '03.15': 1.2, '03.18': 0.8,
    '04.0': 1.2, '04.2': 0.8, '04.6': 1.0, '04.10': 0.8, '04.13': 1.2, '04.14': 1.0,
    '05.1': 1.0, '05.3': 1.0, '05.6': 1.0, '05.8': 1.5, '05.10': 1.0, '05.12': 1.5, '05.15': 0.8,
    '06.0': 0.6, '06.2': 1.5, '06.5': 1.0, '06.11': 1.0,
    '07.1': 1.5, '07.3': 1.0, '07.5': 1.0, '07.7': 1.0, '07.11': 1.0,
    '08.1': 1.0, '08.9': 1.0, '08.13': 1.5,
    '09.1': 1.5, '09.2': 1.5, '09.4': 1.0, '09.13': 1.5,
    '10.0': 1.5, '10.2': 1.0, '10.5': 2.0, '10.8': 2.0, '10.9': 1.0, '10.12': 1.0, '10.13': 1.0,
    '11.0': 1.0, '11.2': 1.5, '11.4': 1.5, '11.6': 1.0, '11.8': 1.0, '11.9': 1.5, '11.10': 1.0, '11.13': 1.0,
    '12.1': 0.8, '12.7': 0.6, '12.11': 1.5,
    '12.12': 8.0,   # end screen
}


def script_beats():
    """{(scene, line_index_in_scene): seconds} for every ⏱ +Xs marker, attached to the line before it"""
    beats, scene, n = {}, None, -1
    for line in open(os.path.join(ROOT, 'script', 'SCRIPT.md'), encoding='utf-8'):
        h = re.match(r'^## (SC \d+[a-z]?) · ', line)
        if h:
            scene, n = h.group(1), -1
            continue
        if scene is None:
            continue
        if re.match(r'^> \*\*[A-Z ]+:\*\* ', line):
            n += 1
        for m in re.finditer(r'⏱ \+([\d.]+)s', line):
            key = (scene, n)
            beats[key] = beats.get(key, 0) + float(m.group(1))
    return beats


TAG = re.compile(r'\[[^\]]*\]')


def clean(text):
    return re.sub(r'\s+', ' ', TAG.sub(' ', text)).strip()


def words_from_alignment(al, c0, c1, offset):
    chars = al['characters'][c0:c1]
    st = al['character_start_times_seconds'][c0:c1]
    en = al['character_end_times_seconds'][c0:c1]
    out, cur, t0, t1, depth = [], '', None, None, 0
    for ch, a, b in zip(chars, st, en):
        if ch == '[':
            depth += 1
        if depth > 0:
            if ch == ']':
                depth -= 1
            if cur:
                out.append([cur, t0 + offset, t1 + offset]); cur = ''
            continue
        if ch.isspace():
            if cur:
                out.append([cur, t0 + offset, t1 + offset]); cur = ''
            continue
        if not cur:
            t0 = a
        cur += ch
        t1 = b
    if cur:
        out.append([cur, t0 + offset, t1 + offset])
    return out


def main():
    beats = script_beats()
    lines, takes, scenes = [], [], {}
    t = LEAD_IN
    scene_line = {}
    prev_scene = None
    for k, tk in enumerate(TAKES):
        meta = json.load(open(os.path.join(HERE, 'takes', f'take{tk}.json')))
        for vs in meta['voice_segments']:
            vs['start_time_seconds'] /= SPEED
            vs['end_time_seconds'] /= SPEED
        for k2 in ('character_start_times_seconds', 'character_end_times_seconds'):
            meta['alignment'][k2] = [x / SPEED for x in meta['alignment'][k2]]
        sc = SCENE_OF[tk]
        if k > 0:
            t += SAME_SCENE_GAP if sc == prev_scene else TAKE_GAP
        take_start = t
        shift = 0.0
        al = meta['alignment']
        segs = meta['voice_segments']
        for i, (ln, vs) in enumerate(zip(meta['lines'], segs)):
            idx = scene_line.get(sc, -1) + 1
            scene_line[sc] = idx
            a, b = vs['start_time_seconds'], vs['end_time_seconds']
            off = take_start + shift
            words = words_from_alignment(al, vs['character_start_index'], vs['character_end_index'], off)
            lid = f'{tk}.{i}'
            ws = [w for w in words if re.search(r'[A-Za-z0-9#]', w[0])]
            lines.append({
                'id': lid, 'take': tk, 'scene': sc, 'idx': idx, 'speaker': ln['speaker'], 'raw': ln['text'], 'text': clean(ln['text']),
                'clip': [a, b], 'start': round(off + a, 3), 'end': round(off + b, 3),
                'speechStart': round(ws[0][1], 3) if ws else round(off + a, 3), 'speechEnd': round(ws[-1][2], 3) if ws else round(off + b, 3),
                'words': [[w, round(x0, 3), round(x1, 3)] for w, x0, x1 in ws],
            })
            extra = beats.get((sc, idx), 0) + AFTER.get(lid, 0)
            shift += extra
            if extra:
                lines[-1]['beatAfter'] = extra
        dur = segs[-1]['end_time_seconds']
        t = take_start + dur + shift
        takes.append({'id': tk, 'scene': sc, 'start': round(take_start, 3), 'end': round(t, 3), 'file': f'voice/takes/take{tk}.mp3'})
        s = scenes.setdefault(sc, {'start': round(take_start, 3)})
        s['end'] = round(t, 3)
        prev_scene = sc
    total = t + TAIL
    out = {'duration': round(total, 3), 'speed': SPEED, 'lines': lines, 'takes': takes, 'scenes': scenes}
    json.dump(out, open(os.path.join(ROOT, 'scenes', 'timeline.json'), 'w'), indent=1)
    mm = lambda x: f'{int(x // 60)}:{x % 60:05.2f}'
    print(f'duration {mm(total)} · {len(lines)} lines · beats {sum(beats.values()):.1f}s')
    for sc, s in scenes.items():
        print(f'  {sc:7s} {mm(s["start"])} – {mm(s["end"])}')


if __name__ == '__main__':
    main()
