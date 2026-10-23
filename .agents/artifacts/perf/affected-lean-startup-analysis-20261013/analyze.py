"""Standard-library analysis. Writes only beside this script."""
import hashlib, json, math
from pathlib import Path
OUT=Path(__file__).resolve().parent
STAGE=OUT.parent/'lean-canvas-hint-preview-20261013'
ATTACH=Path('C:/Users/Neil Skaria/.t3/userdata/attachments')
INPUTS={'original':'fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-8a4cc268-f5ed-4002-99ae-0acc0f4aaf76-json.json','hint':'fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-45267d54-55be-4b5d-b61d-a537273e78a9-json.json'}
def sha(b): return hashlib.sha256(b).hexdigest()
def read(p): return json.loads(p.read_text(encoding='utf-8-sig'))
def validate(v,s,p='$'):
    # Implements every assertion keyword present in the supplied schema.
    if 'type' in s:
        ts=s['type'] if isinstance(s['type'],list) else [s['type']]
        tests={'object':isinstance(v,dict),'array':isinstance(v,list),'number':type(v) in (int,float) and math.isfinite(v) if type(v) in (int,float) else False,'integer':type(v) is int,'string':isinstance(v,str),'boolean':type(v) is bool,'null':v is None}
        assert any(tests[t] for t in ts),(p,'type')
    if 'const' in s: assert v==s['const'] and type(v) is type(s['const']),(p,'const')
    if 'enum' in s: assert v in s['enum'],(p,'enum')
    if isinstance(v,dict):
        assert all(k in v for k in s.get('required',[])),(p,'required')
        props=s.get('properties',{})
        if s.get('additionalProperties') is False: assert set(v)<=set(props),(p,'additionalProperties')
        for k,sub in props.items():
            if k in v: validate(v[k],sub,p+'.'+k)
    if isinstance(v,list):
        assert len(v)<=s.get('maxItems',math.inf),(p,'maxItems')
        for i,x in enumerate(v): validate(x,s.get('items',{}),f'{p}[{i}]')
    if isinstance(v,str): assert len(v)<=s.get('maxLength',math.inf),(p,'maxLength')
    if 'oneOf' in s:
        passes=0
        for sub in s['oneOf']:
            try: validate(v,sub,p); passes+=1
            except AssertionError: pass
        assert passes==1,(p,'oneOf')
    for sub in s.get('allOf',[]): validate(v,sub,p)
    if 'if' in s:
        try: validate(v,s['if'],p); condition=True
        except AssertionError: condition=False
        validate(v,s.get('then' if condition else 'else',{}),p)
PAIRS=[('diagnostic_to_create','diagnostic-initialized','create-room'),('create_to_context','create-room','boot-canvas-context-created'),('create_to_model','create-room','model-parsed'),('model_to_assets','model-parsed','assets-prepared'),('assets_to_compile_wait','assets-prepared','compile-wait-start'),('compile_promise_wait','compile-wait-start','compile-wait-end'),('compile_end_to_font_wait','compile-wait-end','font-wait-start'),('font_wait','font-wait-start','fonts-ready'),('fonts_to_ready','fonts-ready','room-ready'),('create_to_ready','create-room','room-ready'),('ready_to_START_DOM','room-ready','START-DOM'),('START_DOM_to_entry_complete','START-DOM','START-animation-complete'),('create_to_START_complete','create-room','START-animation-complete')]
ORDER=['diagnostic-initialized','create-room','boot-canvas-context-created','screen-texture-created','model-parsed','assets-prepared','compile-wait-start','compile-wait-end','font-wait-start','fonts-ready','room-ready','START-DOM','START-animation-start','START-animation-complete','download-requested']
def analyze(name,d):
    hint=name=='hint'; exp=d['experiment']; mode='will-read-frequently' if hint else 'default'
    assert exp['mode']==mode
    assert exp['requestedContextOptions']==({'willReadFrequently':True} if hint else None)
    assert exp['requestedContextOptionsOmitted'] is (not hint)
    assert exp['contextAttributesStatus']=='supported' and exp['contextAttributes']['willReadFrequently'] is hint
    ev=d['events']; marks={}
    for e in ev: marks.setdefault(e['kind'],[]).append(e)
    assert all(e['run']==0 and e['t']>=0 for e in ev)
    assert all(a['t']<=b['t'] for a,b in zip(ev,ev[1:]))
    assert all(len(marks[k])==1 for k in ORDER)
    t={k:marks[k][0]['t'] for k in ORDER}
    assert all(t[a]<=t[b] for a,b in zip(ORDER,ORDER[1:]))
    assert marks['boot-canvas-context-created'][0]['mode']==mode
    texture=marks['screen-texture-created'][0]
    assert (texture['width'],texture['height'],texture['context'])==(960,640,'default Canvas2D')
    assert marks['fonts-ready'][0]['status']=='loaded'
    assert [(e['from'],e['to']) for e in marks['mode']]==[('loading','room')]
    assert t['room-ready']<=marks['mode'][0]['t']<=t['START-DOM']
    assert [e['value'] for e in marks['progress']]==[.75,.9,1]
    assert not any(k.startswith('START-gesture') or k in ('START','boot-animation-complete') for k in marks)
    assert d['counts']==dict(runs=0,events=0,frames=0,longtasks=0,errors=0)
    assert d['frames']==d['longtasks']==d['errors']==[]
    assert d['completion']=={'first':False,'return':False,'replay':False}
    assert [u['run'] for u in d['unobserved']]==[1,2]
    assert all('boot-animation-complete' in u['markers'] for u in d['unobserved'])
    vis=marks.get('visibility',[])
    assert d['metadata']['visibility']=='visible'
    assert not any(e['t']<=t['START-animation-complete'] and e['state']!='visible' for e in vis)
    assert len(d['navigation'])==1 and d['navigation'][0]['type']=='reload'
    nav=d['navigation'][0]; assert nav['startTime']==0
    intervals={k:t[b]-t[a] for k,a,b in PAIRS}
    intervals.update(responseEnd_to_ready=t['room-ready']-nav['responseEnd'],navigation_to_ready=t['room-ready'],navigation_to_START_complete=t['START-animation-complete'])
    res=d['resources']; valid=[r for r in res if r['duration']>=0]; negative=[r for r in res if r['duration']<0]
    assert len(negative)==1 and '/workers/' in negative[0]['path']
    room=[r for r in valid if '/_app/immutable/assets/' in r['path'] and not r['path'].endswith(('.css','.woff2'))]
    last=max(room,key=lambda r:r['startTime']+r['duration']); end=last['startTime']+last['duration']
    selected=[]
    for r in valid:
        if any(x in r['path'] for x in ('bedroom.','.woff2','/draco/','srWxzZjC')):
            e=r['startTime']+r['duration']
            selected.append({**r,'endTime':e,'end_to_model':t['model-parsed']-e,'end_to_assets':t['assets-prepared']-e,'end_to_ready':t['room-ready']-e})
    return {'markers_ms':t,'intervals_ms':intervals,'navigation':nav,'array_lengths':{k:len(d[k]) for k in ('events','frames','longtasks','errors','resources')},'dropped_counts':{k:d['counts'][k] for k in ('events','frames','longtasks','errors')},'visibility_events':vis,'visible_through_START_complete':True,'negative_resources_excluded_from_interval_math':negative,'cache_signals':{'zero_transfer_positive_body':sum(r['transferSize']==0 and r['encodedBodySize']>0 for r in res),'positive_transfer_positive_body':sum(r['transferSize']>0 and r['encodedBodySize']>0 for r in res)},'last_room_asset':{**last,'endTime':end,'end_to_assets':t['assets-prepared']-end,'end_to_ready':t['room-ready']-end},'selected_resources':selected,'raw_resources':res,'checks':'PASS'}
schema=read(STAGE/'capture.schema.json'); copies={}; captures={}; results={}
for name,filename in INPUTS.items():
    original=ATTACH/filename; raw=original.read_bytes(); target=OUT/(name+'.json'); target.write_bytes(raw)
    assert target.read_bytes()==raw
    copies[name]={'original':str(original),'copy':target.name,'bytes':len(raw),'sha256':sha(raw),'byte_identical':True}
    d=json.loads(raw); validate(d,schema); captures[name]=d; results[name]=analyze(name,d)
    assert original.read_bytes()==raw
assert captures['original']['metadata']==captures['hint']['metadata']
assert captures['original']['supported']==captures['hint']['supported']==dict(longtask=True,fonts=True,resourceTiming=True)
def immutable(d): return {r['path']:r['encodedBodySize'] for r in d['resources'] if r['path'].startswith('/_app/immutable/')}
assert immutable(captures['original'])==immutable(captures['hint'])
manifest=read(STAGE/'source-manifest.json'); source_checks=[]
for rel in ('src/lib/boot/engine.ts','src/lib/boot/diagnostic.ts','src/lib/boot/BootIntro.svelte','src/lib/boot/boot-screen.ts'):
    entry=next(x for x in manifest['files'] if x['path']==rel); raw=(STAGE/'source-stage'/rel).read_bytes()
    assert len(raw)==entry['bytes'] and sha(raw)==entry['sha256']
    source_checks.append({'path':rel,'bytes':len(raw),'sha256':sha(raw),'matches_manifest':True})
delta={k:results['hint']['intervals_ms'][k]-v for k,v in results['original']['intervals_ms'].items()}
metrics={'method':{'delta':'hint minus original','units':'ms','rounding':'Tables round to 0.1 ms. JSON retains subtraction precision.','schema_assertions_used':['type','required','const','enum','maxLength','maxItems','items','properties','additionalProperties','oneOf','allOf','if/then/else'],'schema_scope':'All assertion keywords in supplied schema. Not a general JSON Schema engine.','startup_scope':'reload through START-animation-complete, no START gesture','negative_resource_policy':'Retain raw entry. Exclude from duration and end-time math.'},'copies':copies,'captures':results,'delta_ms':delta,'shared_immutable_fingerprints':immutable(captures['original']),'source_checks':source_checks,'schema_sha256':sha((STAGE/'capture.schema.json').read_bytes()),'deployment_identity':'dpl_BdRi826ZYAwiEyaDYXuqXKLL7iSn (supplied provenance, not embedded in capture)','validation':'PASS'}
(OUT/'metrics.json').write_text(json.dumps(metrics,indent=2)+'\n',encoding='utf-8')
table=['| Interval (ms) | Original | Hint | Hint minus original |','|---|---:|---:|---:|']
for k in delta: table.append(f"| {k} | {results['original']['intervals_ms'][k]:.1f} | {results['hint']['intervals_ms'][k]:.1f} | {delta[k]:+.1f} |")
(OUT/'metrics.md').write_text('\n'.join(table)+'\n',encoding='utf-8')
print(json.dumps({'validation':'PASS','copies':copies,'table':'\n'.join(table),'resources':{k:{x:v[x] for x in ('cache_signals','last_room_asset','selected_resources','negative_resources_excluded_from_interval_math')} for k,v in results.items()}},indent=2))
