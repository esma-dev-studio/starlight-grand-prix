// Vehicle coordinates: +Y up, +Z bow, -Z engines. No scene/global dependencies.
const MACHINE_STYLES = {
  moon: { beam: 0.295, nose: 0.075, pod: 0.098, podFront: 0.24, fin: 0.62 },
  bastion: { beam: 0.325, nose: 0.235, pod: 0.117, podFront: 0.28, fin: 0.46 },
  nebula: { beam: 0.31, nose: 0.105, pod: 0.094, podFront: 0.15, fin: 0.52 },
  ranger: { beam: 0.30, nose: 0.135, pod: 0.101, podFront: 0.22, fin: 0.94 },
  comet: { beam: 0.255, nose: 0.022, pod: 0.092, podFront: 0.18, fin: 1.02 }
};

export function createRaceVehicle(THREE, character, kart, profile, options = { low: false, isPlayer: false }) {
  character = character || {};
  kart = kart || {};
  profile = profile || {};
  const low = Boolean(options.low);
  const castShadow = Boolean(options.isPlayer) && !low;
  const type = machineStyle(kart.id, profile.type);
  const style = MACHINE_STYLES[type];
  const width = positive(profile.width, 4.5);
  const length = positive(profile.length, 6.2);
  const height = positive(profile.height, 0.95);
  const deckY = 1.48 + height * 0.30;
  const seatZ = Number.isFinite(profile.seatZ) ? profile.seatZ : -0.3;
  const colors = kart.colors || {};
  const characterColors = character.colors || {};
  const primary = new THREE.Color(colors.primary || colors.body || characterColors.primary || '#537c96');
  const secondary = new THREE.Color(colors.secondary || colors.trim || characterColors.secondary || '#cad9df');
  const accent = new THREE.Color(kart.boostColor || character.boostColor || colors.glow || colors.accent || '#80e3ee');
  const pearl = new THREE.Color('#e3e9e6');
  const bodyColor = primary.clone().lerp(new THREE.Color('#b7c5ce'), 0.065);
  const trimColor = secondary.clone().lerp(primary, 0.30).lerp(new THREE.Color('#777d85'), 0.12);
  const stripeColor = primary.r * 0.21 + primary.g * 0.72 + primary.b * 0.07 > 0.58 ? trimColor : pearl;
  const standard = (color, extra = {}) => new THREE.MeshStandardMaterial({
    color, roughness: 0.5, metalness: 0.12, flatShading: true, ...extra
  });
  const materials = {
    body: standard(bodyColor),
    trim: standard(trimColor),
    stripe: standard(stripeColor),
    dark: standard('#222830', { roughness: 0.64 }),
    metal: standard('#73838b', { roughness: 0.43, metalness: 0.3 }),
    glass: standard('#070c13', { roughness: 0.20, metalness: 0.18 }),
    glow: standard(accent, { emissive: accent, emissiveIntensity: 0.65 }),
    suit: standard(new THREE.Color(characterColors.primary || primary).lerp(pearl, 0.10)),
    face: standard(character.id === 'nebi-mist' ? '#b4dfeb' : '#f1eee6'),
    detail: standard(new THREE.Color(characterColors.secondary || secondary).lerp(pearl, 0.17))
  };
  const root = new THREE.Group();
  root.name = `race-vehicle-${kart.id || type}`;
  const chassis = new THREE.Group();
  chassis.name = 'chassis';
  root.add(chassis);
  const batch = staticBatch(THREE, chassis, castShadow, 'airframe');
  const hullBeam = width * style.beam;
  const cockpitHalf = width * 0.177;
  const cockpitRear = -length * 0.275;
  const cockpitFront = length * 0.105;

  // The keel is watertight. Upper foredeck, stern and sills leave the cockpit open.
  const keelSections = [
    { z: -length * 0.46, w: hullBeam * 0.72, y: 1.03, h: 0.30 },
    { z: -length * 0.25, w: hullBeam, y: 1.05, h: 0.35 },
    { z: length * 0.10, w: hullBeam * 0.96, y: 1.01, h: 0.31 },
    { z: length * 0.34, w: hullBeam * (type === 'bastion' ? 0.91 : 0.64), y: 0.99, h: 0.23 },
    { z: length * 0.53, w: width * style.nose, y: 1.03, h: 0.095 }
  ];
  batch.add(sweptHull(THREE, keelSections), materials.dark);
  const bow = [
    { z: cockpitFront, w: hullBeam * 0.96, y: 1.32, h: deckY - 1.32 },
    { z: length * 0.29, w: hullBeam * (type === 'bastion' ? 0.96 : 0.77), y: 1.26, h: (deckY - 1.26) * 0.72 },
    { z: length * 0.43, w: hullBeam * (type === 'bastion' ? 0.82 : 0.39), y: 1.16, h: 0.19 },
    { z: length * 0.535, w: width * style.nose, y: 1.08, h: 0.07 }
  ];
  batch.add(sweptHull(THREE, bow), materials.body);
  batch.add(deckRibbon(THREE, bow, width * 0.061), materials.stripe);
  const stern = [
    { z: -length * 0.47, w: hullBeam * 0.70, y: 1.28, h: 0.20 },
    { z: -length * 0.35, w: hullBeam * 0.95, y: 1.38, h: deckY - 1.31 },
    { z: cockpitRear, w: hullBeam, y: 1.38, h: deckY - 1.38 }
  ];
  batch.add(sweptHull(THREE, stern), materials.body);
  batch.add(deckRibbon(THREE, stern, width * 0.061), materials.stripe);

  for (const side of [-1, 1]) {
    const sillHalf = (hullBeam - cockpitHalf) * 0.5;
    const sillX = side * (cockpitHalf + sillHalf);
    const sillSections = [
      { z: cockpitRear - 0.06, x: sillX, w: sillHalf, y: 1.40, h: deckY - 1.40 },
      { z: -length * 0.08, x: sillX, w: sillHalf, y: 1.40, h: deckY - 1.38 },
      { z: cockpitFront + 0.04, x: sillX * 0.98, w: sillHalf, y: 1.36, h: deckY - 1.36 }
    ];
    batch.add(sweptHull(THREE, sillSections), materials.body);
    batch.add(deckRibbon(THREE, sillSections, sillHalf * 0.25), materials.trim);
    // Inner cockpit liner reaches below the coaming, not across the pilot's seat.
    batch.add(sweptHull(THREE, [
      { z: cockpitRear, x: side * cockpitHalf, w: 0.045, y: deckY - 0.31, h: 0.26 },
      { z: cockpitFront, x: side * cockpitHalf, w: 0.045, y: deckY - 0.31, h: 0.26 }
    ]), materials.dark);
  }

  batch.add(sweptHull(THREE, [
    { z: seatZ - 0.46, w: cockpitHalf * 0.82, y: deckY - 0.38, h: 0.09 },
    { z: seatZ + 0.59, w: cockpitHalf * 0.70, y: deckY - 0.40, h: 0.09 }
  ]), materials.dark);
  addEllipsoid(THREE, batch, materials.dark, [0, deckY - 0.04, seatZ - 0.45], [cockpitHalf * 0.75, 0.47, 0.15]);
  addEllipsoid(THREE, batch, materials.trim, [0, deckY + 0.25, seatZ - 0.50], [0.30, 0.22, 0.14]);
  // A short opaque windscreen rises only in front of the knees.
  batch.add(sweptHull(THREE, [
    { z: cockpitFront - 0.20, w: cockpitHalf * 0.89, y: deckY + 0.055, h: 0.12 },
    { z: cockpitFront + 0.26, w: cockpitHalf * 0.66, y: deckY - 0.055, h: 0.055 }
  ]), materials.glass);

  const enginePlumes = [];
  for (const side of [-1, 1]) {
    addWing(THREE, batch, materials, type, width, length, deckY, side);
    const engineX = side * width * (type === 'bastion' ? 0.407 : 0.414);
    const engineY = type === 'nebula' ? 1.22 : 1.13;
    const podWidth = width * style.pod;
    const podHeight = type === 'bastion' ? 0.49 : 0.35;
    const pod = [
      { z: -length * 0.475, x: engineX, w: podWidth * 0.86, y: engineY, h: podHeight * 0.84 },
      { z: -length * 0.34, x: engineX, w: podWidth, y: engineY, h: podHeight },
      { z: length * 0.065, x: engineX, w: podWidth * 0.91, y: engineY, h: podHeight * 0.94 },
      { z: length * style.podFront, x: engineX * 0.97, w: podWidth * 0.52, y: engineY + 0.055, h: podHeight * 0.64 }
    ];
    batch.add(sweptHull(THREE, pod), materials.body);
    batch.add(deckRibbon(THREE, pod, podWidth * 0.30), materials.trim);
    const nozzleZ = -length * 0.49;
    batch.add(sweptHull(THREE, [
      { z: nozzleZ, x: engineX, w: podWidth * 0.83, y: engineY, h: podHeight * 0.83 },
      { z: nozzleZ + 0.26, x: engineX, w: podWidth * 0.92, y: engineY, h: podHeight * 0.92 }
    ]), materials.metal);
    addDisc(THREE, batch, materials.dark, engineX, engineY, nozzleZ - 0.008, podWidth * 0.72, podHeight * 0.72, true);
    batch.add(new THREE.RingGeometry(0.70, 0.90, 8), materials.glow,
      [engineX, engineY, nozzleZ - 0.018], [0, Math.PI, 0], [podWidth * 0.87, podHeight * 0.87, 1]);
    const intakeZ = length * style.podFront + 0.011;
    addDisc(THREE, batch, materials.glass, engineX * 0.97, engineY + 0.055, intakeZ, podWidth * 0.41, podHeight * 0.5, false);
    // Intake eyebrow and nozzle are deliberately readable from opposite ends.
    batch.add(sweptHull(THREE, [
      { z: intakeZ - 0.055, x: engineX * 0.97, w: podWidth * 0.41, y: engineY + podHeight * 0.49, h: 0.035 },
      { z: intakeZ + 0.025, x: engineX * 0.97, w: podWidth * 0.35, y: engineY + podHeight * 0.48, h: 0.03 }
    ]), materials.glow);
    addTailFin(THREE, batch, materials, side, width, length, deckY, style.fin, type);
    if (!low) {
      for (let i = 0; i < 3; i += 1) {
        batch.add(sweptHull(THREE, [
          { z: -length * 0.32 + i * 0.145, x: engineX, w: podWidth * 0.54, y: engineY + podHeight + 0.009, h: 0.018 },
          { z: -length * 0.32 + i * 0.145 + 0.052, x: engineX, w: podWidth * 0.54, y: engineY + podHeight + 0.009, h: 0.018 }
        ]), materials.dark);
      }
    }
    const plumeMaterial = new THREE.MeshBasicMaterial({
      color: accent, transparent: true, opacity: 0.30, depthWrite: false, blending: THREE.AdditiveBlending
    });
    // Geometry, not object rotation, points aft: parent animation scales local Z.
    const plume = new THREE.Mesh(sweptHull(THREE, [
      { z: -1.95, w: 0.018, y: 0, h: 0.018 },
      { z: -0.65, w: podWidth * 0.44, y: 0, h: podHeight * 0.44 },
      { z: 0, w: podWidth * 0.76, y: 0, h: podHeight * 0.76 }
    ]), plumeMaterial);
    plume.name = `exhaust-${side < 0 ? 'left' : 'right'}`;
    plume.position.set(engineX, engineY, nozzleZ - 0.025);
    plume.scale.set(0.62, 0.62, 0.60);
    enginePlumes.push(plume);
    chassis.add(plume);
  }

  addEmblem(THREE, batch, materials, type, width, deckY, length, bow);
  batch.flush();
  const driver = createPilot(THREE, character, type, materials, castShadow, low);
  const driverScale = Math.max(0.94, Math.min(1.13, width / 4.45));
  const driverBaseY = deckY - 0.16;
  driver.scale.setScalar(driverScale);
  driver.position.set(0, driverBaseY, seatZ);
  driver.rotation.x = profile.driverPitch || 0;
  chassis.add(driver);
  Object.assign(root.userData, {
    chassis, driverRoot: driver, driverBaseY, machineProfile: profile,
    machineType: profile.type || type, signatureColor: accent, glowMat: materials.glow,
    enginePlumes, hoverRings: [], machineMotionParts: { pulse: [], spin: [], flutter: [], hover: [] },
    artVersion: 53
  });
  return root;
}

function positive(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function machineStyle(id, type) {
  const dedicated = { 'moon-skipper': 'moon', 'iron-bastion': 'bastion', 'nebula-float': 'nebula', 'star-ranger': 'ranger', 'comet-spear': 'comet' };
  const fallback = { light: 'moon', heavy: 'bastion', handling: 'nebula', balanced: 'ranger', speed: 'comet' };
  return dedicated[id] || (MACHINE_STYLES[type] ? type : fallback[type]) || 'ranger';
}

// Small non-indexed merger: one draw per material per independently moving root.
// Transforms are baked before merging; no negative scales or material groups.
function staticBatch(THREE, parent, castShadow, name) {
  const buckets = new Map();
  const transform = new THREE.Object3D();
  return {
    add(geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], vertexColor = null) {
      transform.position.set(...position);
      transform.rotation.set(...rotation);
      transform.scale.set(...scale);
      transform.updateMatrix();
      geometry.applyMatrix4(transform.matrix);
      if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
      const flat = geometry.index ? geometry.toNonIndexed() : geometry;
      let bucket = buckets.get(material);
      if (!bucket) {
        bucket = { positions: [], normals: [], colors: [] };
        buckets.set(material, bucket);
      }
      const positions = flat.getAttribute('position');
      const normals = flat.getAttribute('normal');
      const color = vertexColor || material.color;
      for (let i = 0; i < positions.count; i += 1) {
        bucket.positions.push(positions.getX(i), positions.getY(i), positions.getZ(i));
        bucket.normals.push(normals.getX(i), normals.getY(i), normals.getZ(i));
        if (material.vertexColors) bucket.colors.push(color.r, color.g, color.b);
      }
      if (flat !== geometry) flat.dispose();
      geometry.dispose();
    },
    flush() {
      const meshes = [];
      for (const [material, data] of buckets) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
        if (material.vertexColors) geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
        geometry.computeBoundingSphere();
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = `${name}-${meshes.length}`;
        mesh.castShadow = castShadow;
        mesh.receiveShadow = true;
        parent.add(mesh);
        meshes.push(mesh);
      }
      buckets.clear();
      return meshes;
    }
  };
}

function triangleGeometry(THREE, points, faces) {
  const positions = [];
  for (const face of faces) {
    for (const index of face) positions.push(...points[index]);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// XY rings are CCW viewed from +Z; increasing Z gives outward sides, rear -Z,
// front +Z. Chamfered sections create broad flat decks and continuous solid mass.
function sweptHull(THREE, sections) {
  const ring = [[-0.64, -1], [0.64, -1], [1, -0.42], [1, 0.42], [0.64, 1], [-0.64, 1], [-1, 0.42], [-1, -0.42]];
  const points = [];
  const faces = [];
  for (const section of sections) {
    for (const [x, y] of ring) points.push([(section.x || 0) + x * section.w, section.y + y * section.h, section.z]);
  }
  for (let j = 0; j < sections.length - 1; j += 1) {
    for (let i = 0; i < 8; i += 1) {
      const a = j * 8 + i;
      const b = j * 8 + (i + 1) % 8;
      const c = b + 8;
      const d = a + 8;
      faces.push([a, b, c], [a, c, d]);
    }
  }
  for (let i = 1; i < 7; i += 1) {
    faces.push([0, i + 1, i]);
    const front = (sections.length - 1) * 8;
    faces.push([front, front + i, front + i + 1]);
  }
  return triangleGeometry(THREE, points, faces);
}

function deckRibbon(THREE, sections, halfWidth) {
  return sweptHull(THREE, sections.map(section => ({
    z: section.z, x: section.x || 0, y: section.y + section.h + 0.012,
    w: Math.min(halfWidth, section.w * 0.48), h: 0.012
  })));
}

// Closed XY polygon extruded along Z. ShapeUtils handles concave crescent wings.
function extrudedPlate(THREE, outline, depth) {
  const contour = outline.map(([x, y]) => new THREE.Vector2(x, y));
  if (THREE.ShapeUtils.isClockWise(contour)) contour.reverse();
  const count = contour.length;
  const points = [];
  const faces = [];
  for (const z of [-depth * 0.5, depth * 0.5]) {
    for (const p of contour) points.push([p.x, p.y, z]);
  }
  for (const [a, b, c] of THREE.ShapeUtils.triangulateShape(contour, [])) {
    faces.push([c, b, a], [a + count, b + count, c + count]);
  }
  for (let i = 0; i < count; i += 1) {
    const j = (i + 1) % count;
    faces.push([i, j, j + count], [i, j + count, i + count]);
  }
  return triangleGeometry(THREE, points, faces);
}

function addEllipsoid(THREE, batch, material, position, scale, rotation = [0, 0, 0]) {
  batch.add(new THREE.SphereGeometry(1, 12, 7), material, position, rotation, scale);
}

function addDisc(THREE, batch, material, x, y, z, rx, ry, rear) {
  batch.add(new THREE.CircleGeometry(1, 8), material, [x, y, z], [0, rear ? Math.PI : 0, 0], [rx, ry, 1]);
}

function addWing(THREE, batch, materials, type, width, length, deckY, side) {
  const outlines = {
    moon: [[0.24, 0.21], [0.40, 0.24], [0.54, 0.06], [0.54, -0.14], [0.43, -0.41], [0.44, -0.07], [0.29, 0.02]],
    bastion: [[0.22, 0.28], [0.44, 0.27], [0.52, 0.10], [0.52, -0.33], [0.40, -0.42], [0.22, -0.26]],
    nebula: [[0.22, 0.30], [0.45, 0.12], [0.57, -0.10], [0.48, -0.34], [0.31, -0.45], [0.34, -0.16], [0.22, -0.03]],
    ranger: [[0.23, 0.10], [0.32, 0.08], [0.53, -0.19], [0.53, -0.34], [0.26, -0.27]],
    comet: [[0.20, 0.20], [0.29, 0.13], [0.54, -0.39], [0.47, -0.46], [0.24, -0.28]]
  };
  // XY -> XZ by +90deg about X. Mirroring is done before winding is repaired.
  const outline = outlines[type].map(([x, z]) => [side * x * width, z * length]);
  batch.add(extrudedPlate(THREE, outline, type === 'bastion' ? 0.22 : 0.14), materials.trim,
    [0, deckY - 0.40, 0], [Math.PI / 2, 0, 0]);
  if (type === 'ranger') {
    batch.add(extrudedPlate(THREE, [[0.16, 0.35], [0.40, 0.31], [0.44, 0.23], [0.20, 0.24]].map(([x, z]) => [side * x * width, z * length]), 0.11),
      materials.stripe, [0, 1.12, 0], [Math.PI / 2, 0, 0]);
  }
}

function addTailFin(THREE, batch, materials, side, width, length, deckY, height, type) {
  const x = side * width * (type === 'nebula' ? 0.455 : 0.403);
  const y = deckY - 0.27;
  const z = -length * 0.31;
  // Local X becomes -Z, local Y stays up: positive outline X sweeps aft.
  const outline = [[-0.61, 0], [0.63, 0], [0.67, height], [0.30, height * 0.88]];
  batch.add(extrudedPlate(THREE, outline, 0.11), materials.body, [x, y, z], [0, Math.PI / 2, side * -0.13]);
  const inlay = [[0.12, height * 0.20], [0.55, height * 0.20], [0.57, height * 0.77], [0.35, height * 0.70]];
  batch.add(extrudedPlate(THREE, inlay, 0.119), materials.stripe, [x, y, z], [0, Math.PI / 2, side * -0.13]);
}

function emblemOutline(type) {
  if (type === 'moon') return [[0.08, 0.42], [-0.25, 0.28], [-0.34, -0.04], [-0.13, -0.32], [0.19, -0.33], [0.02, -0.13], [-0.03, 0.12]];
  if (type === 'bastion') return [[-0.06, 0.42], [-0.30, -0.02], [-0.04, -0.02], [-0.15, -0.40], [0.30, 0.13], [0.06, 0.13]];
  if (type === 'comet') return [[0.03, 0.45], [-0.25, -0.30], [0.0, -0.18], [0.23, -0.36], [0.18, 0.10]];
  const outline = [];
  for (let i = 0; i < 10; i += 1) {
    const angle = Math.PI / 2 + i * Math.PI / 5;
    const radius = i % 2 ? 0.19 : 0.39;
    outline.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
  }
  return outline;
}

function addEmblem(THREE, batch, materials, type, width, deckY, length, bow) {
  const z = length * 0.235;
  const t = (z - bow[0].z) / (bow[1].z - bow[0].z);
  const topY = bow[0].y + bow[0].h + t * (bow[1].y + bow[1].h - bow[0].y - bow[0].h);
  const slope = (bow[1].y + bow[1].h - bow[0].y - bow[0].h) / (bow[1].z - bow[0].z);
  const tilt = Math.atan2(1, slope);
  batch.add(extrudedPlate(THREE, emblemOutline(type), 0.016), materials.trim,
    [width * 0.133, topY + 0.025, z], [tilt, 0, 0], [0.78, 0.78, 1]);
  // The same badge is repeated on the stern bulkhead for chase-camera identity.
  batch.add(extrudedPlate(THREE, emblemOutline(type), 0.018), materials.stripe,
    [0, 1.31, -length * 0.47 - 0.014], [0, Math.PI, 0], [0.43, 0.43, 1]);
}

function createPilot(THREE, character, machineType, materials, castShadow, low) {
  const driver = new THREE.Group();
  const id = character.id || '';
  const traitTypes = { beast: 'moon', robot: 'bastion', spirit: 'nebula', sprinter: 'comet', pilot: 'ranger' };
  const identity = { 'luna-mimi': 'moon', 'gamma-bolt': 'bastion', 'nebi-mist': 'nebula', 'sora-ranger': 'ranger', 'comet-rin': 'comet' };
  const type = identity[id] || traitTypes[character.modelTrait] || machineType;
  driver.name = `pilot-${id || type}`;
  driver.userData.characterId = id;
  driver.userData.characterMotionParts = { pulse: [], spin: [], flutter: [], sway: [] };
  const batch = staticBatch(THREE, driver, castShadow, 'pilot');
  const robot = type === 'bastion';
  const torsoWidth = robot ? 0.58 : type === 'nebula' ? 0.36 : 0.43;
  addEllipsoid(THREE, batch, materials.suit, [0, 0.23, 0], [torsoWidth, 0.56, 0.34], [0.10, 0, 0]);
  addEllipsoid(THREE, batch, materials.dark, [0, -0.20, 0.18], [torsoWidth * 0.95, 0.23, 0.40]);
  for (const side of [-1, 1]) {
    const shoulder = side * (robot ? 0.67 : 0.43);
    addEllipsoid(THREE, batch, materials.suit, [shoulder, 0.44, 0.01], [robot ? 0.40 : 0.23, robot ? 0.34 : 0.24, 0.28]);
    addLimb(THREE, batch, materials.suit, [shoulder, 0.40, 0.02], [side * 0.55, 0.03, 0.23], robot ? 0.20 : 0.14);
    addLimb(THREE, batch, materials.detail, [side * 0.55, 0.03, 0.23], [side * 0.39, 0.10, 0.61], robot ? 0.18 : 0.12);
    addEllipsoid(THREE, batch, materials.dark, [side * 0.39, 0.10, 0.61], [0.15, 0.14, 0.16]);
    addLimb(THREE, batch, materials.suit, [side * 0.22, -0.17, 0.06], [side * 0.29, -0.30, 0.55], 0.19);
    addLimb(THREE, batch, materials.dark, [side * 0.29, -0.30, 0.55], [side * 0.27, -0.52, 0.75], 0.15);
    // Flat harness inlays and the rear pack tie the driver to the ship livery.
    batch.add(extrudedPlate(THREE, [[-0.045, -0.23], [0.045, -0.23], [0.065, 0.36], [-0.065, 0.36]], 0.02),
      materials.stripe, [side * 0.23, 0.24, 0.317], [0, 0, side * 0.11]);
  }
  addEllipsoid(THREE, batch, materials.detail, [0, 0.19, -0.34], [0.31, 0.40, 0.13]);
  batch.add(extrudedPlate(THREE, emblemOutline(type), 0.018), materials.stripe,
    [0, 0.20, -0.48], [0, Math.PI, 0], [0.52, 0.52, 1]);
  addLimb(THREE, batch, materials.dark, [-0.39, 0.07, 0.65], [0.39, 0.07, 0.65], 0.055);
  addEllipsoid(THREE, batch, materials.detail, [0, 0.68, 0.015], [0.37, 0.12, 0.31]);

  const headY = robot ? 1.13 : 1.18;
  const headWidth = robot ? 0.62 : type === 'comet' ? 0.56 : 0.63;
  const headHeight = robot ? 0.44 : type === 'nebula' ? 0.68 : 0.58;
  const headDepth = type === 'comet' ? 0.68 : 0.54;
  if (robot) {
    batch.add(sweptHull(THREE, [
      { z: -0.47, w: headWidth * 0.84, y: headY, h: headHeight * 0.85 },
      { z: -0.28, w: headWidth, y: headY, h: headHeight },
      { z: 0.37, w: headWidth, y: headY, h: headHeight },
      { z: 0.49, w: headWidth * 0.84, y: headY, h: headHeight * 0.80 }
    ]), materials.suit);
    addEllipsoid(THREE, batch, materials.metal, [0, headY - 0.30, 0.43], [0.39, 0.14, 0.13]);
  } else {
    addEllipsoid(THREE, batch, type === 'moon' || type === 'nebula' ? materials.face : materials.suit,
      [0, headY, 0], [headWidth, headHeight, headDepth]);
  }
  // A black wraparound visor, with two broad eye marks on its front facets.
  const visorOffset = headDepth - 0.54;
  addEllipsoid(THREE, batch, materials.glass, [0, headY + 0.015, 0.27 + visorOffset],
    [headWidth * 0.90, robot ? 0.23 : 0.30, 0.39]);
  for (const side of [-1, 1]) {
    const eye = type === 'nebula' ? [[-0.095, -0.055], [0.095, -0.055], [0.08, 0.075], [-0.075, 0.075]]
      : [[-0.10, -0.055], [0.10, -0.055], [0.10, 0.055], [-0.10, 0.055]];
    batch.add(extrudedPlate(THREE, eye, 0.028), robot ? materials.glow : materials.face,
      [side * 0.22, headY + 0.035, 0.676 + visorOffset], [0, side * 0.23, type === 'comet' ? side * -0.13 : 0]);
    addEllipsoid(THREE, batch, materials.detail, [side * headWidth * 0.92, headY, 0.01], [0.13, 0.24, 0.26]);
  }
  if (type === 'moon') {
    addEllipsoid(THREE, batch, materials.face, [0, headY - 0.25, 0.39], [0.29, 0.18, 0.23]);
    addEllipsoid(THREE, batch, materials.detail, [0, headY - 0.18, 0.606], [0.095, 0.060, 0.046]);
    for (const side of [-1, 1]) addEar(THREE, driver, materials, side, castShadow, headY);
  } else if (type === 'nebula') {
    // Integrated swept crown, not disconnected orbiting decoration.
    batch.add(extrudedPlate(THREE, [[-0.48, 0], [-0.54, 0.44], [-0.20, 0.31], [0, 0.94], [0.20, 0.31], [0.54, 0.44], [0.48, 0]], 0.25),
      materials.face, [0, headY + 0.29, -0.13], [-0.18, 0, 0]);
    batch.add(extrudedPlate(THREE, emblemOutline('nebula'), 0.027), materials.detail,
      [0, headY + 0.69, 0.07], [0, 0, 0], [0.49, 0.49, 1]);
    addScarf(THREE, driver, materials, castShadow, true);
  } else if (type === 'ranger' || type === 'comet') {
    // Center helmet stripe follows the shell over its crown, visible from aft.
    for (const turn of [0, Math.PI]) {
      batch.add(new THREE.SphereGeometry(1, 12, 7, Math.PI / 2 - 0.09, 0.18), materials.stripe,
        [0, headY, 0], [0, turn, 0], [headWidth + 0.012, headHeight + 0.012, headDepth + 0.012]);
    }
    if (type === 'comet') {
      batch.add(extrudedPlate(THREE, [[-0.15, 0], [0.74, 0.08], [0.96, 0.59], [0.08, 0.43]], 0.13), materials.detail,
        [0, headY + 0.25, -0.27], [0, Math.PI / 2, 0]);
    }
    addScarf(THREE, driver, materials, castShadow, false);
  }
  if (robot && !low) {
    for (const side of [-1, 1]) {
      batch.add(extrudedPlate(THREE, [[-0.13, -0.09], [0.13, -0.09], [0.10, 0.09], [-0.10, 0.09]], 0.024), materials.glow,
        [side * 0.76, 0.46, -0.237], [0, Math.PI, 0]);
    }
  }
  batch.flush();
  return driver;
}

function addLimb(THREE, batch, material, start, end, radius) {
  const a = new THREE.Vector3(...start);
  const b = new THREE.Vector3(...end);
  const delta = b.clone().sub(a);
  const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.clone().normalize()));
  batch.add(new THREE.CylinderGeometry(radius * 0.89, radius, delta.length(), 8), material,
    a.add(b).multiplyScalar(0.5).toArray(), [rotation.x, rotation.y, rotation.z]);
}

function trackFlutter(driver, part) {
  part.userData.basePosition = part.position.clone();
  part.userData.baseRotation = part.rotation.clone();
  part.userData.baseScale = part.scale.clone();
  driver.userData.characterMotionParts.flutter.push(part);
}

function addEar(THREE, driver, materials, side, castShadow, headY) {
  const holder = new THREE.Group();
  const material = materials.face.clone();
  material.color.set(0xffffff);
  material.vertexColors = true;
  const batch = staticBatch(THREE, holder, castShadow, 'ear');
  const outer = [[-0.17, -0.08], [0.17, -0.08], [0.225, 0.81], [0.14, 1.27], [-0.025, 1.40], [-0.185, 1.10], [-0.23, 0.38]];
  const inner = [[-0.09, 0.12], [0.09, 0.12], [0.125, 0.82], [0.035, 1.16], [-0.08, 1.02], [-0.13, 0.44]];
  batch.add(extrudedPlate(THREE, outer, 0.20), material, [0, 0, 0], [0, 0, 0], [1, 1, 1], materials.face.color);
  batch.add(extrudedPlate(THREE, inner, 0.018), material, [0, 0, 0.11], [0, 0, 0], [1, 1, 1], materials.detail.color);
  batch.add(extrudedPlate(THREE, [[-0.15, 0.27], [0.18, 0.27], [0.19, 0.40], [-0.16, 0.40]], 0.017), material,
    [0, 0, -0.11], [0, 0, 0], [1, 1, 1], materials.trim.color);
  const ear = batch.flush()[0];
  ear.name = `ear-${side < 0 ? 'left' : 'right'}`;
  ear.position.set(side * 0.34, headY + 0.42, -0.05);
  ear.rotation.set(-0.10, side * 0.07, side * -0.18);
  driver.add(ear);
  trackFlutter(driver, ear);
}

function addScarf(THREE, driver, materials, castShadow, spirit) {
  const geometry = sweptHull(THREE, [
    { z: spirit ? -1.36 : -1.32, x: 0.30, w: 0.13, y: spirit ? 0.98 : 0.72, h: 0.038 },
    { z: -0.94, x: 0.14, w: 0.22, y: 0.64, h: 0.035 },
    { z: -0.48, x: 0, w: 0.27, y: 0.60, h: 0.045 },
    { z: -0.22, x: 0, w: 0.23, y: 0.65, h: 0.050 }
  ]);
  const scarf = new THREE.Mesh(geometry, materials.detail);
  scarf.name = spirit ? 'star-tail' : 'scarf';
  scarf.castShadow = castShadow;
  scarf.receiveShadow = true;
  driver.add(scarf);
  trackFlutter(driver, scarf);
}
