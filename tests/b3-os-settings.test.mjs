import test from 'node:test';
import assert from 'node:assert/strict';
import {loadContentModule} from './load-content-module.mjs';
const content={...loadContentModule('packages/content/src/site-document.ts'),...loadContentModule('packages/content/src/os-settings.ts')};
const {defaultSiteDocument:base,defaultOsSettings:defaults,parseSiteDocument:parse,parseOsSettings,fitPhone,osSettingFields}=content;
test('B3 optional OS controls preserve existing settings and reject unknown or incomplete settings',()=>{
 assert.deepEqual(parse(base),base);assert.equal(Object.hasOwn(parse(base),'os'),false);
 assert.deepEqual(parse({...base,os:defaults}).os,defaults);
 assert.throws(()=>parse({...base,os:{...defaults,unknown:true}}));
 const partial={...defaults};delete partial.height;assert.throws(()=>parse({...base,os:partial}));
 assert.throws(()=>parse({...base,os:null}));assert.throws(()=>parse({...base,os:[]}));
});
test('B3 every OS control validates types, bounds and enumerated options',()=>{
 for(const [key,field] of Object.entries(osSettingFields)){
  assert.throws(()=>parseOsSettings({...defaults,[key]:null}),key);
  if(field.type==='number'){
   assert.throws(()=>parseOsSettings({...defaults,[key]:field.min-.01}),key+' minimum');
   assert.throws(()=>parseOsSettings({...defaults,[key]:field.max+.01}),key+' maximum');
   assert.throws(()=>parseOsSettings({...defaults,[key]:NaN}),key+' finite');
   assert.equal(parseOsSettings({...defaults,[key]:field.min})[key],field.min);
   assert.equal(parseOsSettings({...defaults,[key]:field.max})[key],field.max);
  }
  if(field.options)assert.throws(()=>parseOsSettings({...defaults,[key]:'unknown'}),key);
 }
 for(const fixedTime of ['25:00','09:60','9:41'])assert.throws(()=>parseOsSettings({...defaults,fixedTime}));
 for(const wallpaper of ['javascript:alert(1)','//evil.example/image','https://user:pass@example.com/image'])assert.throws(()=>parseOsSettings({...defaults,wallpaper}));
 assert.equal(parseOsSettings({...defaults,wallpaper:'/media/photo'}).wallpaper,'/media/photo');
 assert.throws(()=>parseOsSettings({...defaults,gridColumns:3.5}));
});
test('B3 uniform fitting preserves aspect ratio and stays within narrow/short viewports',()=>{
 for(const [vw,vh] of [[320,568],[390,844],[430,932],[768,1024],[1440,900]]){
  for(const os of [defaults,{...defaults,width:480,height:1100,scale:1.5,frameWidth:16,viewportPadding:32}]){
   const result=fitPhone(os,vw,vh);
   assert.ok(result.scale>0&&result.scale<=os.scale);assert.ok(result.width*result.scale<=vw-os.viewportPadding*2+.01);assert.ok(result.height*result.scale<=vh-os.viewportPadding*2+.01);
   assert.ok(Math.abs(result.width-result.scale*result.width/result.scale)<.0001);
  }
 }
 assert.equal(fitPhone({...defaults,position:'top'},430,932).top,defaults.viewportPadding);
});
