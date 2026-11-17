// STORMKEEPER — entrypoint: hands the game in.
// Copies game/ and screenshots/ from this repository into /output and writes
// /output/dossier.json with the kit's buildDossier. The caps passed here are
// the scorer's own (reference/gate.json): 4 screenshots at most, each at most
// 256 KiB, game/ at most 993 files and 48 MiB, paths at most 1000 bytes.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.

import { cpSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR || '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
const license = readFileSync(join(here, 'LICENSE'), 'utf8');
if (!license.includes('MIT License')) throw new Error('LICENSE is not the MIT license');

const dossierText = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossierText);
console.log(`stormkeeper: wrote ${out}/dossier.json (${dossierText.length} bytes)`);
