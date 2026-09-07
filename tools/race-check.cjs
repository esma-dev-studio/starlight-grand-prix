const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.join(__dirname, '..');
const out = path.join(root, 'artifacts', 'v53');
fs.mkdirSync(out, { recursive: true });

// Test hooks are injected into a local response only, never the published game.
const hooks = `
window.__raceTest = {
  pause: () => renderer.setAnimationLoop(null),
  stats: () => ({...collectQaSnapshot(), art: player.group.userData.artVersion,
    vehicleMeshes: racers.map(r => { let n = 0; r.group.traverse(c => { if(c.isMesh) n++; }); return n; })}),
  render: () => renderer.render(scene, camera),
  frame: (n) => { for(let i=0;i<n;i++) updateScene(1/60); renderer.render(scene,camera); },
  place: (fraction=0,speed=0) => { const index=Math.floor(fraction*TRACK_STEPS)%TRACK_STEPS; const s=track.samples[index];
    player.position.copy(s.point); player.trackIndex=index; player.yaw=Math.atan2(s.tangent.x,s.tangent.z);
    player.speed=speed; player.jumpHeight=0; player.verticalSpeed=0; player.stunTimer=0; player.ghostTimer=2;
    player.controlSteer=0; player.lap=0; player.finished=false; player.startedLap=false; input.left=input.right=input.accel=input.brake=input.drift=false;
    updateRacer(player,1/60); updateHud(); for(let i=0;i<50;i++)updateCamera(1/60); renderer.render(scene,camera);
    return {x:player.position.x,z:player.position.z,yaw:player.yaw}; },
  state: () => ({x:player.position.x,z:player.position.z,yaw:player.yaw,...collectQaSnapshot()}),
  course: (index) => { state.selectedCourse=index; state.difficulty='Hard'; rebuildTrackForSelectedCourse(); resetRace(); state.mode='racing'; },
  item: (kind) => { player.item={...DATA.items.find(i=>i.kind===kind)}; player.itemCooldown=0; updateHud(); },
  effects: () => ({item:player.item,boost:player.boostTimer,shield:player.shieldTimer,projectiles:projectiles.length,traps:traps.length,particles:particles.length}),
  clearEffects: () => { particles.forEach(p=>p.life=0); updateParticles(1); },
  tireTest: () => { const scratch=new THREE.Scene(); for(let i=0;i<100;i++){
    addTireMark(player);const mark=tireMarks[tireMarks.length-1].mesh;mark.frustumCulled=false;scratch.add(mark);
    renderer.render(scratch,camera);updateTireMarks(6);scratch.remove(mark);
  } },
  shieldRangeTest: () => { const other=racers.find(r=>r!==player); other.position.copy(player.position).add(new THREE.Vector3(100,0,0)); other.shieldTimer=5;
    spawnBloom(player,DATA.items.find(i=>i.kind==='aoe')); return other.shieldTimer; },
  finish: () => { player.finished=true; player.finishTime=state.time; player.lap=activeLapTotal(); finishRace(); },
  reset: () => { resetRace(); state.mode='racing'; renderer.render(scene,camera); },
  vehicle: (index) => ({character:DATA.characters[index],kart:machineForCharacter(DATA.characters[index],index),profile:getKartVisualProfile(machineForCharacter(DATA.characters[index],index))}),
  checkGeometry: () => { const g=createPrismGeometry(3,1,5,0.4,1); const p=g.attributes.position, idx=g.index.array; let min=Infinity;
    for(let i=0;i<idx.length;i+=3){const a=new THREE.Vector3().fromBufferAttribute(p,idx[i]),b=new THREE.Vector3().fromBufferAttribute(p,idx[i+1]),c=new THREE.Vector3().fromBufferAttribute(p,idx[i+2]); const normal=b.clone().sub(a).cross(c.clone().sub(a)); min=Math.min(min,normal.dot(a.clone().add(b).add(c).divideScalar(3)));} g.dispose();return min;}
};`;

async function start(page) {
  await page.goto('http://127.0.0.1:8765/?qa=1');
  await page.locator('html.app-ready').waitFor();
  await page.locator('#startButton').click();
  await page.locator('[data-mode="grandPrix"]').click();
  await page.locator('#courseButton').click();
  await page.locator('[data-difficulty="Hard"]').click();
  await page.screenshot({ path: path.join(out, 'course-select.png') });
  await page.locator('#raceButton').click();
  await page.waitForFunction(() => window.__STARLIGHT_QA__?.snapshot().mode === 'racing', null, {timeout:120000});
  await page.evaluate(() => window.__raceTest.pause());
}

async function run() {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
    const errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.route('**/main.js?*',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'main.js'),'utf8')+'\n'+hooks}));
    await start(page);
    assert(await page.evaluate(()=>__raceTest.checkGeometry()) > 0, 'Hull faces must point outwards');
    const report={errors,courses:[],steering:{}};
    for(let course=0;course<4;course++) {
      console.log('Testing course',course);
      if(course)await page.evaluate(index=>__raceTest.course(index),course);
      await page.evaluate(()=>__raceTest.place(0,0));
      await page.screenshot({path:path.join(out,`course-${course}-start.png`)});
      await page.evaluate(()=>__raceTest.frame(1200));
      const stats=await page.evaluate(()=>__raceTest.stats());
      report.courses.push(stats);
      assert(stats.racers.filter(r=>!r.player).every(r=>r.progress>25 && r.stuck<1.5),`CPU progress course ${course}`);
      await page.evaluate(()=>__raceTest.place(0.14,42));
      await page.screenshot({path:path.join(out,`course-${course}-drive.png`)});
    }
    await page.evaluate(()=>__raceTest.course(0));
    for (const [key,sign] of [['ArrowRight',1],['ArrowLeft',-1]]) {
      const before=await page.evaluate(()=>__raceTest.place(0,40));
      await page.keyboard.down(key);
      await page.evaluate(()=>__raceTest.frame(20));
      await page.keyboard.up(key);
      const after=await page.evaluate(()=>__raceTest.state());
      const screenRight=(after.x-before.x)*-Math.cos(before.yaw)+(after.z-before.z)*Math.sin(before.yaw);
      report.steering[key]=screenRight;
      assert(screenRight*sign>0.1,`${key} must steer to screen side`);
    }
    for(const kind of ['boost','shield','trap','aoe','projectile','comeback']) {
      await page.evaluate(()=>__raceTest.reset());
      await page.evaluate(k=>__raceTest.item(k),kind);
      await page.locator('#touchItem').evaluate(el=>el.click());
      const effects=await page.evaluate(()=>__raceTest.effects());
      assert.equal(effects.item,null,kind+' must be consumed');
      if(['boost','comeback'].includes(kind)) assert(effects.boost>2);
      if(['shield','comeback'].includes(kind)) assert(effects.shield>2);
      if(kind==='projectile') assert(effects.projectiles>0);
      if(kind==='trap') assert(effects.traps>0);
      if(kind==='aoe') assert(effects.particles>0);
      await page.evaluate(()=>__raceTest.frame(12));
      assert((await page.locator('#raceNoticeTitle').textContent()).length>0);
    }
    await page.evaluate(()=>__raceTest.place(0.12,40));
    await page.screenshot({path:path.join(out,'item-active.png')});
    assert.equal(await page.evaluate(()=>__raceTest.shieldRangeTest()),5,'Blast must not consume shields outside its radius');
    report.memory=[];
    for(let i=0;i<6;i++) {
      console.log('Testing restart memory',i);
      await page.evaluate(()=>{__raceTest.reset();__raceTest.tireTest();__raceTest.clearEffects();__raceTest.render();});
      report.memory.push((await page.evaluate(()=>__raceTest.stats())).render);
    }
    const stable=report.memory.slice(1);
    assert(Math.max(...stable.map(r=>r.geometries))-Math.min(...stable.map(r=>r.geometries))<=2,'Restart geometry count must stabilise');
    assert(Math.max(...stable.map(r=>r.textures))-Math.min(...stable.map(r=>r.textures))<=2,'Restart texture count must stabilise');
    assert.equal(errors.length,0,errors.join('\n'));
    fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify(report,null,2));
  } finally { await browser.close(); }
}
module.exports = { hooks, start };
if (require.main === module) run().catch(e=>{console.error(e);process.exitCode=1;});
