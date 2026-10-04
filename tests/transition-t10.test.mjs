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
const shell=fs.readFileSync(new URL('../apps/admin/app/editor/[slug]/editor-client.tsx',import.meta.url),'utf8');

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
 const items=editor.getAppEditorItems(document,'movie');assert.equal(items.find(item=>item.id==='t10-post').actionKey,'post');assert.equal(items.find(item=>item.id==='t10-post').mediaKind,'image');assert.equal(items.find(item=>item.id==='t10-reel').actionKey,'reel');assert.equal(items.find(item=>item.id==='t10-reel').mediaKind,'video');
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

test('T10 replaces generic app embeds with the live app-content manager in the Shopify editor',()=>{
 assert.match(shell,/import AppContentManager/);
 assert.match(shell,/addAppEditorItem/);
 assert.match(shell,/title="App content"/);
 assert.match(shell,/<AppContentManager slug=\{currentSlug\}/);
 assert.match(shell,/onAdd=\{addAppContent\}/);
});

test('T10.2 app operations preserve canonical hierarchy and support reorder, visibility, duplicate and delete',()=>{
 let document=pages.createDefaultPage('adventure');
 document=editor.addAppEditorItem(document,'adventure','photo','t10-a').document;
 document=editor.addAppEditorItem(document,'adventure','photo','t10-b').document;
 const parent=document.nodes.find(node=>node.id===document.nodes.find(node=>node.id==='t10-a').parentId);
 assert.ok(parent.children.indexOf('t10-a')<parent.children.indexOf('t10-b'));
 document=editor.moveAppEditorItem(document,'adventure','t10-b',-1);assert.ok(document.nodes.find(node=>node.id===parent.id).children.indexOf('t10-b')<document.nodes.find(node=>node.id===parent.id).children.indexOf('t10-a'));
 document=editor.toggleAppEditorItem(document,'adventure','t10-a');assert.equal(document.nodes.find(node=>node.id==='t10-a').visible,false);
 let n=0;const duplicated=editor.duplicateAppEditorItem(document,'adventure','t10-a',()=>`t10-copy-${++n}`);document=duplicated.document;assert.ok(document.nodes.some(node=>node.id===duplicated.selectedId));
 document=editor.removeAppEditorItem(document,'adventure','t10-a');assert.equal(document.nodes.some(node=>node.id==='t10-a'),false);
});

test('T10.2 direct media binding enforces the app item media type',()=>{
 let document=pages.createDefaultPage('movie');
 document=editor.addAppEditorItem(document,'movie','post','t10-media-post').document;
 document=editor.addAppEditorItem(document,'movie','reel','t10-media-reel').document;
 document=editor.setAppEditorItemMedia(document,'movie','t10-media-post',{id:'image-1',kind:'image',alt_text:'A memory',width:1200,height:900,metadata:{variants:[480,960]}});
 const post=document.nodes.find(node=>node.id==='t10-media-post');assert.equal(post.props.src,'/media/image-1');assert.equal(post.props.alt,'A memory');assert.equal(post.props.mediaAssetId,'image-1');
 assert.throws(()=>editor.setAppEditorItemMedia(document,'movie','t10-media-post',{id:'video-1',kind:'video',metadata:{}}),/Choose image media/);
 document=editor.setAppEditorItemMedia(document,'movie','t10-media-reel',{id:'video-1',kind:'video',metadata:{}});assert.equal(document.nodes.find(node=>node.id==='t10-media-reel').props.src,'/media/video-1');
});
