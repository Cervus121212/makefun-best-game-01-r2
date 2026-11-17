// STORMKEEPER — clouds and storms: the pieces the keeper actually moves.
// A rain cloud is a tool: drag it over dry fields and it rains; drag it over
// the lake and it refills. A storm cell is a threat: drag it away from ripe
// crops, or ground its lightning with a rod.

import { CLOUD_R, RAIN_RATE, REFILL_RATE, LAKE_Y, SOAKED, STORM_STRIKE_EVERY } from './config.js';

export function makeCloud(x, y, rng, level) {
  return {
    kind: 'cloud', x, y, r: CLOUD_R + level * 6,
    water: 100, maxWater: 100,
    drift: rng.range(-8, 8), // slow personal wander
    bob: rng.range(0, Math.PI * 2),
    raining: false,
  };
}

export function makeStorm(x, y, rng, king) {
  return {
    kind: king ? 'king' : 'storm', x, y,
    r: king ? 92 : 62,
    drift: rng.range(-6, 6),
    bob: rng.range(0, Math.PI * 2),
    strikeIn: rng.range(3, STORM_STRIKE_EVERY),
    king: !!king,
  };
}

// Wind pushes every cloud sideways; the wind charm halves the push. Clouds
// wander on their own a little so the sky never looks frozen.
export function stepClouds(clouds, dt, wind, windCharmLevel, time) {
  const push = wind * (windCharmLevel >= 2 ? 0.4 : windCharmLevel === 1 ? 0.65 : 1);
  for (const c of clouds) {
    c.x += (push + c.drift) * dt;
    c.y += Math.sin(time * 0.7 + c.bob) * 4 * dt;
    if (c.x < 40) c.x = 40;
    if (c.x > 1240) c.x = 1240;
    if (c.y < 80) c.y = 80;
    if (c.y > 640) c.y = 640;
  }
}

// Storms drift the same way, slower and heavier.
export function stepStorms(storms, dt, wind, time) {
  for (const s of storms) {
    s.x += (wind * 0.5 + s.drift) * dt;
    s.y += Math.sin(time * 0.5 + s.bob) * 3 * dt;
    if (s.x < 60) s.x = 60;
    if (s.x > 1220) s.x = 1220;
    if (s.y < 90) s.y = 90;
    if (s.y > 600) s.y = 600;
  }
}

// Rain: a cloud rains while it has water and sits over the fields; over the
// lake it refills instead. Rain does not stack: three clouds over one plot
// water it no faster than one cloud does, so parking the whole sky on a
// single field cannot flood it in seconds. Returns the plots rained on.
export function rainStep(clouds, fields, dt, swiftLevel) {
  const rate = RAIN_RATE * (1 + 0.3 * swiftLevel);
  const rained = new Set();
  for (const c of clouds) {
    const overLake = c.y + c.r * 0.5 > LAKE_Y;
    if (overLake) {
      c.water = Math.min(c.maxWater, c.water + REFILL_RATE * (1 + 0.3 * swiftLevel) * dt);
      c.raining = false;
      continue;
    }
    if (c.water <= 0) { c.raining = false; continue; }
    c.water = Math.max(0, c.water - rate * 0.35 * dt);
    c.raining = true;
    for (const f of fields) {
      if (f.state === 'growing' || f.state === 'ripe') {
        // Rain falls straight down from the cloud's belly.
        if (Math.abs(f.cx - c.x) < c.r + f.w / 2 && f.cy > c.y && f.cy - c.y < 560) {
          rained.add(f);
        }
      }
    }
  }
  for (const f of rained) {
    // Rain soaks toward SOAKED and no further: the gain fades as the soil
    // gets wet, so a field held under a cloud settles near soaked instead
    // of flooding. The keeper's job is keeping every field watered, not
    // threading a needle between thirsty and flooded.
    f.water = Math.min(100, f.water + rate * Math.max(0, 1 - f.water / SOAKED) * dt);
  }
  return [...rained];
}

// Lightning: each storm cell strikes on its own timer. A rod within range
// takes the strike instead of a crop. Returns strike events for effects.
export function stormStep(storms, fields, rods, dt, rng) {
  const strikes = [];
  for (const s of storms) {
    s.strikeIn -= dt;
    if (s.strikeIn > 0) continue;
    s.strikeIn = STORM_STRIKE_EVERY * rng.range(0.8, 1.25);
    // The bolt falls on a growing or ripe plot near the cell, or on a rod.
    const near = fields.filter((f) => (f.state === 'growing' || f.state === 'ripe') && Math.hypot(f.cx - s.x, f.cy - s.y) < 320);
    const rod = rods.find((r) => Math.hypot(r.x - s.x, r.y - s.y) < 260);
    if (rod) {
      strikes.push({ x: rod.x, y: rod.y, grounded: true });
    } else if (near.length > 0) {
      const victim = rng.pick(near);
      victim.state = 'scorched';
      victim.growth = 0;
      victim.water = 10;
      strikes.push({ x: victim.cx, y: victim.cy, grounded: false });
    } else {
      strikes.push({ x: s.x, y: s.y + 40, grounded: false, empty: true });
    }
  }
  return strikes;
}

export function cloudAt(clouds, x, y) {
  for (let i = clouds.length - 1; i >= 0; i--) {
    const c = clouds[i];
    if (Math.hypot(x - c.x, y - c.y) < c.r + 14) return c;
  }
  return null;
}

export function stormAt(storms, x, y) {
  for (let i = storms.length - 1; i >= 0; i--) {
    const s = storms[i];
    if (Math.hypot(x - s.x, y - s.y) < s.r + 10) return s;
  }
  return null;
}
