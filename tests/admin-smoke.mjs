import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { setTimeout } from 'node:timers/promises';
const require = createRequire(new URL('../apps/admin/package.json', import.meta.url));
const child = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'start', '-H', '127.0.0.1', '-p', '3101'], {
  cwd: new URL('../apps/admin/', import.meta.url),
  env: { ...process.env, NEXT_PUBLIC_SUPABASE_URL: '', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '', NEXT_PUBLIC_SUPABASE_ANON_KEY: '' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let output='';
child.stdout.on('data', value => { output+=value; });
child.stderr.on('data', value => { output+=value; });
const base='http://127.0.0.1:3101';
try {
  let ready=false;
  for (let attempt=0; attempt<50; attempt++) {
    try { const r=await fetch(base+'/api/health'); if(r.ok) { ready=true;break; } } catch { /* Await startup. */ }
    if (child.exitCode !== null) throw new Error('Admin server exited before startup.');
    await setTimeout(200);
  }
  assert.ok(ready, 'Admin production server starts');
  for (const path of ['/', '/editor/home', '/editor/camera', '/editor/vault', '/editor/pieces', '/vault', '/editor/home?pageId=00000000-0000-4000-8000-000000000011', '/unauthorized']) {
    const response=await fetch(base+path,{redirect:'manual'});
    assert.equal(response.status,307,path);
    assert.equal(new URL(response.headers.get('location')).pathname,'/login',path);
    assert.match(response.headers.get('cache-control'),/no-store/,path);
    console.log(path+': protected');
  }
  const login=await fetch(base+'/login');
  assert.equal(login.status,200);
  const html=await login.text();
  assert.match(html,/Welcome back/);
  assert.match(html,/Admin sign-in is unavailable until the site is configured/);
  assert.match(html,/disabled/);
  console.log('Login configuration state and health endpoint: passed');
} finally { child.kill('SIGTERM'); }
