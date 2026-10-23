"""Фон «поле Minecraft» для Blender: строит сцену из блоков и рендерит кадр PNG.

Запускается внутри Blender 4.2+ (без аддонов):

    blender -b --factory-startup -P tools/mc_field.py -- --shot field
    blender -b --factory-startup -P tools/mc_field.py -- --shot portal

    --shot NAME      field — поле, portal — портал посередине поля; оба прямо спереди
    --out PNG        куда сохранить (по умолчанию backgrounds/field/<shot>.png)
    --tex DIR        текстуры блоков с именами как в Minecraft (grass_block_top.png, ...);
                     по умолчанию backgrounds/textures/minecraft, если есть, иначе
                     свободные backgrounds/textures/pixel-perfection
    --scale K        доля от полного разрешения, 0.35 — быстрый черновик
    --samples N      сэмплы Cycles
    --exposure EV    яркость кадра
    --style toon     рисованный стиль (по умолчанию <shot>_toon.png)

Камера на высоте глаз игрока и смотрит строго горизонтально: вертикали прямые.
Цвет в духе роликов toonz CRAFT: сочная жёлто-зелёная трава, лазурное небо,
мягкие светлые тени, резкость и цветная кайма по краям кадра.

Рисованный стиль — как у персонажей: толстая чёрная обводка, плоские сочные цвета
и одна тень. Blender рендерит служебные проходы (цвет, глубина, нормали, свет
солнца) в EXR, а toon_post() собирает из них картинку: тон по свету/тени,
обводка там, где скачет глубина, нормаль или материал.

Портал — рамка из обсидиана, внутри пусто: сквозь проём видно поле.
"""
import math
import os
import random
import sys

import bpy
import numpy as np
from mathutils import Euler, Vector, noise

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SIZE = 1080              # квадратный кадр

GRASS = (0x91, 0xBD, 0x59)    # трава и листва — цвета равнин из игры
FOLIAGE = (0x77, 0xAB, 0x2F)
BIRCH = (0x80, 0xA7, 0x55)

SKY_HORIZON = (0.42, 0.75, 1.00)
SKY_MID = (0.10, 0.50, 1.00)
SKY_ZENITH = (0.02, 0.28, 0.95)
SKY_SEEN = 0.75          # яркость неба в кадре
SKY_LIGHT = 1.2          # сколько света небо даёт сцене: светлые тени
SKY_AMBIENT = (0.80, 0.90, 1.00)        # цвет этого света — почти белый, без синевы
SUN_DIR = Vector((0.62, 0.48, -0.60))   # куда светит солнце: слева из-за спины
SUN_COLOR = (1.0, 0.93, 0.80)
SUN_POWER = 6.0
SATURATION = 1.1

PORTAL = (-1, 20)        # левый блок рамки; рамка 4×5 стоит вдоль оси x

# Камеры смотрят прямо вперёд (+y). clear — сколько блоков от камеры чистое поле,
# дальше роща. shade — деревья сразу за левым краем кадра (от камеры, в блоках):
# их не видно, но их тень ложится на траву. grass — пучки травы (цветы есть всегда).
SHOTS = {
    'field':  {'cam': (-26.0, 4.0, 2.62), 'shift': -0.08, 'lens': 28, 'clear': 22,
               'focus': 9.0, 'fstop': 1.4, 'shade': [(-7, 3), (-8, 8)], 'grass': False},
    'portal': {'cam': (1.0, 8.5, 2.62), 'shift': -0.05, 'lens': 30, 'clear': 18,
               'focus': 12.0, 'fstop': 1.4, 'shade': [(-7, 2), (-8, 7)], 'grass': True},
}


# Рисованный стиль. Плоские цвета блоков, sRGB: (тёмный, светлый, доля тёмного) —
# текстура делится по яркости на два тона; без светлого — один плоский цвет.
TOON = {
    'grass_top': ((112, 198, 60), None, 0),
    'dirt': ((152, 102, 62), None, 0),
    'oak_log': ((92, 62, 38), (128, 90, 54), 0.5),
    'oak_log_top': ((136, 100, 58), (186, 148, 94), 0.4),
    'oak_leaves': ((70, 164, 52), None, 0),
    'birch_log': ((44, 44, 44), (238, 236, 226), 0.2),
    'birch_log_top': ((160, 130, 86), (208, 184, 136), 0.4),
    'birch_leaves': ((112, 172, 70), None, 0),
    'obsidian': ((46, 28, 78), (126, 84, 196), 0.85),
    'short_grass': ((84, 172, 50), None, 0),
    'tall_grass_bottom': ((84, 172, 50), None, 0),
    'tall_grass_top': ((84, 172, 50), None, 0),
}
TOON_PLANTS = range(7, 13)                      # трава и цветы: только тонкий контур
TOON_GROUP = {                                  # обводка там, где меняется группа
    'grass_top': 1, 'grass_side': 1, 'dirt': 1, 'oak_log': 2, 'oak_log_top': 2,
    'birch_log': 3, 'birch_log_top': 3, 'oak_leaves': 4, 'birch_leaves': 5, 'obsidian': 6,
    'short_grass': 7, 'tall_grass_bottom': 7, 'tall_grass_top': 7, 'poppy': 8,
    'dandelion': 9, 'oxeye_daisy': 10, 'cornflower': 11, 'azure_bluet': 12, 'cloud': 13,
}
TOON_LIT = (1.0, 1.0, 1.0)
TOON_SHADE = (0.62, 0.70, 0.88)                 # тень темнее и чуть синее
TOON_CLOUD_SHADE = (0.86, 0.90, 0.98)
TOON_SKY_TOP, TOON_SKY_HORIZON = (60, 152, 236), (178, 224, 252)
TOON_LINE = (28, 26, 26)                        # как контур у персонажей
TOON_SS = 2                                     # рендер вдвое крупнее, потом уменьшаем


def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    tex = os.path.join(ROOT, 'backgrounds', 'textures')
    opt = {'shot': 'field', 'out': '',
           # свои текстуры Minecraft, если положены локально, иначе свободные
           'tex': next(p for p in (os.path.join(tex, 'minecraft'), os.path.join(tex, 'pixel-perfection'))
                       if os.path.isdir(p)),
           'scale': 1.0, 'samples': 0, 'seed': 11, 'exposure': 0.0, 'style': 'photo'}
    for k, v in zip(a[::2], a[1::2]):
        k = k.lstrip('-').replace('-', '_')
        opt[k] = v if isinstance(opt[k], str) else type(opt[k])(v)
    toon = opt['style'] == 'toon'
    opt['samples'] = opt['samples'] or (16 if toon else 128)
    name = opt['shot'] + ('_toon' if toon else '') + '.png'
    opt['out'] = opt['out'] or os.path.join(ROOT, 'backgrounds', 'field', name)
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


def textures(tex, toon=False):
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
    if toon:
        t = toon_textures(t, load_rgba(tex, 'grass_block_side_overlay'))
    imgs = {}
    for k, a in t.items():
        img = bpy.data.images.new(k, a.shape[1], a.shape[0], alpha=True)
        img.pixels.foreach_set(a.ravel())
        img.pack()
        imgs[k] = img
    return imgs


def toon_textures(t, overlay):
    """Текстуры рисованного стиля: один-два плоских тона, цветы — сочнее."""
    out = {}
    for k, a in t.items():
        a = a.copy()
        if k in TOON:
            dark, light, q = TOON[k]
            dark = np.array(dark, np.float32) / 255
            light = None if light is None else np.array(light, np.float32) / 255
            if light is None:
                a[..., :3] = dark
            else:
                lum = a[..., :3].mean(-1)
                a[..., :3] = np.where((lum > np.quantile(lum, q))[..., None], light, dark)
            if 'grass' not in k:
                a[..., 3] = 1                    # листва сплошная: в дырках был бы чёрный
        elif k not in ('grass_side',):           # цветы: та же форма, цвет сочнее
            g = a[..., :3].mean(-1, keepdims=True)
            a[..., :3] = np.clip(g + (a[..., :3] - g) * 1.5, 0, 1)
        out[k] = a
    side = np.empty_like(out['dirt'])
    side[...] = out['dirt']
    side[..., :3] = np.where(overlay[..., 3:] > 0.5, out['grass_top'][..., :3], out['dirt'][..., :3])
    out['grass_side'] = side
    return out


# ------------------------------------------------------------------ материалы
def toon_material(name, img, kind):
    """Рисованный стиль: только цвет, без блеска и дымки; вырез — у травы и цветов."""
    m = bpy.data.materials.new(name)
    m.pass_index = TOON_GROUP[name]
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    N.clear()
    out = N.new('ShaderNodeOutputMaterial')
    bsdf = N.new('ShaderNodeBsdfDiffuse')
    if img:
        tx = N.new('ShaderNodeTexImage')
        tx.image, tx.interpolation = img, 'Closest'
        L.new(tx.outputs['Color'], bsdf.inputs['Color'])
    else:
        bsdf.inputs['Color'].default_value = (1, 1, 1, 1)
    surf = bsdf.outputs[0]
    if kind == 'plant':
        up = N.new('ShaderNodeCombineXYZ')
        up.inputs[2].default_value = 1
        L.new(up.outputs[0], bsdf.inputs['Normal'])
        cut = N.new('ShaderNodeMixShader')
        L.new(tx.outputs['Alpha'], cut.inputs[0])
        L.new(N.new('ShaderNodeBsdfTransparent').outputs[0], cut.inputs[1])
        L.new(surf, cut.inputs[2])
        surf = cut.outputs[0]
    L.new(surf, out.inputs['Surface'])
    return m


def material(name, img, kind, toon=False):
    """kind: block, leaves, plant, glossy (обсидиан), cloud."""
    if toon:
        return toon_material(name, img, kind)
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    N, L = m.node_tree.nodes, m.node_tree.links
    N.clear()
    out = N.new('ShaderNodeOutputMaterial')
    bsdf = N.new('ShaderNodeBsdfPrincipled')
    bsdf.inputs['Roughness'].default_value = 0.3 if kind == 'glossy' else 0.9
    bsdf.inputs['Specular IOR Level'].default_value = 0.6 if kind == 'glossy' else 0.15
    if kind == 'cloud':
        bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
        bsdf.inputs['Emission Color'].default_value = (1, 1, 1, 1)
        bsdf.inputs['Emission Strength'].default_value = 0.5
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
    near, far, top = (150, 600, 0.55) if kind == 'cloud' else (35, 180, 0.3)
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

    def face(self, x, y, z, n, mat):
        self.quad([(x + a, y + b, z + c) for a, b, c in FACES[n]], mat)

    def blocks(self, blocks, solid=False):
        """Грани блоков; к непрозрачному соседу грань не нужна, листва — как в игре
        (сквозная) или сплошная (solid, для рисованного стиля)."""
        for (x, y, z), t in blocks.items():
            for n in FACES:
                nb = blocks.get((x + n[0], y + n[1], z + n[2]))
                if nb and (solid or not nb.endswith('_leaves')):
                    continue
                self.face(x, y, z, n, t + '_top' if t.endswith('_log') and n[2] else t)

    def cross(self, x, y, z, mat, dx=0.0, dy=0.0):
        lo, hi = 0.06, 0.94
        for (a, b), (c, d) in (((lo, lo), (hi, hi)), ((hi, lo), (lo, hi))):
            self.quad([(x + a + dx, y + b + dy, z), (x + c + dx, y + d + dy, z),
                       (x + c + dx, y + d + dy, z + 1), (x + a + dx, y + b + dy, z + 1)], mat)

    def build(self, name, mats):
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
        bpy.context.scene.collection.objects.link(ob)
        return ob


# ------------------------------------------------------------------ мир
class View:
    def __init__(self, s):
        self.s, self.pos = s, Vector(s['cam'])
        self.tan = 18 / s['lens'] * 1.15

    def depth(self, x, y):
        return y - self.pos.y

    def visible(self, x, y, pad=3.0, far=110):
        d = self.depth(x, y)
        return -1 < d < far and abs(x - self.pos.x) < d * self.tan + pad


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


def world(seed):
    """Мир один на оба кадра: поле, портал, роща, облака."""
    rng = random.Random(seed)
    views = [View(s) for s in SHOTS.values()]
    cols = {}
    for x in range(-75, 60):
        for y in range(-10, 120):
            n = noise.noise(Vector((x * 0.05, y * 0.05, 0.37)))
            cols[(x, y)] = 0 if y < 36 else max(0, round(n * 1.6 + (y - 36) * 0.05))

    x0, py = PORTAL
    portal = {(x0 + i, py, 1 + k): 'obsidian'
              for i in range(4) for k in range(5) if i in (0, 3) or k in (0, 4)}
    taken = dict(portal)
    trees = []
    for v in views:
        for dx, dy in v.s['shade']:
            x, y = int(v.pos.x + dx), int(v.pos.y + dy)
            blocks = tree_shape(rng, x, y, cols[(x, y)], 'oak')
            taken.update(blocks)
            trees.append((x, y, blocks))
    cand = list(cols)
    rng.shuffle(cand)
    for x, y in cand:
        c = (x + 0.5, y + 0.5)
        if any(v.visible(*c, pad=3) and v.depth(*c) < v.s['clear'] for v in views):
            continue                           # перед камерами — открытое поле
        if any((Vector(c) - v.pos.xy).length < 12 for v in views):
            continue
        if abs(c[0] - 1) < 5 and c[1] < 42:
            continue                           # прямо за порталом — без деревьев
        grove = noise.noise(Vector((x * 0.06, y * 0.06, 1.7)))
        if rng.random() > 0.08 + 0.22 * max(0.0, grove + 0.25):
            continue
        if any((x - a) ** 2 + (y - b) ** 2 < 21 for a, b, _ in trees):
            continue
        wood = 'birch' if rng.random() < 0.2 else 'oak'
        blocks = {p: t for p, t in tree_shape(rng, x, y, cols[(x, y)], wood).items()
                  if p not in taken and p[2] > cols.get(p[:2], -9)}
        taken.update(blocks)
        trees.append((x, y, blocks))

    plants = []
    for (x, y), g in cols.items():
        if (x, y, g + 1) in taken or (x, y, g + 2) in taken:
            continue
        if 15 <= y < 20 and -2 <= x <= 3:
            continue                           # перед порталом — чистая трава
        r = rng.random()
        if r < 0.15:
            kind = 'short_grass'
        elif r < 0.175:
            kind = 'tall_grass'
        elif r < 0.25:
            kind = rng.choice(['dandelion', 'dandelion', 'poppy', 'poppy', 'oxeye_daisy',
                               'azure_bluet', 'cornflower'])
        else:
            continue
        plants.append((x, y, g + 1, kind, rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2)))

    clouds = {(cx, cy) for cx in range(-60, 70) for cy in range(-15, 75)
              if noise.noise(Vector((cx * 0.23, cy * 0.23, 5.1))) > 0.25}
    return cols, portal, trees, plants, clouds


def build_scene(opt, view):
    toon = opt['style'] == 'toon'
    mats = {}
    for k, img in textures(opt['tex'], toon).items():
        kind = ('leaves' if k.endswith('leaves') else 'glossy' if k == 'obsidian' else
                'block' if k in ('grass_top', 'grass_side', 'dirt') or '_log' in k else 'plant')
        mats[k] = material(k, img, kind, toon)
    mats['cloud'] = material('cloud', None, 'cloud', toon)

    cols, portal, trees, plants, clouds = world(opt['seed'])

    m = Mesh()
    for (x, y), g in cols.items():
        if not view.visible(x + 0.5, y + 0.5):
            continue
        m.face(x, y, g, (0, 0, 1), 'grass_top')
        for n in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0)):
            nh = cols.get((x + n[0], y + n[1]))
            if nh is not None:
                for z in range(nh + 1, g + 1):
                    m.face(x, y, z, n, 'grass_side' if z == g else 'dirt')
    m.build('ground', mats)

    m = Mesh()
    for x, y, blocks in trees:
        if view.visible(x + 0.5, y + 0.5, pad=8, far=130):
            m.blocks(blocks, solid=toon)
    m.build('trees', mats)

    m = Mesh()
    m.blocks(portal)
    m.build('portal', mats)

    # перед камерой — трава по краям кадра, по центру — проход
    rng = random.Random(opt['seed'] * 31 + len(opt['shot']))
    have = {(p[0], p[1]) for p in plants}
    for (x, y), g in cols.items():
        d, lat = view.depth(x + 0.5, y + 0.5), abs(x + 0.5 - view.pos.x)
        if 1.0 < d < 3.5 and lat > 0.8 and (x, y) not in have and rng.random() < 0.6:
            plants.append((x, y, g + 1, 'tall_grass' if rng.random() < 0.35 else 'short_grass',
                           rng.uniform(-0.2, 0.2), rng.uniform(-0.2, 0.2)))
    m = Mesh()
    for x, y, z, kind, dx, dy in plants:
        d, lat = view.depth(x + 0.5, y + 0.5), abs(x + 0.5 - view.pos.x)
        if d > 60 or not view.visible(x + 0.5, y + 0.5, pad=1.5) or (d < 3.5 and lat < 0.8):
            continue
        if d < 12 and lat < 1.5 or opt['shot'] == 'portal' and d < 12 and lat < 2.5:
            continue                           # посередине — чистая трава, к порталу дорожка
        if not view.s['grass'] and kind in ('short_grass', 'tall_grass'):
            continue
        if toon and (d > 22 or kind in ('short_grass', 'tall_grass')):
            continue                           # в рисунке пиксельная трава и мелочь — шум
        if kind == 'tall_grass':
            m.cross(x, y, z, 'tall_grass_bottom', dx, dy)
            m.cross(x, y, z + 1, 'tall_grass_top', dx, dy)
        else:
            m.cross(x, y, z, kind, dx, dy)
    m.build('plants', mats)

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
    m.build('clouds', mats).visible_shadow = False


def lights_camera(opt, s):
    sc = bpy.context.scene
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
    is_cam = N.new('ShaderNodeLightPath').outputs['Is Camera Ray']
    col = N.new('ShaderNodeMix')              # камера видит синее небо, сцену оно
    col.data_type = 'RGBA'                    # освещает почти белым светом
    L.new(is_cam, col.inputs['Factor'])
    col.inputs['A'].default_value = (*SKY_AMBIENT, 1)
    L.new(ramp.outputs[0], col.inputs['B'])
    L.new(col.outputs['Result'], N['Background'].inputs['Color'])
    k = N.new('ShaderNodeMath')               # и яркость у них разная
    k.operation = 'MULTIPLY_ADD'
    L.new(is_cam, k.inputs[0])
    k.inputs[1].default_value, k.inputs[2].default_value = SKY_SEEN - SKY_LIGHT, SKY_LIGHT
    L.new(k.outputs[0], N['Background'].inputs['Strength'])

    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy, sun.angle, sun.color = SUN_POWER, math.radians(2.5), SUN_COLOR
    so = bpy.data.objects.new('sun', sun)
    so.rotation_euler = SUN_DIR.normalized().to_track_quat('-Z', 'Y').to_euler()
    sc.collection.objects.link(so)

    cam = bpy.data.cameras.new('cam')
    cam.lens, cam.sensor_fit, cam.sensor_width = s['lens'], 'AUTO', 36
    cam.shift_y = s['shift']                  # больше земли в кадре без наклона камеры
    cam.dof.use_dof, cam.dof.focus_distance, cam.dof.aperture_fstop = True, s['focus'], s['fstop']
    co = bpy.data.objects.new('cam', cam)
    co.location = s['cam']
    co.rotation_euler = Euler((math.radians(90), 0, 0))   # строго горизонтально
    sc.collection.objects.link(co)
    sc.camera = co

    r = sc.render
    r.engine = 'CYCLES'
    r.resolution_x = r.resolution_y = round(SIZE * opt['scale'])
    r.resolution_percentage = 100
    r.image_settings.file_format, r.image_settings.color_mode = 'PNG', 'RGB'
    c = sc.cycles
    c.device, c.samples, c.use_denoising, c.use_adaptive_sampling = 'CPU', opt['samples'], True, True
    c.max_bounces, c.diffuse_bounces, c.glossy_bounces = 6, 3, 1
    c.transmission_bounces, c.transparent_max_bounces = 2, 48
    c.caustics_reflective = c.caustics_refractive = False
    sc.view_settings.view_transform = 'Standard'     # без приглушения цвета, как в игре
    sc.view_settings.look = 'Medium High Contrast'
    sc.view_settings.exposure = opt['exposure']

    if opt['style'] == 'toon':
        # служебные проходы в EXR, картинку из них соберёт toon_post()
        sun.angle = math.radians(0.3)          # чёткие края теней
        N['Background'].inputs['Strength'].default_value = 0   # свет только от солнца
        L.remove(k.outputs[0].links[0])
        cam.dof.use_dof = False
        r.resolution_x = r.resolution_y = round(SIZE * TOON_SS * opt['scale'])
        r.film_transparent = True
        r.image_settings.file_format, r.image_settings.color_depth = 'OPEN_EXR_MULTILAYER', '32'
        r.image_settings.color_mode = 'RGBA'
        c.use_denoising = c.use_adaptive_sampling = False
        vl = sc.view_layers[0]
        vl.use_pass_diffuse_color = vl.use_pass_diffuse_direct = True
        vl.use_pass_normal = vl.use_pass_z = vl.use_pass_material_index = True
        sc.use_nodes = False
        return

    # сочность, резкость, цветная кайма по краям и лёгкое свечение
    sc.use_nodes = True
    T = sc.node_tree
    T.nodes.clear()
    chain = [T.nodes.new('CompositorNodeRLayers')]
    hs = T.nodes.new('CompositorNodeHueSat')
    hs.inputs['Saturation'].default_value = SATURATION
    sh = T.nodes.new('CompositorNodeFilter')
    sh.filter_type = 'SHARPEN'
    sh.inputs['Fac'].default_value = 0.25
    ld = T.nodes.new('CompositorNodeLensdist')
    ld.inputs['Dispersion'].default_value = 0.012
    gl = T.nodes.new('CompositorNodeGlare')
    gl.glare_type = 'BLOOM'
    gl.inputs['Threshold'].default_value = 0.9
    gl.inputs['Strength'].default_value = 0.2
    gl.inputs['Size'].default_value = 0.6
    chain += [hs, sh, ld, gl, T.nodes.new('CompositorNodeComposite')]
    for a, b in zip(chain, chain[1:]):
        T.links.new(a.outputs['Image'], b.inputs['Image'])


def srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, x * 12.92, 1.055 * x ** (1 / 2.4) - 0.055)


def dilate(mask, r):
    out = mask.copy()
    h, w = mask.shape
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if 0 < dx * dx + dy * dy <= r * r + r:
                out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] |= \
                    mask[max(-dy, 0):h + min(-dy, 0), max(-dx, 0):w + min(-dx, 0)]
    return out


def neighbours(a):
    """Соседи справа и снизу (на краю — сам пиксель)."""
    p = np.pad(a, [(0, 1), (0, 1)] + [(0, 0)] * (a.ndim - 2), mode='edge')
    return p[:-1, 1:], p[1:, :-1]


def toon_post(exr, out, s):
    """Проходы рендера → рисованная картинка: два тона, небо, чёрная обводка."""
    import OpenImageIO as oiio
    buf = oiio.ImageBuf(exr)
    names = list(buf.spec().channelnames)
    px = buf.get_pixels(oiio.FLOAT)
    ch = lambda *n: np.stack([px[..., names.index('ViewLayer.' + k)] for k in n], -1)
    alpha = ch('Combined.A')[..., 0]
    a = np.maximum(alpha, 1e-4)[..., None]
    alb = srgb(ch('DiffCol.R', 'DiffCol.G', 'DiffCol.B') / a)
    light = (ch('DiffDir.R', 'DiffDir.G', 'DiffDir.B') / a).mean(-1)
    z = ch('Depth.Z')[..., 0]
    nrm = ch('Normal.X', 'Normal.Y', 'Normal.Z')
    nrm /= np.maximum(np.linalg.norm(nrm, axis=-1, keepdims=True), 1e-6)
    idx = np.rint(ch('IndexMA.X')[..., 0]).astype(int)
    solid = alpha > 0.5
    h, w = alpha.shape
    rgb = lambda c: np.array(c, np.float32) / 255

    # два тона: на солнце и в тени; облака в тени светлее
    lit = light > 0.3 * np.percentile(light[solid], 95)
    shade = np.where((idx == TOON_GROUP['cloud'])[..., None], TOON_CLOUD_SHADE, TOON_SHADE)
    col = alb * np.where(lit[..., None], TOON_LIT, shade)
    horizon = rgb(TOON_SKY_HORIZON)
    fog = np.clip((z - 45) / 160, 0, 0.4)[..., None]     # даль светлеет к горизонту
    col = col * (1 - fog) + horizon * fog
    t = np.clip(np.arange(h) / (h * (0.5 + s['shift'])), 0, 1)[:, None, None]
    sky = rgb(TOON_SKY_TOP) * (1 - t) + horizon * t
    img = col * alpha[..., None] + sky * (1 - alpha[..., None])

    # обводка: скачок глубины (по 1/z — на ровной земле он плавный), излом, смена материала
    inv = np.where(solid, 1 / np.maximum(z, 1e-3), 0)
    p = np.pad(inv, 1, mode='edge')
    lap = np.abs(4 * inv - p[:-2, 1:-1] - p[2:, 1:-1] - p[1:-1, :-2] - p[1:-1, 2:])
    edge = lap > 0.08 * np.maximum(inv, 1e-9)
    nr, nd = neighbours(nrm)
    edge |= solid & (z < 40) & (np.minimum((nrm * nr).sum(-1), (nrm * nd).sum(-1)) < 0.75)
    ir, idn = neighbours(idx)
    plant = np.isin(idx, TOON_PLANTS)
    pr, pd = neighbours(plant)
    near_plant = plant | pr | pd
    edge &= ~near_plant                         # у травы и цветов — только контур
    outline = (idx != ir) | (idx != idn)
    # толщина: вблизи толще, вдали тоньше; трава и цветы — тонко
    zn = np.where(solid, z, 1e9)
    zr, zd = neighbours(zn)
    zmin = np.minimum(zn, np.minimum(zr, zd))
    line = dilate(outline & near_plant, 1)
    edge |= outline & ~near_plant
    for r, lo, hi in ((3, 0, 15), (2, 15, 30), (1, 30, 2e9)):
        line |= dilate(edge & (zmin >= lo) & (zmin < hi), r)
    img[line] = rgb(TOON_LINE)

    img = img.reshape(h // TOON_SS, TOON_SS, w // TOON_SS, TOON_SS, 3).mean((1, 3))
    img = (np.clip(img, 0, 1) * 255 + 0.5).astype(np.uint8)
    o = oiio.ImageBuf(oiio.ImageSpec(img.shape[1], img.shape[0], 3, oiio.UINT8))
    o.set_pixels(oiio.ROI(), img)
    o.write(out)


def main():
    opt = args()
    s = SHOTS[opt['shot']]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_scene(opt, View(s))
    lights_camera(opt, s)
    os.makedirs(os.path.dirname(opt['out']), exist_ok=True)
    toon = opt['style'] == 'toon'
    path = os.path.join(bpy.app.tempdir, 'passes.exr') if toon else opt['out']
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    if toon:
        toon_post(path, opt['out'], s)
        os.remove(path)
    print('PNG', opt['out'], flush=True)


main()
