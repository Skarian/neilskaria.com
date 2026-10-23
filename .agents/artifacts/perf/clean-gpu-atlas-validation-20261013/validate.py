from pathlib import Path
import hashlib,json,subprocess,shutil,os
ROOT=Path.cwd(); OUT=ROOT/'.agents/artifacts/perf/clean-gpu-atlas-validation-20261013'; INPUT=ROOT/'.agents/artifacts/perf/clean-gpu-atlas-source-20261013'
def sha(b): return hashlib.sha256(b).hexdigest()
def rec(p):
 b=p.read_bytes(); return {'bytes':len(b),'sha256':sha(b)}
def git(*a): return subprocess.check_output(['git','--no-optional-locks',*a],cwd=ROOT).decode().strip()
def inventory(p):
 result=[]
 for base,dirs,files in os.walk(p,followlinks=False):
  dirs[:]=[d for d in dirs if d!='node_modules']
  for f in files:
   q=Path(base)/f
   result.append({'path':q.relative_to(p).as_posix(),**rec(q)})
 return sorted(result,key=lambda f:f['path'])
def state():
 tracked=[p for p in git('ls-files','-z').split('\0') if p]
 stages=['clean-gpu-atlas-source-20261013/source','clean-canvas-automated-profile-20261013/original/source','gpu-boot-atlas-prototype-20261012/source-stage']
 return {'head':git('rev-parse','HEAD'),'branch':git('symbolic-ref','HEAD'),'refs':git('show-ref'),'index':rec(ROOT/git('rev-parse','--git-path','index')),'tracked':[{'path':p,**rec(ROOT/p)} if (ROOT/p).is_file() else {'path':p,'missing':True} for p in tracked], 'priorArtifacts':{s:inventory(ROOT/'.agents/artifacts/perf'/s) for s in stages}}
def write(p,v): p.write_text(json.dumps(v,indent=2)+'\n',encoding='utf8')
if __name__=='__main__':
 manifest=json.loads((INPUT/'source-manifest.json').read_bytes()); assert manifest['stageDigest']=='a148564062b30b3fd51326eb023e3bbfa60bc49814323bb198051796092ed40c'; assert len(manifest['files'])==94
 assert not (OUT/'source').exists(); write(OUT/'identity-before.json',state())
 for f in manifest['files']:
  p=INPUT/'source'/f['path']; assert rec(p)=={k:f[k] for k in ['bytes','sha256']}
  q=OUT/'source'/f['path']; q.parent.mkdir(parents=True,exist_ok=True); shutil.copyfile(p,q)
 write(OUT/'input-manifest.json',manifest)
 assert inventory(OUT/'source')==[{k:f[k] for k in ['path','bytes','sha256']} for f in manifest['files']]
 print('PASS: protected identity captured; exactly 94 manifest files copied')

