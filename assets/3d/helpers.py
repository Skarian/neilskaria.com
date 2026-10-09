"""Small Blender helpers shared by build_scene.py, gba_sp.py and sp_preview.py."""

import math

import bmesh
import bpy


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


def finish(obj, name, mat, bevel=0.0, segments=4, parent=None, angle=None):
	"""Name, material, optional bevel (all edges, or only edges sharper than `angle` degrees), smooth shading."""
	obj.name = name
	obj.data.name = name
	if mat:
		obj.data.materials.append(mat)
	if bevel > 0:
		mod = obj.modifiers.new('bevel', 'BEVEL')
		mod.width = bevel
		mod.segments = segments
		if angle is None:
			mod.limit_method = 'NONE'
		else:
			mod.limit_method = 'ANGLE'
			mod.angle_limit = math.radians(angle)
	for poly in obj.data.polygons:
		poly.use_smooth = True
	obj.data.use_auto_smooth = True
	obj.data.auto_smooth_angle = math.radians(40)
	if parent:
		set_parent(obj, parent)
	return obj


def set_parent(obj, parent):
	# Objects made through bpy.data have a stale matrix_world until the view layer updates.
	bpy.context.view_layer.update()
	world = obj.matrix_world.copy()
	obj.parent = parent
	obj.matrix_world = world


def link(obj):
	bpy.context.scene.collection.objects.link(obj)
	return obj


def box(name, size, loc, mat, bevel=0.0, segments=4, parent=None, rot=(0, 0, 0)):
	bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
	obj = bpy.context.active_object
	obj.scale = size
	bpy.ops.object.transform_apply(scale=True)
	return finish(obj, name, mat, bevel, segments, parent)


def cylinder(name, radius, depth, loc, mat, rot=(0, 0, 0), bevel=0.0, parent=None, verts=40, segments=3):
	bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=radius, depth=depth, location=loc, rotation=rot)
	return finish(bpy.context.active_object, name, mat, bevel, segments, parent)


def empty(name, loc=(0, 0, 0), parent=None):
	obj = link(bpy.data.objects.new(name, None))
	obj.location = loc
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
	bpy.context.scene.cursor.location = point
	bpy.ops.object.origin_set(type='ORIGIN_CURSOR')


def apply_modifiers(obj):
	depsgraph = bpy.context.evaluated_depsgraph_get()
	mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
	obj.modifiers.clear()
	obj.data = mesh


def rounded_rect(w, d, r, steps=8):
	"""Outline points of a w x d rectangle with corner radius r, centred on the origin."""
	pts = []
	for cx, cy, start in [(w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180), (w / 2 - r, -d / 2 + r, 270)]:
		for i in range(steps + 1):
			a = math.radians(start + 90 * i / steps)
			pts.append((cx + r * math.cos(a), cy + r * math.sin(a)))
	return pts


def slab(name, outline, z0, z1, loc, mat, bevel=0.0, segments=4, parent=None):
	"""Extrude a closed 2D outline between z0 and z1; bevel only the top and bottom rims."""
	mesh = bpy.data.meshes.new(name)
	bm = bmesh.new()
	bottom = [bm.verts.new((x, y, z0)) for x, y in outline]
	top = [bm.verts.new((x, y, z1)) for x, y in outline]
	n = len(outline)
	for i in range(n):
		bm.faces.new((bottom[i], bottom[(i + 1) % n], top[(i + 1) % n], top[i]))
	bm.faces.new(list(reversed(bottom)))
	bm.faces.new(top)
	bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
	bm.to_mesh(mesh)
	bm.free()
	obj = link(bpy.data.objects.new(name, mesh))
	obj.location = loc
	return finish(obj, name, mat, bevel, segments, parent, angle=60)


def cut(obj, cutter, keep_cutter=False):
	"""Boolean-subtract `cutter` from `obj` and apply it."""
	mod = obj.modifiers.new('cut', 'BOOLEAN')
	mod.operation = 'DIFFERENCE'
	mod.solver = 'EXACT'
	mod.object = cutter
	apply_modifiers(obj)
	if not keep_cutter:
		bpy.data.objects.remove(cutter)


def text(name, body, size, loc, mat, rot=(0, 0, 0), parent=None, align='CENTER'):
	curve = bpy.data.curves.new(name, 'FONT')
	curve.body = body
	curve.size = size
	curve.align_x = align
	curve.align_y = 'CENTER'
	obj = link(bpy.data.objects.new(name, curve))
	obj.location = loc
	obj.rotation_euler = rot
	depsgraph = bpy.context.evaluated_depsgraph_get()
	mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
	bpy.data.objects.remove(obj)
	out = link(bpy.data.objects.new(name, mesh))
	out.location = loc
	out.rotation_euler = rot
	out.data.materials.append(mat)
	if parent:
		set_parent(out, parent)
	return out


def bake_albedo(obj, size, out_dir):
	"""Bake a procedural material's colour into an image texture (glTF can't carry procedural shaders)."""
	scene = bpy.context.scene
	saved = (scene.render.engine, scene.cycles.samples)
	scene.render.engine = 'CYCLES'
	scene.cycles.samples = 4
	if not obj.data.uv_layers:
		obj.data.uv_layers.new(name='UVMap')
		select([obj])
		bpy.ops.object.mode_set(mode='EDIT')
		bpy.ops.mesh.select_all(action='SELECT')
		bpy.ops.uv.smart_project(angle_limit=1.15, island_margin=0.01)
		bpy.ops.object.mode_set(mode='OBJECT')
	img = bpy.data.images.new(f'{obj.name}Albedo', size, size)
	mat = obj.data.materials[0]
	nodes, links = mat.node_tree.nodes, mat.node_tree.links
	target = nodes.new('ShaderNodeTexImage')
	target.image = img
	nodes.active = target
	select([obj])
	bpy.ops.object.bake(type='DIFFUSE', pass_filter={'COLOR'}, margin=4, use_clear=True)
	out_dir.mkdir(parents=True, exist_ok=True)
	img.filepath_raw = str(out_dir / f'{obj.name}-albedo.png')
	img.file_format = 'PNG'
	img.save()
	bsdf = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
	output = next(n for n in nodes if n.type == 'OUTPUT_MATERIAL')
	for node in list(nodes):
		if node not in (bsdf, output, target):
			nodes.remove(node)
	links.new(target.outputs['Color'], bsdf.inputs['Base Color'])
	scene.render.engine, scene.cycles.samples = saved
