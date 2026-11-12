// Touch (CDP) drag + pinch on the plan, second 3DM export, 3D screenshots for colour check.
const { open, run } = require('./harness');
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const [file, shotDir] = process.argv.slice(2);
  const { browser, page, errors } = await open(file, { touch: true });
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p.x, y: p.y, id: i })) });
  await run(page, {});
  const P = await page.evaluate(() => { const b = canvas.getBoundingClientRect(), it = items.find(i => i.id === 'ped_0'), p = world2plan(it.a.x, it.a.y); return { x: b.left + p.x, y: b.top + p.y, s: mm2px(1) } });
  // one-finger drag of ped_0 by +40px in x
  await touch('touchStart', [P]); for (let k = 1; k <= 8; k++) await touch('touchMove', [{ x: P.x + 5 * k, y: P.y }]); await touch('touchEnd', []);
  let r = await page.evaluate(() => ({ adj: adjust.ped_0, sel: selected }));
  ok(r.sel === 'ped_0' && r.adj && Math.abs(r.adj.x - Math.round(40 / P.s)) <= 1, 'one-finger drag moved ped_0: ' + JSON.stringify(r));
  // pinch with second finger while dragging: move cancelled, zoom changes
  await run(page, {}); const z0 = await page.evaluate(() => zoom);
  await touch('touchStart', [P]); await touch('touchMove', [{ x: P.x + 30, y: P.y }]);
  await touch('touchStart', [{ x: P.x + 30, y: P.y }, { x: P.x + 130, y: P.y }]);
  for (let k = 1; k <= 5; k++) await touch('touchMove', [{ x: P.x + 30 - 10 * k, y: P.y }, { x: P.x + 130 + 10 * k, y: P.y }]);
  await touch('touchEnd', []);
  r = await page.evaluate(() => ({ adj: adjust.ped_0 || null, zoom }));
  ok(r.adj === null && r.zoom > z0 * 1.5, 'second finger cancels move and pinch-zooms: ' + JSON.stringify(r) + ' from ' + z0);
  // second 3DM export reuses the module
  for (let i = 0; i < 2; i++) { const d = page.waitForEvent('download', { timeout: 60000 }); await page.click('#rhinoBtn'); await d; }
  ok((await page.textContent('#exportStatus')).includes('3DM出力完了'), '3DM exported twice: ' + await page.textContent('#exportStatus'));
  // 3D screenshots (default + general anchor, selection)
  await page.click('#view3dTab'); await page.waitForTimeout(800);
  await page.locator('.view').screenshot({ path: shotDir + '/v20_3d_foundation.png' });
  await run(page, { partMode: 'general', colJoint: 'anchor', lowZ1: -150, upZ0: -750 }); await page.evaluate(() => JC3D_SELECT('low_0')); await page.waitForTimeout(800);
  await page.locator('.view').screenshot({ path: shotDir + '/v20_3d_general_anchor.png' });
  console.log('errors:', errors);
  await browser.close();
})();
