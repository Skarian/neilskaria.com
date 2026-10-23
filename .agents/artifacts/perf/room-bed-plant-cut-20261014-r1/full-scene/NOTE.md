# Full-scene GLB model inspection views: c2s (deployed) vs cut-d-ring2

GLB model inspection views rendered with Three.js in owned headless Chrome. **Not Blender screenshots, not app screenshots**:
no lightmaps, neutral inspection lighting. They show the model geometry only, including parts the app camera never sees.

- BEFORE = `../room-nonbonsai-preview-deploy-20261014-r1/upload-stage/src/lib/boot/assets/bedroom.glb`, 881,512 B, SHA-256 `5110090d…5ed2`, 83 meshes / 171,378 tris.
- AFTER = `../accepted/bedroom.glb` (cut-d-ring2), 833,884 B, SHA-256 `715a3699…a059`, 83 meshes / 165,933 tris.
- `tools/fullscene/server.mjs` checks both hashes before serving (log: `HASH OK` for both, `logs/shots-*/result.json`).
- Cameras: `cameras.json` is a byte copy of L's (SHA `06f4cc65…8468`); viewer is a byte copy of L's (SHA `297e87d3…25ee4`): 1600×1000, FOV 40°, hemisphere 2.2 + directional 1.6, no tone mapping, background #d9d9d9.
- Renderer check: BEFORE here vs L's `AFTER-*.png` (the same c2s GLB): 1 of 1,600,000 px differs (Δ1) in each angle.
- BEFORE vs AFTER: wide 11,293 px (0.71%), high 9,137 px (0.57%). Visible in these angles: the bed frame's foot rail and outer side and the mattress foot/side faces are gone (floor shows through), the sheet-fold front is shortened, and a chunk of the pot's lower front (the side toward the bed, behind the nightstand in the app) is open. Other removed faces (pillow, headboard, a few leaf cards) face away from these cameras. Zoom crops: `logs/zoom-BEFORE-wide-bed-plant.png`, `logs/zoom-AFTER-wide-bed-plant.png` (x2, nearest).
- `SHEET-*.png`: BEFORE | AFTER side by side, 50% scale.
