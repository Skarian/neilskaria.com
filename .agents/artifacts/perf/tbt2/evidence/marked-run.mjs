import {withServer,child} from './run.mjs';await withServer('marked',async()=>{await child('capture.mjs',['marked','native']);await child('capture.mjs',['marked','phone'])});
