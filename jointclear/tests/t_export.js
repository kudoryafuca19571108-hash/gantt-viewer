const { open, run } = require('./harness');
const path = require('path');
(async () => {
  const file = process.argv[2], tag = process.argv[3] || 'v19';
  for (const offline of [false, true]) {
    const { browser, page, errors } = await open(file, { offline });
    await run(page, {});
    let d = page.waitForEvent('download'); await page.click('#dxfBtn'); d = await d;
    const dxf = path.join(process.env.JC_OUT || __dirname, 'out', `${tag}_${offline ? 'off' : 'on'}.dxf`); await d.saveAs(dxf);
    const st1 = await page.textContent('#exportStatus');
    let st2;
    if (!offline) { d = page.waitForEvent('download', { timeout: 60000 }); await page.click('#rhinoBtn'); d = await d; await d.saveAs(path.join(process.env.JC_OUT || __dirname, 'out', tag + '.3dm')); }
    else { await page.click('#rhinoBtn'); await page.waitForTimeout(2000); }
    st2 = await page.textContent('#exportStatus');
    await page.click('#view3dTab'); await page.waitForTimeout(500);
    const three = await page.evaluate(() => ({ status: document.getElementById('threeStatus').textContent, isThree: document.querySelector('.view').classList.contains('is-three'), ready: !!window.JC3D?.ready }));
    console.log({ offline, dxf: st1, rhino: st2, three, errors: errors.filter(e => !/Failed to load resource|net::ERR/.test(e)) });
    await browser.close();
  }
})();
