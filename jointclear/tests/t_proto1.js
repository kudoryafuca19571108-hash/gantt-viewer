// Prototype only (in-page monkeypatch, file untouched): impact of item-1 options on issue counts.
const { open, run } = require('./harness');
(async () => {
  const { browser, page } = await open(process.argv[2]);
  const grp = id => id.replace(/_\d+$/, '').replace(/^(bx|by)_(top|bot)_\d+$/, '$1_$2');
  const summary = r => { const c = {}; for (const [a, b] of r.pairs) { const k = [grp(a), grp(b)].sort().join('x'); c[k] = (c[k] || 0) + 1 } return Object.entries(c).filter(([k]) => /low|up/.test(k)).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ':' + v).join(' ') };
  const base = await run(page, { partMode: 'general' });
  console.log('v1.9 default general RC:', base.n);
  // Patch: hooks at bar ends; 'inward' perpendicular to nearest face; optional no-hook / through mode
  await page.evaluate(() => {
    window.__mode = 'anchor';
    devHooks = function () {
      const arr = []; if (!(cfg.partMode === 'general' && cfg.columnType === 'rc') || window.__mode === 'through') return arr;
      const dir = (b, X, Y) => { const x = b.a.x, y = b.a.y; if (cfg.hookDir !== 'inward') { const s = cfg.hookDir === 'cw' ? 1 : -1; return { x: s * Math.sign(y || 1), y: -s * Math.sign(x || 1) } }
        const ex = X / 2 - Math.abs(x), ey = Y / 2 - Math.abs(y); if (Math.abs(ex - ey) < 1) return { x: -Math.sign(x) / Math.SQRT2, y: -Math.sign(y) / Math.SQRT2 }; return ex < ey ? { x: -Math.sign(x), y: 0 } : { x: 0, y: -Math.sign(y) } };
      const norm = v => { const L = Math.hypot(v.x, v.y); return { x: v.x / L, y: v.y / L } };
      items.filter(i => /^low_\d+$/.test(i.id)).forEach((b, i) => { const d = norm(dir(b, cfg.lowerX, cfg.lowerY)); addSeg(arr, `low_hook_${i}`, '', 'rc', colors.rc, cfg.lowBar, b.b, { x: b.b.x + d.x * cfg.hookLen, y: b.b.y + d.y * cfg.hookLen, z: b.b.z }, { kind: 'hook', parentId: b.id }) });
      items.filter(i => /^up_\d+$/.test(i.id)).forEach((b, i) => { const d = norm(dir(b, cfg.upperX, cfg.upperY)); addSeg(arr, `up_hook_${i}`, '', 'rc', colors.rc, cfg.upBar, b.a, { x: b.a.x + d.x * cfg.hookLen, y: b.a.y + d.y * cfg.hookLen, z: b.a.z }, { kind: 'hook', parentId: b.id }) });
      return arr;
    };
    const orig = calcIssues; // through-mode: ignore coincident end-to-end low/up (same rule as ped/up)
    calcIssues = function () { orig(); if (window.__mode !== 'through') return; issues = issues.filter(({ a, b }) => { if (!((a.meta.owner === 'low' && b.meta.owner === 'up') || (a.meta.owner === 'up' && b.meta.owner === 'low')) || a.meta.kind !== 'vert' || b.meta.kind !== 'vert') return true; const l = a.meta.owner === 'low' ? a : b, u = l === a ? b : a; return !(Math.abs(l.b.z - u.a.z) < 1e-6 && Math.hypot(l.b.x - u.a.x, l.b.y - u.a.y) < 1e-6) }); issueSet.clear(); issues.forEach(i => { issueSet.add(i.a.id); issueSet.add(i.b.id) }); el('issueCount').textContent = issues.length };
  });
  const cases = [
    ['A hooks-at-end, v1.9 levels', 'anchor', {}],
    ['B through: low -1800..0, up 0..1600', 'through', { lowZ0: -1800, lowZ1: 0 }],
    ['C anchor both, same 900 section: low -1800..-130, up -770..1600', 'anchor', { lowZ0: -1800, lowZ1: -130, upZ0: -770 }],
    ['C2 anchor both, upper 800 section', 'anchor', { lowZ0: -1800, lowZ1: -130, upZ0: -770, upperX: 800, upperY: 800 }],
  ];
  for (const [name, mode, patch] of cases) { await page.evaluate(m => window.__mode = m, mode); const r = await run(page, { partMode: 'general', ...patch }); console.log(name, '=> issues', r.n, '|', summary(r)); }
  await browser.close();
})();
