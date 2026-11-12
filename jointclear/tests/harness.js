// Test harness: open JointClear HTML in Chromium with CDN routed to local npm packages.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const DEPS = process.env.JC_DEPS || path.join(__dirname, 'deps', 'node_modules');
async function open(file, { offline = false, touch = false } = {}) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 }, acceptDownloads: true, hasTouch: touch });
  await context.route('https://cdn.jsdelivr.net/**', async route => {
    if (offline) return route.abort();
    const m = new URL(route.request().url()).pathname.match(/^\/npm\/([^@/]+)@[^/]+\/(.*)$/);
    const f = m && path.join(DEPS, m[1], m[2]);
    if (!f || !fs.existsSync(f)) return route.fulfill({ status: 404, body: 'nf' });
    const ct = f.endsWith('.wasm') ? 'application/wasm' : 'application/javascript';
    route.fulfill({ status: 200, body: fs.readFileSync(f), contentType: ct, headers: { 'access-control-allow-origin': '*' } });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve(file));
  await page.waitForTimeout(1500);
  return { browser, context, page, errors };
}
// Apply cfg patch (on top of DEFAULT) and adjust, regenerate, return summary.
async function run(page, patch = {}, adjust = {}) {
  return page.evaluate(([patch, adj]) => {
    cfg = { ...DEFAULT, ...patch }; adjust = JSON.parse(JSON.stringify(adj)); selected = null;
    inputWarnings = []; updateUI(); generate(); draw();
    const cat = it => it.id.replace(/_\d+$/, '').replace(/_\d+_/, '_').replace(/_(top|bot)_\d+$/, '_$1');
    return {
      n: issues.length,
      items: items.length,
      warnings: modelWarnings.slice(),
      pairs: issues.map(i => [i.a.id, i.b.id, +i.clear.toFixed(2), +i.req.toFixed(2)]),
    };
  }, [patch, adjust]);
}
module.exports = { open, run };
