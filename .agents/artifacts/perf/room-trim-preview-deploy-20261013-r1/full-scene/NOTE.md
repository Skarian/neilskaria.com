# Full-scene BEFORE/AFTER model renders

Inspection renders of the whole GLB, not app screenshots. Throwaway viewer `tools/fullscene/` (local only, never deployed) using E's existing three 0.186.1 GLTFLoader + DRACOLoader. No install.

- BEFORE = original `bedroom.glb`, 1,183,392 B, SHA-256 `4d83841d3b7892e9d4cdb0a2d47b574ccd30b58f52207575a6d91401a4861bf4` (103 meshes, 223,809 tris).
- AFTER = trimmed `bedroom.glb`, 948,532 B, SHA-256 `2df7922e64bf9f9ba88178520a861921dc22a924fe8f20d2b1dca638917f4335` (83 meshes, 182,905 tris).
- Both rendered unmodified. No meshes were excluded and no parts were moved. Original GLB materials and embedded textures were used.
- **Lighting is inspection-only and differs from the app.** It uses a hemisphere light (2.2) and a directional light (1.6) with no tone mapping. The app's baked lightmaps and lighting are not applied, so the room looks flatter and brighter than in the app.
- Identical camera for each pair: 1600×1000, DPR 1, perspective, vertical FOV 40°, near 0.5, far 1000, up +Y. The framing comes from the BEFORE (union) bounds min [-35.5, -7.54, -8.9], max [25.0, 27.35, 43.0]. The open side is the front (+Z) and above. The back wall is at z≈-3 and the side wall is at x=-35.5.
  - `wide-three-quarter-front-right`: position [52, 26, 92], target [-5.25, 6, 14].
  - `high-overhead-front`: position [4, 104, 80], target [-5.25, 0, 12].
  (`cameras.json` holds the exact values.)
- Gone in AFTER (20 nodes): duvet, far pillow, cushion, 4 bed legs, rug, left wall, wall above the window, side wall, window frame, far curtain, curtain rod, sky. The headboard, mattress, bed frame, near pillow, sheet fold, near curtain, right/far walls, wall below the window, floor and skirting remain. In the app, the camera never sees the removed parts (0 sampled ID pixels; see E and F).
- `compare-wide.png` and `compare-high.png` show BEFORE on the left and AFTER on the right.
