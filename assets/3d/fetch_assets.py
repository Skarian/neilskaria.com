"""Download the CC0 Poly Haven assets used by build_scene.py into a local cache (outside the repo).

    python -I assets/3d/fetch_assets.py <cache_dir>

Everything listed here is CC0 (public domain): https://polyhaven.com/license
"""

import json
import sys
import urllib.request
from pathlib import Path

MODELS = [
	'potted_plant_02',
]
TEXTURES = [
	'herringbone_parquet',
	'beige_wall_001',
	'waffle_pique_cotton',
	'rough_linen',
	'velour_velvet',
	'oak_veneer_01',
	'american_walnut_veneer',
	'curly_teddy_natural',
]
TEXTURE_MAPS = {'Diffuse': 'diff', 'nor_gl': 'nor', 'Rough': 'rough'}


def get(url, dest):
	if dest.exists():
		return
	dest.parent.mkdir(parents=True, exist_ok=True)
	req = urllib.request.Request(url, headers={'User-Agent': 'neilskaria.com-build'})
	with urllib.request.urlopen(req, timeout=60) as res:
		dest.write_bytes(res.read())
	print('downloaded', dest)


def files(asset_id):
	req = urllib.request.Request(f'https://api.polyhaven.com/files/{asset_id}', headers={'User-Agent': 'neilskaria.com-build'})
	with urllib.request.urlopen(req, timeout=60) as res:
		return json.load(res)


def main(cache):
	for asset_id in MODELS:
		data = files(asset_id)
		if 'gltf' not in data:
			print('no glTF available, skipped', asset_id)
			continue
		gltf = data['gltf']['1k']['gltf']
		folder = cache / 'models' / asset_id
		get(gltf['url'], folder / f'{asset_id}.gltf')
		for name, info in gltf['include'].items():
			get(info['url'], folder / name)

	for asset_id in TEXTURES:
		data = files(asset_id)
		for key, short in TEXTURE_MAPS.items():
			get(data[key]['1k']['jpg']['url'], cache / 'textures' / asset_id / f'{short}.jpg')


if __name__ == '__main__':
	main(Path(sys.argv[1]))
