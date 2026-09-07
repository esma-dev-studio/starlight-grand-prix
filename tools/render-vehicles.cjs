const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root,'main.js'),'utf8');
const profileFn = source.slice(source.indexOf('function getKartVisualProfile('),source.indexOf('\nfunction createPrismGeometry('));

async function run() {
  const browser = await chromium.launch({headless:true});
  try {
    const page = await browser.newPage({viewport:{width:720,height:500}});
    const html=`<!doctype html><html><body style="margin:0"><script src="/game-data.js"></script><script type="module">
      import * as THREE from '/vendor/three.module.min.js';
      import {createRaceVehicle} from '/vehicle-art.js';
      const DEG=Math.PI/180;
      ${profileFn}
      const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});
      renderer.setSize(720,500); renderer.setPixelRatio(1); renderer.outputColorSpace=THREE.SRGBColorSpace;
      renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
      document.body.appendChild(renderer.domElement);
      const scene=new THREE.Scene();
      scene.add(new THREE.HemisphereLight(0xe4f2ff,0x4b5260,1.65));
      const sun=new THREE.DirectionalLight(0xfff0dc,2.6);sun.position.set(-8,14,9);scene.add(sun);
      const camera=new THREE.PerspectiveCamera(36,720/500,.1,100);
      window.renderVehicle=(index,rear=false)=>{
        const character=window.AURORA_GAME_DATA.characters[index];
        const kart=window.AURORA_GAME_DATA.karts.find(k=>k.id===character.machineId)||window.AURORA_GAME_DATA.karts[index];
        const model=createRaceVehicle(THREE,character,kart,getKartVisualProfile(kart),{low:false,isPlayer:true});
        scene.add(model); const box=new THREE.Box3().setFromObject(model),center=box.getCenter(new THREE.Vector3());
        const size=box.getSize(new THREE.Vector3());
        const distance=Math.max(size.x,size.z,size.y*1.5)*2.25;
        camera.position.copy(center).add(new THREE.Vector3(0.67,0.46,rear?-1:1).normalize().multiplyScalar(distance));
        camera.lookAt(center);renderer.render(scene,camera);
        const png=renderer.domElement.toDataURL('image/png');
        const stats={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,size:size.toArray(),id:character.id};
        scene.remove(model);model.traverse(c=>{c.geometry?.dispose();if(c.material&&!Array.isArray(c.material))c.material.dispose()});
        return {png,stats};
      };
    </script></body></html>`;
    await page.route('**/art-studio.html',route=>route.fulfill({contentType:'text/html',body:html}));
    await page.goto('http://127.0.0.1:8765/art-studio.html');
    await page.waitForFunction(()=>window.renderVehicle);
    const names=['luna','gamma','nebi','sora','rin'];
    for(let i=0;i<5;i++) {
      const image=await page.evaluate(index=>renderVehicle(index),i);
      const bytes=Buffer.from(image.png.split(',')[1],'base64');
      await sharp(bytes).trim({threshold:8}).resize(640,440,{fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).webp({quality:86}).toFile(path.join(root,`assets/racer-${names[i]}-v53.webp`));
      console.log(image.stats);
    }
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e);process.exitCode=1;});
