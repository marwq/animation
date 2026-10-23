"""Фон «поле Minecraft» для Blender: строит сцену из блоков и рендерит кадр PNG.

Запускается внутри Blender 4.2+ (без аддонов):

    blender -b --factory-startup -P tools/mc_field.py -- --shot field
    blender -b --factory-startup -P tools/mc_field.py -- --shot portal

    --shot NAME      field — поле, portal — портал посередине поля; оба прямо спереди
    --out PNG        куда сохранить (по умолчанию backgrounds/field/<shot>.png)
    --tex DIR        текстуры блоков с именами как в Minecraft (grass_block_top.png, ...)
    --scale K        доля от полного разрешения, 0.35 — быстрый черновик
    --samples N      сэмплы Cycles

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

GRASS = (0x7C, 0xC4, 0x46)    # трава и листва: сочнее, чем в игре
FOLIAGE = (0x5C, 0xB0, 0x2A)
BIRCH = (0x80, 0xA7, 0x55)

SKY_HORIZON = (0.55, 0.80, 1.00)
SKY_MID = (0.20, 0.52, 1.00)
SKY_ZENITH = (0.05, 0.26, 0.95)
SKY_SEEN = 0.7           # яркость неба в кадре; на сцену небо светит с силой 1
SUN_DIR = Vector((0.62, 0.48, -0.55))   # куда светит солнце: слева из-за спины,
SUN_COLOR = (1.0, 0.88, 0.72)           # низко — тени длинные, тёплый свет
SUN_POWER = 6.0
SATURATION = 1.3

PORTAL = (-1, 20)        # левый блок рамки; рамка 4×5 стоит вдоль оси x

# Камеры смотрят прямо вперёд (+y). clear — сколько блоков от камеры чистое поле,
# дальше роща.
SHOTS = {
    'field':  {'cam': (-26.0, 4.0, 2.4), 'pitch': 4, 'lens': 26, 'clear': 22,
               'focus': 9.0, 'fstop': 1.2},
    'portal': {'cam': (1.0, 8.5, 2.4), 'pitch': 5, 'lens': 30, 'clear': 18,
               'focus': 12.0, 'fstop': 1.2},
}


def args():
    a = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    opt = {'shot': 'field', 'out': '',
           'tex': os.path.join(ROOT, 'backgrounds', 'textures', 'pixel-perfection'),
           'scale': 1.0, 'samples': 128, 'seed': 11}
    for k, v in zip(a[::2], a[1::2]):
        k = k.lstrip('-').replace('-', '_')
        opt[k] = v if isinstance(opt[k], str) else type(opt[k])(v)
    opt['out'] = opt['out'] or os.path.join(ROOT, 'backgrounds', 'field', opt['shot'] + '.png')
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

    def blocks(self, blocks):
        """Грани блоков; к непрозрачному соседу грань не нужна, листва — как в игре."""
        for (x, y, z), t in blocks.items():
            for n in FACES:
                nb = blocks.get((x + n[0], y + n[1], z + n[2]))
                if nb and not nb.endswith('_leaves'):
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
    mats = {}
    for k, img in textures(opt['tex']).items():
        kind = ('leaves' if k.endswith('leaves') else 'glossy' if k == 'obsidian' else
                'block' if k in ('grass_top', 'grass_side', 'dirt') or '_log' in k else 'plant')
        mats[k] = material(k, img, kind)
    mats['cloud'] = material('cloud', None, 'cloud')

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
            m.blocks(blocks)
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
        if d < 9 and lat < 1.3 or opt['shot'] == 'portal' and d < 12 and lat < 2.5:
            continue                           # посередине — чистая трава, к порталу дорожка
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
    L.new(ramp.outputs[0], N['Background'].inputs['Color'])
    k = N.new('ShaderNodeMath')               # в кадре небо темнее, чем светит
    k.operation = 'MULTIPLY_ADD'
    L.new(N.new('ShaderNodeLightPath').outputs['Is Camera Ray'], k.inputs[0])
    k.inputs[1].default_value, k.inputs[2].default_value = SKY_SEEN - 1, 1
    L.new(k.outputs[0], N['Background'].inputs['Strength'])

    sun = bpy.data.lights.new('sun', 'SUN')
    sun.energy, sun.angle, sun.color = SUN_POWER, math.radians(1.2), SUN_COLOR
    so = bpy.data.objects.new('sun', sun)
    so.rotation_euler = SUN_DIR.normalized().to_track_quat('-Z', 'Y').to_euler()
    sc.collection.objects.link(so)

    cam = bpy.data.cameras.new('cam')
    cam.lens, cam.sensor_fit, cam.sensor_width = s['lens'], 'AUTO', 36
    cam.dof.use_dof, cam.dof.focus_distance, cam.dof.aperture_fstop = True, s['focus'], s['fstop']
    co = bpy.data.objects.new('cam', cam)
    co.location = s['cam']
    co.rotation_euler = Euler((math.radians(90 + s['pitch']), 0, 0))
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
    sc.view_settings.view_transform = 'AgX'
    sc.view_settings.look = 'AgX - Punchy'
    sc.view_settings.exposure = 1.0

    # сочность и лёгкое свечение светлых мест
    sc.use_nodes = True
    T = sc.node_tree
    T.nodes.clear()
    rl = T.nodes.new('CompositorNodeRLayers')
    hs = T.nodes.new('CompositorNodeHueSat')
    hs.inputs['Saturation'].default_value = SATURATION
    gl = T.nodes.new('CompositorNodeGlare')
    gl.glare_type = 'BLOOM'
    gl.inputs['Threshold'].default_value = 1.2
    gl.inputs['Strength'].default_value = 0.25
    gl.inputs['Size'].default_value = 0.6
    out = T.nodes.new('CompositorNodeComposite')
    T.links.new(rl.outputs['Image'], hs.inputs['Image'])
    T.links.new(hs.outputs['Image'], gl.inputs['Image'])
    T.links.new(gl.outputs['Image'], out.inputs['Image'])


def main():
    opt = args()
    s = SHOTS[opt['shot']]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_scene(opt, View(s))
    lights_camera(opt, s)
    os.makedirs(os.path.dirname(opt['out']), exist_ok=True)
    bpy.context.scene.render.filepath = opt['out']
    bpy.ops.render.render(write_still=True)
    print('PNG', opt['out'], flush=True)


main()
