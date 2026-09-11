import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { drawItem, advanceLap, itemWeight, segmentDistanceSquared } from '../race-rules.mjs';
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(new URL('../game-data.js', import.meta.url), 'utf8'), context);
const data = context.window.AURORA_GAME_DATA;
assert.equal(new Set(data.items.map(i => i.kind)).size, 9);
for (const item of data.items) {
  assert(item.supply && item.shortEffect && item.description && item.jaName);
  assert(itemWeight(item, 6, 6, item.kind) <= itemWeight(item, 6, 6));
}
const seen = new Set();
for (let rank = 1; rank <= 6; rank++) for (const supply of ['speed', 'attack', 'guard']) {
  for (let i = 0; i < 1000; i++) {
    const result = drawItem(data.items, { rank, total: 6, supply }, () => i / 1000);
    assert.equal(result.supply, supply);
    assert.equal(result.charges, result.kind === 'boost' ? 3 : 1);
    if (rank < 5) assert.notEqual(result.kind, 'comeback');
    seen.add(result.kind);
  }
  const solo = drawItem(data.items, { rank, total: 1, supply, solo: true });
  assert(['boost', 'hop', 'gate'].includes(solo.kind));
}
assert.equal(seen.size, 9);
for (const supply of ['speed', 'attack', 'guard']) for (let i = 0; i < 1000; i++) {
  const item = drawItem(data.items, { rank: 3, total: 6, supply, targetAvailable: false }, () => i / 1000);
  assert(!['projectile', 'magnet'].includes(item.kind), 'Do not replace an unusable item with another unusable item');
}
for (const steps of [156, 220, 340]) {
  const racer = { trackIndex: steps - 2, lap: 0, lapCheckpoints: 0, startedLap: false };
  const move = (next, forward = true) => { const event = advanceLap(racer, next, steps, forward); racer.trackIndex = next; return event; };
  assert.equal(move(0), 'start');
  // Repeatedly reversing across the finish line must not award a lap.
  for (let i = 0; i < 3; i++) { move(steps - 1, false); move(0); }
  assert.equal(racer.lap, 0);
  for (let lap = 1; lap <= 3; lap++) {
    for (let index = 1; index < steps; index++) move(index);
    assert.equal(move(0), 'lap');
    assert.equal(racer.lap, lap);
    assert.equal(racer.lapCheckpoints, 0);
  }
  move(Math.floor(steps * 0.7)); move(steps - 1); move(0);
  assert.equal(racer.lap, 3, 'Teleport skips cannot count');
}
assert.equal(segmentDistanceSquared(0, 0, 0, -20, 0, 0, 20, 0, 0), 0);
assert.equal(segmentDistanceSquared(0, 6, 0, -20, 0, 0, 20, 0, 0), 36);
assert.equal(segmentDistanceSquared(1, 2, 2, 0, 0, 0, 0, 0, 0), 9);
assert(data.courses.every(c => c.lengthScale > 1.4 && c.raceRevision === 'long-v54'));
console.log('PASS: nine mechanics, 21,000 rank/supply/target draws, solo pool, all three lap resolutions, reverse/teleport protection, swept hits.');
