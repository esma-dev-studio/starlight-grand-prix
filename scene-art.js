// Small, opaque landmarks use the same faceted lighting as the race vehicles.
export function createEarth(THREE) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#287aaa';
  ctx.fillRect(0, 0, 512, 256);
  const continents = [
    [[-168,66],[-144,70],[-126,54],[-127,42],[-117,30],[-98,18],[-82,9],[-77,24],[-65,48],[-83,60],[-111,70]],
    [[-81,10],[-66,12],[-48,-1],[-35,-8],[-42,-23],[-55,-37],[-70,-55],[-77,-29]],
    [[-16,35],[3,37],[29,32],[41,12],[51,10],[38,-13],[19,-35],[11,-18],[-5,5],[-17,15]],
    [[-10,36],[-7,58],[11,72],[35,70],[55,55],[94,75],[143,64],[172,57],[144,45],[126,30],[109,8],[99,16],[85,25],[76,8],[62,25],[43,30],[25,40]],
    [[112,-12],[132,-11],[151,-22],[153,-38],[130,-35],[114,-24]],
    [[-52,60],[-25,72],[-38,84],[-62,78]],
    [[47,-13],[51,-17],[47,-26],[44,-22]]
  ];
  for (const [i, polygon] of continents.entries()) {
    ctx.fillStyle = i % 2 ? '#bed0b6' : '#7eaa98';
    ctx.beginPath();
    polygon.forEach(([lon, lat], j) => {
      const x = (lon + 180) / 360 * 512;
      const y = (90 - lat) / 180 * 256;
      if (j) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
  }
  ctx.fillStyle = '#e5eff1';
  ctx.fillRect(0, 247, 512, 9);
  // Broken cloud bands retain the globe's land silhouette at small sizes.
  ctx.strokeStyle = 'rgba(240,249,255,0.72)';
  ctx.lineWidth = 3;
  for (let i = 0; i < 18; i++) {
    const x = (i * 137) % 512;
    const y = 30 + (i * 43) % 188;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.bezierCurveTo(x + 12, y - 8, x + 30, y + 7, x + 44, y + 1);
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const globe = new THREE.Mesh(new THREE.SphereGeometry(46, 32, 20),
    new THREE.MeshStandardMaterial({ map: texture, roughness: 1, metalness: 0, fog: false }));
  globe.rotation.y = 1.7;
  return globe;
}

export function createContactShadow(THREE, width, length) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createRadialGradient(32, 32, 8, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(0,0,0,0.64)');
  gradient.addColorStop(0.55, 'rgba(0,0,0,0.38)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const material = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true, opacity: 0.66, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const geometry = new THREE.PlaneGeometry(width * 1.6, length * 1.24);
  geometry.rotateX(-Math.PI / 2);
  const shadow = new THREE.Mesh(geometry, material);
  shadow.renderOrder = 2;
  return shadow;
}

export function createTerrainBanks(THREE, track) {
  const lunar = track.theme.id === 'lunar-crater-run';
  const mars = track.theme.id === 'meteor-mining-belt';
  if (!lunar && !mars && track.theme.id !== 'nebula-drift-stream') return null;
  const vertices = [], colors = [], indices = [];
  const base = new THREE.Color(lunar ? '#9da8b5' : mars ? '#99492c' : '#69afc5');
  const color = new THREE.Color();
  const offsets = [track.width * 0.5 + 0.6, 19, 36, 62, 94];
  const depth = [0.15, 1.1, 4, 11, 25];
  const count = track.samples.length;
  for (const side of [-1, 1]) {
    const start = vertices.length / 3;
    for (let i = 0; i <= count; i++) {
      const sample = track.samples[i % count];
      for (let j = 0; j < offsets.length; j++) {
        const lateral = offsets[j] * side;
        const rockiness = j > 1 ? Math.sin(i * 0.71 + j * 5) * j * 0.8 : 0;
        const edgeY = sample.point.y + Math.tan(sample.bank || 0) * side * track.width * 0.5;
        const y = j === 4 ? -5.3 : edgeY - depth[j] + rockiness;
        const x = sample.point.x + sample.normal.x * lateral;
        const z = sample.point.z + sample.normal.z * lateral;
        let safeY = y;
        if (j > 0) for (const other of track.samples) {
          if (Math.hypot(x - other.point.x, z - other.point.z) < track.width * 0.64) safeY = Math.min(safeY, other.point.y - 1.4);
        }
        vertices.push(x, safeY, z);
        color.copy(base).multiplyScalar(0.82 + j * 0.025 + Math.sin(i * 0.52 + j) * 0.045);
        colors.push(color.r, color.g, color.b);
      }
    }
    for (let i = 0; i < count; i++) for (let j = 0; j < 4; j++) {
      const a = start + i * 5 + j, b = a + 5;
      if (side < 0) indices.push(a, b, a + 1, a + 1, b, b + 1);
      else indices.push(a, a + 1, b, a + 1, b + 1, b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0, flatShading: true, side: THREE.DoubleSide }));
}

const groundProbes = new WeakMap();
export function terrainHeightAt(THREE, track, position) {
  if (!track.terrain) return position.y;
  let probe = groundProbes.get(track);
  if (!probe) {
    probe = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0));
    groundProbes.set(track, probe);
    track.terrain.updateMatrixWorld(true);
  }
  probe.ray.origin.set(position.x, 1000, position.z);
  const surface = probe.intersectObject(track.terrain, false)[0];
  return surface ? surface.point.y : -5.3;
}

// Tight hairpins can bring a different part of the track under a landmark.
// Exclude scenery from that driving corridor once, when the course is built.
export function clearSceneryCorridor(THREE, group, track) {
  group.updateMatrixWorld(true);
  const matrix = new THREE.Matrix4();
  const world = new THREE.Matrix4();
  const bounds = new THREE.Box3();
  const local = new THREE.Box3();
  const margin = track.width * 0.61;
  const intersects = () => track.samples.some(({point}) =>
    point.x > bounds.min.x - margin && point.x < bounds.max.x + margin &&
    point.z > bounds.min.z - margin && point.z < bounds.max.z + margin &&
    point.y + 6 > bounds.min.y && point.y + 0.7 < bounds.max.y);
  group.traverse(object => {
    if (!object.isMesh || object.material?.transparent || object.geometry.type === 'PlaneGeometry' || object.geometry.type === 'CircleGeometry' || object.geometry.type === 'RingGeometry') return;
    object.geometry.computeBoundingBox();
    local.copy(object.geometry.boundingBox);
    if (object.isInstancedMesh) {
      for (let i = 0; i < object.count; i++) {
        object.getMatrixAt(i, matrix);
        world.multiplyMatrices(object.matrixWorld, matrix);
        bounds.copy(local).applyMatrix4(world);
        if (intersects()) object.setMatrixAt(i, matrix.makeScale(0, 0, 0));
      }
      object.instanceMatrix.needsUpdate = true;
      object.computeBoundingSphere();
    } else {
      bounds.copy(local).applyMatrix4(object.matrixWorld);
      if (intersects()) object.visible = false;
    }
  });
}
