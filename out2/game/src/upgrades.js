// STORMKEEPER — the shop between valleys.
// Gold comes only from harvest, and every upgrade is a bet on which problem
// the next valley will hurt most. Rods are placed by the keeper's own hand
// in the valley, not bought twice.

import { UPGRADES } from './config.js';

export function newUpgrades() {
  const owned = {};
  for (const u of UPGRADES) owned[u.id] = 0;
  return owned;
}

export function upgradeLevel(owned, id) {
  return owned[id] || 0;
}

export function canBuy(owned, id, gold) {
  const def = UPGRADES.find((u) => u.id === id);
  if (!def) return false;
  if ((owned[id] || 0) >= def.max) return false;
  return gold >= def.cost + (owned[id] || 0) * 15;
}

export function upgradeCost(owned, id) {
  const def = UPGRADES.find((u) => u.id === id);
  return def.cost + (owned[id] || 0) * 15;
}

export function buyUpgrade(owned, id, gold) {
  if (!canBuy(owned, id, gold)) return { ok: false, gold };
  const cost = upgradeCost(owned, id);
  owned[id] = (owned[id] || 0) + 1;
  return { ok: true, gold: gold - cost };
}

export function rodCount(owned) {
  return owned.rod || 0;
}

export { UPGRADES };
