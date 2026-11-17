// STORMKEEPER — the game itself: state, loop, screens and rules.
// The loop is deliberately plain: one step function, one screen at a time,
// every transition through a named function so the autopilot check and the
// screenshot scenes can drive the same paths a player does.

import { VIEW_W, VIEW_H, VALLEYS, UPGRADES, SCORE_PER_HARVEST } from './config.js';
import { makeRng } from './random.js';
import { buildFields, stepFields, replant, plotUnder } from './fields.js';
import { makeCloud, makeStorm, stepClouds, stepStorms, rainStep, stormStep, cloudAt, stormAt } from './clouds.js';
import { newUpgrades, upgradeLevel, buyUpgrade, rodCount } from './upgrades.js';
import { AudioEngine } from './audio.js';
import { Input } from './input.js';
import { drawGame } from './render.js';
import { applyScene } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

function loadBest() {
  try { return parseInt(window.localStorage.getItem('stormkeeper-best') || '0', 10) || 0; }
  catch (e) { return 0; }
}
function saveBest(v) {
  try { window.localStorage.setItem('stormkeeper-best', String(v)); } catch (e) { /* private mode */ }
}

const game = {
  screen: 'title', // title | play | pause | shop | clear | fail | victory
  valleyIndex: 0,
  valley: VALLEYS[0],
  fields: [], clouds: [], storms: [], rods: [],
  gold: 0, harvest: 0, target: 6, valleyGoldStart: 0,
  timeLeft: 80, score: 0, best: loadBest(),
  owned: newUpgrades(),
  muted: false, speed: 1,
  time: 0, wind: 6, windTarget: 6, windIn: 5,
  floats: [], flash: 0, hint: '', hintT: 0,
  lastGold: 0, lastBonus: 0,
  seed: 20261117,
  rng: makeRng(20261117),
  audio: new AudioEngine(),
  UPGRADES,
};

function showHint(text, secs) {
  game.hint = text;
  game.hintT = secs || 5;
}

function placeRods() {
  game.rods = [];
  const n = rodCount(game.owned);
  for (let i = 0; i < n; i++) {
    game.rods.push({ x: 220 + i * ((VIEW_W - 440) / Math.max(1, n - 1 || 1)), y: 108 });
  }
}

function startValley(index) {
  const v = VALLEYS[index];
  game.valleyIndex = index;
  game.valley = v;
  game.rng = makeRng(game.seed + index * 101);
  game.fields = buildFields(v.plots[0], v.plots[1], v.crops, game.rng);
  const cloudCount = 3 + upgradeLevel(game.owned, 'extracould');
  game.clouds = [];
  for (let i = 0; i < cloudCount; i++) {
    game.clouds.push(makeCloud(200 + i * 320 + game.rng.range(-60, 60), 110 + game.rng.range(0, 60), game.rng, upgradeLevel(game.owned, 'bigcloud')));
  }
  game.storms = [];
  for (let i = 0; i < v.storms; i++) {
    game.storms.push(makeStorm(300 + i * 380 + game.rng.range(-80, 80), 120 + game.rng.range(0, 80), game.rng, false));
  }
  if (v.king) game.storms.push(makeStorm(640, 130, game.rng, true));
  placeRods();
  game.harvest = 0;
  game.target = v.target;
  game.timeLeft = v.seconds;
  game.valleyGoldStart = game.gold;
  game.wind = v.wind;
  game.windTarget = v.wind;
  game.floats = [];
  game.flash = 0;
  game.screen = 'play';
  if (index === 0) showHint('Drag a cloud over a dry field — rain falls where it sits.', 6);
  if (v.storms > 0 && index === 1) showHint('A storm cell! Drag it away from ripe crops.', 6);
  if (v.king) showHint('The Storm King is here. Rods ground its lightning.', 6);
}

function startGame() {
  game.score = 0;
  game.gold = 0;
  game.owned = newUpgrades();
  game.speed = 1;
  startValley(0);
}

function valleyClear() {
  game.hint = '';
  game.hintT = 0;
  const earned = game.gold - game.valleyGoldStart;
  const bonus = Math.ceil(game.timeLeft) * 2;
  game.lastGold = earned;
  game.lastBonus = bonus;
  game.score += earned * 2 + bonus + game.harvest * SCORE_PER_HARVEST;
  if (game.score > game.best) { game.best = game.score; saveBest(game.best); }
  game.audio.chime();
  game.screen = game.valleyIndex + 1 >= VALLEYS.length ? 'victory' : 'clear';
}

function valleyFail() {
  game.hint = '';
  game.hintT = 0;
  if (game.score > game.best) { game.best = game.score; saveBest(game.best); }
  game.screen = 'fail';
}

function nextValley() {
  startValley(game.valleyIndex + 1);
}

function step(dt) {
  game.time += dt;
  if (game.hintT > 0) { game.hintT -= dt; if (game.hintT <= 0) game.hint = ''; }
  if (game.flash > 0) game.flash -= dt * 2;
  for (const fl of game.floats) { fl.life -= dt; fl.y -= 24 * dt; }
  game.floats = game.floats.filter((fl) => fl.life > 0);
  if (game.screen !== 'play') return;

  // Wind gusts: the target wanders, the wind follows, clouds feel it.
  game.windIn -= dt;
  if (game.windIn <= 0) {
    game.windIn = game.rng.range(4, 8);
    game.windTarget = game.valley.wind * game.rng.range(0.4, 1.5);
  }
  game.wind += (game.windTarget - game.wind) * Math.min(1, dt * 0.5);

  stepClouds(game.clouds, dt, game.wind, upgradeLevel(game.owned, 'windcharm'), game.time);
  stepStorms(game.storms, dt, game.wind, game.time);
  const rained = rainStep(game.clouds, game.fields, dt, upgradeLevel(game.owned, 'swiftrain'));
  game.audio.setRain(game.clouds.filter((c) => c.raining).length);
  const res = stepFields(game.fields, dt, game.valley.hot, upgradeLevel(game.owned, 'fertile'));
  if (res.harvested > 0) {
    game.gold += res.gold;
    game.harvest += res.harvested;
    game.audio.chime();
    const ripe = game.fields.find((f) => f.flash > 0.5);
    if (ripe) game.floats.push({ x: ripe.cx, y: ripe.cy - 20, text: `+${res.gold}g`, color: '#ffd76a', life: 1 });
  }
  const strikes = stormStep(game.storms, game.fields, game.rods, dt, game.rng);
  for (const s of strikes) {
    game.flash = 0.7;
    game.audio.thunder();
    if (s.grounded) game.floats.push({ x: s.x, y: s.y - 30, text: 'grounded!', color: '#7ec850', life: 1.2 });
    else if (!s.empty) game.floats.push({ x: s.x, y: s.y - 30, text: 'scorched!', color: '#e0586a', life: 1.2 });
  }
  // A dry cloud over the fields is a wasted cloud: nudge the keeper.
  const dry = game.clouds.find((c) => c.water <= 1 && !game.hint);
  if (dry) showHint('A cloud is dry — drag it down to the lake to refill.', 4);

  game.timeLeft -= dt;
  if (game.harvest >= game.target) { valleyClear(); return; }
  if (game.timeLeft <= 0) { valleyFail(); return; }
}

// The title screen shows the valley itself behind the panel: a keeper's
// first sight of the game is fields and clouds, not an empty sky. The
// backdrop is built once at load; starting a game rebuilds it for real.
function buildTitleBackdrop() {
  const rng = makeRng(7);
  game.fields = buildFields(2, 3, ['wheat', 'berry'], rng);
  game.fields.forEach((f, i) => { f.water = 40 + (i % 3) * 15; f.growth = 25 + (i % 4) * 18; });
  game.clouds = [
    makeCloud(320, 130, rng, 0),
    makeCloud(760, 110, rng, 0),
    makeCloud(1080, 180, rng, 0),
  ];
  game.storms = [];
  game.rods = [];
}
buildTitleBackdrop();

// --- input hooks ---------------------------------------------------------

function onGrab(x, y) {
  if (game.screen !== 'play') return null;
  const c = cloudAt(game.clouds, x, y);
  if (c) { game.audio.ensure(); game.audio.click(); return { what: 'cloud', item: c }; }
  const s = stormAt(game.storms, x, y);
  if (s) { game.audio.ensure(); game.audio.click(); return { what: 'storm', item: s }; }
  return null;
}

function onClick(x, y) {
  game.audio.ensure();
  if (game.screen === 'title') { startGame(); return; }
  if (game.screen === 'fail') { startValley(game.valleyIndex); return; }
  if (game.screen === 'victory') { startGame(); return; }
  if (game.screen === 'clear') { game.screen = 'shop'; return; }
  if (game.screen === 'shop') {
    // Shop rows: click a row to buy that upgrade.
    const top = (VIEW_H - 480) / 2 + 112;
    const idx = Math.floor((y - top) / 52);
    if (idx >= 0 && idx < UPGRADES.length) {
      const res = buyUpgrade(game.owned, UPGRADES[idx].id, game.gold);
      if (res.ok) { game.gold = res.gold; game.audio.chime(); }
      else game.audio.click();
    }
    return;
  }
  if (game.screen === 'play') {
    const f = plotUnder(game.fields, x, y);
    if (f && replant(f, game.valley.crops, game.rng)) game.audio.click();
  }
}

function onKey(k) {
  game.audio.ensure();
  if (k === 'm') {
    game.muted = !game.muted;
    game.audio.setMuted(game.muted);
    return;
  }
  if (game.screen === 'title' && (k === 'enter' || k === ' ')) { startGame(); return; }
  if (k === 'p' && (game.screen === 'play' || game.screen === 'pause')) {
    game.screen = game.screen === 'play' ? 'pause' : 'play';
    return;
  }
  if (k === 'r' && ['play', 'pause', 'fail', 'clear', 'victory'].includes(game.screen)) {
    if (game.screen === 'victory') startGame();
    else startValley(game.valleyIndex);
    return;
  }
  if (game.screen === 'clear' && k === 'n') { game.screen = 'shop'; return; }
  if (game.screen === 'shop' && k === 'n') { nextValley(); return; }
  if (game.screen === 'shop' && ['1', '2', '3', '4', '5', '6'].includes(k)) {
    const u = UPGRADES[parseInt(k, 10) - 1];
    if (u) {
      const res = buyUpgrade(game.owned, u.id, game.gold);
      if (res.ok) { game.gold = res.gold; game.audio.chime(); }
    }
    return;
  }
  if (game.screen === 'play' && k === ' ') {
    game.speed = game.speed === 1 ? 2 : 1;
    showHint(game.speed === 2 ? 'Fast-forward ×2' : 'Normal speed', 2);
  }
}

new Input(canvas, {
  onGrab: (x, y) => onGrab(x, y),
  onDrag: () => { /* the dragged item follows the pointer in Input */ },
  onDrop: () => { /* clouds and storms stay where dropped */ },
  onClick: (x, y) => onClick(x, y),
  onKey: (k) => onKey(k),
});

// --- loop ----------------------------------------------------------------

let last = performance.now();
let shotAt = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  step(dt * game.speed);
  drawGame(ctx, game);
  // The screenshot driver waits for this: the scene has had a second to
  // settle (rain falling, clouds placed) before the photograph is taken.
  if (!window.__shotReady) {
    shotAt += dt;
    if (shotAt > 1.2) window.__shotReady = true;
  }
  requestAnimationFrame(frame);
}

// Screenshot scenes (?scene=title|play|clear|fail|shop|victory) set the game
// up exactly as the maker photographed it: no gameplay is changed by them.
const scene = new URLSearchParams(window.location.search).get('scene');
if (scene) {
  applyScene(game, scene, { startGame, startValley, valleyClear, nextValley });
} else {
  game.screen = 'title';
}
requestAnimationFrame(frame);

// The check scripts drive the same paths a player does, through this handle.
window.__stormkeeper = { game, startGame, startValley, step, valleyClear, valleyFail, onKey, onClick };
