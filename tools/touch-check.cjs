const { chromium, webkit } = require('playwright');
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { hooks } = require('./race-check.cjs');
const root = path.join(__dirname, '..');
const out = path.join(root, 'artifacts', 'v53-touch');
fs.mkdirSync(out, { recursive: true });

async function attach(page) {
  await page.route('**/main.js?*', route => route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(path.join(root, 'main.js'), 'utf8') + '\n' + hooks }));
}
async function openRace(page, name) {
  await page.goto('http://127.0.0.1:8765/?qa=1');
  await page.locator('html.app-ready').waitFor();
  await page.screenshot({ path: path.join(out, name + '-title.png') });
  await page.locator('#helpTitleButton').tap();
  await page.locator('#closeHelpButton').tap();
  await page.locator('#startButton').tap();
  await page.locator('[data-mode="singleRace"]').tap();
  await page.screenshot({ path: path.join(out, name + '-racers.png') });
  await page.locator('#courseButton').tap();
  await page.locator('[data-difficulty="Hard"]').tap();
  assert.equal(await page.locator('[data-difficulty="Hard"]').getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: path.join(out, name + '-courses.png') });
  await page.locator('#raceButton').tap();
  await page.waitForFunction(() => window.__STARLIGHT_QA__?.snapshot().mode === 'racing', null, { timeout: 120000 });
  await page.evaluate(() => __raceTest.pause());
  await page.evaluate(() => __raceTest.place(.04, 40));
}
async function checkSurface(page, name) {
  const layout = await page.evaluate(() => {
    const selectors = ['.hud-left', '.hud-right', '.minimap-frame', '#routeGuide', '#raceFlow', '#touchSteer', '.touch-buttons'];
    return selectors.map(selector => {
      const e = document.querySelector(selector), r = e.getBoundingClientRect();
      return { selector, x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height };
    });
  });
  const view = page.viewportSize();
  for (const box of layout) {
    assert(box.x >= -1 && box.y >= -1 && box.right <= view.width + 1 && box.bottom <= view.height + 1, `${name}: offscreen ${box.selector}: ${JSON.stringify(box)}`);
  }
  for (let i=0;i<layout.length;i++) for (let j=i+1;j<layout.length;j++) {
    const a=layout[i], b=layout[j];
    const overlap=Math.max(0,Math.min(a.right,b.right)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.y,b.y));
    assert(overlap<2, `${name}: overlapping ${a.selector} / ${b.selector}`);
  }
  const canvas=await page.locator('#gameCanvas').screenshot();
  const stats=await sharp(canvas).stats();
  assert(stats.channels.slice(0,3).some(c=>c.stdev>20), `${name}: canvas must contain rendered scenery`);
  await page.screenshot({path:path.join(out,name+'-race.png')});
  return layout;
}
async function run() {
  const browser = await chromium.launch({headless:true});
  const report=[];
  try {
    for(const [name,width,height] of [['ipad-wide',1024,768],['ipad-tall',768,1024],['phone-tall',390,844],['phone-wide',844,390]]) {
      const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:1});
      const page=await context.newPage();
      const errors=[]; page.on('pageerror', e=>errors.push(e.message));
      await attach(page); await openRace(page,name);
      const layout=await checkSurface(page,name);
      const cdp=await context.newCDPSession(page), steering={};
      for(const sign of [-1,1]) {
        const before=await page.evaluate(()=>__raceTest.place(0,40));
        const pad=await page.locator('#touchSteer').boundingBox(), gas=await page.locator('#touchGas').boundingBox();
        const points=[{x:pad.x+pad.width*(.5+sign*.35),y:pad.y+pad.height*.5,id:1},{x:gas.x+gas.width*.5,y:gas.y+gas.height*.5,id:2}];
        await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:points});
        await page.evaluate(()=>__raceTest.frame(20));
        const after=await page.evaluate(()=>__raceTest.state());
        await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
        const right=(after.x-before.x)*-Math.cos(before.yaw)+(after.z-before.z)*Math.sin(before.yaw);
        assert(right*sign>.1, `${name} touch ${sign} wrong: ${right}`);
        steering[sign]=right;
      }
      await page.evaluate(()=>__raceTest.item('shield'));
      await page.locator('#touchItem').tap();
      await page.screenshot({path:path.join(out,name+'-item.png')});
      await page.locator('#touchPause').tap();
      await page.locator('#resumeButton').tap();
      await page.evaluate(()=>__raceTest.finish());
      await page.locator('#resultScreen:not(.hidden)').waitFor();
      await page.screenshot({path:path.join(out,name+'-result.png')});
      await page.locator('#changeCourseButton').tap();
      await page.locator('#courseScreen:not(.hidden)').waitFor();
      assert.equal(errors.length,0,errors.join('\n'));
      report.push({name,steering,layout,errors});
      await context.close();
    }
    if(fs.existsSync(webkit.executablePath())) {
      const safari=await webkit.launch({headless:true});
      try {
        const page=await safari.newPage({viewport:{width:1024,height:768},hasTouch:true,isMobile:true});
        await attach(page);await openRace(page,'webkit-ipad');await checkSurface(page,'webkit-ipad');
        report.push({name:'webkit-ipad',passed:true});
      } finally {await safari.close();}
    } else report.push({name:'webkit-ipad',skipped:'WebKit runtime not installed'});
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
