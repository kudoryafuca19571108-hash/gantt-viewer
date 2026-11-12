const { open, run } = require('./harness');
(async () => {
  const { browser, page, errors } = await open(process.argv[2]);
  const st = await page.evaluate(() => ({ ver: APP_VERSION, title: document.title, three: document.getElementById('threeStatus').textContent }));
  console.log(st);
  const grp = id => id.replace(/_\d+$/, '').replace(/^(bx|by)_(top|bot)_\d+$/, '$1_$2').replace(/^(low|up)_hook$/, '$1_hook');
  for (const [name, patch] of [['foundation RC', {}], ['general RC', { partMode: 'general' }], ['general S', { partMode: 'general', columnType: 'steel' }], ['foundation S', { columnType: 'steel' }]]) {
    const r = await run(page, patch);
    const cnt = {};
    for (const [a, b] of r.pairs) { const k = [grp(a), grp(b)].sort().join(' x '); cnt[k] = (cnt[k] || 0) + 1; }
    console.log(`\n== ${name}: issues=${r.n} items=${r.items}`);
    console.log(Object.entries(cnt).sort((a, b) => b[1] - a[1]).map(([k, v]) => `  ${v}\t${k}`).join('\n'));
    if (r.warnings.length) console.log('  warnings:', r.warnings);
  }
  console.log('errors:', errors);
  await browser.close();
})();
