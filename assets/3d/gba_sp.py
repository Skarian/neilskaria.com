"""A red Game Boy Advance SP (AGS-001), modelled from reference photos at real size.

Measurements are in millimetres and converted to scene units (1 unit = 10 cm) at the end of each call.
Layout reference: the console closed, centred on the origin, base below z = 0, lid above it,
front (cartridge edge) at -Y and the hinge at +Y. The site code relies on the object names
SP, Lid, Screen, Cartridge and PowerLed, and on the material name ShellRed.
"""

import math

import bpy
from mathutils import Vector

from helpers import apply_modifiers, box, cut, cylinder, empty, finish, material, rounded_rect, set_origin, set_parent, slab, text

U = 0.01  # millimetres to scene units

W, D = 84.6, 82.0  # footprint
CORNER = 5.5  # plan corner radius
BASE_H = 14.4
LID_H = 9.3
GAP = 0.9  # between the base and the lid's inner face when closed (the screen cover fills most of it)
HINGE_Y, HINGE_R = 36.0, 5.4
LID_BACK = HINGE_Y - HINGE_R - 0.4  # the lid stops just short of the barrel, leaving a thin seam
HINGE_Z = GAP + LID_H / 2


def mm(*v):
	return tuple(c * U for c in v)


def outline(w, d, r, steps=8):
	return [(x * U, y * U) for x, y in rounded_rect(w, d, r, steps)]


def stadium(length, width):
	return outline(length, width, width / 2 - 0.01, 10)


def rotated(points, degrees, centre):
	a = math.radians(degrees)
	return [(centre[0] + x * math.cos(a) - y * math.sin(a), centre[1] + x * math.sin(a) + y * math.cos(a)) for x, y in points]


def cutter_slab(name, points, z0, z1, loc=(0, 0, 0), bevel=0.0):
	return slab(name, points, z0 * U, z1 * U, mm(*loc), None, bevel * U)


def cutter_box(size, loc, bevel=0.0):
	return box('cutter', mm(*size), mm(*loc), None, bevel * U)


def cutter_cyl(radius, z0, z1, x, y, bevel=0.0):
	return cylinder('cutter', radius * U, (z1 - z0) * U, mm(x, y, (z0 + z1) / 2), None, bevel=bevel * U, verts=48)


def joined(objs):
	bpy.ops.object.select_all(action='DESELECT')
	for o in objs:
		o.select_set(True)
	bpy.context.view_layer.objects.active = objs[0]
	bpy.ops.object.join()
	return bpy.context.active_object


def groove_frame(w, d, r, z, width=0.35, height=0.4):
	"""A thin ring hugging the outside of a rounded footprint, for cutting seam lines."""
	frame = cutter_slab('seam', outline(w + 6, d + 6, r + 3), z - height / 2, z + height / 2)
	cut(frame, cutter_slab('seam-inner', outline(w - 2 * width, d - 2 * width, r - width), z - 1, z + 1))
	return frame


def build():
	# Flame red: a pinkish metallic crimson, sampled from a photo of the Flame edition.
	shell = material('ShellRed', (0.4, 0.045, 0.06), roughness=0.3, metallic=0.45)
	grey = material('Button', (0.035, 0.035, 0.04), roughness=0.45)
	cover_mat = material('ScreenCover', (0.012, 0.012, 0.015), roughness=0.06)
	lcd_frame = material('LcdFrame', (0.035, 0.038, 0.035), roughness=0.3)
	screen_mat = material('Screen', (0.92, 0.92, 0.9), roughness=0.4)
	print_mat = material('Print', (0.62, 0.6, 0.6), roughness=0.5)
	rubber = material('Rubber', (0.2, 0.015, 0.02), roughness=0.85)
	led = material('Led', (0.1, 0.12, 0.1), roughness=0.3)
	dark = material('SlotDark', (0.01, 0.01, 0.01), roughness=0.7)
	cart_mat = material('CartGrey', (0.045, 0.045, 0.05), roughness=0.45)
	label_mat = material('CartLabel', (0.95, 0.86, 0.9), roughness=0.6)

	sp = empty('SP')

	# Base shell, with its controls recessed into the top face.
	base = slab('Base', outline(W, D, CORNER), -BASE_H * U, 0, (0, 0, 0), shell, bevel=1.6 * U)
	apply_modifiers(base)

	dpad = (-21.0, 6.5)
	ab_centre, ab_angle = (20.0, 4.5), 14
	select_pos, start_pos = (-7.2, -31.5), (7.2, -31.5)
	light = (0.0, 24.0)

	cuts = [
		cutter_cyl(12.8, -0.9, 1.0, *dpad, bevel=0.6),
		cutter_slab('ab-well', rotated(stadium(31, 15), ab_angle, (0, 0)), -1.1, 1.0, (*ab_centre, 0), bevel=0.6),
		cutter_cyl(3.8, -1.0, 1.0, *light, bevel=0.4),
		cutter_cyl(5.0, -1.1, 1.0, *select_pos, bevel=0.5),
		cutter_cyl(5.0, -1.1, 1.0, *start_pos, bevel=0.5),
		# Cartridge slot: open at the front and the bottom, between the two front feet.
		cutter_box((63, 36, 10), (0, -41 + 16, -BASE_H + 4), bevel=0.4),
		# Power-switch pocket on the right side, near the front.
		cutter_box((5, 11, 7), (W / 2 + 0.5, -24.5, -7.5), bevel=0.6),
		# Charge port on the back face.
		cutter_box((9, 6, 4), (0, D / 2, -9), bevel=0.4),
		# Notches at the back corners for the L and R buttons.
		cutter_box((13, 8, 9.5), (-W / 2 + 5.5, D / 2 - 3, -7.5), bevel=1.5),
		cutter_box((13, 8, 9.5), (W / 2 - 5.5, D / 2 - 3, -7.5), bevel=1.5),
		# Two LED windows on the right edge of the top face.
		cutter_box((1.2, 2.0, 1.0), (39.3, 22.0, 0)),
		cutter_box((1.2, 2.0, 1.0), (39.3, 18.4, 0)),
		# Battery door outline and screw holes underneath.
		groove_frame(46, 30, 2, -BASE_H, width=0.4, height=0.8),
		groove_frame(W, D, CORNER, -5.0),
	]
	# The battery-door groove is a frame around a 46 x 30 rectangle on the underside, offset towards the back.
	cuts[-2].location = mm(0, 8, 0)
	# Speaker: a staggered grid of small holes between the controls.
	holes = []
	for row, y in enumerate([-8.6, -11.2, -13.8, -16.4, -19.0]):
		xs = [-3.9, -1.3, 1.3, 3.9] if row % 2 == 0 else [-2.6, 0.0, 2.6]
		holes += [cutter_cyl(0.55, -1.5, 1.0, x, y) for x in xs]
	cuts.append(joined(holes))
	for x, y in [(-36, -34), (36, -34), (-36, 34), (36, 34), (0, 21)]:
		cuts.append(cutter_cyl(1.1, -BASE_H - 1, -BASE_H + 0.8, x, y))
	for c in cuts:
		cut(base, c)
	finish(base, 'Base', None, parent=sp)

	cross = [box('DPadH', mm(17.5, 6.0, 2.2), mm(*dpad, 0.2), grey, bevel=0.9 * U), box('DPadV', mm(6.0, 17.5, 2.2), mm(*dpad, 0.2), grey, bevel=0.9 * U)]
	for c in cross:
		apply_modifiers(c)
	finish(joined(cross), 'DPad', None, parent=sp)

	a = math.radians(ab_angle)
	for name, offset in [('ButtonA', 7.6), ('ButtonB', -7.6)]:
		x, y = ab_centre[0] + offset * math.cos(a), ab_centre[1] + offset * math.sin(a)
		cylinder(name, 4.7 * U, 2.6 * U, mm(x, y, 0.1), grey, bevel=1.0 * U, parent=sp, verts=48, segments=4)
	cylinder('ButtonLight', 2.4 * U, 1.4 * U, mm(*light, -0.1), grey, bevel=0.5 * U, parent=sp, verts=32)
	for name, pos in [('ButtonSelect', select_pos), ('ButtonStart', start_pos)]:
		cylinder(name, 2.8 * U, 1.5 * U, mm(*pos, -0.15), grey, bevel=0.6 * U, parent=sp, verts=32)
	text('LabelSelect', 'SELECT', 1.5 * U, mm(select_pos[0], -25.4, 0.01), print_mat, parent=sp)
	text('LabelStart', 'START', 1.5 * U, mm(start_pos[0], -25.4, 0.01), print_mat, parent=sp)
	box('PowerLed', mm(1.0, 1.8, 0.6), mm(39.3, 22.0, -0.4), led, parent=sp)
	box('ChargeLed', mm(1.0, 1.8, 0.6), mm(39.3, 18.4, -0.4), led, parent=sp)
	box('PowerSwitch', mm(2.2, 3.6, 2.6), mm(W / 2 - 1.2, -26.0, -7.5), grey, bevel=0.4 * U, parent=sp)
	box('ChargePort', mm(8, 1, 3), mm(0, D / 2 - 2.6, -9), dark, parent=sp)
	for x, y in [(0, 21)]:
		cylinder('BatteryScrew', 1.0 * U, 0.6 * U, mm(x, y, -BASE_H + 0.5), material('Screw', (0.5, 0.5, 0.52), roughness=0.3, metallic=1.0), parent=sp, verts=24)
	for side in (-1, 1):
		box('ShoulderL' if side < 0 else 'ShoulderR', mm(12.2, 7.4, 8.6), mm(side * (W / 2 - 5.6), D / 2 - 3.2, -7.5), grey, bevel=1.8 * U, segments=4, parent=sp)

	# Hinge barrel: two knuckles belong to the base, the middle one to the lid.
	# Breaks measured from the top-down photo: at the centre and about two thirds across.
	for name, x0, x1 in [('HingeLeft', -40.8, -0.3), ('HingeRight', 28.6, 40.8)]:
		cylinder(name, HINGE_R * U, (x1 - x0) * U, mm((x0 + x1) / 2, HINGE_Y, HINGE_Z), shell, rot=(0, math.radians(90), 0), bevel=1.2 * U, parent=sp, verts=48, segments=3)

	# Lid, built closed; its origin sits on the hinge axis so rotating about X opens it (negative opens).
	lid_d = LID_BACK + D / 2
	lid_cy = (LID_BACK - D / 2) / 2
	lid = slab('Lid', outline(W, lid_d, CORNER), GAP * U, (GAP + LID_H) * U, mm(0, lid_cy, 0), shell, bevel=1.6 * U)
	apply_modifiers(lid)
	seam = groove_frame(W, lid_d, CORNER, GAP + LID_H / 2)
	seam.location = mm(0, lid_cy, 0)
	for c in [seam, cutter_slab('badge', stadium(20, 6.5), GAP + LID_H - 0.25, GAP + LID_H + 1, (-21, -33.5, 0))]:
		cut(lid, c)
	set_origin(lid, mm(0, HINGE_Y, HINGE_Z))
	set_parent(lid, sp)
	cylinder('HingeLid', HINGE_R * U, 28.3 * U, mm(14.15, HINGE_Y, HINGE_Z), shell, rot=(0, math.radians(90), 0), bevel=1.2 * U, parent=lid, verts=48, segments=3)
	# The middle knuckle is part of the lid, so it joins the lid without a seam.
	box('HingeNeck', mm(27.6, 5.6, LID_H - 2.4), mm(14.15, LID_BACK + 2.2, HINGE_Z), shell, bevel=1.0 * U, parent=lid)
	slab('Badge', stadium(19.4, 6.0), (GAP + LID_H - 0.25) * U, (GAP + LID_H - 0.05) * U, mm(-21, -33.5, 0), material('BadgePlate', (0.08, 0.08, 0.09), roughness=0.3), parent=lid)

	# The inner face (facing -Z when closed): a glossy cover, the LCD window, five rubber bumpers.
	free_edge = -D / 2
	cover_cy = free_edge + (7.8 + 59.8) / 2
	lcd_cy = free_edge + 30.5
	# The cover sits on the lid's face; the LCD shows through a window in it, slightly recessed.
	cover = slab('ScreenCover', outline(72, 52, 2.5), (GAP - 0.45) * U, GAP * U, mm(0, cover_cy, 0), cover_mat, parent=None)
	cut(cover, cutter_slab('lcd-window', outline(62.5, 43.5, 0.8), GAP - 1, GAP + 0.1, (0, lcd_cy, 0)))
	set_parent(cover, lid)
	slab('LcdFrame', outline(62.5, 43.5, 0.8), (GAP - 0.25) * U, GAP * U, mm(0, lcd_cy, 0), lcd_frame, parent=lid)

	# Kept well clear of the LCD frame behind it so the two don't flicker through each other.
	bpy.ops.mesh.primitive_plane_add(size=1, location=mm(0, lcd_cy, GAP - 0.4), rotation=(math.pi, 0, 0))
	scr = bpy.context.active_object
	# The GBA screen is 61.2 x 40.8 mm.
	scr.scale = (61.2 * U, 40.8 * U, 1)
	bpy.ops.object.transform_apply(scale=True, rotation=True)
	scr.name = scr.data.name = 'Screen'
	scr.data.materials.append(screen_mat)
	set_parent(scr, lid)

	for i, (x, y) in enumerate([(-37.5, free_edge + 4.2), (0, free_edge + 4.2), (37.5, free_edge + 4.2), (-37.5, 25.2), (37.5, 25.2)]):
		cylinder(f'Bumper{i}', 2.3 * U, 0.9 * U, mm(x, y, GAP - 0.4), rubber, bevel=0.3 * U, parent=lid, verts=32)

	# Cartridge, inserted through the front and sitting about 2.5 mm proud, label facing down.
	front = -D / 2 - 2.5
	cart_z = -BASE_H + 3.9
	cart = box('Cartridge', mm(57.5, 35.0, 7.6), mm(0, front + 17.5, cart_z), cart_mat, bevel=0.8 * U, parent=sp)
	label = box('CartLabel', mm(47, 22, 0.2), mm(0, front + 15, cart_z - 3.85), label_mat)
	set_parent(label, cart)

	return {'sp': sp, 'lid': lid, 'screen': scr, 'cart': cart}
