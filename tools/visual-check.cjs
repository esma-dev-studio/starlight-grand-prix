const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

async function main() {
  const origin=process.env.QA_ORIGIN || 'http://127.0.0.1:8765';
  const folder = path.join(__dirname, '..', 'artifacts', process.env.QA_RUN || 'baseline');
  fs.mkdirSync(folder, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  if (!process.env.QA_MENUS_ONLY) {
  await page.goto(origin+'/?qa=1');
  await page.locator('html.app-ready').waitFor();
  await page.screenshot({ path: path.join(folder, 'title.png') });
  await page.locator('#startButton').click();
  await page.locator('[data-mode="grandPrix"]').click();
  await page.locator('#courseButton').click();
  await page.screenshot({ path: path.join(folder, 'courses.png') });
  await page.locator('#raceButton').click();
  await page.locator('#countdown').waitFor({ state: 'hidden', timeout: 30000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(folder, 'race.png') });
  console.log(JSON.stringify({ errors, telemetry: await page.locator('#qaTelemetry').textContent() }, null, 2));
  }
  await context.close();
  for (const [name,width,height] of [['phone-tall',390,844],['phone-wide',844,390],['ipad',1024,768]]) {
    const menu=await browser.newPage({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1});
    await menu.goto(origin+'/');
    await menu.locator('html.app-ready').waitFor();
    await menu.screenshot({path:path.join(folder,name+'-title.png')});
    await menu.close();
  }
  } finally { await browser.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
