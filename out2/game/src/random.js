// STORMKEEPER — small seeded random generator.
// The game is deterministic per seed so a screenshot scene and the autopilot
// check can be replayed exactly. The seed lives in the game state, never in
// a global, so two runs with the same seed play the same valley.

export function makeRng(seed) {
  let a = seed >>> 0;
  if (a === 0) a = 0x9e3779b9;
  function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    range(min, max) { return min + (max - min) * next(); },
    int(min, max) { return Math.floor(min + (max - min + 1) * next()); },
    pick(list) { return list[Math.floor(next() * list.length)]; },
    chance(p) { return next() < p; },
  };
}
