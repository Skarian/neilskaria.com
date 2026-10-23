"""Independent raw-capture analysis; standard library only; originals are read-only.
Run this file with Python. Writes only evidence.json and metrics.csv beside this file.
"""
from pathlib import Path
import csv, hashlib, json, math, statistics

OUT=Path(__file__).resolve().parent
PREVIEW=OUT.parent/'gpu-boot-atlas-preview-20261012'
ATTACH=Path('C:/Users/Neil Skaria/.t3/userdata/attachments')
INPUTS={
 'gpu':('25e54b0e-c022-4b29-ab24-05e635151c5f',432078,'c4f3302d9fcad2b76c29fbc28eb74eecc81c8961d965c83b6ac82cd83f6a085c','gpu-atlas'),
 'control':('f3059ffc-9fe5-4f7f-951e-b14f59126223',438791,'ad6ae6a7a72147f8607fb838b6e1a25b04f620e93ed3527443f86121a5e2f2af','will-read-frequently'),
 'default':('21d901d3-81dd-49ec-afd7-49eb5c4b4cb4',336233,'b7b2c2a049ee271e628a3645bd7818c3622175364867ff504e9db80b22f2cb4b','default')}

def read(p):return json.loads(p.read_text(encoding='utf-8-sig'))
def write(n,d):(OUT/n).write_text(json.dumps(d,indent=2,allow_nan=False)+'\n',encoding='utf-8')
def schema_errors(v,s,path='$'):
    """All assertion keywords in this supplied schema; not a general JSON Schema library."""
    assert set(s)<={'$schema','title','type','required','properties','const','enum','maxLength','minimum','items','maxItems','oneOf','allOf','if','then','additionalProperties'}
    err=[]
    types={'object':lambda x:isinstance(x,dict),'array':lambda x:isinstance(x,list),'string':lambda x:isinstance(x,str),
      'number':lambda x:type(x) in (int,float) and math.isfinite(x),'integer':lambda x:type(x) is int,
      'boolean':lambda x:type(x) is bool,'null':lambda x:x is None}
    if 'type' in s:
        ts=s['type'] if isinstance(s['type'],list) else [s['type']]
        if not any(types[t](v) for t in ts):err.append(path+': type')
    if 'const' in s and v!=s['const']:err.append(path+': const')
    if 'enum' in s and v not in s['enum']:err.append(path+': enum')
    if 'minimum' in s and type(v) in (int,float) and v<s['minimum']:err.append(path+': minimum')
    if isinstance(v,str) and len(v)>s.get('maxLength',math.inf):err.append(path+': maxLength')
    if isinstance(v,dict):
        err += [path+': missing '+k for k in s.get('required',[]) if k not in v]
        for k,x in v.items():
            if k in s.get('properties',{}):err+=schema_errors(x,s['properties'][k],path+'.'+k)
            elif s.get('additionalProperties') is False:err.append(path+': extra '+k)
    if isinstance(v,list):
        if len(v)>s.get('maxItems',math.inf):err.append(path+': maxItems')
        for i,x in enumerate(v):err+=schema_errors(x,s.get('items',{}),path+'['+str(i)+']')
    if 'oneOf' in s and sum(not schema_errors(v,x,path) for x in s['oneOf'])!=1:err.append(path+': oneOf')
    for x in s.get('allOf',[]):err+=schema_errors(v,x,path)
    if 'if' in s and not schema_errors(v,s['if'],path):err+=schema_errors(v,s.get('then',{}),path)
    return err
def stats(v):
    a=sorted(x for x in v if x is not None)
    if not a:return {'n':0}
    def q(p):
        h=(len(a)-1)*p;i=math.floor(h)
        return a[i]+(a[min(i+1,len(a)-1)]-a[i])*(h-i)
    return {'n':len(a),'mean':statistics.fmean(a),'p50':q(.5),'p95':q(.95),'max':a[-1],'min':a[0],
      'ge42':sum(x>=42 for x in a),'ge42_pct':100*sum(x>=42 for x in a)/len(a),
      'gt50':sum(x>50 for x in a),'gt50_pct':100*sum(x>50 for x in a)/len(a)}
def es(d,k,r=None,**kw):
    return [e for e in d['events'] if e['kind']==k and (r is None or e['run']==r) and all(e.get(k)==v for k,v in kw.items())]
def et(d,k,r=None,**kw):
    e=es(d,k,r,**kw);return e[0]['t'] if e else None

WINDOWS={
 'camera-before-power':'booting, before power-on event for the same run',
 'activation':'booting, after power-on, boot < 0.35',
 'arrival':'booting, 0.35 <= boot < 1.1',
 'drop':'booting, 1.1 <= boot < 1.9',
 'colour-glint':'booting, 1.9 <= boot < 3.5',
 'active-fade':'booting, 3.5 <= boot < 4',
 'camera-tail':'booting, boot == 4, before mode site',
 'text':'booting, 0.35 <= boot < 3.5',
 'text-through-fade':'booting, 0.35 <= boot < 4',
 'active-boot':'booting, after power-on, 0 <= boot < 4',
 'full-boot':'all recorded booting frames, including camera before power and tail',
 'return-powered':'returning, before power-off event for same run',
 'return-off':'returning, at or after power-off event for same run',
 'full-return':'all recorded returning frames for run 1 or 2; no run 0 frame data'}
def phase(f,d):
    if f['mode']=='returning':return 'return-powered' if f['t']<et(d,'screen-material-power',f['run'],on=False) else 'return-off'
    if f['t']<et(d,'screen-material-power',f['run'],on=True,mode='booting'):return 'camera-before-power'
    for b,p in [(.35,'activation'),(1.1,'arrival'),(1.9,'drop'),(3.5,'colour-glint'),(4,'active-fade')]:
        if f['boot']<b:return p
    return 'camera-tail'
def windows(f,d):
    p=phase(f,d);ws={p}
    if f['mode']=='returning':ws.add('full-return')
    else:
        ws.add('full-boot')
        if p!='camera-before-power' and f['boot']<4:ws.add('active-boot')
        if .35<=f['boot']<3.5:ws.add('text')
        if .35<=f['boot']<4:ws.add('text-through-fade')
    return ws
def overlaps(a,b,c,e):return max(a,c)<min(b,e)
def aligned(d,p,f):
    a,b=p['t'],f['t']
    return {'current':f,'previous':p,'rafGapMs':f['raf']-p['raf'],
      'currentStartMinusRafMs':f['t']-f['raf'],'previousStartMinusRafMs':p['t']-p['raf'],
      'gapMinusPreviousTotalMs':f['gapMs']-p['totalMs'],
      'previousOtherMs':p['totalMs']-p['paintMs']-p['gpuPrepareMs']-p['submitMs'],
      'eventsPreviousThroughCurrentCallback':[e for e in d['events'] if a<=e['t']<=b+f['totalMs']],
      'longtasksOverlappingGap':[e for e in d['longtasks'] if overlaps(a,b,e['t'],e['t']+e['duration'])],
      'resourcesOverlappingGap':[e for e in d['resources'] if e['duration']>=0 and overlaps(a,b,e['startTime'],e['startTime']+e['duration'])]}
def summary(d,r,w):
    ix=[i for i,f in enumerate(d['frames']) if f['run']==r and w in windows(f,d)]
    fs=[d['frames'][i] for i in ix]
    pairs=[(d['frames'][i-1],d['frames'][i]) for i in ix if d['frames'][i]['gapMs'] is not None]
    assert all(p['run']==f['run'] and p['mode']==f['mode'] for p,f in pairs)
    m={'engineGapMs':stats(f['gapMs'] for f in fs),'rafGapMs':stats(f['raf']-p['raf'] for p,f in pairs),
       'engineContainedMs':stats(f['gapMs'] for p,f in pairs if w in windows(p,d)),
       'rafContainedMs':stats(f['raf']-p['raf'] for p,f in pairs if w in windows(p,d)),
       'gapMinusPreviousTotalMs':stats(f['gapMs']-p['totalMs'] for p,f in pairs),
       'previousOtherMs':stats(p['totalMs']-p['paintMs']-p['gpuPrepareMs']-p['submitMs'] for p,f in pairs),
       'currentStartMinusRafMs':stats(f['t']-f['raf'] for f in fs)}
    for k in ['paintMs','gpuPrepareMs','submitMs','totalMs','recorderMs']:
        m['previous.'+k]=stats(p[k] for p,f in pairs)
        m['current.'+k]=stats(f[k] for f in fs)
    worst={}
    for name,key in [('engineGapMs',lambda x:x[1]['gapMs']),('rafGapMs',lambda x:x[1]['raf']-x[0]['raf'])]:
        worst[name]=[aligned(d,p,f) for p,f in sorted(pairs,key=key,reverse=True)[:3]]
    return {'frameCount':len(fs),'bootMin':min(f['boot'] for f in fs),'bootMax':max(f['boot'] for f in fs),'metrics':m,'worst':worst}
def startup(d):
    nav=d['navigation'][0]
    kinds=['diagnostic-initialized','create-room','boot-canvas-context-created','atlas-fetch-start','atlas-fetch-end',
      'atlas-decode-start','atlas-decode-end','atlas-ready','atlas-upload-requested','atlas-upload-submitted','model-parsed',
      'assets-prepared','compile-wait-start','compile-wait-end','font-wait-start','fonts-ready','room-ready',
      'START-DOM','START-animation-start','START-animation-complete']
    m={k:et(d,k,0) for k in kinds}
    m.update({'navigation-response-end':nav['responseEnd'],'first-room-mode':et(d,'mode',to='room'),
      'first-back':et(d,'BACK-gesture',0),'run0-return-complete':et(d,'return-animation-complete',0),'first-start':et(d,'START-gesture',0)})
    pairs=[('navigation-response-end','create-room'),('navigation-response-end','room-ready'),('create-room','room-ready'),
      ('create-room','model-parsed'),('model-parsed','assets-prepared'),('assets-prepared','compile-wait-start'),
      ('compile-wait-start','compile-wait-end'),('compile-wait-end','font-wait-start'),('font-wait-start','fonts-ready'),
      ('fonts-ready','room-ready'),('room-ready','START-DOM'),('first-room-mode','START-DOM'),('START-DOM','START-animation-start'),
      ('START-animation-start','START-animation-complete'),('first-room-mode','START-animation-complete'),
      ('atlas-fetch-start','atlas-fetch-end'),('atlas-decode-start','atlas-decode-end'),('atlas-ready','atlas-upload-submitted'),
      ('atlas-upload-submitted','room-ready')]
    seg={a+' -> '+b:None if m[a] is None or m[b] is None else m[b]-m[a] for a,b in pairs}
    resources=d['resources']
    assets=[x for x in resources if (x['initiatorType']=='fetch' and '/_app/immutable/assets/' in x['path']) or x['path']=='/boot-atlas.png']
    latest=max(x['startTime']+x['duration'] for x in assets if x['duration']>=0)
    return {'navigation':nav,'marks':m,'segmentsMs':seg,'initialMode':es(d,'mode')[0]['to'],
      'resources':resources,'lastAssetResourceEnd':latest,'lastAssetEndToAssetsPreparedMs':m['assets-prepared']-latest,
      'lastAssetEndToRoomReadyMs':m['room-ready']-latest,
      'cacheEvidence':{'zeroTransferPositiveEncoded':sum(x['transferSize']==0 and x['encodedBodySize']>0 for x in resources),
         'positiveTransfer':sum(x['transferSize']>0 for x in resources),'zeroTransferZeroEncoded':sum(x['transferSize']==0 and x['encodedBodySize']==0 for x in resources)},
      'invalidResourceDurations':[x for x in resources if x['duration']<0],
      'longtasks':d['longtasks'],'startupLongtaskDurationSumMs':sum(x['duration'] for x in d['longtasks'] if x['t']<m['room-ready']),
      'bootLongtasks':[x for x in d['longtasks'] if x['t']>=et(d,'mode',1,to='booting')]}
def validate(d,name,path,expected):
    _,size,sha,mode=expected;b=path.read_bytes();errs=schema_errors(d,read(PREVIEW/'capture.schema.json'))
    c={'bytes':len(b)==size,'hash':hashlib.sha256(b).hexdigest()==sha,'schema':not errs,'mode':d['experiment']['mode']==mode,
      'completion':all(d['completion'].values()),'zeroDropped':all(v==0 for k,v in d['counts'].items() if k!='runs'),
      'noErrors':not d['errors'],'sessionObserved':not d['sessionUnobserved'],'runMarkersObserved':all(not u['markers'] for u in d['unobserved']),
      'visible':d['metadata']['visibility']=='visible' and all(e['state']=='visible' for e in es(d,'visibility')),
      'fontsLoaded':d['metadata']['fonts']['status']=='loaded','noReducedMotion':d['metadata']['reducedMotion'] is False,
      'eventOrder':all(a['t']<=b['t'] for a,b in zip(d['events'],d['events'][1:])),
      'frameOrder':all(a['t']<b['t'] and a['raf']<b['raf'] for a,b in zip(d['frames'],d['frames'][1:]))}
    phasebad=[];gapbad=[];timebad=[];runs={}
    for i,f in enumerate(d['frames']):
        p=phase(f,d);recorded='return' if f['mode']=='returning' else 'fade' if p in ('active-fade','camera-tail') else p
        if f['phase']!=recorded:phasebad.append(i)
        if not 0<=f['boot']<=4 or not 0<=f['raf']<=f['t'] or any(f[k]<0 for k in ['paintMs','gpuPrepareMs','submitMs','totalMs','recorderMs']):timebad.append(i)
        if f['totalMs']+1e-5<f['paintMs']+f['gpuPrepareMs']+f['submitMs']:timebad.append(i)
        if f['gapMs'] is None:
            if i and (f['run'],f['mode'])==(d['frames'][i-1]['run'],d['frames'][i-1]['mode']):gapbad.append(i)
        else:
            p=d['frames'][i-1]
            if (f['run'],f['mode'])!=(p['run'],p['mode']) or abs(f['t']-p['t']-f['gapMs'])>1e-5:gapbad.append(i)
    for r in [1,2]:
        start=et(d,'mode',r,to='booting');end=et(d,'boot-animation-complete',r)
        rstart=et(d,'mode',r,to='returning');rend=et(d,'return-animation-complete',r)
        glyph='glyph-draw-submitted-' if name=='gpu' else 'glyph-painted-'
        req=[glyph+str(i) for i in range(11) if i!=4]+['domain-draw-submitted' if name=='gpu' else 'domain-painted']
        if name!='gpu':req+=['screen-texture-upload-submitted']
        fs=[f for f in d['frames'] if f['run']==r and f['mode']=='booting']
        runs[r]={'trustedStart':any(e.get('trusted') is True for e in es(d,'START-gesture',r-1)),
          'trustedBack':any(e.get('trusted') is True for e in es(d,'BACK-gesture',r)),
          'markers':all(start<=et(d,k,r)<=end for k in req),'bootBounds':all(start<=f['t']<=end for f in fs),
          'returnBounds':all(rstart<=f['t']<=rend for f in d['frames'] if f['run']==r and f['mode']=='returning'),
          'bootMonotonic':all(a['boot']<=b['boot'] for a,b in zip(fs,fs[1:]))}
    c.update({'phaseReconstruction':not phasebad,'gapReconstruction':not gapbad,'timingBounds':not timebad,'runChecks':all(all(r.values()) for r in runs.values())})
    if name=='gpu':
        c.update({'noCanvasEvents':not any('painted' in e['kind'] or e['kind'].startswith('screen-texture') or e['kind']=='boot-canvas-context-created' for e in d['events']),
          'zeroCanvasPaint':all(f['paintMs']==0 for f in d['frames']),
          'oneSessionAtlasUpload':d['experiment']['textureCounts']=={'canvas':{'requests':0,'submissions':0},'atlas':{'requests':1,'submissions':1}}})
    assert all(c.values()),(name,c,errs,phasebad,gapbad,timebad,runs)
    return {'path':str(path),'bytes':len(b),'sha256':sha,'checks':c,'schemaErrors':errs,'runChecks':runs,
      'counts':{k:len(d[k]) for k in ['frames','events','resources','errors','longtasks']},
      'sessionId':d['sessionId'],'capturedAt':d['capturedAt'],'metadata':d['metadata'],'experiment':d['experiment'],'visibilityEvents':es(d,'visibility')}

def main():
    validation={};result={};csvrows=[];manifest=read(PREVIEW/'source-manifest.json');sc=[]
    for f in manifest['files']:
        p=PREVIEW/'source-stage'/f['path'];b=p.read_bytes()
        sc.append({'path':f['path'],'pass':len(b)==f['bytes'] and hashlib.sha256(b).hexdigest()==f['sha256']})
    assert all(x['pass'] for x in sc)
    for name,x in INPUTS.items():
        path=ATTACH/('fab6e615-3ee1-4b06-99e4-bbf3bda6d6af-'+x[0]+'-json.json');d=read(path);validation[name]=validate(d,name,path,x)
        runs={}
        for r in [1,2]:
            runs[r]={w:summary(d,r,w) for w in WINDOWS}
            for w,s in runs[r].items():
                for metric,stat in s['metrics'].items():csvrows.append({'mode':name,'run':r,'window':w,'frameCount':s['frameCount'],'metric':metric,**stat})
        transitions=[]
        for r in [1,2]:
            start=et(d,'mode',r,to='booting');power=et(d,'screen-material-power',r,on=True,mode='booting')
            end=et(d,'boot-animation-complete',r);gesture=et(d,'START-gesture',r-1)
            domain=et(d,'domain-draw-submitted' if name=='gpu' else 'domain-painted',r)
            pf=next(f for f in d['frames'] if f['run']==r and f['mode']=='booting' and f['t']>=power)
            last=max((f for f in d['frames'] if f['run']==r and f['mode']=='booting'),key=lambda f:f['t'])
            transitions.append({'run':r,'gestureToBootModeMs':start-gesture,'bootModeToPowerMs':power-start,
              'powerToFirstFrameMs':pf['t']-power,'firstPoweredFrame':pf,'powerToDomainMarkerMs':domain-power,
              'bootModeToCompleteMs':end-start,'powerToCompleteMs':end-power,'lastFrameToCompleteMs':end-last['t'],
              'lastRafToCompleteMs':end-last['raf'],'lastFrameTotalMs':last['totalMs']})
        result[name]={'runs':runs,'startup':startup(d),'transitions':transitions}
    report={'method':{'quantiles':'Linear interpolation at (n-1)*p; no rounding before comparisons.',
      'gapAssignment':'Assign incoming gap to current frame phase. Previous frame must have same run and mode.',
      'nulls':'First frame of each recorded boot and return has null gap; no synthetic rAF interval.',
      'timingPairs':'Previous callback distributions correspond to the incoming gap. Current distributions also saved.',
      'containedSensitivity':'Contained gap requires both endpoints in the window.',
      'nested':'Paint/preparation and submit are inside total. Never add total to these parts.',
      'remainder':'Gap minus previous total is elapsed time outside the previous instrumented engine callback, not GPU time.',
      'returnPaint':'Canvas return fills have no paintMs timer; zero paintMs does not establish zero Canvas work.',
      'rates':'42 and 50 ms rates are descriptive, not acceptance thresholds.',
      'schema':'Validator implements all assertion keywords used by this supplied schema, not a general library.','windows':WINDOWS},
      'source':{'sourceId':manifest['sourceId'],'manifestStageDigest':manifest['stageDigest'],'files':sc},
      'validation':validation,'modes':result,
      'qualitativeUserEvidence':{'default':'Original canvas. Confirmed slower than the other 2 visually.','gpuVersusControl':'About the same','atlasText':'Looks consistent'}}
    write('evidence.json',report)
    with (OUT/'metrics.csv').open('w',newline='',encoding='utf-8') as f:
        wr=csv.DictWriter(f,fieldnames=['mode','run','window','frameCount','metric','n','mean','p50','p95','max','min','ge42','ge42_pct','gt50','gt50_pct'])
        wr.writeheader();wr.writerows(csvrows)
    print('Validated all three originals and all',len(sc),'staged manifest files.')
    for name in INPUTS:
        print(name,validation[name]['counts'])
        for r in [1,2]:
            for w in WINDOWS:
                m=result[name]['runs'][r][w]['metrics']
                print(r,w,'engine',json.dumps({k:round(v,3) if isinstance(v,float) else v for k,v in m['engineGapMs'].items()}),'rafmean',round(m['rafGapMs']['mean'],3))
        print('STARTUP',json.dumps(result[name]['startup']['segmentsMs']))
if __name__=='__main__':main()
