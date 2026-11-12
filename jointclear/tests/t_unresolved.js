const { open, run } = require('./harness');
(async () => {
  const { browser, page, errors } = await open(process.argv[2]);
  // 1. general RC: column extents, hook heights, hook directions
  await run(page, { partMode: 'general' });
  console.log('#1', await page.evaluate(() => {
    const f = id => items.find(i => i.id === id);
    const lv = beamLayerLevels();
    const hooks = items.filter(i => /_hook_/.test(i.id)).slice(0, 16).map(h => {
      const p = f(h.parentId); const dx = h.b.x - h.a.x, dy = h.b.y - h.a.y, L = Math.hypot(dx, dy);
      return `${h.id}: bar(${p.a.x},${p.a.y}) z${p.a.z}..${p.b.z} hookZ=${h.a.z} dir=(${(dx / L).toFixed(2)},${(dy / L).toFixed(2)})`;
    });
    return { beamX: [cfg.bxCZ - cfg.bxH / 2, cfg.bxCZ + cfg.bxH / 2], levels: lv, low0: [f('low_0').a.z, f('low_0').b.z], up0: [f('up_0').a.z, f('up_0').b.z], hooks };
  }));
  // 2. general S: steel column extents vs beams
  await run(page, { partMode: 'general', columnType: 'steel' });
  console.log('#2', await page.evaluate(() => {
    const s = cadShapes().filter(o => o.family === 'steel').map(o => [o.id, shapeBounds(o).map(v => +v.toFixed(1))]);
    const bars = items.filter(i => i.family === 'bx' && i.meta.side === 'top' && i.meta.layer === 0).map(i => i.a.y);
    return { steel: s, beamZ: [cfg.bxCZ - cfg.bxH / 2, cfg.bxCZ + cfg.bxH / 2], steelDims: steelDims(), bxTopL1_y: bars, storyH: cfg.storyH };
  }));
  // 3. manufacturer cornerN=1..4
  for (const n of [1, 2, 3, 4]) {
    await run(page, { columnType: 'steel', footingSystem: 'manufacturer', cornerN: n, anPX: 220, anPY: 220, cornerPX: 90, cornerPY: 90 });
    console.log('#3 cornerN=' + n, await page.evaluate(() => items.filter(i => i.family === 'anchor').map(i => `${i.id}(${i.a.x},${i.a.y})`).join(' ')));
  }
  // 4. pedestal too small for bars
  const r4 = await run(page, { pedX: 200, pedY: 200 });
  console.log('#4', await page.evaluate(() => ({ pedBars: items.filter(i => /^ped_\d+$/.test(i.id)).length, pedTies: items.filter(i => i.id.startsWith('ped_tie_')).length, conc: cadShapes().find(o => o.id === 'PEDESTAL_CONCRETE')?.bounds })), r4.warnings);
  for (const [k, v] of [['pedTopFL', -2000], ['pedNX', 0]]) { const r = await run(page, { [k]: v }); console.log('#4 ' + k + '=' + v, await page.evaluate(() => ({ pedBars: items.filter(i => /^ped_\d+$/.test(i.id)).length, pedTies: items.filter(i => i.id.startsWith('ped_tie_')).length })), r.warnings); }
  console.log('errors:', errors);
  await browser.close();
})();
