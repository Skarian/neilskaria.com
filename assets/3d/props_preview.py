"""Render the table props on their own, from the reference photos' angles, for checking the models.

    blender --background --factory-startup --python assets/3d/props_preview.py -- <out_dir> [view ...]
"""

import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).parent))
import props  # noqa: E402
from helpers import bake_albedo, box, material  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1 :]
OUT = Path(argv[0])
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
props.build(lambda obj, size: bake_albedo(obj, size, OUT), 0.0)
box('Table', (8, 6, 0.2), (0, 0, -0.1), material('TableTop', (0.25, 0.15, 0.09), roughness=0.5))
box('Wall', (12, 0.2, 8), (0, 2.6, 3), material('WallPaint', (0.75, 0.75, 0.72), roughness=0.9))

world = bpy.data.worlds.new('Studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.7, 0.72, 0.75, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.7
scene.world = world
for loc, energy in [((3, -4, 6), 700), ((-5, -2, 4), 300)]:
	light = bpy.data.objects.new('Key', bpy.data.lights.new('Key', 'AREA'))
	light.data.energy = energy
	light.data.size = 3
	light.location = loc
	light.rotation_euler = (-Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
	scene.collection.objects.link(light)

scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 32
scene.eevee.use_gtao = True
scene.render.resolution_x, scene.render.resolution_y = 800, 800
scene.view_settings.view_transform = 'Filmic'
cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam'))
scene.collection.objects.link(cam)
scene.camera = cam

# name: (camera position, target, focal length)
VIEWS = {
	'cube': ((-1.95, -1.55, 1.3), (-2.15, -0.4, 0.28), 60),
	'tumbler': ((2.7, -2.6, 1.9), (1.9, -0.95, 0.75), 50),
	'watch': ((-0.75, -2.3, 0.75), (-1.05, -1.3, 0.3), 55),
	'watchside': ((0.0, -1.0, 0.35), (-1.05, -1.3, 0.3), 55),
	'bonsai': ((-1.7, -4.4, 1.4), (-1.7, 1.05, 1.2), 50),
	'table': ((3.0, -7.0, 3.2), (-0.3, 0.2, 0.6), 35),
}
for name in argv[1:] or list(VIEWS):
	eye, target, lens = VIEWS[name]
	cam.location = eye
	cam.data.lens = lens
	cam.data.clip_start = 0.005
	cam.rotation_euler = (Vector(target) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler()
	scene.render.filepath = str(OUT / f'{name}.png')
	bpy.ops.render.render(write_still=True)
	print('Rendered', name)
