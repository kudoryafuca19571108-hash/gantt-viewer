// Condition matrix: run every case, record issues/items/warnings/levels/shapes to JSON for before/after diffs.
// usage: node matrix.js <html> <out.json>
const { open, run } = require('./harness');
const fs = require('fs');
const CASES = {
  'F-RC default': {}, 'F-RC upperON': { showUpperRC: true }, 'F-S rhs': { columnType: 'steel' },
  'F-S chs': { columnType: 'steel', steelShape: 'chs' }, 'F-S h': { columnType: 'steel', steelShape: 'h' },
  'F-S maker n1': { columnType: 'steel', footingSystem: 'manufacturer', cornerN: 1 },
  'F-S maker n2': { columnType: 'steel', footingSystem: 'manufacturer', cornerN: 2 },
  'F-S maker n3': { columnType: 'steel', footingSystem: 'manufacturer', cornerN: 3 },
  'F-S maker n4': { columnType: 'steel', footingSystem: 'manufacturer', cornerN: 4 },
  'G-RC default': { partMode: 'general' }, 'G-RC cw': { partMode: 'general', hookDir: 'cw' }, 'G-RC ccw': { partMode: 'general', hookDir: 'ccw' },
  'G-RC split levels': { partMode: 'general', lowZ0: -1800, lowZ1: 0, upZ0: 0 },
  'G-S default': { partMode: 'general', columnType: 'steel' },
  'ped 1200x800': { pedX: 1200, pedY: 800 }, 'ped level -200/-1600': { pedTopFL: -200, pedBottomFL: -1600 },
  'ped 4x6 D25': { pedNX: 4, pedNY: 6, pedBar: 25 }, 'ped pitch150 hoopD16': { pedHoopPitch: 150, pedHoopDia: 16 },
  'ped too small 150': { pedX: 150, pedY: 150 }, 'ped level reversed': { pedTopFL: -2000 }, 'ped NX0': { pedNX: 0 },
  'pile castinplace': { pileType: 'castinplace' }, 'pile ft with': { pileJoint: 'ft' }, 'pile ft without': { pileJoint: 'ft', ftMode: 'without' },
  'pile ft+castinplace': { pileJoint: 'ft', pileType: 'castinplace' },
  'pile ecc+rot': { pileX: 80, pileY: -60, pileAngle: 15 }, 'pile ends': { pileZ0: -2500, pileZ1: -300 },
  'beam 1 layer': { bxLayers: 1, byLayers: 1 }, 'beam 3 layer': { bxLayers: 3, byLayers: 3 },
  'beam diff dia': { bxBar: 25, byBar: 35 }, 'beam order swap': { bxOrder: 'second', byOrder: 'first' },
  'beam top diff': { byTopFL: -200 }, 'beam depth diff': { byH: 1200 }, 'beam ecc': { bxOff: 100, byOff: -75 },
  'beam Y zero bars': { byNTop: 0, byNBot: 0 }, 'beam narrow': { bxW: 200 },
};
const ADJ = { 'adj hook+pile': [{ partMode: 'general' }, { low_3: { x: 20, y: 0 }, up_hook_5: { x: 0, y: -30 } }],
  'adj close cross': [{}, { pile_0: { x: 0, y: 40 }, bx_top_0_1: { x: 0, y: 60 }, ped_2: { x: -15, y: 10 } }] };
(async () => {
  const [file, out] = process.argv.slice(2);
  const { browser, page, errors } = await open(file);
  const res = {};
  const all = [...Object.entries(CASES).map(([k, v]) => [k, v, {}]), ...Object.entries(ADJ).map(([k, [v, a]]) => [k, v, a])];
  for (const [name, patch, adj] of all) {
    const r = await run(page, patch, adj);
    const extra = await page.evaluate(() => ({ levels: beamLayerLevels(), shapes: cadShapes().map(o => [o.id, shapeBounds(o).map(v => +v.toFixed(2))]),
      geom: items.map(i => [i.id, +i.a.x.toFixed(2), +i.a.y.toFixed(2), +i.a.z.toFixed(2), +i.b.x.toFixed(2), +i.b.y.toFixed(2), +i.b.z.toFixed(2), i.d]) }));
    res[name] = { n: r.n, items: r.items, warnings: r.warnings, pairs: r.pairs.map(p => p.join('|')).sort(), ...extra };
  }
  // JSON round trip of an adjusted model
  res['json roundtrip'] = await page.evaluate(() => { const before = JSON.stringify({ cfg, adjust }); const o = JSON.parse(JSON.stringify({ appVersion: APP_VERSION, schemaVersion: MODEL_SCHEMA, cfg, adjust })); loadModel(o); updateUI(); generate(); return { same: JSON.stringify({ cfg, adjust }) === before, n: issues.length } });
  res.errors = errors;
  fs.writeFileSync(out, JSON.stringify(res));
  console.log(Object.entries(res).filter(([k]) => k !== 'errors').map(([k, v]) => `${k}: ${v.n}${v.warnings?.length ? ' [W' + v.warnings.length + ']' : ''}${v.same !== undefined ? ' same=' + v.same : ''}`).join('\n'), '\nerrors', errors);
  await browser.close();
})();
