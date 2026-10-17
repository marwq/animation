# Хореография Short «почему бетонные разделители скошены»: 9 планов, камера, замедления, частицы.
#
# Каждый план — функция «экранного» времени τ (секунды от начала плана). Внутри плана время
# сцены t(τ) может замедляться (TimeMap), поэтому движение машин, обломков и камеры считается в
# Python и ставится ключами на каждый кадр. План k живёт на кадрах 1000·(k+1) + i, чтобы размытие
# в движении на стыках планов не тянуло ключи соседнего плана.
#
# Запуск:  ASSETS=... blender-python shots.py -- <out_dir> [test|render] [план ...]
import sys, os, math, random
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy
from mathutils import Vector, Matrix, Euler, Quaternion, noise
import scene as S

FPS = 24
# имя, начало, конец (секунды ролика) — по таймингу озвучки (voice/timeline.json)
SHOTS = [
    ('s1_hook', 0.00, 2.76),
    ('s2_aerial', 2.76, 5.40),
    ('s3_slope', 5.40, 7.62),
    ('s4_wall', 7.62, 10.30),
    ('s5a_climb', 10.30, 15.00),
    ('s5b_lane', 15.00, 16.86),
    ('s6_replay', 16.86, 19.06),
    ('s7_case', 19.06, 25.46),
    ('s8_final', 25.46, 28.00),
]


def frames_of(k):
    name, a, b = SHOTS[k]
    g0, g1 = round(a * FPS), round(b * FPS)
    return 1000 * (k + 1), g1 - g0          # первый кадр Blender, число кадров


def smooth(e0, e1, x):
    t = min(max((x - e0) / (e1 - e0), 0.0), 1.0)
    return t * t * (3 - 2 * t)


def lerp(a, b, t):
    return a + (b - a) * t


def vlerp(a, b, t):
    return Vector(a).lerp(Vector(b), t)


class TimeMap:
    """t(τ) = t0 + ∫ скорость(τ) dτ; скорость задаётся точками (τ, k) и линейно между ними."""

    def __init__(self, t0, keys):
        self.t0, self.keys = t0, keys
        self.step = 1 / 960
        n = int((keys[-1][0] + 1.0) / self.step) + 2
        acc, self.cum = 0.0, [0.0]
        for i in range(1, n):
            acc += self.speed((i - 0.5) * self.step) * self.step
            self.cum.append(acc)

    def speed(self, tau):
        ks = self.keys
        if tau <= ks[0][0]:
            return ks[0][1]
        for (a, sa), (b, sb) in zip(ks, ks[1:]):
            if tau <= b:
                return lerp(sa, sb, smooth(a, b, tau))
        return ks[-1][1]

    def __call__(self, tau):
        if tau < 0:
            return self.t0 + tau * self.speed(0)
        i = tau / self.step
        j = int(i)
        if j + 1 >= len(self.cum):
            return self.t0 + self.cum[-1] + (tau - (len(self.cum) - 1) * self.step) * self.keys[-1][1]
        return self.t0 + lerp(self.cum[j], self.cum[j + 1], i - j)


# Время сцены по экранному времени плана; t = 0 — момент удара / касания.
TM = {
    's1_hook': TimeMap(-0.55, [(0, 1.0), (0.42, 1.0), (0.6, 0.2), (1.55, 0.2), (2.05, 1.0), (2.8, 1.0)]),
    's4_wall': TimeMap(-1.45, [(0, 1.0), (1.38, 1.0), (1.5, 0.25), (2.3, 0.25), (2.6, 0.7)]),
    's5a_climb': TimeMap(-0.55, [(0, 0.5), (1.0, 0.5), (1.15, 0.12), (4.8, 0.12)]),
    's5b_lane': TimeMap(0.42, [(0, 0.9), (2.0, 1.0)]),
    's6_replay': TimeMap(-1.0, [(0, 0.85), (1.12, 0.85), (1.27, 0.18), (2.3, 0.18)]),
}
SLOPE_REVEAL = 1.42     # τ появления подсветки в плане 3
RED_PATH = (2.75, 0.75)  # τ начала и длительность прорисовки траектории в плане 7
RING_PULSE = 4.0        # τ вспышки кольца в плане 7


def impact_tau(name):
    """Экранное время (от начала плана), когда время сцены проходит через 0 — момент удара."""
    tm, lo, hi = TM[name], 0.0, 6.0
    for _ in range(60):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if tm(mid) < 0 else (lo, mid)
    return lo


def events():
    """Моменты событий в секундах ролика — для звука и титров."""
    start = {name: a for name, a, b in SHOTS}
    end = {name: b for name, a, b in SHOTS}

    def zero(name):
        tm, lo, hi = TM[name], 0.0, 6.0
        for _ in range(60):
            mid = (lo + hi) / 2
            lo, hi = (mid, hi) if tm(mid) < 0 else (lo, mid)
        return round(start[name] + lo, 3)
    ev = {'hook_impact': zero('s1_hook'), 'wall_impact': zero('s4_wall'), 'climb_contact': zero('s5a_climb'),
          'replay_impact': zero('s6_replay'), 'slope_reveal': round(start['s3_slope'] + SLOPE_REVEAL, 3),
          'red_path': round(start['s7_case'] + RED_PATH[0], 3), 'ring_pulse': round(start['s7_case'] + RING_PULSE, 3)}
    ev['cuts'] = [a for name, a, b in SHOTS[1:]]
    ev['slowmo'] = []
    for name, tm in TM.items():
        prev, n = None, int((end[name] - start[name]) * 100)
        for i in range(n + 1):
            slow = i < n and tm.speed(i / 100) < 0.5
            if slow and prev is None:
                prev = i / 100
            if not slow and prev is not None:
                ev['slowmo'].append((round(start[name] + prev, 2), round(start[name] + i / 100, 2)))
                prev = None
    return ev


# ---------------------------------------------------------------- ключи

def K(obj, path, f):
    obj.keyframe_insert(path, frame=f)


def key_scale(obj, f, s):
    obj.scale = (s, s, s) if not isinstance(s, (tuple, list, Vector)) else s
    K(obj, 'scale', f)


def look_quat(pos, target, roll=0.0):
    q = (Vector(target) - Vector(pos)).to_track_quat('-Z', 'Y')
    if roll:
        q = q @ Quaternion((0, 0, 1), roll)
    return q


class CamKeys:
    def __init__(self, cam):
        self.cam = cam
        cam.rotation_mode = 'QUATERNION'
        self.prev = None

    def set(self, f, pos, target, lens, roll=0.0, shake=(0, 0, 0)):
        q = look_quat(pos, target, roll)
        q = q @ Euler(shake, 'XYZ').to_quaternion()
        if self.prev is not None and self.prev.dot(q) < 0:
            q.negate()
        self.prev = q.copy()
        self.cam.location = pos
        self.cam.rotation_quaternion = q
        self.cam.data.lens = lens
        K(self.cam, 'location', f)
        K(self.cam, 'rotation_quaternion', f)
        self.cam.data.keyframe_insert('lens', frame=f)


def shake_at(tau, amp_deg, freq=11.0, seed=0.0):
    a = math.radians(amp_deg)
    return (a * noise.noise(Vector((tau * freq, seed, 0.3))),
            a * noise.noise(Vector((tau * freq, seed + 7.1, 1.7))),
            a * 0.5 * noise.noise(Vector((tau * freq, seed + 3.3, 4.2))))


# ---------------------------------------------------------------- машины

def car_matrix(x, y, z, yaw, roll=0.0, pitch=0.0):
    return Matrix.Translation((x, y, z)) @ Euler((pitch, roll, yaw), 'YXZ').to_matrix().to_4x4()


def pose_vehicle(V, f, st, scale=1.0):
    """st: dict(x, y, z, yaw, roll, pitch, dist, steer, crush{имя: значение}, hide_wheel)."""
    r = V['root']
    r.rotation_mode = 'YXZ'
    r.location = (st['x'], st['y'], st.get('z', 0.0))
    r.rotation_euler = (st.get('pitch', 0.0), st.get('roll', 0.0), st['yaw'])
    K(r, 'location', f)
    K(r, 'rotation_euler', f)
    key_scale(r, f, scale)
    spin = -st.get('dist', 0.0) / V['P']['wheel_r']
    for k, (we, sp) in V['wheels'].items():
        sp.rotation_euler = (spin, 0, 0)
        K(sp, 'rotation_euler', f)
        we.rotation_euler = (0, 0, st.get('steer', 0.0) if k[0] == 'F' else 0.0)
        K(we, 'rotation_euler', f)
        key_scale(we, f, 0.0 if st.get('hide_wheel') == k else 1.0)
    keys = V['body'].data.shape_keys
    if keys:
        for kb in keys.key_blocks[1:]:
            v = st.get('crush', {}).get(kb.name, 0.0)
            kb.value = v
            kb.keyframe_insert('value', frame=f)
            ck = V['cabin'].data.shape_keys.key_blocks[kb.name]
            ck.value = v
            ck.keyframe_insert('value', frame=f)


def wheel_world(V, st, key):
    P = V['P']
    lx = (-1 if key[1] == 'L' else 1) * P['track'] / 2
    ly = (1 if key[0] == 'F' else -1) * P['wb'] / 2
    m = car_matrix(st['x'], st['y'], st.get('z', 0.0), st['yaw'], st.get('roll', 0.0), st.get('pitch', 0.0))
    return m @ Vector((lx, ly, P['wheel_r']))


def pose_on_ground(V, x, y, yaw, ground, extra=None):
    """Посадка машины на рельеф: высоты под четырьмя колёсами → z, крен, тангаж."""
    P = V['P']
    c, s = math.cos(yaw), math.sin(yaw)
    h = {}
    for k in ('FL', 'FR', 'RL', 'RR'):
        lx = (-1 if k[1] == 'L' else 1) * P['track'] / 2
        ly = (1 if k[0] == 'F' else -1) * P['wb'] / 2
        wx, wy = x + lx * c - ly * s, y + lx * s + ly * c
        h[k] = ground(wx, wy) + (extra or {}).get(k, 0.0)
    z = sum(h.values()) / 4
    roll = math.atan2((h['FL'] + h['RL'] - h['FR'] - h['RR']) / 2, P['track'])
    pitch = math.atan2((h['FL'] + h['FR'] - h['RL'] - h['RR']) / 2, P['wb'])
    return z, roll, pitch


def ground_grass(x, y):
    if abs(x) < S.G_MED:
        return S.median_z(x) - 0.02 + 0.05 * noise.noise(Vector((x * 0.7, y * 0.7, 0.5)))
    return 0.0


def ground_flat(x, y):
    return 0.0


# ---------------------------------------------------------------- частицы

class Particle:
    """Баллистика с отскоками от земли; траектория считается заранее с шагом 1/240 с."""

    def __init__(self, p0, v0, w0, t0, life, radius, ground, rest=0.25, fric=0.55, drag=0.0, seed=0):
        self.t0, self.life, self.dt = t0, life, 1 / 240
        p, v, w = Vector(p0), Vector(v0), Vector(w0)
        rot = Vector((random.Random(seed).uniform(0, 6), random.Random(seed + 1).uniform(0, 6), 0))
        self.samples = []
        for i in range(int(life / self.dt) + 2):
            self.samples.append((p.copy(), rot.copy(), v.copy()))
            v.z -= 9.81 * self.dt
            v *= (1 - drag * self.dt)
            p += v * self.dt
            rot += w * self.dt
            gz = ground(p.x, p.y) + radius
            if p.z < gz:
                p.z = gz
                if v.z < 0:
                    v.z = -v.z * rest
                    v.x *= fric
                    v.y *= fric
                    w *= 0.5
                if abs(v.z) < 0.4:
                    v.z = 0
                    v.x *= 0.9
                    v.y *= 0.9
                    w *= 0.85

    def at(self, t):
        """(позиция, поворот, скорость, возраст) или None до рождения / после смерти."""
        a = t - self.t0
        if a < 0 or a > self.life:
            return None
        i = a / self.dt
        j = min(int(i), len(self.samples) - 2)
        (p0, r0, v0), (p1, r1, v1) = self.samples[j], self.samples[j + 1]
        u = i - j
        return p0.lerp(p1, u), r0.lerp(r1, u), v0, a


def key_particle(o, f, st, size, hide_pos=Vector((0, 0, -50)), align=False, fade=None):
    # режим вращения не анимируется: искры (align) всегда в кватернионах, остальное — в Эйлере
    o.rotation_mode = 'QUATERNION' if align else 'XYZ'
    if st is None:
        o.location = hide_pos
        o.rotation_quaternion = (1, 0, 0, 0)
        o.rotation_euler = (0, 0, 0)
        o.scale = (0, 0, 0)
    else:
        p, r, v, age = st
        o.location = p
        if align:
            if v.length > 0.1:
                o.rotation_quaternion = v.to_track_quat('Z', 'Y')
        else:
            o.rotation_euler = r
        s = size * (fade(age) if fade else 1.0)
        o.scale = (s, s, s) if not align else (s, s, s * min(4.0, 0.6 + v.length * 0.35))
    K(o, 'location', f)
    K(o, 'scale', f)
    if o.rotation_mode == 'QUATERNION':
        K(o, 'rotation_quaternion', f)
    else:
        K(o, 'rotation_euler', f)


def hide_all(W, f, keep=()):
    """Убрать со сцены все динамические объекты, кроме keep (на кадре f)."""
    for V in [W['hero'], W['suv']] + W['traffic']:
        if V['root'].name not in keep:
            key_scale(V['root'], f, 0.0)
    if 'loose_wheel' not in keep:
        W['loose_wheel'].location = (0, 0, -50)
        K(W['loose_wheel'], 'location', f)
    for pool in W['pools'].values():
        for o in pool:
            if o.name not in keep:
                o.location = (0, 0, -50)
                o.scale = (0, 0, 0)
                K(o, 'location', f)
                K(o, 'scale', f)
    for o in W['overlays']:
        if o.name not in keep:
            key_scale(o, f, 0.0)


# ---------------------------------------------------------------- сценарий 1: лобовой через траву

C_HEADON = Vector((-S.G_INNER - 0.9, 0.0, 0.75))     # точка удара: внутренняя полоса встречки
HERO_V, HERO_DIR = 27.0, math.radians(26)              # скорость и направление полёта седана
YAW_IMP = math.radians(36)                             # кузов развёрнут сильнее — занос
SUV_V = 26.0


def _rot2(v, a):
    c, s = math.cos(a), math.sin(a)
    return Vector((v.x * c - v.y * s, v.x * s + v.y * c))


HERO_CORNER = Vector((-0.75, 2.35))
SUV_CORNER = Vector((-0.8, 2.45))
HERO_C = C_HEADON.xy - _rot2(HERO_CORNER, YAW_IMP)
SUV_C = C_HEADON.xy - _rot2(SUV_CORNER, math.pi)
HERO_VEL = Vector((-math.sin(HERO_DIR), math.cos(HERO_DIR))) * HERO_V
HERO_V2, SUV_V2, DECEL = Vector((-4.5, -7.5)), Vector((-5.0, -4.0)), 6.5


def _slide(v2, t):
    sp = v2.length
    ts = sp / DECEL
    tt = min(t, ts)
    return v2.normalized() * (sp * tt - 0.5 * DECEL * tt * tt)


def headon(W, t):
    """Состояния седана и внедорожника в момент t (удар при t = 0)."""
    hero, suv = W['hero'], W['suv']
    if t < 0:
        xy = HERO_C + HERO_VEL * t
        yaw = YAW_IMP + 0.18 * t + 0.03 * math.sin(t * 9)
        z, roll, pitch = pose_on_ground(hero, xy.x, xy.y, yaw, ground_grass)
        h = dict(x=xy.x, y=xy.y, z=z, yaw=yaw, roll=roll, pitch=pitch, dist=HERO_V * t, steer=math.radians(-12) * smooth(-1.0, -0.3, t))
        sxy = SUV_C + Vector((0, -SUV_V)) * t
        s = dict(x=sxy.x, y=sxy.y, yaw=math.pi, dist=SUV_V * t, steer=0.0)
        brake = smooth(-0.35, -0.05, t)        # водитель внедорожника успевает клюнуть носом
        s['pitch'] = -0.035 * brake
    else:
        xy = HERO_C + _slide(HERO_V2, t)
        yaw = YAW_IMP + 7.0 * (1 - math.exp(-2 * t)) / 2
        k = math.sin(math.pi * min(t, 0.6) / 0.6)
        z, roll, pitch = pose_on_ground(hero, xy.x, xy.y, yaw, ground_grass)
        h = dict(x=xy.x, y=xy.y, z=z + 0.18 * k, yaw=yaw, roll=roll + 0.12 * k, pitch=pitch - 0.24 * k,
                 dist=_slide(HERO_V2, t).length, crush={'headon': smooth(0, 0.05, t)}, steer=math.radians(-20),
                 hide_wheel='FL' if t > 0.03 else None)
        sxy = SUV_C + _slide(SUV_V2, t)
        ks = math.sin(math.pi * min(t, 0.5) / 0.5)
        s = dict(x=sxy.x, y=sxy.y, z=0.06 * ks, yaw=math.pi + 2.6 * (1 - math.exp(-2 * t)) / 2, pitch=-0.13 * ks,
                 roll=-0.05 * ks, dist=SUV_V * 0.0 + _slide(SUV_V2, t).length, crush={'headon': smooth(0, 0.05, t)})
    return h, s


def headon_particles(W):
    """Стекло, обломки, искры, пыль, комья земли — для сценария лобового удара."""
    rnd = random.Random(21)
    P = []
    hero, suv = W['hero'], W['suv']
    h0, s0 = headon(W, 0.02)
    mh = car_matrix(h0['x'], h0['y'], h0['z'], h0['yaw'], h0['roll'], h0['pitch'])
    ms = car_matrix(s0['x'], s0['y'], s0.get('z', 0), s0['yaw'])
    hv3 = Vector((HERO_VEL.x, HERO_VEL.y, 0))
    sv3 = Vector((0, -SUV_V, 0))
    shards = W['pools']['shard']
    for i, o in enumerate(shards):
        if i % 2 == 0:
            p = mh @ Vector((rnd.uniform(-0.7, 0.7), rnd.uniform(0.55, 0.95), rnd.uniform(1.0, 1.3)))
            v = hv3 * rnd.uniform(0.25, 0.55)
        else:
            p = ms @ Vector((rnd.uniform(-0.75, 0.75), rnd.uniform(1.0, 1.3), rnd.uniform(1.15, 1.6)))
            v = sv3 * rnd.uniform(0.15, 0.4)
        v += Vector((rnd.gauss(0, 3.0), rnd.gauss(0, 3.0), rnd.uniform(1.0, 5.0)))
        w = Vector((rnd.uniform(-30, 30), rnd.uniform(-30, 30), rnd.uniform(-30, 30)))
        P.append((o, Particle(p, v, w, rnd.uniform(0.0, 0.05), 2.6, 0.01, ground_grass, seed=i), rnd.uniform(0.025, 0.06), False, None))
    for i, o in enumerate(W['pools']['chunk']):
        d = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(0.2, 1.2))).normalized()
        v = d * rnd.uniform(4, 12) + Vector((-4.8, -5.6, 0))
        w = Vector((rnd.uniform(-20, 20), rnd.uniform(-20, 20), rnd.uniform(-20, 20)))
        p = C_HEADON + Vector((rnd.gauss(0, 0.3), rnd.gauss(0, 0.3), rnd.gauss(0, 0.15)))
        P.append((o, Particle(p, v, w, rnd.uniform(0.0, 0.06), 2.6, 0.04, ground_grass, seed=100 + i), rnd.uniform(0.04, 0.14), False, None))
    for i, o in enumerate(W['pools']['spark']):
        d = Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), rnd.uniform(0.0, 0.9))).normalized()
        v = d * rnd.uniform(6, 15)
        life = rnd.uniform(0.25, 0.55)
        P.append((o, Particle(C_HEADON + Vector((0, 0, -0.2)), v, Vector(), rnd.uniform(0.0, 0.2), life, 0.005, ground_grass, rest=0.5, seed=200 + i),
                  1.0, True, (lambda a, L=life: max(0.0, 1 - a / L))))
    # комья земли и травы из-под колёс седана, пока он идёт по разделительной полосе
    for i, o in enumerate(W['pools']['dirt']):
        ts = -0.95 + 0.85 * i / len(W['pools']['dirt'])
        st, _ = headon(W, ts)
        if abs(st['x']) > S.G_MED + 0.5:
            P.append((o, None, 0.0, False, None))
            continue
        key = 'RL' if i % 2 else 'RR'
        p = wheel_world(hero, st, key) - Vector((0, 0, 0.25))
        back = -Vector((HERO_VEL.x, HERO_VEL.y, 0)).normalized()
        v = hv3 * 0.35 + back * rnd.uniform(2, 6) + Vector((rnd.gauss(0, 1.5), rnd.gauss(0, 1.5), rnd.uniform(2.0, 5.5)))
        w = Vector((rnd.uniform(-15, 15), rnd.uniform(-15, 15), rnd.uniform(-15, 15)))
        P.append((o, Particle(p, v, w, ts, 1.8, 0.03, ground_grass, rest=0.1, seed=300 + i), rnd.uniform(0.025, 0.06), False, None))
    return P


def headon_dust(W):
    rnd = random.Random(31)
    out = []
    for i, o in enumerate(W['pools']['dust']):
        off = Vector((rnd.uniform(-1.2, 1.2), rnd.uniform(-1.2, 1.2), rnd.uniform(0.0, 0.5)))
        out.append((o, C_HEADON + off, rnd.uniform(1.1, 1.9), rnd.uniform(0.0, 0.08), 0.12))
    return out


def key_dust(o, f, t, center, rmax, t0, dens, color=(0.55, 0.5, 0.42), dur=1.6):
    a = t - t0
    vol = o.data.materials[0].node_tree.nodes['Principled Volume']
    if a < 0 or a > dur:
        o.location = (0, 0, -50)
        o.scale = (0, 0, 0)
        d = 0.0
    else:
        u = a / dur
        r = 0.3 + (rmax - 0.3) * (1 - (1 - u) ** 3)
        o.location = center + Vector((0, 0, 0.6 * u))
        o.scale = (r, r, r * 0.6)
        d = dens * (1 - u) ** 1.5
    vol.inputs['Color'].default_value = (*color, 1)
    vol.inputs['Density'].default_value = d
    K(o, 'location', f)
    K(o, 'scale', f)
    vol.inputs['Density'].keyframe_insert('default_value', frame=f)


def loose_wheel_particle(W):
    st, _ = headon(W, 0.03)
    p = wheel_world(W['hero'], st, 'FL')
    return Particle(p, Vector((-7.0, 3.0, 4.5)), Vector((14.0, 3.0, 6.0)), 0.03, 3.0, W['hero']['P']['wheel_r'], ground_grass, rest=0.35, fric=0.8)


def key_loose_wheel(W, f, t, lw):
    o = W['loose_wheel']
    st = lw.at(t)
    o.rotation_mode = 'XYZ'
    if st is None:
        o.location = (0, 0, -50)
        o.rotation_euler = (0, 0, 0)
    else:
        p, r, v, a = st
        o.location = p
        o.rotation_euler = (r.x, r.y * 0.3, YAW_IMP + r.z * 0.3)
    K(o, 'location', f)
    K(o, 'rotation_euler', f)


def key_headon_frame(W, f, t, P, dust, lw):
    h, s = headon(W, t)
    pose_vehicle(W['hero'], f, h)
    pose_vehicle(W['suv'], f, s)
    for o, part, size, align, fade in P:
        key_particle(o, f, part.at(t) if part else None, size, align=align, fade=fade)
    for o, c, rmax, t0, dens in dust:
        key_dust(o, f, t, c, rmax, t0, dens)
    key_loose_wheel(W, f, t, lw)


# ---------------------------------------------------------------- сценарии 2–3: стена и Jersey

def integrate_path(yaw_fn, speed_fn, t_from=-3.0, t_to=4.0, dt=1 / 480):
    """Траектория по курсу и скорости; возвращает функцию t → (x, y, путь), x(0) = y(0) = 0."""
    ts, xs, ys, ds = [0.0], [0.0], [0.0], [0.0]
    for direction in (1, -1):
        t, x, y, d = 0.0, 0.0, 0.0, 0.0
        while (t < t_to) if direction > 0 else (t > t_from):
            yaw, sp = yaw_fn(t + direction * dt / 2), speed_fn(t + direction * dt / 2)
            x += direction * -math.sin(yaw) * sp * dt
            y += direction * math.cos(yaw) * sp * dt
            d += direction * sp * dt
            t += direction * dt
            if direction > 0:
                ts.append(t); xs.append(x); ys.append(y); ds.append(d)
            else:
                ts.insert(0, t); xs.insert(0, x); ys.insert(0, y); ds.insert(0, d)

    def at(t):
        i = (t - ts[0]) / dt
        j = max(0, min(int(i), len(ts) - 2))
        u = i - j
        return lerp(xs[j], xs[j + 1], u), lerp(ys[j], ys[j + 1], u), lerp(ds[j], ds[j + 1], u)
    return at


# --- стена: передний левый угол кузова касается грани стены (x = 0.2) при t = 0
WALL_YAW0 = math.radians(8)


def wall_yaw(t):
    if t < 0:
        return WALL_YAW0
    return lerp(WALL_YAW0, math.radians(-5), smooth(0, 0.14, t)) + math.radians(3) * smooth(0.4, 1.6, t)


def wall_speed(t):
    return 27.0 if t < 0 else lerp(27.0, 20.0, smooth(0, 0.15, t))


WALL_PATH = integrate_path(wall_yaw, wall_speed)
_wc = _rot2(Vector((-0.9, 2.3)), WALL_YAW0)
WALL_C0 = Vector((0.2 - _wc.x, 0.0 - _wc.y))         # центр машины при t = 0
WALL_CONTACT = Vector((0.2, 0.0, 0.55))


def wall_state(t):
    x, y, d = WALL_PATH(t)
    k = math.sin(math.pi * min(max(t, 0), 0.35) / 0.35) if t > 0 else 0.0
    return dict(x=WALL_C0.x + x, y=WALL_C0.y + y, z=0.03 * k, yaw=wall_yaw(t), roll=-0.07 * k, pitch=-0.03 * k,
                dist=d, crush={'wall': 0.85 * smooth(0, 0.05, t)}, steer=math.radians(-8) * smooth(0, 0.1, t))


# --- Jersey: внешняя грань переднего левого колеса касается основания (x = J_BASE) при t = 0
J_YAW0 = math.radians(6)


def jersey_yaw(t):
    if t < 0:
        return J_YAW0
    return lerp(J_YAW0, math.radians(-3), smooth(0.0, 0.18, t)) + math.radians(3) * smooth(0.8, 2.6, t)


def jersey_speed(t):
    return 25.0 if t < 0 else lerp(25.0, 22.5, smooth(0, 0.6, t))


J_PATH = integrate_path(jersey_yaw, jersey_speed)
_jw = _rot2(Vector((-S.VEH['sedan']['track'] / 2, S.VEH['sedan']['wb'] / 2)), J_YAW0)
J_C0 = Vector((S.J_BASE + S.VEH['sedan']['wheel_w'] / 2 - _jw.x, 0.0 - _jw.y))
TAN55 = math.tan(math.radians(55))


def jersey_lift(pen):
    """Подъём колеса на скосе: 55° → подъём = проникание · tg55°, мягко с нуля, не выше излома."""
    if pen <= 0:
        return 0.0
    return min(pen * TAN55 + S.J_REVEAL * smooth(0, 0.03, pen), S.J_BREAK - 0.05)


def jersey_state(t, V):
    x, y, d = J_PATH(t)
    st = dict(x=J_C0.x + x, y=J_C0.y + y, yaw=jersey_yaw(t), dist=d, steer=math.radians(-5) * smooth(0.05, 0.3, t))
    P = V['P']
    c, s = math.cos(st['yaw']), math.sin(st['yaw'])
    lift = {}
    for k in ('FL', 'RL'):
        ly = (1 if k[0] == 'F' else -1) * P['wb'] / 2
        lx = -P['track'] / 2
        wx = st['x'] + lx * c - ly * s
        pen = S.J_BASE - (wx - P['wheel_w'] / 2)
        lift[k] = jersey_lift(pen)
    z, roll, pitch = pose_on_ground(V, st['x'], st['y'], st['yaw'], ground_flat, extra=lift)
    st.update(z=z, roll=roll, pitch=pitch)
    st['lift'] = lift
    return st


# ---------------------------------------------------------------- оверлеи (подсветка)

def make_overlays(W, y_s):
    ov = []
    c = S.coll('Overlays')
    # кольцо-профиль вокруг разделителя в сечении y_s
    prof = [(x, z) for x, z in S.JERSEY_PROFILE] + [(-x, z) for x, z in reversed(S.JERSEY_PROFILE)]
    cu = bpy.data.curves.new('hl_ring', 'CURVE')
    cu.dimensions = '3D'
    cu.bevel_depth = 0.011
    cu.bevel_resolution = 3
    sp = cu.splines.new('POLY')
    sp.points.add(len(prof) - 1)
    for p, (x, z) in zip(sp.points, prof):
        sx = x + (0.01 if x > 0 else -0.01)
        p.co = (sx, 0, z + 0.004, 1)
    ring = bpy.data.objects.new('hl_ring', cu)
    ring.location = (0, y_s, 0)
    cu.materials.append(S.M['hl_yellow'])
    c.objects.link(ring)
    ov.append(ring)
    # прозрачная заливка нижнего скоса (сторона +X) на ±3 м
    x0, z0 = S.J_BASE, S.J_REVEAL
    x1, z1 = S.J_BREAK_X, S.J_BREAK
    n = Vector((z1 - z0, 0, x0 - x1)).normalized() * 0.006
    verts = [(x0 + n.x, -3, z0 + n.z), (x1 + n.x, -3, z1 + n.z), (x1 + n.x, 3, z1 + n.z), (x0 + n.x, 3, z0 + n.z)]
    fill = S.mesh_obj('hl_fill', verts, [(0, 1, 2, 3)], S.M['hl_fill'], c)
    fill.location = (0, y_s, 0)
    ov.append(fill)
    # пунктир-горизонталь от излома наружу и дуга 55° вниз до скоса
    dash = bpy.data.curves.new('hl_dash', 'CURVE')
    dash.dimensions = '3D'
    dash.bevel_depth = 0.006
    for k in range(4):
        spl = dash.splines.new('POLY')
        spl.points.add(1)
        a = x1 + 0.03 + k * 0.1
        spl.points[0].co = (a, 0, z1, 1)
        spl.points[1].co = (a + 0.06, 0, z1, 1)
    arcc = dash.splines.new('POLY')
    R = 0.2
    pts = [(x1 + R * math.cos(math.radians(-a)), 0, z1 + R * math.sin(math.radians(-a))) for a in range(0, 56, 5)]
    arcc.points.add(len(pts) - 1)
    for p, q in zip(arcc.points, pts):
        p.co = (*q, 1)
    dash.materials.append(S.M['hl_yellow'])
    da = bpy.data.objects.new('hl_angle', dash)
    da.location = (0, y_s + 0.02, 0)
    c.objects.link(da)
    ov.append(da)
    # подпись 55°
    tc = bpy.data.curves.new('hl_text', 'FONT')
    tc.body = '55°'
    tc.size = 0.12
    tc.align_x = 'CENTER'
    tc.extrude = 0.004
    tc.materials.append(S.M['hl_yellow'])
    tx = bpy.data.objects.new('hl_text', tc)
    tx.location = (x1 + 0.3, y_s + 0.03, z1 - 0.12)
    c.objects.link(tx)
    ov.append(tx)
    # жёлтый след колеса (план 5b) и красная траектория (план 7) строятся по траекториям
    W['overlays'] = ov
    return dict(ring=ring, fill=fill, angle=da, text=tx)


def strip(name, pts, width, mat, c):
    verts, faces = [], []
    for i, p in enumerate(pts):
        q = pts[min(i + 1, len(pts) - 1)] - pts[max(i - 1, 0)]
        side = Vector((-q.y, q.x, 0)).normalized() * width / 2
        verts += [tuple(p - side), tuple(p + side)]
        if i:
            a = 2 * i
            faces.append((a - 2, a - 1, a + 1, a))
    return S.mesh_obj(name, verts, faces, mat, c)


# ---------------------------------------------------------------- планы

def shot_hook(W, k, cam):
    f0, n = frames_of(k)
    tm = TM['s1_hook']
    P, dust, lw = headon_particles(W), headon_dust(W), loose_wheel_particle(W)
    ck = CamKeys(cam)
    dirn = Vector((HERO_VEL.x, HERO_VEL.y, 0)).normalized()
    side = Vector((dirn.y, -dirn.x, 0))
    t_lock = -0.12
    h_lock, _ = headon(W, t_lock)
    cam_off = side * 5.0 + dirn * 7.5 + Vector((0, 0, 1.0))
    cam_lock = Vector((h_lock['x'], h_lock['y'], 0)) + cam_off
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        t = tm(tau)
        hide_all(W, f, keep={'hero', 'suv', 'loose_wheel'} | {o.name for o, *_ in P} | {o.name for o, *_ in dust})
        key_headon_frame(W, f, t, P, dust, lw)
        h, s = headon(W, t)
        hp = Vector((h['x'], h['y'], 0.7))
        if t < t_lock:
            pos = Vector((h['x'], h['y'], 0)) + cam_off
            tgt = hp + dirn * 1.5 - side * 1.2
        else:
            a = t - t_lock
            # камера по инерции отъезжает назад и вбок, разворачиваясь на место удара
            pos = cam_lock + dirn * (3.0 * (1 - math.exp(-3 * a))) + side * (1.5 * (1 - math.exp(-2 * a))) + Vector((0, 0, 0.8 * smooth(0, 1.2, a)))
            tgt = vlerp(Vector((h_lock['x'], h_lock['y'], 0.7)) + dirn * 1.5 - side * 1.2, C_HEADON + Vector((0, 0, 0.1)), smooth(0, 0.12, a))
            tgt = vlerp(tgt, (hp + C_HEADON) / 2, smooth(0.3, 1.2, a))
        imp_tau = impact_tau('s1_hook')
        amp = 0.5 + 5.0 * math.exp(-max(0.0, tau - imp_tau) * 5.0) * smooth(imp_tau - 0.02, imp_tau + 0.02, tau)
        lens = lerp(20, 27, smooth(0.6, 1.5, tau))
        ck.set(f, pos, tgt, lens, roll=math.radians(-4) * smooth(0, 0.6, tau), shake=shake_at(tau, amp, 13, 1.0))
    return ('HwyGrass',)


def traffic_place(W, f, t, cars):
    """cars: список (индекс машины, полоса x, y при t=0, скорость со знаком)."""
    used = set()
    for idx, x, y0, v in cars:
        V = W['traffic'][idx]
        used.add(V['root'].name)
        pose_vehicle(V, f, dict(x=x, y=y0 + v * t, yaw=0.0 if v > 0 else math.pi, dist=abs(v) * t))
    return used


TRAFFIC_A = [(0, S.B_LANE1, -40, 29), (1, S.B_LANE2, -10, 26), (2, S.B_LANE2, 30, 25), (3, -S.B_LANE1, 70, -30),
             (4, -S.B_LANE2, 40, -26), (5, -S.B_LANE1, 5, -28)]
Y_S = 26.0          # сечение разделителя, которое подсвечиваем


def shot_aerial(W, k, cam):
    f0, n = frames_of(k)
    ck = CamKeys(cam)
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        hide_all(W, f, keep={W['traffic'][j]['root'].name for j in range(6)})
        traffic_place(W, f, tau, TRAFFIC_A)
        u = max(0.0, smooth(0, n / FPS, tau) * 0.75 + 0.25 * (tau / (n / FPS)))
        pos = Vector((lerp(-26, 3.2, u), lerp(-70, 14, u), lerp(52, 2.4, u ** 0.8)))
        tgt = Vector((lerp(0, 0.2, u), lerp(10, Y_S, u), lerp(0, 0.4, u)))
        ck.set(f, pos, tgt, lerp(20, 24, u), roll=math.radians(lerp(-12, 0, u)), shake=shake_at(tau, 0.25, 3, 2.0))
    return ('HwyBarrier',)


def shot_slope(W, k, cam):
    f0, n = frames_of(k)
    ov = W['ov']
    ck = CamKeys(cam)
    reveal = SLOPE_REVEAL
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        hide_all(W, f, keep={W['traffic'][j]['root'].name for j in (3, 4, 5)} | {'hl_ring', 'hl_fill', 'hl_angle', 'hl_text'})
        traffic_place(W, f, tau + 2.64, [c for c in TRAFFIC_A if c[0] in (3, 4, 5)])
        a = smooth(0, 0.85, tau)
        b = smooth(0.85, n / FPS, tau)
        pos = vlerp((3.2, 14.0, 2.4), (1.25, Y_S + 2.2, 0.34), a)
        pos = vlerp(pos, (0.9, Y_S + 1.75, 0.42), b)
        tgt = vlerp((0.2, Y_S, 0.4), (0.15, Y_S, 0.2), a)
        pop = smooth(reveal, reveal + 0.18, tau) * (1 + 0.15 * math.sin(math.pi * smooth(reveal, reveal + 0.35, tau)))
        for o in (ov['ring'], ov['angle'], ov['text']):
            key_scale(o, f, pop)
        key_scale(ov['fill'], f, (1, smooth(reveal - 0.1, reveal + 0.3, tau), 1))
        d = pos - ov['text'].location
        ov['text'].rotation_euler = (math.radians(90), 0, math.atan2(d.x, -d.y))
        K(ov['text'], 'rotation_euler', f)
        ck.set(f, pos, tgt, lerp(24, 30, a), shake=shake_at(tau, 0.3 + 1.2 * smooth(0.5, 0.85, tau) * (1 - smooth(0.85, 1.2, tau)), 9, 3.0))
    return ('HwyBarrier',)


def shot_wall(W, k, cam):
    f0, n = frames_of(k)
    tm = TM['s4_wall']
    rnd = random.Random(41)
    hero = W['hero']
    sparks = []
    for i, o in enumerate(W['pools']['spark']):
        ts = rnd.uniform(0.0, 0.22)
        st = wall_state(ts)
        corner = car_matrix(st['x'], st['y'], st['z'], st['yaw']) @ Vector((-0.85, 2.0, 0.5))
        p = Vector((0.22, corner.y, rnd.uniform(0.35, 0.65)))
        v = Vector((rnd.uniform(0.5, 3.0), rnd.uniform(8, 18), rnd.uniform(0.5, 4.0)))
        life = rnd.uniform(0.2, 0.5)
        sparks.append((o, Particle(p, v, Vector(), ts, life, 0.005, ground_flat, rest=0.4, seed=500 + i), 1.0, True, (lambda a, L=life: max(0.0, 1 - a / L))))
    parts = []
    st0 = wall_state(0.01)
    m0 = car_matrix(st0['x'], st0['y'], st0['z'], st0['yaw'])
    for i, o in enumerate(W['pools']['shard'][:60]):
        p = m0 @ Vector((rnd.uniform(-0.8, -0.45), rnd.uniform(2.1, 2.35), rnd.uniform(0.6, 0.8)))
        v = Vector((rnd.uniform(0.5, 4), rnd.uniform(10, 20), rnd.uniform(0.5, 3.5)))
        parts.append((o, Particle(p, v, Vector((rnd.uniform(-30, 30), rnd.uniform(-30, 30), 0)), rnd.uniform(0, 0.04), 2.0, 0.01, ground_flat, seed=600 + i), rnd.uniform(0.02, 0.045), False, None))
    for i, o in enumerate(W['pools']['chunk'][:24]):
        p = m0 @ Vector((rnd.uniform(-0.8, -0.3), rnd.uniform(2.0, 2.4), rnd.uniform(0.3, 0.6)))
        v = Vector((rnd.uniform(0.5, 5), rnd.uniform(8, 18), rnd.uniform(0.5, 4)))
        parts.append((o, Particle(p, v, Vector((rnd.uniform(-20, 20), rnd.uniform(-20, 20), 0)), rnd.uniform(0, 0.05), 2.0, 0.03, ground_flat, seed=700 + i), rnd.uniform(0.04, 0.1), False, None))
    dust = [(o, WALL_CONTACT + Vector((0.4, 0.6 * j, 0)), 1.6, 0.03 * j, 0.3) for j, o in enumerate(W['pools']['dust'][:3])]
    ck = CamKeys(cam)
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        t = tm(tau)
        keep = {'hero'} | {o.name for o, *_ in sparks + parts} | {o.name for o, *_ in dust}
        hide_all(W, f, keep=keep)
        st = wall_state(t)
        pose_vehicle(hero, f, st)
        for o, part, size, align, fade in sparks + parts:
            key_particle(o, f, part.at(t), size, align=align, fade=fade)
        for o, c, rmax, t0, dens in dust:
            key_dust(o, f, t, c, rmax, t0, dens, color=(0.6, 0.58, 0.55), dur=1.2)
        imp = impact_tau('s4_wall')
        car = Vector((st['x'], st['y'], 0.6))
        y_imp = wall_state(0.0)['y']
        if t < 0:
            cam_y = st['y'] + lerp(22.0, 7.5, smooth(0, imp, tau))
        else:
            cam_y = y_imp + 7.5 + (st['y'] - y_imp) * 0.45
        pos = Vector((0.72, cam_y, lerp(0.95, 1.35, smooth(imp, n / FPS, tau))))
        tgt = vlerp(car + Vector((0, 2.0, 0)), WALL_CONTACT, 0.35 * smooth(imp - 0.3, imp, tau))
        amp = 0.4 + 4.0 * math.exp(-max(0.0, tau - imp) * 4.5) * smooth(imp - 0.02, imp + 0.02, tau)
        ck.set(f, pos, tgt, lerp(30, 24, smooth(imp - 0.2, imp + 0.4, tau)), shake=shake_at(tau, amp, 12, 4.0))
    return ('HwyBarrier', 'Wall')


def shot_climb(W, k, cam):
    f0, n = frames_of(k)
    tm = TM['s5a_climb']
    hero = W['hero']
    rnd = random.Random(51)
    smoke = []
    for j, o in enumerate(W['pools']['dust']):
        smoke.append((o, 0.04 + 0.05 * j))
    ck = CamKeys(cam)
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        t = tm(tau)
        hide_all(W, f, keep={'hero', 'hl_contact', 'hl_band'} | {o.name for o, _ in smoke})
        st = jersey_state(t, hero)
        pose_vehicle(hero, f, st)
        fl = wheel_world(hero, st, 'FL')
        for o, t0 in smoke:
            key_dust(o, f, t, Vector((S.J_BASE + 0.1, fl.y - 0.3 - (t - t0) * 6.0 if t > t0 else fl.y, 0.15)), 0.7, t0, 0.25,
                     color=(0.35, 0.35, 0.36), dur=0.6)
        a = smooth(3.1, 4.7, tau)
        pos = Vector((lerp(0.62, 1.9, a), st['y'] + lerp(3.9, 6.4, a), lerp(0.34, 1.35, a)))
        tgt = vlerp(fl + Vector((0.0, 0.0, -0.12)), Vector((st['x'] - 0.25, st['y'] + 0.8, 0.5)), a)
        # рентген: кузов полупрозрачный, пока колесо заезжает на скос
        xr = 1.0 - 0.72 * smooth(0.85, 1.15, tau) * (1 - smooth(3.0, 3.5, tau))
        for m in W['xray']:
            m.node_tree.nodes['Principled BSDF'].inputs['Alpha'].default_value = xr
            m.node_tree.nodes['Principled BSDF'].inputs['Alpha'].keyframe_insert('default_value', frame=f)
        # пятно контакта шины со скосом
        lift = st['lift']['FL']
        cz = max(lift, S.J_REVEAL + 0.02)
        con = W['contact']
        con.location = (S.J_BASE - (cz - S.J_REVEAL) / TAN55 + 0.012, fl.y, cz)
        con.rotation_euler = (0, math.radians(55), 0)
        K(con, 'location', f)
        K(con, 'rotation_euler', f)
        key_scale(con, f, smooth(-0.01, 0.03, t) * (1 - smooth(0.36, 0.45, t)) * (1 + 0.15 * math.sin(tau * 18)))
        key_scale(W['band'], f, (1, smooth(0.7, 1.1, tau) * (1 - smooth(3.0, 3.4, tau)) + 1e-4, 1))
        ck.set(f, pos, tgt, lerp(28, 24, a), shake=shake_at(tau, 0.35 + 0.6 * smooth(1.1, 1.3, tau) * (1 - smooth(1.3, 2.0, tau)), 8, 5.0))
    return ('HwyBarrier',)


def shot_lane(W, k, cam):
    f0, n = frames_of(k)
    tm = TM['s5b_lane']
    hero = W['hero']
    trail = W['trail']
    ck = CamKeys(cam)
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        t = tm(tau)
        hide_all(W, f, keep={'hero', 'hl_trail'} | {W['traffic'][j]['root'].name for j in (1,)})
        traffic_place(W, f, t + 1.2, [TRAFFIC_A[1]])
        st = jersey_state(t, hero)
        pose_vehicle(hero, f, st)
        key_scale(trail, f, 1.0)
        car = Vector((st['x'], st['y'], 0.5))
        pos = car + Vector((lerp(5.0, 6.5, tau / 2), lerp(-9.0, -6.0, tau / 2), lerp(11.0, 12.5, tau / 2)))
        tgt = car + Vector((-1.0, 3.5, 0))
        ck.set(f, pos, tgt, 24, shake=shake_at(tau, 0.25, 3, 6.0))
    # след проявляется по мере движения: грани упорядочены по времени
    bm = trail.modifiers['build']
    t_first = W['trail_t0']
    bm.frame_start = f0 - (tm(0) - t_first) * FPS
    bm.frame_duration = (W['trail_t1'] - t_first) * FPS
    return ('HwyBarrier',)


def shot_replay(W, k, cam):
    f0, n = frames_of(k)
    tm = TM['s6_replay']
    P, dust, lw = headon_particles(W), headon_dust(W), loose_wheel_particle(W)
    ck = CamKeys(cam)
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        t = tm(tau)
        hide_all(W, f, keep={'hero', 'suv', 'loose_wheel'} | {o.name for o, *_ in P} | {o.name for o, *_ in dust})
        key_headon_frame(W, f, t, P, dust, lw)
        imp = impact_tau('s6_replay')
        u = smooth(0, n / FPS, tau)
        pos = Vector((lerp(2.0, 0.5, u), lerp(-7.0, -4.5, u), lerp(6.5, 5.0, u)))
        h_now, _ = headon(W, t)
        tgt = vlerp(Vector((h_now['x'], h_now['y'], 0.5)), C_HEADON + Vector((0, -0.8, 0)), smooth(0.35, imp, tau))
        amp = 0.3 + 3.0 * math.exp(-max(0.0, tau - imp) * 4) * smooth(imp - 0.02, imp + 0.02, tau)
        ck.set(f, pos, tgt, lerp(24, 32, smooth(imp - 0.3, imp + 0.6, tau)), shake=shake_at(tau, amp, 11, 7.0))
    return ('HwyGrass',)


def shot_case(W, k, cam):
    f0, n = frames_of(k)
    path, ring = W['redpath'], W['redring']
    ck = CamKeys(cam)
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        hide_all(W, f, keep={'hl_redpath', 'hl_redring'})
        key_scale(path, f, 1.0)
        pulse = smooth(RING_PULSE, RING_PULSE + 0.15, tau)
        rs = pulse * (1.0 + 0.25 * math.sin(max(0.0, tau - RING_PULSE) * 7.0))
        key_scale(ring, f, rs)
        u = tau / (n / FPS)
        pos = Vector((lerp(14, 8, u), lerp(-34, -28, u), lerp(40, 33, u)))
        tgt = Vector((lerp(0.0, -1.0, u), lerp(-9.0, -7.0, u), 0))
        ck.set(f, pos, tgt, 22, roll=math.radians(lerp(-8, 0, u)), shake=shake_at(tau, 0.15, 2, 8.0))
    bm = path.modifiers['build']
    bm.frame_start = f0 + RED_PATH[0] * FPS
    bm.frame_duration = RED_PATH[1] * FPS
    return ('HwyGrass',)


def shot_final(W, k, cam):
    f0, n = frames_of(k)
    ck = CamKeys(cam)
    cars = [(0, S.B_LANE1, -30, 30), (4, -S.B_LANE2, 30, -26), (2, S.B_LANE2, -45, 26)]
    for i in range(-1, n + 1):
        f, tau = f0 + i, i / FPS
        hide_all(W, f, keep={W['traffic'][j]['root'].name for j, *_ in cars})
        traffic_place(W, f, tau, cars)
        u = tau / (n / FPS)
        pos = Vector((lerp(1.0, 1.6, u), lerp(-6.0, -1.5, u), lerp(0.32, 0.9, smooth(0, 1, u))))
        tgt = Vector((0.15, lerp(10, 14, u), lerp(0.2, 0.55, u)))
        ck.set(f, pos, tgt, 24, shake=shake_at(tau, 0.25, 3, 9.0))
    return ('HwyBarrier',)


SHOT_FN = [shot_hook, shot_aerial, shot_slope, shot_wall, shot_climb, shot_lane, shot_replay, shot_case, shot_final]


# ---------------------------------------------------------------- сборка и рендер

def build_all():
    W = S.build()
    W['ov'] = make_overlays(W, Y_S)
    c = S.coll('Overlays')
    # жёлтый след переднего левого колеса для плана 5b
    hero = W['hero']
    pts, t = [], -1.0
    W['trail_t0'] = t
    while t <= 2.6:
        st = jersey_state(t, hero)
        p = wheel_world(hero, st, 'FL')
        pts.append(Vector((p.x, p.y, st['lift']['FL'] + 0.015)))
        t += 0.02
    W['trail_t1'] = t
    tr = strip('hl_trail', pts, 0.22, S.M['hl_green'], c)
    b = tr.modifiers.new('build', 'BUILD')
    W['trail'] = tr
    W['overlays'].append(tr)
    # красная траектория и кольцо места удара для плана 7
    a, m, e = Vector((S.G_LANE1, -30)), Vector((S.G_LANE1 - 1.0, -12)), Vector((-S.G_LANE1 + 0.6, 1.0))
    rp = []
    for i in range(80):
        u = i / 79
        q = a.lerp(m, u).lerp(m.lerp(e, u), u)
        z = (S.median_z(q.x) if abs(q.x) < S.G_MED else 0.0) + 0.04
        rp.append(Vector((q.x, q.y, z)))
    red = strip('hl_redpath', rp, 0.5, S.M['hl_red'], c)
    red.modifiers.new('build', 'BUILD')
    bpy.ops.mesh.primitive_torus_add(major_radius=1.6, minor_radius=0.12, location=(e.x, e.y + 1.5, 0.08))
    ring = bpy.context.object
    ring.name = 'hl_redring'
    ring.data.materials.append(S.M['hl_red'])
    for cc in ring.users_collection:
        cc.objects.unlink(ring)
    c.objects.link(ring)
    W['redpath'], W['redring'] = red, ring
    W['overlays'] += [red, ring]
    body = W['hero']['body']
    black = S.M['black'].copy()
    black.name = 'hero_black'
    body.data.materials[1] = black
    W['xray'] = [W['hero']['paint'], black]
    bpy.ops.mesh.primitive_circle_add(vertices=32, radius=0.17, fill_type='NGON')
    con = bpy.context.object
    con.name = 'hl_contact'
    con.data.materials.append(S.M['hl_yellow'])
    for cc in con.users_collection:
        cc.objects.unlink(con)
    c.objects.link(con)
    x0, z0, x1, z1 = S.J_BASE, S.J_REVEAL, S.J_BREAK_X, S.J_BREAK
    nv = Vector((z1 - z0, 0, x0 - x1)).normalized() * 0.006
    band = S.mesh_obj('hl_band', [(x0 + nv.x, -40, z0 + nv.z), (x1 + nv.x, -40, z1 + nv.z), (x1 + nv.x, 40, z1 + nv.z),
                                  (x0 + nv.x, 40, z0 + nv.z)], [(0, 1, 2, 3)], S.M['hl_fill'], c)
    W['contact'], W['band'] = con, band
    W['overlays'] += [con, band]
    cams = []
    for k in range(len(SHOTS)):
        cam = bpy.data.objects.new(f'cam_{SHOTS[k][0]}', bpy.data.cameras.new(f'cam_{SHOTS[k][0]}'))
        cam.data.sensor_width = 36
        cam.data.clip_start = 0.05
        bpy.context.scene.collection.objects.link(cam)
        cams.append(cam)
    layouts = []
    for k, fn in enumerate(SHOT_FN):
        layouts.append(fn(W, k, cams[k]))
        print('keyed', SHOTS[k][0], flush=True)
    for o in bpy.data.objects:                          # ключи видимости/масштаба — ступенькой
        ad = o.animation_data
        if ad and ad.action:
            for fc in iter_fcurves(ad.action):
                if fc.data_path == 'scale':
                    for kp in fc.keyframe_points:
                        kp.interpolation = 'CONSTANT' if kp.co[1] == 0 else 'LINEAR'
    return W, cams, layouts


def iter_fcurves(action):
    if hasattr(action, 'fcurves') and action.fcurves is not None:
        try:
            return list(action.fcurves)
        except Exception:
            pass
    out = []
    for layer in getattr(action, 'layers', []):
        for strip_ in layer.strips:
            for cb in strip_.channelbags:
                out += list(cb.fcurves)
    return out


def set_layout(names):
    for n in ('HwyBarrier', 'Wall', 'HwyGrass'):
        bpy.data.collections[n].hide_render = n not in names
    bpy.data.objects['jersey'].hide_render = 'Wall' in names


def main():
    args = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    out = args[0]
    mode = args[1] if len(args) > 1 else 'test'
    only = set(args[2:])
    os.makedirs(out, exist_ok=True)
    W, cams, layouts = build_all()
    sc = bpy.context.scene
    if mode == 'test':
        sc.render.resolution_x, sc.render.resolution_y = 360, 640
        sc.cycles.samples = 6
    elif mode == 'preview':
        sc.render.resolution_x, sc.render.resolution_y = 360, 640
        sc.cycles.samples = 4
    elif mode == 'render':
        sc.cycles.samples = int(os.environ.get('SAMPLES', '8'))
        sc.cycles.adaptive_threshold = 0.05
        sc.render.use_overwrite = False         # дозапись: готовые кадры не пересчитываются
        sc.render.use_placeholder = True
    for k, (name, a, b) in enumerate(SHOTS):
        if only and name not in only:
            continue
        f0, n = frames_of(k)
        set_layout(layouts[k])
        sc.camera = cams[k]
        if mode == 'bench':
            import time
            sc.render.resolution_x, sc.render.resolution_y = 720, 1280
            sc.cycles.samples = int(os.environ.get('SAMPLES', '12'))
            for i in (n // 2, n // 2 + 1):
                sc.frame_set(f0 + i)
                sc.render.filepath = os.path.join(out, f'bench_{name}_{i:03d}.jpg')
                t0 = time.time()
                bpy.ops.render.render(write_still=True)
                print('BENCH', name, i, round(time.time() - t0, 1), 's', flush=True)
            continue
        if mode == 'test':
            picks = sorted({0, n // 4, n // 2, (3 * n) // 4, n - 1})
            for i in picks:
                sc.frame_set(f0 + i)
                sc.render.filepath = os.path.join(out, f'{name}_{i:03d}.jpg')
                bpy.ops.render.render(write_still=True)
        else:
            sc.frame_start, sc.frame_end = f0, f0 + n - 1
            sc.render.filepath = os.path.join(out, name, 'f_')
            bpy.ops.render.render(animation=True)
        print('rendered', name, flush=True)
    if mode == 'save':
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(out, 'scene.blend'))


if __name__ == '__main__':
    main()
