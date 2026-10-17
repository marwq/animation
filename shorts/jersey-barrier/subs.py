# Субтитры и титры (ASS, 1080×1920) по таймингу слов озвучки.
# Фразы по 2–4 слова, ключевые слова — жёлтым, появление с «подскоком».
# Запуск: python subs.py > subs.ass
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
TL = json.load(open(os.path.join(HERE, 'voice', 'timeline.json')))

# (строка, индекс первого слова фразы в дубле, текст фразы); {…} — выделить жёлтым
CHUNKS = [
    (0, 0, 'This car just'), (0, 3, 'crossed the median'), (0, 6, 'and hit an SUV'), (0, 10, '{HEAD-ON.}'),
    (1, 0, "That's why highways"), (1, 3, 'put a {concrete wall}'), (1, 7, 'down the middle.'),
    (2, 0, 'But look at the bottom.'), (2, 5, "It's {sloped.}"),
    (3, 0, 'Against a {flat wall,}'), (3, 4, 'the body takes the hit.'),
    (4, 0, 'Here,'), (4, 1, 'the tire hits first'), (4, 5, 'and {climbs,}'), (4, 7, 'the car {lifts,}'),
    (4, 10, 'the tires {grip less,}'), (4, 14, 'and the wall slides it'), (4, 19, '{back into its lane.}'),
    (5, 0, 'No wall?'), (5, 2, '{This happens.}'),
    (6, 0, 'In August,'), (6, 2, "on New Jersey's {Route 55,}"), (6, 7, 'a car crossed'), (6, 10, 'a {grass median}'),
    (6, 13, 'and killed'), (6, 15, 'a 68-year-old man'), (6, 20, 'driving the other way.'),
    (7, 0, 'The state that invented'),
]
TITLE = 'JERSEY BARRIER'
CASE_PLATE = ('AUG 22, 2026', 'ROUTE 55 · VINELAND, NJ')

YELLOW = '&H0018C8FF&'   # BGR: жёлтый как у подсветки
WHITE = '&H00FFFFFF&'


def ts(t):
    t = max(0.0, t)
    h, r = divmod(t, 3600)
    m, s = divmod(r, 60)
    return f'{int(h)}:{int(m):02d}:{s:05.2f}'


def styled(text):
    return re.sub(r'\{([^}]*)\}', lambda m: '{\\c' + YELLOW + '}' + m.group(1) + '{\\c' + WHITE + '}', text)


def main():
    words = TL['words']
    by_line = {}
    for w in words:
        by_line.setdefault(w['line'], []).append(w)
    events = []
    starts = []
    for line, idx, text in CHUNKS:
        starts.append(by_line[line][idx]['s'])
    for k, (line, idx, text) in enumerate(CHUNKS):
        a = starts[k]
        same_line_next = k + 1 < len(CHUNKS) and CHUNKS[k + 1][0] == line
        if same_line_next:
            b = starts[k + 1]
        else:
            b = by_line[line][-1]['e'] + (0.45 if line == 5 else 0.15)
        pop = '{\\fscx78\\fscy78\\t(0,90,\\fscx104\\fscy104)\\t(90,150,\\fscx100\\fscy100)}'
        events.append(f'Dialogue: 0,{ts(a - 0.03)},{ts(b)},Sub,,0,0,0,,{pop}{styled(text)}')
    # финальный титр — вместо последней фразы «the Jersey barrier.»
    t_title = by_line[7][4]['s']
    events.append(f'Dialogue: 1,{ts(t_title)},{ts(28.0)},Title,,0,0,0,,'
                  '{\\fscx60\\fscy60\\t(0,120,\\fscx108\\fscy108)\\t(120,220,\\fscx100\\fscy100)}' + TITLE)
    # плашка реального случая (план 7)
    a, b = 19.3, 25.4
    events.append(f'Dialogue: 1,{ts(a)},{ts(b)},Plate,,0,0,0,,{{\\fad(200,250)}}{CASE_PLATE[0]}')
    events.append(f'Dialogue: 1,{ts(a + 0.15)},{ts(b)},PlateSmall,,0,0,0,,{{\\fad(200,250)}}{CASE_PLATE[1]}')
    print(f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Montserrat ExtraBold,76,&H00FFFFFF,&H00FFFFFF,&H00101010,&H90000000,0,0,0,0,100,100,0,0,1,6,3,5,70,70,0,1
Style: Title,Montserrat ExtraBold,118,&H0018C8FF,&H0018C8FF,&H00101010,&H90000000,0,0,0,0,100,100,2,0,1,8,4,5,40,40,0,1
Style: Plate,Montserrat ExtraBold,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB0101010,0,0,0,0,100,100,2,0,3,18,0,8,60,60,250,1
Style: PlateSmall,Montserrat ExtraBold,40,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB0101090,0,0,0,0,100,100,2,0,3,12,0,8,60,60,345,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text""")
    for e in events:
        if ',Sub,' in e:
            e = e.replace(',,0,0,0,,', ',,0,0,0,,{\\pos(540,1180)}', 1)
        if ',Title,' in e:
            e = e.replace(',,0,0,0,,', ',,0,0,0,,{\\pos(540,760)}', 1)
        print(e)


if __name__ == '__main__':
    main()
