import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
const cache=new Map();
export function loadContentModule(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const code=ts.transpile(fs.readFileSync(file,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>loadContentModule(path.resolve(path.dirname(file),name)+'.ts'),module,module.exports);return module.exports;}
