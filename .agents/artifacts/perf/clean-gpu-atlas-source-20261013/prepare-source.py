from pathlib import Path
import hashlib, json, subprocess, shutil, difflib, re
ROOT = Path.cwd()
OUT = ROOT / '.agents/artifacts/perf/clean-gpu-atlas-source-20261013'
BASE = ROOT / '.agents/artifacts/perf/clean-canvas-automated-profile-20261013/original'
CORRECTION = ROOT / '.agents/artifacts/perf/gpu-boot-atlas-failure-correction-20261012'
ATLAS = ROOT / '.agents/artifacts/perf/gpu-boot-atlas-prototype-20261012/source-stage'
COMMIT = 'a796e9aea60def6e0849cb75a151fd6570942339'
ENGINE = 'src/lib/boot/engine.ts'
ADDED = ['public/boot-atlas.png', 'src/lib/boot/boot-atlas-metrics.json', 'src/lib/boot/boot-atlas.ts']
def sha(b): return hashlib.sha256(b).hexdigest()
def git(*args): return subprocess.check_output(['git', '--no-optional-locks', *args], cwd=ROOT)
def load(p): return json.loads(p.read_bytes())
def write(p, s): p.write_bytes(s.encode('utf-8'))
def record(p):
    b = p.read_bytes()
    return {'bytes': len(b), 'sha256': sha(b)}
def inventory(stage):
    return [{'path': p.relative_to(stage).as_posix(), **record(p)} for p in sorted(stage.rglob('*'), key=lambda p: p.relative_to(stage).as_posix()) if p.is_file() and not any(part in {'.svelte-kit', 'node_modules'} for part in p.relative_to(stage).parts)]
def digest(files): return sha(''.join(f['path'] + '\0' + f['sha256'] + '\n' for f in files).encode())
def state():
    tracked = git('ls-files', '-z').decode().split('\0')[:-1]
    index = ROOT / git('rev-parse', '--git-path', 'index').decode().strip()
    return {
      'head': git('rev-parse', 'HEAD').decode().strip(),
      'branch': git('symbolic-ref', 'HEAD').decode().strip(),
      'refs': git('show-ref').decode(),
      'index': record(index),
      'tracked': [{'path': p, **record(ROOT / p)} if (ROOT / p).is_file() else {'path': p, 'missing': True} for p in tracked],
      'baselineStage': inventory(BASE / 'source'),
      'correctedStage': inventory(ATLAS),
      'baselineManifest': record(BASE / 'manifest.json'),
      'correctedManifest': record(CORRECTION / 'source-manifest.json')
    }
def validate_inputs():
    baseline = load(BASE / 'manifest.json')
    corrected = load(CORRECTION / 'source-manifest.json')
    assert baseline['commit'] == COMMIT
    assert len(baseline['files']) == 91
    assert {f['path'] for f in baseline['files']} == {f['path'] for f in inventory(BASE / 'source')}
    for f in baseline['files']:
        assert record(BASE / 'source' / f['path']) == {k:f[k] for k in ['bytes','sha256']}, f['path']
        blob = git('rev-parse', COMMIT + ':' + f['path']).decode().strip()
        assert blob == f['blob'], f['path']
        assert git('cat-file', 'blob', blob) == (BASE / 'source' / f['path']).read_bytes(), f['path']
    assert git('merge-base', '--is-ancestor', '042dc805', COMMIT) == b''
    assert Path(corrected['stage']).resolve() == ATLAS.resolve()
    assert len(corrected['files']) == 96
    assert {f['path'] for f in corrected['files']} == {f['path'] for f in inventory(ATLAS)}
    for f in corrected['files']:
        assert record(ATLAS / f['path']) == {k:f[k] for k in ['bytes','sha256']}, f['path']
    assert digest(corrected['files']) == corrected['stageDigest']
    assert record(ATLAS / 'public/boot-atlas.png') == {'bytes':37034, 'sha256':'e7eb731d0e0ddeaa44e3d5cf0c700e05211bd2a595a908c3eade1c36b2fafc6e'}
    return baseline, corrected

def replace_once(s, old, new):
    assert s.count(old) == 1, old[:100]
    return s.replace(old, new, 1)

def port(baseline):
    stage = OUT / 'source'
    assert not stage.exists(), 'Refuse to overwrite an existing source stage'
    for f in baseline['files']:
        p = stage / f['path']; p.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(BASE / 'source' / f['path'], p)
    for p in ADDED:
        target = stage / p; target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ATLAS / p, target)
    engine = (BASE / 'source' / ENGINE).read_text(encoding='utf-8')
    corrected_engine = (ATLAS / ENGINE).read_text(encoding='utf-8')
    engine = replace_once(engine, "import { BOOT_DURATION, drawBootScreen } from './boot-screen';", "import { BOOT_DURATION } from './boot-screen';\nimport { createBootAtlas } from './boot-atlas';")
    start = engine.index("\tconst screenCanvas = document.createElement('canvas');")
    end = engine.index('\tconst screenFade =', start)
    engine = engine[:start] + '\tconst gpuScreen = createBootAtlas(background);\n' + engine[end:]
    engine = replace_once(engine, '\tscreen.material = screenMaterial;', '\tscreen.material = gpuScreen.material;')
    engine = replace_once(engine, "\t\t// The variants that only appear later: the console's lit screen, a cut clump of foliage.\n\t\tconst extras = new THREE.Scene();\n\t\tconst lit = screenMaterial.clone();\n\t\tlit.map = screenTexture;\n\t\textras.add(new THREE.Mesh(screen.geometry, lit));", "\t\t// The variant that only appears later: a cut clump of foliage.\n\t\tconst extras = new THREE.Scene();")
    start = corrected_engine.index('\ttry {\n\t\tawait Promise.all([...lightmapsIn, portraitIn,')
    end = corrected_engine.index('\tonProgress(0.9);', start)
    cleanup = corrected_engine[start:end]
    cleanup = replace_once(cleanup, '...(gpuScreen ? [gpuScreen.ready] : [])', 'gpuScreen.ready')
    cleanup = re.sub(r'^.*diag\?\..*\n', '', cleanup, flags=re.M)
    cleanup = replace_once(cleanup, '\t\tgpuScreen?.dispose();', '\t\tgpuScreen.dispose();')
    for line in ['\t\tif (screenTexture) textures.add(screenTexture);\n', '\t\textraScreenMaterial?.dispose();\n', '\t\tscreenMaterial.dispose();\n']:
        cleanup = replace_once(cleanup, line, '')
    engine = replace_once(engine, '\tawait Promise.all([...lightmapsIn, portraitIn]);\n', cleanup)
    engine = replace_once(engine, "\t\tscreenMaterial.color.set(on ? '#ffffff' : '#1d201d');\n\t\tscreenMaterial.map = on ? screenTexture : null;\n\t\tscreenMaterial.needsUpdate = true;", '\t\tgpuScreen.power(on);')
    start = engine.index('\t\tif (s.boot >= 0 && !screenOff) {')
    end = engine.index('\t\trubiks.sync();', start)
    engine = engine[:start] + "\t\tif (s.boot >= 0 && !screenOff) {\n\t\t\tgpuScreen.prepare(s.boot, mode === 'returning', screenFade.value);\n\t\t}\n" + engine[end:]
    engine = replace_once(engine, '\t\tscreenTexture.dispose();', '\t\tgpuScreen.dispose();')
    write(stage / ENGINE, engine)
    atlas = (ATLAS / 'src/lib/boot/boot-atlas.ts').read_text(encoding='utf-8')
    atlas = replace_once(atlas, "import { diagnostic as diag } from './diagnostic';\n", '')
    atlas = replace_once(atlas, "\ttexture.onUpdate = () => diag?.textureSubmission('atlas');\n", '')
    start = atlas.index("\tdiag?.mark('atlas-fetch-start'")
    end = atlas.index('\tlet disposed = false;', start)
    atlas = atlas[:start] + atlas[end:]
    atlas = replace_once(atlas, "\tvoid ready.catch((error: unknown) => {\n\t\tdiag?.mark('atlas-readiness-failed', { error: String(error), disposed });\n\t});", '\tvoid ready.catch(() => {});')
    start = atlas.index('\t\tsubmitted(')
    end = atlas.index('\t\tdispose() {', start)
    atlas = atlas[:start] + atlas[end:]
    atlas = re.sub(r'^.*diag\?\..*\n', '', atlas, flags=re.M)
    write(stage / 'src/lib/boot/boot-atlas.ts', atlas)
    return engine, atlas

def visual_blocks(s):
    return {
      'shader': s[s.index('\t\tvertexShader:'):s.index('\t});', s.index('\t\tvertexShader:'))+len('\t});\n')],
      'prepare': s[s.index('\tfunction prepare('):s.index('\treturn {\n\t\tmaterial,')]
    }

def finalize(baseline, corrected, before):
    stage = OUT / 'source'
    files = inventory(stage)
    assert len(files) == 94
    assert {f['path'] for f in files} == {f['path'] for f in baseline['files']} | set(ADDED)
    baseline_by_path = {f['path']:f for f in baseline['files']}
    for f in files:
        base = baseline_by_path.get(f['path'])
        f['baselineSha256'] = base['sha256'] if base else None
        f['changed'] = bool(base and base['sha256'] != f['sha256'])
        f['added'] = base is None
        if base and f['path'] != ENGINE: assert f['sha256'] == base['sha256'], f['path']
    assert [f['path'] for f in files if f['changed']] == [ENGINE]
    assert [f['path'] for f in files if f['added']] == ADDED
    old = (ATLAS / 'src/lib/boot/boot-atlas.ts').read_text(encoding='utf-8')
    new = (stage / 'src/lib/boot/boot-atlas.ts').read_text(encoding='utf-8')
    visuals = []
    for name, block in visual_blocks(old).items():
        assert block == visual_blocks(new)[name]
        visuals.append({'name':name, 'sha256':sha(block.encode()), 'identical':True, 'normalization':'CRLF to LF'})
    for p in ['public/boot-atlas.png','src/lib/boot/boot-atlas-metrics.json']:
        assert (stage / p).read_bytes() == (ATLAS / p).read_bytes()
    engine = (stage / ENGINE).read_text(encoding='utf-8')
    forbidden = ['diagnostic', 'context-control', 'bootCanvasMode', 'bootCanvasOptions', 'screenCanvas', 'screenCtx', 'screenTexture', 'screenMaterial', 'extraScreenMaterial', 'drawBootScreen', 'submitted(', 'onAfterRender', 'diag?.']
    assert not any(t in engine for t in forbidden)
    assert not any(t in new for t in ['diagnostic','diag?.','submitted(','onUpdate','onAfterRender'])
    after = state()
    assert before == after, 'Protected main/prior-stage identities changed'
    manifest = {'sourceId':'original-91+clean-gpu-png-atlas-source-20261013', 'status':'SOURCE ONLY; root review required', 'baselineCommit':COMMIT, 'cameraFix':'042dc805', 'stage':'source', 'correctedSourceManifest':str((CORRECTION/'source-manifest.json').relative_to(ROOT)).replace('\\','/'), 'correctedSourceDigest':corrected['stageDigest'], 'filesTotal':len(files), 'bytesTotal':sum(f['bytes'] for f in files), 'stageDigest':digest(files), 'digestAlgorithm':'SHA256 of UTF-8 concatenation: path + NUL + lowercase SHA256 + LF, files sorted by path', 'deploymentAuthorized':False, 'files':files}
    write(OUT/'source-manifest.json', json.dumps(manifest, indent=2)+'\n')
    diffs = []
    for f in files:
        if not (f['changed'] or f['added']): continue
        p = f['path']
        if p.endswith('.png'):
            diffs.append('diff --git a/'+p+' b/'+p+'\nnew file mode 100644\nBinary file added: '+p+'\nbytes: '+str(f['bytes'])+'\nsha256: '+f['sha256']+'\nExact binary is supplied at source/'+p+'\n')
        else:
            old_text = (BASE/'source'/p).read_text(encoding='utf-8') if not f['added'] else ''
            diffs.append(''.join(difflib.unified_diff(old_text.splitlines(keepends=True), (stage/p).read_text(encoding='utf-8').splitlines(keepends=True), fromfile='a/'+p if not f['added'] else '/dev/null', tofile='b/'+p)))
    write(OUT/'source.diff', ''.join(diffs))
    write(OUT/'identity-after.json', json.dumps(after, indent=2)+'\n')
    verification = {'scope':'Deterministic source/hash/identity checks only; no runtime checks', 'baselineFilesVerifiedAgainstManifestAndGit':91, 'cameraFixAncestorVerified':True, 'correctedFilesVerifiedAgainstCorrectionManifest':96, 'correctedDigestVerified':corrected['stageDigest'], 'stageFiles':94, 'stageDigest':manifest['stageDigest'], 'unchangedBaselineFiles':90, 'changed':[ENGINE], 'added':ADDED, 'shaderAndPrepare':visuals, 'pngAndMetricsExact':True, 'mainTrackedBytesIndexRefsHeadBranchUnchanged':True, 'baselineAndCorrectedStagesAndManifestsUnchanged':True, 'removedEngineDiagnosticAndCanvasReferences':True, 'runtimeChecks':'PENDING by authorized scope'}
    write(OUT/'source-verification.json', json.dumps(verification, indent=2)+'\n')
    return verification

if __name__ == '__main__':
    baseline, corrected = validate_inputs()
    before = state()
    assert before['head'] == 'd82230acab7f4e2be780afd0847330a6926573d1', before['head']
    assert not (OUT/'identity-before.json').exists(), 'Refuse to overwrite evidence'
    write(OUT/'identity-before.json', json.dumps(before, indent=2)+'\n')
    port(baseline)
    print(json.dumps(finalize(baseline, corrected, before), indent=2))
