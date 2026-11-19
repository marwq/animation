#!/usr/bin/env python3
"""Generate voice-over takes with ElevenLabs text-to-dialogue (with timestamps).

usage: python3 voice/eleven.py 01 02 ...      (take ids from script/VOICEOVER_eleven_v4.txt)
       python3 voice/eleven.py --budget        (show remaining characters)
The API key is injected by the session's network proxy; nothing here reads or sends it.
Outputs voice/takes/takeXX.mp3 + takeXX.json (voice segments + character alignment + inputs).
"""
import base64, json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VO = os.path.join(ROOT, 'script', 'VOICEOVER_eleven_v4.txt')
CAST = {c['role']: c['voice_id'] for c in json.load(open(os.path.join(ROOT, 'script', 'cast_voices.json')))}
API = 'https://api.elevenlabs.io'
MODEL = os.environ.get('EL_MODEL', 'eleven_v4')


def curl_json(url, body=None):
    args = ['curl', '-sS', '-m', '300', url]
    if body is not None:
        args += ['-X', 'POST', '-H', 'Content-Type: application/json', '--data-binary', '@-']
    r = subprocess.run(args, input=json.dumps(body).encode() if body is not None else None, capture_output=True, check=True)
    return json.loads(r.stdout)


def budget():
    s = curl_json(API + '/v1/user/subscription')
    return s['character_limit'] - s['character_count'], s


def takes():
    t = open(VO, encoding='utf-8').read()
    out = {}
    for m in re.finditer(r'^=== TAKE (\S+) · (.*?) ===\n\n(.*?)(?=\n=== )', t, re.S | re.M):
        lines = []
        for l in m.group(3).strip().splitlines():
            sp, text = l.split(': ', 1)
            lines.append((sp.strip(), text.strip()))
        out[m.group(1)] = {'title': m.group(2), 'lines': lines}
    return out


def generate(tid, lines, tag=''):
    inputs = [{'text': text, 'voice_id': CAST[sp]} for sp, text in lines]
    body = {'model_id': MODEL, 'inputs': inputs, 'settings': {'stability': 0.5}}
    d = curl_json(API + '/v1/text-to-dialogue/with-timestamps?output_format=mp3_44100_128', body)
    if 'audio_base64' not in d:
        raise RuntimeError(json.dumps(d)[:400])
    name = f'take{tid}{tag}'
    open(os.path.join(HERE, 'takes', name + '.mp3'), 'wb').write(base64.b64decode(d['audio_base64']))
    meta = {'id': tid, 'model': MODEL, 'lines': [{'speaker': sp, 'text': text} for sp, text in lines],
            'voice_segments': d.get('voice_segments'), 'alignment': d.get('alignment'), 'normalized_alignment': d.get('normalized_alignment')}
    json.dump(meta, open(os.path.join(HERE, 'takes', name + '.json'), 'w'))
    return name


if __name__ == '__main__':
    if '--budget' in sys.argv:
        left, s = budget()
        print('characters left:', left, 'of', s['character_limit'])
        sys.exit(0)
    T = takes()
    for tid in sys.argv[1:]:
        lines = T[tid]['lines']
        need = sum(len(x) for _, x in lines)
        left, _ = budget()
        if need > left:
            print(f'take {tid}: needs {need} chars, only {left} left — stopping')
            break
        name = generate(tid, lines)
        print(f'take {tid}: {len(lines)} lines, {need} chars -> voice/takes/{name}.mp3 (left before: {left})', flush=True)
