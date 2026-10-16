"""Раскадровка ролика «What If Earth Spun Faster and Faster?» → spin/scene.json.

Герой стоит на вершине Чимборасо (Эквадор, 6 263 м) — самой далёкой от центра Земли точке. Время ускорено
(1 с = 30 мин), и при этом Земля крутится всё быстрее: сутки сокращаются по экспоненте. Отсюда же звук
(spin/audio.py) берёт моменты рассветов, землетрясений и т. п., поэтому картинка и звук совпадают.

    python3 spin/story.py
"""
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
DUR = 968.0  # 16:08

# --- время: сколько часов истории проходит за секунду ролика ------------------------------------------------
# сначала реальное время, потом разгон до 1 с = 30 мин (с 24-й по 36-ю секунду)
TIMELAPSE = [[0, 1 / 3600], [24, 1 / 3600], [36, 0.5], [448.2, 0.5], [452.8, 1 / 60], [474, 1 / 60], [490, 0.5], [540, 0.5],
             [552, 24], [636, 24], [644, 168], [666, 168], [672, 730], [717, 730], [723, 8766], [764, 8766], [771, 1 / 60],
             [797, 1 / 60], [801, 1 / 3600], [905, 1 / 3600], [925, 8.766e9], [DUR, 8.766e9]]
TAU0 = 5.75  # местное солнечное время в начале, ч (5:45, рассвет ещё не наступил)

# --- вращение: сутки сокращаются по экспоненте от 23 ч 56 мин; ниже ~2,2 ч Земля раскрутиться не может ---------
# P — период вращения относительно звёзд; солнечные сутки (от рассвета до рассвета) чуть длиннее: 1/(1/P − 1/год)
SPIN = {'t_start': 36.0, 'P0': 23.9345, 'T': 91.7, 'P_min': 2.2, 'rate': 0.5}
YEAR_H = 8766.15
SUN_FREEZE = (488.2, 500.2)  # в космосе суточное движение Солнца затухает (иначе день и ночь мелькали бы)

LAT = -1.469  # широта вершины
R_SUMMIT = 6384.39  # км от центра Земли
MASS = 70.0  # кг: «вес» героя на браслете при нынешней силе тяжести на вершине


def smooth(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def k_at(t):
    """Часов истории в секунду ролика: между ключами — плавный переход."""
    for (t0, k0), (t1, k1) in zip(TIMELAPSE, TIMELAPSE[1:]):
        if t <= t1:
            return k0 + (k1 - k0) * smooth((t - t0) / (t1 - t0))
    return TIMELAPSE[-1][1]


def period_at(t):
    """Период вращения (ч) в момент ролика t. Расписание разгона задано во времени ролика (а не истории): при
    1 с = 30 мин сутки сокращаются вдвое примерно за 64 часа; когда ускорение времени меняется (замедление
    у отрыва от вершины), разгон идёт по тому же расписанию."""
    P = SPIN['P0'] * math.exp(-max(0.0, t - SPIN['t_start']) * SPIN['rate'] / SPIN['T'])
    # мягкий упор в предел: ниже Земля сбрасывает экватор в кольцо и быстрее не крутится
    m = SPIN['P_min']
    P = m + (P - m) * smooth((P - m) / 0.6) if P < m + 0.6 else P
    # в конце (миллионы лет в секунду) приливы новой луны понемногу тормозят Землю
    return P + 0.32 * smooth((t - 922.0) / 36.0)


def integrate(step=1 / 240):
    """tau(t) — часы истории; turns(t) — оборотов Земли относительно Солнца с начала (солнечные сутки)."""
    out = []
    t, tau, turns = 0.0, 0.0, 0.0
    tau_s = None
    while t <= DUR + step:
        if tau_s is None and t >= SPIN['t_start']:
            tau_s = tau
        P = period_at(t)
        out.append((t, tau, turns, P))
        k = k_at(t)
        tau += k * step
        turns += k * step * (1 / P - 1 / YEAR_H) * (1 - smooth((t - SUN_FREEZE[0]) / (SUN_FREEZE[1] - SUN_FREEZE[0])))
        t += step
    return out, tau_s


# --- вес и расстояние до центра по длине суток (оценка: см. описание к ролику) ------------------------------
# до ~4 ч — равновесная сплюснутость Земли (Дарвин — Радау), дальше — плавно к невесомости при ~2,25 ч
BY_P = [  # [период вращения, ч; вес, кг; расстояние вершины от центра, км]
    # вес = 70 кг · (GM/r² − ω²r) / (то же сегодня); r до ~4 ч — равновесная сплюснутость (Дарвин — Радау), к
    # пределу — как у тела с плотным ядром (модель Роша): экватор вытягивается, пока скорость не станет орбитальной
    [23.9345, 70.0, 6384], [20, 69.95, 6386], [16, 69.6, 6391], [12, 68.9, 6402], [10, 68.2, 6414],
    [8, 66.8, 6440], [6, 63.8, 6500], [5, 60.8, 6560], [4, 54.8, 6690], [3.5, 49.2, 6830],
    [3.0, 39.9, 7080], [2.7, 29.7, 7420], [2.5, 19.1, 7840], [2.35, 9.1, 8270], [2.25, 0.0, 8717],
    [2.2, 0.0, 8588],
]


def by_p(P, col):
    pts = sorted(BY_P)
    if P <= pts[0][0]:
        return pts[0][col]
    for a, b in zip(pts, pts[1:]):
        if P <= b[0]:
            u = (P - a[0]) / (b[0] - a[0])
            return a[col] + (b[col] - a[col]) * u
    return pts[-1][col]


# --- подписи --------------------------------------------------------------------------------------------
CAPTIONS = [
    [0.8, 3.6, 'Chimborazo, Ecuador. 6,263 metres.'],
    [4.4, 7.4, 'The farthest point from the centre of the Earth.'],
    [8.4, 11.6, 'Everest is higher above the sea. This summit is 2 km farther out.'],
    [12.4, 15.4, 'Earth spins, so it bulges at the equator.'],
    [16.2, 19.4, 'Up here, the ground carries you east at 1,675 km/h.'],
    [20.2, 23.0, "You don't feel it. The spin is perfectly steady."],
    [24.0, 27.0, "Let's speed up time. One second: half an hour."],
    [27.8, 30.6, 'At the equator, the Sun rises straight up.'],
    [31.6, 34.6, 'A normal day on Earth: 24 hours.'],
    [35.6, 38.6, 'Now imagine Earth starts to spin faster.'],
    [39.6, 42.0, 'At noon, the Sun is straight overhead.'],
    [42.6, 45.4, 'Your shadow hides right under your feet.'],
    [46.2, 48.6, 'And Earth spins faster still.'],
    [49.6, 52.8, 'The faster it spins, the faster the Sun crosses the sky.'],
    [54.0, 57.4, 'This day is already shorter than the last.'],
    # 1:00–2:00 — ночь со звёздными дугами; вода стекается к экватору
    [60.6, 63.8, 'At night, the stars streak across the sky.'],
    [64.6, 68.2, 'In this thought experiment, the air speeds up with the ground.'],
    [68.8, 72.6, 'Otherwise, the wind would be stronger than any hurricane.'],
    [74.8, 77.8, 'Sunrise. But something has changed.'],
    [78.6, 82.0, 'Overnight, the Pacific has flooded the coast.'],
    [82.8, 86.4, 'Spin flings water toward the equator.'],
    [87.2, 90.6, 'The sea here has risen a kilometre.'],
    [91.4, 95.0, 'The Sun now sets over flooded lowlands.'],
    [95.8, 99.4, 'Near the poles, the opposite happens: the sea drains away.'],
    [100.2, 103.6, "The ocean is piling up around Earth's waist."],
    [104.4, 107.8, 'And Earth keeps speeding up.'],
    [110.0, 113.4, 'This day lasted less than 18 hours.'],
    [114.2, 117.8, 'Beyond those mountains, the Amazon is now a sea.'],
    # 2:00–3:00 — Анды становятся островами
    [120.4, 123.8, 'A day is now shorter than a day on Neptune.'],
    [124.6, 128.0, 'The sea climbs the Andes.'],
    [129.0, 132.6, "Quito, Ecuador's capital, sits at 2,850 metres."],
    [133.4, 137.0, 'The sea is reaching it.'],
    [139.8, 143.4, 'Here, the ocean is now 3 km higher than normal.'],
    [144.2, 147.8, 'North of about 35 degrees, the seas are draining.'],
    [148.6, 152.2, 'The Arctic Ocean and the Mediterranean dry up.'],
    [153.0, 156.6, 'Air piles up at the equator too.'],
    [157.4, 161.0, 'Up here, the air gets thicker. Breathing gets easier.'],
    [165.2, 168.8, 'At dawn, the Andes have become islands.'],
    [169.6, 173.2, 'But the ground is under enormous strain.'],
    [174.0, 177.6, 'Rock can bend. But not this far.'],
    # 3:00–4:00 — порода уступает: землетрясения, извержения, суша поднимается, море уходит
    [180.4, 183.8, 'Earth starts to change its shape.'],
    [184.6, 188.2, 'Under this much stress, solid rock slowly flows.'],
    [189.0, 192.6, 'Days are now as short as on Saturn.'],
    [193.4, 196.6, 'Volcanoes wake up.'],
    [197.4, 201.0, 'A day is now shorter than on Jupiter, the fastest-spinning planet.'],
    [201.8, 205.4, 'Earthquakes shake the whole equator.'],
    [206.2, 209.8, 'The equator itself is rising.'],
    [210.6, 214.2, 'The land is catching up with the sea.'],
    [215.0, 218.6, 'And the water drains back.'],
    [219.4, 223.0, 'Lightning flickers inside the ash.'],
    [223.8, 227.4, 'The equator has moved 50 km farther out.'],
    [228.2, 231.8, 'The sea here is back near its old level.'],
    [232.6, 236.2, 'But the spin keeps getting faster.'],
    # 4:00–5:00 — легче; Луна; полосы облаков
    [240.4, 243.8, 'The volcanoes keep smoking for days.'],
    [244.6, 248.2, 'But something else is changing.'],
    [249.0, 252.6, 'Check your wrist scale: 66 kg.'],
    [253.4, 257.0, 'You weighed 70.'],
    [257.8, 261.4, 'The spinning ground is starting to fling you outward.'],
    [262.2, 265.8, 'Gravity still wins. For now.'],
    [266.6, 270.2, 'The Moon now rises and sets every few hours.'],
    [271.0, 274.6, 'Below, the clouds stretch into stripes.'],
    [275.4, 279.0, 'Fast spin pulls weather into bands, like on Jupiter.'],
    [279.8, 283.4, 'But the Moon still takes a month to circle Earth.'],
    [284.2, 287.8, 'The ground carries you east at 6,500 km/h,'],
    [288.2, 291.6, 'faster than a rifle bullet.'],
    [292.4, 296.0, 'One day now lasts less than 6 hours.'],
    # 5:00–6:00 — Земля сплющивается; 5 часов — запомните
    [300.4, 304.0, 'Days and nights now flicker past.'],
    [304.8, 308.4, 'The equator keeps swelling outward.'],
    [309.2, 312.8, 'This summit is now 150 km farther from the centre.'],
    [313.6, 317.2, 'The poles sink. Earth is becoming a squashed ball.'],
    [318.0, 321.6, 'On the dial, the next mark is a question mark.'],
    [322.4, 325.6, 'A 5-hour day.'],
    [326.4, 330.0, 'Remember this number. It will matter later.'],
    [331.2, 334.8, 'Your scale: under 60 kg.'],
    [335.6, 339.2, 'The ground now moves at 9,000 km/h.'],
    [339.8, 343.2, 'Every hour, Earth loses more of its grip on you.'],
    [343.8, 347.2, 'The sky now turns around you every 4 and a half hours.'],
    [347.8, 351.2, 'Stars race overhead.'],
    [351.8, 355.2, 'Nights last barely two hours.'],
    [355.8, 359.2, 'And you keep getting lighter.'],
    # 6:00–7:00 — прыжки
    [360.4, 364.0, 'Try a jump.'],
    [365.6, 369.0, 'A little higher. A little longer.'],
    [369.6, 373.2, 'A day as short as on Haumea,'],
    [373.4, 377.2, 'a dwarf planet stretched into an egg by its spin.'],
    [377.6, 381.2, 'Earth is stretching too: the equator is 400 km farther out.'],
    [381.6, 385.0, 'The ground now carries you at 12,000 km/h.'],
    [385.6, 389.2, 'Your scale: 50 kg.'],
    [389.6, 393.2, 'Every hour, you lose more than half a kilogram.'],
    [393.6, 397.0, 'Jump again.'],
    [399.0, 402.4, 'Almost a second in the air.'],
    [402.8, 406.4, 'Your crampons keep you anchored to the ice.'],
    [406.8, 410.4, 'The dial is nearing its end.'],
    [410.8, 414.4, 'Float-off is now less than a day away.'],
    [415.0, 418.6, 'Your scale: 40 kg.'],
    # 7:00–8:00 — снег поднимается; отрыв
    [420.4, 424.0, 'Now the change is fast.'],
    [424.8, 428.4, '35 kilograms.'],
    [429.2, 432.8, 'Snow grains lift off the ground.'],
    [433.4, 436.8, "It's snowing upward."],
    [437.4, 440.4, 'One more jump.'],
    [441.4, 445.0, 'You hang in the air.'],
    [445.6, 449.0, "Let's slow time down."],
    [449.6, 453.2, 'Your weight: 10 kg. Then 5.'],
    [453.6, 457.2, 'The ground moves at orbital speed: 24,000 km/h.'],
    [457.6, 460.8, 'Zero.'],
    [461.4, 464.6, 'You let go.'],
    [465.2, 468.8, 'And float off the top of the world.'],
    [469.4, 473.2, "Don't worry: in this thought experiment, your suit keeps you alive."],
    [473.8, 477.4, 'You are now in orbit around Earth.'],
    # 8:00–9:00 — подъём; Земля сбрасывает экватор; кольцо
    [480.4, 484.0, 'Below you, the summit slides away to the east.'],
    [484.6, 488.2, 'Earth now spins faster than you orbit it.'],
    [488.8, 492.4, 'Loose ice and dust lift off with you.'],
    [493.0, 496.6, 'The equator is now 2,200 km farther out than before.'],
    [497.2, 500.8, "Earth's poles have sunk. Its waist is stretched into a sharp rim."],
    [501.4, 505.0, "The sky turns black. You're above the air."],
    [505.6, 509.2, 'Along that rim, Earth is shedding rock, water and ice.'],
    [509.8, 513.4, 'It cannot spin any faster.'],
    [514.0, 517.6, 'Any extra spin, it throws away with its equator.'],
    [518.2, 521.8, 'The shed material stays in orbit above the equator.'],
    [522.4, 526.0, 'Collisions flatten it into a thin disk.'],
    [526.6, 530.2, 'Earth is growing a ring.'],
    [530.8, 534.4, 'Like Saturn.'],
    [535.0, 538.6, 'And you are inside it.'],
    # 9:00–10:00 — кольцо целиком
    [540.4, 544.0, 'Now imagine the push stops.'],
    [544.6, 548.2, 'From here on, it is just physics.'],
    [548.8, 552.4, "Let's speed up time: one second, one day."],
    [553.0, 556.6, 'Behind you, the ring takes shape.'],
    [557.2, 560.8, 'Rock and ice, grinding together in orbit.'],
    [561.4, 565.0, 'The ring is thousands of kilometres wide,'],
    [565.4, 569.0, 'and only a few kilometres thick.'],
    [569.6, 573.2, 'It casts a shadow across the planet.'],
    [573.8, 577.4, "And Earth's shadow falls across the ring."],
    [578.0, 581.6, "Earth's day is stuck at 2 hours and 12 minutes."],
    [582.2, 585.8, 'Its oceans and air hug the swollen equator.'],
    [586.4, 590.0, 'Collisions slowly push the ring outward.'],
    [590.6, 594.2, 'And they carry you outward with it.'],
    [594.8, 598.4, 'How far can a ring spread?'],
    # 10:00–11:00 — предел Роша
    [600.4, 604.0, 'There is a limit.'],
    [604.6, 608.2, 'Close to a planet, tides stretch anything in orbit.'],
    [608.8, 612.4, 'The near side of a clump is pulled harder than its far side.'],
    [613.0, 616.6, 'So clumps are torn apart before they can grow.'],
    [617.2, 620.8, 'This boundary is called the Roche limit.'],
    [621.4, 625.0, 'For rock around Earth: about 19,000 km from the centre.'],
    [625.6, 629.2, 'Inside it, you get a ring.'],
    [629.8, 633.4, "That's why Saturn's rings never became moons."],
    [634.0, 637.6, 'Outside it, clumps can survive.'],
    [638.2, 641.8, "Let's speed up again: one second, one week."],
    [642.4, 646.0, 'The ring spreads past the line.'],
    [646.6, 650.2, 'And out there, something changes.'],
    [650.8, 654.4, 'The ring starts to break into clumps.'],
    [655.0, 658.6, 'They are no longer torn apart.'],
    # 11:00–12:00 — комки и луночки
    [660.4, 664.0, 'Snowballs. Boulders. Hills.'],
    [664.6, 668.2, 'They collide gently and stick together.'],
    [668.8, 672.4, 'One second: one month.'],
    [673.0, 676.6, 'Moonlets, tens of kilometres across.'],
    [677.2, 680.8, 'They grow by sweeping up the ring.'],
    [681.4, 685.0, 'Each one clears a lane as it orbits.'],
    [685.6, 689.2, 'Some of them crash into each other,'],
    [689.6, 693.2, 'and merge.'],
    [694.0, 697.6, 'Hundreds of kilometres across now.'],
    [698.2, 701.8, 'One of them is winning.'],
    [702.4, 706.0, 'The biggest one pulls the hardest.'],
    [706.6, 710.2, 'It swallows its neighbours, one by one.'],
    [710.8, 714.4, 'And keeps growing.'],
    # 12:00–13:00 — новая луна
    [720.4, 724.0, 'One second: one year.'],
    [724.6, 728.2, 'Inside the limit, the ring slowly rains back down onto Earth.'],
    [728.8, 732.4, 'Outside it, the debris feeds one growing world.'],
    [733.0, 736.6, 'A few decades after you floated off...'],
    [737.2, 740.8, 'Earth has a second moon.'],
    [741.4, 745.0, 'About 2,600 km across: three-quarters the size of ours.'],
    [745.6, 749.2, 'Born from the ring around Earth.'],
    [749.8, 753.4, 'Far away, the old Moon is still there.'],
    [754.0, 757.6, 'You drift toward the new one.'],
    [758.2, 761.8, 'Its gravity takes hold of you.'],
    [766.6, 770.2, "Let's slow time down."],
    [771.0, 774.6, 'You are falling toward a brand-new world.'],
    [775.2, 778.8, 'Fresh rock, frosted with ice from Earth’s old oceans.'],
    # 13:00–14:00 — посадка
    [780.4, 784.0, 'Gravity here is weak.'],
    [784.6, 788.2, 'You fall slowly.'],
    [796.6, 800.2, 'Back to real time.'],
    [802.4, 805.6, 'Touchdown.'],
    [806.2, 809.8, 'Your weight: 8 kg.'],
    [810.4, 814.0, 'Look up.'],
    [814.6, 818.2, 'Earth fills almost 40 degrees of the sky.'],
    [818.8, 822.4, 'A squashed, striped planet with a ring.'],
    [823.0, 826.6, 'It spins once every 2 hours and 12 minutes.'],
    [827.2, 830.8, 'And there is the old Moon.'],
    [831.4, 835.0, 'Two moons now circle Earth.'],
    [835.6, 839.2, 'But this has happened before.'],
    # 14:00–15:00 — разгадка
    [840.4, 844.0, 'Sound familiar?'],
    [844.6, 848.2, 'Remember the 5-hour day?'],
    [848.8, 852.4, '4.5 billion years ago, a world the size of Mars hit the young Earth.'],
    [853.0, 856.6, 'Scientists call it Theia.'],
    [857.2, 860.8, 'The impact melted Earth and set it spinning fast.'],
    [861.4, 865.0, 'It threw molten rock into orbit.'],
    [865.6, 869.2, 'The debris formed a ring around Earth.'],
    [869.8, 873.4, 'Inside the Roche limit, it stayed a ring.'],
    [874.0, 877.6, 'Outside it, the debris clumped together.'],
    [878.2, 881.8, 'Within a century, it had become a moon.'],
    [882.4, 886.0, 'Our Moon.'],
    [886.6, 890.2, "Moon rocks are almost identical to Earth's mantle."],
    [890.8, 894.4, 'And back then, Earth spun once every 5 hours.'],
    [894.8, 898.4, 'That was the mark on the dial.'],
    # 15:00–16:08 — приливы тормозят Землю
    [900.4, 904.0, 'So where did the 5-hour day go?'],
    [904.6, 908.2, "The Moon's pull raises tides on Earth."],
    [908.8, 912.4, "The tides act like a brake on Earth's spin."],
    [913.0, 916.6, "And Earth's lost spin pushes the Moon away."],
    [917.2, 920.8, 'Watch it happen to your new moon.'],
    [921.4, 925.0, 'One second: one million years.'],
    [925.6, 929.2, 'Earth shrinks in the sky as the moon drifts away.'],
    [929.8, 933.4, "The ring is gone. Earth's day grows longer."],
    [934.0, 937.6, 'Over billions of years, this turned our 5-hour day into 24 hours.'],
    [938.2, 941.8, 'And it is still happening.'],
    [942.4, 946.0, 'The Moon drifts 3.8 cm farther away every year.'],
    [946.6, 950.2, 'And every century, your day grows about 1.8 milliseconds longer.'],
    [950.8, 955.6, 'Every tide you see is the Moon slowing Earth down.'],
]

# --- взгляд: (начало, конец, поворот головы, наклон) — относительно корпуса, который смотрит на восток ---------
LOOKS = [
    (0.0, 3.8, 0, 4), (4.6, 7.6, 0, -38), (8.6, 12.2, 72, -2), (13.2, 16.4, 150, -6), (17.4, 20.6, -60, -10),
    (21.6, 26.2, 0, 2), (27.0, 30.4, 0, 6), (31.4, 33.4, 0, 22), (34.4, 37.6, 0, 52),
    (39.0, 45.0, 4, -52),  # тень у ног: короче, короче — исчезла — и вытянулась вперёд, на восток
    (46.4, 48.6, 178, 46), (50.0, 53.8, 180, 6), (54.4, 60.0, 176, 3),
    # 1:00–2:00 (0 — восток, 90 — север, 180 — запад, −90 — юг)
    (61.4, 64.2, 150, 48), (65.2, 72.4, 176, 16), (73.4, 77.4, 4, -2), (78.4, 82.0, 176, -7), (82.8, 86.6, 150, -12),
    (87.4, 90.4, -150, -8), (91.2, 95.4, 178, -2), (96.2, 99.6, 150, -10), (100.4, 103.8, 178, 30), (104.6, 108.0, 110, 52),
    (109.0, 113.4, 0, 0), (114.2, 119.4, 10, -4),
    # 2:00–3:00
    (120.4, 124.0, 50, -6), (125.0, 128.4, 170, -8), (129.4, 137.2, 62, -5), (138.2, 143.6, 0, -6),
    (144.6, 152.4, 100, 6), (153.4, 161.0, 160, 12), (162.0, 168.8, 30, -7), (169.6, 173.2, 20, -20),
    (174.0, 179.4, -20, -6),
    # 3:00–4:00
    (180.4, 184.0, 30, 2), (185.0, 188.6, -10, -24), (189.4, 192.6, 40, -4), (193.4, 201.0, 2, 4),
    (202.0, 205.4, -48, -6), (206.2, 209.8, 170, -8), (210.6, 218.6, 64, 2), (219.4, 223.0, -28, 4),
    (223.8, 227.4, 100, -4), (228.2, 232.0, 180, -10), (232.6, 239.6, 20, 18),
    # 4:00–5:00
    (240.4, 244.0, 140, -4), (244.6, 247.8, 40, 6), (248.8, 253.2, -12, -34), (254.2, 261.4, 0, -8), (262.2, 265.4, 10, 20),
    (266.4, 270.4, 0, 72), (271.2, 278.8, -20, -12), (279.8, 283.4, 0, 72), (284.2, 291.8, 0, 2), (292.6, 299.6, 120, 30),
    # 5:00–6:00
    (300.4, 304.0, 170, 10), (304.8, 312.8, -90, -6), (313.6, 317.2, 90, -4), (318.0, 325.8, 30, 8), (326.6, 330.2, 0, 0),
    (331.0, 335.0, -12, -34), (335.8, 343.2, -40, 4), (344.0, 351.2, 160, 55), (352.0, 359.6, 60, 20),
    # 6:00–7:00
    (360.4, 364.4, 0, -22), (365.6, 369.2, 0, -10), (369.8, 377.2, -30, 10), (378.0, 385.0, 100, -5), (385.6, 389.6, -12, -34),
    (390.4, 397.6, 0, -22), (398.8, 402.4, 0, -8), (403.0, 406.4, 10, -55), (407.0, 414.2, -120, 15), (414.8, 419.4, -12, -34),
    # 7:00–8:00
    (420.4, 424.0, 40, 5), (424.6, 428.8, -12, -34), (429.4, 437.0, 0, -35), (437.6, 441.0, 0, -20), (441.6, 445.0, 0, 5),
    (445.6, 449.2, -60, 20), (449.6, 454.0, -12, -34), (454.4, 457.4, 0, 0), (458.0, 465.0, 0, -30), (465.8, 473.0, 0, -70),
    (473.8, 480.0, 30, -40),
    # 8:00–9:00 (тело вертикально, как на вершине)
    (480.6, 488.2, 10, -72), (489.0, 492.4, 70, -15), (493.2, 500.8, 0, -86), (501.6, 505.0, 20, 50),
    (505.8, 513.4, 0, -40), (514.2, 521.8, 30, -78), (522.6, 530.2, 4, 6), (531.0, 546.0, 0, -35), (552.0, 600.0, 0, -10),
]

# --- уровень моря у вершины (м над нынешним) ---------------------------------------------------------------
# равновесный подъём на экваторе: Δ(ω²)·a²/(6g); ×1,12 — притяжение самой воды, ×0,7 — упругая Земля
# немного поднимается вместе с водой; воды в океане не бесконечно — насыщение около 4,5 км. Вода догоняет
# равновесие за ~14 ч. С ~2:55 порода начинает течь (под таким напряжением — часы), суша поднимается и
# догоняет воду: относительный уровень падает почти до прежнего.
G = 9.8
A_EARTH = 6.371e6
SEA_LAG = 14.0
YIELD = (175.0, 235.0, 0.93)


def sea_target(P):
    w0 = 2 * math.pi / (SPIN['P0'] * 3600)
    w = 2 * math.pi / (P * 3600)
    H = 0.784 * (w * w - w0 * w0) * A_EARTH ** 2 / (6 * G)
    return 4500 * math.tanh(H / 4500)


def sea_keys(table):
    h, prev, keys = 0.0, 0.0, []
    for i, (t, tau, turns, P) in enumerate(table):
        h += (sea_target(P) - h) * (1 - math.exp(-(tau - prev) / SEA_LAG))
        prev = tau
        if i % 120 == 0:
            y = smooth((t - YIELD[0]) / (YIELD[1] - YIELD[0])) * YIELD[2]
            keys.append([round(t, 3), round(h * (1 - y), 1)])
    return keys


# взгляд на браслет (весы): интервалы
CHECKS = [(248.8, 253.2), (331.0, 335.0), (385.6, 389.6), (414.8, 419.4), (424.6, 428.8), (449.6, 454.0)]
# прыжки: момент толчка (вес в этот момент задаёт тяготение — прыжок выше и дольше)
JUMPS = [364.6, 398.0, 438.0, 450.6]
FLOAT_AT = 461.5  # отпускает лёд и уплывает вверх
G0 = 9.745


def pose_keys(spans, ramp=0.6):
    keys = [[0, 0]]
    for a, b in spans:
        keys += [[a, 0], [a + ramp, 1], [b - ramp, 1], [b, 0]]
    keys.append([DUR, 0])
    return keys


def jump_keys(table):
    out = []
    for t0 in JUMPS:
        P = next(P for t, tau, turns, P in table if t >= t0)
        out.append([t0, round(G0 * by_p(P, 1) / MASS, 4)])
    return out


# --- после отрыва: где герой. [t, высота над точкой вершины (м)] — по логарифму; потом в космосе — расстояние
# от центра, наклон к плоскости экватора и «долгота» (отсчёт от направления на вершину, к востоку)
HERO_ALT = [[461.5, 0.0], [470, 1.8], [480, 8.5], [488, 90], [494, 2500], [500, 30000], [504, 70000], [510, 150000], [520, 330000],
            [530, 700000], [540, 1.3e6]]
# сдвиг поверхности под героем к востоку (рад): Земля вращается быстрее, чем герой обходит её по орбите
GROUND = [[461.5, 0.0], [480, 4e-6], [490, 6e-4], [500, 0.012], [520, 0.12], [540, 0.45]]
# Солнце в космосе: суточное движение затухает (при большом ускорении времени день и ночь мелькали бы)


# в космосе (с 540 с): [t, расстояние от центра Земли (км), наклон к плоскости колец (°), долгота (°, от вершины к востоку)]
CAM3 = [[540, 9888, 1.5, 0.0], [552, 11500, 2.5, -1.0], [570, 15500, 8.0, -6.0], [600, 24000, 19.0, -14.0], [630, 30000, 23.0, -18.0],
        [660, 33000, 20.0, -10.0], [690, 31500, 10.0, 8.0], [720, 29500, 6.0, 22.0], [745, 28500, 5.0, 30.0], [762, 28000, 4.5, 33.0]]
# куда смотреть в космосе: [начало, конец, цель, поворот °, наклон °]; цели: planet, ring (точка кольца на 15 000 км у долготы
# героя), moon (новая луна), sun, oldmoon, out (от Земли), along (вдоль орбиты)
LOOK3 = [[540, 552, 'planet', 0, 0], [555, 598, 'planet', 0, 0], [601, 616, 'planet', 0, 0], [617, 637, 'planet', 0, -8],
         [640, 658, 'roche', 0, 0], [661, 672, 'along', -10, -4], [674, 696, 'moonlets', 0, 0], [699, 716, 'moon', 0, 0],
         [720, 748, 'planet', 0, 0], [750, 753.4, 'oldmoon', 0, 0], [755, 778, 'moon', 0, 0], [784, 796, 'mhorizon', 0, 0],
         [800, 806, 'mhorizon', 0, -30]]
# подлёт к новой луне: [t, высота над её поверхностью, м]
APPROACH = [[762, 3.0e6], [772, 1.2e6], [780, 2.5e5], [790, 2.0e4], [797, 900], [801, 40], [803.2, 0.0]]
LAND_AT = 803.2
# после посадки: [начало, конец, цель, поворот, наклон] — цели earth, oldmoon, ground, horizon, sun
LOOK_MOON = [[803.2, 809.0, 'ground', 0, 0], [810.4, 822.4, 'earth', 0, 0], [823, 826.6, 'earth', 6, -3], [827.2, 834.0, 'oldmoon', 0, 0],
             [835.0, 852.0, 'earth', -8, -6], [853.0, 864.0, 'earth', 10, 0], [865.0, 878.0, 'ring', 0, 0], [879.0, 890.0, 'oldmoon', 0, 0],
             [891.0, 912.0, 'earth', 0, -4], [913.0, 968.0, 'earth', 0, 0]]
# луна уходит от Земли в конце: [t, расстояние от центра Земли, км]
MOON_A = [[0, 24500], [915, 24500], [925, 27000], [945, 52000], [968, 70000]]
RING = {'grow': (508, 538), 'spread': (600, 660), 'fade': (720, 760), 'gone': (915, 935)}


# облачность: доля неба под облаками внизу (на рассвете — море облаков, при потопе — реже)
CLOUD = [[0, 0.56], [6, 0.56], [40, 0.38], [60, 0.36], [80, 0.27], [170, 0.24], [190, 0.3], [240, 0.32], [DUR, 0.32]]
# землетрясения: [время, сила 0…1]
SHAKE = [[0, 0], [170.2, 0], [171.3, 0.25], [173.2, 0.08], [175.5, 0.0], [186.0, 0], [187.0, 0.6], [189.6, 0.85], [192.0, 0.4],
         [195.0, 0.15], [203.0, 0.1], [205.0, 0.45], [207.0, 0.12], [216.0, 0.05], [221.0, 0.3], [223.0, 0.05], [236.0, 0.0], [DUR, 0]]
# извержения: [вулкан, начало, сила] — вулканы из spin/summit.js PEAKS
ERUPTIONS = [['Tungurahua', 193.2, 1.0], ['Sangay', 203.0, 0.8], ['Cotopaxi', 211.0, 0.9], ['El Altar', 219.0, 0.55]]
# лавины со склонов Чимборасо: [время, азимут °, расстояние км]
AVALANCHES = [[171.6, 70, 1.6], [187.4, 20, 1.9], [189.8, 120, 1.4], [190.6, -40, 2.2], [205.4, 160, 1.7], [221.4, 60, 2.0]]



def looks_to_keys(looks, rest_yaw, rest_pitch, move=1.1):
    yaw, pitch = [[0, looks[0][2]]], [[0, looks[0][3]]]
    for a, b, y, p in looks:
        for keys, v in ((yaw, y), (pitch, p)):
            if a > keys[-1][0] + 0.05:
                keys.append([a, v])
            keys.append([b, v])
    return yaw, pitch


def main():
    table, tau_s = integrate()
    yaw, pitch = looks_to_keys(LOOKS, 0, 0)
    # моменты рассветов и закатов (солнечное время 6:00 и 18:00) — для звука и проверки подписей
    events = []
    prev = None
    for t, tau, turns, P in table[::4]:
        sol = (TAU0 + 24 * turns) % 24
        if prev is not None:
            for h, name in ((6.0, 'sunrise'), (12.0, 'noon'), (18.0, 'sunset')):
                if prev < h <= sol:
                    events.append([round(t, 3), name])
        prev = sol
    scene = {
        'duration': DUR,
        'fps': 60,
        'timelapse': TIMELAPSE,
        'tau0': TAU0,
        'spin': SPIN,
        'year_h': YEAR_H,
        'lat': LAT,
        'r_summit': R_SUMMIT,
        'mass': MASS,
        'by_p': BY_P,
        'captions': CAPTIONS,
        'head_yaw': yaw,
        'head_pitch': pitch,
        'body_yaw': [[0, -90], [DUR, -90]],  # корпус смотрит на восток
        'check': pose_keys(CHECKS),
        'balance': [[0, 0], [436.0, 0], [440.0, 0.6], [457.0, 1.0], [FLOAT_AT, 0], [DUR, 0]],
        'float': [[0, 0], [FLOAT_AT, 0], [FLOAT_AT + 2.0, 1], [DUR, 1]],
        'jumps': jump_keys(table),
        'float_at': FLOAT_AT,
        'hero_alt': HERO_ALT,
        'ground': GROUND,
        'sun_freeze': SUN_FREEZE,
        'cam3': CAM3,
        'look3': LOOK3,
        'approach': APPROACH,
        'land_at': LAND_AT,
        'look_moon': LOOK_MOON,
        'moon_a': MOON_A,
        'ring': RING,
        'shield': [[0, 0], [DUR, 0]],
        'sun_events': events,
        'sea': sea_keys(table),
        'cloud': CLOUD,
        'shake': SHAKE,
        'eruptions': ERUPTIONS,
        'avalanches': AVALANCHES,
        'title': [DUR - 6, DUR],
    }
    (HERE / 'scene.json').write_text(json.dumps(scene, ensure_ascii=False, indent=1))
    print('spin starts at story hour', round(tau_s, 2))
    for t, tau, turns, P in table[::240 * 30]:
        print(f't={t:6.1f}s  tau={tau:7.2f} h  P={P:6.2f} h  weight={by_p(P, 1):5.1f} kg  r={by_p(P, 2):6.0f} km')
    print('events (first 12):', events[:12])
    print('sunrises:', len([e for e in events if e[1] == 'sunrise']))


if __name__ == '__main__':
    main()
