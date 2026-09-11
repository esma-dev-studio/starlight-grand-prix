const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root=path.join(__dirname,'..');
const out=path.join(root,'artifacts',process.env.QA_RUN || 'v54-perf');
fs.mkdirSync(out,{recursive:true});
const ref=process.env.QA_BASE_REF || '507a6b6';
const hook=`window.__perf={stop:()=>renderer.setAnimationLoop(null),measure:()=>{
  const s=track.samples[0];camera.position.copy(s.point).addScaledVector(s.tangent,-19);camera.position.y+=9;
  const target=s.point.clone().addScaledVector(s.tangent,12);target.y+=2;camera.up.set(0,1,0);camera.lookAt(target);
  renderer.render(scene,camera);let vehicleMeshes=0;player.group.traverse(c=>{if(c.isMesh)vehicleMeshes++});
  return {calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,vehicleMeshes,pixelRatio:renderer.getPixelRatio()};
}};`;
async function run(){
  const browser=await chromium.launch({headless:true});const report={reference:ref,results:[]};
  try{
    for(const baseline of [true,false]){
      const context=await browser.newContext({viewport:{width:1024,height:768},hasTouch:true,isMobile:true,deviceScaleFactor:1});
      const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
      let source=baseline?execFileSync('git',['show',ref+':main.js'],{cwd:root,encoding:'utf8',maxBuffer:4e6}):fs.readFileSync(path.join(root,'main.js'),'utf8');
      source=source.replace('https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js','./vendor/three.module.min.js');
      await page.route('**/main.js?*',r=>r.fulfill({contentType:'text/javascript',body:source+'\n'+hook}));
      if(baseline) await page.route('**/game-data.js?*',r=>r.fulfill({contentType:'text/javascript',body:execFileSync('git',['show',ref+':game-data.js'],{cwd:root,encoding:'utf8',maxBuffer:4e6})}));
      await page.goto('http://127.0.0.1:8765/?qa=1');await page.locator('html.app-ready').waitFor();
      // v52 incorrectly rejected its first tap during the first 180 ms.
      await page.waitForFunction(()=>performance.now()>250);
      await page.locator('#startButton').tap();await page.locator('[data-mode="grandPrix"]').tap();await page.locator('#courseButton').tap();
      await page.locator('#raceButton').tap();await page.waitForFunction(()=>window.__STARLIGHT_QA__?.snapshot().mode==='racing',null,{timeout:120000});
      await page.evaluate(()=>__perf.stop());
      report.results.push({version:baseline?ref:'working-tree',...await page.evaluate(()=>__perf.measure()),errors});
      await context.close();
    }
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  }finally{await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
