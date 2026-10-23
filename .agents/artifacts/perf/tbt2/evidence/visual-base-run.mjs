import{withServer,child}from'./run.mjs';await withServer('visual-base',async()=>child('visual-actions.mjs',['baseline']));
