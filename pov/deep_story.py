"""Раскадровка ролика после трёх минут: сквозь кору, мантию, ядро, центр Земли — и вверх, к поверхности
Индийского океана на другой стороне. Дописывает pov/scene.json (всё, что после 180 с, пересобирается).

Запуск из корня:  python3 pov/deep_story.py

Ось пути — «пройдено» s (м): в первой половине это глубина подошв, после центра — расстояние, которое
осталось до поверхности океана на другой стороне, считается как EARTH − s.
"""
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
P = HERE / 'scene.json'
EARTH = 12_742_000  # м: от Таймс-сквер насквозь до поверхности океана
T0 = 180.0  # стык с первыми тремя минутами


def exp_piece(t0, d0, t1, d1, step=2.0):
    """Экспонента между двумя вехами: глубина растёт в одно и то же число раз за равное время."""
    k = math.log(d1 / d0) / (t1 - t0)
    keys, t = [], t0 + step
    while t < t1 - 0.01:
        keys.append([round(t, 2), round(d0 * math.exp(k * (t - t0)), 1)])
        t += step
    keys.append([t1, d1])
    return keys, k


def when(t0, d0, k, d):
    return t0 + math.log(d / d0) / k


# --- путь: первая половина (глубина подошв) ---------------------------------
depth = []
pieces = [(180, 1137.4, 232, 4000), (232, 4000, 290, 12262), (290, 12262, 350, 36000), (350, 36000, 480, 660000),
          (480, 660000, 545, 2890000), (545, 2890000, 640, 5150000)]
K = {}
for t0, d0, t1, d1 in pieces:
    keys, k = exp_piece(t0, d0, t1, d1, step=4.0 if t1 > 480 else 2.0)
    depth += keys
    K[(t0, t1)] = (t0, d0, k)
depth += [[652, 5520000], [663, 5880000], [672, 6130000], [680, 6280000], [686, 6345000], [691, 6366500], [694.5, 6370500], [697, 6371000]]
depth += [[708, 6371000]]  # невесомость в центре
# вторая половина: сколько осталось до поверхности (км) → s
rise_km = [[712, 6370.6], [716, 6364], [720, 6335], [724, 6240], [728, 6000], [733, 5500], [737, 5150], [746, 4200], [754, 3400],
           [760, 2890], [767, 2200], [773, 1450], [778, 900], [782, 600], [786, 380], [790, 220], [795, 110], [800, 50], [805, 22],
           [810, 13.5], [815, 11.32], [821, 8.6], [826, 6.4], [831, 4.8], [835, 4.321]]
depth += [[t, round(EARTH - r * 1000, 1)] for t, r in rise_km]
# океан: глаза идут головой вверх; r — сколько метров воды над глазами
ocean_r = [[839, 4302], [842, 4240], [846, 3900], [850, 3300], [853, 2850], [856, 2640], [860, 2590], [863, 2380], [866, 1960],
           [869, 1780], [875, 1700], [878, 1330], [881, 930], [884, 640], [889, 560], [892, 310], [895, 125], [897.5, 32],
           [899.2, 5], [900.2, 0], [901, -0.25], [930, -0.25]]
depth += [[t, round(EARTH - r, 2)] for t, r in ocean_r]

# Вехи по времени (для подписей)
def at_depth(d):
    for (t0, t1), (tt0, d0, k) in K.items():
        hi = d0 * math.exp(k * (t1 - t0))
        if d0 <= d <= hi + 1:
            return round(when(tt0, d0, k, d), 1)
    raise ValueError(d)


def speed_kmh(t):
    for (t0, t1), (tt0, d0, k) in K.items():
        if t0 <= t <= t1:
            return k * d0 * math.exp(k * (t - t0)) * 3.6
    raise ValueError(t)


def kmh(t):
    v = speed_kmh(t)
    r = 10 ** (len(str(int(v))) - 2)
    return f'{int(round(v / r) * r):,}'


C = []  # подписи [начало, конец, текст]


def cap(t, text, dur=3.0):
    C.append([round(t, 2), round(t + dur, 2), text])


# --- кора --------------------------------------------------------------------
cap(183.5, 'The rock here is squeezed by over 300 atmospheres.')
cap(189.5, f'Falling at {kmh(191)} km/h now.')
cap(at_depth(1857), '1,857 m. As deep as the Grand Canyon.')
cap(at_depth(2212), '2,212 m. Deeper than the deepest known cave on Earth.')
cap(213.5, 'Bacteria have been found living almost 3 km down.')
cap(at_depth(3000), '3 km. The rock is 85 °C. Hot enough to scald.')
cap(226.0, 'These are the roots of mountains that wore away long ago.')
cap(232.0, '4 km. The deepest mines on Earth stop here.')
cap(236.5, 'Miners there survive on ice-cold air pumped down from the surface.')
cap(at_depth(5000), f'5 km. Falling at {kmh(at_depth(5000))} km/h.')
cap(250.5, 'Water still seeps through hair-thin cracks.')
cap(257.0, 'Most earthquakes start at this depth: 5 to 15 km down.')
cap(264.0, 'This pressure would crush a submarine like a soda can.')
cap(at_depth(8849), '8,849 m. Mount Everest would fit above you.')
cap(279.0, 'The rock is 200 °C.')
cap(at_depth(10935), '10,935 m. Deeper than the deepest point of the ocean.')
cap(290.0, '12,262 m. The deepest hole ever drilled stopped here.')
cap(293.5, 'The Kola Superdeep Borehole, 1989. The rock was 180 °C.')
cap(300.0, 'Nothing humans have built has ever gone deeper.')
cap(306.0, '15 km. The rock starts to flow, like warm wax.')
cap(312.0, 'The lower crust: dark, dense rock called granulite.')
cap(at_depth(20000), '20 km. Pressure: 5,000 times the air at the surface.')
cap(324.0, '400 °C. Hot enough to melt lead.')
cap(331.0, 'Look closer.')
cap(335.5, '550 °C. The rock is starting to glow.')
cap(341.0, "You'd have been crushed long ago. Let's keep going.")
cap(346.0, "Something's changing.")
cap(350.0, '36 km. The Moho: the bottom of the crust.')
cap(353.5, "Below it: the mantle. 84% of Earth's volume.")
# --- мантия ------------------------------------------------------------------
cap(359.0, 'Green rock: peridotite, made mostly of olivine.')
cap(at_depth(50000), '50 km. Gem-quality olivine is called peridot.')
cap(371.0, "It's 800 °C. Glowing cherry red.")
cap(377.0, f'Falling at {kmh(377)} km/h.')
cap(383.0, 'Somewhere above, New York is having a quiet evening.')
cap(at_depth(100000), '100 km. The bottom of the tectonic plate.')
cap(399.5, 'Below it, the rock is soft enough to flow. Plates slide on top.')
cap(406.0, 'Tiny drops of melt glow between the crystals.')
cap(at_depth(150000), '150 km. This is where diamonds form.')
cap(418.0, 'Carbon, crushed at 1,200 °C. Most are billions of years old.')
cap(423.0, 'Volcanic pipes called kimberlites carry them up.')
cap(430.0, 'Deep earthquakes can strike as far down as 700 km.')
cap(437.0, '1,400 °C. Solid rock, but it moves.')
cap(at_depth(300000), '300 km. The mantle churns like a pot on a stove.')
cap(451.0, 'Very slowly: about as fast as your fingernails grow.')
cap(at_depth(410000), '410 km. The olivine crushes into a denser crystal.')
cap(462.5, 'Welcome to the transition zone.')
cap(at_depth(520000), 'Ringwoodite: a blue mineral that traps water in its crystals.')
cap(473.5, 'This layer may hold as much water as all the oceans.')
cap(480.0, '660 km. The lower mantle begins.')
cap(484.0, 'Bridgmanite: the most common mineral on Earth. It only exists this deep.')
cap(491.0, 'Pressure: 300,000 atmospheres.')
cap(498.3, f'1,000 km down. Falling at {kmh(498.3)} km/h.')
cap(505.0, 'Slabs of ancient ocean floor sink this deep and pile up.')
cap(511.0, 'Some sank here when dinosaurs were alive.')
cap(516.1, '1,500 km. 2,500 °C.')
cap(528.8, '2,000 km. Almost a third of the way to the centre.')
cap(535.0, 'Ahead: the strangest layer in the mantle.')
cap(541.5, 'D″: a rough, patchy layer right above the core.')
cap(545.0, '2,890 km. The core.')
# --- внешнее ядро -------------------------------------------------------------
cap(548.5, 'Liquid iron and nickel. 4,000 °C.')
cap(555.0, 'Density jumps more here than from air to ground.')
cap(562.0, 'This ocean of metal swirls as Earth spins.')
cap(569.0, "Its currents create Earth's magnetic field.")
cap(576.5, "That's why a compass points north.")
cap(583.0, 'And why auroras light up the polar skies.')
cap(590.0, 'The core is bigger than the planet Mars.')
cap(598.4, '4,000 km down. 4,500 °C.')
cap(605.0, 'Here the iron flows about 15 km a year.')
cap(612.0, 'Faster than anything else inside the planet.')
cap(618.8, "4,500 km. Earth's magnetic field has flipped hundreds of times.")
cap(625.0, 'The last time: 780,000 years ago.')
cap(632.0, 'Below you: something solid.')
cap(640.0, '5,150 km. The inner core.')
# --- внутреннее ядро и центр -------------------------------------------------
cap(643.5, 'A ball of solid iron, as hot as the surface of the Sun.')
cap(650.0, 'It stays solid only because of the pressure: 3.6 million atmospheres.')
cap(657.0, "It's growing about 1 mm a year as Earth slowly cools.")
cap(664.0, 'Its iron crystals may line up from pole to pole.')
cap(671.0, "You're slowing down.")
cap(679.0, 'Gravity is fading. The whole planet pulls on you equally.')
cap(686.0, 'Almost there.')
cap(692.0, '6,371 km. The centre of the Earth.', 3.5)
cap(697.0, "Gravity: zero. You're weightless.")
cap(701.5, 'Halfway.')
cap(705.0, "Past the centre, 'down' flips. Now you rise.")
# --- обратно вверх -------------------------------------------------------------
cap(711.0, 'Every metre from here takes you up.')
cap(717.0, 'Straight through, from New York to the other side of the world.')
cap(724.0, 'Rising through the inner core. Faster now.')
cap(731.0, 'Above you: liquid iron again.')
cap(738.0, 'The outer core. 5,000 °C.')
cap(745.0, 'Which spot on Earth is exactly opposite Times Square?')
cap(752.0, 'Not China. Not Australia.')
cap(760.0, 'The mantle. Back in solid rock.')
cap(767.0, 'Most places on Earth have ocean on the opposite side.')
cap(774.0, 'And so does New York.')
cap(781.0, '660 km. The transition zone again: blue ringwoodite.')
cap(786.5, '410 km. Green olivine.')
cap(792.0, 'The rock around you is cooling.')
cap(799.0, "This side's tectonic plate is thinner: young ocean floor.")
cap(805.0, 'Above you: the southern Indian Ocean.')
cap(815.0, '11 km. The Moho again. Then oceanic crust, just 7 km thick.')
cap(819.0, 'Gabbro: magma that cooled slowly under a mid-ocean ridge.')
cap(823.5, 'Then sheeted dikes: frozen cracks where lava once rose.')
cap(827.5, 'Pillow lava: blobs of basalt that erupted underwater.')
cap(831.5, 'And on top: mud made of tiny shells.')
# --- океан ---------------------------------------------------------------------
cap(835.5, '4,321 metres under the sea.')
cap(839.5, '1 °C. Pressure: 430 times the air.')
cap(843.5, 'The abyss covers more of Earth than all the land.')
cap(849.0, 'Pitch black. Sunlight never reaches here.')
cap(853.0, 'But not lifeless.', 2.6)
cap(857.0, 'A siphonophore: a colony of tiny animals glowing as one.')
cap(862.5, 'Three out of four deep-sea animals make their own light.')
cap(867.0, "Something big is coming.", 2.8)
cap(870.5, 'A sperm whale, hunting squid 1,700 m down.')
cap(874.5, 'It can hold its breath for over an hour.')
cap(879.0, '1,000 m. The faintest trace of sunlight.')
cap(884.0, 'Lanternfish: maybe the most numerous animals with a backbone.')
cap(889.5, '200 m. The sunlit ocean.')
cap(893.5, 'Almost there.', 2.6)
cap(901.5, '40.76° South, 106.01° East.')
cap(905.5, 'The exact opposite side of the world from Times Square.')
cap(910.0, 'The nearest land: Australia, 1,070 km away.')
cap(914.5, "At home it's 7:27 PM. Here, 6:30 tomorrow morning.")
cap(919.0, 'You fell 12,742 km in 15 minutes.', 3.5)

# --- взгляд: (начало, конец, поворот влево +, наклон вверх +); между взглядами — плавный переход ---
LOOKS = [
    (182.0, 186.0, 0, -62), (188.0, 193.0, 38, -6), (195.0, 199.0, -40, 4), (200.5, 203.5, 0, 52),
    (205.5, 210.5, 50, -4), (212.5, 216.5, -45, -10), (218.0, 223.0, 0, -30), (225.0, 229.5, 55, 6),
    (231.0, 235.5, 0, -64), (237.0, 240.0, -30, 0), (242.5, 247.0, 0, -48), (249.5, 253.5, -52, -6),
    (256.0, 260.5, 40, 2), (263.0, 267.0, 0, -20), (271.5, 276.5, 0, 56), (278.5, 282.5, 0, -30),
    (283.5, 287.5, 0, -58), (289.0, 297.0, 0, -30), (299.0, 303.0, 35, 20), (305.0, 309.5, -48, -6),
    (311.0, 315.5, 52, -4), (317.0, 321.0, 0, -50), (323.0, 327.5, 0, -30), (330.0, 334.0, -55, -6),
    (335.0, 339.5, 50, 0), (340.5, 344.5, 0, -40), (345.5, 349.0, 0, -66), (350.0, 353.0, 0, -40),
    (354.5, 357.5, 0, 0), (358.5, 362.5, -50, -4), (364.0, 368.0, 50, 4), (370.5, 374.5, 0, -30),
    (376.5, 380.5, 0, -50), (382.5, 386.5, 0, 58), (395.0, 399.0, 0, -55), (399.5, 403.0, 40, 0),
    (405.5, 409.5, -52, -8), (413.0, 417.5, -58, -4), (418.0, 422.0, 54, 2), (423.0, 426.5, 0, -50),
    (429.5, 433.5, 30, 10), (436.5, 440.5, 0, -30), (444.5, 448.5, -45, -6), (450.5, 454.5, 0, -30),
    (458.0, 462.0, 0, -60), (463.0, 467.0, 50, 0), (469.0, 473.0, -55, -4), (473.5, 477.0, 40, 6),
    (479.0, 483.0, 0, -62), (484.0, 488.0, -50, -4), (490.5, 494.5, 0, -40), (497.5, 502.0, 0, -50),
    (504.5, 509.0, 52, -6), (510.5, 515.0, -48, 4), (516.0, 520.0, 0, -30), (528.0, 532.0, 0, 50),
    (534.5, 538.0, 0, -62), (541.0, 544.5, 40, -10), (545.5, 548.5, 0, -50), (549.0, 552.5, 0, 0),
    (554.5, 558.5, -56, -4), (561.5, 565.5, 50, 8), (568.5, 572.5, 0, 60), (576.0, 580.0, 0, -30),
    (582.5, 586.5, 0, 62), (589.5, 593.5, -52, 0), (598.0, 602.0, 0, -48), (604.5, 608.5, 50, -6),
    (611.5, 615.5, -45, 6), (618.5, 622.0, 0, -30), (624.5, 628.5, 40, 4), (631.5, 635.5, 0, -64),
    (640.0, 643.0, 0, -40), (643.5, 647.0, -55, -2), (649.5, 653.5, 52, 6), (656.5, 660.5, 0, -30),
    (663.5, 667.5, -40, 30), (670.5, 674.5, 0, -50), (678.5, 682.5, 0, -10), (685.5, 689.0, 0, -66),
    (691.5, 695.5, 0, -30), (697.0, 701.0, 40, 20), (701.5, 704.5, -60, -10), (705.0, 708.5, 0, 0),
    (710.0, 715.0, 0, 55), (716.5, 721.0, 45, 10), (723.5, 728.0, 0, 60), (730.5, 734.5, -50, 20),
    (737.5, 741.5, 0, 62), (744.5, 748.5, 40, 6), (751.5, 755.5, -40, 6), (759.5, 763.5, 0, 58),
    (766.5, 770.5, 50, 4), (773.5, 777.5, -50, 10), (780.5, 784.5, 0, 60), (786.0, 789.5, 45, 4),
    (791.5, 795.5, -45, -8), (798.5, 802.5, 0, 55), (804.5, 808.5, 0, 64), (814.5, 818.5, 0, 58),
    (818.5, 822.5, -52, 4), (823.0, 826.5, 52, 6), (827.0, 830.5, -48, 10), (831.0, 834.5, 0, 66),
    (835.5, 838.5, 0, -45), (839.0, 842.5, 55, -30), (843.0, 846.5, 0, 50), (848.5, 852.5, -40, 30),
    (856.0, 861.0, -60, 6), (862.0, 866.0, 30, 40), (866.5, 869.0, 55, 4), (869.5, 877.5, 62, -2),
    (878.5, 882.5, 0, 60), (883.5, 888.5, -40, 10), (889.0, 893.0, 0, 62), (893.5, 899.0, 0, 70),
    (900.5, 903.5, 0, 0), (904.0, 909.0, 70, 4), (909.5, 913.5, -60, 2), (914.0, 918.0, 0, -40),
    (918.5, 923.5, 20, 6), (924.5, 930.0, 0, 8),
]


def looks_to_keys(looks, base_yaw, base_pitch, trans=1.1):
    """Взгляды → ключи: держим позу внутри окна, между окнами — назад к основе, если пауза длинная."""
    yaw, pitch = [], []
    prev_end = T0
    for a, b, y, p in looks:
        a = max(a, prev_end + 0.8)  # окна вплотную: дать голове время на поворот
        if b <= a + 0.5:
            continue
        gap = a - prev_end
        if gap > 2 * trans + 0.6:  # длинная пауза: голова возвращается к основе
            yaw += [[round(prev_end + trans, 2), base_yaw], [round(a - trans + 0.3, 2), base_yaw]]
            pitch += [[round(prev_end + trans, 2), base_pitch], [round(a - trans + 0.3, 2), base_pitch]]
        yaw += [[round(a, 2), y], [round(b, 2), y]]
        pitch += [[round(a, 2), p], [round(b, 2), p]]
        prev_end = b
    return yaw, pitch


yaw_keys, pitch_keys = looks_to_keys(LOOKS, 0, 0)

# Позы рук: balance — руки в стороны на скорости; check — браслет к глазам; shield — заслониться от света;
# float — невесомость; tread — держаться на воде
balance = [[181.8, 0.42], [186, 0.4], [187.5, 0], [242.5, 0], [243.5, 0.45], [247, 0.45], [248.5, 0],
           [283.5, 0], [284.5, 0.35], [287.5, 0.35], [288.8, 0], [376.5, 0], [377.5, 0.5], [380.5, 0.5], [381.8, 0],
           [497.5, 0], [498.5, 0.55], [502, 0.55], [503.2, 0], [631.5, 0], [632.5, 0.4], [635.5, 0.4], [636.8, 0],
           [670.5, 0], [671.5, 0.3], [674.5, 0.3], [675.8, 0], [835.5, 0], [836.5, 0.35], [838.5, 0.35], [839.8, 0]]
check = [[218.2, 0], [218.8, 1], [222.6, 1], [223.2, 0], [289.2, 0], [289.8, 1], [296.4, 1], [297.0, 0],
         [323.2, 0], [323.8, 1], [327.2, 1], [327.8, 0], [516.2, 0], [516.8, 1], [519.4, 1], [520.0, 0],
         [691.7, 0], [692.3, 1], [695.2, 1], [695.8, 0]]
shield = [[545.2, 0], [545.6, 1], [547.6, 1], [548.4, 0], [640.0, 0], [640.4, 0.8], [642.2, 0.8], [643.0, 0]]
float_ = [[0, 0], [694.5, 0], [697.5, 1], [709.5, 1], [713, 0.25], [835, 0.25], [838, 0.45], [899.5, 0.45], [900.5, 0], [930, 0]]
tread = [[0, 0], [899.5, 0], [901.5, 1], [930, 1]]
# Невесомость: в центре тело медленно поворачивается
body_yaw_deep = [[694, 0], [700, 60], [706, 140], [711, 170], [716, 180]]


def merge(old, new, upto=T0):
    keep = [k for k in old if k[0] <= upto]
    return keep + [k for k in new if k[0] > upto]


s = json.loads(P.read_text())
s['duration'] = 930
s['depth'] = merge(s['depth'], depth)
end = [] if yaw_keys[-1][0] >= 930 else [[930, yaw_keys[-1][1]]]
s['head_yaw'] = merge(s['head_yaw'], [[T0 + 0.01, -0.0]] + yaw_keys + end)
end = [] if pitch_keys[-1][0] >= 930 else [[930, pitch_keys[-1][1]]]
s['head_pitch'] = merge(s['head_pitch'], [[T0 + 0.01, -62]] + pitch_keys + end)
s['body_yaw'] = [k for k in s['body_yaw'] if k[0] <= 12.2] + [[693, 0]] + body_yaw_deep + [[930, 180]]
s['balance'] = merge([k for k in s['balance'] if k[0] < 180] + [[180, 0.55]], balance + [[930, 0]])
s['check'] = merge(s['check'], check + [[930, 0]])
s['shield'] = merge(s['shield'], shield + [[930, 0]])
s['float'] = float_
s['tread'] = tread
s['captions'] = [c for c in s['captions'] if c[0] < T0] + C
s['title'] = [924.0, 930]
s['earth'] = EARTH
s['center'] = [697, 708]  # невесомость в центре, с; дальше — подъём
s['ocean'] = {'seafloor': 4321, 'emerge': 835, 'surface': 900.2, 'lat': -40.758, 'lon': 106.0145}

# сравнение и «дальше» — на весь путь (первая половина — глубина, вторая — до поверхности)
s['compare'] = s['compare'][:-1] + [
    [1000, 'ONE KILOMETRE DOWN'], [1857, 'AS DEEP AS THE GRAND CANYON'], [2212, 'DEEPER THAN ANY CAVE ON EARTH'],
    [4000, 'DEEPER THAN THE DEEPEST MINE'], [8849, 'DEEPER THAN EVEREST IS TALL'], [10935, 'DEEPER THAN THE OCEAN FLOOR'],
    [12262, 'DEEPER THAN ANY HOLE EVER DRILLED'], [18000, 'IN THE LOWER CRUST'], [36000, 'IN THE MANTLE'],
    [100000, 'BELOW THE TECTONIC PLATE'], [150000, 'WHERE DIAMONDS FORM'], [410000, 'IN THE TRANSITION ZONE'],
    [660000, 'IN THE LOWER MANTLE'], [2700000, 'IN THE D″ LAYER'], [2890000, 'IN THE LIQUID OUTER CORE'],
    [5150000, 'IN THE SOLID INNER CORE'], [6370500, 'AT THE CENTRE OF THE EARTH'],
    [EARTH - 6370000, 'RISING THROUGH THE INNER CORE'], [EARTH - 5150000, 'RISING THROUGH THE OUTER CORE'],
    [EARTH - 2890000, 'RISING THROUGH THE MANTLE'], [EARTH - 11320, 'IN THE OCEANIC CRUST'],
    [EARTH - 4321, 'IN THE DEEP OCEAN'], [EARTH - 1000, 'IN THE TWILIGHT ZONE'], [EARTH - 200, 'IN THE SUNLIT OCEAN'],
    [EARTH - 0.5, 'ON THE SURFACE']]
s['milestones'] = [m for m in s['milestones'] if m[0] < 4000] + [
    [1857, 'GRAND CANYON DEPTH'], [2212, 'DEEPEST CAVE'], [4000, 'DEEPEST MINE'], [8849, 'EVEREST HEIGHT'],
    [10935, 'DEEPEST OCEAN POINT'], [12262, 'DEEPEST HOLE EVER DRILLED'], [36000, 'THE MANTLE'], [100000, 'BOTTOM OF THE PLATE'],
    [150000, 'DIAMONDS'], [410000, 'TRANSITION ZONE'], [660000, 'LOWER MANTLE'], [2890000, 'THE CORE'], [5150000, 'INNER CORE'],
    [6371000, 'CENTRE OF THE EARTH'], [EARTH - 5150000, 'OUTER CORE'], [EARTH - 2890000, 'THE MANTLE'],
    [EARTH - 11320, 'OCEANIC CRUST'], [EARTH - 4321, 'THE SEAFLOOR'], [EARTH - 1000, 'TWILIGHT ZONE'],
    [EARTH - 200, 'SUNLIT ZONE'], [EARTH, 'THE SURFACE']]
# температура вокруг (°C) по пройденному пути: кора Нью-Йорка, мантия, ядро; после центра — океаническая сторона
s['temperature'] = [[0, 18], [8, 15], [50, 15], [1000, 38], [3000, 85], [8000, 180], [12262, 250], [20000, 370], [23000, 410],
                    [30000, 540], [36000, 600], [60000, 800], [100000, 1250], [150000, 1300], [300000, 1420], [410000, 1500],
                    [660000, 1620], [1500000, 2400], [2700000, 2900], [2890000, 4000], [4000000, 4500], [5150000, 5200],
                    [6371000, 5400], [EARTH - 5150000, 5200], [EARTH - 2890000, 4000], [EARTH - 2700000, 2900],
                    [EARTH - 660000, 1600], [EARTH - 410000, 1480], [EARTH - 70000, 1250], [EARTH - 11320, 250],
                    [EARTH - 4321, 1.5], [EARTH - 1000, 4], [EARTH - 200, 11], [EARTH, 14]]
# Слои вокруг «пузыря» глубже километра: [с какого s, какой слой]; соседние слои плавно смешиваются
s['layers'] = [[0, 'gneiss'], [9000, 'granite'], [18000, 'granulite'], [36000, 'peridotite'], [410000, 'wadsleyite'],
               [520000, 'ringwoodite'], [660000, 'bridgmanite'], [2700000, 'dpp'], [2890000, 'liquid'], [5150000, 'crystal'],
               [EARTH - 5150000, 'liquid'], [EARTH - 2890000, 'dpp'], [EARTH - 2700000, 'bridgmanite'], [EARTH - 660000, 'ringwoodite'],
               [EARTH - 520000, 'wadsleyite'], [EARTH - 410000, 'peridotite'], [EARTH - 11320, 'gabbro'], [EARTH - 8500, 'dikes'],
               [EARTH - 6300, 'pillows'], [EARTH - 4800, 'sediment'], [EARTH - 4321, 'water']]

order = ['duration', 'fps', 'player', 'plaza', 'crack', 'under', 'soil_top', 'manhole', 'pipes', 'train', 'rock', 'slabs', 'earth',
         'center', 'ocean', 'layers', 'temperature', 'depth', 'head_yaw', 'body_yaw', 'head_pitch', 'balance', 'check', 'shield',
         'float', 'tread', 'captions', 'title', 'compare', 'milestones', 'traffic']
s = {k: s[k] for k in order}
lines = ['{']
for i, k in enumerate(order):
    end = ',' if i < len(order) - 1 else ''
    if k in ('traffic', 'captions'):
        lines.append(f' "{k}": [')
        for j, item in enumerate(s[k]):
            lines.append('  ' + json.dumps(item, ensure_ascii=False) + (',' if j < len(s[k]) - 1 else ''))
        lines.append(' ]' + end)
    else:
        lines.append(f' {json.dumps(k)}: {json.dumps(s[k], ensure_ascii=False)}{end}')
lines.append('}')
P.write_text('\n'.join(lines) + '\n')

# проверки
for k in ['depth', 'head_yaw', 'head_pitch', 'balance', 'check', 'shield', 'float', 'tread', 'body_yaw']:
    ts = [x[0] for x in s[k]]
    bad = [(a, b) for a, b in zip(ts, ts[1:]) if b <= a]
    assert not bad, (k, bad[:3])
ds = [x[1] for x in s['depth']]
assert all(b >= a for a, b in zip(ds, ds[1:])), 'depth must not decrease'
caps = s['captions']
over = [(a[2][:30], b[2][:30]) for a, b in zip(caps, caps[1:]) if b[0] < a[1] + 0.3]
print('captions', len(caps), 'overlaps:', over)
print('milestones at:', {d: at_depth(d) for d in [1857, 2212, 3000, 5000, 8849, 10935, 20000, 50000, 100000, 150000, 300000, 410000, 520000]})
print('speeds km/h:', {t: kmh(t) for t in [191, 243.6, 377, 498.3]})
