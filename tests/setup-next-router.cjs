const path=require('node:path');
const {createRequire}=require('node:module');
const req=createRequire(path.resolve(__dirname,'../apps/admin/package.json'));
const modulePath=req.resolve('next/navigation');
const actual=req(modulePath);
if(require.cache[modulePath])require.cache[modulePath].exports={...actual,useRouter:()=>({push(){},replace(){},prefetch(){},refresh(){},back(){},forward(){}})};
