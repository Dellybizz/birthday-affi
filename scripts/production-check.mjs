import assert from 'node:assert/strict';

const targets = [
  {base: 'https://wiffeyyyy-os.vercel.app', service: 'web', page: '/home', marker: 'Happy birthday'},
  {base: 'https://wiffeyyyy-panel.vercel.app', service: 'admin', page: '/login', marker: 'Welcome back'},
];

async function check(target) {
  const start = Date.now();
  const health = await fetch(`${target.base}/api/health`, {signal: AbortSignal.timeout(15000), redirect: 'error'});
  assert.equal(health.status, 200, `${target.service} health HTTP status`);
  const body = await health.json();
  assert.equal(body.ok, true, `${target.service} health result`);
  assert.equal(body.service, target.service, 'health service identity');
  assert.ok(Number.isFinite(Date.parse(body.timestamp)), 'health timestamp');
  const page = await fetch(`${target.base}${target.page}`, {signal: AbortSignal.timeout(15000), redirect: 'error'});
  assert.equal(page.status, 200, `${target.service} entry page status`);
  assert.ok((await page.text()).includes(target.marker), `${target.service} page content`);
  if (target.service === 'admin') {
    const protectedPage = await fetch(`${target.base}/editor/home`, {signal: AbortSignal.timeout(15000), redirect: 'manual'});
    assert.equal(protectedPage.status, 307, 'anonymous editor redirect');
    const location = new URL(protectedPage.headers.get('location'), target.base);
    assert.equal(location.origin, target.base, 'same-origin login redirect');
    assert.equal(location.pathname, '/login', 'anonymous editor blocked');
    assert.match(protectedPage.headers.get('cache-control') ?? '', /no-store/, 'private redirect must not cache');
  }
  console.log(JSON.stringify({service: target.service, result: 'pass', ms: Date.now() - start}));
}

const results = await Promise.allSettled(targets.map(check));
results.forEach((result, index) => {
  if (result.status === 'rejected') {
    console.error(JSON.stringify({service: targets[index].service, result: 'fail', message: result.reason.message}));
    process.exitCode = 1;
  }
});
