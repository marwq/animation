"""Фон «поле Minecraft с порталом» для Blender: строит сцену и рендерит её слоями.

Запускается внутри Blender 4.2+ (без аддонов):

    blender -b --factory-startup -P tools/mc_field.py -- --shot field
    blender -b --factory-startup -P tools/mc_field.py -- --shot portal

    --shot NAME      field — общий план поля, portal — портал в центре кадра
    --out DIR        куда класть PNG (по умолчанию backgrounds/field/<shot>/layers)
    --tex DIR        текстуры блоков с именами как в Minecraft (grass_block_top.png, ...)
    --layers LIST    sky,far,mid,ground,portal,fg,glow — слои; beauty — весь кадр
    --scale K        доля от полного разрешения, 0.3 — быстрый черновик
    --samples N      сэмплы Cycles
    --save-blend     сохранить сцену в .blend

Слои снизу вверх: sky — небо с облаками, far — дальние деревья, mid — середина
поля, ground — трава, на которой стоят персонажи, portal — только рамка портала
(внутри пусто), fg — размытая трава перед камерой. Персонажей кладут между
ground и fg (или между ground и portal, если персонаж за порталом).

Каждый слой рендерится так, будто ближних слоёв нет: их не видно, но тени от них
есть, поэтому при движении камеры за ближним слоем нет дыр. Дальние объекты
вырезаются в прозрачность — их покажет свой слой. Портал ни в одном слое, кроме
своего, не виден, так что его можно просто выключить. glow — два кадра с
фиолетовым светом портала и без него; из их разницы tools/mc_post.py делает
слой свечения. Кадр отрендерен с запасом по краям (OVERSCAN) под движение камеры.
"""
import json
import math
import os
import random
import sys

import bpy
import numpy as np
from mathutils import Euler, Vector, noise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
INF = 1e9

SIZE = 1080              # квадратный кадр
OVERSCAN = 1.25          # запас по краям под движение камеры

GRASS = (0x8A, 0xC4, 0x55)    # цвета травы и листвы, как на равнинах в игре
FOLIAGE = (0x6A, 0xB0, 0x2E)
BIRCH = (0x80, 0xA7, 0x55)

SKY_HORIZON = (0.62, 0.82, 1.00)
SKY_MID = (0.22, 0.50, 1.00)
SKY_ZENITH = (0.05, 0.22, 0.95)
SKY_SEEN = 0.6           # яркость неба в кадре; светит небо на сцену с силой 1
SUN_DIR = Vector((0.60, 0.45, -0.66))   # куда светит солнце: из-за левого плеча
SUN_COLOR = (1.0, 0.93, 0.82)
SUN_POWER = 6.5
PORTAL_LIGHT = (0.55, 0.15, 1.0)

PORTAL = (-1, 20)        # левый блок рамки; рамка 4×5 стоит вдоль оси x
PORTAL_C = Vector((1.0, 20.5, 3.5))     # центр проёма 2×3

# Камеры. depth — расстояние от камеры вперёд, в блоках. obj — деревья и
# растения, ground — полосы земли (с нахлёстом). z — глубина слоя для параллакса.
SHOTS = {
    'field': {
        'cam': (-11.5, 3.0, 2.6), 'yaw': 24, 'pitch': 3, 'lens': 24,
        'focus': 4.5, 'fstop': 0.6,
        'layers': {
            'far':    {'obj': (30, INF), 'ground': (26, INF), 'z': 45},
            'mid':    {'obj': (11, 30),  'ground': (9, 34),   'z': 18},
            'ground': {'obj': (3.2, 11), 'ground': (0, 13),   'z': 4.5},
            'fg':     {'obj': (0, 3.2),  'ground': None,      'z': 2.4},
        },
    },
    'portal': {
        'cam': (1.0, 8.5, 2.4), 'yaw': 0, 'pitch': 5, 'lens': 30,
        'focus': 7.5, 'fstop': 0.6,
        'layers': {
            'far':    {'obj': (24, INF), 'ground': (20, INF), 'z': 40},
            'mid':    {'obj': (9, 24),   'ground': (7, 28),   'z': 13},
            'ground': {'obj': (3.2, 9),  'ground': (0, 11),   'z': 7.5},
            'fg':     {'obj': (0, 3.2),  'ground': None,      'z': 2.4},
        },
    },
}
ORDER = ['sky', 'far', 'mid', 'ground', 'portal', 'fg']


def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    opt = {'shot': 'field', 'out': '',
           'tex': os.path.join(ROOT, 'backgrounds', 'textures', 'pixel-perfection'),
           'layers': ','.join(ORDER + ['glow']), 'scale': 1.0, 'samples': 64,
           'exposure': 1.2, 'look': 'AgX - Punchy', 'save_blend': False, 'seed': 11}
    i = 0
    while i < len(a):
        k = a[i].lstrip('-').replace('-', '_')
        if k == 'save_blend':
            opt[k] = True
        else:
            i += 1
            opt[k] = a[i] if isinstance(opt[k], str) else type(opt[k])(a[i])
        i += 1
    opt['out'] = opt['out'] or os.path.join(ROOT, 'backgrounds', 'field', opt['shot'], 'layers')
    return opt


# ------------------------------------------------------------------ текстуры
def load_rgba(tex, *names):
    for n in names:
        p = os.path.join(tex, n + '.png')
        if os.path.exists(p):
            img = bpy.data.images.load(p)
            w, h = img.size
            a = np.empty(w * h * 4, np.float32)
            img.pixels.foreach_get(a)
            bpy.data.images.remove(img)
            return a.reshape(h, w, 4)[h - w:]  # анимированная полоска — верхний кадр
    raise FileNotFoundError(f'нет текстуры {names[0]}.png в {tex}')


def tint(a, rgb):
    a = a.copy()
    a[..., :3] *= np.array(rgb, np.float32) / 255
    return a


def textures(tex):
    t = {}
    dirt = load_rgba(tex, 'dirt')
    over = tint(load_rgba(tex, 'grass_block_side_overlay'), GRASS)
    side = dirt.copy()
    side[..., :3] = over[..., :3] * over[..., 3:] + dirt[..., :3] * (1 - over[..., 3:])
    t['grass_top'] = tint(load_rgba(tex, 'grass_block_top'), GRASS)
    t['grass_side'] = side
    t['dirt'] = dirt
    t['obsidian'] = load_rgba(tex, 'obsidian')
    for wood, leaf in (('oak', FOLIAGE), ('birch', BIRCH)):
        t[f'{wood}_log'] = load_rgba(tex, f'{wood}_log')
        t[f'{wood}_log_top'] = load_rgba(tex, f'{wood}_log_top')
        t[f'{wood}_leaves'] = tint(load_rgba(tex, f'{wood}_leaves'), leaf)
    t['short_grass'] = tint(load_rgba(tex, 'short_grass', 'grass'), GRASS)
    t['tall_grass_bottom'] = tint(load_rgba(tex, 'tall_grass_bottom'), GRASS)
    t['tall_grass_top'] = tint(load_rgba(tex, 'tall_grass_top'), GRASS)
    for f in ('poppy', 'dandelion', 'oxeye_daisy', 'cornflower', 'azure_bluet'):
        t[f] = load_rgba(tex, f)
    imgs = {}
    for k, a in t.items():
        img = bpy.data.images.new(k, a.shape[1], a.shape[0], alpha=True)
        img.pixels.foreach_set(a.ravel())
        img.pack()
        imgs[k] = img
    return imgs


# ------------------------------------------------------------------ материалы
def material(name, img, kind):
    """kind: block, leaves, plant, glossy (обсидиан), cloud."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    N.clear()
    out = N.new('ShaderNodeOutputMaterial')
    bsdf = N.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.35 if kind == 'glossy' else 0.9
    bsdf.inputs['Specular IOR Level'].default_value = 0.5 if kind == 'glossy' else 0.15
    if kind == 'cloud':
        bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
        bsdf.inputs['Emission Color'].default_value = (1, 1, 1, 1)
        bsdf.inputs['Emission Strength'].default_value = 0.55
        tx = None
    else:
        tx = N.new('ShaderNodeTexImage')
        tx.image, tx.interpolation = img, 'Closest'
        L.new(tx.outputs['Color'], bsdf.inputs['Base Color'])
    surf = bsdf.outputs[0]
    if kind == 'plant':
        # нормаль вверх: трава освещена как земля под ней, без чёрной изнанки
        up = N.new('ShaderNodeCombineXYZ')
        up.inputs[2].default_value = 1
        L.new(up.outputs[0], bsdf.inputs['Normal'])
    if kind in ('leaves', 'plant'):
        tr = N.new('ShaderNodeBsdfTranslucent')
        L.new(tx.outputs['Color'], tr.inputs['Color'])
        mix = N.new('ShaderNodeMixShader')
        mix.inputs[0].default_value = 0.15
        L.new(surf, mix.inputs[1])
        L.new(tr.outputs[0], mix.inputs[2])
        surf = mix.outputs[0]
    # дымка в цвет горизонта: только для лучей камеры, чем дальше — тем сильнее
    cam = N.new('ShaderNodeCameraData')
    rng = N.new('ShaderNodeMapRange')
    near, far, top = (150, 600, 0.6) if kind == 'cloud' else (30, 170, 0.35)
    rng.inputs['From Min'].default_value = near
    rng.inputs['From Max'].default_value = far
    rng.inputs['To Max'].default_value = top
    L.new(cam.outputs['View Distance'], rng.inputs['Value'])
    lp = N.new('ShaderNodeLightPath')
    mul = N.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    L.new(rng.outputs[0], mul.inputs[0])
    L.new(lp.outputs['Is Camera Ray'], mul.inputs[1])
    em = N.new('ShaderNodeEmission')
    em.inputs['Color'].default_value = (*SKY_HORIZON, 1)
    em.inputs['Strength'].default_value = SKY_SEEN
    hz = N.new('ShaderNodeMixShader')
    L.new(mul.outputs[0], hz.inputs[0])
    L.new(surf, hz.inputs[1])
    L.new(em.outputs[0], hz.inputs[2])
    surf = hz.outputs[0]
    if kind in ('leaves', 'plant'):
        cut = N.new('ShaderNodeMixShader')
        L.new(tx.outputs['Alpha'], cut.inputs[0])
        L.new(N.new('ShaderNodeBsdfTransparent').outputs[0], cut.inputs[1])
        L.new(surf, cut.inputs[2])
        surf = cut.outputs[0]
    L.new(surf, out.inputs['Surface'])
    return m


# ------------------------------------------------------------------ геометрия
# Грани куба: 4 угла против часовой, если смотреть снаружи; u — слева направо,
# v — снизу вверх, чтобы текстура на боковых гранях стояла ровно.
FACES = {
    (0, 0, 1):  [(0, 0, 1), (1, 0, 1), (1, 1, 1), (0, 1, 1)],
    (0, 0, -1): [(0, 1, 0), (1, 1, 0), (1, 0, 0), (0, 0, 0)],
    (0, -1, 0): [(0, 0, 0), (1, 0, 0), (1, 0, 1), (0, 0, 1)],
    (0, 1, 0):  [(1, 1, 0), (0, 1, 0), (0, 1, 1), (1, 1, 1)],
    (-1, 0, 0): [(0, 1, 0), (0, 0, 0), (0, 0, 1), (0, 1, 1)],
    (1, 0, 0):  [(1, 0, 0), (1, 1, 0), (1, 1, 1), (1, 0, 1)],
}
UV = [(0, 0), (1, 0), (1, 1), (0, 1)]


class Mesh:
    def __init__(self):
        self.v, self.f, self.uv, self.mat = [], [], [], []

    def quad(self, corners, mat):
        i = len(self.v)
        self.v += corners
        self.f.append((i, i + 1, i + 2, i + 3))
        self.uv += UV
        self.mat.append(mat)

    def face(self, x, y, z, n, mat, s=1.0):
        self.quad([(x + a * s, y + b * s, z + c * s) for a, b, c in FACES[n]], mat)

    def cross(self, x, y, z, mat, dx=0.0, dy=0.0):
        lo, hi = 0.06, 0.94
        for (a, b), (c, d) in (((lo, lo), (hi, hi)), ((hi, lo), (lo, hi))):
            self.quad([(x + a + dx, y + b + dy, z), (x + c + dx, y + d + dy, z),
                       (x + c + dx, y + d + dy, z + 1), (x + a + dx, y + b + dy, z + 1)], mat)

    def build(self, name, mats, props):
        if not self.f:
            return None
        me = bpy.data.meshes.new(name)
        me.from_pydata(self.v, [], self.f)
        me.uv_layers.new().data.foreach_set(
            'uv', [c for f in self.f for k in range(4) for c in self.uv[f[k]]])
        names = sorted(set(self.mat))
        for n in names:
            me.materials.append(mats[n])
        me.polygons.foreach_set('material_index', [names.index(m) for m in self.mat])
        me.update()
        ob = bpy.data.objects.new(name, me)
        for k, v in props.items():
            ob[k] = v
        bpy.context.scene.collection.objects.link(ob)
        return ob


# ------------------------------------------------------------------ мир
def tree_shape(rng, x, y, g, wood):
    """Дуб или берёза как в игре: ствол и шапка 5×5 → 3×3 → крест."""
    h = rng.randint(5, 7) if wood == 'birch' else rng.randint(4, 6)
    blocks = {(x, y, g + k): f'{wood}_log' for k in range(1, h + 1)}
    for dz, r in ((-2, 2), (-1, 2), (0, 1), (1, 1)):
        z = g + h + dz
        for dx in range(-r, r + 1):
            for dy in range(-r, r + 1):
                if abs(dx) == r and abs(dy) == r and (dz == 1 or rng.random() < 0.5):
                    continue
                blocks.setdefault((x + dx, y + dy, z), f'{wood}_leaves')
    return blocks


def portal_blocks():
    x0, y = PORTAL
    b = {}
    for i in range(4):
        for k in range(5):
            if i in (0, 3) or k in (0, 4):
                b[(x0 + i, y, 1 + k)] = 'obsidian'
    return b


def world(seed):
    """Мир одинаковый для всех камер: поле, роща вокруг, облака."""
    rng = random.Random(seed)
    cams = [Vector(s['cam'][:2]) for s in SHOTS.values()]
    pc = PORTAL_C.xy
    cols = {}
    for x in range(-70, 95):
        for y in range(-25, 110):
            d = (Vector((x + 0.5, y + 0.5)) - pc).length
            if d < 26:
                cols[(x, y)] = 0
            else:
                n = noise.noise(Vector((x * 0.05, y * 0.05, 0.37)))
                cols[(x, y)] = max(0, round(n * 1.6 + (d - 26) * 0.04))

    portal = portal_blocks()
    taken = dict(portal)
    views = [View(s) for s in SHOTS]
    trees = []
    cand = list(cols)
    rng.shuffle(cand)
    for x, y in cand:
        p = Vector((x + 0.5, y + 0.5))
        if (p - pc).length < 14 or min((p - c).length for c in cams) < 13:
            continue
        # в кадре до портала и чуть за ним — открытое поле, дальше — роща
        if any(v.visible(*p, pad=2) and v.depth(*p) < v.depth(*pc) + 6 for v in views):
            continue
        grove = noise.noise(Vector((x * 0.06, y * 0.06, 1.7)))
        if rng.random() > 0.08 + 0.2 * max(0.0, grove + 0.25):
            continue
        if any((x - a) ** 2 + (y - b) ** 2 < 21 for a, b, _ in trees):
            continue
        g = cols[(x, y)]
        wood = 'birch' if rng.random() < 0.25 else 'oak'
        blocks = {p_: t for p_, t in tree_shape(rng, x, y, g, wood).items()
                  if p_ not in taken and p_[2] > cols.get(p_[:2], -9)}
        taken.update(blocks)
        trees.append((x, y, blocks))

    plants = []
    for (x, y), g in cols.items():
        if (x, y, g + 1) in taken or (x, y, g + 2) in taken:
            continue
        if 15 <= y < 20 and -2 <= x <= 3:
            continue                           # перед порталом — чистая трава
        r = rng.random()
        if r < 0.17:
            kind = 'short_grass'
        elif r < 0.195:
            kind = 'tall_grass'
        elif r < 0.26:
            kind = rng.choice(['dandelion', 'dandelion', 'poppy', 'oxeye_daisy',
                               'azure_bluet', 'cornflower'])
        else:
            continue
        plants.append((x, y, g + 1, kind, rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2)))

    clouds = set()
    for cx in range(-60, 70):
        for cy in range(-15, 75):
            n = noise.noise(Vector((cx * 0.23, cy * 0.23, 5.1)))
            if n > 0.25:
                clouds.add((cx, cy))
    return cols, portal, trees, plants, clouds


class View:
    """Камера кадра: глубина и боковое смещение точки, попадание в кадр."""
    def __init__(self, shot):
        s = SHOTS[shot]
        self.s = s
        self.pos = Vector(s['cam'])
        yaw = math.radians(s['yaw'])
        self.fwd = Vector((math.sin(yaw), math.cos(yaw)))
        self.right = Vector((math.cos(yaw), -math.sin(yaw)))
        self.tan = 18 * OVERSCAN / s['lens'] * 1.2

    def depth(self, x, y):
        return (Vector((x, y)) - self.pos.xy).dot(self.fwd)

    def visible(self, x, y, pad=3.0, far=110):
        d = self.depth(x, y)
        lat = abs((Vector((x, y)) - self.pos.xy).dot(self.right))
        return -1 < d < far and lat < d * self.tan + pad


def build_scene(opt, view):
    imgs = textures(opt['tex'])
    mats = {}
    for k, img in imgs.items():
        kind = ('leaves' if k.endswith('leaves') else 'glossy' if k == 'obsidian' else
                'plant' if k in ('short_grass', 'tall_grass_bottom', 'tall_grass_top', 'poppy',
                                 'dandelion', 'oxeye_daisy', 'cornflower', 'azure_bluet')
                else 'block')
        mats[k] = material(k, img, kind)
    mats['cloud'] = material('cloud', None, 'cloud')

    cols, portal, trees, plants, clouds = world(opt['seed'])
    bins = lambda d: int(math.floor(d))

    rows = {}
    for (x, y), g in cols.items():
        if not view.visible(x + 0.5, y + 0.5):
            continue
        m = rows.setdefault(bins(view.depth(x + 0.5, y + 0.5)), Mesh())
        m.face(x, y, g, (0, 0, 1), 'grass_top')
        for n in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0)):
            nh = cols.get((x + n[0], y + n[1]))
            if nh is not None:
                for z in range(nh + 1, g + 1):
                    m.face(x, y, z, n, 'grass_side' if z == g else 'dirt')
    for k, m in rows.items():
        m.build(f'ground_{k}', mats, {'kind': 'ground', 'depth': k + 0.5})

    def blocks_mesh(blocks):
        m = Mesh()
        for (bx, by, bz), t in blocks.items():
            for n in FACES:
                nb = blocks.get((bx + n[0], by + n[1], bz + n[2]))
                if nb and not nb.endswith('_leaves'):
                    continue                   # к непрозрачному блоку грань не нужна
                mat = t + '_top' if t.endswith('_log') and n[2] != 0 else t
                m.face(bx, by, bz, n, mat)
        return m

    for i, (x, y, blocks) in enumerate(trees):
        if view.visible(x + 0.5, y + 0.5, pad=7, far=130):
            blocks_mesh(blocks).build(f'tree_{i}', mats,
                                      {'kind': 'obj', 'depth': view.depth(x + 0.5, y + 0.5)})

    blocks_mesh(portal).build('portal', mats, {'kind': 'portal',
                                                'depth': view.depth(*PORTAL_C.xy)})

    # перед камерой — густая трава по краям кадра, по центру — проход
    have = {(p[0], p[1]) for p in plants}
    rng = random.Random(opt['seed'] * 31 + len(opt['shot']))
    for (x, y), g in cols.items():
        d = view.depth(x + 0.5, y + 0.5)
        lat = abs((Vector((x + 0.5, y + 0.5)) - view.pos.xy).dot(view.right))
        if 1.0 < d < 3.2 and lat > 0.7 and (x, y) not in have and rng.random() < 0.55:
            plants.append((x, y, g + 1, 'tall_grass' if rng.random() < 0.3 else 'short_grass',
                           rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2)))
    prow = {}
    for x, y, z, kind, dx, dy in plants:
        d = view.depth(x + 0.5, y + 0.5)
        if d > 60 or not view.visible(x + 0.5, y + 0.5, pad=1.5):
            continue
        lat = abs((Vector((x + 0.5, y + 0.5)) - view.pos.xy).dot(view.right))
        if d < 3.2 and lat < 0.7:
            continue
        if 3.2 <= d < view.s['focus'] + 2 and lat < 1.6 and (x * 7 + y * 13) % 3:
            continue                           # где стоят персонажи — пореже
        m = prow.setdefault(bins(d), Mesh())
        if kind == 'tall_grass':
            m.cross(x, y, z, 'tall_grass_bottom', dx, dy)
            m.cross(x, y, z + 1, 'tall_grass_top', dx, dy)
        else:
            m.cross(x, y, z, kind, dx, dy)
    for k, m in prow.items():
        m.build(f'plants_{k}', mats, {'kind': 'obj', 'depth': k + 0.5})

    m = Mesh()
    S, H, Z = 12, 4, 120                     # облака как в игре: клетки 12×12, толщина 4
    for cx, cy in clouds:
        x, y = cx * S, cy * S
        if not view.visible(x + 6, y + 6, pad=30, far=800) or view.depth(x + 6, y + 6) < 230:
            continue
        for n in FACES:
            if n[2] == 0 and (cx + n[0], cy + n[1]) in clouds:
                continue
            m.quad([(x + a * S, y + b * S, Z + c * H) for a, b, c in FACES[n]], 'cloud')
    ob = m.build('clouds', mats, {'kind': 'cloud', 'depth': 500})
    if ob:
        ob.visible_shadow = False


def lights_camera(opt, view):
    sc = bpy.context.scene
    s = view.s
    w = bpy.data.worlds.new('sky')
    sc.world = w
    w.use_nodes = True
    N, L = w.node_tree.nodes, w.node_tree.links
    sep = N.new('ShaderNodeSeparateXYZ')
    L.new(N.new('ShaderNodeTexCoord').outputs['Generated'], sep.inputs[0])
    ramp = N.new('ShaderNodeValToRGB')
    el = ramp.color_ramp.elements
    el[0].position, el[0].color = 0.0, (*SKY_HORIZON, 1)
    el[1].position, el[1].color = 0.6, (*SKY_ZENITH, 1)
    el.new(0.2).color = (*SKY_MID, 1)
    L.new(sep.outputs['Z'], ramp.inputs[0])
    L.new(ramp.outputs[0], N['Background'].inputs['Color'])
    k = N.new('ShaderNodeMath')               # в кадре небо темнее, чем светит
    k.operation = 'MULTIPLY_ADD'
    L.new(N.new('ShaderNodeLightPath').outputs['Is Camera Ray'], k.inputs[0])
    k.inputs[1].default_value, k.inputs[2].default_value = SKY_SEEN - 1, 1
    L.new(k.outputs[0], N['Background'].inputs['Strength'])

    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy, sun.angle, sun.color = SUN_POWER, math.radians(2.0), SUN_COLOR
    so = bpy.data.objects.new('sun', sun)
    so.rotation_euler = SUN_DIR.normalized().to_track_quat('-Z', 'Y').to_euler()
    sc.collection.objects.link(so)

    # фиолетовый свет из проёма портала, в обе стороны; сам свет камере не виден
    for i, face in enumerate((1, -1)):
        pl = bpy.data.lights.new(f'portal_light_{i}', 'AREA')
        pl.shape, pl.size, pl.size_y = 'RECTANGLE', 2.0, 3.0
        pl.energy, pl.color = 800, PORTAL_LIGHT
        po = bpy.data.objects.new(pl.name, pl)
        po.location = PORTAL_C + Vector((0, 0.01 * face, 0))
        po.rotation_euler = Euler((math.radians(90 * face), 0, 0))
        po.visible_camera = po.visible_glossy = False
        po['portal_light'] = True
        sc.collection.objects.link(po)

    cam = bpy.data.cameras.new('cam')
    cam.lens, cam.sensor_fit, cam.sensor_width = s['lens'], 'AUTO', 36 * OVERSCAN
    cam.dof.use_dof, cam.dof.focus_distance, cam.dof.aperture_fstop = True, s['focus'], s['fstop']
    co = bpy.data.objects.new('cam', cam)
    co.location = view.pos
    co.rotation_euler = Euler((math.radians(90 + s['pitch']), 0, math.radians(-s['yaw'])))
    sc.collection.objects.link(co)
    sc.camera = co

    r = sc.render
    r.engine = 'CYCLES'
    r.resolution_x = r.resolution_y = round(SIZE * OVERSCAN * opt['scale'])
    r.resolution_percentage = 100
    r.image_settings.file_format, r.image_settings.color_mode = 'PNG', 'RGBA'
    c = sc.cycles
    c.device, c.samples, c.use_denoising, c.use_adaptive_sampling = 'CPU', opt['samples'], True, True
    c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 6, 3, 1
    c.transmission_bounces, c.transparent_max_bounces = 2, 48
    c.caustics_reflective = c.caustics_refractive = False
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = opt['look']
    sc.view_settings.exposure = opt['exposure']
    return co


def set_layer(name, view, portal_light=False):
    """Кто виден в слое: свой — да, ближе — невидим (тень есть), дальше — дыра."""
    sc = bpy.context.scene
    sc.render.film_transparent = name not in ('sky', 'beauty')
    pd = sc.objects['portal']['depth']
    for o in sc.objects:
        if o.type == 'LIGHT' and o.get('portal_light'):
            o.hide_render = not portal_light
        if o.type != 'MESH':
            continue
        o.is_holdout, o.visible_camera = False, True
        kind, d = o['kind'], o['depth']
        if name == 'beauty':
            continue
        if kind == 'cloud':
            o.visible_camera = name == 'sky'
        elif name == 'sky':
            o.visible_camera = False
        elif kind == 'portal':
            o.visible_camera = name == 'portal'
        elif name == 'portal':
            if d < pd - 0.6:
                o.is_holdout = True
            else:
                o.visible_camera = False
        else:
            spec = view.s['layers'][name]
            band = spec['ground'] if kind == 'ground' else spec['obj']
            if band and band[0] <= d < band[1]:
                continue
            if d < spec['obj'][0]:
                o.visible_camera = False
            else:
                o.is_holdout = True


def project(co, p):
    """Точка мира → пиксели итогового кадра SIZE×SIZE (без запаса)."""
    from bpy_extras.object_utils import world_to_camera_view
    v = world_to_camera_view(bpy.context.scene, co, Vector(p))
    full = SIZE * OVERSCAN
    pad = (full - SIZE) / 2
    return [round(v.x * full - pad, 1), round((1 - v.y) * full - pad, 1)]


def render(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def main():
    opt = args()
    view = View(opt['shot'])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_scene(opt, view)
    co = lights_camera(opt, view)
    bpy.context.view_layer.update()
    os.makedirs(opt['out'], exist_ok=True)

    s = view.s
    f_px = s['lens'] / 36 * SIZE
    feet = view.pos + Vector((*(view.fwd * s['focus']), 0))
    x0, y = PORTAL
    meta = {
        'shot': opt['shot'], 'frame': [SIZE, SIZE], 'overscan': OVERSCAN,
        'layer_size': [round(SIZE * OVERSCAN)] * 2, 'focal_px': f_px,
        'order': ORDER,
        'depth': {**{k: v['z'] for k, v in s['layers'].items()},
                  'portal': round(view.depth(*PORTAL_C.xy), 2)},
        'feet': project(co, (feet.x, feet.y, 1.0)),
        'block_px_at_feet': round(f_px / s['focus'], 1),
        'portal_inside': [project(co, (x0 + 1 + a, y + 0.5, 2 + b))
                          for a, b in ((0, 0), (2, 0), (2, 3), (0, 3))],
    }
    with open(os.path.join(opt['out'], 'scene.json'), 'w') as fh:
        json.dump(meta, fh, indent=2, ensure_ascii=False)

    for name in opt['layers'].split(','):
        if name == 'glow':
            # свечение портала считаем по разнице, в половинном разрешении
            r = bpy.context.scene.render
            full = r.resolution_x
            r.resolution_x = r.resolution_y = full // 2
            for on in (False, True):
                set_layer('beauty', view, portal_light=on)
                render(os.path.join(opt['out'], f'glow_{"on" if on else "off"}.png'))
            r.resolution_x = r.resolution_y = full
        else:
            set_layer(name, view)
            render(os.path.join(opt['out'], name + '.png'))
        print('LAYER', name, 'готово', flush=True)
    if opt['save_blend']:
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(opt['out'], 'scene.blend'))


main()
