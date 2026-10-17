# Сцена для Short «почему бетонные разделители скошены у основания».
#
# Две раскладки шоссе в одной точке мира, включаются коллекциями:
#   HwyBarrier — две проезжие части, посередине разделитель New Jersey (+ фонари на нём);
#   Wall       — вертикальная стена того же размера вместо Jersey (для сравнения);
#   HwyGrass   — две проезжие части, между ними травяная разделительная полоса с канавой.
# Машины строятся процедурно (лофт по сечениям + сабдив), у героев есть формы смятия.
#
# Ось Y — вдоль дороги, X — поперёк, Z — вверх. Машина «смотрит» в +Y, её левый бок — в −X.
import bpy, bmesh, math, os, random
from mathutils import Vector, Matrix, Euler, noise

ASSETS = os.environ.get('ASSETS', os.path.join(os.path.dirname(__file__), 'assets'))
IN = 0.0254

# Профиль Jersey (полупрофиль от оси, м): уступ 3 in, скос 55° до 13 in, грань 84° до 32 in, основание 24 in.
J_BASE = 12 * IN
J_REVEAL = 3 * IN
J_BREAK = 13 * IN
J_TOP = 32 * IN
J_BREAK_X = J_BASE - (J_BREAK - J_REVEAL) / math.tan(math.radians(55))
J_TOP_X = J_BREAK_X - (J_TOP - J_BREAK) / math.tan(math.radians(84))
JERSEY_PROFILE = [(J_BASE, 0.0), (J_BASE, J_REVEAL), (J_BREAK_X, J_BREAK), (J_TOP_X, J_TOP)]
WALL_PROFILE = [(0.2, 0.0), (0.2, J_TOP)]

# Раскладка HwyBarrier: внутренняя обочина 1.2 м, две полосы по 3.6 м, внешняя обочина 2.5 м.
LANE_W = 3.6
B_INNER = J_BASE + 1.2                         # жёлтая линия
B_LANE1 = B_INNER + LANE_W / 2                 # центр левой (скоростной) полосы
B_LANE2 = B_INNER + LANE_W * 1.5
B_EDGE = B_INNER + 2 * LANE_W                  # белая краевая линия
B_ROAD = B_EDGE + 2.5
# Раскладка HwyGrass: травяная разделительная полоса шириной 2*G_MED.
G_MED = 7.0
G_INNER = G_MED + 1.0
G_LANE1 = G_INNER + LANE_W / 2
G_LANE2 = G_INNER + LANE_W * 1.5
G_EDGE = G_INNER + 2 * LANE_W
G_ROAD = G_EDGE + 2.5
ROAD_LEN = 1200.0


def median_z(x):
    """Высота травяной разделительной полосы: неглубокая канава посередине."""
    if abs(x) >= G_MED:
        return 0.0
    u = abs(x) / G_MED
    return -0.45 * (1 - u * u) ** 2


# ---------------------------------------------------------------- коллекции и материалы

def coll(name, parent=None):
    c = bpy.data.collections.get(name)
    if not c:
        c = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(c)
    return c


def link(obj, c):
    c.objects.link(obj)
    return obj


def principled(name, rgb, rough=0.5, metal=0.0, coat=0.0, emit=None, emit_strength=0.0, alpha=1.0):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*rgb, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    b.inputs['Coat Weight'].default_value = coat
    b.inputs['Coat Roughness'].default_value = 0.04
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = emit_strength
    if alpha < 1:
        b.inputs['Alpha'].default_value = alpha
    return m


def emissive(name, rgb, strength):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (*rgb, 1)
    e.inputs['Strength'].default_value = strength
    nt.links.new(e.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m


def tex_path(asset, kind):
    return os.path.join(ASSETS, 'tex', asset, f'{asset}_1K-JPG_{kind}.jpg')


def pbr(name, asset, tile, tint=(1, 1, 1), box=False, rough_add=0.0, bump=0.4):
    """PBR-материал ambientCG; координаты — объектные (у плоских объектов = мировые), повтор каждые tile м."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (1 / tile, 1 / tile, 1 / tile)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])

    def img(kind, non_color=False):
        n = nt.nodes.new('ShaderNodeTexImage')
        n.image = bpy.data.images.load(tex_path(asset, kind), check_existing=True)
        if non_color:
            n.image.colorspace_settings.name = 'Non-Color'
        if box:
            n.projection = 'BOX'
            n.projection_blend = 0.25
        nt.links.new(mp.outputs['Vector'], n.inputs['Vector'])
        return n

    col = img('Color')
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    mix.blend_type = 'MULTIPLY'
    mix.inputs['Factor'].default_value = 1.0
    nt.links.new(col.outputs['Color'], mix.inputs['A'])
    mix.inputs['B'].default_value = (*tint, 1)
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    r = img('Roughness', True)
    if rough_add:
        add = nt.nodes.new('ShaderNodeMath')
        add.operation = 'ADD'
        add.use_clamp = True
        add.inputs[1].default_value = rough_add
        nt.links.new(r.outputs['Color'], add.inputs[0])
        nt.links.new(add.outputs[0], b.inputs['Roughness'])
    else:
        nt.links.new(r.outputs['Color'], b.inputs['Roughness'])
    nrm = img('NormalGL', True)
    nm = nt.nodes.new('ShaderNodeNormalMap')
    nm.inputs['Strength'].default_value = bump
    nt.links.new(nrm.outputs['Color'], nm.inputs['Color'])
    nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    m['base_mix'] = mix.name
    return m


def add_variation(m, scale, color_b, strength=0.5):
    """Крупные пятна другого оттенка поверх текстуры, чтобы не было видно повтора."""
    nt = m.node_tree
    mix = nt.nodes[m['base_mix']]
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = scale
    nz.inputs['Detail'].default_value = 3
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeMapRange')
    ramp.inputs['From Min'].default_value = 0.42
    ramp.inputs['From Max'].default_value = 0.62
    ramp.inputs['To Max'].default_value = strength
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Value'])
    m2 = nt.nodes.new('ShaderNodeMix')
    m2.data_type = 'RGBA'
    m2.blend_type = 'MULTIPLY'
    nt.links.new(ramp.outputs['Result'], m2.inputs['Factor'])
    nt.links.new(mix.outputs['Result'], m2.inputs['A'])
    m2.inputs['B'].default_value = (*color_b, 1)
    b = nt.nodes['Principled BSDF']
    nt.links.new(m2.outputs['Result'], b.inputs['Base Color'])
    return m2


def concrete_with_tire_marks(name):
    """Бетон разделителя: светлый, на нижнем скосе — чёрные следы шин, как на настоящих Jersey."""
    m = pbr(name, 'Concrete034', 1.6, tint=(1.15, 1.13, 1.08), box=True, bump=0.6)
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    src = b.inputs['Base Color'].links[0].from_socket
    tc = nt.nodes.new('ShaderNodeTexCoord')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs['Vector'])
    # маска по высоте: только зона скоса 0.08–0.33 м
    band = nt.nodes.new('ShaderNodeMapRange')
    band.interpolation_type = 'SMOOTHSTEP'
    band.inputs['From Min'].default_value = 0.36
    band.inputs['From Max'].default_value = 0.22
    nt.links.new(sep.outputs['Z'], band.inputs['Value'])
    # вытянутый вдоль Y шум — полосы-следы
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (6.0, 0.12, 14.0)
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise')
    nz.inputs['Scale'].default_value = 3.0
    nz.inputs['Detail'].default_value = 4
    nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
    thr = nt.nodes.new('ShaderNodeMapRange')
    thr.inputs['From Min'].default_value = 0.5
    thr.inputs['From Max'].default_value = 0.68
    thr.inputs['To Max'].default_value = 0.85
    nt.links.new(nz.outputs['Fac'], thr.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeMath')
    mul.operation = 'MULTIPLY'
    nt.links.new(thr.outputs['Result'], mul.inputs[0])
    nt.links.new(band.outputs['Result'], mul.inputs[1])
    mix = nt.nodes.new('ShaderNodeMix')
    mix.data_type = 'RGBA'
    nt.links.new(mul.outputs[0], mix.inputs['Factor'])
    nt.links.new(src, mix.inputs['A'])
    mix.inputs['B'].default_value = (0.035, 0.035, 0.038, 1)
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    return m


def mats():
    M = {}
    M['grass'] = pbr('grass', 'Grass004', 2.5, tint=(0.85, 0.95, 0.7), bump=0.5)
    add_variation(M['grass'], 0.05, (1.25, 1.1, 0.65), 0.6)
    M['asphalt'] = pbr('asphalt', 'Asphalt026C', 4.0, tint=(0.85, 0.85, 0.88), bump=0.3)
    add_variation(M['asphalt'], 0.08, (0.75, 0.75, 0.75), 0.5)
    M['gravel'] = pbr('gravel', 'Gravel022', 1.5, tint=(0.9, 0.88, 0.82))
    M['concrete'] = concrete_with_tire_marks('concrete')
    M['wall'] = pbr('wall_concrete', 'Concrete034', 1.6, tint=(1.1, 1.08, 1.04), box=True, bump=0.6)
    M['white_line'] = principled('white_line', (0.85, 0.85, 0.82), 0.55)
    M['yellow_line'] = principled('yellow_line', (0.9, 0.62, 0.05), 0.55)
    M['steel'] = principled('steel', (0.62, 0.63, 0.65), 0.35, 1.0)
    M['lamp'] = emissive('lamp', (1.0, 0.95, 0.85), 2.0)
    M['trunk'] = principled('trunk', (0.22, 0.15, 0.09), 0.9)
    M['leaves'] = foliage_mat()
    # машины
    M['glass'] = principled('car_glass', (0.012, 0.016, 0.02), 0.03)
    M['glass'].node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 0.8
    M['black'] = principled('black_plastic', (0.02, 0.02, 0.022), 0.55)
    M['tire'] = principled('tire', (0.025, 0.025, 0.025), 0.85)
    M['rim'] = principled('rim', (0.7, 0.71, 0.73), 0.22, 1.0)
    M['headlight'] = principled('headlight', (0.55, 0.58, 0.62), 0.08, metal=0.6, emit=(1, 0.97, 0.9), emit_strength=0.35)
    M['taillight'] = principled('taillight', (0.6, 0.02, 0.02), 0.2, emit=(1, 0.05, 0.03), emit_strength=3.0)
    M['plate'] = principled('plate', (0.85, 0.85, 0.8), 0.4)
    M['shard'] = principled('shard', (0.75, 0.85, 0.85), 0.02)
    M['shard'].node_tree.nodes['Principled BSDF'].inputs['Specular IOR Level'].default_value = 1.0
    M['spark'] = emissive('spark', (1.0, 0.55, 0.15), 40.0)
    M['dirt'] = principled('dirt', (0.16, 0.11, 0.07), 0.95)
    M['clump'] = principled('clump', (0.12, 0.2, 0.05), 0.9)
    M['dust'] = dust_mat()
    M['hl_yellow'] = emissive('hl_yellow', (1.0, 0.78, 0.08), 6.0)
    M['hl_fill'] = hl_fill_mat()
    M['hl_red'] = emissive('hl_red', (1.0, 0.0, 0.0), 2.2)
    M['hl_green'] = emissive('hl_green', (0.15, 1.0, 0.45), 4.0)
    return M


def foliage_mat():
    m = principled('leaves', (0.1, 0.25, 0.05), 0.8)
    nt = m.node_tree
    oi = nt.nodes.new('ShaderNodeObjectInfo')
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    ramp.color_ramp.elements[0].color = (0.07, 0.2, 0.04, 1)
    ramp.color_ramp.elements[1].color = (0.2, 0.33, 0.07, 1)
    nt.links.new(oi.outputs['Random'], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], nt.nodes['Principled BSDF'].inputs['Base Color'])
    nt.nodes['Principled BSDF'].inputs['Subsurface Weight'].default_value = 0.0
    return m


def dust_mat():
    m = bpy.data.materials.new('dust')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    v = nt.nodes.new('ShaderNodeVolumePrincipled')
    v.inputs['Color'].default_value = (0.55, 0.5, 0.42, 1)
    v.inputs['Density'].default_value = 0.0
    nt.links.new(v.outputs[0], nt.nodes['Material Output'].inputs['Volume'])
    return m


def hl_fill_mat():
    """Полупрозрачная жёлтая заливка сечения разделителя."""
    m = bpy.data.materials.new('hl_fill')
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.remove(nt.nodes['Principled BSDF'])
    e = nt.nodes.new('ShaderNodeEmission')
    e.inputs['Color'].default_value = (1.0, 0.75, 0.05, 1)
    e.inputs['Strength'].default_value = 2.0
    t = nt.nodes.new('ShaderNodeBsdfTransparent')
    mix = nt.nodes.new('ShaderNodeMixShader')
    mix.inputs['Fac'].default_value = 0.45
    nt.links.new(t.outputs[0], mix.inputs[1])
    nt.links.new(e.outputs[0], mix.inputs[2])
    nt.links.new(mix.outputs[0], nt.nodes['Material Output'].inputs['Surface'])
    return m


# ---------------------------------------------------------------- геометрия окружения

def mesh_obj(name, verts, faces, mat=None, c=None, smooth=False):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    me.update()
    o = bpy.data.objects.new(name, me)
    if mat:
        me.materials.append(mat)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    (c or bpy.context.scene.collection).objects.link(o)
    return o


def plane(name, x0, x1, y0, y1, z, mat, c, nx=1, ny=1, zfun=None):
    verts, faces = [], []
    for j in range(ny + 1):
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx
            y = y0 + (y1 - y0) * j / ny
            verts.append((x, y, z + (zfun(x, y) if zfun else 0)))
    for j in range(ny):
        for i in range(nx):
            a = j * (nx + 1) + i
            faces.append((a, a + 1, a + nx + 2, a + nx + 1))
    return mesh_obj(name, verts, faces, mat, c, smooth=zfun is not None)


def extrude_profile(name, half_profile, y0, y1, mat, c, gap=0.02, seg=6.1):
    """Сегменты разделителя: полупрофиль зеркалится по X и выдавливается вдоль Y кусками по seg м."""
    prof = [(x, z) for x, z in half_profile] + [(-x, z) for x, z in reversed(half_profile)]
    n = len(prof)
    verts, faces = [], []
    y = y0
    while y < y1:
        ya, yb = y, min(y + seg - gap, y1)
        base = len(verts)
        verts += [(x, ya, z) for x, z in prof] + [(x, yb, z) for x, z in prof]
        for k in range(n - 1):
            faces.append((base + k, base + k + 1, base + n + k + 1, base + n + k))
        faces.append((base + n - 1, base, base + n, base + 2 * n - 1))     # низ (закрывает контур)
        faces.append(tuple(base + k for k in reversed(range(n))))           # торцы
        faces.append(tuple(base + n + k for k in range(n)))
        y += seg
    o = mesh_obj(name, verts, faces, mat, c)
    bev = o.modifiers.new('bevel', 'BEVEL')
    bev.width = 0.012
    bev.segments = 2
    bev.limit_method = 'ANGLE'
    return o


def lane_marks(name, xs_solid, xs_dash, mat_solid_by_x, c, y0=-ROAD_LEN / 2, y1=ROAD_LEN / 2):
    verts, faces = [], []

    def rect(x, ya, yb, w=0.15):
        b = len(verts)
        verts.extend([(x - w / 2, ya, 0.004), (x + w / 2, ya, 0.004), (x + w / 2, yb, 0.004), (x - w / 2, yb, 0.004)])
        faces.append((b, b + 1, b + 2, b + 3))
        return len(faces) - 1

    mat_of_face = []
    for x in xs_solid:
        rect(x, y0, y1)
        mat_of_face.append(mat_solid_by_x(x))
    for x in xs_dash:
        y = y0
        while y < y1:
            rect(x, y, y + 3.05)
            mat_of_face.append('white')
            y += 12.2
    o = mesh_obj(name, verts, faces, None, c)
    o.data.materials.append(M['white_line'])
    o.data.materials.append(M['yellow_line'])
    for p, k in zip(o.data.polygons, mat_of_face):
        p.material_index = 0 if k == 'white' else 1
    return o


def tree_variants():
    """Несколько деревьев-«облаков»: ствол + 2–3 смятые сферы. Коллекции не привязаны к сцене —
    рендерятся только их экземпляры."""
    out = []
    rnd = random.Random(3)
    for v in range(4):
        tc = bpy.data.collections.new(f'tree_v{v}')
        h = rnd.uniform(5, 9)
        bpy.ops.mesh.primitive_cylinder_add(radius=0.18, depth=h * 0.6, location=(0, 0, h * 0.3), vertices=10)
        t = bpy.context.object
        t.data.materials.append(M['trunk'])
        for blob in range(3):
            r = rnd.uniform(1.6, 2.6)
            bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=r,
                                                  location=(rnd.uniform(-0.8, 0.8), rnd.uniform(-0.8, 0.8), h * 0.6 + rnd.uniform(0, 1.8)))
            b = bpy.context.object
            d = b.modifiers.new('d', 'DISPLACE')
            tx = bpy.data.textures.new(f'tn{v}{blob}', 'CLOUDS')
            tx.noise_scale = 0.9
            d.texture = tx
            d.strength = 0.9
            b.data.materials.append(M['leaves'])
            bpy.ops.object.shade_smooth()
            for o in (b,):
                bpy.context.scene.collection.objects.unlink(o)
                tc.objects.link(o)
        bpy.context.scene.collection.objects.unlink(t)
        tc.objects.link(t)
        out.append(tc)
    return out


def scatter_trees(name, variants, c, regions, n, seed):
    rnd = random.Random(seed)
    for i in range(n):
        x0, x1, y0, y1 = regions[i % len(regions)]
        o = bpy.data.objects.new(f'{name}{i}', None)
        o.instance_type = 'COLLECTION'
        o.instance_collection = rnd.choice(variants)
        o.location = (rnd.uniform(x0, x1), rnd.uniform(y0, y1), 0)
        o.rotation_euler = (0, 0, rnd.uniform(0, 6.28))
        s = rnd.uniform(0.8, 1.35)
        o.scale = (s, s, s * rnd.uniform(0.9, 1.2))
        c.objects.link(o)


def light_poles(c, xs=(0.0,), step=70.0):
    for y in range(-245, 421, int(step)):          # столбы при y = ±35, ±105… — подальше от мест съёмки
        for x in xs:
            bpy.ops.mesh.primitive_cylinder_add(radius=0.11, depth=11, location=(x, y, J_TOP + 5.5), vertices=12)
            p = bpy.context.object
            p.data.materials.append(M['steel'])
            for sgn in (-1, 1):
                bpy.ops.mesh.primitive_cube_add(location=(x + sgn * 1.4, y, J_TOP + 10.9))
                a = bpy.context.object
                a.scale = (1.4, 0.06, 0.05)
                a.data.materials.append(M['steel'])
                bpy.ops.mesh.primitive_cube_add(location=(x + sgn * 2.7, y, J_TOP + 10.8))
                lmp = bpy.context.object
                lmp.scale = (0.35, 0.18, 0.07)
                lmp.data.materials.append(M['steel'])
                for o in (a, lmp):
                    bpy.context.scene.collection.objects.unlink(o)
                    c.objects.link(o)
            bpy.context.scene.collection.objects.unlink(p)
            c.objects.link(p)


def build_environment():
    variants = tree_variants()
    L = ROAD_LEN / 2

    # --- раскладка с разделителем
    hb = coll('HwyBarrier')
    plane('B_ground', -1500, 1500, -1500, 1500, -0.03, M['grass'], hb, 8, 8)
    plane('B_road', -B_ROAD, B_ROAD, -L, L, 0.0, M['asphalt'], hb, 2, 60)
    for sgn in (-1, 1):
        plane(f'B_gravel{sgn}', min(sgn * B_ROAD, sgn * (B_ROAD + 1.2)), max(sgn * B_ROAD, sgn * (B_ROAD + 1.2)),
              -L, L, -0.01, M['gravel'], hb, 1, 60)
    lane_marks('B_marks', [B_INNER, -B_INNER, B_EDGE, -B_EDGE], [B_INNER + LANE_W, -B_INNER - LANE_W],
               lambda x: 'yellow' if abs(x) < B_INNER + 0.1 else 'white', hb)
    jersey = extrude_profile('jersey', JERSEY_PROFILE, -L, L, M['concrete'], hb)
    light_poles(hb)
    scatter_trees('B_tree', variants, hb, [(B_ROAD + 6, 90, -300, 400), (-90, -B_ROAD - 6, -300, 400)], 300, 11)

    wl = coll('Wall')
    wall = extrude_profile('flat_wall', WALL_PROFILE, -L, L, M['wall'], wl)

    # --- раскладка с травяной разделительной полосой
    hg = coll('HwyGrass')
    # земля по бокам; середина открыта — там канава разделительной полосы ниже уровня земли
    plane('G_groundL', -1500, -G_MED, -1500, 1500, -0.03, M['grass'], hg, 8, 8)
    plane('G_groundR', G_MED, 1500, -1500, 1500, -0.03, M['grass'], hg, 8, 8)
    plane('G_groundF', -G_MED, G_MED, L, 1500, -0.03, M['grass'], hg, 2, 4)
    plane('G_groundB', -G_MED, G_MED, -1500, -L, -0.03, M['grass'], hg, 2, 4)
    plane('G_median', -G_MED, G_MED, -L, L, -0.02, M['grass'], hg, 28, 300, zfun=lambda x, y: median_z(x))
    for sgn in (-1, 1):
        x0, x1 = sorted((sgn * G_MED, sgn * G_ROAD))
        plane(f'G_road{sgn}', x0, x1, -L, L, 0.0, M['asphalt'], hg, 2, 60)
    lane_marks('G_marks', [G_INNER, -G_INNER, G_EDGE, -G_EDGE], [G_INNER + LANE_W, -G_INNER - LANE_W],
               lambda x: 'yellow' if abs(x) < G_INNER + 0.1 else 'white', hg)
    scatter_trees('G_tree', variants, hg, [(G_ROAD + 6, 90, -300, 400), (-90, -G_ROAD - 6, -300, 400)], 300, 12)
    # пара деревьев в самой разделительной полосе — далеко от места аварии
    scatter_trees('G_medtree', variants, hg, [(-3, 3, 40, 300), (-3, 3, -300, -60)], 14, 13)
    return dict(jersey=jersey, wall=wall)


def build_world(strength=1.0, rot_deg=0.0):
    w = bpy.data.worlds.new('sky')
    bpy.context.scene.world = w
    w.use_nodes = True
    nt = w.node_tree
    bg = nt.nodes['Background']
    env = nt.nodes.new('ShaderNodeTexEnvironment')
    env.image = bpy.data.images.load(os.path.join(ASSETS, 'sky.hdr'))
    tc = nt.nodes.new('ShaderNodeTexCoord')
    mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Rotation'].default_value = (0, 0, math.radians(rot_deg))
    nt.links.new(tc.outputs['Generated'], mp.inputs['Vector'])
    nt.links.new(mp.outputs['Vector'], env.inputs['Vector'])
    nt.links.new(env.outputs['Color'], bg.inputs['Color'])
    bg.inputs['Strength'].default_value = strength
    return w


# ---------------------------------------------------------------- машины

def loft(name, stations, n=28, expo=3.4):
    """Тело вращения по сечениям-суперэллипсам. stations: (y, z низ, z верх, полуширина внизу, вверху)."""
    verts, faces = [], []
    for (y, zb, zt, hwb, hwt) in stations:
        for k in range(n):
            th = 2 * math.pi * k / n
            c, s = math.cos(th), math.sin(th)
            sx = math.copysign(abs(c) ** (2 / expo), c)
            sz = math.copysign(abs(s) ** (2 / expo), s)
            f = (sz + 1) / 2
            hw = hwb + (hwt - hwb) * f
            verts.append((sx * hw, y, (zb + zt) / 2 + sz * (zt - zb) / 2))
    m = len(stations)
    for i in range(m - 1):
        for k in range(n):
            a, b = i * n + k, i * n + (k + 1) % n
            faces.append((a, (i + 1) * n + k, (i + 1) * n + (k + 1) % n, b))
    for idx, st in ((0, stations[0]), (m - 1, stations[-1])):
        ci = len(verts)
        verts.append((0, st[0], (st[1] + st[2]) / 2))
        for k in range(n):
            a, b = idx * n + k, idx * n + (k + 1) % n
            faces.append((a, b, ci) if idx == 0 else (b, a, ci))
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    o = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(o)
    return o


def apply_mods(o):
    bpy.ops.object.select_all(action='DESELECT')
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    for md in list(o.modifiers):
        bpy.ops.object.modifier_apply(modifier=md.name)


VEH = {
    'sedan': dict(
        body=[(-2.40, 0.42, 0.78, 0.70, 0.66), (-2.34, 0.33, 0.93, 0.86, 0.82), (-2.20, 0.29, 0.99, 0.905, 0.87),
              (-1.80, 0.28, 1.01, 0.92, 0.885), (-1.20, 0.27, 1.01, 0.925, 0.89), (-0.40, 0.26, 0.99, 0.925, 0.89),
              (0.40, 0.26, 0.97, 0.925, 0.89), (1.00, 0.27, 0.93, 0.92, 0.88), (1.60, 0.28, 0.88, 0.91, 0.87),
              (2.05, 0.30, 0.82, 0.89, 0.84), (2.30, 0.33, 0.74, 0.84, 0.78), (2.42, 0.40, 0.64, 0.72, 0.64),
              (2.46, 0.46, 0.56, 0.55, 0.48)],
        cabin=[(-1.25, 0.93, 0.99, 0.84, 0.82), (-1.00, 0.93, 1.17, 0.86, 0.76), (-0.70, 0.93, 1.36, 0.87, 0.70),
               (-0.40, 0.93, 1.44, 0.87, 0.68), (0.00, 0.93, 1.45, 0.87, 0.68), (0.30, 0.93, 1.41, 0.87, 0.70),
               (0.60, 0.93, 1.24, 0.87, 0.75), (0.90, 0.93, 1.02, 0.86, 0.82), (1.00, 0.93, 0.96, 0.85, 0.83)],
        roof_z=1.37, wheel_r=0.34, wheel_w=0.23, wb=2.80, track=1.58, front=2.46, rear=-2.40,
        head_z=0.72, tail_z=0.86, mirror=(0.98, 0.62, 1.03)),
    'suv': dict(
        body=[(-2.45, 0.50, 1.00, 0.80, 0.76), (-2.40, 0.40, 1.10, 0.93, 0.90), (-2.20, 0.38, 1.15, 0.96, 0.93),
              (-1.20, 0.37, 1.16, 0.975, 0.945), (0.40, 0.37, 1.15, 0.975, 0.945), (1.20, 0.38, 1.12, 0.97, 0.94),
              (1.80, 0.39, 1.08, 0.96, 0.93), (2.20, 0.41, 1.02, 0.93, 0.89), (2.42, 0.46, 0.94, 0.86, 0.82),
              (2.50, 0.55, 0.84, 0.72, 0.68)],
        cabin=[(-2.35, 1.08, 1.15, 0.90, 0.88), (-2.25, 1.08, 1.70, 0.92, 0.80), (-1.60, 1.08, 1.84, 0.93, 0.78),
               (0.20, 1.08, 1.85, 0.93, 0.78), (0.70, 1.08, 1.78, 0.93, 0.80), (1.15, 1.08, 1.36, 0.93, 0.88),
               (1.30, 1.08, 1.14, 0.92, 0.90)],
        roof_z=1.74, wheel_r=0.40, wheel_w=0.26, wb=2.90, track=1.66, front=2.50, rear=-2.45,
        head_z=0.86, tail_z=1.02, mirror=(1.04, 0.95, 1.22)),
}

_wheel_cache = {}


def wheel_meshes(kind):
    """Общие меши колёс для всех машин одного типа: шина, диск, тёмные окна между спицами."""
    if kind in _wheel_cache:
        return _wheel_cache[kind]
    P = VEH[kind]
    r, w = P['wheel_r'], P['wheel_w']
    bpy.ops.mesh.primitive_cylinder_add(radius=r, depth=w, vertices=40, rotation=(0, math.pi / 2, 0))
    t = bpy.context.object
    bev = t.modifiers.new('b', 'BEVEL')
    bev.width = 0.06
    bev.segments = 5
    t.data.materials.append(M['tire'])
    apply_mods(t)
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
    bpy.ops.mesh.primitive_cylinder_add(radius=r * 0.64, depth=w + 0.012, vertices=40, rotation=(0, math.pi / 2, 0))
    rim = bpy.context.object
    rim.data.materials.append(M['rim'])
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=False)
    bm = bmesh.new()
    for k in range(5):
        a = 2 * math.pi * k / 5
        bmesh.ops.create_cone(bm, cap_ends=True, segments=16, radius1=r * 0.17, radius2=r * 0.17, depth=w + 0.03,
                              matrix=Matrix.Translation((0, math.cos(a) * r * 0.37, math.sin(a) * r * 0.37)) @ Matrix.Rotation(math.pi / 2, 4, 'Y'))
    holes = bpy.data.meshes.new(f'holes_{kind}')
    bm.to_mesh(holes)
    bm.free()
    holes.materials.append(M['black'])
    data = (t.data, rim.data, holes)
    for o in (t, rim):
        bpy.data.objects.remove(o)
    _wheel_cache[kind] = data
    return data


def build_vehicle(name, kind, paint_rgb, c, crush=()):
    """Машина: корневой Empty (точка на земле под центром), кузов, стёкла, свет, 4 колеса-Empty.
    crush: список (имя формы, центр, радиус, направление, глубина) — формы смятия кузова."""
    P = VEH[kind]
    paint = principled(f'paint_{name}', paint_rgb, 0.32, 0.35, coat=1.0)
    root = bpy.data.objects.new(name, None)
    c.objects.link(root)

    body = loft(f'{name}_body', P['body'], n=28, expo=3.2)
    sub = body.modifiers.new('s', 'SUBSURF')
    sub.levels = 2
    body.data.materials.append(paint)
    body.data.materials.append(M['black'])
    apply_mods(body)
    # колёсные арки
    for sy in (1, -1):
        bpy.ops.mesh.primitive_cylinder_add(radius=P['wheel_r'] + 0.07, depth=2.6, vertices=40,
                                            location=(0, sy * P['wb'] / 2, P['wheel_r']), rotation=(0, math.pi / 2, 0))
        cut = bpy.context.object
        cut.data.materials.append(M['black'])
        bo = body.modifiers.new('arch', 'BOOLEAN')
        bo.object = cut
        bo.operation = 'DIFFERENCE'
        bo.solver = 'EXACT'
        bo.material_mode = 'TRANSFER'
        apply_mods(body)
        bpy.data.objects.remove(cut)
    # нижняя чёрная полоса бамперов/порогов
    for p in body.data.polygons:
        if p.center.z < P['body'][3][1] + 0.12:
            p.material_index = 1
        p.use_smooth = True

    cabin = loft(f'{name}_cabin', P['cabin'], n=24, expo=3.0)
    sub = cabin.modifiers.new('s', 'SUBSURF')
    sub.levels = 2
    cabin.data.materials.append(M['glass'])
    cabin.data.materials.append(paint)
    apply_mods(cabin)
    for p in cabin.data.polygons:
        p.use_smooth = True
        if p.center.z > P['roof_z']:
            p.material_index = 1

    parts = [body, cabin]
    fz, rz = P['head_z'], P['tail_z']
    for sx in (-1, 1):
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=24, ring_count=12,
                                             location=(sx * 0.62, P['front'] - 0.14, fz))
        hl = bpy.context.object
        hl.scale = (0.16, 0.06, 0.042)
        hl.data.materials.append(M['headlight'])
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=24, ring_count=12,
                                             location=(sx * 0.64, P['rear'] + 0.06, rz))
        tl = bpy.context.object
        tl.scale = (0.24, 0.05, 0.06)
        tl.data.materials.append(M['taillight'])
        bpy.ops.mesh.primitive_cube_add(location=(sx * P['mirror'][0], P['mirror'][1], P['mirror'][2]))
        mi = bpy.context.object
        mi.scale = (0.07, 0.045, 0.045)
        mi.data.materials.append(M['black'])
        parts += [hl, tl, mi]
    bpy.ops.mesh.primitive_cube_add(location=(0, P['front'] - 0.02, fz - 0.2))
    gr = bpy.context.object
    gr.scale = (0.34, 0.04, 0.055)
    gr.data.materials.append(M['black'])
    bpy.ops.mesh.primitive_cube_add(location=(0, P['rear'] - 0.01, rz - 0.24))
    pl = bpy.context.object
    pl.scale = (0.26, 0.01, 0.07)
    pl.data.materials.append(M['plate'])
    parts += [gr, pl]
    for o in parts:
        for cc in o.users_collection:
            cc.objects.unlink(o)
        c.objects.link(o)
        o.parent = root

    # формы смятия
    if crush:
        body.shape_key_add(name='Basis', from_mix=False)
        cabin.shape_key_add(name='Basis', from_mix=False)
        for (key, center, radius, direction, depth) in crush:
            for ob, k in ((body, 1.0), (cabin, 0.6)):
                sk = ob.shape_key_add(name=key, from_mix=False)
                cv, dv = Vector(center), Vector(direction).normalized()
                for i, v in enumerate(ob.data.vertices):
                    d = (Vector((v.co.x, v.co.y, v.co.z * 0.6)) - Vector((cv.x, cv.y, cv.z * 0.6))).length
                    if d < radius:
                        f = (1 - d / radius) ** 1.6
                        nz = noise.noise(v.co * 7.0) * 0.5 + noise.noise(v.co * 19.0) * 0.25
                        sk.data[i].co = v.co + dv * depth * k * f * (1 + nz) + Vector((0, 0, depth * 0.25 * f * nz))
                sk.value = 0.0          # в Blender 5 новая форма включена сразу

    tire_me, rim_me, holes_me = wheel_meshes(kind)
    wheels = {}
    for sx, lr in ((-1, 'L'), (1, 'R')):
        for sy, fr in ((1, 'F'), (-1, 'R')):
            we = bpy.data.objects.new(f'{name}_wheel_{fr}{lr}', None)
            c.objects.link(we)
            we.parent = root
            we.location = (sx * P['track'] / 2, sy * P['wb'] / 2, P['wheel_r'])
            spin = bpy.data.objects.new(f'{name}_spin_{fr}{lr}', None)
            c.objects.link(spin)
            spin.parent = we
            for me, nm in ((tire_me, 'tire'), (rim_me, 'rim'), (holes_me, 'holes')):
                o = bpy.data.objects.new(f'{name}_{nm}_{fr}{lr}', me)
                c.objects.link(o)
                o.parent = spin
                if nm != 'tire':
                    o.location.x = sx * 0.004        # диск чуть наружу
            wheels[fr + lr] = (we, spin)
    root['kind'] = kind
    return dict(root=root, body=body, cabin=cabin, wheels=wheels, P=P, paint=paint)


def loose_wheel(name, kind, c):
    """Отдельное колесо для отрыва при аварии."""
    tire_me, rim_me, holes_me = wheel_meshes(kind)
    root = bpy.data.objects.new(name, None)
    c.objects.link(root)
    for me, nm in ((tire_me, 'tire'), (rim_me, 'rim'), (holes_me, 'holes')):
        o = bpy.data.objects.new(f'{name}_{nm}', me)
        c.objects.link(o)
        o.parent = root
    return root


# ---------------------------------------------------------------- частицы

def shard_meshes():
    rnd = random.Random(5)
    out = []
    for v in range(6):
        bm = bmesh.new()
        pts = [Vector((rnd.uniform(-1, 1), rnd.uniform(-1, 1), 0)) for _ in range(3)]
        top = [bm.verts.new((p.x, p.y, 0.08)) for p in pts]
        bot = [bm.verts.new((p.x, p.y, -0.08)) for p in pts]
        bm.faces.new(top)
        bm.faces.new(list(reversed(bot)))
        for i in range(3):
            j = (i + 1) % 3
            bm.faces.new((top[i], top[j], bot[j], bot[i]))
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
        me = bpy.data.meshes.new(f'shard{v}')
        bm.to_mesh(me)
        bm.free()
        out.append(me)
    return out


def chunk_meshes():
    rnd = random.Random(6)
    out = []
    for v in range(5):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=1, radius=1.0)
        for vert in bm.verts:
            vert.co = Vector((vert.co.x * rnd.uniform(0.6, 1.4), vert.co.y * rnd.uniform(0.6, 1.4), vert.co.z * rnd.uniform(0.3, 0.8)))
        me = bpy.data.meshes.new(f'chunk{v}')
        bm.to_mesh(me)
        bm.free()
        out.append(me)
    return out


def spark_mesh():
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=6, radius1=0.006, radius2=0.006, depth=0.05)
    me = bpy.data.meshes.new('spark')
    bm.to_mesh(me)
    bm.free()
    return me


def build_particles(c, n_shards=220, n_chunks=70, n_sparks=90, n_dirt=90, n_dust=6):
    """Пулы объектов-частиц; движение считается в shots.py и ставится ключами."""
    sm, cm, spm = shard_meshes(), chunk_meshes(), spark_mesh()
    pools = {'shard': [], 'chunk': [], 'spark': [], 'dirt': [], 'dust': []}
    for me in sm:
        me.materials.append(M['shard'])
    for i in range(n_shards):
        o = bpy.data.objects.new(f'shard{i}', sm[i % len(sm)])
        c.objects.link(o)
        pools['shard'].append(o)
    chunk_mats = [M['black'], M['black'], M['rim']]
    for i in range(n_chunks):
        me = cm[i % len(cm)].copy()
        me.materials.append(chunk_mats[i % len(chunk_mats)])
        o = bpy.data.objects.new(f'chunk{i}', me)
        c.objects.link(o)
        pools['chunk'].append(o)
    spm.materials.append(M['spark'])
    for i in range(n_sparks):
        o = bpy.data.objects.new(f'spark{i}', spm)
        c.objects.link(o)
        pools['spark'].append(o)
    for i in range(n_dirt):
        me = cm[i % len(cm)].copy()
        me.materials.append(M['dirt'] if i % 3 else M['clump'])
        o = bpy.data.objects.new(f'dirt{i}', me)
        c.objects.link(o)
        pools['dirt'].append(o)
    for i in range(n_dust):
        bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1.0)
        o = bpy.context.object
        o.name = f'dust{i}'
        mat = M['dust'].copy()
        o.data.materials.append(mat)
        for cc in o.users_collection:
            cc.objects.unlink(o)
        c.objects.link(o)
        pools['dust'].append(o)
    return pools


# ---------------------------------------------------------------- сборка

M = {}


def render_settings(res=(720, 1280), samples=20, fps=24):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = samples
    sc.cycles.use_adaptive_sampling = True
    sc.cycles.adaptive_threshold = 0.04
    sc.cycles.use_denoising = True
    sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    sc.cycles.max_bounces = 6
    sc.cycles.diffuse_bounces = 2
    sc.cycles.glossy_bounces = 2
    sc.cycles.transmission_bounces = 2
    sc.cycles.volume_bounces = 0
    sc.cycles.transparent_max_bounces = 6
    sc.cycles.sample_clamp_indirect = 4.0
    sc.cycles.caustics_reflective = False
    sc.cycles.caustics_refractive = False
    sc.render.use_persistent_data = True
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.fps = fps
    sc.render.use_motion_blur = True
    sc.render.motion_blur_shutter = 0.5
    sc.render.image_settings.file_format = 'JPEG'
    sc.render.image_settings.quality = 92
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except TypeError:
        pass


def build(sky_rot=0.0):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    M.update(mats())
    render_settings()
    build_world(1.0, sky_rot)
    env = build_environment()
    cars = coll('Cars')
    hero = build_vehicle('hero', 'sedan', (0.85, 0.22, 0.03), cars, crush=[
        ('headon', (-0.55, 2.6, 0.7), 1.5, (0.35, -1.0, 0.25), 0.75),
        ('wall', (-1.0, 2.2, 0.6), 1.1, (1.0, -0.45, 0.1), 0.38),
    ])
    suv = build_vehicle('suv', 'suv', (0.88, 0.88, 0.86), cars, crush=[
        ('headon', (-0.6, 2.65, 0.8), 1.5, (0.3, -1.0, 0.25), 0.6),
    ])
    traffic = []
    for i, rgb in enumerate([(0.75, 0.75, 0.78), (0.05, 0.12, 0.35), (0.02, 0.02, 0.02), (0.45, 0.03, 0.03),
                             (0.6, 0.6, 0.58), (0.15, 0.17, 0.18)]):
        kind = 'suv' if i in (2, 5) else 'sedan'
        traffic.append(build_vehicle(f'traffic{i}', kind, rgb, cars))
    fx = coll('FX')
    lw = loose_wheel('hero_loose_wheel', 'sedan', fx)
    pools = build_particles(fx)
    return dict(env=env, hero=hero, suv=suv, traffic=traffic, loose_wheel=lw, pools=pools)
