import hashlib, json, os, subprocess, sys
from pathlib import Path
ROOT = Path(r'C:\projects\neilskaria.com')
OUT = ROOT / '.agents/artifacts/perf/lean-canvas-hint-proposed-revision-20261013'
BASE = 'a796e9aea60def6e0849cb75a151fd6570942339'
REF = 'refs/heads/perf/lean-canvas-hint-review'
ENGINE = 'src/lib/boot/engine.ts'
CAND = ROOT / '.agents/artifacts/perf/lean-canvas-hint-candidate-20261013'
COORD = ROOT / '.agents/coordination.md'
INDEX = OUT / 'proposal.index'
ENV = os.environ.copy()
ENV['GIT_OPTIONAL_LOCKS'] = '0'
ENV.pop('GIT_INDEX_FILE', None)
LOG = []
def git(*args, index=False, check=True, data=None):
    env = ENV.copy()
    if index:
        env['GIT_INDEX_FILE'] = str(INDEX)
    p = subprocess.run(['git', '--no-optional-locks', *args], cwd=ROOT, env=env, input=data, capture_output=True)
    LOG.append({'args': list(args), 'temporaryIndex': index, 'exit': p.returncode, 'stderr': p.stderr.decode(errors='replace')})
    if check and p.returncode:
        raise RuntimeError(LOG[-1])
    return p

def sha(data): return hashlib.sha256(data).hexdigest()
def filehash(path): return sha(path.read_bytes()) if path.is_file() else None
def save(name, value): (OUT / name).write_text(json.dumps(value, indent=2) + '\n', encoding='utf-8')
def snapshot():
    tracked = git('ls-files', '-z').stdout.split(b'\0')
    paths = [os.fsdecode(p) for p in tracked if p]
    indexpath = Path(os.fsdecode(git('rev-parse', '--git-path', 'index').stdout.strip()))
    if not indexpath.is_absolute(): indexpath = ROOT / indexpath
    prior = {}
    for directory in [CAND, ROOT / '.agents/artifacts/perf/lean-canvas-hint-preview-20261013', ROOT / '.agents/artifacts/perf/affected-lean-startup-analysis-20261013']:
        for p in sorted(directory.rglob('*')):
            if p.is_file(): prior[p.relative_to(ROOT).as_posix()] = filehash(p)
    return {
        'head': git('rev-parse', 'HEAD').stdout.decode().strip(),
        'branch': git('symbolic-ref', 'HEAD').stdout.decode().strip(),
        'status': git('status', '--porcelain=v1', '-z', '--untracked-files=all').stdout.decode(),
        'trackedHashes': {p: filehash(ROOT / p) for p in paths},
        'realIndexPath': str(indexpath.resolve()), 'realIndexSha256': filehash(indexpath),
        'refs': git('for-each-ref', '--format=%(refname) %(objectname)').stdout.decode(),
        'priorArtifactHashes': prior,
    }
def proposal():
    commit = git('rev-parse', REF).stdout.decode().strip()
    parents = git('rev-list', '--parents', '-n', '1', commit).stdout.decode().split()
    assert parents == [commit, BASE], parents
    before = git('show', BASE + ':' + ENGINE).stdout
    after = git('show', commit + ':' + ENGINE).stdout
    assert before == (CAND / 'baseline-engine.ts').read_bytes()
    assert after == (CAND / 'proposed-engine.ts').read_bytes()
    old = b"screenCanvas.getContext('2d')"
    new = b"screenCanvas.getContext('2d', { willReadFrequently: true })"
    assert before.count(old) == 1 and before.replace(old, new, 1) == after
    names = git('diff', '--name-only', BASE, commit).stdout.decode().splitlines()
    assert names == [ENGINE], names
    numstat = git('diff', '--numstat', BASE, commit).stdout.decode().strip()
    assert numstat == '1\t1\t' + ENGINE, numstat
    patch = git('diff', '--no-ext-diff', '--no-textconv', BASE, commit, '--', ENGINE).stdout
    assert patch == (CAND / 'production-eligible-proposal.patch').read_bytes()
    assert git('show', '-s', '--format=%B', commit).stdout.decode().strip() == 'Use the canvas readback hint for the boot screen'
    line = next(i for i, text in enumerate(after.decode().splitlines(), 1) if new.decode() in text)
    return {'branch': REF.removeprefix('refs/heads/'), 'commit': commit, 'soleParent': BASE,
            'changedPaths': names, 'numstat': numstat, 'changedLine': line,
            'baselineBlobSha256': sha(before), 'proposedBlobSha256': sha(after),
            'patchSha256': sha(patch), 'exactReviewedBlobsAndPatch': True}

mode = sys.argv[1]
try:
    if mode == 'capture':
        assert not (OUT / 'before.json').exists(), 'Do not replace initial evidence'
        state = snapshot()
        assert state['head'] == 'd82230acab7f4e2be780afd0847330a6926573d1'
        assert state['branch'] == 'refs/heads/redesign'
        target = git('show-ref', '--verify', '--quiet', REF, check=False)
        assert target.returncode in [0, 1]
        save('before.json', state)
        (OUT / 'coordination-before.bin').write_bytes(COORD.read_bytes())
        assert git('show', BASE + ':' + ENGINE).stdout == (CAND / 'baseline-engine.ts').read_bytes()
        save('preflight.json', {'targetExists': target.returncode == 0, 'baselineBlobMatches': True, 'patchSha256': filehash(CAND / 'production-eligible-proposal.patch')})
        print('Initial checkout, real index, refs, tracked files and prior artifacts captured. Baseline blob matches.')
    elif mode == 'create':
        initial = json.loads((OUT / 'before.json').read_text())
        current = snapshot()
        save('pre-create.json', current)
        for key in initial:
            if key != 'status':
                assert current[key] == initial[key], 'State changed: ' + key
        def outside_task(status):
            return [entry for entry in status.split('\0') if entry and '.agents/artifacts/perf/lean-canvas-hint-proposed-revision-20261013/' not in entry]
        assert outside_task(current['status']) == outside_task(initial['status']), 'Status outside task changed'
        target = git('show-ref', '--verify', '--quiet', REF, check=False)
        if target.returncode == 0:
            result = proposal()
            save('proposal.json', result)
            print('Existing matching proposal preserved: ' + result['commit'])
        else:
            assert target.returncode == 1
            assert not INDEX.exists(), 'Do not reuse an existing temporary index'
            git('read-tree', BASE, index=True)
            git('apply', '--cached', '--check', str(CAND / 'production-eligible-proposal.patch'), index=True)
            git('apply', '--cached', str(CAND / 'production-eligible-proposal.patch'), index=True)
            tree = git('write-tree', index=True).stdout.decode().strip()
            blob = git('show', tree + ':' + ENGINE).stdout
            assert blob == (CAND / 'proposed-engine.ts').read_bytes()
            assert git('diff', '--numstat', BASE, tree).stdout.decode().strip() == '1\t1\t' + ENGINE
            commit = git('commit-tree', tree, '-p', BASE, '-m', 'Use the canvas readback hint for the boot screen').stdout.decode().strip()
            save('created-object.json', {'tree': tree, 'commit': commit, 'parent': BASE})
            git('update-ref', REF, commit, '0' * len(commit))
            result = proposal()
            save('proposal.json', result)
            (OUT / 'proposed.patch').write_bytes(git('diff', '--no-ext-diff', '--no-textconv', BASE, commit).stdout)
            (OUT / 'diff-stat.txt').write_bytes(git('diff', '--stat', BASE, commit).stdout)
            print('Local proposal created: ' + result['commit'])
    elif mode == 'verify':
        initial = json.loads((OUT / 'before.json').read_text())
        current = snapshot()
        result = proposal()
        checks = {k: current[k] == initial[k] for k in ['head', 'branch', 'trackedHashes', 'realIndexPath', 'realIndexSha256', 'priorArtifactHashes']}
        def statuses(s):
            return [p for p in s.split('\0') if p and '.agents/artifacts/perf/lean-canvas-hint-proposed-revision-20261013/' not in p]
        checks['statusExceptNewTaskArtifacts'] = statuses(current['status']) == statuses(initial['status'])
        def refs(s): return dict(line.split(' ', 1) for line in s.splitlines())
        expected = refs(initial['refs'])
        expected[REF] = result['commit']
        checks['refsOnlyAuthorizedCreate'] = refs(current['refs']) == expected
        prefix = (OUT / 'coordination-before.bin').read_bytes()
        checks['coordinationPriorBytesPreserved'] = COORD.read_bytes().startswith(prefix)
        checks['exactReviewedBlobsAndPatch'] = result['exactReviewedBlobsAndPatch']
        save('after.json', current)
        save('safety-verification.json', checks)
        assert all(checks.values()), checks
        print(json.dumps({'proposal': result, 'checks': checks}, indent=2))
    else:
        raise RuntimeError('Unsupported phase')
finally:
    save('git-commands-' + mode + '.json', LOG)
