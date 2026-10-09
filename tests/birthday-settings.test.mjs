import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {PGlite} from '@electric-sql/pglite';
const module={exports:{}};new Function('exports',ts.transpile(fs.readFileSync('packages/content/src/birthday-settings.ts','utf8'),{module:ts.ModuleKind.CommonJS}))(module.exports);
const {birthdayPassword,birthdayInstant}=module.exports;
test('birthday password uses full selected date and changes with it',()=>{assert.equal(birthdayPassword('2005-11-12'),'12112005');assert.equal(birthdayPassword('2006-10-10'),'10102006')});
test('birthday time respects timezone and celebrates an old birthdate this year',()=>{assert.equal(birthdayInstant('2005-11-12','21:30','Asia/Kolkata',new Date('2026-10-09T00:00:00Z')),'2026-11-12T16:00:00.000Z');assert.equal(birthdayInstant('2005-11-12','08:15','America/New_York',new Date('2026-10-09T00:00:00Z')),'2026-11-12T13:15:00.000Z')});
test('birthday stays unlocked after the selected time on the day, rolls over afterwards, and handles leap days',()=>{assert.equal(birthdayInstant('2005-10-09','00:00','Asia/Kolkata',new Date('2026-10-09T12:00:00Z')),'2026-10-08T18:30:00.000Z');assert.equal(birthdayInstant('2005-10-09','00:00','Asia/Kolkata',new Date('2026-10-10T12:00:00Z')),'2027-10-08T18:30:00.000Z');assert.equal(birthdayInstant('2004-02-29','00:00','UTC',new Date('2026-10-09T12:00:00Z')),'2028-02-29T00:00:00.000Z')});
test('database birthday time validator accepts legacy settings and rejects invalid time',async()=>{const db=new PGlite();try{await db.exec(`create schema private;create role anon;create role authenticated;create function private.assert_base_site_document(doc jsonb) returns void language plpgsql as $$begin if doc ? 'birthtime' then raise exception 'Unexpected field';end if;end$$;`);await db.exec(fs.readFileSync('supabase/migrations/20261009004914_birthday_time_setting.sql','utf8'));await db.query('select private.assert_base_site_document($1)',[{birthtime:'23:59'}]);await db.query('select private.assert_base_site_document($1)',[{}]);await assert.rejects(db.query('select private.assert_base_site_document($1)',[{birthtime:'25:00'}]),/Invalid birthday time/);}finally{await db.close()}});

 test('preserved Final Reel scripts compile without the previous project runtime',()=>{
  const source=fs.readFileSync('apps/web/lib/final-reel-source.ts','utf8');
  const html=JSON.parse(source.slice(source.indexOf('=')+1).trim().replace(/;$/,''));
  assert.doesNotMatch(html,/supabase\.co|script src=/);assert.match(html,/play final reel/);assert.match(html,/wiffey-final-reel:back/);
  for(const match of html.replace('__FINAL_REEL_CONFIG__','{}').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>new Function(match[1]));
 });
