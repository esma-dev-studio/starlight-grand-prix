const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { hooks, start } = require('./race-check.cjs');
const root = path.join(__dirname, '..');
const touch = process.env.QA_TOUCH === '1';
const out = path.join(root, 'artifacts', touch ? 'v54-ipad-raceplay' : 'v54');
fs.mkdirSync(out, { recursive: true });
const extras = `
window.__play = {
  setup() {
    resetRace(); state.mode='racing';
    racers.forEach((r,i)=>{ const index=trackIndexAtDistance(0,i===0?60:i===1?100:400+i*65);const s=track.samples[index];
      r.position.copy(s.point);r.yaw=Math.atan2(s.tangent.x,s.tangent.z);r.trackIndex=index;r.progress=index;
      r.startedLap=true;r.speed=i===0?45:0;r.item=null;r.itemCooldown=0;r.shieldTimer=0;r.hitProtection=0;r.jumpHeight=0;
    }); updateHud();
  },
  state:()=>({item:player.item,boost:player.boostTimer,shield:player.shieldTimer,energy:player.shieldEnergy,
    magnet:player.magnetTimer,jump:player.jumpHeight,hopPending:player.hopLandingPending,gates:boostGates.length,
    projectiles:projectiles.length,traps:traps.length,targetStun:racers[1].stunTimer,targetShield:racers[1].shieldTimer,
    counts:{boxes:itemBoxes.length,gate:boostGates.length,particles:particles.length},lap:player.lap,mode:state.mode}),
  use(kind){player.item={...DATA.items.find(i=>i.kind===kind),charges:kind==='boost'?3:1};player.itemCooldown=0;updateHud();},
  ready(){player.itemCooldown=0;updateHud();},
  fire(){useItem(player);},
  projectile(){for(let i=0;i<240;i++)updateProjectiles(1/60);},
  noTarget(){racers.slice(1).forEach(r=>r.finished=true);},
  exchange(){const box=itemBoxes.find(b=>b.userData.supply==='speed');box.userData.cooldown=0;box.visible=true;
    player.position.copy(box.position);player.position.y-=2.8;player.itemCooldown=0;handleItemPickup(player);return player.item.kind;},
  shieldHit(){hitRacer(player,DATA.items.find(i=>i.kind==='projectile'),racers[1]);updateRacer(player,1/60);},
  closeTarget(){racers[1].position.copy(player.position).addScaledVector(track.samples[player.trackIndex].tangent,8);},
  traps(){const t=traps[0];racers[1].position.copy(t.mesh.position);racers[1].jumpHeight=4;updateTraps(0.8);const jumped=traps.length===1;racers[1].jumpHeight=0;updateTraps(0.01);return jumped;},
  hop(){input.accel=true;for(let i=0;i<150;i++)updateRacer(player,1/60);input.accel=false;updateHud();},
  gate(){const g=boostGates[0];player.position.copy(g.mesh.position);updateBoostGates(0.01);const own=player.boostTimer;
    racers[1].position.copy(g.mesh.position);updateBoostGates(0.01);const rival=racers[1].boostTimer;
    player.boostTimer=0;updateBoostGates(0.01);return {own,rival,repeated:player.boostTimer,users:g.used.size};},
  lap(){
    if(!player.startedLap||!state.lapTimes.length){player.lap=0;player.startedLap=true;player.lapCheckpoints=0;player.trackIndex=0;state.lapTimes=[];state.lapStartedAt=state.time;}
    for(let n=1;n<=TRACK_STEPS;n++){const index=n%TRACK_STEPS,s=track.samples[index];player.speed=40;player.yaw=Math.atan2(s.tangent.x,s.tangent.z);
      player.position.copy(s.point);state.time+=0.2;handleRaceProgress(player,{index,sample:s,lateral:0});}
    showRaceNotice('other','おいぬいた','notice conflict','boost',900);updateRacer(player,0.001);updateHud();updateMinimap();for(let i=0;i<50;i++)updateCamera(1/60);renderer.render(scene,camera);
  },
  pauseLap(){state.mode='paused';updateLapAnnouncement();},
  resumeLap(){state.mode='racing';updateLapAnnouncement();},
  autoCourse(index){__raceTest.course(index);player.isPlayer=false;input.accel=false;},
  autoFrames(n){for(let i=0;i<n&&state.mode==='racing';i++)updateScene(1/60);},
  details:()=>({time:state.time,length:track.totalLength,steps:TRACK_STEPS,mode:state.mode,render:{...renderer.info.render},
    racers:racers.map(r=>({id:r.id,lap:r.lap,started:r.startedLap,checkpoints:r.lapCheckpoints,finished:r.finished,
      progress:r.progress,speed:r.speed,stuck:r.stuckTimer,aiStall:r.ai.noProgressTimer,lateral:nearestTrackSample(r.position,r.trackIndex).lateral}))}),
  recordKeys:()=>DATA.courses.map(c=>raceRecordKey(c)),
  resources(){renderer.render(scene,camera);return {...renderer.info.memory};}
};`;

async function run() {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:touch?{width:1024,height:768}:{width:1440,height:900},deviceScaleFactor:1,hasTouch:touch,isMobile:touch});
    const errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/main.js?*',route=>route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.join(root,'main.js'),'utf8')+'\n'+hooks+'\n'+extras}));
    await start(page);
    const report={items:{},courses:[],errors};
    for(const kind of ['boost','projectile','shield','trap','aoe','comeback','magnet','hop','gate']) {
      await page.evaluate(k=>{__play.setup();__play.use(k);},kind);
      await page.waitForTimeout(220);
      await page.locator('#touchItem').evaluate(el=>el.click());
      const before=await page.evaluate(()=>__play.state());
      if(kind==='boost') {
        assert.equal(before.item.charges,2);
        assert(before.boost>1);
        for(let i=0;i<2;i++){await page.waitForTimeout(450);await page.evaluate(()=>__play.ready());await page.locator('#touchItem').evaluate(el=>el.click());}
        assert.equal((await page.evaluate(()=>__play.state())).item,null);
      } else assert.equal(before.item,null,kind+' consumed');
      if(kind==='projectile') {await page.evaluate(()=>__play.projectile());assert((await page.evaluate(()=>__play.state())).targetStun>0,'Homing shot hits ahead target across sloped track');}
      if(kind==='shield') {
        await page.evaluate(()=>__play.shieldHit());
        const after=await page.evaluate(()=>__play.state()); assert.equal(after.shield,0);assert(after.boost>1);assert(after.energy>98);
      }
      if(kind==='trap') {assert(await page.evaluate(()=>__play.traps()),'Jump avoids trap');assert((await page.evaluate(()=>__play.state())).targetStun>0);}
      if(kind==='aoe') {await page.evaluate(()=>{__play.closeTarget();__play.use('aoe');__play.fire();});assert((await page.evaluate(()=>__play.state())).targetStun>0);}
      if(kind==='comeback') {assert(before.boost>3);await page.evaluate(()=>__play.shieldHit());assert((await page.evaluate(()=>__play.state())).shield>2);}
      if(kind==='magnet') assert(before.magnet===5);
      if(kind==='hop') {assert(before.jump>0);await page.evaluate(()=>__play.hop());const after=await page.evaluate(()=>__play.state());console.log('Hop result',after);assert.equal(after.hopPending,false);}
      if(kind==='gate') {const result=await page.evaluate(()=>__play.gate());assert(result.own>1&&result.rival>1);assert.equal(result.repeated,0);report.gate=result;}
      report.items[kind]=before;
    }
    for(const kind of ['projectile','magnet']) {
      await page.evaluate(k=>{__play.setup();__play.noTarget();__play.use(k);},kind);
      await page.waitForTimeout(220);
      await page.locator('#touchItem').evaluate(el=>el.click());
      assert.equal((await page.evaluate(()=>__play.state())).item.kind,kind,'No target must not waste item');
      assert.notEqual(await page.evaluate(()=>__play.exchange()),kind,'Unusable item must be exchangeable at supply');
    }
    await page.evaluate(()=>{__play.setup();__play.lap();});
    assert.equal((await page.evaluate(()=>__play.state())).lap,1);
    assert(await page.locator('#lapBanner').isVisible());
    assert.equal(await page.locator('#raceNotice').evaluate(e=>getComputedStyle(e).visibility==='hidden'||getComputedStyle(e).display==='none'||getComputedStyle(e).opacity==='0'),true,'Lap must take priority over other notices');
    await page.screenshot({path:path.join(out,'lap-complete.png')});
    await page.evaluate(()=>__play.pauseLap()); assert(!(await page.locator('#lapBanner').isVisible()));
    await page.evaluate(()=>__play.resumeLap()); assert(await page.locator('#lapBanner').isVisible());
    await page.evaluate(()=>__play.lap());
    assert.match(await page.locator('#lapBannerTitle').textContent(),/さいご/);
    await page.screenshot({path:path.join(out,'final-lap.png')});
    report.recordKeys=await page.evaluate(()=>__play.recordKeys());
    assert(report.recordKeys.every(k=>k.endsWith('long-v54')));
    for(let course=0;course<4;course++) {
      console.log('Full-distance CPU race',course);
      await page.evaluate(i=>__play.autoCourse(i),course);
      for(let t=0;t<15;t++) {
        await page.evaluate(()=>__play.autoFrames(600));
        const state=await page.evaluate(()=>__play.details());
        if(state.mode!=='racing') break;
        assert(state.racers.every(r=>r.aiStall<5),`CPU stalled course ${course}`);
      }
      const result=await page.evaluate(()=>__play.details());
      assert(result.racers.some(r=>r.finished),`CPU must complete three real laps on course ${course}`);
      assert(result.racers.every(r=>r.lap>=1),`All CPUs complete a lap course ${course}`);
      report.courses.push(result);
      await page.evaluate(()=>{__raceTest.place(0.1,42);__raceTest.render();});
      await page.screenshot({path:path.join(out,`course-${course}-drive.png`)});
    }
    report.memory=[];
    for(let i=0;i<4;i++) {await page.evaluate(()=>{__raceTest.course(0);__play.setup();__play.use('shield');__play.fire();}); report.memory.push(await page.evaluate(()=>__play.resources()));}
    const stable=report.memory.slice(1);assert(Math.max(...stable.map(r=>r.geometries))-Math.min(...stable.map(r=>r.geometries))<=2);
    assert.equal(errors.length,0,errors.join('\n'));
    fs.writeFileSync(path.join(out,'raceplay-report.json'),JSON.stringify(report,null,2));
    console.log(JSON.stringify({items:Object.keys(report.items),gate:report.gate,courses:report.courses.map(c=>({length:c.length,time:c.time,laps:c.racers.map(r=>r.lap)})),memory:report.memory,errors},null,2));
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
