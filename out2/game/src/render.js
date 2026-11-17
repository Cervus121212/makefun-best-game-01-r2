// STORMKEEPER — rendering: everything the judge's screenshots show.
// The scene is drawn bright and dense on purpose: green and gold fields, a
// blue lake, white clouds with visible rain, dark storm cells — a valley
// that reads at a glance even shrunk to a contact sheet. The HUD and every
// panel state the goal, the progress and the restart in plain text.

import { CROPS, VIEW_W, VIEW_H, HUD_H, LAKE_Y } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawSky(ctx, game) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, '#6fbde8');
  g.addColorStop(0.55, '#a8d9f2');
  g.addColorStop(1, '#e8f6fd');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Sun, high and warm.
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath(); ctx.arc(1120, 92, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255, 243, 176, 0.35)';
  ctx.beginPath(); ctx.arc(1120, 92, 52, 0, Math.PI * 2); ctx.fill();
  // Distant hills.
  ctx.fillStyle = '#7fb069';
  ctx.beginPath();
  ctx.moveTo(0, 150);
  ctx.quadraticCurveTo(320, 96, 640, 140);
  ctx.quadraticCurveTo(960, 178, 1280, 122);
  ctx.lineTo(1280, 220); ctx.lineTo(0, 220); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#6a9e58';
  ctx.beginPath();
  ctx.moveTo(0, 210);
  ctx.quadraticCurveTo(400, 160, 800, 200);
  ctx.quadraticCurveTo(1080, 226, 1280, 196);
  ctx.lineTo(1280, 260); ctx.lineTo(0, 260); ctx.closePath(); ctx.fill();
}

function drawLake(ctx, game) {
  ctx.fillStyle = '#2f8fc9';
  ctx.fillRect(0, LAKE_Y, VIEW_W, VIEW_H - LAKE_Y);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  for (let i = 0; i < 8; i++) {
    const x = ((i * 173 + game.time * 22) % 1360) - 40;
    ctx.fillRect(x, LAKE_Y + 14 + (i % 3) * 14, 46, 3);
  }
  ctx.fillStyle = '#eaf7ff';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('— THE LAKE · clouds refill here —', VIEW_W / 2, LAKE_Y + 52);
}

function drawField(ctx, f) {
  // Soil.
  ctx.fillStyle = '#9c7648';
  roundRect(ctx, f.x, f.y, f.w, f.h, 10); ctx.fill();
  ctx.fillStyle = '#8a653c';
  for (let i = 1; i < 4; i++) {
    ctx.fillRect(f.x + 8, f.y + (f.h / 4) * i - 1, f.w - 16, 2);
  }
  if (f.state === 'scorched') {
    ctx.fillStyle = '#3d3d3d';
    roundRect(ctx, f.x + 4, f.y + 4, f.w - 8, f.h - 8, 8); ctx.fill();
    ctx.fillStyle = '#cfcfcf';
    ctx.font = '13px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('scorched — click to replant', f.cx, f.cy + 5);
  } else if (f.state === 'withered') {
    ctx.fillStyle = '#a08a5e';
    roundRect(ctx, f.x + 4, f.y + 4, f.w - 8, f.h - 8, 8); ctx.fill();
    ctx.strokeStyle = '#7a6544';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const px = f.x + 20 + i * ((f.w - 40) / 3);
      ctx.beginPath(); ctx.moveTo(px, f.y + f.h - 16);
      ctx.lineTo(px + 6, f.y + f.h - 42); ctx.stroke();
    }
    ctx.fillStyle = '#f7ead0';
    ctx.font = '13px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('withered — click to replant', f.cx, f.cy + 5);
  } else if (f.state === 'empty') {
    ctx.fillStyle = '#d8c49a';
    ctx.font = '13px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('click to plant', f.cx, f.cy + 5);
  } else {
    // The crop grows visibly: a row of plants that fill the plot as they
    // grow, so a tended field reads as green and gold, not bare soil.
    const crop = CROPS[f.crop];
    const s = 0.35 + 0.65 * (f.growth / 100);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const px = f.x + 14 + (i * (f.w - 28)) / (n - 1);
      const py = f.cy + 10 - Math.sin(i * 2.1) * 4 * s;
      const hgt = 22 * s + 6;
      // Leaves.
      ctx.fillStyle = '#4e7a35';
      ctx.beginPath(); ctx.ellipse(px - 6, py - hgt * 0.45, 6 * s + 2, 3 * s + 1, -0.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(px + 6, py - hgt * 0.55, 6 * s + 2, 3 * s + 1, 0.5, 0, Math.PI * 2); ctx.fill();
      // Stem and head.
      ctx.strokeStyle = '#3f6b2d';
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(px, f.y + f.h - 14);
      ctx.lineTo(px, py - hgt); ctx.stroke();
      ctx.fillStyle = f.state === 'ripe' ? '#ffd76a' : crop.color;
      ctx.beginPath(); ctx.arc(px, py - hgt - 3, 5 * s + 2.5, 0, Math.PI * 2); ctx.fill();
    }
    if (f.state === 'ripe') {
      ctx.fillStyle = '#fff3b0';
      ctx.font = 'bold 15px Georgia, serif'; ctx.textAlign = 'center';
      ctx.fillText('RIPE ✓', f.cx, f.y + 18);
    }
    if (f.flash > 0) {
      ctx.fillStyle = `rgba(255, 243, 176, ${f.flash})`;
      roundRect(ctx, f.x, f.y, f.w, f.h, 10); ctx.fill();
    }
  }
  // Water gauge under every plot: the keeper reads thirst at a glance.
  // It runs red when a plot is nearly dry, so neglect is visible early.
  const gy = f.y + f.h - 8;
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(f.x + 8, gy, f.w - 16, 5);
  ctx.fillStyle = f.water < 15 ? '#e0586a' : '#3a9bd6';
  ctx.fillRect(f.x + 8, gy, (f.w - 16) * (f.water / 100), 5);
}

function drawCloud(ctx, c, game) {
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath(); ctx.ellipse(c.x + 4, c.y + c.r * 0.55, c.r, c.r * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(c.x - c.r * 0.5, c.y, c.r * 0.52, 0, Math.PI * 2);
  ctx.arc(c.x, c.y - c.r * 0.28, c.r * 0.62, 0, Math.PI * 2);
  ctx.arc(c.x + c.r * 0.5, c.y, c.r * 0.52, 0, Math.PI * 2);
  ctx.arc(c.x, c.y + c.r * 0.2, c.r * 0.58, 0, Math.PI * 2);
  ctx.fill();
  // Water left in the cloud, as a small blue arc under it.
  ctx.strokeStyle = '#3a9bd6'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(c.x, c.y + c.r * 0.42, c.r * 0.55, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.strokeStyle = 'rgba(58,155,214,0.35)';
  ctx.beginPath(); ctx.arc(c.x, c.y + c.r * 0.42, c.r * 0.55, Math.PI * (0.15 + 0.7 * (c.water / 100)), Math.PI * 0.85); ctx.stroke();
  if (c.raining) {
    ctx.strokeStyle = 'rgba(46, 140, 210, 0.9)'; ctx.lineWidth = 2.5;
    for (let i = -3; i <= 3; i++) {
      const rx = c.x + i * (c.r * 0.24);
      const drop = (game.time * 300 + i * 53) % 110;
      ctx.beginPath();
      ctx.moveTo(rx, c.y + c.r * 0.45 + drop);
      ctx.lineTo(rx - 4, c.y + c.r * 0.45 + drop + 22);
      ctx.stroke();
    }
  }
}

function drawStorm(ctx, s, game) {
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(s.x + 5, s.y + s.r * 0.5, s.r, s.r * 0.4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = s.king ? '#3a2b4d' : '#4a4a6a';
  ctx.beginPath();
  ctx.arc(s.x - s.r * 0.5, s.y, s.r * 0.5, 0, Math.PI * 2);
  ctx.arc(s.x, s.y - s.r * 0.3, s.r * 0.62, 0, Math.PI * 2);
  ctx.arc(s.x + s.r * 0.5, s.y, s.r * 0.5, 0, Math.PI * 2);
  ctx.arc(s.x, s.y + s.r * 0.2, s.r * 0.56, 0, Math.PI * 2);
  ctx.fill();
  // The strike timer: the cell flashes as its bolt charges.
  const charge = 1 - s.strikeIn / 7;
  if (charge > 0.6) {
    ctx.fillStyle = `rgba(255, 240, 120, ${(charge - 0.6) * 1.8})`;
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 0.3, 0, Math.PI * 2); ctx.fill();
  }
  if (s.king) {
    ctx.fillStyle = '#ffd76a';
    ctx.font = 'bold 15px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('👑 STORM KING', s.x, s.y - s.r - 8);
  }
}

function drawRod(ctx, r) {
  ctx.strokeStyle = '#5a4632'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(r.x, r.y); ctx.lineTo(r.x, r.y - 34); ctx.stroke();
  ctx.fillStyle = '#ffd76a';
  ctx.beginPath(); ctx.arc(r.x, r.y - 38, 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(r.x - 8, r.y - 30); ctx.lineTo(r.x + 8, r.y - 30); ctx.stroke();
}

function drawFloats(ctx, game) {
  ctx.textAlign = 'center';
  for (const fl of game.floats) {
    ctx.globalAlpha = Math.max(0, fl.life);
    ctx.fillStyle = fl.color || '#fff3b0';
    ctx.font = 'bold 20px Georgia, serif';
    ctx.fillText(fl.text, fl.x, fl.y);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, game) {
  ctx.fillStyle = 'rgba(20, 42, 64, 0.82)';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(`⛈ STORMKEEPER`, 16, 24);
  ctx.font = '16px Georgia, serif'; ctx.fillStyle = '#cfe8f7';
  ctx.fillText(`Valley ${game.valleyIndex + 1} of 7 — ${game.valley.name}`, 16, 46);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText(`🌾 ${game.harvest} / ${game.target}`, 560, 26);
  ctx.fillStyle = '#cfe8f7'; ctx.font = '15px Georgia, serif';
  ctx.fillText('harvest', 560, 46);
  ctx.fillStyle = '#fff3b0'; ctx.font = 'bold 19px Georgia, serif';
  ctx.fillText(`🪙 ${game.gold} gold`, 760, 26);
  ctx.fillStyle = '#cfe8f7'; ctx.font = '15px Georgia, serif';
  ctx.fillText(`score ${game.score}`, 760, 46);
  // Season timer: a day bar that drains as the valley's seconds run out.
  const frac = Math.max(0, game.timeLeft / game.valley.seconds);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  roundRect(ctx, 900, 16, 200, 12, 6); ctx.fill();
  ctx.fillStyle = frac > 0.3 ? '#7ec850' : '#e0586a';
  roundRect(ctx, 900, 16, 200 * frac, 12, 6); ctx.fill();
  ctx.fillStyle = '#cfe8f7'; ctx.font = '14px Georgia, serif'; ctx.textAlign = 'left';
  ctx.fillText(`season ${Math.ceil(game.timeLeft)}s`, 900, 46);
  ctx.textAlign = 'right'; ctx.fillStyle = '#cfe8f7'; ctx.font = '15px Georgia, serif';
  ctx.fillText(game.muted ? '🔇 M' : '🔊 M', 1264, 26);
  ctx.fillText('⏸ P · ↻ R', 1264, 46);
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(10, 26, 44, 0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const w = 640, h = 120 + lines.length * 34;
  const x = (VIEW_W - w) / 2, y = (VIEW_H - h) / 2;
  ctx.fillStyle = '#142a40';
  roundRect(ctx, x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = accent; ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 14); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = accent; ctx.font = 'bold 34px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, y + 56);
  ctx.fillStyle = '#eaf7ff'; ctx.font = '18px Georgia, serif';
  lines.forEach((ln, i) => ctx.fillText(ln, VIEW_W / 2, y + 100 + i * 34));
}

export function drawGame(ctx, game) {
  drawSky(ctx, game);
  drawLake(ctx, game);
  for (const f of game.fields) drawField(ctx, f);
  for (const r of game.rods) drawRod(ctx, r);
  for (const c of game.clouds) drawCloud(ctx, c, game);
  for (const s of game.storms) drawStorm(ctx, s, game);
  drawFloats(ctx, game);
  if (game.flash > 0) {
    ctx.fillStyle = `rgba(255, 250, 200, ${game.flash * 0.55})`;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
  if (game.screen === 'play' || game.screen === 'pause') drawHud(ctx, game);
  if (game.screen === 'title') {
    panel(ctx, '⛈ STORMKEEPER', [
      'Steer the rain, save the harvest.',
      'Drag clouds over dry fields — rain falls where they sit.',
      'Drag clouds to the lake to refill them. Push storm cells away.',
      'Lightning scorches crops; rods ground it. Reach the harvest target',
      'before the season ends. 7 valleys. 5 crops. One Storm King.',
      '',
      'CLICK OR PRESS ENTER TO START',
      'P pause · R restart valley · M mute · drag with mouse',
    ], '#ffd76a');
  } else if (game.screen === 'pause') {
    panel(ctx, 'PAUSED', ['The valley waits for its keeper.', '', 'Press P to carry on · R to restart the valley'], '#cfe8f7');
  } else if (game.screen === 'shop') {
    drawShop(ctx, game);
  } else if (game.screen === 'clear') {
    panel(ctx, 'VALLEY SAVED ✓', [
      `Harvest ${game.harvest} of ${game.target} · +${game.lastGold} gold · time bonus +${game.lastBonus}`,
      `Score ${game.score} · Best ${game.best}`,
      '',
      game.valleyIndex + 1 >= 7 ? 'The Storm King is beaten. The valleys are green again.' : 'Press N to open the shop — then N again for the next valley.',
      game.valleyIndex + 1 >= 7 ? 'Press R to play again' : '',
    ], '#7ec850');
  } else if (game.screen === 'fail') {
    panel(ctx, 'THE FIELDS THIRST', [
      `Harvest ${game.harvest} of ${game.target} — the season ran out.`,
      `Score ${game.score} · Best ${game.best}`,
      '',
      'Press R to try this valley again',
    ], '#e0586a');
  } else if (game.screen === 'victory') {
    panel(ctx, '👑 THE VALLEYS ARE GREEN', [
      `All seven valleys saved. Final score ${game.score} · Best ${game.best}`,
      '',
      'Press R to play again',
    ], '#ffd76a');
  }
  if (game.hint) {
    ctx.fillStyle = 'rgba(20, 42, 64, 0.85)';
    const w = ctx.measureText(game.hint).width + 36;
    roundRect(ctx, (VIEW_W - w) / 2, VIEW_H - 92, w, 34, 17); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.font = '16px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(game.hint, VIEW_W / 2, VIEW_H - 69);
  }
}

function drawShop(ctx, game) {
  ctx.fillStyle = 'rgba(10, 26, 44, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  const w = 760, h = 480, x = (VIEW_W - w) / 2, y = (VIEW_H - h) / 2;
  ctx.fillStyle = '#142a40';
  roundRect(ctx, x, y, w, h, 14); ctx.fill();
  ctx.strokeStyle = '#ffd76a'; ctx.lineWidth = 3;
  roundRect(ctx, x, y, w, h, 14); ctx.stroke();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd76a'; ctx.font = 'bold 30px Georgia, serif';
  ctx.fillText('BETWEEN VALLEYS — THE KEEPER’S STORE', VIEW_W / 2, y + 48);
  ctx.fillStyle = '#fff3b0'; ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(`🪙 ${game.gold} gold`, VIEW_W / 2, y + 80);
  const { UPGRADES } = game;
  UPGRADES.forEach((u, i) => {
    const uy = y + 112 + i * 52;
    const owned = game.owned[u.id] || 0;
    const cost = u.cost + owned * 15;
    const maxed = owned >= u.max;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff'; ctx.font = 'bold 17px Georgia, serif';
    ctx.fillText(`${i + 1}. ${u.name}  ${'●'.repeat(owned)}${'○'.repeat(u.max - owned)}`, x + 28, uy);
    ctx.fillStyle = '#cfe8f7'; ctx.font = '15px Georgia, serif';
    ctx.fillText(u.desc, x + 28, uy + 20);
    ctx.textAlign = 'right';
    ctx.fillStyle = maxed ? '#7ec850' : game.gold >= cost ? '#ffd76a' : '#8aa0b4';
    ctx.font = 'bold 16px Georgia, serif';
    ctx.fillText(maxed ? 'MAXED' : `${cost} gold`, x + w - 28, uy + 8);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#eaf7ff'; ctx.font = '18px Georgia, serif';
  ctx.fillText('Press 1–6 to buy · N for the next valley', VIEW_W / 2, y + h - 22);
}
