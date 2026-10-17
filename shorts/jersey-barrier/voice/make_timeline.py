# Таймлайн озвучки: где в ролике начинается каждая реплика и когда звучит каждое слово.
# Вход: words.json (check_takes / faster-whisper по дублям). Выход: timeline.json.
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
STARTS = [0.10, 2.84, 5.48, 7.70, 10.38, 16.94, 19.14, 25.54]   # начало реплик в ролике, с
words = json.load(open(os.path.join(HERE, 'words.json')))
lines = [l.strip() for l in open(os.path.join(HERE, 'lines.txt')) if l.strip()]
out = {'lines': [], 'words': []}
for i, (text, start) in enumerate(zip(lines, STARTS)):
    key = next(k for k in words if k.endswith(f'{i:02d}.wav'))
    w = words[key]
    out['lines'].append({'file': f'takes/{i:02d}.wav', 'start': start, 'speech_end': w['e'], 'text': text})
    for word, s, e in w['words']:
        out['words'].append({'w': word, 's': round(start + s, 3), 'e': round(start + e, 3), 'line': i})
jersey = next(x for x in out['words'] if x['w'].lower().startswith('jersey') and x['line'] == 7)
out['title_time'] = jersey['s']
json.dump(out, open(os.path.join(HERE, 'timeline.json'), 'w'), indent=1)
print('title', out['title_time'], 'last word end', out['words'][-1]['e'])
