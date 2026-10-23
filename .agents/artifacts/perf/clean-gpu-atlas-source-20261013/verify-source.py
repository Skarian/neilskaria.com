"""Read-only source integrity check. Run with python -B; no app code executes."""
from pathlib import Path
import importlib.util, json, re
HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('source_port', HERE / 'prepare-source.py')
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
assert Path.cwd().resolve() == m.ROOT.resolve()
baseline, corrected = m.validate_inputs()
manifest = m.load(HERE / 'source-manifest.json')
actual = m.inventory(HERE / 'source')
# The new stage has no generated caches or unlisted files.
all_paths = {p.relative_to(HERE/'source').as_posix() for p in (HERE/'source').rglob('*') if p.is_file()}
assert all_paths == {f['path'] for f in manifest['files']}
assert len(actual) == manifest['filesTotal'] == 94
assert [f['path'] for f in manifest['files']] == sorted(f['path'] for f in manifest['files'])
assert m.digest(actual) == manifest['stageDigest']
assert sum(f['bytes'] for f in actual) == manifest['bytesTotal']
assert actual == [{k:f[k] for k in ['path','bytes','sha256']} for f in manifest['files']]
base_by_path = {f['path']:f for f in baseline['files']}
assert all_paths == set(base_by_path) | set(m.ADDED)
for f in manifest['files']:
    base = base_by_path.get(f['path'])
    assert f['baselineSha256'] == (base['sha256'] if base else None)
    assert f['added'] == (base is None)
    assert f['changed'] == bool(base and base['sha256'] != f['sha256'])
    if base and f['path'] != m.ENGINE: assert f['sha256'] == base['sha256']
assert [f['path'] for f in manifest['files'] if f['changed']] == [m.ENGINE]
assert [f['path'] for f in manifest['files'] if f['added']] == m.ADDED
old = (m.ATLAS/'src/lib/boot/boot-atlas.ts').read_text(encoding='utf-8')
new = (HERE/'source/src/lib/boot/boot-atlas.ts').read_text(encoding='utf-8')
assert m.visual_blocks(old) == m.visual_blocks(new)
# Exact atlas correspondence: diagnostics alone are removed; immediate catch remains.
expected = old.replace("import { diagnostic as diag } from './diagnostic';\n", '')
expected = expected.replace("\ttexture.onUpdate = () => diag?.textureSubmission('atlas');\n", '')
start=expected.index("\tdiag?.mark('atlas-fetch-start'")
end=expected.index('\tlet disposed = false;', start)
expected=expected[:start]+expected[end:]
expected=expected.replace("\tvoid ready.catch((error: unknown) => {\n\t\tdiag?.mark('atlas-readiness-failed', { error: String(error), disposed });\n\t});", '\tvoid ready.catch(() => {});')
start=expected.index('\t\tsubmitted(')
end=expected.index('\t\tdispose() {', start)
expected=expected[:start]+expected[end:]
expected=re.sub(r'^.*diag\?\..*\n','',expected,flags=re.M)
assert expected == new
for p in ['public/boot-atlas.png','src/lib/boot/boot-atlas-metrics.json']:
    assert (HERE/'source'/p).read_bytes() == (m.ATLAS/p).read_bytes()
engine=(HERE/'source'/m.ENGINE).read_text(encoding='utf-8')
old_engine=(m.ATLAS/m.ENGINE).read_text(encoding='utf-8')
start=old_engine.index('\ttry {\n\t\tawait Promise.all([...lightmapsIn, portraitIn,')
end=old_engine.index('\tonProgress(0.9);',start)
cleanup=old_engine[start:end]
cleanup=cleanup.replace('...(gpuScreen ? [gpuScreen.ready] : [])','gpuScreen.ready')
cleanup=re.sub(r'^.*diag\?\..*\n','',cleanup,flags=re.M)
cleanup=cleanup.replace('\t\tgpuScreen?.dispose();','\t\tgpuScreen.dispose();')
for line in ['\t\tif (screenTexture) textures.add(screenTexture);\n','\t\textraScreenMaterial?.dispose();\n','\t\tscreenMaterial.dispose();\n']:
    cleanup=cleanup.replace(line,'')
start=engine.index('\ttry {\n\t\tawait Promise.all([...lightmapsIn, portraitIn,')
end=engine.index('\tonProgress(0.9);',start)
assert cleanup == engine[start:end]
for text in ['diagnostic','context-control','bootCanvasMode','bootCanvasOptions','screenCanvas','screenCtx','screenTexture','screenMaterial','extraScreenMaterial','drawBootScreen','submitted(','onAfterRender','diag?.']:
    assert text not in engine
for text in ['diagnostic','diag?.','submitted(','onUpdate','onAfterRender']:
    assert text not in new
assert m.load(HERE/'identity-before.json') == m.load(HERE/'identity-after.json') == m.state()
print(json.dumps({'status':'PASS: source integrity only','files':94,'stageDigest':manifest['stageDigest'],'baselineGitBytes':91,'correctedManifestFiles':96,'atlasAndFailureCleanupCorrespondence':True,'mainAndPriorSourceIdentitiesUnchanged':True,'runtimeValidation':'PENDING'},indent=2))
