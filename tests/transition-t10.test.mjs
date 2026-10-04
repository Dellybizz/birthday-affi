import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript'),cache=new Map();
function load(file){file=path.resolve(file);if(cache.has(file))return cache.get(file).exports;const module={exports:{}};cache.set(file,module);const source=fs.readFileSync(file,'utf8');const code=ts.transpile(source,{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022});new Function('require','module','exports',code)(name=>name.startsWith('.')?load(path.resolve(path.dirname(file),name+'.ts')):require(name),module,module.exports);return module.exports}
const editor=load('packages/content/src/app-editor.ts');
const pages=load('packages/content/src/default-pages.ts');
const panel=fs.readFileSync(new URL('../apps/admin/components/app-content-manager.tsx',import.meta.url),'utf8');

test('T10 defines purpose-built authoring for every editable phone app',()=>{
 const expected={reasons:['reason'],hotline:['keypad-message'],adventure:['photo','video'],movie:['post','reel'],'kiss-shop':['gift'],radio:['station','track']};
 for(const [slug,actions] of Object.entries(expected))assert.deepEqual(editor.getAppEditorDefinition(slug).actions.map(action=>action.key),actions,slug);
});

test('T10 Saragram creates distinct photo posts and video reels inside the canonical feed',()=>{
 let document=pages.createDefaultPage('movie');
 let result=editor.addAppEditorItem(document,'movie','post','t10-post');document=result.document;
 result=editor.addAppEditorItem(document,'movie','reel','t10-reel');document=result.document;
 const post=document.nodes.find(node=>node.id==='t10-post'),reel=document.nodes.find(node=>node.id==='t10-reel');
 assert.equal(post.props.mediaKind,'image');assert.equal(reel.props.mediaKind,'video');
 const feed=document.nodes.find(node=>node.props.sectionKind==='movie-player');assert.ok(feed.children.includes('t10-post'));assert.ok(feed.children.includes('t10-reel'));
 const items=editor.getAppEditorItems(document,'movie');assert.equal(items.find(item=>item.id==='t10-post').actionKey,'post');assert.equal(items.find(item=>item.id==='t10-reel').actionKey,'reel');
});

test('T10 Pardanasheen adds photos and videos to the real photo library',()=>{
 let document=pages.createDefaultPage('adventure');
 document=editor.addAppEditorItem(document,'adventure','photo','t10-photo').document;
 document=editor.addAppEditorItem(document,'adventure','video','t10-video').document;
 assert.equal(document.nodes.find(node=>node.id==='t10-photo').component,'image');
 assert.equal(document.nodes.find(node=>node.id==='t10-video').component,'video');
 assert.equal(editor.getAppEditorItems(document,'adventure').slice(-2).length,2);
});

test('T10 section shortcuts resolve app-specific settings such as Saragram profile',()=>{
 const document=pages.createDefaultPage('movie'),sections=editor.getAppEditorSections(document,'movie');
 assert.equal(sections.find(value=>value.entry.key==='profile').node.props.sectionKind,'movie-credits');
 assert.equal(sections.find(value=>value.entry.key==='ending').node.props.sectionKind,'birthday-ending');
});

test('T10 app panel exposes add-content, item collection, app sections and shared resources',()=>{
 for(const marker of ['data-t10-app-content-manager','Add content','Content','App sections','Shared resources','Media library'])assert.match(panel,new RegExp(marker));
 assert.match(panel,/onAdd\(action\.key\)/);assert.match(panel,/onSelect\(item\.id\)/);
});
