// Compile the canonical TS factories for migration preparation without a second content source.
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>load(path.resolve(path.dirname(file),name+'.ts')),module,module.exports);return module.exports;}
export const content=load('packages/content/src/default-pages.ts');
export const progress=load('packages/content/src/layout-progress.ts');
export const contracts=load('packages/content/src/layout-contract.ts');
if(process.argv[1]===new URL(import.meta.url).pathname)process.stdout.write(JSON.stringify(Object.fromEntries(content.builtinPages.map(slug=>[slug,content.createDefaultPage(slug)]))));
export const phone=load('packages/content/src/phone-home.ts');
