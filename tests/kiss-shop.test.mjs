import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const m={exports:{}};new Function('module','exports',ts.transpile(fs.readFileSync('packages/ui/src/kiss-shop-state.ts','utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}))(m,m.exports);
const {kissPrice,parseKissShopState,kissReceiptSvg}=m.exports;
test('Kiss prices handle house gifts and reject ambiguous or unbounded amounts',()=>{for(const [s,n] of [['1 kiss',1],['7 kisses',7],['1 sleepy kiss',1],['On the house ♡',0],['Free ♡',0],['-1 kisses',null],['1001 kisses',null],['many kisses',null]])assert.equal(kissPrice(s),n)});
test('Saved bags restore choices, discard duplicate and removed items, and preserve historical receipt snapshots',()=>{
 const r={id:'KS-TEST',createdAt:'2026-10-02T00:00:00Z',lines:[{id:'removed',title:'A lovely gift',price:'4 kisses',kisses:4,choice:'Something sweet'}]};
 const restored=parseKissShopState(JSON.stringify({version:1,bag:[{id:'ride',choice:'Something sweet'},{id:'ride',choice:'duplicate'},{id:'removed',choice:''}],receipts:[r]}),['ride']);
 assert.deepEqual(restored.bag,[{id:'ride',choice:'Something sweet'}]);assert.deepEqual(restored.receipts,[r]);assert.deepEqual(parseKissShopState('{bad',[]).bag,[]);assert.deepEqual(parseKissShopState('x'.repeat(200001),[]).receipts,[]);
});
test('Receipt downloads escape user copy and include choices and total',()=>{
 const svg=kissReceiptSvg({id:'KS-TEST',createdAt:'2026-10-02T00:00:00Z',lines:[{id:'x',title:'<script>bad</script>',price:'4 kisses',kisses:4,choice:'Sweet & cosy'}]});
 assert.doesNotMatch(svg,/<script>/);assert.match(svg,/&lt;script&gt;/);assert.match(svg,/Sweet &amp; cosy/);assert.match(svg,/Total: 4 kisses/);
});
