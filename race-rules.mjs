// Pure race rules, shared by the browser and deterministic regression tests.
export const SUPPLIES = Object.freeze({
  speed: { label: "すすめる", icon: ">>", color: "#85d5bc" },
  attack: { label: "しかける", icon: "!", color: "#ef947f" },
  guard: { label: "まもる", icon: "+", color: "#a6d8ee" }
});

export function itemWeight(item, rank, total, previousKind) {
  const rear = (rank - 1) / Math.max(1, total - 1);
  const weights = {
    boost: 2 + rear * 2, hop: 2, gate: 1.6, magnet: rear > 0 ? 1 + rear * 3 : 0,
    projectile: rear > 0 ? 2.5 : 0, aoe: 1.5 + rear, trap: 3 - rear * 2,
    shield: 3 - rear, comeback: rear >= 0.65 ? 1.4 : 0
  };
  return (weights[item.kind] || 0) * (item.kind === previousKind ? 0.2 : 1);
}

export function drawItem(items, { rank, total, supply, previousKind, solo = false, targetAvailable = true }, random = Math.random) {
  const pool = items.filter(item => (!supply || item.supply === supply)
    && (targetAvailable || !["projectile", "magnet"].includes(item.kind))
    && (!solo || ["boost", "hop", "gate"].includes(item.kind)));
  // Solo races turn every supply lane into a movement lane.
  if (!pool.length) {
    if (supply) return drawItem(items, { rank, total, previousKind, solo, targetAvailable }, random);
    throw new Error("No eligible race items");
  }
  const weights = pool.map(item => itemWeight(item, rank, total, previousKind));
  const sum = weights.reduce((a, b) => a + b, 0);
  let roll = random() * sum;
  const chosen = pool.find((item, index) => (roll -= weights[index]) < 0) || pool[pool.length - 1];
  return { ...chosen, charges: chosen.maxCharges || 1 };
}

export function advanceLap(racer, next, steps, forward) {
  const old = racer.trackIndex;
  const delta = (next - old + steps) % steps;
  if (!forward && next > old && next - old > steps * 0.8) racer.lapCheckpoints = 0;
  if (!forward || !delta || delta > steps * 0.12) return "none";
  const wrapped = next < old;
  if (!racer.startedLap) {
    if (!wrapped) return "none";
    racer.startedLap = true;
    racer.lapCheckpoints = 0;
    return "start";
  }
  // All three ordered checkpoints are required. Reversing over the line cannot farm laps.
  for (let i = 1; i <= 3; i += 1) {
    const checkpoint = Math.floor(steps * i / 4);
    const distance = (checkpoint - old + steps) % steps;
    if (distance > 0 && distance <= delta && racer.lapCheckpoints === (1 << (i - 1)) - 1) {
      racer.lapCheckpoints |= 1 << (i - 1);
    }
  }
  if (!wrapped) return "none";
  if (racer.lapCheckpoints !== 7) { racer.lapCheckpoints = 0; return "none"; }
  racer.lapCheckpoints = 0;
  racer.lap += 1;
  return "lap";
}

export function segmentDistanceSquared(px, py, pz, ax, ay, az, bx, by, bz) {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const length = dx * dx + dy * dy + dz * dz;
  const t = length ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy + (pz - az) * dz) / length)) : 0;
  return (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2 + (pz - az - t * dz) ** 2;
}
