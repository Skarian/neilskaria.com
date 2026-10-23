import{withServer,child}from'./run.mjs';for(const label of['base','candidate'])await withServer(label,async()=>child('lh.mjs',[label,'desktop','3']));
