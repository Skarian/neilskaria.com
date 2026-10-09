"""The personal objects on the bedside table: a Casio F-91W, a Rubik's cube, a JOSEPH tumbler and a
juniper bonsai. Modelled at real size from reference photos; measurements are in millimetres and
converted to scene units (1 unit = 10 cm).

Naming the site relies on: 'WatchLCD' (drawn live with the visitor's time), material 'Chrome'
(lit by reflections instead of the bake) and material 'LanternPaper' (drawn glowing). The bonsai's foliage comes with its own lightmap UVs.
"""

import math
import random

import bmesh
import bpy
from mathutils import Matrix, Vector

from helpers import apply_modifiers, box, cut, cylinder, finish, link, material, select, set_parent, slab

U = 0.01  # millimetres to scene units


def mm(*v):
	return tuple(c * U for c in v)


def octagon(w, h, c):
	"""A w x h rectangle with c-sized chamfered corners, in millimetres."""
	x, y = w / 2, h / 2
	return [(-x, -y + c), (-x, y - c), (-x + c, y), (x - c, y), (x, y - c), (x, -y + c), (x - c, -y), (-x + c, -y)]


def scaled(points):
	return [(px * U, py * U) for px, py in points]


def label(name, body, size, loc, mat, font=None, rot=0.0, align='CENTER', extrude=0.0):
	"""Printed text as a thin mesh lying flat (facing +Z), sizes in millimetres."""
	curve = bpy.data.curves.new(name, 'FONT')
	curve.body = body
	curve.size = size * U
	curve.align_x = align
	curve.align_y = 'CENTER'
	curve.extrude = extrude * U
	if font:
		curve.font = bpy.data.fonts.load(font, check_existing=True)
	obj = link(bpy.data.objects.new(name, curve))
	obj.location = mm(*loc)
	obj.rotation_euler = (0, 0, rot)
	depsgraph = bpy.context.evaluated_depsgraph_get()
	mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
	matrix = obj.matrix_world.copy()
	bpy.data.objects.remove(obj)
	out = link(bpy.data.objects.new(name, mesh))
	out.matrix_world = matrix
	out.data.materials.append(mat)
	return out


def join(objs, name):
	for o in objs:
		if o.modifiers:
			apply_modifiers(o)
	select(objs)
	bpy.ops.object.join()
	obj = bpy.context.active_object
	obj.name = obj.data.name = name
	return obj


def sweep(name, profile, path, mat, cap=True, across=None):
	"""Extrude a closed 2D profile (x across, y up) along a 3D path of points. `across` fixes the
	profile's x direction, for paths (like loops) where it would otherwise flip."""
	mesh = bpy.data.meshes.new(name)
	bm = bmesh.new()
	rings = []
	for i, p in enumerate(path):
		p = Vector(p)
		a = Vector(path[max(i - 1, 0)])
		b = Vector(path[min(i + 1, len(path) - 1)])
		tangent = (b - a).normalized()
		side = Vector(across) if across else tangent.cross(Vector((0, 0, 1)))
		if side.length < 1e-6:
			side = Vector((1, 0, 0))
		side.normalize()
		up = side.cross(tangent).normalized()
		rings.append([bm.verts.new(p + side * x + up * y) for x, y in profile])
	n = len(profile)
	for r0, r1 in zip(rings, rings[1:]):
		for j in range(n):
			bm.faces.new((r0[j], r0[(j + 1) % n], r1[(j + 1) % n], r1[j]))
	if cap:
		bm.faces.new(list(reversed(rings[0])))
		bm.faces.new(rings[-1])
	bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
	bm.to_mesh(mesh)
	bm.free()
	return finish(link(bpy.data.objects.new(name, mesh)), name, mat)


def rounded_profile(w, t, r, steps=4):
	"""A w x t rectangle with r-rounded corners, centred, in scene units (for strap cross-sections)."""
	pts = []
	for cx, cy, start in [(w / 2 - r, t / 2 - r, 0), (-w / 2 + r, t / 2 - r, 90), (-w / 2 + r, -t / 2 + r, 180), (w / 2 - r, -t / 2 + r, 270)]:
		for i in range(steps + 1):
			a = math.radians(start + 90 * i / steps)
			pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
	return pts


def place_group(objs, loc, rot_z, scale=1.0):
	"""Move objects built around the origin to a spot on the table (loc in scene units)."""
	m = Matrix.Translation(loc) @ Matrix.Rotation(rot_z, 4, 'Z') @ Matrix.Scale(scale, 4)
	# Objects placed by setting location/rotation have stale world matrices until an update.
	bpy.context.view_layer.update()
	for o in objs:
		o.matrix_world = m @ o.matrix_world


# Casio F-91W: 38.2 x 35.2 x 8.5 mm case, lying face up with its straps flat on the table.


def casio():
	resin = material('WatchResin', (0.018, 0.018, 0.02), roughness=0.55)
	glass = material('WatchGlass', (0.008, 0.008, 0.01), roughness=0.05)
	blue = material('WatchBlue', (0.02, 0.12, 0.7), roughness=0.3)
	white = material('WatchWhite', (0.85, 0.85, 0.85), roughness=0.4)
	yellow = material('WatchYellow', (0.85, 0.62, 0.12), roughness=0.4)
	red = material('WatchRed', (0.75, 0.04, 0.04), roughness=0.4)
	steel = material('WatchSteel', (0.6, 0.6, 0.62), roughness=0.3)
	H = 8.5
	top = H + 0.02

	case_outline = [(-17.6, -9), (-17.6, 9), (-13.2, 15), (-12.6, 19.1), (12.6, 19.1), (13.2, 15), (17.6, 9), (17.6, -9), (13.2, -15), (12.6, -19.1), (-12.6, -19.1), (-13.2, -15)]
	parts = [slab('WatchCase', scaled(case_outline), 0, H * U, (0, 0, 0), resin, bevel=1.4 * U)]

	# The front: a glossy panel with a blue frame, printed labels and the LCD window.
	parts.append(slab('WatchPanel', scaled(octagon(31.5, 29.0, 4.8)), (H - 0.3) * U, top * U, (0, 0, 0), glass))
	for name, outer, inner, mat in [
		('WatchFrameBlue', octagon(30.4, 27.9, 4.4), octagon(29.0, 26.5, 4.0), blue),
		('WatchFrameWhite', octagon(28.6, 26.1, 3.9), octagon(28.2, 25.7, 3.8), white),
	]:
		ring = slab(name, scaled(outer), top * U, (top + 0.03) * U, (0, 0, 0), mat)
		cut(ring, slab('cutter', scaled(inner), (top - 1) * U, (top + 1) * U, (0, 0, 0), None))
		parts.append(ring)
	line = lambda name, x0, x1, y, mat, t=0.45: box(name, mm(x1 - x0, t, 0.04), mm((x0 + x1) / 2, y, top + 0.02), mat)  # noqa: E731
	parts += [line('WatchLineTop', -12.5, 12.5, 8.6, blue), line('WatchLineLeft', -12.5, -4.0, -7.7, blue), line('WatchLineRight', 4.0, 12.5, -7.7, blue)]
	wr = slab('WatchWRBox', scaled(octagon(7.8, 3.9, 1.0)), top * U, (top + 0.03) * U, (0, -9.1 * U, 0), blue)
	cut(wr, slab('cutter', scaled(octagon(7.0, 3.1, 0.8)), (top - 1) * U, (top + 1) * U, (0, -9.1 * U, 0), None))
	parts.append(wr)
	lcd_frame = slab('WatchLCDFrame', scaled(octagon(22.0, 10.8, 1.3)), top * U, (top + 0.03) * U, (0, 0.6 * U, 0), white)
	cut(lcd_frame, slab('cutter', scaled(octagon(21.4, 10.2, 1.1)), (top - 1) * U, (top + 1) * U, (0, 0.6 * U, 0), None))
	parts.append(lcd_frame)

	z = top + 0.03
	arial, bold = 'C:/Windows/Fonts/arialbd.ttf', 'C:/Windows/Fonts/ariblk.ttf'
	parts += [
		label('WatchModel', 'F-91W', 2.3, (7.0, 11.0, z), yellow, bold),
		label('WatchLight', 'LIGHT', 1.35, (-10.0, 7.0, z), white, arial),
		label('WatchAlarmChrono', 'ALARM CHRONOGRAPH', 1.4, (3.4, 7.0, z), yellow, arial),
		label('WatchMode', 'MODE', 1.35, (-10.2, -6.1, z), white, arial),
		label('WatchAlarmOnOff', 'ALARM  ON·OFF/24HR', 1.25, (3.9, -6.1, z), white, arial),
		label('WatchWater', 'WATER', 2.1, (-8.8, -9.3, z), white, bold),
		label('WatchResist', 'RESIST', 2.1, (8.7, -9.3, z), white, bold),
		label('WatchWR', 'WR', 2.3, (0, -9.3, z), red, bold),
	]
	# Small red arrows next to LIGHT, MODE and the alarm label.
	for x, y, flip in [(-13.2, 7.0, 1), (-13.2, -6.1, 1), (13.2, -6.1, -1)]:
		tri = bmesh.new()
		v = [tri.verts.new(mm(x + flip * dx, y + dy, z)) for dx, dy in [(0, 0), (1.8, 0.55), (1.8, -0.55)]]
		tri.faces.new(v if flip > 0 else list(reversed(v)))
		mesh = bpy.data.meshes.new('WatchArrow')
		tri.to_mesh(mesh)
		tri.free()
		arrow = link(bpy.data.objects.new('WatchArrow', mesh))
		arrow.data.materials.append(red)
		parts.append(arrow)

	# Buttons: two on the left, one on the right.
	for x, y in [(-18.6, 4.2), (-18.6, -5.2), (18.6, -5.2)]:
		parts.append(cylinder('WatchButton', 1.0 * U, 2.6 * U, mm(x, y, H / 2), steel, rot=(0, math.radians(90), 0), verts=16))

	# The LCD is a plain quad whose UVs run with the watch (top of the texture towards 12 o'clock);
	# the site draws the visitor's local time onto it.
	w, h = 20.8 * U / 2, 9.8 * U / 2
	mesh = bpy.data.meshes.new('WatchLCD')
	mesh.from_pydata([(-w, -h, 0), (w, -h, 0), (w, h, 0), (-w, h, 0)], [], [(0, 1, 2, 3)])
	uv = mesh.uv_layers.new(name='UVMap')
	for li, (u, v) in zip(range(4), [(0, 0), (1, 0), (1, 1), (0, 1)]):
		uv.data[li].uv = (u, v)
	lcd = finish(link(bpy.data.objects.new('WatchLCD', mesh)), 'WatchLCD', material('WatchLCD', (0.62, 0.66, 0.56), roughness=0.5))
	lcd.location = mm(0, 0.6, top + 0.02)
	body = join(parts, 'Casio')

	# Stand it up, as it sits when buckled and set down: the face upright towards the viewer (-Y),
	# 12 o'clock up, the strap looping behind it and resting on the table.
	CENTRE_Z = 30.3
	upright = Matrix.Translation(mm(0, 0, CENTRE_Z)) @ Matrix.Rotation(math.radians(90), 4, 'X')
	for obj in (body, lcd):
		obj.matrix_world = upright @ obj.matrix_world

	# The strap: a loop from the 12 o'clock lug, back over the top, down and under to the 6 o'clock lug.
	loop_y, loop_r = 20.0, 29.1
	lug_top, lug_bottom = Vector((0, -4.6, CENTRE_Z + 18.5)), Vector((0, -4.6, CENTRE_Z - 18.5))
	start = math.atan2(lug_top.z - CENTRE_Z, lug_top.y - loop_y)
	steps = 40
	path = [tuple(lug_top)]
	for k in range(1, steps):
		a = start - (2 * start) * k / steps
		path.append((0, loop_y + loop_r * math.cos(a), CENTRE_Z + loop_r * math.sin(a)))
	path.append(tuple(lug_bottom))
	strap = sweep('WatchStrap', rounded_profile(18, 2.4, 0.8), path, resin, cap=False, across=(1, 0, 0))
	strap.data.transform(Matrix.Scale(U, 4))
	# The steel buckle sits low on the back of the loop.
	a = math.radians(-40)
	buckle_at = mm(0, loop_y + (loop_r + 0.6) * math.cos(a), CENTRE_Z + (loop_r + 0.6) * math.sin(a))
	buckle = box('WatchBuckle', mm(21, 3, 9), buckle_at, steel, bevel=0.8 * U, rot=(a + math.pi / 2, 0, 0))
	cut(buckle, box('cutter', mm(17.6, 8, 5.6), buckle_at, None, rot=(a + math.pi / 2, 0, 0)))
	body = join([body, strap, buckle], 'Casio')
	return [body, lcd]


# Rubik's cube: 57 mm, black body, solved, white on top.


def rubiks():
	body_mat = material('CubeBody', (0.012, 0.012, 0.014), roughness=0.35)
	colours = {
		'+z': ('White', (0.8, 0.8, 0.78)),
		'-z': ('Yellow', (0.85, 0.7, 0.02)),
		'-y': ('Green', (0.1, 0.5, 0.1)),
		'+y': ('Blue', (0.02, 0.12, 0.55)),
		'+x': ('Red', (0.65, 0.02, 0.03)),
		'-x': ('Orange', (0.9, 0.28, 0.01)),
	}
	S, CUBIE, STICKER = 57.0, 18.7, 15.6
	step = S / 3
	cubies, stickers = [], {key: [] for key in colours}
	for ix in (-1, 0, 1):
		for iy in (-1, 0, 1):
			for iz in (-1, 0, 1):
				if ix == iy == iz == 0:
					continue
				c = (ix * step, iy * step, iz * step + S / 2)
				cubies.append(box('Cubie', mm(CUBIE, CUBIE, CUBIE), mm(*c), body_mat, bevel=1.6 * U, segments=3))
				for axis, sign, key in [(0, ix, 'x'), (1, iy, 'y'), (2, iz, 'z')]:
					if sign == 0:
						continue
					p = list(c)
					p[axis] += sign * (CUBIE / 2 + 0.05)
					size = [STICKER, STICKER, STICKER]
					size[axis] = 0.25
					stickers[('+' if sign > 0 else '-') + key].append(box('Sticker', mm(*size), mm(*p), None, bevel=0.1 * U))
	out = [join(cubies, 'CubeBody')]
	for key, (name, rgb) in colours.items():
		mat = material(f'Cube{name}', rgb, roughness=0.25)
		obj = join(stickers[key], f'Cube{name}')
		obj.data.materials.clear()
		obj.data.materials.append(mat)
		out.append(obj)
	return out


# The JOSEPH tumbler: a charcoal insulated tumbler with a flip-straw lid and carry loop.


def tumbler():
	body_mat = material('TumblerBody', (0.035, 0.036, 0.039), roughness=0.62)
	lid_mat = material('TumblerLid', (0.012, 0.012, 0.013), roughness=0.4)
	chrome = material('Chrome', (0.8, 0.8, 0.82), roughness=0.22, metallic=1.0)
	ink = material('TumblerInk', (0.008, 0.008, 0.008), roughness=0.35)
	R, BAND, BODY = 41.0, 19.0, 121.0

	band = cylinder('TumblerBand', R * U, BAND * U, mm(0, 0, BAND / 2), chrome, bevel=1.5 * U, verts=64)
	# The painted body: straight sides that round in a little at the shoulder.
	profile = [(0, BAND - 0.5), (R - 0.2, BAND - 0.5), (R, BAND + 2), (R, BODY - 10), (R - 1.0, BODY - 4), (R - 2.5, BODY)]
	bm = bmesh.new()
	rings = []
	for i in range(64):
		a = 2 * math.pi * i / 64
		rings.append([bm.verts.new(mm(r * math.cos(a), r * math.sin(a), h)) for r, h in profile])
	for i in range(64):
		r0, r1 = rings[i], rings[(i + 1) % 64]
		for j in range(len(profile) - 1):
			bm.faces.new((r0[j], r1[j], r1[j + 1], r0[j + 1]))
	bm.faces.new([ring[-1] for ring in rings])
	bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
	bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
	mesh = bpy.data.meshes.new('TumblerBody')
	bm.to_mesh(mesh)
	bm.free()
	body = finish(link(bpy.data.objects.new('TumblerBody', mesh)), 'TumblerBody', body_mat)
	apply_modifiers(body)
	# Three grip grooves curving around the front, low on the body.
	for z in (34, 44, 54):
		ring = cylinder('cutter', (R + 3) * U, 3.2 * U, mm(0, 0, z), None, verts=64)
		cut(ring, cylinder('cutter', (R - 1.3) * U, 8 * U, mm(0, 0, z), None, verts=64))
		cut(ring, box('cutter', mm(120, 120, 10), mm(0, 60 - 16, z), None))
		cut(body, ring)

	lid = cylinder('TumblerLid', (R + 1.2) * U, 30 * U, mm(0, 0, BODY + 15), lid_mat, bevel=3.0 * U, verts=64, segments=4)
	spout = box('TumblerSpout', mm(30, 20, 5), mm(-6, 10, BODY + 31), lid_mat, bevel=2 * U)
	straw = box('TumblerStraw', mm(12, 6, 16), mm(-6, 20, BODY + 38), lid_mat, bevel=2 * U, rot=(math.radians(22), 0, 0))
	# The carry loop hinges on the right side of the lid.
	hinge = cylinder('TumblerHinge', 5.5 * U, 3 * U, mm(R + 2.4, 8, BODY + 18), chrome, rot=(0, math.radians(90), 0), verts=32, bevel=0.6 * U)
	loop = box('TumblerLoop', mm(4, 12, 30), mm(R + 4.2, 14, BODY + 2), lid_mat, bevel=2 * U, rot=(math.radians(-24), 0, 0))

	# "JOSEPH" printed on the front, wrapped around the curve of the body.
	word = label('TumblerWord', 'JOSEPH', 9.5, (0, 0, 0), ink, 'C:/Windows/Fonts/ROCKEB.TTF', extrude=0.15)
	for v in word.data.vertices:
		x, y, zz = v.co.x / U, v.co.y / U, v.co.z / U
		angle = x / R
		radius = R + 0.2 + zz
		v.co = Vector(mm(radius * math.sin(angle), -radius * math.cos(angle), 78 + y))
	word.data.update()

	solid = join([body, lid, spout, straw, loop, word], 'Tumbler')
	return [solid, join([band, hinge], 'TumblerChrome')]


# The bonsai: a twisting juniper with bleached deadwood, dense needle pads, in a shallow oval pot on
# slate. Proportions follow the reference: a squat, gnarled S-curve trunk under a wide canopy that
# cascades to one side.


def stretched_noise_material(name, coord_scale, stops, grain=0.3, roughness=0.85):
	"""A procedural colour (noise stretched by coord_scale, then a colour ramp), baked to a texture later."""
	mat = bpy.data.materials.new(name)
	mat.use_nodes = True
	nodes, links = mat.node_tree.nodes, mat.node_tree.links
	bsdf = nodes['Principled BSDF']
	bsdf.inputs['Roughness'].default_value = roughness
	coord = nodes.new('ShaderNodeTexCoord')
	mapping = nodes.new('ShaderNodeMapping')
	mapping.inputs['Scale'].default_value = coord_scale
	links.new(coord.outputs['Object'], mapping.inputs['Vector'])
	noise = nodes.new('ShaderNodeTexNoise')
	noise.inputs['Scale'].default_value = 1.0
	noise.inputs['Detail'].default_value = 8.0
	noise.inputs['Roughness'].default_value = 0.6
	links.new(mapping.outputs['Vector'], noise.inputs['Vector'])
	ramp = nodes.new('ShaderNodeValToRGB')
	elements = ramp.color_ramp.elements
	for k, (pos, rgb) in enumerate(stops):
		el = elements[k] if k < len(elements) else elements.new(pos)
		el.position = pos
		el.color = (*rgb, 1)
	links.new(noise.outputs['Fac'], ramp.inputs['Fac'])
	fine = nodes.new('ShaderNodeTexNoise')
	fine.inputs['Scale'].default_value = 6.0
	fine.inputs['Detail'].default_value = 10.0
	links.new(mapping.outputs['Vector'], fine.inputs['Vector'])
	mix = nodes.new('ShaderNodeMixRGB')
	mix.blend_type = 'MULTIPLY'
	mix.inputs['Fac'].default_value = grain
	links.new(ramp.outputs['Color'], mix.inputs['Color1'])
	links.new(fine.outputs['Fac'], mix.inputs['Color2'])
	links.new(mix.outputs['Color'], bsdf.inputs['Base Color'])
	return mat


def bonsai(bake_albedo, seed=11):
	rng = random.Random(seed)
	objs, foliage = [], []

	objs.append(slab('BonsaiSlate', scaled(octagon(236, 172, 10)), 0, 6 * U, (0, 0, 0), material('Slate', (0.05, 0.055, 0.06), roughness=0.75), bevel=1.5 * U))

	# Shallow oval pot (unglazed, aubergine brown) standing on four short feet.
	pot_mat = material('BonsaiPot', (0.13, 0.055, 0.05), roughness=0.85)
	profile = [(0, 12), (88, 12), (95, 15), (100, 22), (102, 30), (100, 33), (96, 33), (93, 29), (0, 29)]
	bm = bmesh.new()
	rings = []
	for i in range(72):
		a = 2 * math.pi * i / 72
		rings.append([bm.verts.new(mm(r * math.cos(a), r * math.sin(a) * 0.68, h)) for r, h in profile])
	for i in range(72):
		r0, r1 = rings[i], rings[(i + 1) % 72]
		for k in range(len(profile) - 1):
			bm.faces.new((r0[k], r1[k], r1[k + 1], r0[k + 1]))
	bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
	bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
	mesh = bpy.data.meshes.new('BonsaiPot')
	bm.to_mesh(mesh)
	bm.free()
	pot = finish(link(bpy.data.objects.new('BonsaiPot', mesh)), 'BonsaiPot', pot_mat)
	pot.modifiers.new('round', 'SUBSURF').levels = 1
	objs.append(pot)
	for x, y in [(-64, -36), (64, -36), (-64, 36), (64, 36)]:
		objs.append(box('BonsaiFoot', mm(15, 9, 7), mm(x, y, 9.5), pot_mat, bevel=2.5 * U))

	# Soil mounded towards the trunk, mossy, with small clumps of brighter moss.
	bpy.ops.mesh.primitive_circle_add(vertices=64, radius=1, fill_type='TRIFAN', location=(0, 0, 0))
	soil = bpy.context.active_object
	bpy.ops.object.mode_set(mode='EDIT')
	bpy.ops.mesh.subdivide(number_cuts=8)
	bpy.ops.object.mode_set(mode='OBJECT')
	for v in soil.data.vertices:
		x, y = v.co.x, v.co.y
		mound = max(0, 1 - math.hypot(x - 0.05, y) / 0.6) ** 1.6
		v.co = Vector(mm(x * 94, y * 94 * 0.68, 29 + 11 * mound + rng.uniform(0, 1.2)))
	soil_mat = stretched_noise_material('BonsaiSoil', (9, 9, 9), [(0.4, (0.035, 0.025, 0.015)), (0.55, (0.05, 0.075, 0.02)), (0.7, (0.09, 0.13, 0.03))], grain=0.4, roughness=0.95)
	finish(soil, 'BonsaiSoil', soil_mat)
	bake_albedo(soil, 256)
	objs.append(soil)
	clumps = []
	moss_mats = [material('BonsaiMossBright', (0.08, 0.15, 0.03), roughness=0.95), material('BonsaiMossDark', (0.04, 0.08, 0.02), roughness=0.95)]
	for _ in range(150):
		a, r = rng.uniform(0, 2 * math.pi), math.sqrt(rng.uniform(0.02, 0.85))
		x, y = math.cos(a) * r * 90, math.sin(a) * r * 60
		mound = max(0, 1 - math.hypot(x / 94 - 0.05, y / 64) / 0.6) ** 1.6
		bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=1, radius=1, location=mm(x, y, 30 + 11 * mound))
		clump = bpy.context.active_object
		size = rng.uniform(1.4, 3.2)
		clump.scale = mm(size * rng.uniform(0.8, 1.3), size * rng.uniform(0.8, 1.3), size * 0.45)
		bpy.ops.object.transform_apply(scale=True)
		clumps.append(finish(clump, 'BonsaiMossClump', rng.choice(moss_mats)))
	objs.append(join(clumps, 'BonsaiMoss'))

	# Trunk and branches: twisting curves with tapering radius, flaring into roots at the soil.
	def limb(name, points, radii, flat=1.0):
		curve = bpy.data.curves.new(name, 'CURVE')
		curve.dimensions = '3D'
		curve.bevel_depth = 1.0 * U
		curve.bevel_resolution = 5
		curve.resolution_u = 12
		curve.use_fill_caps = True
		spline = curve.splines.new('BEZIER')
		spline.bezier_points.add(len(points) - 1)
		for bp, p, r in zip(spline.bezier_points, points, radii):
			bp.co = mm(*p)
			bp.handle_left_type = bp.handle_right_type = 'AUTO'
			bp.radius = r
			bp.tilt = rng.uniform(0, 2)
		obj = link(bpy.data.objects.new(name, curve))
		depsgraph = bpy.context.evaluated_depsgraph_get()
		mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
		bpy.data.objects.remove(obj)
		out = link(bpy.data.objects.new(name, mesh))
		if flat != 1.0:
			out.data.transform(Matrix.Diagonal((1, flat, 1, 1)))
		return out

	limbs = [
		limb('Trunk', [(14, 0, 30), (18, 4, 52), (4, 8, 74), (-24, 4, 94), (-38, -4, 114), (-30, -6, 134), (-8, -2, 148), (8, 2, 164), (14, 0, 180), (8, 0, 194)], [30, 25, 21, 19, 17, 15, 13, 10, 7, 4]),
		# Roots flaring into the soil.
		limb('Root', [(14, 0, 40), (36, -6, 34), (52, -10, 31)], [12, 7, 2.5]),
		limb('Root', [(10, 0, 40), (-10, 14, 34), (-24, 24, 31)], [11, 6, 2]),
		limb('Root', [(8, -2, 40), (-6, -18, 34), (-16, -28, 31)], [10, 5, 2]),
		# The bleached ribbon of deadwood sweeping out and back around the lower trunk.
		limb('Shari', [(14, -8, 62), (40, -10, 82), (34, -4, 104), (6, 8, 116), (-18, 8, 112)], [8, 7, 7, 6, 3], flat=0.55),
		# Main branch, out to the right and down into the cascade.
		limb('Branch', [(-8, -2, 148), (30, -6, 160), (70, -4, 152), (102, 0, 134), (122, 2, 116)], [9, 7, 6, 4, 2.5]),
		limb('Branch', [(-30, -6, 138), (-62, 0, 150), (-92, 4, 152)], [7, 5, 2.5]),
		limb('Branch', [(6, 2, 170), (10, 34, 178), (12, 52, 182)], [5, 3.5, 2]),
		limb('Branch', [(70, -4, 152), (84, -16, 168), (94, -20, 176)], [4, 3, 1.5]),
		# Jin: short, pointed dead branch stubs.
		limb('Jin', [(-36, -2, 120), (-52, 2, 128), (-58, 4, 136)], [5, 3, 0.8]),
		limb('Jin', [(48, -6, 158), (52, -10, 172)], [2.5, 0.6]),
	]
	wood = join(limbs, 'BonsaiWood')
	# Twisting ridges: noise stretched along the trunk, pushed in and out.
	ridge_space = link(bpy.data.objects.new('BonsaiRidgeSpace', None))
	ridge_space.scale = (0.035, 0.035, 0.35)
	ridge_space.rotation_euler = (0, 0, 0.6)
	tex = bpy.data.textures.new('BonsaiRidges', 'CLOUDS')
	tex.noise_scale = 1.0
	tex.noise_depth = 4
	disp = wood.modifiers.new('ridges', 'DISPLACE')
	disp.texture = tex
	disp.texture_coords = 'OBJECT'
	disp.texture_coords_object = ridge_space
	disp.strength = 0.045
	disp.mid_level = 0.5
	wood.modifiers.new('smooth', 'SUBSURF').levels = 1
	apply_modifiers(wood)
	bpy.data.objects.remove(ridge_space)
	# Bark: a reddish-brown live vein winding through bleached, silvery-tan deadwood.
	wood_mat = stretched_noise_material(
		'BonsaiWood',
		(14, 14, 1.6),
		[(0.38, (0.1, 0.04, 0.028)), (0.44, (0.2, 0.1, 0.06)), (0.48, (0.45, 0.38, 0.27)), (0.62, (0.62, 0.56, 0.43))],
		grain=0.45,
	)
	wood.data.materials.clear()
	wood.data.materials.append(wood_mat)
	for poly in wood.data.polygons:
		poly.use_smooth = True
	bake_albedo(wood, 1024)
	objs.append(wood)

	# Foliage. Each pad is a cloud of overlapping blobs: a dark core, covered in needle tufts on the
	# outer surface only (points inside a neighbouring blob are skipped).
	# Each pad is an envelope (centre, half-sizes in mm) filled with overlapping blobs, fuller on top.
	envelopes = [
		((19, 0, 214), (78, 55, 38), 12),  # the crown
		((-72, 6, 185), (47, 40, 28), 7),  # left pad
		((62, -4, 134), (70, 48, 34), 10),  # the big pad cascading to the right
		((110, 4, 160), (34, 30, 20), 4),  # its upper-right shoulder
		((10, 46, 200), (36, 26, 20), 4),  # back, for depth
	]
	pads = []
	for centre, size, count in envelopes:
		pad = []
		for k in range(count):
			if k == 0:
				offset = Vector((0, 0, 0.1))
			else:
				while True:
					offset = Vector((rng.uniform(-1, 1), rng.uniform(-1, 1), rng.uniform(-0.35, 0.6)))
					if offset.length <= 1:
						break
			c = tuple(centre[a] + offset[a] * size[a] * 0.55 for a in range(3))
			r = (size[0] * rng.uniform(0.42, 0.62), size[1] * rng.uniform(0.45, 0.65), size[2] * rng.uniform(0.5, 0.75))
			pad.append((c, r))
		pads.append(pad)
	core_mat = material('BonsaiCore', (0.018, 0.05, 0.024), roughness=0.9)
	needle_mats = [
		material('BonsaiNeedleDark', (0.042, 0.13, 0.06), roughness=0.7),
		material('BonsaiNeedle', (0.075, 0.21, 0.09), roughness=0.7),
		material('BonsaiNeedleLight', (0.13, 0.3, 0.15), roughness=0.7),
		material('BonsaiNeedleBlue', (0.07, 0.2, 0.15), roughness=0.7),
	]
	cores, tufts = [], []
	blobs = [blob for pad in pads for blob in pad]

	def inside_other(p, own):
		for centre, radii in blobs:
			if (centre, radii) == own:
				continue
			rx, ry, rz = radii
			d = ((p.x - centre[0]) / rx) ** 2 + ((p.y - centre[1]) / ry) ** 2 + ((p.z - centre[2]) / rz) ** 2
			if d < 0.8:
				return True
		return False

	for blob in blobs:
		centre, (rx, ry, rz) = blob
		bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=3, radius=1, location=mm(*centre))
		core = bpy.context.active_object
		core.scale = mm(rx * 0.88, ry * 0.88, rz * 0.8)
		bpy.ops.object.transform_apply(scale=True)
		for v in core.data.vertices:
			v.co += v.normal * rng.uniform(-0.1, 0.2) * rz * U
		cores.append(finish(core, 'BonsaiCore', core_mat))
		area = 2.2 * (rx * ry + rx * rz + ry * rz)
		for _ in range(int(area / 7.5)):
			theta = rng.uniform(0, 2 * math.pi)
			# Mostly on top and around the sides, sparser underneath.
			u = 1 - 1.8 * rng.random() ** 1.4
			phi = math.acos(max(-1.0, min(1.0, u)))
			n = Vector((math.sin(phi) * math.cos(theta), math.sin(phi) * math.sin(theta), math.cos(phi)))
			p = Vector(centre) + Vector((n.x * rx, n.y * ry, n.z * rz)) * rng.uniform(0.86, 1.02)
			if inside_other(p, blob):
				continue
			mat = rng.choices(needle_mats, weights=(2, 4, 3, 2))[0]
			tufts.append((mat.name, tuft(p, n, rng)))

	# Lightmap UVs: each tuft gets its own little cell (its needles share it, so a tuft is lit as one),
	# filling the lower part of the atlas; the cores are unwrapped into the strip above.
	cols = math.ceil(math.sqrt(len(tufts) / 0.8))
	cell = min(0.8 / math.ceil(len(tufts) / cols), 1 / cols)
	for obj_mat in needle_mats:
		mesh = bpy.data.meshes.new(obj_mat.name)
		bm = bmesh.new()
		base_uv = bm.loops.layers.uv.new('UVMap')
		lightmap = bm.loops.layers.uv.new('Lightmap')
		for index, (name, tris) in enumerate(tufts):
			if name != obj_mat.name:
				continue
			u0, v0 = (index % cols) * cell, (index // cols) * cell
			corners = [(u0 + cell * 0.15, v0 + cell * 0.15), (u0 + cell * 0.85, v0 + cell * 0.15), (u0 + cell * 0.5, v0 + cell * 0.85)]
			for tri in tris:
				face = bm.faces.new([bm.verts.new(mm(*co)) for co in tri])
				for loop, uv in zip(face.loops, corners):
					loop[lightmap].uv = uv
					loop[base_uv].uv = uv
		bm.to_mesh(mesh)
		bm.free()
		obj = link(bpy.data.objects.new(obj_mat.name, mesh))
		obj.data.materials.append(obj_mat)
		foliage.append(obj)
	print(f'Bonsai: {len(tufts)} tufts, {sum(len(t) for _, t in tufts)} needle triangles')

	core_obj = join(cores, 'BonsaiCores')
	if not core_obj.data.uv_layers:
		core_obj.data.uv_layers.new(name='UVMap')
	core_obj.data.uv_layers.new(name='Lightmap')
	core_obj.data.uv_layers.active = core_obj.data.uv_layers['Lightmap']
	select([core_obj])
	bpy.ops.object.mode_set(mode='EDIT')
	bpy.ops.mesh.select_all(action='SELECT')
	bpy.ops.uv.smart_project(angle_limit=math.radians(70), island_margin=0.01)
	bpy.ops.object.mode_set(mode='OBJECT')
	for loop in core_obj.data.uv_layers['Lightmap'].data:
		loop.uv = (loop.uv.x, 0.82 + loop.uv.y * 0.18)
	core_obj.data.uv_layers.active = core_obj.data.uv_layers[0]
	foliage.append(core_obj)
	return objs, foliage


def tuft(p, n, rng):
	"""A juniper tuft: a spray of short, flat needles fanning out from a point around normal n (mm).
	Each needle is a single thin triangle; the site draws the foliage double-sided."""
	n = (n + Vector((0, 0, 0.5))).normalized()
	side = n.cross(Vector((1, 0, 0)) if abs(n.x) < 0.9 else Vector((0, 1, 0))).normalized()
	other = n.cross(side)
	tris = []
	for _ in range(6):
		a = rng.uniform(0, 2 * math.pi)
		d = (n + (side * math.cos(a) + other * math.sin(a)) * rng.uniform(0.4, 1.0)).normalized()
		length = rng.uniform(3.0, 5.2)
		base = p + d * rng.uniform(-1.5, 0.3)
		perp = d.cross(n)
		perp = perp.normalized() if perp.length > 1e-4 else side
		w = 0.4
		a_, b_, c_ = base + perp * w, base - perp * w, base + d * length
		# Face outwards, so the bake records the light on the tuft's open side.
		if (b_ - a_).cross(c_ - a_).dot(n) < 0:
			a_, b_ = b_, a_
		tris.append((tuple(a_), tuple(b_), tuple(c_)))
	return tris


def build(bake_albedo, top, woodgrain):
	"""Build every prop and place it on the bedside table (whose top is at z = top).
	Returns (lightmapped props, bonsai foliage with its own prepared lightmap UVs, unbaked objects)."""
	baked, foliage_all, unbaked = [], [], []

	cube = rubiks()
	place_group(cube, Vector((-1.35, -0.85, top)), math.radians(-24))
	unbaked += cube

	# The clock radio, back-left, angled towards the camera.
	clock_body, clock_display, clock_digits, clock_parts = clock_radio(woodgrain)
	place_group([clock_body, clock_display, clock_digits, *clock_parts], Vector((-0.75, 1.15, top)), math.radians(28))
	baked += [clock_body, *clock_parts]
	unbaked += [clock_display, clock_digits]

	solid, chrome = tumbler()
	# Back-right corner, beside the lantern.
	place_group([solid, chrome], Vector((1.95, 1.25, top)), math.radians(-14))
	baked.append(solid)
	unbaked.append(chrome)

	wood_and_pot, foliage = bonsai(bake_albedo)
	# At the right edge, scaled down a little, so its cascade hangs off the side of the table.
	place_group(wood_and_pot + foliage, Vector((1.25, -0.7, top)), math.radians(6), 0.7)
	baked += wood_and_pot
	foliage_all += foliage
	return baked, foliage_all, unbaked


# A kumiko lantern: a dark wood frame holding light wood asanoha (hemp-leaf) lattice panels, with
# washi paper inside lit by a warm bulb. About 140 x 140 x 240 mm.


def asanoha_segments(width, height, side):
	"""Line segments of an asanoha pattern covering a width x height panel (mm, origin bottom-left):
	an equilateral triangle grid with spokes from each triangle's corners to its centre."""
	col = side * math.sqrt(3) / 2
	cols = int(width / col) + 3
	rows = int(height / side) + 3
	points = lambda i: [Vector(((i - 1) * col, (j - 1) * side + (i % 2) * side / 2)) for j in range(rows)]  # noqa: E731
	segments = set()

	def add(a, b):
		key = tuple(sorted([(round(a.x, 3), round(a.y, 3)), (round(b.x, 3), round(b.y, 3))]))
		segments.add(key)

	for i in range(cols):
		left, right = points(i), points(i + 1)
		strip = sorted(left + right, key=lambda p: p.y)
		for a, b, c in zip(strip, strip[1:], strip[2:]):
			centre = (a + b + c) / 3
			for p, q in ((a, b), (b, c), (c, a)):
				add(p, q)
			for p in (a, b, c):
				add(p, centre)
	clipped = []
	for (ax, ay), (bx, by) in segments:
		seg = clip(Vector((ax, ay)), Vector((bx, by)), width, height)
		if seg and (seg[1] - seg[0]).length > 0.5:
			clipped.append(seg)
	return clipped


def clip(a, b, width, height):
	"""Liang–Barsky clip of segment a-b to the rectangle [0, width] x [0, height]."""
	d = b - a
	t0, t1 = 0.0, 1.0
	for p, q in ((-d.x, a.x), (d.x, width - a.x), (-d.y, a.y), (d.y, height - a.y)):
		if abs(p) < 1e-9:
			if q < 0:
				return None
			continue
		t = q / p
		if p < 0:
			t0 = max(t0, t)
		else:
			t1 = min(t1, t)
		if t0 > t1:
			return None
	return a + d * t0, a + d * t1


def add_bar(bm, a, b, frame, width, depth):
	"""A thin slat along 2D segment a-b of a panel. frame = (origin, u, v, n) in mm."""
	origin, u, v, n = frame
	p0, p1 = origin + u * a.x + v * a.y, origin + u * b.x + v * b.y
	along = (p1 - p0).normalized()
	side = along.cross(n).normalized() * width / 2
	inward = -n * depth
	corners = []
	for p in (p0, p1):
		for s in (side, -side):
			for d in (Vector((0, 0, 0)), inward):
				corners.append(bm.verts.new(mm(*(p + s + d))))
	v000, v001, v010, v011, v100, v101, v110, v111 = corners
	for face in [(v000, v010, v110, v100), (v001, v101, v111, v011), (v000, v100, v101, v001), (v010, v011, v111, v110), (v000, v001, v011, v010), (v100, v110, v111, v101)]:
		bm.faces.new(face)


def kumiko_lantern():
	dark = material('KumikoFrame', (0.06, 0.035, 0.02), roughness=0.55)
	light = material('KumikoLattice', (0.6, 0.44, 0.27), roughness=0.6)
	paper = material('LanternPaper', (1.0, 0.92, 0.8), roughness=0.9, emission=(1.0, 0.6, 0.28))
	paper.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 5.0
	OUT, POST, H, BASE = 70.0, 11.0, 240.0, 16.0

	parts = [box('KumikoBase', mm(2 * OUT - 6, 2 * OUT - 6, BASE), mm(0, 0, BASE / 2), dark, bevel=1.2 * U)]
	for sx in (-1, 1):
		for sy in (-1, 1):
			parts.append(box('KumikoPost', mm(POST, POST, H - BASE), mm(sx * (OUT - POST / 2), sy * (OUT - POST / 2), BASE + (H - BASE) / 2), dark, bevel=0.8 * U))
	for z in (BASE + 4, H - 5):
		for axis in ('x', 'y'):
			for s in (-1, 1):
				size = mm(2 * OUT, POST, 8) if axis == 'x' else mm(POST, 2 * OUT, 8)
				loc = mm(0, s * (OUT - POST / 2), z) if axis == 'x' else mm(s * (OUT - POST / 2), 0, z)
				parts.append(box('KumikoRail', size, loc, dark, bevel=0.8 * U))
	frame = join(parts, 'KumikoFrame')

	inner = OUT - POST
	z0, z1 = BASE + 8, H - 9
	panel_h = z1 - z0
	panels = [
		(Vector((-inner, -OUT + 3, z0)), Vector((1, 0, 0)), Vector((0, 0, 1)), Vector((0, -1, 0)), 2 * inner, panel_h),
		(Vector((inner, OUT - 3, z0)), Vector((-1, 0, 0)), Vector((0, 0, 1)), Vector((0, 1, 0)), 2 * inner, panel_h),
		(Vector((-OUT + 3, inner, z0)), Vector((0, -1, 0)), Vector((0, 0, 1)), Vector((-1, 0, 0)), 2 * inner, panel_h),
		(Vector((OUT - 3, -inner, z0)), Vector((0, 1, 0)), Vector((0, 0, 1)), Vector((1, 0, 0)), 2 * inner, panel_h),
		(Vector((-inner, -inner, H - 2)), Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1)), 2 * inner, 2 * inner),
	]
	bm = bmesh.new()
	for origin, u, v, n, w, h in panels:
		for a, b in asanoha_segments(w, h, 34.0):
			add_bar(bm, a, b, (origin, u, v, n), 1.3, 4.0)
		# A slim inner border around each panel.
		for a, b in [(Vector((0, 0)), Vector((w, 0))), (Vector((w, 0)), Vector((w, h))), (Vector((w, h)), Vector((0, h))), (Vector((0, h)), Vector((0, 0)))]:
			add_bar(bm, a, b, (origin, u, v, n), 2.5, 4.0)
	mesh = bpy.data.meshes.new('KumikoLattice')
	bm.to_mesh(mesh)
	bm.free()
	lattice = link(bpy.data.objects.new('KumikoLattice', mesh))
	lattice.data.materials.append(light)

	# Washi paper behind the lattice: lets the bulb's light through in the bake, glows on the site.
	paper_box = box('LanternPaper', mm(2 * inner + 4, 2 * inner + 4, panel_h), mm(0, 0, z0 + panel_h / 2), paper)
	paper_box.visible_shadow = False
	return [frame, lattice], paper_box, mm(0, 0, z0 + panel_h * 0.45)


# A kumiko lantern: a dark wood frame holding light wood asanoha (hemp-leaf) lattice panels, with
# washi paper inside lit by a warm bulb. About 140 x 140 x 240 mm.


def asanoha_segments(width, height, side):
	"""Line segments of an asanoha pattern covering a width x height panel (mm, origin bottom-left):
	an equilateral triangle grid with spokes from each triangle's corners to its centre."""
	col = side * math.sqrt(3) / 2
	cols = int(width / col) + 3
	rows = int(height / side) + 3
	points = lambda i: [Vector(((i - 1) * col, (j - 1) * side + (i % 2) * side / 2)) for j in range(rows)]  # noqa: E731
	segments = set()

	def add(a, b):
		key = tuple(sorted([(round(a.x, 3), round(a.y, 3)), (round(b.x, 3), round(b.y, 3))]))
		segments.add(key)

	for i in range(cols):
		left, right = points(i), points(i + 1)
		strip = sorted(left + right, key=lambda p: p.y)
		for a, b, c in zip(strip, strip[1:], strip[2:]):
			centre = (a + b + c) / 3
			for p, q in ((a, b), (b, c), (c, a)):
				add(p, q)
			for p in (a, b, c):
				add(p, centre)
	clipped = []
	for (ax, ay), (bx, by) in segments:
		seg = clip(Vector((ax, ay)), Vector((bx, by)), width, height)
		if seg and (seg[1] - seg[0]).length > 0.5:
			clipped.append(seg)
	return clipped


def clip(a, b, width, height):
	"""Liang–Barsky clip of segment a-b to the rectangle [0, width] x [0, height]."""
	d = b - a
	t0, t1 = 0.0, 1.0
	for p, q in ((-d.x, a.x), (d.x, width - a.x), (-d.y, a.y), (d.y, height - a.y)):
		if abs(p) < 1e-9:
			if q < 0:
				return None
			continue
		t = q / p
		if p < 0:
			t0 = max(t0, t)
		else:
			t1 = min(t1, t)
		if t0 > t1:
			return None
	return a + d * t0, a + d * t1


def add_bar(bm, a, b, frame, width, depth):
	"""A thin slat along 2D segment a-b of a panel. frame = (origin, u, v, n) in mm."""
	origin, u, v, n = frame
	p0, p1 = origin + u * a.x + v * a.y, origin + u * b.x + v * b.y
	along = (p1 - p0).normalized()
	side = along.cross(n).normalized() * width / 2
	inward = -n * depth
	corners = []
	for p in (p0, p1):
		for s in (side, -side):
			for d in (Vector((0, 0, 0)), inward):
				corners.append(bm.verts.new(mm(*(p + s + d))))
	v000, v001, v010, v011, v100, v101, v110, v111 = corners
	for face in [(v000, v010, v110, v100), (v001, v101, v111, v011), (v000, v100, v101, v001), (v010, v011, v111, v110), (v000, v001, v011, v010), (v100, v110, v111, v101)]:
		bm.faces.new(face)


def kumiko_lantern():
	dark = material('KumikoFrame', (0.06, 0.035, 0.02), roughness=0.55)
	light = material('KumikoLattice', (0.6, 0.44, 0.27), roughness=0.6)
	paper = material('LanternPaper', (1.0, 0.92, 0.8), roughness=0.9, emission=(1.0, 0.6, 0.28))
	paper.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 5.0
	OUT, POST, H, BASE = 70.0, 11.0, 240.0, 16.0

	parts = [box('KumikoBase', mm(2 * OUT - 6, 2 * OUT - 6, BASE), mm(0, 0, BASE / 2), dark, bevel=1.2 * U)]
	for sx in (-1, 1):
		for sy in (-1, 1):
			parts.append(box('KumikoPost', mm(POST, POST, H - BASE), mm(sx * (OUT - POST / 2), sy * (OUT - POST / 2), BASE + (H - BASE) / 2), dark, bevel=0.8 * U))
	for z in (BASE + 4, H - 5):
		for axis in ('x', 'y'):
			for s in (-1, 1):
				size = mm(2 * OUT, POST, 8) if axis == 'x' else mm(POST, 2 * OUT, 8)
				loc = mm(0, s * (OUT - POST / 2), z) if axis == 'x' else mm(s * (OUT - POST / 2), 0, z)
				parts.append(box('KumikoRail', size, loc, dark, bevel=0.8 * U))
	frame = join(parts, 'KumikoFrame')

	inner = OUT - POST
	z0, z1 = BASE + 8, H - 9
	panel_h = z1 - z0
	panels = [
		(Vector((-inner, -OUT + 3, z0)), Vector((1, 0, 0)), Vector((0, 0, 1)), Vector((0, -1, 0)), 2 * inner, panel_h),
		(Vector((inner, OUT - 3, z0)), Vector((-1, 0, 0)), Vector((0, 0, 1)), Vector((0, 1, 0)), 2 * inner, panel_h),
		(Vector((-OUT + 3, inner, z0)), Vector((0, -1, 0)), Vector((0, 0, 1)), Vector((-1, 0, 0)), 2 * inner, panel_h),
		(Vector((OUT - 3, -inner, z0)), Vector((0, 1, 0)), Vector((0, 0, 1)), Vector((1, 0, 0)), 2 * inner, panel_h),
		(Vector((-inner, -inner, H - 2)), Vector((1, 0, 0)), Vector((0, 1, 0)), Vector((0, 0, 1)), 2 * inner, 2 * inner),
	]
	bm = bmesh.new()
	for origin, u, v, n, w, h in panels:
		for a, b in asanoha_segments(w, h, 34.0):
			add_bar(bm, a, b, (origin, u, v, n), 1.3, 4.0)
		# A slim inner border around each panel.
		for a, b in [(Vector((0, 0)), Vector((w, 0))), (Vector((w, 0)), Vector((w, h))), (Vector((w, h)), Vector((0, h))), (Vector((0, h)), Vector((0, 0)))]:
			add_bar(bm, a, b, (origin, u, v, n), 2.5, 4.0)
	mesh = bpy.data.meshes.new('KumikoLattice')
	bm.to_mesh(mesh)
	bm.free()
	lattice = link(bpy.data.objects.new('KumikoLattice', mesh))
	lattice.data.materials.append(light)

	# Washi paper behind the lattice: lets the bulb's light through in the bake, glows on the site.
	paper_box = box('LanternPaper', mm(2 * inner + 4, 2 * inner + 4, panel_h), mm(0, 0, z0 + panel_h / 2), paper)
	paper_box.visible_shadow = False
	return [frame, lattice], paper_box, mm(0, 0, z0 + panel_h * 0.45)


def alarm_clock():
	"""Placeholder: an '80s LED alarm clock, a wedge of dark plastic with a smoked face and red digits."""
	body_mat = material('ClockBody', (0.05, 0.04, 0.035), roughness=0.45)
	face_mat = material('ClockFace', (0.02, 0.004, 0.004), roughness=0.08)
	led = material('ClockLED', (1.0, 0.06, 0.03), roughness=0.4, emission=(1.0, 0.08, 0.03))
	led.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 8.0
	body = slab('ClockBody', scaled([(-70, 30), (-70, -32), (70, -32), (70, 30)]), 0, 62 * U, (0, 0, 0), body_mat, bevel=4 * U)
	face = box('ClockFace', mm(118, 2, 40), mm(0, -33, 31), face_mat, bevel=1 * U)
	digits = label('ClockDigits', '12:34', 30, (0, 0, 0), led, 'C:/Windows/Fonts/bahnschrift.ttf')
	digits.rotation_euler = (math.radians(90), 0, 0)
	digits.location = mm(0, -34.2, 31)
	return join([body, face], 'AlarmClock'), digits


# Mid-century furniture: oak, soft radiused edges, splayed tapered legs.


def tapered_leg(name, top, bottom, r_top, r_bottom, mat):
	"""A round tapered leg from point `top` to point `bottom` (scene units)."""
	top, bottom = Vector(top), Vector(bottom)
	axis = top - bottom
	bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=r_bottom, radius2=r_top, depth=axis.length, location=(top + bottom) / 2)
	leg = bpy.context.active_object
	leg.rotation_euler = axis.to_track_quat('Z', 'Y').to_euler()
	bpy.ops.object.transform_apply(rotation=True)
	return finish(leg, name, mat, bevel=min(r_bottom, r_top) * 0.4, segments=2)


def mcm_nightstand(oak):
	"""A 560 x 420 x 700 mm mid-century nightstand: a radiused oak case with a drawer over an open
	shelf, on four splayed tapered legs. Built with the floor at z = 0, centred on the origin."""
	W, D, Z0, Z1 = 560.0, 420.0, 290.0, 700.0
	body = box('NightstandCase', mm(W, D, Z1 - Z0), mm(0, 0, (Z0 + Z1) / 2), oak, bevel=12 * U, segments=4)
	apply_modifiers(body)
	# The open shelf below the drawer.
	cut(body, box('cutter', mm(W - 56, D, 180), mm(0, -40, 412), None, bevel=6 * U))
	# A shallow recess for the drawer front, so it reads with a shadow gap all round.
	cut(body, box('cutter', mm(W - 52, 20, 160), mm(0, -D / 2, 604), None))
	drawer = box('NightstandDrawer', mm(W - 60, 18, 152), mm(0, -D / 2 + 4, 604), oak, bevel=3 * U)
	apply_modifiers(drawer)
	# A sculpted finger pull along the drawer's top edge.
	cut(drawer, box('cutter', mm(150, 40, 36), mm(0, -D / 2 - 8, 682), None, bevel=10 * U))
	parts = [body, drawer]
	for sx in (-1, 1):
		for sy in (-1, 1):
			x, y = sx * (W / 2 - 60), sy * (D / 2 - 60)
			splay = 300 * math.tan(math.radians(7)) / math.sqrt(2)
			parts.append(tapered_leg('NightstandLeg', mm(x, y, Z0 + 10), mm(x + sx * splay, y + sy * splay, 0), 17 * U, 10 * U, oak))
	return join(parts, 'Nightstand')


def clock_radio(woodgrain):
	"""An '80s digital clock radio, after the GE 7-4612: a dark brown case with a woodgrain top cut by
	speaker slots, a snooze bar, slide switches, a red LED display and an AM/FM dial strip.
	Built facing -Y, sitting at z = 0. Returns (body, display plane, preview digits, moving parts):
	the snooze bar, five slide switches (ClockSwitch0-4) and the tuning wheel are separate objects."""
	plastic = material('ClockPlastic', (0.03, 0.022, 0.018), roughness=0.45)
	smoke = material('ClockGlass', (0.035, 0.004, 0.004), roughness=0.06)
	dial = material('ClockDial', (0.012, 0.01, 0.01), roughness=0.1)
	ink = material('ClockPrint', (0.72, 0.68, 0.6), roughness=0.5)
	red = material('ClockPointer', (0.8, 0.05, 0.03), roughness=0.4)
	W, D, H = 262.0, 120.0, 66.0

	body = box('ClockCase', mm(W, D, H), mm(0, 0, H / 2), plastic, bevel=5 * U, segments=3)
	top = box('ClockTop', mm(W - 14, D - 26, 4), mm(0, 8, H + 1.2), woodgrain, bevel=1.2 * U)
	apply_modifiers(top)
	# Speaker slots across most of the top.
	for k in range(9):
		cut(top, box('cutter', mm(158, 3.2, 8), mm(-38, 34 - k * 7.2, H + 3), None, bevel=1.2 * U))
	parts = [body, top]
	moving = [box('ClockSnooze', mm(66, 14, 7), mm(78, 30, H + 5), plastic, bevel=3 * U)]
	# A row of slide switches along the front of the top, each in its own slot.
	for k in range(5):
		x = -110 + k * 22
		cut(top, box('cutter', mm(8, 18, 8), mm(x, -D / 2 + 21, H + 3), None))
		moving.append(box(f'ClockSwitch{k}', mm(6, 7, 6), mm(x, -D / 2 + 17, H + 2), plastic, bevel=1.5 * U))
	# The tuning wheel, a ribbed thumbwheel standing proud of the right end.
	wheel = cylinder('ClockWheel', 15 * U, 6 * U, mm(W / 2 - 1, -18, 36), plastic, rot=(0, math.radians(90), 0), bevel=1 * U, verts=40)
	apply_modifiers(wheel)
	for k in range(20):
		a = 2 * math.pi * k / 20
		cut(wheel, box('cutter', mm(8, 1.4, 3), mm(W / 2 - 1, -18 + 15.5 * math.cos(a), 36 + 15.5 * math.sin(a)), None, rot=(a, 0, 0)))
	moving.append(wheel)
	# The front: a smoked display window on the left, the dial strip on the right.
	parts.append(box('ClockWindow', mm(96, 0.8, 34), mm(-62, -D / 2 - 0.2, 32), smoke, bevel=0.3 * U))
	parts.append(box('ClockDialStrip', mm(118, 2, 24), mm(58, -D / 2 - 0.6, 32), dial, bevel=1 * U))
	z = -D / 2 - 1.8
	for name, body_text, size, x, zz in [
		('ClockFM', 'FM 88  92  96  100  104  108', 3.4, 58, 37),
		('ClockAM', 'AM 55  65  80  100  130  160', 3.4, 58, 27),
		('ClockLabelAM', 'AM', 3.0, -120, 40),
		('ClockLabelPM', 'PM', 3.0, -120, 24),
	]:
		text = label(name, body_text, size, (0, 0, 0), ink, 'C:/Windows/Fonts/arialbd.ttf')
		text.rotation_euler = (math.radians(90), 0, 0)
		text.location = mm(x, z, zz)
		parts.append(text)
	parts.append(box('ClockPointerLine', mm(1.2, 1, 20), mm(70, z, 32), red))
	body = join(parts, 'ClockRadio')

	# The display: the site draws the visitor's time onto this plane; the digits are for previews.
	w, h = 86 * U / 2, 26 * U / 2
	mesh = bpy.data.meshes.new('ClockDisplay')
	mesh.from_pydata([(-w, 0, -h), (w, 0, -h), (w, 0, h), (-w, 0, h)], [], [(0, 1, 2, 3)])
	uv = mesh.uv_layers.new(name='UVMap')
	for li, (u, v) in zip(range(4), [(0, 0), (1, 0), (1, 1), (0, 1)]):
		uv.data[li].uv = (u, v)
	display = finish(link(bpy.data.objects.new('ClockDisplay', mesh)), 'ClockDisplay', material('ClockDisplay', (0.02, 0.0, 0.0), roughness=0.3))
	display.location = mm(-62, -D / 2 - 0.8, 32)
	led = material('ClockLED', (1.0, 0.05, 0.02), emission=(1.0, 0.07, 0.02))
	led.node_tree.nodes['Principled BSDF'].inputs['Emission Strength'].default_value = 10.0
	digits = label('ClockDigits', '1:10', 26, (0, 0, 0), led, 'C:/Windows/Fonts/bahnschrift.ttf')
	digits.rotation_euler = (math.radians(90), 0, 0)
	digits.location = mm(-62, -D / 2 - 1.0, 32)
	return body, display, digits, moving
