// v2.0 specific checks: legacy JSON, anchor mode, hook directions, through warnings, selection fixes, cornerN=3 symmetry.
const { open, run } = require('./harness');
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const { browser, page, errors } = await open(process.argv[2]);
  // 1. legacy JSON (v1.9 and v1.8 style, no colJoint) -> anchor mode, cfg values kept, hooks at ends
  for (const [tag, extra] of [['v1.9', { appVersion: '1.9', schemaVersion: 2 }], ['v1.8-no-version', {}]]) {
    const r = await page.evaluate(([extra]) => {
      const old = { ...extra, cfg: { ...DEFAULT, partMode: 'general', lowZ0: -300, lowZ1: 1600, upZ0: 0, upZ1: 1600 }, adjust: { low_hook_2: { x: 0, y: 15 }, up_3: { x: 10, y: 0 } } };
      delete old.cfg.colJoint;
      loadModel(JSON.parse(JSON.stringify(old))); updateUI(); generate(); refreshSelection(); draw();
      const h = items.filter(i => /_hook_/.test(i.id));
      return { colJoint: cfg.colJoint, lowZ: [cfg.lowZ0, cfg.lowZ1], adjust, hookZ: [...new Set(h.map(i => i.a.z))], parentEnds: h.every(i => { const p = items.find(x => x.id === i.parentId); const e = i.id.startsWith('low') ? p.b : p.a; return e.x === i.a.x && e.y === i.a.y && e.z === i.a.z }), n: issues.length, warnings: modelWarnings };
    }, [extra]);
    ok(r.colJoint === 'anchor' && r.lowZ[0] === -300 && r.lowZ[1] === 1600, `${tag} JSON loads as anchor with saved levels`);
    ok(JSON.stringify(r.adjust) === JSON.stringify({ low_2: { x: 0, y: 15 }, up_3: { x: 10, y: 0 } }), `${tag} hook adjust mapped to parent ` + JSON.stringify(r.adjust));
    ok(r.parentEnds && r.hookZ.sort().join() === '0,1600', `${tag} hooks start at bar ends z=${r.hookZ}`);
    console.log('     issues', r.n, 'warnings', r.warnings);
  }
  // 2. anchor mode, hook directions stay inside the section and are symmetric
  for (const dir of ['inward', 'cw', 'ccw']) {
    await run(page, { partMode: 'general', colJoint: 'anchor', hookDir: dir });
    const r = await page.evaluate(() => items.filter(i => /^low_hook_/.test(i.id)).map(h => ({ x: h.a.x, y: h.a.y, dx: Math.round((h.b.x - h.a.x) / cfg.hookLen * 100) / 100, dy: Math.round((h.b.y - h.a.y) / cfg.hookLen * 100) / 100, ex: h.b.x, ey: h.b.y })));
    const inside = r.every(h => Math.abs(h.ex) <= 450 - 50 && Math.abs(h.ey) <= 450 - 50);
    const sym = r.every(h => r.some(g => Math.abs(g.x + h.x) < 1e-6 && Math.abs(g.y + h.y) < 1e-6 && Math.abs(g.dx + h.dx) < 1e-6 && Math.abs(g.dy + h.dy) < 1e-6));
    const mid = r.filter(h => Math.abs(h.x) < 1 || Math.abs(h.y) < 1).map(h => `(${h.x},${h.y})->(${h.dx},${h.dy})`).join(' ');
    ok(inside && sym, `hookDir=${dir}: hook ends inside cover line, point-symmetric | mid-face: ${mid} | corner(-371,-371)->${JSON.stringify(r.find(h => h.x < -370 && h.y < -370)).replace(/"/g, '')}`);
  }
  // 3. anchor devLen warning thresholds
  let r = await run(page, { partMode: 'general', colJoint: 'anchor', lowZ1: -400, upZ0: -500 });
  ok(r.warnings.some(w => w.includes('下部柱') && w.includes('500mm')) && !r.warnings.some(w => w.includes('上部柱:')), 'devLen warning: lower 500<550 warned, upper 500... ' + JSON.stringify(r.warnings));
  r = await run(page, { partMode: 'general', colJoint: 'anchor', lowZ1: -350, upZ0: -550 });
  ok(!r.warnings.some(w => w.includes('定着長')), 'devLen exactly 550 both: no warning');
  // 4. through mode mismatch warning, and clean default
  r = await run(page, { partMode: 'general' }); ok(!r.warnings.length, 'through default: no warnings, issues=' + r.n);
  ok(!r.pairs.some(([a, b]) => /^low_\d+$/.test(a) && /^up_\d+$/.test(b) || /^up_\d+$/.test(a) && /^low_\d+$/.test(b)), 'through default: no low x up main-bar pairs');
  r = await run(page, { partMode: 'general', upperX: 800, upperY: 800 }); ok(r.warnings.some(w => w.includes('通し筋') && w.includes('32 本')), 'through + section change warns: ' + r.warnings);
  r = await run(page, { partMode: 'general', lowZ1: -100 }); ok(r.warnings.some(w => w.includes('通し筋')), 'through + level gap warns');
  // 5. stale selection: select hook, switch to foundation, apply -> no junk adjust
  await run(page, { partMode: 'general', colJoint: 'anchor' });
  r = await page.evaluate(() => { selected = 'low_hook_3'; refreshSelection(); const f = document.querySelector('[data-k="partMode"]'); f.value = 'foundation'; f.dispatchEvent(new Event('change')); document.getElementById('adjX').value = 25; document.getElementById('applyAdj').click(); return { selected, adjust: { ...adjust }, name: document.getElementById('selName').textContent } });
  ok(r.selected === null && !Object.keys(r.adjust).length && r.name === '未選択', 'stale selection cleared; apply writes nothing ' + JSON.stringify(r));
  // 6. pick cycling through >2 stacked candidates at one point (anchor mode corner: low_0, up_0, low_hook_0, up_hook_0)
  await run(page, { partMode: 'general', colJoint: 'anchor' });
  const pt = await page.evaluate(() => { const b = canvas.getBoundingClientRect(), p = world2plan(-371, -371); return { x: b.left + p.x, y: b.top + p.y } });
  const seen = [];
  for (let i = 0; i < 5; i++) { await page.mouse.click(pt.x, pt.y); seen.push(await page.evaluate(() => selected)); await page.waitForTimeout(400); }
  ok(new Set(seen.slice(0, 4)).size === 4 && seen[4] === seen[0], 'pick cycle over 5 clicks (400ms apart): ' + seen.join(' > '));
  // 7. cornerN=3 symmetric about both axes
  await run(page, { columnType: 'steel', footingSystem: 'manufacturer', cornerN: 3 });
  r = await page.evaluate(() => items.filter(i => i.family === 'anchor').map(i => [i.a.x, i.a.y]));
  const has = (x, y) => r.some(p => p[0] === x && p[1] === y);
  ok(r.every(([x, y]) => has(-x, y) && has(x, -y)), 'cornerN=3 symmetric: ' + r.map(p => p.join(',')).join(' '));
  ok(await page.evaluate(() => document.getElementById('anPXLabel').textContent.includes('コーナー')), 'maker label switched');
  // 8. hidden-field visibility and slider range
  await run(page, { partMode: 'general' });
  r = await page.evaluate(() => ({ dev: document.getElementById('devLenWrap').classList.contains('hidden'), min: +el('sliceZ').min, max: +el('sliceZ').max }));
  ok(r.dev && r.min <= -1900, 'through hides devLen/hook inputs; slider ' + r.min + '..' + r.max);
  await run(page, {}); r = await page.evaluate(() => +el('sliceZ').min); ok(r <= -1950 - 100, 'foundation slider min covers pile concrete: ' + r);
  // 9. UI select change for colJoint is a string
  r = await page.evaluate(() => { const f = document.querySelector('[data-k="partMode"]'); f.value = 'general'; f.dispatchEvent(new Event('change')); const s = document.querySelector('[data-k="colJoint"]'); s.value = 'anchor'; s.dispatchEvent(new Event('change')); return { cj: cfg.colJoint, hooks: items.filter(i => /_hook_/.test(i.id)).length, hidden: el('devLenWrap').classList.contains('hidden') } });
  ok(r.cj === 'anchor' && r.hooks === 32 && !r.hidden, 'UI switch to anchor: ' + JSON.stringify(r));
  console.log('errors:', errors);
  await browser.close();
})();
