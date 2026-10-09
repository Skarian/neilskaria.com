"""Build the bedroom and the red GBA SP, bake the room's lighting with Cycles, and export for the web.

Run with Blender 2.93+ after fetch_assets.py (on an RX 590 the CPU bakes faster than OpenCL,
so pass BAKE_DEVICE=CPU there):
    blender --background --factory-startup --python assets/3d/build_scene.py -- <cache_dir> <out_dir> [samples] [atlas_px]

Writes <out_dir>/bedroom.glb (Draco-compressed), one lightmap per group and lighting state
(<group>-moon.png, <group>-lamp.png), and lightmaps.json with the scale each lightmap was encoded at.

Units: 1 Blender unit = 10 cm. The SP is real-size (about 85 x 82 x 24 mm closed).
The site code relies on object names (SP, Lid, Screen, Cartridge, PowerLed, Sky) and material names
and on each room object's `lightmap` custom property.
"""

import json
import math
import os
import random
import sys
from pathlib import Path

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Vector

sys.path.insert(0, str(Path(__file__).parent))
from helpers import bake_albedo  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1 :]
CACHE = Path(argv[0])
OUT_DIR = Path(argv[1])
SAMPLES = int(argv[2]) if len(argv) > 2 else 512
ATLAS = int(argv[3]) if len(argv) > 3 else 1024
# 'preview' renders the camera views with Cycles instead of baking, for tuning light levels.
PREVIEW = len(argv) > 4 and argv[4] == 'preview'
# Stylised-realism looks (Pixar / Alita references), chosen with the LOOK environment variable.
LOOKS = {
	# Up: soft golden light, warm and gently saturated, low contrast.
	'up': dict(detail=0.35, wall=(0.93, 0.83, 0.68), comforter=(0.05, 0.09, 0.26), curtain=(0.95, 0.7, 0.5), sun=(6.0, (1.0, 0.72, 0.45)), fill=(5500, (1.0, 0.86, 0.68)), world=(0.62, 0.52, 0.44), lamp=700, exposure=0.7, look='Medium Low Contrast'),
	# The Incredibles: a bolder mid-century palette, crisper light, punchier contrast.
	'incredibles': dict(detail=0.25, wall=(0.5, 0.7, 0.66), comforter=(0.03, 0.06, 0.22), curtain=(0.88, 0.58, 0.12), sun=(8.0, (1.0, 0.78, 0.52)), fill=(4000, (1.0, 0.92, 0.82)), world=(0.52, 0.48, 0.44), lamp=700, exposure=0.45, look='Medium High Contrast'),
	# Alita / WALL-E: cinematic, warm and low sun, richer detail, deeper contrast.
	'alita': dict(detail=0.75, wall=(0.86, 0.74, 0.6), comforter=(0.035, 0.065, 0.19), curtain=(0.62, 0.34, 0.22), sun=(9.0, (1.0, 0.56, 0.26)), fill=(2600, (1.0, 0.72, 0.46)), world=(0.42, 0.32, 0.26), lamp=900, exposure=0.25, look='High Contrast'),
}
LOOK = LOOKS[os.environ.get('LOOK', 'alita')]
# Lighting states to bake. 'day' is the base; 'lamp' (the bedside lamp alone) is optional.
# 'day' is the sun and sky; 'lamp' is the lantern alone, baked separately so the site can tint and
# dim it live.
STATES = ('day', 'lamp')

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.gravity = (0, 0, -98)  # 10 units per metre
random.seed(7)


# Helpers


def material(name, color, roughness=0.5, metallic=0.0, emission=None):
	mat = bpy.data.materials.new(name)
	mat.use_nodes = True
	bsdf = mat.node_tree.nodes['Principled BSDF']
	bsdf.inputs['Base Color'].default_value = (*color, 1)
	bsdf.inputs['Roughness'].default_value = roughness
	bsdf.inputs['Metallic'].default_value = metallic
	if emission:
		bsdf.inputs['Emission'].default_value = (*emission, 1)
		bsdf.inputs['Emission Strength'].default_value = 1.0
	return mat


def tinted(texture, tint):
	"""Recolour a texture once and cache it, so the exported texture already carries the colour.
	The texture keeps some of its detail (the look's `detail`) and averages out to the tint colour."""
	source = CACHE / 'textures' / texture / 'diff.jpg'
	detail = LOOK['detail']
	if tint == (1, 1, 1) and detail == 1:
		return source
	out = source.with_name('recolour_' + ''.join(f'{round(c * 255):02x}' for c in tint) + f'_{round(detail * 100)}.jpg')
	if not out.exists():
		img = bpy.data.images.load(str(source))
		px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
		lum = px[:, :3] @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
		if tint == (1, 1, 1):
			# Keep the texture's own colour, just soften its detail.
			mean = px[:, :3].mean(axis=0)
			px[:, :3] = np.clip(mean + (px[:, :3] - mean) * detail, 0, 1)
		else:
			relative = 1 + (lum / lum.mean() - 1) * detail
			px[:, :3] = np.clip(relative[:, None] * np.array(tint, dtype=np.float32), 0, 1)
		img.pixels = px.ravel()
		img.filepath_raw = str(out)
		img.file_format = 'JPEG'
		img.save()
		bpy.data.images.remove(img)
	return out


def textured(name, texture, tint=(1, 1, 1), translucent=0.0):
	"""A Principled material from a Poly Haven texture set (colour, OpenGL normal, roughness)."""
	mat = bpy.data.materials.new(name)
	mat.use_nodes = True
	nodes, links = mat.node_tree.nodes, mat.node_tree.links
	bsdf = nodes['Principled BSDF']
	folder = CACHE / 'textures' / texture

	def image(path, colour):
		node = nodes.new('ShaderNodeTexImage')
		node.image = bpy.data.images.load(str(path), check_existing=True)
		if not colour:
			node.image.colorspace_settings.name = 'Non-Color'
		return node

	links.new(image(tinted(texture, tint), True).outputs['Color'], bsdf.inputs['Base Color'])
	links.new(image(folder / 'rough.jpg', False).outputs['Color'], bsdf.inputs['Roughness'])
	normal = nodes.new('ShaderNodeNormalMap')
	normal.inputs['Strength'].default_value = 0.6
	links.new(image(folder / 'nor.jpg', False).outputs['Color'], normal.inputs['Color'])
	links.new(normal.outputs['Normal'], bsdf.inputs['Normal'])
	if translucent:
		# Lets the lamp glow through its shade in the bake.
		bsdf.inputs['Transmission'].default_value = translucent
		bsdf.inputs['Transmission Roughness'].default_value = 1.0
	return mat


def finish(obj, name, mat, bevel=0.0, segments=4, parent=None):
	obj.name = name
	obj.data.name = name
	if mat:
		obj.data.materials.append(mat)
	if bevel > 0:
		mod = obj.modifiers.new('bevel', 'BEVEL')
		mod.width = bevel
		mod.segments = segments
		mod.limit_method = 'NONE'
	for poly in obj.data.polygons:
		poly.use_smooth = True
	obj.data.use_auto_smooth = True
	obj.data.auto_smooth_angle = math.radians(40)
	if parent:
		set_parent(obj, parent)
	return obj


def set_parent(obj, parent):
	world = obj.matrix_world.copy()
	obj.parent = parent
	obj.matrix_world = world


def box(name, size, loc, mat, bevel=0.0, segments=4, parent=None):
	bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
	obj = bpy.context.active_object
	obj.scale = size
	bpy.ops.object.transform_apply(scale=True)
	return finish(obj, name, mat, bevel, segments, parent)


def cylinder(name, radius, depth, loc, mat, rot=(0, 0, 0), bevel=0.0, parent=None, verts=40):
	bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
	return finish(bpy.context.active_object, name, mat, bevel, 3, parent)


def lathe(name, profile, loc, mat, steps=48, cap=True):
	"""Spin a (radius, height) profile around Z."""
	mesh = bpy.data.meshes.new(name)
	bm = bmesh.new()
	rings = []
	for i in range(steps):
		a = 2 * math.pi * i / steps
		rings.append([bm.verts.new((r * math.cos(a), r * math.sin(a), z)) for r, z in profile])
	for i in range(steps):
		ring, nxt = rings[i], rings[(i + 1) % steps]
		for j in range(len(profile) - 1):
			bm.faces.new((ring[j], nxt[j], nxt[j + 1], ring[j + 1]))
	if cap:
		bm.faces.new([ring[-1] for ring in rings])
	bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
	bm.to_mesh(mesh)
	bm.free()
	obj = bpy.data.objects.new(name, mesh)
	obj.location = loc
	scene.collection.objects.link(obj)
	finish(obj, name, mat)
	obj.modifiers.new('smooth', 'SUBSURF').levels = 1
	return obj


def empty(name, loc=(0, 0, 0), parent=None):
	obj = bpy.data.objects.new(name, None)
	obj.location = loc
	scene.collection.objects.link(obj)
	if parent:
		set_parent(obj, parent)
	return obj


def select(objs, active=None):
	bpy.ops.object.select_all(action='DESELECT')
	for obj in objs:
		obj.select_set(True)
	bpy.context.view_layer.objects.active = active or objs[0]


def set_origin(obj, point):
	select([obj])
	scene.cursor.location = point
	bpy.ops.object.origin_set(type='ORIGIN_CURSOR')


def apply_modifiers(obj):
	depsgraph = bpy.context.evaluated_depsgraph_get()
	mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
	obj.modifiers.clear()
	obj.data = mesh


def uv_box(obj, size):
	"""World-space box projection so tiling textures keep a consistent real-world scale."""
	bm = bmesh.new()
	bm.from_mesh(obj.data)
	uv = bm.loops.layers.uv.verify()
	m = obj.matrix_world
	for face in bm.faces:
		n = face.normal
		axis = max(range(3), key=lambda i: abs(n[i]))
		for loop in face.loops:
			co = m @ loop.vert.co
			u, v = {0: (co.y, co.z), 1: (co.x, co.z), 2: (co.x, co.y)}[axis]
			loop[uv].uv = (u / size, v / size)
	bm.to_mesh(obj.data)
	bm.free()


def import_model(asset, keep=None, scale=10.0):
	"""Import a Poly Haven glTF, join its meshes, put the origin at the bottom centre and scale to scene units."""
	before = set(bpy.data.objects)
	bpy.ops.import_scene.gltf(filepath=str(CACHE / 'models' / asset / f'{asset}.gltf'))
	new = [o for o in bpy.data.objects if o not in before]
	meshes = [o for o in new if o.type == 'MESH' and (keep is None or any(k in o.name for k in keep))]
	for o in meshes:
		world = o.matrix_world.copy()
		o.parent = None
		o.matrix_world = world
	for o in new:
		if o not in meshes:
			bpy.data.objects.remove(o)
	select(meshes)
	if len(meshes) > 1:
		bpy.ops.object.join()
	obj = bpy.context.active_object
	bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
	ground(obj, scale)
	obj.name = asset
	if len(obj.data.polygons) > 12000:
		# Keep heavy props light for the web and the bake.
		dec = obj.modifiers.new('decimate', 'DECIMATE')
		dec.ratio = 12000 / len(obj.data.polygons)
		apply_modifiers(obj)
	return obj


def ground(obj, scale=1.0):
	pts = [v.co for v in obj.data.vertices]
	lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
	hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
	centre = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
	obj.data.transform(Matrix.Scale(scale, 4) @ Matrix.Translation(-centre))


def place(obj, loc, rot_z=0.0, rot=(0, 0, 0)):
	obj.rotation_euler = (rot[0], rot[1], rot_z)
	obj.location = loc
	return obj


# The GBA SP lives in its own module so it can be previewed quickly (sp_preview.py).

sys.path.insert(0, str(Path(__file__).parent))
import gba_sp  # noqa: E402

sp = gba_sp.build()['sp']


# Room. The nightstand top sits just under the SP; the floor is 70 cm below it.

TOP = -gba_sp.BASE_H * gba_sp.U - 0.0005
FLOOR = TOP - 7.0
groups = {'props': [], 'bed': [], 'room': [], 'foliage': []}
bake_only = []


def add(group, obj):
	groups[group].append(obj)
	return obj


white_paint = material('WhitePaint', (0.86, 0.85, 0.84), roughness=0.5)
brass = material('Brass', (0.8, 0.6, 0.35), roughness=0.3, metallic=1.0)

# Furniture and props on the nightstand.
import props  # noqa: E402

# A mid-century oak nightstand; its top is the stage for everything else.
oak = textured('Oak', 'oak_veneer_01', tint=(0.6, 0.4, 0.22))
woodgrain = textured('ClockWoodgrain', 'american_walnut_veneer', tint=(0.2, 0.11, 0.06))
nightstand = add('props', place(props.mcm_nightstand(oak), (0, 0.3, FLOOR)))
# The personal things on the table: a clock radio, a Rubik's cube, the JOSEPH tumbler and a bonsai.

props_baked, foliage, props_unbaked = props.build(lambda obj, size: bake_albedo(obj, size, OUT_DIR), TOP, woodgrain)
for obj in props_baked:
	add('props', obj)
for obj in foliage:
	add('foliage', obj)

# A kumiko lantern stands where a lamp would; its bulb is the warm light in the bake.
lamp_x, lamp_y = 0.8, 1.15
lantern_parts, lantern_paper, lantern_light = props.kumiko_lantern()
for obj in lantern_parts + [lantern_paper]:
	obj.location = Vector((lamp_x, lamp_y, TOP)) + obj.location
for obj in lantern_parts:
	add('props', obj)

add('room', place(import_model('potted_plant_02'), (6.6, 0.2, FLOOR), rot_z=0.4))

# Bed: a mid-century oak frame on splayed legs, a white mattress, a navy quilted comforter with the
# top sheet turned down over it, and plump pillows against an oak headboard.
BED_L, BED_R = -18.6, -3.4
BED_CX = (BED_L + BED_R) / 2
BED_W = BED_R - BED_L
HEAD_Y = 2.1
FOOT_Y = HEAD_Y - 20.0
MATTRESS_TOP = FLOOR + 6.6

linen = textured('Sheet', 'rough_linen', tint=(0.95, 0.94, 0.92))
pillowcase = textured('Pillowcase', 'rough_linen', tint=(0.97, 0.96, 0.94))
duvet_mat = textured('Duvet', 'cotton_jersey' if (CACHE / 'textures' / 'cotton_jersey').exists() else 'waffle_pique_cotton', tint=LOOK['comforter'])
accent = textured('Cushion', 'velour_velvet', tint=(0.62, 0.3, 0.14))

rails = add('bed', box('BedFrame', (BED_W + 0.5, HEAD_Y - FOOT_Y + 0.3, 1.8), (BED_CX, (HEAD_Y + FOOT_Y) / 2, FLOOR + 3.9), oak, bevel=0.18, segments=4))
mattress = add('bed', box('Mattress', (BED_W - 0.1, HEAD_Y - FOOT_Y - 0.2, 2.4), (BED_CX, (HEAD_Y + FOOT_Y) / 2, MATTRESS_TOP - 1.2), linen, bevel=0.6, segments=6))
headboard = box('Headboard', (BED_W + 0.5, 0.45, 6.6), (BED_CX, HEAD_Y + 0.45, FLOOR + 6.8), oak, bevel=0.2, segments=4)
headboard.rotation_euler = (math.radians(-7), 0, 0)
add('bed', headboard)
for i, (x, y) in enumerate([(BED_L + 1.0, FOOT_Y + 1.0), (BED_R - 1.0, FOOT_Y + 1.0), (BED_L + 1.0, HEAD_Y - 1.0), (BED_R - 1.0, HEAD_Y - 1.0)]):
	sx, sy = (1 if x > BED_CX else -1), (1 if y > (HEAD_Y + FOOT_Y) / 2 else -1)
	add('room', props.tapered_leg(f'BedLeg{i}', (x, y, FLOOR + 3.1), (x + sx * 0.25, y + sy * 0.25, FLOOR), 0.3, 0.17, oak))


def bend(d, radius):
	"""How far a cloth runs outwards and drops after travelling d past a mattress edge: it rolls over
	a rounded edge of the given radius, then hangs straight down."""
	if d <= 0:
		return 0.0, 0.0
	arc = math.pi / 2 * radius
	if d < arc:
		return radius * math.sin(d / radius), radius * (1 - math.cos(d / radius))
	return radius, radius + d - arc


def drape(name, x0, x1, y0, y1, top, mat, res=(80, 80), radius=0.9, folds=0.12):
	"""A cloth lying over the mattress (whose edges are BED_L/BED_R and FOOT_Y), shaped directly:
	flat on top, rolling over the edges, hanging down the sides and foot in soft folds."""
	bpy.ops.mesh.primitive_grid_add(x_subdivisions=res[0], y_subdivisions=res[1], size=1, location=((x0 + x1) / 2, (y0 + y1) / 2, top))
	cloth = bpy.context.active_object
	cloth.scale = (x1 - x0, y1 - y0, 1)
	bpy.ops.object.transform_apply(scale=True)
	half = BED_W / 2 - 0.05
	for v in cloth.data.vertices:
		x, y = v.co.x, v.co.y
		side = 1 if x > BED_CX else -1
		ox, dz_side = bend(abs(x - BED_CX) - half, radius)
		oy, dz_foot = bend((FOOT_Y + 0.1) - y, radius)
		if ox:
			x = BED_CX + side * (half + ox)
		if oy:
			y = FOOT_Y + 0.1 - oy
		drop = max(dz_side, dz_foot)
		hang = max(0.0, drop - radius)
		# Folds deepen as the cloth hangs.
		wave = folds * hang * math.sin(v.co.y * 1.9 + v.co.x * 0.7)
		if ox:
			x += side * wave
		if oy:
			y -= folds * hang * math.sin(v.co.x * 1.7)
		v.co = Vector((x, y, top - drop + random.uniform(-0.015, 0.015)))
	cloth.data.update()
	return finish(cloth, name, mat)


# The comforter covers the bed up to below the pillows and hangs over the sides and foot.
COMFORTER_TOP = HEAD_Y - 6.0
comforter = drape('Duvet', BED_L - 3.6, BED_R + 3.6, FOOT_Y - 3.4, COMFORTER_TOP, MATTRESS_TOP + 0.1, duvet_mat)
# Quilting: soft puffs between stitch lines, pushed out along the surface.
mesh = comforter.data
QUILT = 3.0
for v in mesh.vertices:
	u, w = (v.co.x - BED_CX) / QUILT, v.co.y / QUILT
	puff = abs(math.sin(math.pi * u) * math.sin(math.pi * w)) ** 0.8
	v.co += v.normal * (0.06 + 0.42 * puff)
for loop in mesh.uv_layers[0].data:
	loop.uv = (loop.uv.x * (BED_W + 7.2) / 6, loop.uv.y * (COMFORTER_TOP - FOOT_Y + 3.4) / 6)
thick = comforter.modifiers.new('thickness', 'SOLIDIFY')
thick.thickness = 0.45
thick.offset = -1
comforter.modifiers.new('smooth', 'SUBSURF').levels = 1
apply_modifiers(comforter)
add('bed', comforter)

# The top sheet, turned down over the comforter's top edge in a crisp white band.
band = drape('SheetFold', BED_L - 3.9, BED_R + 3.9, COMFORTER_TOP - 2.7, COMFORTER_TOP + 0.25, MATTRESS_TOP + 0.62, linen, res=(80, 14), radius=1.1, folds=0.06)
band.modifiers.new('thickness', 'SOLIDIFY').thickness = 0.06
band.modifiers.new('smooth', 'SUBSURF').levels = 1
add('bed', band)

# Two plump pillows leaning on the headboard, and a rust cushion in front.
for i, x in enumerate([BED_CX - 3.6, BED_CX + 3.6]):
	pillow = box(f'Pillow{i}', (6.8, 4.6, 1.5), (x, HEAD_Y - 1.7, MATTRESS_TOP + 1.9), pillowcase, bevel=0.55, segments=3)
	bulge = pillow.modifiers.new('bulge', 'CAST')
	bulge.factor = 0.35
	bulge.use_z = True
	bulge.use_x = bulge.use_y = False
	pillow.modifiers.new('round', 'SUBSURF').levels = 2
	tex = bpy.data.textures.new(f'PillowNoise{i}', 'CLOUDS')
	tex.noise_scale = 2.0
	disp = pillow.modifiers.new('lumps', 'DISPLACE')
	disp.texture = tex
	disp.strength = 0.22
	pillow.rotation_euler = (math.radians(58), 0, math.radians(2 - 4 * i))
	add('bed', pillow)
cushion = box('Cushion', (4.6, 3.2, 1.1), (BED_CX + 1.2, HEAD_Y - 3.6, MATTRESS_TOP + 1.3), accent, bevel=0.4, segments=3)
cushion.modifiers.new('round', 'SUBSURF').levels = 2
cushion.rotation_euler = (math.radians(66), 0, math.radians(-8))
add('bed', cushion)

# Rug, floor, skirting and walls. The window above the bed lets moonlight in.
rug = add('room', box('Rug', (16, 10, 0.12), (BED_CX + 5, FOOT_Y + 6.5, FLOOR + 0.06), textured('Rug', 'curly_teddy_natural', tint=(0.98, 0.92, 0.94)), bevel=0.05, segments=2))
floor = add('room', box('Floor', (60, 50, 0.4), (-5, -18, FLOOR - 0.2), textured('Floor', 'herringbone_parquet')))
add('room', box('Skirting', (60, 0.25, 0.9), (-5, 2.78, FLOOR + 0.45), white_paint, bevel=0.03))

WALL_Y = 2.9
WIN = (BED_CX - 5.0, BED_CX + 5.0, FLOOR + 13.5, FLOOR + 25.5)
wall_mat = textured('Wall', 'beige_wall_001', tint=LOOK['wall'])
for name, x0, x1, z0, z1 in [
	('WallLeft', -35, WIN[0], FLOOR, FLOOR + 32),
	('WallRight', WIN[1], 25, FLOOR, FLOOR + 32),
	('WallBelow', WIN[0], WIN[1], FLOOR, WIN[2]),
	('WallAbove', WIN[0], WIN[1], WIN[3], FLOOR + 32),
]:
	add('room', box(name, (x1 - x0, 0.5, z1 - z0), ((x0 + x1) / 2, WALL_Y + 0.25, (z0 + z1) / 2), wall_mat))
add('room', box('SideWall', (0.5, 50, 32), (-35.25, -18, FLOOR + 16), wall_mat))

wx, wz = (WIN[0] + WIN[1]) / 2, (WIN[2] + WIN[3]) / 2
ww, wh = WIN[1] - WIN[0], WIN[3] - WIN[2]
for name, size, loc in [
	('FrameTop', (ww + 1.2, 0.8, 0.6), (wx, WALL_Y, WIN[3] + 0.3)),
	('FrameLeft', (0.6, 0.8, wh), (WIN[0] - 0.3, WALL_Y, wz)),
	('FrameRight', (0.6, 0.8, wh), (WIN[1] + 0.3, WALL_Y, wz)),
	('Sill', (ww + 1.8, 1.4, 0.4), (wx, WALL_Y - 0.2, WIN[2] - 0.2)),
	('MullionV', (0.25, 0.3, wh), (wx, WALL_Y + 0.3, wz)),
	('MullionH', (ww, 0.3, 0.25), (wx, WALL_Y + 0.3, wz + 1.5)),
]:
	add('room', box(name, size, loc, white_paint, bevel=0.03))

# Curtains drawn open on either side of the window: gathered narrow and hung close to the wall,
# so the sunbeam that reaches the bedside table passes clear of the right-hand one.
curtain_mat = textured('Curtain', 'rough_linen', tint=LOOK['curtain'])
for i, cx in enumerate([WIN[0] - 1.0, WIN[1] + 1.0]):
	bpy.ops.mesh.primitive_grid_add(x_subdivisions=60, y_subdivisions=40, size=1, location=(cx, WALL_Y - 0.5, WIN[3] + 1.0 - 9.5), rotation=(math.radians(90), 0, 0))
	curtain = bpy.context.active_object
	curtain.scale = (2.6, 19.0, 1)
	bpy.ops.object.transform_apply(scale=True, rotation=True)
	for v in curtain.data.vertices:
		drop = (WIN[3] + 1.0 - v.co.z) / 19.0
		v.co.y += 0.3 * math.sin(v.co.x * 4.5 + i) * (0.7 + 0.5 * drop)
		v.co.x += (1 if i == 0 else -1) * 0.3 * drop * drop
	finish(curtain, f'Curtain{i}', curtain_mat)
	curtain.modifiers.new('thickness', 'SOLIDIFY').thickness = 0.06
	add('room', curtain)
add('room', cylinder('CurtainRod', 0.12, ww + 8.0, (wx, WALL_Y - 0.5, WIN[3] + 1.1), brass, rot=(0, math.radians(90), 0)))

# Night sky behind the window (unlit on the site) and a moon.
sky_img = bpy.data.images.new('SkyGradient', 8, 256)
grad = np.linspace(0, 1, 256, dtype=np.float32)[:, None]
# Golden-hour sky: amber near the horizon (bottom rows) to a dusky blue overhead.
horizon, zenith = np.array([[1.0, 0.6, 0.32]], np.float32), np.array([[0.32, 0.34, 0.58]], np.float32)
sky_px = np.concatenate([horizon + (zenith - horizon) * grad, np.ones((256, 1), np.float32)], 1)
sky_img.pixels = np.repeat(sky_px[:, None, :], 8, 1).ravel()
sky_img.filepath_raw = str(OUT_DIR / 'sky.png')
sky_img.file_format = 'PNG'
OUT_DIR.mkdir(parents=True, exist_ok=True)
sky_img.save()
sky_mat = bpy.data.materials.new('Sky')
sky_mat.use_nodes = True
nodes = sky_mat.node_tree.nodes
sky_tex = nodes.new('ShaderNodeTexImage')
sky_tex.image = sky_img
bsdf = nodes['Principled BSDF']
sky_mat.node_tree.links.new(sky_tex.outputs['Color'], bsdf.inputs['Base Color'])
sky_mat.node_tree.links.new(sky_tex.outputs['Color'], bsdf.inputs['Emission'])
bpy.ops.mesh.primitive_plane_add(size=1, location=(wx, WALL_Y + 6, wz), rotation=(math.radians(90), 0, 0))
sky = bpy.context.active_object
sky.scale = (40, 30, 1)
bpy.ops.object.transform_apply(scale=True, rotation=True)
finish(sky, 'Sky', sky_mat)
# The backdrop glows but must not block the sun coming through the window.
sky.visible_shadow = False

# Ceiling and the walls behind the camera only exist to make the bake's bounce light realistic.
ceiling_mat = material('Ceiling', (0.85, 0.84, 0.88), roughness=0.9)
bake_only += [
	# The ceiling stops at the wall, so it can't block sun coming through the window.
	box('Ceiling', (60, 46.4, 0.4), (-5, -19.8, FLOOR + 32.2), ceiling_mat),
	box('FrontWall', (60, 0.5, 32), (-5, -43, FLOOR + 16), ceiling_mat),
	box('RightWall', (0.5, 50, 32), (25.25, -18, FLOOR + 16), ceiling_mat),
]

# Tiling textures get world-space UVs (size = units per texture repeat).
for obj, size in [(floor, 16), (rug, 8), (rails, 8), (mattress, 6), (nightstand, 6)] + [(o, 8) for o in groups['bed'] if o.name == 'Headboard'] + [(o, 6) for o in groups['room'] if o.name.startswith('BedLeg')] + [(o, 18) for o in groups['room'] if o.name.startswith(('Wall', 'SideWall'))]:
	apply_modifiers(obj)
	uv_box(obj, size)
for obj in groups['props'] + groups['bed'] + groups['room'] + bake_only:
	if obj.modifiers:
		apply_modifiers(obj)
for obj in [o for objs in groups.values() for o in objs]:
	if obj.data.users > 1:
		obj.data = obj.data.copy()
	# The lightmap UVs must be the second set, so everything needs a first one.
	if not obj.data.uv_layers:
		obj.data.uv_layers.new(name='UVMap')
		uv_box(obj, 4)


# Lighting for the bake: golden hour. A low amber sun comes through the window and falls across the
# bedside table, warm sky light fills the room through the same window, and the lantern glows.

sun = bpy.data.objects.new('Sun', bpy.data.lights.new('Sun', 'SUN'))
sun.data.energy, sun.data.color = LOOK['sun']
sun.data.angle = math.radians(1.0)
# Aimed through the middle of the lower-right pane (not the crossbars) at the bedside table.
sun.rotation_euler = (Vector((0, 0.3, TOP)) - Vector((wx + 2.5, WALL_Y, wz - 3.0))).to_track_quat('-Z', 'Y').to_euler()
scene.collection.objects.link(sun)

fill = bpy.data.objects.new('WindowFill', bpy.data.lights.new('WindowFill', 'AREA'))
fill.data.shape = 'RECTANGLE'
fill.data.size, fill.data.size_y = ww, wh
fill.data.energy, fill.data.color = LOOK['fill']
fill.location = (wx, WALL_Y - 0.4, wz)
# Area lights shine along their local -Z; this points it from the window into the room.
fill.rotation_euler = (math.radians(-90), 0, 0)
scene.collection.objects.link(fill)

lamp = bpy.data.objects.new('LampLight', bpy.data.lights.new('LampLight', 'POINT'))
lamp.data.energy = LOOK['lamp']
lamp.data.color = (1.0, 0.62, 0.3)
lamp.data.shadow_soft_size = 0.08
lamp.location = Vector((lamp_x, lamp_y, TOP)) + Vector(lantern_light)
scene.collection.objects.link(lamp)

world = bpy.data.worlds.new('GoldenHour')
world.use_nodes = True
background = world.node_tree.nodes['Background']
background.inputs['Color'].default_value = (*LOOK['world'], 1)
scene.world = world

scene.render.engine = 'CYCLES'
scene.cycles.samples = SAMPLES
scene.cycles.max_bounces = 3
scene.cycles.diffuse_bounces = 3
scene.cycles.glossy_bounces = 1
scene.cycles.transmission_bounces = 2
# Clamping indirect light removes fireflies, at a small cost in accuracy (set per lighting state below).
prefs = bpy.context.preferences.addons['cycles'].preferences
# Set BAKE_DEVICE=CPU to skip the GPU.
for device_type in () if os.environ.get('BAKE_DEVICE') == 'CPU' else ('OPENCL', 'OPTIX', 'CUDA', 'HIP'):
	try:
		prefs.compute_device_type = device_type
	except TypeError:
		continue
	prefs.get_devices()
	gpus = [d for d in prefs.devices if d.type == device_type]
	if gpus:
		for d in prefs.devices:
			d.use = d.type == device_type
		scene.cycles.device = 'GPU'
		print('Baking on', device_type)
		break
scene.render.bake.use_pass_direct = True
scene.render.bake.use_pass_indirect = True
scene.render.bake.use_pass_color = False
scene.render.bake.margin = 8
# Blender 2.9x bakes in tiles; one tile per atlas is far faster, especially on the GPU (3.x has no tiles).
if hasattr(scene.render, 'tile_x'):
	scene.render.tile_x = scene.render.tile_y = int(os.environ.get('BAKE_TILE', ATLAS))



def descendants(obj):
	for child in obj.children:
		yield child
		yield from descendants(child)


# The console moves on the site, so it stays out of the bake.
for obj in descendants(sp):
	obj.hide_render = True

for group, objs in groups.items():
	# The bonsai foliage comes with lightmap UVs already laid out (see props.py).
	if group == 'foliage':
		continue
	for obj in objs:
		layer = obj.data.uv_layers.new(name='Lightmap')
		obj.data.uv_layers.active = layer
	select(objs)
	bpy.ops.object.mode_set(mode='EDIT')
	bpy.ops.mesh.select_all(action='SELECT')
	# A wide angle limit keeps islands few and large, so big surfaces get most of the atlas.
	bpy.ops.uv.smart_project(angle_limit=math.radians(80), island_margin=0.003)
	bpy.ops.object.mode_set(mode='OBJECT')


def bake(group, state):
	img = bpy.data.images.new(f'{group}-{state}', ATLAS, ATLAS, float_buffer=True)
	for obj in groups[group]:
		for slot in obj.material_slots:
			nodes = slot.material.node_tree.nodes
			target = nodes.get('BakeTarget') or nodes.new('ShaderNodeTexImage')
			target.name = 'BakeTarget'
			target.image = img
			nodes.active = target
	select(groups[group])
	bpy.ops.object.bake(type='DIFFUSE', uv_layer='Lightmap', margin=8, use_clear=True)
	px = np.array(img.pixels[:], dtype=np.float32).reshape(ATLAS, ATLAS, 4)[:, :, :3]
	# A 3x3 median removes leftover specks; the blur then smooths sampling noise.
	shifted = [np.roll(np.roll(px, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1)]
	px = np.median(np.stack(shifted), axis=0)
	for _ in range(2):
		px = (px + np.roll(px, 1, 0) + np.roll(px, -1, 0) + np.roll(px, 1, 1) + np.roll(px, -1, 1)) / 5
	scale = float(max(np.percentile(px, 99.7), 1e-4))
	lin = np.clip(px / scale, 0, 1)
	srgb = np.where(lin <= 0.0031308, lin * 12.92, 1.055 * np.power(lin, 1 / 2.4) - 0.055)
	out = bpy.data.images.new(f'{group}-{state}-out', ATLAS, ATLAS)
	out.colorspace_settings.name = 'Non-Color'
	out.pixels = np.concatenate([srgb, np.ones((ATLAS, ATLAS, 1), np.float32)], 2).ravel()
	# Lossless: these get multiplied up to ~25x on the site, which turns JPEG's colour noise into blotches.
	out.filepath_raw = str(OUT_DIR / f'{group}-{state}.png')
	out.file_format = 'PNG'
	out.save()
	print(f'Baked {group}-{state}, scale {scale:.4f}')
	return scale


# Cycles treats light through refractive glass as caustics and blocks it, which left the clock's dial
# black. For the bake, glass just lets light through.
glass_links = []
for mat in bpy.data.materials:
	if 'glass' in mat.name.lower() and mat.use_nodes:
		tree = mat.node_tree
		out = next(n for n in tree.nodes if n.type == 'OUTPUT_MATERIAL')
		glass_links.append((tree, out, out.inputs['Surface'].links[0].from_socket))
		clear = tree.nodes.new('ShaderNodeBsdfTransparent')
		tree.links.new(clear.outputs['BSDF'], out.inputs['Surface'])


def set_state(state):
	scene.cycles.sample_clamp_indirect = 2.0
	sun.hide_render = fill.hide_render = state == 'lamp'
	lamp.hide_render = state == 'day'
	paper = bpy.data.materials['LanternPaper'].node_tree.nodes['Principled BSDF']
	paper.inputs['Emission Strength'].default_value = 5.0 if state == 'lamp' else 0.0
	background.inputs['Strength'].default_value = 0.0 if state == 'lamp' else 1.0
	sky_mat.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 0.0 if state == 'lamp' else 6.0


if os.environ.get('DEBUG_SUN'):
	bpy.context.view_layer.update()
	towards_sun = sun.matrix_world.to_quaternion() @ Vector((0, 0, 1))
	for start in [Vector((0, 0.3, TOP + 0.01)), Vector((1, -0.5, TOP + 0.01)), Vector((-1, 0.5, TOP + 0.01))]:
		hit, loc, _, _, obj, _ = scene.ray_cast(bpy.context.view_layer.depsgraph, start, towards_sun)
		print('SUNRAY', tuple(round(c, 2) for c in start), '->', obj.name if hit else 'sky', tuple(round(c, 2) for c in loc) if hit else '', 'dir', tuple(round(c, 2) for c in towards_sun))
	sys.exit(0)

if PREVIEW:
	# Same framing as the site's camera (three.js y-up converted to Blender z-up).
	cam = bpy.data.objects.new('PreviewCam', bpy.data.cameras.new('PreviewCam'))
	cam.data.sensor_fit = 'VERTICAL'
	cam.data.angle_y = math.radians(35)
	scene.collection.objects.link(cam)
	scene.camera = cam
	scene.render.resolution_x, scene.render.resolution_y = 1200, 750
	scene.cycles.use_denoising = True
	scene.view_settings.view_transform = 'Filmic'
	scene.view_settings.exposure = LOOK['exposure']
	scene.view_settings.look = LOOK['look']
	look_name = os.environ.get('LOOK', 'alita')
	views = [('start', (4.2, -14, 3.2), (-1.8, 0, -0.6)), ('near', (0.9, -6, 1.9), (0, -0.9, 1.45)), ('bed', (4.0, -27, 9.5), (-8.5, -6, -2.5)), ('table', (0.4, -5.2, 1.6), (0.0, 0.5, 0.4))]
	for name, eye, target in views:
		cam.location = eye
		cam.rotation_euler = (Vector(target) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler()
		for state in ('both',):
			set_state(state)
			lamp.hide_render = False
			bpy.data.materials['LanternPaper'].node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 5.0
			scene.render.filepath = str(OUT_DIR / f'preview-{look_name}-{name}.png')
			bpy.ops.render.render(write_still=True)
	sys.exit(0)

scales = {group: {} for group in groups}
for state in STATES:
	set_state(state)
	for group in groups:
		scales[group][state] = bake(group, state)
(OUT_DIR / 'lightmaps.json').write_text(json.dumps(scales, indent=2))
for tree, out, original in glass_links:
	tree.links.new(original, out.inputs['Surface'])


# Export. Room materials keep only their colour texture; lighting comes from the lightmaps.

for obj in bake_only:
	bpy.data.objects.remove(obj)
for group, objs in groups.items():
	for obj in objs:
		obj['lightmap'] = group
		obj.data.uv_layers.active = obj.data.uv_layers[0]
		for slot in obj.material_slots:
			tree = slot.material.node_tree
			bsdf = next((n for n in tree.nodes if n.type == 'BSDF_PRINCIPLED'), None)
			for name in ('Normal', 'Roughness', 'Metallic'):
				if bsdf:
					for link in list(bsdf.inputs[name].links):
						tree.links.remove(link)
			if 'BakeTarget' in tree.nodes:
				tree.nodes.remove(tree.nodes['BakeTarget'])

# Small props don't need 1k textures; halve them (saved next to the cached originals).
for obj in groups['props'] + [o for o in groups['room'] if o.name == 'potted_plant_02']:
	for slot in obj.material_slots:
		for node in slot.material.node_tree.nodes:
			img = getattr(node, 'image', None)
			if img and img.size[0] > 512 and img.filepath and '_512' not in img.filepath and '-albedo' not in img.filepath:
				path = Path(bpy.path.abspath(img.filepath))
				small = path.with_name(path.stem + '_512' + path.suffix)
				img.scale(512, 512)
				img.filepath_raw = str(small)
				img.save()

# Re-encode every texture without transparency as a moderate-quality JPEG; the exporter embeds the
# file as it is on disk, so this is what the browser downloads.
scene.render.image_settings.file_format = 'JPEG'
scene.render.image_settings.quality = 78
texture_dir = OUT_DIR / 'textures'
texture_dir.mkdir(exist_ok=True)
for img in bpy.data.images:
	if img.source != 'FILE' or not img.filepath or img.users == 0 or img.name.startswith('SkyGradient'):
		continue
	if img.channels == 4:
		alpha = np.array(img.pixels[:], dtype=np.float32)[3::4]
		if alpha.min() < 0.99:
			continue
	out = texture_dir / f'{Path(bpy.path.abspath(img.filepath)).stem}.jpg'
	img.save_render(str(out))
	img.filepath = str(out)
	img.reload()

bpy.ops.object.select_all(action='DESELECT')
bpy.ops.export_scene.gltf(
	filepath=str(OUT_DIR / 'bedroom.glb'),
	export_format='GLB',
	export_apply=True,
	export_yup=True,
	export_extras=True,
	export_draco_mesh_compression_enable=True,
	export_draco_mesh_compression_level=7,
)
print('Exported', OUT_DIR / 'bedroom.glb')
