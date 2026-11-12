// Compare two matrix JSON files case by case: issue pairs, geometry, shapes, levels, warnings.
const [A, B] = process.argv.slice(2).map(f => require(require('path').resolve(f)));
for (const k of Object.keys(A)) {
  if (k === 'errors' || !B[k]) continue; const a = A[k], b = B[k], out = [];
  if (a.same !== undefined) { if (a.same !== b.same || a.n !== b.n) out.push(`roundtrip ${a.same}/${a.n} -> ${b.same}/${b.n}`); }
  else {
    const ga = new Map(a.geom.map(g => [g[0], g.slice(1).join(',')])), gb = new Map(b.geom.map(g => [g[0], g.slice(1).join(',')]));
    const add = [...gb.keys()].filter(x => !ga.has(x)), del = [...ga.keys()].filter(x => !gb.has(x)), mod = [...ga.keys()].filter(x => gb.has(x) && ga.get(x) !== gb.get(x));
    const fam = l => { const c = {}; l.forEach(x => { const f = x.replace(/_\d+$/, '').replace(/_\d+$/, ''); c[f] = (c[f] || 0) + 1 }); return JSON.stringify(c) };
    if (add.length) out.push('added ' + fam(add)); if (del.length) out.push('removed ' + fam(del)); if (mod.length) out.push('moved ' + fam(mod));
    const pa = new Set(a.pairs), pb = new Set(b.pairs), pn = b.pairs.filter(x => !pa.has(x)).length, po = a.pairs.filter(x => !pb.has(x)).length;
    if (pn || po) out.push(`pairs +${pn} -${po} (${a.n}->${b.n})`);
    if (JSON.stringify(a.shapes) !== JSON.stringify(b.shapes)) out.push('shapes ' + JSON.stringify(b.shapes.filter(s => !a.shapes.some(t => JSON.stringify(t) === JSON.stringify(s)))));
    if (JSON.stringify(a.levels) !== JSON.stringify(b.levels)) out.push('levels changed');
    if (JSON.stringify(a.warnings) !== JSON.stringify(b.warnings)) out.push('warnings ' + JSON.stringify(a.warnings) + ' -> ' + JSON.stringify(b.warnings));
  }
  console.log((out.length ? '≠ ' : '= ') + k + (out.length ? '\n    ' + out.join('\n    ') : ''));
}
