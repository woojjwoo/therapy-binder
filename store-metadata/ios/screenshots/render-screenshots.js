#!/usr/bin/env node
/**
 * Renders HTML screenshot mockups to PNG images for App Store Connect upload.
 *
 * Prerequisites:
 *   npm install puppeteer
 *
 * Usage:
 *   node render-screenshots.js            # render all sizes
 *   node render-screenshots.js iphone-6.5 # render one size only
 */
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const SIZES = {
  'iphone-6.5': { w: 1242, h: 2688 },
};

const SCREENS = ['screen_1', 'screen_2', 'screen_3', 'screen_4', 'screen_5'];

async function render(sizeFilter) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const sizesToRender = sizeFilter
    ? { [sizeFilter]: SIZES[sizeFilter] }
    : SIZES;

  for (const [sizeName, size] of Object.entries(sizesToRender)) {
    const dir = path.join(__dirname, sizeName);
    const outDir = path.join(__dirname, 'png', sizeName);
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    for (const screen of SCREENS) {
      const htmlPath = path.join(dir, `${screen}.html`);
      if (!fs.existsSync(htmlPath)) {
        console.log(`  SKIP ${sizeName}/${screen}.html (not found)`);
        continue;
      }

      const page = await browser.newPage();
      await page.setViewport({ width: size.w, height: size.h, deviceScaleFactor: 1 });
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

      const outPath = path.join(outDir, `${screen}.png`);
      await page.screenshot({ path: outPath, type: 'png' });
      await page.close();

      console.log(`  ✓ ${sizeName}/${screen}.png (${size.w}x${size.h})`);
    }
  }

  await browser.close();
  console.log('\nDone! Upload PNGs from store-metadata/ios/screenshots/png/');
}

const filter = process.argv[2];
if (filter && !SIZES[filter]) {
  console.error(`Unknown size: ${filter}`);
  console.error(`Available: ${Object.keys(SIZES).join(', ')}`);
  process.exit(1);
}

render(filter).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
