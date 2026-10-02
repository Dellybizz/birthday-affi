import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const inspector=fs.readFileSync('apps/admin/components/editor-inspector-fields.tsx','utf8');

test('P8 organizes editor controls into Shopify-style semantic cards',()=>{
 for(const heading of ['Content','Image','Media','Position','Typography','Colours','Layout','Padding','Margin','Border & shadow','Effects','Playback','Navigation','Animation','Visibility & behavior','Advanced'])assert.ok(inspector.includes("'"+heading+"'"),heading);
 assert.match(inspector,/function SettingsCard/);
 assert.match(inspector,/<details open=\{!advanced\}/);
 assert.match(inspector,/section==='Advanced'/);
});

test('P8 has visual spacing, responsive and boolean controls',()=>{
 assert.match(inspector,/function SpacingEditor/);
 for(const side of ['All sides','Top','Right','Bottom','Left'])assert.ok(inspector.includes(side),side);
 assert.match(inspector,/function Switch/);
 assert.match(inspector,/role="switch"/);
 assert.match(inspector,/function Segmented/);
 for(const scope of ['Default','Mobile','Tablet','Desktop'])assert.ok(inspector.includes("label:'"+scope+"'"),scope);
});

test('P8 image editor exposes preview, fit, replace, remove and nine-point focus',()=>{
 assert.match(inspector,/function ImagePreview/);
 assert.match(inspector,/current\?'Replace':'Add'/);
 assert.match(inspector,/>Remove<\/button>/);
 for(const label of ['Top left','Top','Top right','Left','Centre','Right','Bottom left','Bottom','Bottom right'])assert.ok(inspector.includes("['"+label+"'"),label);
 for(const fit of ['Fill','Fit','Stretch','Scale down'])assert.ok(inspector.includes("?'"+fit+"'")||inspector.includes(":"+"'"+fit+"'"),fit);
});

test('P8 typography and colour controls favor visual controls with exact-value fallback',()=>{
 assert.match(inspector,/field\.key==='align'/);
 assert.match(inspector,/ColourControl/);
 assert.match(inspector,/type="color"/);
 assert.match(inspector,/type="range"/);
 assert.match(inspector,/exact value/);
});
