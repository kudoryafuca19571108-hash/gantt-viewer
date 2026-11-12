const rhino3dm = require((process.env.JC_DEPS || __dirname + '/deps/node_modules') + '/rhino3dm');
const fs = require('fs');
rhino3dm().then(rh => {
  for (const f of process.argv.slice(2)) {
    const doc = rh.File3dm.fromByteArray(new Uint8Array(fs.readFileSync(f)));
    const objs = doc.objects(), n = objs.count, types = {}, layers = {}; let closed = 0;
    for (let i = 0; i < n; i++) { const o = objs.get(i), g = o.geometry(), t = g.constructor.name; types[t] = (types[t] || 0) + 1;
      const L = doc.layers().get(o.attributes().layerIndex).name; layers[L] = (layers[L] || 0) + 1;
      if (t === 'Extrusion') { const b = g.toBrep(true); if (b && b.isSolid) closed++; } else if (t === 'Mesh') { if (g.isClosed) closed++; } }
    console.log(f, { objects: n, unit: doc.settings().modelUnitSystem.constructor?.name ?? doc.settings().modelUnitSystem, mm: doc.settings().modelUnitSystem === rh.UnitSystem.Millimeters, closed, types, layers });
  }
});
