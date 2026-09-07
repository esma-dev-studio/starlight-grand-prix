// Offline only: NODE_PATH=<bundled node_modules> node tools/render-cover.cjs
// Requires the existing local development server. Does not change runtime code.
const { chromium } = require('playwright');
const sharp = require('sharp');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.resolve(__dirname, '..');
const output = path.join(root, 'assets', 'title-cover-v53.webp');
const screenshot = path.join(os.tmpdir(), 'title-cover-v53.png');
const width = 1600;
const height = 1000;
const maxBytes = 350000;
const origin = 'http://127.0.0.1:8765';
const source = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
const profileStart = source.indexOf('function getKartVisualProfile(');
const profileEnd = source.indexOf('\nfunction ', profileStart + 10);
assert(profileStart >= 0 && profileEnd > profileStart, 'Cannot find the shared vehicle profile factory.');
const profileFn = source.slice(profileStart, profileEnd);

// This function is serialized into the browser so all scene construction stays
// in this one offline tool. Every racer comes from the unmodified v53 factory.
function buildCover(THREE, createRaceVehicle, createEarth, createContactShadow, getKartVisualProfile) {
  const width = 1600;
  const height = 1000;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#070d12');
  const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 600);
  camera.position.set(11, 8, 26);
  camera.lookAt(0, 6, -2);
  camera.updateMatrixWorld(true);
  const target = new THREE.Vector3();
  const ray = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const groundAt = (u, v) => {
    ray.setFromCamera(new THREE.Vector2(u * 2 - 1, 1 - v * 2), camera);
    if (!ray.ray.intersectPlane(groundPlane, target)) throw new Error('Ground anchor is above the horizon.');
    return target.clone();
  };
  const atDepth = (u, v, depth) => new THREE.Vector3(
    (u * 2 - 1) * depth * Math.tan(camera.fov * Math.PI / 360) * camera.aspect,
    (1 - v * 2) * depth * Math.tan(camera.fov * Math.PI / 360), -depth
  ).applyMatrix4(camera.matrixWorld);
  const standard = (color, extra = {}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.76, metalness: 0.10, flatShading: true, ...extra
  });
  const hemisphere = new THREE.HemisphereLight(0xe4f2ff, 0x4b5260, 1.65);
  scene.add(hemisphere);
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.6);
  sun.position.set(-8, 24, 22);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -40, near: 0.5, far: 120 });
  sun.shadow.bias = -0.00012;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  scene.add(sun);

  // The road is a real planar ribbon with consistently upward-wound triangles.
  const roadCurve = new THREE.CatmullRomCurve3([
    groundAt(0.98, 1.48), groundAt(0.76, 0.92), groundAt(0.67, 0.72),
    groundAt(0.65, 0.60), groundAt(0.73, 0.54), groundAt(0.91, 0.49),
    groundAt(1.18, 0.465)
  ], false, 'centripetal');
  const samples = roadCurve.getSpacedPoints(140);
  const halfRoad = 11;
  const roadNormal = i => {
    const next = samples[Math.min(samples.length - 1, i + 1)];
    const prev = samples[Math.max(0, i - 1)];
    return new THREE.Vector3(-(next.z - prev.z), 0, next.x - prev.x).normalize();
  };
  const ribbon = (inner, outer, elevation, material) => {
    const points = [];
    const indices = [];
    for (let i = 0; i < samples.length; i += 1) {
      const normal = roadNormal(i);
      for (const offset of [inner, outer]) {
        const p = samples[i].clone().addScaledVector(normal, offset);
        points.push(p.x, elevation, p.z);
      }
      if (i < samples.length - 1) {
        const a = i * 2;
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    if (geometry.getAttribute('normal').getY(0) < 0.99) throw new Error('Road normals must face up.');
    const mesh = new THREE.Mesh(geometry, material);
    mesh.receiveShadow = true;
    scene.add(mesh);
    return mesh;
  };
  ribbon(-halfRoad - 0.60, halfRoad + 0.60, -0.045, standard('#19252b'));
  ribbon(-halfRoad, halfRoad, 0.015, standard('#78828c', { roughness: 0.80 }));
  const edgeMaterial = standard('#e2ebea', { emissive: '#a4b8b9', emissiveIntensity: 0.22 });
  for (const side of [-1, 1]) {
    const edge = side * halfRoad;
    ribbon(edge - 0.19, edge + 0.19, 0.035, standard('#253039'));
    ribbon(edge - 0.075, edge + 0.075, 0.055, edgeMaterial);
  }

  // Ground detail is kept out of the driving corridor and the lower-left CTA.
  const distanceToRoad = (x, z) => {
    let distance = Infinity;
    for (let i = 0; i < samples.length - 1; i += 1) {
      const a = samples[i];
      const b = samples[i + 1];
      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const t = THREE.MathUtils.clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz), 0, 1);
      distance = Math.min(distance, Math.hypot(x - a.x - t * dx, z - a.z - t * dz));
    }
    return distance;
  };
  const terrain = new THREE.PlaneGeometry(280, 240, 64, 56);
  terrain.rotateX(-Math.PI / 2);
  const positions = terrain.getAttribute('position');
  const terrainColors = [];
  const rockColor = new THREE.Color('#39464e');
  const shade = new THREE.Color();
  for (let i = 0; i < positions.count; i += 1) {
    const x = positions.getX(i);
    const z = positions.getZ(i) - 44;
    const clearance = distanceToRoad(x, z);
    const depth = -new THREE.Vector3(x, 0, z).applyMatrix4(camera.matrixWorldInverse).z;
    const mountain = Math.min(1, Math.max(0, (clearance - halfRoad - 7) / 28)) * THREE.MathUtils.smoothstep(depth, 90, 155);
    const ridge = Math.sin(x * 0.071 + z * 0.037) * Math.cos(z * 0.12) + Math.sin(x * 0.17 - z * 0.053) * 0.3;
    const y = -0.42 + mountain * Math.max(0, ridge + 0.5) * 4.6;
    positions.setXYZ(i, x, y, z);
    const screen = new THREE.Vector3(x, y, z).project(camera);
    const u = (screen.x + 1) / 2;
    const v = (1 - screen.y) / 2;
    const leftShade = THREE.MathUtils.smoothstep(u, 0.28, 0.70);
    const foregroundShade = 1 - THREE.MathUtils.smoothstep(v, 0.86, 1.22) * 0.34;
    shade.copy(rockColor).multiplyScalar((0.075 + leftShade * 0.72) * foregroundShade * (0.91 + ridge * 0.06));
    terrainColors.push(shade.r, shade.g, shade.b);
  }
  terrain.setAttribute('color', new THREE.Float32BufferAttribute(terrainColors, 3));
  terrain.computeVertexNormals();
  const moon = new THREE.Mesh(terrain, standard(0xffffff, { vertexColors: true, roughness: 1 }));
  moon.receiveShadow = true;
  scene.add(moon);

  const globe = createEarth(THREE);
  globe.position.copy(atDepth(0.790, 0.225, 150));
  globe.scale.setScalar(0.48);
  globe.rotation.set(0.09, 1.88, -0.13);
  globe.material.roughness = 1;
  scene.add(globe);
  // An engineered orbital track is distinct from the planet's surface.
  const orbital = new THREE.Group();
  orbital.position.copy(globe.position);
  orbital.rotation.set(0.96, 0.12, -0.34);
  const orbitMat = standard('#849ba5', { metalness: 0.28 });
  const orbitLight = new THREE.MeshBasicMaterial({ color: '#699d9c' });
  for (const radius of [30.9, 31.7]) {
    orbital.add(new THREE.Mesh(new THREE.TorusGeometry(radius, 0.15, 5, 128), orbitMat));
  }
  orbital.add(new THREE.Mesh(new THREE.TorusGeometry(31.3, 0.045, 4, 128), orbitLight));
  for (let i = 0; i < 20; i += 1) {
    const angle = i * Math.PI / 10;
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.10, 0.82, 5), orbitMat);
    strut.position.set(Math.cos(angle) * 31.3, Math.sin(angle) * 31.3, 0);
    strut.rotation.z = angle - Math.PI / 2;
    orbital.add(strut);
  }
  scene.add(orbital);

  let seed = 53;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const stars = [];
  for (let i = 0; i < 95; i += 1) {
    const u = random();
    const v = random() * 0.54;
    if (u < 0.46 && v > 0.10) continue;
    stars.push(...atDepth(u, v, 290).toArray());
  }
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(stars, 3));
  scene.add(new THREE.Points(starsGeometry, new THREE.PointsMaterial({ color: '#91a8b1', size: 0.22, sizeAttenuation: true })));

  const rocks = [[0.96, 0.86, 0.65], [0.94, 0.73, 0.38], [0.54, 0.565, 0.42], [0.56, 0.545, 0.22], [0.95, 0.515, 0.66], [0.86, 0.445, 0.72], [0.68, 0.45, 0.55]];
  for (const [u, v, scale] of rocks) {
    const p = groundAt(u, v);
    if (distanceToRoad(p.x, p.z) < halfRoad + 1.1) continue;
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 0), standard('#5c6872'));
    rock.position.copy(p);
    rock.position.y = scale * 0.24 - 0.20;
    rock.scale.set(scale * 1.45, scale * 0.84, scale);
    rock.rotation.set(0.2, random() * 2, 0.31);
    rock.castShadow = true;
    rock.receiveShadow = true;
    scene.add(rock);
  }

  // Fronts face +Z, toward the camera. Staggered road positions never intersect.
  const cast = [
    { id: 'luna-mimi', u: 0.710, v: 0.900, scale: 1.60, yaw: -0.10, lean: -0.045 },
    { id: 'gamma-bolt', u: 0.550, v: 0.670, scale: 1.05, yaw: 0.04, lean: 0.025 },
    { id: 'comet-rin', u: 0.840, v: 0.515, scale: 1.85, yaw: 0.28, lean: -0.075 }
  ];
  const vehicles = [];
  for (const pose of cast) {
    const character = window.AURORA_GAME_DATA.characters.find(c => c.id === pose.id);
    const kart = window.AURORA_GAME_DATA.karts.find(k => k.id === character.machineId);
    const profile = getKartVisualProfile(kart);
    const vehicle = createRaceVehicle(THREE, character, kart, profile, { low: false, isPlayer: true });
    if (vehicle.userData.artVersion !== 53) throw new Error('The cover requires v53 vehicle art.');
    vehicle.position.copy(groundAt(pose.u, pose.v));
    vehicle.scale.setScalar(pose.scale);
    vehicle.rotation.y = pose.yaw;
    vehicle.userData.chassis.rotation.z = pose.lean;
    vehicle.userData.driverRoot.rotation.z = -pose.lean * 0.65;
    for (const plume of vehicle.userData.enginePlumes) {
      plume.scale.set(0.57, 0.57, 0.75);
      plume.material.opacity = 0.27;
    }
    const contact = createContactShadow(THREE, profile.width * pose.scale, profile.length * pose.scale);
    contact.position.copy(vehicle.position);
    contact.position.y = 0.074;
    contact.rotation.y = pose.yaw;
    contact.material.opacity = 0.54;
    scene.add(contact, vehicle);
    vehicles.push({ id: pose.id, vehicle });
  }

  scene.updateMatrixWorld(true);
  const vehicleBounds = vehicles.map(({ id, vehicle }) => {
    const min = new THREE.Vector2(Infinity, Infinity);
    const max = new THREE.Vector2(-Infinity, -Infinity);
    const solidBounds = new THREE.Box3();
    let triangles = 0;
    let meshes = 0;
    let roadClearance = 0;
    vehicle.traverse(mesh => {
      if (!mesh.isMesh) return;
      meshes += 1;
      const positions = mesh.geometry.getAttribute('position');
      triangles += positions.count / 3;
      for (let i = 0; i < positions.count; i += 1) {
        const world = new THREE.Vector3().fromBufferAttribute(positions, i).applyMatrix4(mesh.matrixWorld);
        if (!mesh.material.transparent) {
          solidBounds.expandByPoint(world);
          roadClearance = Math.max(roadClearance, distanceToRoad(world.x, world.z));
        }
        const p = world.project(camera);
        const screen = new THREE.Vector2((p.x + 1) * width / 2, (1 - p.y) * height / 2);
        min.min(screen);
        max.max(screen);
      }
    });
    return { id, min: min.toArray(), max: max.toArray(), meshes, triangles, roadClearance, solidBounds };
  });
  const collisions = [];
  for (let a = 0; a < vehicleBounds.length; a += 1) {
    for (let b = a + 1; b < vehicleBounds.length; b += 1) {
      if (vehicleBounds[a].solidBounds.intersectsBox(vehicleBounds[b].solidBounds)) collisions.push([vehicleBounds[a].id, vehicleBounds[b].id]);
    }
  }
  renderer.render(scene, camera);
  return {
    png: renderer.domElement.toDataURL('image/png'),
    stats: {
      width, height, halfRoad, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
      vehicleBounds: vehicleBounds.map(({ solidBounds, ...bounds }) => bounds), collisions,
      assets: ['vehicle-art.js', 'scene-art.js', 'game-data.js', 'vendor/three.module.min.js']
    }
  };
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#070d12}canvas{display:block}</style></head><body>
      <script src="/game-data.js"></script><script type="module">
      import * as THREE from '/vendor/three.module.min.js';
      import { createRaceVehicle } from '/vehicle-art.js';
      import { createEarth, createContactShadow } from '/scene-art.js';
      const DEG = Math.PI / 180;
      ${profileFn}
      window.renderCover = () => (${buildCover.toString()})(THREE, createRaceVehicle, createEarth, createContactShadow, getKartVisualProfile);
      </script></body></html>`;
    await page.route('**/cover-studio-v53.html', route => route.fulfill({ contentType: 'text/html', body: html }));
    await page.goto(`${origin}/cover-studio-v53.html`);
    await page.waitForFunction(() => typeof window.renderCover === 'function');
    const result = await page.evaluate(() => window.renderCover());
    assert.deepEqual(errors, [], 'The offline renderer reported a browser error.');
    const bytes = Buffer.from(result.png.split(',')[1], 'base64');
    fs.writeFileSync(screenshot, bytes);
    let webp;
    let quality;
    for (quality = 91; quality >= 61; quality -= 3) {
      webp = await sharp(bytes).webp({ quality, effort: 6, smartSubsample: true }).toBuffer();
      if (webp.length <= maxBytes) break;
    }
    assert(webp.length <= maxBytes, 'The cover exceeds the 350KB budget.');
    const metadata = await sharp(webp).metadata();
    assert.equal(metadata.width, width);
    assert.equal(metadata.height, height);
    const quietRegions = {};
    for (const [name, region] of [
      ['title', { left: 40, top: 70, width: 670, height: 340 }],
      ['cta', { left: 40, top: 760, width: 430, height: 190 }]
    ]) {
      const crop = await sharp(webp).extract(region).toBuffer();
      const stats = await sharp(crop).stats();
      const mean = stats.channels.slice(0, 3).reduce((sum, channel) => sum + channel.mean, 0) / 3;
      quietRegions[name] = Math.round(mean * 100) / 100;
      assert(mean < 42, `${name} negative space is too bright.`);
    }
    assert.deepEqual(result.stats.collisions, [], 'Vehicle solids overlap.');
    for (const bounds of result.stats.vehicleBounds) {
      assert(bounds.roadClearance < result.stats.halfRoad - 0.10, `${bounds.id} extends beyond the road.`);
      assert(bounds.min[0] >= 24 && bounds.max[0] <= width - 24 && bounds.min[1] >= 24 && bounds.max[1] <= height - 24,
        `${bounds.id} is cropped by the cover frame.`);
    }
    fs.writeFileSync(output, webp);
    console.log(JSON.stringify({ output, screenshot, bytes: webp.length, quality, quietRegions, ...result.stats }, null, 2));
  } finally {
    await browser.close();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
