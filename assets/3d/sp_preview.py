"""Render the GBA SP on its own from the reference photos' angles, for checking the model.

    blender --background --factory-startup --python assets/3d/sp_preview.py -- <out_dir> [view ...]
"""

import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

sys.path.insert(0, str(Path(__file__).parent))
import gba_sp  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1 :]
OUT = Path(argv[0])
OUT.mkdir(parents=True, exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
parts = gba_sp.build()

# Soft studio light, like the product photos.
world = bpy.data.worlds.new('Studio')
world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.6, 0.6, 0.62, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.6
scene.world = world
for loc, energy in [((0.6, -0.8, 1.2), 25), ((-0.9, -0.2, 0.8), 12), ((0.2, 0.9, 1.0), 10)]:
	light = bpy.data.objects.new('Key', bpy.data.lights.new('Key', 'AREA'))
	light.data.energy = energy
	light.data.size = 0.6
	light.location = loc
	light.rotation_euler = (-Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
	scene.collection.objects.link(light)

scene.render.engine = 'BLENDER_EEVEE'
scene.eevee.taa_render_samples = 32
scene.eevee.use_gtao = True
scene.eevee.use_ssr = True
scene.render.resolution_x = scene.render.resolution_y = 900
scene.view_settings.view_transform = 'Filmic'

cam = bpy.data.objects.new('Cam', bpy.data.cameras.new('Cam'))
scene.collection.objects.link(cam)
scene.camera = cam

# name: (lid open degrees, camera position mm, target mm, focal length)
VIEWS = {
	'evan': (125, (215, -340, 400), (0, -4, 12), 110),
	'top': (155, (0, -10, 600), (0, 10, 0), 70),
	'front': (115, (-60, -520, 120), (0, 0, 20), 120),
	'closed': (0, (-260, -300, 300), (0, 0, 0), 110),
	'right': (115, (520, -30, 60), (0, 0, 15), 110),
	'back': (0, (120, 520, 240), (0, 0, -3), 110),
	'under': (0, (-160, -300, -340), (0, 0, -8), 110),
}
wanted = argv[1:] or list(VIEWS)
for name in wanted:
	angle, eye, target, lens = VIEWS[name]
	parts['lid'].rotation_euler = (math.radians(-angle), 0, 0)
	cam.location = Vector(eye) * gba_sp.U
	cam.data.lens = lens
	cam.data.clip_start = 0.01
	cam.rotation_euler = (Vector(target) * gba_sp.U - cam.location).to_track_quat('-Z', 'Y').to_euler()
	scene.render.filepath = str(OUT / f'{name}.png')
	bpy.ops.render.render(write_still=True)
	print('Rendered', name)
