// STORMKEEPER — fields: plots of soil, the crops in them, water and growth.
// One plot is one decision: which crop to plant, how much rain it gets, and
// whether the keeper notices it drying out in time.

import { CROPS, THIRST, WITHER_LOW, WITHER_TIME, EVAP_PER_SEC, GROW_PER_SEC } from './config.js';

// Lay the valley's plots out in rows over the middle of the screen, clear of
// the HUD at the top and the lake at the bottom.
export function buildFields(rows, cols, cropPool, rng) {
  const fields = [];
  const top = 108, bottom = 620, left = 90, right = 1190;
  const plotW = (right - left) / cols, plotH = (bottom - top) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = left + c * plotW, y = top + r * plotH;
      fields.push({
        x: x + 6, y: y + 6, w: plotW - 12, h: plotH - 12,
        cx: x + plotW / 2, cy: y + plotH / 2,
        crop: rng.pick(cropPool),
        water: rng.range(28, 52),
        growth: 0,
        state: 'growing', // growing | ripe | withered | scorched | empty
        dryT: 0, // seconds spent bone-dry: a crop left dry withers, and a
        // withered plot must be replanted by clicking it
        ripeT: 0, // a ripe crop waits a breath before it is harvested, so the
        // keeper sees RIPE and the gold pop instead of a vanishing plant
        flash: 0, // harvest sparkle timer
      });
    }
  }
  return fields;
}

export function plotUnder(fields, x, y) {
  return fields.find((f) => x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h) || null;
}

// One simulation step. Returns the gold earned by crops that ripened now.
export function stepFields(fields, dt, hot, fertileLevel) {
  let gold = 0;
  let harvested = 0;
  for (const f of fields) {
    if (f.flash > 0) f.flash -= dt;
    if (f.state === 'empty' || f.state === 'scorched') continue;
    // Water evaporates; hot valleys dry the soil faster.
    f.water = Math.max(0, f.water - EVAP_PER_SEC * (1 + 0.25 * hot) * dt);
    if (f.state === 'growing') {
      if (f.water < WITHER_LOW) {
        // Bone-dry soil withers the crop; a watched field never gets here.
        f.dryT += dt;
        if (f.dryT > WITHER_TIME) { f.state = 'withered'; f.growth = 0; f.dryT = 0; }
      } else {
        f.dryT = 0;
        if (f.water > THIRST) {
          const crop = CROPS[f.crop];
          f.growth += (GROW_PER_SEC / crop.growTime) * (1 + 0.2 * fertileLevel) * dt;
          if (f.growth >= 100) {
            f.state = 'ripe';
            f.growth = 100;
            f.ripeT = 0.8;
          }
        }
      }
    } else if (f.state === 'ripe') {
      // A ripe crop is harvested on its own after a short beat: the keeper's
      // job is growing, not clicking every plant. The sparkle marks where
      // the gold came from.
      f.ripeT -= dt;
      if (f.ripeT > 0) continue;
      gold += CROPS[f.crop].value;
      harvested += 1;
      f.flash = 0.8;
      f.state = 'empty';
      f.growth = 0;
      f.water = 30;
    } else if (f.state === 'withered') {
      // A withered plot stays withered until the keeper replants it.
      continue;
    }
  }
  return { gold, harvested };
}

// Clicking an empty, withered or scorched plot replants it with a random crop.
export function replant(field, cropPool, rng) {
  if (field.state !== 'empty' && field.state !== 'withered' && field.state !== 'scorched') return false;
  field.crop = rng.pick(cropPool);
  field.water = 35;
  field.growth = 0;
  field.state = 'growing';
  return true;
}

export function ripeCount(fields) {
  return fields.filter((f) => f.state === 'ripe').length;
}
