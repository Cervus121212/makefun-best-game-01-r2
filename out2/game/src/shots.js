// STORMKEEPER — screenshot scenes.
// The maker's screenshots are real renders of the game, taken by loading the
// game with ?scene=<name>. Each scene sets up a genuine game state through
// the same start functions a player uses, then leaves the state still: the
// title, a busy mid-valley moment, a valley cleared, a valley lost, the shop
// between valleys, and the final victory. Nothing here changes how the game
// plays; it only chooses where the photograph is taken from.

import { makeRng } from './random.js';

export function applyScene(game, name, api) {
  // A fixed seed so the photographed valley is the same every time.
  game.seed = 7;
  game.rng = makeRng(7);
  if (name === 'title') {
    game.screen = 'title';
    return;
  }
  if (name === 'shop') {
    api.startGame();
    game.gold = 120;
    game.screen = 'shop';
    return;
  }
  if (name === 'victory') {
    api.startGame();
    game.score = 1840;
    game.screen = 'victory';
    return;
  }
  // play / clear / fail all start from a real valley in progress.
  api.startGame();
  // Valley 3 has storms and a full field, so the photograph is busy.
  api.startValley(2);
  // Put two clouds over thirsty fields, raining, and one over the lake.
  const clouds = game.clouds;
  if (clouds[0]) { clouds[0].x = 430; clouds[0].y = 210; clouds[0].water = 80; }
  if (clouds[1]) { clouds[1].x = 830; clouds[1].y = 260; clouds[1].water = 65; }
  if (clouds[2]) { clouds[2].x = 980; clouds[2].y = 640; clouds[2].water = 20; }
  // Half the crops mid-growth, one ripe, so the field reads as alive. The
  // water stays low enough that a second of rain floods nothing by accident.
  game.fields.forEach((f, i) => {
    f.water = 30 + (i % 4) * 8;
    f.growth = 30 + (i % 5) * 14;
    f.state = 'growing';
  });
  if (game.fields[4]) { game.fields[4].state = 'ripe'; game.fields[4].growth = 100; game.fields[4].ripeT = 3; }
  if (game.fields[7]) { game.fields[7].state = 'withered'; }
  game.harvest = 5;
  game.gold = 86;
  game.score = 412;
  game.timeLeft = 47;
  if (name === 'play') {
    game.screen = 'play';
    return;
  }
  if (name === 'clear') {
    game.harvest = game.target;
    game.lastGold = 74;
    game.lastBonus = 94;
    game.score = 890;
    game.best = 890;
    game.hint = '';
    game.hintT = 0;
    game.screen = 'clear';
    return;
  }
  if (name === 'fail') {
    game.harvest = 4;
    game.timeLeft = 0;
    game.score = 318;
    game.best = 412;
    game.hint = '';
    game.hintT = 0;
    game.screen = 'fail';
    return;
  }
  game.screen = 'play';
}
